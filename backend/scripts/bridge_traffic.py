#!/usr/bin/env python3
"""
bridge_traffic.py — Neural Vehicle Detection -> Traffic Ingest Automation Bridge.
Reads camera streams or image folders, runs vehicle_detection.pt, computes IRC:106 PCU
and HCM Level of Service (LoS), and writes records directly to /api/traffic/ingest.
"""

import sys
import os
import time
import base64
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

import cv2
import requests
from app.services.traffic_bridge import traffic_bridge
from app.storage.database import SessionLocal

def run_bridge_on_image(image_path: str, corridor_id: str = "corridor-annasalai", road_name: str = "Anna Salai Arterial"):
    print(f"[BRIDGE] Processing image: {image_path}")
    bgr = cv2.imread(image_path)
    if bgr is None:
        print(f"[BRIDGE ERROR] Failed to load image: {image_path}")
        return None

    db = SessionLocal()
    try:
        res = traffic_bridge.process_and_ingest_frame(
            image_input=bgr,
            corridor_id=corridor_id,
            road_name=road_name,
            lat=13.0550,
            lng=80.2450,
            average_speed_kmh=38.0,
            free_flow_speed_kmh=50.0,
            reported_by="EDGE-MDVR-CH1",
            db=db
        )
        print(f"[BRIDGE SUCCESS] Processed in {res['inference_time_ms']} ms")
        print(f"  * Detected Vehicles: {res['detected_vehicles_count']}")
        print(f"  * Breakdown: {res['counts']}")
        print(f"  * PCU Count: {res['density_metrics']['pcu_count']} | LoS: Grade {res['density_metrics']['los_grade']} ({res['density_metrics']['traffic_state']})")
        print(f"  * Committed Record ID: {res['record']['id']}")
        return res
    finally:
        db.close()

if __name__ == "__main__":
    test_img = backend_dir / "data" / "test_cache" / "urban_street.jpg"
    if len(sys.argv) > 1:
        test_img = Path(sys.argv[1])
    
    if test_img.exists():
        run_bridge_on_image(str(test_img))
    else:
        print(f"[BRIDGE] Target test image not found: {test_img}")
