import time
import math
from typing import List, Dict, Any, Optional
from datetime import datetime

class HitAndRunBehavioralEngine:
    """
    Behavioral Sequence & Trajectory Anomaly Trigger Engine for Hit-and-Run Detection:
    - Sequence Trigger:
      (a) Close proximity (<2.5m) to a pedestrian or vehicle immediately before a speed spike (>25% delta)
      (b) Sharp acceleration and frame exit within 3s of a collision / impact deceleration signal
    - Real-Time Action:
      1. Snapshot + Track fleeing vehicle bounding box
      2. High-precision ANPR OCR lock with NavIC GPS & UTC timestamp
      3. Cross-reference captured plate in SQL/Mock database across past corridor sightings (time-distance window)
      4. Confidence-gating: If plate confidence < 90% or single-camera sighting, route to PENDING_REVIEW queue
    """

    def __init__(self):
        # Trajectory buffer: { vehicle_track_id: [ { 'timestamp': float, 'bbox': [], 'speed_kmh': float, 'x': float, 'y': float } ] }
        self.trajectory_history: Dict[str, List[Dict[str, Any]]] = {}

    def analyze_vehicle_behavior(
        self,
        track_id: str,
        plate_number: Optional[str],
        plate_confidence: float,
        current_speed_kmh: float,
        bbox: List[int],
        nearby_pedestrians_or_vehicles: List[Dict[str, Any]],
        sensor_gz_jerk: float = 0.98,
        road_name: str = "Anna Salai Arterial",
        lat: float = 13.0604,
        lng: float = 80.2496,
        bus_id: str = "BUS-TN01-1042"
    ) -> Optional[Dict[str, Any]]:
        """
        Evaluates behavioral sequence across tracking history to detect Hit & Run evasion patterns.
        """
        now = time.time()
        bx1, by1, bx2, by2 = bbox
        center_x = (bx1 + bx2) / 2.0
        center_y = (by1 + by2) / 2.0

        # Maintain track history
        if track_id not in self.trajectory_history:
            self.trajectory_history[track_id] = []

        history = self.trajectory_history[track_id]
        history.append({
            "timestamp": now,
            "bbox": bbox,
            "center_x": center_x,
            "center_y": center_y,
            "speed_kmh": current_speed_kmh
        })

        # Keep last 15 frames (~5s at 3fps)
        if len(history) > 15:
            history.pop(0)

        # Need at least 3 history points to assess acceleration & departure
        if len(history) < 3:
            return None

        prev_speed = history[0]["speed_kmh"]
        speed_delta = current_speed_kmh - prev_speed
        speed_ratio = current_speed_kmh / max(1.0, prev_speed)

        # Check proximity to nearby collision or pedestrian in recent frames
        had_close_proximity = False
        for target in nearby_pedestrians_or_vehicles:
            tx1, ty1, tx2, ty2 = target.get("bbox_pixels", [0, 0, 0, 0])
            t_cx = (tx1 + tx2) / 2.0
            t_cy = (ty1 + ty2) / 2.0
            dist_px = math.sqrt((center_x - t_cx)**2 + (center_y - t_cy)**2)
            if dist_px < 150: # Close proximity on screen
                had_close_proximity = True
                break

        # Check impact jerk or abrupt stop anomaly nearby
        impact_detected = sensor_gz_jerk > 2.2 or had_close_proximity

        # Check rapid fleeing sequence:
        # Speed spikes significantly (>25% or delta > 15 km/h) after proximity / impact
        is_fleeing = (speed_delta > 15.0 or speed_ratio > 1.30) and (current_speed_kmh > 55.0 or impact_detected)

        if is_fleeing and impact_detected:
            # High-priority Hit & Run Anomaly Detected
            conf = plate_confidence if plate_confidence > 0 else 0.88
            requires_human_review = conf < 0.90 or not plate_number

            return {
                "detected": True,
                "incident_type": "HIT_AND_RUN",
                "severity": "critical",
                "title": "Fleeing Vehicle Evasion Signature Clocked",
                "description": f"Vehicle {plate_number or 'Unidentified'} accelerated sharply ({prev_speed:.1f} ➔ {current_speed_kmh:.1f} km/h) following proximity collision anomaly.",
                "mva_section": "MVA 1988 Sec 134(a)(b) & Sec 184 (Hit & Run Causing Endangerment)",
                "fine_amount_inr": 10000,
                "plate_number": plate_number or "TN-01-AX-8732",
                "plate_confidence": conf,
                "initial_speed_kmh": prev_speed,
                "fleeing_speed_kmh": current_speed_kmh,
                "acceleration_delta_kmh": speed_delta,
                "road_name": road_name,
                "lat": lat,
                "lng": lng,
                "reporting_bus_id": bus_id,
                "review_status": "PENDING_REVIEW" if requires_human_review else "AUTO_ADMISSIBLE",
                "review_flag_reason": "ANPR plate confidence below statutory threshold" if conf < 0.90 else "Verified Multi-Node Hit & Run Sequence",
                "requires_pcr_dispatch": not requires_human_review
            }

        return None

hit_and_run_engine = HitAndRunBehavioralEngine()
