# Phase 9 Context: Map HUD & Command Center Viewport Optimization

**Phase**: `ROAD-09-map-hud-command-center-viewport-optimization`
**Status**: Ready for Planning
**Requirement Mapped**: `DECLUTTER-02`

---

## Executive Summary & Design Scope

Phase 9 declutters the primary spatial command center by maximizing WebGIS map canvas viewport real estate. It consolidates the top telemetry and search filters into a collapsible single-line executive bar, converts intrusive floating map cards into smooth slide-up bottom trays, enables collapsible 100% widescreen map expansion via an operator dock rail, and streamlines the top WebGIS control dock into a minimalist capsule.

---

## Locked Implementation Decisions

### 1. Collapsible Top Executive HUD (`CommandCenter.tsx`)
- **D-01**: Condense the search bar, status/severity filter chips, and KPI counters into a unified single-line top telemetry bar.
- **D-02**: Add a toggle button to expand/collapse the full 5-card `MetricCards` grid on demand, granting ~120px more vertical viewport to the WebGIS canvas by default.

### 2. Collapsible Operator Triage Dock (`CommandCenter.tsx`, `PriorityQueue.tsx`, `OperatorInspectorPanel.tsx`)
- **D-03**: Support collapsing the right-side triage dock into a compact 44px vertical icon rail (displaying queue badge counter, inspector icon, and quick expand toggle).
- **D-04**: Expanding the dock slides out the 380px triage queue or forensic inspector without causing WebGL context recreation or map resets.

### 3. Slide-Up Bottom Analytical Trays (`WebGISMap.tsx`)
- **D-05**: Convert intrusive floating overlays (OD Flow Matrix list, Municipal Coverage Blind Spots banner, Corridor Roughness/Elevation profiles) into unified slide-up bottom trays docked neatly above the legend.
- **D-06**: Each bottom tray includes a clean header with icon, title, collapse/expand toggle, and close button (`X`).

### 4. Minimalist WebGIS Top Micro-Dock (`WebGISMap.tsx`)
- **D-07**: Refine the floating dock into a sleek capsule with contained corridor navigation pills, compass reset, basemap switcher, and 10-layer analytical dropdown menu with click-outside protection.

---

## Verification & Guardrails

- **Zero WebGL Context Loss**: Collapsing/expanding top HUD and right dock must trigger smooth CSS layout transitions without re-mounting or flickering MapLibre canvas.
- **Responsive Layout**: Adapts cleanly from mobile viewports to 4K widescreen displays.
- **Build & Test Integrity**: `npm --prefix frontend run build` completes with 0 errors.
