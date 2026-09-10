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
        for col in ("before_image_url", "after_image_url", "field_notes"):
            if col not in existing_cols and existing_cols:
                cursor.execute(f"ALTER TABLE distress_clusters ADD COLUMN {col} TEXT")
        
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
            ("description", "TEXT")
        ):
            if col not in existing_inc_cols and existing_inc_cols:
                cursor.execute(f"ALTER TABLE traffic_incidents ADD COLUMN {col} {col_type}")

        conn.commit()
        conn.close()

    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        # ── Seed clusters ────────────────────────────────────────────────────
        if db.query(DBDistressCluster).count() == 0:
            from app.storage.mock_database import INITIAL_SEED_CLUSTERS
            for item in INITIAL_SEED_CLUSTERS:
                db.add(DBDistressCluster(**item))

        # ── Seed fleet nodes ─────────────────────────────────────────────────
        if db.query(DBFleetNode).count() == 0:
            from app.storage.mock_database import INITIAL_SEED_FLEET
            for bus in INITIAL_SEED_FLEET:
                db.add(DBFleetNode(**bus))

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
                    "status": "ACTIVE_ALERT"
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
                    "status": "DISPATCHED"
                },
                {
                    "id": "inc-003",
                    "reporting_bus_id": "BUS-TN02-3891",
                    "incident_type": "VULNERABLE_PEDESTRIAN",
                    "plate_number": None,
                    "plate_confidence": 0.94,
                    "vehicle_color": None,
                    "vehicle_class": "School Zone Crossing",
                    "target_speed_kmh": 0.0,
                    "is_intercepted": False,
                    "intercepted_by_bus_id": None,
                    "snapshot_url": None,
                    "road_name": "Usman Road D.A.V. School Junction",
                    "lat": 13.0425, "lng": 80.2345,
                    "occurred_at": "5 Sept, 07:45 am",
                    "status": "ACTIVE_ALERT"
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
                    "status": "ACTIVE_ALERT"
                }
            ]
            for inc in initial_incidents:
                db.add(DBTrafficIncident(**inc))

        db.commit()
        print("[DATABASE] Database ready.")
    finally:
        db.close()
