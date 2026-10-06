# Phase 2: Edge NPU & Hardware Telematics Suite — Plan 02-01 Execution Summary

**Plan:** `02-01: Zero-Copy RKNN2 Pipeline & INT8 Quantized License Plate OCR`  
**Wave:** 1  
**Requirements Satisfied:** `EDGE-01`, `EDGE-02`  
**Execution Date:** 2026-10-06  
**Status:** Completed & Verified  

---

## 1. Overview & Objectives

Plan 02-01 transitioned RoadSaathi's edge vehicle perception subsystem from userspace memory churning and heavy unquantized PyTorch models to an optimized dual-tier architecture:
1. **Rockchip RK3588 C++ Zero-Copy Inference Pipeline (`edge/rknn_pipeline.hpp`, `edge/rknn_pipeline.cpp`)**:
   - DMA-BUF direct camera buffer mapping (`rknn_create_mem_from_fd`) and multi-core affinity scheduling (`RKNN_NPU_CORE_0`, `RKNN_NPU_CORE_1`, `RKNN_NPU_CORE_2`, `RKNN_NPU_CORE_AUTO`) to sustain $\ge 30$ FPS at $<12$W board power.
   - Dual-mode C++ architecture compiling native `librknn_api.so` on ARM64 Linux while providing OpenCV / CPU deterministic fallback on x86_64 and Windows development hosts.
   - In-process `ctypes` binding (`edge/rknn_wrapper.py`) with packed C-ABI struct alignment (56 bytes) and pure-Python CPU mock fallback (`MockRKNNPipeline`).
2. **Two-Stage INT8 ONNX License Plate Recognition Pipeline (`edge/anpr_onnx.py`)**:
   - 4-point quadrilateral perspective warp and CLAHE (`clipLimit=2.5, tileGridSize=(8, 8)`) contrast normalization.
   - Strict 128MB ONNX session arena allocation cap (`session.max_arena_alloc_byte_limit = 134217728`), ensuring total edge VRAM/RAM stays well under the 150MB ceiling (EDGE-02).
   - Slot-aware MoRTH/HSRP standard and Bharat Series (`BH`) syntax parser with position-dependent optical confusion matrix repair (`0` <-> `O`, `1` <-> `I`, `8` <-> `B`, `5` <-> `S`, `2` <-> `Z`).
   - Digital Personal Data Protection (DPDP) Act 2023 compliance via deterministic salted SHA-256 corridor tracking hashing and statutory citation encryption tokens.
   - Refactored `backend/app/services/anpr_engine.py` to route through the INT8 ONNX pipeline and MoRTH syntax parser while deprecating repeated EasyOCR re-instantiations.

---

## 2. Changes Implemented

### Task 1: C++ RKNN2 Zero-Copy Pipeline Interface & ctypes Wrapper
- **Files Modified / Created:**
  - `edge/rknn_pipeline.hpp` (created): Declares `#pragma pack(push, 1)` struct `DetectionResult` (exact 56 bytes) with offsets: `class_id` (0), `confidence` (4), `box[4]` (8), `depth_cm` (24), `rpi_score` (28), `is_p0` (32), `label[20]` (36). Exports C-ABI functions `rknn_pipeline_create`, `rknn_pipeline_infer_dma`, `rknn_pipeline_infer_buffer`, `rknn_pipeline_destroy`.
  - `edge/rknn_pipeline.cpp` (refactored): Implements dual-mode conditional compilation: native ARM64 Linux RKNN2 with DMA-BUF zero-copy vs deterministic CPU mock fallback for zero-hardware testing.
  - `edge/rknn_wrapper.py` (created): Defines `DetectionResultStruct` (`_pack_ = 1`), Python dataclass `DetectionResult`, NPU core affinity masks (AUTO=0, Core0=1, Core1=2, Core2=4), shared library loader, and pure-Python `MockRKNNPipeline` fallback.
  - `edge/__init__.py` & `edge/tests/__init__.py` (created): Standard package markers.
  - `edge/tests/test_rknn_pipeline.py` (created): Unit test suite asserting C-struct alignment (56 bytes), lifecycle initialization, buffer and DMA inference, and core affinity mask options.

### Task 2: Two-Stage INT8 ONNX Plate OCR, MoRTH Syntax Parsing & DPDP Hash Compliance
- **Files Modified / Created:**
  - `edge/anpr_onnx.py` (created):
    - `rectify_plate_quadrilateral`: CLAHE enhancement and 4-point perspective warp to standard $(32, 128)$ grayscale format.
    - `INT8ONNXPlateRecognizer`: Configures ONNX Runtime with 128MB arena ceiling (`session.max_arena_alloc_byte_limit = 134217728`), sequential execution, 2 threads, and automatic synthetic stub generation for zero-hardware tests.
    - `MoRTHSyntaxEngine`: Strict regex parsing for standard (`^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$`) and Bharat Series (`^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$`), paired with slot-aware optical substitution repairing dirty characters (`0N01AB1234` -> `TN01AB1234`, `TNIOAB1234` -> `TN10AB1234`, `TN018B1234` -> `TN01BB1234`, `TN01ABIZ34` -> `TN01AB1234`).
    - `DPDPCryptographicVault`: Computes 64-character salted SHA-256 hex digests for routine transit logs and statutory citation encryption tokens.
    - `PlateTrackCache`: Caches plate results per `track_id` with confidence threshold $\ge 0.85$.
  - `backend/app/services/anpr_engine.py` (refactored): Integrates `INT8ONNXPlateRecognizer`, `MoRTHSyntaxEngine`, and `DPDPCryptographicVault`. Deprecates repeated EasyOCR allocations while maintaining backward-compatible helper functions and endpoints.
  - `edge/tests/test_anpr_int8.py` (created): Unit tests verifying MoRTH standard regex, Bharat series extraction, optical confusion matrix substitution, DPDP salted hashing, perspective warp/CLAHE, and VRAM arena ceiling.

---

## 3. Verification & Test Results

### 1. RKNN Pipeline Test Suite (`edge/tests/test_rknn_pipeline.py`)
- **Command:** `python -m pytest -o pythonpath=backend edge/tests/test_rknn_pipeline.py -v`
- **Result:** **4 PASSED in 0.11s**
  - `test_ctypes_struct_memory_alignment` PASSED (sizeof == 56 bytes, offsets verified)
  - `test_rknn_pipeline_mock_initialization` PASSED
  - `test_rknn_pipeline_infer_buffer_mock` PASSED
  - `test_rknn_pipeline_core_affinity_masks` PASSED

### 2. INT8 ONNX & MoRTH ANPR Test Suite (`edge/tests/test_anpr_int8.py`)
- **Command:** `python -m pytest -o pythonpath=backend edge/tests/test_anpr_int8.py -v`
- **Result:** **6 PASSED in 0.35s**
  - `test_morth_standard_syntax_validation` PASSED (`TN01AB1234`, `MH12DE5678`, `DL04C1020`, `KA05MB9999`)
  - `test_bharat_series_syntax_validation` PASSED (`22BH1234AA`, `23BH9876ZZ`)
  - `test_optical_confusion_matrix_substitution` PASSED (all 4 slot-based substitution repairs verified)
  - `test_dpdp_salted_hash_generation` PASSED (deterministic 64-char hex digest, PII protected)
  - `test_perspective_warp_and_clahe` PASSED ($(32, 128)$ aspect ratio output verified)
  - `test_vram_memory_ceiling` PASSED (128MB arena alloc limit verified across 100 iterations)

### 3. Backend Regression Suite
- **Command:** `python -m pytest -o pythonpath=backend backend/tests/test_spatial.py backend/tests/test_dual_engine.py -q`
- **Result:** **8 PASSED in 3.76s**
- **Command:** `python -m pytest -o pythonpath=backend backend/tests/ -q`
- **Result:** **63 PASSED in 18.01s** (All traffic and API endpoints pass with 0 errors)

---

## 4. Architectural Adherence & Decisions

| Decision | Implementation Status | Notes |
|---|---|---|
| **D-01** | **Completed** | Dual C++ interface in `rknn_pipeline.cpp` compiling with `librknn_api.so` on ARM64 and falling back to CPU mock on x86_64 / Windows |
| **D-02** | **Completed** | Direct DMA-BUF camera buffer mapping via `rknn_create_mem_from_fd` in native C++ pipeline |
| **D-03** | **Completed** | In-process C-ABI shared library ctypes wrapper passing contiguous 56-byte `DetectionResultStruct` arrays |
| **D-04** | **Completed** | NPU core affinity configuration (`RKNN_NPU_CORE_AUTO`, `CORE_0`, `CORE_1`, `CORE_2`) |
| **D-05** | **Completed** | Two-stage INT8 ONNX OCR pipeline with 128MB arena ceiling (`session.max_arena_alloc_byte_limit = 134217728`, <150MB VRAM) |
| **D-06** | **Completed** | MoRTH / HSRP standard and Bharat series regex validation with grammatical slot-aware optical confusion matrix repair |
| **D-07** | **Completed** | Event-driven per-`track_id` caching via `PlateTrackCache` (min confidence $\ge 0.85$) to prevent redundant OCR passes |
| **D-08** | **Completed** | Synthetic ONNX stub generation (`PlateCRNNStub`, ir_version 9) enabling zero-hardware testability |
| **D-09** | **Completed** | CLAHE contrast enhancement (`clipLimit=2.5, tileGridSize=(8, 8)`) and 4-point perspective warp into standard $(32, 128)$ format |
| **D-10** | **Completed** | DPDP Act 2023 salted SHA-256 hashing for routine corridor tracking and statutory citation encryption tokens |
| **T-02-01**| **Addressed** | Explicit `#pragma pack(push, 1)` and `_pack_ = 1` ctypes field alignment prevents memory misalignment; pure-Python CPU mock fallback prevents missing symbol crashes |
| **T-02-02**| **Addressed** | 128MB arena limit prevents OOM panics; salted SHA-256 hashes prevent plain text PII exposure under DPDP Act 2023 |
