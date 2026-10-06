# Requirements: RoadSaathi

**Core Value:** Empower municipal authorities with automated, unassailable, multi-pass verified road distress evidence that protects taxpayer funds through autonomous contractor liability enforcement and protects lives through proactive safety intervention.

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
- [x] **GIS-03**: Interactive Origin-Destination (OD) Transit Desire Lines layer (PS 26124).

### Milestone v3.1: Modern Civic Portal & UI/UX Polish (Complete)
- [x] **UI-01**: Unified modern government portal design system with refined white/indigo & slate design tokens, crisp typography, WCAG AAA accessibility, and dark/light mode toggle.
- [x] **UI-02**: Modernized MapLibre WebGIS controls with a floating HUD dock, responsive sidebar split-view, high-contrast cluster inspection cards, and streamlined layer visibility selector.
- [x] **UI-03**: Polish municipal executive dashboard and contractor SLA action console with high-density KPI scorecards, accessible data tables, contractor escrow status pills, and intuitive 3-pass concurrence payment clearance workflow.

---

## Active Milestone v3.2: Sleek Minimalist Civic Cockpit & UI De-cluttering

### 8. Sidebar Workspace Consolidation & Global Navigation (NAV-UI)
- [x] **DECLUTTER-01**: Consolidate the 16+ menu items into 5 core intuitive workspaces:
  1. 🗺️ **Command Center & Map** (`command`)
  2. 📋 **Work Orders & SLA** (`work-orders`, integrating Contractors)
  3. 📊 **Safety & Traffic Analytics** (`analytics`, integrating Incidents, Pedestrian, Darkspots, Simulation)
  4. 🚌 **Fleet Perception & Edge** (`fleet`, integrating Capture, Learning)
  5. ⚙️ **Governance & Evidence** (`evidence`, integrating Audit, Settings)
  with sleek sub-tab switchers, breadcrumb navigation, and responsive collapse.

### 9. Map HUD & Command Center Viewport Optimization (MAP-CLEAN)
- [ ] **DECLUTTER-02**: Maximize map viewport real estate in `CommandCenter.tsx` and `WebGISMap.tsx`:
  - Condense the top dock into a sleek floating micro-bar.
  - Convert intrusive floating HUD cards (OD flow list, blind spots banner, profile pop-up) into subtle collapsible bottom/side trays.
  - Simplify triage search and filter bars into a compact single-line filter strip with quick toggle chips.

### 10. Tabbed Executive Analytics & Clean Backlog Table Redesign (DASH-CLEAN)
- [ ] **DECLUTTER-03**: Reorganize executive analytics and backlog tables:
  - In `Analytics.tsx`: Replace the long 10+ chart scrolling page with a 4-tab segmented switcher (*Overview KPI*, *Corridor Health & Traffic*, *Pedestrian & Lighting Safety*, *Vision ANPR & Incidents*).
  - In `WorkOrders.tsx`: Streamline table rows with clean typography, compact cell padding, and slide-over inspector drawers instead of overwhelming data density.

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
| DECLUTTER-02 | v3.2 | Phase 9 | Pending |
| DECLUTTER-03 | v3.2 | Phase 10 | Pending |

**Coverage:**
- Total Requirements: 18
- Completed: 16 / 18 (88.9%)
- Active in Milestone v3.2: 2

---
*Requirements updated: 2026-10-07 for Milestone v3.2*
