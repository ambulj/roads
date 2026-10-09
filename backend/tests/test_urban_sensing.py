"""
================================================================================
  RoadSaathi Urban Sensing & Missing Infrastructure Perception Test Battery
================================================================================
  Validates Task 4 (17-01-04) requirements:
  1. Missing infrastructure schemas, ingest & statutory IRC standards.
  2. Waterlogging hazard metrics & Drainage Failure Index (DFI).
  3. Vision Zero school zone safety evaluation & statutory speed enforcement.
  4. Hit-and-run behavioral anomaly detection, ANPR read & PCR dispatch.
  5. 5Hz edge telemetry streaming bandwidth cap (<2.0 KB/s) & event snapshots.
  6. Infrastructure clusters query & category-based filtering.
================================================================================
"""

import json
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.storage.database import init_db
from app.core.auth import create_access_token


@pytest.fixture(scope="module")
def client():
    """Initializes SQLite database and returns a module-scoped TestClient."""
    init_db()
    with TestClient(app) as test_client:
        yield test_client


def test_missing_infrastructure_schema_and_ingest(client):
    """
    Ingests MISSING_ROAD_DIVIDER, MISSING_ZEBRA_CROSSING, DAMAGED_TRAFFIC_SIGN,
    and WATERLOGGING_HAZARD. Validates persistence, IRC standard mapping, and response fields.
    """
    # 1. Missing Road Divider -> IRC:SP:84
    payload_divider = {
        "defect_type": "MISSING_ROAD_DIVIDER",
        "road_name": "GST Road Arterial near Kathipara",
        "lat": 13.0070,
        "lng": 80.2030,
        "field_notes": "Continuous median discontinuity gap > 5m",
        "severity_level": "critical",
        "reporting_bus_id": "BUS-TN01-1042",
        "camera_position": "FRONT_WINDSHIELD",
        "channel": 1
    }
    res_div = client.post("/api/clusters/infrastructure/ingest", json=payload_divider)
    assert res_div.status_code == 200, res_div.text
    data_div = res_div.json()
    assert data_div["defect_type"] == "MISSING_ROAD_DIVIDER"
    assert data_div["irc_standard"] == "IRC:SP:84"
    assert "cl-infra-" in data_div["id"]

    # 2. Missing Zebra Crossing -> IRC:35:2015
    payload_zc = {
        "defect_type": "MISSING_ZEBRA_CROSSING",
        "road_name": "Avvai Shanmugam Salai fronting D.A.V. School",
        "lat": 13.0480,
        "lng": 80.2580,
        "field_notes": "No pedestrian crossing markings fronting school gate",
        "severity_level": "critical"
    }
    res_zc = client.post("/api/clusters/infrastructure/ingest", json=payload_zc)
    assert res_zc.status_code == 200, res_zc.text
    data_zc = res_zc.json()
    assert data_zc["defect_type"] == "MISSING_ZEBRA_CROSSING"
    assert data_zc["irc_standard"] == "IRC:35:2015"

    # 3. Damaged Traffic Sign -> IRC:67:2022
    payload_sign = {
        "defect_type": "DAMAGED_TRAFFIC_SIGN",
        "road_name": "Anna Salai near Guindy Flyover",
        "lat": 13.0100,
        "lng": 80.2100,
        "field_notes": "Regulatory Stop sign bent and facing away from oncoming traffic",
        "severity_level": "high"
    }
    res_sign = client.post("/api/clusters/infrastructure/ingest", json=payload_sign)
    assert res_sign.status_code == 200, res_sign.text
    data_sign = res_sign.json()
    assert data_sign["defect_type"] == "DAMAGED_TRAFFIC_SIGN"
    assert data_sign["irc_standard"] == "IRC:67:2022"

    # 4. Waterlogging Hazard -> IRC:SP:42 with depth, area, and DFI
    payload_water = {
        "defect_type": "WATERLOGGING_HAZARD",
        "road_name": "Chromepet Underpass Subway",
        "lat": 12.9520,
        "lng": 80.1410,
        "water_depth_cm": 14.5,
        "surface_area_m2": 35.0,
        "severity_level": "critical"
    }
    res_water = client.post("/api/clusters/infrastructure/ingest", json=payload_water)
    assert res_water.status_code == 200, res_water.text
    data_water = res_water.json()
    assert data_water["defect_type"] == "WATERLOGGING_HAZARD"
    assert data_water["irc_standard"] == "IRC:SP:42"
    assert data_water["water_depth_cm"] == 14.5
    assert data_water["surface_area_m2"] == 35.0
    assert round(data_water["drainage_failure_index"], 2) in (5.07, 5.08)


def test_waterlogging_hazard_aquaplaning_index(client):
    """
    Validates mathematical computation of Drainage Failure Index DFI = (depth_cm * area_m2) / 100
    and IRC:SP:42 aquaplaning hazard standard.
    """
    depth = 8.5
    area = 45.0
    expected_dfi = round((depth * area) / 100.0, 2)  # 3.83

    payload = {
        "defect_type": "WATERLOGGING_HAZARD",
        "road_name": "Velachery 100 Feet Road",
        "lat": 12.9780,
        "lng": 80.2180,
        "water_depth_cm": depth,
        "surface_area_m2": area,
        "severity_level": "critical"
    }
    res = client.post("/api/clusters/infrastructure/ingest", json=payload)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["irc_standard"] == "IRC:SP:42"
    assert round(data["drainage_failure_index"], 2) == expected_dfi
    assert data["severity_level"] == "critical"

    # Test extreme depth (depth > 15 cm)
    payload_deep = {
        "defect_type": "WATERLOGGING_HAZARD",
        "road_name": "Manapakkam Underpass Low Point",
        "lat": 13.0180,
        "lng": 80.1780,
        "water_depth_cm": 22.0,
        "surface_area_m2": 60.0
    }
    res_deep = client.post("/api/clusters/infrastructure/ingest", json=payload_deep)
    assert res_deep.status_code == 200, res_deep.text
    data_deep = res_deep.json()
    assert data_deep["drainage_failure_index"] == 13.2
    assert data_deep["severity_level"] == "critical"


def test_school_zone_safety_evaluation_and_speed_violation(client):
    """
    Evaluates pedestrian safety within 150m of school POI.
    Asserts:
    1. Distance < 150m activates school zone.
    2. Speed > 20 km/h triggers speed violation and P0 alert.
    3. Vision Zero guarantee: fine_amount_inr == 0.0 (zero pedestrian fine).
    4. DBTrafficIncident record created with status == ACTIVE_ALERT.
    """
    # Coordinate within 150m of D.A.V. Senior Secondary School (lat: 13.0450, lng: 80.2380)
    payload = {
        "lat": 13.0453,
        "lng": 80.2383,
        "speed_kmh": 34.5,
        "children_detected": True,
        "has_zebra_crossing": False,
        "pedestrians_count": 4,
        "reporting_bus_id": "BUS-TN01-1042"
    }
    res = client.post("/api/pedestrian/school-zones/evaluate", json=payload)
    assert res.status_code == 200, res.text
    data = res.json()

    assert data["is_in_school_zone"] is True
    assert data["distance_m"] < 150.0
    assert data["is_speed_violation"] is True
    assert data["speed_limit_kmh"] == 20.0
    assert data["alert_triggered"] is True
    assert data["fine_amount_inr"] == 0.0  # Vision Zero pedestrian protection guarantee
    assert data["driver_yield_mandate"] is True
    assert data["incident_status"] == "ACTIVE_ALERT"
    assert data["incident_id"] is not None


def test_hit_and_run_behavioral_anomaly_and_anpr_dispatch(client):
    """
    Simulates collision impact and speed evasion, ANPR plate recognition (>=90%),
    and officer dispatch of PCR interceptor unit + e-Challan generation.
    """
    # 1. Log incident
    inc_payload = {
        "reporting_bus_id": "BUS-TN01-1042",
        "incident_type": "HIT_AND_RUN",
        "plate_number": "TN09CB4412",
        "plate_confidence": 0.964,
        "vehicle_color": "Silver",
        "vehicle_class": "SUV",
        "target_speed_kmh": 62.5,
        "road_name": "Anna Salai (Mount Road)",
        "lat": 13.0067,
        "lng": 80.2030,
        "description": "Collision impact shock Gz=2.45g followed by speed jump from 28.0 to 62.5 km/h"
    }
    res_create = client.post("/api/incidents", json=inc_payload)
    assert res_create.status_code == 200, res_create.text
    inc_data = res_create.json()
    inc_id = inc_data["id"]
    assert inc_data["status"] == "ACTIVE_ALERT"
    assert inc_data["plate_number"] == "TN09CB4412"
    assert inc_data["plate_confidence"] == 0.964

    # 2. Officer / Admin Token for Dispatch
    token = create_access_token({"sub": "admin", "name": "Super Administrator", "role": "admin"})
    headers = {"Authorization": f"Bearer {token}"}

    dispatch_payload = {
        "target_pcr_unit": "PCR-14",
        "channel": "ALL",
        "priority": "HIGH"
    }
    res_disp = client.post(f"/api/incidents/{inc_id}/dispatch", json=dispatch_payload, headers=headers)
    assert res_disp.status_code == 200, res_disp.text
    disp_data = res_disp.json()
    assert disp_data["success"] is True
    summary = disp_data["dispatch_summary"]
    assert summary["target_pcr_unit"] == "PCR-14"
    assert summary["status"] == "DISPATCHED"
    assert "ECH-" in summary["echallan_id"]


def test_edge_telemetry_bandwidth_and_event_snapshot(client):
    """
    Verifies 5Hz telemetry streaming bandwidth throughput (< 2.0 KB/s constraint)
    and 200KB event snapshot keyframe upload endpoint.
    """
    # 1. 5Hz Telemetry Stream
    telemetry_payload = {
        "bus_id": "BUS-TN01-1042",
        "camera_channel": "CAM-01 Front",
        "channel_id": 1,
        "gps": {
            "lat": 12.9850,
            "lng": 80.1650,
            "speed_kmh": 38.5,
            "heading": 182.0
        },
        "traffic": {
            "vehicle_count": 42,
            "pcu_per_km": 142.5
        },
        "imu": {
            "gz": 1.02,
            "axle_shock_delta": 0.08
        }
    }
    res_stream = client.post("/api/traffic/edge/telemetry-stream", json=telemetry_payload)
    assert res_stream.status_code == 200, res_stream.text
    stream_data = res_stream.json()
    assert stream_data["payload_bytes"] <= 280
    assert stream_data["kb_per_sec"] < 2.0
    assert stream_data["bandwidth_ok"] is True
    assert stream_data["status"] == "ACK"

    # 2. Keyframe Event Snapshot (200KB mock payload)
    mock_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=" * 3000
    snapshot_payload = {
        "bus_id": "BUS-TN01-1042",
        "channel_id": 1,
        "timestamp": "2026-10-09T23:45:00Z",
        "event_type": "WATERLOGGING_HAZARD",
        "image_base64": mock_base64,
        "associated_id": "cl-infra-04"
    }
    res_snap = client.post("/api/traffic/edge/event-snapshot", json=snapshot_payload)
    assert res_snap.status_code == 200, res_snap.text
    snap_data = res_snap.json()
    assert snap_data["status"] == "STORED"
    assert "image_url" in snap_data
    assert snap_data["associated_id"] == "cl-infra-04"


def test_infrastructure_clusters_query_and_filtering(client):
    """
    Validates GET /api/clusters/infrastructure category query filtering:
    DIVIDERS, ZEBRA_CROSSINGS, SIGNS, WATERLOGGING, and ALL.
    """
    # 1. ALL categories
    res_all = client.get("/api/clusters/infrastructure?category=ALL")
    assert res_all.status_code == 200, res_all.text
    all_clusters = res_all.json()
    assert isinstance(all_clusters, list)
    assert len(all_clusters) >= 4

    # 2. DIVIDERS
    res_div = client.get("/api/clusters/infrastructure?category=DIVIDERS")
    assert res_div.status_code == 200, res_div.text
    dividers = res_div.json()
    assert len(dividers) >= 1
    for item in dividers:
        assert item["defect_type"] in ["MISSING_ROAD_DIVIDER", "MISSING_DIVIDER"]

    # 3. ZEBRA_CROSSINGS
    res_zc = client.get("/api/clusters/infrastructure?category=ZEBRA_CROSSINGS")
    assert res_zc.status_code == 200, res_zc.text
    crossings = res_zc.json()
    assert len(crossings) >= 1
    for item in crossings:
        assert item["defect_type"] in ["MISSING_ZEBRA_CROSSING", "ZEBRA_CROSSING", "FADED_CROSSING"]

    # 4. SIGNS
    res_signs = client.get("/api/clusters/infrastructure?category=SIGNS")
    assert res_signs.status_code == 200, res_signs.text
    signs = res_signs.json()
    assert len(signs) >= 1
    for item in signs:
        assert item["defect_type"] in ["DAMAGED_TRAFFIC_SIGN", "MISSING_SIGN"]

    # 5. WATERLOGGING
    res_water = client.get("/api/clusters/infrastructure?category=WATERLOGGING")
    assert res_water.status_code == 200, res_water.text
    waterlogs = res_water.json()
    assert len(waterlogs) >= 1
    for item in waterlogs:
        assert item["defect_type"] in ["WATERLOGGING_HAZARD", "WATERLOGGING"]
        assert item["water_depth_cm"] is not None
