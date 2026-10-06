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
    Asserts vehicle ID deduplication: 3 passes originating from the same bus (BUS-01)
    yield distinct_buses_count = 1, remain AWAITING_CONCURRENCE, and reject invoice clearance.
    """
    passes = [
        {"bus_id": "BUS-01", "vertical_gz": 0.98, "optical_status": "SMOOTH_SURFACE", "timestamp": "2026-10-06T08:00:00Z"},
        {"bus_id": "BUS-01", "vertical_gz": 1.01, "optical_status": "SMOOTH_SURFACE", "timestamp": "2026-10-06T10:00:00Z"},
        {"bus_id": "BUS-01", "vertical_gz": 0.99, "optical_status": "SMOOTH_SURFACE", "timestamp": "2026-10-06T12:00:00Z"},
    ]
    result = evaluate_concurrence_passes(passes, order_id="WO-DIVERSITY-01")

    assert result.distinct_buses_count == 1
    assert result.status == "AWAITING_CONCURRENCE"
    assert result.invoice_clearance_authorized is False
    assert result.escrow_holdback_released is False
    assert len(result.passes) == 3


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
    assert result.escrow_holdback_released is True
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
