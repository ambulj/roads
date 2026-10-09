# Phase 17 Discussion Log: Multi-Camera Urban Sensing & Missing Infrastructure Perception

## Discussion Metadata
- **Date**: 2026-10-09
- **Phase**: 17 — Multi-Camera Urban Sensing & Missing Infrastructure Perception
- **Participants**: User, Antigravity Agent

---

## Areas Discussed & User Selections

### Area 1: Infrastructure Deficiencies (IRC:35/IRC:67) Classification
- **Question**: How should road infrastructure deficiencies and waterlogging be classified in the perception schema?
- **Options Presented**:
  1. (Recommended) IRC Standards-Aligned Perception Schema (Explicit classification: MISSING_ROAD_DIVIDER, MISSING_ZEBRA_CROSSING per IRC:35, DAMAGED_TRAFFIC_SIGN per IRC:67, and WATERLOGGING_HAZARD with depth estimate in cm)
  2. Generic Municipal Asset Tagging (Single bucket "INFRASTRUCTURE_ISSUE" with freeform text description)
- **User Selection**: **IRC Standards-Aligned Perception Schema (Option 1)**
- **Implication**: Strict compliance with Indian Road Congress codes (IRC:35 for road markings, IRC:67 for road signs) and quantifiable waterlogging depth metrics.

---

### Area 2: School Zone & Vulnerable Pedestrian Safety Protocol
- **Question**: How should vulnerable pedestrian and school children safety situations be handled?
- **Options Presented**:
  1. (Recommended) Vision Zero School Zone Alerting (Proactive evaluation near school POIs (<150m); triggers high-priority P0/P1 alert when speed exceeds 20 km/h or when children cross near missing zebra crossings per IRC:35)
  2. Passive Pedestrian Density Counter (Counts pedestrians in frame without school zone speed thresholds or special alerts)
- **User Selection**: **Vision Zero School Zone Alerting (Option 1)**
- **Implication**: Directly protects school children crossing arterial bus routes with enforceable 20 km/h speed threshold violations.

---

### Area 3: Hit-and-Run / Rash Driving Alerts
- **Question**: How should hit-and-run and rash driving incidents be reported to central command?
- **Options Presented**:
  1. (Recommended) Real-Time High-Priority Forensic Alert Dock (Command Center alert banner displaying extracted plate number, confidence score, NavIC GPS coordinate, timestamp, and 1-click dispatch to Traffic Police/GCTP)
  2. Background Log in Incidents Table (Store silently in database records without interrupting the active command map view)
- **User Selection**: **Real-Time High-Priority Forensic Alert Dock (Option 1)**
- **Implication**: Provides actionable forensic alerts for city traffic authorities to immediately coordinate interception and issue e-Challans.

---

### Area 4: Multi-Camera Edge Ingestion & Bandwidth Minimization Protocol
- **Question**: How should multi-camera edge ingestion achieve bandwidth minimization as required by the Problem Statement?
- **Options Presented**:
  1. (Recommended) Edge Metadata Stream (<2KB) + On-Demand Event Keyframes (Edge NPU executes local multi-camera inference; streams 5Hz JSON telemetry (<2KB/s) with camera angle tags, uploading 200KB forensic keyframes only upon confirmed defect or incident trigger)
  2. Continuous Compressed Video Relay (Stream low-bitrate video from all 4 cameras simultaneously to central server)
- **User Selection**: **Edge Metadata Stream (<2KB) + On-Demand Event Keyframes (Option 1)**
- **Implication**: Reduces cellular bandwidth by >95% while delivering 100% forensic accuracy on critical events.
