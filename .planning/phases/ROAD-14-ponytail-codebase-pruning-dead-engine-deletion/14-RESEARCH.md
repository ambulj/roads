# Phase 14 Research: Ponytail Codebase Pruning & Dead Engine Deletion

## Executive Summary & The Ponytail Principle

The **Ponytail Principle** posits that *"The best code is the code never written"*, and by extension, that unneeded, speculative, or theoretical code remaining in a codebase creates ongoing maintenance debt, confusion, security attack surface, and build cognitive load.

RoadSaathi v4.0 is grounded in physical and statutory realities:
- **Physical Dynamics**: 30 km/h speed-normalized vertical shock ($G_{norm} = \frac{\Delta G_z}{v / 30}$), velocity-dependent optical-to-axle physical delay compensation ($\Delta t = \frac{d_{axle}}{v}$), and heading-constrained road corridor snapping ($\pm 30^\circ$).
- **Statutory Enforcement**: Section 65B Bharatiya Sakshya Adhiniyam (BSA 2023) evidentiary notice packs with Executive Engineer digital sign-offs, IRC:SP:20 Clause 14 DLP windows, and relaxed 3-trip multi-pass concurrence gating.
- **On-Bus Reality**: Transit buses run fixed INT8 quantized ONNX perception models on Rockchip RK3588 NPUs over C++ RKNN2 zero-copy pipelines. Fleet nodes **never** run local gradient backpropagation, federated SGD, or on-device model training.
- **Pavement Engineering Reality**: Municipal engineers evaluate empirical International Roughness Index (IRI) data and visual distress clusters, not theoretical discrete-time Markov chain matrix exponentiation ($P^t$).

Phase 14 executes a surgical, zero-regression purge of dead mock engines, unused REST routes, dead frontend components, and obsolete TypeScript types, reducing the codebase by **over 1,600 lines of dead code** while guaranteeing 100% test integrity and 0 build diagnostics.

---

## 1. Investigation of Target Mock Engines & Backend Call Sites

### A. `backend/app/services/federated_edge_engine.py` (352 LOC)
- **Original Purpose & Scope**: Implemented Points 71–80 of the legacy specification:
  - `execute_federated_training_round`: Simulated FedAvg gradient aggregation across bus nodes, generating pseudo-random client loss metrics and claiming 99.9% bandwidth savings over raw video streaming.
  - `schedule_telemetry_bandwidth`: A 3-tier bandwidth routing heuristic (Cellular P1, Compressed P2, Depot Wi-Fi P3).
  - `get_fleet_edge_diagnostics`: Generated synthetic random temperature readings (54–68°C), throttling states, and 128GB SSD ring-buffer occupancy metrics for fleet nodes.
  - `verify_and_rollout_model` / `trigger_canary_rollback`: SHA-256 digest checks and canary cohort stage transitions for simulated OTA model rollouts.
- **Why It Is Dead**:
  - In production, onboard edge units run static RKNN2 / ONNX models; buses never aggregate local backprop gradients. Real bandwidth telemetry is handled by `app/services/telemetry_buffer.py` and real hardware specs are in `app/api/endpoints/fleet.py` (`HARDWARE_BOM`).
- **Call Sites & Dependencies in Backend**:
  - `backend/app/api/endpoints/city_brain.py`:
    - Line 22: `from app.services.federated_edge_engine import federated_edge_engine`
    - Line 219: `return federated_edge_engine.get_fleet_edge_diagnostics()`
    - Line 227: `return federated_edge_engine.execute_federated_training_round(...)`
    - Line 238: `return federated_edge_engine.schedule_telemetry_bandwidth(...)`
    - Line 251: `result = federated_edge_engine.verify_and_rollout_model(...)`
    - Line 265: `return federated_edge_engine.trigger_canary_rollback(...)`
  - Zero other services or routers import or call `federated_edge_engine`.
- **Test Dependencies**:
  - `backend/tests/test_api_endpoints.py` (lines 498–519): `test_26_federated_learning_and_bandwidth_scheduler` executes HTTP POST `/api/city-brain/federated-round`, POST `/api/city-brain/bandwidth-schedule`, and GET `/api/city-brain/edge-diagnostics`.
  - **Zero** tests in the 62 core regression suite (`test_contractor_ledger.py`, `test_concurrence_gating.py`, `test_telematics_physics.py`, `test_explainable_webgis.py`, `test_dual_engine.py`, `test_spatial.py`) reference or depend on `federated_edge_engine`.

### B. `backend/app/services/markov_deterioration.py` (205 LOC)
- **Original Purpose & Scope**:
  - Implemented theoretical discrete-time Markov Chain (DTMC) modeling of pavement degradation based on IRC:37-2018 5-state transitions ($S_1$ micro-crack through $S_5$ structural collapse).
  - `get_matrix_spec`: Returned baseline and monsoon-accelerated (2.2x decay) $5 \times 5$ transition probability matrices (TPM).
  - `simulate`: Computed matrix powers $P^t$ using binary exponentiation, calculating expected cavity depth, crack width, IRI roughness, and taxpayer savings over $t$ days.
- **Why It Is Dead**:
  - Real municipal engineering and MoRTH/IRC:SP:20 compliance operate on empirical measurements: physical sensor readings (axle vertical shock $G_z$, profilometer IRI) and multi-pass concurrence evidence. Theoretical matrix exponentiation is speculative and unused in municipal workflows.
- **Call Sites & Dependencies in Backend**:
  - `backend/app/api/endpoints/analytics.py`:
    - Line 296: Lazy import `from app.services.markov_deterioration import markov_engine` in `get_deterioration_matrix` (`/deterioration-matrix`).
    - Line 305: Lazy import `from app.services.markov_deterioration import markov_engine` in `simulate_pavement_deterioration` (`/simulate-deterioration`).
  - Zero other services or routers import or call `markov_deterioration`.
- **Test Dependencies**:
  - **Zero** tests in `backend/tests/` depend on `markov_deterioration.py` (confirmed via codebase search). Neither `test_api_endpoints.py` nor any of the 62 core regression tests call `/deterioration-matrix` or `/simulate-deterioration`.

---

## 2. Endpoint Pruning in `city_brain.py`

### A. Dead Endpoints to Remove
In `backend/app/api/endpoints/city_brain.py`:
1. `GET /edge-diagnostics` (`get_edge_diagnostics`) — Pure wrapper around `federated_edge_engine.get_fleet_edge_diagnostics()`.
2. `POST /federated-round` (`run_federated_round`) — FedAvg aggregation simulation.
3. `POST /bandwidth-schedule` (`schedule_bandwidth`) — Speculative 3-tier telemetry schedule simulator.
4. `POST /model-rollout` (`rollout_model`) — Speculative canary rollout coordinator.
5. `POST /model-rollback` (`rollback_model`) — Speculative canary rollback coordinator.

### B. Associated Request Schemas to Remove
- `FederatedRoundRequest` (lines 63–65)
- `BandwidthScheduleRequest` (lines 67–72)
- `ModelRolloutRequest` (lines 74–77)
- `RollbackRequest` (lines 79–81)

### C. Import Cleanup
- Remove `from app.services.federated_edge_engine import federated_edge_engine` (line 22).

### D. Operational Endpoints Preserved & Protected
All 10 operational endpoints remain untouched and fully functioning:
1. `POST /optimize-budget` — 0/1 Knapsack economic budget optimizer (`city_brain_engine.optimize_budget_knapsack`).
2. `GET /shift-triage` — Command centre shift triage with alert fatigue suppression (`city_brain_engine.get_shift_workload_triage`).
3. `GET /xai-trace/{entity_id}` — MoRTH Section 198A statutory XAI reasoning trace (`city_brain_engine.generate_xai_reasoning_trace`).
4. `GET /kpi/{cluster_id}` — Closed-loop safety KPI measurement (`city_brain_engine.measure_intervention_kpi`).
5. `GET /chronic-failures` — IRC:37 citywide chronic failure recurrence hotspot detector (`road_memory_engine.analyze_chronic_failures`).
6. `POST /lifecycle/transition` — 6-stage auditable defect lifecycle state machine (`road_memory_engine.transition_lifecycle_state`).
7. `POST /observation/decay` — Exponential observation sensor decay calculator (`road_memory_engine.calculate_observation_decay`).
8. `POST /map-match` — Geospatial map matching & bus lane encroachment detection (`map_matching_engine.match_gps_to_road`).
9. `POST /lift-3d` — Monocular inverse perspective mapping 2D-to-3D bounding box lifting (`map_matching_engine.lift_2d_to_3d`).
10. `POST /domain-adaptation` — Illumination classification & monsoon puddle glare suppression (`domain_adaptation_engine.classify_illumination_domain`).

---

## 3. Endpoint Pruning in `analytics.py`

### A. Dead Endpoints to Remove
In `backend/app/api/endpoints/analytics.py`:
1. `GET /deterioration-matrix` (`get_deterioration_matrix`, lines 290–297): Returns static Markov TPM specifications via `markov_engine.get_matrix_spec()`.
2. `POST /simulate-deterioration` (`simulate_pavement_deterioration`, lines 299–311): Simulates Markov matrix exponentiation via `markov_engine.simulate()`.

### B. Preserved Operational Analytics Endpoints
The following operational analytics routes remain active:
- `GET /corridors` — Longitudinal corridor risk profiles and GTFS delay attribution.
- `GET /trends` — Weekly temporal defect ingestion velocity.
- `GET /agency-performance` — Contractor SLA compliance breakdown.
- `GET /defect-distribution` — Defect classification distribution.
- `GET /lifecycle-distribution` — Cluster lifecycle stage distribution.
- `GET /pois` — Chennai critical landmarks and vulnerable institution zones.
- `GET /public-transparency` — PII-scrubbed public civic infrastructure dashboard.

---

## 4. Frontend Pruning in `CityBrainHub.tsx`, `api.ts`, and Types

### A. Hard Deletion: `frontend/src/components/analytics/CityBrainHub.tsx` (940 LOC)
- **Investigation**: Verified via global grep (`git grep -i "citybrainhub"`) that `CityBrainHub.tsx` was **never imported, declared, or mounted** in any router, page, or navigation tab.
- **Action**: Completely delete `frontend/src/components/analytics/CityBrainHub.tsx`.

### B. Pruning in `frontend/src/services/api.ts`
- **Method to Remove**: `triggerFederatedRound(roundId?: number): Promise<FederatedRoundResult>` (lines 2230–2260, 31 LOC).
- **Import Cleanup**: Remove `FederatedRoundResult` from the import list on line 8.
- **Dead Edge Diagnostic Cleanup**: `getFleetEdgeDiagnostics` (lines 2210–2228, 19 LOC) was only consumed by `CityBrainHub.tsx`. Remove `getFleetEdgeDiagnostics` and `FleetEdgeDiagnosticsResult` import.

### C. Pruning in `frontend/src/types/index.ts`
- Remove unused interface `FederatedRoundResult` (lines 781–798, 18 LOC).
- Remove unused interfaces `FleetEdgeDiagnosticsResult` (lines 772–779, 8 LOC), `EdgeNPUDiagnostic` (lines 756–770, 15 LOC), and `SSDRingBufferMetrics` (lines 749–754, 6 LOC).

### D. Safety of Active Views
- **Command Center (`CommandCenter.tsx`)**: Unaffected (uses live streams, metrics, and cluster APIs).
- **Work Orders Cockpit (`WorkOrders.tsx`)**: Unaffected (uses work order APIs, contractors API, and concurrence service).
- **Contractor SLA Ledger (`ContractorSlaLedger.tsx`)**: Unaffected (uses contractor ledger, PFMS, and Section 65B notice packs).
- **WebGIS Map (`WebGISMap.tsx`)**: Unaffected (uses MapLibre, clusters, POIs, OD desire lines).
- **Executive Analytics (`Analytics.tsx`)**: Unaffected (uses 5-tab switcher with corridors, trends, agencies, and distribution).
- **Road Memory (`RoadMemory.tsx`)**: Unaffected (uses corridor memory, timeline, and statutory audit APIs).

---

## 5. Test Suite Alignment & Invariant Guarantee

### A. Analysis of Test Suites
1. **Target 62-Test Statutory & Physics Regression Suite**:
   ```bash
   pytest -o pythonpath=backend backend/tests/test_contractor_ledger.py backend/tests/test_concurrence_gating.py backend/tests/test_telematics_physics.py backend/tests/test_explainable_webgis.py backend/tests/test_dual_engine.py backend/tests/test_spatial.py -q
   ```
   - Current Status: **62 passed in 9.51s**.
   - Target files deleted have **zero** references across all 6 files. All 62 tests will remain 100% passing.

2. **`backend/tests/test_api_endpoints.py` Alignment**:
   - `test_26_federated_learning_and_bandwidth_scheduler` (lines 498–519) currently asserts HTTP 200 on `/api/city-brain/federated-round`, `/api/city-brain/bandwidth-schedule`, and `/api/city-brain/edge-diagnostics`.
   - Update `test_26` to verify that these pruned endpoints return HTTP 404 (Not Found), proving the dead mock endpoints are genuinely eradicated and cannot be called.

3. **Full Backend Test Suite**:
   - Current Status: **117 passed**.
   - After updating `test_26`, all 117 tests pass with 0 failures.

---

## 6. Net Code Reduction Metrics

| File / Component | Type of Change | LOC Before | LOC After | Net Reduction |
|---|---|---|---|---|
| `backend/app/services/federated_edge_engine.py` | File Deletion | 352 | 0 | **-352 LOC** |
| `backend/app/services/markov_deterioration.py` | File Deletion | 205 | 0 | **-205 LOC** |
| `frontend/src/components/analytics/CityBrainHub.tsx` | File Deletion | 940 | 0 | **-940 LOC** |
| `backend/app/api/endpoints/city_brain.py` | Endpoint & Schema Pruning | 269 | 200 | **-69 LOC** |
| `backend/app/api/endpoints/analytics.py` | Endpoint Pruning | 360 | 338 | **-22 LOC** |
| `frontend/src/services/api.ts` | Method & Import Pruning | 3035 | 2985 | **-50 LOC** |
| `frontend/src/types/index.ts` | Type Pruning | 899 | 852 | **-47 LOC** |
| **Total Net Pruning** | | **6,060** | **4,375** | **-1,685 LOC** |

Total Lines Deleted: **~1,695 LOC**
Total Lines Added: **~10 LOC** (test 404 asserts)
**Net Codebase Shrinkage: >1,680 lines of dead speculative code eradicated.**

---

## Validation Architecture

To ensure flawless validation before and after code deletion, the following verification pipeline is established:

### 1. Core Statutory & Physics Regression Verification
Executes the comprehensive 62-test regression suite covering Contractor SLA Ledger, Concurrence Gating, Telematics Physics, Explainable WebGIS, Dual Engine, and Spatial DBSCAN:
```bash
pytest -o pythonpath=backend backend/tests/test_contractor_ledger.py backend/tests/test_concurrence_gating.py backend/tests/test_telematics_physics.py backend/tests/test_explainable_webgis.py backend/tests/test_dual_engine.py backend/tests/test_spatial.py -q
```
- **Expected Outcome**: Exactly 62 passed, 0 failures, 0 errors.

### 2. Full HTTP API Endpoint Regression Verification
Verifies that all operational REST endpoints continue to return HTTP 200 and that deleted routes return HTTP 404:
```bash
pytest -o pythonpath=backend backend/tests/test_api_endpoints.py -q
```
- **Expected Outcome**: 29 passed, 0 failures, 0 errors.

### 3. Full Backend Test Suite
Executes all unit, integration, and architecture tests:
```bash
pytest -o pythonpath=backend backend/tests/ -q
```
- **Expected Outcome**: 117 passed, 0 failures, 0 errors.

### 4. Frontend Type Checking & Production Build
Compiles all TypeScript source files, validates module imports and JSX types, and generates production chunks:
```bash
npm --prefix frontend run build
```
- **Expected Outcome**: Exit code 0, 0 TypeScript errors, clean Vite chunk output.
