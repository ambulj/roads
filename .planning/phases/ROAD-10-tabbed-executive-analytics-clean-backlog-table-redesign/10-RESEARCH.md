# Phase 10 Research: Tabbed Executive Analytics & Clean Backlog Table Redesign

**Phase:** `ROAD-10-tabbed-executive-analytics-clean-backlog-table-redesign`  
**Milestone:** `v3.2` (Sleek Minimalist Civic Cockpit & UI De-cluttering)  
**Requirement:** `DECLUTTER-03`  
**Author:** Technical Architecture & Design System Researcher  
**Target Files:**
- [`frontend/src/pages/Analytics.tsx`](file:///C:/Users/sauja/Downloads/roads/frontend/src/pages/Analytics.tsx)
- [`frontend/src/pages/WorkOrders.tsx`](file:///C:/Users/sauja/Downloads/roads/frontend/src/pages/WorkOrders.tsx)
- [`frontend/src/components/workorders/WorkOrderActionConsole.tsx`](file:///C:/Users/sauja/Downloads/roads/frontend/src/components/workorders/WorkOrderActionConsole.tsx)
- [`frontend/src/components/triage/MetricCards.tsx`](file:///C:/Users/sauja/Downloads/roads/frontend/src/components/triage/MetricCards.tsx)
- [`frontend/src/App.tsx`](file:///C:/Users/sauja/Downloads/roads/frontend/src/App.tsx)

---

## 1. Executive Summary & Problem Analysis

### 1.1 Existing Architecture & Deficiencies
In current iterations:
1. **Analytics Viewport Overload (`Analytics.tsx` ~979 LOC):**
   - Renders 10+ heavyweight ApexCharts graphs, 3 large data tables (Corridors, Dark Spots, Transit Delays), 2 diagnostic grids (Fleet Diagnostics, Traffic Density), and an interactive ANPR OCR engine in a single, un-segmented vertical scrolling canvas.
   - Requires excessive vertical scrolling for municipal commissioners seeking specific domain KPIs (e.g. looking for school zone pedestrian safety requires scrolling past 600px of transit speed graphs and contractor penalty tables).
   - High memory and rendering footprint as all ApexCharts instances initialize and animate simultaneously.

2. **Work Orders CAD Backlog Table (`WorkOrders.tsx` ~1107 LOC):**
   - Table cells use loose padding (`py-3 px-4`), taking up significant vertical space and limiting the number of visible backlog tickets per screen.
   - Action controls within rows are disparate; quick actions (`Audit & Dispatch`, `3D Mesh`, `WhatsApp Dispatch`, status dropdowns) lack clear clustering and visual hierarchy.
   - Dense operational data (multi-bus concurrence, statutory contractor escrow, volumetric repair materials) needs clean separation between high-level scanability and slide-over deep-dive forensic inspection.

### 1.2 Target Vision (Milestone v3.2 & DECLUTTER-03)
- Transform `Analytics.tsx` into a **5-Tab Segmented Executive Workspace** with responsive horizontal scroll pill switchers and two-way URL query synchronization (`#/analytics?tab=overview | corridors | traffic | safety | anpr`).
- Polish `WorkOrders.tsx` CAD backlog table with **compact cell density (`py-2.5 px-3`)**, monospace tabular numbers (`font-mono tabular-nums`), clean action clusters (`Inspect`, `Release Escrow`, `Dispatch`), and seamless deep-dive drawer integration (`WorkOrderActionConsole.tsx`).
- Preserve all existing domain functionality: MoRTH PCI curves, IRC:SP:20 contractor penalty ledgers, SIH   OD Transit Desire Lines, Vision Zero school zone grading, dark spot luminescence tracking, and Edge ANPR OCR inference.

---

## 2. Analytics 5-Tab Segmented Architecture

```
                                    ┌──────────────────────────────────────────────────────────┐
                                    │                   Analytics.tsx Header                   │
                                    │      Road Network Analytics · MoRTH / IRC:SP:20 / PS     │
                                    └────────────────────────────┬─────────────────────────────┘
                                                                 │
                                         ┌───────────────────────┴──────────────────────┐
                                         │  5-Tab Sub-Header Pill Bar (URL Hash Synced) │
                                         └───────────────────────┬──────────────────────┘
                 ┌───────────────────┬───────────────────┼───────────────────┬───────────────────┐
                 ▼                   ▼                   ▼                   ▼                   ▼
          ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
          │  Overview   │     │  Corridors  │     │   Traffic   │     │   Safety    │     │  Edge ANPR  │
          │  (`overview`)│     │(`corridors`)│     │ (`traffic`) │     │ (`safety`)  │     │  (`anpr`)   │
          └──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
                 │                   │                   │                   │                   │
  ┌──────────────┴──────────┐ ┌──────┴──────────┐ ┌──────┴──────────┐ ┌──────┴──────────┐ ┌──────┴──────────┐
  │• MetricCards Gauges     │ │• 5 Arterials    │ │• GTFS Delays vs │ │• Vision Zero    │ │• Interactive    │
  │• 4-Stat Ribbon          │ │  Risk Matrix    │ │  Distress Time  │ │  School Zones   │ │  ANPR OCR Test  │
  │• Speed vs Distress      │ │• P0/P1/P2 Defect│ │• IRC:106 Choke  │ │  (IRC:35/MoRTH) │ │• HSRP Sec 65B   │
  │  Dual-Spline Area Chart │ │  Breakdown      │ │  Points & LoS   │ │• Night Darkspots│ │  Compliance    │
  │• RPI Statutory Weights  │ │• Action Status  │ │•   OD    │ │  Luminescence   │ │• Arterial PCU   │
  │  Radial Bar Chart       │ │• Fleet Ingest   │ │  Desire Lines   │ │  Outage Audit   │ │  Traffic Density│
  │• PCI Decay & Damages    │ │  Diagnostics    │ │  Flow Matrix    │ │  (<5 Lux Alerts)│ │  Grid           │
  └─────────────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

### 2.1 Tab 1: 📊 Executive Overview KPI (`overview`)
- **MetricCards Integration:** Circular SVG animated progress rings showing Active Edge Buses, 15m DBSCAN Clusters, Verified Repairs, On-Time SLA %, and Detection FPS.
- **4-Stat Ribbon:** Total Ingests, Spatial Deduplication Ratio, Average Dynamic RPI, and Critical Hazards Requiring Emergency Infill.
- **Speed vs Distress Ingestion Rate:** Dual-spline ApexCharts area visualization correlating transit bus operating velocity ($km/h$) against continuous defect encounter frequency.
- **RPI Statutory Weights (IRC:SP:20):** Multi-radial bar breakdown displaying statutory factor proportions (Severity 40%, Frequency/Passes 20%, Road Classification 20%, POI Proximity 20%).
- **Pavement Degradation (PCI Decay) & Contractor Penalty Donut:** 6-month historical PCI decay across Anna Salai, OMR, GST Road, and Inner Ring Road alongside categorized MoRTH liquidated damages.

### 2.2 Tab 2: 🛣️ Corridor Health & Arterial Risk (`corridors`)
- **Chennai Arterial Road Corridor Risk Matrix:** Structured table ranking top transit corridors (GST Road NH-32, OMR IT Expressway, Anna Salai CBD, Kathipara Cloverleaf, Central Link).
- **Corridor Defect Distribution:** Quantitative breakdown of P0 Critical potholes, raw ingests, clustered hazard points, average RPI with color-coded progress bars, and priority action status (`PRIORITY DISPATCH` vs `MONITORED`).
- **Edge Fleet Ingest Diagnostics:** Micro-cards displaying active fleet telemetry nodes (e.g. `BUS-TN01-1042`), active route assignments, and individual ingest counts.

### 2.3 Tab 3: 🚦 Traffic Dynamics & OD Transit Flow (`traffic`)
- **GTFS Public Transit Delay Attribution:** Separates transit delay caused by surface pavement distress ($t_{distress}$) from background peak congestion delay ($t_{traffic}$) with headway regularity metrics.
- **IRC:106 Road Bottlenecks & Capacity Choke Points:** Real-time monitoring of LoS E & F segments, passenger car unit (PCU) densities, average velocity drops, root cause diagnosis, and diversion recommendations.
- **SIH   Origin-Destination (OD) Desire Lines Flow Matrix:** Detailed inter-nodal corridor cards displaying Origin $\to$ Destination flow vectors, distance ($km$), actual transit time vs scheduled delay, hourly PCU volume, and pavement distress travel-time attribution.

### 2.4 Tab 4: 🛡️ Safety & Lighting Infrastructure (`safety`)
- **Vision Zero Safe School & Hospital Corridor Index:** Comprehensive multi-class safety evaluation across vulnerable civic institutions. Features institutional letter grades (A+ to F), overall safety score progress bars, IRC:35 zebra crossing compliance, caution signage installation status, and pedestrian footpath clearance percentages.
- **Night-Time Luminescence & Dark Spot Outage Audit:** Tabular log of unlit road segments ($<5$ Lux over $>50m$) detected via Starlight camera sensor gain, displaying corridor segment, zone/division, unlit length in meters, average luminescence, nearby commuter anchors, and electrical division dispatch flags.

### 2.5 Tab 5: 👁️ Edge ANPR & Vision AI (`anpr`)
- **Interactive License Plate OCR Scanner:** Test runner triggering edge neural OCR (`api.getANPRSample()`) with instant visual feedback displaying high-security registration plates (HSRP), Indian state/RTO parsing, inference latency ($ms$), confidence scores, and Section 65B Indian Evidence Act admissibility indicators.
- **Arterial Traffic Density & Vehicle Classification:** Grid cards analyzing PCU density per km, average vehicle speeds, congestion classifications, and observation timestamps across arterial avenues.

### 2.6 Sub-Tab Switcher Design Tokens & 2-Way URL Sync
- **Active Pill Token:**
  `bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800/80 shadow-xs`
- **Inactive Pill Token:**
  `bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent`
- **Pill Bar Container:**
  `flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto custom-scrollbar shadow-xs`
- **Two-Way URL Sync Mechanism:**
  - Reads `window.location.hash` query parameters on initialization (`#/analytics?tab=traffic`).
  - Listens to `hashchange` events to support browser forward/back buttons and deep links.
  - Updates `window.location.hash` without triggering full component reload when tabs are clicked.
- **Route Alias Redirection in `App.tsx`:**
  - `#/traffic` $\to$ `#/analytics?tab=traffic`
  - `#/pedestrian` $\to$ `#/analytics?tab=safety`
  - `#/darkspots` $\to$ `#/analytics?tab=safety`
  - `#/incidents` $\to$ `#/analytics?tab=traffic`

---

## 3. Work Orders CAD Backlog Table Redesign

### 3.1 Compact Density & Visual Polish
- **Cell Padding:** Compact `py-2.5 px-3` (reduced from `py-3 px-4`), optimizing vertical viewport density to fit 25-30% more backlog items per page.
- **Subtle Borders & Surfaces:** Clean light/dark boundary tokens (`border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-900`).
- **Data Formatting:** Monospace tabular numbers (`font-mono tabular-nums text-xs`) for all financial amounts (₹), SLA remaining hours, and Ticket IDs (`WO-2026-CHE-XXX`).
- **Severity Badges:** High-contrast, minimal pill badges for P0 Critical (`bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900`), P1 High (`bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900`), and P2 Medium (`bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700`).

### 3.2 Action Cluster Grouping
Rather than cluttered individual buttons, actions in table rows are grouped into three focused categories:
1. **`Inspect` / `Audit`:** Opens the slide-over drawer to the `cad_audit` tab or triggers the `RoadMeshVisualizerModal` (3D Mesh).
2. **`Release Escrow` / `Concurrence`:** Quick trigger opening the `concurrence_release` tab in `WorkOrderActionConsole` to verify 3-pass bus telemetry and release contractor holdback funds under IRC:SP:20 Clause 14.
3. **`Dispatch`:** WhatsApp/SMS emergency notice dispatch with direct ward engineer routing.

### 3.3 Slide-Over Drawer Integration (`WorkOrderActionConsole.tsx`)
- Provides an uncompromised deep-dive inspection console that slides over the right side of the screen (`fixed inset-y-0 right-0 z-50 w-full max-w-3xl`).
- Contains three dedicated operational tabs:
  1. `cad_audit`: Interactive before/after split slider, 3D volumetric material calculator, and defect telemetry logs.
  2. `contractor_sla`: SLA countdown clock, liquidated damage penalty calculator, and WhatsApp/QR emergency notice generator.
  3. `concurrence_release`: 3-pass independent bus confirmation ledger, IMU vertical shock peaks ($G_z$), and 1-click statutory escrow fund release.

### 3.4 Multi-Column Sorting & Filter Chips
- **Sort Fields:** Multi-directional sorting (`asc` / `desc`) by Ticket ID (`code`), Statutory Priority (`rpi`), Corridor / Defect (`road`), Volumetric Cost (`cost`), and SLA Countdown (`sla`).
- **Filter Chips:** 1-click pills for Severity (All, P0 Critical, P1 High, P2 Medium), Contractor Agency (L&T, GMR, TNRDC, HCC, Chettinad), and SLA State (Active, Breached, Verified Closed).
- **1-Click CSV Export:** Generates standardized tabular RFC 4180 CSV exports containing Ticket ID, Road Corridor, Defect Type, RPI Score, Cost (INR), Bitumen Mix (kg), Assigned Agency, SLA State, and Multi-Bus Passes.

---

## 4. Implementation Strategy & Architecture Diff

### 4.1 Component Modularization in `Analytics.tsx`
```typescript
// Sub-tab Identifier
export type AnalyticsSubTab = 'overview' | 'corridors' | 'traffic' | 'safety' | 'anpr';

// State & URL Hook
const [activeTab, setActiveTab] = useState<AnalyticsSubTab>(getInitialTab);

const handleTabChange = (tab: AnalyticsSubTab) => {
  setActiveTab(tab);
  const [base] = window.location.hash.split('?');
  window.location.hash = `${base || '#/analytics'}?tab=${tab}`;
};
```

### 4.2 Route Aliases in `App.tsx`
```typescript
// App.tsx handleNavigate and handleDeepLink updates
const handleNavigate = useCallback((route: string) => {
  const cleaned = route.replace(/^#\/?/, "").trim();
  const [routePart, queryPart] = cleaned.split('?');
  
  let target = routePart as AppRoute;
  let effectiveQuery = queryPart;
  
  // Legacy aliases
  if (target === "traffic") {
    target = "analytics";
    effectiveQuery = effectiveQuery ? `${effectiveQuery}&tab=traffic` : "tab=traffic";
  } else if (target === "pedestrian" || target === "darkspots") {
    target = "analytics";
    effectiveQuery = effectiveQuery ? `${effectiveQuery}&tab=safety` : "tab=safety";
  } else if (target === "incidents") {
    target = "analytics";
    effectiveQuery = effectiveQuery ? `${effectiveQuery}&tab=traffic` : "tab=traffic";
  }
  // ...
});
```

---

## 5. Validation Architecture

To ensure zero regression and verified quality across both frontend and backend systems, the following automated verification suite is established:

### 5.1 Automated Frontend Build Verification
The TypeScript build pipeline compiles all assets, executes type validation, and verifies bundle chunking:
```bash
npm --prefix frontend run build
```
*Verification criteria:* Must exit with code `0` and generate valid production bundles with zero JSX/TypeScript errors.

### 5.2 Automated Backend Regression Suite
The backend test suite verifies SQLite WAL / PostgreSQL dual engine compatibility, contractor SLA ledgers, multi-pass concurrence gating, explainable WebGIS RPI scoring, and DBSCAN spatial clustering:
```bash
pytest -o pythonpath=backend backend/tests/test_concurrence_gating.py backend/tests/test_contractor_ledger.py backend/tests/test_explainable_webgis.py backend/tests/test_dual_engine.py backend/tests/test_spatial.py -q
```
*Verification criteria:* All 34 tests must pass with 100% success rate (`34 passed in <15s`).

### 5.3 Manual UI Acceptance Criteria
1. Clicking sub-tabs in `Analytics.tsx` smoothly switches between all 5 tabs without full page reloads or layout jumps.
2. The URL hash reflects `#/analytics?tab=<tab_name>` and allows bookmarking/reloading directly into the selected tab.
3. Legacy bookmarks (`#/traffic`, `#/pedestrian`, `#/darkspots`) seamlessly redirect to their respective tabs in `Analytics`.
4. `WorkOrders.tsx` CAD table renders with compact `py-2.5 px-3` padding, tabular-nums typography, functioning multi-column sorting, filter chips, and slide-over action drawer invocation.
