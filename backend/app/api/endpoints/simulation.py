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

@router.post("/reset-baseline")
async def reset_to_minimal_baseline():
    """
    Resets distress clusters and traffic incidents to a clean, minimal baseline state.
    Wipes any accumulated synthetic test clutter.
    """
    from app.storage.database import SessionLocal, DBDistressCluster, DBTrafficIncident, DBRawIngest, init_db
    from app.storage.mock_database import store, INITIAL_SEED_CLUSTERS

    db = SessionLocal()
    try:
        # Clear existing clusters and incidents
        db.query(DBRawIngest).delete()
        db.query(DBDistressCluster).delete()
        db.query(DBTrafficIncident).delete()
        db.commit()

        # Re-seed minimal clusters
        for item in INITIAL_SEED_CLUSTERS:
            cluster_dict = dict(item)
            cluster_dict.setdefault("detecting_camera_position", "FRONT_WINDSHIELD")
            cluster_dict.setdefault("detecting_channel", 1)
            db.add(DBDistressCluster(**cluster_dict))

        # Re-seed minimal incidents
        min_incidents = [
            {
                "id": "inc-001",
                "reporting_bus_id": "BUS-TN01-1042",
                "incident_type": "HIT_AND_RUN",
                "plate_number": "TN-09-CB-4412",
                "plate_confidence": 0.96,
                "vehicle_color": "White",
                "vehicle_class": "SUV",
                "target_speed_kmh": 78.5,
                "is_intercepted": False,
                "intercepted_by_bus_id": None,
                "snapshot_url": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80",
                "road_name": "GST Road (NH-32) near Airport Flyover",
                "lat": 12.9850, "lng": 80.1650,
                "occurred_at": "5 Sept, 05:12 am",
                "status": "ACTIVE_ALERT",
                "review_status": "AUTO_ADMISSIBLE",
                "dispatch_status": "PCR_DISPATCHED",
                "channel": 2,
                "description": "High-speed collision followed by non-stop evasion towards Airport Flyover."
            },
            {
                "id": "inc-002",
                "reporting_bus_id": "PATROL-VAN-12",
                "incident_type": "RASH_DRIVING",
                "plate_number": "TN-02-AZ-8819",
                "plate_confidence": 0.94,
                "vehicle_color": "Black",
                "vehicle_class": "Sedan",
                "target_speed_kmh": 92.0,
                "is_intercepted": False,
                "intercepted_by_bus_id": None,
                "snapshot_url": "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop&q=80",
                "road_name": "Guindy Kathipara Grade Junction",
                "lat": 13.0078, "lng": 80.2045,
                "occurred_at": "5 Sept, 05:30 am",
                "status": "ACTIVE_ALERT",
                "review_status": "AUTO_ADMISSIBLE",
                "dispatch_status": "ECHALLAN_ISSUED",
                "channel": 2,
                "description": "Aggressive tailgating and high-speed zigzag overtaking clocked at 92 km/h."
            },
            {
                "id": "inc-003",
                "reporting_bus_id": "BUS-TN02-3891",
                "incident_type": "VULNERABLE_PEDESTRIAN",
                "plate_number": "TN-07-BP-9901",
                "plate_confidence": 0.92,
                "vehicle_color": "Silver",
                "vehicle_class": "Two-Wheeler",
                "target_speed_kmh": 32.0,
                "is_intercepted": False,
                "intercepted_by_bus_id": None,
                "snapshot_url": "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&auto=format&fit=crop&q=80",
                "road_name": "Usman Road D.A.V. School Link",
                "lat": 13.0425, "lng": 80.2345,
                "occurred_at": "5 Sept, 07:45 am",
                "status": "ACTIVE_ALERT",
                "review_status": "PENDING_REVIEW",
                "dispatch_status": "UNASSIGNED",
                "channel": 3,
                "description": "School children crossing alert: Vehicle failed to yield right-of-way in school zone."
            }
        ]
        for inc in min_incidents:
            db.add(DBTrafficIncident(**inc))

        db.commit()

        # Reset store perception log
        store.audit_logs = [
            {
                "id": "log-init-1",
                "timestamp": "Just now",
                "bus_id": "BUS-TN01-1042",
                "corridor": "GST Road (NH-32)",
                "message": "System baseline minimized: 3 verified road clusters, 2 active incident alerts.",
                "latency_ms": 32,
                "type": "SYSTEM_BASELINE"
            }
        ]
    finally:
        db.close()

    # Broadcast baseline reset
    try:
        if manager.active_connections:
            await manager.broadcast({
                "type": "BASELINE_RESET",
                "metrics": store.get_metrics(),
                "clusters": store.get_clusters(),
                "incidents": store.get_incidents(),
                "fleet": store.fleet_nodes,
                "latest_log": store.audit_logs[0]
            })
    except Exception as e:
        print(f"[SIMULATION API] Broadcast notice: {e}")

    return {
        "success": True,
        "message": "Platform reset to clean, minimal baseline (3 clusters, 2 incidents).",
        "clusters_count": len(store.get_clusters()),
        "incidents_count": len(store.get_incidents())
    }
