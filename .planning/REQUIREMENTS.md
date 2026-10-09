# Requirements: RoadSaathi

**Core Value:** Empower municipal authorities with automated, unassailable, multi-pass verified road distress evidence that protects taxpayer funds through legally compliant contractor liability enforcement and protects lives through proactive safety intervention.

## Completed Milestones

### Milestone v3.0: Core Perception & Statutory Ledger (Complete)
- [x] **SCALE-01**: Dual-dialect SQLite WAL and PostgreSQL 16 + PostGIS 3.4 database engine.
- [x] **SCALE-02**: Road hazard spatial DBSCAN clustering with sub-50ms query latency.
- [x] **SCALE-03**: Async connection pooling supporting 500+ concurrent fleet buses streaming 5Hz telematics.
- [x] **EDGE-01**: C++ RKNN2 zero-copy pipeline on Rockchip RK3588 NPU at >=30 FPS with <12W power.
- [x] **EDGE-02**: License plate INT8 quantized ONNX inference on vehicle edge devices (<150MB VRAM).
- [x] **EDGE-03**: Edge telematics automatic cellular watchdog thread with exponential jitter backoff.
- [x] **LEDGER-01**: Automated contractor debit penalties under IRC:SP:20 Clause 14 (36-month DLP window).
- [x] **LEDGER-02**: Contractor SLA ledger with transparent debit accruals, escrow holdbacks, and countdowns.
- [x] **LEDGER-03**: Work order multi-pass concurrence validation (minimum 3 independent bus passes + IMU confirmation).
- [x] **GIS-01**: Interactive RPI Formula modal recalculating statutory factors and SLA tiers.
- [x] **GIS-02**: Live Dashcam 30 FPS bounding box hazard overlays with synchronized 5Hz telemetry logs.
- [x] **GIS-03**: Interactive Origin-Destination (OD) Transit Desire Lines layer ( ).

### Milestone v3.1: Modern Civic Portal & UI/UX Polish (Complete)
- [x] **UI-01**: Unified modern government portal design system with refined white/indigo & slate design tokens, crisp typography, WCAG AAA accessibility, and dark/light mode toggle.
- [x] **UI-02**: Modernized MapLibre WebGIS controls with a floating HUD dock, responsive sidebar split-view, high-contrast cluster inspection cards, and streamlined layer visibility selector.
- [x] **UI-03**: Polish municipal executive dashboard and contractor SLA action console with high-density KPI scorecards, accessible data tables, contractor escrow status pills, and intuitive 3-pass concurrence payment clearance workflow.

### Milestone v3.2: Sleek Minimalist Civic Cockpit & UI De-cluttering (Complete)
- [x] **DECLUTTER-01**: Consolidate the 16+ menu items into 5 core intuitive workspaces with sleek sub-tab switchers.
- [x] **DECLUTTER-02**: Maximize map viewport real estate in `CommandCenter.tsx` and `WebGISMap.tsx` with micro-dock and bottom trays.
- [x] **DECLUTTER-03**: Reorganize executive analytics into a 5-tab segmented switcher and streamline backlog tables.

### Milestone v3.3: Work Orders Cockpit & Contractor Operations Overhaul (Complete)
- [x] **WO-01**: Executive Metrics Strip & Sleek Backlog Table Cockpit Redesign with compact cell padding (`py-2.5 px-3`) and monospace tabular numerals.
- [x] **WO-02**: Modernized High-Contrast Kanban Board with defect image thumbnails, live SLA countdown timer rings, and contractor agency badges.
- [x] **WO-03**: Contractor Financial SLA Ledger & Action Console Deep Polish with elevated escrow balances, Clause 14 debit triggers, and PFMS voucher modal.

---

### Milestone v4.0: Production Physics, Statutory Alignment & Codebase Simplification (Complete)
- [x] **PHYSICS-01**: Speed-normalized vertical acceleration ($G_{norm} = \frac{\Delta G_z}{v / 30}$) and optical-to-axle physical delay compensation ($\Delta t = \frac{d_{axle}}{v}$).
- [x] **PHYSICS-02**: Heading-aware road corridor snapping ($\pm 30^\circ$) preventing opposite-lane cross-carriageway misclassification in high multipath GPS zones.
- [x] **STATUTE-01**: Section 65B BSA 2023 Statutory Show-Cause Evidentiary Pack workflow with Executive Engineer digital sign-off replacing legally vulnerable unilateral auto-debits.
- [x] **STATUTE-02**: Relaxed multi-pass concurrence allowing 3 distinct patrol passes (including same vehicle on separate trips over 48h) to eliminate single-route corridor starvation, plus UI alignment across `WorkOrders.tsx`, `ContractorSlaLedger.tsx`, and `WorkOrderActionConsole.tsx`.
- [x] **SIMPLIFY-01**: Delete dead/theoretical mock engines (`federated_edge_engine.py`, `markov_deterioration.py`, `CityBrainHub.tsx`), simplify redundant routing, and preserve 100% test pass rate and 0 frontend diagnostics.

---

### Milestone v5.0: Mobile Sensing, Civic Copilot & 3D Mesh Corridor Twin (Complete)
- [x] **COPILOT-01**: Backend schema-aware natural language assistant query dispatcher (`/api/copilot/query`) executing structured SQL/aggregation over road defects, contractor SLA breaches, ward risk indices, and drafting statutory notices.
- [x] **COPILOT-02**: Floating slide-over Civic Copilot drawer in Command Center & Work Orders with quick municipal prompts, deep-links to clusters/work orders, and markdown response formatting.
- [x] **TWIN-01**: Interactive 3D Corridor Digital Twin & Surface Elevation Mesh Viewer with depth cavity slicing and elevation contours, featuring prominent "Experimental Concept / Proof of Concept" badging and disclaimer.
- [x] **TWIN-02**: Multi-camera perspective viewer supporting exterior bus angles (front, rear, left curb, right carriageway) with synchronized spatial telemetry and inspection HUD overlays.
- [x] **SENSE-01**: Missing infrastructure perception and classification (missing road dividers, faded/missing zebra crossings per IRC:35, damaged/missing signboards per IRC:67, waterlogging depth hazard index).
- [x] **SENSE-02**: Urban traffic flow & vulnerable road user perception (vehicle density classification & counting, school children crossing zone alerts, and offending vehicle hit-and-run/rash driving tracking alerts).

---

### Milestone v6.0: Municipal Credibility, Real AI Inference & Physical Concurrence Hardening (Active)
- [x] **ANPR-01**: Complete removal of all synthetic plate generation from vehicle bbox coordinates and hardcoded confidence floors; true character detection using trained `backend/app/weights/anpr.pt` model with mean character confidence.
- [x] **ANPR-02**: Indian vehicle registration validation regex (`^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$`) with fail-closed behavior routing unrecognized crops or confidence $< 0.90$ to `REQUIRES_HUMAN_REVIEW` instead of `AUTO_ADMISSIBLE`.
- [x] **BRAND-01**: Unified product branding as **RoadSaathi** across all 17+ codebases, configuration files, and UI displays, eliminating obsolete SeherSaathi references.
- [x] **GATE-01**: Time-windowed post-repair concurrence (`WHERE captured_at >= repair_completed_at AND captured_at <= repair_completed_at + 48h`) with 3–5m lane-aligned corridor tolerance and speed-normalized shock jerk ($G_{norm} = \frac{|G_z - 1.0|}{v / 30}$).
- [x] **GATE-02**: Fail-closed telemetry handling (missing `vertical_gz` or `optical_status` marked as `NO_DATA`, never clean passes) and complete elimination of fallback fabricated penalty values (`failing_gz = 1.48`, `BUS-04`).
- [x] **OFFICER-01**: Officer-certified recommendation workflows replacing unilateral auto-debits with AE/EE sign-off (`proposed_deduction` and `recommend_release`), plus structured defect triage fields (`acknowledged_at`, `assigned_officer_id`, structured rejection reasons).

---

## Traceability Matrix

| Requirement | Milestone | Phase | Status |
|---|---|---|---|
| SCALE-01 .. SCALE-03 | v3.0 | Phase 1 | Complete |
| EDGE-01 .. EDGE-03 | v3.0 | Phase 2 | Complete |
| LEDGER-01 .. LEDGER-03 | v3.0 | Phase 3 | Complete |
| GIS-01 .. GIS-03 | v3.0 | Phase 4 | Complete |
| UI-01 | v3.1 | Phase 5 | Complete |
| UI-02 | v3.1 | Phase 6 | Complete |
| UI-03 | v3.1 | Phase 7 | Complete |
| DECLUTTER-01 | v3.2 | Phase 8 | Complete |
| DECLUTTER-02 | v3.2 | Phase 9 | Complete |
| DECLUTTER-03 | v3.2 | Phase 10 | Complete |
| WO-01 .. WO-03 | v3.3 | Phase 11 | Complete |
| PHYSICS-01 .. PHYSICS-02 | v4.0 | Phase 12 | Complete |
| STATUTE-01 .. STATUTE-02 | v4.0 | Phase 13 | Complete |
| SIMPLIFY-01 | v4.0 | Phase 14 | Complete |
| COPILOT-01 .. COPILOT-02 | v5.0 | Phase 15 | Complete |
| TWIN-01 .. TWIN-02 | v5.0 | Phase 16 | Complete |
| SENSE-01 .. SENSE-02 | v5.0 | Phase 17 | Complete |
| ANPR-01 .. ANPR-02, BRAND-01 | v6.0 | Phase 18 | Complete |
| GATE-01 .. GATE-02, OFFICER-01 | v6.0 | Phase 19 | Complete |

---
*Requirements updated: 2026-10-10 for Milestone v6.0 initiation*
