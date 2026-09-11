import csv
import io
import datetime
from fastapi import APIRouter, HTTPException, Query, Response, Depends
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.storage.database import get_db
from app.storage.mock_database import store
from app.models.schemas import HazardCluster, WorkOrderUpdate
from app.models.db_models import DBDistressCluster
from app.core.auth import require_roles

router = APIRouter()


@router.get("", response_model=List[HazardCluster])
def list_work_orders(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("rpi"),
    db: Session = Depends(get_db)
):
    """Lists PWD hazard work orders directly from persistent database."""
    query = db.query(DBDistressCluster)

    if status and status != "all":
        query = query.filter(DBDistressCluster.status.ilike(status))

    if severity and severity != "all":
        query = query.filter(DBDistressCluster.severity_level.ilike(severity))

    if search:
        q = f"%{search.strip()}%"
        query = query.filter(
            (DBDistressCluster.road_name.ilike(q)) |
            (DBDistressCluster.nearest_poi.ilike(q)) |
            (DBDistressCluster.cluster_code.ilike(q)) |
            (DBDistressCluster.assigned_agency.ilike(q))
        )

    if sort_by == "passes":
        query = query.order_by(DBDistressCluster.pass_count.desc())
    elif sort_by == "date":
        query = query.order_by(DBDistressCluster.created_at.desc())
    else:
        query = query.order_by(DBDistressCluster.rpi_score.desc())

    rows = query.all()
    if not rows:
        items = store.get_clusters()
        return items

    return [
        HazardCluster(
            id=r.id,
            cluster_code=r.cluster_code,
            defect_type=r.defect_type,
            defect_name=r.defect_name,
            severity_level=r.severity_level,
            rpi_score=r.rpi_score,
            pass_count=r.pass_count,
            road_name=r.road_name,
            classification=r.classification,
            nearest_poi=r.nearest_poi,
            poi_distance_m=r.poi_distance_m,
            assigned_agency=r.assigned_agency,
            agency_phone=r.agency_phone,
            sla_hours=r.sla_hours,
            status=r.status,
            lat=r.lat,
            lng=r.lng,
            before_image_url=r.before_image_url,
            after_image_url=r.after_image_url,
            field_notes=r.field_notes,
            detecting_camera_position=r.detecting_camera_position or "FRONT_WINDSHIELD",
            detecting_channel=r.detecting_channel or 1,
            created_at=r.created_at,
            updated_at=r.updated_at
        )
        for r in rows
    ]

@router.patch("/{order_id}/status")
async def update_status(
    order_id: str,
    payload: WorkOrderUpdate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles(["admin", "maintenance", "operations", "safety"]))
):
    """Updates work order repair status directly in persistent DB."""
    now_str = datetime.datetime.now(datetime.timezone.utc).strftime("%d %b, %I:%M %p")
    cluster = db.query(DBDistressCluster).filter(
        (DBDistressCluster.id == order_id) | (DBDistressCluster.cluster_code == order_id)
    ).first()
    
    officer_note = f"{payload.field_notes or ''} [Officer: {current_user.get('name', 'Admin')} ({current_user.get('badge_number', 'PWD')})]".strip()

    if cluster:
        cluster.status = payload.status.value
        if payload.before_image_url is not None:
            cluster.before_image_url = payload.before_image_url
        if payload.after_image_url is not None:
            cluster.after_image_url = payload.after_image_url
        if payload.field_notes is not None:
            cluster.field_notes = officer_note
        cluster.updated_at = now_str
        db.commit()
        db.refresh(cluster)
        
        updated = {
            "id": cluster.id,
            "cluster_code": cluster.cluster_code,
            "status": cluster.status,
            "before_image_url": cluster.before_image_url,
            "after_image_url": cluster.after_image_url,
            "field_notes": cluster.field_notes,
            "updated_at": cluster.updated_at
        }
    else:
        updated = store.update_cluster_status(
            order_id, 
            payload.status.value,
            before_image_url=payload.before_image_url,
            after_image_url=payload.after_image_url,
            field_notes=officer_note
        )
        
    if not updated:
        raise HTTPException(status_code=404, detail="Work order not found")
        
    try:
        from app.api.websockets import manager
        if manager.active_connections:
            await manager.broadcast({
                "type": "CLUSTER_UPDATE",
                "cluster_id": order_id,
                "update": updated,
                "metrics": store.get_metrics(),
                "latest_log": store.audit_logs[0] if store.audit_logs else None
            })
    except Exception as b_err:
        print(f"[WORK_ORDERS] WebSocket broadcast notice: {b_err}")

    return updated


@router.get("/export/csv")
def export_csv(db: Session = Depends(get_db)):
    """Exports all road hazard clusters and PWD work orders to CSV."""
    rows = db.query(DBDistressCluster).order_by(DBDistressCluster.rpi_score.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Order ID", "Corridor Location", "Latitude", "Longitude",
        "Hazard Type", "Severity", "RPI Score", "Bus Passes",
        "Camera Sensor", "Assigned Contractor", "Contractor Phone", "SLA Hours",
        "Nearest POI", "POI Distance (m)", "Status", "Timestamp"
    ])
    
    for item in rows:
        writer.writerow([
            item.cluster_code,
            item.road_name,
            item.lat,
            item.lng,
            item.defect_name,
            item.severity_level.upper(),
            item.rpi_score,
            item.pass_count,
            item.detecting_camera_position or "FRONT_WINDSHIELD",
            item.assigned_agency,
            item.agency_phone,
            f"{item.sla_hours}h",
            item.nearest_poi,
            item.poi_distance_m,
            item.status.upper(),
            item.created_at
        ])
        
    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=roadsaarthi_pwd_dispatch.csv"}
    )

