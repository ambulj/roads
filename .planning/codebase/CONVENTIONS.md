# Coding & Architectural Conventions

**Analysis Date:** 2026-10-06

## Code Style & Formatting

### Python
- **Type Annotations:** Enforced across all service methods and endpoint signatures (`typing.Dict`, `typing.List`, `typing.Optional`, `typing.Any`).
- **Pydantic Validation:** Request payloads and response models explicitly declared using Pydantic v2 schemas (`backend/app/models/schemas.py`).
- **Docstrings:** Clear multi-line docstrings explaining civic domain logic, IRC standards, and statutory citations on every service method and endpoint.
- **Path Handling:** Standardized on `pathlib.Path` rather than raw string manipulations for platform-independent Windows and Linux support.

### TypeScript & React
- **Strict Typing:** No implicit `any`; explicit interfaces defined in `frontend/src/types/index.ts` for all civic entities (`HazardCluster`, `FleetNode`, `TrafficIncident`).
- **Functional Components:** React 18 functional components with standard hooks (`useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`).
- **Styling:** Tailwind CSS utility classes adhering to a consistent dark-theme palette (`bg-zinc-950`, `border-zinc-800`, `text-zinc-100`, with accent colors: emerald `#10b981`, amber `#f59e0b`, red `#ef4444`, sky `#0284c7`).

---

## Architectural Conventions

### 1. Non-Blocking Asynchronous IO
- Heavy synchronous operations (OpenCV image encoding, PyTorch neural inference, synthetic generation) **must never run directly in FastAPI's async event loop**.
- Use `await asyncio.to_thread(func, *args)` to offload compute-heavy tasks to the thread pool, preventing WebSocket starvation:
  ```python
  # Correct non-blocking pattern in telemetry.py
  summary = await asyncio.to_thread(generate_synthetic_tick)
  result = await asyncio.to_thread(yolo_engine.detect_zebra_crossings, image_bytes)
  ```

### 2. Lazy Singleton Model Loading
- Neural models (EasyOCR, YOLOv8/v11) must not be re-instantiated per frame.
- Initialize weights lazily on first call and cache on the service instance to prevent GPU memory leaks and eliminate repeated 2-3s weight load latency:
  ```python
  # anpr_engine.py lazy singleton pattern
  @property
  def easyocr_reader(self):
      if self._easyocr_reader is None:
          import easyocr
          self._easyocr_reader = easyocr.Reader(['en'], gpu=torch.cuda.is_available(), verbose=False)
      return self._easyocr_reader
  ```

### 3. Flash Wear Prevention on Edge SBCs
- Onboard edge devices (Rockchip RK3588, Raspberry Pi) store telemetry offline on SD cards or eMMC.
- Never overwrite entire JSON arrays on every 5Hz tick. Use append-only JSONL (`.jsonl`) writes and compact atomically via temporary files only upon buffer eviction or successful batch sync:
  ```python
  # edge_agent.py append-only logging
  with open(self.ring_buffer_file, "a", encoding="utf-8") as f:
      f.write(json.dumps(packet) + "\n")
  ```

### 4. 60 FPS WebGIS Decoupling
- Rapid 5Hz vehicle telemetry ticks must bypass React state reconciliation.
- Dispatch telemetry to `window` via `roadsaathi:telemetry:fleet` and update the MapLibre GeoJSON source (`(map.getSource('bus-positions')).setData(...)`) directly in WebGL.
- Throttle React state updates (`setFleet`) to 1.5s intervals for UI text badges.

---

## Error Handling & Fallback Discipline

### Truthful Model Registry Guarantee
- The system must never falsely report that a model is "ready" if weights are absent from disk.
- When `.pt` or `.onnx` files are not found, `model_registry.py` returns `"awaiting_weights"` and activates a verified OpenCV fallback pipeline with transparent provenance reporting.

### Database Resilience
- SQLite connection initialization must enforce WAL mode and extended busy timeouts:
  ```python
  @event.listens_for(engine, "connect")
  def set_sqlite_pragma(dbapi_connection, connection_record):
      cursor = dbapi_connection.cursor()
      cursor.execute("PRAGMA journal_mode=WAL")
      cursor.execute("PRAGMA busy_timeout=15000")
      cursor.execute("PRAGMA synchronous=NORMAL")
  ```
- If relational storage is inaccessible, the system falls back to `mock_database.py` with identical schemas to prevent UI crash during field operations.

---

## Statutory & Legislative Compliance Standards

All algorithms must tie directly to official Indian standards:
- **IRC:SP:20 Clause 14:** Contractor Defect Liability Period (36 months) auto-debit penalty ledger.
- **IRC:106-1990:** Passenger Car Unit (PCU) urban road traffic density classification.
- **IRC:35:** Code of Practice for Road Markings (Zebra crossings and pedestrian safety).
- **IS:1726:** Cast iron manhole covers and frames safety specifications.
- **DPDP Act 2023:** Optical anonymization of bystander faces and private plates before permanent forensic vault retention.

---

*Codebase analysis: 2026-10-06*
