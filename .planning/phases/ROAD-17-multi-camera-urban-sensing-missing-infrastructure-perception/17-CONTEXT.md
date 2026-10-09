# Phase 17 Context: Multi-Camera Urban Sensing & Missing Infrastructure Perception

## Phase Domain & Goals
Fulfill the core perception requirements of the Problem Statement by extending onboard edge perception and central command intelligence beyond pavement potholes into comprehensive urban sensing:
1. Detect and classify **missing road infrastructure** (missing dividers, faded zebra crossings under IRC:35, damaged/missing traffic signs under IRC:67, and waterlogging depth hazards).
2. Monitor **urban traffic density and bottlenecks** (vehicle classification, counting, and corridor PCU density).
3. Guard **vulnerable pedestrian safety** in school zones (evaluating speed limits <20 km/h and child crossing safety).
4. Track **hit-and-run and rash driving incidents** (extracting registration plate with confidence score, NavIC GPS coordinates, UTC timestamp, and real-time police dispatch).
5. Minimize bandwidth consumption via **edge metadata streaming (<2KB/s)** with event-driven keyframe uploads.

---

## Locked Decisions

### D-17-01: IRC Standards-Aligned Perception Schema
- **Missing Infrastructure Classes**:
  - `MISSING_ROAD_DIVIDER`: Broken, damaged, or missing median barriers creating head-on collision danger.
  - `MISSING_ZEBRA_CROSSING`: Faded, obscured, or absent pedestrian crossing paint under **IRC:35 (Code of Practice for Road Markings)**.
  - `DAMAGED_TRAFFIC_SIGN`: Missing or vandalized regulatory, cautionary, and informatory road signs under **IRC:67 (Code of Practice for Road Signs)** (e.g., Stop, Speed Limit, School Ahead).
  - `WATERLOGGING_HAZARD`: Pavement surface water accumulation with estimated depth in centimeters ($d_{water} \in [5, 30]\text{ cm}$), drainage failure tagging, and aquaplaning risk index.
- **Backend Schema Integration**:
  - Extend `DBDistressCluster` and API schemas to natively accept and index these four deficiency types alongside potholes and cracks.

### D-17-02: Vision Zero School Zone Safety Alerting
- **Proactive School POI Safety Rules**:
  - When transit buses equipped with cameras approach a designated school POI ($d_{poi} < 150\text{ meters}$):
    1. Evaluates approaching traffic speeds against the statutory 20 km/h school zone limit (IRC:35 / MoRTH Guidelines).
    2. Checks for vulnerable pedestrian crossers (children detected via camera).
    3. Cross-checks presence of valid zebra crossing markings.
  - If speed $> 20\text{ km/h}$ or children are crossing amidst missing crosswalks, generates elevated P0/P1 `SCHOOL_CHILDREN_CROSSING_RISK` alert in central command.

### D-17-03: Real-Time High-Priority Forensic Alert Dock for Hit-and-Run / Rash Driving
- **Evidentiary Forensic Alert Stream**:
  - When `hit_and_run_engine.py` or rash driving detector triggers an evasion trajectory:
    1. Extracts offending vehicle license plate number (e.g. `TN-09-CB-4812`).
    2. Associates high-confidence ANPR score (e.g. 96.4%).
    3. Records precise NavIC GPS coordinate and UTC timestamp.
    4. Streams real-time high-priority banner to the Command Center top HUD.
    5. Provides 1-click action: **"Dispatch Alert to Traffic Police (GCTP) / Generate E-Challan"**.

### D-17-04: Edge Metadata Streaming (<2KB/s) & Bandwidth Minimization
- **Edge Architecture**:
  - Multi-camera video streams (CAM-01 Front, CAM-02 Rear, CAM-03 Left Curb, CAM-04 Right Lane) are processed on onboard edge NPUs (Rockchip RK3588).
  - The vehicle streams only 5Hz structured JSON telemetry (<2KB/s) carrying:
    - Vehicle counts, classification, and density PCU/km.
    - Active camera channel tag.
    - GPS coordinate, speed, and heading.
  - Single 200KB forensic keyframe snapshot is uploaded **only** when a confirmed road defect, infrastructure deficiency, or traffic crime event is triggered.
  - Reduces total cellular data bandwidth by $> 95\%$ compared to raw streaming.

---

## Technical Constraints & Boundaries

- **Ponytail Simplicity**:
  - Reuse existing database models (`DBDistressCluster`, `DBTrafficIncident`, `DBTrafficDensity`) without requiring heavy migration rewrites.
  - Build UI alerts into the existing Command Center floating alert dock and layer toggles.
- **Test Integrity**:
  - Maintain 100% test pass rate across existing 54 backend tests.
  - Add comprehensive unit tests in `backend/tests/test_urban_sensing.py` covering infrastructure deficiencies, school zone safety rules, and hit-and-run dispatching.
- **Frontend Build**:
  - Zero TypeScript compiler diagnostics on `npm --prefix frontend run build`.
