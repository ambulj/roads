from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.storage.mock_database import store
from app.models.schemas import TrafficIncident, TrafficIncidentCreate
from app.api.websockets import manager

router = APIRouter()

class IncidentStatusUpdate(BaseModel):
    status: str
    is_intercepted: Optional[bool] = None
    intercepted_by: Optional[str] = None

@router.get("", response_model=List[TrafficIncident])
def list_incidents():
    """Retrieve all traffic incidents from PostgreSQL / PostGIS persistent database."""
    return store.get_incidents()

@router.post("", response_model=TrafficIncident)
async def create_incident(payload: TrafficIncidentCreate):
    """Log an incident observed by mobile dashcams or ANPR edge nodes to PostgreSQL / PostGIS DB and broadcast to WebGIS."""
    new_inc = store.add_incident(payload.model_dump())
    # Broadcast to all live WebGIS clients
    await manager.broadcast({
        "type": "INCIDENT_ALERT",
        "incident": new_inc,
        "metrics": store.get_metrics(),
        "latest_log": store.audit_logs[0] if store.audit_logs else None
    })
    return new_inc

@router.patch("/{incident_id}")
async def update_incident(incident_id: str, payload: IncidentStatusUpdate):
    """Update incident status (e.g. DISPATCHED, RESOLVED, INTERCEPTED)."""
    updated = store.update_incident_status(
        incident_id=incident_id,
        new_status=payload.status,
        is_intercepted=payload.is_intercepted,
        intercepted_by=payload.intercepted_by
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    await manager.broadcast({
        "type": "INCIDENT_UPDATE",
        "incident_id": incident_id,
        "update": updated,
        "metrics": store.get_metrics()
    })
    return updated
