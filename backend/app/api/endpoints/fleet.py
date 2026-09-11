from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.storage.database import get_db
from app.storage.mock_database import store
from app.models.schemas import FleetNode, FleetNodeCreate
from app.models.db_models import DBFleetNode
from app.services.stream_manager import stream_manager
from app.api.websockets import manager

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
def list_fleet_nodes(db: Session = Depends(get_db)):
    """Retrieve all transit bus fleet nodes directly from persistent database."""
    rows = db.query(DBFleetNode).all()
    if not rows:
        return store.fleet_nodes
    
    return [
        FleetNode(
            id=r.id,
            route_name=r.route_name,
            route_code=r.route_code,
            vehicle_type=r.vehicle_type,
            npu_hardware=r.npu_hardware,
            camera_model=r.camera_model,
            is_online=r.is_online,
            speed_kmh=r.speed_kmh,
            lat=r.lat,
            lng=r.lng,
            heading=r.heading,
            last_ping_at=r.last_ping_at or "Just now",
            raw_ingests_count=r.raw_ingests_count,
            edge_fps=r.edge_fps,
            imu_jerk_gz=r.imu_jerk_gz,
            dvr_channels=r.dvr_channels or 4,
            dvr_ip=r.dvr_ip,
            camera_position=r.camera_position or "FRONT_WINDSHIELD",
            cameras_config=r.cameras_config
        )
        for r in rows
    ]

@router.post("", response_model=Dict[str, Any], status_code=201)
async def create_fleet_node(payload: FleetNodeCreate, db: Session = Depends(get_db)):
    """Registers a new transit bus node with multi-channel MDVR streaming in persistent DB."""
    bus_id = payload.id.strip().upper()
    existing = db.query(DBFleetNode).filter(DBFleetNode.id == bus_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Bus node {bus_id} already exists in the fleet database.")

    node_data = {
        "id": bus_id,
        "route_name": payload.route_name,
        "route_code": payload.route_code,
        "vehicle_type": payload.vehicle_type or "MTC Electric Low-Floor",
        "npu_hardware": payload.npu_hardware or "Rockchip RK3588 (6 TOPS)",
        "camera_model": payload.camera_model or "Sony IMX335 1080p HDR 4-CH MDVR",
        "dvr_channels": payload.dvr_channels or 4,
        "dvr_ip": payload.dvr_ip or "192.168.1.100",
        "is_online": payload.is_online if payload.is_online is not None else True,
        "edge_fps": payload.edge_fps or 30.0,
        "lat": payload.last_lat or payload.lat or 13.0067,
        "lng": payload.last_lng or payload.lng or 80.2030,
        "corridor": payload.corridor or "Metropolitan Transit Corridor",
        "camera_position": payload.camera_position or "FRONT_WINDSHIELD",
        "cameras_config": payload.cameras_config
    }

    rtsp = payload.rtsp_url or payload.rtsp_base_url
    if rtsp:
        stream_manager.configure_stream(
            bus_id=bus_id,
            stream_type=payload.camera_model or "RTSP_IP_CAMERA",
            video_url=rtsp,
            sampling_fps=payload.edge_fps or 30.0,
            dvr_channels=payload.dvr_channels or 4,
            dvr_ip=payload.dvr_ip
        )

    new_node = DBFleetNode(
        id=bus_id,
        route_name=node_data["route_name"],
        route_code=node_data["route_code"],
        vehicle_type=node_data["vehicle_type"],
        npu_hardware=node_data["npu_hardware"],
        camera_model=node_data["camera_model"],
        is_online=node_data["is_online"],
        speed_kmh=35.0,
        lat=node_data["lat"],
        lng=node_data["lng"],
        heading=45.0,
        last_ping_at="Just now",
        raw_ingests_count=0,
        edge_fps=node_data["edge_fps"],
        imu_jerk_gz=0.98,
        dvr_channels=node_data["dvr_channels"],
        dvr_ip=node_data["dvr_ip"],
        camera_position=node_data["camera_position"],
        cameras_config=node_data["cameras_config"]
    )
    db.add(new_node)
    db.commit()
    db.refresh(new_node)

    # Sync with store for background loops
    store.upsert_fleet_node(node_data)

    try:
        await manager.broadcast({
            "type": "FLEET_UPDATE",
            "fleet": store.fleet_nodes,
            "metrics": store.get_metrics(),
            "latest_log": {
                "id": f"reg-{bus_id}",
                "timestamp": "Just now",
                "bus_id": bus_id,
                "corridor": node_data["corridor"],
                "message": f"Bus Node {bus_id} ({node_data['vehicle_type']}) registered into active transit service.",
                "latency_ms": 24,
                "type": "FLEET COMMISSION"
            }
        })
    except Exception as e:
        print(f"[FLEET] Broadcast error on create: {e}")

    return {
        "success": True,
        "message": f"Bus node {bus_id} registered successfully in persistent storage.",
        "node": node_data
    }

@router.delete("/{node_id}")
async def delete_fleet_node(node_id: str, db: Session = Depends(get_db)):
    """Decommissions and permanently unlinks a bus node from persistent DB and fleet registry."""
    clean_id = node_id.strip().upper()
    node = db.query(DBFleetNode).filter(
        (DBFleetNode.id == clean_id) | 
        (DBFleetNode.id == clean_id.lower()) | 
        (DBFleetNode.id == clean_id.upper())
    ).first()
    
    if not node:
        # Check store fallback
        success = store.delete_fleet_node(clean_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"Fleet node {clean_id} not found.")
    else:
        db.delete(node)
        db.commit()
        store.delete_fleet_node(clean_id)

    stream_manager.stop_worker(clean_id)

    try:
        await manager.broadcast({
            "type": "FLEET_UPDATE",
            "fleet": store.fleet_nodes,
            "metrics": store.get_metrics(),
            "latest_log": {
                "id": f"decom-{clean_id}",
                "timestamp": "Just now",
                "bus_id": clean_id,
                "corridor": "Depot Terminal",
                "message": f"Bus Node {clean_id} decommissioned from fleet network.",
                "latency_ms": 18,
                "type": "FLEET DECOMMISSION"
            }
        })
    except Exception as e:
        print(f"[FLEET] Broadcast error on delete: {e}")

    return {"success": True, "message": f"Fleet node {clean_id} decommissioned successfully."}

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
def get_fleet_node(node_id: str, db: Session = Depends(get_db)):
    node = db.query(DBFleetNode).filter(DBFleetNode.id == node_id).first()
    if node:
        return FleetNode(
            id=node.id,
            route_name=node.route_name,
            route_code=node.route_code,
            vehicle_type=node.vehicle_type,
            npu_hardware=node.npu_hardware,
            camera_model=node.camera_model,
            is_online=node.is_online,
            speed_kmh=node.speed_kmh,
            lat=node.lat,
            lng=node.lng,
            heading=node.heading,
            last_ping_at=node.last_ping_at or "Just now",
            raw_ingests_count=node.raw_ingests_count,
            edge_fps=node.edge_fps,
            imu_jerk_gz=node.imu_jerk_gz,
            dvr_channels=node.dvr_channels or 4,
            dvr_ip=node.dvr_ip,
            camera_position=node.camera_position or "FRONT_WINDSHIELD",
            cameras_config=node.cameras_config
        )
    for n in store.fleet_nodes:
        if n["id"] == node_id:
            return n
    raise HTTPException(status_code=404, detail="Fleet node not found")

