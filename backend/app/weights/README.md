# YOLO Model Weights Directory

Place your custom trained YOLO model weights (`.pt` or `.onnx`) in this folder.

### Supported File Names:
1. `zebra_crossing.pt` (Priority target for zebra crossing detection)
2. `best.pt` (Standard Ultralytics YOLO export name)
3. `pothole_yolo.pt`
4. `yolov8n.pt` / `yolov8s.pt` / `yolov11n.pt`

### Automatic Discovery:
The RoadSaarthi inference engine (`backend/app/services/yolo_inference.py`) automatically scans this directory on startup. If `zebra_crossing.pt` or `best.pt` is found, it automatically loads your custom model.

If no custom file is dropped here yet, the engine uses an intelligent hybrid detector (Ultralytics base model + IRC:35 road stripe morphological analyzer) so the system works out-of-the-box!
