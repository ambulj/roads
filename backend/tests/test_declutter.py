import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.auth import create_access_token
from app.storage.database import SessionLocal, get_db
from app.models.db_models import DBTrafficIncident, DBDistressCluster

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def auth_headers():
    token = create_access_token({"sub": "admin", "name": "Traffic Commander", "role": "admin"})
    return {"Authorization": f"Bearer {token}"}

def test_dispatch_alert_purges_incident_and_hazards(client, auth_headers):
    """
    Validates that clicking 'Dispatch Alert to Traffic Police' automatically dispatches
    to GCTP, issues e-Challan, and completely purges the incident and correlated
    hazard clusters from the database so the map declutters.
    """
    db = SessionLocal()
    try:
        # 1. Seed a test hit-and-run incident and an associated pothole hazard at the same location
        test_inc_id = "inc-test-declutter-01"
        test_cluster_id = "cl-test-declutter-01"
        lat, lng = 12.9516, 80.1462

        # Clean prior run if any
        db.query(DBTrafficIncident).filter(DBTrafficIncident.id == test_inc_id).delete()
        db.query(DBDistressCluster).filter(DBDistressCluster.id == test_cluster_id).delete()
        db.commit()

        inc = DBTrafficIncident(
            id=test_inc_id,
            reporting_bus_id="BUS-TN01-1042",
            incident_type="HIT_AND_RUN",
            plate_number="TN09XY9999",
            plate_confidence=0.96,
            vehicle_color="White",
            vehicle_class="Motor Vehicle",
            target_speed_kmh=75.0,
            road_name="GST Road, Tambaram (NH-32)",
            lat=lat,
            lng=lng,
            occurred_at="Just now",
            status="ACTIVE_ALERT"
        )
        db.add(inc)

        cluster = DBDistressCluster(
            id=test_cluster_id,
            cluster_code="WO-TEST-9999",
            defect_type="D40",
            defect_name="Pothole Cavity",
            severity_level="critical",
            rpi_score=94.0,
            pass_count=3,
            road_name="GST Road, Tambaram (NH-32)",
            classification="National Highway",
            lat=lat,
            lng=lng,
            status="open"
        )
        db.add(cluster)
        db.commit()

        # 2. Dispatch alert with purge_from_db=True and clear_associated_hazards=True
        dispatch_payload = {
            "channel": "ALL",
            "target_pcr_unit": "PCR-14",
            "priority": "P0_EMERGENCY",
            "purge_from_db": True,
            "clear_associated_hazards": True
        }
        res = client.post(f"/api/incidents/{test_inc_id}/dispatch", json=dispatch_payload, headers=auth_headers)
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["success"] is True
        assert data["purged_from_db"] is True
        assert data["cleared_hazards_count"] >= 1
        assert test_cluster_id in data["cleared_cluster_ids"]

        # 3. Verify in database that incident and hazard cluster are removed
        inc_in_db = db.query(DBTrafficIncident).filter(DBTrafficIncident.id == test_inc_id).first()
        cluster_in_db = db.query(DBDistressCluster).filter(DBDistressCluster.id == test_cluster_id).first()
        assert inc_in_db is None, "Incident should be purged from database"
        assert cluster_in_db is None, "Associated hazard cluster should be purged from database"

    finally:
        db.close()

def test_delete_endpoints_and_clear_clutter(client, auth_headers):
    """
    Validates DELETE /api/incidents/{id}, DELETE /api/clusters/{id},
    and POST /api/incidents/clear-clutter.
    """
    db = SessionLocal()
    try:
        # 1. Create a dummy incident and cluster
        d_inc_id = "inc-dummy-del"
        d_cl_id = "cl-dummy-del"

        inc = DBTrafficIncident(
            id=d_inc_id,
            reporting_bus_id="BUS-TN01-1042",
            incident_type="RASH_DRIVING",
            road_name="Anna Salai",
            lat=13.0425,
            lng=80.2345,
            status="ACTIVE_ALERT"
        )
        cl = DBDistressCluster(
            id=d_cl_id,
            cluster_code="WO-DUMMY",
            defect_type="D20",
            defect_name="Fatigue Cracks",
            severity_level="medium",
            rpi_score=65.0,
            road_name="Anna Salai",
            lat=13.0425,
            lng=80.2345,
            classification="Arterial",
            status="open"
        )
        db.add(inc)
        db.add(cl)
        db.commit()

        # 2. Delete incident directly
        res_del_inc = client.delete(f"/api/incidents/{d_inc_id}", headers=auth_headers)
        assert res_del_inc.status_code == 200
        assert db.query(DBTrafficIncident).filter(DBTrafficIncident.id == d_inc_id).first() is None

        # 3. Delete cluster directly
        res_del_cl = client.delete(f"/api/clusters/{d_cl_id}", headers=auth_headers)
        assert res_del_cl.status_code == 200
        assert db.query(DBDistressCluster).filter(DBDistressCluster.id == d_cl_id).first() is None

        # 4. Clear clutter endpoint
        res_clear = client.post("/api/incidents/clear-clutter", headers=auth_headers)
        assert res_clear.status_code == 200
        clear_data = res_clear.json()
        assert clear_data["success"] is True

    finally:
        db.close()
