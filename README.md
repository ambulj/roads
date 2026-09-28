# SeherSaathi — Municipal Road Intelligence & Vision Zero Platform

> **Edge-AI & WebGIS CAD System for Indian Municipal Corporations & Highway Authorities**  
> Built for Ministry of Road Transport & Highways (MoRTH), National Highways Authority of India (NHAI), and State Transit Undertakings (STUs) · **Version 2.6.0**

---

## 🌟 Platform Highlights & Core Capabilities

1. **Zero-Hardware Sensor Fusion**:
   - Converts existing public transit buses (MTC, DTC, BMTC, PMPML) into real-time road auditing nodes using existing on-bus **AIS-140 GPS/IMU telematics + RTSP dashcam feeds**.
   - Sub-45ms end-to-end latency budget (AIS-140 5Hz telematics spike $\to$ RTSP keyframe grab $\to$ GPU YOLO inference $\to$ H3 spatial consensus $\to$ WebGIS broadcast).

2. **Multi-Model Edge Vision Suite**:
   - **Pothole Cavity Detection (`D40`)**: Volumetric depth and repair cost estimation based on shadow luminance contrast ($\Delta L$) and calibrated camera optics ($V = d_{\text{cm}} \cdot A_{\text{m}^2} \times 10\text{ Liters}$).
   - **Alligator & Fatigue Cracking (`D20`)**: Asphalt distress network segmentation complying with IRC:82.
   - **School Crosswalk Safety (`IRC:35`)**: Vision Zero pedestrian group consolidation and mandatory vehicle yield enforcement.
   - **Indian HSRP ANPR Engine**: High Security Registration Plate recognition with vertical Sobel edge localization, Otsu binarization, EasyOCR/PyTesseract extraction, and national MoRTH state/RTO syntax validation.

3. **Strict Domain Segregation**:
   - **Road Infrastructure Work Orders (`DBDistressCluster`)**: Pure civil engineering pavement repair dockets (potholes, cracks, open manholes, restriping) with RPI scoring, contractor assignment (NHAI, L&T, CMWSSB), and municipal repair SLAs.
   - **Traffic Safety Incidents (`DBTrafficIncident`)**: Dynamic traffic violations (Hit & Run collisions, wrong-way driving, red light jumping, school crossing yield alerts) with ANPR plates, target speeds, automated e-Challan generation, and Police PCR 112 / 108 EMS dispatch.

4. **Emergency Level 1 Red Alert Dispatch**:
   - Automated detection of Hit-and-Run collision scenes and fallen motorcyclists.
   - Immediate dispatch payload routing to Police PCR 112 and Emergency 108 Ambulances.
   - Automated statutory citation generation under **MVA 1988 Sec 134/187 read with Sec 184 & IPC Sec 279/338 (₹10,000 fine)**.

5. **DPDP Act 2023 Privacy Compliance**:
   - Real-time zero-lag optical face and bystander privacy anonymization burned prior to forensic storage and dashboard rendering.

6. **Cryptographic Evidence Vault**:
   - Digital evidence storage (`/api/evidence`) with SHA-256 tamper-evident checksums, NavIC GPS positioning, and AI HUD defect bounding box overlays.

---

## 🚀 Quick Start (Any Machine, Any Directory)

### Option A — One-Click Launch (Windows)

Simply double-click **`run_sehersaathi.bat`** (or right-click → Run with PowerShell on **`run_sehersaathi.ps1`**).

The launcher will automatically:
1. Detect Python 3.10+ and Node.js 18+
2. Set up the Python virtual environment and dependencies
3. Install frontend node modules if needed
4. Launch the FastAPI backend on `http://127.0.0.1:8000`
5. Launch the WebGIS frontend on `http://localhost:5173`
6. Open your default web browser to the dashboard

---

### Option B — Manual Launch

#### 1. Backend Setup

```bash
cd backend

# Create virtual environment (one-time)
python -m venv venv

# Activate (Windows CMD)
venv\Scripts\activate
# Activate (PowerShell)
# .\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Seed Ground-Truth & Benchmark Dataset
python scripts/reset_and_seed_ground_truth.py

# Start Backend Server
python run_backend.py
```
- **Backend URL**: `http://127.0.0.1:8000`
- **Interactive API Docs (Swagger)**: `http://127.0.0.1:8000/docs`

#### 2. Frontend Setup

```bash
cd frontend

# Install node packages (one-time)
npm install

# Start Vite Development Server
npm run dev
```
- **Frontend Dashboard**: `http://localhost:5173`

---

## 🗺️ Keyboard Shortcuts & Quick Navigation

| Key | View / Action |
|:---:|:---|
| `1` | **Command Center (WebGIS Map & Live Fleet Tracking)** |
| `2` | **Safety Incidents (Hit & Run, School Zones, Traffic Violations)** |
| `3` | **Road Memory & Historical Deterioration (Markov Audits)** |
| `4` | **Edge AI Analytics & Real-Time Perception Telemetry** |
| `5` | **Fleet Nodes (Bus Hardware, FPS, IMU Jerk & Health)** |
| `6` | **Work Orders (Pavement Maintenance & Contractor Dockets)** |
| `7` | **Civic Issue Ingestion & Media Upload Studio** |
| `T` | **Toggle Dark / Light Theme** |
| `S` | **Collapse / Expand Sidebar** |
| `Ctrl + K` / `?` | **Open Global Command Palette** |
| `Esc` | **Close Active Modal or Dossier Window** |

---

## 📐 Mathematical Models & Prioritization Formulas

### 1. Dynamic Road Priority Index (RPI)
$$\text{RPI}_{\text{dynamic}} = \min\left(100, \text{RPI}_{\text{base}} \times M_{\text{weather}} \times M_{\text{traffic}} \times M_{\text{deterioration}}\right)$$
- **$M_{\text{weather}}$**: $1.35$ (Monsoon saturation), $1.15$ (Damp pavement), $1.00$ (Dry)
- **$M_{\text{traffic}}$**: $1.28$ (High arterial transit $>1600\text{ PCU/km}$), $1.12$ (Moderate), $1.00$ (Low)
- **$M_{\text{deterioration}}$**: $\left(1 + \min(0.40, \max(0, (d_{\text{cm}} - 3.0) \times 0.04))\right) \times \left(1 + \min(0.25, \max(0, N_{\text{passes}} \times 0.004))\right)$

### 2. Kinematic Time-to-Collision (TTC)
$$\text{TTC} = \frac{\sqrt{d^2 + d_{\text{lateral}}^2}}{\max(0.5, v_{\text{ego}} + v_{\text{target\_rel}})}$$
- $\text{TTC} < 2.5\text{s} \implies \text{CRITICAL COLLISION RISK (Level 1 Red Alert)}$
- $2.5\text{s} \le \text{TTC} \le 4.5\text{s} \implies \text{ELEVATED CAUTION (Yellow Bounding Box)}$

---

## 🗂️ Project Repository Structure

```
roads/
├── backend/
│   ├── app/
│   │   ├── api/endpoints/        # REST & WebSocket route handlers
│   │   │   ├── clusters.py       # Pavement distress work orders
│   │   │   ├── incidents.py      # Traffic & safety violations
│   │   │   ├── streams.py        # Live RTSP, SRT & Dashcam Ingestion
│   │   │   ├── evidence.py       # Cryptographic evidence vault
│   │   │   └── telemetry.py      # AIS-140 telematics & sensor fusion
│   │   ├── services/             # Core perception & reasoning engines
│   │   │   ├── yolo_inference.py # Multi-model YOLOv8 & CV engine
│   │   │   ├── anpr_engine.py    # Indian HSRP plate recognition
│   │   │   ├── evidence_vault.py # SHA-256 evidence docket storage
│   │   │   ├── privacy_engine.py # DPDP Act 2023 face & bystander blur
│   │   │   └── hit_and_run_engine.py # Collision & evasion analysis
│   │   ├── storage/              # SQLite / PostgreSQL persistence layer
│   │   └── models/               # SQLAlchemy schema & Pydantic models
│   ├── scripts/
│   │   └── reset_and_seed_ground_truth.py # Ground truth benchmark seeder
│   ├── sehersaathi.db            # Local SQLite database
│   ├── requirements.txt          # Python dependencies
│   └── run_backend.py            # Backend entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/           # UI components, MapLibre GL, and HUDs
│   │   ├── pages/                # Command Center, Safety, Work Orders
│   │   └── services/             # API client & WebSocket manager
│   ├── package.json
│   └── vite.config.ts
│
├── run_sehersaathi.bat           # One-click Windows CMD launcher
├── run_sehersaathi.ps1           # One-click Windows PowerShell launcher
└── README.md
```

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| **Spatial GIS & Maps** | MapLibre GL JS, H3 Spatial Hexagons, Turf.js |
| **Charts & Analytics** | ApexCharts, React-ApexCharts |
| **Edge Perception** | YOLOv8 (PyTorch / CUDA), OpenCV, EasyOCR, PyTesseract |
| **Backend API** | FastAPI, Uvicorn, Python 3.10+, WebSockets |
| **Database & ORM** | SQLite / PostgreSQL + PostGIS, SQLAlchemy 2.0 |
| **Compliance Standards** | MoRTH AIS-140, IRC:35, IRC:SP:20, IRC:82, DPDP Act 2023 |

---

## 📄 License & Statutory Compliance

This software is developed in strict accordance with the **Digital Personal Data Protection (DPDP) Act 2023** of India, the **Motor Vehicles Act 1988 (as amended in 2019)**, and **Indian Roads Congress (IRC)** engineering standards.
