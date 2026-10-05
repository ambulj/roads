# Technology Stack

**Analysis Date:** 2026-10-06

## Languages

**Primary:**
- **Python 3.11+** - Backend API services, asynchronous WebSocket telemetry, spatial clustering algorithms, and edge SBC telematics (`backend/app/`, `edge/edge_agent.py`)
- **TypeScript 5.6+** - Frontend WebGIS command center, component tree, interactive map canvas, and state management (`frontend/src/`)

**Secondary:**
- **C++17 / C++20** - Edge hardware acceleration for Rockchip RK3588 NPU (`edge/rknn_pipeline.cpp`, `edge/CMakeLists.txt`)
- **PowerShell / Bash** - CI validation scripts, repo search helpers, encoding validators (`scripts/`)
- **SQL** - SQLite schema definitions and relational query logic (`backend/app/models/db_models.py`, `backend/app/storage/database.py`)

---

## Runtime

**Environment:**
- **Node.js:** 20.x+ (Frontend build and development tooling)
- **Python:** 3.11.x (CPython runtime with CUDA GPU support on NVIDIA RTX Laptop GPU)
- **C++ Compiler:** GCC 11+ / Clang / MSVC with CMake 3.16+ (for RK3588 RKNN compilation)

**Package Managers:**
- **npm:** 10.x (`frontend/package.json`, `frontend/package-lock.json`)
- **pip:** Python Package Installer (`backend/requirements.txt`, `edge/requirements.txt`)

---

## Frameworks

**Core Web & API:**
- **FastAPI 0.110+** - High-performance asynchronous REST API server and WebSocket broker (`backend/app/main.py`)
- **Uvicorn 0.28+** - ASGI production server with standard async worker configuration (`backend/app/main.py`)
- **React 18 (18.3.1)** - Component-based user interface with concurrent rendering and hooks (`frontend/src/App.tsx`)
- **Vite 5.4.11** - Ultra-fast frontend build tool and development server (`frontend/vite.config.ts`)

**WebGIS, Spatial & 3D:**
- **MapLibre GL JS 4.7.1** - WebGL-based vector and raster mapping engine for high-performance map rendering (`frontend/src/components/map/WebGISMap.tsx`)
- **Three.js 0.170.0** - WebGL 3D mesh reconstruction for pavement cavity and defect inspections (`frontend/src/components/modals/Mesh3DModal.tsx`)
- **ApexCharts 4.0.0 / React-ApexCharts 1.7.0** - Real-time telemetry timelines, speed distress curves, and roughness distribution charts (`frontend/src/pages/Analytics.tsx`)

**Machine Learning & Computer Vision:**
- **OpenCV 4.9.0 (opencv-python-headless)** - Image preprocessing, Sobel gradient edge analysis, adaptive thresholding, and video capture pipelines (`backend/app/services/anpr_engine.py`, `edge/edge_agent.py`)
- **Ultralytics YOLO (v8 / v11)** - Real-time road hazard detection, zebra crossing evaluation, and object localization (`backend/app/services/yolo_inference.py`)
- **EasyOCR 1.7+** - Deep learning OCR engine for Indian High Security Registration Plate (HSRP) alphanumeric recognition (`backend/app/services/anpr_engine.py`)
- **Scikit-Learn 1.4+** - Spatial DBSCAN (Density-Based Spatial Clustering of Applications with Noise) for hazard grouping (`backend/app/spatial/clustering.py`)

**Styling & UI:**
- **Tailwind CSS 3.4.15** - Utility-first CSS styling engine with responsive dark/light theme tokens (`frontend/tailwind.config.js`)
- **Lucide React 0.454.0** - Icon library for civic operational indicators, badges, and controls (`frontend/src/`)

---

## Key Dependencies

**Critical Backend:**
- `pydantic>=2.6.0` - Strict type validation, data contracts, and schema definitions (`backend/app/models/schemas.py`)
- `sqlalchemy>=2.0.25` - Object-Relational Mapping (ORM) and connection pool management (`backend/app/storage/database.py`)
- `websockets>=12.0` - Full-duplex live vehicle coordinates and telemetry broadcast (`backend/app/api/websockets.py`)
- `python-multipart>=0.0.9` - Multi-part form parsing for dashcam video and frame evidence uploads (`backend/app/api/endpoints/streams.py`)
- `httpx>=0.27.0` / `requests>=2.31.0` - HTTP client for WhatsApp/Twilio gateway dispatch and remote telemetry ingestion

**Critical Edge:**
- `paho-mqtt` - Eclipse Paho MQTT client for publish/subscribe edge-to-broker telemetry streaming (`edge/edge_agent.py`)
- `rknn-toolkit2` / `rknpu2` - Rockchip RK3588 NPU hardware quantization and inference pipeline (`edge/export_rknn.py`, `edge/rknn_pipeline.cpp`)

---

## Configuration

**Key Environment Variables (`backend/.env` / `backend/app/core/config.py`):**
- `PROJECT_NAME`: "RoadSaathi Intelligent WebGIS"
- `DEMO_MODE`: Boolean toggle enabling simulated vehicle streams and seeded scenarios
- `ACCESS_TOKEN_EXPIRE_MINUTES`: JWT token validity duration (default: 1440 min / 24 hours)
- `JWT_SECRET_KEY`: HMAC-SHA256 signing secret for government role tokens
- `DATABASE_URL`: Connection string (default: SQLite `roadsaathi.db`, supports PostgreSQL)
- `WHATSAPP_API_TOKEN` & `TWILIO_AUTH_TOKEN`: Multi-channel contractor work order dispatch credentials
- `MODEL_PATH`: Filesystem location for custom trained `.pt` or `.onnx` YOLO weights

---

*Codebase analysis: 2026-10-06*
