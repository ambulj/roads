# Phase 18 Research: ANPR Integrity & Real Character Inference

## 1. Current Code Analysis: Plate Fabrication Sources

### 1.1 `backend/app/services/anpr_engine.py`
In `detect_plate()`:
- Lines 162–171:
  ```python
  elif vehicle_bbox:
      vx1, vy1, vx2, vy2 = vehicle_bbox
      vw, vh = vx2 - vx1, vy2 - vy1
      rto_list = ["01", "02", "07", "09", "10", "11", "14", "22"]
      series_list = ["AX", "BK", "CB", "DM", "EJ", "FK", "GH", "JC"]
      rto_idx = (vx1 * 13 + vy1 * 7) % len(rto_list)
      series_idx = (vw * 19 + vh * 11) % len(series_list)
      reg_num = (vx1 * 37 + vy1 * 23 + vw * 17 + vh * 13) % 8999 + 1001
      recognized_plate = f"TN{rto_list[rto_idx]}{series_list[series_idx]}{reg_num}"
      confidence = 0.94
  ```
- Lines 188–205: Duplicate coordinate formula when no candidate contours are found.
- In `_read_plate_characters()`:
  - Line 258: `return text, max(conf, 0.94)` (forces artificial confidence floor).
  - Line 275: Returns fixed `0.96` on EasyOCR fallback.

### 1.2 `edge/anpr_onnx.py`
- When `weights/crnn_plate_int8.onnx` is missing or produces zeros, returns:
  `{"plate_number": "TN01AB1234", "confidence": 0.95}`.

### 1.3 Review Queue Gate Bypasses
- In `backend/app/services/hit_and_run_engine.py`:
  - Review queue condition: `if record.anpr_confidence < 0.90: record.review_status = "REQUIRES_HUMAN_REVIEW"`.
  - Because confidence was floored at `0.94` and `0.95`, no record ever entered human review.

---

## 2. Real Architecture: `backend/app/weights/anpr.pt`

### 2.1 Weight Metadata
- Model: YOLOv8n fine-tuned character detector.
- Classes: 30 classes (`0..9`, `A..Z` character bounding boxes).
- Metrics inside weight:
  - Precision: `0.622`
  - Recall: `0.931`
  - mAP50: `0.693`
  - mAP50-95: `0.588`

### 2.2 Character Box Aggregation Protocol
1. **Inference**: Pass localized plate crop `plate_crop` to `anpr_model(plate_crop)`.
2. **Box Extraction**: Collect bounding boxes `(x1, y1, x2, y2, conf, cls_id)`.
3. **Left-to-Right Sort**: Sort detected boxes by `x1` ascending.
4. **String Formation**: Map `cls_id` to character string. If class mapping is numbered (`0: '13', ...`), use mapping table or character indices.
5. **Real Confidence**: Arithmetic mean: $\text{conf}_{\text{mean}} = \frac{1}{N} \sum_{i=1}^N \text{conf}_i$.
6. **Regex Validation**: Check against standard Indian plate pattern:
   `^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$`
7. **Review Status Gate**:
   - If match and $\text{conf}_{\text{mean}} \ge 0.90 \implies$ `AUTO_ADMISSIBLE`.
   - If regex failure or $\text{conf}_{\text{mean}} < 0.90 \implies$ `REQUIRES_HUMAN_REVIEW`.
   - If 0 characters detected $\implies$ `success = False`, `plate_number = None`, `confidence = 0.0`.

---

## 3. Brand Unification (SeherSaathi $\rightarrow$ RoadSaathi)

- Update localStorage keys in frontend:
  - `SeherSaathi_jwt_token` $\rightarrow$ `roadsaathi_jwt_token`
  - `SeherSaathi_active_role` $\rightarrow$ `roadsaathi_active_role`
  - `SeherSaathi_theme` $\rightarrow$ `roadsaathi_theme`
  - `SeherSaathi_lang` $\rightarrow$ `roadsaathi_lang`
- Support legacy migration so existing demo sessions don't lose session storage.
- Update backend salt & header defaults:
  - `DEFAULT_SALT = "RoadSaathi_salt_2026"` in `auth.py`.

---

## 4. Validation Architecture
- Backend pytest command:
  `pytest -o pythonpath=backend backend/tests/test_urban_sensing.py backend/tests/test_copilot_engine.py backend/tests/test_contractor_ledger.py backend/tests/test_concurrence_gating.py backend/tests/test_telematics_physics.py -q`
- Frontend build command:
  `npm --prefix frontend run build`

## RESEARCH COMPLETE
