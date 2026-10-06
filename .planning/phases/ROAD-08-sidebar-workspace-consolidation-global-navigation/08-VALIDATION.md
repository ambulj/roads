# Phase 8 Validation Plan: Sidebar Workspace Consolidation & Global Navigation

**Phase**: `ROAD-08-sidebar-workspace-consolidation-global-navigation`
**Requirement Reference**: `DECLUTTER-01`

---

## 1. Automated Verification Commands

### Frontend Build & Typecheck
```bash
npm --prefix frontend run build
```
- **Fails if**: TypeScript errors, missing prop definitions, broken lazy-chunk imports, or invalid route references.
- **Passes when**: Vite build succeeds cleanly with 0 warnings/errors.

### Backend Regression Test Suite
```powershell
pytest -o pythonpath=backend backend/tests/test_concurrence_gating.py backend/tests/test_contractor_ledger.py backend/tests/test_explainable_webgis.py backend/tests/test_dual_engine.py backend/tests/test_spatial.py -q
```
- **Passes when**: 100% of test cases pass without regressions.

---

## 2. Per-Task Verification Matrix

| Task ID | Task Description | Verification Command | Negative Failure Signal |
| :--- | :--- | :--- | :--- |
| `08-01-01` | Sidebar 5-Workspace Consolidation & Routing Architecture (`SidebarNav.tsx`, `App.tsx`, `Header.tsx`) | `npm --prefix frontend run build` | Menu links mismatch valid routes, keyboard shortcuts 1-5 break, or collapsed tooltips fail to position. |
| `08-01-02` | Sub-Tab Switchers & Mobile Navigation Drawer (`WorkOrders.tsx`, `FleetNodes.tsx`, `RoadMemory.tsx`, `BottomNav.tsx`) | `npm --prefix frontend run build` | Sub-tab clicks fail to switch views, mobile drawer fails to open, or active tab styling has low contrast. |

---

## 3. Visual & Usability Acceptance Criteria

- [ ] **5 Core Workspaces**: Sidebar displays exactly 5 primary items (*Command Center*, *Work Orders & SLA*, *Safety Analytics*, *Fleet Perception*, *Governance & Memory*).
- [ ] **Sub-Tab Switchers**: Sub-features within Work Orders, Fleet, and Road Memory switch seamlessly with indigo pill active indicators.
- [ ] **Mobile Navigation**: Bottom bar features 4 primary targets and a slide-over "More" drawer for Governance.
- [ ] **Keyboard Shortcuts**: Keys `1` through `5` navigate to the 5 consolidated workspaces.
