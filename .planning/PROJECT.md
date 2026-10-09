# RoadSaathi Intelligent WebGIS

## What This Is

RoadSaathi is an edge-native municipal WebGIS and road safety intelligence platform that transforms public transit fleets (buses, sanitation trucks) into real-time perceptual scanning networks. It captures pavement degradation (IRC:SP:20 Clause 14), pedestrian crossing compliance (IRC:35), and traffic safety violations (MVA 1988/2019) via onboard edge AI, streaming actionable forensic evidence to municipal command centers.

## Core Value

Empower municipal authorities with automated, unassailable, multi-pass verified road distress evidence that protects taxpayer funds through legally compliant contractor liability enforcement and protects lives through proactive safety intervention.

## Business & Civic Context

- **Customer**: Municipal Corporations (Greater Chennai Corporation / PWD), State Transport Departments, Traffic Police (GCTP), and Smart Cities Mission ICCCs.
- **Revenue Model**: Municipal B2G SaaS / Annual Civic Infrastructure Intelligence License & Contractor Penalty Recovery Support.
- **Success Metric**: Reduction in unverified contractor repair payments and road distress turnaround SLA from 45 days to < 48 hours.

## Requirements

### Validated

- ✓ Real-time 5Hz vehicle telemetry ingestion with WebSockets broker (`/ws/telemetry`) — existing
- ✓ MapLibre WebGL command center with decoupled 60 FPS vehicle tracking (`bus-positions`) — existing
- ✓ Spatial DBSCAN clustering with GPS noise filtering and multi-pass concurrence validation — existing
- ✓ Multi-model YOLO hazard suite with adaptive ambient illumination lux thresholding — existing
- ✓ Indian HSRP license plate detection and MoRTH format parsing (EasyOCR & INT8 ONNX singleton) — existing
- ✓ Statutory traffic violation citation engine (MVA 1988/2019 Sections 184, 134, 119) with e-Challan generation — existing
- ✓ Digital Personal Data Protection (DPDP) Act 2023 certified evidence vault with role-gated downloads (`/api/evidence/{id}/download`) — existing
- ✓ Edge SBC append-only JSONL ring buffer with atomic batch compaction to eliminate flash storage wear — existing
- ✓ Role-Based Access Control (RBAC) with 4 official municipal personas (Admin, Traffic Police, PWD Engineer, RTO Officer) — existing
- ✓ Multi-channel contractor work order dispatch gateway (WhatsApp Cloud API / Twilio) — existing
- ✓ PostgreSQL 16 + PostGIS 3.4 & SQLite WAL dual dialect engine with 500+ bus telemetry queue flusher — Phase 1
- ✓ Zero-copy Rockchip RK3588 NPU C++ pipeline, INT8 ONNX license plate OCR, and AIS-140 telematics parser — Phase 2
- ✓ IRC:SP:20 Clause 14 automated contractor debit ledger, CAG/PFMS escrow accounting, and 3-pass concurrence gates — Phase 3
- ✓ Explainable RPI mathematical explainer modal, 30 FPS dashcam video HUD, and PS 26124 transit desire lines — Phase 4
- ✓ Modern white/indigo civic design tokens, typography, and theme toggle — Phase 5
- ✓ WebGIS map floating dock, cluster inspection popups, and layer visibility controls — Phase 6
- ✓ Executive KPI scorecards, SLA action console, and backlog table styling — Phase 7
- ✓ Sidebar workspace consolidation into 5 core workspaces with sub-tab switchers — Phase 8
- ✓ Map HUD micro-dock, bottom analytical trays, and single-line triage strip — Phase 9
- ✓ 5-tab segmented analytics workspace and compact backlog table — Phase 10
- ✓ Work Orders cockpit, modern Kanban board with live SLA timer rings, and contractor ledger overhaul — Phase 11
- ✓ Speed-normalized vertical shock telematics ($G_{norm}$), optical-to-axle lag synchronization, and heading-constrained road snapping — Phase 12
- ✓ Section 65B BSA 2023 statutory show-cause notice packs with EE digital signature, dynamic DLP tiers, and trip-windowed multi-pass concurrence — Phase 13
- ✓ Ponytail codebase pruning and dead engine deletion with 100% test integrity preserved — Phase 14

### Active (Milestone v5.0: Mobile Sensing, Civic Copilot & 3D Mesh Corridor Twin)

- [ ] **Phase 15: RoadSaathi Civic Copilot & Natural Language Intelligence**:
  - Centralized municipal command assistant: Natural language querying over road hazards, contractor SLA breaches, ward risk indices, and multi-pass concurrence logs.
  - Automated statutory draft generation (e.g., PWD Form 14 Section 65B notices for L&T breaches).
  - Floating slide-over Civic Copilot drawer in Command Center and Work Orders views with quick-prompt chips.
- [ ] **Phase 16: 3D Corridor Digital Twin & Surface Mesh Visualizer (Concept)**:
  - *Explicit Conceptual Scope*: Designate surface elevation mesh and cavity 3D reconstruction as an **experimental concept / proof-of-concept prototype for now**.
  - Interactive WebGL/Canvas 3D road surface mesh with depth slicing, IMU profile elevation contouring, and virtual walking inspection.
  - Multi-camera viewport integration (front, rear, left, right exterior camera perspectives) from onboard bus sensing units.
- [ ] **Phase 17: Multi-Camera Urban Sensing & Missing Infrastructure Perception (PS Gap Closure)**:
  - Missing infrastructure detection & tagging: Missing road dividers, faded/missing zebra crossings (IRC:35), damaged/missing traffic signboards (IRC:67), and waterlogging depth hazard metrics.
  - Vulnerable pedestrian safety awareness (school children crossing zones, jaywalking risk) and bus density counting.
  - Centralized infrastructure deficiency audit map & alert dispatcher to city authorities.

## Out of Scope

- Cloud-only raw video streaming: High continuous cellular bandwidth costs make transmitting full 1080p raw dashcam video unfeasible; raw video remains edge-buffered, transmitting only metadata and 200KB forensic keyframes.
- Proprietary lidar sensor suites: System relies on commodity RGB cameras and onboard vehicle IMU sensors to keep per-bus retrofit cost under ₹15,000 INR.
- Production LiDAR/Photogrammetric 3D Scanning Rig: 3D road mesh is strictly an experimental concept prototype derived from monocular camera depth + IMU elevation profile, not survey-grade millimeter LiDAR.
- Unilateral banking escrow confiscation without statutory due process: Replaced with Section 65B certified notice packs compliant with Indian Arbitration and Contract Law.

## Context

- **Ecosystem**: Built for deployment across Indian state transport corporations (e.g., MTC Chennai) and smart city command centers.
- **Hardware Targets**: Rockchip RK3588 (Orange Pi 5 Plus with active fan cooling), Raspberry Pi 5 with AI Kit, and x86 edge compute units.
- **Codebase Baseline**: FastAPI async backend with 117 passing automated tests, React 18 + Vite WebGIS frontend with locked 60 FPS performance, standalone C++/Python edge agent.

## Constraints

- **Hardware Cost**: Edge hardware bill-of-materials must not exceed ₹15,000 INR per vehicle.
- **Bandwidth**: Must operate over intermittent 4G/2G cellular corridors with at least 70% bandwidth reduction via local batch buffering.
- **Statutory Integrity**: Strict compliance with Bharatiya Sakshya Adhiniyam 2023 (BSA Section 63/65B) for electronic evidence admissibility.
- **Concept Designation**: All 3D corridor mesh visualizers must display prominent "Experimental Concept / Proof of Concept" notices.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Append-Only JSONL for Edge Buffering | Full-file JSON serialization caused severe flash memory wear on vehicle SD/eMMC cards | ✓ Good |
| Decoupled MapLibre 5Hz Telemetry | Direct WebGL GeoJSON source updates bypass React reconciliation to lock 60 FPS panning | ✓ Good |
| SQLite WAL with 15s Busy Timeout | Supports concurrent testing and local demo execution without external service dependencies | ✓ Good |
| PostgreSQL+PostGIS Migration for v3.0 | Required for scaling beyond 500+ concurrent fleet buses and spatial query acceleration | ✓ Good |
| Zero-Copy RKNN Pipeline | C++ NPU pipeline maximizes frame rate to 30+ FPS on Rockchip RK3588 with < 12W power | ✓ Good |
| Section 65B Statutory Show-Cause Notice | Unilateral escrow auto-debits violate Indian contract law; evidentiary notices survive judicial review | ✓ Good |
| Speed-Normalized Gz Telematics | Raw Gz triggers fail across varying traffic speeds and bus passenger load dynamics | ✓ Good |
| 3-Pass Distinct Trip Concurrence | Strict 3-bus requirement starves single-route corridors; 3 distinct trips over 48h fixes coverage | ✓ Good |
| 3D Road Mesh as Experimental Concept | Full 3D dense photogrammetry on edge is resource-intensive; scoped as an exploratory concept viewer | — Active (v5.0) |
| Local Schema-Aware Civic Copilot | Fast, deterministic query parser + prompt synthesis over SQL/analytics without bloated LLM servers | — Active (v5.0) |

---
*Last updated: 2026-10-09 for Milestone v5.0*
