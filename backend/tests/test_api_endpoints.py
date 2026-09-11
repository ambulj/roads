import os
import sys
import unittest

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.storage.database import init_db

class TestAPIEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Ensure database is initialized and migrated
        init_db()
        cls.client = TestClient(app)

    def test_01_health_and_probes(self):
        """Verify health, liveness, and readiness probes."""
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")

        res_live = self.client.get("/live")
        self.assertEqual(res_live.status_code, 200)

        res_ready = self.client.get("/ready")
        self.assertEqual(res_ready.status_code, 200)
        self.assertEqual(res_ready.json()["status"], "ready")

    def test_02_list_incidents(self):
        """Verify GET /api/incidents returns persistent incidents with statutory citations."""
        res = self.client.get("/api/incidents")
        self.assertEqual(res.status_code, 200)
        incidents = res.json()
        self.assertIsInstance(incidents, list)
        self.assertGreater(len(incidents), 0)
        
        # Verify first incident has statutory MVA fields and camera position
        first = incidents[0]
        self.assertIn("id", first)
        self.assertIn("incident_type", first)
        self.assertIn("camera_position", first)
        self.assertIn("channel", first)
        self.assertIn("mva_section", first)
        self.assertIsNotNone(first["mva_section"])
        self.assertIn("fine_amount_inr", first)

    def test_03_create_incident_statutory_engine(self):
        """Verify POST /api/incidents calculates legal citation and persists to DB."""
        payload = {
            "reporting_bus_id": "BUS-TEST-99",
            "incident_type": "UNSAFE_OVERTAKE",
            "plate_number": "TN-09-TT-9999",

            "plate_confidence": 0.96,
            "vehicle_color": "Blue",
            "vehicle_class": "Car",
            "target_speed_kmh": 68.0,
            "road_name": "GST Road Corridor",
            "lat": 12.9516,
            "lng": 80.1462,
            "channel": 2
        }
        res = self.client.post("/api/incidents", json=payload)
        self.assertEqual(res.status_code, 200)
        created = res.json()
        self.assertEqual(created["plate_number"], "TN-09-TT-9999")
        self.assertEqual(created["camera_position"], "REAR_OVERTAKE")
        self.assertEqual(created["channel"], 2)
        self.assertIn("Section 184", created["mva_section"])
        self.assertEqual(created["fine_amount_inr"], 3000.0)
        self.assertTrue(created["echallan_issued"])
        self.assertIsNotNone(created["echallan_id"])

        # Verify immediate retrieval from DB
        get_res = self.client.get("/api/incidents")
        all_ids = [i["id"] for i in get_res.json()]
        self.assertIn(created["id"], all_ids)

    def test_04_incident_export_csv(self):
        """Verify GET /api/incidents/export/csv exports complete statutory CSV."""
        res = self.client.get("/api/incidents/export/csv")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("content-type"), "text/csv; charset=utf-8")
        self.assertIn("attachment; filename=gctp_traffic_enforcement_log.csv", res.headers.get("content-disposition", ""))
        self.assertIn("Incident ID", res.text)
        self.assertIn("MVA Statutory Section", res.text)
        self.assertIn("Camera Position", res.text)
        self.assertIn("Fine Amount (INR)", res.text)

    def test_05_incident_legal_dossier(self):
        """Verify GET /api/incidents/{id}/report returns Section 65B/63 BSA dossier."""
        inc_res = self.client.get("/api/incidents")
        first_id = inc_res.json()[0]["id"]

        res = self.client.get(f"/api/incidents/{first_id}/report")
        self.assertEqual(res.status_code, 200)
        self.assertIn("text/html", res.headers.get("content-type", ""))
        self.assertIn("Greater Chennai Traffic Police", res.text)
        self.assertIn("SECTION 63 OF BHARATIYA SAKSHYA ADHINIYAM 2023", res.text)
        self.assertIn("SECTION 65B INDIAN EVIDENCE ACT", res.text)
        self.assertIn("SHA-256", res.text)

    def test_06_fleet_crud_lifecycle(self):
        """Verify fleet registration, retrieval, and decommissioning."""
        test_bus_id = "BUS-INT-TEST"
        # 1. Create
        create_payload = {
            "id": test_bus_id,
            "route_name": "Integration Test Route",
            "route_code": "TEST-101",
            "vehicle_type": "Electric Transit",
            "camera_model": "Sony IMX335 1080p HDR 4-CH MDVR",
            "dvr_channels": 4,
            "dvr_ip": "192.168.1.50",
            "edge_fps": 30.0,
            "last_lat": 12.9516,
            "last_lng": 80.1462,
            "corridor": "GST Test Corridor",
            "camera_position": "FRONT_WINDSHIELD"
        }
        res_post = self.client.post("/api/fleet", json=create_payload)
        self.assertEqual(res_post.status_code, 201)

        # 2. Get
        res_get = self.client.get(f"/api/fleet/{test_bus_id}")
        self.assertEqual(res_get.status_code, 200)
        self.assertEqual(res_get.json()["id"], test_bus_id)
        self.assertEqual(res_get.json()["dvr_channels"], 4)

        # 3. Delete
        res_del = self.client.delete(f"/api/fleet/{test_bus_id}")
        self.assertEqual(res_del.status_code, 200)

        # 4. Verify 404 after deletion
        res_after = self.client.get(f"/api/fleet/{test_bus_id}")
        self.assertEqual(res_after.status_code, 404)

    def test_07_clusters_and_work_orders(self):
        """Verify hazard clusters and PWD work orders endpoints."""
        res = self.client.get("/api/clusters")
        self.assertEqual(res.status_code, 200)
        clusters = res.json()
        self.assertGreater(len(clusters), 0)
        first_cl = clusters[0]
        self.assertIn("cluster_code", first_cl)
        self.assertIn("detecting_camera_position", first_cl)

        # Test CSV export
        res_csv = self.client.get("/api/clusters/export/csv")
        self.assertEqual(res_csv.status_code, 200)
        self.assertIn("text/csv", res_csv.headers.get("content-type", ""))

        # Test work orders list
        res_wo = self.client.get("/api/work-orders")
        self.assertEqual(res_wo.status_code, 200)

        # Test work orders CSV export
        res_wo_csv = self.client.get("/api/work-orders/export/csv")
        self.assertEqual(res_wo_csv.status_code, 200)

    def test_08_simulation_toggle_runtime(self):
        """Verify simulation status and demo mode runtime toggle."""
        # 1. Get status
        res_stat = self.client.get("/api/simulation/status")
        self.assertEqual(res_stat.status_code, 200)
        stat = res_stat.json()
        self.assertIn("fleet_simulation_active", stat)
        self.assertIn("synthetic_generation_active", stat)

        # 2. Toggle demo mode ON (pausing fake pings)
        res_toggle = self.client.post("/api/simulation/toggle", json={"demo_mode": True})
        self.assertEqual(res_toggle.status_code, 200)
        updated_stat = res_toggle.json()["status"]
        self.assertTrue(updated_stat["demo_mode"])
        self.assertFalse(updated_stat["fleet_simulation_active"])
        self.assertFalse(updated_stat["synthetic_generation_active"])

        # 3. Toggle demo mode OFF (restoring active simulation)
        res_toggle_off = self.client.post("/api/simulation/toggle", json={"demo_mode": False})
        self.assertEqual(res_toggle_off.status_code, 200)
        restored_stat = res_toggle_off.json()["status"]
        self.assertFalse(restored_stat["demo_mode"])

    def test_09_canonical_pois_endpoint(self):
        """Verify GET /api/analytics/pois returns spatial landmarks with zero logic drift."""
        res = self.client.get("/api/analytics/pois")
        self.assertEqual(res.status_code, 200)
        pois = res.json()
        self.assertIsInstance(pois, list)
        self.assertGreater(len(pois), 0)
        self.assertIn("name", pois[0])
        self.assertIn("lat", pois[0])
        self.assertIn("lng", pois[0])

    def test_10_cors_origin_headers(self):
        """Verify CORS allows trusted origins with credentials without wildcard conflict."""
        headers = {
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET"
        }
        res = self.client.options("/api/incidents", headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("access-control-allow-origin"), "http://localhost:5173")
        self.assertEqual(res.headers.get("access-control-allow-credentials"), "true")

    def test_11_auth_password_verification_and_kpis(self):
        """Verify DB-backed password checking and live database calculated KPIs."""
        # 1. Successful authentication
        res_valid = self.client.post("/api/auth/login", json={
            "username": "admin",
            "password": "chennai@2026"
        })
        self.assertEqual(res_valid.status_code, 200)
        token = res_valid.json()["access_token"]
        self.assertIsNotNone(token)

        # 2. Rejection of invalid password
        res_invalid = self.client.post("/api/auth/login", json={
            "username": "admin",
            "password": "wrong_password_xyz"
        })
        self.assertEqual(res_invalid.status_code, 401)
        self.assertIn("Invalid departmental password", res_invalid.json()["detail"])

        # 3. Dynamic KPI verification from DB
        res_kpis = self.client.get("/api/auth/kpis", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res_kpis.status_code, 200)
        kpi_data = res_kpis.json()
        self.assertIn("primaryMetrics", kpi_data)
        self.assertIn("aggregates", kpi_data)
        self.assertGreater(kpi_data["aggregates"]["total_fines_inr"], 0)

    def test_12_sensor_fusion_latency_and_measurement(self):
        """Verify wall-clock latency profiling and removal of simulated random timers."""
        from app.services.sensor_fusion_engine import sensor_fusion_engine
        packet = {
            "bus_id": "BUS-INT-01",
            "lat": 12.9516,
            "lng": 80.1462,
            "speed_kmh": 42.0,
            "heading": 90.0,
            "vertical_gz": 1.48
        }
        res = sensor_fusion_engine.ingest_ais140_packet(packet)
        self.assertTrue(res.get("is_live_measured"))
        self.assertEqual(res.get("measurement_method"), "WALL_CLOCK_PERF_COUNTER")
        breakdown = res.get("latency_breakdown", {})
        self.assertIn("ais140_tcp_ingest_ms", breakdown)
        self.assertIn("h3_spatial_hash_ms", breakdown)
        self.assertIn("yolo_gpu_inference_ms", breakdown)
        self.assertGreater(breakdown["total_end_to_end_ms"], 0.0)

    def test_13_multibus_cooperative_perception_consensus(self):
        """Verify geodesic Haversine multi-bus consensus across spatial cell boundaries."""
        from app.services.sensor_fusion_engine import sensor_fusion_engine
        # Bus A detects anomaly
        obs1 = {"bus_id": "BUS-ALPHA", "lat": 12.95160, "lng": 80.14620, "vertical_gz": 1.45}
        res1 = sensor_fusion_engine.ingest_ais140_packet(obs1)
        
        # Bus B detects same physical defect nearby (within 15m)
        obs2 = {"bus_id": "BUS-BETA", "lat": 12.95166, "lng": 80.14624, "vertical_gz": 1.40}
        res2 = sensor_fusion_engine.ingest_ais140_packet(obs2)
        
        self.assertTrue(res2["multi_bus_consensus"])
        self.assertGreaterEqual(res2["confirming_buses_count"], 2)
        self.assertEqual(res2["consensus_details"]["status"], "MULTI_BUS_VERIFIED")

    def test_14_anpr_plate_detection(self):
        """Verify Automatic Number Plate Recognition (ANPR) on Indian HSRP plates."""
        # 1. Sample endpoint
        res_sample = self.client.get("/api/traffic/anpr/sample")
        self.assertEqual(res_sample.status_code, 200)
        data = res_sample.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["plate_number"], "TN09BK4091")
        self.assertEqual(data["state"], "Tamil Nadu")
        self.assertIn("Chennai", data["rto_location"])
        self.assertGreater(data["confidence"], 0.85)

        # 2. Detect endpoint
        res_detect = self.client.post("/api/traffic/anpr/detect", json={"bus_id": "BUS-TN01-1042"})
        self.assertEqual(res_detect.status_code, 200)
        self.assertTrue(res_detect.json()["success"])

    def test_15_traffic_density_and_compliance_provenance(self):
        """Verify IRC:106 PCU vehicle density and compliance endpoints provenance."""
        # Traffic density
        res_dens = self.client.get("/api/traffic/density")
        self.assertEqual(res_dens.status_code, 200)
        self.assertGreater(len(res_dens.json()), 0)
        self.assertIn("density_pcu_per_km", res_dens.json()[0])

        # Bottlenecks
        res_bn = self.client.get("/api/traffic/bottlenecks")
        self.assertEqual(res_bn.status_code, 200)
        self.assertGreater(len(res_bn.json()), 0)
        self.assertIn("speed_drop_pct", res_bn.json()[0])

        # Compliance provenance
        res_dark = self.client.get("/api/analytics/dark-spots")
        self.assertEqual(res_dark.status_code, 200)
        self.assertGreater(len(res_dark.json()), 0)
        self.assertEqual(res_dark.json()[0]["provenance"], "NIGHT_PATROL_TELEMETRY")

        res_pen = self.client.get("/api/analytics/recurrence-penalties")
        self.assertEqual(res_pen.status_code, 200)
        self.assertGreater(len(res_pen.json()), 0)
        self.assertIn("DERIVED_FROM_RECURRENT_DISTRESS", res_pen.json()[0]["provenance"])

    def test_16_detection_honesty_and_optical_quality(self):
        """Verify removal of hallucinated zebra fallback and calibrated optical IQA."""
        import numpy as np
        from app.services.yolo_inference import yolo_engine

        # 1. Blank frame must return empty detections (no hallucinated default box)
        blank = np.zeros((480, 640, 3), dtype=np.uint8)
        zebra_res = yolo_engine._detect_zebra_stripes_cv(blank)
        self.assertEqual(zebra_res, [], "Absence of stripes must return empty list without synthetic fallback")

        # 2. Optical Image Quality Assessment
        q = yolo_engine.compute_image_quality(blank)
        self.assertTrue(q["is_blurred"] or q["is_low_light"])
        self.assertEqual(q["quality_grade"], "UNUSABLE")
        self.assertLessEqual(q["evidence_weight"], 0.40)

    def test_17_sensor_reputation_and_gps_uncertainty(self):
        """Verify bus reputation tracking and GPS uncertainty radius weighting."""
        from app.services.sensor_fusion_engine import sensor_fusion_engine

        rep = sensor_fusion_engine.get_bus_reputation("BUS-MTC-19B")
        self.assertGreaterEqual(rep, 0.90)

        # Ingest packet and check GPS uncertainty radius in consensus details
        p = {
            "bus_id": "BUS-MTC-19B",
            "lat": 12.9516,
            "lng": 80.1462,
            "speed_kmh": 50.0,
            "vertical_gz": 1.42
        }
        res = sensor_fusion_engine.ingest_ais140_packet(p)
        self.assertIn("consensus_details", res)
        details = res["consensus_details"]
        self.assertIn("gps_uncertainty_radius_m", details)
        self.assertIn("primary_bus_reputation", details)

    def test_18_road_memory_closed_loop_repair_verification(self):
        """Verify automated post-repair verification pass vs recurrence penalty debit."""
        from app.storage.database import SessionLocal
        from app.models.db_models import DBDistressCluster
        from app.services.road_memory_engine import road_memory_engine

        # Setup test cluster with repaired status
        db = SessionLocal()
        c = db.query(DBDistressCluster).first()
        cluster_id = c.id
        c_lat, c_lng = c.lat, c.lng
        c.status = "repaired"
        db.commit()
        db.close()

        # 1. Smooth pass (Gz = 0.98) -> REPAIR_VERIFIED
        pass_res = road_memory_engine.evaluate_bus_pass(
            bus_id="BUS-AUDITOR-01",
            lat=c_lat,
            lng=c_lng,
            vertical_gz=0.98
        )
        self.assertGreaterEqual(len(pass_res["matched_events"]), 1)
        self.assertEqual(pass_res["matched_events"][0]["type"], "REPAIR_VERIFIED")

        # 2. Reset to repaired and test rough pass (Gz = 1.45) -> REPAIR_FAILED_RECURRENCE
        db = SessionLocal()
        c = db.query(DBDistressCluster).filter(DBDistressCluster.id == cluster_id).first()
        c.status = "repaired"
        db.commit()
        db.close()

        pass_recurrence = road_memory_engine.evaluate_bus_pass(
            bus_id="BUS-AUDITOR-02",
            lat=c_lat,
            lng=c_lng,
            vertical_gz=1.45
        )
        self.assertGreaterEqual(len(pass_recurrence["matched_events"]), 1)
        self.assertEqual(pass_recurrence["matched_events"][0]["type"], "REPAIR_FAILED_RECURRENCE")
        self.assertEqual(pass_recurrence["matched_events"][0]["penalty_amount_inr"], 25000.0)

    def test_19_kinematic_ttc_and_dynamic_rpi(self):
        """Verify Kinematic TTC collision warning and Dynamic RPI monsoon multipliers."""
        # 1. Kinematic TTC
        ttc_res = self.client.post("/api/road-memory/ttc", json={"distance_m": 12.0, "vehicle_speed_kmh": 40.0})
        self.assertEqual(ttc_res.status_code, 200)
        data = ttc_res.json()
        self.assertLess(data["ttc_seconds"], 2.5)
        self.assertEqual(data["verdict"], "CRITICAL_COLLISION_RISK")

        # 2. Dynamic RPI
        rpi_res = self.client.get("/api/road-memory/dynamic-rpi?base_rpi=60.0&weather=MONSOON&pcu=1700")
        self.assertEqual(rpi_res.status_code, 200)
        rpi_data = rpi_res.json()
        self.assertGreater(rpi_data["dynamic_rpi"], 60.0)
        self.assertEqual(rpi_data["multipliers"]["weather"], 1.35)

    def test_20_self_learning_annotation_and_retraining_loop(self):
        """Verify Self-Learning Active Queue, HITL review, and Continuous Retraining Loop."""
        # 1. Status
        res_stat = self.client.get("/api/learning/status")
        self.assertEqual(res_stat.status_code, 200)
        stat = res_stat.json()
        self.assertIn("current_model_version", stat)
        self.assertGreater(stat["dataset_statistics"]["total_curated_samples"], 0)

        # 2. Queue & Annotation
        res_q = self.client.get("/api/learning/queue")
        self.assertEqual(res_q.status_code, 200)
        queue_items = res_q.json()
        if queue_items:
            q_id = queue_items[0]["id"]
            res_ann = self.client.post("/api/learning/annotate", json={"queue_id": q_id, "action": "CONFIRM"})
            self.assertEqual(res_ann.status_code, 200)
            self.assertTrue(res_ann.json()["success"])

        # 3. Trigger Retraining Cycle
        res_train = self.client.post("/api/learning/train")
        self.assertEqual(res_train.status_code, 200)
        train_data = res_train.json()
        self.assertTrue(train_data["success"])
        self.assertIn("new_version", train_data)
        self.assertEqual(train_data["hot_reload_status"], "DEPLOYED_TO_ALL_FLEET_NODES")

if __name__ == "__main__":
    unittest.main()


