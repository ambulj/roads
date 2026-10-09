# Phase 16 Validation Map: 3D Corridor Digital Twin & Surface Mesh Visualizer (Concept Prototype)

## Validation Scope & Requirements Traceability

| Requirement | Description | Validation Strategy | Automated Command | Target Artifacts |
|---|---|---|---|---|
| **TWIN-01** | Interactive 3D Corridor Digital Twin & Surface Elevation Mesh Viewer with depth cavity slicing, elevation contours, textured/wireframe display modes, and prominent "Experimental Concept / Proof of Concept" badging and disclaimer. | TypeScript compilation, WebGL scene inspection, cut-plane slider reactive volume & cost recalculation, and UI banner presence verification. | `npm --prefix frontend run build` | `frontend/src/components/modals/RoadMeshVisualizerModal.tsx`, `frontend/src/components/map/WebGISMap.tsx`, `frontend/src/pages/CommandCenter.tsx`, `frontend/src/pages/WorkOrders.tsx` |
| **TWIN-02** | Multi-camera perspective viewer supporting exterior bus angles (front windshield, rear road surface, left curb, right carriageway) with synchronized spatial telemetry and inspection HUD overlays. | Component unit/UI verification, telemetry strip HUD overlay rendering, perspective dock switching test. | `npm --prefix frontend run build` | `frontend/src/components/modals/RoadMeshVisualizerModal.tsx` |
| **D-16-01** | Persistent Concept Disclaimer Banner & Warning Badge in headers and triggers. | Verify non-dismissible amber/indigo banner exists in modal and `(Concept)` badges appear on triggers. | `npm --prefix frontend run build` | `RoadMeshVisualizerModal.tsx`, `WebGISMap.tsx`, `WorkOrders.tsx`, `WorkOrderActionConsole.tsx` |
| **D-16-02** | 3D Surface Mesh & Depth Slicing Modes (0–25cm slider, dynamic volume/cost, contour heatmap, POV camera). | Verify Three.js cut-plane rendering, mathematical volume integration, color gradient, and POV toggle. | `npm --prefix frontend run build` | `RoadMeshVisualizerModal.tsx` |
| **D-16-03** | 4-Channel Exterior Perspective Switcher with synchronized telemetry HUD. | Verify CAM-01 through CAM-04 channels and synchronized $v_{km/h}$, $G_{norm}$, timestamp, and bus ID HUD. | `npm --prefix frontend run build` | `RoadMeshVisualizerModal.tsx` |
| **D-16-04** | Dual Access Triggers (WebGIS Map popup & Work Orders CAD Backlog drawer). | Verify popup click and drawer action trigger modal binding pre-populated with defect telemetry. | `npm --prefix frontend run build` | `WebGISMap.tsx`, `CommandCenter.tsx`, `WorkOrders.tsx`, `WorkOrderActionConsole.tsx` |
| **REGRESSION** | Zero regression across existing backend services and test batteries. | Execute full backend test battery across Copilot engine, contractor ledger, concurrence gating, and physics. | `pytest -o pythonpath=backend backend/tests/test_copilot_engine.py backend/tests/test_contractor_ledger.py backend/tests/test_concurrence_gating.py backend/tests/test_telematics_physics.py -q` | `backend/tests/*` |

---

## Validation Pipeline Architecture

### 1. Automated Backend Test Suite
The automated test runner validates that existing backend endpoints and calculations remain intact with 0 regressions:
```powershell
pytest -o pythonpath=backend backend/tests/test_copilot_engine.py backend/tests/test_contractor_ledger.py backend/tests/test_concurrence_gating.py backend/tests/test_telematics_physics.py -q
```

#### Test Invariants:
1. `backend/tests/test_copilot_engine.py`: Verifies copilot queries (defects, contractor penalties, corridor safety rankings, Form 14 notice drafting) pass without regression.
2. `backend/tests/test_contractor_ledger.py`: Verifies contractor debarment thresholds, Clause 14 liquidated damages, and escrow balance tracking.
3. `backend/tests/test_concurrence_gating.py`: Verifies relaxed multi-pass patrol concurrence (3 passes over 48h) and payment release safety gating.
4. `backend/tests/test_telematics_physics.py`: Verifies speed-normalized vertical acceleration ($G_{norm} = \frac{\Delta G_z}{v / 30}$), heading-aware corridor snapping ($\pm 30^\circ$), and axle delay compensation.
5. **Success Criterion**: 54/54 tests pass with 0 failures.

---

### 2. Frontend Compilation & Type Safety
Verifies full TypeScript type safety, Three.js WebGL compatibility, and production bundling:
```powershell
npm --prefix frontend run build
```

#### Success Criteria:
1. **Zero TypeScript Errors**: All component interfaces (`RoadMeshVisualizerModalProps`, `WorkOrderActionConsoleProps`, `WebGISMapProps`) typecheck cleanly.
2. **Vite Bundle Generated**: Complete client-side production build generated in `frontend/dist/`.
3. **WebGL Lifecycle Safety**:
   - Canvas properly mounts inside modal on open.
   - Resource disposal hook unloads geometries, materials, and textures without GPU memory leaks upon modal close.
   - RequestAnimationFrame loop cancels cleanly on component unmount.
4. **Interactive Cut-Plane Slider**:
   - Sliding cut-plane between $0$ and $25\text{ cm}$ updates cavity fill volume ($V$) and PWD SOR cost without React re-render lag or WebGL pipeline recreation.
5. **Multi-Camera Perspective Dock**:
   - Toggling among CAM-01, CAM-02, CAM-03, CAM-04 renders the appropriate exterior angle and telemetry overlays.
6. **Dual Entry Binding**:
   - Launching from WebGIS Map popup correctly populates the modal with the clicked cluster's telemetry.
   - Launching from Work Orders CAD Backlog drawer or table correctly populates the modal.

---
