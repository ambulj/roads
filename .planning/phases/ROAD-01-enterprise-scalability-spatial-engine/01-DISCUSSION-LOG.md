# Phase 1: Enterprise Scalability & Spatial Engine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-06
**Phase:** 01-Enterprise Scalability & Spatial Engine
**Areas discussed:** Dual Database Engine & Migrations, Geometry Schema & Field Compatibility, Spatial Clustering & Query Strategy, Telemetry High-Concurrency Ingestion

---

## Dual Database Engine & Migrations

| Option | Description | Selected |
|---|---|---|
| Environment-driven engine factory | Inspects DATABASE_URL protocol (sqlite+aiosqlite vs postgresql+asyncpg); dynamically configures WAL pragma or PgBouncer pool settings | ✓ |
| Separate dedicated modules | Dedicated database_sqlite.py and database_postgres.py selected via settings.DB_ENGINE flag | |
| You decide | Let the assistant select the cleanest pattern | |

**User's choice:** Environment-driven engine factory  
**Notes:** Retains zero-config developer ergonomics while unlocking PostgreSQL in production.

---

## Geometry Schema & Field Compatibility

| Option | Description | Selected |
|---|---|---|
| Hybrid Dual-Representation | Preserve float latitude/longitude for SQLite & fast JSON serialization; add geom Point(4326) on Postgres for spatial queries | ✓ |
| PostGIS Geometry Only | Store only geom column, convert via ST_X/ST_Y on fetch (requires SpatiaLite for SQLite) | |
| You decide | Let the assistant select the schema representation | |

**User's choice:** Hybrid Dual-Representation  
**Notes:** GiST spatial index on geom + composite B-tree on (timestamp, bus_id); dialect-conditional type helper to avoid GDAL/GEOS C-library requirement on SQLite; EPSG:4326 with geography casting for meter distances.

---

## Spatial Clustering & Query Strategy

| Option | Description | Selected |
|---|---|---|
| Periodic/Incremental cluster summary table | GiST-indexed cluster table served via /api/v1/clusters?bbox=... for instant map panning | ✓ |
| Live on-the-fly DBSCAN clustering per request | Computes clusters dynamically on raw detections per bbox | |
| You decide | Let the assistant select caching & execution model | |

**User's choice:** Periodic/Incremental cluster summary table  
**Notes:** Native PostGIS ST_ClusterDBSCAN (eps ~5m, minpoints=2) with Python DBSCAN fallback on SQLite; standard bbox query parameters (min_lon, min_lat, max_lon, max_lat); 15m buffer snapping to road corridors via ST_DWithin.

---

## Telemetry High-Concurrency Ingestion

| Option | Description | Selected |
|---|---|---|
| Bounded queue with prioritized retention | Drop older intermediate GPS points if buffer exceeds 10,000 items, strictly retain defect detections & state changes | ✓ |
| Block/throttle incoming requests | Force fleet edge agents to buffer locally | |
| You decide | Let the assistant select queue overflow policy | |

**User's choice:** Bounded queue with prioritized retention  
**Notes:** In-memory asyncio background batch flusher (immediate WS broadcast, bulk DB insert every 1s / 500 items); monthly declarative range partitioning on PostgreSQL for telemetry; aggressive connection recycling (pool_recycle=300s, pool_pre_ping=True, pool_timeout=10s).

---

## The Assistant's Discretion

- Selection of Alembic migration execution pattern (using dialect checks and keeping pytest zero-dependency).
- DBSCAN eps radius parameterization (~5 meters) and Python fallback implementation for SQLite.
- Queue batching thresholds (1 second or 500 records) and queue size cap (10,000 items).

## Deferred Ideas

- Edge NPU acceleration and C++ zero-copy pipeline -> Phase 2.
- IRC:SP:20 Clause 14 contractor financial penalty auto-debit ledger -> Phase 3.
- MapLibre WebGIS click-to-explain modal and live dashcam streaming UI -> Phase 4.
