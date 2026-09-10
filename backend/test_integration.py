import urllib.request
import json
import time
import subprocess
import sys
import os

def test_live_api():
    print("[INTEGRATION] Launching backend process...")
    p = subprocess.Popen(
        [sys.executable, "run_backend.py"],
        cwd=os.path.dirname(os.path.abspath(__file__)),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    time.sleep(3)

    try:
        # 1. Health
        res = urllib.request.urlopen("http://127.0.0.1:8000/health", timeout=3)
        data = json.loads(res.read().decode())
        print(f"[HEALTH] {data}")
        assert data["status"] == "healthy"

        # 2. Metrics
        res = urllib.request.urlopen("http://127.0.0.1:8000/api/telemetry/metrics", timeout=3)
        metrics = json.loads(res.read().decode())
        print(f"[METRICS] Total ingests: {metrics['total_ingests']}, Clusters: {metrics['dbscan_clusters']}")
        assert metrics["total_ingests"] >= 64

        # 3. Clusters
        res = urllib.request.urlopen("http://127.0.0.1:8000/api/clusters", timeout=3)
        clusters = json.loads(res.read().decode())
        print(f"[CLUSTERS] Count: {len(clusters)}, Top: {clusters[0]['cluster_code']} ({clusters[0]['defect_name']}) RPI={clusters[0]['rpi_score']}")
        assert len(clusters) >= 9

        # 3b. Incidents (Persistent DB)
        res = urllib.request.urlopen("http://127.0.0.1:8000/api/incidents", timeout=3)
        incidents = json.loads(res.read().decode())
        print(f"[INCIDENTS] Count: {len(incidents)}, First: {incidents[0]['incident_type']} ({incidents[0].get('plate_number', 'N/A')})")
        assert len(incidents) >= 4

        # 4. Fleet
        res = urllib.request.urlopen("http://127.0.0.1:8000/api/fleet", timeout=3)
        fleet = json.loads(res.read().decode())
        print(f"[FLEET] Active Nodes: {len(fleet)}, First: {fleet[0]['id']} ({fleet[0]['route_name']})")
        assert len(fleet) == 5

        # 5. Corridors
        res = urllib.request.urlopen("http://127.0.0.1:8000/api/analytics/corridors", timeout=3)
        corridors = json.loads(res.read().decode())
        print(f"[CORRIDORS] Count: {len(corridors)}, First: {corridors[0]['corridor_name']}")
        assert len(corridors) == 8

        # 6. Ingest Test
        req_data = json.dumps({
            "bus_id": "TEST-BUS-9999",
            "lat": 12.95165,
            "lng": 80.14625,
            "speed_kmh": 40.0,
            "heading": 90.0,
            "defect_type": "D40",
            "confidence": 0.95,
            "vertical_g_force": 1.7
        }).encode('utf-8')
        req = urllib.request.Request(
            "http://127.0.0.1:8000/api/telemetry/ingest",
            data=req_data,
            headers={"Content-Type": "application/json"}
        )
        res = urllib.request.urlopen(req, timeout=3)
        ingest_res = json.loads(res.read().decode())
        print(f"[INGEST TEST] Result: {ingest_res['action']}")
        assert ingest_res["status"] == "ingested"

        print("ALL END-TO-END BACKEND & INGESTION TESTS PASSED PERFECTLY!")
    finally:
        p.terminate()
        try:
            p.wait(timeout=2)
        except subprocess.TimeoutExpired:
            p.kill()

if __name__ == "__main__":
    test_live_api()
