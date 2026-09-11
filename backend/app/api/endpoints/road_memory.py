from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from app.services.road_memory_engine import road_memory_engine
from app.services.risk_reasoning_engine import risk_reasoning_engine

router = APIRouter()

class BusPassRequest(BaseModel):
    bus_id: str
    lat: float
    lng: float
    vertical_gz: float
    speed_kmh: Optional[float] = 40.0

class LifecycleUpdateRequest(BaseModel):
    cluster_id: str
    new_status: str
    notes: Optional[str] = None

class TTCRequest(BaseModel):
    distance_m: float
    vehicle_speed_kmh: float
    target_relative_speed_kmh: Optional[float] = 0.0
    lateral_offset_m: Optional[float] = 0.0

@router.get("/summary")
def get_road_memory_summary():
    """Returns digital twin lifecycle counts, contractor verification rate, and recent audits."""
    return road_memory_engine.get_road_memory_summary()

@router.post("/evaluate-pass")
def evaluate_bus_pass(req: BusPassRequest):
    """
    Simulates or executes an independent bus pass against nearby road defects.
    Smooth passes (Gz <= 1.08) verify completed repairs.
    Rough passes (Gz >= 1.30) issue IRC:SP:20 contractor recurrence penalty debits.
    """
    return road_memory_engine.evaluate_bus_pass(
        bus_id=req.bus_id,
        lat=req.lat,
        lng=req.lng,
        vertical_gz=req.vertical_gz,
        speed_kmh=req.speed_kmh or 40.0
    )

@router.post("/update-lifecycle")
def update_lifecycle_state(req: LifecycleUpdateRequest):
    """Updates defect state in the closed-loop lifecycle."""
    res = road_memory_engine.update_cluster_lifecycle(
        cluster_id=req.cluster_id,
        new_status=req.new_status,
        notes=req.notes
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to update lifecycle"))
    return res

@router.post("/ttc")
def compute_kinematic_ttc(req: TTCRequest):
    """Calculates Kinematic Time-To-Collision (TTC < 2.5s) and collision avoidance alert."""
    return risk_reasoning_engine.calculate_kinematic_ttc(
        distance_m=req.distance_m,
        vehicle_speed_kmh=req.vehicle_speed_kmh,
        target_relative_speed_kmh=req.target_relative_speed_kmh or 0.0,
        lateral_offset_m=req.lateral_offset_m or 0.0
    )

@router.get("/dynamic-rpi")
def get_dynamic_rpi(
    base_rpi: float = Query(65.0, description="Baseline static RPI score"),
    road_classification: str = Query("Arterial", description="Road class (Arterial, Sub-Arterial)"),
    weather: str = Query("MONSOON", description="Weather condition (CLEAR, RAIN, MONSOON)"),
    pcu: Optional[float] = Query(1650.0, description="Passenger Car Units per km"),
    depth_cm: float = Query(6.5, description="Cavity depth in cm")
):
    """Computes dynamic risk score accounting for weather, arterial PCU, and pavement cavity depth."""
    return risk_reasoning_engine.compute_dynamic_rpi(
        base_rpi=base_rpi,
        road_classification=road_classification,
        weather_condition=weather,
        live_pcu_per_km=pcu,
        depth_cm=depth_cm
    )

@router.get("/what-if")
def simulate_traffic_whatif(
    corridor: str = Query("Anna Salai", description="Corridor name to simulate"),
    closure_pct: float = Query(50.0, description="Percentage of lane capacity closed for repairs")
):
    """Simulates counterfactual choke-point routing and downstream congestion impact."""
    return risk_reasoning_engine.simulate_corridor_whatif(
        corridor_name=corridor,
        closure_percentage=closure_pct
    )
