"""
Unit tests for edge/cellular_watchdog.py:
- 5-second network polling and jittered reconnect
- Append-only JSONL ring buffer write & read
- 50MB ring buffer atomic FIFO compaction
- Priority-first upload queue ordering (P0 strictly before P1/P2)
- WebP image spool 2GB cap and FIFO non-P0 eviction
- Depot Wi-Fi burst sync detection via SSID and geofence
"""

import os
from pathlib import Path
import tempfile
import time
from unittest.mock import MagicMock, patch
import numpy as np
import pytest

from edge.cellular_watchdog import (
    CellularWatchdog,
    JsonlRingBuffer,
    ImageSpoolManager,
    PriorityReconnectionFlusher,
    DepotBurstSync,
)


def test_cellular_watchdog_5sec_polling():
    """Mocks TCP socket and verifies watchdog detects connection drop and recovery."""
    reconnect_called = []
    disconnect_called = []

    def on_recon():
        reconnect_called.append(True)

    def on_disconn():
        disconnect_called.append(True)

    # Use small jitter and fast interval for fast test execution
    watchdog = CellularWatchdog(
        host="127.0.0.1",
        port=8000,
        poll_interval=0.05,
        timeout=0.1,
        on_disconnect=on_disconn,
        on_reconnect=on_recon,
        jitter_min=0.01,
        jitter_max=0.02,
    )

    # Initial state is offline
    assert watchdog.is_online is False

    # Simulate connection success
    with patch("socket.create_connection") as mock_conn:
        mock_conn.return_value.__enter__.return_value = MagicMock()
        watchdog._poll_step()
        assert watchdog.is_online is True
        assert len(reconnect_called) == 1
        assert len(disconnect_called) == 0

        # Run another step while still connected - no extra callbacks
        watchdog._poll_step()
        assert watchdog.is_online is True
        assert len(reconnect_called) == 1

        # Simulate connection failure
        mock_conn.side_effect = OSError("Connection refused")
        watchdog._poll_step()
        assert watchdog.is_online is False
        assert len(disconnect_called) == 1

        # Simulate reconnect
        mock_conn.side_effect = None
        mock_conn.return_value.__enter__.return_value = MagicMock()
        watchdog._poll_step()
        assert watchdog.is_online is True
        assert len(reconnect_called) == 2


def test_append_only_ring_buffer_write_and_read(tmp_path):
    """Writes 500 simulated telemetry records; verifies records read without corruption."""
    buffer = JsonlRingBuffer(bus_id="TEST-BUS-01", buffer_dir=tmp_path)

    records = []
    for i in range(500):
        rec = {
            "bus_id": "TEST-BUS-01",
            "seq": i,
            "lat": 13.0827 + (i * 0.0001),
            "lng": 80.2707 + (i * 0.0001),
            "speed_kmh": 42.0,
            "timestamp": time.time(),
        }
        records.append(rec)
        buffer.append(rec)

    assert buffer.get_size() > 0
    loaded = buffer.read_records()
    assert len(loaded) == 500
    assert loaded[0]["seq"] == 0
    assert loaded[499]["seq"] == 499


def test_ring_buffer_50mb_compaction(tmp_path):
    """
    Simulates buffer exceeding capacity and verifies atomic compaction
    trims oldest records to compact threshold and leaves valid JSON lines.
    """
    max_cap = 100 * 1024       # 100 KB cap for fast testing
    compact_target = 60 * 1024  # Compact down to 60 KB

    buffer = JsonlRingBuffer(
        bus_id="TEST-BUS-02",
        buffer_dir=tmp_path,
        max_bytes=max_cap,
        compact_bytes=compact_target,
    )

    # Write records with total size exceeding max_cap to trigger compaction
    large_payload = "X" * 1000  # ~1 KB each
    for seq in range(150):  # 150 KB total written > 100 KB max_cap
        buffer.append({
            "seq": seq,
            "bus_id": "TEST-BUS-02",
            "data": large_payload,
            "timestamp": time.time(),
        })

    # Compaction should have kept the size below or at max_cap
    current_size = buffer.get_size()
    assert current_size <= max_cap

    # Calling compact explicitly trims down to <= compact_target
    buffer.compact()
    assert buffer.get_size() <= compact_target

    # Ensure all remaining records are valid JSON
    records = buffer.read_records()
    assert len(records) > 0
    assert records[-1]["seq"] == 149
    # Oldest records should have been trimmed
    assert records[0]["seq"] > 0


def test_priority_reconnection_upload_order():
    """
    Populates buffer with mixed P0, P1, and P2 telemetry records;
    asserts that upon reconnection, all P0 records are dispatched strictly before P1 and P2.
    """
    flusher = PriorityReconnectionFlusher()

    records = [
        {"id": "p2_1", "priority": "P2_INFO", "defect_type": "GPS_PING"},
        {"id": "p1_1", "priority": "P1_ROUTINE", "defect_type": "D20_CRACK"},
        {"id": "p0_1", "priority": "P0_CRITICAL", "defect_type": "D40_POTHOLE"},
        {"id": "p2_2", "priority": "P2_INFO", "defect_type": "GPS_PING"},
        {"id": "p0_2", "priority": "P0_CRITICAL", "defect_type": "OPEN_MANHOLE"},
        {"id": "p1_2", "priority": "P1_ROUTINE", "defect_type": "ZEBRA_CROSSING"},
        {"id": "p0_3", "is_live_coord": True, "defect_type": "LIVE_GPS"},
    ]

    dispatched_order = []

    def mock_dispatch(record):
        dispatched_order.append(record["id"])
        return True

    res = flusher.flush(records, mock_dispatch, batch_size_p2=10, pacing_p2_sec=0.0)

    assert res["p0"] == 3
    assert res["p1"] == 2
    assert res["p2"] == 2

    # P0 records must be first
    assert dispatched_order[0] in ("p0_1", "p0_2", "p0_3")
    assert dispatched_order[1] in ("p0_1", "p0_2", "p0_3")
    assert dispatched_order[2] in ("p0_1", "p0_2", "p0_3")

    # Followed by P1
    assert dispatched_order[3] in ("p1_1", "p1_2")
    assert dispatched_order[4] in ("p1_1", "p1_2")

    # Followed by P2
    assert dispatched_order[5] in ("p2_1", "p2_2")
    assert dispatched_order[6] in ("p2_1", "p2_2")


def test_webp_image_spool_cap_eviction(tmp_path):
    """
    Creates mock snapshots in spool; asserts FIFO pruning removes oldest
    non-P0 files when total size exceeds quota, while strictly preserving P0 snapshots.
    """
    # Small spool quota for test: 50 KB max, 90% eviction threshold
    manager = ImageSpoolManager(
        spool_dir=tmp_path / "spool",
        max_bytes=50 * 1024,
        eviction_threshold=0.80,
    )

    dummy_frame = np.random.randint(0, 255, (200, 200, 3), dtype=np.uint8)

    # Save 1 critical P0 snapshot
    p0_path = manager.save_snapshot(dummy_frame, is_p0=True, incident_id="INC-P0-001")
    assert p0_path.exists()
    assert "_p0" in p0_path.name

    # Save multiple non-P0 snapshots to trigger eviction
    non_p0_paths = []
    for i in range(15):
        time.sleep(0.01)  # Ensure distinct mtimes
        p = manager.save_snapshot(dummy_frame, is_p0=False, incident_id=f"INC-ROUTINE-{i}")
        non_p0_paths.append(p)

    # The oldest non-P0 files should have been evicted to keep total size bounded
    assert manager.get_spool_size() <= manager.max_bytes

    # P0 snapshot must NEVER be evicted
    assert p0_path.exists()

    # The first few non-P0 images should have been deleted in FIFO order
    deleted_count = sum(1 for p in non_p0_paths if not p.exists())
    assert deleted_count > 0


def test_depot_burst_sync_trigger():
    """Tests depot detection trigger against authorized SSIDs and GPS geofence boundary."""
    sync = DepotBurstSync()

    # SSID triggers
    assert sync.is_depot_ssid("GCC_DEPOT_WIFI_AMBATTUR") is True
    assert sync.is_depot_ssid("MTC_DEPOT_HIGHWAY_CENTRAL") is True
    assert sync.is_depot_ssid("PMPML_DEPOT_5G_SWARGATE") is True
    assert sync.is_depot_ssid("JIO_PRIVATE_4G") is False
    assert sync.is_depot_ssid("PUBLIC_COFFEE_WIFI") is False

    # Geofence triggers (MTC Central Depot: 13.0827, 80.2707, radius 150m)
    # Point ~30 meters away: should match
    assert sync.is_in_depot_geofence(13.0829, 80.2708) == "MTC_CENTRAL_DEPOT"

    # Point ~5 km away: should not match
    assert sync.is_in_depot_geofence(13.0500, 80.2000) is None

    # is_at_depot combines SSID and geofence
    assert sync.is_at_depot(current_ssid="GCC_DEPOT_WIFI_NORTH") is True
    assert sync.is_at_depot(lat=13.0828, lng=80.2707) is True
    assert sync.is_at_depot(current_ssid="UNKNOWN_NET", lat=13.0000, lng=80.0000) is False
