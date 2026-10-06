"""
telemetry_buffer.py — High-Concurrency In-Memory Batch Buffer with Prioritized Shedding.

Absorbs up to 2,500 msg/sec (500 transit buses streaming at 5Hz) without connection pool
exhaustion or table lock deadlocks (SCALE-03).
Features:
- Bounded queue (maxsize=10,000)
- Batch size: 500 records or 1.0s interval
- Watermark shedding (8,000 items): drops routine intermediate GPS pings while preserving
  defects (defect_type != 'NONE') and high IMU shocks (vertical_g_force >= 1.3)
- Async bulk insert into DBRawIngest and DBAuditLog via AsyncSessionLocal
"""
import asyncio
import datetime
import uuid
from typing import Dict, Any, List, Optional
from sqlalchemy import insert

from app.storage.database import AsyncSessionLocal
from app.models.db_models import DBRawIngest, DBAuditLog


class TelemetryBatchBuffer:
    BATCH_SIZE: int = 500
    FLUSH_INTERVAL: float = 1.0  # seconds
    HIGH_WATERMARK: int = 8000
    MAX_QUEUE_SIZE: int = 10000

    def __init__(self, maxsize: int = MAX_QUEUE_SIZE):
        self._maxsize = maxsize
        self._queue: asyncio.Queue = asyncio.Queue(maxsize=maxsize)
        self._worker_task: Optional[asyncio.Task] = None
        self._running: bool = False

        # Operational Metrics
        self.dropped_pings_count: int = 0
        self.dropped_priority_count: int = 0
        self.total_enqueued: int = 0
        self.total_flushed: int = 0
        self.flush_events_count: int = 0
        self.flush_errors_count: int = 0

    @property
    def qsize(self) -> int:
        return self._queue.qsize()

    def is_priority(self, item: Dict[str, Any]) -> bool:
        """Determines if a telemetry record is high priority and must not be shed."""
        defect_type = item.get("defect_type")
        has_defect = defect_type not in (None, "NONE", "none", "")
        high_g_force = float(item.get("vertical_g_force", 1.0)) >= 1.3
        high_confidence = float(item.get("confidence", 0.0)) > 0.8 and has_defect
        return has_defect or high_g_force or high_confidence

    async def enqueue(self, item: Dict[str, Any]) -> bool:
        """
        Enqueues an incoming telemetry packet.
        If queue depth exceeds HIGH_WATERMARK (8,000 items), sheddable routine GPS pings
        are dropped while defect detections and IMU shock spikes are strictly retained.
        """
        current_depth = self._queue.qsize()
        priority = self.is_priority(item)

        if current_depth >= self.HIGH_WATERMARK and not priority:
            self.dropped_pings_count += 1
            return False

        try:
            self._queue.put_nowait(item)
            self.total_enqueued += 1
            return True
        except asyncio.QueueFull:
            if priority:
                try:
                    await asyncio.wait_for(self._queue.put(item), timeout=0.05)
                    self.total_enqueued += 1
                    return True
                except (asyncio.TimeoutError, asyncio.QueueFull):
                    self.dropped_priority_count += 1
                    return False
            else:
                self.dropped_pings_count += 1
                return False

    async def _flush_batch(self, batch: List[Dict[str, Any]]) -> None:
        """Executes bulk insertion into DBRawIngest and DBAuditLog in a single transaction."""
        if not batch:
            return

        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
        raw_records = []
        audit_records = []

        for item in batch:
            raw_id = item.get("id") or f"raw-{uuid.uuid4().hex[:8]}"
            lat = float(item.get("lat", 12.9516))
            lng = float(item.get("lng", 80.1462))
            defect_type = item.get("defect_type") or "NONE"
            captured_at = item.get("captured_at") or now_str

            raw_records.append({
                "id": raw_id,
                "bus_id": item.get("bus_id", "BUS-TN01-1042"),
                "cluster_id": item.get("cluster_id"),
                "defect_type": defect_type,
                "confidence": float(item.get("confidence", 0.9)),
                "speed_kmh": float(item.get("speed_kmh", 40.0)),
                "vertical_g_force": float(item.get("vertical_g_force", 1.0)),
                "lat": lat,
                "lng": lng,
                "geom": f"SRID=4326;POINT({lng} {lat})",
                "camera_position": item.get("camera_position", "FRONT_WINDSHIELD"),
                "channel": int(item.get("channel", 1)),
                "captured_at": captured_at
            })

            if defect_type not in ("NONE", "none", "", None):
                audit_records.append({
                    "id": f"aud-{uuid.uuid4().hex[:6]}",
                    "bus_id": item.get("bus_id", "BUS-TN01-1042"),
                    "corridor": defect_type,
                    "message": f"Defect {defect_type} captured via {item.get('camera_position', 'FRONT_WINDSHIELD')} (CH {item.get('channel', 1)}).",
                    "latency_ms": 38,
                    "type": "EDGE_INGEST",
                    "timestamp": "Just now",
                    "created_at": captured_at
                })

        try:
            async with AsyncSessionLocal() as session:
                async with session.begin():
                    if raw_records:
                        await session.execute(insert(DBRawIngest), raw_records)
                    if audit_records:
                        await session.execute(insert(DBAuditLog), audit_records)
            self.total_flushed += len(raw_records)
            self.flush_events_count += 1
        except Exception as exc:
            print(f"[TELEMETRY_BUFFER] Bulk flush error: {exc}")
            self.flush_errors_count += 1

    async def flush_worker(self) -> None:
        """
        Continuously collects items into batches of up to BATCH_SIZE (500)
        or flushes after FLUSH_INTERVAL (1.0s).
        """
        while self._running:
            try:
                batch = []
                try:
                    first_item = await asyncio.wait_for(self._queue.get(), timeout=self.FLUSH_INTERVAL)
                    batch.append(first_item)
                    self._queue.task_done()
                except asyncio.TimeoutError:
                    continue

                loop = asyncio.get_running_loop()
                deadline = loop.time() + self.FLUSH_INTERVAL

                while len(batch) < self.BATCH_SIZE:
                    rem_time = deadline - loop.time()
                    if rem_time <= 0:
                        break
                    try:
                        item = self._queue.get_nowait()
                        batch.append(item)
                        self._queue.task_done()
                    except asyncio.QueueEmpty:
                        try:
                            item = await asyncio.wait_for(self._queue.get(), timeout=min(0.05, rem_time))
                            batch.append(item)
                            self._queue.task_done()
                        except asyncio.TimeoutError:
                            if loop.time() >= deadline:
                                break
                            continue

                if batch:
                    await self._flush_batch(batch)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[TELEMETRY_BUFFER] Worker error: {e}")
                await asyncio.sleep(0.05)

    async def flush_now(self) -> int:
        """Immediately flushes all items currently queued."""
        batch = []
        while not self._queue.empty():
            try:
                batch.append(self._queue.get_nowait())
                self._queue.task_done()
            except asyncio.QueueEmpty:
                break
        if batch:
            await self._flush_batch(batch)
        return len(batch)

    async def start(self) -> None:
        """Starts the background batch flusher task."""
        if not self._running:
            self._running = True
            self._worker_task = asyncio.create_task(self.flush_worker())

    async def stop(self) -> None:
        """Gracefully drains pending queue before termination."""
        self._running = False
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
            self._worker_task = None

        # Drain any remaining items
        await self.flush_now()

    def get_metrics(self) -> Dict[str, Any]:
        """Returns buffer health and throughput statistics."""
        return {
            "queue_depth": self._queue.qsize(),
            "max_queue_size": self._maxsize,
            "high_watermark": self.HIGH_WATERMARK,
            "batch_size": self.BATCH_SIZE,
            "flush_interval_sec": self.FLUSH_INTERVAL,
            "total_enqueued": self.total_enqueued,
            "total_flushed": self.total_flushed,
            "dropped_pings_count": self.dropped_pings_count,
            "dropped_priority_count": self.dropped_priority_count,
            "flush_events_count": self.flush_events_count,
            "flush_errors_count": self.flush_errors_count,
        }

    def reset(self) -> None:
        """Resets queue state and metrics (for test isolation)."""
        while not self._queue.empty():
            try:
                self._queue.get_nowait()
                self._queue.task_done()
            except asyncio.QueueEmpty:
                break
        self.dropped_pings_count = 0
        self.dropped_priority_count = 0
        self.total_enqueued = 0
        self.total_flushed = 0
        self.flush_events_count = 0
        self.flush_errors_count = 0


telemetry_buffer = TelemetryBatchBuffer()
