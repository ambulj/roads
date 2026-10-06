# Phase 3: Contractor Financial Accountability & SLA Ledger — Validation Architecture

**Created:** 2026-10-06  
**Status:** Approved  
**Coverage Target:** 100% of LEDGER-01, LEDGER-02, LEDGER-03

---

## 1. Automated Test Commands

Execute the Phase 3 test suite using pytest with backend module path resolution:

```bash
# Plan 03-01: Contractor penalty & escrow ledger
python -m pytest -o pythonpath=backend backend/tests/test_contractor_ledger.py -v

# Plan 03-02: Multi-pass concurrence gating
python -m pytest -o pythonpath=backend backend/tests/test_concurrence_gating.py -v

# Full Phase 1 - 3 regression suite
python -m pytest -o pythonpath=backend edge/tests/ backend/tests/ -q
```

---

## 2. Requirement Verification Map

| Requirement | Description | Test File | Target Function |
|:---|:---|:---|:---|
| **LEDGER-01** | IRC:SP:20 Clause 14 automated contractor debit calculation with 36-month DLP | `backend/tests/test_contractor_ledger.py` | `test_tiered_penalty_formula`<br/>`test_36_month_dlp_window_boundary`<br/>`test_15m_corridor_spatial_buffer` |
| **LEDGER-02** | Contractor SLA ledger displaying debit accrual, escrow holdbacks, and turnaround | `backend/tests/test_contractor_ledger.py` | `test_contractor_ledger_summary_aggregation`<br/>`test_escrow_deduction_and_cap`<br/>`test_pfms_txn_ref_format` |
| **LEDGER-03** | Work order multi-pass concurrence validation (3 independent buses over 48h + IMU) | `backend/tests/test_concurrence_gating.py` | `test_distinct_bus_diversity_rule`<br/>`test_three_pass_concurrence_pass`<br/>`test_vertical_gz_tolerance_band`<br/>`test_recurrent_shock_triggers_fail` |

---

## 3. Wave 0 Stubs & Test Specifications

### 3.1 Plan 03-01: `backend/tests/test_contractor_ledger.py`
- `test_tiered_penalty_formula`: Verifies ₹25,000 for 1st recurrence, ₹50,000 for 2nd, and ₹1,00,000 + GeM debarment notice for 3rd.
- `test_36_month_dlp_window_boundary`: Verifies recurrence within 1,094 days incurs penalty; at 1,096 days warranty has expired (0 penalty).
- `test_15m_corridor_spatial_buffer`: Verifies spatial matching within 15 meters on both PostGIS and SQLite fallback; >15m is treated as independent defect.
- `test_escrow_deduction_and_cap`: Verifies penalty debits are deducted from security deposit down to 0, preventing negative balances.
- `test_contractor_ledger_endpoints`: Verifies `GET /api/contractors/ledger`, `GET /api/contractors/penalties`, and `POST /api/contractors/penalties/auto-debit`.

### 3.2 Plan 03-02: `backend/tests/test_concurrence_gating.py`
- `test_distinct_bus_diversity_rule`: Verifies 3 passes from the same bus ID fails the diversity requirement (requires 3 distinct buses).
- `test_three_pass_concurrence_pass`: Verifies 3 distinct buses with optical clear and $|g_z - 1.0| < 0.15g$ transitions work order to `REPAIR_VERIFIED`.
- `test_vertical_gz_tolerance_band`: Verifies $g_z = 1.12g$ passes, while $g_z = 1.25g$ fails the smoothness test.
- `test_recurrent_shock_triggers_fail`: Verifies severe vibration ($g_z \ge 1.35g$) triggers `REPAIR_FAILED_RECURRENCE`.
- `test_verify_concurrence_endpoint`: Verifies `POST /api/work-orders/{order_id}/verify-concurrence` returns correct schema and gates payment release.
