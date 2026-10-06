# Phase 2: Edge NPU & Hardware Telematics Suite - Context

**Gathered:** 2026-10-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Delivers embedded vehicle perception acceleration and telematics edge resilience for transit fleet buses. This includes:
1. Zero-copy C++ RKNN2 inference pipeline (`edge/rknn_pipeline.cpp`) running on Rockchip RK3588 NPU with DMA-BUF camera buffer mapping, tri-core affinity scheduling (>=30 FPS, <12W), and CPU/x86 mock fallback for automated testing.
2. Lightweight two-stage INT8 quantized license plate OCR pipeline (<150MB VRAM) with 4-point perspective warp, MoRTH/HSRP Indian syntax validation, tracking-based deduplication, and DPDP Act 2023 salted hash privacy compliance.
3. Resilient cellular connectivity watchdog with 5-second fixed-interval network polling, append-only JSONL ring buffering, automated geofenced depot Wi-Fi burst sync, and priority-first incident upload upon reconnection.
4. Official AIS-140 standard VLT packet parsing (serial /dev/ttyUSB0 and TCP socket), dynamic rolling baseline IMU vertical vibration calibration (200ms camera time-lock), low-power sleep on ignition off, and Linux systemd/hardware watchdog integration.

Contractor financial liability ledgers (Phase 3) and MapLibre frontend UI visualizers (Phase 4) are strictly out of scope.
</domain>

<decisions>
## Implementation Decisions

### RK3588 NPU & C++ Pipeline Architecture
- **D-01:** Dual C++ interface with CPU/mock fallback: `rknn_pipeline.hpp` and `rknn_pipeline.cpp` compile with `librknn_api.so` on ARM64 Linux, while falling back to OpenCV/CPU emulation on x86_64 and Windows for zero-hardware automated testing. — **Reversibility:** costly — Core C++ build and shared object compilation architecture.
- **D-02:** DMA-BUF zero-copy import: Direct V4L2 camera capture frame descriptor mapping into NPU input memory via `rknn_create_mem_from_fd`, avoiding host CPU RAM copies to sustain >=30 FPS at <12W board power. — **Reversibility:** costly — Hardware-level camera and NPU buffer interface.
- **D-03:** In-process shared library wrapper (`librknn_pipeline.so` / `.dll`): Python `edge/edge_agent.py` binds to the C++ engine via `ctypes` / `pybind11` passing contiguous C-struct arrays (`DetectionResult`), eliminating inter-process socket IPC latency. — **Reversibility:** reversible — Python/C++ binding wrapper.
- **D-04:** Dedicated NPU core affinity: Pin road hazard detection (YOLOv8-road) to Core 0 (`RKNN_NPU_CORE_0`), vehicle/plate detection to Core 1 (`RKNN_NPU_CORE_1`), reserving Core 2 for asynchronous OCR or secondary models, with fallback to `RKNN_NPU_CORE_AUTO` in single-core or CPU emulation mode. — **Reversibility:** reversible — Runtime core mask configuration.

### INT8 Quantized License Plate OCR
- **D-05:** Two-stage INT8 ONNX Runtime OCR pipeline: YOLOv8-tiny vehicle plate bounding box crop -> quantized lightweight CRNN/LPRNet character recognizer with static INT8 calibration and an explicit 128MB memory arena limit to guarantee <150MB VRAM ceiling. — **Reversibility:** costly — Model architecture and quantization pipeline replacing EasyOCR.
- **D-06:** MoRTH / HSRP Indian registration syntax validation: Strict regex matching against standard Indian formats (`^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$` / Bharat series `22BH1234AA`), combined with optical confusion matrix substitution (`O` <-> `0`, `I` <-> `1`, `B` <-> `8`) based on slot character position. — **Reversibility:** reversible — Text post-processing module.
- **D-07:** Event-driven & track-cached execution: OCR is triggered only when an unread vehicle enters the optimal 10-15m zone or is involved in a statutory road incident; results are cached per `track_id` to eliminate redundant inferences and maintain low CPU/NPU load. — **Reversibility:** reversible — Tracking pipeline trigger logic.
- **D-08:** Embedded lightweight ONNX stub / mock weights in repo for unit tests, paired with automated SHA-256 checksum verification when official production weights are mounted on edge devices. — **Reversibility:** reversible — Model provisioning pattern.
- **D-09:** 4-point perspective warp & CLAHE contrast enhancement: Rectifies angled plate crops into flat horizontal rectangles and normalizes headlights/rain glare before passing into character OCR. — **Reversibility:** reversible — Image pre-processing step.
- **D-10:** DPDP Act 2023 compliance: Store salted SHA-256 hashes for routine corridor tracking/deduplication; raw plate strings are encrypted with municipal public key and stored only for confirmed statutory incident investigations. — **Reversibility:** one-way — Data schema and encryption policy for personal data protection.

### Cellular Watchdog & Offline Store-and-Forward
- **D-11:** Fixed-interval 5-second network polling: Asynchronous cellular watchdog thread evaluates connectivity every 5 seconds without blocking inference or telemetry streaming. — **Reversibility:** reversible — Watchdog timer interval.
- **D-12:** Append-only JSONL ring buffer with compressed image spool: Buffers up to 50MB (~50,000 pings) in `edge_buffer_{bus_id}.jsonl` with atomic compaction, storing hazard image snapshots as compressed WebP files in a FIFO directory. — **Reversibility:** costly — Local edge persistence architecture.
- **D-13:** Automated geofenced / SSID depot burst sync: Detects municipal depot Wi-Fi or depot GPS geofence boundary; automatically triggers high-speed concurrent upload of raw high-resolution video evidence and full telemetry dumps without incurring cellular data charges. — **Reversibility:** reversible — Sync trigger policy.
- **D-14:** Priority-first incident and live-state flusher: On network reconnection, uploads statutory incidents, severe road distresses, and current live coordinates immediately; historical GPS breadcrumbs are drained in background batches. — **Reversibility:** reversible — Reconnection queue drain order.

### Hardware Telematics & AIS-140 Protocol
- **D-15:** Standard AIS-140 & NMEA serial/socket parser: Ingests RS-232 / USB serial streams (`/dev/ttyUSB0`) parsing standard NMEA sentences ($GPRMC, $GPGGA) and AIS-140 VLT packets (IMEI, GPS fix, emergency panic button, ignition status), with mock socket support for automated tests. — **Reversibility:** costly — Telematics ingestion decoder.
- **D-16:** Rolling baseline dynamic calibration & 200ms camera time-lock: Subtracts 1.0g nominal gravity baseline, filters high-frequency engine harmonics, and requires vertical acceleration spikes (>1.35g or <0.75g freefall) within 200ms of optical camera bounding box detection to declare a confirmed pothole impact. — **Reversibility:** costly — Sensor fusion algorithm linking IMU and camera.
- **D-17:** Low-power sleep on ignition off: Suspends camera capture and NPU inference when vehicle ignition is OFF (AIS-140 Ignition = '0'), maintaining an ultra-low-power 10-minute heartbeat ping and waking on motion or ignition switch. — **Reversibility:** reversible — Power management state machine.
- **D-18:** Linux systemd watchdog & hardware heartbeat: Edge agent issues `sd_notify("WATCHDOG=1")` heartbeat every 15s to systemd, backed by `/dev/watchdog` hardware timer to automatically recover from OS or hardware freezes. — **Reversibility:** reversible — Process supervision configuration.

### the agent's Discretion
- Selection of pybind11 vs ctypes for C++ shared library wrapper.
- Lightweight synthetic ONNX model generation for automated CI tests.
- High-pass Butterworth filter order and coefficients for IMU sensor vibration isolation.
- Maximum spool directory size cap (default 2GB) for offline video clips.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Standards & Specifications
- `.planning/PROJECT.md` — Edge hardware constraints and non-negotiables.
- `.planning/REQUIREMENTS.md` §EDGE-01, §EDGE-02, §EDGE-03 — Edge perception and telematics requirements.
- `.planning/ROADMAP.md` §Phase 2 — Phase 2 goals, success criteria, and plans.
- `AIS-140` standard — Automotive Industry Standard for Intelligent Transportation Systems (MoRTH).
- Rockchip RKNN2 SDK documentation — C API and DMA-BUF memory management.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `edge/edge_agent.py`: Existing edge agent daemon with JSONL ring buffer and WebSocket telemetry streaming.
- `backend/app/services/anpr_engine.py`: Existing ANPR engine to be updated with INT8 ONNX pipeline and EasyOCR deprecation.
- `backend/app/api/endpoints/telemetry.py`: Central endpoint receiving telemetry from edge agents.

### Established Patterns
- Modular fallback architecture (tested in Phase 1 dual-dialect engine).
- Non-blocking async event loops and background worker threads.
- Comprehensive pytest test suites without requiring physical hardware.

### Integration Points
- `edge/rknn_pipeline.cpp` & `edge/rknn_pipeline.hpp`: C++ zero-copy perception engine.
- `edge/anpr_onnx.py`: Two-stage INT8 quantized ONNX plate reader.
- `edge/ais140_parser.py`: AIS-140 serial and socket telematics parser.
- `edge/cellular_watchdog.py`: Network polling watchdog and priority store-and-forward spooler.
</code_context>

<specifics>
## Specific Ideas
- Zero-hardware testability: Any developer on Windows or x86 Linux running `pytest` must be able to execute the entire edge perception and telematics test suite through mock C++ bindings and synthetic ONNX models without crashing or requiring physical RK3588 boards.
- Power and thermal safety: On physical transit buses, vehicle battery health is protected by instant sleep on ignition off, and NPU power stays below 12W via DMA-BUF zero-copy memory mapping.
</specifics>

<deferred>
## Deferred Ideas
- Contractor financial liability ledger (IRC:SP:20 Clause 14) -> Phase 3.
- MapLibre WebGIS interactive RPI formula click modal and live dashcam streaming UI -> Phase 4.
</deferred>

---

*Phase: 02-Edge NPU & Hardware Telematics Suite*
