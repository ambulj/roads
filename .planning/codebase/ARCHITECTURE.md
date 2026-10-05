# Architecture Overview

**Analysis Date:** 2026-10-06

## Pattern Overview

**Overall Architecture:** Hybrid Edge-Fog-Cloud Municipal WebGIS with Decoupled High-Frequency Event Loops.

**Key Characteristics:**
- **Tiered Edge Processing:** Tier 1 (P0 Critical Safety Violations & Severe Impact Cavities) sent immediately over cellular; Tier 2 (P1 Routine telemetry) buffered locally into append-only JSONL queues and flushed in batch upon depot Wi-Fi arrival.
- **Non-Blocking Asynchronous Concurrency:** Heavy neural inference (PyTorch YOLO, OpenCV edge Sobel filtering) and CPU-bound synthetic generators are offloaded from FastAPI's event loop via `asyncio.to_thread`.
- **Decoupled WebGIS Telemetry Pipeline:** 5Hz vehicle GPS coordinates bypass React component state reconciliation via custom DOM events (`roadsaathi:telemetry:fleet`) and feed directly into MapLibre GL's WebGL GeoJSON source (`bus-positions`), preserving locked 60 FPS panning and zooming.
- **Truthful Model Verification:** AI subsystem verifies physical existence of `.pt`/`.onnx` weights on disk before claiming production readiness, defaulting cleanly to deterministic OpenCV mathematical fallbacks if weights are unmounted.

---

## System Architecture Diagram

```
+-----------------------------------------------------------------------------------------+
|                                    ONBOARD EDGE TIER                                    |
|   (Public Transit Buses / Sanitation Trucks equipped with RK3588 NPU or Raspberry Pi)   |
|                                                                                         |
|  [ Dashcam / V4L2 / RTSP ] ---> [ RKNN / TensorRT YOLO ] ---> [ Accelerometer / IMU ]   |
|                                         |                                               |
|             +---------------------------+--------------------------+                    |
|             | (P0 Emergency Event)                                 | (P1 Routine)       |
|             v                                                      v                    |
|     [ MQTT / REST Dispatch ]                             [ Append-Only JSONL Buffer ]   |
|             |                                                      | (Batch Sync)       |
+-------------|------------------------------------------------------|--------------------+
              |                                                      |
              +--------------------------+---------------------------+
                                         | Cellular / Depot 5G
                                         v
+-----------------------------------------------------------------------------------------+
|                                  CENTRAL SERVER TIER                                    |
|                         (FastAPI + SQLite WAL / PostgreSQL)                             |
|                                                                                         |
|   [ Ingest API ]  <---> [ Async Thread Pool ] <---> [ Evidence Vault (DPDP Gated) ]     |
|         |                      |                                                        |
|         v                      v                                                        |
|   [ DBSCAN Spatial Clusterer ] ---> [ Statutory Citation Engine (MVA / IRC:SP:20) ]    |
|         |                                                      |                        |
|         +-----------------------+------------------------------+                        |
|                                 |                                                       |
|                                 v                                                       |
|                     [ WebSocket Telemetry Broker ]                                      |
+---------------------------------|-------------------------------------------------------+
                                  | WebSocket 5Hz Feed
                                  v
+-----------------------------------------------------------------------------------------+
|                                 WEBGIS COMMAND CENTER                                   |
|                             (React 18 + MapLibre GL JS)                                 |
|                                                                                         |
|    [ WebSocket Listener ]                                                               |
|         |                                                                               |
|         +---> (High-Freq 5Hz) ---> [ MapLibre GeoJSON Source: 'bus-positions' ] (60 FPS)|
|         |                                                                               |
|         +---> (Throttled 1Hz) ---> [ React State: Triage, Metrics, Work Order Queue ]   |
|                                                                                         |
|    [ 3D Mesh Inspector ] <---> [ WhatsApp Dispatch Modal ] <---> [ RPI Formula Modal ]  |
+-----------------------------------------------------------------------------------------+
```

---

## Architectural Layers

### 1. Onboard Edge Tier (`edge/edge_agent.py`, `edge/rknn_pipeline.cpp`)
- **Purpose:** Continuous dashcam ingestion, optical road distress classification, and vehicle telemetry collection directly on public transit buses.
- **Responsibilities:**
  - Hardware probing (Rockchip RKNN, NVIDIA TensorRT, ONNX Runtime, PyTorch).
  - Dual-tier telemetry routing: P0 (immediate MQTT/HTTP) vs P1 (deferred local buffering).
  - Append-only `.jsonl` logging with atomic batch compaction to eliminate flash storage wear.
  - Adaptive backoff with random jitter to prevent cellular thundering herds during reconnection.

### 2. Ingestion & API Gateway Tier (`backend/app/api/endpoints/`)
- **Purpose:** Secure REST and WebSocket ingress points for fleet telematics and client requests.
- **Key Modules:**
  - `telemetry.py` - Ingestion of 5Hz GPS ticks, IMU z-axis acceleration, and YOLO hazard infer requests.
  - `incidents.py` - Traffic safety violations, review queues, officer sign-offs, and PCR dispatches.
  - `evidence.py` - Role-authenticated DPDP-compliant evidence retrieval and streaming.
  - `websockets.py` - Bi-directional WebSocket broker broadcasting telemetry snapshots to active command consoles.

### 3. Analytics & Statutory Processing Tier (`backend/app/services/`, `backend/app/spatial/`)
- **Purpose:** Transform raw telemetry into actionable municipal intelligence and statutory work orders.
- **Key Modules:**
  - `clustering.py` - Spatial DBSCAN clustering with GPS noise filtering and multi-pass concurrence validation.
  - `statutory_engine.py` - Maps traffic violations to Motor Vehicles Act (MVA) 1988/2019 sections, calculating fine amounts and finding nearest PCR units.
  - `anpr_engine.py` - Automated license plate recognition on Indian HSRP plates with lazy singleton OCR caching.
  - `evidence_vault.py` - Permanent forensic keyframe storage with DPDP privacy certification and automated TTL cleanup for transient video chunks.

### 4. Database & Persistence Tier (`backend/app/storage/`, `backend/app/models/`)
- **Purpose:** Transactional storage of road distress clusters, incident dockets, contractor penalty records, and fleet nodes.
- **Characteristics:**
  - SQLAlchemy models mapped to SQLite WAL mode (`roadsaathi.db`).
  - Connection hooks enabling `PRAGMA busy_timeout=15000` to prevent database locks under concurrent multi-bus writes.
  - In-memory mock store fallback (`mock_database.py`) ensuring zero downtime during demonstration and presentation environments.

### 5. WebGIS Presentation Tier (`frontend/src/`)
- **Purpose:** Integrated Command and Control Center (ICCC) dashboard for city administrators, traffic police, and PWD engineers.
- **Key Modules:**
  - `WebGISMap.tsx` - MapLibre GL map canvas rendering live traffic congestion, monsoon contours, OD desire lines, coverage gaps, and vehicle markers.
  - `CommandCenter.tsx` - Operational triage console with multi-criteria filtering, action queues, and live incident inspector.
  - `WorkOrderActionConsole.tsx` - Multi-pass concurrence inspection with before/after infill verification and contractor auto-debit ledger.

---

## Data Flows

### Telemetry Ingestion to WebGIS Display
1. `edge_agent.py` captures frame from dashcam -> runs quantized YOLO detection.
2. If hazard detected, packages GPS, defect code, vertical g-force, and snapshot URI.
3. Transmits to FastAPI `POST /api/telemetry/ingest`.
4. Ingest record added to database and queued for spatial DBSCAN clustering.
5. Telemetry packet broadcast over `/ws/telemetry` WebSocket connection.
6. Frontend `useTelemetrySocket` receives packet -> emits `roadsaathi:telemetry:fleet` DOM event.
7. `WebGISMap.tsx` directly calls `(map.getSource('bus-positions')).setData(...)` to render moving bus markers without React component re-rendering.

### Incident Enforcement & E-Challan Workflow
1. Traffic incident (e.g. Hit & Run, School Zone Violation) detected via rear/curbside bus camera.
2. Plate localized by OpenCV contour detector; characters read by EasyOCR.
3. If confidence >= 90%, automatically marked `AUTO_ADMISSIBLE` and e-Challan generated.
4. If confidence < 90%, routed to `/api/incidents/review-queue` for GCTP Traffic Safety Officer sign-off.
5. Officer reviews plate in dashboard -> issues `ACCEPT` or `CORRECT_PLATE`.
6. PCR Interceptor unit dispatched via WhatsApp gateway with direct geolocation coordinates.

---

*Codebase analysis: 2026-10-06*
