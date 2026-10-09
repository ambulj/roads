import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.storage.database import get_db
from app.models.schemas import SafeCorridorScore
from app.services.pedestrian_safety import (
    get_safe_corridor_scores,
    pedestrian_engine,
    evaluate_school_zone_safety,
    CHENNAI_SAFE_CORRIDORS
)
from app.models.db_models import DBTrafficIncident

router = APIRouter()

class PedestrianFusionRequest(BaseModel):
    frame_width: int = 1280
    frame_height: int = 720
    persons: List[Dict[str, Any]]
    crosswalks: List[Dict[str, Any]]
    vehicles: Optional[List[Dict[str, Any]]] = None
    approaching_speed_kmh: float = 0.0
    is_near_school_poi: bool = False
    poi_name: Optional[str] = None

@router.get("/corridors", response_model=List[SafeCorridorScore])
def get_corridors():
    """Returns safe school and hospital corridor index scores and grades."""
    return get_safe_corridor_scores()

@router.get("/school-zones")
def get_school_zones_risk(db: Session = Depends(get_db)):
    """
    Returns school zone safety audit metrics, vulnerable pedestrian alerts,
    and active student crossing risks.
    """
    school_corridors = [c for c in CHENNAI_SAFE_CORRIDORS if c.category == "school"]
    
    # Query database for recent school zone pedestrian incidents
    recent_incidents = db.query(DBTrafficIncident).filter(
        DBTrafficIncident.incident_type.in_([
            "VULNERABLE_PEDESTRIAN",
            "SCHOOL_CHILDREN_CROSSING_RISK",
            "CROSSWALK_PEDESTRIAN_RISK",
            "ZEBRA_CROSSING_ENCROACHMENT",
            "UNSAFE_MIDBLOCK_CROSSING"
        ])
    ).all()
    
    return {
        "school_zones_count": len(school_corridors),
        "total_active_alerts": len(recent_incidents),
        "school_corridors": [c.model_dump() for c in school_corridors],
        "vision_zero_standard": "IRC:35 / MoRTH School Zone Safety Standard (20 km/h limit)",
        "recent_alerts": [
            {
                "id": inc.id,
                "type": inc.incident_type,
                "location": inc.road_name,
                "occurred_at": inc.occurred_at,
                "status": inc.status,
                "speed_kmh": inc.target_speed_kmh
            }
            for inc in recent_incidents
        ]
    }

@router.post("/fuse")
def fuse_pedestrian_crosswalk(payload: PedestrianFusionRequest):
    """
    Real-time spatial zone fusion endpoint:
    Fuses detected person bounding boxes with crosswalk regions to identify
    school children crossings, pedestrian risks, and unsafe midblock crossings.
    """
    events = pedestrian_engine.fuse_detections(
        frame_width=payload.frame_width,
        frame_height=payload.frame_height,
        persons=payload.persons,
        crosswalks=payload.crosswalks,
        vehicles=payload.vehicles,
        approaching_speed_kmh=payload.approaching_speed_kmh,
        is_near_school_poi=payload.is_near_school_poi,
        poi_name=payload.poi_name
    )
    return {
        "success": True,
        "fused_events_count": len(events),
        "events": events
    }


class SchoolZoneEvaluationRequest(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    bus_lat: Optional[float] = None
    bus_lng: Optional[float] = None
    speed_kmh: float = 0.0
    pedestrians_count: int = 0
    children_count: int = 0
    children_detected: bool = False
    has_zebra_crossing: bool = True
    bus_id: Optional[str] = "BUS-TN01-1042"


@router.post("/school-zones/evaluate")
async def evaluate_school_zone_safety_endpoint(
    payload: SchoolZoneEvaluationRequest,
    db: Session = Depends(get_db)
):
    """
    Evaluates approaching vehicle telemetry near designated school POIs against
    Vision Zero 20 km/h speed threshold, child pedestrian crossing presence,
    and crosswalk marking compliance.
    """
    target_lat = payload.lat if payload.lat is not None else (payload.bus_lat if payload.bus_lat is not None else 13.0450)
    target_lng = payload.lng if payload.lng is not None else (payload.bus_lng if payload.bus_lng is not None else 80.2380)
    children = payload.children_detected or (payload.children_count > 0)
    ped_count = max(payload.pedestrians_count, payload.children_count)

    evaluation = evaluate_school_zone_safety(
        lat=target_lat,
        lng=target_lng,
        speed_kmh=payload.speed_kmh,
        pedestrians_count=ped_count,
        children_detected=children,
        has_zebra_crossing=payload.has_zebra_crossing,
        bus_id=payload.bus_id or "BUS-TN01-1042"
    )

    if evaluation.get("alert_triggered"):
        incident_id = f"inc-sz-{uuid.uuid4().hex[:8]}"
        now_str = datetime.now(timezone.utc).strftime("%d %b, %I:%M %p")
        
        db_incident = DBTrafficIncident(
            id=incident_id,
            reporting_bus_id=payload.bus_id or "BUS-TN01-1042",
            incident_type="SCHOOL_CHILDREN_CROSSING_RISK",
            plate_number=None,
            plate_confidence=0.95,
            vehicle_color=None,
            vehicle_class="Motor Vehicle",
            target_speed_kmh=payload.speed_kmh,
            is_intercepted=False,
            road_name=evaluation.get("nearest_school", "School Zone Arterial"),
            lat=target_lat,
            lng=target_lng,
            occurred_at=now_str,
            status="ACTIVE_ALERT",
            fine_amount_inr=0.0,
            mva_section=evaluation.get("mva_section"),
            description=f"School children crossing alert: Approaching speed {payload.speed_kmh:.1f} km/h (limit 20 km/h). Mandatory driver yield active.",
            camera_position="FRONT_WINDSHIELD",
            channel=1,
            statutory_provenance="VISION_ZERO_PEDESTRIAN_PROTECTION_V2026",
            review_status="PENDING_REVIEW",
            dispatch_status="UNASSIGNED"
        )
        db.add(db_incident)
        db.commit()
        db.refresh(db_incident)
        
        evaluation["incident_id"] = incident_id
        evaluation["incident_status"] = "ACTIVE_ALERT"

        try:
            from app.api.websockets import manager
            await manager.broadcast({
                "type": "INCIDENT_ALERT",
                "incident": {
                    "id": db_incident.id,
                    "reporting_bus_id": db_incident.reporting_bus_id,
                    "incident_type": db_incident.incident_type,
                    "target_speed_kmh": db_incident.target_speed_kmh,
                    "road_name": db_incident.road_name,
                    "lat": db_incident.lat,
                    "lng": db_incident.lng,
                    "occurred_at": db_incident.occurred_at,
                    "status": db_incident.status,
                    "fine_amount_inr": db_incident.fine_amount_inr
                }
            })
        except Exception:
            pass

    return evaluation
