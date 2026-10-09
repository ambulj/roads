# Phase 20 Research: Statutory & Financial Standards Rectification

## Executive Summary
Phase 20 investigates and specifies the rectification of statutory legal citations, municipal financial terminology, civil engineering volumetric repair calculations, and dataset attributions across the RoadSaathi platform. Specifically:
1. **Contractual Defect Liability Period (DLP) Citations (D-20-01, STATUTE-03)**:
   - Replaces rural road manual citations ("IRC:SP:20 Clause 14") with standard **Contractual DLP Clauses (PWD / MORTH GCC Clause 16/17)** combined with **Section 63 & 65B of the Bharatiya Sakshya Adhiniyam (BSA) 2023**.
2. **Security Deposit (SD) / Retention Money Terminology (D-20-02, FINANCE-01)**:
   - Updates CAG-compliant Public Financial Management System (PFMS) voucher generation from `PFMS/DLP-ESCROW/{YYYY}/{MMDD}-{HEX6}` to `PFMS/DLP-RETENTION/{YYYY}/{MMDD}-{HEX6}`.
   - Replaces frontend UI copy ("Escrow Balance", "Escrow Holdback", "Clause 14 Escrow") with authentic Indian municipal contracting terms ("Security Deposit (SD) / Retention Money"), while preserving internal database column names (`escrow_deposit_inr`, `escrow_holdback_released`) for full backward compatibility.
3. **IRC:82 Civil Engineering Patch Calculations (D-20-03, CIVIL-01)**:
   - Calibrates asphalt repair calculations to comply with IRC:82 ("Guidelines for Maintenance of Bituminous Surfaces of Highways").
   - Incorporates a **+15% rectangular saw-cut box trim margin** (`saw_cut_margin_pct = 15.0`) and a **+10% bulk asphalt compaction factor** (`compaction_factor = 1.10`), yielding a combined patch volume multiplier of $V_{\text{patch}} = V_{\text{cavity}} \times 1.15 \times 1.10 = V_{\text{cavity}} \times 1.265$.
   - Integrates compacted bulk density ($\rho = 2350 \text{ kg/m}^3 = 2.35 \text{ kg/L}$) and PWD Schedule of Rates (SOR 2025: ₹68.0/kg VG-30 DBM) across backend estimation services and the 3D surface mesh visualizer.
4. **Public Dataset Attribution & Illustrative OD Claims (D-20-04, ATTRIB-01)**:
   - Enriches AI model registry configurations with public dataset attributions under Creative Commons (CC BY 4.0) for Roboflow Universe training corpora (`potholedetection.pt`, `zebra.pt`, `anpr.pt`, `indian_roads_detection.pt`, `vehicle_detection.pt`).
   - Labels Origin-Destination (OD) desire lines in `WebGISMap.tsx` as aggregate illustrative transit corridor traces derived from fleet GPS routes, explicitly disclaiming civilian tracking.

---

## 1. Contractual DLP Citations Replacement (D-20-01, STATUTE-03)

### 1.1 Audit Finding & Statutory Legal Analysis
In the legacy codebase, road defect recurrence penalties and 36-month liability tracking cited `"MoHUA IRC:SP:20 Clause 14"` / `"IRC:SP:20 Clause 14.2"`.
- **Legal Reality**: IRC:SP:20 is the *Rural Roads Manual* published by the Indian Roads Congress (primarily governing Pradhan Mantri Gram Sadak Yojana / PMGSY village roads). It does not govern urban municipal arterials, state highways, or National Highways in municipal corporation zones (e.g., Greater Chennai Corporation, BBMP, BMC).
- **Municipal Contract Law**: Defect liability on urban roads is governed by the **Defect Liability Period (DLP) Clause** in the General Conditions of Contract (GCC):
  - Standard MORTH Specifications for Road and Bridge Works (5th Revision, Section 100 / Section 3000).
  - CPWD GCC Clause 17 ("Defects Liability").
  - Tamil Nadu Highways Standard Tender / GCC Standard Contract Agreement Clause 16 ("Defect Liability Period").
- **Evidentiary Admissibility**: The evidentiary basis for digital bus telematics, IMU vertical shock logs, and dashcam keyframes in Indian courts derives from **Section 63 & Section 65B of the Bharatiya Sakshya Adhiniyam (BSA) 2023** (which replaced Section 65B of the Indian Evidence Act, 1872).

### 1.2 Canonical Citation String Design
- **Primary Canonical Citation**:
  ```
  "Contractual DLP Clause & Section 63/65B BSA 2023"
  ```
- **Concurrence Clearance Variant**:
  ```
  "Contractual DLP Clause & Section 63/65B BSA 2023 Concurrence Clearance"
  ```
- **Notice Pack Description / Header**:
  ```
  "Statutory Notice under Contractual DLP Clause (PWD/MORTH GCC Clause 16/17) & Section 63/65B BSA 2023"
  ```

### 1.3 Exact Codebase Modifications Required

#### Backend Models & Schemas
1. **`backend/app/models/db_models.py`**:
   - `DBContractorPenalty.statutory_clause`:
     - Old default: `"MoHUA IRC:SP:20 Clause 14.2 & Section 63 BSA 2023"`
     - New default: `"Contractual DLP Clause & Section 63/65B BSA 2023"`
   - `DBRepairAudit.statutory_clause`:
     - Old default: `"MoHUA IRC:SP:20 Clause 14.2"`
     - New default: `"Contractual DLP Clause & Section 63/65B BSA 2023"`
   - `DBAsphaltQualityAudit.statutory_spec`:
     - Old default: `"MoRTH Section 500 / IRC:SP:20"`
     - New default: `"MoRTH Section 500 / IRC:82:2015"`
   - `DBAsphaltQualityAudit.provenance`:
     - Old default: `"IRC_SP20_LAB_CALIBRATED_BENCHMARK"`
     - New default: `"IRC_82_LAB_CALIBRATED_BENCHMARK"`
2. **`backend/app/models/schemas.py`**:
   - `DistressRecurrenceRecord.legal_clause`: example `"Contractual DLP Clause & Section 63/65B BSA 2023"`
   - `ContractorDebarmentDossier.statutory_clause`: `"MoHUA Rule 151(iii) GFR 2017 & Contractual DLP Clause"`

#### Backend Services & Endpoints
3. **`backend/app/services/contractor_service.py`**:
   - `calculate_clause14_penalty`: Update docstring and comments to reference standard PWD/MORTH GCC DLP Clause 16/17.
   - `issue_form14_show_cause_notice`:
     - Line 370: `statutory_clause="Contractual DLP Clause & Section 63/65B BSA 2023"`
     - Line 421: `reason=f"Defect recurrence threshold exceeded (N={re_pothole_count} within {dlp_tier}-month DLP) under Contractual DLP Clause & Section 63/65B BSA 2023."`
     - Line 459: `statutory_clause="Contractual DLP Clause & Section 63/65B BSA 2023"`
4. **`backend/app/services/concurrence_service.py`**:
   - Line 494: `statutory_clause="Contractual DLP Clause & Section 63/65B BSA 2023 Concurrence Clearance"`
5. **`backend/app/api/endpoints/contractors.py`**:
   - Line 276: docstring update.
   - Line 309: fallback `statutory_clause = r.statutory_clause or "Contractual DLP Clause & Section 63/65B BSA 2023"`
   - Line 653: `"statutory_act": "Bharatiya Sakshya Adhiniyam 2023 (Section 63 / 65B) & Contractual DLP Clause"`
6. **`backend/app/services/copilot_engine.py`**:
   - Lines 857, 896, 911, 927: update statutory citations to `"Contractual DLP Clause & Section 63/65B BSA 2023"`.
7. **`backend/app/storage/database.py` & `mock_database.py` & `postgis_schema.sql`**:
   - Seed penalties and tables with updated statutory clause string.

#### Frontend UI Ledgers & Notices
8. **`frontend/src/components/workorders/ContractorSlaLedger.tsx`**:
   - Mock records & fallback clauses: `"Contractual DLP Clause & Section 63/65B BSA 2023"`.
   - Banner title (line 466): `CONTRACTUAL DLP CLAUSE • STATUTORY SHOW-CAUSE NOTICE SYSTEM`.
   - Card 2 title (line 603): `Contractual DLP Clause 7d Cure Exposure`.
   - Status badge (line 665): `Contractual DLP Form 14 Active`.
   - Certificate button (line 798, 819): `Contractual DLP Clause • Statutory Form 14 Notice & Audit Docket`.
   - Docket header (line 904): `GCC/HW/FORM-14/2026-089 • CONTRACTUAL DLP CLAUSE • 7-DAY CURE NOTICE`.
   - Notice letterhead (line 922, 972): Update text to cite Contractual DLP Clause (PWD/MORTH GCC Clause 16/17) and Section 63/65B BSA 2023.
   - Form 14 modal header (lines 1144, 1162, 1177): Replace IRC:SP:20 with Contractual DLP Clause.
9. **`frontend/src/components/workorders/WorkOrderActionConsole.tsx`**:
   - Line 456: `Contractual DLP Cl 16/17 Compliant`.
   - Line 643: `<strong>Statutory Reference:</strong> Contractual DLP Clause & Section 63/65B BSA 2023.`.
   - Line 747: `Statutory Form 14 Show-Cause Pack (Contractual DLP & BSA 2023)`.
10. **Other Frontend Pages**:
    - `RoadMemory.tsx`: Replace `"MoHUA IRC:SP:20 Clause 14.2"` with `"Contractual DLP Clause & Section 63/65B BSA 2023"`.
    - `DocumentExportModal.tsx`: Replace `"MoHUA IRC:SP:20 Clause 14.2"` with `"Contractual DLP Clause & Section 63/65B BSA 2023"`.

---

## 2. Security Deposit / Retention Money Terminology (D-20-02, FINANCE-01)

### 2.1 Municipal Financial Practice vs. Escrow
- In municipal infrastructure procurement in India (regulated by CPWD Works Manual 2019, General Financial Rules / GFR 2017 Rule 171, and State Highways Manuals), funds withheld during construction and maintenance are **Security Deposits (SD)** and **Retention Money**, not commercial bank escrows.
- The procuring entity deducts 5% to 10% from running account (RA) bills as Retention Money, held in municipal treasury / PFMS until the Defect Liability Period expires.
- CAG audit compliance requires referencing **Retention Money** or **Security Deposit (SD)** on treasury debit vouchers.

### 2.2 PFMS Voucher Token Replacement
- **Legacy Token Format**:
  $$\text{PFMS/DLP-ESCROW/}\{YYYY\}/\{MMDD\}\text{-}\{HEX6\}$$
- **Updated Standard Token Format**:
  $$\text{PFMS/DLP-RETENTION/}\{YYYY\}/\{MMDD\}\text{-}\{HEX6\}$$
- **Implementation in `backend/app/services/contractor_service.py`**:
  ```python
  def generate_pfms_voucher_ref(dt: Optional[datetime.datetime] = None) -> str:
      """
      Generates a CAG-compliant Public Financial Management System (PFMS)
      transaction voucher reference: PFMS/DLP-RETENTION/{YYYY}/{MMDD}-{HEX6}
      """
      if dt is None:
          dt = datetime.datetime.now(datetime.timezone.utc)
      yyyy = dt.strftime("%Y")
      mmdd = dt.strftime("%m%d")
      hex6 = uuid.uuid4().hex[:6].upper()
      return f"PFMS/DLP-RETENTION/{yyyy}/{mmdd}-{hex6}"
  ```
- **Validation Regex Support (Backward Compatible)**:
  `^PFMS/(DLP-RETENTION|DLP-ESCROW)/\d{4}/\d{4}-[A-F0-9]{6}$`

### 2.3 Backward-Compatible Database & API Schema Preservation
Per Locked Decision **D-20-02**:
- Do **not** rename database columns:
  - `distress_clusters.escrow_deposit_inr` (retained for database migrations / schema stability).
  - `contractors.security_deposit_inr` and `contractors.penalties_deducted_inr` (already aligned).
  - `ConcurrenceEvaluationResult.escrow_holdback_released` (retained as boolean property in schema).
- This avoids risky table migrations and prevents breaking existing REST API consumers while rectifying all user-facing copy and audit trail strings.

### 2.4 Frontend UI Copy Transformations
- In **`ContractorSlaLedger.tsx`**:
  | Old UI Copy | Updated Authentic Municipal Copy |
  |---|---|
  | "Net Available Escrow" | "Security Deposit (SD) / Retention Money" |
  | "Net Available Escrow Balance" | "Security Deposit (SD) / Retention Balance" |
  | "Clause 14 Escrow" | "Contractual DLP Retention" |
  | "Enforce Escrow Debit (Liquidated Damages)" | "Enforce Security Deposit / Retention Deduction" |
  | "Debiting Escrow..." | "Deducting SD / Retention..." |
  | "debited from bank guarantee escrow" | "deducted from Security Deposit (SD) / Retention Money" |
  | "Failed to communicate with municipal escrow treasury" | "Failed to communicate with municipal treasury" |
- In **`WorkOrderActionConsole.tsx`**:
  | Old UI Copy | Updated Authentic Municipal Copy |
  |---|---|
  | "Escrow Security Deposit Pool" | "Security Deposit (SD) / Retention Pool" |
  | "NET ESCROW" | "NET SD / RETENTION" |
  | "Trip-Windowed Fleet Concurrence & Escrow Release Gate" | "Trip-Windowed Fleet Concurrence & Retention Release Gate" |
  | "Escrow release authorization and contractor deductions..." | "Retention money release authorization and contractor deductions..." |
  | "Statutory Escrow Payment Recommendation Gate" | "Statutory Security Deposit / Retention Release Gate" |
  | "Recommend Escrow Clearance" | "Recommend SD / Retention Clearance" |

---

## 3. IRC:82 Civil Engineering Patch Calculations (D-20-03, CIVIL-01)

### 3.1 Civil Engineering Principles (IRC:82:2015 & MoRTH Section 3000)
In road maintenance engineering, raw detected optical/IMU cavity volume ($V_{\text{raw}} = \text{area} \times \text{depth}$) significantly underestimates real repair material requirements for two physical reasons codified in IRC:82 ("Guidelines for Maintenance of Bituminous Surfaces of Highways"):
1. **Rectangular Saw-Cut Box Trim Margin (+15%)**:
   - Pothole cavities develop with irregular, ragged, frayed perimeters.
   - IRC:82 Clause 5.2 mandates that the distress area must be marked with a straight-line rectangular boundary extending at least 75mm beyond the distress perimeter and cut with vertical saw-cut edges before applying tack coat.
   - Geometric box squaring requires an average **+15.0% additional volume allowance** (`saw_cut_margin_pct = 15.0`).
2. **Bulk Asphalt Compaction Factor (+10%)**:
   - Hot-mix Dense Bituminous Macadam (DBM) or Asphalt Concrete (AC) is spread loose in the trimmed cavity with a loose bulking density (~2.14 g/cm³).
   - Upon heavy mechanical compaction with vibratory rollers to achieve the specified MoRTH target bulk density of **2.35 g/cm³ (2,350 kg/m³)**, the material volume compacts by approximately **10%** (`compaction_factor = 1.10`).

### 3.2 Mathematical Formulation
Let:
- $A_{\text{cavity}}$ = Detected defect surface area ($\text{m}^2$)
- $d_{\text{cavity}}$ = Measured defect depth ($\text{cm}$)
- $V_{\text{cavity}} = A_{\text{cavity}} \times \frac{d_{\text{cavity}}}{100.0} \times 1000.0$ (Cavity void volume in Liters)

The physical IRC:82 patch repair volume is:
$$V_{\text{patch}} = V_{\text{cavity}} \times \left(1.0 + \frac{\text{saw\_cut\_margin\_pct}}{100.0}\right) \times \text{compaction\_factor}$$
$$V_{\text{patch}} = V_{\text{cavity}} \times 1.15 \times 1.10 = V_{\text{cavity}} \times 1.265$$

The required compacted asphalt mass is:
$$M_{\text{asphalt}} = \left(\frac{V_{\text{patch}}}{1000.0}\right) \times \rho_{\text{compacted}} = V_{\text{patch}} \times 2.35 \text{ kg}$$
where $\rho_{\text{compacted}} = 2350 \text{ kg/m}^3 = 2.35 \text{ kg/L}$.

Under PWD Schedule of Rates (SOR 2025) / MoRTH Section 500, the unit rate for VG-30 Bituminous Macadam patch repair (inclusive of perimeter diamond saw cutting, tack coat emulsion, hot-mix material, compaction, and rolling) is:
$$\text{Rate}_{\text{PWD}} = ₹68.0 \text{ per kg}$$
$$\text{Cost}_{\text{INR}} = M_{\text{asphalt}} \times 68.0 = V_{\text{patch}} \times 2.35 \times 68.0 \approx V_{\text{patch}} \times 159.80$$

### 3.3 Reusable Python Civil Estimation Helper
In `backend/app/services/contractor_service.py` (and testable in `test_all_features_logic.py`):
```python
# IRC:82:2015 Civil Engineering Standard Constants
SAW_CUT_MARGIN_PCT: float = 15.0       # IRC:82 Cl 5.2: Rectangular saw-cut perimeter trim (+15%)
COMPACTION_FACTOR: float = 1.10        # IRC:82 Cl 5.4: Bulk asphalt compaction factor (+10%)
TOTAL_IRC82_VOLUME_FACTOR: float = 1.265  # 1.15 * 1.10
ASPHALT_BULK_DENSITY_KG_L: float = 2.35   # 2.35 g/cm³ (MoRTH Section 500 DBM)
PWD_SOR_RATE_PER_KG: float = 68.0         # PWD SOR 2025 rate for VG-30 patch repair

def calculate_irc82_patch_estimate(
    cavity_area_m2: float,
    depth_cm: float,
    saw_cut_margin_pct: float = SAW_CUT_MARGIN_PCT,
    compaction_factor: float = COMPACTION_FACTOR,
    density_kg_l: float = ASPHALT_BULK_DENSITY_KG_L,
    rate_inr_per_kg: float = PWD_SOR_RATE_PER_KG
) -> dict:
    """
    Computes IRC:82 calibrated patch repair volume, asphalt mass, and PWD SOR 2025 repair cost.
    Formula:
      V_cavity = Area (m²) * Depth (m) * 1000 (L)
      V_patch  = V_cavity * (1 + saw_cut_margin / 100) * compaction_factor = V_cavity * 1.265
      Mass     = V_patch * 2.35 kg
      Cost     = Mass * ₹68.0
    """
    raw_vol_liters = cavity_area_m2 * (depth_cm / 100.0) * 1000.0
    trim_multiplier = 1.0 + (saw_cut_margin_pct / 100.0)
    patch_vol_liters = raw_vol_liters * trim_multiplier * compaction_factor
    asphalt_kg = patch_vol_liters * density_kg_l
    repair_cost_inr = asphalt_kg * rate_inr_per_kg

    return {
        "raw_cavity_liters": round(raw_vol_liters, 2),
        "patch_volume_liters": round(patch_vol_liters, 2),
        "asphalt_mass_kg": round(asphalt_kg, 1),
        "repair_cost_inr": round(repair_cost_inr, 0),
        "saw_cut_margin_pct": saw_cut_margin_pct,
        "compaction_factor": compaction_factor,
        "density_kg_l": density_kg_l,
        "rate_inr_per_kg": rate_inr_per_kg
    }
```

### 3.4 Integration into Frontend 3D Mesh Visualizer (`RoadMeshVisualizerModal.tsx`)
In `frontend/src/components/modals/RoadMeshVisualizerModal.tsx`:
- At lines 378–383:
```typescript
// IRC:82 Civil Engineering Physical Allowances
const SAW_CUT_MARGIN_PCT = 15.0; // Rectangular saw-cut perimeter box trim (+15%)
const COMPACTION_FACTOR = 1.10;  // Bulk asphalt compaction factor (+10%)
const IRC82_VOLUME_FACTOR = (1.0 + SAW_CUT_MARGIN_PCT / 100.0) * COMPACTION_FACTOR; // 1.265

// Dynamic Volumetric Cavity Fill & PWD SOR Cost Recalculation
const rawSlicedVolume = Number(
  (volumeLiters * Math.pow(Math.max(0, (depthCm - cutDepthCm) / Math.max(0.1, depthCm)), 1.5)).toFixed(2)
);
const slicedVolume = Number((rawSlicedVolume * IRC82_VOLUME_FACTOR).toFixed(2));
const slicedMassKg = Math.round(slicedVolume * 2.35); // 2.35 g/cm³ bulk density (MoRTH 500)
const slicedCost = Math.round(costInr * (slicedVolume / Math.max(0.1, volumeLiters * IRC82_VOLUME_FACTOR)));
```
- In the inspection HUD (lines 1062, 1689–1694):
  Display clear badge: `IRC:82 Rectangular Trim (+15%) & Compaction (+10%) Included` and surface the breakdown:
  - Raw Cavity: `${rawSlicedVolume.toFixed(1)} L`
  - IRC:82 Patch Mix: `${slicedVolume.toFixed(1)} L (${slicedMassKg} kg)`
  - PWD SOR Rate: `@ ₹68/kg (₹${slicedCost.toLocaleString('en-IN')})`

---

## 4. Dataset Attribution & Illustrative OD Claims (D-20-04, ATTRIB-01)

### 4.1 Vision Model Dataset Attributions (Roboflow Universe CC BY 4.0)
RoadSaathi's edge and central perception detectors use fine-tuned model weights based on public datasets licensed under **Creative Commons Attribution 4.0 International (CC BY 4.0)**.
To comply with municipal software transparency guidelines and open dataset licensing:
- **Model Attribution Registry (`backend/app/services/model_registry.py`)**:
  Add `dataset_attribution` to each entry in `self._model_configs`:
  1. `pothole_yolo` (`potholedetection.pt`):
     - `dataset_attribution`: `"Roboflow Universe - Pothole Detection Dataset (CC BY 4.0)"`
  2. `indian_roads_yolo` (`indian_roads_detection.pt`):
     - `dataset_attribution`: `"Roboflow Universe - Indian Road Hazards & Assets (CC BY 4.0)"`
  3. `zebra_crossing_detector` (`zebra.pt`):
     - `dataset_attribution`: `"Roboflow Universe - Pedestrian Zebra Crossing Dataset (CC BY 4.0)"`
  4. `vehicle_detection` (`vehicle_detection.pt`):
     - `dataset_attribution`: `"Roboflow Universe - Indian Traffic & Vehicle Detection (CC BY 4.0)"`
  5. `anpr_yolo` (`anpr.pt`):
     - `dataset_attribution`: `"Kaggle & Roboflow - Indian License Plate Character OCR (CC BY 4.0)"`
- Surface `dataset_attribution` in `get_status()` return payload.
- In frontend (`StreamModelConfigModal.tsx` and `EdgeAIAnalytics.tsx`):
  Display dataset attribution badge/pill (`CC BY 4.0 • Roboflow Universe`) on model inspection cards.

### 4.2 Explicit Illustrative OD Desire Lines Captioning (`WebGISMap.tsx`)
In `frontend/src/components/map/WebGISMap.tsx`:
- **Audit Issue**: Origin-Destination desire lines could be misconstrued as individual or civilian commuter surveillance.
- **Clarification**: OD desire lines represent aggregate transit corridor passenger-load proxies synthesized from fleet bus GPS routes and schedules.
- **UI Enhancements**:
  1. **Layer Control Selector (line 1779)**:
     Add tooltip and badge:
     `"Aggregate illustrative transit corridor traces derived from fleet GPS routes (no individual or civilian tracking data collected)"`.
  2. **Maplibregl Interactive Popup (lines 788–806)**:
     Include explicit header pill:
     `<div style="font-size: 9px; text-transform: uppercase; color: #0284c7; font-weight: bold; margin-bottom: 2px;">Illustrative Transit Corridor Trace • Fleet GPS Derived</div>`
  3. **Bottom Slide-up Tray (lines 1978–2004)**:
     Update header and subtitle:
     - Header: `O-D Transit Corridor Traces (Illustrative)`
     - Subtitle: `Aggregated transit passenger-load proxies synthesized from scheduled fleet bus GPS routes and stop frequencies across municipal wards. Strictly contains zero civilian tracking or personal data.`

---

## 5. Architectural & Behavioral Impact Analysis

| Dimension | Before (Phase 19 Baseline) | After (Phase 20 Rectification) |
|---|---|---|
| **DLP Citations** | Cited rural road manual `"MoHUA IRC:SP:20 Clause 14.2"` | Cites `"Contractual DLP Clause & Section 63/65B BSA 2023"` (PWD/MORTH GCC Clause 16/17) |
| **PFMS Voucher Tokens** | `PFMS/DLP-ESCROW/{YYYY}/{MMDD}-{HEX6}` | `PFMS/DLP-RETENTION/{YYYY}/{MMDD}-{HEX6}` |
| **Financial UI Labels** | "Net Available Escrow", "Clause 14 Escrow", "Escrow Holdback" | "Security Deposit (SD) / Retention Money", "Contractual DLP Retention" |
| **Internal DB Fields** | `escrow_deposit_inr`, `security_deposit_inr` | Preserved unchanged for zero-migration backward compatibility |
| **Patch Volume Model** | Raw $V = \text{area} \times \text{depth}$ without physical margins | IRC:82 calibrated: $V_{\text{patch}} = V_{\text{cavity}} \times 1.15 \times 1.10 = V_{\text{cavity}} \times 1.265$ |
| **Asphalt Density & Rate** | $2.30\text{ g/cm}^3$ generic | $2.35\text{ g/cm}^3$ (MoRTH 500 DBM) @ ₹68.0/kg PWD SOR 2025 |
| **Model Attributions** | No license or public dataset attribution | Explicit Roboflow Universe CC BY 4.0 attributions in registry and UI |
| **OD Desire Lines** | Ambiguous transit lines | Explicitly badged as aggregate illustrative fleet GPS corridor traces |

---

## Validation Architecture

### Automated Backend Test Command
```powershell
pytest -o pythonpath=backend backend/tests/test_contractor_ledger.py backend/tests/test_concurrence_gating.py backend/tests/test_urban_sensing.py backend/tests/test_copilot_engine.py -q
```

### Frontend Build Command
```powershell
npm --prefix frontend run build
```

### Targeted Test Suite Verification Matrix
1. **`test_pfms_txn_ref_format`**:
   - Asserts regex matches `^PFMS/(DLP-RETENTION|DLP-ESCROW)/\d{4}/\d{4}-[A-F0-9]{6}$`.
   - Asserts newly generated voucher begins with `PFMS/DLP-RETENTION/`.
2. **`test_statutory_clause_contractual_dlp`**:
   - Asserts `DBContractorPenalty.statutory_clause` defaults to `"Contractual DLP Clause & Section 63/65B BSA 2023"`.
   - Asserts Form 14 notice generation populates the rectified citation string.
3. **`test_3d_mesh_depth_and_volumetric_logic` (`test_all_features_logic.py`)**:
   - Asserts raw cavity volume is scaled by $+15\%$ saw-cut trim margin and $+10\%$ compaction factor ($1.265\times$).
   - Asserts asphalt mass matches $2.35\text{ kg/L}$ bulk density.
4. **`test_model_registry_dataset_attributions`**:
   - Asserts `/api/models/status` returns `dataset_attribution` containing `"Roboflow Universe (CC BY 4.0)"`.

## RESEARCH COMPLETE
