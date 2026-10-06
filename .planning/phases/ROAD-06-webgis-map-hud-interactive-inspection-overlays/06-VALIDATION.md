# Phase 6 Validation Architecture: WebGIS Map HUD & Interactive Inspection Overlays

**Phase:** 6 — WebGIS Map HUD & Interactive Inspection Overlays  
**Date:** 2026-10-06  
**Requirements Addressed:** UI-02  

---

## 1. Automated Verification Commands

| Requirement | Scope | Automated Verification Command | Fails When |
|:---|:---|:---|:---|
| **UI-02** | WebGIS Map Floating Dock, Inspection Popups & Layer Controls | `npm --prefix frontend run build` | TypeScript compilation fails, MapLibre layer method errors, or invalid Tailwind classes. |
| **Full Regression** | Backend & Frontend Full Suite | `python -m pytest -o pythonpath=backend backend/tests/ edge/tests/ -q && npm --prefix frontend run build` | Any test failure or build failure. |

---

## 2. Interactive Map UX Verification Checklist

1. **Floating Map Control Dock**:
   - Renders at top-center/right with glassy backdrop blur (`backdrop-blur-md`).
   - Quick corridor pills (GST Road, Kathipara, OMR, Anna Salai, Central Station) smoothly animate camera with `map.flyTo`.
   - Split-view toggle, compass reset, and telemetry drawer buttons trigger without layout disruption.
2. **Cluster Inspection Cards**:
   - Clicking a defect pin displays a sleek floating card with forensic photo thumbnail, defect code, pass count, and RPI score pill.
   - "Inspect RPI Formula" button opens `RPIFormulaModal.tsx` pre-populated with the clicked cluster's live parameters.
3. **Layer Visibility Control**:
   - Toggles Defect Clusters, Transit Buses, PS 26124 OD Desire Lines, Monsoon Flood Zones, POIs, and Traffic Bottlenecks reactively using `setLayoutProperty` without WebGL context loss.
