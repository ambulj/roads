# Phase 7 Validation Plan: Municipal Dashboard, Work Orders & SLA Action Console Polish

**Phase**: `ROAD-07-municipal-dashboard-work-orders-sla-action-console-polish`
**Requirement Reference**: `UI-03`

---

## 1. Automated Verification Commands

### Frontend Build & Typecheck
```bash
npm --prefix frontend run build
```
- **Fails if**: TypeScript compiler finds type mismatches, missing props, broken imports, or JSX lint issues.
- **Passes when**: Clean production bundle output in `frontend/dist/` with 0 warnings/errors.

### Backend & Edge Regression Suite
```powershell
powershell -Command "$env:PYTHONPATH='backend'; pytest backend/tests/test_concurrence_gating.py backend/tests/test_contractor_ledger.py backend/tests/test_explainable_webgis.py backend/tests/test_dual_engine.py backend/tests/test_spatial.py -q"
```
- **Fails if**: Any API endpoint contracts or database schemas break.
- **Passes when**: 100% of tests pass without regressions.

---

## 2. Per-Task Verification Matrix

| Task ID | Task Description | Verification Command | Negative Failure Signal |
| :--- | :--- | :--- | :--- |
| `07-01-01` | Executive KPI Scorecards & Live Fleet Health Gauges (`MetricCards.tsx`, `CommandCenter.tsx`, `Analytics.tsx`) | `npm --prefix frontend run build` | Metric card props break, SVG rings fail to render or jitter layout. |
| `07-01-02` | Interactive Contractor SLA & Concurrence Action Console (`WorkOrderActionConsole.tsx`, `ContractorSlaLedger.tsx`, `WorkOrders.tsx`) | `npm --prefix frontend run build` | Payment release button clickable without 3 passes, tab switching broken, or auto-debit modal missing. |

---

## 3. Visual & Accessibility Acceptance Criteria

- [ ] **WCAG AAA Compliance**: Text contrast $\ge 7:1$ across all badge variants, buttons, and tab controls in Light, Dark, and Cyber-Edge themes.
- [ ] **Tabular Numerals**: Speedometers, RPI scores, currency amounts, and timers use `font-mono tabular-nums` to prevent horizontal jitter.
- [ ] **3-Pass Concurrence Gating**: Payment clearance CTA explicitly disabled with explanatory tooltip when pass count $< 3$.
- [ ] **Data Table Usability**: Work order backlog sorting, search filtering, and CSV export function cleanly.
