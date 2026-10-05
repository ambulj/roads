# Directory Structure & Organization

**Analysis Date:** 2026-10-06

## Directory Layout

```
roads/
├── backend/                        # FastAPI Backend Application
│   ├── app/
│   │   ├── api/                    # HTTP REST & WebSocket Routes
│   │   │   ├── endpoints/
│   │   │   │   ├── analytics.py    # Speed-distress, GTFS delays, contractor penalties
│   │   │   │   ├── auth.py         # Login, JWT issuance, civic role authorization
│   │   │   │   ├── dispatch.py     # WhatsApp & Twilio multi-channel contractor alerts
│   │   │   │   ├── evidence.py     # Forensic vault, DPDP-gated downloads
│   │   │   │   ├── incidents.py    # Traffic violations, review queue, PCR dispatch
│   │   │   │   ├── models.py       # Model registry status & weight validation
│   │   │   │   ├── simulation.py   # Demonstration scenarios and synthetic data
│   │   │   │   ├── streams.py      # Video uploads, dashcam processing, HLS feeds
│   │   │   │   ├── telemetry.py    # 5Hz vehicle coordinates, edge sync, YOLO infer
│   │   │   │   └── traffic.py      # ANPR detection, IRC:106 PCU vehicle density
│   │   │   └── websockets.py       # Bi-directional WebSocket connection manager
│   │   ├── core/                   # Security, configuration, and statutory standards
│   │   │   ├── auth.py             # JWT encode/decode, PBKDF2 hashing, role guards
│   │   │   ├── config.py           # Pydantic BaseSettings and environment loading
│   │   │   └── statutory_engine.py # MVA sections, fines, nearest PCR unit resolver
│   │   ├── models/                 # Data schemas and database ORM entities
│   │   │   ├── db_models.py        # SQLAlchemy relational tables
│   │   │   └── schemas.py          # Pydantic v2 validation contracts
│   │   ├── services/               # Core AI, OCR, synthetic and telemetry engines
│   │   │   ├── anpr_engine.py      # License plate reader with cached EasyOCR
│   │   │   ├── edge_sync_engine.py # Compressed batch processor for edge buffers
│   │   │   ├── evidence_vault.py   # Keyframe archive with DPDP certification
│   │   │   ├── model_registry.py   # Filesystem-verified model status tracker
│   │   │   ├── synthetic_generator.py # 5-minute autonomous data generation loop
│   │   │   └── yolo_inference.py   # Multi-model YOLO suite & fallback detector
│   │   ├── spatial/                # Spatial algorithms and GIS indexing
│   │   │   └── clustering.py       # DBSCAN road distress clustering algorithm
│   │   ├── storage/                # Database initialization and seeded data
│   │   │   ├── database.py         # SQLite WAL engine and connection event hooks
│   │   │   └── mock_database.py    # In-memory store fallback and seed constants
│   │   ├── weights/                # Neural model weights directory (.pt / .onnx)
│   │   └── main.py                 # FastAPI application entry point & CORS configuration
│   ├── data/                       # Ground truth and benchmark datasets
│   │   └── dataset/checkpoints/    # Historical performance evaluation records
│   ├── tests/                      # Automated test suite (pytest & unittest)
│   │   ├── test_all_features_logic.py
│   │   ├── test_api_endpoints.py
│   │   ├── test_backend.py
│   │   ├── test_integration.py
│   │   └── test_production_hardening.py
│   ├── requirements.txt            # Python production dependencies
│   └── roadsaathi.db               # SQLite database file (WAL mode)
│
├── frontend/                       # React 18 + Vite WebGIS Frontend
│   ├── src/
│   │   ├── components/             # Reusable UI widgets and operational panels
│   │   │   ├── header/             # Navigation bar, language picker, persona switcher
│   │   │   ├── map/                # WebGISMap component and basemap selectors
│   │   │   ├── modals/             # 3D Mesh, WhatsApp dispatch, RPI formula modals
│   │   │   ├── triage/             # Incident action queue and evidence inspector
│   │   │   ├── ui/                 # Reusable buttons, cards, badges, modal wrappers
│   │   │   └── workorders/         # Multi-pass concurrence console, SLA ledger
│   │   ├── context/                # React Context providers (Auth, Theme, Language)
│   │   ├── hooks/                  # Custom hooks (useTelemetrySocket, useAuth)
│   │   ├── pages/                  # Top-level operational pages
│   │   │   ├── CommandCenter.tsx   # Integrated Command and Control Center
│   │   │   ├── IncidentList.tsx    # Enforcement, ANPR review, e-Challan queue
│   │   │   ├── WorkOrders.tsx      # Road repair dockets, SLA debits, contractor ledger
│   │   │   ├── FleetNodes.tsx      # Onboard telematics health, camera configs
│   │   │   ├── Analytics.tsx       # Roughness profiles, speed distress, delay metrics
│   │   │   ├── RoadMemory.tsx      # Longitudinal deterioration, lifecycle models
│   │   │   └── MobileDashcam.tsx   # Live edge dashcam simulation with canvas overlays
│   │   ├── services/               # API clients, HTTP wrappers, and seed POIs
│   │   ├── types/                  # TypeScript interface and type declarations
│   │   ├── utils/                  # Formatting, coordinate math, RPI score calculations
│   │   ├── App.tsx                 # Main application router and role-gated tabs
│   │   ├── index.css               # Tailwind CSS imports and custom map styling
│   │   └── main.tsx                # React DOM root entry point
│   ├── package.json                # Frontend dependencies and npm scripts
│   ├── tailwind.config.js          # Tailwind styling configuration
│   ├── tsconfig.json               # TypeScript compiler configuration
│   └── vite.config.ts              # Vite bundler configuration and proxy rules
│
├── edge/                           # Standalone Vehicle Edge SBC Agent
│   ├── CMakeLists.txt              # C++ compilation configuration for RKNN
│   ├── edge_agent.py               # Python onboard vehicle agent with JSONL ring buffer
│   ├── export_rknn.py              # PyTorch to RKNN model conversion tool
│   ├── README.md                   # Edge hardware setup guide (RK3588, Raspberry Pi)
│   ├── requirements.txt            # Edge Python dependencies (OpenCV, Paho MQTT)
│   └── rknn_pipeline.cpp           # Zero-copy C++ Rockchip NPU inference pipeline
│
├── scripts/                        # Repository validation and maintenance scripts
│   ├── validate-agents.ps1/.sh     # Subagent tool grant and schema verification
│   ├── validate-all.ps1/.sh        # Complete repository validation suite
│   └── search_repo.ps1/.sh         # Fast local text search utilities
│
└── .planning/                      # GSD Project Management & Planning Artifacts
    └── codebase/                   # Structured codebase documentation
```

---

## Key Entry Points

| Component | Entry File | Purpose |
|---|---|---|
| **Backend API Server** | `backend/app/main.py` | Initializes FastAPI, mounts CORS, includes API routers, and configures Uvicorn |
| **Frontend WebGIS** | `frontend/src/main.tsx` | Mounts React root, initializes theme and auth contexts |
| **Frontend Router** | `frontend/src/App.tsx` | Route dispatching (`command`, `incidents`, `work-orders`, `fleet`, `analytics`) |
| **Edge SBC Agent** | `edge/edge_agent.py` | Starts video capture, hardware inference, MQTT publisher, and background sync thread |
| **Database Migrations** | `backend/app/storage/database.py` | Creates tables and seeds initial municipal baseline records on startup |

---

## Naming Conventions

### Python (Backend & Edge)
- **Files & Modules:** `snake_case.py` (e.g., `anpr_engine.py`, `edge_sync_engine.py`)
- **Classes:** `PascalCase` (e.g., `ANPREngine`, `OnboardEdgeNode`, `DBTrafficIncident`)
- **Functions & Methods:** `snake_case` (e.g., `detect_plate`, `compute_statutory_citation`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `DEFAULT_GOV_PASSWORD`, `EVIDENCE_DIR`)

### TypeScript & React (Frontend)
- **Component Files:** `PascalCase.tsx` (e.g., `WebGISMap.tsx`, `CommandCenter.tsx`)
- **Utility & Hook Files:** `camelCase.ts` (e.g., `useTelemetrySocket.ts`, `api.ts`)
- **Component Names:** `PascalCase` (e.g., `OperatorInspectorPanel`, `Mesh3DModal`)
- **Interfaces & Types:** `PascalCase` (e.g., `HazardCluster`, `FleetNode`, `TrafficIncident`)
- **Custom Events:** `domain:subsystem:entity` (e.g., `roadsaathi:telemetry:fleet`)

---

*Codebase analysis: 2026-10-06*
