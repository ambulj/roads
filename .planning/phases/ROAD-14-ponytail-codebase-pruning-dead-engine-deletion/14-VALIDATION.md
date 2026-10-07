# Phase 14 Validation Architecture & Verification Matrix

## Overview
Phase 14 prunes speculative and dead engines (`federated_edge_engine.py`, `markov_deterioration.py`, `CityBrainHub.tsx`) and hard-deletes uncalled REST endpoints from `city_brain.py` and `analytics.py`. This validation architecture verifies that all operational systems continue to run without regression, all 62 core backend tests pass, the full test suite passes, and the frontend builds cleanly with 0 TypeScript diagnostics.

---

## 1. Automated Verification Commands

### Test 1: Core Statutory & Physics Regression Suite (Invariant Check)
Validates that core business logic, telematics physics normalization, concurrence gating, contractor SLA ledger, and spatial engines remain intact and operational:
```powershell
pytest -o pythonpath=backend backend/tests/test_contractor_ledger.py backend/tests/test_concurrence_gating.py backend/tests/test_telematics_physics.py backend/tests/test_explainable_webgis.py backend/tests/test_dual_engine.py backend/tests/test_spatial.py -q
```
- **Threshold**: Exactly 62 passed, 0 failed, 0 errors.

### Test 2: Endpoint Pruning & 404 Assertions
Validates that pruned endpoints return 404 Not Found while operational endpoints return 200:
```powershell
pytest -o pythonpath=backend backend/tests/test_api_endpoints.py -q
```
- **Threshold**: 29 passed, 0 failed.

### Test 3: Full Backend Test Suite
Executes the full test suite across all 12 test files:
```powershell
pytest -o pythonpath=backend backend/tests/ -q
```
- **Threshold**: 117 passed, 0 failed.

### Test 4: Frontend Typecheck & Build Pipeline
Runs TypeScript type check (`tsc`) and Vite bundling to guarantee zero broken imports or missing type definitions:
```powershell
npm --prefix frontend run build
```
- **Threshold**: Exit code 0, 0 compiler errors.

---

## 2. Requirement Traceability & Verification Matrix

| Requirement / Decision | Target Scope | Planned Action | Automated Verification Check | Success Criteria |
|---|---|---|---|---|
| **SIMPLIFY-01 / D-14-01** | `backend/app/services/federated_edge_engine.py` | Hard-delete file (352 LOC) | `pytest -o pythonpath=backend backend/tests/ -q` | File deleted, 0 import errors |
| **SIMPLIFY-01 / D-14-01** | `backend/app/services/markov_deterioration.py` | Hard-delete file (205 LOC) | `pytest -o pythonpath=backend backend/tests/ -q` | File deleted, 0 import errors |
| **SIMPLIFY-01 / D-14-02** | `backend/app/api/endpoints/city_brain.py` | Remove `/federated-round`, `/bandwidth-schedule`, `/model-rollout`, `/model-rollback`, `/edge-diagnostics` | `pytest -o pythonpath=backend backend/tests/test_api_endpoints.py -q` | Pruned routes return 404; operational routes return 200 |
| **SIMPLIFY-01 / D-14-02** | `backend/app/api/endpoints/analytics.py` | Remove `/deterioration-matrix`, `/simulate-deterioration` | `pytest -o pythonpath=backend backend/tests/ -q` | Dead routes purged; `/corridors`, `/trends`, etc. return 200 |
| **SIMPLIFY-01 / D-14-03** | `frontend/src/components/analytics/CityBrainHub.tsx` | Hard-delete unmounted file (940 LOC) | `npm --prefix frontend run build` | File deleted, build succeeds with 0 diagnostics |
| **SIMPLIFY-01 / D-14-03** | `frontend/src/services/api.ts` | Remove `triggerFederatedRound`, `getFleetEdgeDiagnostics`, unused imports | `npm --prefix frontend run build` | 0 TypeScript errors, clean compilation |
| **SIMPLIFY-01 / D-14-03** | `frontend/src/types/index.ts` | Remove `FederatedRoundResult`, `FleetEdgeDiagnosticsResult`, `EdgeNPUDiagnostic`, `SSDRingBufferMetrics` | `npm --prefix frontend run build` | 0 unresolved type references |
| **SIMPLIFY-01 / D-14-04** | Core Invariant | 62 backend automated tests pass without a failure | `pytest -o pythonpath=backend backend/tests/test_contractor_ledger.py backend/tests/test_concurrence_gating.py backend/tests/test_telematics_physics.py backend/tests/test_explainable_webgis.py backend/tests/test_dual_engine.py backend/tests/test_spatial.py -q` | 62 passed in <10s |

---

## 3. Manual Inspection Steps
1. Verify no orphan imports remain:
   ```powershell
   git grep "federated_edge_engine" backend/
   git grep "markov_deterioration" backend/
   git grep "CityBrainHub" frontend/
   ```
   All must return exit code 1 (0 matches).
2. Verify line reduction count:
   ```powershell
   git diff --stat
   ```
   Must indicate >1,600 net lines deleted.
