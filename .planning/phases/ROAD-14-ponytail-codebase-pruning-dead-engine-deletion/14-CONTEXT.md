# Phase 14 Context: Ponytail Codebase Pruning & Dead Engine Deletion

## Phase Domain & Goals
Aggressively prune dead, speculative, and theoretical mock code under the Ponytail principle ("The best code is the code never written"). Deletes `federated_edge_engine.py` (speculative edge federated training backprop), `markov_deterioration.py` (speculative Markov chain decay simulation), and the unused frontend component `CityBrainHub.tsx`. Hard-deletes dead endpoints referencing these engines from `analytics.py` and `city_brain.py`. Ensures 100% test integrity and 0 build diagnostics.

---

## Locked Decisions

### D-14-01: Backend Mock Engine Files Deletion
- **Files to Delete**:
  - `backend/app/services/federated_edge_engine.py` (380+ LOC of mock PyTorch/FedAvg edge simulation; buses run static INT8 ONNX models, never on-device training).
  - `backend/app/services/markov_deterioration.py` (220+ LOC of theoretical Markov matrix exponentiation; municipal engineering uses empirical IRI and visual distress).
- **Import Cleanup**:
  - Remove all imports of `federated_edge_engine` and `markov_engine` across the backend.

### D-14-02: Hard Endpoint Deletion in `analytics.py` & `city_brain.py`
- **In `backend/app/api/endpoints/analytics.py`**:
  - Hard-delete `simulate_pavement_deterioration` (`/simulate-decay`) route.
- **In `backend/app/api/endpoints/city_brain.py`**:
  - Hard-delete speculative federated routes:
    - `/federated-round` (`execute_federated_training_round`)
    - `/bandwidth-schedule` (`schedule_telemetry_bandwidth`)
    - `/model-rollout` (`verify_and_rollout_model`)
    - `/canary-rollback` (`trigger_canary_rollback`)
  - Retain real operational endpoints (map matching, 3D bounding box lifting, illumination domain classification, knapsack budget allocation, and XAI reasoning traces).

### D-14-03: Frontend Dead Component & Service Deletion
- **File to Delete**:
  - `frontend/src/components/analytics/CityBrainHub.tsx` (~500 LOC dead component that was never imported or mounted in the UI).
- **In `frontend/src/services/api.ts`**:
  - Remove dead `triggerFederatedRound` method and unused `FederatedRoundResult` interface.

### D-14-04: Test Suite & Build Invariant
- Verify that all 62 backend automated tests pass without a single failure or broken import.
- Verify `npm --prefix frontend run build` completes with exit code 0 and 0 TypeScript diagnostics.

---

## Technical Constraints & Boundaries
- Zero regression on active operational features (Command Center, Work Orders Cockpit, Contractor SLA Ledger, WebGIS Map, Analytics 5-tab suite).
- No orphaned imports or missing type definitions left behind.
