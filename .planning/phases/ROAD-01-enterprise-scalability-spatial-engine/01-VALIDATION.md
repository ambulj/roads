---
phase: "ROAD-01"
slug: "enterprise-scalability-spatial-engine"
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-06"
---

# Phase ROAD-01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|---|---|
| **Framework** | pytest 7.x |
| **Config file** | `backend/pytest.ini` / command-line `-o pythonpath=backend` |
| **Quick run command** | `python -m pytest -o pythonpath=backend backend/tests/test_spatial.py backend/tests/test_dual_engine.py -q` |
| **Full suite command** | `python -m pytest -o pythonpath=backend backend/tests/ -q` |
| **Estimated runtime** | ~12 seconds |

---

## Sampling Rate

- **After every task commit:** Run `python -m pytest -o pythonpath=backend backend/tests/test_spatial.py backend/tests/test_dual_engine.py -q`
- **After every plan wave:** Run `python -m pytest -o pythonpath=backend backend/tests/ -q`
- **Before `/gsd-verify-work`:** Full suite must be green (51+ tests passing)
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---|---|---|---|---|---|---|---|---|---|
| 01-01-01 | 01 | 1 | SCALE-01 | T-01-01 | Dialect factory enforces SQLite WAL & PgBouncer settings without credentials leakage | unit | `python -m pytest -o pythonpath=backend backend/tests/test_dual_engine.py` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | SCALE-01 | T-01-02 | Spatial geometry column compiles cleanly to Text on SQLite and Geometry on Postgres | unit | `python -m pytest -o pythonpath=backend backend/tests/test_spatial.py` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 2 | SCALE-02 | T-01-03 | Bounding box spatial queries and multi-bus DBSCAN clustering return valid clusters | integration | `python -m pytest -o pythonpath=backend backend/tests/test_spatial.py` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 2 | SCALE-03 | T-01-04 | Batch flusher handles 500+ bus stream with bounded queue prioritization and zero dropped defects | stress/unit | `python -m pytest -o pythonpath=backend backend/tests/test_ingestion_queue.py` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/test_dual_engine.py` — Stubs and fixtures for dual SQLite/PostgreSQL engine switching and WAL pragmas.
- [ ] `backend/tests/test_spatial.py` — Stubs for spatial geometry compilation, viewport queries, and DBSCAN clustering.
- [ ] `backend/tests/test_ingestion_queue.py` — Stubs for high-concurrency ingestion buffer and backpressure tests.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|---|---|---|---|
| PgBouncer live proxy stress | SCALE-03 | Requires running external PgBouncer daemon in transaction mode | Point DATABASE_URL at live PgBouncer instance, start uvicorn, and run concurrent hey/locust script |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending 2026-10-06
