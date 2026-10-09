# Phase 15 Context: RoadSaathi Civic Copilot & Natural Language Intelligence

## Phase Domain & Goals
Equip municipal commanders, traffic enforcement officers, and PWD engineers with a high-performance, natural language conversational assistant to query fleet telemetry, audit contractor SLA breaches, inspect road hazard hotspots, and automate statutory show-cause notice drafting without writing manual SQL or navigating complex filter menus. 

The feature comprises a local, deterministic, schema-aware backend semantic query dispatcher (`/api/copilot/query`) and a responsive, floating slide-over Civic Copilot drawer integrated seamlessly across the Command Center and Work Orders workspaces.

---

## Locked Decisions

### D-15-01: Deterministic Semantic Query Dispatcher Architecture
- **Local & Offline Execution**:
  - The query engine executes 100% locally on the FastAPI backend without mandatory cloud LLM subscriptions or external API keys.
  - Sub-10ms response latency over SQLite WAL and PostgreSQL 16 schemas.
- **Intent & Entity Extraction**:
  - Semantic router identifies core municipal operational intents:
    1. `DEFECT_QUERY`: Filters road hazards by severity (`P0`, `P1`, `P2`), category (`pothole`, `crack`, `manhole`, `waterlogging`), corridor/street name (`GST Road`, `OMR`, `Anna Salai`), and verification status (`3-pass confirmed`).
    2. `CONTRACTOR_AUDIT`: Summarizes contractor performance, SLA breach counts, bank guarantee escrow balances, debarment risk rankings, and outstanding penalty amounts.
    3. `CORRIDOR_SAFETY_RANKING`: Evaluates road corridors by defect density, roughness index (RPI), and traffic congestion bottlenecks.
    4. `STATUTORY_NOTICE_DRAFT`: Compiles evidentiary packets for recurring defects and contractor SLA violations under IRC:SP:20 Clause 14 and BSA 2023 Section 65B.
    5. `GENERAL_HELP_GUIDE`: Explains system capabilities, statutory rules, and suggested queries.
- **Extensible Optional LLM Hook**:
  - If optional environment variable (`COPILOT_LLM_API_KEY` or `OPENAI_API_KEY`) is configured, system can pass unhandled edge queries to a cloud LLM with schema context; otherwise, safely defaults to fallback semantic suggestions.

### D-15-02: Floating Slide-Over Drawer UI Surface & Keyboard Shortcut
- **Floating Action Trigger (FAB)**:
  - Accessible from the bottom-right corner across Command Center and Work Orders views.
  - Includes an animated spark icon and high-contrast badge indicating copilot readiness.
- **Global Keyboard Shortcut**:
  - `Ctrl + K` (or `Cmd + K` on macOS) immediately focuses or toggles the Civic Copilot drawer from anywhere in the application.
- **Preset Quick-Prompt Chips**:
  - One-click municipal suggestion chips in the drawer header/input area:
    - *"Show unaddressed P0 potholes on GST Road"*
    - *"Contractors with highest SLA breaches"*
    - *"Corridors with worst road condition"*
    - *"Draft Form 14 notice for L&T breaches"*

### D-15-03: Actionable Civic Cards with 1-Click Deep Links
- **Rich Result Presentation**:
  - The copilot does not output plain walls of text; responses begin with a concise executive summary followed by structured entity cards.
- **Action Triggers on Cards**:
  - **"Fly to on Map"**: Updates WebGIS map coordinates and zooms directly to the cluster/corridor.
  - **"Inspect in Backlog"**: Opens the CAD Backlog drawer for the specific defect ticket.
  - **"Draft Form 14 Notice"**: Initiates the statutory notice workflow for the contractor or defect.

### D-15-04: Direct Pre-fill & Launch Section 65B Modal
- **Evidentiary Notice Workflow**:
  - When the operator requests notice drafting (e.g., *"Draft Form 14 notice for L&T breaches"*), Copilot:
    1. Identifies the offending contractor and target penalty/recurrence record.
    2. Gathers the SHA-256 evidence hash, penalty amount (₹25,000 / ₹50,000 / ₹100,000), and 7-day cure window deadline.
    3. Emits a structured `OPEN_FORM14_MODAL` payload that immediately triggers the existing `ContractorSlaLedger.tsx` Form 14 Notice Modal with pre-filled fields.
    4. Leaves the final digital signature and issuance strictly in the hands of the authorized Executive Engineer (EE).

---

## Technical Constraints & Boundaries

- **Ponytail Simplicity**:
  - Avoid bloated LangChain/LlamaIndex dependencies; use clean Python regex and dictionary semantic matching mapped directly to existing SQLAlchemy / database repository functions.
  - No new external runtime microservices or heavy local GPU-based LLMs required.
- **Test Integrity**:
  - Retain 100% pass rate across existing 117 backend tests and 44 telematics/statutory tests.
  - Add comprehensive unit tests in `backend/tests/test_copilot_engine.py` covering all intent handlers.
- **Frontend Build**:
  - Zero TypeScript compiler errors on `npm --prefix frontend run build`.
  - Reusable drawer component with accessible ARIA semantics and dark/light civic theme compliance.

---

## Code Context & Reusable Assets

- **Backend Endpoints & Services**:
  - `backend/app/services/clustering_service.py`: Spatial cluster lookups and corridor snapping.
  - `backend/app/services/contractor_service.py`: Contractor penalty records, SLA calculations, and Form 14 notice generation.
  - `backend/app/api/endpoints/defects.py`: Defect filtering and query parameters.
  - `backend/app/api/endpoints/contractors.py`: Contractor ledger APIs.
- **Frontend Components**:
  - `frontend/src/components/workorders/ContractorSlaLedger.tsx`: Form 14 Show-Cause Notice Pack Modal and digital signature.
  - `frontend/src/pages/CommandCenter.tsx`: Map viewport and inspection popups.
  - `frontend/src/pages/WorkOrders.tsx`: CAD backlog table and Kanban board.
  - `frontend/src/services/api.ts`: Centralized Axios client.
