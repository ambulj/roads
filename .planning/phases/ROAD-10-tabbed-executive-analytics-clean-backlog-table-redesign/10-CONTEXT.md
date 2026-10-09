# Phase 10 Context: Tabbed Executive Analytics & Clean Backlog Table Redesign

## Phase Overview
- **Phase**: `ROAD-10-tabbed-executive-analytics-clean-backlog-table-redesign`
- **Milestone**: `v3.2` (Sleek Minimalist Civic Cockpit & UI De-cluttering)
- **Requirement**: `DECLUTTER-03`
- **Status**: Ready for Planning & Research

---

## Locked Decisions

### D-01: Analytics 5-Tab Segmented Workspace
Reorganize `Analytics.tsx` from a single heavyweight scrolling page into a 5-tab segmented workspace:
1. **📊 Overview KPI (`overview`)**:
   - High-density executive KPI scorecards (`MetricCards`).
   - Speed vs Distress Ingestion Rate dual-spline ApexCharts area graph.
   - Statutory RPI IRC:SP:20 Weightings radial bar graph.
2. **🛣️ Corridor Health (`corridors`)**:
   - Corridor Risk Ranking (GST Road, OMR Expressway, Anna Salai, Kathipara Cloverleaf, Central Link).
   - Defect severity breakdown per corridor (P0 Critical, P1 High, P2 Routine).
   - Maintenance urgency scorecards.
3. **🚦 Traffic & OD Flow (`traffic`)**:
   - Traffic bottlenecks and congestion hotspots.
   - Live transit bus speed delays and distress correlation.
   -   Origin-Destination (OD) Transit Desire Lines flow matrix.
4. **🛡️ Safety & Lighting (`safety`)**:
   - Safe Pedestrian School Zones & crossings with speed enforcement metrics.
   - Night Darkspots & unlit road segments with lighting infrastructure defect alerts.
5. **👁️ Edge ANPR & Vision AI (`anpr`)**:
   - Interactive license plate OCR scanner test.
   - Vehicle class distribution and automatic incident classification.

### D-02: Sub-Tab Styling & Active Indicator
- Active tab pill: `bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800/80 shadow-xs`.
- Inactive tab pill: `bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60`.
- Icon + Label layout with responsive horizontal scroll for mobile screens.

### D-03: Two-Way URL Hash Synchronization
- URL synchronization: `#/analytics?tab=overview | corridors | traffic | safety | anpr`.
- Legacy route aliases redirected via `App.tsx`:
  - `#/traffic` $\to$ `#/analytics?tab=traffic`
  - `#/pedestrian` $\to$ `#/analytics?tab=safety`
  - `#/darkspots` $\to$ `#/analytics?tab=safety`
  - `#/incidents` $\to$ `#/analytics?tab=traffic`

### D-04: Work Orders CAD Backlog Table Polish
- Compact data table styling: `py-2.5 px-3` cell padding, subtle borders (`border-slate-200 dark:border-slate-800`), and tabular numbers (`font-mono tabular-nums`).
- Quick action button groups (`Inspect`, `Release Escrow`, `Dispatch`).
- Integrated slide-over action console drawer for deep audits via `WorkOrderActionConsole.tsx`.
- Multi-column sorting (RPI, SLA, Cost, Corridor, Status), filter chips, and 1-click CSV export.

---

## Boundaries & Non-Goals
- No backend schema alterations (frontend presentation & workflow segmentation only).
- Zero regression on existing 34 backend/edge pytest test suite.
