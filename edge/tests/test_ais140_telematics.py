"""
Unit tests for edge/ais140_parser.py:
- AIS-140 standard $PV and NMEA sentence decoding with XOR checksum validation
- Dynamic rolling baseline IMU vertical acceleration calibration (W = 100 samples)
- 2nd-order Butterworth filter & engine harmonic vibration isolation
- 200ms camera time-lock correlation (positive match -> CONFIRMED_STATUTORY_DEFECT)
- 200ms camera time-lock correlation (negative/delayed shock -> OPTICAL_PRELIMINARY)
- Low-power vehicle sleep state machine (<0.8W, 10-minute heartbeat) on ignition OFF
"""

from datetime import datetime, timezone
import numpy as np
import pytest

from edge.ais140_parser import (
    AIS140Packet,
    AIS140Parser,
    ButterworthHighPassFilter,
    IMUVibrationFilter,
    RollingBaselineCalibrator,
    IMUTimeLockCorrelator,
    VehiclePowerManager,
)


def test_ais140_packet_decoding():
    """
    Ingests standard AIS-140 $PV sentence with valid XOR checksum.
    Validates parsed IMEI, GPS coordinates, speed, heading, ignition, and panic button.
    """
    # Raw sentence body
    raw_body = "PV,ROAD,1.0,NR,0,868204041234567,TN01AB1234,A,061026,143000,13.0827,N,80.2707,E,42.5,180.0,12,15.2,1.1,0.9,AIRTEL,1,1,12.6,0,1.45"
    checksum = AIS140Parser.compute_checksum(raw_body)
    sentence = f"${raw_body}*{checksum}"

    assert AIS140Parser.validate_checksum(sentence) is True

    packet = AIS140Parser.parse_sentence(sentence)
    assert packet is not None
    assert packet.imei == "868204041234567"
    assert packet.gps_fix is True
    assert packet.latitude == pytest.approx(13.0827, abs=1e-4)
    assert packet.longitude == pytest.approx(80.2707, abs=1e-4)
    assert packet.speed_kmh == pytest.approx(42.5, abs=0.1)
    assert packet.heading == pytest.approx(180.0, abs=0.1)
    assert packet.ignition is True
    assert packet.panic_button is True
    assert packet.battery_voltage == pytest.approx(12.6, abs=0.1)
    assert packet.vertical_accel_g == pytest.approx(1.45, abs=0.01)


def test_ais140_invalid_checksum_rejected():
    """Sentence with corrupt checksum must return None."""
    sentence = "$PV,ROAD,1.0,NR,0,868204041234567,TN01AB1234,A,061026,143000,13.0827,N,80.2707,E,42.5,180.0*FF"
    assert AIS140Parser.validate_checksum(sentence) is False
    assert AIS140Parser.parse_sentence(sentence) is None


def test_nmea_gprmc_decoding():
    """Validates parsing of standard NMEA $GPRMC sentence."""
    raw_body = "GPRMC,123519,A,1304.962,N,08016.242,E,22.9,180.0,061026,,,A"
    checksum = AIS140Parser.compute_checksum(raw_body)
    sentence = f"${raw_body}*{checksum}"

    packet = AIS140Parser.parse_sentence(sentence)
    assert packet is not None
    assert packet.gps_fix is True
    # 13 deg 04.962 min -> 13 + 4.962/60 = 13.0827
    assert packet.latitude == pytest.approx(13.0827, abs=1e-3)
    assert packet.longitude == pytest.approx(80.2707, abs=1e-3)
    # 22.9 knots * 1.852 = 42.41 km/h
    assert packet.speed_kmh == pytest.approx(42.41, abs=0.2)


def test_imu_rolling_baseline_calibration():
    """
    Feeds synthetic 50Hz accelerometer stream with 1.0g baseline + gradual 0.15g vehicle pitch;
    asserts dynamic baseline tracks drift.
    """
    calibrator = RollingBaselineCalibrator(window_size=100, default_baseline=1.0)
    assert calibrator.get_baseline() == 1.0

    # Stream 100 samples at steady 1.0g
    for _ in range(100):
        calibrator.update(1.0)
    assert calibrator.get_baseline() == pytest.approx(1.0, abs=1e-3)

    # Simulate vehicle climbing an incline, shifting pitch by +0.15g over 100 samples
    for i in range(100):
        val = 1.0 + (0.15 * (i / 100.0))
        calibrator.update(val)

    # Window now contains samples averaging around 1.075g
    assert calibrator.get_baseline() > 1.05

    # Stream 100 samples at steady 1.15g
    for _ in range(100):
        calibrator.update(1.15)
    assert calibrator.get_baseline() == pytest.approx(1.15, abs=1e-3)


def test_imu_butterworth_vibration_isolation():
    """
    Feeds 25Hz engine vibration harmonic alongside a 5Hz pothole impact spike;
    verifies filter eliminates the 25Hz noise while preserving the shock transient.
    """
    fs = 50.0  # 50 Hz sampling rate
    t = np.linspace(0, 2.0, int(2.0 * fs), endpoint=False)  # 100 samples over 2 seconds

    # 25Hz continuous engine harmonic (amplitude 0.4g)
    engine_vibration = 0.4 * np.sin(2 * np.pi * 25.0 * t)

    # 5Hz pothole impact transient occurring at t = 1.0s (amplitude 1.5g)
    shock_transient = np.zeros_like(t)
    shock_idx = int(1.0 * fs)
    # 3-point Gaussian shock burst representing pothole hit
    shock_transient[shock_idx : shock_idx + 4] = [0.8, 1.5, 0.9, 0.4]

    raw_signal = 1.0 + engine_vibration + shock_transient  # 1.0g gravity + engine noise + shock

    filter_pipeline = IMUVibrationFilter(fs=fs)
    filtered = filter_pipeline.filter_series(raw_signal)

    # 1. During steady engine vibration (e.g. t = 0.2 to 0.7s), 25Hz amplitude is attenuated
    quiescent_filtered = filtered[10:35]
    assert np.max(np.abs(quiescent_filtered)) < 0.20  # Attenuated from 0.4g

    # 2. At t = 1.0s, the shock peak transient is preserved
    shock_filtered_peak = np.max(filtered[shock_idx - 2 : shock_idx + 6])
    assert shock_filtered_peak > 0.65  # Shock transient clearly detected


def test_imu_camera_200ms_timelock_positive():
    """
    Simulates optical camera detection at t = 1.000s and vertical shock (1.52g)
    at t = 1.120s (dt = 120ms < 200ms).
    Asserts CONFIRMED_STATUTORY_DEFECT is generated.
    """
    correlator = IMUTimeLockCorrelator(time_lock_window_ms=200.0)

    optical_t = 1.000
    imu_events = [
        (0.900, 1.01),  # before camera
        (1.050, 1.04),  # within window, normal
        (1.120, 1.52),  # within window (dt = 120ms), vertical shock (> 1.35g)
        (1.180, 0.98),
    ]

    status = correlator.correlate(optical_t, imu_events)
    assert status == IMUTimeLockCorrelator.CONFIRMED_STATUTORY_DEFECT


def test_imu_camera_200ms_timelock_negative():
    """
    Simulates optical camera detection at t = 1.000s and shock at t = 1.450s
    (dt = 450ms > 200ms).
    Asserts optical candidate is classified as OPTICAL_PRELIMINARY.
    """
    correlator = IMUTimeLockCorrelator(time_lock_window_ms=200.0)

    optical_t = 1.000
    imu_events = [
        (1.050, 1.02),
        (1.150, 1.05),
        (1.450, 1.55),  # shock occurs 450ms later (> 200ms window)
    ]

    status = correlator.correlate(optical_t, imu_events)
    assert status == IMUTimeLockCorrelator.OPTICAL_PRELIMINARY


def test_low_power_sleep_state_machine():
    """
    Simulates vehicle ignition turning OFF for >60 seconds;
    verifies edge node transitions into low-power sleep, suspends camera/NPU,
    and throttles heartbeat to 10-minute intervals.
    """
    pm = VehiclePowerManager(idle_timeout_sec=60.0)
    assert pm.state == VehiclePowerManager.STATE_AWAKE
    assert pm.is_camera_suspended is False

    t0 = 1000.0
    # Ignition ON initially
    assert pm.update_ignition(True, current_time=t0 - 10.0) == VehiclePowerManager.STATE_AWAKE

    # Ignition turns OFF at t = 1000.0
    assert pm.update_ignition(False, current_time=t0) == VehiclePowerManager.STATE_AWAKE

    # At t = 1030s (30s elapsed < 60s timeout): still AWAKE
    assert pm.update_ignition(False, current_time=t0 + 30.0) == VehiclePowerManager.STATE_AWAKE
    assert pm.is_camera_suspended is False

    # At t = 1065s (65s elapsed > 60s timeout): enters SLEEP
    assert pm.update_ignition(False, current_time=t0 + 65.0) == VehiclePowerManager.STATE_SLEEP
    assert pm.is_camera_suspended is True
    assert pm.is_npu_suspended is True

    # In SLEEP state, check 10-minute (600s) heartbeat
    pm.last_heartbeat_time = t0 + 65.0
    assert pm.should_emit_heartbeat(current_time=t0 + 200.0) is False  # Only 135s elapsed
    assert pm.should_emit_heartbeat(current_time=t0 + 670.0) is True   # 605s elapsed -> fires heartbeat

    # Wakes immediately on ignition ON
    assert pm.update_ignition(True, current_time=t0 + 700.0) == VehiclePowerManager.STATE_AWAKE
    assert pm.is_camera_suspended is False
    assert pm.is_npu_suspended is False
