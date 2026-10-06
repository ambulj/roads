# Roadmap: RoadSaathi v3.1 (Modern Civic Portal & UI/UX Polish)

## Overview

RoadSaathi v3.1 elevates the municipal user experience into a modern, high-contrast, accessible government civic command center. Building upon the robust v3.0 backend (PostgreSQL/PostGIS, NPU acceleration, IRC:SP:20 Clause 14 penalty ledger, and explainable WebGIS), Milestone v3.1 delivers polished minimalist white/indigo and slate design tokens, refined WebGIS floating HUD docks, and streamlined executive dashboards for civic administrators.

## Phases

### Milestone v3.0: Core Perception & Statutory Ledger (Complete)
- [x] **Phase 1: Enterprise Scalability & Spatial Engine** - Dual SQLite/PostgreSQL engine, PostGIS spatial clustering, and connection pooling for 500+ buses.
- [x] **Phase 2: Edge NPU & Hardware Telematics Suite** - C++ RKNN2 zero-copy inference on Rockchip RK3588, INT8 OCR, and cellular reconnect watchdog.
- [x] **Phase 3: Contractor Financial Accountability & SLA Ledger** - IRC:SP:20 Clause 14 auto-debit penalty ledger, 36-month defect liability tracking, and multi-pass concurrence gates.
- [x] **Phase 4: Explainable WebGIS & Live Presentation Visualizer** - Interactive RPI click-to-explain modal, live dashcam 30 FPS visualizer, and Origin-Destination desire lines (PS 26124).

### Milestone v3.1: Modern Civic Portal & UI/UX Polish (Active)
- [x] **Phase 5: Design Tokens & Minimalist Government Portal Theme** - Modern white/indigo civic theme with crisp contrast, unified design tokens, typography, and polished dark/light mode toggle.
- [ ] **Phase 6: WebGIS Map HUD & Interactive Inspection Overlays** - Polished map control floating dock, clean cluster inspect popup cards, streamlined layer selector, and responsive sidebar split view.
- [ ] **Phase 7: Municipal Dashboard, Work Orders & SLA Action Console Polish** - Clean high-contrast KPI metric cards, modern data tables, contractor escrow status pills, and intuitive multi-pass concurrence payment clearance workflow.

---

## Phase Details

### Phase 5: Design Tokens & Minimalist Government Portal Theme

**Goal**: Establish a unified modern civic design system with clean white/indigo & slate styling, high-contrast data cards, and responsive navigation.
**Depends on**: Phase 4
**Requirements**: UI-01
**Success Criteria** (what must be TRUE):
  1. Frontend adopts refined civic color tokens, crisp typography, and high-contrast styling meeting WCAG AAA accessibility.
  2. Light and dark modes transition smoothly without unstyled flashes or broken contrast.
  3. Global navigation bar, breadcrumbs, and status headers provide consistent responsive layout across screen sizes.

**Plans**: 1 plan

Plans:
**Wave 1**
- [x] 05-01: Civic design tokens, theme engine, and global navigation polish.

---

### Phase 6: WebGIS Map HUD & Interactive Inspection Overlays

**Goal**: Polish MapLibre WebGIS controls with floating HUD docks, sleek inspection cards, and streamlined layer selectors.
**Depends on**: Phase 5
**Requirements**: UI-02
**Success Criteria** (what must be TRUE):
  1. Map control dock floats cleanly over WebGIS with modern glassy styling and responsive placement.
  2. Clicking defect pins opens high-contrast inspection cards with forensic previews and direct navigation to RPI modal.
  3. Layer visibility panel allows toggling clusters, fleet buses, transit desire lines, and weather layers cleanly without UI clutter.

**Plans**: 1 plan

Plans:
- [ ] 06-01: WebGIS map floating dock, cluster inspection popups, and layer panel polish.

---

### Phase 7: Municipal Dashboard, Work Orders & SLA Action Console Polish

**Goal**: Refine executive analytics dashboard, data tables, and contractor SLA action console for municipal presentation.
**Depends on**: Phase 6
**Requirements**: UI-03
**Success Criteria** (what must be TRUE):
  1. Executive dashboard displays high-density KPI cards with animated progress gauges and live fleet metrics.
  2. Contractor SLA ledger and work order console feature intuitive 3-pass concurrence cards and streamlined payment clearance buttons.
  3. All data tables provide accessible sorting, filtering, and export controls.

**Plans**: 1 plan

Plans:
- [ ] 07-01: Executive dashboard KPI scorecards, SLA console polish, and data table styling.

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|---|---|---|---|
| 1. Enterprise Scalability & Spatial Engine | 2/2 | Complete | 2026-10-06 |
| 2. Edge NPU & Hardware Telematics Suite | 2/2 | Complete | 2026-10-06 |
| 3. Contractor Financial Accountability & SLA Ledger | 2/2 | Complete | 2026-10-06 |
| 4. Explainable WebGIS & Live Presentation Visualizer | 2/2 | Complete | 2026-10-06 |
| 5. Design Tokens & Minimalist Government Portal Theme | 1/1 | Complete | 2026-10-07 |
| 6. WebGIS Map HUD & Interactive Inspection Overlays | 0/1 | Ready to start | - |
| 7. Municipal Dashboard, Work Orders & SLA Action Console Polish | 0/1 | Pending | - |

---
*Roadmap defined: 2026-10-06*
