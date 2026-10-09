# Phase 20 Context: Statutory & Financial Standards Rectification

## Context Summary
- **Repo State Baseline:** Commit `7aafd78` (Phase 19 completed & verified).
- **Audit Findings to Address:**
  1. *Finding 2 / Item 4: Statutory citations.*
     - Code cites "IRC:SP:20 Clause 14" (Rural Road Manual) as the statutory basis for contractor penalties and DLP enforcement on urban arterials.
     - In municipal highway contracts, defect liability is governed by **Contractual Defect Liability Period (DLP) Clauses** (standard MORTH / CPWD GCC Clause 14/17, or Tamil Nadu Highways / GCC Standard Contract Agreement Clause 16 "Defect Liability").
     - Admissibility in court derives from **Section 65B of the Indian Evidence Act / Section 63 & 65B of the Bharatiya Sakshya Adhiniyam (BSA) 2023**.
     - Replace all occurrences of "MoHUA IRC:SP:20 Clause 14.2" with "Contractual DLP Clause & Section 63/65B BSA 2023".
  2. *Finding 2 / Item 9: Financial terminology (PFMS & Escrow).*
     - Code generates `PFMS/DLP-ESCROW/{YYYY}/{MMDD}-{HEX6}` and refers to "escrow holdback released" / "escrow deposit".
     - In Indian municipal contracting, funds are held as **Security Deposit (SD)** or **Retention Money**, deducted from running bills and retained until the DLP expires.
     - Update voucher prefix to `PFMS/DLP-RETENTION` (or `PFMS/SD-DLP`) and update UI labels from "Escrow" to "Security Deposit (SD) / Retention Money" (preserving internal columns like `escrow_deposit_inr` for backward compatibility).
  3. *Finding 3 / Item 11: Civil engineering repair cost estimations.*
     - Raw cavity volume ($V = \text{area} \times \text{depth}$) lacks physical road engineering margins.
     - Under IRC:82 "Guidelines for Maintenance of Bituminous Surfaces of Highways", patch repairs require:
       - **Rectangular saw-cut box trim margin (+15%)**: irregular defect perimeters must be squared off with vertical saw cuts before tack coat application.
       - **Compaction allowance (+10%)**: loose asphalt mix compacts ~10% upon heavy rolling to achieve 2.35 g/cm³ bulk density.
     - Incorporate `saw_cut_margin_pct = 15.0` and `compaction_factor = 1.10` into volume and PWD SOR 2025 repair cost formulas across backend and frontend 3D mesh visualizer.
  4. *Finding 4 / Item 7: Dataset attribution & Origin-Destination claims.*
     - Add dataset attribution for Roboflow Universe CC BY 4.0 datasets used for training models (`potholedetection.pt`, `zebra.pt`, `anpr.pt`, etc.).
     - Mark Origin-Destination desire lines as illustrative aggregate transit corridor traces derived from fleet GPS routes, rather than civilian tracking.

## Locked Decisions
- **D-20-01 (Contractual DLP Statutory Citations)**: Replace "IRC:SP:20 Clause 14" across all models, services, notice generators, and frontend ledgers with "Contractual DLP Clause & Section 63/65B BSA 2023" (citing standard PWD/MORTH General Conditions of Contract DLP Clause 16/17).
- **D-20-02 (Security Deposit / Retention Money Terminology)**: Replace `PFMS/DLP-ESCROW` voucher tokens with `PFMS/DLP-RETENTION` and update UI labels from "Escrow Balance / Holdback" to "Security Deposit (SD) / Retention Money" (aliasing legacy fields for backwards compatibility).
- **D-20-03 (IRC:82 Civil Engineering Patch Calculations)**: Calibrate asphalt volume and PWD SOR repair cost formulas to add +15% rectangular saw-cut box trim margin (`SAW_CUT_MARGIN_PCT = 15.0`) and +10% bulk asphalt compaction factor (`COMPACTION_FACTOR = 1.10`) per IRC:82 guidelines, updating `contractor_service.py`, `clustering_service.py`, and `RoadMeshVisualizerModal.tsx`.
- **D-20-04 (Public Dataset Attribution & Illustrative OD Desire Lines)**: Add CC BY 4.0 Roboflow dataset attributions for trained models in the system info/footer/docs, and explicitly label Origin-Destination desire lines as illustrative aggregate transit corridor traces.
