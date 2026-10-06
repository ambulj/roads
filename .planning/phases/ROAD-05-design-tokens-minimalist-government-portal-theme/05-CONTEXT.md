# Phase 5 Context: Design Tokens & Minimalist Government Portal Theme

**Phase:** 5 — Design Tokens & Minimalist Government Portal Theme  
**Date:** 2026-10-06  
**Status:** Locked Decisions  
**Requirements Addressed:** UI-01  

---

## 1. Executive Summary & Phase Boundaries

Phase 5 establishes the modern, high-contrast, accessible government civic command center theme for RoadSaathi. It unifies color tokens, typography, and global navigation layouts into a sleek minimalist aesthetic that enhances data legibility for municipal engineers, civic administrators, and judicial reviewers.

---

## 2. Locked Implementation Decisions

### Area 1: Typography & Text Hierarchy
- **D-01 (Primary Sans Stack)**: Set primary font stack in CSS custom properties and Tailwind to:
  `font-sans: "Inter", "Source Sans 3", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;`
  (Replacing legacy serif variables).
- **D-02 (Telemetry Mono Stack)**: Set monospaced font stack for GPS coordinates, timestamps, $g_z$ readouts, and packet logs to:
  `font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;`
- **D-03 (Numerical Formatting)**: Enforce `tabular-nums` on all telemetry streams, RPI scores, financial counters, and speedometers to prevent layout jitter during real-time updates.

### Area 2: Minimalist Civic Color Tokens & Theme Engine
- **D-04 (Light Theme Palette - WCAG AAA Accessible)**:
  - Background Canvas: `#F8FAFC` (Slate-50)
  - Surface Card: `#FFFFFF` (Pure white) with 1px `#E2E8F0` border and subtle elevation shadow (`0 1px 3px rgba(0,0,0,0.04)`)
  - Primary Text: `#0F172A` (Slate-900)
  - Secondary Text: `#475569` (Slate-600)
  - Civic Accent: Deep Indigo `#4338CA` (Indigo-700) with hover `#3730A3` (Indigo-800)
- **D-05 (Dark Theme Palette - Obsidian Command)**:
  - Background Canvas: `#0B0F19` (Deep slate obsidian)
  - Surface Card: `#111827` (Slate-900) with 1px `#1F2937` border
  - Primary Text: `#F8FAFC` (Slate-50)
  - Secondary Text: `#94A3B8` (Slate-400)
  - Civic Accent: `#6366F1` (Indigo-500)
- **D-06 (Smooth Mode Transition)**: CSS color transitions (`transition-colors duration-150`) applied smoothly without jarring flashes or flickering map layers.

### Area 3: Global Navigation & Layout Architecture
- **D-07 (Two-Tier Sidebar Organization)**:
  - Clear section headers: *Tier 1: On-Bus Edge Perception* and *Tier 2: Civic Command & Governance*.
  - Active item state: Highlighted background with deep indigo accent left border and crisp text contrast.
  - Collapsible desktop state with tooltip labels and mobile drawer overlay.
- **D-08 (Header & Breadcrumbs)**: Clean sticky top navbar featuring municipal badge, active route breadcrumb, real-time backend connection heartbeat pill, and intuitive theme toggle button.

---

## 3. Canonical References & Design Standards

- **WCAG 2.1 Level AAA**: Contrast ratio $\ge 7:1$ for normal text and $\ge 4.5:1$ for large text/UI components.
- **Tailwind CSS v3.4**: Utility-first CSS framework with semantic custom color extensions.
- **Lucide Icons**: Consistent 18-20px stroke icon set.

---

## 4. Codebase Assets to Update

- `frontend/src/index.css`: Update `:root`, `html.dark`, and typography base rules.
- `frontend/tailwind.config.js`: Refine `colors.civic`, `fontFamily`, and `boxShadow` tokens.
- `frontend/src/context/ThemeContext.tsx`: Ensure clean light/dark/edge theme class application.
- `frontend/src/components/layout/SidebarNav.tsx`: Polish active states, badges, and two-tier typography.
- `frontend/src/components/common/ThemeToggle.tsx`: Modernize toggle button icon and tooltip.

---

## 5. Threat Model & UI Boundaries

- **T-05-01 (CSS Variable Cascade Bleed)**: Avoid hardcoded hex colors in child components; always consume Tailwind semantic utility classes or CSS custom properties.
- **T-05-02 (Theme Toggle Flicker)**: Persist user preference to `localStorage` and initialize the `<html>` class before first React render to prevent white flash in dark mode.
