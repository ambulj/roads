# Phase 9 Validation Plan: Map HUD & Command Center Viewport Optimization

**Phase**: `ROAD-09-map-hud-command-center-viewport-optimization`
**Requirement Reference**: `DECLUTTER-02`

---

## 1. Automated Verification Commands

### Frontend Build & Typecheck
```bash
npm --prefix frontend run build
```
- **Fails if**: TypeScript compilation errors, JSX syntax mistakes, broken props, or layout class mismatches.
- **Passes when**: Vite build completes with 0 warnings/errors.

### Backend Regression Test Suite
```powershell
pytest -o pythonpath=backend backend/tests/test_concurrence_gating.py backend/tests/test_contractor_ledger.py backend/tests/test_explainable_webgis.py backend/tests/test_dual_engine.py backend/tests/test_spatial.py -q
```
- **Passes when**: 100% of test cases pass without regressions.

---

## 2. Per-Task Verification Matrix

| Task ID | Task Description | Verification Command | Negative Failure Signal |
| :--- | :--- | :--- | :--- |
| `09-01-01` | Collapsible Single-Line Top Executive Bar & Collapsible Triage Dock (`CommandCenter.tsx`, `MetricCards.tsx`, `PriorityQueue.tsx`) | `npm --prefix frontend run build` | Map canvas flickers on toggle, metric cards fail to collapse/expand, or right dock rail layout breaks. |
| `09-01-02` | Slide-Up Bottom Analytical Trays & Top Micro-Dock Polish (`WebGISMap.tsx`) | `npm --prefix frontend run build` | OD matrix or blind spots overlap map pins instead of docking at bottom, or top dock overflows on mobile. |

---

## 3. Visual & Viewport Acceptance Criteria

- [ ] **Viewport Expansion**: Map canvas expands vertically and horizontally when top HUD is collapsed and right dock is in rail mode.
- [ ] **Zero Map Reset**: Toggling the top bar or dock rail triggers smooth CSS layout transitions with `map.resize()` and no WebGL context loss.
- [ ] **Slide-up Bottom Trays**: OD Desire Lines, Coverage Blind Spots, and Corridor Profiles slide up from the bottom edge with clean minimize/close buttons.
- [ ] **Top Micro-Dock**: Floating capsule contains quick corridor navigation pills and 10-layer analytical dropdown with click-outside protection.
