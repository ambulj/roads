from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_live_api():
    print("[INTEGRATION] Running end-to-end integration tests via TestClient...")

    # 1. Health
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    print(f"[HEALTH] {data}")
    assert data["status"] == "healthy"

    # 2. Metrics
    res = client.get("/api/telemetry/metrics")
    assert res.status_code == 200
    metrics = res.json()
    print(f"[METRICS] Total ingests: {metrics['total_ingests']}, Clusters: {metrics['dbscan_clusters']}")
    assert metrics["total_ingests"] >= 64

    # 3. Clusters
    res = client.get("/api/clusters")
    assert res.status_code == 200
    clusters = res.json()
    print(f"[CLUSTERS] Count: {len(clusters)}, Top: {clusters[0]['cluster_code']} ({clusters[0]['defect_name']}) RPI={clusters[0]['rpi_score']}")
    assert len(clusters) >= 5

    # 3b. Incidents (Persistent DB)
    res = client.get("/api/incidents")
    assert res.status_code == 200
    incidents = res.json()
    print(f"[INCIDENTS] Count: {len(incidents)}, First: {incidents[0]['incident_type']} ({incidents[0].get('plate_number', 'N/A')})")
    assert len(incidents) >= 4

    # 4. Fleet
    res = client.get("/api/fleet")
    assert res.status_code == 200
    fleet = res.json()
    print(f"[FLEET] Active Nodes: {len(fleet)}, First: {fleet[0]['id']} ({fleet[0]['route_name']})")
    assert len(fleet) >= 5

    # 5. Corridors
    res = client.get("/api/analytics/corridors")
    assert res.status_code == 200
    corridors = res.json()
    print(f"[CORRIDORS] Count: {len(corridors)}, First: {corridors[0]['corridor_name']}")
    assert len(corridors) == 8

    # 6. Ingest Test
    ingest_payload = {
        "bus_id": "TEST-BUS-9999",
        "lat": 12.95165,
        "lng": 80.14625,
        "speed_kmh": 40.0,
        "heading": 90.0,
        "defect_type": "D40",
        "confidence": 0.95,
        "vertical_g_force": 1.7
    }
    res = client.post("/api/telemetry/ingest", json=ingest_payload)
    assert res.status_code == 200
    ingest_res = res.json()
    print(f"[INGEST TEST] Result: {ingest_res['action']}")
    assert ingest_res["status"] == "ingested"

    print("ALL END-TO-END BACKEND & INGESTION TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_live_api()
