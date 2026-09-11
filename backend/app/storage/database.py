"""
database.py — Portable database connection with automatic SQLite fallback.

Priority:
  1. DATABASE_URL env var (if set to a real postgresql:// URL → use PostgreSQL)
  2. DATABASE_URL == "sqlite" or blank → use bundled SQLite file
  3. Any connection error on PostgreSQL → auto-fallback to SQLite

The SQLite file path is always resolved relative to this file, so the project
can be moved to any directory without breaking anything.
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.models.db_models import Base, DBDistressCluster, DBTrafficIncident, DBFleetNode, DBRawIngest

# ── Load .env from the backend root (two levels up from this file) ──────────
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_ENV_PATH = os.path.join(_BACKEND_DIR, ".env")
if os.path.exists(_ENV_PATH):
    load_dotenv(_ENV_PATH)

# ── SQLite path: always relative to backend directory ───────────────────────
_SQLITE_FILE = os.path.join(_BACKEND_DIR, "roadsaarthi.db")
_SQLITE_URL  = f"sqlite:///{_SQLITE_FILE}"

# ── Determine which database to use ─────────────────────────────────────────
_raw_db_url = os.getenv("DATABASE_URL", "sqlite").strip()

# Treat empty string, "sqlite", or anything that isn't a real URL as SQLite
_use_sqlite = (not _raw_db_url or _raw_db_url.lower() in ("sqlite", "sqlite3", ""))

if _use_sqlite:
    DATABASE_URL = _SQLITE_URL
    print(f"[DATABASE] Using SQLite: {_SQLITE_FILE}")
else:
    DATABASE_URL = _raw_db_url
    print(f"[DATABASE] Attempting connection to: {DATABASE_URL}")

# ── Create engine with fallback ──────────────────────────────────────────────
def _make_engine(url: str):
    if url.startswith("sqlite"):
        return create_engine(url, connect_args={"check_same_thread": False})
    return create_engine(url, pool_pre_ping=True, pool_recycle=300)

try:
    engine = _make_engine(DATABASE_URL)
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print(f"[DATABASE] Connection established.")
except Exception as err:
    print(f"[DATABASE] Connection failed ({err}). Falling back to SQLite: {_SQLITE_FILE}")
    DATABASE_URL = _SQLITE_URL
    engine = _make_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """FastAPI dependency: yields a database session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize schema and seed initial verified Chennai data if tables are empty."""
    # SQLite: add missing columns from older schema versions (migration-free upgrade)
    if DATABASE_URL.startswith("sqlite") and os.path.exists(_SQLITE_FILE):
        import sqlite3
        conn = sqlite3.connect(_SQLITE_FILE)
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(distress_clusters)")
        existing_cols = {row[1] for row in cursor.fetchall()}
        for col in ("before_image_url", "after_image_url", "field_notes", "detecting_camera_position"):
            if col not in existing_cols and existing_cols:
                cursor.execute(f"ALTER TABLE distress_clusters ADD COLUMN {col} TEXT")
        if "detecting_channel" not in existing_cols and existing_cols:
            cursor.execute("ALTER TABLE distress_clusters ADD COLUMN detecting_channel INTEGER DEFAULT 1")
        
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
            ("dispatch_status", "TEXT")
        ):
            if col not in existing_inc_cols and existing_inc_cols:
                cursor.execute(f"ALTER TABLE traffic_incidents ADD COLUMN {col} {col_type}")

        cursor.execute("PRAGMA table_info(raw_ingests)")
        existing_raw_cols = {row[1] for row in cursor.fetchall()}
        if "camera_position" not in existing_raw_cols and existing_raw_cols:
            cursor.execute("ALTER TABLE raw_ingests ADD COLUMN camera_position TEXT DEFAULT 'FRONT_WINDSHIELD'")
        if "channel" not in existing_raw_cols and existing_raw_cols:
            cursor.execute("ALTER TABLE raw_ingests ADD COLUMN channel INTEGER DEFAULT 1")

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
        if db.query(DBTrafficIncident).count() == 0:
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
                    "snapshot_url": None,
                    "road_name": "GST Road (NH-32) near Airport Flyover",
                    "lat": 12.9850, "lng": 80.1650,
                    "occurred_at": "5 Sept, 05:12 am",
                    "status": "ACTIVE_ALERT",
                    "review_status": "AUTO_ADMISSIBLE",
                    "dispatch_status": "PCR_DISPATCHED",
                    "channel": 2
                },
                {
                    "id": "inc-002",
                    "reporting_bus_id": "PATROL-VAN-12",
                    "incident_type": "RASH_DRIVING",
                    "plate_number": "TN-02-AZ-8819",
                    "plate_confidence": 0.92,
                    "vehicle_color": "Black",
                    "vehicle_class": "Sedan",
                    "target_speed_kmh": 86.0,
                    "is_intercepted": True,
                    "intercepted_by_bus_id": "BUS-TN02-3891",
                    "snapshot_url": None,
                    "road_name": "Anna Salai (Mount Road) CBD Corridor",
                    "lat": 13.0550, "lng": 80.2450,
                    "occurred_at": "5 Sept, 04:30 am",
                    "status": "DISPATCHED",
                    "review_status": "AUTO_ADMISSIBLE",
                    "dispatch_status": "ECHALLAN_ISSUED",
                    "channel": 2
                },
                {
                    "id": "inc-003",
                    "reporting_bus_id": "BUS-TN02-3891",
                    "incident_type": "VULNERABLE_PEDESTRIAN",
                    "plate_number": "TN-07-BP-9901",
                    "plate_confidence": 0.86, # Low confidence -> triggers review queue
                    "vehicle_color": "Silver",
                    "vehicle_class": "Two-Wheeler",
                    "target_speed_kmh": 32.0,
                    "is_intercepted": False,
                    "intercepted_by_bus_id": None,
                    "snapshot_url": None,
                    "road_name": "Usman Road D.A.V. School Junction",
                    "lat": 13.0425, "lng": 80.2345,
                    "occurred_at": "5 Sept, 07:45 am",
                    "status": "ACTIVE_ALERT",
                    "review_status": "PENDING_REVIEW",
                    "dispatch_status": "UNASSIGNED",
                    "channel": 3
                },
                {
                    "id": "inc-004",
                    "reporting_bus_id": "BUS-TN22-5501",
                    "incident_type": "WATERLOGGING",
                    "plate_number": None,
                    "plate_confidence": 0.89,
                    "vehicle_color": None,
                    "vehicle_class": "Flood Level 18cm",
                    "target_speed_kmh": 0.0,
                    "is_intercepted": False,
                    "intercepted_by_bus_id": None,
                    "snapshot_url": None,
                    "road_name": "Velachery Underpass Waterlogging",
                    "lat": 12.9790, "lng": 80.2190,
                    "occurred_at": "4 Sept, 11:20 pm",
                    "status": "ACTIVE_ALERT",
                    "review_status": "AUTO_ADMISSIBLE",
                    "dispatch_status": "UNASSIGNED",
                    "water_depth_cm": 18.0,
                    "channel": 1
                }
            ]
            for inc in initial_incidents:
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

