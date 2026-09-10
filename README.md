# RoadSaarthi — Municipal Road Intelligence Platform

> Edge-AI & WebGIS CAD System for Government of India road safety and maintenance operations.  
> Ministry of Road Transport & Highways (MoRTH) · Version 2.6.0

---

## Quick Start (Any Machine, Any Folder)

> Move this folder anywhere on your system — it will still work.

### Option A — One-Click Launch (Windows)

Double-click **`run_roadsaarthi.bat`** (or right-click → Run with PowerShell on `run_roadsaarthi.ps1`).

The launcher will automatically:
1. Detect Python and Node.js
2. Create a Python virtual environment if missing
3. Install all dependencies
4. Start the backend and frontend in separate windows
5. Open your browser at http://localhost:5173

---

### Option B — Manual Setup

#### Prerequisites
| Tool | Minimum Version | Install |
|------|----------------|---------|
| Python | 3.10+ | https://python.org |
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | comes with Node.js |

#### Backend

```bash
cd backend

# Create virtual environment (one-time)
python -m venv venv

# Activate (Windows CMD)
venv\Scripts\activate

# Activate (PowerShell / Mac / Linux)
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start server
python run_backend.py
```

Backend runs at: http://127.0.0.1:8000  
API documentation: http://127.0.0.1:8000/docs

#### Frontend

```bash
cd frontend

# Install packages (one-time)
npm install

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Configuration

All settings are controlled via environment variables in `.env` files.  
**You do not need to change anything for local development.**

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite` | Use `sqlite` for local (zero setup). Set to a PostgreSQL URL for production. |
| `USE_POSTGIS` | `false` | Enable PostGIS spatial queries |
| `PORT` | `8000` | Backend port |
| `HOST` | `127.0.0.1` | Backend host |
| `SYNTHETIC_INTERVAL_SECONDS` | `300` | How often synthetic data is generated |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_BACKEND_HOST` | `127.0.0.1` | Backend hostname |
| `VITE_BACKEND_PORT` | `8000` | Backend port |

Copy `backend/.env.example` → `backend/.env` and `frontend/.env.example` → `frontend/.env` to customise.

---

## Project Structure

```
roadsaarthi/
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── api/                # REST & WebSocket routes
│   │   ├── core/               # Config, RPI engine
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── services/           # Business logic
│   │   ├── spatial/            # DBSCAN clustering
│   │   └── storage/            # Database layer
│   ├── roadsaarthi.db          # SQLite database (auto-created)
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Local config (not committed)
│   ├── .env.example            # Config template (committed)
│   └── run_backend.py          # Entry point
│
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── components/         # UI primitives & layout
│   │   ├── context/            # Theme context
│   │   ├── hooks/              # WebSocket hook
│   │   ├── pages/              # Application pages
│   │   └── services/           # API client
│   ├── .env                    # Local config (not committed)
│   ├── .env.example            # Config template (committed)
│   └── vite.config.ts          # Build & proxy config
│
├── docker-compose.yml          # Docker Compose (optional)
├── run_roadsaarthi.bat         # Windows one-click launcher (CMD)
├── run_roadsaarthi.ps1         # Windows one-click launcher (PowerShell)
└── .gitignore                  # Git ignore rules
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1` | Command Center (Road Map) |
| `2` | Safety Incidents |
| `3` | Road History |
| `4` | Analytics |
| `5` | Fleet Nodes |
| `6` | Work Orders |
| `7` | Report Issue |
| `T` | Toggle Light / Dark theme |
| `S` | Collapse / expand sidebar |
| `?` or `Ctrl+K` | Open Command Palette |
| `Esc` | Close any modal |

---

## Docker (Optional — Includes PostgreSQL + PostGIS)

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Maps | MapLibre GL JS |
| Charts | ApexCharts |
| Icons | Lucide React |
| Backend | FastAPI, Python 3.10+ |
| Database | SQLite (default) / PostgreSQL + PostGIS |
| ORM | SQLAlchemy 2.0 |
| WebSockets | FastAPI WebSocket |
| Clustering | scikit-learn DBSCAN |
