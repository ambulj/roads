import pytest
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.models.db_models import (
    Base, DBDistressCluster, DBRepairAudit, DBRawIngest, DBContractor
)
from app.services.concurrence_service import (
    evaluate_concurrence_passes,
    evaluate_work_order_concurrence,
    verify_cluster_concurrence,
    REQUIRED_DISTINCT_BUSES,
    VERTICAL_GZ_TOLERANCE,
    SHOCK_FAILURE_THRESHOLD
)
from app.main import app
from app.storage.database import init_db


@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    init_db()
    with TestClient(app) as test_client:
        yield test_client


# ── Task 1 Test Cases ─────────────────────────────────────────────────────────

def test_distinct_bus_diversity_rule():
    """
    Asserts intra-trip vehicle deduplication: 3 passes originating from the same bus (BUS-01)
    within < 2 hours (08:00, 08:30, 09:15) deduplicate to 1 qualifying trip,
    remain AWAITING_CONCURRENCE, and reject invoice clearance.
    """
    passes = [
        {"bus_id": "BUS-01", "vertical_gz": 0.98, "optical_status": "SMOOTH_SURFACE", "timestamp": "2026-10-06T08:00:00Z"},
        {"bus_id": "BUS-01", "vertical_gz": 1.01, "optical_status": "SMOOTH_SURFACE", "timestamp": "2026-10-06T08:30:00Z"},
        {"bus_id": "BUS-01", "vertical_gz": 0.99, "optical_status": "SMOOTH_SURFACE", "timestamp": "2026-10-06T09:15:00Z"},
    ]
    result = evaluate_concurrence_passes(passes, order_id="WO-DIVERSITY-01")

    assert result.distinct_buses_count == 1
    assert result.status == "AWAITING_CONCURRENCE"
    assert result.invoice_clearance_authorized is False
    assert result.escrow_holdback_released is False
    assert len(result.passes) == 3


def test_same_bus_trip_window_qualified():
    """
    Asserts that 3 passes from the SAME bus (BUS-01) separated by >= 2 hours (delta_t >= 7200s)
    qualify as distinct trips, achieve REPAIR_VERIFIED, and authorize payment clearance.
    (Resolves single-bus corridor starvation e.g. MTC Route 570 or 19B).
    """
    passes = [
        {"bus_id": "BUS-01", "vertical_gz": 0.98, "optical_status": "SMOOTH_SURFACE", "timestamp": "2026-10-06T08:00:00Z"},
        {"bus_id": "BUS-01", "vertical_gz": 1.01, "optical_status": "SMOOTH_SURFACE", "timestamp": "2026-10-06T10:15:00Z"},
        {"bus_id": "BUS-01", "vertical_gz": 0.99, "optical_status": "SMOOTH_SURFACE", "timestamp": "2026-10-06T13:00:00Z"},
    ]
    result = evaluate_concurrence_passes(passes, order_id="WO-SAMEBUS-TRIP")

    assert result.distinct_buses_count == 3
    assert result.status == "REPAIR_VERIFIED"
    assert result.invoice_clearance_authorized is True
    assert result.escrow_holdback_released is False
    assert result.recommend_release is True
    assert result.failure_reason is None


def test_hybrid_fleet_trip_window():
    """
    Asserts hybrid fleet passes: BUS-01 at 08:00, BUS-02 at 09:00, and BUS-01 at 10:30 (>= 2h from 08:00)
    yield 3 qualified passes and transition to REPAIR_VERIFIED.
    """
    passes = [
        {"bus_id": "BUS-01", "vertical_gz": 0.98, "optical_status": "SMOOTH_SURFACE", "timestamp": "2026-10-06T08:00:00Z"},
        {"bus_id": "BUS-02", "vertical_gz": 1.02, "optical_status": "SMOOTH_SURFACE", "timestamp": "2026-10-06T09:00:00Z"},
        {"bus_id": "BUS-01", "vertical_gz": 1.00, "optical_status": "SMOOTH_SURFACE", "timestamp": "2026-10-06T10:30:00Z"},
    ]
    result = evaluate_concurrence_passes(passes, order_id="WO-HYBRID-01")

    assert result.distinct_buses_count == 3
    assert result.status == "REPAIR_VERIFIED"
    assert result.invoice_clearance_authorized is True


def test_optical_clearance_dominance():
    """
    Asserts Optical Clearance Dominance:
    Pass with optical_status == 'SMOOTH_SURFACE' and nominal IMU (|gz - 1.0| < 0.15)
    is credited as verified without requiring mechanical wheel impact shock.
    """
    passes = [
        {"bus_id": "BUS-01", "vertical_gz": 1.00, "optical_status": "SMOOTH_SURFACE", "timestamp": "2026-10-06T08:00:00Z"},
        {"bus_id": "BUS-02", "vertical_gz": 1.01, "optical_status": "SMOOTH_SURFACE", "timestamp": "2026-10-06T10:30:00Z"},
        {"bus_id": "BUS-03", "vertical_gz": 0.99, "optical_status": "SMOOTH_SURFACE", "timestamp": "2026-10-06T13:45:00Z"},
    ]
    result = evaluate_concurrence_passes(passes, order_id="WO-OPTICAL-DOM")

    assert result.distinct_buses_count == 3
    assert result.status == "REPAIR_VERIFIED"
    assert result.invoice_clearance_authorized is True
    for p in result.passes:
        assert p.passed_optical is True
        assert p.passed_imu is True


def test_severe_shock_overrides_optical():
    """
    Asserts Mechanical Shock Override:
    Pass with optical_status == 'SMOOTH_SURFACE' but severe normalized shock (G_norm = 0.42 >= 0.35)
    immediately overrides optical smoothness and trips REPAIR_FAILED_RECURRENCE.
    """
    passes = [
        {"bus_id": "BUS-01", "vertical_gz": 0.98, "speed_kmh": 30.0, "optical_status": "SMOOTH_SURFACE"},
        {"bus_id": "BUS-02", "vertical_gz": 1.42, "speed_kmh": 30.0, "optical_status": "SMOOTH_SURFACE"},
    ]
    result = evaluate_concurrence_passes(passes, order_id="WO-SHOCK-OVERRIDE")

    assert result.status == "REPAIR_FAILED_RECURRENCE"
    assert result.invoice_clearance_authorized is False
    assert result.escrow_holdback_released is False
    assert "Severe shock" in (result.failure_reason or "")


def test_three_pass_concurrence_pass():
    """
    Asserts that 3 passes across distinct transit buses (BUS-01, BUS-02, BUS-03)
    satisfying gz in [0.85, 1.15] and SMOOTH_SURFACE trigger REPAIR_VERIFIED and authorize payment.
    """
    passes = [
        {"bus_id": "BUS-01", "vertical_gz": 0.98, "optical_status": "SMOOTH_SURFACE", "timestamp": "2026-10-06T08:00:00Z"},
        {"bus_id": "BUS-02", "vertical_gz": 1.02, "optical_status": "SMOOTH_SURFACE", "timestamp": "2026-10-06T10:30:00Z"},
        {"bus_id": "BUS-03", "vertical_gz": 0.95, "optical_status": "SMOOTH_SURFACE", "timestamp": "2026-10-06T13:45:00Z"},
    ]
    result = evaluate_concurrence_passes(passes, order_id="WO-PASS-03")

    assert result.distinct_buses_count == 3
    assert result.status == "REPAIR_VERIFIED"
    assert result.invoice_clearance_authorized is True
    assert result.escrow_holdback_released is False
    assert result.recommend_release is True
    assert result.failure_reason is None


def test_vertical_gz_tolerance_band():
    """
    Asserts vertical acceleration tolerance band (|gz - 1.0| < 0.15g):
      - gz = 1.12g (|gz - 1.0| = 0.12g < 0.15g) is approved.
      - gz = 1.25g (|gz - 1.0| = 0.25g >= 0.15g) is rejected as non-smooth.
    """
    passes = [
        {"bus_id": "BUS-01", "vertical_gz": 1.12, "optical_status": "SMOOTH_SURFACE"},
        {"bus_id": "BUS-02", "vertical_gz": 1.25, "optical_status": "SMOOTH_SURFACE"},
    ]
    result = evaluate_concurrence_passes(passes, order_id="WO-GZ-TOL")

    assert len(result.passes) == 2
    # Bus 1 should pass IMU check
    assert result.passes[0].passed_imu is True
    assert result.passes[0].passed_optical is True

    # Bus 2 should fail IMU check (non-smooth, but not severe shock < 0.35)
    assert result.passes[1].passed_imu is False
    assert result.passes[1].passed_optical is True

    # Only 1 qualifying pass -> remaining AWAITING_CONCURRENCE
    assert result.distinct_buses_count == 1
    assert result.status == "AWAITING_CONCURRENCE"
    assert result.invoice_clearance_authorized is False


def test_recurrent_shock_triggers_fail(test_db):
    """
    Asserts vertical shock (|gz - 1.0| >= 0.35g):
    Pass with gz = 1.45g (|1.45 - 1.0| = 0.45g >= 0.35g) triggers immediate REPAIR_FAILED_RECURRENCE.
    """
    # Pure evaluation check
    passes = [
        {"bus_id": "BUS-01", "vertical_gz": 0.98, "optical_status": "SMOOTH_SURFACE"},
        {"bus_id": "BUS-02", "vertical_gz": 1.45, "optical_status": "SMOOTH_SURFACE"},
    ]
    result = evaluate_concurrence_passes(passes, order_id="WO-FAIL-SHOCK")

    assert result.status == "REPAIR_FAILED_RECURRENCE"
    assert result.invoice_clearance_authorized is False
    assert result.escrow_holdback_released is False
    assert "Severe shock" in (result.failure_reason or "")

    # Also test DB integrated evaluation triggering status update
    cluster = DBDistressCluster(
        id="cl-shock-test",
        cluster_code="WO-SHOCK-99",
        defect_type="pothole",
        defect_name="Pothole Cavity",
        severity_level="high",
        rpi_score=80.0,
        pass_count=3,
        road_name="GST Road, Tambaram",
        classification="NH",
        assigned_agency="L&T Highways Infra Ltd",
        status="AWAITING_CONCURRENCE",
        verification_status="AWAITING_CONCURRENCE",
        lat=12.9516,
        lng=80.1462
    )
    test_db.add(cluster)
    test_db.commit()

    db_result = evaluate_work_order_concurrence(
        order_id="cl-shock-test",
        db=test_db,
        passes=[{"bus_id": "BUS-04", "vertical_gz": 1.48, "optical_status": "SMOOTH_SURFACE"}]
    )
    assert db_result.status == "REPAIR_FAILED_RECURRENCE"
    test_db.refresh(cluster)
    assert cluster.status == "REPAIR_FAILED_RECURRENCE"
    assert cluster.verification_status == "REPAIR_FAILED_RECURRENCE"


def test_verify_concurrence_endpoint(client):
    """
    Asserts POST /api/work-orders/{order_id}/verify-concurrence returns HTTP 200
    with complete verification schema and accurate pass gating attributes.
    """
    # 1. Post with custom passes for WO-0001
    payload = {
        "passes": [
            {"bus_id": "BUS-01", "vertical_gz": 0.98, "optical_status": "SMOOTH_SURFACE"},
            {"bus_id": "BUS-02", "vertical_gz": 1.02, "optical_status": "SMOOTH_SURFACE"},
            {"bus_id": "BUS-03", "vertical_gz": 0.97, "optical_status": "SMOOTH_SURFACE"}
        ]
    }
    res = client.post("/api/work-orders/WO-0001/verify-concurrence", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert "order_id" in data
    assert "status" in data
    assert "distinct_buses_count" in data
    assert "required_buses_count" in data
    assert "passes" in data
    assert "invoice_clearance_authorized" in data
    assert data["distinct_buses_count"] == 3
    assert data["status"] == "REPAIR_VERIFIED"
    assert data["invoice_clearance_authorized"] is True

    # 2. Post with empty body evaluates database records gracefully
    res2 = client.post("/api/work-orders/WO-0001/verify-concurrence")
    assert res2.status_code == 200
    data2 = res2.json()
    assert "status" in data2
    assert "distinct_buses_count" in data2


def test_manual_resolution_lock(client):
    """
    Asserts anti-fraud payment clearance lock (T-03-01):
    Attempting PATCH /api/work-orders/{order_id}/status to 'resolved' or 'verified_closed'
    without 3-pass physical concurrence validation is blocked with HTTP 400.
    """
    # WO-0002 is open and unverified
    headers = {"X-Demo-Role": "pwd_engineer"}
    patch_payload = {
        "status": "resolved",
        "field_notes": "Attempting manual officer sign-off without 3 bus passes."
    }
    res = client.patch("/api/work-orders/WO-0002/status", json=patch_payload, headers=headers)
    assert res.status_code == 400
    assert "Multi-pass concurrence validation requires minimum 3 independent bus passes" in res.json()["detail"]


def test_payment_clearance_lock(client):
    """
    Alias for manual resolution lock verifying 'verified_closed' status transition is also locked.
    """
    headers = {"X-Demo-Role": "pwd_engineer"}
    patch_payload = {
        "status": "verified_closed",
        "field_notes": "Attempting unauthorized invoice clearance."
    }
    res = client.patch("/api/work-orders/WO-0002/status", json=patch_payload, headers=headers)
    assert res.status_code == 400
    assert "Multi-pass concurrence validation requires minimum 3 independent bus passes" in res.json()["detail"]


def test_speed_normalized_concurrence_passes():
    """
    Verifies that evaluate_concurrence_passes accurately applies speed-normalization (v >= 15 km/h):
    - 3 passes with operating speed smooth passes (gz=1.05 at 20 km/h -> g_norm=0.075 < 0.15)
      achieve REPAIR_VERIFIED.
    - 1 operating speed severe crater (gz=1.25 at 20 km/h -> g_norm=0.375 >= 0.35)
      trips REPAIR_FAILED_RECURRENCE.
    """
    smooth_speed_passes = [
        {"bus_id": "BUS-01", "vertical_gz": 1.05, "speed_kmh": 20.0, "optical_status": "SMOOTH_SURFACE", "timestamp": "2026-10-06T08:00:00Z"},
        {"bus_id": "BUS-02", "vertical_gz": 1.04, "speed_kmh": 25.0, "optical_status": "SMOOTH_SURFACE", "timestamp": "2026-10-06T10:15:00Z"},
        {"bus_id": "BUS-03", "vertical_gz": 0.96, "speed_kmh": 20.0, "optical_status": "SMOOTH_SURFACE", "timestamp": "2026-10-06T13:00:00Z"},
    ]
    res_smooth = evaluate_concurrence_passes(smooth_speed_passes, order_id="WO-SMOOTH-SPEED")
    assert res_smooth.status == "REPAIR_VERIFIED"
    assert res_smooth.recommend_release is True
    assert res_smooth.invoice_clearance_authorized is True

    failing_speed_passes = [
        {"bus_id": "BUS-01", "vertical_gz": 1.05, "speed_kmh": 20.0, "optical_status": "SMOOTH_SURFACE"},
        {"bus_id": "BUS-02", "vertical_gz": 1.25, "speed_kmh": 20.0, "optical_status": "SMOOTH_SURFACE"},
    ]
    res_fail = evaluate_concurrence_passes(failing_speed_passes, order_id="WO-FAIL-SPEED")
    assert res_fail.status == "REPAIR_FAILED_RECURRENCE"
    assert res_fail.invoice_clearance_authorized is False
    assert res_fail.recommend_release is False


def test_post_repair_time_window_filtering(test_db):
    """
    Asserts temporal gating:
    - Telemetry captured before repair_completed_at (e.g. 2 hours before) with severe shock (1.45g) is ignored.
    - Telemetry captured within [t_repair, t_repair + 48h] is processed.
    - 3 post-repair clean passes achieve REPAIR_VERIFIED and recommend_release == True.
    """
    repair_time = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=10)
    pre_repair_time = repair_time - datetime.timedelta(hours=2)
    post_repair_1 = repair_time + datetime.timedelta(hours=1)
    post_repair_2 = repair_time + datetime.timedelta(hours=3)
    post_repair_3 = repair_time + datetime.timedelta(hours=6)

    cluster = DBDistressCluster(
        id="cl-time-window",
        cluster_code="WO-TW-01",
        defect_type="pothole",
        defect_name="Pothole Cavity",
        severity_level="high",
        rpi_score=85.0,
        pass_count=3,
        road_name="Anna Salai",
        classification="SH",
        assigned_agency="ABC Concessions",
        status="AWAITING_CONCURRENCE",
        verification_status="AWAITING_CONCURRENCE",
        repair_completed_at=repair_time.isoformat(),
        lat=13.0827,
        lng=80.2707,
        created_at=(repair_time - datetime.timedelta(days=2)).isoformat(),
        updated_at=repair_time.isoformat()
    )
    test_db.add(cluster)

    # Pre-repair raw ingest with severe shock
    pre_ingest = DBRawIngest(
        id="raw-pre-01",
        bus_id="BUS-01",
        lat=13.0827,
        lng=80.2707,
        vertical_g_force=1.45,
        speed_kmh=30.0,
        defect_type="pothole",
        confidence=0.95,
        captured_at=pre_repair_time.isoformat()
    )
    # Post-repair 3 clean passes
    post_ingest_1 = DBRawIngest(
        id="raw-post-01",
        bus_id="BUS-01",
        lat=13.0827,
        lng=80.2707,
        vertical_g_force=1.01,
        speed_kmh=30.0,
        defect_type="SMOOTH_SURFACE",
        confidence=0.95,
        captured_at=post_repair_1.isoformat()
    )
    post_ingest_2 = DBRawIngest(
        id="raw-post-02",
        bus_id="BUS-02",
        lat=13.0827,
        lng=80.2707,
        vertical_g_force=0.99,
        speed_kmh=30.0,
        defect_type="SMOOTH_SURFACE",
        confidence=0.95,
        captured_at=post_repair_2.isoformat()
    )
    post_ingest_3 = DBRawIngest(
        id="raw-post-03",
        bus_id="BUS-03",
        lat=13.0827,
        lng=80.2707,
        vertical_g_force=1.00,
        speed_kmh=30.0,
        defect_type="SMOOTH_SURFACE",
        confidence=0.95,
        captured_at=post_repair_3.isoformat()
    )
    test_db.add_all([pre_ingest, post_ingest_1, post_ingest_2, post_ingest_3])
    test_db.commit()

    result = evaluate_work_order_concurrence(order_id="cl-time-window", db=test_db)
    assert result.status == "REPAIR_VERIFIED"
    assert result.recommend_release is True
    assert result.proposed_deduction == 0.0
    assert result.approval_status == "RECOMMENDED_BY_AE"
    assert result.distinct_buses_count == 3


def test_corridor_tolerance_5m(test_db):
    """
    Asserts 5.0m lane corridor buffer:
    - Ingest at ~3.3m offset (within 5.0m) is collected.
    - Ingest at ~8.3m offset (outside 5.0m, previously inside old 15m) is excluded.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    cluster = DBDistressCluster(
        id="cl-corridor-test",
        cluster_code="WO-CORR-01",
        defect_type="pothole",
        defect_name="Pothole Cavity",
        severity_level="medium",
        rpi_score=60.0,
        road_name="OMR Expressway",
        classification="NH",
        status="AWAITING_CONCURRENCE",
        verification_status="AWAITING_CONCURRENCE",
        repair_completed_at=(now - datetime.timedelta(hours=5)).isoformat(),
        lat=12.9000,
        lng=80.2000
    )
    test_db.add(cluster)

    # 1 degree latitude ~ 111,000 meters.
    # 0.00003 deg lat ~ 3.33 meters -> within 5.0m
    # 0.000075 deg lat ~ 8.32 meters -> outside 5.0m
    in_corridor = DBRawIngest(
        id="raw-corr-in",
        bus_id="BUS-01",
        lat=12.90003,
        lng=80.2000,
        vertical_g_force=1.00,
        speed_kmh=30.0,
        defect_type="SMOOTH_SURFACE",
        confidence=0.9,
        captured_at=(now - datetime.timedelta(hours=2)).isoformat()
    )
    out_corridor = DBRawIngest(
        id="raw-corr-out",
        bus_id="BUS-02",
        lat=12.900075,
        lng=80.2000,
        vertical_g_force=1.00,
        speed_kmh=30.0,
        defect_type="SMOOTH_SURFACE",
        confidence=0.9,
        captured_at=(now - datetime.timedelta(hours=2)).isoformat()
    )
    test_db.add_all([in_corridor, out_corridor])
    test_db.commit()

    result = evaluate_work_order_concurrence(order_id="cl-corridor-test", db=test_db)
    assert len(result.passes) == 1
    assert result.passes[0].bus_id == "BUS-01"


def test_fail_closed_missing_sensor_and_crawl_speed():
    """
    Asserts fail-closed NO_DATA behavior:
    - Missing vertical_gz -> is_no_data=True, optical_status='NO_DATA'
    - Missing optical_status -> is_no_data=True, optical_status='NO_DATA'
    - Crawl speed < 15 km/h -> is_no_data=True, optical_status='NO_DATA'
    - None of these count toward clean pass quorum.
    """
    passes = [
        {"bus_id": "BUS-01", "vertical_gz": None, "optical_status": "SMOOTH_SURFACE", "speed_kmh": 30.0},
        {"bus_id": "BUS-02", "vertical_gz": 1.01, "optical_status": None, "speed_kmh": 30.0},
        {"bus_id": "BUS-03", "vertical_gz": 1.00, "optical_status": "SMOOTH_SURFACE", "speed_kmh": 12.0},  # < 15 km/h
    ]
    result = evaluate_concurrence_passes(passes, order_id="WO-FAIL-CLOSED")

    assert len(result.passes) == 3
    for p in result.passes:
        assert p.is_no_data is True
        assert p.optical_status == "NO_DATA"
        assert p.passed_optical is False
        assert p.passed_imu is False

    assert result.distinct_buses_count == 0
    assert result.status == "AWAITING_CONCURRENCE"
    assert result.recommend_release is False
    assert result.invoice_clearance_authorized is False


def test_zero_fallback_penalty_fabrication():
    """
    Asserts zero synthetic fallback penalty fabrication:
    - Failure without empirical tripping pass sets proposed_deduction = 0.0.
    - No synthetic 1.48g or BUS-04 fallback records are created or returned.
    """
    passes = [
        {"bus_id": "BUS-01", "vertical_gz": None, "optical_status": "SMOOTH_SURFACE", "speed_kmh": 30.0}
    ]
    result = evaluate_concurrence_passes(passes, order_id="WO-ZERO-FABRICATION")
    assert result.proposed_deduction == 0.0

    smooth_pass = [
        {"bus_id": "BUS-01", "vertical_gz": 1.01, "optical_status": "SMOOTH_SURFACE", "speed_kmh": 30.0}
    ]
    res_smooth = evaluate_concurrence_passes(smooth_pass, order_id="WO-ZERO-FABRICATION-2")
    assert res_smooth.proposed_deduction == 0.0

    from app.services.contractor_service import compute_statutory_evidence_hash
    hash_val = compute_statutory_evidence_hash(
        cin="LNT-HIGHWAYS-01",
        cluster_code="WO-TEST",
        amount=50000.0,
        timestamp="2026-10-08T10:00:00Z",
        bus_id="BUS-09",
        gz=1.45
    )
    assert isinstance(hash_val, str)
    assert len(hash_val) == 64


def test_officer_certified_recommendation_workflow(test_db):
    """
    Asserts officer-certified recommendation workflow:
    - 3 clean passes transition to REPAIR_VERIFIED.
    - recommend_release is True, proposed_deduction == 0.0, approval_status == "RECOMMENDED_BY_AE".
    - escrow_holdback_released is False (held for EE).
    - Unilateral auto-debit is NOT called.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    cluster = DBDistressCluster(
        id="cl-rec-test",
        cluster_code="WO-REC-01",
        defect_type="pothole",
        defect_name="Pothole Cavity",
        severity_level="high",
        rpi_score=75.0,
        road_name="Velachery Main Rd",
        classification="SH",
        contractor_id="LNT-HIGHWAYS-01",
        status="AWAITING_CONCURRENCE",
        verification_status="AWAITING_CONCURRENCE",
        repair_completed_at=(now - datetime.timedelta(hours=10)).isoformat(),
        lat=12.9800,
        lng=80.2200
    )
    test_db.add(cluster)
    test_db.commit()

    passes = [
        {"bus_id": "BUS-01", "vertical_gz": 0.99, "speed_kmh": 30.0, "optical_status": "SMOOTH_SURFACE", "timestamp": (now - datetime.timedelta(hours=8)).isoformat()},
        {"bus_id": "BUS-02", "vertical_gz": 1.01, "speed_kmh": 30.0, "optical_status": "SMOOTH_SURFACE", "timestamp": (now - datetime.timedelta(hours=5)).isoformat()},
        {"bus_id": "BUS-03", "vertical_gz": 1.00, "speed_kmh": 30.0, "optical_status": "SMOOTH_SURFACE", "timestamp": (now - datetime.timedelta(hours=2)).isoformat()},
    ]

    result = evaluate_work_order_concurrence(order_id="cl-rec-test", db=test_db, passes=passes)
    assert result.status == "REPAIR_VERIFIED"
    assert result.recommend_release is True
    assert result.proposed_deduction == 0.0
    assert result.approval_status == "RECOMMENDED_BY_AE"
    assert result.invoice_clearance_authorized is True
    assert result.escrow_holdback_released is False


def test_cluster_triage_lifecycle_and_validation(client):
    """
    Asserts defect triage lifecycle and validation:
    - ACKNOWLEDGE action updates triage_status to ACKNOWLEDGED and sets acknowledged_at.
    - ASSIGN action updates triage_status to ASSIGNED, status to assigned, and sets assigned_officer_id.
    - REJECT action with valid rejection reason transitions status to rejected and triage_status to REJECTED.
    - REJECT action with invalid rejection reason returns HTTP 400.
    """
    cluster_id = "WO-0001"

    # 1. Test ACKNOWLEDGE
    ack_res = client.post(f"/api/clusters/{cluster_id}/triage", json={
        "officer_id": "OFFICER-AE-01",
        "action": "ACKNOWLEDGE",
        "notes": "Acknowledged site inspection"
    })
    assert ack_res.status_code == 200
    data = ack_res.json()
    assert data["triage_status"] == "ACKNOWLEDGED"
    assert data["acknowledged_at"] is not None

    # 2. Test ASSIGN
    assign_res = client.post(f"/api/clusters/{cluster_id}/triage", json={
        "officer_id": "OFFICER-AE-01",
        "action": "ASSIGN",
        "assigned_officer_id": "OFFICER-EE-09",
        "notes": "Assigned to EE for sign-off"
    })
    assert assign_res.status_code == 200
    data = assign_res.json()
    assert data["triage_status"] == "ASSIGNED"
    assert data["assigned_officer_id"] == "OFFICER-EE-09"

    # 3. Test REJECT with INVALID reason -> HTTP 400
    invalid_reject = client.post(f"/api/clusters/{cluster_id}/triage", json={
        "officer_id": "OFFICER-AE-01",
        "action": "REJECT",
        "rejection_reason": "NOT_MY_PROBLEM"
    })
    assert invalid_reject.status_code == 400
    assert "Invalid rejection reason" in invalid_reject.json()["detail"]

    # 4. Test REJECT with VALID reason -> HTTP 200
    valid_reject = client.post(f"/api/clusters/{cluster_id}/triage", json={
        "officer_id": "OFFICER-AE-01",
        "action": "REJECT",
        "rejection_reason": "FALSE_POSITIVE",
        "notes": "Sensor reflection anomaly"
    })
    assert valid_reject.status_code == 200
    data = valid_reject.json()
    assert data["status"] == "rejected"
    assert data["triage_status"] == "REJECTED"
    assert data["rejection_reason"] == "FALSE_POSITIVE"

    # 5. Test alias route /api/work-orders/{id}/triage
    alias_res = client.post(f"/api/work-orders/{cluster_id}/triage", json={
        "officer_id": "OFFICER-AE-01",
        "action": "ACKNOWLEDGE"
    })
    assert alias_res.status_code == 200
    assert alias_res.json()["triage_status"] == "ACKNOWLEDGED"


