# Phase 18 Validation Architecture

## Test Battery & Requirements Mapping

| Requirement | Test File / Command | Expected Behavior |
|---|---|---|
| **ANPR-01** | `pytest -o pythonpath=backend backend/tests/test_urban_sensing.py -k "test_anpr"` | Real character model invocation; 0 fabricated plates from coordinates; no confidence floors. |
| **ANPR-02** | `pytest -o pythonpath=backend backend/tests/test_urban_sensing.py -k "test_review_queue"` | Plates with confidence $< 0.90$ or unreadable crops route to `REQUIRES_HUMAN_REVIEW`. |
| **BRAND-01** | `git grep -i "SeherSaathi" backend/ frontend/` | Zero occurrences in application code (only in historical phase logs/docs). |

## Automated Verification Commands
- Backend:
  `pytest -o pythonpath=backend backend/tests/test_urban_sensing.py backend/tests/test_copilot_engine.py backend/tests/test_contractor_ledger.py backend/tests/test_concurrence_gating.py backend/tests/test_telematics_physics.py -q`
- Frontend:
  `npm --prefix frontend run build`
