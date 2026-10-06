import re
import datetime
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.db_models import (
    Base, DBContractor, DBDistressCluster, DBContractorPenalty, 
    DBContractorDebarment, DBAuditLog, DBRepairAudit
)
from app.services.contractor_service import (
    calculate_clause14_penalty,
    evaluate_recurrence_window,
    check_within_36_month_dlp,
    generate_pfms_voucher_ref,
    compute_evidence_hash,
    find_recurrent_distress_cluster,
    execute_contractor_auto_debit,
)
from app.spatial.poi_database import haversine_distance_m


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


def test_tiered_penalty_formula():
    """Validates IRC:SP:20 Clause 14 tiered escalation: ₹25k (1st), ₹50k (2nd), ₹100k + GeM notice (3rd+)."""
    # 1st recurrence
    p1 = calculate_clause14_penalty(1)
    amt1, debar1 = p1
    assert amt1 == 25000.0
    assert debar1 is False
    assert p1 == 25000.0

    # 2nd recurrence
    p2 = calculate_clause14_penalty(2)
    amt2, debar2 = p2
    assert amt2 == 50000.0
    assert debar2 is False
    assert p2 == 50000.0

    # 3rd recurrence (debarment trigger)
    p3 = calculate_clause14_penalty(3)
    amt3, debar3 = p3
    assert amt3 == 100000.0
    assert debar3 is True
    assert p3 == 100000.0

    # 4th+ recurrence
    p4 = calculate_clause14_penalty(4)
    amt4, debar4 = p4
    assert amt4 == 100000.0
    assert debar4 is True


def test_36_month_dlp_window_boundary():
    """Asserts exact day arithmetic at 1,095 days (36 months). 1,094 days is within; 1,096 days is expired."""
    base_date = datetime.datetime(2023, 1, 1, 10, 0, 0, tzinfo=datetime.timezone.utc)
    
    # 1,094 days -> within DLP
    date_1094 = base_date + datetime.timedelta(days=1094)
    assert evaluate_recurrence_window(base_date.isoformat(), date_1094.isoformat()) is True
    assert check_within_36_month_dlp(base_date.isoformat(), date_1094.isoformat()) is True

    # Exactly 1,095 days -> within DLP
    date_1095 = base_date + datetime.timedelta(days=1095)
    assert evaluate_recurrence_window(base_date.isoformat(), date_1095.isoformat()) is True

    # 1,096 days -> expired warranty
    date_1096 = base_date + datetime.timedelta(days=1096)
    assert evaluate_recurrence_window(base_date.isoformat(), date_1096.isoformat()) is False
    assert check_within_36_month_dlp(base_date.isoformat(), date_1096.isoformat()) is False


def test_15m_corridor_spatial_buffer(test_db):
    """Asserts defect within 15m corridor buffer matches closed cluster, while defect > 15m is treated as distinct."""
    # Seed a resolved cluster in Guindy
    cluster_lat, cluster_lng = 13.0067, 80.2030
    cluster = DBDistressCluster(
        id="cluster-test-01",
        cluster_code="WO-TEST-01",
        defect_type="pothole",
        defect_name="Recurrent Pothole",
        severity_level="high",
        rpi_score=85.0,
        pass_count=3,
        road_name="Guindy Kathipara Grade Interchange",
        classification="Arterial Highway",
        assigned_agency="L&T Highways Infra Ltd",
        status="resolved",
        lat=cluster_lat,
        lng=cluster_lng,
        updated_at="2026-05-01T00:00:00Z"
    )
    test_db.add(cluster)
    test_db.commit()

    # Offset ~8.5m north: (8.5 / 111,320) degrees lat ≈ 0.0000763 deg
    near_lat = cluster_lat + 0.0000763
    near_lng = cluster_lng
    dist_near = haversine_distance_m(cluster_lat, cluster_lng, near_lat, near_lng)
    assert 8.0 <= dist_near <= 9.0

    match_near = find_recurrent_distress_cluster(
        lat=near_lat,
        lng=near_lng,
        detection_time_iso="2026-06-01T00:00:00Z",
        db=test_db,
        buffer_meters=15.0
    )
    assert match_near is not None
    assert match_near.cluster_code == "WO-TEST-01"

    # Offset ~22m east: (22.0 / (111,320 * cos(13°))) degrees lng ≈ 0.000203 deg
    far_lat = cluster_lat
    far_lng = cluster_lng + 0.000203
    dist_far = haversine_distance_m(cluster_lat, cluster_lng, far_lat, far_lng)
    assert dist_far > 15.0

    match_far = find_recurrent_distress_cluster(
        lat=far_lat,
        lng=far_lng,
        detection_time_iso="2026-06-01T00:00:00Z",
        db=test_db,
        buffer_meters=15.0
    )
    assert match_far is None


def test_escrow_deduction_and_cap(test_db):
    """Asserts auto-debit deducts from security escrow and non-negative clamping caps balance at 0."""
    # Seed contractor with small security deposit (₹50,000)
    contractor = DBContractor(
        id="CTR-TEST-01",
        name="Small Scale Pavements Pvt Ltd",
        cin="U45200TN2022PTC123456",
        director="Er. S. Kumar",
        assigned_corridor="Teynampet Arterial Link",
        zone="Zone 9",
        security_deposit_inr=50000.0,
        penalties_deducted_inr=0.0,
        active_work_orders=2,
        resolved_work_orders=3,
        breached_work_orders=0,
        on_time_sla_pct=100.0,
        quality_score_pct=100.0,
        compaction_density_gcm3=2.35,
        debarment_risk="Low",
        created_at="2026-01-01T00:00:00Z",
        updated_at="2026-01-01T00:00:00Z"
    )
    cluster = DBDistressCluster(
        id="cluster-test-cap",
        cluster_code="WO-TEST-CAP",
        defect_type="pothole",
        defect_name="Recurrent Void",
        severity_level="critical",
        rpi_score=92.0,
        road_name="Teynampet Arterial Link",
        classification="Arterial Highway",
        assigned_agency="Small Scale Pavements Pvt Ltd",
        contractor_id="CTR-TEST-01",
        status="resolved",
        lat=13.0400,
        lng=80.2500
    )
    test_db.add(contractor)
    test_db.add(cluster)
    test_db.commit()

    # 1st auto-debit: ₹25,000
    p1 = execute_contractor_auto_debit(test_db, cluster, measured_gz=1.52, bus_id="BUS-TEST-01")
    assert p1.penalty_amount_inr == 25000.0
    assert contractor.penalties_deducted_inr == 25000.0
    remaining1 = max(0.0, contractor.security_deposit_inr - contractor.penalties_deducted_inr)
    assert remaining1 == 25000.0
    assert contractor.debarment_risk == "Low"

    # 2nd auto-debit: ₹50,000 (total deductions = 75,000 > 50,000 deposit)
    p2 = execute_contractor_auto_debit(test_db, cluster, measured_gz=1.65, bus_id="BUS-TEST-02")
    assert p2.penalty_amount_inr == 50000.0
    assert contractor.penalties_deducted_inr == 75000.0
    remaining2 = max(0.0, contractor.security_deposit_inr - contractor.penalties_deducted_inr)
    assert remaining2 == 0.0  # Clamped at 0 (never negative)
    # Debarment risk should now be critical because balance < 20%
    assert contractor.debarment_risk == "Critical Debarment Warning"


def test_pfms_txn_ref_format():
    """Validates CAG-compliant PFMS voucher reference regex and SHA-256 evidence hash length."""
    dt = datetime.datetime(2026, 10, 6, 15, 30, 0, tzinfo=datetime.timezone.utc)
    voucher = generate_pfms_voucher_ref(dt)
    
    # Must match PFMS/DLP-ESCROW/{YYYY}/{MMDD}-{HEX6}
    pattern = r"^PFMS/DLP-ESCROW/\d{4}/\d{4}-[A-F0-9]{6}$"
    assert re.match(pattern, voucher) is not None
    assert voucher.startswith("PFMS/DLP-ESCROW/2026/1006-")

    # Evidence hash must be exactly 64 hexadecimal characters
    cin = "U45203TN2001PLC047123"
    cluster_code = "WO-0001"
    amount = 25000.0
    iso_time = "2026-10-06T15:30:00Z"
    evidence_hash = compute_evidence_hash(cin, cluster_code, amount, iso_time)
    assert len(evidence_hash) == 64
    assert re.match(r"^[a-f0-9]{64}$", evidence_hash) is not None


# ── REST API Endpoint Tests ──────────────────────────────────────────────────

@pytest.fixture
def client():
    from fastapi.testclient import TestClient
    from app.main import app
    from app.storage.database import init_db
    init_db()
    with TestClient(app) as test_client:
        yield test_client


def test_get_contractor_ledger(client):
    """Asserts GET /api/contractors/ledger returns 200 and list of municipal contractors with valid balance sheets."""
    res = client.get("/api/contractors/ledger")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 3

    # Check first contractor schema
    c1 = next((c for c in data if c["id"] == "CTR-01"), None)
    assert c1 is not None
    assert c1["name"] == "L&T Highways Infra Ltd"
    assert "cin" in c1
    assert c1["security_deposit_inr"] == 5000000.0
    assert c1["remaining_deposit_inr"] >= 0.0
    assert c1["remaining_deposit_inr"] <= c1["security_deposit_inr"]
    assert c1["debarment_risk"] in ("Low", "Medium", "Critical Debarment Warning")


def test_get_contractor_penalties(client):
    """Asserts GET /api/contractors/penalties returns 200 and list of statutory penalty dockets."""
    res = client.get("/api/contractors/penalties")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)

    if len(data) > 0:
        item = data[0]
        assert "contractor_name" in item
        assert "cluster_code" in item
        assert "penalty_amount_inr" in item
        assert "statutory_clause" in item
        assert "status" in item

    # Test filter by contractor_id
    res_filtered = client.get("/api/contractors/penalties?contractor_id=CTR-01")
    assert res_filtered.status_code == 200


def test_get_contractor_escrow(client):
    """Asserts GET /api/contractors/CTR-01/escrow returns 200 with matching initial and remaining balance."""
    res = client.get("/api/contractors/CTR-01/escrow")
    assert res.status_code == 200
    data = res.json()
    assert data["contractor_id"] == "CTR-01"
    assert data["contractor_name"] == "L&T Highways Infra Ltd"
    assert data["initial_deposit_inr"] == 5000000.0
    assert data["remaining_deposit_inr"] == max(0.0, data["initial_deposit_inr"] - data["penalties_deducted_inr"])
    assert isinstance(data["holdback_releases"], list)
    assert isinstance(data["settlements"], list)

    # 404 for unknown contractor
    res_404 = client.get("/api/contractors/CTR-NONEXISTENT/escrow")
    assert res_404.status_code == 404


def test_post_auto_debit_endpoint(client):
    """Submits POST /api/contractors/penalties/auto-debit; asserts 200, valid PFMS voucher, and deduction."""
    from app.storage.database import SessionLocal
    from app.models.db_models import DBDistressCluster

    # Ensure a target cluster exists
    db = SessionLocal()
    try:
        cluster = db.query(DBDistressCluster).first()
        assert cluster is not None, "At least one cluster should exist in seeded database"
        cluster_code = cluster.cluster_code
    finally:
        db.close()

    payload = {
        "cluster_code": cluster_code,
        "measured_gz": 1.54,
        "patrol_bus_id": "BUS-TN01-1042",
        "notes": "Automated recurrence shock test pass"
    }

    res = client.post("/api/contractors/penalties/auto-debit", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["cluster_code"] == cluster_code
    assert data["penalty_amount_inr"] in (25000.0, 50000.0, 100000.0)
    assert re.match(r"^PFMS/DLP-ESCROW/\d{4}/\d{4}-[A-F0-9]{6}$", data["pfms_txn_ref"]) is not None
    assert len(data["evidence_sha256"]) == 64
    assert data["remaining_deposit_inr"] >= 0.0


def test_debarments_endpoint(client):
    """Asserts GET /api/contractors/debarments returns 200 and schema with debarred agencies."""
    res = client.get("/api/contractors/debarments")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    if len(data) > 0:
        deb = data[0]
        assert "contractor_name" in deb
        assert "debarment_status" in deb
        assert "gem_portal_reference" in deb

