# Phase 7 Context: Municipal Dashboard, Work Orders & SLA Action Console Polish

**Phase**: `ROAD-07-municipal-dashboard-work-orders-sla-action-console-polish`
**Status**: Ready for Planning
**Requirement Mapped**: `UI-03`

---

## Executive Summary & Design Scope

Phase 7 delivers a polished executive municipal command experience for RoadSaathi administrators, field engineers, and civic officials. Building on the core backend SLA engine (Phase 3) and design token system (Phase 5), this phase elevates the executive dashboard, work orders backlog, and contractor financial action console with high-density KPI scorecards, animated SVG progress rings, intuitive multi-pass concurrence cards, and accessible tabular controls.

---

## Locked Implementation Decisions

### 1. Executive Dashboard & KPI Scorecards (`MetricCards.tsx`, `CommandCenter.tsx`, `Analytics.tsx`)
- **D-01**: Implement a high-density executive scorecard grid displaying core metrics:
  - Active Edge Buses (Tier 1 perception node health & live stream status).
  - 15m DBSCAN Defect Clusters (active vs resolved counts).
  - Traffic & ANPR Congestion Incidents.
  - Active PWD Work Orders (with 24h/48h SLA countdown timer).
  - Life-Safety Hazards (IS:1726 deep manholes & monsoon waterlogging).
- **D-02**: Feature animated SVG circular progress gauges and trend delta micro-pills (e.g. `+12.4% vs last week`, `99.2% on-time SLA`) with tabular monospace numerals (`tabular-nums font-mono`).

### 2. Contractor SLA Ledger & Financial Action Console (`ContractorSlaLedger.tsx`, `WorkOrderActionConsole.tsx`)
- **D-03**: Interactive tabbed modal action console (`WorkOrderActionConsole.tsx`):
  - **Tab 1: CAD & Defect Audit**: Inspection snapshot, RPI breakdown, statutory IRC:SP:20 Clause 14 references.
  - **Tab 2: Contractor Assignment & SLA**: Assignee details, security deposit escrow status, estimated completion window.
  - **Tab 3: Multi-Pass Concurrence & Payment Release**: Real-time 3-pass concurrence cards with bus badges (`bus_id`), pass timestamps, and vertical IMU $g_z$ telemetry readings ($|g_z - 1.0| < 0.15g$).
  - **Payment Clearance Gate**: 1-click `"Authorize Payment & Release Escrow"` CTA disabled with tooltip until $\ge 3$ distinct fleet bus passes verify smooth surface condition.
- **D-04**: Contractor Escrow & Auto-Debit Ledger (`ContractorSlaLedger.tsx`):
  - High-contrast summary cards showing total security deposit pool, cumulative penalties deducted, and debarment risk score.
  - Instant auto-debit trigger button calling `/api/contractors/penalties/auto-debit` with live toast feedback.

### 3. Accessible Work Order Backlog & Data Tables (`WorkOrders.tsx`, `CommandCenter.tsx`)
- **D-05**: High-density data table layout with sticky header, multi-column sorting (RPI score, SLA deadline, corridor, status), and filter chips (Severity P0/P1/P2, Contractor, SLA State).
- **D-06**: Integrated 1-click CSV/PDF export controls for statutory audit compliance.

---

## Verification & Guardrails

- **WCAG AAA Compliance**: High contrast text ($\ge 7:1$) on all status badges and buttons across light and dark modes.
- **Tabular Stability**: No layout shifting or text jittering on real-time metric updates.
- **Full Build & Test Integrity**: Zero TypeScript compilation errors (`npm --prefix frontend run build`) and regression-free test suite execution (`pytest backend/tests/ edge/tests/`).
