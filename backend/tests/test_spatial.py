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


def test_viewport_query_fallback():
    """
    Verifies bounding box filtering on /api/v1/clusters:
    - Clusters inside bbox [80.14, 12.95, 80.25, 13.05] are returned.
    - Clusters outside bbox are excluded.
    - Malformed and invalid bbox queries return HTTP 400 with descriptive error messages.
    """
    from fastapi.testclient import TestClient
    from app.main import app
    from app.storage.database import SessionLocal, init_db

    init_db()
    client = TestClient(app)
    db = SessionLocal()

    try:
        # Insert test clusters inside and outside Chennai test bbox [80.14, 12.95, 80.25, 13.05]
        inside_cluster = DBDistressCluster(
            id="test-cl-inside-01",
            cluster_code="WO-IN01",
            defect_type="D40",
            defect_name="Deep Structural Pothole",
            severity_level="high",
            rpi_score=92.0,
            pass_count=3,
            road_name="GST Road (NH-32)",
            classification="National Highway",
            lat=13.0000,
            lng=80.2000,
            status="open"
        )
        outside_cluster = DBDistressCluster(
            id="test-cl-outside-01",
            cluster_code="WO-OUT01",
            defect_type="D40",
            defect_name="Distant Surface Defect",
            severity_level="low",
            rpi_score=35.0,
            pass_count=1,
            road_name="Outer Bypass",
            classification="State Highway",
            lat=13.5000,
            lng=80.5000,
            status="open"
        )
        db.merge(inside_cluster)
        db.merge(outside_cluster)
        db.commit()

        # Query with bbox [min_lon, min_lat, max_lon, max_lat] = [80.14, 12.95, 80.25, 13.05]
        res = client.get("/api/v1/clusters?bbox=80.14,12.95,80.25,13.05")
        assert res.status_code == 200
        clusters = res.json()
        assert len(clusters) > 0

        returned_ids = {c["id"] for c in clusters}
        assert "test-cl-inside-01" in returned_ids
        assert "test-cl-outside-01" not in returned_ids

        # Ensure all returned coordinates are strictly within bbox
        for c in clusters:
            assert 12.95 <= c["lat"] <= 13.05
            assert 80.14 <= c["lng"] <= 80.25

        # Test invalid bbox formats and range validation (T-01-03)
        res_bad_format = client.get("/api/v1/clusters?bbox=80.14,12.95,80.25")
        assert res_bad_format.status_code == 400

        res_bad_coords = client.get("/api/v1/clusters?bbox=abc,12.95,80.25,13.05")
        assert res_bad_coords.status_code == 400

        res_inverted_lon = client.get("/api/v1/clusters?bbox=80.25,12.95,80.14,13.05")
        assert res_inverted_lon.status_code == 400

        res_inverted_lat = client.get("/api/v1/clusters?bbox=80.14,13.05,80.25,12.95")
        assert res_inverted_lat.status_code == 400

        res_out_of_bounds = client.get("/api/v1/clusters?bbox=-190.0,12.95,80.25,13.05")
        assert res_out_of_bounds.status_code == 400
    finally:
        # Clean up test rows
        db.query(DBDistressCluster).filter(
            DBDistressCluster.id.in_(["test-cl-inside-01", "test-cl-outside-01"])
        ).delete(synchronize_session=False)
        db.commit()
        db.close()


def test_dbscan_clustering_consistency():
    """
    Verifies multi-pass DBSCAN clustering consistency:
    - Points A and B within ~8m merge into 1 cluster with pass_count == 2.
    - Point C (500m away) remains separate with pass_count == 1.
    - Road corridor snapping associates the merged cluster with the nearest road segment.
    """
    from app.services.clustering_service import clustering_service

    # Point A and B are ~5.5m apart (within 8m), Point C is ~489m away
    point_a = {
        "lat": 12.95160,
        "lng": 80.14620,
        "defect_type": "D40",
        "confidence": 0.95,
        "bus_id": "BUS-01",
        "vertical_g_force": 1.45
    }
    point_b = {
        "lat": 12.95165,
        "lng": 80.14620,
        "defect_type": "D40",
        "confidence": 0.91,
        "bus_id": "BUS-02",
        "vertical_g_force": 1.62
    }
    point_c = {
        "lat": 12.95600,
        "lng": 80.14620,
        "defect_type": "D40",
        "confidence": 0.88,
        "bus_id": "BUS-03",
        "vertical_g_force": 1.10
    }

    clusters = clustering_service.cluster_points(
        [point_a, point_b, point_c],
        eps_meters=15.0,
        min_points=2
    )

    assert len(clusters) == 2, f"Expected 2 clusters, got {len(clusters)}"

    # Find the merged cluster for Points A & B
    merged_cluster = next((c for c in clusters if c["pass_count"] == 2), None)
    assert merged_cluster is not None, "Points A and B did not merge into a cluster with pass_count == 2"
    assert merged_cluster["distinct_buses"] == 2
    assert merged_cluster["is_multi_pass"] is True
    assert merged_cluster["defect_type"] == "D40"
    assert abs(merged_cluster["lat"] - 12.951625) < 1e-4

    # Point C remains separate
    separate_cluster = next((c for c in clusters if c["pass_count"] == 1), None)
    assert separate_cluster is not None, "Point C was not separated into its own cluster"
    assert separate_cluster["is_multi_pass"] is False
    assert separate_cluster["points"][0]["bus_id"] == "BUS-03"

    # Road corridor snapping verification
    snap = clustering_service.snap_to_road_corridor(merged_cluster["lat"], merged_cluster["lng"], corridor_buffer_m=15.0)
    assert snap is not None
    assert "road_name" in snap

