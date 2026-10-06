# Phase 3: Contractor Financial Accountability & SLA Ledger — Plan 03-01 Execution Summary

**Plan:** `03-01: IRC:SP:20 Clause 14 Automated Contractor Penalty Calculation & Escrow Ledger Backend`  
**Wave:** 1  
**Requirements Satisfied:** `LEDGER-01`, `LEDGER-02`  
**Execution Date:** 2026-10-06  
**Status:** Completed & Fully Verified  

---

## 1. Overview & Objectives

Plan 03-01 establishes the autonomous financial recovery, defect liability tracking, and escrow ledger backend for municipal road maintenance contractors under Indian Roads Congress standards (**IRC:SP:20 Clause 14** and **MoRTH Section 3000**):
1. **Statutory Penalty Debit Engine (`backend/app/services/contractor_service.py`)**:
   - Implements deterministic tiered recurrence penalty calculation: ₹25,000 for 1st recurrence, ₹50,000 for 2nd recurrence, and ₹1,00,000 + Government e-Marketplace (GeM) statutory debarment notice for 3rd recurrence within the mandatory 36-month (1,095 days) Defect Liability Period (DLP).
   - Spatial-temporal correlation enforcing $\le 15.0\text{ meters}$ corridor proximity with dual execution (PostGIS `ST_DWithin` on PostgreSQL, geodesic Haversine bounding-box fallback on SQLite).
   - Escrow debit deductions from contractor security deposits (initial ₹50,00,000 INR standard) with strict non-negative clamping ($\text{Balance} = \max(0, \text{Deposit} - \text{Debit})$) preventing negative balances under Threat Model T-03-02.
   - Comptroller and Auditor General (CAG) compliant Public Financial Management System (PFMS) transaction voucher generation (`PFMS/DLP-ESCROW/{YYYY}/{MMDD}-{HEX6}`) and immutable SHA-256 evidence hashes.
2. **Contractor Financial Ledger & Escrow Management API (`backend/app/api/endpoints/contractors.py`)**:
   - `GET /api/contractors/ledger`: Summary of contractor performance, initial security deposits, cumulative penalties, remaining escrow, SLA on-time rates, quality scores, and debarment risks.
   - `GET /api/contractors/penalties`: Historical penalty dockets with PFMS voucher references, SHA-256 evidence hashes, and patrol vehicle IMU telemetry proofs.
   - `GET /api/contractors/{contractor_id}/escrow`: Granular escrow ledger, holdback releases, and PFMS voucher settlement audit log.
   - `POST /api/contractors/penalties/auto-debit`: Autonomous evaluation and penalty execution against defect telematics, broadcasting live WebSocket updates to civic command dashboards.
   - `GET /api/contractors/debarments`: Debarment register tracking agencies flagged under GeM statutory rules and GFR Rule 151.
3. **API Router Mounting & Seeding (`backend/app/api/router.py`, `backend/app/storage/database.py`)**:
   - Mounted `/contractors` under prefix `/api` and `/api/v1` with tag `[Tier 2 Central] Contractor SLA Ledger, IRC:SP:20 & Escrow Account`.
   - Seeded default municipal contractors (`CTR-01`: L&T Highways Infra Ltd, `CTR-02`: GMR Urban Highways Ltd, `CTR-03`: TNRDC).

---

## 2. Changes Implemented

### Task 1: Database Schema Additions & Contractor Service Core
- **`backend/app/models/db_models.py`**:
  - Added `DBContractor` model with fields `id`, `name`, `cin`, `director`, `assigned_corridor`, `zone`, `security_deposit_inr` (default ₹50L), `penalties_deducted_inr`, `active_work_orders`, `resolved_work_orders`, `breached_work_orders`, `on_time_sla_pct`, `quality_score_pct`, `compaction_density_gcm3`, `warranty_expiry`, `debarment_risk`, `created_at`, `updated_at`.
  - Extended `DBDistressCluster` with `contractor_id`, `warranty_end_date`, `escrow_deposit_inr`, `concurrence_passes_count`, `verification_status`.
  - Extended `DBContractorPenalty` with `contractor_id`, `pfms_txn_ref`, `evidence_sha256`, `patrol_bus_id`, `measured_gz`, `threshold_gz`.
- **`backend/app/storage/database.py`**:
  - Added SQLite schema migrations for new columns across `distress_clusters` and `contractor_penalties`.
  - Added automated default seeding for `DBContractor` rows.
- **`backend/app/services/contractor_service.py`**:
  - `calculate_clause14_penalty(re_pothole_count: int) -> PenaltyResult`: Returns `(amount, debarment_triggered)` tuple supporting numeric comparisons and unpacking.
  - `evaluate_recurrence_window(resolved_at_str, detected_at_str) -> bool` (and alias `check_within_36_month_dlp`): Enforces $\Delta t \le 1,095\text{ days}$.
  - `find_recurrent_distress_cluster(lat, lng, detection_time_iso, db, buffer_meters)`: Correlates defect to closed cluster within 15m.
  - `generate_pfms_voucher_ref(dt)`: Returns `PFMS/DLP-ESCROW/{YYYY}/{MMDD}-{HEX6}`.
  - `compute_evidence_hash(cin, cluster_code, amount, timestamp)`: Returns SHA-256 hash.
  - `execute_contractor_auto_debit(db, cluster, measured_gz, bus_id, notes)`: Executes escrow debit, caps at 0, logs `DBAuditLog` and `DBRepairAudit`, registers `DBContractorDebarment` for $N \ge 3$, and updates cluster state.

### Task 2: Contractor Financial Ledger REST Endpoints & Router Mounting
- **`backend/app/api/endpoints/contractors.py`**:
  - Implemented Pydantic models: `ContractorLedgerItem`, `PenaltyDocketItem`, `EscrowSheetResponse`, `AutoDebitRequest`, `AutoDebitResponse`.
  - Implemented endpoints: `GET /ledger`, `GET /penalties`, `GET /{contractor_id}/escrow`, `POST /penalties/auto-debit`, `GET /debarments`.
  - Broadcasts WebSocket event `CONTRACTOR_LEDGER_UPDATE` upon auto-debit completion.
- **`backend/app/api/router.py`**:
  - Mounted `contractors.router` under prefix `"/contractors"`.

---

## 3. Verification & Test Results

### 1. Contractor Ledger Test Suite (`backend/tests/test_contractor_ledger.py`)
- **Command:** `python -m pytest -o pythonpath=backend backend/tests/test_contractor_ledger.py -v`
- **Result:** **10 PASSED in 5.30s**
  - `test_tiered_penalty_formula`: Verified ₹25k (1st), ₹50k (2nd), ₹100k + GeM debarment trigger (3rd+).
  - `test_36_month_dlp_window_boundary`: Verified 1,094 days inside DLP, 1,095 days inside DLP, 1,096 days expired.
  - `test_15m_corridor_spatial_buffer`: Verified 8.5m defect matches recurrence; 22m defect does not match.
  - `test_escrow_deduction_and_cap`: Verified non-negative balance clamping at ₹0 and Critical Debarment Warning trigger when balance $< 20\%$.
  - `test_pfms_txn_ref_format`: Validated regex `^PFMS/DLP-ESCROW/\d{4}/\d{4}-[A-F0-9]{6}$` and 64-char hex SHA-256 evidence hash.
  - `test_get_contractor_ledger`: Verified HTTP 200, balance sheets, and debarment risk scores.
  - `test_get_contractor_penalties`: Verified HTTP 200, penalty dockets, and contractor query filters.
  - `test_get_contractor_escrow`: Verified HTTP 200, matching escrow balance, holdback releases, and 404 handling.
  - `test_post_auto_debit_endpoint`: Verified HTTP 200, deduction execution, and PFMS voucher issuance.
  - `test_debarments_endpoint`: Verified HTTP 200 and debarred agencies schema.

### 2. Regression Test Suite (`test_dual_engine.py`, `test_spatial.py`)
- **Command:** `python -m pytest -o pythonpath=backend backend/tests/test_dual_engine.py backend/tests/test_spatial.py -q`
- **Result:** **8 PASSED in 5.12s**
- **Combined Suite:** `18 PASSED in 5.63s`

---

## 4. Requirement Traceability Matrix

| Requirement | Description | Status | Evidence |
|---|---|---|---|
| `LEDGER-01` | Automated contractor penalty calculation under IRC:SP:20 Clause 14 based on defect recurrence within 36-month DLP. | SATISFIED | `calculate_clause14_penalty`, `evaluate_recurrence_window`, `test_tiered_penalty_formula`, `test_36_month_dlp_window_boundary` |
| `LEDGER-02` | Contractor financial accountability backend with `/api/contractors/ledger`, `/api/contractors/penalties`, `/api/contractors/{id}/escrow`, `/api/contractors/penalties/auto-debit`, `/api/contractors/debarments`. | SATISFIED | `backend/app/api/endpoints/contractors.py`, `backend/app/api/router.py`, `test_get_contractor_ledger`, `test_post_auto_debit_endpoint` |
