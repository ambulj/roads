# External Integrations & APIs

**Analysis Date:** 2026-10-06

## Database & Persistence

**Primary Database:**
- **Engine:** SQLite 3 with Write-Ahead Logging (`PRAGMA journal_mode=WAL`)
- **Connection Tuning:** `PRAGMA busy_timeout=15000`, `PRAGMA synchronous=NORMAL` for multi-threaded concurrency without table locks
- **File Location:** `backend/roadsaathi.db`
- **ORM:** SQLAlchemy 2.0 (`backend/app/storage/database.py`, `backend/app/models/db_models.py`)
- **Migration Path:** Designed for drop-in transition to PostgreSQL + PostGIS via `DATABASE_URL` environment configuration

**Edge Persistence:**
- **Engine:** Append-Only JSON Lines (`.jsonl`) with atomic temporary-file batch compaction (`edge/edge_agent.py`)
- **File Pattern:** `edge_buffer_{bus_id}.jsonl`
- **Purpose:** Prevents flash memory/eMMC write exhaustion on vehicle single-board computers during network blackouts

---

## Authentication & Authorization

**Provider:**
- **Mechanisms:** HMAC-SHA256 Signed JSON Web Tokens (JWT) + PBKDF2-HMAC-SHA256 password hashing (`backend/app/core/auth.py`)
- **Header Structure:** `Authorization: Bearer <JWT>` with fallback `X-Demo-Role` during interactive municipal presentations
- **Seeded Government Personas:**
  1. `admin` - State ICCC Super Administrator (Full civic master clearance)
  2. `admin2` / `edge_admin` - Chief Director of Fleet Edge AI & Autonomous Systems
  3. `traffic_police` / `safety` - Greater Chennai Traffic Police (GCTP) Deputy Commissioner
  4. `pwd_engineer` / `maintenance` - Superintending Engineer (Roads & Bridges, GCC & TN Highways PWD)
  5. `rto_officer` / `operations` - Regional Transport Officer (Chennai Central / TN-01)
  6. `commissioner` - Transport Commissioner & Secretary to Govt of Tamil Nadu

---

## Civic & Government System Integrations

**1. VAHAN & Sarathi National Vehicle Registry:**
- **Status:** Integrated via simulated statutory lookup engine (`backend/app/api/endpoints/traffic.py:lookup_rto_registration`)
- **Data Provided:** State jurisdiction, RTO office mapping, vehicle make/model, RC status, fitness certificate expiration, HSRP compliance status, insurance validity, and PUC green tier compliance

**2. MoRTH e-Challan Citizen Gateway:**
- **Status:** Automated issuance with cryptographic citation identifiers (`generate_echallan_id`)
- **Statutory Rules:** MVA Sections 184 (Dangerous/Rash Driving), 134 (Hit & Run), 194B/194C (Helmet/Seatbelt), 119 (Disobeying Traffic Signs)
- **Provenance Ledger:** `statutory_provenance` records exact legislative standard, legal description, and prescribed penalties

**3. Digital Personal Data Protection (DPDP) Act 2023:**
- **Status:** Certified optical privacy pipeline in Evidence Vault (`backend/app/services/evidence_vault.py`)
- **Privacy Gating:** Role-authenticated downloads at `/api/evidence/{evidence_id}/download` returning compliance audit headers (`X-DPDP-Act-2023-Compliance`, `X-DPDP-Authorized-Role`, `X-DPDP-Audited-Officer`)

**4. Public Works Department (PWD) IRC:SP:20 Clause 14 Penalty Engine:**
- **Status:** Automated contractor SLA tracking and debit ledger (`backend/app/api/endpoints/analytics.py`)
- **Calculations:** Auto-calculates cumulative penalty debits for recurring surface failures inside the mandatory 36-month defect liability period

---

## External Communication Gateways

**1. WhatsApp Cloud API / Twilio Multi-Channel Dispatch:**
- **Endpoint:** `POST /api/dispatch/whatsapp` (`backend/app/api/endpoints/dispatch.py`)
- **Capabilities:** Sends instant hazard alerts with deep-links, contractor docket assignments, GPS coordinates, and before-repair evidence to ward engineers
- **Mode:** Production uses live `WHATSAPP_API_TOKEN`; demo mode generates formatted `https://wa.me/` direct dispatch links with verifiable delivery receipt IDs (`MSG-WA-2026-XXXX`)

**2. Eclipse Paho MQTT Broker:**
- **Endpoint:** `roadsaathi/telemetry/{bus_id}/#` and `roadsaathi/command/{bus_id}/#` (`edge/edge_agent.py`)
- **Protocol:** MQTT v3.1.1 for low-bandwidth cellular transport, QoS 0/1 telemetry ingestion, and OTA remote camera configuration

---

## WebGIS Basemap Tile Providers

**Configured Tile Sources (`frontend/src/components/map/WebGISMap.tsx`):**
- **CARTO Dark Matter:** `https://[a,b,c].basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png`
- **OpenStreetMap Standard:** `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Esri World Imagery (Satellite):** `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`
- **OpenTopoMap (Topographic Elevation):** `https://tile.opentopomap.org/{z}/{x}/{y}.png`

---

*Codebase analysis: 2026-10-06*
