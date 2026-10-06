# Phase 2: Edge NPU & Hardware Telematics Suite - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-06
**Phase:** 02-Edge NPU & Hardware Telematics Suite
**Areas discussed:** RK3588 NPU & C++ Pipeline Architecture, INT8 Quantized License Plate OCR, Cellular Watchdog & Offline Store-and-Forward, Hardware Telematics & AIS-140 Protocol

---

## RK3588 NPU & C++ Pipeline Architecture

| Option | Description | Selected |
|---|---|---|
| Dual C++ Interface with CPU/Mock Fallback | Compiles with librknn_api on ARM64 RK3588; falls back cleanly to OpenCV/ONNX mock on x86 and Windows | ✓ |
| Strict Hardware-Only Build | Requires physical RK3588 board or QEMU ARM64 cross-compile container | |
| You decide | Let the assistant select | |

**User's choice:** Dual C++ Interface with CPU/Mock Fallback  
**Notes:** DMA-BUF zero-copy frame descriptor import (`rknn_create_mem_from_fd`) for >=30 FPS at <12W; in-process shared library wrapper via ctypes/pybind11; dedicated core affinity (Core 0 road, Core 1 vehicle, Core 2 OCR).

---

## INT8 Quantized License Plate OCR

| Option | Description | Selected |
|---|---|---|
| Two-Stage INT8 ONNX Pipeline | YOLOv8-tiny crop -> quantized CRNN character OCR with static INT8 calibration and 128MB arena cap | ✓ |
| MoRTH / HSRP Syntax Validator | Validates against Indian state/BH series syntax and corrects O/0, I/1, B/8 ambiguities based on slot position | ✓ |
| 4-Point Perspective Warp & CLAHE | Unskews angled plates to flat horizontal rectangles and normalizes headlights/rain glare before OCR | ✓ |
| DPDP Act 2023 Compliance | Salted SHA-256 hash for corridor tracking + encrypted raw text for statutory incident review | ✓ |

**User's choice:** Two-Stage INT8 ONNX Pipeline with MoRTH Validator, Perspective Warp, and DPDP Encryption  
**Notes:** Event-driven & track-cached execution (OCR triggered only when vehicle enters optimal 10-15m zone or is involved in a statutory incident); embedded lightweight synthetic ONNX stub for pytest runs.

---

## Cellular Watchdog & Offline Store-and-Forward

| Option | Description | Selected |
|---|---|---|
| Fixed-Interval Polling | Checks cellular state every 5 seconds constantly | ✓ |
| Full-Jitter Exponential Backoff | 1s initial, doubling up to 60s max with random jitter | |
| You decide | Let the assistant select | |

**User's choice:** Fixed-Interval Polling (5 seconds)  
**Notes:** Append-only JSONL ring buffer capped at 50MB with compressed WebP image spool; automated geofenced / SSID depot Wi-Fi burst sync for heavy video uploads; priority-first defect & live-state flusher upon network restoration.

---

## Hardware Telematics & AIS-140 Protocol

| Option | Description | Selected |
|---|---|---|
| Standard AIS-140 & NMEA Serial / Socket Parser | Parses live serial streams from AIS-140 VLT devices (IMEI, GPS fix, panic button, ignition status) with mock socket support | ✓ |
| Low-Power Sleep on Ignition Off | Suspends camera & NPU pipeline to protect bus 24V battery; maintains 10-minute heartbeat | ✓ |
| Systemd Service Watchdog & /dev/watchdog | Sends sd_notify WATCHDOG=1 every 15s; systemd auto-restarts failed agent, /dev/watchdog recovers kernel panics | ✓ |
| You decide | Let the assistant select | |

**User's choice:** Standard AIS-140 Parser with Low-Power Sleep, Systemd Watchdog, and Rolling IMU Calibration  
**Notes:** Rolling baseline dynamic calibration & 200ms camera time-lock (subtracts 1.0g nominal gravity baseline, filtering engine vibrations; triggers pothole impact only when vertical deviation >1.35g or <0.75g within 200ms of optical camera detection).

---

## The Assistant's Discretion

- Selection of pybind11 vs ctypes for C++ shared library wrapper.
- Lightweight synthetic ONNX model generation for automated CI tests.
- High-pass Butterworth filter order and coefficients for IMU sensor vibration isolation.
- Maximum spool directory size cap (default 2GB) for offline video clips.

## Deferred Ideas

- Contractor financial liability ledger (IRC:SP:20 Clause 14) -> Phase 3.
- MapLibre WebGIS interactive RPI formula click modal and live dashcam streaming UI -> Phase 4.
