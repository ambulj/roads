# Phase 1: Enterprise Scalability & Spatial Engine - Context

**Gathered:** 2026-10-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Delivers enterprise database scalability and PostGIS spatial clustering to transition RoadSaathi from a single-city prototype to high-concurrency multi-fleet operation. This includes:
1. Dynamic dual-dialect database abstraction supporting SQLite WAL for zero-dependency local testing and PostgreSQL 16 + PostGIS 3.4 for production.
2. High-performance PostGIS spatial R-Tree indexing and DBSCAN clustering (`ST_ClusterDBSCAN`, `ST_DWithin`, `ST_MakeEnvelope`) with Python fallback for SQLite.
3. Async connection pooling, PgBouncer transaction-mode compatibility, and bounded in-memory telemetry ingestion batching for 500+ buses streaming at 5Hz.

New capabilities such as edge hardware NPU acceleration, contractor SLA financial ledgers, or frontend UI visualizers belong in subsequent phases.
</domain>

<decisions>
## Implementation Decisions

### Dual Database Engine & Migrations
- **D-01:** Environment-driven engine factory inspecting `DATABASE_URL` protocol (`sqlite+aiosqlite` vs `postgresql+asyncpg`). Dynamically applies SQLite WAL mode and synchronous pragmas or PostgreSQL connection pool parameters. — **Reversibility:** costly — Base engine initialization touches all async session dependencies.
- **D-02:** Dual-capable Alembic migration scripts with dialect conditional checks (`if dialect == 'postgresql': op.execute('CREATE EXTENSION IF NOT EXISTS postgis')`), while keeping `Base.metadata.create_all()` functional in pytest fixtures for zero-overhead unit tests. — **Reversibility:** costly — Affects migration pipeline and schema generation.
- **D-03:** PgBouncer-compatible asyncpg pool configuration: disable prepared statement caching (`statement_cache_size=0`), set `pool_recycle=300`, and enable `pool_pre_ping=True` to guarantee stability in production transaction pooling. — **Reversibility:** reversible — Easily configurable in connection arguments.
- **D-04:** Default to SQLite WAL locally (`sqlite+aiosqlite:///./roadsaathi.db`) when `DATABASE_URL` is omitted, guaranteeing that local development and pytest runs pass without external Docker or PostgreSQL dependencies. — **Reversibility:** reversible — Controlled via environment variable defaults.

### Geometry Schema & Field Compatibility
- **D-05:** Hybrid Dual-Representation for spatial models: preserve existing `latitude` (Float) and `longitude` (Float) for direct JSON serialization and SQLite compatibility, while adding a synced `geom` column (`Point(4326)`) on PostgreSQL. — **Reversibility:** costly — Schema and model definitions across telemetry, defect, and road network entities.
- **D-06:** GiST spatial index on `geom` (`Index('idx_defects_geom', 'geom', postgresql_using='gist')`) coupled with composite B-Tree indexes on `(timestamp, bus_id)` for high-speed spatio-temporal range querying. — **Reversibility:** costly — Database indexes require migration or DDL management.
- **D-07:** Dialect-conditional Geometry type helper mapping to GeoAlchemy2 `Geometry('POINT', srid=4326)` on PostgreSQL, but degrading gracefully to `NullType` / `Text` on SQLite so local environments do not require GDAL/GEOS native C libraries. — **Reversibility:** reversible — Contained within type decorator helper.
- **D-08:** Standardize spatial coordinates on EPSG:4326 (WGS 84 GPS standard), using explicit `::geography` casting in PostGIS functions (`ST_DWithin`, `ST_Distance`) for accurate meter-based geodesic distance calculations. — **Reversibility:** costly — Changing spatial SRID requires coordinate transformations.

### Spatial Clustering & Query Strategy
- **D-09:** Multi-bus defect aggregation using native PostGIS `ST_ClusterDBSCAN(geom, eps := 0.00005, minpoints := 2)` (~5-meter radius, minimum 2 independent passes), backed by a Python DBSCAN fallback on SQLite for test environments. — **Reversibility:** costly — Core spatial clustering query logic.
- **D-10:** Periodic/incremental cluster aggregation table (`road_defect_clusters`) with GiST indexing, queried via `/api/v1/clusters?bbox=...` to ensure sub-50ms map response times without recomputing clustering on every request. — **Reversibility:** costly — Introduces aggregation schema and maintenance workers.
- **D-11:** Viewport spatial queries accept standard bounding box parameters (`min_lon,min_lat,max_lon,max_lat`), querying with PostGIS bounding-box overlap operator (`geom && ST_MakeEnvelope(...)`) on PostgreSQL and bounding range comparisons (`between`) on SQLite. — **Reversibility:** reversible — API query parameter contract.
- **D-12:** Defect and telemetry road network snapping uses PostGIS `ST_DWithin(road.geom::geography, defect.geom::geography, 15.0)` with a 15-meter corridor buffer to match road segments. — **Reversibility:** costly — Links spatial detections to municipal road asset IDs.

### Telemetry High-Concurrency Ingestion
- **D-13:** In-memory `asyncio.Queue` background batch flusher for 500+ buses at 5Hz (up to 2,500 msg/sec): endpoint broadcasts immediately to active WebSockets, while queuing records for bulk insert transactions every 1.0 second or 500 records. — **Reversibility:** costly — Architectural data pipeline between HTTP/WS endpoints and DB.
- **D-14:** Bounded queue backpressure with prioritized retention: if write queue exceeds 10,000 items during database lock contention, drop older intermediate GPS pings while strictly preserving defect detections and vehicle state changes. — **Reversibility:** reversible — Queue management policy.
- **D-15:** Declarative range partitioning by time for raw telemetry pings on PostgreSQL (monthly partitions) with automated retention pruning (7-day full resolution, downsampling/purging older data). — **Reversibility:** one-way — Partitioned table DDL structure in PostgreSQL.
- **D-16:** Aggressive connection pool recycling and health monitoring: `pool_recycle=300s`, `pool_pre_ping=True`, `pool_timeout=10s`, and fail-fast behavior on pool exhaustion. — **Reversibility:** reversible — SQLAlchemy async engine connection options.

### the agent's Discretion
- Selection of Alembic migration execution pattern (using dialect checks and keeping pytest zero-dependency).
- DBSCAN eps radius parameterization (~5 meters) and Python fallback implementation for SQLite.
- Queue batching thresholds (1 second or 500 records) and queue size cap (10,000 items).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Standards & Specifications
- `.planning/PROJECT.md` — Core vision, architecture constraints, and non-negotiables.
- `.planning/REQUIREMENTS.md` §SCALE-01, §SCALE-02, §SCALE-03 — Enterprise scalability requirements.
- `.planning/ROADMAP.md` §Phase 1 — Phase 1 goals, success criteria, and plans.
- `.planning/codebase/ARCHITECTURE.md` — Current backend architecture, DB layer, and telemetry flow.
- `.planning/codebase/STACK.md` — Technology stack and dependency constraints.
- `.planning/codebase/CONVENTIONS.md` — Coding conventions, async standards, and error handling.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/app/db/session.py`: Engine and session maker to be upgraded with dialect-switching factory and connection pooling.
- `backend/app/models/`: Existing SQLAlchemy models (telemetry, defects, roads) to receive hybrid coordinates and conditional geometry types.
- `backend/app/api/endpoints/telemetry.py`: Telemetry ingestion endpoint to be connected to the async batch write queue.
- `backend/app/services/`: Spatial calculations and clustering service integration point.

### Established Patterns
- Async SQLAlchemy 2.0 with `asyncpg` / `aiosqlite`.
- Pydantic v2 schemas for request/response serialization.
- Fast, non-blocking async handlers with thread offloading for heavy operations.
- Clean pytest fixtures without external daemon requirements.

### Integration Points
- `GET /api/v1/clusters?bbox=...`: MapLibre spatial query endpoint for viewport-filtered cluster loading.
- `POST /api/v1/telemetry`: High-frequency vehicle ingestion buffer.
- `backend/app/main.py`: Lifespan event for starting/stopping the async batch flusher task.
</code_context>

<specifics>
## Specific Ideas
- Zero-downtime local demo: any developer or reviewer running `pytest` or `uvicorn backend.app.main:app` out of the box must work without needing Docker or a PostgreSQL server installed.
- Production readiness: setting `DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/roadsaathi` automatically unlocks PostGIS R-Tree indexes, `ST_ClusterDBSCAN`, and PgBouncer connection recycling.
</specifics>

<deferred>
## Deferred Ideas
- Edge NPU acceleration and C++ zero-copy pipeline -> Phase 2.
- IRC:SP:20 Clause 14 contractor financial penalty auto-debit ledger -> Phase 3.
- MapLibre WebGIS click-to-explain modal and live dashcam streaming UI -> Phase 4.
</deferred>

---

*Phase: 01-Enterprise Scalability & Spatial Engine*
