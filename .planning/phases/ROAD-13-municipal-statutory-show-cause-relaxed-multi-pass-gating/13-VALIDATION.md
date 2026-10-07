# Phase 13 Validation: Municipal Statutory Show-Cause & Relaxed Multi-Pass Gating

**Phase:** `ROAD-13-municipal-statutory-show-cause-relaxed-multi-pass-gating`  
**Milestone:** `v4.0`  
**Requirements Covered:** `STATUTE-01`, `STATUTE-02`  
**Date:** 2026-10-07  
**Status:** Validated Technical Architecture  

---

## 1. Validation Strategy Overview

Phase 13 establishes statutory certainty and field viability for contractor penalties and work order clearance in RoadSaathi.

Validation must strictly guarantee:
1. **Section 63 / 65B BSA 2023 Evidentiary Pack Integrity (STATUTE-01)**:
   - Automated generation of Form 14 notice pack with SHA-256 evidence hash linking contractor CIN, cluster code, penalty amount, timestamp, and telemetry parameters.
   - Section 63/65B BSA electronic record certificate formatting with device provenance (bus ID, camera, NPU, IMU).
   - Executive Engineer (EE) digital signature verification and state machine transitions (`UNDER_NOTICE_CURE_PERIOD` $\to$ `NOTICE_SERVED` $\to$ `LIQUIDATED_DAMAGES_ENFORCED` or `CURED_BY_CONTRACTOR`).
   - Dynamic Defect Liability Period (DLP) tiers (12 months for routine overlay, 36 months for arterial DBM+BC, 60 months for rigid PQC) evaluated accurately in `evaluate_recurrence_window`.
2. **Trip-Windowed Multi-Pass Concurrence & Optical Clearance Dominance (STATUTE-02)**:
   - 3 passes within 48h from distinct vehicles OR from the same vehicle on distinct trips separated by $\ge 2\text{ hours}$ (7,200 seconds) satisfy physical concurrence.
   - Consecutive passes from the same vehicle separated by $< 2\text{ hours}$ are deduplicated to 1 qualifying pass.
   - Optical clearance dominance: windshield camera recording `SMOOTH_SURFACE` (or cavity confidence $< 0.10$ and no cavity) qualifies a pass as verified without requiring physical wheel collision.
   - Severe speed-normalized shock ($G_{norm} \ge 0.35$) immediately overrides optical smoothness and trips `REPAIR_FAILED_RECURRENCE`.
3. **UI Terminology Modernization & Design Tokens (STATUTE-02)**:
   - Complete elimination of "Auto-Debit" terminology across `ContractorSlaLedger.tsx`, `WorkOrders.tsx`, and `WorkOrderActionConsole.tsx`.
   - Introduction of Form 14 Show-Cause Notice modal with 7-day cure window countdown clock and Section 65B BSA certificate footer.
   - Status badge styling: `Under Notice (7d Cure)` (amber), `Notice Served` (blue), `Liquidated Damages` (rose), `Clearance Authorized` (emerald).
4. **Zero Regression on Existing Test Suite**:
   - All 51 backend tests continue to pass without error.
   - Frontend compiles with 0 TypeScript compiler diagnostics.

---

## 2. Automated Validation Commands

### 2.1 Backend Automated Regression Suite
```powershell
pytest -o pythonpath=backend backend/tests/test_contractor_ledger.py backend/tests/test_concurrence_gating.py backend/tests/test_telematics_physics.py backend/tests/test_explainable_webgis.py backend/tests/test_dual_engine.py backend/tests/test_spatial.py -q
```
- **Target Result:** 51+ passed, 0 failed, 0 errors.
- **Coverage Map:**
  - `test_contractor_ledger.py`: IRC:SP:20 Clause 14 tiered penalty formula, dynamic DLP tiers (12, 36, 60 months), Form 14 notice pack generation, SHA-256 evidence hash, PFMS voucher references, escrow deduction clamping, and debarment dockets.
  - `test_concurrence_gating.py`: Trip-windowed multi-pass concurrence (same bus $\ge 2\text{h}$ separation), optical clearance dominance, speed-normalized $G_{norm}$ failure override ($G_{norm} \ge 0.35$), anti-fraud payment clearance lock.
  - `test_telematics_physics.py`: Velocity-normalized vertical acceleration ($G_{norm}$), axle lag compensation ($\Delta t$), dual-confidence routing.
  - `test_explainable_webgis.py`: RPI formula recalculation, WebGIS visualization layers.
  - `test_dual_engine.py`: SQLite WAL / PostgreSQL dual database engine queries.
  - `test_spatial.py`: Spatial DBSCAN clustering and heading-aware corridor snapping.

### 2.2 Frontend Build Compilation
```powershell
npm --prefix frontend run build
```
- **Target Result:** Exit code 0, 0 TypeScript errors, successful bundle emission in `frontend/dist/`.

---

## 3. Requirement Traceability Matrix

| Requirement ID | Component / File | Verification Method | Acceptance Criteria |
|---|---|---|---|
| **STATUTE-01** (Section 65B BSA 2023 Statutory Show-Cause Notice Pack) | `backend/app/services/contractor_service.py`<br/>`backend/app/api/endpoints/contractors.py`<br/>`backend/app/models/db_models.py` | Unit Tests & API Integration | 1. Defect recurrence during DLP generates Form 14 notice pack with SHA-256 hash, telemetry provenance, and 7-day cure countdown.<br/>2. Status sets to `UNDER_NOTICE_CURE_PERIOD` (disputed holdback, no unilateral deduction).<br/>3. Executive Engineer sign-off endpoint updates `ee_signoff_by`, `ee_signoff_at`, and transitions status to `NOTICE_SERVED`.<br/>4. Liquidation enforcement after 7 days sets `LIQUIDATED_DAMAGES_ENFORCED` and records PFMS voucher.<br/>5. Recurrence count $\ge 3$ registers statutory GeM portal debarment notice. |
| **STATUTE-01** (Dynamic DLP Contract Package Tiers) | `backend/app/services/contractor_service.py`<br/>`backend/app/models/db_models.py` | Unit Tests & Boundary Arithmetic | 1. `evaluate_recurrence_window(resolved_at, detected_at, dlp_months)` accurately validates 12-month (365d), 36-month (1095d), and 60-month (1825d) boundaries.<br/>2. Day 364 is within 12-month DLP; Day 366 is outside.<br/>3. Day 1,094 is within 36-month DLP; Day 1,096 is outside.<br/>4. Day 1,824 is within 60-month DLP; Day 1,826 is outside. |
| **STATUTE-02** (Trip-Windowed Multi-Pass Concurrence) | `backend/app/services/concurrence_service.py`<br/>`backend/app/api/endpoints/work_orders.py` | Unit Tests & Concurrence Simulation | 1. 3 passes from distinct buses within 48h qualify.<br/>2. 3 passes from the same bus separated by $\ge 2\text{ hours}$ (7,200s) qualify, eliminating corridor starvation.<br/>3. 3 passes from the same bus separated by $< 2\text{ hours}$ (e.g. 30m) yield distinct count = 1 and remain `AWAITING_CONCURRENCE`. |
| **STATUTE-02** (Optical Clearance Dominance) | `backend/app/services/concurrence_service.py` | Unit Tests & Sensor Gating | 1. Pass with `optical_status == "SMOOTH_SURFACE"` and nominal IMU is credited as verified even if wheel didn't hit patch.<br/>2. Pass recording severe normalized shock ($G_{norm} \ge 0.35$) immediately overrides optical status and sets `REPAIR_FAILED_RECURRENCE`. |
| **STATUTE-02** (UI Terminology Modernization & Modern Design) | `frontend/src/components/workorders/ContractorSlaLedger.tsx`<br/>`frontend/src/components/workorders/WorkOrderActionConsole.tsx`<br/>`frontend/src/pages/WorkOrders.tsx` | Visual Inspection & Build Verification | 1. All "Auto-Debit" strings replaced with "Statutory Show-Cause Notice" / "Form 14 Notice".<br/>2. Form 14 preview modal renders before/after keyframes, 7-day cure countdown, Section 65B BSA certificate footer, and EE digital signature button.<br/>3. Work Order Action Console Tab 3 displays trip-windowed fleet pass status. |

---

## 4. Test Suite Execution Plan

### 4.1 Unit Test Design: `backend/tests/test_contractor_ledger.py`

#### Group 1: Statutory Form 14 Notice & Section 65B BSA Certificate
- `test_form14_notice_pack_generation`:
  - Assert notice docket format `FORM-14/DLP/{YYYY}/{CLUSTER_CODE}`.
  - Assert 64-character SHA-256 evidence hash.
  - Assert Section 63/65B BSA certificate ID `CERT-BSA63-...` and custodian statement.
  - Assert initial status is `UNDER_NOTICE_CURE_PERIOD` with `cure_deadline = issued_at + 7 days`.
- `test_ee_digital_signature_transition`:
  - Execute EE sign-off with officer name and badge number.
  - Assert status updates to `NOTICE_SERVED`.
- `test_cure_period_enforcement_transition`:
  - After cure period expiry, trigger enforcement.
  - Assert status updates to `LIQUIDATED_DAMAGES_ENFORCED`, bank escrow is debited, and PFMS transaction reference is recorded.
- `test_contractor_cure_dismissal`:
  - When contractor rectifies defect within 7 days and passes concurrence, penalty transitions to `CURED_BY_CONTRACTOR` without escrow deduction.

#### Group 2: Tiered Defect Liability Periods (DLP)
- `test_dlp_tier_12_months_boundary`:
  - 12 months (365 days): Day 364 returns `True`, Day 366 returns `False`.
- `test_dlp_tier_36_months_boundary`:
  - 36 months (1,095 days): Day 1,094 returns `True`, Day 1,096 returns `False`.
- `test_dlp_tier_60_months_boundary`:
  - 60 months (1,825 days): Day 1,824 returns `True`, Day 1,826 returns `False`.

### 4.2 Unit Test Design: `backend/tests/test_concurrence_gating.py`

#### Group 1: Trip-Windowed Multi-Pass Concurrence
- `test_same_bus_trip_window_qualified`:
  - 3 passes from `BUS-01` at 08:00, 10:15 ($\Delta t = 2.25\text{h}$), and 13:00 ($\Delta t = 2.75\text{h}$) with smooth surface.
  - Assert `distinct_buses_count == 3` (3 valid trip passes), status is `REPAIR_VERIFIED`, and payment clearance authorized.
- `test_same_bus_sub_window_deduplicated`:
  - 3 passes from `BUS-01` at 08:00, 08:30 ($\Delta t = 30\text{m}$), and 09:15 ($\Delta t = 45\text{m}$).
  - Assert `distinct_buses_count == 1`, status is `AWAITING_CONCURRENCE`, and payment clearance withheld.
- `test_hybrid_fleet_trip_window`:
  - `BUS-01` at 08:00, `BUS-02` at 09:00, `BUS-01` at 10:30 ($\Delta t = 2.5\text{h}$ from prior `BUS-01` pass).
  - Assert `distinct_buses_count == 3`, status is `REPAIR_VERIFIED`.

#### Group 2: Optical Clearance Dominance & Shock Override
- `test_optical_clearance_dominance`:
  - Pass with `optical_status == "SMOOTH_SURFACE"` and nominal IMU ($G_z = 1.02$).
  - Assert pass is qualified without requiring physical axle shock.
- `test_severe_shock_overrides_optical`:
  - Pass with `optical_status == "SMOOTH_SURFACE"`, but speed-normalized shock $G_{norm} = 0.42 \ge 0.35$.
  - Assert immediate `REPAIR_FAILED_RECURRENCE` and show-cause notice generation.

---

## 5. Manual Verification & Inspection Walkthrough

1. **Contractor SLA Ledger UI (`#/work-orders?tab=sla`)**:
   - Verify banner shows statutory show-cause notice reference.
   - Click "Issue Form 14 Show-Cause Notice":
     - Verify Form 14 Show-Cause Notice Pack modal displays.
     - Inspect SHA-256 evidence digest and Section 65B BSA certificate block.
     - Inspect 7-day cure window countdown clock.
     - Click "Digitally Sign & Issue Form 14 Notice (Executive Engineer)" and observe state update.
2. **CAD Backlog & Action Console (`#/work-orders?tab=cad`)**:
   - Open work order action console on a recurrent defect ticket.
   - Inspect Tab 3 (Multi-Pass Concurrence):
     - Verify trip-windowed pass list with relative timestamps.
     - Verify optical clearance badge.
     - Verify that payment authorization button unlocks when 3 passes are satisfied.
3. **Responsive Design & Accessibility**:
   - Verify all modal layouts, buttons, and status badges meet WCAG AAA contrast and behave responsively across viewports.
