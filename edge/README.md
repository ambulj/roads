# SheherSaathi Onboard Edge Computing Daemon

The `edge_agent.py` daemon transforms any vehicle computer, Raspberry Pi 4/5, NVIDIA Jetson Orin Nano, Orange Pi RK3588, or local laptop into an **Autonomous Edge AI Node**.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run on Local Camera (Webcam or USB Cam)
```bash
python edge_agent.py --bus-id BUS-TN01-1042 --source 0 --server-url http://localhost:8000
```

### 3. Run on a Video File (Simulated Transit Run)
```bash
python edge_agent.py --bus-id BUS-TN01-1042 --source ../backend/uploads/sample_clips/clip_crosswalk_safety.mp4 --server-url http://localhost:8000
```

### 4. Run on an IP Camera / RTSP Stream
```bash
python edge_agent.py --bus-id BUS-TN01-1042 --source rtsp://admin:pass@192.168.1.100:554/ch1 --server-url http://192.168.1.10:8000
```

---

## ⚙️ Command Line Arguments

| Parameter | Default | Description |
| :--- | :--- | :--- |
| `--bus-id` | `BUS-TN01-1042` | Unique identifier for the vehicle node in the City Brain GIS |
| `--source` | `0` | Camera index (`0`, `1`), RTSP URL (`rtsp://...`), or path to `.mp4` |
| `--server-url` | `http://localhost:8000` | Central SheherSaathi server endpoint |
| `--device` | `cuda` | Inference accelerator (`cuda`, `cpu`, `mps`, `openvino`) |
| `--fps` | `30.0` | Target edge inference frame rate |
| `--conf` | `0.35` | Neural hazard detection confidence threshold |
| `--simulate-imu` | `True` | Correlates optical pothole detections with simulated 6-axis IMU vertical shocks |

---

## 🛡️ Key Features

1. **In-RAM DPDP Act 2023 Privacy Redaction**: Faces and bystanders are anonymized before any data is logged or transmitted.
2. **3-Tier Telemetry**:
   * **P0 Critical** (Immediate 4G/5G Push): Transmits minimal JSON payload (<2 KB) with GPS coordinates and depth estimation.
   * **P1 Routine** (Offline Ring Buffer): Buffers minor defects in `edge_buffer_<bus_id>.json` and syncs in compressed batches.
3. **Bandwidth Savings**: Reduces data consumption by **>98.5%** compared to continuous video streaming.
