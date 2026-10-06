# Phase 3: Contractor Financial Accountability & SLA Ledger - Context

**Gathered:** 2026-10-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Delivers automated financial recovery, defect liability tracking, and work order concurrence validation under Indian Roads Congress standards (IRC:SP:20 Clause 14). This includes:
1. Automated statutory contractor penalty debit calculation under IRC:SP:20 Clause 14 based on defect recurrence within the mandatory 36-month defect liability period (DLP).
2. Dedicated contractor financial accountability backend service with REST endpoints (`/api/contractors/ledger`, `/api/contractors/penalties`, `/api/contractors/escrow`, `/api/contractors/debarments`) backed by `DBContractorPenalty`, `DBContractorDebarment`, and `DBRepairAudit`.
3. Multi-pass concurrence validation gate: requires minimum 3 independent bus passes across 48 hours with vertical IMU z-axis acceleration verification ($|g_z - 1.0| < 0.15g$) before authorizing contractor repair invoice clearance or security escrow release.
4. Municipal contractor SLA ledger and work order audit console UI integration, displaying real-time debit accruals, escrow balances, debarment alerts, and multi-pass concurrence audit trails.

Interactive RPI formula breakdown modal, video clip 30 FPS visualizer, and MapLibre OD desire lines (Phase 4) are strictly out of scope.
</domain>

<decisions>
## Implementation Decisions

### Statutory Penalty Debit Formula (IRC:SP:20 Clause 14)
- **D-01:** Tiered statutory recurrence debit formula:
  - 1st recurrence within 36-month DLP: ₹25,000 INR debit against security deposit.
  - 2nd recurrence within 36-month DLP: ₹50,000 INR debit against security deposit.
  - 3rd recurrence within 36-month DLP: ₹1,00,000 INR debit + automatic initiation of GeM debarment notice (`STATUTORY_DEBARMENT_NOTICE`). — **Reversibility:** costly — Financial statutory calculation policy.
- **D-02:** Defect recurrence detection window: A newly reported defect within a 15-meter buffer of a previously closed/resolved work order within 36 months (1,095 days) is flagged as `REPAIR_FAILED_RECURRENCE`. — **Reversibility:** costly — Spatial-temporal defect association rule.
- **D-03:** Immutable audit trail: All penalty debits generate corresponding records in `contractor_penalties` and `audit_logs` with PFMS transaction references and cryptographic SHA-256 evidence links. — **Reversibility:** one-way — Financial audit compliance requirement.

### Multi-Pass Concurrence Gating Protocol
- **D-04:** Strict 3-pass cross-bus concurrence: Repair invoice clearance and status transition to `REPAIR_VERIFIED` strictly requires at least 3 distinct fleet vehicles passing over the defect coordinates across a 48-hour monitoring window. — **Reversibility:** costly — Core verification gating logic.
- **D-05:** Dual optical & IMU sensor verification: Each of the 3 verifying passes must exhibit:
  - Optical verification: Absence of open cavity / crack bounding box (or optical status `SMOOTH_SURFACE`).
  - IMU telematics verification: Calibrated vertical acceleration $|g_z - 1.0| < 0.15g$ (indicating smooth riding surface without pavement shock). — **Reversibility:** costly — Verification threshold specification.
- **D-06:** Provisional to verified clearance lifecycle: When contractor marks work order as resolved in field portal, state transitions to `AWAITING_CONCURRENCE`. Only when 3 passes pass both optical and IMU thresholds does it transition to `REPAIR_VERIFIED` and release escrow holdbacks. If any pass detects shock ($|g_z - 1.0| \ge 0.35g$) or cavity, state shifts to `REPAIR_FAILED_RECURRENCE`. — **Reversibility:** reversible — State machine lifecycle.

### API & Database Architecture
- **D-07:** Dedicated contractor API endpoints:
  - `GET /api/contractors/ledger`: Summarizes contractor performance, active contracts, total security deposit, cumulative penalties, and debarment risk score.
  - `GET /api/contractors/penalties`: Lists individual IRC:SP:20 Clause 14 penalty dockets with cluster codes, corridors, and deduction status.
  - `POST /api/contractors/penalties/auto-debit`: Automated debit engine evaluating closed clusters against fresh telemetry.
  - `GET /api/contractors/{contractor_id}/escrow`: Escrow balance, holdback releases, and PFMS settlement status.
  - `POST /api/work-orders/{order_id}/verify-concurrence`: Evaluates available telemetry passes against verification gates. — **Reversibility:** costly — REST API schema and contract.
- **D-08:** Database models enhancement:
  - Utilize `DBContractorPenalty` and `DBContractorDebarment`.
  - Extend `DBDistressCluster` with `contractor_id`, `warranty_end_date`, `escrow_deposit_inr`, `concurrence_passes_count`, and `verification_status`.
  - Record each verifying pass in `DBRepairAudit`. — **Reversibility:** costly — Database schema migration.

### Frontend UI Integration
- **D-09:** `ContractorSlaLedger.tsx` real-time API binding: Connect ledger UI directly to `/api/contractors/ledger` and `/api/contractors/penalties` instead of static mock data. — **Reversibility:** reversible — Frontend data plumbing.
- **D-10:** `WorkOrderActionConsole.tsx` multi-pass gating display: Render live 3-pass concurrence progress indicator with bus IDs, timestamps, and accelerometer $g_z$ graphs before displaying "Authorize Payment" action. — **Reversibility:** reversible — Component UI rendering.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Standards & Specifications
- `.planning/PROJECT.md` — Core value, IRC:SP:20 Clause 14 reference, and contractor SLA parameters.
- `.planning/REQUIREMENTS.md` — Requirements `LEDGER-01`, `LEDGER-02`, and `LEDGER-03`.
- `.planning/ROADMAP.md` — Phase 3 success criteria and wave breakdown.

### Codebase Implementations
- `backend/app/models/db_models.py` — Existing `DBContractorPenalty`, `DBRepairAudit`, `DBContractorDebarment`, and `DBDistressCluster`.
- `backend/app/api/endpoints/work_orders.py` — Existing work order listing, status transitions, and contractor portal.
- `frontend/src/components/workorders/ContractorSlaLedger.tsx` — Municipal contractor SLA ledger and auto-debit table.
- `frontend/src/components/workorders/WorkOrderActionConsole.tsx` — CAD audit, dispatch, and repass verification console.
</canonical_refs>

<threat_model>
## Threat Model & Security Considerations

- **T-03-01: Fraudulent Contractor Self-Clearing**: Contractor attempts to mark work orders as resolved without field repairs.
  - *Mitigation*: Multi-pass concurrence strictly forbids contractor manual closure; only automated telemetry from 3 separate fleet buses over 48 hours can trigger `REPAIR_VERIFIED`.
- **T-03-02: Escrow Over-Deduction / Negative Balances**: Penalties exceed available contractor security deposit.
  - *Mitigation*: Ledger caps auto-debits at total escrow deposit; excess penalties trigger immediate GeM debarment warning and block new contract allocations.
- **T-03-03: Spoofed Telematics Passes**: Malicious or corrupted telematics pings attempt to simulate smooth asphalt.
  - *Mitigation*: Telemetry must originate from authenticated fleet nodes with valid AIS-140 IMEI and timestamp continuity, verifying cross-bus diversity (distinct `bus_id`s required).
</threat_model>
