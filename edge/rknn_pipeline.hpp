#ifndef ROADSAATHI_RKNN_PIPELINE_HPP
#define ROADSAATHI_RKNN_PIPELINE_HPP

#include <cstdint>
#include <cstddef>

#ifdef _WIN32
  #define RS_EXPORT __declspec(dllexport)
#else
  #define RS_EXPORT __attribute__((visibility("default")))
#endif

#ifdef __cplusplus
extern "C" {
#endif

// Bounded C-compatible struct for contiguous array marshaling into Python ctypes
#pragma pack(push, 1)
struct DetectionResult {
    int32_t class_id;   // Defect / vehicle class ID (offset 0, 4 bytes)
    float confidence;   // Detection confidence 0.0 - 1.0 (offset 4, 4 bytes)
    float box[4];       // Normalized bounding box [x1, y1, x2, y2] (offset 8, 16 bytes)
    float depth_cm;     // Estimated defect depth for D40 (offset 24, 4 bytes)
    float rpi_score;    // Calculated Road Pavement Index 0 - 100 (offset 28, 4 bytes)
    int32_t is_p0;      // 1 = Critical Statutory Alert, 0 = Routine (offset 32, 4 bytes)
    char label[20];     // Null-terminated string (e.g., "D40_POTHOLE") (offset 36, 20 bytes)
};
#pragma pack(pop)

#ifdef __cplusplus
static_assert(sizeof(DetectionResult) == 56, "DetectionResult must be exactly 56 bytes");
#endif

typedef void* PipelineHandle;

// NPU Core Affinity Masks
#define RKNN_NPU_CORE_AUTO 0
#define RKNN_NPU_CORE_0    1
#define RKNN_NPU_CORE_1    2
#define RKNN_NPU_CORE_2    4

RS_EXPORT PipelineHandle rknn_pipeline_create(
    const char* model_path,
    int32_t target_core_mask, // 1=Core0, 2=Core1, 4=Core2, 0=AUTO
    int32_t input_width,
    int32_t input_height
);

RS_EXPORT int32_t rknn_pipeline_infer_dma(
    PipelineHandle handle,
    int32_t dma_fd,
    DetectionResult* out_results,
    int32_t max_results,
    int32_t* actual_count
);

RS_EXPORT int32_t rknn_pipeline_infer_buffer(
    PipelineHandle handle,
    const uint8_t* bgr_data,
    int32_t width,
    int32_t height,
    DetectionResult* out_results,
    int32_t max_results,
    int32_t* actual_count
);

RS_EXPORT void rknn_pipeline_destroy(PipelineHandle handle);

#ifdef __cplusplus
}
#endif

#endif // ROADSAATHI_RKNN_PIPELINE_HPP
