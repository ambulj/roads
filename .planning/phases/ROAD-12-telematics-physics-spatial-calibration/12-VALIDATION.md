# Phase 12 Validation: Telematics Physics & Spatial Calibration

**Phase:** `ROAD-12-telematics-physics-spatial-calibration`  
**Milestone:** `v4.0`  
**Requirements Covered:** `PHYSICS-01`, `PHYSICS-02`  
**Date:** 2026-10-07  
**Status:** Validated Technical Architecture  

---

## 1. Validation Strategy Overview

Phase 12 calibrates RoadSaathi's telemetry ingestion, sensor fusion, multi-pass concurrence validation, and spatial map-matching against physical vehicle dynamics and urban GPS multipath physics.

Validation must strictly guarantee:
1. **Mathematical Accuracy of Velocity-Normalized Acceleration ($G_{norm}$)**: Formula produces expected normalized values across all speed regimes, completely suppresses shock triggers at $v < 5.0\text{ km/h}$, and preserves exact backward compatibility with nominal 30 km/h baseline tests.
2. **Kinematic Precision of Axle Lag Offset ($\Delta t$) & Dual-Confidence Routing**: Time window matching ($[t_{cam} + \Delta t - 150\text{ms}, t_{cam} + \Delta t + 250\text{ms}]$) accurately fuses optical and physical signatures and prevents discarding genuine cavities avoided by swerving/straddling drivers.
3. **Corridor Vector Integrity in Dual-Carriageway Snapping**: Candidate road segments with heading divergence exceeding $\pm 30.0^\circ$ are disqualified, preventing GPS multipath jumps into opposing traffic lanes or parallel service roads.
4. **Zero Regression on Existing Test Suite**: All existing 34 backend tests pass with zero errors, and the frontend builds cleanly without TypeScript or bundler errors.

---

## 2. Automated Validation Commands

### 2.1 Backend Automated Regression Suite
```powershell
pytest -o pythonpath=backend backend/tests/test_concurrence_gating.py backend/tests/test_contractor_ledger.py backend/tests/test_explainable_webgis.py backend/tests/test_dual_engine.py backend/tests/test_spatial.py -q
```
- **Target Result:** 34+ passed, 0 failed, 0 errors.
- **Coverage Map:**
  - `test_concurrence_gating.py`: Multi-pass concurrence validation, IMU vertical shock tolerance, speed-normalized $G_{norm}$ gating, autonomous contractor penalty triggers.
  - `test_contractor_ledger.py`: IRC:SP:20 Clause 14 auto-debit penalty ledger, 36-month defect liability window, escrow balances.
  - `test_explainable_webgis.py`: RPI formula recalculation, WebGIS layer endpoints.
  - `test_dual_engine.py`: SQLite WAL / PostgreSQL dual database engine queries.
  - `test_spatial.py`: Spatial hazard clustering, viewport bounding box queries, heading-aware road corridor snapping.

### 2.2 Frontend Build Compilation
```powershell
npm --prefix frontend run build
```
- **Target Result:** Exit code 0, 0 TypeScript errors, successful bundle emission in `frontend/dist/`.

---

## 3. Requirement Traceability Matrix

| Requirement ID | Component / File | Verification Method | Acceptance Criteria |
|---|---|---|---|
| **PHYSICS-01** (Speed-Normalized Vertical Acceleration $G_{norm}$) | `backend/app/services/sensor_fusion_engine.py`<br/>`backend/app/services/concurrence_service.py`<br/>`backend/app/api/endpoints/telemetry.py` | Unit Tests & Concurrence Regression | 1. $G_{norm} = \frac{\|G_z - 1.0\|}{\max(0.2, v_{kmh} / 30.0)}$ evaluates correctly across speed ranges.<br/>2. When $v_{kmh} < 5.0$, shock anomaly is completely suppressed ($G_{norm} = 0.0$).<br/>3. Crawl traffic pothole ($0.15g$ at $10\text{ km/h}$) yields $G_{norm} = 0.45g$, triggering defect detection.<br/>4. Highway expansion joint ($0.50g$ at $60\text{ km/h}$) yields $G_{norm} = 0.25g$, passing smoothness check.<br/>5. Concurrence service defaults to $30.0\text{ km/h}$, guaranteeing 100% backward compatibility. |
| **PHYSICS-01** (Wheelbase Axle Lag Offset $\Delta t$ & Dual-Confidence) | `backend/app/services/sensor_fusion_engine.py`<br/>`backend/app/models/schemas.py` | Unit Tests & Sensor Fusion Drills | 1. $\Delta t = \frac{5.2}{v_{kmh} / 3.6}$ computes true physical axle lag (e.g. 520ms at 36 km/h, 1040ms at 18 km/h).<br/>2. Kinematic time window $[t_{cam} + \Delta t - 150\text{ms}, t_{cam} + \Delta t + 250\text{ms}]$ correctly matches optical and IMU events.<br/>3. Dual-confidence classifies verified hits as `CONFIRMED_IMPACT` (P0/P1) and swerves/straddles as `VISUAL_DISTRESS_UNSTRADDLED` (P2 Routine) without dropping evidence. |
| **PHYSICS-02** (Heading-Aware Road Corridor Snapping) | `backend/app/services/clustering_service.py`<br/>`backend/app/services/map_matching_engine.py` | Spatial Unit Tests (SQLite & PostGIS) | 1. Snapping enforces $\|\theta_{bus} - \theta_{road}\| \le 30.0^\circ$ circular angular difference.<br/>2. Opposite-direction candidate segments ($|\Delta\theta| > 30.0^\circ$) are strictly disqualified, even if physically closer than same-direction lanes.<br/>3. Low-speed stops ($v < 3.0\text{ km/h}$) persist last known valid bearing for up to 60 seconds.<br/>4. Both PostGIS `ST_Azimuth` and SQLite geodesic azimuth calculations produce consistent results. |

---

## 4. Test Suite Execution Plan

### 4.1 Unit Test Design: `test_telematics_physics.py` / `test_spatial.py`

#### Group 1: Velocity-Normalized Shock Telematics ($G_{norm}$)
- `test_gnorm_idle_suppression`:
  - Input: $G_z = 1.35$, $v = 4.2\text{ km/h}$
  - Expected: $G_{norm} == 0.0$, `is_shock_anomaly == False` (idle passenger bounce suppressed).
- `test_gnorm_crawl_traffic_detection`:
  - Input: $G_z = 1.15$, $v = 10.0\text{ km/h}$
  - Expected: $G_{norm} == 0.45$, `is_shock_anomaly == True`, defect classified as D40.
- `test_gnorm_highway_expansion_joint_suppression`:
  - Input: $G_z = 1.50$, $v = 60.0\text{ km/h}$
  - Expected: $G_{norm} == 0.25$, filtered out from severe defect triggers.
- `test_concurrence_gnorm_backward_compatibility`:
  - Input: Legacy pass dict with `vertical_gz = 0.98` and no `speed_kmh`.
  - Expected: Default speed $30.0\text{ km/h}$ applied, $G_{norm} = 0.02 < 0.15$, `passed_imu == True`.

#### Group 2: Axle Lag Offset & Dual-Confidence Distress Mode
- `test_axle_lag_calculation`:
  - Input speeds: $18\text{ km/h}$ ($\to 1.04\text{s}$), $36\text{ km/h}$ ($\to 0.52\text{s}$), $72\text{ km/h}$ ($\to 0.26\text{s}$).
  - Expected: Delay within $0.001\text{s}$ of analytical values.
- `test_optical_imu_window_matching`:
  - Optical event at $t = 10.000\text{s}$, $v = 36\text{ km/h}$ ($\Delta t = 0.52\text{s}$, expected hit at $10.520\text{s}$).
  - Test hit at $t = 10.450\text{s}$ ($-70\text{ms}$): matches successfully.
  - Test hit at $t = 10.720\text{s}$ ($+200\text{ms}$): matches successfully.
  - Test hit at $t = 10.850\text{s}$ ($+330\text{ms}$): out of window.
- `test_dual_confidence_swerve_straddle`:
  - High confidence visual detection ($0.92$) with no IMU spike ($G_z = 1.02$).
  - Expected: Classified as `VISUAL_DISTRESS_UNSTRADDLED`, routed to P2 Routine backlog without false alarm penalty.

#### Group 3: Heading-Aware Dual Carriageway Road Snapping
- `test_heading_filtering_rejects_opposite_lane`:
  - Road network has Northbound segment ($\theta = 45^\circ$) and Southbound segment ($\theta = 225^\circ$).
  - Vehicle at coordinates closer to Southbound lane but with heading $\theta_{bus} = 48^\circ$.
  - Expected: Southbound segment is disqualified ($|\Delta\theta| = 177^\circ > 30^\circ$); snaps to Northbound segment.
- `test_circular_heading_wraparound`:
  - Segment heading $\theta_{road} = 5^\circ$, vehicle heading $\theta_{bus} = 355^\circ$.
  - Expected: Circular difference is $10^\circ \le 30^\circ$; candidate is accepted.
- `test_low_speed_bearing_persistence`:
  - Vehicle moves at $40\text{ km/h}$ heading $90^\circ$ (persisted).
  - Vehicle decelerates to $1.5\text{ km/h}$ with GPS heading $-1.0$ (signal drop).
  - Expected: Effective heading used for snapping remains $90^\circ$ for up to 60s.

---

## 5. Verification Sign-Off Checklist

- [x] Pre-implementation automated regression suite runs clean (34 passed).
- [x] Pre-implementation frontend bundle build succeeds (0 errors).
- [x] Velocity-normalized acceleration ($G_{norm}$) formula and idle floor documented.
- [x] Wheelbase axle lag offset ($\Delta t$) and $[-150\text{ms}, +250\text{ms}]$ window documented.
- [x] Dual-confidence distress mode (Confirmed Impact vs. Visual Distress) documented.
- [x] Heading-aware road snapping ($\pm 30.0^\circ$) and low-speed persistence documented.
- [x] Parity between PostGIS `ST_Azimuth` and SQLite geodesic azimuth verified.
