# Phase 12 Plan 01: Telematics Velocity-Normalized Shock, Optical-to-Axle Lag Synchronization, and Heading-Aware Road Snapping — Execution Summary

**Phase:** `ROAD-12-telematics-physics-spatial-calibration`  
**Plan:** `12-01`  
**Requirements Covered:** `PHYSICS-01`, `PHYSICS-02`  
**Status:** Completed & Fully Verified  
**Date:** 2026-10-07  

---

## 1. Overview & Objectives Accomplished

RoadSaathi's telemetry ingestion, sensor fusion, multi-pass concurrence validation, and spatial map-matching have been calibrated against real-world vehicle physical dynamics and urban GPS multipath physics:
1. **Speed-Normalized Vertical Shock Telematics ($G_{norm}$)**:
   - Implemented $G_{norm} = \frac{|G_z - 1.0|}{\max(0.2, v_{kmh} / 30.0)}$ for $v \ge 5.0\text{ km/h}$, with strict $0.0$ clamping below $5.0\text{ km/h}$ (idle floor suppression).
   - Eliminated false alarms from bus stop passenger boarding bounces, door slams, and idling.
   - Boosted crawl traffic sensitivity ($0.15g$ shock at $10\text{ km/h}$ normalizes to severe $0.45g$ pothole defect) and suppressed highway vibrations ($0.50g$ bridge expansion joint at $60\text{ km/h}$ normalizes down to $0.25g$).
2. **Wheelbase Optical-to-Axle Physical Lag Offset ($\Delta t$) & Dual-Confidence Distress Mode**:
   - Implemented standard wheelbase delay model $\Delta t = \frac{5.2\text{ m}}{v_{kmh} / 3.6}$ (e.g. $520\text{ms}$ at $36\text{ km/h}$, $1040\text{ms}$ at $18\text{ km/h}$).
   - Implemented asymmetric temporal matching window $[t_{cam} + \Delta t - 150\text{ms}, t_{cam} + \Delta t + 250\text{ms}]$ compensating for front/rear axle impact differences and frame grab latencies.
   - Formalized dual-confidence classification:
     - `CONFIRMED_IMPACT` (P0/P1 emergency work order): Optical cavity verified by synchronized axle shock.
     - `VISUAL_DISTRESS_UNSTRADDLED` (P2 Routine): Windshield camera detects cavity ($\ge 0.85$) while wheels actively swerved or straddled the crater ($G_{norm} < 0.20$), preserving valid defects without dropping evidence.
     - `SHOCK_ONLY_ANOMALY`: Strong normalized shock without optical trigger (night/rain/subsurface void).
3. **Heading-Aware Dual Carriageway Road Snapping & Low-Speed Bearing Persistence**:
   - Implemented $\pm 30.0^\circ$ circular angular difference filter between vehicle heading $\theta_{bus}$ and road centerline azimuth $\theta_{road}$.
   - Disqualified opposite-lane candidate segments ($|\Delta \theta| > 30.0^\circ$), preventing GPS multipath jumps (5–12m) under metro viaducts from snapping to opposing carriageways.
   - Implemented in-memory bearing persistence cache (`_bus_bearing_cache`) with 60-second TTL for vehicles stopping or crawling ($< 3.0\text{ km/h}$).
   - Ensured dual-database parity with PostgreSQL PostGIS `ST_Azimuth` queries and Python spherical geodesic azimuth calculations.

---

## 2. Changes Made & File Inventory

| Component / File | Key Changes |
|---|---|
| `backend/app/services/sensor_fusion_engine.py` | Implemented `compute_normalized_shock`, `compute_gnorm`, `calculate_axle_lag`, `compute_axle_lag_window`, `match_optical_and_imu`, and `classify_dual_confidence_distress`. Updated `ingest_ais140_packet` and `execute_fusion_verification` to normalize shocks and return `g_norm`, `axle_lag_ms`, and `distress_mode`. Calibrated legal speed bump filter to require `g_norm < 0.30`. |
| `backend/app/services/concurrence_service.py` | Added `speed_kmh` (default 30.0 km/h) and `g_norm` to `ConcurrencePassItem`. Updated `evaluate_concurrence_passes` to compute $G_{norm}$ and evaluate tolerance ($0.15$) and severe shock recurrence ($0.35$). Updated database query to extract `speed_kmh` from raw ingests. Preserved 100% backward compatibility for legacy callers. |
| `backend/app/services/clustering_service.py` | Implemented `circular_heading_delta`, `calculate_geodesic_azimuth`, `_calculate_segment_azimuth`. Added 60s TTL bearing persistence cache. Updated `snap_to_road_corridor` with heading filter ($\le 30.0^\circ$) for both PostGIS `ST_Azimuth` and Python geodesic fallback. Updated `cluster_points` to forward heading, speed, and bus ID. |
| `backend/app/services/map_matching_engine.py` | Updated candidate matching cost in `match_gps_to_road` with heavy penalty ($+300.0$) when candidate heading delta exceeds $30.0^\circ$. |
| `backend/app/services/telemetry_buffer.py` | Updated `is_priority` to evaluate `compute_gnorm(gz, speed) >= 0.30`, ensuring crawl-traffic pothole detections are prioritized under high watermark shedding. |
| `backend/app/api/endpoints/telemetry.py` | Calculated `g_norm` in `/ingest` and broadcast to active WebSockets. |
| `backend/app/services/anpr_engine.py` | Added project root sys.path fallback for `edge.anpr_onnx` to ensure headless test runners with `pythonpath=backend` execute cleanly. |
| `backend/tests/test_telematics_physics.py` | Created comprehensive 15-test unit suite covering $G_{norm}$ idle floor suppression, crawl traffic sensitivity, highway suppression, baseline equivalence, axle lag delay formulas, asymmetric window matching, dual-confidence classification, circular heading wraparound, geodesic azimuth, opposite lane disqualification, low-speed bearing persistence, and legacy backward compatibility. |
| `backend/tests/test_spatial.py` | Added `test_heading_aware_corridor_snapping` verifying heading filtering in road snapping. |
| `backend/tests/test_concurrence_gating.py` | Added `test_speed_normalized_concurrence_passes` verifying multi-pass concurrence under velocity normalization. |

---

## 3. Verification & Validation Results

### 3.1 Backend Pytest Regression
Command:
```powershell
pytest -o pythonpath=backend backend/tests/test_telematics_physics.py backend/tests/test_concurrence_gating.py backend/tests/test_contractor_ledger.py backend/tests/test_explainable_webgis.py backend/tests/test_dual_engine.py backend/tests/test_spatial.py -q
```
**Output:**
```
...................................................                      [100%]
51 passed, 2 warnings in 6.42s
```
- **Passed:** 51 / 51 tests (100% pass rate).
- **Target Threshold:** $\ge 46$ passed tests.
- **Failures / Errors:** 0.

### 3.2 Frontend Production Build
Command:
```powershell
npm --prefix frontend run build
```
**Output:**
```
vite v5.4.21 building for production...
transforming...
✓ 1638 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 7.69s
```
- **Exit Code:** 0.
- **TypeScript Errors:** 0.
- **Bundle Compilation:** Complete and cleanly emitted in `frontend/dist/`.

---

## 4. Requirement Traceability Matrix

| Requirement | Implementation Artifacts | Verification Method | Status |
|---|---|---|---|
| **PHYSICS-01** (Speed-Normalized Acceleration $G_{norm}$) | `sensor_fusion_engine.py`, `concurrence_service.py`, `telemetry.py`, `telemetry_buffer.py` | `test_telematics_physics.py` (Tests 1-5), `test_concurrence_gating.py` | **VERIFIED** |
| **PHYSICS-01** (Axle Lag Offset $\Delta t$ & Dual-Confidence) | `sensor_fusion_engine.py` | `test_telematics_physics.py` (Tests 6-10) | **VERIFIED** |
| **PHYSICS-02** (Heading-Aware Road Snapping & Bearing Persistence) | `clustering_service.py`, `map_matching_engine.py` | `test_telematics_physics.py` (Tests 11-14), `test_spatial.py` | **VERIFIED** |
