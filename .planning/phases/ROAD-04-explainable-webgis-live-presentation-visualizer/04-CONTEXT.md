# Phase 4 Context: Explainable WebGIS & Live Presentation Visualizer

**Phase:** 4 — Explainable WebGIS & Live Presentation Visualizer  
**Date:** 2026-10-06  
**Status:** Locked Decisions  
**Requirements Addressed:** GIS-01, GIS-02, GIS-03  

---

## 1. Executive Summary & Phase Boundaries

Phase 4 completes the presentation, explainability, and civic command interface of RoadSaathi v3.0. It delivers three critical user-facing capabilities:
1. **Explainable RPI Mathematical Model (`GIS-01`)**: An interactive Road Priority Index explainer modal ([`RPIFormulaModal.tsx`](file:///c:/Users/sauja/Downloads/roads/frontend/src/components/modals/RPIFormulaModal.tsx)) allowing municipal engineers and judges to inspect and dynamically tune the statutory formula terms (Severity 40%, Consensus Passes 20%, Road Hierarchy 20%, POI Proximity 20%, with Monsoon Multiplier), with real-time recalculation and P0/P1/P2 SLA category re-evaluation.
2. **Live Dashcam 30 FPS Visualizer (`GIS-02`)**: A synchronized dual-pane video perception modal ([`UploadFootageModal.tsx`](file:///c:/Users/sauja/Downloads/roads/frontend/src/components/modals/UploadFootageModal.tsx)) rendering 30 FPS bounding boxes, confidence tags, and pothole 3D depth meshes overlaid directly on HTML5 video via Canvas 2D/WebGL, synchronized with a live 5Hz AIS-140 IMU/GPS telemetry ticker and pre-bundled offline demonstration clips.
3. **PS 26124 Origin-Destination Transit Desire Lines Layer (`GIS-03`)**: An interactive WebGIS layer in MapLibre ([`WebGISMap.tsx`](file:///c:/Users/sauja/Downloads/roads/frontend/src/components/map/WebGISMap.tsx)) displaying curvature-interpolated GeoJSON Great Circle/Bezier desire lines connecting major transit hubs (Chennai Central, Guindy, Tambaram, OMR Tidel Park, Kathipara Cloverleaf) with passenger load volumes, peak flow matrices, and pavement roughness ridership penalties.

---

## 2. Locked Implementation Decisions

### Area 1: Explainable RPI Mathematical Modal (GIS-01)
- **D-01 (Formula Weights)**: The statutory Road Priority Index (RPI) follows the formula:
  $$\text{RPI} = \min\left(100.0, \left(0.40 \cdot S + 0.20 \cdot \min\left(100, 20 \cdot \log_2(1 + N)\right) + 0.20 \cdot W_{\text{road}} + 0.20 \cdot \max\left(0, 100 \left(1 - \frac{D_{\text{poi}}}{1500}\right)\right)\right) \cdot M_{\text{monsoon}}\right)$$
  where:
  - $S \in [0, 100]$: Raw defect severity score (Pothole D40 = 100, Alligator Crack D20 = 75, Ravelling D10 = 55).
  - $N \ge 1$: Multi-bus cross-pass consensus count ($\log_2$ scaling reaching ceiling at 32 passes).
  - $W_{\text{road}} \in [0, 100]$: Road hierarchy weight (National Highway / Expressway = 100, Major Arterial = 85, Collector = 70, Local = 50).
  - $D_{\text{poi}} \in [0, 1500]\text{ m}$: Geodesic distance to nearest hospital, school, or critical transit interchange.
  - $M_{\text{monsoon}} \in [1.0, 1.30]$: Seasonal precipitation distress expansion multiplier (default 1.15 in monsoon zones).
- **D-02 (Interactive Slider Recalculation)**: Sliders in [`RPIFormulaModal.tsx`](file:///c:/Users/sauja/Downloads/roads/frontend/src/components/modals/RPIFormulaModal.tsx) provide instantaneous live re-computation, immediately updating:
  - Numerical term breakdown cards ($T_1, T_2, T_3, T_4$).
  - Circular animated SVG score gauge ($0 - 100$).
  - Statutory SLA badge: P0 Critical ($\ge 85$, 24h SLA), P1 High ($\ge 70$, 48h SLA), P2 Routine ($< 70$, 72h SLA).
- **D-03 (Map Selection Interactivity)**: Clicking any cluster pin on [`WebGISMap.tsx`](file:///c:/Users/sauja/Downloads/roads/frontend/src/components/map/WebGISMap.tsx) pre-populates the modal with the specific cluster's live database parameters (depth, pass count, POI proximity, road hierarchy), allowing judges to inspect real-world civic evidence.

### Area 2: Live Dashcam Video Visualizer & 30 FPS Perception Tracking (GIS-02)
- **D-04 (Zero-Latency Canvas Overlay)**: Video perception uses client-side `<canvas>` layered on HTML5 `<video>` rendered at requestAnimationFrame (30 FPS), drawing:
  - Smooth tracking bounding boxes with color coding: Rose (`D40` Pothole), Emerald (`SMOOTH` Asphalt), Amber (`D20` Crack / `ZEBRA` Crossing), Cyan (`DIVIDER` Barrier), Violet (`ANPR` License Plate).
  - Pothole 3D depth mesh grid representation with estimated cavity volume ($V = \frac{\pi}{4} \cdot d^2 \cdot h$) and depth callout ($8.4\text{ cm}$).
- **D-05 (Synchronized Telemetry Sidecar)**: Side-by-side terminal ticker streaming 5Hz telematics synchronized with video timestamp:
  - GPS Coordinates, speed ($48.0\text{ km/h}$), vertical IMU acceleration ($g_z = 1.42g$), optical classification confidence ($96\%$).
- **D-06 (Bundled Offline Demonstration Scenarios)**: Bundles 4 pre-configured scenario clips:
  1. *NH-32 Highway Pothole Scan* (GST Road Tambaram • IRC:82 / DLP 3D Mesh)
  2. *Urban Highway Traffic & Assets* (Anna Salai Arterial • Multi-Class Perception & ANPR)
  3. *OMR 4K Expressway Corridor* (OMR IT Highway • Missing Divider & Infrastructure Radar)
  4. *Pedestrian Crosswalk Zone* (School Zone Crossing • IRC:35 Compliance)

### Area 3: PS 26124 Origin-Destination Transit Desire Lines (GIS-03)
- **D-07 (MapLibre GeoJSON Curved Arc Rendering)**: Transit flows are rendered as curvature-interpolated Bezier Great Circle arcs in GeoJSON over MapLibre GL.
- **D-08 (Flow Matrix & Dynamic Legend)**:
  - Line stroke width and gradient color represent daily passenger volume: Thin cyan ($< 10\text{k}$ passengers/day), Medium blue ($10\text{k} - 25\text{k}$), Thick amber/rose ($> 25\text{k}$ heavy arterial flow).
  - Hubs connected: Chennai Central, Guindy Intermodal, Tambaram Junction, OMR Tidel Park, Kathipara Cloverleaf, Koyambedu CMBT.
- **D-09 (Roughness Penalty Metric)**: Each transit link displays the IRI roughness index along the corridor, calculating the estimated transit travel delay and passenger comfort penalty caused by pavement distress.
- **D-10 (Toggleable WebGIS Layer Control)**: A dedicated toggle button in the map layer control panel allows toggling the "Transit Desire Lines (PS 26124)" layer on/off without interfering with defect clusters or fleet bus markers.

---

## 3. Canonical References

- **IRC:82:2015**: Code of Practice for Maintenance of Bituminous Roads.
- **IRC:SP:20:2002**: Rural Roads Manual (Clause 14 Defect Liability Period).
- **IRC:35:2015**: Code of Practice for Road Markings (Pedestrian Crosswalks & Lane Discipline).
- **PS 26124**: Problem Statement Specification for Origin-Destination Public Transit Passenger Flow & Infrastructure Corridor Optimization.
- **MapLibre GL JS v4**: Open-source WebGL/WebGIS vector tile mapping specification.

---

## 4. Codebase Assets & Integration Points

- `frontend/src/components/modals/RPIFormulaModal.tsx`: Interactive RPI slider and formula breakdown.
- `frontend/src/components/modals/UploadFootageModal.tsx`: Live 30 FPS video perception canvas and telemetry synchronization.
- `frontend/src/components/map/WebGISMap.tsx`: MapLibre GL instance, layers, markers, and OD transit desire arcs.
- `backend/app/api/endpoints/analytics.py`: Municipal analytics and transit statistics API.
- `backend/app/api/endpoints/traffic.py`: Traffic density, corridor bottleneck, and OD matrix endpoints.

---

## 5. Threat Model & UI Boundaries

- **T-04-01 (Large Video Client OOM / Crash)**: Client-side video uploads must validate file types (`video/mp4`, `video/webm`) and cap file sizes to 100MB, falling back to bundled sample clips if rendering in demo mode.
- **T-04-02 (WebGL Map Context Loss)**: GeoJSON layer updates for OD desire arcs must use efficient `setData()` calls rather than destroying and recreating MapLibre source layers on every render.
- **T-04-03 (Formula Boundary Violations)**: All sliders in `RPIFormulaModal.tsx` must clamp input ranges ($S \in [0, 100]$, $N \in [1, 50]$, $W \in [0, 100]$, $D \in [0, 1500]$, $M \in [1.0, 1.3]$) ensuring calculated RPI strictly stays within $[0, 100]$.
