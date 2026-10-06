import csv
import io
from fastapi import APIRouter, HTTPException, Depends, Response
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.storage.database import get_db
from app.storage.mock_database import store
from app.models.schemas import HazardCluster
from app.models.db_models import DBDistressCluster

router = APIRouter()


def _parse_and_validate_bbox(bbox_str: str) -> Tuple[float, float, float, float]:
    parts = bbox_str.split(",")
    if len(parts) != 4:
        raise HTTPException(
            status_code=400,
            detail="Invalid bbox format. Expected 'min_lon,min_lat,max_lon,max_lat'"
        )
    try:
        min_lon, min_lat, max_lon, max_lat = (float(p.strip()) for p in parts)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid bbox coordinates. All values must be valid numbers."
        )

    if not (-180.0 <= min_lon <= 180.0 and -180.0 <= max_lon <= 180.0):
        raise HTTPException(
            status_code=400,
            detail="Longitude values must be within [-180.0, 180.0]"
        )
    if not (-90.0 <= min_lat <= 90.0 and -90.0 <= max_lat <= 90.0):
        raise HTTPException(
            status_code=400,
            detail="Latitude values must be within [-90.0, 90.0]"
        )
    if min_lon > max_lon:
        raise HTTPException(
            status_code=400,
            detail=f"min_lon ({min_lon}) cannot be greater than max_lon ({max_lon})"
        )
    if min_lat > max_lat:
        raise HTTPException(
            status_code=400,
            detail=f"min_lat ({min_lat}) cannot be greater than max_lat ({max_lat})"
        )

    return min_lon, min_lat, max_lon, max_lat


@router.get("", response_model=List[HazardCluster])
def list_clusters(
    bbox: Optional[str] = None,
    limit: int = 500,
    db: Session = Depends(get_db)
):
    """Retrieve road distress clusters directly from persistent database with optional viewport filtering."""
    limit = max(1, min(limit, 2000))
    query = db.query(DBDistressCluster)
    parsed_bbox = None

    if bbox:
        parsed_bbox = _parse_and_validate_bbox(bbox)
        min_lon, min_lat, max_lon, max_lat = parsed_bbox

        is_postgres = False
        try:
            is_postgres = db.bind.dialect.name == "postgresql"
        except Exception:
            pass

        if is_postgres:
            query = query.filter(
                text("geom && ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326)")
            ).params(min_lon=min_lon, min_lat=min_lat, max_lon=max_lon, max_lat=max_lat)
        else:
            query = query.filter(
                DBDistressCluster.lat.between(min_lat, max_lat),
                DBDistressCluster.lng.between(min_lon, max_lon)
            )

    rows = query.order_by(DBDistressCluster.rpi_score.desc()).limit(limit).all()
    if not rows and not bbox:
        return store.get_clusters()
    elif not rows and parsed_bbox:
        min_lon, min_lat, max_lon, max_lat = parsed_bbox
        return [
            HazardCluster(**c) for c in store.get_clusters()
            if min_lat <= c.get("lat", 0.0) <= max_lat and min_lon <= c.get("lng", 0.0) <= max_lon
        ]
    
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

@router.post("", response_model=HazardCluster)
def create_cluster(cluster_data: dict, db: Session = Depends(get_db)):
    """Creates a new hazard cluster from user upload or live edge stream."""
    created = store.add_cluster(cluster_data)
    return created

