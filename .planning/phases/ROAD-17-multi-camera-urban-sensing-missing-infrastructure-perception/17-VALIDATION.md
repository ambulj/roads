# Phase 17 Validation Map: Multi-Camera Urban Sensing & Missing Infrastructure Perception

## Validation Scope & Requirements Traceability

| Requirement | Description | Validation Strategy | Automated Command | Target Artifacts |
|---|---|---|---|---|
| **SENSE-01** | Missing infrastructure perception and classification (`MISSING_ROAD_DIVIDER`, `MISSING_ZEBRA_CROSSING` under IRC:35, `DAMAGED_TRAFFIC_SIGN` under IRC:67, and `WATERLOGGING_HAZARD` depth metrics). | Ingestion tests in `test_urban_sensing.py`, schema validation, database persistence checks, depth/area metric assertions, and API response format verification. | `pytest -o pythonpath=backend backend/tests/test_urban_sensing.py -k test_missing_infrastructure -q` | `backend/app/models/db_models.py`, `backend/app/models/schemas.py`, `backend/app/api/endpoints/clusters.py` |
| **SENSE-02** | Urban traffic flow & vulnerable road user perception (vehicle density & PCU counting, school children crossing zone alerts, and offending vehicle hit-and-run/rash driving tracking alerts). | Unit and integration tests for school zone speed thresholds (<150m POI buffer, >20 km/h limit), hit-and-run evasion sequences, and 5Hz edge telemetry streaming. | `pytest -o pythonpath=backend backend/tests/test_urban_sensing.py -k "school or hit_and_run or telemetry" -q` | `backend/app/services/pedestrian_safety.py`, `backend/app/api/endpoints/pedestrian.py`, `backend/app/services/hit_and_run_engine.py`, `backend/app/api/endpoints/traffic.py` |
| **D-17-01** | IRC Standards-Aligned Perception Schema (IRC:35 for road markings, IRC:67 for road signs, waterlogging depth $d_{water} \in [5, 30]\text{ cm}$, area $m^2$, and drainage failure index). | Verify schema persistence in `DBDistressCluster`, verify IRC standards assignments, and calculate aquaplaning risk index. | `pytest -o pythonpath=backend backend/tests/test_urban_sensing.py -k "schema or waterlogging" -q` | `db_models.py`, `schemas.py`, `database.py`, `clusters.py` |
| **D-17-02** | Vision Zero School Zone Safety Alerting (proactive evaluation near school POIs <150m, speed threshold 20 km/h, child crosser presence, P0/P1 alert generation). | Test rule engine triggering `SCHOOL_CHILDREN_CROSSING_RISK` when speed > 20 km/h or children cross amidst missing zebra crossing; assert zero-penalty fine mandate ($0 fine). | `pytest -o pythonpath=backend backend/tests/test_urban_sensing.py -k test_school_zone -q` | `pedestrian_safety.py`, `pedestrian.py` |
| **D-17-03** | Real-Time High-Priority Forensic Alert Dock for Hit-and-Run / Rash Driving (ANPR plate, confidence score, NavIC GPS, timestamp, 1-click police dispatch / e-Challan). | Evaluate kinematic sequence trigger (impact jerk $G_z > 2.2g$ + speed spike $\Delta v > 15\text{ km/h}$), verify plate confidence gating, PCR dispatch (`PCR-14`), and e-Challan generation. | `pytest -o pythonpath=backend backend/tests/test_urban_sensing.py -k test_hit_and_run -q` | `hit_and_run_engine.py`, `incidents.py`, `CommandCenter.tsx` |
| **D-17-04** | Edge Metadata Streaming (<2KB/s) & Bandwidth Minimization (5Hz JSON telemetry, active camera tags, event-only 200KB forensic snapshot upload). | Verify 5Hz JSON telemetry message payload size is $< 1.4\text{ KB/s} < 2\text{ KB/s}$; verify keyframe snapshot upload executes strictly on confirmed trigger. | `pytest -o pythonpath=backend backend/tests/test_urban_sensing.py -k test_edge_telemetry -q` | `traffic.py`, `EdgeAIAnalytics.tsx` |
| **UI-MAP** | WebGIS Map Layer Toggles for Missing Infrastructure and School Safety Zones. | Verify layer toggle state in `WebGISMap.tsx`, color-coded marker rendering, and popup actions. | `npm --prefix frontend run build` | `frontend/src/components/map/WebGISMap.tsx` |
| **UI-HUD** | Command Center High-Priority Alert Banner and Operator Inspector Panel deep inspection. | Verify sticky alert banner for Hit-and-Run, Rash Driving, and School Zone alerts; verify 1-click dispatch trigger. | `npm --prefix frontend run build` | `frontend/src/pages/CommandCenter.tsx`, `frontend/src/components/triage/OperatorInspectorPanel.tsx` |
| **REGRESSION** | Full suite regression gating across Copilot engine, contractor ledger, concurrence gating, and telematics physics. | Run full test suite with 100% pass rate. | `pytest -o pythonpath=backend backend/tests/test_urban_sensing.py backend/tests/test_copilot_engine.py backend/tests/test_contractor_ledger.py backend/tests/test_concurrence_gating.py backend/tests/test_telematics_physics.py -q` | All backend test files |

---

## Validation Pipeline Architecture

### 1. Automated Backend Test Suite

The unified automated backend test runner validates all new urban sensing and missing infrastructure endpoints, along with the full existing 54-test regression battery:
```powershell
pytest -o pythonpath=backend backend/tests/test_urban_sensing.py backend/tests/test_copilot_engine.py backend/tests/test_contractor_ledger.py backend/tests/test_concurrence_gating.py backend/tests/test_telematics_physics.py -q
```

#### Test Invariants in `backend/tests/test_urban_sensing.py`:
1. `test_missing_infrastructure_schema_and_ingest`:
   - Posts `MISSING_ROAD_DIVIDER`, `MISSING_ZEBRA_CROSSING`, `DAMAGED_TRAFFIC_SIGN`, and `WATERLOGGING_HAZARD` to `/api/clusters/infrastructure/ingest`.
   - Verifies persistence in `DBDistressCluster` with correct standard citations (`IRC:35:2015`, `IRC:67:2022`).
   - Asserts water depth ($d_{water} = 14.5\text{ cm}$), surface area ($A = 35.0\text{ m}^2$), and drainage failure index ($DFI = 5.07$).
2. `test_waterlogging_hazard_aquaplaning_index`:
   - Validates mathematical calculation of Aquaplaning Risk Index.
   - Verifies depths $> 15\text{ cm}$ trigger P0 Critical severity while depths between $5-15\text{ cm}$ trigger P1 High severity.
3. `test_school_zone_safety_evaluation_and_speed_violation`:
   - Tests POI proximity evaluation within $<150\text{m}$ of designated schools (e.g. D.A.V. Senior Secondary School).
   - Simulates vehicle approaching at $34.5\text{ km/h}$ (>20 km/h statutory threshold).
   - Asserts generation of `SCHOOL_CHILDREN_CROSSING_RISK` incident in `DBTrafficIncident`.
   - Confirms `fine_amount_inr == 0.0` (zero pedestrian fine under Vision Zero).
4. `test_hit_and_run_behavioral_anomaly_and_anpr_dispatch`:
   - Simulates collision impact shock ($G_z = 2.45g$) followed by immediate speed jump ($28.0 \rightarrow 62.5\text{ km/h}$).
   - Extracts license plate `TN09CB4412` with confidence $0.964 \ge 0.90$.
   - Calls `/api/incidents/{id}/dispatch` and asserts PCR assignment (`PCR-14`), status `DISPATCHED`, and e-Challan ID generation (`ECH-2026-XXXX`).
5. `test_edge_telemetry_bandwidth_and_event_snapshot`:
   - Sends 5Hz JSON telemetry to `/api/traffic/edge/telemetry-stream`.
   - Asserts payload serialization length $\le 280\text{ bytes}$ per message ($\le 1.4\text{ KB/s} < 2\text{ KB/s}$).
   - Verifies active camera channel tag (`CAM-01 Front`, `CAM-02 Rear`, etc.) and PCU/km density (IRC:106).
   - Verifies keyframe snapshot upload endpoint `/api/traffic/edge/event-snapshot` accepts 200KB payload and associates it with triggered incident/defect.
6. `test_infrastructure_clusters_query_and_filtering`:
   - Calls `/api/clusters/infrastructure` with category filter (`DIVIDERS`, `ZEBRA_CROSSINGS`, `SIGNS`, `WATERLOGGING`).
   - Verifies JSON structure matches `HazardCluster` response model.

---

### 2. Frontend Production Type-Check & Bundle Build

Validates that all UI additions in `CommandCenter.tsx`, `WebGISMap.tsx`, and `OperatorInspectorPanel.tsx` compile cleanly without TypeScript diagnostics:
```powershell
npm --prefix frontend run build
```

#### Success Criteria:
1. **Zero TypeScript Errors**:
   - `tsc` exits with status code 0.
   - `DefectCode`, `HazardCluster`, `TrafficIncident`, and new infrastructure fields typecheck cleanly across all consumers.
2. **WebGIS Map Layer Toggles**:
   - Layer 11 "Missing Road Infrastructure (IRC:35/IRC:67)" renders markers for dividers, zebra crossings, signboards, and waterlogging hazards with distinct SVG icons.
   - Layer 12 "Vision Zero School Safety Zones" renders 150m spatial buffer circles around school POIs with statutory 20 km/h badges.
3. **Command Center Real-Time Alert Banner**:
   - Top sticky banner displays active Hit-and-Run, Rash Driving, and School Zone alerts with plate number, ANPR confidence, NavIC GPS coordinates, and UTC timestamp.
   - 1-click dispatch action triggers police notification and toast confirmation.
4. **Operator Inspector Panel**:
   - Renders detailed IRC code compliance metadata, water depth in cm, and school zone yield advisories.
