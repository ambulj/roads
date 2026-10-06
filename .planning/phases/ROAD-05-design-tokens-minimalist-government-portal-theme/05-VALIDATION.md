# Phase 5 Validation Architecture: Design Tokens & Minimalist Government Portal Theme

**Phase:** 5 — Design Tokens & Minimalist Government Portal Theme  
**Date:** 2026-10-06  
**Requirements Addressed:** UI-01  

---

## 1. Automated Verification Commands

| Requirement | Scope | Automated Verification Command | Fails When |
|:---|:---|:---|:---|
| **UI-01** | Frontend Design Tokens, Theme Engine & Navigation | `npm --prefix frontend run build` | TypeScript compilation fails, invalid Tailwind classes used, or syntax errors in CSS variables. |
| **Full Regression** | Backend & Frontend Full Suite | `python -m pytest -o pythonpath=backend backend/tests/ edge/tests/ -q && npm --prefix frontend run build` | Any test failure or build failure. |

---

## 2. Quality & Accessibility Verification Checklist

1. **Typography Inspection**:
   - `--font-sans` correctly resolves to `"Inter", "Source Sans 3", system-ui, sans-serif`.
   - `--font-mono` correctly resolves to `"JetBrains Mono", Consolas, monospace`.
   - `tabular-nums` applied to telemetry dials, speedometers, and financial figures.
2. **WCAG AAA Contrast Compliance**:
   - Light mode text `#0F172A` on `#FFFFFF` / `#F8FAFC` ($\ge 7:1$ contrast ratio).
   - Dark mode text `#F8FAFC` on `#111827` / `#0B0F19` ($\ge 7:1$ contrast ratio).
   - Indigo accent `#4338CA` on white background ($\ge 4.5:1$ contrast ratio for UI controls).
3. **Theme Transition & Navigation**:
   - `ThemeToggle.tsx` toggles between Light, Dark, and Edge modes with smooth transition.
   - `SidebarNav.tsx` renders two distinct tiers (*Tier 1: On-Bus Edge Perception*, *Tier 2: Civic Command & Governance*) with active indicators.
