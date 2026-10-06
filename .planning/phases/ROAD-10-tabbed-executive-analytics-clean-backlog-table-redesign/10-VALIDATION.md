# Phase 10 Validation Architecture: Tabbed Executive Analytics & Clean Backlog Table Redesign

**Phase:** `ROAD-10-tabbed-executive-analytics-clean-backlog-table-redesign`  
**Milestone:** `v3.2`  
**Requirement:** `DECLUTTER-03`  

---

## 1. Automated Verification Commands

### 1.1 Frontend Typecheck & Production Build
```bash
npm --prefix frontend run build
```
- **Target:** Verify zero TypeScript compiler errors, clean JSX component nesting, and correct dynamic chunk generation for `Analytics.tsx`, `WorkOrders.tsx`, and `WorkOrderActionConsole.tsx`.
- **Expected Outcome:** Exit code 0, 0 build errors.

### 1.2 Full Backend Regression Test Suite
```bash
pytest -o pythonpath=backend backend/tests/test_concurrence_gating.py backend/tests/test_contractor_ledger.py backend/tests/test_explainable_webgis.py backend/tests/test_dual_engine.py backend/tests/test_spatial.py -q
```
- **Target:** Verify 100% test pass rate across 34 backend automated test cases covering statutory ledger, DBSCAN spatial clustering, concurrence gating, and dual SQLite/PostgreSQL engine.
- **Expected Outcome:** `34 passed in <15s`.

---

## 2. Test Execution Matrix

| Test Suite / Scope | Command | Expected Output | Status |
|---|---|---|---|
| Frontend Build & Typecheck | `npm --prefix frontend run build` | `✓ built in ~22s`, `dist/` generated | Verified Passing |
| Backend Concurrence Gating | `pytest -o pythonpath=backend backend/tests/test_concurrence_gating.py -q` | `7 passed` | Verified Passing |
| Contractor SLA Ledger | `pytest -o pythonpath=backend backend/tests/test_contractor_ledger.py -q` | `6 passed` | Verified Passing |
| Explainable WebGIS Formulas | `pytest -o pythonpath=backend backend/tests/test_explainable_webgis.py -q` | `7 passed` | Verified Passing |
| Dual Database Engine | `pytest -o pythonpath=backend backend/tests/test_dual_engine.py -q` | `7 passed` | Verified Passing |
| DBSCAN Spatial Clustering | `pytest -o pythonpath=backend backend/tests/test_spatial.py -q` | `7 passed` | Verified Passing |

---

## 3. Manual Verification Checklist

1. **Analytics 5-Tab Navigation:**
   - [ ] Navigate to `#/analytics` and verify default tab is `overview`.
   - [ ] Click through each of the 5 sub-tabs:
     - 📊 `overview`: Executive Scorecards (`MetricCards`), 4-stat ribbon, Speed vs Distress dual-spline, Priority weights radial bar, Pavement degradation bar chart, Contractor liquidated damages donut chart.
     - 🛣️ `corridors`: 5-corridor risk matrix table, defect breakdown, Edge fleet diagnostics.
     - 🚦 `traffic`: GTFS public transit delay attribution, IRC:106 bottlenecks choke points, PS 26124 OD Desire Lines flow matrix.
     - 🛡️ `safety`: Vision Zero school zone grading, Night darkspots & luminescence audit table.
     - 👁️ `anpr`: Interactive license plate OCR scanner test, arterial traffic density cards.
   - [ ] Confirm active pill token styling (`bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300`).
   - [ ] Test direct URL hash navigation (e.g. paste `#/analytics?tab=safety` and verify it lands directly on Tab 4).
   - [ ] Test legacy route aliases (`#/traffic`, `#/pedestrian`, `#/darkspots`, `#/incidents`) and verify proper forwarding.

2. **Work Orders CAD Backlog Table Polish:**
   - [ ] Navigate to `#/work-orders` (CAD Backlog tab).
   - [ ] Verify compact cell padding (`py-2.5 px-3`) and clean monospace tabular number alignment.
   - [ ] Test multi-column sorting by clicking headers (Ticket ID, RPI Score, Corridor/Defect, Volumetric Cost, SLA).
   - [ ] Test severity and agency filter chips (e.g. filter by `P0 Critical` or `L&T Highways`).
   - [ ] Test 1-click CSV export button and verify downloaded data formatting.
   - [ ] Click `Audit & Dispatch` button on any row and confirm the slide-over action console drawer opens seamlessly to `cad_audit`.
   - [ ] Click `Concurrence Gate` button and confirm the drawer opens to `concurrence_release` with multi-bus pass confirmation.
