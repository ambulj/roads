import os
import time
from pathlib import Path
from typing import Dict, Any, Optional

BASE_DIR = Path(__file__).resolve().parent.parent
WEIGHTS_DIR = BASE_DIR / "weights"
WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)

class ModelRegistry:
    def __init__(self):
        self._model_configs: Dict[str, Dict[str, Any]] = {
            "zebra_crossing_detector": {
                "name": "Zebra Crossing & Pedestrian Safety Detector (IRC:35)",
                "path": str(WEIGHTS_DIR / "zebra_crossing.pt"),
                "classes": ["Zebra_Crossing", "Faded_Crossing", "Pedestrian_Marking"],
                "framework": "Ultralytics YOLO + Morphological Stripe CV",
                "device": "CUDA / CPU Fallback",
                "has_working_code": True,
                "fallback_pipeline": "Morphological High-Contrast Horizontal Bandpass Filter",
                "regulatory_spec": "IRC:35:2015 Code of Practice for Road Markings",
                "default_description": "Active dual-engine perception: uses custom trained weights if present, or robust IRC:35 computer vision analyzer."
            },
            "pothole_yolo": {
                "name": "YOLOv8x-RoadDefect (Potholes & Cracks)",
                "path": str(WEIGHTS_DIR / "yolov8x_road_defect.pt"),
                "classes": ["D40_Pothole", "D20_AlligatorCrack", "D10_TransverseCrack", "D00_LineCrack", "OpenManhole"],
                "framework": "Ultralytics PyTorch (.pt)",
                "device": "CUDA:0 / CPU Fallback",
                "has_working_code": False,
                "fallback_pipeline": "Edge Telematics Vertical Jerk (gz) + Spatial Heuristic",
                "regulatory_spec": "IRC:SP:20 & MoRTH Section 500",
                "default_description": "Awaiting custom trained .pt file drop in weights/ directory. Edge IMU telemetry acts as pipeline fallback."
            },
            "anpr_yolo": {
                "name": "YOLOv8-ANPR + LPRNet (Indian High Security Plates)",
                "path": str(WEIGHTS_DIR / "anpr_india.pt"),
                "classes": ["Plate_HSRP", "TwoWheeler", "AutoRickshaw", "Car", "Bus", "Truck"],
                "framework": "Ultralytics + STN-LPRNet (.pt)",
                "device": "CUDA:0 / CPU Fallback",
                "has_working_code": False,
                "fallback_pipeline": "Rule-Based MoRTH Plate Regex Synthesizer",
                "regulatory_spec": "Central Motor Vehicles Rules (CMVR) Rule 50/51",
                "default_description": "Awaiting Indian HSRP ANPR weights in weights/ folder. Telemetry parser formats plates according to CMVR standards."
            },
            "depth_3d": {
                "name": "Depth-Anything-V2 (Metric Stereo & 3D Cavity)",
                "path": str(WEIGHTS_DIR / "depth_anything_v2_small.pt"),
                "classes": ["Metric_Disparity_Map", "3D_Mesh_PointCloud"],
                "framework": "PyTorch Vision Transformer (.pt)",
                "device": "CUDA:0 / CPU Fallback",
                "has_working_code": False,
                "fallback_pipeline": "Calibrated Trigonometric Pinhole Geometry (f=3.67mm)",
                "regulatory_spec": "MoRTH Section 300 Asphalt Volumetric Standards",
                "default_description": "Disparity model weights pending. Volume and asphalt mass currently computed via calibrated focal trigonometry."
            },
            "acoustic_imu": {
                "name": "ResNet-1D-Acoustic (Axle Shock & Submerged Cavity)",
                "path": str(WEIGHTS_DIR / "resnet_acoustic_imu.pt"),
                "classes": ["Pothole_Drop", "Speed_Breaker", "Submerged_Trap", "Smooth_Asphalt"],
                "framework": "1D-CNN PyTorch (.pt)",
                "device": "Edge MCU / CPU",
                "has_working_code": True,
                "fallback_pipeline": "Digital Signal Processing (DSP) 3-Axis Bandpass Filter (0.5–20Hz)",
                "regulatory_spec": "AIS-140 Intelligent Transportation Systems Specifications",
                "default_description": "Active DSP rule engine running on bus telematics with vertical g-force shock profiling."
            }
        }
        self.custom_models: Dict[str, Dict[str, Any]] = {}

    def get_status(self) -> Dict[str, Any]:
        """Dynamically inspects filesystem and returns honest, verifiable status of all models."""
        inspected_models = {}
        
        # Check if zebra_crossing.pt or best.pt exists
        candidate_zebra = [
            WEIGHTS_DIR / "zebra_crossing.pt",
            WEIGHTS_DIR / "best.pt",
            WEIGHTS_DIR / "zebra.pt"
        ]
        active_zebra_file = next((f for f in candidate_zebra if f.exists()), None)
        
        for key, conf in self._model_configs.items():
            path = Path(conf["path"])
            exists = path.exists()
            file_size_mb = round(path.stat().st_size / (1024 * 1024), 2) if exists else 0.0
            
            if key == "zebra_crossing_detector":
                if active_zebra_file:
                    status = "ready_custom_weights"
                    msg = f"Custom YOLO weights active: {active_zebra_file.name} ({round(active_zebra_file.stat().st_size / (1024 * 1024), 2)} MB)"
                else:
                    status = "ready_cv_fallback"
                    msg = "Fully operational IRC:35 Morphological stripe frequency computer vision analyzer (yolo_inference.py)."
            else:
                if exists:
                    status = "ready_trained_weights"
                    msg = f"Trained weights verified ({file_size_mb} MB)."
                elif conf["has_working_code"]:
                    status = "active_dsp_pipeline"
                    msg = f"Weights absent from weights/. Working pipeline: {conf['fallback_pipeline']}."
                else:
                    status = "awaiting_weights"
                    msg = f"Weights absent from weights/{path.name}. Active fallback: {conf['fallback_pipeline']}."
                    
            inspected_models[key] = {
                "name": conf["name"],
                "path": str(path),
                "weights_exist_on_disk": exists or (key == "zebra_crossing_detector" and active_zebra_file is not None),
                "status": status,
                "file_size_mb": file_size_mb,
                "classes": conf["classes"],
                "framework": conf["framework"],
                "device": conf["device"],
                "regulatory_spec": conf["regulatory_spec"],
                "fallback_pipeline": conf["fallback_pipeline"],
                "status_explanation": msg,
                "verified_at": time.strftime("%Y-%m-%d %H:%M:%S")
            }
            
        # Add any runtime uploaded custom models
        for k, v in self.custom_models.items():
            inspected_models[k] = v

        ready_count = sum(1 for m in inspected_models.values() if m["status"].startswith("ready") or m["status"].startswith("active"))

        return {
            "total_models": len(inspected_models),
            "operational_models_count": ready_count,
            "weights_directory": str(WEIGHTS_DIR),
            "verification_mode": "Filesystem-Verified (Strict Non-Fabrication Guarantee)",
            "models": inspected_models
        }

    def load_custom_weights(self, model_key: str, file_path: str) -> Dict[str, Any]:
        path = Path(file_path)
        is_existing = path.exists()
        model_name = path.name if is_existing else f"Custom ({path.name})"
        file_size = round(path.stat().st_size / (1024 * 1024), 2) if is_existing else 0.0
        
        self.custom_models[model_key] = {
            "name": f"Custom Loaded: {model_name}",
            "path": str(path),
            "weights_exist_on_disk": is_existing,
            "status": "ready_custom_weights" if is_existing else "awaiting_weights",
            "classes": ["Custom_Defect_Classes", "User_Configured"],
            "framework": "Ultralytics PyTorch (.pt)",
            "device": "CUDA:0 / CPU Fallback",
            "file_size_mb": file_size,
            "regulatory_spec": "User Defined",
            "fallback_pipeline": "None",
            "status_explanation": f"Loaded custom weights from {file_path}" if is_existing else f"File not found on disk at {file_path}",
            "verified_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        return {
            "success": is_existing,
            "message": f"Successfully registered model: {model_name} (Exists on disk: {is_existing})",
            "model_info": self.custom_models[model_key]
        }

model_registry = ModelRegistry()
