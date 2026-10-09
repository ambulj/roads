# Phase 18 Context: ANPR Integrity & Real Character Inference

## Context Summary
- Repo state audited: commit 9e7b583 (283 files).
- Finding 1.1: The plate reader invents plates and marks them auto-admissible.
  - In `backend/app/services/anpr_engine.py`, `detect_plate` builds a plate number out of pixel coordinates when no plate was read:
    ```python
    rto_idx = (vx1*13 + vy1*7) % len(rto_list)
    reg_num = (vx1*37 + vy1*23 + vw*17 + vh*13) % 8999 + 1001
    recognized_plate = f"TN{rto}{series}{reg_num}"
    confidence = 0.94
    ```
  - In `_read_plate_characters`, confidence is floored at `max(conf, 0.94)`.
  - In `edge/anpr_onnx.py`, an all-zeros stub fallback returns `"TN01AB1234"` at `0.95`.
  - With confidence never below `0.90`, records bypass human review and become `AUTO_ADMISSIBLE`.
- Finding 4.5: Use the ANPR model already trained.
  - `backend/app/weights/anpr.pt` is a fine-tuned YOLO model with 30 classes (`0..9`, `A..Z` character detectors) trained on Kaggle/Roboflow (mAP50 0.693, recall 0.931).
  - Characters must be detected on the plate crop, sorted left-to-right by X-coordinate, mapped to character labels, scored by true mean per-character confidence, and validated against the Indian registration regex (`^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$`).
  - Low confidence (< 0.90) or unreadable crops must yield `review_status="REQUIRES_HUMAN_REVIEW"`.
- Finding 7: Brand unification.
  - Standardize product naming to **RoadSaathi** everywhere across code and localStorage keys.

## Locked Decisions
- **D-18-01 (Zero Plate Fabrication)**: All coordinate modulo hashing, `TN01AB1234` fallbacks, and artificial `0.94`/`0.95` confidence floors are deleted. Unreadable crops return `success=False`, `plate_number=None`, `confidence=0.0`.
- **D-18-02 (Trained Model Inference)**: `anpr_engine.py` calls `backend/app/weights/anpr.pt` via `ultralytics.YOLO` (or loads model weights into `yolo_engine.anpr_model`). Detected character boxes are sorted left-to-right (`x1`), concatenated, and scored by arithmetic mean of detected character confidences.
- **D-18-03 (Statutory Review Routing)**: Valid Indian plates with `mean_conf >= 0.90` get `review_status = "AUTO_ADMISSIBLE"`. Plates with `mean_conf < 0.90` or regex mismatches receive `review_status = "REQUIRES_HUMAN_REVIEW"` and `is_flagged = True`.
- **D-18-04 (Brand Unification)**: All `SeherSaathi` references in localStorage keys, headers, env defaults, and docstrings are migrated to `RoadSaathi` with backwards-compatible migration on client load.
