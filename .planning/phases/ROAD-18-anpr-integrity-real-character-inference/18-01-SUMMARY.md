# Phase 18 Summary: ANPR Integrity & Real Character Inference

## 1. Accomplishments

### Task 1 (18-01-01): Trained Character Detection (`anpr.pt`) & Plate Fabrication Elimination
- Eliminated all coordinate modulo hashing formulas in `anpr_engine.py`:
  - Removed `rto_idx = (vx1 * 13 + vy1 * 7) % len(rto_list) ...`
  - Removed all artificial `confidence = 0.94` floors and fallback `"TN01AB1234"` stubs in `anpr_onnx.py`.
- Wired fine-tuned character detector YOLOv8 model (`backend/app/weights/anpr.pt`):
  - Plate crop is passed to `anpr.pt`, character boxes are extracted and sorted strictly left-to-right by X-coordinate.
  - Calculated genuine arithmetic mean confidence across all detected characters without artificial floors.
  - Applied MoRTH syntax repair and Indian vehicle registration validation regex (`^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$`).
- Enforced zero plate fabrication: unreadable crops or missing characters cleanly return `{"success": False, "plate_number": None, "confidence": 0.0}`.
- Enforced strict review queue gating in `hit_and_run_engine.py`: detections with confidence $< 0.90$ or unreadable plates receive `review_status="PENDING_REVIEW"`, preventing false accusations.

### Task 2 (18-01-02): Brand Unification to RoadSaathi Across Codebase & Storage Keys
- Migrated all frontend `localStorage` keys to `roadsaathi_*` (`roadsaathi_active_role`, `roadsaathi_auth_session`, `roadsaathi_jwt_token`, `roadsaathi_theme`, `roadsaathi_lang`, `roadsaathi_active_route`, `roadsaathi_sound_muted`) while maintaining backwards-compatible fallback migration.
- Updated `DEFAULT_SALT = "RoadSaathi_salt_2026"` in `backend/app/core/auth.py`.
- Updated CSV dispatch attachment header in `work_orders.py` to `roadsaathi_pwd_dispatch.csv`.

### Task 3 (18-01-03): Comprehensive Regression & Integrity Test Verification
- Added `test_anpr_zero_fabrication_and_review_queue` in `backend/tests/test_urban_sensing.py` verifying:
  - Blank/empty images return `success=False` and `confidence=0.0`.
  - Noise images do not synthesize TN registrations from coordinates.
  - Hit-and-run evasion with low-confidence plate cleanly routes to `PENDING_REVIEW` queue.
- Verified 61/61 backend tests passing cleanly.
- Verified clean frontend production Vite build with 0 TypeScript diagnostics.

---

## 2. Verification Evidence
- Automated test command:
  `pytest -o pythonpath=backend backend/tests/test_urban_sensing.py backend/tests/test_copilot_engine.py backend/tests/test_contractor_ledger.py backend/tests/test_concurrence_gating.py backend/tests/test_telematics_physics.py -q`
  `--> 61 passed, 2 warnings in 6.93s`
- Frontend build command:
  `npm --prefix frontend run build`
  `--> built in 7.62s with 0 diagnostics`
