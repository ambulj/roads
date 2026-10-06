"""
RoadSaathi - Cellular Reconnection Watchdog, Depot Wi-Fi Burst Sync & Store-and-Forward.
Provides edge resilience for transit fleet buses navigating cellular dead zones,
protecting vehicle flash/eMMC storage from wear, and ensuring priority-first
transmission upon network restoration.
"""

import math
import os
from pathlib import Path
import random
import socket
import threading
import time
import uuid
from typing import Any, Callable, Dict, List, Optional, Tuple, Union
import json
import urllib.request
import urllib.error

import cv2
import numpy as np


class CellularWatchdog:
    """
    Asynchronous network polling watchdog daemon thread.
    Evaluates carrier connectivity every 5.0 seconds using lightweight non-blocking
    TCP socket probes to the gateway host:port.
    Implements jittered backoff callbacks (1.0-3.0s) to avoid cellular thundering herds.
    """

    def __init__(
        self,
        host: str = "127.0.0.1",
        port: int = 8000,
        poll_interval: float = 5.0,
        timeout: float = 1.5,
        on_disconnect: Optional[Callable[[], None]] = None,
        on_reconnect: Optional[Callable[[], None]] = None,
        jitter_min: float = 1.0,
        jitter_max: float = 3.0,
    ):
        self.host = host
        self.port = port
        self.poll_interval = poll_interval
        self.timeout = timeout
        self.on_disconnect = on_disconnect
        self.on_reconnect = on_reconnect
        self.jitter_min = jitter_min
        self.jitter_max = jitter_max

        self._is_online = False
        self._lock = threading.Lock()
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None

    @property
    def is_online(self) -> bool:
        with self._lock:
            return self._is_online

    @is_online.setter
    def is_online(self, value: bool) -> None:
        with self._lock:
            self._is_online = value

    def check_connection(self) -> bool:
        """Executes a lightweight TCP connection check."""
        try:
            with socket.create_connection((self.host, self.port), timeout=self.timeout):
                return True
        except (socket.timeout, OSError):
            return False

    def _poll_step(self) -> None:
        """Executes one polling step, triggering state transition callbacks."""
        connected = self.check_connection()
        with self._lock:
            previous_state = self._is_online
            self._is_online = connected

        if previous_state and not connected:
            # Transition from online to offline
            if self.on_disconnect:
                try:
                    self.on_disconnect()
                except Exception:
                    pass
        elif not previous_state and connected:
            # Transition from offline to online: jittered backoff to prevent thundering herd
            if self.jitter_max > 0:
                jitter = random.uniform(self.jitter_min, self.jitter_max)
                time.sleep(jitter)
            if self.on_reconnect:
                try:
                    self.on_reconnect()
                except Exception:
                    pass

    def _run_loop(self) -> None:
        while not self._stop_event.is_set():
            self._poll_step()
            self._stop_event.wait(self.poll_interval)

    def start(self) -> None:
        """Starts background watchdog thread."""
        if self._thread is not None and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run_loop, name="CellularWatchdogThread", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        """Stops background watchdog thread."""
        self._stop_event.set()
        if self._thread is not None:
            self._thread.join(timeout=2.0)
            self._thread = None


class JsonlRingBuffer:
    """
    Append-only 50MB JSONL telemetry ring buffer protecting vehicle flash/eMMC storage.
    Executes atomic compaction to retain the most recent 35MB when file exceeds 50MB.
    """

    DEFAULT_MAX_BYTES = 50 * 1024 * 1024      # 50 MB
    DEFAULT_COMPACT_BYTES = 35 * 1024 * 1024  # 35 MB

    def __init__(
        self,
        bus_id: str,
        buffer_dir: Optional[Union[str, Path]] = None,
        max_bytes: int = DEFAULT_MAX_BYTES,
        compact_bytes: int = DEFAULT_COMPACT_BYTES,
    ):
        self.bus_id = bus_id
        self.dir = Path(buffer_dir) if buffer_dir else Path.cwd()
        self.dir.mkdir(parents=True, exist_ok=True)
        self.file_path = self.dir / f"edge_buffer_{bus_id}.jsonl"
        self.max_bytes = max_bytes
        self.compact_bytes = compact_bytes
        self._lock = threading.Lock()

    def get_size(self) -> int:
        """Returns buffer file size in bytes."""
        try:
            return self.file_path.stat().st_size
        except FileNotFoundError:
            return 0

    def append(self, record: Dict[str, Any]) -> None:
        """
        Appends single JSON line. Checks size and triggers atomic compaction if over cap.
        """
        line = json.dumps(record, separators=(",", ":")) + "\n"
        encoded = line.encode("utf-8")

        with self._lock:
            with open(self.file_path, "ab") as f:
                f.write(encoded)

            if self.get_size() >= self.max_bytes:
                self._compact_locked()

    def read_records(self) -> List[Dict[str, Any]]:
        """Reads all valid JSON records from the ring buffer."""
        records: List[Dict[str, Any]] = []
        if not self.file_path.exists():
            return records

        with self._lock:
            with open(self.file_path, "rb") as f:
                for line in f:
                    line_str = line.decode("utf-8", errors="replace").strip()
                    if line_str:
                        try:
                            records.append(json.loads(line_str))
                        except Exception:
                            continue
        return records

    def compact(self) -> None:
        """Public thread-safe manual compaction trigger."""
        with self._lock:
            self._compact_locked()

    def _compact_locked(self) -> None:
        """
        Atomic FIFO compaction: Retains latest compact_bytes of records.
        Writes to .tmp file, then uses os.replace for crash-safe atomic swap.
        """
        if not self.file_path.exists():
            return

        file_size = self.get_size()
        if file_size <= self.compact_bytes:
            return

        # Read lines from file
        with open(self.file_path, "rb") as f:
            lines = f.readlines()

        # Gather lines from the end until reaching target compact_bytes
        retained_lines: List[bytes] = []
        total_bytes = 0
        for line in reversed(lines):
            line_len = len(line)
            if total_bytes + line_len > self.compact_bytes and retained_lines:
                break
            retained_lines.append(line)
            total_bytes += line_len

        retained_lines.reverse()

        tmp_path = self.file_path.with_suffix(".tmp")
        with open(tmp_path, "wb") as f:
            for line in retained_lines:
                f.write(line)
            f.flush()
            os.fsync(f.fileno())

        # Atomic replacement
        tmp_path.replace(self.file_path)

    def clear(self) -> None:
        """Clears all records in the buffer."""
        with self._lock:
            if self.file_path.exists():
                self.file_path.unlink()


class ImageSpoolManager:
    """
    Compressed WebP image spool manager maintaining a strict disk quota (default 2GB).
    Automatically evicts oldest non-P0 images in FIFO order when disk usage exceeds 90% (1.8GB).
    P0 incident snapshots are strictly protected from routine eviction.
    """

    DEFAULT_MAX_BYTES = 2 * 1024 * 1024 * 1024          # 2 GB
    DEFAULT_THRESHOLD = 0.90                            # 90% (1.8 GB)

    def __init__(
        self,
        spool_dir: Union[str, Path] = "spool/images",
        max_bytes: int = DEFAULT_MAX_BYTES,
        eviction_threshold: float = DEFAULT_THRESHOLD,
    ):
        self.spool_dir = Path(spool_dir)
        self.spool_dir.mkdir(parents=True, exist_ok=True)
        self.max_bytes = max_bytes
        self.eviction_threshold = eviction_threshold
        self._lock = threading.Lock()

    def get_spool_size(self) -> int:
        """Calculates total bytes across all images in the spool."""
        total = 0
        if not self.spool_dir.exists():
            return 0
        for p in self.spool_dir.glob("*.webp"):
            try:
                total += p.stat().st_size
            except FileNotFoundError:
                pass
        return total

    def save_snapshot(
        self,
        image: np.ndarray,
        is_p0: bool = False,
        incident_id: Optional[str] = None,
        quality: int = 75,
    ) -> Path:
        """
        Compresses and saves frame as WebP (quality 75, ~30KB).
        Returns the saved file path.
        """
        timestamp = int(time.time() * 1000)
        u = uuid.uuid4().hex[:8]
        p0_tag = "_p0" if is_p0 else ""
        inc_tag = f"_{incident_id}" if incident_id else ""
        filename = f"{timestamp}_{u}{inc_tag}{p0_tag}.webp"
        file_path = self.spool_dir / filename

        # Encode to WebP
        ret, buf = cv2.imencode(".webp", image, [cv2.IMWRITE_WEBP_QUALITY, quality])
        if not ret:
            raise RuntimeError("Failed to encode frame as WebP")

        with self._lock:
            with open(file_path, "wb") as f:
                f.write(buf)

            # Check quota and evict if usage exceeds threshold
            if self.get_spool_size() > (self.max_bytes * self.eviction_threshold):
                self._evict_oldest_non_p0_locked()

        return file_path

    def evict_oldest_non_p0(self) -> List[Path]:
        """Public trigger to prune oldest non-P0 images until usage is under 80%."""
        with self._lock:
            return self._evict_oldest_non_p0_locked()

    def _evict_oldest_non_p0_locked(self) -> List[Path]:
        """
        FIFO pruning: Deletes oldest non-P0 files until spool size is <= 80% of max_bytes.
        Never deletes P0 incident images!
        """
        target_size = int(self.max_bytes * 0.80)
        evicted: List[Path] = []

        # Find non-P0 files
        non_p0_files: List[Tuple[float, Path]] = []
        for p in self.spool_dir.glob("*.webp"):
            if "_p0" in p.stem:
                continue
            try:
                mtime = p.stat().st_mtime
                non_p0_files.append((mtime, p))
            except FileNotFoundError:
                pass

        # Sort FIFO (oldest mtime first)
        non_p0_files.sort(key=lambda x: x[0])

        current_size = self.get_spool_size()
        for _, p in non_p0_files:
            if current_size <= target_size:
                break
            try:
                size = p.stat().st_size
                p.unlink()
                evicted.append(p)
                current_size -= size
            except FileNotFoundError:
                pass

        return evicted

    def list_snapshots(self, p0_only: bool = False) -> List[Path]:
        """Lists snapshots in spool directory."""
        res: List[Path] = []
        for p in self.spool_dir.glob("*.webp"):
            if p0_only and "_p0" not in p.stem:
                continue
            res.append(p)
        return sorted(res, key=lambda x: x.stat().st_mtime if x.exists() else 0)


class PriorityReconnectionFlusher:
    """
    Priority-first reconnection flusher.
    Drains buffered telemetry in strict hierarchical order:
    - Tier 0 (P0): Critical statutory defects & live coordinates (dispatched immediately).
    - Tier 1 (P1): Routine road distresses (D20, surface ravelling, crosswalks).
    - Tier 2 (P2): Historical breadcrumb GPS pings (flushed in batches of 50 with 500ms pacing).
    """

    P0_CODES = {"D40_POTHOLE", "D40", "OPEN_MANHOLE", "MVA_VIOLATION", "STRAY_ANIMAL_HAZARD", "CONFIRMED_STATUTORY_DEFECT"}
    P1_CODES = {"D20_CRACK", "D20", "RAVELLING", "ZEBRA_CROSSING", "PEDESTRIAN", "OPTICAL_PRELIMINARY"}

    @classmethod
    def classify_tier(cls, record: Dict[str, Any]) -> int:
        """
        Returns priority tier: 0 for P0, 1 for P1, 2 for P2.
        """
        priority_str = str(record.get("priority", "")).upper()
        if "P0" in priority_str or priority_str == "CRITICAL" or record.get("severity_level") == "critical":
            return 0
        if "P1" in priority_str or priority_str == "ROUTINE":
            return 1
        if "P2" in priority_str or priority_str == "INFO":
            return 2

        code = str(record.get("defect_type", record.get("code", ""))).upper()
        if code in cls.P0_CODES:
            return 0
        if code in cls.P1_CODES:
            return 1

        # Check if live coordinates vs historical breadcrumb
        if record.get("is_live_coord", False):
            return 0

        # Default to Tier 2 (breadcrumbs/routine)
        return 2

    @classmethod
    def sort_by_priority(cls, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Sorts records such that all P0 records appear first, then P1, then P2.
        Preserves original relative order within each tier.
        """
        tier0 = []
        tier1 = []
        tier2 = []
        for r in records:
            t = cls.classify_tier(r)
            if t == 0:
                tier0.append(r)
            elif t == 1:
                tier1.append(r)
            else:
                tier2.append(r)
        return tier0 + tier1 + tier2

    def flush(
        self,
        records: List[Dict[str, Any]],
        dispatch_fn: Callable[[Dict[str, Any]], bool],
        batch_size_p2: int = 50,
        pacing_p2_sec: float = 0.5,
    ) -> Dict[str, int]:
        """
        Dispatches records in priority order:
        - All Tier 0 records first
        - All Tier 1 records next
        - Tier 2 records in batches of batch_size_p2 with pacing delay between batches.
        Returns dict with dispatch counts: {'p0': int, 'p1': int, 'p2': int}.
        """
        tier0 = []
        tier1 = []
        tier2 = []
        for r in records:
            t = self.classify_tier(r)
            if t == 0:
                tier0.append(r)
            elif t == 1:
                tier1.append(r)
            else:
                tier2.append(r)

        sent = {"p0": 0, "p1": 0, "p2": 0}

        # 1. Dispatch Tier 0 (Immediate)
        for r in tier0:
            if dispatch_fn(r):
                sent["p0"] += 1

        # 2. Dispatch Tier 1
        for r in tier1:
            if dispatch_fn(r):
                sent["p1"] += 1

        # 3. Dispatch Tier 2 in batches with pacing
        for i in range(0, len(tier2), batch_size_p2):
            batch = tier2[i : i + batch_size_p2]
            for r in batch:
                if dispatch_fn(r):
                    sent["p2"] += 1
            if i + batch_size_p2 < len(tier2) and pacing_p2_sec > 0:
                time.sleep(pacing_p2_sec)

        return sent


class DepotBurstSync:
    """
    Automated geofenced / SSID municipal depot Wi-Fi burst sync.
    Detects depot presence via Wi-Fi SSID inspection or GPS geofence boundary (radius <= 150m),
    triggering high-speed concurrent uploads of forensic snapshots and buffered telemetry.
    """

    AUTHORIZED_SSID_PREFIXES = (
        "GCC_DEPOT_WIFI_",
        "MTC_DEPOT_HIGHWAY_",
        "PMPML_DEPOT_5G",
    )

    # Standard depot reference coordinates
    DEFAULT_DEPOTS = [
        {"name": "MTC_CENTRAL_DEPOT", "lat": 13.0827, "lng": 80.2707, "radius_m": 150.0},
        {"name": "GCC_AMBATTUR_DEPOT", "lat": 13.0984, "lng": 80.1612, "radius_m": 150.0},
        {"name": "PMPML_SWARGATE_DEPOT", "lat": 18.5018, "lng": 73.8584, "radius_m": 150.0},
    ]

    def __init__(
        self,
        authorized_prefixes: Optional[Tuple[str, ...]] = None,
        depots: Optional[List[Dict[str, Any]]] = None,
    ):
        self.authorized_prefixes = authorized_prefixes or self.AUTHORIZED_SSID_PREFIXES
        self.depots = depots or self.DEFAULT_DEPOTS

    def is_depot_ssid(self, ssid: str) -> bool:
        """Returns True if SSID matches authorized municipal depot prefixes."""
        if not ssid:
            return False
        return any(ssid.startswith(prefix) for prefix in self.authorized_prefixes)

    @staticmethod
    def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculates distance in meters between two WGS84 GPS coordinates."""
        r = 6371000.0  # Earth radius in meters
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return r * c

    def is_in_depot_geofence(self, lat: float, lng: float) -> Optional[str]:
        """
        Returns the depot name if coordinates fall within its configured radius (<=150m),
        otherwise None.
        """
        for depot in self.depots:
            radius = depot.get("radius_m", 150.0)
            dist = self.haversine_distance_m(lat, lng, depot["lat"], depot["lng"])
            if dist <= radius:
                return depot["name"]
        return None

    def is_at_depot(
        self,
        current_ssid: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
    ) -> bool:
        """Checks both SSID and GPS geofence triggers for depot presence."""
        if current_ssid and self.is_depot_ssid(current_ssid):
            return True
        if lat is not None and lng is not None and self.is_in_depot_geofence(lat, lng):
            return True
        return False

    def sync_depot_burst(
        self,
        server_url: str,
        bus_id: str,
        records: List[Dict[str, Any]],
        images: Optional[List[Path]] = None,
        timeout: float = 10.0,
    ) -> bool:
        """
        Dispatches high-speed burst sync package to /api/v1/fleet/edge-sync.
        """
        endpoint = f"{server_url.rstrip('/')}/api/v1/fleet/edge-sync"
        payload = {
            "bus_id": bus_id,
            "sync_type": "DEPOT_WIFI_BURST_SYNC",
            "packet_count": len(records),
            "packets": records,
            "timestamp": time.time(),
        }

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            endpoint,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.status in (200, 201)
        except Exception:
            return False
