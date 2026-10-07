# Phase 13 Context: Municipal Statutory Show-Cause & Relaxed Multi-Pass Gating

## Phase Domain & Goals
Transition contractor penalty and repair clearance mechanisms from legally fragile automated actions into an incontestable, legally compliant municipal statutory workflow. Replaces unilateral "Auto-Debit" with a Two-Stage Section 65B Bharatiya Sakshya Adhiniyam (BSA 2023) / IRC:SP:20 Clause 14 Statutory Show-Cause Notice workflow with Executive Engineer (EE) digital sign-off and 7-day cure window. Relaxes the 3-bus multi-pass concurrence rule to 3 distinct patrol passes (same bus allowed on trips separated by $\ge 2$ hours) and allows optical clearance without requiring wheel impact collision. Updates UI terminology and workflows across `WorkOrders.tsx`, `ContractorSlaLedger.tsx`, and `WorkOrderActionConsole.tsx`.

---

## Locked Decisions

### D-13-01: Two-Stage Statutory Form 14 Show-Cause Notice & Escrow Dispute Workflow
- **Legal Compliance**:
  - Aligns with the Indian Contract Act 1872, Arbitration & Conciliation Act 1996, and Bharatiya Sakshya Adhiniyam 2023 (Section 63/65B certificate of electronic records).
  - Unilateral automated bank guarantee deduction is eliminated.
- **Workflow Steps**:
  1. **Stage 1 (System Draft)**: On detected defect recurrence during DLP, system automatically generates a **Statutory Form 14 Show-Cause Notice Pack** containing:
     - Cryptographic SHA-256 evidence hash of original repair + recurrence telemetry.
     - Forensic telemetry keyframe comparison (Before / Repaired / Recurrent Cavity).
     - Statutory penalty calculation (₹25k for 1st, ₹50k for 2nd, ₹100k + GeM debarment alert for 3rd+).
     - 7-day statutory cure window countdown.
     - State of escrow penalty set to: `UNDER_NOTICE_CURE_PERIOD` (disputed holdback, not liquidated).
  2. **Stage 2 (Executive Engineer Sign-off)**:
     - Municipal Executive Engineer (EE) reviews the evidentiary pack in `WorkOrderActionConsole.tsx` or `ContractorSlaLedger.tsx`.
     - Clicks **"Digitally Sign & Issue Form 14 Notice"**.
     - Generates printable/downloadable official notice pack with Section 65B BSA Certificate.
     - If contractor fails to rectify within 7 days, status transitions to `LIQUIDATED_DAMAGES_ENFORCED`.

### D-13-02: Contract Package Defect Liability Period (DLP) Tiers
- **Tiered DLP Windows**:
  - **Bituminous Overlay (Routine)**: 12 months (365 days).
  - **DBM + BC (Flexible Arterial)**: 36 months (1,095 days, default standard).
  - **Concrete / PQC / White-topping**: 60 months (1,825 days).
- **Backend Model & Evaluation**:
  - `evaluate_recurrence_window(resolved_at, detected_at, dlp_months=36)` supports dynamic `dlp_months`.
  - Contractor records store contract road type / package specifications.
- **Frontend Affordance**:
  - DLP tier badge and filter in `ContractorSlaLedger.tsx` and CAD Backlog drawer.

### D-13-03: Trip-Windowed Multi-Pass Concurrence & Optical Dominance
- **Pass Separation Rule**:
  - Requires 3 valid patrol passes within 48 hours.
  - A pass is valid if from a distinct vehicle ID **OR** from the same vehicle on a distinct route trip separated by at least **2 hours** ($\Delta t \ge 7200\text{ seconds}$).
  - Completely eliminates route starvation on single-bus corridors (e.g., MTC Route 570 or 19B).
- **Optical Clearance Dominance**:
  - If windshield camera records a smooth patch / absence of cavity (`optical_status == "SMOOTH_SURFACE"` or confidence $< 0.10$), the pass is credited as verified.
  - Does **not** require vehicle wheels to physically collide with the repair location (recognizing driver defensive steering / lane positioning).
  - If a pass records severe normalized shock ($G_{norm} \ge 0.35$), it immediately flags `REPAIR_FAILED_RECURRENCE`.

### D-13-04: UI Terminology & Action Strip Modernization
- **Replace "Auto-Debit" with "Statutory Show-Cause Notice"**:
  - In `ContractorSlaLedger.tsx`: Replace "Simulate Clause 14 Auto-Debit" button with **"Issue Form 14 Show-Cause Notice"**.
  - Update status pills: `Under Notice (7d Cure)` (amber), `Notice Served` (blue), `Liquidated Damages` (rose), `Clearance Authorized` (emerald).
- **Action Console Integration**:
  - `WorkOrderActionConsole.tsx` displays the complete Form 14 Notice preview modal with Section 65B cryptographic provenance footer, before/after images, and EE digital signature button.

---

## Technical Constraints & Boundaries
- Preserve 100% test integrity across all 51 backend tests.
- 0 TypeScript compiler diagnostics on `npm --prefix frontend run build`.
- Maintain clean, minimal code under the Ponytail principle (no unnecessary third-party legal document generators; use native SVG/HTML/CSS for printable vouchers).

---

## Deferred Ideas
- Integration with National e-Governance Services Limited (NeSL) digital escrow API.
- Aadhaar-based OTP e-Sign API gateway for EE signatures.
