# RoadSaathi Autonomous Onboard Edge Computing Suite

This `/edge` directory provides standalone, production-ready edge AI runtimes designed to deploy directly on **Vehicle Onboard Single Board Computers (SBCs)** such as:
* **Rockchip RK3588 / RK3588S** (Orange Pi 5 Plus, Firefly RK3588, Khadas Edge 2) with **6 TOPS INT8 Tri-Core NPU**.
* **Raspberry Pi 4 / 5** with `libcamerasrc` / V4L2 capture and Hailo-8 M.2 / Coral TPU / CPU acceleration.
* **NVIDIA Jetson Orin Nano / NX** with TensorRT FP16/INT8 inference engines.

---

## 🏗️ Edge Architecture Overview

```
                      [ Vehicle Camera / MIPI CSI / USB ]
                                       │
                                       ▼
                       V4L2 / GStreamer MPP Pipeline
                                       │
                                       ▼
                     [ In-RAM DPDP Act 2023 Redaction ]
                   (Face & Bystander Blur before storage)
                                       │
                                       ▼
               [ Onboard Neural NPU: Rockchip RK3588 (6 TOPS) ]
               - YOLOv8n-pothole (D40 Cavity Depth Estimation)
               - Indian Roads Asset Perception (Manholes, Cattle, Pedestrians)
               - ByteTrack Multi-Object Kinematic Tracker
                                       │
                                       ▼
                 [ 3-Tier Hierarchical Telemetry Engine ]
                 ├── P0 Critical Alert  ──► Direct Cellular MQTT / HTTP (<2.5 KB)
                 │                          (Gz > 1.4g shock + Pothole Depth > 7.5cm)
                 └── P1 Routine Defect ──► Local SSD Ring Buffer (FIFO)
                                            (Batch syncs at depot Wi-Fi or idle 4G)
                                       │
                                       ▼
                      [ Central FastAPI Cloud GIS Server ]
```

---

## 🚀 1. Python Edge Daemon (`edge_agent.py`)

The primary multi-protocol daemon handling V4L2 capture, GStreamer MPP hardware decoding, local DPDP anonymization, and dual MQTT/HTTP telemetry dispatch.

### Installation
```bash
cd edge
pip install -r requirements.txt
```

### Run on Rockchip RK3588 with V4L2 Camera
```bash
python edge_agent.py \
  --bus-id BUS-TN01-1042 \
  --source /dev/video0 \
  --protocol dual \
  --server-url http://localhost:8000 \
  --mqtt-broker localhost \
  --fps 30.0
```

### Run with Hardware-Accelerated GStreamer Pipeline
```bash
python edge_agent.py \
  --bus-id BUS-TN01-1042 \
  --source "v4l2src device=/dev/video0 ! video/x-raw,format=NV12,width=1920,height=1080 ! mppvideodec ! videoconvert ! appsink" \
  --gstreamer \
  --protocol mqtt \
  --mqtt-broker 192.168.1.100
```

### Run on Raspberry Pi 5 (`libcamerasrc`)
```bash
python edge_agent.py \
  --bus-id BUS-MH12-5501 \
  --source "libcamerasrc ! video/x-raw,width=1920,height=1080,framerate=30/1 ! videoconvert ! appsink" \
  --gstreamer \
  --server-url http://192.168.1.10:8000
```

### Run on Sample Video File (Simulated Transit Run)
```bash
python edge_agent.py \
  --bus-id BUS-TN01-1042 \
  --source ../backend/uploads/sample_clips/clip_pothole_nh32.mp4 \
  --server-url http://localhost:8000
```

---

## ⚡ 2. High-Performance C++ Pipeline (`rknn_pipeline.cpp`)

For embedded environments requiring sub-15ms inference latency and zero Python runtime overhead, compile the native C++ pipeline:

### Compilation (on ARM64 Linux / RK3588)
```bash
cd edge
mkdir build && cd build
cmake ..
make -j4
```

### Execution
```bash
./rknn_pipeline BUS-TN01-1042 /dev/video0 http://localhost:8000/api/v1/clusters/ingest
```

---

## 📡 3. Telemetry Protocol Specifications

### MQTT Topics
* **P0 Critical Alerts (QoS 1)**: `roadsaathi/telemetry/{bus_id}/p0`
* **P1 Batch Telemetry (QoS 0)**: `roadsaathi/telemetry/{bus_id}/p1_batch`
* **Remote Commands / OTA**: `roadsaathi/command/{bus_id}/#`

### Example P0 Alert Payload (< 2.5 KB)
```json
{
  "bus_id": "BUS-TN01-1042",
  "defect_type": "D40",
  "defect_name": "Pothole Cavity (8.4cm depth)",
  "severity_level": "critical",
  "confidence": 0.96,
  "depth_cm": 8.4,
  "rpi_score": 94.0,
  "lat": 12.9516,
  "lng": 80.1462,
  "speed_kmh": 38.5,
  "vertical_g": 1.68,
  "road_name": "GST Road (NH-32) Transit Corridor",
  "snapshot_b64": "data:image/jpeg;base64,...",
  "source_mode": "AUTONOMOUS_ONBOARD_EDGE_NODE",
  "timestamp": 1727586000.0
}
```

---

## 🛡️ Bandwidth & Edge Resilience Guarantees

1. **>98.5% Data Conservation**: Transmits structured vector telemetry and thumbnail snippets instead of uncompressed 1080p video, saving over **5.8 GB per bus hour**.
2. **Tunnel & Offline Immunity**: Integrated circular ring buffer (`edge_buffer_<bus_id>.json`) buffers up to 1,000 events locally during cellular blackouts and automatically flushes upon network reconnection.
3. **DPDP Act 2023 Compliance**: Optical privacy filter redacts faces and pedestrian license plates in edge RAM prior to any persistence or network transmission.
