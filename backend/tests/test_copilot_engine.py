"""
================================================================================
  RoadSaathi Civic Copilot Test Battery
================================================================================
  Validates deterministic natural language query engine, intent routing,
  entity extraction, statutory Form 14 notice drafting, and sub-10ms performance.
================================================================================
"""

import re
import time
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.models.db_models import (
    Base, DBDistressCluster, DBContractor, DBContractorPenalty
)
from app.storage.database import init_db, SessionLocal
from app.services.copilot_engine import (
    copilot_engine,
    CopilotIntent,
    CopilotActionType,
    CopilotQueryRequest,
    CopilotQueryResponse,
)


@pytest.fixture
def client():
    init_db()
    with TestClient(app) as test_client:
        yield test_client


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


def test_copilot_health(client):
    """Asserts GET /api/copilot/health reports readiness, version 5.0.0, and 5 intents."""
    res = client.get("/api/copilot/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ready"
    assert data["version"] == "5.0.0"
    assert len(data["supported_intents"]) == 5
    assert "DEFECT_QUERY" in data["supported_intents"]
    assert "STATUTORY_NOTICE_DRAFT" in data["supported_intents"]


def test_copilot_suggested_prompts(client):
    """Asserts GET /api/copilot/suggested-prompts returns at least 4 prompt chips."""
    res = client.get("/api/copilot/suggested-prompts")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 4
    assert any("P0" in s or "potholes" in s for s in data)


def test_defect_query_gst_road(client):
    """Asserts 'Show unaddressed P0 potholes on GST Road' returns DEFECT_QUERY with FLY_TO_MAP actions."""
    res = client.post("/api/copilot/query", json={"query": "Show unaddressed P0 potholes on GST Road"})
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "DEFECT_QUERY"
    assert len(data["cards"]) > 0
    assert data["latency_ms"] < 50.0

    first_card = data["cards"][0]
    assert first_card["type"] == "DEFECT_CLUSTER"
    assert first_card["primary_action_type"] == "FLY_TO_MAP"
    assert "lat" in first_card["primary_action_payload"]
    assert "lng" in first_card["primary_action_payload"]
    assert "corridor" in first_card["primary_action_payload"]
    assert first_card["secondary_action_type"] == "INSPECT_BACKLOG"
    assert "RPI Score" in first_card["metrics"]


def test_contractor_audit_highest_breaches(client):
    """Asserts 'Contractors with highest SLA breaches' returns CONTRACTOR_AUDIT and dossier metrics."""
    res = client.post("/api/copilot/query", json={"query": "Contractors with highest SLA breaches"})
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "CONTRACTOR_AUDIT"
    assert len(data["cards"]) >= 1

    first_card = data["cards"][0]
    assert first_card["type"] == "CONTRACTOR_DOSSIER"
    assert "Breached Orders" in first_card["metrics"]
    assert "Remaining Escrow" in first_card["metrics"]
    assert first_card["primary_action_type"] == "VIEW_LEDGER"


def test_contractor_audit_specific_contractor(client):
    """Asserts 'Audit L&T SLA breaches and escrow balance' identifies L&T and surfaces action."""
    res = client.post("/api/copilot/query", json={"query": "Audit L&T SLA breaches and escrow balance"})
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "CONTRACTOR_AUDIT"
    assert len(data["cards"]) > 0

    lt_card = next((c for c in data["cards"] if "L&T" in c["title"]), None)
    assert lt_card is not None
    assert lt_card["primary_action_type"] in ("VIEW_LEDGER", "OPEN_FORM14_MODAL")
    assert "Debarment Risk" in lt_card["metrics"]


def test_corridor_safety_ranking(client):
    """Asserts 'Corridors with worst road condition' returns CORRIDOR_SAFETY_RANKING."""
    res = client.post("/api/copilot/query", json={"query": "Corridors with worst road condition"})
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "CORRIDOR_SAFETY_RANKING"
    assert len(data["cards"]) >= 3

    card = data["cards"][0]
    assert card["type"] == "CORRIDOR_METRIC"
    assert "Active Hazards" in card["metrics"]
    assert card["primary_action_type"] == "FLY_TO_MAP"


def test_statutory_notice_draft_form14(client):
    """
    Asserts 'Draft Form 14 notice for L&T breaches' returns STATUTORY_NOTICE_DRAFT
    with valid SHA-256 evidence hash, 7-day cure window, and Clause 14 penalty amount.
    """
    res = client.post("/api/copilot/query", json={"query": "Draft Form 14 notice for L&T breaches"})
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "STATUTORY_NOTICE_DRAFT"
    assert len(data["cards"]) == 1

    card = data["cards"][0]
    assert card["type"] == "STATUTORY_NOTICE_CARD"
    assert card["primary_action_type"] == "OPEN_FORM14_MODAL"

    payload = card["primary_action_payload"]
    assert payload is not None

    # Validate 64-char hex SHA-256 evidence hash
    evidence_hash = payload["evidenceSha256"]
    assert len(evidence_hash) == 64
    assert re.match(r"^[a-f0-9]{64}$", evidence_hash) is not None

    # Validate notice docket number format
    assert payload["noticeDocketNo"].startswith("FORM-14") or payload["noticeDocketNo"].startswith("GCC/HW/FORM-14")

    # Validate Section 65B certificate identifier
    assert "CERT-BSA" in payload["section65bCertId"]

    # Validate penalty amount conforms to statutory tiers
    assert payload["penaltyDebitInr"] in (25000.0, 50000.0, 100000.0)

    # Validate 7-day cure window deadline presence
    assert "cureDeadline" in payload
    assert len(payload["cureDeadline"]) > 5


def test_sub_10ms_latency_benchmark():
    """Validates deterministic engine query processing completes in < 10ms."""
    db = SessionLocal()
    try:
        # Warm-up to eliminate SQLite connection / statement caching cold-start jitter
        _ = copilot_engine.process_query("Show unaddressed P0 potholes on GST Road", db)
        t0 = time.perf_counter()
        res = copilot_engine.process_query("Show unaddressed P0 potholes on GST Road", db)
        elapsed = (time.perf_counter() - t0) * 1000.0

        assert res.intent == "DEFECT_QUERY"
        # Engine self-reported latency and overall execution both < 10ms
        assert res.latency_ms < 10.0, f"Expected < 10ms, got {res.latency_ms}ms"
        assert elapsed < 15.0, f"Total elapsed time was {elapsed}ms"
    finally:
        db.close()


def test_general_help_guide_intent(client):
    """Asserts 'How do I use this assistant?' returns GENERAL_HELP_GUIDE with suggestions."""
    res = client.post("/api/copilot/query", json={"query": "How do I use this assistant?"})
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "GENERAL_HELP_GUIDE"
    assert len(data["suggested_queries"]) >= 4
    assert "Deterministic AI" in data["cards"][0]["badge"]


def test_unknown_fallback_graceful(client):
    """Asserts completely unrecognized query does not 500 and returns helpful fallback."""
    res = client.post("/api/copilot/query", json={"query": "xyz unknown arbitrary phrase 999"})
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "GENERAL_HELP_GUIDE"
    assert len(data["cards"]) > 0
    assert len(data["suggested_queries"]) >= 4
