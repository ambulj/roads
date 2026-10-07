# Roadmap: RoadSaathi

## Overview

RoadSaathi v4.0 grounds the entire municipal intelligence platform in rigorous real-world physical and statutory realities. It aligns onboard telematics with true vehicle dynamics (speed normalization, axle lag offset), fixes GPS multipath errors with heading-constrained corridor snapping, replaces legally indefensible unilateral escrow debits with Bharatiya Sakshya Adhiniyam (BSA 2023) Section 65B statutory evidentiary notice packs, relaxes multi-pass rules to prevent single-route starvation, and aggressively eliminates over-engineered theoretical mock engines under the Ponytail principle.

## Phases

### Milestone v3.0: Core Perception & Statutory Ledger (Complete)
- [x] **Phase 1: Enterprise Scalability & Spatial Engine** - Dual SQLite/PostgreSQL engine, PostGIS spatial clustering, and connection pooling for 500+ buses.
- [x] **Phase 2: Edge NPU & Hardware Telematics Suite** - C++ RKNN2 zero-copy inference on Rockchip RK3588, INT8 OCR, and cellular reconnect watchdog.
- [x] **Phase 3: Contractor Financial Accountability & SLA Ledger** - IRC:SP:20 Clause 14 auto-debit penalty ledger, 36-month defect liability tracking, and multi-pass concurrence gates.
- [x] **Phase 4: Explainable WebGIS & Live Presentation Visualizer** - Interactive RPI click-to-explain modal, live dashcam 30 FPS visualizer, and Origin-Destination desire lines (PS 26124).

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

### Milestone v4.0: Production Physics, Statutory Alignment & Codebase Simplification (Active)
- [ ] **Phase 12: Telematics Physics & Spatial Calibration** - Speed-normalized vertical shock ($G_z$), camera-to-axle physical delay offset, and heading-constrained road centerline snapping.
- [ ] **Phase 13: Municipal Statutory Show-Cause & Relaxed Multi-Pass Gating** - Indian Evidence Act / Section 65B BSA statutory notice pack generator with EE sign-off, and relaxed 3-trip multi-pass concurrence.
- [ ] **Phase 14: Ponytail Codebase Pruning & Dead Engine Deletion** - Remove dead theoretical engines (`federated_edge_engine.py`, `markov_deterioration.py`) and simplify internal abstractions.

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

## Progress

**Execution Order:**
Phases execute in numeric order: 12 → 13 → 14

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
| 12. Telematics Physics & Spatial Calibration | 0/1 | Active | - |
| 13. Municipal Statutory Show-Cause & Relaxed Multi-Pass Gating | 0/1 | Pending | - |
| 14. Ponytail Codebase Pruning & Dead Engine Deletion | 0/1 | Pending | - |

---
*Roadmap defined: 2026-10-07 for Milestone v4.0*
