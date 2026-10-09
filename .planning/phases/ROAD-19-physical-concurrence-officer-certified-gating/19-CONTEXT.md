# Phase 19 Context: Physical Concurrence & Officer-Certified Gating

## Context Summary
- **Repo State Baseline:** Commit 9e7b583 (283 files) + Milestone v6.0 Phase 18.
- **Audit Finding 1.2: The repair-verification gate can fail a correct repair and debit the contractor:**
  1. *Missing Time Filter:* `concurrence_service.evaluate_work_order_concurrence` queried `raw_ingests` without checking `captured_at >= cluster.repair_completed_at` (or `cluster.updated_at`). Pre-repair defect telemetry (high vertical shock, open cavity) was collected, immediately causing `REPAIR_FAILED_RECURRENCE` and triggering automatic debit penalties.
  2. *Missing Data Defaults to Clean Passes:* If a pass lacked `vertical_gz`, it defaulted to `1.0g`. If it lacked `optical_status`, it defaulted to `SMOOTH_SURFACE`. Telematics missing either sensor must fail-closed as `NO_DATA` rather than being counted as clean verified passes.
  3. *Single Raw Shock Triggers Immediate Failure:* A single unverified transient reading (e.g. expansion joint or bump) without speed normalization failed the entire repair. Shocks must evaluate speed-normalized jerk $G_{norm} = \frac{|G_z - 1.0|}{v / 30}$ for vehicle speeds $v \ge 15\text{ km/h}$.
  4. *Overly Wide Spatial Radius:* 15m radius (30m circle) around a 1m repair patch captured shocks from neighboring speed breakers or utility manholes. Needs corridor lane-aligned 3–5m narrowing with heading constraint ($\pm 30^\circ$).
  5. *Fabricated Fallback Penalties:* When no failing pass was found, `failing_gz = 1.48` and `failing_bus = "BUS-04"` were hardcoded and hashed into evidence records. Must completely eliminate fabricated fallback penalties.
- **Audit Finding 2 & 8: Municipal Governance Realignment:**
  1. *Auto-Debits & Unilateral Clearance:* Unilateral automated escrow debits and automatic payment releases violate municipal statutory process. Concurrence must yield structured recommendations: `recommend_release` and `proposed_deduction` requiring Assistant Engineer (AE) / Executive Engineer (EE) digital sign-off (`approval_status`).
  2. *Operational Defect Triage:* Extend `DBDistressCluster` with `acknowledged_at`, `assigned_officer_id`, and structured rejection choices (`FALSE_POSITIVE`, `DUPLICATE_CLUSTER`, `JURISDICTION_NON_PWD`, `UNDER_ACTIVE_REPAIR`) to ensure triage integrity.

## Locked Decisions
- **D-19-01 (Time-Windowed Post-Repair Verification)**: `evaluate_work_order_concurrence` filters telemetry strictly where `captured_at >= repair_completed_at` (or `updated_at` / work order repair timestamp) and `captured_at <= repair_completed_at + 48h`. Pre-repair passes are completely ignored.
- **D-19-02 (Lane-Aligned Corridor Tolerance & Speed-Normalized Jerk)**: Reduce `CORRIDOR_MATCH_METERS` from 15.0m to 5.0m. Evaluate speed-normalized shock jerk $G_{norm} = \frac{|G_z - 1.0|}{v / 30}$. Vehicle passes with $v < 15\text{ km/h}$ or missing sensor values are flagged `NO_DATA` (fail-closed, not counted towards clean pass quorum).
- **D-19-03 (Zero Fallback Penalty Fabrication)**: Remove all hardcoded fallbacks (`1.48g`, `"BUS-04"`). If concurrence fails, the penalty record must cite empirical telemetry from the actual tripping pass; if none exists, no penalty is proposed.
- **D-19-04 (Officer-Certified Sign-Off Workflows)**: Replace automated payment clearances and direct debits with `proposed_deduction` and `recommend_release`. Update `ConcurrenceEvaluationResult`, `DBRepairAudit`, and `WorkOrderActionConsole.tsx` so payment clearance and contractor deductions require AE/EE certification.
- **D-19-05 (Structured Defect Triage)**: Add `acknowledged_at`, `assigned_officer_id`, and structured rejection reasons (`FALSE_POSITIVE`, `DUPLICATE_CLUSTER`, `JURISDICTION_NON_PWD`, `UNDER_ACTIVE_REPAIR`) in `DBDistressCluster` and API endpoints.
