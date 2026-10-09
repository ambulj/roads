# Phase 17 Plan 01 Summary: Multi-Camera Urban Sensing & Missing Infrastructure Perception

**Execution Date**: 2026-10-10  
**Phase**: `ROAD-17-multi-camera-urban-sensing-missing-infrastructure-perception`  
**Plan**: `17-01` (Wave 1)  
**Requirements Delivered**: `SENSE-01`, `SENSE-02`, `D-17-01`, `D-17-02`, `D-17-03`, `D-17-04`  
**Status**: Completed successfully (100% test pass rate across 60 automated test cases, clean frontend production build)

---

## 1. Executive Summary

Equipped RoadSaathi's multi-camera transit fleet perception pipeline with statutory IRC standards-aligned missing infrastructure detection (`MISSING_ROAD_DIVIDER` per IRC:SP:84, `MISSING_ZEBRA_CROSSING` per IRC:35:2015, `DAMAGED_TRAFFIC_SIGN` per IRC:67:2022, `WATERLOGGING_HAZARD` with Drainage Failure Index $DFI = (d_{water} \times A)/100$ per IRC:SP:42).

Implemented Vision Zero school safety zone evaluation (<150m POI buffer, statutory 20 km/h speed enforcement, strict ₹0 pedestrian fine guarantee per locked decision **D-17-02**), hit-and-run behavioral anomaly detection with ANPR plate recognition ($\ge 90\%$ confidence), edge telemetry 5Hz streaming capped strictly at $< 2.0\text{ KB/s}$, and event-triggered 200KB forensic keyframe snapshot uploads.

On the frontend, added the top sticky forensic alert dock in `CommandCenter.tsx` with 1-click police dispatch / e-Challan generation, WebGIS Map Layers 11 ("Missing Road Infrastructure") & 12 ("Vision Zero School Safety Zones") with interactive 150m buffer circles in `WebGISMap.tsx`, and deep statutory standards inspection in `OperatorInspectorPanel.tsx`.

---

## 2. Key Components Delivered

### 2.1 IRC Standards-Aligned Missing Infrastructure Perception Schemas (`SENSE-01`, `D-17-01`)
- **Database Model Extensions (`db_models.py`)**:
  - Extended `DBDistressCluster` with `water_depth_cm`, `surface_area_m2`, `drainage_failure_index`, and `irc_standard`.
- **Runtime Schema Migration & Seeding (`database.py`)**:
  - Implemented SQLite PRAGMA table inspection and auto-migration adding the 4 columns if missing.
  - Seeded initial verified clusters:
    * `MISSING_ROAD_DIVIDER` on GST Road Arterial near Kathipara (`IRC:SP:84`, P0 Critical).
    * `MISSING_ZEBRA_CROSSING` fronting D.A.V. Senior Secondary School on Avvai Shanmugam Salai (`IRC:35:2015`, P0 Critical).
    * `DAMAGED_TRAFFIC_SIGN` on Anna Salai near Guindy Flyover (`IRC:67:2022`, P1 High).
    * `WATERLOGGING_HAZARD` at Chromepet Underpass ($d_{water} = 14.5\text{ cm}$, $A = 35.0\text{ m}^2$, $DFI = 5.08$, `IRC:SP:42`, P0 Critical Aquaplaning Hazard).
- **REST Endpoints (`clusters.py`)**:
  - `POST /api/clusters/infrastructure/ingest`: Calculates DFI ($d_{water} \times A / 100$), automatically assigns IRC standards, and persists new infrastructure clusters.
  - `GET /api/clusters/infrastructure`: Supports category filtering (`DIVIDERS`, `ZEBRA_CROSSINGS`, `SIGNS`, `WATERLOGGING`, `ALL`).

### 2.2 Vision Zero School Zone Safety & Pedestrian Protection Guarantee (`SENSE-02`, `D-17-02`)
- **Evaluation Engine (`pedestrian_safety.py`)**:
  - Evaluates vehicle proximity to critical school POIs (<150m buffer).
  - Enforces statutory 20 km/h speed limit.
  - **Vision Zero Mandate (D-17-02)**: Strict `fine_amount_inr = 0.0` guarantee protecting vulnerable pedestrian crossers while mandating vehicle yield under Motor Vehicles Act Section 184 / 112.
- **REST Endpoint (`pedestrian.py`)**:
  - `POST /api/pedestrian/school-zones/evaluate`: Triggers `DBTrafficIncident` with `status = "ACTIVE_ALERT"` upon speed violation or pedestrian crossing risk.
  - Router mounted under both `/pedestrian` and `/pedestrian-safety` for full endpoint compatibility.

### 2.3 Edge Telemetry Streaming & Event Snapshot Ingestion (`SENSE-01`, `D-17-04`)
- **5Hz Lightweight JSON Telemetry (`traffic.py`)**:
  - `POST /api/traffic/edge/telemetry-stream`: Ingests 5Hz GPS, IMU, and PCU density records.
  - Capped strictly at $< 2.0\text{ KB/s}$ (verified compact serialization $\le 280\text{ bytes}$ per message, $\approx 1.35\text{ KB/s}$).
- **Event-Triggered 200KB Keyframe Snapshots (`traffic.py`)**:
  - `POST /api/traffic/edge/event-snapshot`: Uploads 200KB mock image payload only upon detected distress/incident trigger, achieving $>95\%$ bandwidth savings compared to raw RTSP streaming.

### 2.4 Real-Time Top Sticky Forensic Alert Dock (`CommandCenter.tsx`, `D-17-03`)
- **High-Priority Alert Dock**:
  - Detects active alerts for `HIT_AND_RUN`, `RASH_DRIVING`, and `SCHOOL_CHILDREN_CROSSING_RISK`.
  - Prominent sticky crimson banner with pulsing beacon, offending plate badge, ANPR confidence score ($\ge 90\%$), NavIC coordinates, UTC timestamp, and 1-click **"Dispatch Alert to Traffic Police (GCTP) / Issue E-Challan"** button.

### 2.5 WebGIS Map Layers 11 & 12 & Inspector Panel Polish (`WebGISMap.tsx`, `OperatorInspectorPanel.tsx`)
- **WebGIS Layers 11 & 12 (`WebGISMap.tsx`)**:
  - Added Layer 11 "Missing Road Infrastructure (IRC:35/IRC:67)" and Layer 12 "Vision Zero School Safety Zones".
  - Custom SVG markers for dividers, crosswalks, traffic signs, and waterlogging.
  - 150m spatial buffer MapLibre GeoJSON fill & dashed boundary layers for school POIs.
- **Operator Inspector Panel (`OperatorInspectorPanel.tsx`)**:
  - Renders statutory details card with IRC standard badge (`IRC:35:2015`, `IRC:67:2022`, `IRC:SP:84`, `IRC:SP:42`).
  - Water depth ($d_{water}\text{ cm}$), surface area ($m^2$), and Drainage Failure Index ($DFI$).
  - Hydrodynamic aquaplaning safety advisory for waterlogging hazards.

---

## 3. Verification & Validation Summary

| Test / Check Suite | Expected | Actual Result | Status |
|:---|:---:|:---:|:---:|
| Urban Sensing Automated Test Suite (`backend/tests/test_urban_sensing.py`) | 6 passed | 6 passed (18.43s) | **PASS** |
| Full Backend Regression Battery (`urban_sensing`, `copilot_engine`, `contractor_ledger`, `concurrence_gating`, `telematics_physics`) | 60 passed | 60 passed (24.57s) | **PASS** |
| Frontend Production Build (`tsc && vite build`) | 0 TypeScript errors | 0 errors, built in 16.58s | **PASS** |
| Vision Zero ₹0 Pedestrian Fine Guarantee (D-17-02) | `fine_amount_inr == 0.0` | `fine_amount_inr = 0.0` strictly enforced | **PASS** |
| 5Hz Edge Telemetry Bandwidth Cap (D-17-04) | $< 2.0\text{ KB/s}$ | $\le 280\text{ bytes/msg}$, $1.35\text{ KB/s} < 2.0\text{ KB/s}$ | **PASS** |
| Top Sticky Forensic Alert Dock (D-17-03) | 1-click dispatch | Monospace plate, NavIC GPS, e-Challan trigger | **PASS** |

---

## 4. Files Modified & Created

### Backend:
- [`backend/app/models/db_models.py`](file:///c:/Users/sauja/Downloads/roads/backend/app/models/db_models.py): Added missing infrastructure columns to `DBDistressCluster`.
- [`backend/app/models/schemas.py`](file:///c:/Users/sauja/Downloads/roads/backend/app/models/schemas.py): Added DefectType enums, `HazardCluster` fields, `InfrastructureDeficiencyIngest`, and `InfrastructureDeficiencyResponse`.
- [`backend/app/storage/database.py`](file:///c:/Users/sauja/Downloads/roads/backend/app/storage/database.py): Added SQLite PRAGMA table migration and seeded initial verified missing infrastructure items.
- [`backend/app/api/endpoints/clusters.py`](file:///c:/Users/sauja/Downloads/roads/backend/app/api/endpoints/clusters.py): Added `POST /api/clusters/infrastructure/ingest` and `GET /api/clusters/infrastructure`.
- [`backend/app/services/pedestrian_safety.py`](file:///c:/Users/sauja/Downloads/roads/backend/app/services/pedestrian_safety.py): Implemented `evaluate_school_zone_safety` with 150m buffer, 20 km/h statutory speed limit, and ₹0 pedestrian fine.
- [`backend/app/api/endpoints/pedestrian.py`](file:///c:/Users/sauja/Downloads/roads/backend/app/api/endpoints/pedestrian.py): Added `POST /api/pedestrian/school-zones/evaluate`.
- [`backend/app/api/router.py`](file:///c:/Users/sauja/Downloads/roads/backend/app/api/router.py): Mounted pedestrian router under both `/pedestrian` and `/pedestrian-safety`.
- [`backend/app/api/endpoints/traffic.py`](file:///c:/Users/sauja/Downloads/roads/backend/app/api/endpoints/traffic.py): Added `POST /api/traffic/edge/telemetry-stream` (5Hz throughput cap) and `POST /api/traffic/edge/event-snapshot`.
- [`backend/tests/test_urban_sensing.py`](file:///c:/Users/sauja/Downloads/roads/backend/tests/test_urban_sensing.py): Created comprehensive 6-test automated suite.

### Frontend:
- [`frontend/src/types/index.ts`](file:///c:/Users/sauja/Downloads/roads/frontend/src/types/index.ts): Extended DefectCode, IncidentType, HazardCluster, added `InfrastructureDeficiency`, `SchoolZoneSafetyEvaluation`, and `EdgeTelemetryStreamPayload`.
- [`frontend/src/services/api.ts`](file:///c:/Users/sauja/Downloads/roads/frontend/src/services/api.ts): Added API client methods for infrastructure ingest, cluster retrieval, school zone evaluation, telemetry streaming, and snapshot uploading.
- [`frontend/src/components/map/WebGISMap.tsx`](file:///c:/Users/sauja/Downloads/roads/frontend/src/components/map/WebGISMap.tsx): Added Layers 11 & 12 toggles, custom SVG markers for missing infrastructure, and 150m school zone buffer GeoJSON layers.
- [`frontend/src/pages/CommandCenter.tsx`](file:///c:/Users/sauja/Downloads/roads/frontend/src/pages/CommandCenter.tsx): Added top sticky forensic alert dock banner with 1-click police dispatch / e-Challan action.
- [`frontend/src/components/triage/OperatorInspectorPanel.tsx`](file:///c:/Users/sauja/Downloads/roads/frontend/src/components/triage/OperatorInspectorPanel.tsx): Added statutory IRC standards card, water depth gauge, DFI metrics, and aquaplaning safety advisory.
