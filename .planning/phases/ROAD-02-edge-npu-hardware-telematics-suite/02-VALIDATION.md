---
phase: "ROAD-02"
slug: "edge-npu-hardware-telematics-suite"
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-06"
---

# Phase ROAD-02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|---|---|
| **Framework** | pytest 7.x / 8.x |
| **Config file** | `backend/pytest.ini` / command-line `-o pythonpath=backend` |
| **Quick run command** | `python -m pytest -o pythonpath=backend edge/tests/test_rknn_pipeline.py edge/tests/test_anpr_int8.py -q` |
| **Full suite command** | `python -m pytest -o pythonpath=backend edge/tests/ backend/tests/ -q` |
| **Estimated runtime** | ~18 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full edge test suite (`python -m pytest -o pythonpath=backend edge/tests/ -q`)
- **Before `/gsd-verify-work`:** Full suite must be green (backend + edge test suites)
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---|---|---|---|---|---|---|---|---|---|
| 02-01-01 | 01 | 1 | EDGE-01 | T-02-01 | C++ mock pipeline falls back cleanly without missing symbol panics on x86/Windows | unit | `python -m pytest -o pythonpath=backend edge/tests/test_rknn_pipeline.py` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | EDGE-02 | T-02-02 | INT8 ONNX OCR respects 128MB arena cap and salted DPDP plate hashing | unit | `python -m pytest -o pythonpath=backend edge/tests/test_anpr_int8.py` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | EDGE-03 | T-02-03 | Watchdog handles connection drops with 50MB ring compaction and zero thread deadlocks | integration | `python -m pytest -o pythonpath=backend edge/tests/test_cellular_watchdog.py` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | EDGE-03 | T-02-04 | AIS-140 parser validates checksums and 200ms camera time-lock filters engine idle | unit | `python -m pytest -o pythonpath=backend edge/tests/test_ais140_telematics.py` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `edge/tests/test_rknn_pipeline.py` — Stubs and mock tests for C++ RKNN2 ctypes bindings and DMA-BUF fallback.
- [ ] `edge/tests/test_anpr_int8.py` — Stubs for INT8 ONNX OCR pipeline, MoRTH syntax parsing, and DPDP hashing.
- [ ] `edge/tests/test_cellular_watchdog.py` — Stubs for fixed-interval watchdog polling and JSONL ring buffer compaction.
- [ ] `edge/tests/test_ais140_telematics.py` — Stubs for AIS-140 serial decoding and IMU 200ms camera time-lock.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|---|---|---|---|
| Physical RK3588 Board Power Check | EDGE-01 | Requires physical Rockchip RK3588 SBC with USB power meter | Boot board with V4L2 camera attached, run `edge_agent.py`, and verify board power stays <12W via external meter |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending 2026-10-06
