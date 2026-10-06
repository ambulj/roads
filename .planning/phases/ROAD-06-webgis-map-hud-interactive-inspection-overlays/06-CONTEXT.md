# Phase 6 Context: WebGIS Map HUD & Interactive Inspection Overlays

**Phase:** 6 — WebGIS Map HUD & Interactive Inspection Overlays  
**Date:** 2026-10-06  
**Status:** Locked Decisions  
**Requirements Addressed:** UI-02  

---

## 1. Executive Summary & Phase Boundaries

Phase 6 modernizes the primary WebGIS command center experience in RoadSaathi. It refines map interactions, replaces cluttered controls with a sleek floating glassy HUD dock, delivers high-contrast cluster inspection cards with instant 1-click RPI explainers, and provides an organized layer visibility menu for municipal GIS operators.

---

## 2. Locked Implementation Decisions

### Area 1: Modern Floating Map Control Dock & Quick Corridors
- **D-01 (Glassy Top Floating Dock)**:
  - Positioned top-center/right with `backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-float rounded-2xl`.
  - Quick corridor jump pills: GST Road, Kathipara Cloverleaf, OMR IT Expressway, Anna Salai CBD, Central Station Link with smooth `map.flyTo({ center, zoom, speed: 1.2 })` camera transitions.
  - Quick action controls: Split-view toggle, compass heading reset, and live telemetry inspection drawer trigger.

### Area 2: High-Contrast Cluster Inspection Popup Cards
- **D-02 (Inspection Card Architecture)**:
  - Clicking any defect pin renders a high-contrast floating card with crisp typography, before/after forensic thumbnail, defect code badge (`D40 Pothole`, `D20 Alligator Crack`), and pass consensus count.
  - Prominently displays the RPI score pill (color-coded P0 Critical / P1 High / P2 Routine).
  - Quick Action CTA button: "Inspect RPI Formula" (opening `RPIFormulaModal.tsx` pre-populated with live cluster parameters) and "Create / View Work Order".

### Area 3: Streamlined Layer Visibility Menu
- **D-03 (Unified Layer Panel)**:
  - Clean dropdown / accordion drawer for layer visibility toggles:
    1. *Defect Clusters & Potholes*
    2. *Transit Fleet Live Buses*
    3. *PS 26124 OD Transit Desire Lines*
    4. *Monsoon Inundation Flood Contours*
    5. *Sensitive POIs (Hospitals, Schools, Interchanges)*
    6. *Traffic Bottlenecks & Congestion*
  - Zero map re-initialization or WebGL context loss; uses MapLibre `setLayoutProperty('visibility')` and `setData()`.

---

## 3. Canonical References & Map Standards

- **MapLibre GL JS v4**: Modern open-source WebGL vector mapping engine.
- **Tailwind CSS Glassmorphism**: `backdrop-blur-md`, subtle borders, and elevated shadows.

---

## 4. Codebase Assets to Update

- `frontend/src/components/map/WebGISMap.tsx`: Main map component, floating HUD dock, popup cards, and layer controls.
- `frontend/src/components/modals/RPIFormulaModal.tsx`: Linkage to cluster inspection card.
- `frontend/src/services/api.ts`: Ensure fast cluster & incident lookups for map popups.

---

## 5. Threat Model & Boundaries

- **T-06-01 (WebGL Context Loss on Layer Toggle)**: Never recreate MapLibre map instances or source layers on toggle; update layer visibility flags or GeoJSON source data reactively.
- **T-06-02 (Mobile Viewport Overflow)**: Floating HUD dock and inspection cards must adapt responsively on smaller mobile screens (< 768px) collapsing into compact bottom sheets.
