# Roadmap: RoadSaathi

## Overview

RoadSaathi v4.0 grounds the entire municipal intelligence platform in rigorous real-world physical and statutory realities. It aligns onboard telematics with true vehicle dynamics (speed normalization, axle lag offset), fixes GPS multipath errors with heading-constrained corridor snapping, replaces legally indefensible unilateral escrow debits with Bharatiya Sakshya Adhiniyam (BSA 2023) Section 65B statutory evidentiary notice packs, relaxes multi-pass rules to prevent single-route starvation, and aggressively eliminates over-engineered theoretical mock engines under the Ponytail principle.

## Phases

### Milestone v3.0: Core Perception & Statutory Ledger (Complete)
- [x] **Phase 1: Enterprise Scalability & Spatial Engine** - Dual SQLite/PostgreSQL engine, PostGIS spatial clustering, and connection pooling for 500+ buses.
- [x] **Phase 2: Edge NPU & Hardware Telematics Suite** - C++ RKNN2 zero-copy inference on Rockchip RK3588, INT8 OCR, and cellular reconnect watchdog.
- [x] **Phase 3: Contractor Financial Accountability & SLA Ledger** - IRC:SP:20 Clause 14 auto-debit penalty ledger, 36-month defect liability tracking, and multi-pass concurrence gates.
- [x] **Phase 4: Explainable WebGIS & Live Presentation Visualizer** - Interactive RPI click-to-explain modal, live dashcam 30 FPS visualizer, and Origin-Destination desire lines ( ).

### Milestone v3.1: Modern Civic Portal & UI/UX Polish (Complete)
- [x] **Phase 5: Design Tokens & Minimalist Government Portal Theme** - Modern white/indigo civic theme with crisp contrast, unified design tokens, typography, and polished dark/light mode toggle.
- [x] **Phase 6: WebGIS Map HUD & Interactive Inspection Overlays** - Polished map control floating dock, clean cluster inspect popup cards, streamlined layer selector, and responsive sidebar split view.
- [x] **Phase 7: Municipal Dashboard, Work Orders & SLA Action Console Polish** - Clean high-contrast KPI metric cards, modern data tables, contractor escrow status pills, and intuitive multi-pass concurrence payment clearance workflow.

### Milestone v3.2: Sleek Minimalist Civic Cockpit & UI De-cluttering (Complete)
- [x] **Phase 8: Sidebar Workspace Consolidation & Global Navigation** - Consolidate 16+ menu items into 5 core workspaces with sub-navigation pills and clean breadcrumbs.
- [x] **Phase 9: Map HUD & Command Center Viewport Optimization** - Streamline top dock into a sleek floating micro-bar, collapse secondary HUDs into discreet bottom trays, and expand map canvas to 100% viewport.
- [x] **Phase 10: Tabbed Executive Analytics & Clean Backlog Table Redesign** - Group analytics into a 5-tab segmented switcher, clean up work order backlog with progressive disclosure slide-overs, and enforce unified minimal hierarchy.

### Milestone v3.3: Work Orders Cockpit & Contractor Operations Overhaul (Complete)
- [x] **Phase 11: Work Orders Cockpit & Contractor Operations Overhaul** - Complete visual overhaul of CAD backlog table, interactive Kanban board with live SLA timers, contractor SLA financial ledger, and slide-over action console.

---

### Milestone v4.0: Production Physics, Statutory Alignment & Codebase Simplification (Complete)
- [x] **Phase 12: Telematics Physics & Spatial Calibration** - Speed-normalized vertical shock ($G_z$), camera-to-axle physical delay offset, and heading-constrained road centerline snapping.
- [x] **Phase 13: Municipal Statutory Show-Cause & Relaxed Multi-Pass Gating** - Indian Evidence Act / Section 65B BSA statutory notice pack generator with EE sign-off, and relaxed 3-trip multi-pass concurrence.
- [x] **Phase 14: Ponytail Codebase Pruning & Dead Engine Deletion** - Remove dead theoretical engines (`federated_edge_engine.py`, `markov_deterioration.py`) and simplify internal abstractions.

---

### Milestone v5.0: Mobile Sensing, Civic Copilot & 3D Mesh Corridor Twin (Complete)
- [x] **Phase 15: RoadSaathi Civic Copilot & Natural Language Intelligence** - Centralized municipal natural language assistant: schema-aware SQL/aggregation queries, SLA audit lookups, Section 65B Form 14 notice drafting, and floating Command Center drawer.
- [x] **Phase 16: 3D Corridor Digital Twin & Surface Mesh Visualizer (Concept Prototype)** - Interactive 3D road elevation mesh & cavity depth visualizer (explicitly designated as an experimental concept prototype for now), cross-section slicing, and multi-camera exterior perspective switcher.
- [x] **Phase 17: Multi-Camera Urban Sensing & Missing Infrastructure Perception** - Missing road dividers, missing/faded zebra crossings (IRC:35), damaged/missing signboards (IRC:67), waterlogging depth hazards, and vulnerable pedestrian & traffic density counting.

---

### Milestone v6.0: Municipal Credibility, Real AI Inference & Physical Concurrence Hardening (Active)
- [x] **Phase 18: ANPR Integrity & Real Character Inference** - Wire trained character detector (`anpr.pt`), eliminate pixel coordinate plate fabrication & fixed 0.94/0.95 floors, route low-confidence plates to human review queue, and unify brand as RoadSaathi.
- [x] **Phase 19: Physical Concurrence & Officer-Certified Gating** - Time-windowed post-repair query (strictly after repair date within 48h), speed-normalized shock jerk ($G_{norm}$), fail-closed sensor handling, 3–5m lane tolerance, replace automatic debits with AE/EE officer recommendation workflows, and structured triage fields.
- [x] **Phase 20: Statutory & Financial Standards Rectification** - Rectify IRC:SP:20 citations to contractual DLP clauses, replace PFMS escrow vouchers with Security Deposit/Retention Money terminology, add rectangular saw-cut box trim (+15%) and compaction allowances to repair estimates, and attribute datasets.
- [ ] **Phase 21: AI Ground Truth, PCU Alignment & Metric Honesty** - Display true model weights training metrics (zebra 0.993, anpr 0.693, pothole 0.471, vehicle 0.404, indian_roads 0.219), align vehicle counts to `indian_roads_detection.pt` with official IRC:106-1990 Urban PCU tables, fix light-theme text contrast, and remove unsubstantiated marketing claims.

---

## Phase Details

### Phase 12: Telematics Physics & Spatial Calibration

**Goal**: Calibrate edge & backend distress calculations against real vehicle physics and urban GPS multipath dynamics.
**Depends on**: Phase 11
**Requirements**: PHYSICS-01, PHYSICS-02
**Success Criteria** (what must be TRUE):
  1. $G_z$ vertical acceleration triggers are normalized by vehicle speed ($G_{norm} = \frac{\Delta G_z}{v / 30}$), eliminating stop-and-go false negatives and high-speed expansion joint false positives.
  2. Front camera optical detections fuse with IMU vertical shocks using a velocity-dependent axle delay offset ($\Delta t = \frac{d_{axle}}{v}$), resolving the 400–600ms physical lag.
  3. Spatial corridor snapping enforces a heading-vector filter ($\pm 30^\circ$) to prevent GPS multipath jumps into opposite carriageways or elevated ramps.

---

### Phase 13: Municipal Statutory Show-Cause & Relaxed Multi-Pass Gating

**Goal**: Align contractor penalty enforcement with Indian contract/arbitration laws and prevent single-route corridor starvation.
**Depends on**: Phase 12
**Requirements**: STATUTE-01, STATUTE-02
**Success Criteria** (what must be TRUE):
  1. Replace unilateral "Auto-Debit" with statutory **Section 65B BSA 2023 Evidentiary Show-Cause Notice Pack** with Executive Engineer digital sign-off and contract-specific DLP periods.
  2. Multi-pass concurrence engine accepts **3 distinct patrol passes** (allowing the same transit bus on separate schedule trips over 48h) to eliminate single-route corridor starvation.
  3. `WorkOrders.tsx`, `ContractorSlaLedger.tsx`, and `WorkOrderActionConsole.tsx` UI updated with legally defensible statutory terminology and workflows.

---

### Phase 14: Ponytail Codebase Pruning & Dead Engine Deletion

**Goal**: Strip away speculative, unused theoretical abstractions under the Ponytail principle while preserving 100% test pass rate.
**Depends on**: Phase 13
**Requirements**: SIMPLIFY-01
**Success Criteria** (what must be TRUE):
  1. Remove dead/mock engines: `federated_edge_engine.py` and `markov_deterioration.py`.
  2. Simplify `city_brain_engine.py` to route queries directly through clean Postgres/SQLite repository functions.
  3. 100% backend test pass rate and 0 frontend build diagnostics.

---

### Phase 15: RoadSaathi Civic Copilot & Natural Language Intelligence

**Goal**: Equip municipal commanders and engineers with an intuitive natural language conversational assistant to query fleet telemetry, audit contractor SLA breaches, and generate statutory notices without manual SQL or spreadsheet wrangling.
**Depends on**: Phase 14
**Requirements**: COPILOT-01, COPILOT-02
**Success Criteria** (what must be TRUE):
  1. Backend provides `/api/copilot/query` endpoint with deterministic semantic dispatching across road defects, contractor penalties, ward safety rankings, and concurrence logs.
  2. Assistant handles queries like *"Show unaddressed P0 potholes on GST Road"*, *"Which contractor has highest SLA breaches this month?"*, and *"Draft Form 14 notice for L&T breaches"*.
  3. Frontend renders an accessible, floating Civic Copilot drawer in Command Center and Work Orders with one-click suggestion prompts, formatted tabular/markdown results, and deep links to map clusters and work orders.

---

### Phase 16: 3D Corridor Digital Twin & Surface Mesh Visualizer (Concept Prototype)

**Goal**: Deliver an interactive 3D road surface elevation & cavity depth mesh explorer, explicitly labeled and scoped as an **experimental concept prototype for now** (monocular depth + IMU elevation profile, not high-cost LiDAR), alongside multi-camera perspective switching.
**Depends on**: Phase 15
**Requirements**: TWIN-01, TWIN-02
**Success Criteria** (what must be TRUE):
  1. Surface mesh modal and corridor twin viewer display a prominent, non-dismissible **"Experimental Concept / Proof of Concept"** disclaimer badge in all headers, tooltips, and documentation.
  2. Interactive 3D mesh renders wireframe/solid elevation surfaces with color-coded depth contouring, cross-sectional depth slicing, and simulated walking inspection controls.
  3. Perspective switcher allows toggling between exterior bus views (front windshield dashcam, rear road overview, left curb, right carriageway) with synchronous telemetry overlays.

---

### Phase 17: Multi-Camera Urban Sensing & Missing Infrastructure Perception

**Goal**: Extend edge perception schemas and command dashboards to detect missing road infrastructure (dividers, zebra crossings, signboards, waterlogging) and vulnerable road user safety events as mandated by the Problem Statement.
**Depends on**: Phase 16
**Requirements**: SENSE-01, SENSE-02
**Success Criteria** (what must be TRUE):
  1. Backend defect schema and edge telemetry models support missing dividers, missing/faded zebra crossings (IRC:35), damaged/missing signboards (IRC:67), and waterlogging depth hazard metrics.
  2. Vulnerable pedestrian alerts (school children crossing zones, high-risk jaywalking) and vehicle density classification/counting are aggregated per corridor.
  3. Offending vehicle hit-and-run and rash driving alerts expose registration plate extraction with confidence score, GPS coordinate, and ISO timestamp in the Command Center alert stream.

---

## Progress

### Phase 18: ANPR Integrity & Real Character Inference
**Goal**: Wire the real character detector (`anpr.pt`), eliminate pixel coordinate plate fabrication & fixed 0.94/0.95 floors, route unreadable or low-confidence plates to the human review queue, and unify branding as RoadSaathi.
**Depends on**: Phase 17
**Requirements**: ANPR-01, ANPR-02, BRAND-01
**Success Criteria** (what must be TRUE):
  1. No plate strings or confidence values are synthesized from vehicle bounding box coordinates or modulo arithmetic in `anpr_engine.py` or `anpr_onnx.py`.
  2. Character detections from `backend/app/weights/anpr.pt` are mapped, sorted left-to-right, validated against the Indian vehicle registration format (`^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$`), and scored using genuine mean character confidence.
  3. Detections with confidence $< 0.90$ or unreadable crops cleanly produce `success=False` or `review_status="REQUIRES_HUMAN_REVIEW"`, populating the review queue rather than receiving automatic admissibility.
  4. Branding is 100% unified as **RoadSaathi** across all codebase files, eliminating obsolete SeherSaathi references.

---

### Phase 19: Physical Concurrence & Officer-Certified Gating
**Goal**: Ground work-order concurrence in time-windowed post-repair verification (strictly `captured_at >= repair_completed_at` within 48h), replace wide 15m radius with 3–5m lane-aligned corridor tolerance, replace raw G_z shock with speed-normalized jerk G_norm, enforce fail-closed handling on missing sensor data, eliminate fabricated fallback penalties, and replace automated debits/clearances with AE/EE officer recommendation workflows.
**Depends on**: Phase 18
**Requirements**: GATE-01, GATE-02, OFFICER-01
**Success Criteria** (what must be TRUE):
  1. Concurrence query filters strictly post-repair (`captured_at >= repair_completed_at AND captured_at <= repair_completed_at + 48h`), preventing pre-repair distress passes from triggering false recurrence penalties.
  2. Spatial tolerance narrowed from 15m (30m circle) to 3–5m lane-aligned buffer with heading constraint, preventing neighboring speed breakers/manholes from failing repairs.
  3. Vertical shock thresholds evaluate speed-normalized jerk $G_{norm} = \frac{|G_z - 1.0|}{v / 30}$; passes with missing $G_z$ or optical status fail-closed as `NO_DATA` rather than defaulting to clean passes.
  4. Fallback fabricated penalty values (`failing_gz = 1.48`, `failing_bus = "BUS-04"`) are completely removed from concurrence models and database storage.
  5. Automatic debits and unilateral clearance authorizations are replaced with officer recommendation workflows (`proposed_deduction` and `recommend_release`) requiring AE/EE digital sign-off, alongside structured defect triage rejection reasons (`FALSE_POSITIVE`, `DUPLICATE_CLUSTER`, `JURISDICTION_NON_PWD`, `UNDER_ACTIVE_REPAIR`).

---

### Phase 20: Statutory & Financial Standards Rectification
**Goal**: Align statutory citations with authentic municipal contract law, transition escrow terminology to Security Deposit (SD) / Retention Money, calibrate civil engineering patch repair volumes with IRC:82 rectangular saw-cut trim (+15%) and compaction allowances (+10%), and attribute public model weights datasets.
**Depends on**: Phase 19
**Requirements**: STATUTE-03, FINANCE-01, CIVIL-01, ATTRIB-01
**Success Criteria** (what must be TRUE):
  1. Rural road manual citations ("IRC:SP:20 Clause 14") are replaced across backend services, notices, and UI ledgers with contractual Defect Liability Period (DLP) clauses and BSA 2023 Section 63/65B statutory evidence references.
  2. "Escrow" and `PFMS/DLP-ESCROW` tokens are replaced with municipal standard Security Deposit (SD) / Retention Money (`PFMS/DLP-RETENTION` / `PFMS/SD-DLP`).
  3. Pothole cavity volume and PWD SOR repair cost formulas incorporate +15% rectangular saw-cut box trim margin and +10% asphalt compaction settlement factor per IRC:82.
  4. Public dataset attributions (Roboflow CC BY 4.0) are documented in the UI/docs, and Origin-Destination desire lines are explicitly designated as illustrative aggregate transit corridor traces.

---

## Progress

**Execution Order:**
Phases execute in numeric order: 15 → 16 → 17 → 18 → 19 → 20 → 21

| Phase | Plans Complete | Status | Completed |
|---|---|---|---|
| 1. Enterprise Scalability & Spatial Engine | 2/2 | Complete | 2026-10-06 |
| 2. Edge NPU & Hardware Telematics Suite | 2/2 | Complete | 2026-10-06 |
| 3. Contractor Financial Accountability & SLA Ledger | 2/2 | Complete | 2026-10-06 |
| 4. Explainable WebGIS & Live Presentation Visualizer | 2/2 | Complete | 2026-10-06 |
| 5. Design Tokens & Minimalist Government Portal Theme | 1/1 | Complete | 2026-10-07 |
| 6. WebGIS Map HUD & Interactive Inspection Overlays | 1/1 | Complete | 2026-10-07 |
| 7. Municipal Dashboard, Work Orders & SLA Action Console Polish | 1/1 | Complete | 2026-10-07 |
| 8. Sidebar Workspace Consolidation & Global Navigation | 1/1 | Complete | 2026-10-07 |
| 9. Map HUD & Command Center Viewport Optimization | 1/1 | Complete | 2026-10-07 |
| 10. Tabbed Executive Analytics & Clean Backlog Table Redesign | 1/1 | Complete | 2026-10-07 |
| 11. Work Orders Cockpit & Contractor Operations Overhaul | 1/1 | Complete | 2026-10-07 |
| 12. Telematics Physics & Spatial Calibration | 1/1 | Complete | 2026-10-07 |
| 13. Municipal Statutory Show-Cause & Relaxed Multi-Pass Gating | 1/1 | Complete | 2026-10-08 |
| 14. Ponytail Codebase Pruning & Dead Engine Deletion | 1/1 | Complete | 2026-10-08 |
| 15. RoadSaathi Civic Copilot & Natural Language Intelligence | 1/1 | Complete | 2026-10-09 |
| 16. 3D Corridor Digital Twin & Surface Mesh Visualizer (Concept Prototype) | 1/1 | Complete | 2026-10-09 |
| 17. Multi-Camera Urban Sensing & Missing Infrastructure Perception | 1/1 | Complete | 2026-10-09 |
| 18. ANPR Integrity & Real Character Inference | 1/1 | Complete | 2026-10-10 |
| 19. Physical Concurrence & Officer-Certified Gating | 1/1 | Complete | 2026-10-10 |
| 20. Statutory & Financial Standards Rectification | 1/1 | Complete | 2026-10-10 |
| 21. AI Ground Truth, PCU Alignment & Metric Honesty | 0/1 | Pending | - |

---
*Roadmap defined: 2026-10-10 for Milestone v6.0*
