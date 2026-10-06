# Requirements: RoadSaathi v3.0

**Defined:** 2026-10-06
**Core Value:** Empower municipal authorities with automated, unassailable, multi-pass verified road distress evidence that protects taxpayer funds through autonomous contractor liability enforcement and protects lives through proactive safety intervention.

## v1 Requirements (Milestone Scope)

### 1. Enterprise Scalability & Spatial Engine (SCALE)

- [x] **SCALE-01**: System provides dual-dialect database support for both SQLite WAL (local testing/demo) and PostgreSQL 16 + PostGIS 3.4 (production multi-fleet).
- [x] **SCALE-02**: Road hazard clustering utilizes spatial R-Tree indexing (`ST_DWithin` / `ST_ClusterDBSCAN`) to handle >100,000 historical passes with sub-50ms query latency.
- [x] **SCALE-03**: Backend connection pool utilizes async connection recycling with PgBouncer compatibility to support 500+ concurrent fleet buses streaming 5Hz telematics.

### 2. Edge NPU & Hardware Telematics Suite (EDGE)

- [x] **EDGE-01**: C++ RKNN2 zero-copy pipeline (`edge/rknn_pipeline.cpp`) runs multi-model road hazard inference on Rockchip RK3588 NPU at >=30 FPS with <12W power consumption.
- [x] **EDGE-02**: License plate recognition supports INT8 quantized ONNX inference on vehicle edge devices, reducing memory footprint to <150MB VRAM.
- [x] **EDGE-03**: Edge telematics agent includes automatic cellular watchdog thread with exponential jitter backoff that recovers from network dead zones without daemon restart.

### 3. Contractor Financial Accountability & SLA Ledger (LEDGER)

- [x] **LEDGER-01**: System calculates automated contractor debit penalties under IRC:SP:20 Clause 14 based on defect recurrence within the mandatory 36-month liability period.
- [x] **LEDGER-02**: Contractor SLA ledger displays cumulative debit accrual, escrow holdbacks, defect recurrence velocity, and repair turnaround countdowns.
- [x] **LEDGER-03**: Work order action console enforces multi-pass concurrence validation (minimum 3 independent bus passes + IMU confirmation) before releasing contractor repair payments.

### 4. Explainable WebGIS & Live Visualizer (GIS)

- [x] **GIS-01**: Interactive RPI Formula modal (`RPIFormulaModal.tsx`) dynamically recalculates and displays mathematical factors (depth, volume, traffic multiplier, age penalty, passenger exposure) when clicking any defect on the map.
- [x] **GIS-02**: Live Dashcam Upload modal (`UploadFootageModal.tsx`) ingests sample video clips and renders real-time 30 FPS bounding box hazard overlays side-by-side with telemetry logs.
- [x] **GIS-03**: MapLibre WebGIS provides an interactive Origin-Destination (OD) Transit Desire Lines layer with zone-to-zone daily trip volumes and passenger load metrics (PS 26124).

---

## v1.1 Requirements (Milestone v3.1: Modern Civic Portal & UI/UX Polish)

### 5. Modern Civic Design System & Theme Polish (CIVIC)

- [ ] **UI-01**: Implement unified modern government portal design system with refined white/indigo & slate design tokens, crisp typography, WCAG AAA accessibility, and seamless dark/light mode switching.

### 6. WebGIS Map HUD & Inspection Controls (MAP-UI)

- [ ] **UI-02**: Modernize MapLibre WebGIS controls with a sleek floating HUD dock, responsive sidebar split-view, high-contrast cluster inspection cards, and streamlined layer visibility selector.

### 7. Municipal Dashboard & SLA Action Console Polish (DASH-UI)

- [ ] **UI-03**: Polish municipal executive dashboard and contractor SLA action console with high-density KPI scorecards, accessible data tables, contractor escrow status pills, and intuitive 3-pass concurrence payment clearance workflow.

---

## v2 Requirements (Deferred to Future Milestones)

- **DRONE-01**: Autonomous aerial drone survey integration for highway corridor inspections.
- **BRIDGE-01**: Structural vibration resonance analysis for major bridge joints and flyover expansion bearings.
- **CITIZEN-01**: WhatsApp chatbot enabling citizens to report road hazards with geo-tagged optical verification.

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Continuous raw 1080p video streaming over cellular | Cellular data costs for 500 buses streaming 24/7 are prohibitive; system uses edge perception with metadata + keyframe transmission. |
| Proprietary multi-beam LiDAR sensor packages | Hardware costs exceed municipal retrofit budget target of ₹15,000 INR per vehicle. |
| Automatic banking auto-clearing integration (NACH) | Financial statutory regulations require municipal engineer digital signature sign-off before executing electronic bank debits. |

---

## Traceability Matrix

| Requirement | Milestone | Phase | Status |
|---|---|---|---|
| SCALE-01 | v3.0 | Phase 1 | Complete |
| SCALE-02 | v3.0 | Phase 1 | Complete |
| SCALE-03 | v3.0 | Phase 1 | Complete |
| EDGE-01 | v3.0 | Phase 2 | Complete |
| EDGE-02 | v3.0 | Phase 2 | Complete |
| EDGE-03 | v3.0 | Phase 2 | Complete |
| LEDGER-01 | v3.0 | Phase 3 | Complete |
| LEDGER-02 | v3.0 | Phase 3 | Complete |
| LEDGER-03 | v3.0 | Phase 3 | Complete |
| GIS-01 | v3.0 | Phase 4 | Complete |
| GIS-02 | v3.0 | Phase 4 | Complete |
| GIS-03 | v3.0 | Phase 4 | Complete |
| UI-01 | v3.1 | Phase 5 | Pending |
| UI-02 | v3.1 | Phase 6 | Pending |
| UI-03 | v3.1 | Phase 7 | Pending |

**Coverage:**
- Total Requirements: 15
- Mapped to Phases: 15
- Completed: 12 / 15 (80%)
- Active in Milestone v3.1: 3

---
*Requirements updated: 2026-10-06 for Milestone v3.1*
