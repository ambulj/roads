from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.storage.mock_database import store
from app.models.schemas import FleetNode

router = APIRouter()

HARDWARE_BOM = [
    {
        "id": "optics",
        "category": "OPTICS",
        "title": "Optics & Vision Sensor Module",
        "component": "Sony IMX335 1080p HDR CMOS Sensor",
        "cost_inr": 650,
        "specs": {
            "resolution": "1920x1080 @ 30 FPS",
            "dynamic_range": "120 dB True WDR",
            "low_light": "0.005 Lux Starlight"
        },
        "description": "Wide-angle 120° FOV lens with dynamic auto-exposure and anti-glare polarization filter. Calibrated specifically for Indian road asphalt variations, monsoon water-reflection compensation, and bright tropical sunlight.",
        "tier": "Production Prototype"
    },
    {
        "id": "compute",
        "category": "AI COMPUTE",
        "title": "Neural Processing Unit (NPU) & Edge Compute",
        "component": "Rockchip RK3588 NPU (6 TOPS) / ARM Cortex-A76",
        "cost_inr": 1250,
        "specs": {
            "architecture": "Quad-core A76 + Quad-core A55",
            "npu_throughput": "6.0 TOPS INT8 Peak",
            "power_draw": "6.5W Max Sustained"
        },
        "description": "Onboard heterogeneous neural compute engine running quantized INT8 YOLO11 models for road defect classification and ByteTrack vehicle tracking.",
        "tier": "Automotive Edge SBC"
    },
    {
        "id": "positioning",
        "category": "POSITIONING",
        "title": "GNSS High-Precision Satellite Positioning",
        "component": "u-blox NEO-6M High-Sensitivity GPS Engine",
        "cost_inr": 350,
        "specs": {
            "update_rate": "5 Hz Real-Time Fix",
            "accuracy": "1.5m CEP (SBAS Enabled)",
            "constellations": "GPS + GLONASS + NavIC"
        },
        "description": "High-gain active ceramic patch antenna module maintaining continuous coordinate lock beneath dense metro pillars and multi-level flyovers.",
        "tier": "Industrial Grade"
    },
    {
        "id": "telemetry",
        "category": "TELEMETRY",
        "title": "Cellular Modem & Store-and-Forward Flash",
        "component": "Quectel 4G LTE eSIM + 32GB High-Endurance eMMC",
        "cost_inr": 400,
        "specs": {
            "cellular_bands": "LTE Cat 4 (150 Mbps DL / 50 Mbps UL)",
            "security": "Hardware TLS 1.3 / DTLS 1.2",
            "offline_storage": "32GB Industrial eMMC (500k events)"
        },
        "description": "MQTT-over-TLS telemetry transmission pipeline with local SQLite store-and-forward fallback for cellular dead zones.",
        "tier": "Automotive Grade"
    },
    {
        "id": "power",
        "category": "POWER & CASING",
        "title": "Automotive Power & IP67 Rugged Enclosure",
        "component": "12V/24V Vehicle Regulator & Polycarbonate Shell",
        "cost_inr": 200,
        "specs": {
            "input_voltage": "9V - 36V Wide Input",
            "protection": "Surge, Reverse Polarity, Over-temp",
            "ingress": "IP67 Dust & Water Resistant"
        },
        "description": "Custom vibration-damped polycarbonate windshield suction mount engineered for Indian pothole vibration resistance.",
        "tier": "Ruggedized Transit"
    }
]

@router.get("", response_model=List[FleetNode])
def list_fleet_nodes():
    return store.fleet_nodes

@router.get("/bom")
def get_hardware_bom():
    total_cost = sum(item["cost_inr"] for item in HARDWARE_BOM)
    return {
        "target_max_cost": 3000,
        "total_unit_bom": total_cost,
        "currency": "INR",
        "components": HARDWARE_BOM
    }

@router.get("/{node_id}", response_model=FleetNode)
def get_fleet_node(node_id: str):
    for node in store.fleet_nodes:
        if node["id"] == node_id:
            return node
    raise HTTPException(status_code=404, detail="Fleet node not found")
