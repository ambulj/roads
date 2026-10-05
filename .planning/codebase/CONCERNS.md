# Technical Debt & Architecture Concerns

**Analysis Date:** 2026-10-06

## Known Issues & Technical Debt

### 1. Database Concurrency Under Massive Multi-Bus Fleet Scaling
- **Current State:** The backend operates on SQLite 3 with Write-Ahead Logging (`PRAGMA journal_mode=WAL`) and a 15,000ms busy timeout (`backend/app/storage/database.py`).
- **Risk:** While WAL handles the simulated 5-bus fleet and concurrent synthetic ticks smoothly, a real-world municipal fleet of 500+ buses streaming 5Hz telemetry simultaneously could trigger SQLite `database is locked` timeouts due to single-writer serialization.
- **Remediation Plan:** Transition the relational layer to PostgreSQL with PostGIS extension for spatial indexing (`ST_DWithin`, `ST_ClusterDBSCAN`) via the existing SQLAlchemy abstraction.

### 2. Edge Video Source Heterogeneity & RTSP Dropouts
- **Current State:** `edge/edge_agent.py` supports V4L2 device nodes (`/dev/video0`), GStreamer pipelines (`libcamerasrc`, `rkmpp`), RTSP streams, and local video files.
- **Risk:** RTSP streams from vehicle IP cameras often drop frames or stall indefinitely during cellular dead zones or bus electrical ignition transients.
- **Remediation Plan:** Enhance `_create_capture_source()` with automatic watchdog heartbeat timers and non-blocking reconnect threads to restart stalled GStreamer pipelines without killing the agent daemon.

### 3. GPU Memory Overhead & EasyOCR Latency
- **Current State:** EasyOCR uses a lazy singleton reader cached on `self._easyocr_reader` (`backend/app/services/anpr_engine.py`).
- **Risk:** When CUDA memory is shared with multiple YOLO models (YOLOv8x + YOLOv11 nano), PyTorch GPU allocations can approach 4GB VRAM limits on edge-tier laptops or SBCs, causing intermittent OOM errors during concurrent batch analysis.
- **Remediation Plan:** Implement an ONNX Runtime direct inference backend with INT8 quantization for license plate character recognition to reduce VRAM footprint to under 150MB.

---

## Security & Privacy Considerations

### 1. DPDP Act 2023 Statutory Liability
- **Current State:** Dashcam footage captures private citizen license plates, pedestrian faces, and private commercial storefronts.
- **Implementation:** `evidence_vault.py` provides automated face and bystander redaction certification, and raw footage in `uploads/temp/` is purged via background TTL cleaner after 24 hours. Downloads of unredacted evidence require municipal role authorization (`require_roles`).
- **Concern:** If the 24-hour TTL background thread (`_start_cleanup_worker`) halts due to an unhandled OS exception, unredacted temporary footage could accumulate on disk indefinitely.
- **Remediation Plan:** Add a filesystem-level cron/systemd watchdog to enforce TTL deletion independently of the Python process.

### 2. Government Officer Authentication Secrets
- **Current State:** Default demo credentials use `DEFAULT_GOV_PASSWORD = "chennai@2026"` and `DEFAULT_SALT` in `backend/app/core/auth.py`.
- **Concern:** In production municipal deployments, default passwords must be strictly disabled, and `JWT_SECRET_KEY` must be loaded from an external secrets manager (e.g., HashiCorp Vault or AWS KMS).
- **Remediation Plan:** Enforce startup assertion that aborts application boot if `JWT_SECRET_KEY` or admin passwords match default demo strings in non-demo mode (`settings.DEMO_MODE == False`).

---

## Performance & Optimization Opportunities

### 1. Frontend Bundle Size & Code Splitting
- **Current State:** `dist/assets/vendor-map.js` (801 kB) and `dist/assets/vendor-charts.js` (578 kB) constitute large initial chunk sizes.
- **Status:** Already partitioned via Vite chunking rules, but Three.js 3D mesh rendering (`Mesh3DModal.tsx`) and mobile dashcam overlays can be lazy-loaded with `React.lazy()` to reduce initial landing bundle to under 300 kB gzip.

### 2. Vehicle Edge Buffer Truncation & Flash Durability
- **Current State:** Solved in current release by converting edge persistence to append-only JSONL (`edge_buffer_{bus_id}.jsonl`) with atomic compaction only on batch flush.
- **Ongoing Vigilance:** Maintain strict adherence to append-only logging; avoid any code additions that perform full-file JSON serialization inside high-frequency 5Hz capture loops.

---

*Codebase analysis: 2026-10-06*
