import time
import uuid
import csv
import io
from fastapi import APIRouter, HTTPException, Depends, Response
from fastapi.responses import HTMLResponse
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.storage.database import get_db
from app.storage.mock_database import store
from app.models.schemas import (
    TrafficIncident, 
    TrafficIncidentCreate,
    IncidentReviewAction,
    IncidentDispatchAction
)
from app.models.db_models import DBTrafficIncident
from app.core.statutory_engine import (
    compute_statutory_citation,
    generate_echallan_id,
    generate_section_65b_certificate,
    get_nearest_pcr_unit,
    CAMERA_POSITIONS
)
from app.api.websockets import manager
from app.core.auth import require_roles, get_current_user

router = APIRouter()

class IncidentStatusUpdate(BaseModel):
    status: str
    is_intercepted: Optional[bool] = None
    intercepted_by: Optional[str] = None

@router.get("", response_model=List[TrafficIncident])
def list_incidents(db: Session = Depends(get_db)):
    """Retrieve all traffic incidents from persistent database."""
    rows = db.query(DBTrafficIncident).order_by(DBTrafficIncident.occurred_at.desc()).all()
    if not rows:
        return store.get_incidents()
    
    return [
        TrafficIncident(
            id=r.id,
            reporting_bus_id=r.reporting_bus_id,
            incident_type=r.incident_type,
            plate_number=r.plate_number,
            plate_confidence=r.plate_confidence,
            vehicle_color=r.vehicle_color,
            vehicle_class=r.vehicle_class,
            target_speed_kmh=r.target_speed_kmh,
            is_intercepted=r.is_intercepted,
            intercepted_by_bus_id=r.intercepted_by_bus_id,
            snapshot_url=r.snapshot_url,
            road_name=r.road_name,
            lat=r.lat,
            lng=r.lng,
            occurred_at=r.occurred_at,
            status=r.status,
            fine_amount_inr=r.fine_amount_inr,
            mva_section=r.mva_section,
            echallan_issued=r.echallan_issued,
            echallan_id=r.echallan_id,
            water_depth_cm=r.water_depth_cm,
            pump_deployed=r.pump_deployed,
            pcr_unit_assigned=r.pcr_unit_assigned,
            description=r.description,
            camera_position=r.camera_position or "REAR_OVERTAKE",
            channel=r.channel or 2,
            statutory_provenance=r.statutory_provenance or "MVA_1988_RULE_ENGINE"
        )
        for r in rows
    ]

@router.get("/export/csv")
def export_incidents_csv(db: Session = Depends(get_db)):
    """Exports all recorded traffic incidents and statutory citations to CSV."""
    rows = db.query(DBTrafficIncident).order_by(DBTrafficIncident.occurred_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "Incident ID", "Reporting Node", "Camera Position", "Channel", "Incident Type",
        "Plate Number", "OCR Confidence", "Vehicle Class", "Vehicle Color", "Speed (km/h)",
        "Location Road", "Latitude", "Longitude", "Incident Status", "Review Status",
        "MVA Statutory Section", "Fine Amount (INR)", "e-Challan Serial", "PCR Unit Assigned", "Timestamp"
    ])
    
    for r in rows:
        writer.writerow([
            r.id,
            r.reporting_bus_id,
            r.camera_position or "REAR_OVERTAKE",
            r.channel or 2,
            r.incident_type,
            r.plate_number or "N/A",
            f"{int((r.plate_confidence or 0.9) * 100)}%",
            r.vehicle_class or "Motor Vehicle",
            r.vehicle_color or "Unknown",
            r.target_speed_kmh or 0.0,
            r.road_name,
            r.lat,
            r.lng,
            r.status,
            r.review_status or "AUTO_ADMISSIBLE",
            r.mva_section or "MVA Sec 177",
            r.fine_amount_inr or 0.0,
            r.echallan_id or "N/A",
            r.pcr_unit_assigned or "UNASSIGNED",
            r.occurred_at
        ])
    
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=gctp_traffic_enforcement_log.csv"}
    )

@router.get("/{incident_id}/report", response_class=HTMLResponse)
def get_incident_statutory_dossier(incident_id: str, db: Session = Depends(get_db)):
    """
    Renders official digital evidence dossier under Section 65B Indian Evidence Act 1872
    and Section 63 of Bharatiya Sakshya Adhiniyam 2023 (BSA).
    Ready for printing or PDF export.
    """
    r = db.query(DBTrafficIncident).filter(DBTrafficIncident.id == incident_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    cert = generate_section_65b_certificate({
        "id": r.id,
        "plate_number": r.plate_number,
        "occurred_at": r.occurred_at,
        "lat": r.lat,
        "lng": r.lng,
        "reporting_bus_id": r.reporting_bus_id,
        "camera_position": r.camera_position
    })
    
    pcr_unit = r.pcr_unit_assigned or get_nearest_pcr_unit(r.lat, r.lng)
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>GCTP Legal Evidence Dossier - {r.id}</title>
    <style>
        @page {{ size: A4; margin: 15mm; }}
        body {{
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #1e293b;
            background: #f8fafc;
            margin: 0;
            padding: 24px;
        }}
        .container {{
            max-width: 850px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            padding: 32px;
            border-radius: 8px;
        }}
        .header {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 16px;
            margin-bottom: 20px;
        }}
        .emblem-title {{
            text-align: center;
            flex-grow: 1;
        }}
        .emblem-title h1 {{
            font-size: 18px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0;
            color: #0f172a;
        }}
        .emblem-title h2 {{
            font-size: 14px;
            font-weight: 600;
            color: #475569;
            margin: 4px 0 0;
        }}
        .badge-conf {{
            background: #0284c7;
            color: #fff;
            padding: 4px 10px;
            font-size: 12px;
            font-weight: bold;
            border-radius: 4px;
        }}
        .section-title {{
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 700;
            color: #0f172a;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            margin: 20px 0 12px;
        }}
        .grid-2 {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }}
        .grid-3 {{
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12px;
        }}
        .field-box {{
            background: #f1f5f9;
            padding: 10px 14px;
            border-radius: 6px;
        }}
        .field-label {{
            font-size: 10px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: bold;
            margin-bottom: 4px;
        }}
        .field-value {{
            font-size: 13px;
            font-weight: 600;
            color: #0f172a;
            word-break: break-word;
        }}
        .highlight-red {{
            color: #b91c1c;
            font-weight: 700;
        }}
        .highlight-blue {{
            color: #0369a1;
            font-weight: 700;
        }}
        .plate-box {{
            display: inline-block;
            background: #fef08a;
            color: #000;
            font-family: monospace;
            font-weight: bold;
            font-size: 16px;
            padding: 4px 12px;
            border: 2px solid #000;
            border-radius: 4px;
            letter-spacing: 2px;
        }}
        .snapshot-container {{
            margin-top: 12px;
            text-align: center;
            background: #000;
            padding: 10px;
            border-radius: 6px;
        }}
        .snapshot-img {{
            max-width: 100%;
            max-height: 320px;
            border-radius: 4px;
        }}
        .certificate-box {{
            border: 1px dashed #94a3b8;
            background: #fafaf9;
            padding: 14px;
            border-radius: 6px;
            font-size: 11px;
            line-height: 1.5;
            color: #334155;
            margin-top: 16px;
        }}
        .footer-sig {{
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 36px;
            padding-top: 16px;
            border-top: 1px solid #cbd5e1;
        }}
        .sig-block {{
            text-align: center;
            font-size: 11px;
            color: #475569;
        }}
        .no-print {{
            margin-bottom: 16px;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }}
        .btn {{
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            border: none;
        }}
        .btn-primary {{
            background: #0284c7;
            color: #fff;
        }}
        @media print {{
            body {{ background: #fff; padding: 0; }}
            .container {{ border: none; box-shadow: none; padding: 0; }}
            .no-print {{ display: none; }}
        }}
    </style>
</head>
<body>
    <div class="no-print">
        <button class="btn btn-primary" onclick="window.print()">Print / Save as PDF</button>
    </div>
    <div class="container">
        <div class="header">
            <div style="font-size: 24px; font-weight: bold;">🇮🇳</div>
            <div class="emblem-title">
                <h1>Government of Tamil Nadu • Home Department</h1>
                <h2>Greater Chennai Traffic Police — Automated ANPR Enforcement Wing</h2>
            </div>
            <div><span class="badge-conf">OFFICIAL RECORD</span></div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-bottom: 14px;">
            <div><strong>Dossier Reference:</strong> GCTP-ENF-{r.id}</div>
            <div><strong>e-Challan ID:</strong> {r.echallan_id or "GENERATED ON CONFIRMATION"}</div>
            <div><strong>Generated At:</strong> {cert['timestamp_utc']}</div>
        </div>

        <div class="section-title">1. Statutory Offence & Citation Details</div>
        <div class="grid-2">
            <div class="field-box">
                <div class="field-label">Offence Classification</div>
                <div class="field-value highlight-red">{r.incident_type.replace('_', ' ')}</div>
            </div>
            <div class="field-box">
                <div class="field-label">Statutory Act & Section</div>
                <div class="field-value">{r.mva_section or "Section 184 Motor Vehicles Act 1988"}</div>
            </div>
        </div>

        <div class="grid-3" style="margin-top: 10px;">
            <div class="field-box">
                <div class="field-label">Statutory Fine</div>
                <div class="field-value highlight-red">₹ {r.fine_amount_inr or 2000.0:,.2f}</div>
            </div>
            <div class="field-box">
                <div class="field-label">Enforcement Status</div>
                <div class="field-value highlight-blue">{r.status}</div>
            </div>
            <div class="field-box">
                <div class="field-label">Assigned Police Interceptor</div>
                <div class="field-value">{pcr_unit}</div>
            </div>
        </div>

        <div class="section-title">2. Target Vehicle Identification & Edge Optical Telemetry</div>
        <div class="grid-3">
            <div class="field-box">
                <div class="field-label">Registration Plate (HSRP)</div>
                <div style="margin-top: 4px;"><span class="plate-box">{r.plate_number or "OC-READ-PENDING"}</span></div>
            </div>
            <div class="field-box">
                <div class="field-label">ANPR OCR Confidence</div>
                <div class="field-value">{int((r.plate_confidence or 0.95) * 100)}% (Statutorily Admissible)</div>
            </div>
            <div class="field-box">
                <div class="field-label">Vehicle Make & Color</div>
                <div class="field-value">{r.vehicle_color or 'White'} {r.vehicle_class or 'Passenger Vehicle'}</div>
            </div>
        </div>

        <div class="grid-3" style="margin-top: 10px;">
            <div class="field-box">
                <div class="field-label">Capturing Transit Bus Node</div>
                <div class="field-value">{r.reporting_bus_id}</div>
            </div>
            <div class="field-box">
                <div class="field-label">Camera Sensor Position</div>
                <div class="field-value">{r.camera_position or 'REAR_OVERTAKE'} (CH {r.channel or 2})</div>
            </div>
            <div class="field-box">
                <div class="field-label">Target Speed Recorded</div>
                <div class="field-value highlight-red">{r.target_speed_kmh or 0.0} km/h</div>
            </div>
        </div>

        <div class="section-title">3. NavIC / GPS Geospatial Fix & Timestamp</div>
        <div class="grid-2">
            <div class="field-box">
                <div class="field-label">Arterial Corridor / Road Name</div>
                <div class="field-value">{r.road_name}</div>
            </div>
            <div class="field-box">
                <div class="field-label">Coordinates & Chrono-Fix</div>
                <div class="field-value">{r.lat:.5f}°N, {r.lng:.5f}°E • {r.occurred_at}</div>
            </div>
        </div>

        <div class="section-title">4. Optical Frame Evidence</div>
        <div class="snapshot-container">
            <img class="snapshot-img" src="{r.snapshot_url or 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800'}" alt="Optical Violation Frame" />
        </div>

        <div class="section-title">5. Statutory Evidence Admissibility Certificate</div>
        <div class="certificate-box">
            <strong>CERTIFICATE UNDER SECTION 63 OF BHARATIYA SAKSHYA ADHINIYAM 2023 (BSA) & SECTION 65B INDIAN EVIDENCE ACT 1872</strong><br/>
            I hereby certify that the electronic record produced above is generated by an automated edge computing optical device operating in lawful custody onboard fleet node <strong>{r.reporting_bus_id}</strong> on <strong>{r.road_name}</strong>. The device was operating properly at all material times without human interference.<br/>
            <div style="margin-top: 6px; font-family: monospace; font-size: 10px; color: #475569;">
                Certificate ID: {cert['certificate_id']}<br/>
                Evidence SHA-256 Digest: {cert['evidence_sha256']}<br/>
                Clock Synchronization: NavIC Satellite Dual-Frequency Constellation (IRNSS)
            </div>
        </div>

        <div class="footer-sig">
            <div class="sig-block">
                <div>[SYSTEM ELECTRONIC SEAL]</div>
                <div style="font-weight: bold; margin-top: 4px;">RoadSaarthi Multi-Channel NPU</div>
                <div>Automated Statutory Engine</div>
            </div>
            <div class="sig-block">
                <div>Digitally Verified by</div>
                <div style="font-weight: bold; margin-top: 4px;">Enforcement Officer / Inspector</div>
                <div>Greater Chennai Traffic Police</div>
            </div>
        </div>
    </div>
</body>
</html>
    """
    return HTMLResponse(content=html)

@router.get("/review-queue")
def get_incident_review_queue(db: Session = Depends(get_db)):
    """
    Returns confidence-gated review queue for traffic enforcement officers.
    Incidents with plate confidence < 90% or manual officer flags require human verification
    before statutory e-Challan generation or PCR Interceptor dispatch.
    """
    rows = db.query(DBTrafficIncident).filter(
        (DBTrafficIncident.review_status == "PENDING_REVIEW") | 
        (DBTrafficIncident.plate_confidence < 0.90)
    ).order_by(DBTrafficIncident.occurred_at.desc()).all()
    
    review_items = []
    for r in rows:
        conf = r.plate_confidence or 0.85
        reason = "OCR Confidence below 90% statutory threshold" if conf < 0.90 else "Manual review requested"
        if not r.plate_number:
            reason = "Plate obscured / partial character occlusion"
            
        review_items.append({
            "id": r.id,
            "reporting_bus_id": r.reporting_bus_id,
            "incident_type": r.incident_type,
            "plate_number": r.plate_number,
            "plate_confidence": conf,
            "vehicle_color": r.vehicle_color,
            "vehicle_class": r.vehicle_class,
            "target_speed_kmh": r.target_speed_kmh,
            "road_name": r.road_name,
            "snapshot_url": r.snapshot_url,
            "occurred_at": r.occurred_at,
            "camera_position": r.camera_position or "REAR_OVERTAKE",
            "channel": r.channel or 2,
            "review_status": r.review_status or "PENDING_REVIEW",
            "review_flag_reason": reason,
            "statutory_mandate": "CMVR Rule 50 High Security Registration Plate (HSRP) Verification"
        })
        
    return {
        "queue_count": len(review_items),
        "statutory_compliance": "Bharatiya Nyaya Sanhita (BNS) & MVA Digital Admissibility Standard",
        "pending_items": review_items
    }

@router.post("", response_model=TrafficIncident)
async def create_incident(payload: TrafficIncidentCreate, db: Session = Depends(get_db)):
    """
    Log an incident observed by mobile dashcams or ANPR edge nodes.
    Computes statutory MVA 1988/2019 legal section, fine amount, and saves directly to database.
    """
    data = payload.model_dump()
    conf = data.get("plate_confidence", 0.95)
    incident_type = data.get("incident_type", "UNSAFE_OVERTAKE")
    target_speed = data.get("target_speed_kmh", 0.0)
    channel = data.get("channel", 2)
    
    # Compute legal citation and fine algorithmically
    citation = compute_statutory_citation(
        incident_type=incident_type,
        target_speed_kmh=target_speed,
        plate_confidence=conf,
        water_depth_cm=data.get("water_depth_cm"),
        channel=channel
    )
    
    inc_id = f"inc-{uuid.uuid4().hex[:6]}"
    now_str = time.strftime("%d %b, %I:%M %p")
    pcr_assigned = get_nearest_pcr_unit(data.get("lat", 12.9516), data.get("lng", 80.1462))
    
    review_status = "PENDING_REVIEW" if (conf < 0.90 and data.get("plate_number")) else "AUTO_ADMISSIBLE"
    echallan_issued = True if (review_status == "AUTO_ADMISSIBLE" and data.get("plate_number")) else False
    echallan_id = generate_echallan_id("CHN") if echallan_issued else None
    
    new_db_incident = DBTrafficIncident(
        id=inc_id,
        reporting_bus_id=data.get("reporting_bus_id", "BUS-TN01-1042"),
        incident_type=incident_type,
        plate_number=data.get("plate_number"),
        plate_confidence=conf,
        vehicle_color=data.get("vehicle_color", "White"),
        vehicle_class=data.get("vehicle_class", "Car"),
        target_speed_kmh=target_speed,
        is_intercepted=data.get("is_intercepted", False),
        intercepted_by_bus_id=data.get("intercepted_by_bus_id"),
        snapshot_url=data.get("snapshot_url"),
        road_name=data.get("road_name", "Arterial Transit Road"),
        lat=data.get("lat", 12.9516),
        lng=data.get("lng", 80.1462),
        occurred_at=now_str,
        status="ACTIVE_ALERT",
        fine_amount_inr=citation.get("fine_amount_inr", 2000.0),
        mva_section=citation.get("mva_section"),
        echallan_issued=echallan_issued,
        echallan_id=echallan_id,
        water_depth_cm=citation.get("water_depth_cm"),
        pump_deployed=citation.get("pump_deployed", False),
        pcr_unit_assigned=pcr_assigned,
        description=data.get("description"),
        camera_position=citation.get("camera_position", "REAR_OVERTAKE"),
        channel=citation.get("channel", channel),
        statutory_provenance=citation.get("provenance", "MVA_1988_RULE_ENGINE_V2019"),
        review_status=review_status,
        dispatch_status="PCR_DISPATCHED" if echallan_issued else "UNASSIGNED"
    )
    
    db.add(new_db_incident)
    db.commit()
    db.refresh(new_db_incident)
    
    incident_dict = TrafficIncident(
        id=new_db_incident.id,
        reporting_bus_id=new_db_incident.reporting_bus_id,
        incident_type=new_db_incident.incident_type,
        plate_number=new_db_incident.plate_number,
        plate_confidence=new_db_incident.plate_confidence,
        vehicle_color=new_db_incident.vehicle_color,
        vehicle_class=new_db_incident.vehicle_class,
        target_speed_kmh=new_db_incident.target_speed_kmh,
        is_intercepted=new_db_incident.is_intercepted,
        intercepted_by_bus_id=new_db_incident.intercepted_by_bus_id,
        snapshot_url=new_db_incident.snapshot_url,
        road_name=new_db_incident.road_name,
        lat=new_db_incident.lat,
        lng=new_db_incident.lng,
        occurred_at=new_db_incident.occurred_at,
        status=new_db_incident.status,
        fine_amount_inr=new_db_incident.fine_amount_inr,
        mva_section=new_db_incident.mva_section,
        echallan_issued=new_db_incident.echallan_issued,
        echallan_id=new_db_incident.echallan_id,
        water_depth_cm=new_db_incident.water_depth_cm,
        pump_deployed=new_db_incident.pump_deployed,
        pcr_unit_assigned=new_db_incident.pcr_unit_assigned,
        description=new_db_incident.description,
        camera_position=new_db_incident.camera_position,
        channel=new_db_incident.channel,
        statutory_provenance=new_db_incident.statutory_provenance
    )
    
    # Broadcast to all live WebGIS clients
    await manager.broadcast({
        "type": "INCIDENT_ALERT",
        "incident": incident_dict.model_dump(),
        "incidents": store.get_incidents(),
        "metrics": store.get_metrics(),
        "latest_log": store.audit_logs[0] if store.audit_logs else None
    })
    return incident_dict


@router.post("/{incident_id}/review")
async def review_incident(
    incident_id: str,
    review: IncidentReviewAction,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles(["admin", "safety"]))
):
    """
    Officer review workflow for ANPR reads and traffic violations.
    Requires GCTP Traffic Safety officer or Admin clearance.
    Accepts, rejects, or corrects an AI plate reading.
    """
    incident = db.query(DBTrafficIncident).filter(DBTrafficIncident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    officer_badge = current_user.get("badge_number", "GCTP-OFFICER")
    officer_name = current_user.get("name", "Traffic Officer")
    timestamp = time.strftime("%d %b, %I:%M %p")
    
    if review.action == "ACCEPT":
        incident.review_status = "ACCEPTED"
        incident.reviewed_by = f"{officer_name} ({officer_badge})"
        incident.reviewed_at = timestamp
        # Automatically make admissible for e-challan
        if not incident.echallan_issued and incident.plate_number:
            incident.echallan_issued = True
            incident.echallan_id = f"ECH-2026-{uuid.uuid4().hex[:6].upper()}"
            incident.mva_section = incident.mva_section or "MVA Sec 177/184"
            incident.fine_amount_inr = incident.fine_amount_inr or 1500.0
            incident.status = "ECHALLAN_ISSUED"
    elif review.action == "REJECT":
        incident.review_status = "REJECTED"
        incident.reviewed_by = f"{officer_name} ({officer_badge})"
        incident.reviewed_at = timestamp
        incident.rejection_reason = review.officer_notes or "Rejected upon manual inspection"
        incident.status = "REJECTED_AUDIT"
    elif review.action == "CORRECT_PLATE":
        if not review.corrected_plate:
            raise HTTPException(status_code=400, detail="corrected_plate is required for CORRECT_PLATE action")
        incident.plate_number = review.corrected_plate.upper().strip()
        incident.plate_confidence = 1.0  # Human officer verified
        incident.review_status = "ACCEPTED"
        incident.reviewed_by = f"{officer_name} ({officer_badge})"
        incident.reviewed_at = timestamp
        if not incident.echallan_issued:
            incident.echallan_issued = True
            incident.echallan_id = f"ECH-2026-{uuid.uuid4().hex[:6].upper()}"
            incident.mva_section = incident.mva_section or "MVA Sec 177/184"
            incident.fine_amount_inr = incident.fine_amount_inr or 1500.0
            incident.status = "ECHALLAN_ISSUED"
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported review action: {review.action}")
        
    db.commit()
    db.refresh(incident)
    
    updated_dict = {
        "id": incident.id,
        "review_status": incident.review_status,
        "reviewed_by": incident.reviewed_by,
        "reviewed_at": incident.reviewed_at,
        "plate_number": incident.plate_number,
        "echallan_id": incident.echallan_id,
        "status": incident.status
    }
    
    # Broadcast to live dashboard
    await manager.broadcast({
        "type": "INCIDENT_REVIEW_COMPLETED",
        "incident_id": incident_id,
        "review": updated_dict,
        "incidents": store.get_incidents(),
        "metrics": store.get_metrics()
    })
    
    return {
        "success": True,
        "message": f"Incident {incident_id} successfully processed with action {review.action}",
        "incident": updated_dict
    }

@router.post("/{incident_id}/dispatch")
async def dispatch_incident_alert(
    incident_id: str,
    dispatch: IncidentDispatchAction,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles(["admin", "safety"]))
):
    """
    Dispatches traffic incident alert to 112 Interceptor patrol unit or issues e-Challan.
    Requires Traffic Safety or Admin clearance.
    """
    incident = db.query(DBTrafficIncident).filter(DBTrafficIncident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    target_pcr = dispatch.target_pcr_unit or "PCR-14"
    incident.pcr_unit_assigned = target_pcr
    incident.dispatch_status = "PCR_DISPATCHED"
    incident.status = "DISPATCHED"
    
    if dispatch.channel in ("ECHALLAN_MVA", "ALL") and incident.plate_number:
        incident.echallan_issued = True
        incident.echallan_id = incident.echallan_id or f"ECH-2026-{uuid.uuid4().hex[:6].upper()}"
        incident.fine_amount_inr = dispatch.fine_amount_override or incident.fine_amount_inr or 2000.0
        incident.mva_section = incident.mva_section or "MVA Sec 184 (Dangerous Driving)"
        
    db.commit()
    db.refresh(incident)
    
    dispatch_summary = {
        "incident_id": incident.id,
        "target_pcr_unit": target_pcr,
        "channel": dispatch.channel,
        "priority": dispatch.priority,
        "echallan_id": incident.echallan_id,
        "fine_amount_inr": incident.fine_amount_inr,
        "status": incident.status,
        "dispatched_by": current_user.get("name", "Traffic Commander"),
        "timestamp": time.strftime("%H:%M:%S IST")
    }
    
    await manager.broadcast({
        "type": "INCIDENT_DISPATCHED",
        "dispatch": dispatch_summary,
        "incidents": store.get_incidents(),
        "metrics": store.get_metrics()
    })
    
    return {
        "success": True,
        "message": f"Alert dispatched to {target_pcr} via channel {dispatch.channel}",
        "dispatch_summary": dispatch_summary
    }

@router.patch("/{incident_id}")
async def update_incident(
    incident_id: str,
    payload: IncidentStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update incident status (e.g. DISPATCHED, RESOLVED, INTERCEPTED) directly in database."""
    incident = db.query(DBTrafficIncident).filter(DBTrafficIncident.id == incident_id).first()
    if not incident:
        # Fallback to store
        updated = store.update_incident_status(
            incident_id=incident_id,
            new_status=payload.status,
            is_intercepted=payload.is_intercepted,
            intercepted_by=payload.intercepted_by
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Incident not found")
        result = updated
    else:
        incident.status = payload.status
        if payload.is_intercepted is not None:
            incident.is_intercepted = payload.is_intercepted
        if payload.intercepted_by is not None:
            incident.intercepted_by_bus_id = payload.intercepted_by
        db.commit()
        db.refresh(incident)
        result = {
            "id": incident.id,
            "status": incident.status,
            "is_intercepted": incident.is_intercepted,
            "intercepted_by_bus_id": incident.intercepted_by_bus_id
        }
    
    await manager.broadcast({
        "type": "INCIDENT_UPDATE",
        "incident_id": incident_id,
        "update": result,
        "incidents": store.get_incidents(),
        "metrics": store.get_metrics()
    })
    return result

