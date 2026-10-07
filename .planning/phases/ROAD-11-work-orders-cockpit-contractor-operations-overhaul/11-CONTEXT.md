# Phase 11 Context: Work Orders Cockpit & Contractor Operations Overhaul

## Phase Overview
- **Phase**: `ROAD-11-work-orders-cockpit-contractor-operations-overhaul`
- **Milestone**: `v3.3` (Work Orders Cockpit & Contractor Operations Overhaul)
- **Requirements**: `WO-01`, `WO-02`, `WO-03`
- **Status**: Ready for Planning & Research

---

## Locked Decisions

### D-01: Visual Overhaul & Cockpit Styling
- Adopt a modern minimalist command cockpit design language with crisp contrast, unified design tokens, and high whitespace efficiency.
- Sleek top metrics strip containing:
  1. **Active Work Orders**: Total active defect repairs underway.
  2. **Critical P0 SLA Breaches / Countdowns**: Count of orders within 6h of SLA breach.
  3. **Total Escrow At Risk**: CAG / PFMS contractor retention deposits at stake (₹).
  4. **3-Pass Verified Repairs**: Multi-pass verified closures ready for payment release.

### D-02: 3-Sub-Workspace Layout Preservation & Polish
Maintain the 3 top in-workspace sub-tab switchers with active indigo pill styling:
1. **`cad` (CAD Work Orders Backlog)**:
   - Compact table cell padding (`py-2.5 px-3`) with subtle borders (`border-slate-200 dark:border-slate-800`).
   - Monospace tabular numerals (`font-mono tabular-nums text-xs`) for ticket codes, ₹ costs, and SLA countdowns.
   - Refined high-contrast severity pills (P0 rose, P1 amber, P2 slate).
   - Clustered action buttons: `Inspect` (CAD audit + 3D depth mesh), `Release Escrow` (3-pass concurrence gate), and `Dispatch` (instant WhatsApp/SMS ward dispatch).
   - Multi-column sorting, filter chips, and 1-click RFC 4180 CSV export.
2. **`kanban` (Interactive Modern Kanban Board)**:
   - Modernized Kanban cards with defect image thumbnails, live SLA countdown timer progress rings, contractor agency badges, and statutory concurrence status chips.
   - Smooth status transitions across 4 columns: `Assigned`, `In Progress`, `Resolved`, `Verified Closed`.
   - Quick card actions for 1-click CAD inspection and escrow release.
3. **`sla` (Contractor Financial SLA Ledger)**:
   - Elevated escrow security deposit summary, Clause 14 auto-debit triggers, debarment warnings, and PFMS payment vouchers.
   - Dual-view toggle between Performance SLA Table and Auto-Debit Audit Docket with printable voucher modal.

### D-03: Slide-Over Progressive Disclosure Drawer
- Trigger `WorkOrderActionConsole.tsx` seamlessly from both the CAD Backlog table and Kanban cards without full page navigation.
- 3-tab forensic audit: CAD & Defect Audit (before/after slider, volumetric asphalt calculator), Contractor Assignment & SLA (WhatsApp dispatch payload generator), and Multi-Pass Concurrence Payment Release.

---

## Boundaries & Non-Goals
- Frontend presentation and UX modernization; preserve all existing backend API contracts and 34 passing tests.
- Maintain responsive layout across desktop and mobile devices.
