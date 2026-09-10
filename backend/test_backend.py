import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.rpi_engine import calculate_rpi
from app.models.schemas import DefectType
from app.spatial.dbscan import cluster_points_15m
from app.storage.mock_database import store

def test_rpi():
    score = calculate_rpi(DefectType.D40, 7, "National Highway (NH)", 420.0)
    print(f"[TEST RPI] D40 Pothole score: {score} (expected ~90-95)")
    assert 80.0 <= score <= 100.0, f"RPI score {score} out of bounds"

def test_dbscan():
    # 2 points 10m apart (0.00009 deg)
    pt1 = {"lat": 12.95160, "lng": 80.14620, "defect_type": "D40"}
    pt2 = {"lat": 12.95168, "lng": 80.14622, "defect_type": "D40"}
    # 1 point 500m away
    pt3 = {"lat": 12.95600, "lng": 80.15000, "defect_type": "D40"}

    clusters = cluster_points_15m([pt1, pt2, pt3], eps_meters=15.0)
    print(f"[TEST DBSCAN] Found {len(clusters)} clusters from 3 points (expected 2)")
    assert len(clusters) == 2, f"Expected 2 clusters, got {len(clusters)}"

def test_store():
    metrics = store.get_metrics()
    assert metrics["total_ingests"] >= 64
    assert len(store.get_clusters()) >= 9
    assert len(store.get_incidents()) >= 4
    assert len(store.fleet_nodes) == 5
    print(f"[TEST STORE] Metrics: {metrics}, Incidents: {len(store.get_incidents())}")

def test_app_import():
    from app.main import app
    print(f"[TEST APP] FastAPI app successfully initialized: {app.title}")

if __name__ == "__main__":
    test_rpi()
    test_dbscan()
    test_store()
    test_app_import()
    print("ALL BACKEND TESTS PASSED SUCCESSFULLY!")
