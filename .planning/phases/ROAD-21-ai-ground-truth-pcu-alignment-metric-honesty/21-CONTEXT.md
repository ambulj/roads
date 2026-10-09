# Phase 21 Context: AI Ground Truth, PCU Alignment & Metric Honesty

## Context Summary
- **Repo State Baseline:** Commit `263ccab` (Phase 20 complete & verified).
- **Audit Findings to Address:**
  1. *Finding 1.3: Numbers on screen are not measurements.*
     - In `backend/app/services/self_learning_engine.py`, `map_50` is computed via a synthetic random walk formula:
       ```python
       map_50 = round(min(0.985, (prec * 0.45) + (rec * 0.45) + (f1 * 0.10) + rng.uniform(0.01, 0.03)), 3)
       ```
     - Frontend displays an ungrounded 93.8% or 92.5% mAP@50 score.
     - The repository contains real weights trained on Roboflow/Kaggle datasets with known, empirical training performance:
       - `zebra.pt`: mAP50 = 0.993, Recall = 0.985, Precision = 0.978
       - `anpr.pt`: mAP50 = 0.693, Recall = 0.931, Precision = 0.812 (30 classes: 0..9, A..Z)
       - `potholedetection.pt`: mAP50 = 0.471, Recall = 0.450, Precision = 0.520
       - `vehicle_detection.pt`: mAP50 = 0.404, Recall = 0.410, Precision = 0.485
       - `indian_roads_detection.pt`: mAP50 = 0.219, Recall = 0.280, Precision = 0.310 (~35 classes: 2W, 3W, auto-rickshaw, cattle, barricades, etc.)
     - The AI performance dashboard must display the real model weights matrix instead of synthetic random walk approximations.
  2. *Finding 4.2 / Item 6: PCU Factors & Indian Traffic Classes.*
     - Code uses fragmented PCU factors across `pedestrian_safety.py`, `traffic_scoring.py`, and `risk_reasoning_engine.py`.
     - IRC:106-1990 "Guidelines for Capacity of Urban Roads in Plain Areas" provides official Table 1 urban equivalents:
       - Two-Wheeler (Motorcycle/Scooter): 0.5 PCU
       - Auto-Rickshaw (3W): 1.2 PCU
       - Car / Taxi: 1.0 PCU
       - Light Commercial Vehicle (LCV / Mini-Bus): 1.4 PCU
       - Bus / Heavy Truck: 2.2 PCU
       - Agricultural Tractor / Trailer: 4.0 PCU
       - Bicycle: 0.5 PCU
     - Wire `indian_roads_detection.pt` classes (`auto_rickshaw`, `two_wheeler`, etc.) to these standard PCU factors for live density and Level of Service (LoS) calculations.
  3. *Finding 5 / Item 10: Contrast & Accessibility / Claim Honesty.*
     - Code comments in `index.css` claimed "WCAG AAA", which is unsubstantiated for complex GIS dashboards.
     - Light-theme captions using `text-slate-400` (#94a3b8) on white/slate-50 backgrounds have poor contrast (~2.5:1), failing the 4.5:1 WCAG AA minimum.
     - Remediate light-theme muted text colors to `text-slate-600 dark:text-slate-400` and re-anchor marketing claims to verified WCAG 2.1 AA.

## Locked Decisions
- **D-21-01 (Ground Truth Model Weights Metrics Matrix)**: Eliminate synthetic active-learning mAP random walk formulas in `self_learning_engine.py`. Expose a structured ground truth training metrics matrix for all 5 on-disk models (`zebra.pt`, `anpr.pt`, `potholedetection.pt`, `vehicle_detection.pt`, `indian_roads_detection.pt`) and render it transparently in `EdgeAIAnalytics.tsx` and `SelfLearningStudio.tsx`.
- **D-21-02 (Official IRC:106-1990 Urban PCU Equivalents & Multi-Class Mapping)**: Unify PCU scoring in `traffic_scoring.py`, `pedestrian_safety.py`, and `risk_reasoning_engine.py` to official IRC:106 Table 1 urban values (2W 0.5, 3W 1.2, Car 1.0, LCV 1.4, Bus/Truck 2.2, Tractor 4.0, Cycle 0.5) mapped to `indian_roads_detection.pt` multi-class outputs.
- **D-21-03 (Light-Theme Contrast Remediation & WCAG Claim Honesty)**: Replace "WCAG AAA" claim in `index.css` with "WCAG 2.1 AA". Remediate low-contrast text classes across key dashboard cards to `text-slate-600 dark:text-slate-400` or `var(--text-muted)`.
