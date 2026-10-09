# Phase 20 Plan 01: Statutory & Financial Standards Rectification Summary

**Status:** Completed  
**Phase:** ROAD-20 (Statutory Legal, Financial Standards, Civil Volumetric Calibration & Open Dataset Attribution)  
**Plan:** 20-01  
**Wave:** 1  
**Requirements Satisfied:** STATUTE-03, FINANCE-01, CIVIL-01, ATTRIB-01  
**Decisions Enforced:** D-20-01, D-20-02, D-20-03, D-20-04  

---

## Executive Summary

Phase 20 Wave 1 successfully rectified RoadSaathi's statutory compliance citations, municipal treasury financial terminology, civil engineering volumetric repair calculations, and open-source vision dataset attributions across the full software stack:
1. **Contractual Defect Liability Period (DLP) Citations (D-20-01, STATUTE-03)**: Eradicated rural road manual citations (`IRC:SP:20 Clause 14`) from backend models, notice generators, database seeds, and frontend ledgers in favor of standard **Contractual DLP Clauses (PWD / MORTH GCC Clause 16/17)** combined with **Section 63 & 65B of the Bharatiya Sakshya Adhiniyam (BSA) 2023**.
2. **Security Deposit (SD) / Retention Money Terminology (D-20-02, FINANCE-01)**: Realigned Public Financial Management System (PFMS) transaction voucher generation to standard `PFMS/DLP-RETENTION/{YYYY}/{MMDD}-{HEX6}` and updated all user-facing UI ledgers and consoles from commercial "Escrow" to municipal "Security Deposit (SD) / Retention Money", while preserving internal database schema column names (`escrow_deposit_inr`, `escrow_holdback_released`) for zero-migration backward compatibility.
3. **IRC:82 Civil Engineering Patch Calculations (D-20-03, CIVIL-01)**: Calibrated cavity repair volume and PWD Schedule of Rates (SOR 2025) calculations to include IRC:82 rectangular saw-cut perimeter trim (+15%, `SAW_CUT_MARGIN_PCT = 15.0`) and heavy roller bulk compaction (+10%, `COMPACTION_FACTOR = 1.10`), combining to a $1.265\times$ volume multiplier ($V_{\text{patch}} = V_{\text{cavity}} \times 1.265$), evaluated at $2.35\text{ kg/L}$ ($2,350\text{ kg/m}^3$) bulk density and ₹68.0/kg PWD SOR rate in backend estimation engines and the 3D surface mesh visualizer.
4. **Public Dataset Attribution & Illustrative OD Desire Lines (D-20-04, ATTRIB-01)**: Enriched the central Model Registry with Creative Commons (CC BY 4.0) public dataset attributions for Roboflow Universe training corpora (`potholedetection.pt`, `zebra.pt`, `anpr.pt`, etc.), and explicitly badged Origin-Destination (OD) transit corridors in WebGISMap as illustrative aggregate fleet GPS corridor traces with zero civilian tracking disclaimers.

---

## Key Achievements & Architectural Enhancements

### 1. Contractual DLP Citations Replacement (D-20-01, STATUTE-03)
- **Database Models (`db_models.py`)**:
  - `DBContractorPenalty.statutory_clause` default updated to `"Contractual DLP Clause & Section 63/65B BSA 2023"`.
  - `DBRepairAudit.statutory_clause` default updated to `"Contractual DLP Clause & Section 63/65B BSA 2023"`.
  - `DBAsphaltQualityAudit.statutory_spec` default updated to `"MoRTH Section 500 / IRC:82:2015"`.
  - `DBAsphaltQualityAudit.provenance` default updated to `"IRC_82_LAB_CALIBRATED_BENCHMARK"`.
- **Pydantic Schemas (`schemas.py`)**:
  - `ContractorPenaltyDebit.legal_clause` example updated to `"Contractual DLP Clause & Section 63/65B BSA 2023"`.
  - `ContractorDebarmentDossier.statutory_clause` default updated to `"MoHUA Rule 151(iii) GFR 2017 & Contractual DLP Clause"`.
  - `AsphaltQualityAudit.geometric_milling_shape` updated to `"RECTANGULAR_IRC_82"`.
- **Backend Services & API**:
  - In `contractor_service.py`: `calculate_clause14_penalty` docstrings updated to PWD/MORTH GCC Clause 16/17; `issue_form14_show_cause_notice` records statutory clause `"Contractual DLP Clause & Section 63/65B BSA 2023"` across both penalty docket and repair audit rows, and sets debarment docket reason citing the contractual DLP clause.
  - In `concurrence_service.py`: records `statutory_clause="Contractual DLP Clause & Section 63/65B BSA 2023 Concurrence Clearance"`.
  - In `contractors.py`: updated endpoint docstrings, fallback clauses to `"Contractual DLP Clause & Section 63/65B BSA 2023"`, and `/certificate/{cert_id}` response to `"statutory_act": "Bharatiya Sakshya Adhiniyam 2023 (Section 63 / 65B) & Contractual DLP Clause"`.
  - In `copilot_engine.py`: updated statutory contexts and cards to `"Contractual DLP Clause & Section 63/65B BSA 2023"`.
  - In `road_memory_engine.py`, `city_brain_engine.py`, `database.py`, `mock_database.py`, and `postgis_schema.sql`: eliminated legacy rural road manual citations in favor of Contractual DLP and IRC:82 standards.

### 2. Security Deposit (SD) / Retention Money Terminology (D-20-02, FINANCE-01)
- **PFMS Voucher Generation (`contractor_service.py`)**:
  - Updated `generate_pfms_voucher_ref` token generation to standard `PFMS/DLP-RETENTION/{YYYY}/{MMDD}-{HEX6}`.
  - Updated test regex to `^PFMS/(DLP-RETENTION|DLP-ESCROW)/\d{4}/\d{4}-[A-F0-9]{6}$` for backward-compatible validation.
- **Database & Schema Backward Compatibility**:
  - Preserved internal database columns `distress_clusters.escrow_deposit_inr` and `ConcurrenceEvaluationResult.escrow_holdback_released` intact for complete zero-migration database and API consumer stability.
- **Frontend UI Realignment**:
  - In `ContractorSlaLedger.tsx`: Replaced "Net Available Escrow" with "Security Deposit (SD) / Retention Money", updated header cards, cure exposure titles, and Form 14 notice dockets. Replaced action button with "Enforce Security Deposit / Retention Deduction".
  - In `WorkOrderActionConsole.tsx`: Replaced "Escrow Security Deposit Pool" with "Security Deposit (SD) / Retention Pool", labeled metric card as "NET SD / RETENTION", and titled concurrence approval gate as "Statutory Security Deposit / Retention Release Gate".

### 3. IRC:82 Civil Engineering Patch Calculations (D-20-03, CIVIL-01)
- **Civil Constants & Helper (`contractor_service.py`)**:
  - Defined canonical IRC:82:2015 constants:
    - `SAW_CUT_MARGIN_PCT = 15.0` (IRC:82 Cl 5.2 rectangular box trim margin)
    - `COMPACTION_FACTOR = 1.10` (IRC:82 Cl 5.4 mechanical roller compaction factor)
    - `TOTAL_IRC82_VOLUME_FACTOR = 1.265` ($1.15 \times 1.10$)
    - `ASPHALT_BULK_DENSITY_KG_L = 2.35` (MoRTH Section 500 DBM bulk density)
    - `PWD_SOR_RATE_PER_KG = 68.0` (PWD SOR 2025 rate for VG-30 patch repair)
  - Implemented `calculate_irc82_patch_estimate(cavity_area_m2, depth_cm, ...)` returning raw cavity volume, calibrated patch volume, asphalt mass in kg, and PWD SOR repair cost.
- **3D Surface Mesh Depth Slicer (`RoadMeshVisualizerModal.tsx`)**:
  - Integrated `IRC82_VOLUME_FACTOR = 1.265` and `2.35 kg/L` density in dynamic cut-plane slider calculations.
  - Displayed live badges and tooltips citing IRC:82 Cl 5.2 (+15% Saw-Cut Trim) and Cl 5.4 (+10% Compaction allowance) at 2.35 kg/L bulk density and PWD SOR 2025 rates.
- **Feature Logic Tests (`test_all_features_logic.py`)**:
  - Calibrated `test_3d_mesh_depth_and_volumetric_logic` to assert the $1.265\times$ volume multiplier, $2.35\text{ kg/L}$ density, and PWD SOR cost.

### 4. Public Dataset Attribution & Illustrative OD Traces (D-20-04, ATTRIB-01)
- **Model Registry (`model_registry.py`)**:
  - Added `dataset_attribution` to all vision model entries:
    - `pothole_yolo`: `"Roboflow Universe - Pothole Detection Dataset (CC BY 4.0)"`
    - `indian_roads_yolo`: `"Roboflow Universe - Indian Road Hazards & Assets (CC BY 4.0)"`
    - `zebra_crossing_detector`: `"Roboflow Universe - Pedestrian Zebra Crossing Dataset (CC BY 4.0)"`
    - `vehicle_detection`: `"Roboflow Universe - Indian Traffic & Vehicle Detection (CC BY 4.0)"`
    - `anpr_yolo`: `"Kaggle & Roboflow - Indian License Plate Character OCR (CC BY 4.0)"`
  - Exposed `dataset_attribution` in `get_status()` return payload.
- **WebGIS Map OD Traces (`WebGISMap.tsx`)**:
  - Labeled Layer 6 as `"OD Transit Corridor Traces (Illustrative)"` with explicit tooltip.
  - Added header pill to MapLibre popup: `"Illustrative Transit Corridor Trace • Fleet GPS Derived"`.
  - Added bottom tray subtitle clarifying aggregate fleet GPS route synthesis and zero civilian tracking.

---

## Verification Results

### Automated Backend Test Suite
```powershell
pytest -o pythonpath=backend backend/tests/test_contractor_ledger.py backend/tests/test_concurrence_gating.py backend/tests/test_urban_sensing.py backend/tests/test_copilot_engine.py -q
```
- **Result:** **55 passed** in 6.78s (100% pass rate).
- Validated:
  - `test_pfms_txn_ref_format` matches `PFMS/DLP-RETENTION/` format.
  - `test_statutory_clause_contractual_dlp` verifies `statutory_clause` default and Form 14 notice generation.
  - `test_irc82_patch_estimation_logic` verifies 1.265x multiplier, 2.35 kg/L density, and PWD SOR cost.
  - `test_model_registry_dataset_attributions` verifies Roboflow Universe CC BY 4.0 dataset attributions.

### All Features Logic Verification
```powershell
pytest -o pythonpath=backend backend/tests/test_all_features_logic.py -q
```
- **Result:** **6 passed** in 0.81s (100% pass rate).
- Validated:
  - 3D mesh depth, area, volumetric & MoRTH cost calculations with IRC:82 +15% trim margin and +10% compaction factor.

### Frontend Production Build
```powershell
npm --prefix frontend run build
```
- **Result:** **Built in 8.31s with 0 errors** (`tsc && vite build` passed cleanly).

---

## Files Modified

| File | Changes Made |
|---|---|
| `backend/app/models/db_models.py` | Updated `DBContractorPenalty`, `DBRepairAudit`, and `DBAsphaltQualityAudit` statutory defaults. |
| `backend/app/models/schemas.py` | Updated legal clause examples and debarment statutory clause defaults. |
| `backend/app/services/contractor_service.py` | Added IRC:82 constants and helper; updated PFMS voucher format to `PFMS/DLP-RETENTION`; updated Form 14 statutory clauses. |
| `backend/app/services/concurrence_service.py` | Updated statutory clearance audit clause and comments to Contractual DLP. |
| `backend/app/api/endpoints/contractors.py` | Updated endpoint docstrings, fallback clauses, and certificate response statutory act. |
| `backend/app/api/router.py` | Updated contractor router tag to Contractual DLP & Retention Account. |
| `backend/app/services/copilot_engine.py` | Updated copilot statutory context strings and action cards. |
| `backend/app/services/model_registry.py` | Added `dataset_attribution` to model configurations and `get_status()`. |
| `backend/app/services/road_memory_engine.py` | Updated statutory clauses from IRC:SP:20 to Contractual DLP. |
| `backend/app/services/city_brain_engine.py` | Updated intervention recommendations and mandates to IRC:82 and MoRTH. |
| `backend/app/services/stream_manager.py` | Updated defect names to IRC:82:2015. |
| `backend/app/services/synthetic_generator.py` | Updated asphalt repair audit text to IRC:82. |
| `backend/app/services/self_learning_engine.py` | Updated statutory compliance reference to IRC:82. |
| `backend/app/storage/database.py` | Updated seed penalties, contractor comments, and asphalt audit specifications. |
| `backend/app/storage/mock_database.py` | Updated mock penalty legal clauses and debarment statutory clauses. |
| `backend/app/storage/postgis_schema.sql` | Updated table comments and statutory clause default. |
| `backend/tests/test_contractor_ledger.py` | Updated PFMS regex to DLP-RETENTION; added 3 new tests for statutory DLP, IRC:82 patch estimation, and dataset attributions. |
| `backend/tests/test_all_features_logic.py` | Updated volumetric calculations and assertions with IRC:82 1.265x multiplier and 2.35 kg/L density. |
| `frontend/src/components/workorders/ContractorSlaLedger.tsx` | Replaced Escrow with Security Deposit (SD) / Retention Money; replaced IRC:SP:20 with Contractual DLP Clause. |
| `frontend/src/components/workorders/WorkOrderActionConsole.tsx` | Updated Retention Pool labels, NET SD / RETENTION badge, and statutory release gate. |
| `frontend/src/components/modals/RoadMeshVisualizerModal.tsx` | Implemented IRC:82 1.265x multiplier, 2.35 kg/L bulk density, and PWD SOR 2025 live breakdown. |
| `frontend/src/components/map/WebGISMap.tsx` | Labeled OD Desire Lines as illustrative aggregate fleet GPS corridor traces with zero civilian tracking disclaimer. |
| `frontend/src/services/api.ts` | Replaced legacy IRC:SP:20 citations with Contractual DLP Clause & Section 63/65B BSA 2023. |
| `frontend/src/pages/RoadMemory.tsx` | Replaced IRC:SP:20 citations with Contractual DLP Clause in audit trails and tabs. |
| `frontend/src/components/modals/DocumentExportModal.tsx` | Updated export modal notice header and line items to Contractual DLP Cl 16/17 & BSA 2023. |
| `frontend/src/pages/Analytics.tsx` | Updated liquidated damages badge to Contractual DLP. |
| `frontend/src/pages/WorkOrders.tsx` | Updated autonomous dispatch notes and cure window exposure label to Contractual DLP. |
