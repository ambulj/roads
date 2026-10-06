import ctypes
import numpy as np
import pytest

from edge.rknn_wrapper import (
    DetectionResultStruct,
    DetectionResult,
    RKNNPipeline,
    MockRKNNPipeline,
    RKNN_NPU_CORE_AUTO,
    RKNN_NPU_CORE_0,
    RKNN_NPU_CORE_1,
    RKNN_NPU_CORE_2,
)


def test_ctypes_struct_memory_alignment():
    """
    Verifies that the packed C-struct in ctypes matches C++ DetectionResult layout
    with exact size of 56 bytes and precise byte offsets.
    """
    assert ctypes.sizeof(DetectionResultStruct) == 56, (
        f"Expected DetectionResultStruct size 56, got {ctypes.sizeof(DetectionResultStruct)}"
    )

    assert DetectionResultStruct.class_id.offset == 0
    assert DetectionResultStruct.confidence.offset == 4
    assert DetectionResultStruct.box.offset == 8
    assert DetectionResultStruct.depth_cm.offset == 24
    assert DetectionResultStruct.rpi_score.offset == 28
    assert DetectionResultStruct.is_p0.offset == 32
    assert DetectionResultStruct.label.offset == 36

    # Test serialization from struct to python dataclass
    sample = DetectionResultStruct()
    sample.class_id = 0
    sample.confidence = 0.94
    sample.box[0] = 0.35
    sample.box[1] = 0.55
    sample.box[2] = 0.65
    sample.box[3] = 0.78
    sample.depth_cm = 8.2
    sample.rpi_score = 92.5
    sample.is_p0 = 1
    sample.label = b"D40_POTHOLE"

    res = DetectionResult.from_struct(sample)
    assert res.class_id == 0
    assert pytest.approx(res.confidence, 0.01) == 0.94
    assert res.depth_cm == 8.2
    assert res.rpi_score == 92.5
    assert res.is_p0 is True
    assert res.label == "D40_POTHOLE"


def test_rknn_pipeline_mock_initialization():
    """Verifies RKNNPipeline creates and closes handles cleanly in mock environment."""
    pipeline = RKNNPipeline(
        model_path="weights/road_yolov8.rknn",
        core_mask=RKNN_NPU_CORE_AUTO,
        input_width=640,
        input_height=640,
    )
    assert pipeline is not None
    assert pipeline.is_mock is True

    # Test context manager support
    with RKNNPipeline(core_mask=RKNN_NPU_CORE_AUTO) as pipe:
        assert pipe.is_mock is True

    # Test explicit close
    pipeline.close()


def test_rknn_pipeline_infer_buffer_mock():
    """Passes a synthetic (640, 640, 3) BGR NumPy array through infer_buffer and verifies DetectionResult."""
    pipeline = RKNNPipeline()
    dummy_frame = np.zeros((640, 640, 3), dtype=np.uint8)

    results = pipeline.infer_buffer(dummy_frame)
    assert isinstance(results, list)
    assert len(results) >= 1

    pothole = results[0]
    assert isinstance(pothole, DetectionResult)
    assert pothole.label == "D40_POTHOLE"
    assert pothole.confidence >= 0.90
    assert pothole.is_p0 is True
    assert pothole.depth_cm >= 7.5
    assert len(pothole.box) == 4
    for coord in pothole.box:
        assert 0.0 <= coord <= 1.0

    # Also test DMA mock inference
    dma_results = pipeline.infer_dma(dma_fd=12)
    assert len(dma_results) >= 1
    assert dma_results[0].label == "D40_POTHOLE"
    pipeline.close()


def test_rknn_pipeline_core_affinity_masks():
    """Asserts initialization succeeds across all core mask options (0, 1, 2, 4)."""
    core_masks = [
        RKNN_NPU_CORE_AUTO,  # 0
        RKNN_NPU_CORE_0,     # 1
        RKNN_NPU_CORE_1,     # 2
        RKNN_NPU_CORE_2,     # 4
    ]

    for mask in core_masks:
        pipe = RKNNPipeline(core_mask=mask)
        assert pipe is not None
        pipe.close()
