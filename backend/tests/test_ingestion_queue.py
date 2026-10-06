"""
test_ingestion_queue.py — Test Suite for TelemetryBatchBuffer & High-Concurrency Ingestion (SCALE-03).

Test Coverage:
1. Count Threshold: Enqueue 500 records -> worker flushes immediately.
2. Time Threshold: Enqueue 10 records -> worker flushes after 1.0s interval.
3. Bounded Backpressure Priority: Flood beyond watermark -> 100% defects retained, routine pings shed.
4. High-Concurrency Stress: 50 concurrent tasks x 50 packets (2,500 total) -> persisted without deadlock.
"""
import asyncio
import uuid
import pytest
from app.services.telemetry_buffer import TelemetryBatchBuffer
from app.storage.database import init_db, SessionLocal
from app.models.db_models import DBRawIngest, DBAuditLog


@pytest.mark.anyio
async def test_flusher_triggers_on_count_threshold():
    """Enqueue 500 records and verify worker flushes batch immediately (<1.0s)."""
    init_db()
    buffer = TelemetryBatchBuffer()
    await buffer.start()
    run_id = uuid.uuid4().hex[:8]

    try:
        # Enqueue exactly 500 records (equal to BATCH_SIZE)
        for i in range(500):
            await buffer.enqueue({
                "id": f"count-{run_id}-{i}",
                "bus_id": "BUS-TN01-1042",
                "lat": 12.9516,
                "lng": 80.1462,
                "defect_type": "D40" if i % 10 == 0 else "NONE",
                "vertical_g_force": 1.0,
                "confidence": 0.90
            })

        # Wait for worker to flush the batch
        for _ in range(40):
            if buffer.total_flushed >= 500:
                break
            await asyncio.sleep(0.05)

        assert buffer.total_flushed >= 500, f"Expected >= 500 flushed, got {buffer.total_flushed}"
        assert buffer.flush_events_count >= 1
        assert buffer.flush_errors_count == 0
    finally:
        await buffer.stop()
        # Clean up test rows
        db = SessionLocal()
        try:
            db.query(DBRawIngest).filter(DBRawIngest.id.like(f"count-{run_id}-%")).delete(synchronize_session=False)
            db.commit()
        finally:
            db.close()


@pytest.mark.anyio
async def test_flusher_triggers_on_time_threshold():
    """Enqueue 10 records (< BATCH_SIZE) and verify worker flushes after 1.0s interval."""
    init_db()
    buffer = TelemetryBatchBuffer()
    await buffer.start()
    run_id = uuid.uuid4().hex[:8]

    try:
        # Enqueue only 10 records
        for i in range(10):
            await buffer.enqueue({
                "id": f"time-{run_id}-{i}",
                "bus_id": "BUS-TN01-1042",
                "lat": 12.9520,
                "lng": 80.1470,
                "defect_type": "NONE",
                "vertical_g_force": 1.0,
                "confidence": 0.0
            })

        # Right away, batch has not flushed yet
        assert buffer.total_flushed == 0

        # Wait for timeout (FLUSH_INTERVAL = 1.0s)
        await asyncio.sleep(1.2)

        # Worker must have flushed the batch on interval
        assert buffer.total_flushed == 10
        assert buffer.qsize == 0
    finally:
        await buffer.stop()
        db = SessionLocal()
        try:
            db.query(DBRawIngest).filter(DBRawIngest.id.like(f"time-{run_id}-%")).delete(synchronize_session=False)
            db.commit()
        finally:
            db.close()


@pytest.mark.anyio
async def test_bounded_queue_backpressure_priority():
    """
    Flood queue beyond HIGH_WATERMARK (8,000).
    Verify 100% of defect detections are retained while routine GPS pings are dropped.
    """
    buffer = TelemetryBatchBuffer()
    # Do not start background flusher so queue fills to capacity

    # Pre-fill queue to HIGH_WATERMARK
    for i in range(buffer.HIGH_WATERMARK):
        buffer._queue.put_nowait({
            "id": f"dummy-{i}",
            "bus_id": "BUS-DUMMY",
            "lat": 12.95,
            "lng": 80.14,
            "defect_type": "NONE",
            "vertical_g_force": 1.0
        })
    buffer.total_enqueued = buffer.HIGH_WATERMARK
    assert buffer.qsize >= buffer.HIGH_WATERMARK

    # 1. Enqueue 100 routine GPS pings (should all be shed)
    shed_count = 0
    for i in range(100):
        accepted = await buffer.enqueue({
            "id": f"routine-{i}",
            "bus_id": f"BUS-ROUTINE-{i}",
            "lat": 12.951,
            "lng": 80.146,
            "defect_type": "NONE",
            "vertical_g_force": 1.0,
            "confidence": 0.0
        })
        if not accepted:
            shed_count += 1

    assert shed_count == 100, f"Expected all 100 routine pings shed, got {shed_count}"
    assert buffer.dropped_pings_count == 100

    # 2. Enqueue 50 defect detections (priority items must be retained)
    accepted_defects = 0
    for i in range(50):
        accepted = await buffer.enqueue({
            "id": f"defect-{i}",
            "bus_id": f"BUS-DEFECT-{i}",
            "lat": 12.951,
            "lng": 80.146,
            "defect_type": "D40",
            "confidence": 0.95,
            "vertical_g_force": 1.55
        })
        if accepted:
            accepted_defects += 1

    assert accepted_defects == 50, f"Expected 50 defects accepted, got {accepted_defects}"
    assert buffer.dropped_priority_count == 0

    # Clean up
    buffer.reset()


@pytest.mark.anyio
async def test_high_concurrency_stress():
    """
    Launches 50 concurrent asyncio tasks each submitting 50 telemetry packets
    (2,500 total, representing 500 buses at 5Hz).
    Asserts all packets are persisted without deadlock or connection pool errors.
    """
    init_db()
    buffer = TelemetryBatchBuffer()
    await buffer.start()
    run_id = uuid.uuid4().hex[:8]

    try:
        num_tasks = 50
        packets_per_task = 50
        total_packets = num_tasks * packets_per_task

        async def bus_stream_worker(task_id: int):
            for i in range(packets_per_task):
                pkt = {
                    "id": f"stress-{run_id}-{task_id}-{i}",
                    "bus_id": f"BUS-FLEET-{task_id:03d}",
                    "lat": 12.9500 + (i * 0.0001),
                    "lng": 80.1400 + (task_id * 0.0001),
                    "speed_kmh": 38.0 + (i % 15),
                    "defect_type": "D40" if i % 10 == 0 else "NONE",
                    "confidence": 0.93 if i % 10 == 0 else 0.0,
                    "vertical_g_force": 1.52 if i % 10 == 0 else 1.0,
                    "channel": 1
                }
                await buffer.enqueue(pkt)

        # Fire 50 concurrent bus streaming tasks
        await asyncio.gather(*(bus_stream_worker(t) for t in range(num_tasks)))

        # Wait for buffer to flush all packets
        for _ in range(60):
            if buffer.total_flushed >= total_packets:
                break
            await asyncio.sleep(0.1)

        await buffer.stop()

        assert buffer.total_flushed == total_packets, (
            f"Expected {total_packets} flushed, but got {buffer.total_flushed}"
        )
        assert buffer.flush_errors_count == 0
        assert buffer.dropped_priority_count == 0
    finally:
        if buffer._running:
            await buffer.stop()
        db = SessionLocal()
        try:
            db.query(DBRawIngest).filter(DBRawIngest.id.like(f"stress-{run_id}-%")).delete(synchronize_session=False)
            db.commit()
        finally:
            db.close()
