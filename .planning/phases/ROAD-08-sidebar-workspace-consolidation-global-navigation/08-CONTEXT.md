# Phase 8 Context: Sidebar Workspace Consolidation & Global Navigation

**Phase**: `ROAD-08-sidebar-workspace-consolidation-global-navigation`
**Status**: Ready for Planning
**Requirement Mapped**: `DECLUTTER-01`

---

## Executive Summary & Design Scope

Phase 8 is the foundational step of Milestone v3.2 (Sleek Minimalist Civic Cockpit & UI De-cluttering). It eliminates navigation bloat by consolidating the 16+ scattered navigation links and sub-routes into **5 core intuitive municipal workspaces**. It implements clean in-page sub-tab navigation switchers, refines the responsive sidebar collapse behavior, and modernizes the mobile bottom navigation bar.

---

## Locked Implementation Decisions

### 1. 5 Consolidated Core Workspaces (`SidebarNav.tsx`, `App.tsx`)
- **D-01**: Consolidate global navigation into 5 primary workspaces:
  1. 🗺️ **Command Center & Map** (`command`): WebGIS Map & Live Pothole / Defect Triage.
  2. 📋 **Work Orders & SLA** (`work-orders`): PWD CAD Backlog & Contractor Financial SLA Ledger.
  3. 📊 **Safety & Traffic Analytics** (`analytics`): Transit Corridors, Traffic Incidents, Pedestrian Safety, and ANPR.
  4. 🚌 **Fleet Perception & Edge** (`fleet`): Fleet Edge Nodes & Dashcam Video Ingest.
  5. 🛡️ **Governance & Memory** (`memory`): Spatial Road Intelligence, Statutory MoHUA Audit Logs, and Settings.
- **D-02**: All other historical secondary routes automatically map or redirect to their parent workspace with appropriate sub-tab selection.

### 2. Workspace Sub-Tab Switchers (`SidebarNav.tsx`, `WorkOrders.tsx`, `FleetNodes.tsx`, `Analytics.tsx`, `RoadMemory.tsx`)
- **D-03**: Sub-features are accessed via sleek, high-contrast sub-tab switchers positioned cleanly in the workspace header bar (e.g. `[CAD Backlog] [Contractor SLA Ledger]` in WorkOrders; `[Fleet Nodes] [Dashcam Ingest]` in FleetNodes; `[Road Intelligence] [Statutory Audit]` in RoadMemory).
- **D-04**: Active tab indicators use subtle indigo pill styling (`bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800/80`).

### 3. Responsive Collapse & Mobile Navigation (`BottomNav.tsx`, `SidebarNav.tsx`)
- **D-05**: Sidebar collapse mode shows compact icon pills with floating high-contrast tooltips.
- **D-06**: Mobile bottom navigation displays 4 primary touch targets ([Map], [Orders], [Analytics], [Fleet]) with a "More" drawer trigger for Governance & System Settings.

---

## Verification & Guardrails

- **Zero Route Regressions**: All 5 consolidated workspaces load without 404s, broken imports, or missing permissions.
- **Build Integrity**: `npm --prefix frontend run build` completes with 0 errors.
- **Accessibility & Contrast**: High-contrast WCAG AAA compliance ($\ge 7:1$) on all active and inactive nav states in Light, Dark, and Cyber-Edge themes.
