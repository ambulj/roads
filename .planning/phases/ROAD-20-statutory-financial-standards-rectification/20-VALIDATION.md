# Phase 20 Validation Architecture

## Test Battery & Requirements Mapping

| Requirement | Test File / Command | Expected Behavior |
|---|---|---|
| **STATUTE-03** | `pytest -o pythonpath=backend backend/tests/test_contractor_ledger.py backend/tests/test_concurrence_gating.py -k "statutory or clause or notice"` | All penalty dockets, Form 14 notice generators, and concurrence clearance audits reference `"Contractual DLP Clause & Section 63/65B BSA 2023"` instead of rural road manual citations (`IRC:SP:20 Clause 14`). |
| **FINANCE-01** | `pytest -o pythonpath=backend backend/tests/test_contractor_ledger.py -k "pfms or voucher or deposit"` | `generate_pfms_voucher_ref` produces `PFMS/DLP-RETENTION/{YYYY}/{MMDD}-{HEX6}`; UI ledgers reflect Security Deposit (SD) / Retention Money without breaking internal column backward compatibility (`escrow_deposit_inr`). |
| **CIVIL-01** | `pytest -o pythonpath=backend backend/tests/test_all_features_logic.py -k "3d_mesh or volumetric"` | Patch repair calculations apply IRC:82 +15% saw-cut trim margin (`saw_cut_margin_pct = 15.0`) and +10% bulk compaction allowance (`compaction_factor = 1.10`) yielding $V_{\text{patch}} = V_{\text{cavity}} \times 1.265$, evaluated at 2.35 g/cm³ density and ₹68/kg PWD SOR rate. |
| **ATTRIB-01** | `pytest -o pythonpath=backend backend/tests/test_urban_sensing.py backend/tests/test_copilot_engine.py -q` | Model registry provides Roboflow Universe CC BY 4.0 dataset attributions for public weights, and WebGIS Map designates OD desire lines as aggregate illustrative fleet GPS corridor traces. |

---

## Automated Verification Commands

### Automated Backend Test Suite
```powershell
pytest -o pythonpath=backend backend/tests/test_contractor_ledger.py backend/tests/test_concurrence_gating.py backend/tests/test_urban_sensing.py backend/tests/test_copilot_engine.py -q
```

### Full Feature Logic Verification
```powershell
pytest -o pythonpath=backend backend/tests/test_all_features_logic.py -q
```

### Frontend Build
```powershell
npm --prefix frontend run build
```

---

## Acceptance Criteria Checklist
- [ ] Backend default for `statutory_clause` is `"Contractual DLP Clause & Section 63/65B BSA 2023"`.
- [ ] `generate_pfms_voucher_ref()` generates `PFMS/DLP-RETENTION/{yyyy}/{mmdd}-{hex6}`.
- [ ] Internal columns `escrow_deposit_inr` and `escrow_holdback_released` remain intact for schema stability.
- [ ] UI copy across `ContractorSlaLedger.tsx` and `WorkOrderActionConsole.tsx` refers to "Security Deposit (SD) / Retention Money" rather than "Escrow".
- [ ] `RoadMeshVisualizerModal.tsx` and civil estimation formulas incorporate $1.15 \times 1.10 = 1.265$ patch volume factor and $2.35\text{ kg/L}$ bulk density.
- [ ] AI model registry includes `dataset_attribution` (Roboflow CC BY 4.0).
- [ ] Origin-Destination traces in `WebGISMap.tsx` are clearly captioned as illustrative aggregate fleet corridor traces.
