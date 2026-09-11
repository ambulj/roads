import csv
import io
from fastapi import APIRouter, HTTPException, Depends, Response
from typing import List
from sqlalchemy.orm import Session

from app.storage.database import get_db
from app.storage.mock_database import store
from app.models.schemas import HazardCluster
from app.models.db_models import DBDistressCluster

router = APIRouter()

@router.get("", response_model=List[HazardCluster])
def list_clusters(db: Session = Depends(get_db)):
    """Retrieve all road distress clusters directly from persistent database."""
    rows = db.query(DBDistressCluster).order_by(DBDistressCluster.rpi_score.desc()).all()
    if not rows:
        return store.get_clusters()
    
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

@router.get("/export/csv")
def export_clusters_csv(db: Session = Depends(get_db)):
    """Exports all road hazard clusters and PWD work orders to CSV."""
    rows = db.query(DBDistressCluster).order_by(DBDistressCluster.rpi_score.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "Order ID", "Road / Corridor", "Latitude", "Longitude",
        "Hazard Type", "Defect Code", "Severity", "RPI Priority", "Transit Bus Passes",
        "Camera Sensor", "Camera Channel", "Assigned Contractor", "Contractor Phone",
        "SLA (Hours)", "Nearest POI Landmark", "POI Distance (m)", "Status", "Registered At"
    ])
    
    for r in rows:
        writer.writerow([
            r.cluster_code,
            r.road_name,
            r.lat,
            r.lng,
            r.defect_name,
            r.defect_type,
            r.severity_level.upper(),
            r.rpi_score,
            r.pass_count,
            r.detecting_camera_position or "FRONT_WINDSHIELD",
            r.detecting_channel or 1,
            r.assigned_agency or "Chennai Corporation PWD",
            r.agency_phone or "+91-44-25384520",
            r.sla_hours,
            r.nearest_poi or "Main Corridor",
            r.poi_distance_m or 0.0,
            r.status.upper(),
            r.created_at
        ])
        
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=pwd_road_hazard_clusters.csv"}
    )

@router.get("/{cluster_id}", response_model=HazardCluster)
def get_cluster(cluster_id: str, db: Session = Depends(get_db)):
    row = db.query(DBDistressCluster).filter(
        (DBDistressCluster.id == cluster_id) | (DBDistressCluster.cluster_code == cluster_id)
    ).first()
    
    if row:
        return HazardCluster(
            id=row.id,
            cluster_code=row.cluster_code,
            defect_type=row.defect_type,
            defect_name=row.defect_name,
            severity_level=row.severity_level,
            rpi_score=row.rpi_score,
            pass_count=row.pass_count,
            road_name=row.road_name,
            classification=row.classification,
            nearest_poi=row.nearest_poi,
            poi_distance_m=row.poi_distance_m,
            assigned_agency=row.assigned_agency,
            agency_phone=row.agency_phone,
            sla_hours=row.sla_hours,
            status=row.status,
            lat=row.lat,
            lng=row.lng,
            before_image_url=row.before_image_url,
            after_image_url=row.after_image_url,
            field_notes=row.field_notes,
            detecting_camera_position=row.detecting_camera_position or "FRONT_WINDSHIELD",
            detecting_channel=row.detecting_channel or 1,
            created_at=row.created_at,
            updated_at=row.updated_at
        )
        
    clusters = store.get_clusters()
    for c in clusters:
        if c["id"] == cluster_id or c["cluster_code"] == cluster_id:
            return c
    raise HTTPException(status_code=404, detail="Hazard cluster not found")

