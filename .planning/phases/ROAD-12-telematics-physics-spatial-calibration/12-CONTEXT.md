# Phase 12 Context: Telematics Physics & Spatial Calibration

## Phase Domain & Goals
Calibrate edge telematics and backend sensor fusion against real-world vehicle physical dynamics and urban GPS multipath propagation. Eliminates false distress positives from bridge expansion joints at high speeds, prevents false negatives in crawl traffic, synchronizes optical detections with rear/front axle impact timing, and enforces heading-aware road centerline snapping to prevent cross-carriageway misclassifications.

---

## Locked Decisions

### D-12-01: Velocity-Normalized Shock Telematics ($G_{norm}$)
- **Formula**:
  $$G_{norm} = \frac{|G_z - 1.0|}{\max(0.2, v_{kmh} / 30.0)}$$
- **Baseline Reference Speed**: 30.0 km/h represents the nominal urban transit corridor calibration baseline ($v / 30.0 = 1.0$).
- **Minimum Velocity Cutoff (Idle Floor)**:
  - If $v_{kmh} < 5.0\text{ km/h}$, suppress mechanical shock triggers completely.
  - Prevents passenger boarding bounces, door slams, bus stop idling, and clutch engagement jolts from triggering phantom road craters.
- **Dynamic Thresholding**:
  - A $0.15g$ shock at $10\text{ km/h}$ normalizes to $0.45g$ (detecting real craters during traffic crawls).
  - A $1.2g$ shock at $60\text{ km/h}$ normalizes to $0.60g$ (suppressing normal bridge expansion joints and highway vibration).

### D-12-02: Wheelbase Axle Lag Offset & Dual-Confidence Distress Mode
- **Axle Delay Formulation**:
  $$\Delta t = \frac{d_{cam\_to\_axle}}{v_{mps}} = \frac{5.2\text{ m}}{v_{kmh} / 3.6}$$
- **Time Window Matching**:
  - Sensor fusion matches optical detection timestamps $t_{cam}$ to IMU shock timestamps $t_{imu}$ inside $[t_{cam} + \Delta t - 150\text{ms}, t_{cam} + \Delta t + 250\text{ms}]$.
- **Dual-Confidence Resolution (Driver Swerve & Straddle Support)**:
  - **Confirmed Impact (P0 / P1)**: Optical cavity detection confirmed by matching $G_{norm}$ spike within $\Delta t$ window. High priority dispatch.
  - **Visual Distress (P2 Routine)**: Optical cavity detected by windshield camera, but wheels did not hit it (driver actively swerved or vehicle straddled the cavity).
  - Avoids discarding real road defects when drivers perform defensive evasive maneuvers.

### D-12-03: Heading-Aware Dual Carriageway Corridor Snapping
- **Heading Separation Filter**:
  - Enforce a $\pm 30^\circ$ angular delta threshold between the vehicle's compass bearing ($\theta_{bus}$) and the candidate road centerline azimuth ($\theta_{road}$).
  - Candidate segments with $|\Delta \theta| > 30^\circ$ are disqualified, preventing GPS multipath errors from snapping points to opposite-direction lanes, parallel service roads, or elevated flyovers.
- **Low-Speed / Cold-Start Bearing Persistence**:
  - When $v_{kmh} < 3.0\text{ km/h}$ and GPS heading is undefined or unstable ($< 0$ or fluctuating), persist the **last known valid bearing** ($v \ge 5\text{ km/h}$) for up to 60 seconds.
- **PostGIS & SQLite Alignment**:
  - PostgreSQL PostGIS query adds `AND abs(degrees(ST_Azimuth(ST_StartPoint(geom), ST_EndPoint(geom))) - :heading) <= 30.0` or equivalent bearing matching.
  - SQLite/Python fallback calculates geodesic line azimuth and rejects segments exceeding $30^\circ$.

---

## Technical Constraints & Boundaries
- Zero regression on existing 34 backend automated tests.
- Maintain sub-50ms DBSCAN spatial query latency.
- Do not introduce new heavy external C++ or Python dependencies; use native `math`, `numpy`, and existing PostGIS / spatial functions.

---

## Deferred Ideas (Out of Scope for Phase 12)
- Real-time bus tire pressure monitoring system (TPMS) CAN bus integration.
- Dynamic 3D gyro tilt angle compensation for steep hill road slopes.
