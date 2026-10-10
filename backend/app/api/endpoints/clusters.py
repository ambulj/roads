import csv
import io
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Response
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.storage.database import get_db
from app.storage.mock_database import store
from app.models.schemas import (
    HazardCluster,
    InfrastructureDeficiencyIngest,
    InfrastructureDeficiencyResponse,
    ClusterTriageRequest
)
from app.models.db_models import DBDistressCluster, DBAuditLog
from app.api.websockets import manager
from app.core.auth import require_roles, get_optional_current_user

router = APIRouter()


VALID_TRIAGE_ACTIONS = {"ACKNOWLEDGE", "ASSIGN", "REJECT"}
VALID_REJECTION_REASONS = {"FALSE_POSITIVE", "DUPLICATE_CLUSTER", "JURISDICTION_NON_PWD", "UNDER_ACTIVE_REPAIR"}


def _row_to_cluster(r: DBDistressCluster) -> HazardCluster:
    return HazardCluster(
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
        water_depth_cm=getattr(r, "water_depth_cm", 0.0) or 0.0,
        surface_area_m2=getattr(r, "surface_area_m2", 0.0) or 0.0,
        drainage_failure_index=getattr(r, "drainage_failure_index", 0.0) or 0.0,
        irc_standard=getattr(r, "irc_standard", "") or "",
        repair_completed_at=getattr(r, "repair_completed_at", None),
        acknowledged_at=getattr(r, "acknowledged_at", None),
        assigned_officer_id=getattr(r, "assigned_officer_id", None),
        rejection_reason=getattr(r, "rejection_reason", None),
        triage_status=getattr(r, "triage_status", "NEW") or "NEW",
        created_at=r.created_at,
        updated_at=r.updated_at
    )


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
    
    return [_row_to_cluster(r) for r in rows]

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

@router.get("/infrastructure", response_model=List[HazardCluster])
def get_infrastructure_deficiencies(
    category: Optional[str] = "ALL",
    db: Session = Depends(get_db)
):
    """
    Returns list of road infrastructure deficiencies and waterlogging hazards.
    Supports filtering by category: DIVIDERS, ZEBRA_CROSSINGS, SIGNS, WATERLOGGING, ALL.
    """
    category_upper = (category or "ALL").upper()
    
    cat_map = {
        "DIVIDERS": ["MISSING_ROAD_DIVIDER", "MISSING_DIVIDER"],
        "ZEBRA_CROSSINGS": ["MISSING_ZEBRA_CROSSING", "ZEBRA_CROSSING", "FADED_CROSSING"],
        "SIGNS": ["DAMAGED_TRAFFIC_SIGN", "MISSING_SIGN", "FOLIAGE_OBSCURED_SIGN", "BANNER_OBSCURED_SIGN"],
        "WATERLOGGING": ["WATERLOGGING_HAZARD", "WATERLOGGING", "SUBMERGED_POTHOLE"]
    }

    all_infra_types = (
        cat_map["DIVIDERS"] + cat_map["ZEBRA_CROSSINGS"] + 
        cat_map["SIGNS"] + cat_map["WATERLOGGING"]
    )

    if category_upper in cat_map:
        target_types = cat_map[category_upper]
    else:
        target_types = all_infra_types

    rows = db.query(DBDistressCluster).filter(
        DBDistressCluster.defect_type.in_(target_types)
    ).order_by(DBDistressCluster.rpi_score.desc()).all()

    return [_row_to_cluster(r) for r in rows]

@router.post("/infrastructure/ingest", response_model=HazardCluster)
def ingest_infrastructure_deficiency(
    payload: InfrastructureDeficiencyIngest,
    db: Session = Depends(get_db)
):
    """
    Ingests missing road infrastructure deficiency or waterlogging hazard.
    Calculates Drainage Failure Index (DFI), assigns IRC code standards,
    evaluates statutory severity, and stores into persistent DBDistressCluster.
    """
    defect_type_str = str(payload.defect_type.value if hasattr(payload.defect_type, "value") else payload.defect_type)
    
    # Compute waterlogging metrics
    water_depth = payload.water_depth_cm or 0.0
    surface_area = payload.surface_area_m2 or 0.0
    dfi = 0.0
    if defect_type_str in ("WATERLOGGING_HAZARD", "WATERLOGGING") or (water_depth > 0 and surface_area > 0):
        dfi = round((water_depth * surface_area) / 100.0, 2)

    # Assign IRC statutory standard
    irc_code = payload.irc_standard
    if not irc_code:
        if defect_type_str in ("MISSING_ROAD_DIVIDER", "MISSING_DIVIDER"):
            irc_code = "IRC:SP:84"
        elif defect_type_str in ("MISSING_ZEBRA_CROSSING", "ZEBRA_CROSSING", "FADED_CROSSING"):
            irc_code = "IRC:35:2015"
        elif defect_type_str in ("DAMAGED_TRAFFIC_SIGN", "MISSING_SIGN"):
            irc_code = "IRC:67:2022"
        elif defect_type_str in ("WATERLOGGING_HAZARD", "WATERLOGGING"):
            irc_code = "IRC:SP:42"
        else:
            irc_code = "IRC:SP:20"

    # Human-readable defect names
    defect_names = {
        "MISSING_ROAD_DIVIDER": "Missing Median Road Divider",
        "MISSING_DIVIDER": "Missing Road Divider Discontinuity",
        "MISSING_ZEBRA_CROSSING": "Missing / Faded Pedestrian Crosswalk",
        "ZEBRA_CROSSING": "Substandard Zebra Crossing",
        "FADED_CROSSING": "Faded Pedestrian Crossing",
        "DAMAGED_TRAFFIC_SIGN": "Damaged Road Traffic Sign",
        "MISSING_SIGN": "Missing Regulatory Traffic Sign",
        "WATERLOGGING_HAZARD": "Critical Pavement Waterlogging & Aquaplaning Risk",
        "WATERLOGGING": "Standing Water Pavement Accumulation",
    }
    name = defect_names.get(defect_type_str, defect_type_str.replace("_", " ").title())

    # Severity resolution
    if payload.severity_level:
        sev = payload.severity_level.value if hasattr(payload.severity_level, "value") else str(payload.severity_level)
    else:
        if defect_type_str in ("WATERLOGGING_HAZARD", "WATERLOGGING"):
            if water_depth > 15.0:
                sev = "critical"
            elif water_depth > 8.0:
                sev = "high"
            else:
                sev = "medium"
        elif defect_type_str in ("MISSING_ROAD_DIVIDER", "MISSING_DIVIDER"):
            sev = "critical"
        elif defect_type_str in ("MISSING_ZEBRA_CROSSING", "FADED_CROSSING"):
            sev = "critical"
        else:
            sev = "high"

    # RPI calculation
    if sev == "critical":
        rpi = round(90.0 + min(9.5, dfi * 0.5), 1)
        sla = 24 if defect_type_str != "WATERLOGGING_HAZARD" else 4
    elif sev == "high":
        rpi = round(75.0 + min(10.0, dfi * 0.5), 1)
        sla = 48
    else:
        rpi = 60.0
        sla = 72

    uid = f"cl-infra-{uuid.uuid4().hex[:8]}"
    code = f"WO-INF-{uuid.uuid4().hex[:6].upper()}"
    now_str = datetime.now(timezone.utc).strftime("%d %b, %I:%M %p")

    new_cluster = DBDistressCluster(
        id=uid,
        cluster_code=code,
        defect_type=defect_type_str,
        defect_name=name,
        severity_level=sev,
        rpi_score=rpi,
        pass_count=1,
        road_name=payload.road_name,
        classification="Municipal Arterial" if "GST" not in payload.road_name else "National Highway (NH)",
        nearest_poi="Urban Transit Corridor",
        poi_distance_m=100.0,
        assigned_agency="Greater Chennai Corporation (GCC)" if "WATER" not in defect_type_str else "CMWSSB / GCC Stormwater Wing",
        agency_phone="+91-44-25384520",
        sla_hours=sla,
        status="open",
        lat=payload.lat,
        lng=payload.lng,
        water_depth_cm=water_depth,
        surface_area_m2=surface_area,
        drainage_failure_index=dfi,
        irc_standard=irc_code,
        field_notes=payload.field_notes or f"Infrastructure deficiency logged under {irc_code}.",
        detecting_camera_position=payload.camera_position or "FRONT_WINDSHIELD",
        detecting_channel=payload.channel or 1,
        created_at=now_str,
        updated_at=now_str
    )

    db.add(new_cluster)
    db.commit()
    db.refresh(new_cluster)

    return _row_to_cluster(new_cluster)

@router.get("/{cluster_id}", response_model=HazardCluster)
def get_cluster(cluster_id: str, db: Session = Depends(get_db)):
    row = db.query(DBDistressCluster).filter(
        (DBDistressCluster.id == cluster_id) | (DBDistressCluster.cluster_code == cluster_id)
    ).first()
    
    if row:
        return _row_to_cluster(row)
        
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


@router.post("/{cluster_id}/triage", response_model=HazardCluster)
def triage_cluster(
    cluster_id: str,
    req: ClusterTriageRequest,
    db: Session = Depends(get_db)
):
    """
    Officer-Certified Defect Triage endpoint:
    Supports ACKNOWLEDGE, ASSIGN, and REJECT actions.
    Strictly validates rejection reasons against allowed statutory taxonomy:
    FALSE_POSITIVE, DUPLICATE_CLUSTER, JURISDICTION_NON_PWD, UNDER_ACTIVE_REPAIR.
    """
    cluster = db.query(DBDistressCluster).filter(
        (DBDistressCluster.id == cluster_id) | (DBDistressCluster.cluster_code == cluster_id)
    ).first()

    if not cluster:
        raise HTTPException(status_code=404, detail="Hazard cluster not found")

    action = req.action.strip().upper()
    if action not in VALID_TRIAGE_ACTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action: {req.action}. Must be one of: {', '.join(sorted(VALID_TRIAGE_ACTIONS))}"
        )

    now_iso = datetime.now(timezone.utc).isoformat()

    if action == "REJECT":
        if not req.rejection_reason or req.rejection_reason.strip() not in VALID_REJECTION_REASONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid rejection reason: {req.rejection_reason}. Must be one of: {', '.join(sorted(VALID_REJECTION_REASONS))}"
            )
        cluster.status = "rejected"
        cluster.triage_status = "REJECTED"
        cluster.rejection_reason = req.rejection_reason.strip()

    elif action == "ACKNOWLEDGE":
        cluster.triage_status = "ACKNOWLEDGED"
        cluster.acknowledged_at = now_iso

    elif action == "ASSIGN":
        assignee = req.assigned_officer_id or req.officer_id
        cluster.triage_status = "ASSIGNED"
        cluster.status = "assigned"
        cluster.assigned_officer_id = assignee

    if req.notes:
        if cluster.field_notes:
            cluster.field_notes = f"{cluster.field_notes}\n[TRIAGE {req.officer_id}]: {req.notes}"
        else:
            cluster.field_notes = f"[TRIAGE {req.officer_id}]: {req.notes}"

    cluster.updated_at = now_iso

    db.add(DBAuditLog(
        id=f"audit-{uuid.uuid4().hex[:8]}",
        bus_id=req.officer_id,
        corridor=cluster.road_name,
        message=f"Defect {cluster.cluster_code} triaged: {action} by officer {req.officer_id}",
        latency_ms=18,
        type="TRIAGE_ACTION",
        timestamp="Just now",
        created_at=now_iso
    ))

    db.commit()
    db.refresh(cluster)
    return _row_to_cluster(cluster)


@router.delete("/{cluster_id}")
async def delete_cluster_endpoint(
    cluster_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin", "safety", "maintenance"]))
):
    """
    Permanently deletes a road hazard cluster from the database and broadcasts
    updated state to immediately declutter the WebGIS map.
    """
    cl = db.query(DBDistressCluster).filter(
        (DBDistressCluster.id == cluster_id) |
        (DBDistressCluster.cluster_code == cluster_id) |
        (DBDistressCluster.id == cluster_id.lower()) |
        (DBDistressCluster.id == cluster_id.upper())
    ).first()
    if cl:
        db.delete(cl)
        db.commit()
    store.delete_cluster(cluster_id)

    await manager.broadcast({
        "type": "SNAPSHOT",
        "incidents": store.get_incidents(),
        "clusters": store.get_clusters(),
        "metrics": store.get_metrics(),
        "fleet": store.get_fleet_nodes()
    })

    return {
        "success": True,
        "message": f"Hazard cluster {cluster_id} permanently removed from database."
    }


@router.post("/clear-clutter")
async def clear_clusters_clutter(
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """
    Purges cluttered test distress clusters from database and broadcasts clean state.
    """
    summary = store.clear_clutter()
    incidents = store.get_incidents()
    clusters = store.get_clusters()
    metrics = store.get_metrics()
    fleet = store.get_fleet_nodes()
    await manager.broadcast({
        "type": "SNAPSHOT",
        "incidents": incidents,
        "clusters": clusters,
        "metrics": metrics,
        "fleet": fleet
    })
    return {
        "success": True,
        "message": "Hazard clusters decluttered successfully.",
        "summary": summary,
        "incidents": incidents,
        "clusters": clusters,
        "metrics": metrics
    }


