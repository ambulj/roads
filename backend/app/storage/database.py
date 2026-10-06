"""
database.py — Portable database connection with dual-engine architecture and automatic fallback.

Dual Engine Architecture:
  1. Production: PostgreSQL 16 + PostGIS with asyncpg and PgBouncer-safe connection pooling
  2. Local / Testing: SQLite WAL mode with aiosqlite for zero-dependency high concurrency

Exports:
  - engine: Synchronous SQLAlchemy Engine (backward compatibility)
  - async_engine: Asynchronous SQLAlchemy Engine
  - SessionLocal: Synchronous Session maker
  - AsyncSessionLocal: Asynchronous AsyncSession maker
  - get_db: FastAPI dependency yielding synchronous Session
  - get_async_db: FastAPI dependency yielding AsyncSession
  - init_db: Schema initialization and verified seed loader
"""
import os
import shutil
from dotenv import load_dotenv
from sqlalchemy import create_engine, text, event
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.models.db_models import (
    Base, DBDistressCluster, DBTrafficIncident, DBFleetNode, DBRawIngest, DBContractor
)

# ── Load .env from backend root ──────────────────────────────────────────────
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_ENV_PATH = os.path.join(_BACKEND_DIR, ".env")
if os.path.exists(_ENV_PATH):
    load_dotenv(_ENV_PATH)

# ── SQLite path: always relative to backend directory ───────────────────────
_SQLITE_FILE = os.path.join(_BACKEND_DIR, "roadsaathi.db")
if not os.path.exists(_SQLITE_FILE):
    for legacy_name in ["sehersaathi.db", "SheherSaathi.db", "roadsaarthi.db", "RoadSaathi.db"]:
        legacy_path = os.path.join(_BACKEND_DIR, legacy_name)
        if os.path.exists(legacy_path):
            try:
                shutil.copy2(legacy_path, _SQLITE_FILE)
                break
            except Exception:
                pass

_SQLITE_URL = f"sqlite:///{_SQLITE_FILE}"
_SQLITE_ASYNC_URL = f"sqlite+aiosqlite:///{_SQLITE_FILE}"

# ── Protocol Normalization ───────────────────────────────────────────────────
def normalize_database_url(url: str | None = None) -> str:
    """Normalize database connection string into an async-compatible URL."""
    if not url or not url.strip() or url.strip().lower() in ("sqlite", "sqlite3"):
        return _SQLITE_ASYNC_URL

    cleaned = url.strip()
    if cleaned.startswith("sqlite+aiosqlite:///"):
        return cleaned
    if cleaned.startswith("sqlite:///"):
        return cleaned.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
    if cleaned.startswith("postgresql+asyncpg://"):
        return cleaned
    if cleaned.startswith("postgres://"):
        return cleaned.replace("postgres://", "postgresql+asyncpg://", 1)
    if cleaned.startswith("postgresql://"):
        return cleaned.replace("postgresql://", "postgresql+asyncpg://", 1)
    return cleaned


def to_sync_database_url(url: str) -> str:
    """Convert an async database URL into a synchronous driver URL."""
    if url.startswith("sqlite+aiosqlite:///"):
        return url.replace("sqlite+aiosqlite:///", "sqlite:///", 1)
    if url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql+asyncpg://", "postgresql://", 1)
    return url


def _mask_url_for_logging(url: str) -> str:
    """Return masked database connection string to avoid leaking credentials (T-01-01)."""
    try:
        return make_url(url).render_as_string(hide_password=True)
    except Exception:
        return "<masked_database_url>"


# ── Engine Factory ───────────────────────────────────────────────────────────
POSTGRES_CONNECT_ARGS = {
    "statement_cache_size": 0,
    "prepared_statement_cache_size": 0,
    "command_timeout": 15,
}


def _apply_sqlite_pragmas(eng_sync):
    """Register PRAGMAs for SQLite WAL mode, busy timeout, and foreign keys."""
    @event.listens_for(eng_sync, "connect")
    def set_sqlite_pragmas(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA journal_mode=WAL;")
            cursor.execute("PRAGMA synchronous=NORMAL;")
            cursor.execute("PRAGMA busy_timeout=15000;")
            cursor.execute("PRAGMA foreign_keys=ON;")
        except Exception:
            pass
        finally:
            cursor.close()


def create_sqlite_async_engine(url_or_path: str, echo: bool = False):
    """Create async SQLite engine with WAL pragmas."""
    url = normalize_database_url(url_or_path) if not url_or_path.startswith("sqlite+aiosqlite:///") else url_or_path
    eng = create_async_engine(
        url,
        connect_args={"check_same_thread": False, "timeout": 30},
        echo=echo,
    )
    _apply_sqlite_pragmas(eng.sync_engine)
    return eng


def create_sqlite_sync_engine(url_or_path: str, echo: bool = False):
    """Create sync SQLite engine with WAL pragmas."""
    url = to_sync_database_url(normalize_database_url(url_or_path)) if "aiosqlite" in url_or_path or not url_or_path.startswith("sqlite:///") else url_or_path
    eng = create_engine(
        url,
        connect_args={"check_same_thread": False, "timeout": 30},
        echo=echo,
    )
    _apply_sqlite_pragmas(eng)
    return eng


def create_postgres_async_engine(url: str, echo: bool = False):
    """Create async PostgreSQL engine configured for PgBouncer transaction-mode pooling."""
    return create_async_engine(
        url,
        connect_args=POSTGRES_CONNECT_ARGS,
        pool_size=20,
        max_overflow=10,
        pool_recycle=300,
        pool_pre_ping=True,
        pool_timeout=10,
        echo=echo,
    )


def create_postgres_sync_engine(url: str, echo: bool = False):
    """Create sync PostgreSQL engine with pre-ping and recycling."""
    sync_url = to_sync_database_url(url)
    return create_engine(
        sync_url,
        pool_size=20,
        max_overflow=10,
        pool_recycle=300,
        pool_pre_ping=True,
        pool_timeout=10,
        echo=echo,
    )


def create_async_db_engine(url: str, echo: bool = False):
    """Unified factory for async engines based on normalized URL."""
    norm = normalize_database_url(url)
    if norm.startswith("sqlite"):
        return create_sqlite_async_engine(norm, echo=echo)
    return create_postgres_async_engine(norm, echo=echo)


def create_sync_db_engine(url: str, echo: bool = False):
    """Unified factory for sync engines based on normalized URL."""
    norm = normalize_database_url(url)
    if norm.startswith("sqlite"):
        return create_sqlite_sync_engine(norm, echo=echo)
    return create_postgres_sync_engine(norm, echo=echo)


# ── Active Database Initialization with Safe Fallback ────────────────────────
_raw_db_url = os.getenv("DATABASE_URL", "sqlite").strip()
DATABASE_URL = normalize_database_url(_raw_db_url)
SYNC_DATABASE_URL = to_sync_database_url(DATABASE_URL)

if DATABASE_URL.startswith("sqlite"):
    print(f"[DATABASE] Using SQLite: {_SQLITE_FILE}")
    engine = create_sqlite_sync_engine(SYNC_DATABASE_URL)
    async_engine = create_sqlite_async_engine(DATABASE_URL)
else:
    masked_url = _mask_url_for_logging(DATABASE_URL)
    print(f"[DATABASE] Attempting connection to: {masked_url}")
    try:
        engine = create_postgres_sync_engine(SYNC_DATABASE_URL)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        async_engine = create_postgres_async_engine(DATABASE_URL)
        print(f"[DATABASE] Connection established.")
    except Exception as err:
        print(f"[DATABASE] Connection failed ({err}). Falling back to SQLite: {_SQLITE_FILE}")
        DATABASE_URL = _SQLITE_ASYNC_URL
        SYNC_DATABASE_URL = _SQLITE_URL
        engine = create_sqlite_sync_engine(SYNC_DATABASE_URL)
        async_engine = create_sqlite_async_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    class_=AsyncSession,
)


def get_db():
    """FastAPI dependency: yields a synchronous database session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_async_db():
    """FastAPI async dependency: yields an async database session and closes it after use."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


def init_db():
    """Initialize schema and seed initial verified Chennai data if tables are empty."""
    # SQLite: add missing columns from older schema versions (migration-free upgrade)
    if DATABASE_URL.startswith("sqlite") and os.path.exists(_SQLITE_FILE):
        import sqlite3
        conn = sqlite3.connect(_SQLITE_FILE)
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(distress_clusters)")
        existing_cols = {row[1] for row in cursor.fetchall()}
        for col in ("before_image_url", "after_image_url", "field_notes", "detecting_camera_position", "geom", "contractor_id", "warranty_end_date"):
            if col not in existing_cols and existing_cols:
                cursor.execute(f"ALTER TABLE distress_clusters ADD COLUMN {col} TEXT")
        if "detecting_channel" not in existing_cols and existing_cols:
            cursor.execute("ALTER TABLE distress_clusters ADD COLUMN detecting_channel INTEGER DEFAULT 1")
        if "escrow_deposit_inr" not in existing_cols and existing_cols:
            cursor.execute("ALTER TABLE distress_clusters ADD COLUMN escrow_deposit_inr REAL DEFAULT 5000000.0")
        if "concurrence_passes_count" not in existing_cols and existing_cols:
            cursor.execute("ALTER TABLE distress_clusters ADD COLUMN concurrence_passes_count INTEGER DEFAULT 0")
        if "verification_status" not in existing_cols and existing_cols:
            cursor.execute("ALTER TABLE distress_clusters ADD COLUMN verification_status TEXT DEFAULT 'UNVERIFIED'")

        cursor.execute("PRAGMA table_info(contractor_penalties)")
        existing_pen_cols = {row[1] for row in cursor.fetchall()}
        for col in ("contractor_id", "pfms_txn_ref", "evidence_sha256", "patrol_bus_id"):
            if col not in existing_pen_cols and existing_pen_cols:
                cursor.execute(f"ALTER TABLE contractor_penalties ADD COLUMN {col} TEXT")
        if "measured_gz" not in existing_pen_cols and existing_pen_cols:
            cursor.execute("ALTER TABLE contractor_penalties ADD COLUMN measured_gz REAL DEFAULT 1.0")
        if "threshold_gz" not in existing_pen_cols and existing_pen_cols:
            cursor.execute("ALTER TABLE contractor_penalties ADD COLUMN threshold_gz REAL DEFAULT 1.35")
        
        cursor.execute("PRAGMA table_info(traffic_incidents)")
        existing_inc_cols = {row[1] for row in cursor.fetchall()}
        for col, col_type in (
            ("fine_amount_inr", "REAL"),
            ("mva_section", "TEXT"),
            ("echallan_issued", "BOOLEAN"),
            ("echallan_id", "TEXT"),
            ("water_depth_cm", "REAL"),
            ("pump_deployed", "BOOLEAN"),
            ("pcr_unit_assigned", "TEXT"),
            ("description", "TEXT"),
            ("camera_position", "TEXT"),
            ("channel", "INTEGER"),
            ("statutory_provenance", "TEXT"),
            ("review_status", "TEXT"),
            ("reviewed_by", "TEXT"),
            ("reviewed_at", "TEXT"),
            ("rejection_reason", "TEXT"),
            ("dispatch_status", "TEXT"),
            ("geom", "TEXT")
        ):
            if col not in existing_inc_cols and existing_inc_cols:
                cursor.execute(f"ALTER TABLE traffic_incidents ADD COLUMN {col} {col_type}")

        cursor.execute("PRAGMA table_info(raw_ingests)")
        existing_raw_cols = {row[1] for row in cursor.fetchall()}
        if "camera_position" not in existing_raw_cols and existing_raw_cols:
            cursor.execute("ALTER TABLE raw_ingests ADD COLUMN camera_position TEXT DEFAULT 'FRONT_WINDSHIELD'")
        if "channel" not in existing_raw_cols and existing_raw_cols:
            cursor.execute("ALTER TABLE raw_ingests ADD COLUMN channel INTEGER DEFAULT 1")
        if "geom" not in existing_raw_cols and existing_raw_cols:
            cursor.execute("ALTER TABLE raw_ingests ADD COLUMN geom TEXT")

        cursor.execute("PRAGMA table_info(fleet_nodes)")
        existing_fn_cols = {row[1] for row in cursor.fetchall()}
        if "camera_position" not in existing_fn_cols and existing_fn_cols:
            cursor.execute("ALTER TABLE fleet_nodes ADD COLUMN camera_position TEXT DEFAULT 'FRONT_WINDSHIELD'")
        if "cameras_config" not in existing_fn_cols and existing_fn_cols:
            cursor.execute("ALTER TABLE fleet_nodes ADD COLUMN cameras_config TEXT")

        conn.commit()
        conn.close()

    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        from app.models.db_models import (
            DBTrafficDensity, DBContractorPenalty, DBOpenManholeAlert, 
            DBDarkSpot, DBContractorDebarment, DBAuditLog
        )
        from app.core.statutory_engine import (
            compute_statutory_citation, get_nearest_pcr_unit, generate_echallan_id
        )

        # ── Seed clusters ────────────────────────────────────────────────────
        if db.query(DBDistressCluster).count() == 0:
            from app.storage.mock_database import INITIAL_SEED_CLUSTERS
            for item in INITIAL_SEED_CLUSTERS:
                cluster_dict = dict(item)
                cluster_dict.setdefault("detecting_camera_position", "FRONT_WINDSHIELD")
                cluster_dict.setdefault("detecting_channel", 1)
                db.add(DBDistressCluster(**cluster_dict))

        # ── Seed fleet nodes ─────────────────────────────────────────────────
        if db.query(DBFleetNode).count() == 0:
            from app.storage.mock_database import INITIAL_SEED_FLEET
            for bus in INITIAL_SEED_FLEET:
                bus_dict = dict(bus)
                bus_dict.setdefault("camera_position", "FRONT_WINDSHIELD")
                bus_dict.setdefault("cameras_config", '{"ch1":"FRONT_WINDSHIELD","ch2":"REAR_OVERTAKE","ch3":"LEFT_CURBSIDE","ch4":"DRIVER_CABIN"}')
                db.add(DBFleetNode(**bus_dict))

        # ── Seed traffic incidents ────────────────────────────────────────────
        if db.query(DBTrafficIncident).filter(DBTrafficIncident.id == "inc-003").first() is None:
            initial_incidents = [
                {
                    "id": "inc-001",
                    "reporting_bus_id": "BUS-TN01-1042",
                    "incident_type": "HIT_AND_RUN",
                    "plate_number": "TN-09-CB-4412",
                    "plate_confidence": 0.96,
                    "vehicle_color": "White",
                    "vehicle_class": "SUV",
                    "target_speed_kmh": 78.5,
                    "is_intercepted": False,
                    "intercepted_by_bus_id": None,
                    "snapshot_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Truck_collision_with_meridian_on_NH32_image..jpg/1280px-Truck_collision_with_meridian_on_NH32_image..jpg",
                    "road_name": "GST Road (NH-32) near Airport Flyover",
                    "lat": 12.9850, "lng": 80.1650,
                    "occurred_at": "5 Sept, 05:12 am",
                    "status": "ACTIVE_ALERT",
                    "review_status": "AUTO_ADMISSIBLE",
                    "dispatch_status": "PCR_DISPATCHED",
                    "channel": 2,
                    "description": "High-speed collision followed by non-stop evasion towards Airport Flyover."
                },
                {
                    "id": "inc-002",
                    "reporting_bus_id": "PATROL-VAN-12",
                    "incident_type": "RASH_DRIVING",
                    "plate_number": "TN-02-AZ-8819",
                    "plate_confidence": 0.94,
                    "vehicle_color": "Black",
                    "vehicle_class": "Sedan",
                    "target_speed_kmh": 92.0,
                    "is_intercepted": False,
                    "intercepted_by_bus_id": None,
                    "snapshot_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/KOLKATA_2016.jpg/1280px-KOLKATA_2016.jpg",
                    "road_name": "Guindy Kathipara Grade Junction",
                    "lat": 13.0078, "lng": 80.2045,
                    "occurred_at": "5 Sept, 05:30 am",
                    "status": "ACTIVE_ALERT",
                    "review_status": "AUTO_ADMISSIBLE",
                    "dispatch_status": "ECHALLAN_ISSUED",
                    "channel": 2,
                    "description": "Aggressive tailgating and high-speed zigzag overtaking clocked at 92 km/h."
                },
                {
                    "id": "inc-003",
                    "reporting_bus_id": "BUS-TN02-3891",
                    "incident_type": "VULNERABLE_PEDESTRIAN",
                    "plate_number": "TN-07-BP-9901",
                    "plate_confidence": 0.92,
                    "vehicle_color": "Silver",
                    "vehicle_class": "Two-Wheeler",
                    "target_speed_kmh": 32.0,
                    "is_intercepted": False,
                    "intercepted_by_bus_id": None,
                    "snapshot_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Busy_Street_in_India.jpg/1280px-Busy_Street_in_India.jpg",
                    "road_name": "Usman Road D.A.V. School Link",
                    "lat": 13.0425, "lng": 80.2345,
                    "occurred_at": "5 Sept, 07:45 am",
                    "status": "ACTIVE_ALERT",
                    "review_status": "PENDING_REVIEW",
                    "dispatch_status": "UNASSIGNED",
                    "channel": 3,
                    "description": "School children crossing alert: Vehicle failed to yield right-of-way in school zone."
                }
            ]
            for inc in initial_incidents:
                if db.query(DBTrafficIncident).filter(DBTrafficIncident.id == inc["id"]).first():
                    continue
                citation = compute_statutory_citation(
                    inc["incident_type"],
                    target_speed_kmh=inc.get("target_speed_kmh", 0.0),
                    water_depth_cm=inc.get("water_depth_cm"),
                    channel=inc.get("channel", 2)
                )
                inc["mva_section"] = citation["mva_section"]
                inc["fine_amount_inr"] = citation["fine_amount_inr"]
                inc["camera_position"] = citation["camera_position"]
                inc["channel"] = citation["channel"]
                inc["statutory_provenance"] = citation["provenance"]
                if not inc.get("pcr_unit_assigned"):
                    inc["pcr_unit_assigned"] = get_nearest_pcr_unit(inc["lat"], inc["lng"])
                if inc.get("dispatch_status") == "ECHALLAN_ISSUED":
                    inc["echallan_issued"] = True
                    inc["echallan_id"] = generate_echallan_id("MAS")
                db.add(DBTrafficIncident(**inc))

        # ── Seed audit logs ───────────────────────────────────────────────────
        if db.query(DBAuditLog).count() == 0:
            db.add(DBAuditLog(
                id="log-init-1",
                bus_id="BUS-TN01-1042",
                corridor="GST Road (NH-32)",
                message="Ingested GPS telemetry pass from MTC Bus #1042 on GST Road (NH-32) • 5Hz NavIC lock confirmed.",
                latency_ms=72,
                type="FLEET TELEMETRY",
                timestamp="Just now",
                created_at="2026-09-11 09:00:00"
            ))
            db.add(DBAuditLog(
                id="log-init-2",
                bus_id="BUS-TN02-3891",
                corridor="Kathipara Grade Junction",
                message="DBSCAN 15m cluster verified: Pothole confirmed with 5 fleet passes (CH 1 Windshield).",
                latency_ms=85,
                type="SPATIAL DEDUP",
                timestamp="1m ago",
                created_at="2026-09-11 09:01:00"
            ))

        # ── Seed traffic density ──────────────────────────────────────────────
        if db.query(DBTrafficDensity).count() == 0:
            from app.api.endpoints.traffic import INITIAL_TRAFFIC_SEEDS
            for t in INITIAL_TRAFFIC_SEEDS:
                db.add(DBTrafficDensity(**t))

        # ── Seed contractors (IRC:SP:20 Cl 14 & Escrow) ──────────────────────
        if db.query(DBContractor).count() == 0:
            initial_contractors = [
                {
                    "id": "CTR-01",
                    "name": "L&T Highways Infra Ltd",
                    "cin": "U45203TN2001PLC047123",
                    "director": "Er. R. Sundararaman",
                    "assigned_corridor": "GST Road (NH-32) Airport Corridor",
                    "zone": "Zone 12 (Alandur / Guindy)",
                    "security_deposit_inr": 5000000.0,
                    "penalties_deducted_inr": 45000.0,
                    "active_work_orders": 3,
                    "resolved_work_orders": 14,
                    "breached_work_orders": 0,
                    "on_time_sla_pct": 96.5,
                    "quality_score_pct": 94.2,
                    "compaction_density_gcm3": 2.38,
                    "warranty_expiry": "2028-10-15",
                    "debarment_risk": "Low",
                    "created_at": "2026-01-15T00:00:00Z",
                    "updated_at": "2026-10-06T00:00:00Z"
                },
                {
                    "id": "CTR-02",
                    "name": "GMR Urban Highways Ltd",
                    "cin": "U45201DL1996PLC078234",
                    "director": "Er. K. Venkatraman",
                    "assigned_corridor": "Anna Salai Arterial Link",
                    "zone": "Zone 9 (Teynampet)",
                    "security_deposit_inr": 5000000.0,
                    "penalties_deducted_inr": 30000.0,
                    "active_work_orders": 2,
                    "resolved_work_orders": 18,
                    "breached_work_orders": 1,
                    "on_time_sla_pct": 91.0,
                    "quality_score_pct": 88.5,
                    "compaction_density_gcm3": 2.34,
                    "warranty_expiry": "2027-12-31",
                    "debarment_risk": "Low",
                    "created_at": "2026-01-15T00:00:00Z",
                    "updated_at": "2026-10-06T00:00:00Z"
                },
                {
                    "id": "CTR-03",
                    "name": "TNRDC",
                    "cin": "U45203TN1998SGC040120",
                    "director": "Er. M. Rajasekaran",
                    "assigned_corridor": "Rajiv Gandhi IT Expressway (OMR)",
                    "zone": "Zone 13 (Adyar)",
                    "security_deposit_inr": 5000000.0,
                    "penalties_deducted_inr": 0.0,
                    "active_work_orders": 1,
                    "resolved_work_orders": 22,
                    "breached_work_orders": 0,
                    "on_time_sla_pct": 99.2,
                    "quality_score_pct": 98.0,
                    "compaction_density_gcm3": 2.42,
                    "warranty_expiry": "2029-03-31",
                    "debarment_risk": "Low",
                    "created_at": "2026-01-15T00:00:00Z",
                    "updated_at": "2026-10-06T00:00:00Z"
                }
            ]
            for c in initial_contractors:
                db.add(DBContractor(**c))

        # ── Seed contractor penalties (MoHUA IRC:SP:20 Cl 14.2) ───────────────
        if db.query(DBContractorPenalty).count() == 0:
            penalties = [
                {
                    "id": "pen-01",
                    "contractor_name": "L&T Highways Infra Ltd",
                    "cluster_code": "WO-0001",
                    "corridor_name": "GST Road, Tambaram (NH-32)",
                    "re_pothole_count": 4,
                    "penalty_amount_inr": 45000.0,
                    "statutory_clause": "MoHUA IRC:SP:20 Clause 14.2 (Defect Liability Recurrence)",
                    "status": "DEBIT_ISSUED",
                    "provenance": "DERIVED_FROM_RECURRENT_DISTRESS",
                    "issued_at": "12 Feb 2026"
                },
                {
                    "id": "pen-02",
                    "contractor_name": "GMR Urban Infra Corp",
                    "cluster_code": "WO-0004",
                    "corridor_name": "Anna Salai Arterial Link",
                    "re_pothole_count": 3,
                    "penalty_amount_inr": 30000.0,
                    "statutory_clause": "MoHUA IRC:SP:20 Clause 14.2",
                    "status": "DEBIT_ISSUED",
                    "provenance": "DERIVED_FROM_RECURRENT_DISTRESS",
                    "issued_at": "18 Feb 2026"
                }
            ]
            for p in penalties:
                db.add(DBContractorPenalty(**p))

        # ── Seed open manholes (IS:1726) ──────────────────────────────────────
        if db.query(DBOpenManholeAlert).count() == 0:
            manholes = [
                {
                    "id": "omh-01",
                    "docket_number": "JAL-2026-8819",
                    "location_name": "Guindy Kathipara Grade Interchange East Ramp",
                    "lat": 13.0067,
                    "lng": 80.2030,
                    "void_diameter_cm": 65.0,
                    "depth_meters": 2.1,
                    "is_barricaded": True,
                    "agency_responsible": "Chennai Metro Water (CMWSSB) / GCC SWD Wing",
                    "statutory_standard": "IS:1726 Cast Iron Sump Safety Code",
                    "sla_minutes_remaining": 45,
                    "status": "EMERGENCY_DISPATCHED",
                    "detected_at": "Today, 06:15 AM"
                }
            ]
            for m in manholes:
                db.add(DBOpenManholeAlert(**m))

        # ── Seed dark spots (< 5 Lux) ─────────────────────────────────────────
        if db.query(DBDarkSpot).count() == 0:
            dark_spots = [
                {
                    "id": "dk-01",
                    "corridor_name": "Poonamallee High Road (Near Maduravoyal Service Lane)",
                    "lat": 13.0645,
                    "lng": 80.1740,
                    "illuminance_lux": 1.8,
                    "statutory_threshold_lux": 15.0,
                    "pedestrian_risk": "CRITICAL",
                    "dark_length_meters": 520.0,
                    "status": "AUDIT_FLAGGED",
                    "detected_at": "Yesterday, 11:45 PM"
                }
            ]
            for d in dark_spots:
                db.add(DBDarkSpot(**d))

        # ── Seed contractor debarments (GeM / GFR 151) ────────────────────────
        if db.query(DBContractorDebarment).count() == 0:
            debarments = [
                {
                    "id": "deb-01",
                    "contractor_name": "Apex Pavements & Civils Pvt Ltd",
                    "demerit_score": 78.5,
                    "debarment_status": "STATUTORY_DEBARRED_12M",
                    "reason": "Cumulative SLA default (>120h) on 4 arterial work orders (GFR Rule 151)",
                    "gem_portal_reference": "GeM/2026/DEB-9912",
                    "effective_date": "01 Jan 2026"
                }
            ]
            for deb in debarments:
                db.add(DBContractorDebarment(**deb))

        # ── Seed submerged potholes ───────────────────────────────────────────
        from app.models.db_models import (
            DBSubmergedPothole, DBObscuredSign, DBAsphaltQualityAudit, DBRoadMemoryCorridor
        )
        if db.query(DBSubmergedPothole).count() == 0:
            db.add(DBSubmergedPothole(
                id="sub-01",
                road_name="Velachery Main Road (Near Railway Station Underpass)",
                lat=12.9790, lng=80.2190,
                water_depth_cm=22.0, cavity_depth_cm=16.5,
                acoustic_signature="AXLE_SHOCK_HYDRO_CAVITY_ALERT",
                status="FLOOD_HAZARD",
                provenance="HYDROLOGIC_FLOOD_OVERLAY_AUDIT",
                detected_at="Today, 07:10 AM"
            ))

        # ── Seed obscured signs ───────────────────────────────────────────────
        if db.query(DBObscuredSign).count() == 0:
            db.add(DBObscuredSign(
                id="obs-01",
                road_name="Anna Salai near Gemini Flyover Approach",
                lat=13.0515, lng=80.2500,
                sign_type="SPEED_LIMIT_50",
                obscuration_pct=82.0,
                obscuration_cause="OVERGROWN_TREE_CANOPY",
                statutory_spec="IRC:67:2022 Sign Visibility Code",
                status="CLEARANCE_ORDERED",
                provenance="IRC67_CLEARANCE_FIELD_AUDIT",
                detected_at="Yesterday, 04:30 PM"
            ))

        # ── Seed asphalt quality audits ────────────────────────────────────────
        if db.query(DBAsphaltQualityAudit).count() == 0:
            db.add(DBAsphaltQualityAudit(
                id="asph-01",
                corridor_name="GST Road Airport Link Corridor",
                contractor_name="L&T Highways Infra Ltd",
                mix_type="VG-40 Hot Mix Bituminous Concrete",
                laydown_temp_c=148.5,
                compaction_pct=98.2,
                bitumen_content_pct=5.4,
                compliance_status="PASSED_MoRTH_SPEC",
                statutory_spec="MoRTH Section 500 / IRC:SP:20",
                provenance="IRC_SP20_LAB_CALIBRATED_BENCHMARK",
                audited_at="02 Sept 2026"
            ))

        # ── Seed road memory corridors ─────────────────────────────────────────
        if db.query(DBRoadMemoryCorridor).count() == 0:
            db.add(DBRoadMemoryCorridor(
                id="mem-01",
                corridor_code="CORR-GST-01",
                corridor_name="GST Road (NH-32) Airport Segment",
                first_detected_at="15 Aug 2026",
                total_passes=142,
                buses_agreed_count=18,
                consensus_confidence=0.99,
                lifecycle_stage="ACTIVE_PATROL",
                provenance="CORRIDOR_MAINTENANCE_LIFECYCLE_LOG",
                updated_at="Just now"
            ))

        # ── Seed government users ────────────────────────────────────────────
        from app.models.db_models import DBUser
        from app.core.auth import SEEDED_USERS
        if db.query(DBUser).count() == 0:
            import json
            for k, u in SEEDED_USERS.items():
                db_user = DBUser(
                    id=f"usr-{k}-01",
                    username=u["username"],
                    email=u["email"],
                    password_hash=u["password_hash"],
                    salt=u["salt"],
                    role=u["role"],
                    name=u["name"],
                    designation=u["designation"],
                    department=u["department"],
                    agency=u["agency"],
                    badge_number=u["badge_number"],
                    permissions=json.dumps(u["permissions"]),
                    is_active=True,
                    created_at="2026-01-01T00:00:00Z"
                )
                db.add(db_user)

        # ── Backfill statutory citations for any pre-existing records ────────
        unannotated_incidents = db.query(DBTrafficIncident).filter(
            (DBTrafficIncident.mva_section == None) | (DBTrafficIncident.fine_amount_inr == None)
        ).all()
        for inc in unannotated_incidents:
            cit = compute_statutory_citation(
                incident_type=inc.incident_type,
                target_speed_kmh=inc.target_speed_kmh or 0.0,
                plate_confidence=inc.plate_confidence or 0.95,
                water_depth_cm=inc.water_depth_cm,
                channel=inc.channel or 2
            )
            inc.mva_section = cit.get("mva_section")
            inc.fine_amount_inr = cit.get("fine_amount_inr")
            inc.camera_position = cit.get("camera_position", "REAR_OVERTAKE")
            inc.channel = cit.get("channel", inc.channel or 2)
            inc.statutory_provenance = cit.get("provenance", "MVA_1988_RULE_ENGINE_V2019")
            if not inc.pcr_unit_assigned:
                inc.pcr_unit_assigned = get_nearest_pcr_unit(inc.lat, inc.lng)
            if not inc.echallan_id and inc.plate_number:
                inc.echallan_id = generate_echallan_id("CHN")
                inc.echallan_issued = True

        # Backfill camera positions for clusters
        unannotated_clusters = db.query(DBDistressCluster).filter(
            DBDistressCluster.detecting_camera_position == None
        ).all()
        for cl in unannotated_clusters:
            cl.detecting_camera_position = "FRONT_WINDSHIELD"
            cl.detecting_channel = 1

        db.commit()
        print("[DATABASE] Database ready.")
    finally:
        db.close()
