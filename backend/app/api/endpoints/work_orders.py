import csv
import io
from fastapi import APIRouter, HTTPException, Query, Response
from typing import List, Optional
from app.storage.mock_database import store
from app.models.schemas import HazardCluster, WorkOrderUpdate

router = APIRouter()

@router.get("", response_model=List[HazardCluster])
def list_work_orders(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("rpi")
):
    items = store.get_clusters()

    if status and status != "all":
        items = [i for i in items if i["status"].lower() == status.lower()]

    if severity and severity != "all":
        items = [i for i in items if i["severity_level"].lower() == severity.lower()]

    if search:
        q = search.lower()
        items = [
            i for i in items
            if q in i["road_name"].lower()
            or q in i["nearest_poi"].lower()
            or q in i["cluster_code"].lower()
            or q in i["assigned_agency"].lower()
        ]

    if sort_by == "passes":
        items.sort(key=lambda x: x["pass_count"], reverse=True)
    elif sort_by == "date":
        items.sort(key=lambda x: x["created_at"], reverse=True)
    else:
        items.sort(key=lambda x: x["rpi_score"], reverse=True)

    return items

@router.patch("/{order_id}/status")
def update_status(order_id: str, payload: WorkOrderUpdate):
    updated = store.update_cluster_status(
        order_id, 
        payload.status.value,
        before_image_url=payload.before_image_url,
        after_image_url=payload.after_image_url,
        field_notes=payload.field_notes
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Work order not found")
    return updated

@router.get("/export/csv")
def export_csv():
    items = store.get_clusters()
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Order ID", "Corridor Location", "Latitude", "Longitude",
        "Hazard Type", "Severity", "RPI Score", "Bus Passes",
        "Assigned Contractor", "Contractor Phone", "SLA Hours",
        "Nearest POI", "POI Distance (m)", "Status", "Timestamp"
    ])
    
    for item in items:
        writer.writerow([
            item["cluster_code"],
            item["road_name"],
            item["lat"],
            item["lng"],
            item["defect_name"],
            item["severity_level"].upper(),
            item["rpi_score"],
            item["pass_count"],
            item["assigned_agency"],
            item["agency_phone"],
            f"{item['sla_hours']}h",
            item["nearest_poi"],
            item["poi_distance_m"],
            item["status"].upper(),
            item["created_at"]
        ])
        
    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=roadsaarthi_pwd_dispatch.csv"}
    )
