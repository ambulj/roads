# Plan 14-01 Summary: Ponytail Codebase Pruning & Dead Engine Deletion

## Executive Summary

Phase 14 executed an aggressive, surgical pruning of speculative, theoretical, and unmounted mock engines under the Ponytail principle (*"The best code is the code never written"*), fulfilling Milestone `v4.0` and Requirement `SIMPLIFY-01`.

The codebase has been relieved of **1,703 lines of dead code** across backend and frontend, eliminating maintenance debt and ungrounded theoretical models (FedAvg edge backpropagation and discrete-time Markov chain matrix exponentiation) while maintaining 100% test integrity and 0 build diagnostics.

---

## 1. Codebase Changes & Deletions

### A. Backend Mock Engine Files Permanently Deleted (D-14-01)
- `backend/app/services/federated_edge_engine.py` (351 LOC): Deleted. Transit buses run static INT8 quantized ONNX models on Rockchip RK3588 NPUs via RKNN2 zero-copy pipelines, never on-device backpropagation or FedAvg gradient exchange.
- `backend/app/services/markov_deterioration.py` (204 LOC): Deleted. Municipal pavement engineering relies on empirical sensor readings (vertical shock $G_z$, profilometer IRI) and multi-pass concurrence gating, not discrete-time Markov matrix exponentiation ($P^t$).

### B. Backend Endpoint & Schema Pruning (D-14-02)
- `backend/app/api/endpoints/city_brain.py`:
  - Removed import `from app.services.federated_edge_engine import federated_edge_engine`.
  - Removed 4 dead request schemas: `FederatedRoundRequest`, `BandwidthScheduleRequest`, `ModelRolloutRequest`, `RollbackRequest`.
  - Removed 5 dead routes:
    - `GET /edge-diagnostics`
    - `POST /federated-round`
    - `POST /bandwidth-schedule`
    - `POST /model-rollout`
    - `POST /model-rollback`
  - Preserved all 10 operational endpoints:
    1. `POST /optimize-budget` (0/1 Knapsack optimizer)
    2. `GET /shift-triage` (Shift triage with alert fatigue suppression)
    3. `GET /xai-trace/{entity_id}` (MoRTH Section 198A XAI reasoning trace)
    4. `GET /kpi/{cluster_id}` (Closed-loop safety KPI measurement)
    5. `GET /chronic-failures` (IRC:37 chronic structural hotspot analysis)
    6. `POST /lifecycle/transition` (6-stage defect lifecycle state machine)
    7. `POST /observation/decay` (Exponential sensor decay calculator)
    8. `POST /map-match` (Geospatial road snapping & bus lane encroachment)
    9. `POST /lift-3d` (Monocular IPM 2D-to-3D bounding box lifting)
    10. `POST /domain-adaptation` (Illumination classification & glare suppression)
- `backend/app/api/endpoints/analytics.py`:
  - Removed lazy imports of `markov_deterioration`.
  - Removed 2 dead routes:
    - `GET /deterioration-matrix`
    - `POST /simulate-deterioration`
  - Preserved all operational analytics endpoints (`/corridors`, `/trends`, `/agency-performance`, `/defect-distribution`, `/lifecycle-distribution`, `/pois`, `/public-transparency`, `/road-memory-corridors`).

### C. Frontend Dead Component & Type Pruning (D-14-03)
- `frontend/src/components/analytics/CityBrainHub.tsx` (940 LOC): Permanently deleted unmounted mock component.
- `frontend/src/services/api.ts`:
  - Removed client methods `getFleetEdgeDiagnostics()` and `triggerFederatedRound()`.
  - Removed dead imports of `FleetEdgeDiagnosticsResult` and `FederatedRoundResult`.
- `frontend/src/types/index.ts`:
  - Removed dead interfaces `SSDRingBufferMetrics`, `EdgeNPUDiagnostic`, `FleetEdgeDiagnosticsResult`, and `FederatedRoundResult`.

### D. Test Suite Realignment (D-14-04)
- `backend/tests/test_api_endpoints.py`:
  - Updated `test_26` to `test_26_pruned_endpoints_return_404`, strictly asserting HTTP 404 (Not Found) across all 5 pruned `city-brain` routes and both pruned `analytics` routes.

---

## 2. Net Code Reduction Metrics

| Target Component | Change Type | Lines Removed |
|---|---|---|
| `backend/app/services/federated_edge_engine.py` | Hard File Deletion | -351 |
| `backend/app/services/markov_deterioration.py` | Hard File Deletion | -204 |
| `frontend/src/components/analytics/CityBrainHub.tsx` | Hard File Deletion | -940 |
| `backend/app/api/endpoints/city_brain.py` | Endpoint & Schema Pruning | -79 |
| `backend/app/api/endpoints/analytics.py` | Endpoint Pruning | -22 |
| `frontend/src/services/api.ts` | Method & Import Pruning | -56 |
| `frontend/src/types/index.ts` | Type Pruning | -51 |
| **Total Lines Deleted** | | **-1,703 LOC** |

---

## 3. Automated Verification & Invariant Proofs

All automated test commands passed cleanly with zero regressions:

1. **Static Grep Invariant (Zero Orphan References)**:
   ```powershell
   git grep "federated_edge_engine" backend/
   git grep "markov_deterioration" backend/
   git grep "CityBrainHub" frontend/
   ```
   - Result: Exit code 1 (0 matches across the repository).

2. **Core Statutory & Physics Regression Suite (62/62 Passed)**:
   ```powershell
   pytest -o pythonpath=backend backend/tests/test_contractor_ledger.py backend/tests/test_concurrence_gating.py backend/tests/test_telematics_physics.py backend/tests/test_explainable_webgis.py backend/tests/test_dual_engine.py backend/tests/test_spatial.py -q
   ```
   - Result: **62 passed in 7.90s** (0 failures, 0 errors).

3. **HTTP API Endpoints Suite (29/29 Passed)**:
   ```powershell
   pytest -o pythonpath=backend backend/tests/test_api_endpoints.py -q
   ```
   - Result: **29 passed in 11.91s** (0 failures, 0 errors), confirming all 7 pruned routes return HTTP 404 and all operational routes return HTTP 200.

4. **Full Backend Test Suite (117/117 Passed)**:
   ```powershell
   pytest -o pythonpath=backend backend/tests/ -q
   ```
   - Result: **117 passed in 19.37s** (0 failures, 0 errors).

5. **Frontend Production Build (TypeScript Typecheck & Vite Bundle)**:
   ```powershell
   npm --prefix frontend run build
   ```
   - Result: Exit code 0, 0 TypeScript diagnostics, successfully built production distribution in 7.91s.

---

## 4. Requirement Verification Matrix

| Requirement / Decision | Target Scope | Planned Action | Automated Verification Check | Status |
|---|---|---|---|---|
| **SIMPLIFY-01 / D-14-01** | `backend/app/services/federated_edge_engine.py` | Hard-delete file (351 LOC) | `pytest -o pythonpath=backend backend/tests/ -q` | PASS |
| **SIMPLIFY-01 / D-14-01** | `backend/app/services/markov_deterioration.py` | Hard-delete file (204 LOC) | `pytest -o pythonpath=backend backend/tests/ -q` | PASS |
| **SIMPLIFY-01 / D-14-02** | `backend/app/api/endpoints/city_brain.py` | Remove dead routes & models | `pytest -o pythonpath=backend backend/tests/test_api_endpoints.py -q` | PASS |
| **SIMPLIFY-01 / D-14-02** | `backend/app/api/endpoints/analytics.py` | Remove dead routes & imports | `pytest -o pythonpath=backend backend/tests/ -q` | PASS |
| **SIMPLIFY-01 / D-14-03** | `frontend/src/components/analytics/CityBrainHub.tsx` | Hard-delete unmounted file (940 LOC) | `npm --prefix frontend run build` | PASS |
| **SIMPLIFY-01 / D-14-03** | `frontend/src/services/api.ts` | Remove dead methods and types | `npm --prefix frontend run build` | PASS |
| **SIMPLIFY-01 / D-14-03** | `frontend/src/types/index.ts` | Remove unused interfaces | `npm --prefix frontend run build` | PASS |
| **SIMPLIFY-01 / D-14-04** | Core Invariant | 62 backend automated tests pass | `pytest -o pythonpath=backend ... -q` | PASS (62/62) |
