# Phase 9 Discussion Log: Map HUD & Command Center Viewport Optimization

**Date**: 2026-10-07
**Participants**: User, Antigravity AI

---

## Discussion Record

### Area 1: Top MetricCards HUD Layout
- **Question**: How should the top MetricCards strip in CommandCenter be structured to maximize map height?
- **Options**:
  - *(Selected)* Collapsible Top HUD: Metric cards and filter bar condense into a sleek 1-line executive telemetry bar with an expand/collapse toggle for full KPI details.
  - Fixed compact 2-tier bar with mini-metric pills.
- **Outcome**: Confirmed collapsible single-line executive bar saving ~120px vertical height.

### Area 2: Right Triage & Inspector Dock
- **Question**: How should the right-hand Triage & Inspector panel behave?
- **Options**:
  - *(Selected)* Collapsible Right Dock: Allow the triage queue and inspector dock to slide in/out or collapse into a 40px icon rail for a full 100% widescreen map experience.
  - Fixed 35% right sidebar split.
- **Outcome**: Confirmed collapsible dock with 44px icon rail state and 380px expanded state.

### Area 3: Secondary Map Overlays Placement
- **Question**: Where should secondary map analytical overlays (OD matrix list, coverage blind spots, elevation profiles) be displayed?
- **Options**:
  - *(Selected)* Slide-up bottom tray: Floating analytics cards (OD Flow List, Blind Spots, Roughness Profiles) slide up smoothly from the bottom edge as compact sheets with minimize/close buttons.
  - Modal dialogs: Open in centered popup dialogs over the map.
- **Outcome**: Confirmed slide-up bottom trays with header controls.

---

## Next Steps
- Run `/gsd-plan-phase 9` to research, author, and verify execution plan (`09-01-PLAN.md`).
