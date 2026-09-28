import os
import sys
import json
import time
from pathlib import Path
import cv2

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.storage.database import SessionLocal, init_db, _SQLITE_FILE
from app.models.db_models import DBDistressCluster, DBTrafficIncident, DBRawIngest, DBAuditLog
from app.services.yolo_inference import yolo_engine
from app.services.evidence_vault import evidence_vault, EVIDENCE_DIR, REGISTRY_FILE

def reset_and_seed_ground_truth():
    print("[RESET] Purging old evidence and initializing clean state...")
    
    # 1. Clean evidence directory completely
    if EVIDENCE_DIR.exists():
        for item in EVIDENCE_DIR.iterdir():
            if item.is_file() and item.name != ".gitkeep":
                try:
                    item.unlink()
                except Exception as e:
                    print(f"Error removing {item.name}: {e}")

    # Reset in-memory registry and save empty JSON
    with evidence_vault.lock:
        evidence_vault.registry = {}
        with open(REGISTRY_FILE, "w", encoding="utf-8") as f:
            json.dump({}, f)

    # Ground Truth Target Images
    img_school_path = Path(r"C:\Users\sauja\Downloads\8e9fa0f8-6139-4b43-b329-f8534434cab3.png")
    img_pothole_path = Path(r"C:\Users\sauja\Downloads\8bdd0ab1-0c9d-4d3a-b87f-8e8b8593d285.png")
    img_hitrun_path = Path(r"C:\Users\sauja\Downloads\4ccd9b59-264f-4fe3-ae62-281e6510fbcb.png")

    now_str = time.strftime("%d %b, %I:%M %p")

    # =========================================================================
    # PROCESS EVIDENCE SNAPSHOTS FIRST (WITHOUT DIRECT DB MUTATIONS)
    # =========================================================================

    # 1. Process Pothole & Crack Image (Image 2)
    ev_pothole_url = "/uploads/evidence/pothole_crack_annotated.jpg"
    if img_pothole_path.exists():
        print(f"[PROCESS] Processing Pothole & Crack Image: {img_pothole_path.name}")
        img_pothole = cv2.imread(str(img_pothole_path))
        res_pothole = yolo_engine.detect_road_hazards(
            img_pothole,
            channel=1,
            burn_overlay=True,
            cluster_id="cl-0001",
            location_name="GST Road, Tambaram (NH-32) near MIOT Hospital",
            save_evidence=True
        )
        ev_pothole_url = res_pothole.get("evidence_url") or ev_pothole_url

    # 2. Process School Zone Crosswalk Image (Image 1)
    ev_school_url = "/uploads/evidence/school_crossing_annotated.jpg"
    if img_school_path.exists():
        print(f"[PROCESS] Processing School Zone Crosswalk Image: {img_school_path.name}")
        img_school = cv2.imread(str(img_school_path))
        res_school = yolo_engine.detect_road_hazards(
            img_school,
            channel=1,
            burn_overlay=True,
            cluster_id="cl-0002",
            location_name="Avvai Shanmugam Salai, Gopalapuram (D.A.V. School Link)",
            save_evidence=True
        )
        ev_school_url = res_school.get("evidence_url") or ev_school_url

    # 3. Process Hit & Run Crash Image (Image 3)
    ev_hitrun_url = "/uploads/evidence/hit_and_run_annotated.jpg"
    if img_hitrun_path.exists():
        print(f"[PROCESS] Processing Hit & Run Crash Image: {img_hitrun_path.name}")
        img_hitrun = cv2.imread(str(img_hitrun_path))
        res_hitrun = yolo_engine.detect_road_hazards(
            img_hitrun,
            channel=2,
            burn_overlay=True,
            cluster_id="inc-hitrun-01",
            location_name="Katraj-Dehu Bypass Corridor (Pune Highway NH-48)",
            save_evidence=True
        )
        ev_hitrun_url = res_hitrun.get("evidence_url") or ev_hitrun_url

    # =========================================================================
    # SINGLE DATABASE TRANSACTION: PURGE & SEED WITH STRICT LOGIC
    # =========================================================================
    db = SessionLocal()
    try:
        # 1. Clean out all existing rows
        db.query(DBDistressCluster).delete()
        db.query(DBTrafficIncident).delete()
        db.query(DBRawIngest).delete()
        db.flush()

        # ---------------------------------------------------------------------
        # PART 1: ROAD INFRASTRUCTURE WORK ORDERS (DISTRESS CLUSTERS)
        # Civil Engineering, Pavements & Municipal Maintenance Only
        # ---------------------------------------------------------------------
        
        # WO-0001: Pothole D40 & Alligator Fatigue Cracks
        wo1 = DBDistressCluster(
            id="cl-0001",
            cluster_code="WO-0001",
            defect_type="D40",
            defect_name="Pothole Cavity (7.8cm Depth) & Alligator Cracks",
            severity_level="critical",
            rpi_score=94.5,
            pass_count=8,
            road_name="GST Road, Tambaram (NH-32)",
            classification="National Highway (NH)",
            nearest_poi="MIOT International Hospital Corridor",
            poi_distance_m=420.0,
            assigned_agency="L&T Highways Infra Ltd (NHAI Concessionaire)",
            agency_phone="+91 98401 22345",
            sla_hours=24,
            status="open",
            lat=12.9516,
            lng=80.1462,
            before_image_url=ev_pothole_url,
            detecting_camera_position="FRONT_WINDSHIELD",
            detecting_channel=1,
            created_at=now_str,
            updated_at=now_str
        )
        db.add(wo1)

        # WO-0002: Faded Zebra Crossing Pavement Restriping
        wo2 = DBDistressCluster(
            id="cl-0002",
            cluster_code="WO-0002",
            defect_type="ZEBRA_CROSSING",
            defect_name="Thermoplastic Zebra Crossing Restriping (IRC:35)",
            severity_level="high",
            rpi_score=88.5,
            pass_count=6,
            road_name="Avvai Shanmugam Salai, Gopalapuram (D.A.V. School Link)",
            classification="School Pedestrian Safety Corridor",
            nearest_poi="D.A.V. Senior Secondary School",
            poi_distance_m=45.0,
            assigned_agency="Greater Chennai Corporation Zone 09 (Teynampet)",
            agency_phone="+91 94451 90009",
            sla_hours=48,
            status="open",
            lat=13.0489,
            lng=80.2585,
            before_image_url=ev_school_url,
            detecting_camera_position="FRONT_WINDSHIELD",
            detecting_channel=1,
            created_at=now_str,
            updated_at=now_str
        )
        db.add(wo2)

        # WO-0003: Open Stormwater Manhole Chamber
        wo3 = DBDistressCluster(
            id="cl-0003",
            cluster_code="WO-0003",
            defect_type="OPEN_MANHOLE",
            defect_name="Uncovered Stormwater Drainage Manhole Chamber",
            severity_level="critical",
            rpi_score=92.0,
            pass_count=14,
            road_name="Poonamallee High Road (Near Nehru Park Metro)",
            classification="State Highway (SH)",
            nearest_poi="Nehru Park Metro Station Entrance B",
            poi_distance_m=65.0,
            assigned_agency="Chennai Metropolitan Water Supply and Sewerage Board (CMWSSB)",
            agency_phone="+91 44 4567 4567",
            sla_hours=24,
            status="open",
            lat=13.0782,
            lng=80.2456,
            before_image_url=ev_pothole_url,
            detecting_camera_position="FRONT_WINDSHIELD",
            detecting_channel=1,
            created_at=now_str,
            updated_at=now_str
        )
        db.add(wo3)

        # WO-0004: Monsoon Road Surface Waterlogging
        wo4 = DBDistressCluster(
            id="cl-0004",
            cluster_code="WO-0004",
            defect_type="WATERLOGGING",
            defect_name="Monsoon Hydroplaning Ponding & Sump Clogging",
            severity_level="high",
            rpi_score=84.0,
            pass_count=9,
            road_name="Velachery Main Road (Near Vijaya Nagar Junction)",
            classification="Major Urban Arterial",
            nearest_poi="Vijaya Nagar Bus Terminus",
            poi_distance_m=110.0,
            assigned_agency="State Highways Department (Metro Wing)",
            agency_phone="+91 44 2235 1200",
            sla_hours=48,
            status="open",
            lat=12.9781,
            lng=80.2217,
            before_image_url=ev_school_url,
            detecting_camera_position="FRONT_WINDSHIELD",
            detecting_channel=1,
            created_at=now_str,
            updated_at=now_str
        )
        db.add(wo4)

        # ---------------------------------------------------------------------
        # PART 2: DYNAMIC TRAFFIC & SAFETY INCIDENTS
        # Traffic Police PCR 112, 108 Ambulance, ANPR Enforcement Only
        # ---------------------------------------------------------------------

        # Incident 1: Hit and Run Collision Evasion (Ground Truth Image 3)
        inc_hitrun = DBTrafficIncident(
            id="inc-hitrun-01",
            reporting_bus_id="BUS-MH12-4419",
            incident_type="HIT_AND_RUN",
            plate_number="MH14KB7316",
            plate_confidence=0.96,
            vehicle_color="White",
            vehicle_class="Kia SUV / Motor Vehicle",
            target_speed_kmh=68.0,
            is_intercepted=False,
            snapshot_url=ev_hitrun_url,
            road_name="Katraj-Dehu Bypass Corridor (Pune Highway NH-48)",
            lat=18.5204,
            lng=73.8567,
            occurred_at=now_str,
            status="ACTIVE_ALERT",
            review_status="AUTO_ADMISSIBLE",
            dispatch_status="PCR_DISPATCHED",
            fine_amount_inr=10000.0,
            mva_section="MVA 1988 Sec 134/187 read with Sec 184 & IPC Sec 279/338",
            camera_position="FRONT_WINDSHIELD",
            channel=2,
            statutory_provenance="POLICE_PCR_112_AUTO_DISPATCH",
            description="LEVEL 1 RED ALERT: Motorcyclist down on active lane. Suspect vehicle MH14KB7316 (White Kia SUV) clocked fleeing collision corridor. 112 Interceptor & 108 Ambulance dispatched."
        )
        db.add(inc_hitrun)

        # Incident 2: Vision Zero School Zone Crossing Alert (Ground Truth Image 1)
        inc_school = DBTrafficIncident(
            id="inc-school-01",
            reporting_bus_id="BUS-TN01-1042",
            incident_type="SCHOOL_CHILDREN_CROSSING_RISK",
            plate_number="NO PLATE",
            plate_confidence=0.98,
            vehicle_color="Pedestrian Zone",
            vehicle_class="School Pedestrian Safety Zone",
            target_speed_kmh=24.0,
            is_intercepted=False,
            snapshot_url=ev_school_url,
            road_name="Avvai Shanmugam Salai, Gopalapuram (D.A.V. School Link)",
            lat=13.0489,
            lng=80.2585,
            occurred_at=now_str,
            status="ACTIVE_ALERT",
            review_status="AUTO_ADMISSIBLE",
            dispatch_status="UNASSIGNED",
            fine_amount_inr=0.0,
            mva_section="IRC:35:2015 Sec 8 & Motor Vehicles (Driving) Regulations 2017 Reg 11",
            camera_position="FRONT_WINDSHIELD",
            channel=1,
            statutory_provenance="VISION_ZERO_PEDESTRIAN_PROTECTION",
            description="Vision Zero School Zone: Group of 22 students in active crosswalk near D.A.V. Senior Secondary School. Mandatory driver yield alert active (Zero pedestrian penalty)."
        )
        db.add(inc_school)

        # Incident 3: High-Speed Wrong-Way Driving (Synthetic Case)
        inc_wrongway = DBTrafficIncident(
            id="inc-wrongway-01",
            reporting_bus_id="BUS-TN01-2098",
            incident_type="WRONG_WAY_DRIVING",
            plate_number="TN07EJ4921",
            plate_confidence=0.95,
            vehicle_color="Silver Grey",
            vehicle_class="Commercial Goods Carrier",
            target_speed_kmh=58.0,
            is_intercepted=False,
            snapshot_url=ev_school_url,
            road_name="OMR IT Expressway (Near Tidel Park Junction)",
            lat=12.9892,
            lng=80.2498,
            occurred_at=now_str,
            status="ACTIVE_ALERT",
            review_status="AUTO_ADMISSIBLE",
            dispatch_status="PCR_DISPATCHED",
            fine_amount_inr=5000.0,
            mva_section="Motor Vehicles Act 1988 Sec 184 (Dangerous / Wrong-Way Driving)",
            camera_position="FRONT_WINDSHIELD",
            channel=1,
            statutory_provenance="AUTOMATIC_TRAFFIC_ENFORCEMENT",
            description="Vehicle TN07EJ4921 clocked driving in reverse flow against dedicated BRTS transit lane at 58 km/h. Automated e-Challan issued."
        )
        db.add(inc_wrongway)

        # Incident 4: Red Light Signal Evasion (Synthetic Case)
        inc_redlight = DBTrafficIncident(
            id="inc-redlight-01",
            reporting_bus_id="BUS-TN01-1042",
            incident_type="RED_LIGHT_VIOLATION",
            plate_number="TN09BK2419",
            plate_confidence=0.97,
            vehicle_color="Dark Blue",
            vehicle_class="Private Passenger Sedan",
            target_speed_kmh=46.0,
            is_intercepted=False,
            snapshot_url=ev_pothole_url,
            road_name="Anna Salai (Near Spencers Plaza Junction)",
            lat=13.0604,
            lng=80.2642,
            occurred_at=now_str,
            status="ACTIVE_ALERT",
            review_status="AUTO_ADMISSIBLE",
            dispatch_status="PCR_DISPATCHED",
            fine_amount_inr=1000.0,
            mva_section="Motor Vehicles Act 1988 Sec 184 & Sec 119 (Traffic Signal Violation)",
            camera_position="FRONT_WINDSHIELD",
            channel=1,
            statutory_provenance="AUTOMATIC_TRAFFIC_ENFORCEMENT",
            description="Vehicle TN09BK2419 breached red signal threshold at Anna Salai Spencers Junction. Automated e-Challan issued."
        )
        db.add(inc_redlight)

        db.commit()
        print("[SUCCESS] Seeded 4 Clean Work Orders & 4 Clean Traffic Incidents.")
    except Exception as e:
        print(f"[RESET] Error during transaction: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

    print("[DONE] Strict domain-segregated dataset successfully seeded.")

if __name__ == "__main__":
    reset_and_seed_ground_truth()
