# Roadmap: RoadSaathi v3.0

## Overview

RoadSaathi v3.0 delivers enterprise-scale municipal transit perception and financial enforcement. The roadmap transitions the architecture from single-city prototype to high-concurrency multi-fleet production: establishing PostgreSQL/PostGIS spatial clustering, zero-copy Rockchip RK3588 NPU acceleration, automated contractor defect liability auto-debits under IRC:SP:20 Clause 14, and explainable interactive WebGIS features.

## Phases

- [x] **Phase 1: Enterprise Scalability & Spatial Engine** - Dual SQLite/PostgreSQL engine, PostGIS spatial clustering, and connection pooling for 500+ buses.
- [x] **Phase 2: Edge NPU & Hardware Telematics Suite** - C++ RKNN2 zero-copy inference on Rockchip RK3588, INT8 OCR, and cellular reconnect watchdog.
- [x] **Phase 3: Contractor Financial Accountability & SLA Ledger** - IRC:SP:20 Clause 14 auto-debit penalty ledger, 36-month defect liability tracking, and multi-pass concurrence gates.
- [ ] **Phase 4: Explainable WebGIS & Live Presentation Visualizer** - Interactive RPI click-to-explain modal, live dashcam 30 FPS visualizer, and Origin-Destination desire lines (PS 26124).

---

## Phase Details

### Phase 1: Enterprise Scalability & Spatial Engine

**Goal**: Enable high-concurrency ingestion for large municipal fleets with sub-50ms spatial clustering and dual database support.
**Depends on**: Existing codebase foundation
**Requirements**: SCALE-01, SCALE-02, SCALE-03
**Success Criteria** (what must be TRUE):
  1. System seamlessly connects to PostgreSQL 16 + PostGIS 3.4 when configured in `.env`, while retaining SQLite WAL fallback for zero-dependency local demo runs.
  2. Spatial clustering queries over 100,000 historical passes execute in <50ms using native PostGIS R-Tree spatial indexing.
  3. Load testing demonstrates concurrent 5Hz telemetry streams from 500 simulated vehicle nodes without database connection timeouts.

**Plans**: 2 plans

Plans:
**Wave 1**
- [x] 01-01: Dual database dialect layer with SQLAlchemy and PostGIS spatial geometry mapping.

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 01-02: Native PostGIS spatial clustering queries and PgBouncer-compatible connection pool recycling.

---

### Phase 2: Edge NPU & Hardware Telematics Suite

**Goal**: Maximize onboard vehicle perception frame rates to 30+ FPS while drastically reducing edge thermal and memory footprints.
**Depends on**: Phase 1
**Requirements**: EDGE-01, EDGE-02, EDGE-03
**Success Criteria** (what must be TRUE):
  1. Zero-copy C++ RKNN2 pipeline executes on Rockchip RK3588 NPU achieving >=30 FPS sustained hazard detection at <12W board power.
  2. Vehicle edge license plate OCR uses INT8 quantized ONNX models, maintaining <150MB VRAM footprint without OOM errors.
  3. Edge telematics agent automatically recovers from simulated cellular blackouts and tunnel transitions via exponential jitter backoff without process crashes.

**Plans**: 2 plans

Plans:
**Wave 1**
- [x] 02-01: Zero-copy RKNN2 pipeline integration and INT8 quantized license plate model optimization.

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 02-02: Resilient edge watchdog loop with cellular network monitoring and depot Wi-Fi flush automation.

---

### Phase 3: Contractor Financial Accountability & SLA Ledger

**Goal**: Automate contractor defect liability recovery under IRC:SP:20 Clause 14, providing unassailable evidence to protect taxpayer road budgets.
**Depends on**: Phase 1, Phase 2
**Requirements**: LEDGER-01, LEDGER-02, LEDGER-03
**Success Criteria** (what must be TRUE):
  1. Recurrent surface distress within 36-month liability windows automatically calculates penalty debits according to IRC:SP:20 Clause 14 formula.
  2. Municipal contractor SLA ledger presents transparent debit accruals, repair turnaround countdowns, and escrow holdbacks.
  3. Work order verification requires multi-pass concurrence (minimum 3 independent bus passes across 48 hours + vertical IMU z-axis acceleration) before authorizing contractor invoice clearance.

**Plans**: 2 plans

Plans:
**Wave 1**
- [x] 03-01: IRC:SP:20 Clause 14 automated contractor penalty calculation and escrow ledger backend.

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 03-02: Work order multi-pass concurrence gating UI and contractor SLA audit console.

---

### Phase 4: Explainable WebGIS & Live Presentation Visualizer

**Goal**: Deliver an interactive, explainable WebGIS experience that lets municipal judges and civic stakeholders inspect formulas, video frames, and city-wide transit patterns.
**Depends on**: Phase 3
**Requirements**: GIS-01, GIS-02, GIS-03
**Success Criteria** (what must be TRUE):
  1. Clicking any road defect on MapLibre opens the interactive RPI Formula modal, rendering the live mathematical breakdown and contributing weights.
  2. Uploading a video clip in `UploadFootageModal.tsx` demonstrates real-time 30 FPS bounding box hazard tracking side-by-side with telemetry logs.
  3. MapLibre displays an interactive Origin-Destination (OD) Transit Desire Lines layer with zone-to-zone passenger flow matrices fulfilling PS 26124 requirements.

**Plans**: 2 plans

Plans:
- [ ] 04-01: Interactive RPI click-to-explain map integration and live 30 FPS dashcam upload video visualizer.
- [ ] 04-02: PS 26124 Origin-Destination transit desire lines layer and passenger flow matrix visualization.

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|---|---|---|---|
| 1. Enterprise Scalability & Spatial Engine | 0/2 | Not started | - |
| 2. Edge NPU & Hardware Telematics Suite | 0/2 | Not started | - |
| 3. Contractor Financial Accountability & SLA Ledger | 0/2 | Not started | - |
| 4. Explainable WebGIS & Live Presentation Visualizer | 0/2 | Not started | - |

---
*Roadmap defined: 2026-10-06*
