# Phase 15 Validation Map: RoadSaathi Civic Copilot & Natural Language Intelligence

## Validation Scope & Requirements Traceability

| Requirement | Description | Validation Strategy | Automated Command | Target Artifacts |
|---|---|---|---|---|
| **COPILOT-01** | Backend schema-aware natural language assistant query dispatcher (`/api/copilot/query`) executing structured query/aggregation over road defects, contractor SLA breaches, ward safety rankings, and drafting statutory notices. | Unit and integration testing of intent router, entity extraction, SQLAlchemy queries, and Form 14 notice payload formatting. | `pytest -o pythonpath=backend backend/tests/test_copilot_engine.py -q` | `backend/app/services/copilot_engine.py`, `backend/app/api/endpoints/copilot.py` |
| **COPILOT-02** | Floating slide-over Civic Copilot drawer in Command Center & Work Orders with quick municipal prompts, deep-links to clusters/work orders, and action card formatting. | TypeScript type checking and Vite build verification for zero compiler/bundler errors. | `npm --prefix frontend run build` | `frontend/src/components/copilot/CivicCopilotDrawer.tsx`, `frontend/src/services/api.ts` |
| **REGRESSION** | Non-regression across existing contractor SLA ledger, multi-pass concurrence gating, and telematics physics engine. | Execute full regression suite including tests from Phases 12, 13, and 14. | `pytest -o pythonpath=backend backend/tests/test_contractor_ledger.py backend/tests/test_concurrence_gating.py backend/tests/test_telematics_physics.py -q` | `backend/tests/*` |

---

## Validation Pipeline Architecture

### 1. Backend Automated Test Suite
The automated test runner executes the comprehensive backend test battery:
```powershell
pytest -o pythonpath=backend backend/tests/test_copilot_engine.py backend/tests/test_contractor_ledger.py backend/tests/test_concurrence_gating.py backend/tests/test_telematics_physics.py -q
```

#### Test Cases in `backend/tests/test_copilot_engine.py`:
1. `test_copilot_health`: Verifies `/api/copilot/health` reports readiness.
2. `test_defect_query_gst_road`: Verifies intent `DEFECT_QUERY` parses corridor "GST Road" and severity "P0", returns cluster cards with `FLY_TO_MAP` actions.
3. `test_contractor_audit_highest_breaches`: Verifies intent `CONTRACTOR_AUDIT` ranks contractors by breached work orders and calculates escrow balances.
4. `test_corridor_safety_ranking`: Verifies intent `CORRIDOR_SAFETY_RANKING` aggregates defect count and roughness RPI per corridor.
5. `test_statutory_notice_draft_form14`: Verifies intent `STATUTORY_NOTICE_DRAFT` compiles Section 65B notice docket, SHA-256 evidence hash, 7-day cure window, and Clause 14 penalty amount.
6. `test_general_help_guide`: Verifies fallback and help queries return suggested prompts and capabilities.
7. `test_empty_or_malformed_query`: Verifies graceful fallback and guidance on ambiguous input.

---

### 2. Frontend Build & Static Analysis
Verifies complete type safety, responsive layout rendering, and asset tree compilation:
```powershell
npm --prefix frontend run build
```

#### Success Criteria:
- Zero TypeScript diagnostics.
- Vite bundle created with no missing symbols or syntax warnings.
- Responsive layout handles drawer open/close on mobile and desktop viewports.
- `Ctrl+K` shortcut listener captures and releases cleanly.
- Action triggers ("Fly to on Map", "Inspect in Backlog", "Draft Form 14 Notice") bind to navigation state handlers without runtime errors.
