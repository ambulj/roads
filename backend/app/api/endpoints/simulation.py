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
