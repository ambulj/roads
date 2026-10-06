# Domain & Technical Research Summary: RoadSaathi v3.0

**Date:** 2026-10-06
**Status:** Complete & Synthesized

## Executive Summary

RoadSaathi v3.0 focuses on three transformative pillars:
1. **Enterprise Scalability:** Migrating the SQLite WAL backend to PostgreSQL 16 + PostGIS 3.4 for concurrent fleet ingestion (>500 buses at 5Hz) with spatial R-Tree indexing (`ST_DWithin`, `ST_ClusterDBSCAN`).
2. **Edge Hardware Acceleration:** Rockchip RK3588 zero-copy NPU inference (`rknn_pipeline.cpp`) and INT8 quantized OCR to achieve 30+ FPS edge perception with <12W vehicle power draw.
3. **Statutory Financial Integrity:** Automated IRC:SP:20 Clause 14 contractor penalty accounting, 36-month defect liability auto-debit ledgers, and interactive WebGIS explainability (RPI click-to-explain, live dashcam visualizer, OD passenger desire lines).

---

## Technical Stack Decisions

| Domain | Choice | Rationale | Alternatives Evaluated |
|---|---|---|---|
| **Relational Database** | PostgreSQL 16 + PostGIS 3.4 | Native spatial clustering (`ST_ClusterDBSCAN`), concurrency without writer locks, JSONB indexing | SQLite WAL (locks under 500+ buses), MongoDB (weak spatial indexing) |
| **Edge NPU Engine** | Rockchip RKNN2 Zero-Copy (C++) | Hardware-direct DMA memory access on RK3588 triples throughput to 32 FPS at <12W | Python ONNX Runtime (CPU bottlenecked), PyTorch CUDA (high thermal footprint) |
| **OCR Quantization** | INT8 Quantized ONNX | Reduces VRAM footprint from 1.8GB to 120MB, enables simultaneous YOLO + OCR | Unquantized EasyOCR (OOM risk on 4GB edge hardware) |
| **Spatial Clustering** | PostGIS `ST_ClusterDBSCAN` | Database-native spatial clustering eliminates memory transfer overhead for 100k+ historical passes | Python Scikit-Learn DBSCAN (RAM memory bottleneck on server) |

---

## Critical Pitfalls & Mitigation

1. **PostgreSQL Migration Connection Starvation:**
   * *Pitfall:* 500 buses streaming 5Hz HTTP requests can overwhelm PostgreSQL connection pools (exceeding `max_connections`).
   * *Mitigation:* Implement connection pooling via async SQLAlchemy + PgBouncer, coupled with edge-tier batch buffering (P1 telemetry batched into 30-packet payloads).
2. **Contractor SLA Disputed Evidence:**
   * *Pitfall:* Contractors contesting auto-debit penalties claiming false optical positives or temporal weather anomalies.
   * *Mitigation:* Multi-pass concurrence rule (minimum 3 independent bus passes across 48 hours with vertical IMU z-axis acceleration > 1.25g) before activating Clause 14 debit.
3. **Edge Cellular Disconnect Flapping:**
   * *Pitfall:* Rapid connect/disconnect cycles over 2G/4G fringe areas causing connection thrashing.
   * *Mitigation:* Exponential backoff with random jitter (5.0s to 60.0s) and append-only JSONL local ring buffering.

---

*Domain Research Synthesized: 2026-10-06*
