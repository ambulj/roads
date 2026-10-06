# Phase 4 Discussion Log: Explainable WebGIS & Live Presentation Visualizer

**Phase:** 4 — Explainable WebGIS & Live Presentation Visualizer  
**Date:** 2026-10-06  
**Participants:** User & Antigravity  

---

## 1. Questions & Decisions

### Q1: Discussion Scope Selection
- **Question:** Which areas of Phase 4 (Explainable WebGIS & Live Presentation Visualizer) would you like to discuss and configure?
- **User Selection:** All 3 core areas: RPI Mathematical Explainer, Live Dashcam 30 FPS Canvas Tracking, and PS 26124 Origin-Destination Transit Desire Lines.
- **Outcome:** Comprehensive coverage across GIS-01, GIS-02, and GIS-03.

### Q2: RPI Formula Modal & Interactive Sliders (GIS-01)
- **Question:** For the RPI Formula Modal (GIS-01), how should the interactive factor explanation behave?
- **User Selection:** Dynamic interactive sliders allowing real-time formula recalculation (weights: 40% Severity, 20% Consensus, 20% Road Class, 20% POI Proximity * Monsoon Factor) with instant P0/P1/P2 SLA category re-evaluation.
- **Outcome:** Locked Decision D-01 through D-03.

### Q3: Live Dashcam Video Visualizer Architecture (GIS-02)
- **Question:** For the Live Dashcam Upload & Visualizer (GIS-02), what perception playback architecture do you prefer?
- **User Selection:** Client-side Canvas 2D/WebGL bounding box renderer synchronized with HTML5 video timeline and live 5Hz IMU/GPS telemetry ticker, with bundled zero-network sample video clips.
- **Outcome:** Locked Decision D-04 through D-06.

### Q4: PS 26124 Origin-Destination Transit Desire Lines (GIS-03)
- **Question:** For PS 26124 Origin-Destination Desire Lines (GIS-03), how should transit flows and zone-to-zone matrices be displayed on WebGIS?
- **User Selection:** Curvature-interpolated GeoJSON Great Circle / Bezier desire arcs rendered directly in MapLibre GL with thickness/color coded by daily passenger trip volume and interactive zone tooltip breakdown.
- **Outcome:** Locked Decision D-07 through D-10.

---

## 2. Summary of Locked Decisions

- **RPI Explainer**: Interactive 4-factor formula + Monsoon expansion multiplier with dynamic real-time slider re-evaluation and SLA reclassification.
- **Live Dashcam Tracking**: 30 FPS `<canvas>` synchronized on HTML5 video with 5Hz AIS-140 IMU telematics ticker and bundled offline demo scenarios.
- **OD Transit Desire Lines (PS 26124)**: MapLibre Bezier arc layer mapping Chennai transit flows with passenger volumes, peak loads, and road roughness delay penalties.
