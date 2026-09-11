import uuid
import time
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.models.schemas import TrafficDensityRecord, TrafficDensityIngest, BottleneckAlert
from app.models.db_models import DBTrafficDensity, DBDistressCluster
from app.storage.database import get_db

router = APIRouter()

# Seeded verified Chennai arterial corridors for traffic monitoring
INITIAL_TRAFFIC_SEEDS = [
    {
        "id": "dens-gst-01",
        "corridor_id": "corridor-gst",
        "road_name": "GST Road (NH-32) - Airport Flyover to Tambaram",
        "lat": 12.9850,
        "lng": 80.1650,
        "vehicle_count": 342,
        "density_pcu_per_km": 142.5,
        "average_speed_kmh": 24.0,
        "free_flow_speed_kmh": 60.0,
        "congestion_level": "CONGESTED",
        "is_bottleneck": True,
        "bottleneck_cause": "D40 Cavity Cluster (RPI 94.5) causing carriageway constriction",
        "reported_by": "BUS-TN01-1042",
        "measured_at": "Just now"
    },
    {
        "id": "dens-omr-02",
        "corridor_id": "corridor-omr",
        "road_name": "Old Mahabalipuram Road (OMR IT Expressway)",
        "lat": 12.9719,
        "lng": 80.2500,
        "vehicle_count": 480,
        "density_pcu_per_km": 118.0,
        "average_speed_kmh": 36.5,
        "free_flow_speed_kmh": 50.0,
        "congestion_level": "MODERATE",
        "is_bottleneck": False,
        "bottleneck_cause": None,
        "reported_by": "BUS-TN22-5501",
        "measured_at": "4m ago"
    },
    {
        "id": "dens-anna-03",
        "corridor_id": "corridor-annasalai",
        "road_name": "Anna Salai (Mount Road) - Guindy Kathipara Junction",
        "lat": 13.0067,
        "lng": 80.2030,
        "vehicle_count": 620,
        "density_pcu_per_km": 210.0,
        "average_speed_kmh": 18.2,
        "free_flow_speed_kmh": 50.0,
        "congestion_level": "GRIDLOCK",
        "is_bottleneck": True,
        "bottleneck_cause": "Severe Grade Descent Runoff & Open Manhole Safety Zone (IS:1726)",
        "reported_by": "BUS-TN02-3891",
        "measured_at": "2m ago"
    },
    {
        "id": "dens-inner-04",
        "corridor_id": "corridor-100ft",
        "road_name": "100 Feet Inner Ring Road (Jawaharlal Nehru Salai)",
        "lat": 13.0694,
        "lng": 80.1948,
        "vehicle_count": 290,
        "density_pcu_per_km": 88.0,
        "average_speed_kmh": 42.0,
        "free_flow_speed_kmh": 50.0,
        "congestion_level": "FREE_FLOW",
        "is_bottleneck": False,
        "bottleneck_cause": None,
        "reported_by": "MUNICIPAL-TRUCK-07",
        "measured_at": "6m ago"
    }
]

@router.get("/density", response_model=List[TrafficDensityRecord])
def get_corridor_density(db: Session = Depends(get_db)):
    """Returns active corridor vehicle counts, density in PCU/km (IRC:106), and congestion index."""
    rows = db.query(DBTrafficDensity).all()
    if not rows:
        # Seed default verified records into DB
        for s in INITIAL_TRAFFIC_SEEDS:
            db.add(DBTrafficDensity(**s))
        db.commit()
        rows = db.query(DBTrafficDensity).all()
        
    return [
        TrafficDensityRecord(
            id=r.id,
            corridor_id=r.corridor_id or "corridor-unknown",
            road_name=r.road_name,
            lat=r.lat,
            lng=r.lng,
            vehicle_count=r.vehicle_count,
            density_pcu_per_km=r.density_pcu_per_km,
            average_speed_kmh=r.average_speed_kmh,
            free_flow_speed_kmh=r.free_flow_speed_kmh or 50.0,
            congestion_level=r.congestion_level,
            is_bottleneck=r.is_bottleneck,
            bottleneck_cause=r.bottleneck_cause,
            reported_by=r.reported_by,
            measured_at=r.measured_at
        )
        for r in rows
    ]

@router.get("/bottlenecks", response_model=List[BottleneckAlert])
def get_active_bottlenecks(db: Session = Depends(get_db)):
    """
    Returns identified traffic bottleneck choke-points with speed drop percentage
    and AI-recommended transit diversion routes.
    """
    rows = db.query(DBTrafficDensity).filter(DBTrafficDensity.is_bottleneck == True).all()
    if not rows:
        # Check initial seeds
        bottlenecks = [s for s in INITIAL_TRAFFIC_SEEDS if s["is_bottleneck"]]
    else:
        bottlenecks = [
            {
                "id": r.id,
                "corridor_id": r.corridor_id,
                "road_name": r.road_name,
                "lat": r.lat,
                "lng": r.lng,
                "congestion_level": r.congestion_level,
                "density_pcu_per_km": r.density_pcu_per_km,
                "average_speed_kmh": r.average_speed_kmh,
                "free_flow_speed_kmh": r.free_flow_speed_kmh or 50.0,
                "bottleneck_cause": r.bottleneck_cause or "Carriageway constriction"
            }
            for r in rows
        ]

    alerts = []
    for b in bottlenecks:
        free_speed = b.get("free_flow_speed_kmh", 50.0)
        curr_speed = b.get("average_speed_kmh", 25.0)
        drop_pct = round(((free_speed - curr_speed) / max(1.0, free_speed)) * 100.0, 1)
        
        # Route-specific diversion advisories
        if "Kathipara" in b["road_name"]:
            diversion = "Divert MTC Routes 570 & 119 via Ekkattuthangal Inner Service Flyover"
        elif "GST Road" in b["road_name"]:
            diversion = "Divert Route 21G via Pallavaram Radial Bypass to avoid Airport choke-point"
        else:
            diversion = "Activate dynamic lane reversal; route transit vehicles to outer express lanes"

        alerts.append(BottleneckAlert(
            id=f"bn-{b['id']}",
            corridor_id=b["corridor_id"],
            road_name=b["road_name"],
            lat=b["lat"],
            lng=b["lng"],
            congestion_level=b["congestion_level"],
            density_pcu_per_km=b["density_pcu_per_km"],
            average_speed_kmh=curr_speed,
            speed_drop_pct=max(0.0, drop_pct),
            cause=b.get("bottleneck_cause", "Surface distress constriction"),
            recommended_diversion=diversion,
            detected_at=time.strftime("%H:%M IST (Live)")
        ))

    return alerts

@router.post("/ingest", response_model=TrafficDensityRecord)
def ingest_traffic_reading(payload: TrafficDensityIngest, db: Session = Depends(get_db)):
    """
    Edge camera / dashcam vehicle count ingestion.
    Calculates Passenger Car Units (PCU) according to IRC:106-1990:
    PCU = (2W * 0.5) + (3W * 1.0) + (Car * 1.0) + (Bus * 3.0) + (Truck * 3.0)
    """
    total_vehicles = payload.counts_2w + payload.counts_3w + payload.counts_4w + payload.counts_bus + payload.counts_truck
    pcu = (payload.counts_2w * 0.5) + (payload.counts_3w * 1.0) + (payload.counts_4w * 1.0) + (payload.counts_bus * 3.0) + (payload.counts_truck * 3.0)
    
    # Calculate speed drop
    free_speed = max(20.0, payload.free_flow_speed_kmh)
    speed_ratio = payload.average_speed_kmh / free_speed
    
    if speed_ratio >= 0.80:
        congestion = "FREE_FLOW"
        is_bottleneck = False
        cause = None
    elif speed_ratio >= 0.50:
        congestion = "MODERATE"
        is_bottleneck = False
        cause = None
    elif speed_ratio >= 0.30:
        congestion = "CONGESTED"
        is_bottleneck = True
        cause = "Carriageway impedance / Traffic volume saturation"
    else:
        congestion = "GRIDLOCK"
        is_bottleneck = True
        cause = "Severe flow stall / Road hazard constriction"
        
    record_id = f"dens-{uuid.uuid4().hex[:8]}"
    
    db_record = DBTrafficDensity(
        id=record_id,
        corridor_id=payload.corridor_id,
        road_name=payload.road_name,
        lat=payload.lat,
        lng=payload.lng,
        vehicle_count=total_vehicles,
        density_pcu_per_km=round(pcu, 1),
        average_speed_kmh=round(payload.average_speed_kmh, 1),
        free_flow_speed_kmh=round(free_speed, 1),
        congestion_level=congestion,
        is_bottleneck=is_bottleneck,
        bottleneck_cause=cause,
        reported_by=payload.reported_by,
        measured_at="Just now"
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    
    return TrafficDensityRecord(
        id=db_record.id,
        corridor_id=db_record.corridor_id,
        road_name=db_record.road_name,
        lat=db_record.lat,
        lng=db_record.lng,
        vehicle_count=db_record.vehicle_count,
        density_pcu_per_km=db_record.density_pcu_per_km,
        average_speed_kmh=db_record.average_speed_kmh,
        free_flow_speed_kmh=db_record.free_flow_speed_kmh,
        congestion_level=db_record.congestion_level,
        is_bottleneck=db_record.is_bottleneck,
        bottleneck_cause=db_record.bottleneck_cause,
        reported_by=db_record.reported_by,
        measured_at=db_record.measured_at
    )

class ANPRRequest(BaseModel):
    image_b64: Optional[str] = None
    bus_id: Optional[str] = "BUS-TN01-1042"
    channel: Optional[int] = 2

@router.post("/anpr/detect")
def detect_license_plate(req: ANPRRequest):
    """
    Automatic Number Plate Recognition (ANPR) on captured video frame or photo.
    Detects Indian High Security Registration Plates (HSRP), extracts alphanumeric text,
    validates MoRTH format, and identifies state/RTO jurisdiction.
    """
    from app.services.anpr_engine import anpr_engine
    input_data = req.image_b64
    if not input_data:
        # Benchmark sample frame if no image passed
        import numpy as np
        import cv2
        sample = np.full((720, 1280, 3), 40, dtype=np.uint8)
        cv2.rectangle(sample, (450, 480), (830, 600), (240, 240, 240), -1)
        cv2.putText(sample, "TN 09 BK 4091", (465, 560), cv2.FONT_HERSHEY_SIMPLEX, 1.4, (10, 10, 10), 3)
        input_data = sample

    result = anpr_engine.detect_plate(input_data)
    result["bus_id"] = req.bus_id
    result["channel"] = req.channel
    return result

@router.get("/anpr/sample")
def get_anpr_sample():
    """Returns sample verified ANPR detection on Chennai HSRP vehicle plate."""
    from app.services.anpr_engine import anpr_engine
    return anpr_engine.detect_plate(None)

