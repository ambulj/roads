import sys
import os
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.storage.database import init_db, SessionLocal
from app.models.db_models import DBTrafficDensity, DBContractorPenalty, DBTrafficIncident
from app.services.model_registry import model_registry

client = TestClient(app)

class TestProductionHardening(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    # ── 1. AUTHENTICATION & RBAC ─────────────────────────────────────────────
    def test_01_auth_token_issuance_and_me(self):
        # Test valid login for PWD engineer
        res = client.post("/api/auth/login", json={"role": "pwd_engineer"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["role"], "pwd_engineer")
        token = data["access_token"]

        # Test /api/auth/me with Bearer token
        res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res_me.status_code, 200)
        self.assertEqual(res_me.json()["role"], "pwd_engineer")

    def test_02_rbac_work_order_protection(self):
        # 1. Unauthenticated mutation should fail with 401
        res_unauth = client.patch("/api/work-orders/cl-0001/status", json={"status": "in_progress"})
        self.assertEqual(res_unauth.status_code, 401)

        # 2. Login as RTO officer (not authorized for PWD work orders) -> 403 Forbidden
        res_rto = client.post("/api/auth/login", json={"role": "rto_officer"})
        token_rto = res_rto.json()["access_token"]
        res_forbidden = client.patch(
            "/api/work-orders/cl-0001/status", 
            json={"status": "in_progress"},
            headers={"Authorization": f"Bearer {token_rto}"}
        )
        self.assertEqual(res_forbidden.status_code, 403)

        # 3. Login as PWD engineer -> 200 OK
        res_pwd = client.post("/api/auth/login", json={"role": "pwd_engineer"})
        token_pwd = res_pwd.json()["access_token"]
        res_ok = client.patch(
            "/api/work-orders/cl-0001/status", 
            json={"status": "in_progress", "field_notes": "Crew mobilized"},
            headers={"Authorization": f"Bearer {token_pwd}"}
        )
        self.assertEqual(res_ok.status_code, 200)

    # ── 2. TRUTHFUL MODEL REGISTRY ───────────────────────────────────────────
    def test_03_honest_model_registry(self):
        res = client.get("/api/models/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["verification_mode"], "Filesystem-Verified (Strict Non-Fabrication Guarantee)")
        models = data["models"]
        
        # Pothole YOLO must not falsely claim 'ready' if .pt weights are absent
        pothole_info = models["pothole_yolo"]
        if not pothole_info["weights_exist_on_disk"]:
            self.assertEqual(pothole_info["status"], "awaiting_weights")
            self.assertIn("fallback_pipeline", pothole_info)
            
        # Zebra crossing detector must be present and ready (hybrid CV)
        self.assertIn("zebra_crossing_detector", models)
        self.assertTrue(models["zebra_crossing_detector"]["status"].startswith("ready"))

    # ── 3. COMPLIANCE DATA BACKED BY DATABASE ────────────────────────────────
    def test_04_compliance_data_provenance(self):
        # Contractor penalties
        res_pen = client.get("/api/analytics/recurrence-penalties")
        self.assertEqual(res_pen.status_code, 200)
        penalties = res_pen.json()
        self.assertTrue(len(penalties) > 0)
        self.assertIn("provenance", penalties[0])
        self.assertIn("statutory_clause", penalties[0])

        # Open manholes
        res_man = client.get("/api/analytics/open-manholes")
        self.assertEqual(res_man.status_code, 200)
        manholes = res_man.json()
        self.assertTrue(len(manholes) > 0)
        self.assertIn("IS:1726", manholes[0]["statutory_standard"])

    # ── 4. VEHICLE DENSITY & BOTTLENECK SUBSYSTEM ────────────────────────────
    def test_05_traffic_density_and_bottlenecks(self):
        # 1. Get corridor density
        res_dens = client.get("/api/traffic/density")
        self.assertEqual(res_dens.status_code, 200)
        densities = res_dens.json()
        self.assertTrue(len(densities) >= 4)

        # 2. Ingest edge traffic count (IRC:106 PCU)
        ingest_payload = {
            "corridor_id": "corridor-gst",
            "road_name": "GST Road Airport Segment",
            "lat": 12.9850,
            "lng": 80.1650,
            "counts_2w": 40,
            "counts_3w": 10,
            "counts_4w": 30,
            "counts_bus": 5,
            "counts_truck": 2,
            "average_speed_kmh": 22.0,
            "free_flow_speed_kmh": 50.0
        }
        res_ingest = client.post("/api/traffic/ingest", json=ingest_payload)
        self.assertEqual(res_ingest.status_code, 200)
        data = res_ingest.json()
        # Under official IRC:106-1990 Table 1:
        # PCU = 40*0.5 (2W) + 10*1.2 (3W) + 30*1.0 (4W) + 5*2.2 (Bus) + 2*2.2 (Truck)
        #     = 20.0 + 12.0 + 30.0 + 11.0 + 4.4 = 77.4 PCU
        self.assertEqual(data["density_pcu_per_km"], 77.4)
        self.assertTrue(data["is_bottleneck"])

        # 3. Query active bottlenecks
        res_bn = client.get("/api/traffic/bottlenecks")
        self.assertEqual(res_bn.status_code, 200)
        bottlenecks = res_bn.json()
        self.assertTrue(len(bottlenecks) > 0)
        self.assertIn("recommended_diversion", bottlenecks[0])

    # ── 5. ANPR & INCIDENT REVIEW WORKFLOW ───────────────────────────────────
    def test_06_incident_review_queue_and_dispatch(self):
        # 1. Fetch review queue
        res_q = client.get("/api/incidents/review-queue")
        self.assertEqual(res_q.status_code, 200)
        q_data = res_q.json()
        self.assertIn("queue_count", q_data)
        
        # 2. Review an incident as Traffic Safety officer
        res_safety = client.post("/api/auth/login", json={"role": "safety"})
        token_safety = res_safety.json()["access_token"]
        headers_safety = {"Authorization": f"Bearer {token_safety}"}
        
        res_review = client.post(
            "/api/incidents/inc-003/review",
            json={"action": "ACCEPT", "officer_notes": "Plate confirmed as TN-07-BP-9901"},
            headers=headers_safety
        )
        self.assertEqual(res_review.status_code, 200)
        review_data = res_review.json()
        self.assertEqual(review_data["incident"]["review_status"], "ACCEPTED")

        # 3. Dispatch alert to PCR Interceptor
        res_disp = client.post(
            "/api/incidents/inc-003/dispatch",
            json={"channel": "ALL", "target_pcr_unit": "PCR-14"},
            headers=headers_safety
        )
        self.assertEqual(res_disp.status_code, 200)
        disp_summary = res_disp.json()["dispatch_summary"]
        self.assertEqual(disp_summary["target_pcr_unit"], "PCR-14")

    # ── 6. EDGE BUFFERING & LOW-BANDWIDTH ARCHITECTURE ───────────────────────
    def test_07_edge_buffer_sync(self):
        payload = {
            "bus_id": "BUS-TN01-1042",
            "buffer_start_time": "18:00:00",
            "buffer_end_time": "18:05:00",
            "total_uncompressed_bytes": 1048576, # 1 MB
            "compressed_bytes_sent": 209715,     # 200 KB (~80% compression)
            "packets": [
                {
                    "packet_id": "pkt-01",
                    "bus_id": "BUS-TN01-1042",
                    "priority": "P1_ROUTINE",
                    "defect_type": "D00",
                    "confidence": 0.88,
                    "speed_kmh": 42.0,
                    "vertical_g_force": 1.1,
                    "lat": 12.9520,
                    "lng": 80.1470,
                    "buffered_at": "18:02:10"
                }
            ]
        }
        res = client.post("/api/telemetry/edge/sync", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "SUCCESS_SYNCED")
        self.assertTrue(data["bandwidth_saved_pct"] >= 70.0)

        # Check node status
        res_status = client.get("/api/telemetry/edge/status/BUS-TN01-1042")
        self.assertEqual(res_status.status_code, 200)
        self.assertEqual(res_status.json()["connectivity_mode"], "ONLINE")

    # ── 7. GTFS ROUTE DELAY & SPEED-DISTRESS ANALYTICS ───────────────────────
    def test_08_gtfs_analytics_and_speed_distress(self):
        res_sd = client.get("/api/analytics/speed-distress")
        self.assertEqual(res_sd.status_code, 200)
        sd_data = res_sd.json()
        self.assertEqual(sd_data["data_provenance"], "DYNAMIC_COMPUTED_FROM_TELEMETRY")
        self.assertIn("live_summary", sd_data)

        res_delays = client.get("/api/analytics/transit-delays")
        self.assertEqual(res_delays.status_code, 200)
        delays = res_delays.json()
        self.assertTrue(len(delays) >= 3)
        self.assertIn("delay_breakdown", delays[0])

    # ── 8. WHATSAPP & MULTI-CHANNEL DISPATCH GATEWAY ─────────────────────────
    def test_09_whatsapp_dispatch(self):
        res = client.post("/api/dispatch/whatsapp", json={
            "cluster_code": "WO-0001",
            "recipient_phone": "+91 98401 22345",
            "recipient_name": "Er. K. Shanmugam",
            "agency_name": "L&T Highways Infra Ltd",
            "priority": "P0_EMERGENCY"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertTrue(data["delivery_receipt_id"].startswith("MSG-WA-2026-"))
        self.assertIn("wa.me", data["wa_deep_link"])

    # ── 9. DPDP ACT 2023 ROLE-GATED EVIDENCE VAULT ───────────────────────────
    def test_10_dpdp_authenticated_evidence_vault_download(self):
        # 1. Unauthenticated access must fail with 401
        res_unauth = client.get("/api/evidence/ev-test/download")
        self.assertEqual(res_unauth.status_code, 401)

        # 2. Authenticated access by authorized persona
        res_auth = client.post("/api/auth/login", json={"role": "pwd_engineer"})
        token = res_auth.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Query evidence vault
        res_list = client.get("/api/evidence")
        self.assertEqual(res_list.status_code, 200)
        items = res_list.json()

        if items:
            ev_id = items[0].get("evidence_id") or items[0].get("id")
            res_dl = client.get(f"/api/evidence/{ev_id}/download", headers=headers)
            if res_dl.status_code == 200:
                self.assertIn("X-DPDP-Act-2023-Compliance", res_dl.headers)
                self.assertIn("X-DPDP-Authorized-Role", res_dl.headers)
            else:
                self.assertIn(res_dl.status_code, (200, 404))

    # ── 10. STATUTORY IRC:106 CONFORMANCE & GROUND TRUTH METRICS MATRIX ──────
    def test_11_irc106_pcu_table_one_conformance(self):
        """Verify strict adherence to IRC:106-1990 Table 1 urban road PCU equivalents."""
        from app.core.traffic_scoring import calculate_irc106_pcu, map_class_to_irc106_pcu, IRC106_PCU_FACTORS
        
        # Check Table 1 factors
        self.assertEqual(IRC106_PCU_FACTORS["2w"], 0.5)
        self.assertEqual(IRC106_PCU_FACTORS["3w"], 1.2)
        self.assertEqual(IRC106_PCU_FACTORS["car"], 1.0)
        self.assertEqual(IRC106_PCU_FACTORS["lcv"], 1.4)
        self.assertEqual(IRC106_PCU_FACTORS["bus"], 2.2)
        self.assertEqual(IRC106_PCU_FACTORS["truck"], 2.2)
        self.assertEqual(IRC106_PCU_FACTORS["tractor"], 4.0)
        self.assertEqual(IRC106_PCU_FACTORS["bicycle"], 0.5)
        self.assertEqual(IRC106_PCU_FACTORS["cart"], 1.5)

        # Check multi-class detection mapping
        self.assertEqual(map_class_to_irc106_pcu("Autorickshaw"), 1.2)
        self.assertEqual(map_class_to_irc106_pcu("Tempo"), 1.4)
        self.assertEqual(map_class_to_irc106_pcu("Ambulance"), 1.4)
        self.assertEqual(map_class_to_irc106_pcu("Tractor"), 4.0)
        self.assertEqual(map_class_to_irc106_pcu("Cycle"), 0.5)
        self.assertEqual(map_class_to_irc106_pcu("MotorBike"), 0.5)
        self.assertEqual(map_class_to_irc106_pcu("Bus"), 2.2)
        self.assertEqual(map_class_to_irc106_pcu("Truck"), 2.2)
        self.assertEqual(map_class_to_irc106_pcu("Car"), 1.0)

        # Full mixed composition test
        pcu = calculate_irc106_pcu(
            counts_2w=10,      # 5.0
            counts_3w=5,       # 6.0
            counts_4w=10,      # 10.0
            counts_bus=2,      # 4.4
            counts_truck=1,    # 2.2
            counts_lcv=2,      # 2.8
            counts_tractor=1,  # 4.0
            counts_cycle=4,    # 2.0
            counts_cart=2      # 3.0
        )
        # Expected = 5.0 + 6.0 + 10.0 + 4.4 + 2.2 + 2.8 + 4.0 + 2.0 + 3.0 = 39.4
        self.assertEqual(pcu, 39.4)

    def test_12_ground_truth_model_metrics_matrix(self):
        """Verify exposure of empirical training metrics matrix for all 5 verified weights."""
        # 1. Learning status endpoint
        res_ls = client.get("/api/learning/status")
        self.assertEqual(res_ls.status_code, 200)
        ls_data = res_ls.json()
        self.assertIn("ground_truth_models", ls_data)
        models = {m["weight_file"]: m for m in ls_data["ground_truth_models"]}
        self.assertIn("zebra.pt", models)
        self.assertEqual(models["zebra.pt"]["map_50"], 0.993)
        self.assertIn("anpr.pt", models)
        self.assertEqual(models["anpr.pt"]["map_50"], 0.693)
        self.assertIn("potholedetection.pt", models)
        self.assertEqual(models["potholedetection.pt"]["map_50"], 0.471)
        self.assertIn("vehicle_detection.pt", models)
        self.assertEqual(models["vehicle_detection.pt"]["map_50"], 0.404)
        self.assertIn("indian_roads_detection.pt", models)
        self.assertEqual(models["indian_roads_detection.pt"]["map_50"], 0.219)

        # Macro metrics
        self.assertIn("macro_metrics", ls_data)
        self.assertEqual(ls_data["macro_metrics"]["mean_map_50"], 0.556)

        # 2. Models status endpoint
        res_ms = client.get("/api/models/status")
        self.assertEqual(res_ms.status_code, 200)
        ms_data = res_ms.json()
        zebra_meta = ms_data["models"]["zebra_crossing_detector"]
        self.assertIsNotNone(zebra_meta.get("metrics"))
        self.assertEqual(zebra_meta["metrics"]["map_50"], 0.993)

if __name__ == "__main__":
    unittest.main()
