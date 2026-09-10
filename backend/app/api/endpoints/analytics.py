from fastapi import APIRouter
from typing import List, Dict, Any
from app.storage.mock_database import store
from app.models.schemas import CorridorRisk

router = APIRouter()

@router.get("/corridors", response_model=List[CorridorRisk])
def get_arterial_corridors():
    return store.arterial_corridors

@router.get("/speed-distress")
def get_speed_distress_series():
    # 24-hour time series correlation between transit speed (km/h) and distress frequency
    hours = [f"{h:02d}:00" for h in range(0, 24, 2)]
    speeds = [54, 58, 62, 59, 42, 31, 28, 34, 39, 32, 29, 44]
    distress_frequency = [2, 1, 1, 3, 9, 14, 16, 12, 11, 15, 13, 5]

    return {
        "categories": hours,
        "series": [
            {
                "name": "Average Fleet Speed (km/h)",
                "data": speeds,
                "type": "area"
            },
            {
                "name": "Distress Ingestion Rate (events/hr)",
                "data": distress_frequency,
                "type": "line"
            }
        ]
    }

@router.get("/rpi-weights")
def get_rpi_weights():
    return {
        "factors": [
            {"factor": "Defect Severity (S_defect)", "weight": 40, "color": "#f43f5e"},
            {"factor": "Observation Frequency (Passes)", "weight": 20, "color": "#f59e0b"},
            {"factor": "Corridor Classification (C_road)", "weight": 20, "color": "#06b6d4"},
            {"factor": "Critical POI Proximity (D_poi)", "weight": 20, "color": "#3b82f6"}
        ],
        "values": [40, 20, 20, 20]
    }

@router.get("/safe-corridors")
def get_safe_corridors():
    """Returns Vision Zero pedestrian safety audit scores for schools and hospitals."""
    from app.services.pedestrian_safety import get_safe_corridor_scores
    return get_safe_corridor_scores()

@router.get("/dark-spots")
def get_dark_spots():
    """Returns unlit pedestrian and transit corridors detected by night-time bus patrols (<5 Lux)."""
    return store.get_dark_spots()

@router.get("/recurrence-penalties")
def get_recurrence_penalties():
    """Returns MoHUA IRC:SP:20 Clause 14.2 re-pothole penalty debit records."""
    return store.get_contractor_penalties()

@router.get("/open-manholes")
def get_open_manholes():
    """Returns IS:1726 open manhole alerts with Jal Board 2-hr emergency dockets."""
    return store.get_open_manholes()

@router.get("/submerged-potholes")
def get_submerged_potholes():
    """Returns hydro-dynamic acoustic submerged pothole hazards under standing floodwater."""
    return store.get_submerged_potholes()

@router.get("/obscured-signs")
def get_obscured_signs():
    """Returns IRC:67 regulatory road signs obscured by overgrown foliage or political banners."""
    return store.get_obscured_signs()

@router.get("/contractor-debarments")
def get_contractor_debarments():
    """Returns GeM / e-Procurement statutory tender debarment and blacklist records."""
    return store.get_contractor_debarments()

@router.get("/asphalt-quality")
def get_asphalt_quality():
    """Returns IRC:SP:20 cold-mix & hot-mix asphalt temperature and geometric milling audits."""
    return store.get_asphalt_quality_audits()



@router.get("/road-memory-corridors")
def get_road_memory_corridors():
    """Returns historical corridor maintenance records and multi-bus consensus timeline."""
    return store.get_road_memory_corridors()
