# Phase 21 Validation Architecture & Verification Plan

## Validation Strategy
Phase 21 validates:
1. **Ground Truth Model Weights Metrics Matrix (D-21-01, AI-01):** Verified elimination of synthetic active-learning mAP random walks, presence of the empirical 5-model weights metrics schema, and transparent exposure via backend API and frontend dashboards.
2. **IRC:106-1990 Urban PCU Alignment & Multi-Class Mapping (D-21-02, AI-02):** Unification of PCU factors across `traffic_scoring.py`, `pedestrian_safety.py`, and `traffic.py` strictly matching IRC:106 Table 1 urban road values (`2w: 0.5`, `3w: 1.2`, `car/taxi: 1.0`, `lcv: 1.4`, `bus: 2.2`, `truck: 2.2`, `tractor: 4.0`, `cycle: 0.5`), plus multi-class mapping from `indian_roads_detection.pt`.
3. **WCAG 2.1 AA Contrast & Marketing Claim Honesty (D-21-03, THEME-01):** Replacement of "WCAG AAA" claims in `index.css` and documentation with "WCAG 2.1 AA", and remediation of low-contrast muted captions ($\ge 4.5:1$ contrast ratio).

---

## Automated Validation Commands

### 1. Automated Backend Test Suite
```powershell
pytest -o pythonpath=backend backend/tests/test_api_endpoints.py backend/tests/test_production_hardening.py backend/tests/test_contractor_ledger.py backend/tests/test_urban_sensing.py -q
```
**Expected Outcome:**
- All 66+ test cases pass cleanly with 0 failures and 0 errors.
- Tests verify:
  - `calculate_irc106_pcu` with 3W (1.2), Bus (2.2), Truck (2.2), Tractor (4.0), Cycle (0.5).
  - Ground truth metrics exposed in `GET /api/learning/status` and `GET /api/models/status`.
  - ANPR sample endpoint returns verified benchmark payload.

### 2. Frontend Production Build
```powershell
npm --prefix frontend run build
```
**Expected Outcome:**
- 100% clean build via `tsc && vite build`.
- 0 TypeScript type errors or syntax issues.
- Bundle emission without regressions.

---

## Manual Verification Matrix

| Verification Target | Steps / Inspection | Expected Result |
|---|---|---|
| **AI Ground Truth Matrix** | Navigate to **Edge AI & Hardware** (`/edge-ai`) and **Continuous Retraining Studio** | Dashboards display verified empirical metrics: `zebra.pt` (0.993 mAP50), `anpr.pt` (0.693 mAP50), `potholedetection.pt` (0.471 mAP50), `vehicle_detection.pt` (0.404 mAP50), `indian_roads_detection.pt` (0.219 mAP50). No synthetic `+3.8% Δ` random walk. |
| **IRC:106 PCU Calculation** | Inspect PCU values in `GET /api/traffic/density` and test `calculate_irc106_pcu(counts_3w=10, counts_bus=5)` | Result is `(10 * 1.2) + (5 * 2.2) = 12.0 + 11.0 = 23.0` PCU. Auto-rickshaw equals 1.2 PCU, bus equals 2.2 PCU. |
| **Multi-Class Vehicle Mapping** | Send detection list containing `Autorickshaw`, `Tempo`, `Tractor`, `Cycle` to PCU calculator | PCU mapped to 1.2, 1.4, 4.0, and 0.5 respectively. |
| **Contrast & WCAG Claim** | Inspect `frontend/src/index.css` line 13 and check color contrast of muted captions in light theme | "WCAG AAA" claim replaced with "WCAG 2.1 AA". Muted text classes use `text-slate-600 dark:text-slate-400` or `text-zinc-600 dark:text-zinc-400`, yielding $\ge 4.5:1$ contrast against white. |

---
*RoadSaathi Phase 21 Validation Architecture*
