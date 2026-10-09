# Phase 19 Validation Architecture

## Test Battery & Requirements Mapping

| Requirement | Test File / Command | Expected Behavior |
|---|---|---|
| **GATE-01** | `pytest -o pythonpath=backend backend/tests/test_concurrence_gating.py -k "time_window or corridor or shock_jerk"` | Telemetry strictly queries $[t_{\text{repair}},\, t_{\text{repair}} + 48\text{h}]$, 5m corridor tolerance excludes adjacent-lane noise, and speed-normalized shock jerk $G_{norm} = \frac{\|G_z - 1.0\|}{v / 30}$ correctly classifies vehicle dynamics. |
| **GATE-02** | `pytest -o pythonpath=backend backend/tests/test_concurrence_gating.py -k "fail_closed or zero_fallback"` | Missing sensor values ($G_z$ or optical) and crawl speeds ($v < 15\text{ km/h}$) fail closed as `NO_DATA` (never counted as clean passes); recurrence evaluation completely eliminates fabricated fallback values ($1.48\text{g}$, `"BUS-04"`). |
| **OFFICER-01** | `pytest -o pythonpath=backend backend/tests/test_concurrence_gating.py backend/tests/test_contractor_ledger.py -k "officer or recommendation or triage"` | Replaces autonomous debits/clearances with `recommend_release`, `proposed_deduction`, and AE/EE approval statuses; `POST /api/clusters/{id}/triage` validates structured rejection reasons (`FALSE_POSITIVE`, `DUPLICATE_CLUSTER`, `JURISDICTION_NON_PWD`, `UNDER_ACTIVE_REPAIR`). |

## Automated Verification Commands

### Backend Test Suite
```powershell
pytest -o pythonpath=backend backend/tests/test_concurrence_gating.py backend/tests/test_contractor_ledger.py backend/tests/test_urban_sensing.py backend/tests/test_copilot_engine.py -q
```

### Frontend Build
```powershell
npm --prefix frontend run build
```
