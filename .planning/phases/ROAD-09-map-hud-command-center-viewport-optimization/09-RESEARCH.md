# Phase 9: Map HUD & Command Center Viewport Optimization — Research & Architecture

**Phase**: `ROAD-09-map-hud-command-center-viewport-optimization`  
**Requirement Mapped**: `DECLUTTER-02`  
**Status**: Research Complete  

---

## 1. Executive Overview & Problem Statement

In RoadSaathi's current operational UI, the primary Command Center viewport (`CommandCenter.tsx` and `WebGISMap.tsx`) suffers from vertical and lateral visual clutter that competes with the core WebGIS canvas:

1. **Vertical Viewport Compression (~120px overhead)**:
   - `CommandCenter.tsx` unconditionally displays a 5-card metric strip (`MetricCards.tsx`) immediately beneath the filter bar, consuming 120–140px of vertical space before the map canvas begins.
   - On standard 1080p and laptop screens (1366x768 / 1920x1080), this pushes the WebGIS canvas into a constrained vertical box, forcing unnecessary operator scrolling.

2. **Rigid Right-Hand Triage Dock (380–420px fixed footprint)**:
   - The right-hand triage and inspector pane occupies 380px (420px on XL screens) permanently, preventing operators from expanding the WebGIS map to 100% widescreen for spatial analysis without switching tabs.

3. **Intrusive Floating Map HUD Cards**:
   - In `WebGISMap.tsx`, active analytical layers (such as *Origin-Destination Transit Desire Lines (PS 26124)* and *Municipal Blind Spots*) spawn absolute floating cards at `top-14 right-3` and `top-14 center`.
   - These floating cards obscure the map canvas, corridor labels, and markers. Additionally, corridor elevation and roughness profiles lack a unified docking tray.

4. **Floating Map Controls Overhead**:
   - The top control bar in `WebGISMap.tsx` spans across the map header, competing with map markers and quick corridor navigation pills.

---

## 2. Technical Architectural Strategy

```
+-------------------------------------------------------------------------------------------------------+
| TOP EXECUTIVE TELEMETRY & FILTER BAR (H-11 / 44px)                                                    |
| [Search Input] | [Fleet: 5/5] [Hazards: 8] [Incidents: 7] | [Status v] [Severity v] [Reset] [KPI Grid v]|
+-------------------------------------------------------------------------------------------------------+
| (Collapsible Accordion MetricCards Strip - Hidden by default, +120px viewport gained)                |
+-------------------------------------------------------------------+-----------------------------------+
|                                                                   | RIGHT OPERATOR DOCK (COLLAPSIBLE) |
| WEBGIS MAP CANVAS (Maximized Viewport)                            |                                   |
|                                                                   | [Collapsed: 44px Rail]            |
|  [Micro-Dock: [Corridors...] [Compass] [Basemap] [Layers v]]     |  - Queue Badge (15)               |
|                                                                   |  - Inspector Icon                 |
|                                                                   |  - Expand Toggle >>               |
|                                                                   |                                   |
|                                                                   | [Expanded: 380px Slide-out]       |
|                                                                   |  - Tab: Triage Queue              |
|                                                                   |  - Tab: Forensic Inspector        |
|  +-------------------------------------------------------------+  |  - Full Multi-bus Consensus       |
|  | SLIDE-UP BOTTOM ANALYTICAL TRAY (Docked above Legend)       |  |                                   |
|  | [Icon] [Title: OD Desire Lines / Elevation Profile] [_] [X] |  |                                   |
|  | - Tabbed / Collapsible Content Sheet                        |  |                                   |
|  +-------------------------------------------------------------+  |                                   |
|  [Bottom Legend: Fleet | D40 | D20 | Waterlog]                    |                                   |
+-------------------------------------------------------------------+-----------------------------------+
```

---

## 3. Detailed Component Technical Designs

### 3.1 Collapsible Single-Line Top Executive Telemetry & Filter Bar (`CommandCenter.tsx`)

#### Objectives & Requirements:
- Condense the top area into a unified single-line 44px (`h-11` or `h-10`) executive telemetry and filter strip.
- Combine:
  1. Quick corridor / POI / defect search input (`w-60` to `w-72`).
  2. Live telemetry KPI badges: Online Fleet (`5/5 Active`), Active Hazard Clusters (`8`), Traffic Incidents (`7`).
  3. Status selector (`Active Triage` / `All Status` / `Verified Resolved`).
  4. Severity selector (`All Severities` / `Critical P0` / `High P1` / `Medium P2` / `Low P3`).
  5. Filter reset button (visible only when filters are active).
  6. **Executive KPI Toggle Button** (`LayoutGrid` or `BarChart3` icon with expand/collapse chevron) to open/close the full 5-card `MetricCards` grid on demand.
- **Default State**: Collapsed. Saves ~120px vertical space on initial page load.

#### Technical Implementation Details:
- State: `const [isMetricsExpanded, setIsMetricsExpanded] = useState<boolean>(false);`
- Animation & CSS: Smooth transition using `transition-all duration-300 ease-in-out` with `max-h-0 opacity-0 overflow-hidden` when collapsed and `max-h-96 opacity-100` when expanded.
- Preserves all real-time badge updates and filter logic (`filteredClusters`, `filteredIncidents`).

---

### 3.2 Collapsible Right-Hand Triage & Inspector Dock (`CommandCenter.tsx`, `PriorityQueue.tsx`, `OperatorInspectorPanel.tsx`)

#### Objectives & Requirements:
- Enable operators to toggle the right-hand panel between:
  1. **Compact Icon Rail (Collapsed State)**: 44px (`w-11`) width. Displays:
     - Collapse/Expand toggle icon (`ChevronsLeft` / `ChevronsRight` or `PanelRightClose` / `PanelRightOpen`).
     - Triage Queue icon with total item count badge (`hazardClustersCount + incidentCount`).
     - Forensic Inspector icon (with active selection indicator dot if a cluster/incident is currently inspected).
     - Vertical tooltips on hover for instant operator affordance.
  2. **Expanded Dock (Active State)**: 380px (`w-[380px]` or `xl:w-[420px]`). Displays full tab switcher (`Triage Queue` vs `Forensic Inspector`), filter pills, list items, and action consoles.
- **Zero WebGL Context Loss**:
  - The map container dynamically grows to occupy 100% width when the right dock collapses.
  - The existing `ResizeObserver` on `mapContainerRef` in `WebGISMap.tsx` automatically invokes `map.resize()` smoothly without remounting the canvas or dropping WebGL textures.

#### Technical Implementation Details:
- State in `CommandCenter.tsx`: `const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);`
- Rail click handling:
  - Clicking the "Queue" rail button sets `dockTab = 'queue'` and ensures `isDockCollapsed = false`.
  - Clicking the "Inspector" rail button sets `dockTab = 'inspector'` and ensures `isDockCollapsed = false`.
  - Clicking the collapse toggle flips `isDockCollapsed`.
- Mobile responsiveness: On viewports `< 1024px` (`lg`), dock renders as a clean bottom drawer or toggled full-width sheet without breaking map interaction.

---

### 3.3 Slide-Up Bottom Analytical Trays (`WebGISMap.tsx`)

#### Objectives & Requirements:
- Eliminate high-z-index floating cards at `top-14 right-3` (OD Desire Lines) and `top-14 center` (Municipal Coverage Blind Spots) that block camera navigation and top-level GIS layers.
- Implement unified **Slide-Up Bottom Analytical Trays** docked neatly above the map legend (`bottom-12 left-3 max-w-lg w-full z-20`).
- Trays supported:
  1. **OD Transit Desire Lines Sheet (PS 26124)**:
     - Aggregated passenger loads, peak flow PCU, corridor roughness delay penalties, and LoS ratings.
  2. **Municipal Blind Spots Sheet (Phase 2 Expansion)**:
     - Zero-pass streets, target vehicle classes (Swachh Bharat waste compactors, utility vans).
  3. **Corridor Elevation & Roughness Profile Sheet (`CORRIDOR_PROFILES`)**:
     - Interactive elevation (m MSL) and IRI roughness (m/km) line chart across chainage (km 0 to 18) for GST Road, OMR Expressway, and Anna Salai.
     - Interactive hover tooltip detailing chainage milestones.
- Tray UI controls:
  - Header with colored badge, title, and icon.
  - Minimize / Expand accordion button (`ChevronDown` / `ChevronUp`).
  - Close button (`X`) which turns off the respective layer or closes the profile view.

#### Technical Implementation Details:
- Unified Tray State:
  - `activeProfileCorridor`: GST Road / OMR Expressway / Anna Salai / null.
  - `isODTrayMinimized`: boolean.
  - `isCoverageTrayMinimized`: boolean.
  - `isProfileTrayMinimized`: boolean.
- Docking geometry: Docked at `bottom-12 left-3 sm:left-4 z-20 max-w-md lg:max-w-lg`. The map legend remains accessible below or alongside the sheet.

---

### 3.4 Minimalist WebGIS Top Micro-Dock (`WebGISMap.tsx`)

#### Objectives & Requirements:
- Refine the floating map control bar into a sleek capsule micro-dock (`h-9` / `h-10` backdrop-blur capsule) at `top-3 right-3`.
- Controls integrated:
  1. **Contained Corridor Quick-Jump Pills**: Horizontal scrollable container with smooth scroll indicators for Chennai arterial routes (*GST Road*, *Kathipara*, *OMR*, *Anna Salai*, *Central*).
  2. **Compass Bearing & Pitch Reset**: One-click return to North (`bearing: 0, pitch: 0`) with smooth camera interpolation.
  3. **Basemap Mode Switcher**: Quick toggle / cycle through `Dark`, `Street`, `Satellite`, `Topo` with active icon indicator.
  4. **10-Layer Analytical Dropdown Menu**:
     - Layer count badge (`10 Active`).
     - Click-outside detection via `useEffect` event listener.
     - Quick "Enable All" and "Reset Defaults" utility buttons.
  5. **Split-View / Fullscreen Toggle**: Compact icon button.

---

## 4. State Management & WebGL Context Preservation Strategy

A critical requirement is **Zero WebGL Context Recreation and Map Flicker** during layout transitions:

1. **MapLibre Lifecycle Guarding**:
   - `WebGISMap.tsx` initializes MapLibre once in `useEffect(..., [])` and stores the instance in `mapRef.current`.
   - Layout width/height adjustments in `CommandCenter.tsx` (collapsing top metric bar, expanding/collapsing right triage dock) alter the DOM container dimensions via CSS flex classes.
   - The active `ResizeObserver` on `mapContainerRef` detects dimension changes and triggers `map.resize()` on the next animation frame.
2. **Transition Class Timing**:
   - Using CSS transitions `transition-all duration-300 ease-in-out` on parent flex containers.
   - Debouncing or triggering `map.resize()` over the 300ms transition ensures fluid 60 FPS viewport scaling.

---

## 5. File Modification Plan

| File | Proposed Modifications |
|---|---|
| `frontend/src/pages/CommandCenter.tsx` | - Merge top search and filter bars into a 44px unified single-line telemetry bar.<br>- Add accordion toggle for `MetricCards` (collapsed by default, saving ~120px).<br>- Add collapsible state for right dock (44px vertical icon rail vs 380px full pane). |
| `frontend/src/components/map/WebGISMap.tsx` | - Refactor top control bar into a sleek minimalist micro-dock capsule.<br>- Move OD Desire Lines floating card and Coverage Blind Spots banner to docked bottom slide-up sheets above legend.<br>- Add interactive Corridor Elevation & Roughness Profile slide-up tray with chainage stats. |
| `frontend/src/components/triage/PriorityQueue.tsx` | - Ensure compact padding and fluid width adaptability for both 380px and responsive drawer widths. |
| `frontend/src/components/triage/OperatorInspectorPanel.tsx` | - Ensure responsive scroll and compact header layout inside collapsible dock. |

---

## 6. Validation Architecture

### 6.1 Automated Verification Command
```powershell
npm --prefix frontend run build
```
- Must produce 0 TypeScript compiler errors and 0 Vite bundle warnings.
- Clean chunk bundling for vendor map, vendor charts, and application pages.

### 6.2 Viewport & HUD Validation Checklist
1. **Top Executive Telemetry Bar**:
   - [ ] Default state has `MetricCards` collapsed; WebGIS map canvas vertical height increases by ~120px.
   - [ ] Clicking "KPI Scorecards" expands the 5-card grid with smooth transition.
   - [ ] Filter chips, search bar, and live telemetry counts (Fleet, Hazards, Incidents) are visible and functional in single-line mode.
2. **Right Triage Dock Collapse**:
   - [ ] Clicking collapse shrinks dock to 44px vertical rail with queue count badge and inspector shortcut.
   - [ ] WebGIS canvas expands to 100% widescreen width without WebGL context recreation or flickering.
   - [ ] Clicking the queue or inspector rail icons smoothly expands dock back to 380px.
3. **Slide-Up Bottom Analytical Trays**:
   - [ ] Enabling "OD Desire Lines" opens a bottom slide-up sheet docked above legend with minimize/expand and close actions.
   - [ ] Enabling "Coverage Blind Spots" displays a bottom slide-up sheet without obscuring top canvas.
   - [ ] Clicking corridor defect markers opens the interactive elevation & roughness profile tray.
4. **Minimalist Top Micro-Dock**:
   - [ ] Corridor pills scroll horizontally without layout overflow.
   - [ ] Layers menu opens with click-outside protection and layer count indicator.
   - [ ] Basemap mode switches instantly without reloading base styles.

---
*Research prepared for RoadSaathi Milestone v3.2 (DECLUTTER-02)*
