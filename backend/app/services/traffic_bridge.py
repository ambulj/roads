import uuid
import time
from typing import Dict, Any, Optional, Union
import numpy as np
import cv2
from sqlalchemy.orm import Session

from app.services.yolo_inference import yolo_engine
from app.services.pedestrian_safety import pedestrian_safety_engine
from app.models.db_models import DBTrafficDensity

class VehicleDetectionTrafficBridge:
    """
    Bridge Service connecting Ultralytics Neural Vehicle Detection (vehicle_detection.pt)
    directly into the Intelligent Transportation Systems (ITS) Traffic Ingest Pipeline.
    
    Extracts multi-class vehicle counts from video frames/dashcams, calculates
    Passenger Car Units (PCU) per IRC:106-1990, computes Highway Capacity Manual (HCM)
    Level of Service (LoS A-F), and commits records into DBTrafficDensity.
    """

    @staticmethod
    def decode_frame(image_input: Union[bytes, str, np.ndarray]) -> Optional[np.ndarray]:
        if isinstance(image_input, np.ndarray):
            return image_input
        elif isinstance(image_input, bytes):
            nparr = np.frombuffer(image_input, np.uint8)
            return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        elif isinstance(image_input, str):
            import base64
            if "," in image_input:
                image_input = image_input.split(",")[1]
            raw = base64.b64decode(image_input)
            nparr = np.frombuffer(raw, np.uint8)
            return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return None

    def process_and_ingest_frame(
        self,
        image_input: Union[bytes, str, np.ndarray],
        corridor_id: str,
        road_name: str,
        lat: float,
        lng: float,
        average_speed_kmh: float = 35.0,
        free_flow_speed_kmh: float = 50.0,
        reported_by: str = "EDGE-MDVR-CH1",
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Executes real neural inference using vehicle_detection.pt and commits
        the traffic telemetry to the database.
        """
        start_t = time.perf_counter()
        frame = self.decode_frame(image_input)
        if frame is None or frame.size == 0:
            return {"success": False, "error": "Invalid or unreadable image frame"}

        h, w = frame.shape[:2]
        detected_vehicles = []
        counts = {"2w": 0, "3w": 0, "4w": 0, "bus": 0, "truck": 0, "other": 0}

        # 1. Neural Vehicle Detection Inference (vehicle_detection.pt)
        if yolo_engine.vehicle_model is not None:
            try:
                results = yolo_engine.vehicle_model(frame, conf=0.22, device=yolo_engine.device, verbose=False)[0]
                for box in results.boxes:
                    cls_id = int(box.cls[0].item())
                    conf = float(box.conf[0].item())
                    lbl = results.names.get(cls_id, "car").lower()
                    xyxy = box.xyxy[0].cpu().numpy().astype(int).tolist()

                    detected_vehicles.append({
                        "label": lbl,
                        "class_id": cls_id,
                        "confidence": round(conf, 3),
                        "bbox_pixels": xyxy
                    })

                    # Categorize into IRC:106 Vehicle Classes
                    if "bike" in lbl or "motorcycle" in lbl or "scooter" in lbl:
                        counts["2w"] += 1
                    elif "auto" in lbl or "rickshaw" in lbl:
                        counts["3w"] += 1
                    elif "car" in lbl or "van" in lbl or "suv" in lbl:
                        counts["4w"] += 1
                    elif "bus" in lbl:
                        counts["bus"] += 1
                    elif "truck" in lbl or "lorry" in lbl:
                        counts["truck"] += 1
                    else:
                        counts["other"] += 1
            except Exception as e:
                print(f"[TRAFFIC BRIDGE] Vehicle model inference error: {e}")

        # 2. Compute Density & Level of Service (IRC:106 / HCM)
        density_metrics = pedestrian_safety_engine.compute_vehicle_density(w, h, detected_vehicles)
        
        # 3. Calculate Congestion Level & Bottleneck Impedance
        free_speed = max(20.0, free_flow_speed_kmh)
        speed_ratio = average_speed_kmh / free_speed
        
        if speed_ratio >= 0.80:
            congestion = "FREE_FLOW"
            is_bottleneck = False
            cause = None
        elif speed_ratio >= 0.50:
            congestion = "MODERATE"
            is_bottleneck = False
            cause = None
        elif speed_ratio >= 0.30:
            congestion = "CONGESTED"
            is_bottleneck = True
            cause = f"High Vehicle Volume ({len(detected_vehicles)} vehicles, PCU: {density_metrics['pcu_count']})"
        else:
            congestion = "GRIDLOCK"
            is_bottleneck = True
            cause = f"Corridor Saturation / Stall (LoS: {density_metrics['los_grade']})"

        record_id = f"dens-bridge-{uuid.uuid4().hex[:8]}"
        record_data = {
            "id": record_id,
            "corridor_id": corridor_id,
            "road_name": road_name,
            "lat": lat,
            "lng": lng,
            "vehicle_count": len(detected_vehicles),
            "density_pcu_per_km": density_metrics["pcu_count"],
            "average_speed_kmh": round(average_speed_kmh, 1),
            "free_flow_speed_kmh": round(free_speed, 1),
            "congestion_level": congestion,
            "is_bottleneck": is_bottleneck,
            "bottleneck_cause": cause,
            "reported_by": reported_by,
            "measured_at": "Just now"
        }

        # 4. Commit to DB if session provided
        if db is not None:
            try:
                db_record = DBTrafficDensity(**record_data)
                db.add(db_record)
                db.commit()
            except Exception as e:
                print(f"[TRAFFIC BRIDGE] DB commit error: {e}")
                db.rollback()

        elapsed_ms = round((time.perf_counter() - start_t) * 1000, 1)

        return {
            "success": True,
            "inference_time_ms": elapsed_ms,
            "record": record_data,
            "counts": counts,
            "density_metrics": density_metrics,
            "detected_vehicles_count": len(detected_vehicles),
            "detected_vehicles": detected_vehicles
        }

traffic_bridge = VehicleDetectionTrafficBridge()
