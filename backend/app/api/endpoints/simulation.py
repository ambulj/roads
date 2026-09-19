from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.simulation_controller import simulation_controller
from app.api.websockets import manager

router = APIRouter()

class SimulationTogglePayload(BaseModel):
    fleet_simulation: Optional[bool] = None
    synthetic_generation: Optional[bool] = None
    demo_mode: Optional[bool] = None

class SimulationGeneratePayload(BaseModel):
    mode: Optional[str] = "all" # 'all' | 'hazard' | 'pothole' | 'pedestrian' | 'hit_and_run' | 'waterlogging'

@router.get("/status")
def get_simulation_status():
    """Returns the current state of background fleet movement and synthetic generation."""
    return simulation_controller.get_status()

@router.post("/toggle")
async def toggle_simulation(payload: SimulationTogglePayload):
    """
    Toggles simulation background loops at runtime.
    Setting demo_mode=True pauses fake incidents and simulated bus movement,
    guaranteeing only real optical detections appear on the live dashboard.
    """
    if payload.demo_mode is not None:
        simulation_controller.set_demo_mode(payload.demo_mode)
    if payload.fleet_simulation is not None:
        simulation_controller.set_fleet_simulation(payload.fleet_simulation)
    if payload.synthetic_generation is not None:
        simulation_controller.set_synthetic_generation(payload.synthetic_generation)

    status = simulation_controller.get_status()

    # Broadcast state change to all dashboard clients
    await manager.broadcast({
        "type": "SIMULATION_STATE_CHANGE",
        "simulation": status
    })

    return {
        "success": True,
        "message": f"Simulation state updated: {status['mode_label']}",
        "status": status
    }

@router.post("/generate-synthetic")
async def trigger_synthetic_generation(payload: Optional[SimulationGeneratePayload] = None):
    """
    Explicitly triggers on-demand synthetic data generation on user request.
    Can generate a single targeted hazard, pedestrian event, hit-and-run incident, or full urban cycle.
    """
    from app.services.synthetic_generator import generate_on_demand_synthetic
    from app.storage.mock_database import store

    mode = payload.mode if payload else "all"
    result = generate_on_demand_synthetic(mode=mode)

    # Broadcast updated state to all connected frontends
    try:
        if manager.active_connections:
            await manager.broadcast({
                "type": "SYNTHETIC_GENERATED_EVENT",
                "mode": mode,
                "result": result,
                "metrics": store.get_metrics(),
                "clusters": store.get_clusters(),
                "incidents": store.get_incidents(),
                "fleet": store.fleet_nodes,
                "latest_log": store.audit_logs[0] if store.audit_logs else None
            })
    except Exception as e:
        print(f"[SIMULATION API] Broadcast notice: {e}")

    return {
        "success": True,
        "data": result
    }
