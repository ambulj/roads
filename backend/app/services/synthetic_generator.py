import asyncio
import random
import uuid
import os
import argparse
import sys
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.storage.mock_database import store
from app.models.schemas import DefectType
from app.spatial.poi_database import find_nearest_poi

URBAN_CORRIDORS = [
    {
        "name": "GST Road, Tambaram (NH-32)",
        "classification": "National Highway (NH)",
        "lat_range": (12.9450, 12.9680),
        "lng_range": (80.1400, 80.1580),
        "agency": "L&T Highways Infra Ltd",
        "phone": "+91 98401 22345"
    },
    {
        "name": "Guindy Kathipara Grade Junction",
        "classification": "Major Arterial",
        "lat_range": (13.0020, 13.0180),
        "lng_range": (80.1980, 80.2150),
        "agency": "NHAI Metro Division Chennai",
        "phone": "+91 91760 55667"
    },
    {
        "name": "Anna Salai (Mount Road) CBD",
        "classification": "Primary CBD Arterial",
        "lat_range": (13.0480, 13.0720),
        "lng_range": (80.2420, 80.2620),
        "agency": "GMR Urban Highways Ltd",
        "phone": "+91 98840 77890"
    },
    {
        "name": "Old Mahabalipuram Road (OMR IT Expressway)",
        "classification": "IT Expressway",
        "lat_range": (12.8750, 12.9800),
        "lng_range": (80.2250, 80.2550),
        "agency": "Tamil Nadu Road Dev Corp (TNRDC)",
        "phone": "+91 94440 99881"
    },
    {
        "name": "Velachery 100 Feet Road / Bypass",
        "classification": "Suburban Arterial",
        "lat_range": (12.9720, 12.9910),
        "lng_range": (80.2120, 80.2310),
        "agency": "Chennai Corp Zone 13 (Adyar/Velachery)",
        "phone": "+91 94451 90013"
    },
    {
        "name": "Poonamallee High Road (NH-48)",
        "classification": "Western Radial",
        "lat_range": (13.0750, 13.0920),
        "lng_range": (80.2250, 80.2780),
        "agency": "Tamil Nadu PWD Division 4",
        "phone": "+91 94440 12890"
    },
    {
        "name": "T. Nagar Usman Road Commercial Link",
        "classification": "Commercial District",
        "lat_range": (13.0380, 13.0470),
        "lng_range": (80.2310, 80.2420),
        "agency": "Chennai Corp Zone 10 (Kodambakkam)",
        "phone": "+91 94451 90010"
    },
    {
        "name": "Inner Ring Road (Jawaharlal Nehru Salai)",
        "classification": "Ring Arterial",
        "lat_range": (13.0250, 13.0700),
        "lng_range": (80.1900, 80.2150),
        "agency": "Chennai Corp Zone 8 (Anna Nagar)",
        "phone": "+91 94451 90008"
    }
]

VEHICLE_CLASSES = ["SUV", "Sedan", "Hatchback", "Commercial Truck", "Motorcycle", "Auto Rickshaw"]
VEHICLE_COLORS = ["White", "Silver", "Matte Black", "Dark Grey", "Navy Blue", "Maroon", "Yellow"]

SAMPLE_REPAIR_PHOTOS_BEFORE = [
    "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600",
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600",
    "https://images.unsplash.com/photo-1584463699057-a36c84c1f600?w=600"
]

SAMPLE_REPAIR_PHOTOS_AFTER = [
    "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600",
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600",
    "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600"
]

SAMPLE_FIELD_NOTES = [
    "Compacted 180kg VG-30 cold-mix asphalt under IRC:SP:20 standard. Edge sealed with RS-1 cationic bitumen emulsion.",
    "Milled damaged asphalt to 60mm depth. Tack-coated and rolled with 8-ton pneumatic roller. Road opened to transit.",
    "Stormwater gully cleared of debris; underpass flood level dropped to 0cm. Slit drainage cover replaced.",
    "Transverse crack routing and hot-poured rubberized bitumen sealant injected. Surface skid resistance verified."
]

def generate_indian_license_plate() -> str:
    districts = ["01", "02", "04", "05", "07", "09", "10", "14", "22"]
    series = "".join(random.choices("ABCDEFGHJKLMNPQRSTUVWXYZ", k=2))
    digits = f"{random.randint(1000, 9999)}"
    return f"TN-{random.choice(districts)}-{series}-{digits}"

def generate_synthetic_tick() -> Dict[str, Any]:
    results: Dict[str, Any] = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ingests_generated": [],
        "incidents_generated": [],
        "work_orders_updated": [],
        "fleet_nodes_updated": 0
    }

    buses = store.fleet_nodes
    bus_ids = [b["id"] for b in buses] if buses else ["BUS-TN01-1042", "BUS-TN02-3891", "MUNICIPAL-TRUCK-07"]

    # 1. GENERATE ROAD DEFECT INGESTS (2 to 4 detections)
    num_ingests = random.randint(2, 4)
    existing_clusters = store.get_clusters()

    for _ in range(num_ingests):
        bus_id = random.choice(bus_ids)
        
        # 50% chance to target an existing cluster within 12m (testing 15m DBSCAN merge)
        if existing_clusters and random.random() < 0.5:
            target_cluster = random.choice(existing_clusters)
            lat = round(target_cluster["lat"] + (random.random() - 0.5) * 0.00010, 5)
            lng = round(target_cluster["lng"] + (random.random() - 0.5) * 0.00010, 5)
            defect_type = target_cluster["defect_type"]
        else:
            corridor = random.choice(URBAN_CORRIDORS)
            lat = round(random.uniform(*corridor["lat_range"]), 5)
            lng = round(random.uniform(*corridor["lng_range"]), 5)
            defect_type = random.choices(
                ["D40", "D20", "D10", "D00", "WATERLOGGING"],
                weights=[45, 20, 15, 10, 10],
                k=1
            )[0]

        if defect_type == "D40":
            vertical_g = round(random.uniform(1.3, 2.2), 2)
        elif defect_type == "WATERLOGGING":
            vertical_g = round(random.uniform(0.9, 1.2), 2)
        else:
            vertical_g = round(random.uniform(1.1, 1.5), 2)

        ingest_payload = {
            "bus_id": bus_id,
            "lat": lat,
            "lng": lng,
            "speed_kmh": round(random.uniform(32.0, 55.0), 1),
            "heading": round(random.uniform(0.0, 360.0), 1),
            "defect_type": defect_type,
            "confidence": round(random.uniform(0.88, 0.98), 3),
            "vertical_g_force": vertical_g
        }

        ingest_res = store.add_ingest(ingest_payload)
        results["ingests_generated"].append({
            "bus_id": bus_id,
            "defect_type": defect_type,
            "lat": lat,
            "lng": lng,
            "action": ingest_res.get("action")
        })

    # 2. GENERATE TRAFFIC / SAFETY INCIDENTS (1 to 2 incidents)
    num_incidents = random.randint(1, 2)
    incident_types = [
        "HIT_AND_RUN",
        "RASH_DRIVING",
        "BUS_LANE_ENCROACH",
        "UNSAFE_OVERTAKE",
        "WATERLOGGING",
        "VULNERABLE_PEDESTRIAN"
    ]

    for _ in range(num_incidents):
        inc_type = random.choice(incident_types)
        corridor = random.choice(URBAN_CORRIDORS)
        lat = round(random.uniform(*corridor["lat_range"]), 5)
        lng = round(random.uniform(*corridor["lng_range"]), 5)
        bus_id = random.choice(bus_ids)

        is_traffic_violation = inc_type in ("BUS_LANE_ENCROACH", "UNSAFE_OVERTAKE")
        is_police_alert = inc_type in ("HIT_AND_RUN", "RASH_DRIVING")
        is_waterlogging = inc_type == "WATERLOGGING"

        plate = generate_indian_license_plate() if (is_traffic_violation or is_police_alert) else None
        v_color = random.choice(VEHICLE_COLORS) if plate else None
        v_class = random.choice(VEHICLE_CLASSES) if plate else ("Flood Level 24cm" if is_waterlogging else "Pedestrian Hazard Zone")
        speed = round(random.uniform(65.0, 96.0), 1) if is_police_alert else 0.0

        water_depth = random.randint(18, 36) if is_waterlogging else None
        fine_amount = 1500 if is_traffic_violation else None
        mva_sec = "MVA Sec 115/194" if is_traffic_violation else None
        echallan_issued = True if is_traffic_violation else None
        echallan_id = f"ECH-2025-{random.randint(10000, 99999)}" if is_traffic_violation else None
        pcr_unit = f"PCR-{random.randint(11, 45)}" if is_police_alert else None

        incident_payload = {
            "reporting_bus_id": bus_id,
            "incident_type": inc_type,
            "plate_number": plate,
            "plate_confidence": round(random.uniform(0.91, 0.99), 2) if plate else None,
            "vehicle_color": v_color,
            "vehicle_class": v_class,
            "target_speed_kmh": speed,
            "road_name": f"{corridor['name']} [Sector-{random.randint(1, 8)}]",
            "lat": lat,
            "lng": lng,
            "water_depth_cm": water_depth,
            "pump_deployed": False if is_waterlogging else None,
            "fine_amount_inr": fine_amount,
            "mva_section": mva_sec,
            "echallan_issued": echallan_issued,
            "echallan_id": echallan_id,
            "pcr_unit_assigned": pcr_unit,
            "description": (
                f"Severe inundation at {corridor['name']}, water depth {water_depth}cm. GCC Dewatering required."
                if is_waterlogging else (
                    f"Traffic lane violation: {plate or 'Vehicle'} crossing restricted zone."
                    if is_traffic_violation else f"Critical mobility event logged on {corridor['name']}."
                )
            )
        }

        created_inc = store.add_incident(incident_payload)
        results["incidents_generated"].append(created_inc)

    # 3. ADVANCE WORK ORDER LIFECYCLE (Autonomous Defect Detection -> Repair -> Fleet Re-pass Auto-Closure)
    clusters = store.get_clusters()
    if clusters:
        # Step A: Open -> In Progress (Contractor Dispatch & PWD Work Scheduled)
        open_clusters = [c for c in clusters if c.get("status") in ("open", "assigned")]
        if open_clusters and random.random() < 0.65:
            c_to_progress = random.choice(open_clusters)
            store.update_cluster_status(
                cluster_id=c_to_progress["id"],
                new_status="in_progress",
                before_image_url=random.choice(SAMPLE_REPAIR_PHOTOS_BEFORE),
                field_notes="PWD Emergency Crew dispatched under SLA. Hot-mix asphalt staging & repair commenced."
            )
            results["work_orders_updated"].append({
                "id": c_to_progress["id"],
                "code": c_to_progress["cluster_code"],
                "transition": "open -> in_progress"
            })

        # Step B: In Progress -> Resolved (Physical Patch Applied)
        in_prog = [c for c in clusters if c.get("status") == "in_progress"]
        if in_prog and random.random() < 0.60:
            c_to_resolve = random.choice(in_prog)
            store.update_cluster_status(
                cluster_id=c_to_resolve["id"],
                new_status="resolved",
                after_image_url=random.choice(SAMPLE_REPAIR_PHOTOS_AFTER),
                field_notes=random.choice(SAMPLE_FIELD_NOTES)
            )
            results["work_orders_updated"].append({
                "id": c_to_resolve["id"],
                "code": c_to_resolve["cluster_code"],
                "transition": "in_progress -> resolved"
            })

        # Step C: Resolved -> Verified Closed (Autonomous Fleet Re-pass Patrol Closure)
        resolved_clusters = [c for c in clusters if c.get("status") == "resolved"]
        if resolved_clusters and random.random() < 0.70:
            c_to_verify = random.choice(resolved_clusters)
            verifying_bus = random.choice(bus_ids)
            audit_msg = (
                f"[AUTONOMOUS_FLEET_CLOSURE] Verified closed by Fleet Node {verifying_bus} on re-pass patrol. "
                f"Telemetry: Gz vertical shock = 0.98g (nominal baseline, threshold < 1.15g). "
                f"Optical AI: Defect cavity 0% detected per IRC:SP:20 standard. MoHUA cryptographic audit logged."
            )
            store.update_cluster_status(
                cluster_id=c_to_verify["id"],
                new_status="verified_closed",
                after_image_url="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80",
                field_notes=audit_msg
            )
            store.audit_logs.insert(0, {
                "id": str(uuid.uuid4())[:8],
                "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S UTC"),
                "bus_id": verifying_bus,
                "corridor": c_to_verify.get("road_name", "Chennai Transit Corridor"),
                "message": f"Case {c_to_verify.get('cluster_code', c_to_verify['id'])} AUTO-VERIFIED & CLOSED via Fleet Re-Pass (Gz=0.98g smooth, 0 defect).",
                "latency_ms": 32,
                "type": "AUTO_CLOSURE"
            })
            results["work_orders_updated"].append({
                "id": c_to_verify["id"],
                "code": c_to_verify["cluster_code"],
                "transition": "resolved -> verified_closed (Autonomous Fleet Re-pass)"
            })

    # 4. ADVANCE FLEET NODES TELEMETRY
    store.step_simulation()
    results["fleet_nodes_updated"] = len(store.fleet_nodes)

    return results

async def synthetic_generator_loop(interval_seconds: int = 300):
    print(f"[SYNTHETIC GENERATOR] Service active. Running every {interval_seconds} seconds ({interval_seconds / 60:.1f} mins)...")
    await asyncio.sleep(5.0)
    
    from app.services.simulation_controller import simulation_controller
    while True:
        try:
            if simulation_controller.is_synthetic_generation_active():
                print("[SYNTHETIC GENERATOR] Generating scheduled 5-min urban telemetry cycle...")
                summary = generate_synthetic_tick()
                
                try:
                    from app.api.websockets import manager
                    if manager.active_connections:
                        await manager.broadcast({
                            "type": "SYNTHETIC_CYCLE_TICK",
                            "summary": summary,
                            "metrics": store.get_metrics(),
                            "clusters": store.get_clusters(),
                            "incidents": store.get_incidents(),
                            "fleet": store.fleet_nodes,
                            "latest_log": store.audit_logs[0] if store.audit_logs else None
                        })
                except Exception as b_err:
                    print(f"[SYNTHETIC GENERATOR] Broadcast notice: {b_err}")

                print(f"[SYNTHETIC GENERATOR] Cycle completed: {len(summary['ingests_generated'])} ingests, {len(summary['incidents_generated'])} incidents, {len(summary['work_orders_updated'])} work orders updated.")
            else:
                # Simulation paused (e.g. during live demo of real detections)
                pass
        except Exception as e:
            print(f"[SYNTHETIC GENERATOR] Error during generation cycle: {e}")

        await asyncio.sleep(interval_seconds)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RoadSaarthi 5-Minute Synthetic Data Generator")
    parser.add_argument("--interval", type=int, default=300, help="Interval in seconds between generation runs (default: 300s = 5m)")
    parser.add_argument("--once", action="store_true", help="Run a single synthetic generation cycle and exit")
    args = parser.parse_args()

    if args.once:
        print("[SYNTHETIC GENERATOR] Running single generation cycle...")
        res = generate_synthetic_tick()
        print(f"Done! Generated: {len(res['ingests_generated'])} ingests, {len(res['incidents_generated'])} incidents, {len(res['work_orders_updated'])} work orders updated.")
        for ing in res['ingests_generated']:
            print(f"  - Ingest: {ing['defect_type']} by {ing['bus_id']} -> {ing['action']}")
        for inc in res['incidents_generated']:
            print(f"  - Incident: {inc['incident_type']} ({inc.get('plate_number', 'N/A')}) at {inc['road_name']}")
    else:
        print(f"[SYNTHETIC GENERATOR] Starting daemon with interval={args.interval}s...")
        asyncio.run(synthetic_generator_loop(interval_seconds=args.interval))
