# RoadSaathi Intelligent WebGIS

## What This Is

RoadSaathi is an edge-native municipal WebGIS and road safety intelligence platform that transforms public transit fleets (buses, sanitation trucks) into real-time perceptual scanning networks. It captures pavement degradation (IRC:SP:20 Clause 14), pedestrian crossing compliance (IRC:35), and traffic safety violations (MVA 1988/2019) via onboard edge AI, streaming actionable forensic evidence to municipal command centers.

## Core Value

Empower municipal authorities with automated, unassailable, multi-pass verified road distress evidence that protects taxpayer funds through autonomous contractor liability enforcement and protects lives through proactive safety intervention.

## Business & Civic Context

- **Customer**: Municipal Corporations (Greater Chennai Corporation / PWD), State Transport Departments, Traffic Police (GCTP), and Smart Cities Mission ICCCs.
- **Revenue Model**: Municipal B2G SaaS / Annual Civic Infrastructure Intelligence License & Contractor Penalty Collection Percentage.
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

### Active (Milestone v3.2: Sleek Minimalist Civic Cockpit & UI De-cluttering)

- [ ] **Sidebar Workspace Consolidation & Global Layout Simplification**: Consolidate 16+ sidebar links into 5 core intuitive workspaces (Map Command, Work Orders, Analytics, Fleet, Settings) with clean sub-navigation.
- [ ] **Map HUD & Command Center Viewport Optimization**: Streamline top dock, collapse floating HUD cards into discrete bottom trays, maximize map viewport, and refine operator triage drawer.
- [ ] **Tabbed Executive Analytics & Clean Backlog Table Redesign**: Segment analytics into 4 focused tabs and streamline work orders table with progressive disclosure slide-overs.

### Out of Scope

- Cloud-only raw video streaming: High continuous cellular bandwidth costs make transmitting full 1080p raw dashcam video unfeasible; raw video remains edge-buffered, transmitting only metadata and 200KB forensic keyframes.
- Proprietary lidar sensor suites: System relies on commodity RGB cameras and onboard vehicle IMU sensors to keep per-bus retrofit cost under ₹15,000 INR.

## Context

- **Ecosystem**: Built for deployment across Indian state transport corporations (e.g., MTC Chennai) and smart city command centers.
- **Hardware Targets**: Rockchip RK3588 (Orange Pi 5 Plus), Raspberry Pi 5 with AI Kit, and legacy x86 edge compute units.
- **Codebase Baseline**: FastAPI async backend with 34 passing automated tests, React 18 + Vite WebGIS frontend with locked 60 FPS performance, standalone C++/Python edge agent.

## Constraints

- **Hardware Cost**: Edge hardware bill-of-materials must not exceed ₹15,000 INR per vehicle.
- **Bandwidth**: Must operate over intermittent 4G/2G cellular corridors with at least 70% bandwidth reduction via local batch buffering.
- **Statutory Integrity**: Strict non-fabrication guarantee — system must never display simulated detections as verified forensic evidence without explicit provenance flags.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Append-Only JSONL for Edge Buffering | Full-file JSON serialization caused severe flash memory wear on vehicle SD/eMMC cards | ✓ Good |
| Decoupled MapLibre 5Hz Telemetry | Direct WebGL GeoJSON source updates bypass React reconciliation to lock 60 FPS panning | ✓ Good |
| SQLite WAL with 15s Busy Timeout | Supports concurrent testing and local demo execution without external service dependencies | ✓ Good |
| PostgreSQL+PostGIS Migration for v3.0 | Required for scaling beyond 500+ concurrent fleet buses and spatial query acceleration | ✓ Good |
| Zero-Copy RKNN Pipeline | C++ NPU pipeline maximizes frame rate to 30+ FPS on Rockchip RK3588 with < 12W power | ✓ Good |
| Minimalist Government Portal Theme | Modern white/indigo clean aesthetic ensures high accessibility and rapid municipal adoption | ✓ Good |
| Progressive Disclosure Cockpit UI | Reduces cognitive load on municipal operators by organizing 16+ tools into 5 core workspaces | — Pending |

---
*Last updated: 2026-10-07 for Milestone v3.2*
