# Roadmap: RoadSaathi

## Overview

RoadSaathi v3.2 streamlines the entire civic cockpit into a sleek, decluttered, high-whitespace municipal intelligence suite. Building upon the robust v3.0 core and v3.1 design system tokens, Milestone v3.2 eliminates visual noise by consolidating the 16+ sidebar links into 5 core intuitive workspaces, condensing the WebGIS top control dock, auto-collapsing floating HUDs into subtle trays, and segmenting heavyweight analytics pages into clean tabbed views.

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
- [x] **Phase 8: Sidebar Workspace Consolidation & Global Navigation** - Consolidate 16+ menu items into 5 core workspaces (Command Map, Work Orders, Analytics, Fleet Edge, Governance) with sub-navigation pills and clean breadcrumbs.
- [x] **Phase 9: Map HUD & Command Center Viewport Optimization** - Streamline top dock into a sleek floating micro-bar, collapse secondary HUDs into discreet bottom trays, and expand map canvas to 100% viewport.
- [x] **Phase 10: Tabbed Executive Analytics & Clean Backlog Table Redesign** - Group analytics into a 5-tab segmented switcher, clean up work order backlog with progressive disclosure slide-overs, and enforce unified minimal hierarchy.

---

## Phase Details

### Phase 8: Sidebar Workspace Consolidation & Global Navigation

**Goal**: Consolidate 16+ navigation links into 5 intuitive workspaces with sub-tab switchers and responsive layout.
**Depends on**: Phase 7
**Requirements**: DECLUTTER-01
**Success Criteria** (what must be TRUE):
  1. Sidebar collapses from 16+ items to 5 primary workspaces: *Command Map*, *Work Orders & SLA*, *Safety & Analytics*, *Fleet Perception*, and *Governance & Audit*.
  2. Nested routes (e.g., Contractors under Work Orders, Pedestrian/Darkspots under Analytics) are accessible via sleek top sub-tab switchers.
  3. Responsive sidebar collapse functions cleanly with intuitive tooltips and active indicator pills.

**Plans**: 1 plan
**Wave 1**
- [x] 08-01: Sidebar workspace consolidation, sub-tab navigation, and breadcrumb layout polish.

---

### Phase 9: Map HUD & Command Center Viewport Optimization

**Goal**: Maximize map viewport real estate and eliminate clutter from intrusive floating cards.
**Depends on**: Phase 8
**Requirements**: DECLUTTER-02
**Success Criteria** (what must be TRUE):
  1. Top floating dock condensed into a sleek glassy micro-dock with minimal visual footprint.
  2. Intrusive floating cards (OD desire lines list, coverage blind spots banner, profile drawer) collapsed into subtle slide-up bottom trays.
  3. CommandCenter triage search and filter bars simplified into a single-line compact filter strip.

**Plans**: 1 plan
**Wave 1**
- [x] 09-01: WebGIS top micro-dock, collapsible bottom HUD trays, and single-line triage filter strip.

---

### Phase 10: Tabbed Executive Analytics & Clean Backlog Table Redesign

**Goal**: Transform long scrolling analytics and heavy tables into clean tabbed views with progressive disclosure.
**Depends on**: Phase 9
**Requirements**: DECLUTTER-03
**Success Criteria** (what must be TRUE):
  1. `Analytics.tsx` adopts a 5-tab segmented switcher (*Overview*, *Corridors*, *Traffic & OD Flow*, *Safety & Lighting*, *Edge ANPR*) preventing chart overload.
  2. `WorkOrders.tsx` data tables redesigned with compact padding, subtle borders, and slide-over inspector drawer for deep audits.
  3. Complete frontend build passes with 0 diagnostics and 100% test integrity.

**Plans**: 1 plan
**Wave 1**
- [x] 10-01: Tabbed analytics redesign, clean backlog table styling, and drawer progressive disclosure.

---

### Milestone v3.3: Work Orders Cockpit & Contractor Operations Overhaul (Complete)
- [x] **Phase 11: Work Orders Cockpit & Contractor Operations Overhaul** - Complete visual overhaul of CAD backlog table, interactive Kanban board with live SLA timers, contractor SLA financial ledger, and slide-over action console.

---

### Phase 11: Work Orders Cockpit & Contractor Operations Overhaul

**Goal**: Transform the Work Orders workspace into a modern minimalist municipal command cockpit across all 3 sub-workspaces (`CAD Backlog`, `Kanban Board`, `Contractor SLA Ledger`).
**Depends on**: Phase 10
**Requirements**: WO-01, WO-02, WO-03
**Success Criteria** (what must be TRUE):
  1. High-density executive metrics strip displaying Active Work Orders, Critical P0 SLA Countdowns, Total Escrow At Risk, and 3-Pass Verified Repairs with animated SVG circular gauges.
  2. Redesigned CAD Backlog Table with compact cell padding (`py-2.5 px-3`), monospace tabular numerals, crisp borders, high-contrast severity pills, and clustered action buttons.
  3. Modernized Kanban Board with defect image thumbnails, live SLA countdown timer rings, contractor agency badges, and statutory concurrence status chips with smooth status transitions.
  4. Contractor Financial SLA Ledger & Action Console deep polish with elevated escrow security deposits, Clause 14 auto-debit triggers, and slide-over progressive disclosure drawer.
  5. 100% frontend build and backend regression test integrity preserved.

**Plans**: 1 plan
**Wave 1**
- [x] 11-01: Work orders executive metrics strip, sleek backlog table, modern Kanban board, and contractor SLA ledger overhaul.

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11

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

---
*Roadmap defined: 2026-10-07 for Milestone v3.3*
