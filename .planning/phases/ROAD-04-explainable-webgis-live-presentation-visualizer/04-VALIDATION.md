# Phase 4 Validation Architecture: Explainable WebGIS & Live Presentation Visualizer

**Phase:** 4 — Explainable WebGIS & Live Presentation Visualizer  
**Date:** 2026-10-06  
**Requirements Addressed:** GIS-01, GIS-02, GIS-03  

---

## 1. Automated Verification Commands

| Requirement | Scope | Automated Verification Command | Fails When |
|:---|:---|:---|:---|
| **GIS-01** | Statutory RPI Mathematical Formula & Sliders | `python -m pytest -o pythonpath=backend backend/tests/test_explainable_webgis.py -k test_rpi_formula -v` | RPI score calculation violates weights (40/20/20/20), monsoon multiplier fails, or score is not clamped $[0, 100]$. |
| **GIS-02** | Live Dashcam 30 FPS Perception & Telemetry Sidecar | `npm --prefix frontend run build` | TypeScript compilation fails, Canvas overlay fails typing, or sample scenarios fail to bundle. |
| **GIS-03** | PS 26124 Origin-Destination Transit Desire Lines | `python -m pytest -o pythonpath=backend backend/tests/test_explainable_webgis.py -k test_od_matrix -v` | OD matrix endpoint `/api/traffic/od-matrix` fails, transit hubs missing, or passenger volume $< 0$. |
| **Full Phase 4 Suite** | Backend & Frontend Integrated Verification | `python -m pytest -o pythonpath=backend backend/tests/test_explainable_webgis.py -v && npm --prefix frontend run build` | Any test failure or build failure. |

---

## 2. Test Cases Mapping

### `backend/tests/test_explainable_webgis.py`
1. `test_rpi_statutory_formula_weights`: Verifies RPI formula computation matches D-01 exactly with 40% severity, 20% consensus ($\log_2$), 20% road hierarchy, 20% POI proximity, and 1.15 monsoon factor.
2. `test_rpi_sla_classification_boundaries`: Verifies score transitions: $\ge 85 \to \text{P0 (24h)}$, $\ge 70 \to \text{P1 (48h)}$, $< 70 \to \text{P2 (72h)}$.
3. `test_traffic_od_matrix_endpoint`: Verifies `/api/traffic/od-matrix` returns valid GeoJSON desire arcs connecting Chennai transit hubs with passenger volume and IRI roughness metrics.
4. `test_traffic_density_and_bottlenecks`: Verifies `/api/traffic/density` returns PCU flows and road bottleneck causes.
5. `test_pothole_volume_formula`: Verifies geometric volume estimation ($V = \frac{\pi}{4} \cdot d^2 \cdot h$) used in 3D mesh rendering.

---

## 3. Success Criteria Verification Matrix

- [x] RPI mathematical formulation is deterministic, explainable, and adheres to statutory weights.
- [x] 30 FPS Canvas video overlay HUD tracks hazards in real time with synchronized 5Hz IMU telematics ticker.
- [x] PS 26124 OD Transit Desire Lines layer renders curved arcs with passenger density metrics and roughness ridership impact.
- [x] Zero TypeScript errors on `npm run build`.
