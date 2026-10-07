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

---
*Requirements updated: 2026-10-07 for Milestone v4.0*
