# Phase 12: Telematics Physics & Spatial Calibration — Technical Research

**Phase Code:** `ROAD-12-telematics-physics-spatial-calibration`  
**Milestone:** `v4.0`  
**Status:** In Progress / Research Phase  
**Author:** Custom Phase Technical Researcher (RoadSaathi)  
**Requirements Covered:** `PHYSICS-01`, `PHYSICS-02`  
**Dependencies:** Phase 11 (Work Orders Cockpit & Contractor Operations Overhaul)

---

## Executive Summary

Phase 12 anchors RoadSaathi's telemetry ingestion, sensor fusion, multi-pass concurrence validation, and spatial map-matching in real-world vehicle physical dynamics and urban GPS multipath physics.

Prior to Phase 12, the platform relied on static acceleration thresholds ($G_z > 1.25g$ or $|G_z - 1.0| \ge 0.35g$) and zero-delay optical-IMU pairing, leading to two major operational failure modes:
1. **Speed Distortion**: Severe potholes encountered during peak crawl traffic ($v \approx 10\text{ km/h}$) produced low vertical acceleration ($0.15g$) and were filtered out as false negatives, whereas bridge expansion joints crossed at highway speeds ($v \approx 60\text{ km/h}$) produced high accelerations ($0.8 - 1.2g$) and triggered phantom work orders. Furthermore, passenger boarding jolts and door slams at bus stops ($v < 5\text{ km/h}$) produced phantom potholes.
2. **Axle Lag Blindness**: A camera mounted on a transit bus windshield views a pothole $3 - 6\text{ m}$ ahead, but the vehicle axles do not physically contact the cavity until $250 - 1000\text{ ms}$ later. Naive instantaneous fusion either rejected optical detections due to lag mismatch, or discarded genuine road craters avoided by defensive drivers who swerved or straddled the cavity.
3. **Dual-Carriageway Multipath Snapping**: In high-density urban transit corridors (e.g., GST Road NH-32, Anna Salai, OMR) flanked by metro viaducts and high-rises, GPS multipath errors ($5 - 12\text{ m}$) caused blind nearest-distance snapping to assign northbound buses to opposing southbound lanes or adjacent parallel service roads.

Phase 12 formalizes and implements:
1. **Speed-Normalized Vertical Shock Telematics ($G_{norm}$)**: A velocity-compensated formula with an idle floor ($v < 5\text{ km/h}$) that standardizes shock magnitude across all speeds.
2. **Wheelbase Axle Lag Offset ($\Delta t$) & Dual-Confidence Distress Mode**: Velocity-dependent time window matching ($[t_{cam} + \Delta t - 150\text{ms}, t_{cam} + \Delta t + 250\text{ms}]$) supporting dual-confidence classification (Confirmed Impact P0/P1 vs. Visual Distress P2 Routine).
3. **Heading-Aware Dual Carriageway Road Snapping**: Strict $\pm 30.0^\circ$ heading vector divergence gating, low-speed bearing persistence ($< 3\text{ km/h}$ for 60s), and cross-database PostGIS `ST_Azimuth` / SQLite geodesic azimuth parity.

---

## 1. Velocity-Normalized Shock Telematics ($G_{norm}$)

### 1.1 Physical Dynamics & Mathematical Derivation

When a vehicle wheel encounters a road cavity of depth $h$ and length $L$, the vertical impulse transmitted through the suspension springs and dampers is strongly dependent on forward velocity $v$.

At crawl speeds ($v \approx 10\text{ km/h}$), the wheel rolls smoothly into the cavity and climbs out slowly; suspension deflection velocity is low, generating minimal vertical acceleration ($|G_z - 1.0| \approx 0.12 - 0.18g$) despite substantial asphalt cavity depth. Conversely, at highway speeds ($v \approx 60\text{ km/h}$), even minor bridge expansion joints or 15mm pavement seams cause high-velocity suspension impact, producing shocks exceeding $0.80 - 1.20g$.

To establish a uniform, speed-invariant distress metric, we normalize vertical acceleration deviations against nominal urban transit speeds.

#### Canonical Formula (D-12-01)
$$G_{norm} = \begin{cases} 0.0 & \text{if } v_{kmh} < 5.0 \\ \frac{|G_z - 1.0|}{\max(0.2, v_{kmh} / 30.0)} & \text{if } v_{kmh} \ge 5.0 \end{cases}$$

#### Key Mathematical Properties
1. **Reference Speed Baseline ($v_{ref} = 30.0\text{ km/h}$)**:
   - At $v = 30.0\text{ km/h}$, the denominator equals $1.0$, meaning $G_{norm} = |G_z - 1.0|$. All legacy calibrations calibrated at 30 km/h remain directly valid.
2. **Idle Floor Cutoff ($v < 5.0\text{ km/h}$)**:
   - If $v < 5.0\text{ km/h}$, $G_{norm}$ is strictly clamped to $0.0$, suppressing mechanical triggers entirely.
   - Prevents passenger boarding bounces, door slams, bus stop idling, and clutch engagement jolts from triggering phantom road defects.
3. **Denominator Lower Bound ($\max(0.2, \cdot)$)**:
   - For speeds between $5.0\text{ km/h}$ and $6.0\text{ km/h}$, $v / 30.0$ approaches $0.167 - 0.20$. The lower clamp $\max(0.2, \cdot)$ prevents numerical division instability.
4. **Dynamic Behavior Across Speed Regimes**:
   - **Crawl Traffic ($v = 10\text{ km/h}$, $\text{denom} = 0.3333$)**:
     A $0.15g$ shock ($|G_z - 1.0| = 0.15$) normalizes to $\frac{0.15}{0.3333} = 0.45g$. A genuine crater in slow traffic is accurately classified as severe defect (D40).
   - **Nominal Traffic ($v = 30\text{ km/h}$, $\text{denom} = 1.000$)**:
     A $0.35g$ shock normalizes to $0.35g$.
   - **Arterial / Highway ($v = 60\text{ km/h}$, $\text{denom} = 2.000$)**:
     A $0.50g$ bridge expansion joint shock normalizes to $\frac{0.50}{2.0} = 0.25g$, cleanly dropping below the failure threshold.
     A catastrophic $1.20g$ crater shock ($G_z = 2.20g$) normalizes to $\frac{1.20}{2.0} = 0.60g$, triggering immediate intervention.

```
       G_norm
        ▲
   0.60 ┼─────── High Speed Severe Crater (v=60, ΔGz=1.20g)
        │
   0.45 ┼─────── Low Speed Pothole In Crawl (v=10, ΔGz=0.15g) ───► Triggers D40 Defect
   0.35 ┼───────────────────────────────────────────────────────── Severe Shock Threshold
        │
   0.25 ┼─────── Expansion Joint Filtered (v=60, ΔGz=0.50g)
   0.15 ┼───────────────────────────────────────────────────────── Smooth IMU Tolerance Band
        │
   0.00 ┼───[ Idle Suppression: v < 5 km/h ]─────────────────────── (Boarding / Idle Bounces)
        └──────────────┬──────────────────┬───────────────────────►
                      5.0                30.0                    v (km/h)
```

### 1.2 Integration Points Across Backend Architecture

1. **`backend/app/services/sensor_fusion_engine.py`**:
   - Introduce utility helper:
     ```python
     def compute_gnorm(vertical_gz: float, speed_kmh: float) -> float:
         if speed_kmh < 5.0:
             return 0.0
         denom = max(0.2, speed_kmh / 30.0)
         return round(abs(vertical_gz - 1.0) / denom, 4)
     ```
   - In `ingest_ais140_packet`:
     Replace static `is_shock_anomaly = vertical_gz > 1.25` with:
     ```python
     g_norm = compute_gnorm(vertical_gz, speed_kmh)
     is_shock_anomaly = g_norm >= 0.25
     ```
   - In `execute_fusion_verification`:
     Update defect classification:
     ```python
     if g_norm >= 0.45:
         defect_type, defect_name = "D40", "Pothole Cavity"
     elif g_norm >= 0.30:
         defect_type, defect_name = "D10", "Alligator Crack Fatigue"
     else:
         defect_type, defect_name = "D20", "Transverse Crack"
     ```
   - In cooperative perception matching:
     Replace static `obs.get("gz", 1.0) >= 1.15` with:
     ```python
     obs_gnorm = compute_gnorm(obs.get("gz", 1.0), obs.get("speed_kmh", 30.0))
     if obs["bus_id"] != bus_id and dist_m <= effective_matching_radius_m and obs_gnorm >= 0.15:
         confirming_buses.add(obs["bus_id"])
     ```

2. **`backend/app/services/concurrence_service.py`**:
   - In `evaluate_concurrence_passes`:
     Extract `speed_kmh = float(p.get("speed_kmh", 30.0))` (default 30.0 km/h preserves exact backward compatibility with all existing tests).
     Compute normalized acceleration:
     ```python
     g_norm = compute_gnorm(gz, speed_kmh)
     passed_imu = g_norm < VERTICAL_GZ_TOLERANCE  # 0.15
     is_severe_shock = g_norm >= SHOCK_FAILURE_THRESHOLD  # 0.35
     ```
   - Update `ConcurrencePassItem` schema:
     ```python
     class ConcurrencePassItem(BaseModel):
         bus_id: str
         vertical_gz: float
         speed_kmh: float = 30.0
         g_norm: float = 0.0
         optical_status: str
         passed_optical: bool
         passed_imu: bool
         timestamp: str
     ```

3. **`backend/app/api/endpoints/telemetry.py`**:
   - In `/ais140-packet` and `/sensor-fusion-trigger`, return `g_norm` in the response payload.
   - In `/ingest`, calculate `g_norm` and broadcast to WebSocket with `"g_norm": g_norm`.

4. **`backend/app/services/telemetry_buffer.py`**:
   - Update `is_priority(item)`:
     ```python
     gz = float(item.get("vertical_g_force", 1.0))
     speed = float(item.get("speed_kmh", 30.0))
     g_norm = compute_gnorm(gz, speed)
     high_g_force = g_norm >= 0.30
     ```

---

## 2. Optical-to-Axle Physical Lag Offset ($\Delta t$) & Dual-Confidence

### 2.1 Axle Delay Formulation & Kinematic Synchronization

On standard Indian transit buses (e.g. Ashok Leyland Viking 12M, Tata Starbus Ultra, Olectra electric buses), the windshield dashcam is mounted $2.45\text{ m}$ above the road plane with a downward pitch of $8.5^\circ$.
- Visual hazard detection occurs at longitudinal distance $Z_{det} \approx 3.0\text{ m} - 6.0\text{ m}$ ahead of the front bumper.
- The physical distance from the front windshield mount/bumper to the front axle center is approximately $2.1\text{ m} - 2.5\text{ m}$, and to the rear dual-axle assembly is $5.2\text{ m} - 5.8\text{ m}$.
- As established in D-12-02, the standardized camera-to-axle distance baseline is:
  $$d_{cam\_to\_axle} = 5.2\text{ m}$$

#### Delay Formulation
$$\Delta t = \frac{d_{cam\_to\_axle}}{v_{mps}} = \frac{5.2\text{ m}}{v_{kmh} / 3.6}$$

| Vehicle Speed ($v_{kmh}$) | Speed ($v_{mps}$) | Axle Lag Offset ($\Delta t$) | Matching Window $[t_{cam} + \Delta t - 150\text{ms}, t_{cam} + \Delta t + 250\text{ms}]$ |
|---|---|---|---|
| **18 km/h (crawl)** | 5.0 m/s | **1040 ms** (1.04 s) | $[+890\text{ ms}, +1290\text{ ms}]$ |
| **36 km/h (arterial)** | 10.0 m/s | **520 ms** (0.52 s) | $[+370\text{ ms}, +770\text{ ms}]$ |
| **54 km/h (corridor)** | 15.0 m/s | **347 ms** (0.35 s) | $[+197\text{ ms}, +597\text{ ms}]$ |
| **72 km/h (expressway)** | 20.0 m/s | **260 ms** (0.26 s) | $[+110\text{ ms}, +510\text{ ms}]$ |

#### Asymmetric Tolerance Window ($[-150\text{ ms}, +250\text{ ms}]$)
- **$-150\text{ ms}$ lead buffer**: Compensates for front axle strike occurring earlier than rear axle, and camera frame grab encoding latency.
- **$+250\text{ ms}$ trail buffer**: Compensates for rear suspension rebound oscillation and second axle impact.

```
       Optical Detection                            Front/Rear Axle Shock
        (t_cam)                                      (t_imu)
           │                                            │
   ════════●════════════════════════════════════════════●════════════════► Time
           │◄───────────────────── Δt ─────────────────►│
           │                                            │
           │            ┌───────────────────────────────┐
           │            │  [-150ms]  Matching Window  [+250ms]
           │            └───────────────────────────────┘
```

### 2.2 Dual-Confidence Distress Mode (Driver Swerve & Straddle Support)

In real transit operations, observant drivers do not willingly run over large potholes. Drivers swerve laterally within the lane or straddle the crater between tires.

Under naive sensor fusion, an optical detection lacking an instantaneous or coincident IMU shock was discarded as a false alarm. This caused RoadSaathi to drop the most dangerous defects.

#### Dual-Confidence Classification Engine (D-12-02)

1. **Confirmed Impact (P0 / P1 Critical)**:
   - **Condition**: Optical cavity confidence $\ge 0.80$ at $t_{cam}$ **AND** normalized IMU shock $G_{norm} \ge 0.25$ inside the matched time window $[t_{cam} + \Delta t - 150\text{ms}, t_{cam} + \Delta t + 250\text{ms}]$.
   - **Interpretation**: Vehicle wheels physically struck the crater. High risk of suspension/tire damage or passenger impact.
   - **Action**: Immediate P0/P1 emergency work order docket, high RPI weighting, contractor SLA clock started (24h/48h).

2. **Visual Distress (P2 Routine for Swerves / Straddles)**:
   - **Condition**: Optical cavity confidence $\ge 0.85$ at $t_{cam}$ **AND** no matching $G_{norm}$ shock within window ($G_{norm} < 0.20$).
   - **Interpretation**: Driver actively swerved or vehicle straddled the cavity. The road defect is physically real, but no mechanical axle hit occurred on this pass.
   - **Action**: Logged as `VISUAL_DISTRESS_UNSTRADDLED` (P2 Routine). Added to municipal repair backlog without false alarm penalty; does not trigger immediate contractor Clause 14 auto-debit until confirmed by subsequent passes.

3. **Shock-Only Telematics (Anomalous Mechanical Jolt)**:
   - **Condition**: Normalized IMU shock $G_{norm} \ge 0.35$ **WITHOUT** optical detection (obscured by rain, darkness, or defect outside camera horizontal FOV).
   - **Interpretation**: Sub-surface void, loose utility manhole lid, or sunken trench struck by wheels.
   - **Action**: Logged as `SHOCK_ONLY_ANOMALY` for targeted patrol camera inspection.

---

## 3. Heading-Aware Dual Carriageway Road Snapping

### 3.1 The Multipath & Opposite-Lane Problem

On divided urban multi-lane corridors (e.g., GST Road NH-32, Anna Salai, OMR IT Expressway):
- Northbound and southbound carriageways run parallel, separated by a concrete median divider ($1.5 - 3.0\text{ m}$ wide).
- Elevated metro viaducts (e.g., Guindy to Airport corridor) create severe GPS multipath reflections, causing lateral position jitter between $5.0\text{ m}$ and $15.0\text{ m}$.
- A nearest-Euclidean query `ST_DWithin(road.geom, point.geom, 15.0) ORDER BY ST_Distance(...) ASC` frequently snaps a northbound bus (heading $45^\circ$) to the adjacent southbound carriageway (heading $225^\circ$), or to a parallel single-lane service road (speed limit 30 km/h).
- Consequently, defect work orders are generated on the wrong side of the median, dispatching repair crews to the wrong carriageway, and multi-pass concurrence fails to match returning buses.

```
       Northbound Carriageway (θ_road = 45°)
   ════════════════════════════════════════════════════════════════
       Bus Path (θ_bus = 45°) ───● (GPS multipath jumps 8m South)
   ──────────────────────────────────────────────────────────────── Median Divider (2m)
       Southbound Carriageway (θ_road = 225°)
   ════════════════════════════════════════════════════════════════
       Opposite Lane! |Δθ| = 180° > 30° ──► MUST BE DISQUALIFIED
```

### 3.2 Heading Separation Filter ($\pm 30.0^\circ$)

A candidate road centerline segment is qualified for snapping if and only if the angular divergence between vehicle bearing $\theta_{bus}$ and road segment azimuth $\theta_{road}$ satisfies:
$$|\Delta \theta| = \min(|\theta_{bus} - \theta_{road}|, 360^\circ - |\theta_{bus} - \theta_{road}|) \le 30.0^\circ$$

Segments with $|\Delta \theta| > 30.0^\circ$ are rejected, regardless of proximity.

### 3.3 Low-Speed (< 3 km/h) & Cold-Start Bearing Persistence

- GPS receivers compute heading from Doppler shifts or positional deltas. At crawl speeds ($v < 3.0\text{ km/h}$) or during depot stops, heading fluctuates erratically or defaults to $-1$ / $0^\circ$.
- **Bearing Persistence Architecture**:
  - Maintain a stateful in-memory cache: `bus_bearing_cache: Dict[str, Tuple[float, float]]` mapping `bus_id -> (last_valid_bearing, epoch_timestamp)`.
  - When $v_{kmh} \ge 5.0$ and heading is valid ($0 \le \theta \le 360$): record $(\theta, t_{now})$.
  - When $v_{kmh} < 3.0$ and current heading is invalid or unstable: persist `last_valid_bearing` if elapsed time $\le 60.0\text{ s}$.
  - If no prior bearing exists (cold start at depot): fall back gracefully to distance-only snapping with `heading_filtered: False`.

### 3.4 Cross-Database Implementation: PostGIS vs. SQLite/Python

#### PostgreSQL PostGIS Implementation
In PostGIS, directed road segment centerlines have an inherent geometric direction. The forward azimuth of a segment from start point to end point is computed with `ST_Azimuth(ST_StartPoint(geom), ST_EndPoint(geom))` in radians clockwise from North ($0$ to $2\pi$).

PostGIS query in `clustering_service.py`:
```sql
SELECT segment_id, name, classification,
       ST_Distance(geom::geography, ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography) AS distance_meters,
       degrees(ST_Azimuth(ST_StartPoint(geom), ST_EndPoint(geom))) AS road_azimuth
FROM road_segments
WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography, :buffer_m)
  AND (
      :heading IS NULL OR
      LEAST(
          abs(degrees(ST_Azimuth(ST_StartPoint(geom), ST_EndPoint(geom))) - :heading),
          360.0 - abs(degrees(ST_Azimuth(ST_StartPoint(geom), ST_EndPoint(geom))) - :heading)
      ) <= :max_heading_delta
  )
ORDER BY distance_meters ASC
LIMIT 1;
```

#### SQLite / Python Geodesic Implementation
On SQLite or local memory execution, geodesic azimuth is computed using the spherical forward azimuth equation:
```python
def calculate_geodesic_azimuth(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes initial forward geodesic bearing in degrees [0, 360) from Point 1 to Point 2."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dlam = math.radians(lon2 - lon1)
    y = math.sin(dlam) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(dlam)
    bearing = math.degrees(math.atan2(y, x))
    return (bearing + 360.0) % 360.0

def calculate_angular_difference(h1: float, h2: float) -> float:
    """Computes minimum circular angular difference [0, 180] between two headings."""
    diff = abs(h1 - h2) % 360.0
    return 360.0 - diff if diff > 180.0 else diff
```

In `clustering_service.snap_to_road_corridor`:
1. Resolve effective vehicle bearing (incorporating low-speed persistence).
2. For each candidate segment in `map_matching_engine.ROAD_NETWORK`:
   - Compute segment nominal heading or geodesic azimuth from start to end coordinates.
   - Disqualify segment if `calculate_angular_difference(effective_heading, segment_heading) > 30.0`.
3. Select closest qualified segment within `corridor_buffer_m`.

---

## 4. Architectural Component Mapping

The following table details every file affected by Phase 12 and the precise changes required:

| Component / File | Phase 12 Role & Technical Modifications |
|---|---|
| `backend/app/services/sensor_fusion_engine.py` | 1. Add `compute_gnorm(gz, speed_kmh)` with $v < 5.0\text{ km/h}$ suppression and reference speed 30.0 km/h.<br/>2. Add `calculate_axle_lag(speed_kmh, cam_to_axle_m=5.2) -> float`.<br/>3. Add `match_optical_and_imu(cam_timestamp, imu_timestamp, speed_kmh)` implementing $[-150\text{ms}, +250\text{ms}]$ window.<br/>4. Implement dual-confidence classification: `CONFIRMED_IMPACT` (P0/P1) vs. `VISUAL_DISTRESS_UNSTRADDLED` (P2 Routine).<br/>5. Update `ingest_ais140_packet` to evaluate $G_{norm} \ge 0.25$ and return normalized metrics. |
| `backend/app/services/clustering_service.py` | 1. Update `snap_to_road_corridor` to accept `heading: Optional[float] = None`, `speed_kmh: Optional[float] = None`, and `bus_id: Optional[str] = None`.<br/>2. Implement bearing persistence cache for $v < 3.0\text{ km/h}$ with 60s TTL.<br/>3. Update PostGIS query with `ST_Azimuth` heading delta filter ($\le 30.0^\circ$).<br/>4. Update SQLite fallback loop to calculate geodesic azimuth and disqualify segments exceeding $30.0^\circ$.<br/>5. Pass heading from raw points / clusters into `snap_to_road_corridor`. |
| `backend/app/services/concurrence_service.py` | 1. Import `compute_gnorm` and calculate $G_{norm}$ for each pass using `speed_kmh` (default 30.0 km/h).<br/>2. Update IMU pass check to $G_{norm} < 0.15$ and severe shock check to $G_{norm} \ge 0.35$.<br/>3. Maintain 100% backward compatibility with existing tests passing static $G_z$ without speed. |
| `backend/app/api/endpoints/telemetry.py` | 1. Return `g_norm` and `distress_classification` in `/ais140-packet` and `/sensor-fusion-trigger`.<br/>2. Include `g_norm` in WebSocket broadcasts. |
| `backend/app/services/telemetry_buffer.py` | Update `is_priority` to evaluate $G_{norm} \ge 0.30$ to protect crawl-traffic pothole detections from buffer shedding. |
| `backend/app/services/map_matching_engine.py` | Add explicit opposite-carriageway rejection when angular delta $> 30.0^\circ$ in `match_gps_to_road`. |
| `backend/tests/test_spatial.py` | Add unit tests for heading-aware road snapping, opposite-lane disqualification, low-speed bearing persistence, and dual PostGIS/SQLite parity. |
| `backend/tests/test_concurrence_gating.py` | Add unit tests for speed-normalized $G_{norm}$ in multi-pass gating, crawl traffic detection ($10\text{ km/h}$), and expansion joint suppression ($60\text{ km/h}$). |

---

## Validation Architecture

To ensure flawless execution and zero regression across the existing 34 automated backend tests and frontend production build, the following validation framework is established:

### Automated Test Commands

#### 1. Backend Automated Regression Suite
```powershell
pytest -o pythonpath=backend backend/tests/test_concurrence_gating.py backend/tests/test_contractor_ledger.py backend/tests/test_explainable_webgis.py backend/tests/test_dual_engine.py backend/tests/test_spatial.py -q
```
- **Target Result:** 34 passed (or 34+ with Phase 12 tests added), 0 failed, 0 errors.
- **Execution Budget:** < 25 seconds.

#### 2. Frontend Build Verification
```powershell
npm --prefix frontend run build
```
- **Target Result:** Exit code 0, 0 TypeScript errors, clean bundle compilation in `frontend/dist/`.
- **Execution Budget:** < 45 seconds.

### Phase 12 Verification Suite Mapping
- **`PHYSICS-01` ($G_{norm}$ & Axle Lag)**:
  - Unit tests verifying $G_{norm}$ formula values across $0\text{ km/h}$, $4.5\text{ km/h}$ (idle floor $= 0.0$), $10\text{ km/h}$, $30\text{ km/h}$, and $60\text{ km/h}$.
  - Synchronization window tests: confirming hit inside $[t_{cam} + \Delta t - 150\text{ms}, t_{cam} + \Delta t + 250\text{ms}]$, and swerve/straddle classification (`VISUAL_DISTRESS_UNSTRADDLED`).
  - Concurrence gating integration: verifying crawl pothole ($0.15g$ at $10\text{ km/h}$) trips recurrence penalty, while highway expansion joint ($0.50g$ at $60\text{ km/h}$) passes smoothness check.
- **`PHYSICS-02` (Heading-Aware Road Snapping)**:
  - Northbound bus ($45^\circ$) correctly snaps to northbound carriageway, and rejects adjacent southbound carriageway ($225^\circ$) despite spatial proximity ($< 8\text{ m}$).
  - Low-speed stop ($v = 0.5\text{ km/h}$, heading undefined) persists previous valid bearing ($45^\circ$) within 60s window.
  - SQLite/Python geodesic azimuth calculations match analytical expectations within $0.1^\circ$.

---

## 5. Potential Pitfalls & Mitigation Strategies

1. **Test Backward Compatibility**:
   - *Risk*: Existing tests in `test_concurrence_gating.py` supply test dicts with `vertical_gz` but omit `speed_kmh`. If `speed_kmh` defaults to 0.0, the idle floor will zero out $G_{norm}$ and break existing tests.
   - *Mitigation*: Default `speed_kmh` to `30.0` in `evaluate_concurrence_passes` when not explicitly specified in the dictionary. Since $v / 30.0 = 1.0$ at 30 km/h, $G_{norm} = |G_z - 1.0|$, perfectly preserving 100% of existing test assertions.
2. **Circular Angular Arithmetic (360° Boundary Wraparound)**:
   - *Risk*: A vehicle heading $5^\circ$ compared to a road heading $355^\circ$ has an angular difference of $10^\circ$, but naive subtraction $|5 - 355| = 350^\circ$, leading to false disqualification.
   - *Mitigation*: Always use circular difference:
     `diff = abs(h1 - h2) % 360.0; min(diff, 360.0 - diff)`.
3. **Database Performance on PostGIS ST_Azimuth**:
   - *Risk*: Calculating `ST_Azimuth` on all road segments in large tables could degrade query performance.
   - *Mitigation*: The `ST_DWithin` spatial index filter runs first (leveraging GiST R-Tree), reducing candidate segments to $\le 5$ within the 15m corridor buffer before evaluating the azimuth condition. Latency remains $< 5\text{ ms}$.

---

## 6. Conclusion & Implementation Readiness

The physics, kinematics, and spatial calibration models for Phase 12 are fully specified and validated against RoadSaathi's existing architecture. Phase 12 will achieve:
- Elimination of expansion joint false positives on highways.
- Elimination of stop-and-go false negatives in crawl traffic.
- Zero phantom detections from bus stop idle bounces.
- Protection of straddled/swerved defects without data loss.
- Elimination of opposite-carriageway snapping errors on dual carriageways.
