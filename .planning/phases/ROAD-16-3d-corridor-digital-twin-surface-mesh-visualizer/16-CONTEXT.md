# Phase 16 Context: 3D Corridor Digital Twin & Surface Mesh Visualizer (Concept Prototype)

## Phase Domain & Goals
Equip municipal engineers and commanders with an interactive 3D road surface elevation & cavity depth mesh explorer to visually inspect pavement structural distress, simulate cross-sectional depth slicing, and switch between multi-camera exterior perspectives (front, rear, left, right exterior angles).

> **CRITICAL MANDATORY CONSTRAINT (D-16-01)**: The 3D surface elevation mesh and corridor reconstruction are strictly designated and scoped as an **Experimental Concept / Proof of Concept Prototype for now** in all UI headers, inspection modal banners, tooltips, and documentation. It is synthesized from monocular camera depth + IMU elevation profiles, not high-cost LiDAR rigs.

---

## Locked Decisions

### D-16-01: Prominent Concept Disclaimer Banner & Warning Badge
- **Persistent Header Banner**:
  - `RoadMeshVisualizerModal.tsx` and any corridor twin view renders a persistent, non-dismissible amber/indigo concept banner:
    *"⚠️ Experimental Concept / Proof-of-Concept Prototype: Pavement 3D surface mesh synthesized from monocular dashcam depth + IMU elevation profile (Non-LiDAR exploratory prototype)"*.
- **Concept Pill Badge**:
  - Modal title and entry triggers display an explicit `Concept Prototype` / `Experimental` tag pill.
- **Informative Tooltip**:
  - Explains the sensor fusion derivation (camera depth estimation + velocity-normalized $G_{norm}$ vertical shock) and clarifies that it is an exploratory visualization rather than millimeter-grade survey LiDAR.

### D-16-02: 3D Surface Mesh & Depth Slicing Modes
- **Interactive Depth Slicing Slider**:
  - A depth cut-plane slider allowing engineers to slice horizontally through the road cavity (from 0 cm at surface grade down to 25+ cm cavity base).
  - Dynamically calculates the estimated asphalt fill volume (liters) and repair cost below the sliced depth threshold.
- **Elevation Contour Heatmaps**:
  - High-contrast color gradient applied to the 3D vertex mesh:
    - Emerald Green (0 cm, smooth surface baseline)
    - Goldenrod Amber (1–5 cm, minor rutting/subsidence)
    - Crimson Red (> 5 cm, critical P0 void / structural cavity).
- **Mesh Display Modes**:
  - One-click toggle between **Textured Solid**, **Wireframe Matrix**, and **Color-Coded Depth Contour**.
- **Inspection Camera Modes**:
  - Orbit Turntable view (360° rotation, pitch, and zoom) + Virtual Walking / Driver POV view.

### D-16-03: Multi-Camera Exterior Perspective Switcher
- **4-Channel Exterior Perspective Switcher**:
  - Fulfills the Problem Statement requirement for multi-camera bus sensing by providing a synchronized 4-camera perspective dock:
    1. **Front Windshield Dashcam** (Primary optical hazard detection)
    2. **Rear Road Surface Overview** (Trailing axle shock & trailing distress inspection)
    3. **Left Curb / Footpath View** (Curb subsidence, sidewalk clearance, open manholes)
    4. **Right Carriageway / Overtaking Lane** (Dividers, lane encroachment, traffic flow)
- **Synchronized Telemetry Strip**:
  - Each camera angle displays synchronized vehicle telemetry: camera angle label, GPS timestamp, vehicle speed ($v_{km/h}$), normalized shock ($G_{norm}$), and detected bus ID.

### D-16-04: Dual Entry Points with (Concept) Badging
- **WebGIS Map Inspection Popup**:
  - In `CommandCenter.tsx` / `WebGISMap.tsx`, defect cluster inspection popups render a prominent button: **"Inspect 3D Surface Mesh (Concept)"**.
- **Work Orders CAD Backlog Table & Action Drawer**:
  - In `WorkOrders.tsx`, CAD table rows and the `WorkOrderActionConsole.tsx` drawer render an **"Inspect 3D Corridor Mesh (Concept)"** action trigger.
- **Seamless Modal Binding**:
  - Clicking either trigger launches `RoadMeshVisualizerModal.tsx` pre-bound to the active defect's telemetry, depth, volume, and multi-camera perspectives.

---

## Technical Constraints & Boundaries

- **Ponytail Simplicity**:
  - Build upon the existing Three.js implementation inside [`RoadMeshVisualizerModal.tsx`](file:///c:/Users/sauja/Downloads/roads/frontend/src/components/modals/RoadMeshVisualizerModal.tsx).
  - No bloated external LiDAR point cloud loaders or heavy external 3D engines; use procedural geometry with vertex displacement based on depth telemetry.
- **Performance**:
  - WebGL rendering locked to 60 FPS without memory leaks (clean resource disposal on modal close).
- **Build & Test Invariants**:
  - Zero TypeScript compiler errors on `npm --prefix frontend run build`.
  - Maintain 100% test pass rate across existing 54 backend unit & regression tests.
