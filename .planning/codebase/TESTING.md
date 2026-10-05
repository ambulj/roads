# Testing Strategy & Structure

**Analysis Date:** 2026-10-06

## Frameworks & Tooling

**Backend Testing:**
- **Pytest 9.1+:** Test runner and assertion framework (`python -m pytest tests/`)
- **Unittest:** Standard Python test cases with `setUpClass` and deterministic teardown
- **FastAPI TestClient:** In-process HTTP testing client built on Starlette and HTTPX
- **AnyIO:** Asynchronous event loop testing for WebSocket and async endpoints

**Frontend Testing:**
- **TypeScript Compiler (`tsc`):** Strict static type checking (`npm run build`)
- **Playwright 1.63+:** Browser end-to-end automation (`npm run test:e2e`)

---

## Test Suite Structure (`backend/tests/`)

```
backend/tests/
├── test_all_features_logic.py      # Core data models, RPI formula, clustering logic (6 tests)
├── test_api_endpoints.py           # Exhaustive REST API integration suite (29 tests)
├── test_backend.py                 # Master test orchestrator invoking sub-suites (5 tests)
├── test_integration.py             # End-to-end bus-to-vault pipeline integration (1 test)
└── test_production_hardening.py    # Production compliance, RBAC, and DPDP vault (10 tests)
```

### 1. `test_production_hardening.py`
Validates real-world civic requirements, statutory enforcement, and system security:
- `test_01_auth_token_issuance_and_me`: JWT token issuance and role metadata retrieval.
- `test_02_rbac_work_order_protection`: 401 unauthenticated and 403 forbidden role checks.
- `test_03_honest_model_registry`: Verifies non-fabrication guarantee for model weights.
- `test_04_compliance_data_provenance`: Verifies IRC:SP:20 contractor penalty clauses and IS:1726 manhole standards.
- `test_05_traffic_density_and_bottlenecks`: IRC:106 PCU traffic density calculations.
- `test_06_incident_review_queue_and_dispatch`: ANPR officer review queue and PCR dispatch.
- `test_07_edge_buffer_sync`: Compressed batch edge sync and bandwidth reduction accounting.
- `test_08_gtfs_analytics_and_speed_distress`: Speed distress curves and transit delay models.
- `test_09_whatsapp_dispatch`: WhatsApp Cloud API / Twilio multi-channel contractor notification.
- `test_10_dpdp_authenticated_evidence_vault_download`: DPDP Act 2023 role-gated evidence downloads and headers.

### 2. `test_api_endpoints.py`
Covers all operational endpoints:
- Cluster CRUD and deduplication.
- Fleet telemetry and node health.
- ANPR HSRP plate recognition (`/api/traffic/anpr/sample`, `/api/traffic/anpr/detect`).
- Work order state transitions and contractor SLA verification.
- Model registry status and custom weights upload.

---

## Running Tests

### Running Backend Tests
From the `backend/` directory:
```powershell
# Run full suite with verbose reporting
python -m pytest tests/

# Run specific production hardening suite
python -m pytest tests/test_production_hardening.py -v

# Run with fail-fast flag
python -m pytest tests/ -x
```

### Running Frontend Verification
From the `frontend/` directory:
```powershell
# Type check and build production bundle
npm run build

# Run Playwright end-to-end tests
npm run test:e2e
```

---

## Test Isolation & Mocking Principles

1. **In-Memory & SQLite WAL Isolation:** Tests run against `roadsaathi.db` with WAL mode and idempotent database seed checks, ensuring tests do not fail on pre-existing records.
2. **Deterministic Seed Checks:** Incident and cluster seeds check for record existence before inserting, preventing unique constraint conflicts across repeated test runs.
3. **Hardware Fallback Mocking:** When CUDA hardware or specific `.pt` weights are missing from disk during testing, the test suite verifies that graceful fallback pipelines activate without throwing unhandled exceptions.

---

*Codebase analysis: 2026-10-06*
