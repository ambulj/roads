import time
import math
import pytest
from app.services.sensor_fusion_engine import (
    compute_normalized_shock,
    compute_gnorm,
    calculate_axle_lag,
    compute_axle_lag_window,
    match_optical_and_imu,
    classify_dual_confidence_distress,
    classify_distress_mode,
    sensor_fusion_engine,
)
from app.services.concurrence_service import (
    evaluate_concurrence_passes,
    ConcurrencePassItem,
)
from app.services.clustering_service import (
    ClusteringService,
    circular_heading_delta,
    _circular_angular_diff,
    calculate_geodesic_azimuth,
    _calculate_segment_azimuth,
    clustering_service,
)


# ── Group 1: Velocity-Normalized Shock Telematics (G_norm) ───────────────────

def test_gnorm_idle_floor_suppression():
    """
    Verifies that for speed < 5.0 km/h, G_norm is strictly clamped to 0.0 (idle suppression),
    eliminating false alarms from passenger boarding bounces, door slams, and bus stop idling.
    """
    for speed in [0.0, 1.5, 3.8, 4.9, 4.99]:
        for gz in [0.5, 1.25, 1.35, 1.45, 1.80, 2.20]:
            assert compute_normalized_shock(gz, speed) == 0.0
            assert compute_gnorm(gz, speed) == 0.0

    # Ingest AIS-140 packet with passenger boarding bounce at idle bus stop (4.2 km/h)
    packet = {
        "bus_id": "BUS-MTC-IDLE",
        "lat": 12.9516,
        "lng": 80.1462,
        "speed_kmh": 4.2,
        "heading": 90.0,
        "vertical_gz": 1.45
    }
    result = sensor_fusion_engine.ingest_ais140_packet(packet)
    assert result["is_shock_anomaly"] is False
    assert result["g_norm"] == 0.0
    assert result["status"] == "NOMINAL_TELEMETRY"


def test_gnorm_crawl_traffic_detection():
    """
    Verifies crawl traffic sensitivity: a minor 0.15g suspension deflection (|1.15 - 1.0|)
    at 10.0 km/h is normalized to 0.45g, classifying as severe defect (D40 Pothole Cavity).
    """
    # Denominator: max(0.2, 10.0 / 30.0) = 0.33333...
    # abs(1.15 - 1.0) / (1/3) = 0.15 * 3 = 0.45
    g_norm = compute_normalized_shock(vertical_gz=1.15, speed_kmh=10.0)
    assert g_norm == 0.45

    # Verification pipeline correctly identifies severe pothole cavity
    packet = {
        "bus_id": "BUS-CRAWL-01",
        "lat": 12.9516,
        "lng": 80.1462,
        "speed_kmh": 10.0,
        "heading": 90.0,
        "vertical_gz": 1.15
    }
    result = sensor_fusion_engine.ingest_ais140_packet(packet)
    assert result["is_shock_anomaly"] is True
    assert result["g_norm"] == 0.45
    assert result["defect_type"] == "D40"
    assert result["defect_name"] == "Pothole Cavity"


def test_gnorm_highway_expansion_joint_suppression():
    """
    Verifies arterial/highway vibration suppression: a 0.50g shock (|1.50 - 1.0|)
    at 60.0 km/h normalizes down to 0.25g, cleanly passing below the severe shock failure threshold (0.35g).
    """
    # Denominator: max(0.2, 60.0 / 30.0) = 2.0
    # abs(1.50 - 1.0) / 2.0 = 0.50 / 2.0 = 0.25
    g_norm = compute_normalized_shock(vertical_gz=1.50, speed_kmh=60.0)
    assert g_norm == 0.25


def test_gnorm_reference_speed_baseline():
    """
    Verifies nominal urban transit baseline calibration (30.0 km/h):
    At 30.0 km/h, denominator = 1.0, meaning G_norm = |Gz - 1.0| identically.
    """
    for gz in [0.70, 0.85, 1.00, 1.15, 1.35, 1.65]:
        expected = round(abs(gz - 1.0), 4)
        assert compute_normalized_shock(gz, 30.0) == expected
        assert compute_gnorm(gz, 30.0) == expected


def test_concurrence_speed_normalized_gating():
    """
    Verifies multi-pass concurrence gating with velocity normalization:
    - Crawl pothole (gz = 1.15 at 10.0 km/h -> g_norm = 0.45 >= 0.35) trips severe shock recurrence failure.
    - Highway expansion joint (gz = 1.50 at 60.0 km/h -> g_norm = 0.25 < 0.35) avoids severe shock failure.
    - Smooth pass at crawl speed (gz = 1.04 at 10.0 km/h -> g_norm = 0.12 < 0.15) passes IMU smoothness.
    """
    # 1. Crawl speed crater trips recurrence failure
    passes_crawl_crater = [
        {"bus_id": "BUS-01", "vertical_gz": 1.00, "speed_kmh": 30.0, "optical_status": "SMOOTH_SURFACE"},
        {"bus_id": "BUS-02", "vertical_gz": 1.15, "speed_kmh": 10.0, "optical_status": "SMOOTH_SURFACE"},
    ]
    res_crawl = evaluate_concurrence_passes(passes_crawl_crater, order_id="WO-CRAWL-CRATER")
    assert res_crawl.status == "REPAIR_FAILED_RECURRENCE"
    assert res_crawl.passes[1].g_norm == 0.45
    assert res_crawl.passes[1].passed_imu is False

    # 2. Highway expansion joint pass does not trip severe shock failure
    passes_highway = [
        {"bus_id": "BUS-01", "vertical_gz": 1.00, "speed_kmh": 30.0, "optical_status": "SMOOTH_SURFACE"},
        {"bus_id": "BUS-02", "vertical_gz": 1.50, "speed_kmh": 60.0, "optical_status": "SMOOTH_SURFACE"},
    ]
    res_highway = evaluate_concurrence_passes(passes_highway, order_id="WO-HIGHWAY-JOINT")
    # G_norm is 0.25 (not >= 0.35 severe shock), so it is not marked REPAIR_FAILED_RECURRENCE
    assert res_highway.status == "AWAITING_CONCURRENCE"
    assert res_highway.passes[1].g_norm == 0.25


# ── Group 2: Wheelbase Axle Lag Offset & Dual-Confidence Distress Mode ───────

def test_axle_lag_kinematic_formula():
    """
    Verifies analytical physical lag offset Δt = 5.2m / v_mps across vehicle speed regimes:
    18 km/h -> 1040 ms (1.040s)
    36 km/h -> 520 ms (0.520s)
    54 km/h -> 347 ms (0.347s)
    72 km/h -> 260 ms (0.260s)
    """
    assert calculate_axle_lag(18.0) == 1.040
    assert calculate_axle_lag(36.0) == 0.520
    assert calculate_axle_lag(54.0) == 0.347
    assert calculate_axle_lag(72.0) == 0.260

    # compute_axle_lag_window returns (delta_t, window_start, window_end)
    lag_s, w_start, w_end = compute_axle_lag_window(36.0)
    assert lag_s == 0.520
    assert round(w_start, 3) == 0.370  # 0.520 - 0.150
    assert round(w_end, 3) == 0.770    # 0.520 + 0.250


def test_optical_imu_window_matching():
    """
    Verifies asymmetric time window matching [t_cam + Δt - 150ms, t_cam + Δt + 250ms]:
    At 36 km/h (Δt = 520ms), optical event at t = 10.000s expects IMU strike at 10.520s.
    Window: [10.370s, 10.770s].
    """
    t_cam = 10.000
    speed = 36.0

    # Inside window
    matched_early, offset_early = match_optical_and_imu(t_cam, 10.450, speed)
    assert matched_early is True
    assert offset_early == -0.070

    matched_late, offset_late = match_optical_and_imu(t_cam, 10.720, speed)
    assert matched_late is True
    assert offset_late == 0.200

    # Outside window
    matched_too_early, _ = match_optical_and_imu(t_cam, 10.300, speed)
    assert matched_too_early is False

    matched_too_late, _ = match_optical_and_imu(t_cam, 10.850, speed)
    assert matched_too_late is False


def test_dual_confidence_confirmed_impact():
    """
    Asserts CONFIRMED_IMPACT (P0/P1):
    High visual confidence (>= 0.80) and synchronized normalized shock (>= 0.25).
    """
    mode = classify_dual_confidence_distress(
        optical_confidence=0.92,
        g_norm=0.38,
        is_axle_matched=True
    )
    assert mode == "CONFIRMED_IMPACT"
    assert classify_distress_mode(0.92, 0.38, True) == "CONFIRMED_IMPACT"


def test_dual_confidence_swerve_straddle():
    """
    Asserts VISUAL_DISTRESS_UNSTRADDLED (P2 Routine):
    High visual confidence (>= 0.85) but smooth IMU (g_norm < 0.20) because
    the driver actively swerved or vehicle straddled the cavity. Defect is retained!
    """
    mode = classify_dual_confidence_distress(
        optical_confidence=0.94,
        g_norm=0.08,
        is_axle_matched=True
    )
    assert mode == "VISUAL_DISTRESS_UNSTRADDLED"


def test_dual_confidence_shock_only():
    """
    Asserts SHOCK_ONLY_ANOMALY:
    Significant normalized shock (g_norm >= 0.35) without optical detection (e.g. night/rain/puddle).
    """
    mode = classify_dual_confidence_distress(
        optical_confidence=0.20,
        g_norm=0.42,
        is_axle_matched=False
    )
    assert mode == "SHOCK_ONLY_ANOMALY"


# ── Group 3: Heading-Aware Dual Carriageway Road Snapping ────────────────────

def test_circular_heading_wraparound():
    """
    Verifies circular angular difference logic around 0° / 360° boundary:
    - 5° vs 355° is 10° (not 350°)
    - 350° vs 10° is 20° (not 340°)
    - 45° vs 225° is 180° (opposite carriageway)
    """
    assert circular_heading_delta(5.0, 355.0) == 10.0
    assert circular_heading_delta(355.0, 5.0) == 10.0
    assert _circular_angular_diff(350.0, 10.0) == 20.0
    assert circular_heading_delta(45.0, 225.0) == 180.0
    assert circular_heading_delta(180.0, 180.0) == 0.0


def test_geodesic_azimuth_precision():
    """
    Verifies spherical geodesic azimuth calculation across cardinal and ordinal directions:
    - Due North: 0.0°
    - Due East: 90.0°
    - Due South: 180.0°
    - Due West: 270.0°
    """
    north_az = calculate_geodesic_azimuth(0.0, 0.0, 1.0, 0.0)
    assert round(north_az, 1) == 0.0

    east_az = calculate_geodesic_azimuth(0.0, 0.0, 0.0, 1.0)
    assert round(east_az, 1) == 90.0

    south_az = calculate_geodesic_azimuth(1.0, 0.0, 0.0, 0.0)
    assert round(south_az, 1) == 180.0

    west_az = calculate_geodesic_azimuth(0.0, 1.0, 0.0, 0.0)
    assert round(west_az, 1) == 270.0

    # Tuple wrapper test
    assert round(_calculate_segment_azimuth((0.0, 0.0), (0.0, 1.0)), 1) == 90.0


def test_heading_filter_rejects_opposite_lane(monkeypatch):
    """
    Verifies that when vehicle heading points opposite to a road segment (|Δθ| > 30.0°),
    that segment is disqualified from snapping.
    A vehicle heading 45.0° located 6m from a Southbound segment (225.0°) and 10m from a Northbound
    segment (45.0°) snaps to the Northbound segment (|Δθ| = 0° <= 30°) and strictly rejects
    the Southbound segment (|Δθ| = 180° > 30°).
    """
    from app.services.map_matching_engine import map_matching_engine

    custom_network = [
        {
            "segment_id": "SEG-DUAL-SOUTHBOUND",
            "name": "GST Road Southbound",
            "classification": "National Highway",
            "start_coords": (12.9520, 80.1460),
            "end_coords": (12.9500, 80.1440),
            "nominal_heading": 225.0,
        },
        {
            "segment_id": "SEG-DUAL-NORTHBOUND",
            "name": "GST Road Northbound",
            "classification": "National Highway",
            "start_coords": (12.9500, 80.1441),
            "end_coords": (12.9520, 80.1461),
            "nominal_heading": 45.0,
        }
    ]
    monkeypatch.setattr(map_matching_engine, "ROAD_NETWORK", custom_network)
    service = ClusteringService()

    # Vehicle heading 48.0° located closer to Southbound lane, but heading matches Northbound
    # Southbound segment has |48.0 - 225.0| = 177.0° > 30.0° -> disqualified!
    # Northbound segment has |48.0 - 45.0| = 3.0° <= 30.0° -> matched!
    snap = service.snap_to_road_corridor(
        lat=12.9510,
        lng=80.1450,
        corridor_buffer_m=25.0,
        heading=48.0,
        speed_kmh=40.0
    )
    assert snap["snapped"] is True
    assert snap["segment_id"] == "SEG-DUAL-NORTHBOUND"
    assert snap["road_name"] == "GST Road Northbound"
    assert snap["road_azimuth"] == 45.0

    # Reverse direction: Vehicle heading 220.0° snaps to Southbound and rejects Northbound
    snap_rev = service.snap_to_road_corridor(
        lat=12.9510,
        lng=80.1450,
        corridor_buffer_m=25.0,
        heading=220.0,
        speed_kmh=40.0
    )
    assert snap_rev["snapped"] is True
    assert snap_rev["segment_id"] == "SEG-DUAL-SOUTHBOUND"
    assert snap_rev["road_name"] == "GST Road Southbound"


def test_low_speed_bearing_persistence():
    """
    Verifies bearing persistence for low-speed / idling transit vehicles:
    - When speed >= 5 km/h, valid heading is cached per bus_id.
    - When vehicle slows to < 3 km/h with missing or unstable heading, cached bearing is persisted for up to 60s.
    - After 60s TTL, cache expires and bearing is not persisted.
    """
    service = ClusteringService()
    bus_id = "BUS-MTC-PERSIST"

    # Step 1: Vehicle cruising at 35 km/h heading 45.0°
    snap1 = service.snap_to_road_corridor(
        lat=12.9516,
        lng=80.1466,
        corridor_buffer_m=15.0,
        heading=45.0,
        speed_kmh=35.0,
        bus_id=bus_id
    )
    assert snap1["effective_heading"] == 45.0
    assert bus_id in service.bearing_cache
    assert service.bearing_cache[bus_id][0] == 45.0
    assert snap1["snapped"] is True

    # Step 2: Vehicle slows to 1.5 km/h at traffic stop, GPS heading becomes None
    snap2 = service.snap_to_road_corridor(
        lat=12.9516,
        lng=80.1466,
        corridor_buffer_m=15.0,
        heading=None,
        speed_kmh=1.5,
        bus_id=bus_id
    )
    assert snap2["effective_heading"] == 45.0
    assert snap2["bearing_persisted"] is True
    assert snap2["snapped"] is True

    # Step 3: Cache TTL expiration (> 60s)
    # Manually simulate expired timestamp
    service.bearing_cache[bus_id] = (45.0, time.time() - 65.0)

    snap3 = service.snap_to_road_corridor(
        lat=12.9516,
        lng=80.1466,
        corridor_buffer_m=15.0,
        heading=None,
        speed_kmh=1.5,
        bus_id=bus_id
    )
    assert snap3["effective_heading"] is None
    assert snap3["bearing_persisted"] is False


# ── Group 4: Backward Compatibility ──────────────────────────────────────────

def test_legacy_concurrence_backward_compatibility():
    """
    Verifies 100% backward compatibility with legacy concurrence test format:
    When passes omit speed_kmh, default 30.0 km/h is applied so G_norm = |Gz - 1.0|.
    """
    legacy_passes = [
        {"bus_id": "BUS-01", "vertical_gz": 0.98, "optical_status": "SMOOTH_SURFACE"},
        {"bus_id": "BUS-02", "vertical_gz": 1.02, "optical_status": "SMOOTH_SURFACE"},
        {"bus_id": "BUS-03", "vertical_gz": 0.95, "optical_status": "SMOOTH_SURFACE"},
    ]
    res = evaluate_concurrence_passes(legacy_passes, order_id="WO-LEGACY-01")
    assert res.status == "REPAIR_VERIFIED"
    assert res.invoice_clearance_authorized is True
    assert res.distinct_buses_count == 3
    for p in res.passes:
        assert p.speed_kmh == 30.0
        assert p.passed_imu is True
        assert p.passed_optical is True
