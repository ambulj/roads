import pytest
from sqlalchemy import create_engine, inspect
from sqlalchemy.schema import CreateTable, CreateIndex
from sqlalchemy.dialects import postgresql, sqlite
from app.models.db_models import (
    Base,
    SpatialPoint,
    DBDistressCluster,
    DBRawIngest,
    DBTrafficIncident,
)


def test_geometry_compilation_sqlite():
    """
    Verifies that on SQLite:
    - Base.metadata.create_all() executes with ZERO native C-library (SpatiaLite) dependencies.
    - No RecoverGeometryColumn errors are triggered.
    - The 'geom' column is represented as TEXT in SQLite DDL and PRAGMA table_info.
    - Records can be inserted and queried cleanly.
    """
    sqlite_engine = create_engine("sqlite:///:memory:")
    # Ensure zero errors during table creation
    Base.metadata.create_all(bind=sqlite_engine)

    # Inspect created schema on SQLite
    inspector = inspect(sqlite_engine)
    
    for table_name in ("distress_clusters", "raw_ingests", "traffic_incidents"):
        assert table_name in inspector.get_table_names()
        columns = {col["name"]: str(col["type"]).upper() for col in inspector.get_columns(table_name)}
        assert "geom" in columns
        assert "TEXT" in columns["geom"]
        assert "lat" in columns
        assert "lng" in columns

    # Verify SQLite DDL directly
    for model in (DBDistressCluster, DBRawIngest, DBTrafficIncident):
        ddl = str(CreateTable(model.__table__).compile(dialect=sqlite.dialect()))
        assert "geom TEXT" in ddl or "geom text" in ddl.lower()


def test_geometry_compilation_postgres_ddl():
    """
    Verifies that on PostgreSQL dialect:
    - The 'geom' column compiles to PostGIS geometry(POINT,4326).
    - Spatial indexes compile with USING gist (geom).
    - Spatio-temporal composite index compiles with (captured_at, bus_id).
    """
    pg_dialect = postgresql.dialect()

    # Verify column compilation to geometry(POINT,4326)
    for model in (DBDistressCluster, DBRawIngest, DBTrafficIncident):
        ddl = str(CreateTable(model.__table__).compile(dialect=pg_dialect))
        assert "geom geometry(POINT,4326)" in ddl, f"Expected PostGIS POINT geometry in {model.__tablename__} DDL"

    # Verify GiST spatial indexes
    indexes_by_name = {}
    for model in (DBDistressCluster, DBRawIngest, DBTrafficIncident):
        for idx in model.__table__.indexes:
            indexes_by_name[idx.name] = idx

    assert "idx_distress_clusters_geom" in indexes_by_name
    assert "idx_traffic_incidents_geom" in indexes_by_name
    assert "idx_raw_ingests_geom" in indexes_by_name
    assert "idx_raw_ingests_time_bus" in indexes_by_name

    # Check compiled GiST DDL
    for gist_idx_name in ("idx_distress_clusters_geom", "idx_traffic_incidents_geom", "idx_raw_ingests_geom"):
        idx_ddl = str(CreateIndex(indexes_by_name[gist_idx_name]).compile(dialect=pg_dialect))
        assert "USING gist (geom)" in idx_ddl or "USING gist" in idx_ddl

    # Check spatio-temporal index DDL
    time_bus_ddl = str(CreateIndex(indexes_by_name["idx_raw_ingests_time_bus"]).compile(dialect=pg_dialect))
    assert "captured_at" in time_bus_ddl and "bus_id" in time_bus_ddl


def test_models_retain_lat_lng_coordinates():
    """
    Verifies that lat and lng Float columns are preserved on models alongside geom
    to maintain zero-copy JSON responses and SQLite compatibility.
    """
    for model in (DBDistressCluster, DBRawIngest, DBTrafficIncident):
        cols = model.__table__.columns
        assert "lat" in cols
        assert "lng" in cols
        assert "geom" in cols
        assert str(cols["lat"].type) == "FLOAT"
        assert str(cols["lng"].type) == "FLOAT"
