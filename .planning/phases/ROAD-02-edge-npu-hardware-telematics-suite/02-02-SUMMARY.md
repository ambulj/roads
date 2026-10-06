# Phase 2: Edge NPU & Hardware Telematics Suite — Plan 02-02 Execution Summary

**Plan:** `02-02: Cellular Reconnection Watchdog, Depot Wi-Fi Sync & AIS-140 Protocol`  
**Wave:** 2  
**Requirements Satisfied:** `EDGE-03`  
**Execution Date:** 2026-10-06  
**Status:** Completed & Verified  

---

## 1. Overview & Objectives

Plan 02-02 established edge resilience, store-and-forward telemetry preservation, and telematics hardware integration for transit fleet buses operating in challenging field environments (EDGE-03):
1. **Cellular Reconnection Watchdog & Priority Store-and-Forward (`edge/cellular_watchdog.py`)**:
   - Asynchronous `CellularWatchdog` daemon thread performing 5.0-second non-blocking TCP socket checks with randomized jitter backoff (1.0–3.0s) to prevent thundering herd flushes across fleet buses.
   - Append-only `JsonlRingBuffer` writing to `edge_buffer_{bus_id}.jsonl` with atomic 50MB file compaction retaining the most recent 35MB via temporary file swap (`os.replace`) to protect vehicle flash/eMMC storage from wear.
   - Compressed WebP image snapshot FIFO spool directory (`spool/images/`) capped at 2GB (quality 75, ~30KB) with automatic FIFO pruning of oldest non-P0 images when usage exceeds 90% (1.8GB), strictly protecting P0 statutory incident images.
   - `PriorityReconnectionFlusher` enforcing hierarchical queue drainage: Tier 0 (P0 critical statutory incidents and live GPS) dispatched immediately before Tier 1 (P1 routine road distress) and Tier 2 (P2 historical breadcrumbs, batched in 50 records with 500ms pacing).
   - Automated `DepotBurstSync` triggered by authorized municipal SSIDs (`GCC_DEPOT_WIFI_*`, `MTC_DEPOT_HIGHWAY_*`, `PMPML_DEPOT_5G`) or GPS geofence boundary ($R \le 150\text{m}$) for high-speed deferred offloading to `/api/v1/fleet/edge-sync`.
2. **AIS-140 Hardware Telematics, IMU 200ms Time-Lock & Power Management (`edge/ais140_parser.py`, `edge/edge_agent.py`)**:
   - Official AIS-140 standard VLT packet parser (`$PV` sentences) and NMEA GNSS parser (`$GPRMC`, `$GPGGA`) with strict XOR checksum validation and serial/mock socket streaming.
   - Dynamic rolling baseline IMU vertical acceleration calibration ($W=100$ samples at 50Hz) tracking chassis pitch and passenger load drift.
   - 2nd-order digital high-pass Butterworth filter ($f_c = 0.8\text{ Hz}$, $f_s = 50\text{ Hz}$, $b=[0.9314, -1.8628, 0.9314]$, $a=[1.0, -1.8592, 0.8665]$) combined with engine harmonic isolation to eliminate 15–40 Hz diesel vibrations.
   - 200ms camera-IMU time-lock correlation: pothole defect classified as `CONFIRMED_STATUTORY_DEFECT` only if vertical acceleration exceeds $>1.35g$ or $<0.75g$ within 200ms of optical camera detection; otherwise categorized as `OPTICAL_PRELIMINARY` (optical only) or `MECHANICAL_UNCLASSIFIED` (IMU only).
   - Ultra-low-power vehicle sleep state machine (<0.8W board power) entered when AIS-140 reports ignition OFF continuously for >60s, releasing camera/NPU resources and maintaining a 10-minute cellular heartbeat, waking within 1.2s on ignition ON or tamper acceleration $>0.2g$.
   - Linux systemd watchdog heartbeat (`sd_notify("WATCHDOG=1")` every 15s) and `/dev/watchdog` hardware recovery.
   - Unified orchestration in `edge/edge_agent.py` wiring `CellularWatchdog`, `JsonlRingBuffer`, `ImageSpoolManager`, `AIS140Parser`, `RKNNPipeline`, and `INT8ONNXPlateRecognizer` into a cohesive onboard daemon.

---

## 2. Changes Implemented

### Task 1: Cellular Watchdog Loop, 50MB Ring Compaction & Depot Wi-Fi Burst Sync
- **Files Created:**
  - `edge/cellular_watchdog.py`:
    - `CellularWatchdog`: 5.0s fixed-interval network polling thread, atomic `is_online` status, `on_disconnect` and `on_reconnect` callbacks with randomized jitter backoff (1.0–3.0s).
    - `JsonlRingBuffer`: Append-only single-line writes to `edge_buffer_{bus_id}.jsonl`, atomic 50MB compaction via `.tmp` file and `os.replace` retaining the latest 35MB.
    - `ImageSpoolManager`: Quality 75 WebP image compression (~30KB), 2GB directory cap, FIFO pruning of oldest non-P0 files when usage exceeds 90% (1.8GB) while preserving P0 incident snapshots.
    - `PriorityReconnectionFlusher`: Classifies telemetry into Tier 0 (P0 critical / live GPS), Tier 1 (P1 routine distress), and Tier 2 (P2 breadcrumbs), ensuring P0 is dispatched strictly before P1 and P2.
    - `DepotBurstSync`: Detects depot presence via authorized SSIDs (`GCC_DEPOT_WIFI_*`, `MTC_DEPOT_HIGHWAY_*`, `PMPML_DEPOT_5G`) and Haversine GPS geofence ($R \le 150\text{m}$), triggering high-speed burst offloading to `/api/v1/fleet/edge-sync`.
  - `edge/tests/test_cellular_watchdog.py`:
    - `test_cellular_watchdog_5sec_polling`: Mocks TCP socket connection and verifies state transitions and reconnect/disconnect callbacks.
    - `test_append_only_ring_buffer_write_and_read`: Writes 500 simulated telemetry pings and asserts valid JSONL loading without corruption.
    - `test_ring_buffer_50mb_compaction`: Verifies buffer enforces size ceiling and executes atomic compaction retaining recent lines.
    - `test_priority_reconnection_upload_order`: Confirms P0 critical alerts are dispatched strictly before P1 and P2 records.
    - `test_webp_image_spool_cap_eviction`: Asserts FIFO pruning deletes oldest non-P0 files when exceeding cap while keeping P0 snapshots intact.
    - `test_depot_burst_sync_trigger`: Validates SSID prefix and GPS geofence distance calculation.

### Task 2: AIS-140 Telematics Parser, 200ms IMU Time-Lock & Edge Agent Integration
- **Files Created / Modified:**
  - `edge/ais140_parser.py`:
    - `AIS140Packet`: Schema dataclass capturing IMEI, UTC timestamp, GPS fix, latitude, longitude, speed, heading, ignition, panic SOS, vertical acceleration, battery voltage, and tamper status.
    - `AIS140Parser`: Decodes AIS-140 `$PV` and NMEA `$GPRMC`/`$GPGGA` sentences with strict XOR checksum validation between `$` and `*`.
    - `ButterworthHighPassFilter`: 2nd-order digital high-pass filter ($f_c = 0.8\text{ Hz}$, $f_s = 50\text{ Hz}$) filtering DC gravity and chassis pitch drift.
    - `IMUVibrationFilter`: Integrated Butterworth high-pass and engine harmonic isolation filter attenuating 15–40 Hz diesel engine rumble while preserving road shock transients.
    - `RollingBaselineCalibrator`: 100-sample sliding window ($W=100$, 2.0s at 50Hz) dynamically tracking vertical acceleration baseline.
    - `IMUTimeLockCorrelator`: 200ms camera time-lock correlation engine linking optical detections with vertical acceleration deviations ($g_z > 1.35g$ or $g_z < 0.75g$) to yield `CONFIRMED_STATUTORY_DEFECT`.
    - `VehiclePowerManager`: Power management state machine entering sleep (<0.8W) after >60s continuous ignition OFF, throttling to 10-minute cellular heartbeats, and waking on ignition ON or tamper acceleration $>0.2g$.
    - `notify_systemd_watchdog`: Emits `b"WATCHDOG=1"` to Linux `$NOTIFY_SOCKET` every 15 seconds.
  - `edge/edge_agent.py`:
    - Refactored and unified onboard daemon wiring `CellularWatchdog`, `JsonlRingBuffer`, `ImageSpoolManager`, `PriorityReconnectionFlusher`, `DepotBurstSync`, `AIS140Parser`, `RollingBaselineCalibrator`, `IMUTimeLockCorrelator`, `VehiclePowerManager`, `RKNNPipeline`, and `INT8ONNXPlateRecognizer`.
  - `edge/tests/test_ais140_telematics.py`:
    - `test_ais140_packet_decoding`: Validates parsed IMEI, GPS fix, coordinates, speed, heading, ignition, and panic SOS with valid XOR checksum.
    - `test_ais140_invalid_checksum_rejected`: Asserts corrupted checksum strings are rejected.
    - `test_nmea_gprmc_decoding`: Validates NMEA coordinate and knot-to-km/h conversion.
    - `test_imu_rolling_baseline_calibration`: Verifies 100-sample window tracks gradual pitch drift.
    - `test_imu_butterworth_vibration_isolation`: Feeds 25Hz engine vibration alongside 5Hz pothole shock; asserts 25Hz is attenuated while shock transient is preserved.
    - `test_imu_camera_200ms_timelock_positive`: Confirms optical detection at $t=1.000\text{s}$ and shock at $t=1.120\text{s}$ ($\Delta t = 120\text{ms} < 200\text{ms}$) classifies as `CONFIRMED_STATUTORY_DEFECT`.
    - `test_imu_camera_200ms_timelock_negative`: Confirms delayed shock at $t=1.450\text{s}$ ($\Delta t = 450\text{ms} > 200\text{ms}$) classifies as `OPTICAL_PRELIMINARY`.
    - `test_low_power_sleep_state_machine`: Verifies ignition OFF for >60s transitions agent into low-power sleep, suspends camera/NPU, and enforces 10-minute heartbeat.

---

## 3. Verification & Test Results

### 1. Cellular Watchdog Test Suite (`edge/tests/test_cellular_watchdog.py`)
- **Command:** `python -m pytest -o pythonpath=backend edge/tests/test_cellular_watchdog.py -v`
- **Result:** **6 PASSED in 1.79s**
  - `test_cellular_watchdog_5sec_polling` PASSED
  - `test_append_only_ring_buffer_write_and_read` PASSED
  - `test_ring_buffer_50mb_compaction` PASSED
  - `test_priority_reconnection_upload_order` PASSED
  - `test_webp_image_spool_cap_eviction` PASSED
  - `test_depot_burst_sync_trigger` PASSED

### 2. AIS-140 Telematics Test Suite (`edge/tests/test_ais140_telematics.py`)
- **Command:** `python -m pytest -o pythonpath=backend edge/tests/test_ais140_telematics.py -v`
- **Result:** **8 PASSED in 0.43s**
  - `test_ais140_packet_decoding` PASSED
  - `test_ais140_invalid_checksum_rejected` PASSED
  - `test_nmea_gprmc_decoding` PASSED
  - `test_imu_rolling_baseline_calibration` PASSED
  - `test_imu_butterworth_vibration_isolation` PASSED
  - `test_imu_camera_200ms_timelock_positive` PASSED
  - `test_imu_camera_200ms_timelock_negative` PASSED
  - `test_low_power_sleep_state_machine` PASSED

### 3. Full Edge Test Suite (`edge/tests/`)
- **Command:** `python -m pytest -o pythonpath=backend edge/tests/ -v`
- **Result:** **24 PASSED in 3.90s** (All RKNN, ANPR INT8, Cellular Watchdog, and AIS-140 tests passing)

### 4. Full RoadSaathi Suite Verification (`edge/tests/ backend/tests/`)
- **Command:** `python -m pytest -o pythonpath=backend edge/tests/ backend/tests/ -q`
- **Result:** **87 PASSED in 98.31s** (0 failures, 0 regressions across edge perception, hardware telematics, and central backend endpoints)

---

## 4. Architectural Adherence & Decisions

| Decision | Implementation Status | Notes |
|---|---|---|
| **D-11** | **Completed** | Fixed-interval 5.0-second network polling daemon thread with non-blocking socket probes |
| **D-12** | **Completed** | Append-only JSONL ring buffer with atomic 50MB compaction (35MB retention) and WebP image spool |
| **D-13** | **Completed** | Automated municipal depot burst sync triggered by SSIDs (`GCC_DEPOT_WIFI_*`, `MTC_DEPOT_HIGHWAY_*`, `PMPML_DEPOT_5G`) or GPS geofence ($R \le 150\text{m}$) |
| **D-14** | **Completed** | Hierarchical priority-tiered drain ordering: Tier 0 (P0 critical / live GPS) before Tier 1 (P1 routine) before Tier 2 (P2 breadcrumbs) |
| **D-15** | **Completed** | Official AIS-140 standard `$PV` and NMEA sentence parser with XOR checksum validation and serial / TCP socket support |
| **D-16** | **Completed** | 100-sample dynamic rolling baseline calibration, 2nd-order Butterworth filter, and 200ms camera time-lock shock correlation |
| **D-17** | **Completed** | Vehicle power management state machine entering sleep (<0.8W) after >60s ignition OFF with 10-minute cellular heartbeat |
| **D-18** | **Completed** | Linux systemd watchdog heartbeat (`sd_notify("WATCHDOG=1")` every 15s) and `/dev/watchdog` hardware recovery |
| **T-02-03**| **Addressed** | Single-line append-only JSONL writing and atomic compaction protect eMMC flash; randomized jitter backoff (1.0–3.0s) prevents cellular thundering herd |
| **T-02-04**| **Addressed** | XOR checksum checks reject corrupted packets; Butterworth filter and 200ms camera time-lock prevent false alerts from 15–40 Hz diesel harmonics; low-power sleep protects vehicle starter battery |
