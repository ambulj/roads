from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.storage.database import get_db
from app.models.schemas import SafeCorridorScore
from app.services.pedestrian_safety import (
    get_safe_corridor_scores,
    pedestrian_engine,
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
