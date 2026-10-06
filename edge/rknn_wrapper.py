"""
RoadSaathi - RKNN2 C++ Shared Library ctypes Wrapper & CPU Mock Fallback.
Provides zero-copy C-ABI inference execution on Rockchip RK3588 NPU
with seamless pure-Python mock fallback on x86_64 and Windows development hosts.
"""

import ctypes
from dataclasses import dataclass
import os
from pathlib import Path
import sys
from typing import List, Optional
import numpy as np

# NPU Core Affinity Masks
RKNN_NPU_CORE_AUTO = 0
RKNN_NPU_CORE_0 = 1
RKNN_NPU_CORE_1 = 2
RKNN_NPU_CORE_2 = 4

# Contiguous packed C-struct matching edge/rknn_pipeline.hpp (56 bytes)
class DetectionResultStruct(ctypes.Structure):
    _pack_ = 1
    _fields_ = [
        ("class_id", ctypes.c_int32),      # Offset 0,  4 bytes
        ("confidence", ctypes.c_float),    # Offset 4,  4 bytes
        ("box", ctypes.c_float * 4),       # Offset 8,  16 bytes [x1, y1, x2, y2]
        ("depth_cm", ctypes.c_float),      # Offset 24, 4 bytes
        ("rpi_score", ctypes.c_float),     # Offset 28, 4 bytes
        ("is_p0", ctypes.c_int32),         # Offset 32, 4 bytes
        ("label", ctypes.c_char * 20),     # Offset 36, 20 bytes
    ]


@dataclass
class DetectionResult:
    class_id: int
    confidence: float
    box: List[float]
    depth_cm: float
    rpi_score: float
    is_p0: bool
    label: str

    @classmethod
    def from_struct(cls, s: DetectionResultStruct) -> "DetectionResult":
        raw_label = bytes(s.label).split(b"\x00", 1)[0]
        return cls(
            class_id=int(s.class_id),
            confidence=round(float(s.confidence), 4),
            box=[round(float(x), 4) for x in s.box],
            depth_cm=round(float(s.depth_cm), 2),
            rpi_score=round(float(s.rpi_score), 2),
            is_p0=bool(s.is_p0),
            label=raw_label.decode("utf-8", errors="replace"),
        )


class MockRKNNPipeline:
    """Deterministic pure-Python CPU mock for zero-hardware automated testing."""

    def __init__(
        self,
        model_path: str = "weights/road_yolov8.rknn",
        core_mask: int = RKNN_NPU_CORE_AUTO,
        input_width: int = 640,
        input_height: int = 640,
    ):
        self.model_path = model_path
        self.core_mask = core_mask
        self.input_width = input_width
        self.input_height = input_height
        self.is_closed = False
        self.frame_counter = 0

    def infer_buffer(self, bgr_array: np.ndarray) -> List[DetectionResult]:
        if self.is_closed:
            raise RuntimeError("Cannot run inference on closed RKNN pipeline")
        self.frame_counter += 1

        # Return deterministic mock detections for zero-hardware CI
        return [
            DetectionResult(
                class_id=0,
                confidence=0.94,
                box=[0.35, 0.55, 0.65, 0.78],
                depth_cm=8.2,
                rpi_score=92.5,
                is_p0=True,
                label="D40_POTHOLE",
            ),
            DetectionResult(
                class_id=2,
                confidence=0.89,
                box=[0.15, 0.20, 0.45, 0.60],
                depth_cm=0.0,
                rpi_score=0.0,
                is_p0=False,
                label="VEHICLE_BUS",
            ),
        ]

    def infer_dma(self, dma_fd: int) -> List[DetectionResult]:
        if self.is_closed:
            raise RuntimeError("Cannot run inference on closed RKNN pipeline")
        self.frame_counter += 1
        return [
            DetectionResult(
                class_id=0,
                confidence=0.95,
                box=[0.25, 0.40, 0.65, 0.80],
                depth_cm=8.4,
                rpi_score=94.0,
                is_p0=True,
                label="D40_POTHOLE",
            )
        ]

    def close(self) -> None:
        self.is_closed = True

    def __enter__(self) -> "MockRKNNPipeline":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()


def _find_pipeline_library() -> Optional[str]:
    """Search candidate directory locations for compiled librknn_pipeline shared object."""
    search_dirs = [
        Path(__file__).parent,
        Path(__file__).parent / "build",
        Path.cwd() / "edge",
        Path.cwd() / "edge" / "build",
        Path("/usr/local/lib"),
        Path("/usr/lib"),
    ]
    lib_names = ["librknn_pipeline.so", "librknn_pipeline.dll", "rknn_pipeline.dll", "librknn_pipeline.dylib"]

    for d in search_dirs:
        for name in lib_names:
            candidate = d / name
            if candidate.exists():
                return str(candidate)
    return None


class RKNNPipeline:
    """
    Python ctypes wrapper over librknn_pipeline.so / .dll with automatic
    pure-Python CPU mock fallback when native binary is unavailable.
    """

    def __init__(
        self,
        model_path: str = "weights/road_yolov8.rknn",
        core_mask: int = RKNN_NPU_CORE_AUTO,
        input_width: int = 640,
        input_height: int = 640,
    ):
        self.model_path = model_path
        self.core_mask = core_mask
        self.input_width = input_width
        self.input_height = input_height
        self._lib = None
        self._handle = None
        self._mock_pipeline: Optional[MockRKNNPipeline] = None

        lib_path = _find_pipeline_library()
        if lib_path:
            try:
                self._lib = ctypes.CDLL(lib_path)
                self._setup_bindings()
                self._handle = self._lib.rknn_pipeline_create(
                    self.model_path.encode("utf-8"),
                    ctypes.c_int32(self.core_mask),
                    ctypes.c_int32(self.input_width),
                    ctypes.c_int32(self.input_height),
                )
            except Exception:
                self._lib = None
                self._handle = None

        if self._handle is None:
            # Fall back seamlessly to MockRKNNPipeline
            self._mock_pipeline = MockRKNNPipeline(
                model_path=model_path,
                core_mask=core_mask,
                input_width=input_width,
                input_height=input_height,
            )

    def _setup_bindings(self) -> None:
        if not self._lib:
            return

        self._lib.rknn_pipeline_create.argtypes = [
            ctypes.c_char_p,
            ctypes.c_int32,
            ctypes.c_int32,
            ctypes.c_int32,
        ]
        self._lib.rknn_pipeline_create.restype = ctypes.c_void_p

        self._lib.rknn_pipeline_infer_dma.argtypes = [
            ctypes.c_void_p,
            ctypes.c_int32,
            ctypes.POINTER(DetectionResultStruct),
            ctypes.c_int32,
            ctypes.POINTER(ctypes.c_int32),
        ]
        self._lib.rknn_pipeline_infer_dma.restype = ctypes.c_int32

        self._lib.rknn_pipeline_infer_buffer.argtypes = [
            ctypes.c_void_p,
            ctypes.POINTER(ctypes.c_uint8),
            ctypes.c_int32,
            ctypes.c_int32,
            ctypes.POINTER(DetectionResultStruct),
            ctypes.c_int32,
            ctypes.POINTER(ctypes.c_int32),
        ]
        self._lib.rknn_pipeline_infer_buffer.restype = ctypes.c_int32

        self._lib.rknn_pipeline_destroy.argtypes = [ctypes.c_void_p]
        self._lib.rknn_pipeline_destroy.restype = None

    @property
    def is_mock(self) -> bool:
        return self._mock_pipeline is not None

    def infer_buffer(self, bgr_array: np.ndarray) -> List[DetectionResult]:
        if self._mock_pipeline:
            return self._mock_pipeline.infer_buffer(bgr_array)

        if not self._handle:
            raise RuntimeError("Pipeline handle is not valid")

        h, w = bgr_array.shape[:2]
        max_results = 32
        results_array = (DetectionResultStruct * max_results)()
        actual_count = ctypes.c_int32(0)

        # Contiguous uint8 pointer
        c_bgr = np.ascontiguousarray(bgr_array, dtype=np.uint8)
        data_ptr = c_bgr.ctypes.data_as(ctypes.POINTER(ctypes.c_uint8))

        ret = self._lib.rknn_pipeline_infer_buffer(
            self._handle,
            data_ptr,
            ctypes.c_int32(w),
            ctypes.c_int32(h),
            results_array,
            ctypes.c_int32(max_results),
            ctypes.byref(actual_count),
        )

        if ret != 0:
            raise RuntimeError(f"rknn_pipeline_infer_buffer failed with status {ret}")

        return [DetectionResult.from_struct(results_array[i]) for i in range(actual_count.value)]

    def infer_dma(self, dma_fd: int) -> List[DetectionResult]:
        if self._mock_pipeline:
            return self._mock_pipeline.infer_dma(dma_fd)

        if not self._handle:
            raise RuntimeError("Pipeline handle is not valid")

        max_results = 32
        results_array = (DetectionResultStruct * max_results)()
        actual_count = ctypes.c_int32(0)

        ret = self._lib.rknn_pipeline_infer_dma(
            self._handle,
            ctypes.c_int32(dma_fd),
            results_array,
            ctypes.c_int32(max_results),
            ctypes.byref(actual_count),
        )

        if ret != 0:
            raise RuntimeError(f"rknn_pipeline_infer_dma failed with status {ret}")

        return [DetectionResult.from_struct(results_array[i]) for i in range(actual_count.value)]

    def close(self) -> None:
        if self._mock_pipeline:
            self._mock_pipeline.close()
            self._mock_pipeline = None

        if self._lib and self._handle:
            self._lib.rknn_pipeline_destroy(self._handle)
            self._handle = None

    def __enter__(self) -> "RKNNPipeline":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()
