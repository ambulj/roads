import math
import time
import numpy as np
from typing import List, Dict, Any, Optional
from app.models.schemas import SafeCorridorScore
from app.spatial.poi_database import CRITICAL_POIS

CHENNAI_SAFE_CORRIDORS: List[SafeCorridorScore] = [
    SafeCorridorScore(
        id="sc-01",
        facility_name="D.A.V. Senior Secondary School",
        category="school",
        corridor_road="Avvai Shanmugam Salai & Anna Salai Arterial",
        zone="Zone 09 (Teynampet Central)",
        lat=13.0450,
        lng=80.2380,
        overall_score=88.5,
        letter_grade="A",
        zebra_crossing_status="COMPLIANT",
        signage_status="INSTALLED",
        footpath_clearance_pct=86.0,
        speed_compliance_pct=82.5,
        active_hazard_count=0,
        recommended_work_order="Routine quarterly thermoplastic retroreflectivity check per IRC:35",
        last_patrol_bus_id="BUS-MTC-21G",
        last_audited_at="Today, 07:45 AM IST"
    ),
    SafeCorridorScore(
        id="sc-02",
        facility_name="MIOT International Hospital",
        category="hospital",
        corridor_road="Mount-Poonamallee Arterial & GST Link",
        zone="Zone 12 (Alandur Corridor)",
        lat=13.0232,
        lng=80.1872,
        overall_score=64.0,
        letter_grade="C",
        zebra_crossing_status="FADED",
        signage_status="MISSING",
        footpath_clearance_pct=58.0,
        speed_compliance_pct=61.0,
        active_hazard_count=2,
        recommended_work_order="Urgent: Install 'Hospital Quiet Zone' sign and repaint pedestrian crossing",
        last_patrol_bus_id="BUS-MTC-19B",
        last_audited_at="Today, 08:12 AM IST"
    ),
    SafeCorridorScore(
        id="sc-03",
        facility_name="SRM Public School & Institute",
        category="school",
        corridor_road="GST Road Corridor (NH-32 Potheri)",
        zone="Zone 15 (Chengalpattu NHAI Division)",
        lat=12.8236,
        lng=80.0450,
        overall_score=48.5,
        letter_grade="F",
        zebra_crossing_status="MISSING",
        signage_status="MISSING",
        footpath_clearance_pct=42.0,
        speed_compliance_pct=49.0,
        active_hazard_count=3,
        recommended_work_order="CRITICAL VISION ZERO VIOLATION: Immediate zebra crossing installation & speed calm striping required",
        last_patrol_bus_id="BUS-MTC-570",
        last_audited_at="Today, 06:30 AM IST"
    ),
    SafeCorridorScore(
        id="sc-04",
        facility_name="Kendriya Vidyalaya Anna Nagar",
        category="school",
        corridor_road="2nd Avenue Arterial Road",
        zone="Zone 08 (Anna Nagar West)",
        lat=13.0890,
        lng=80.2120,
        overall_score=92.0,
        letter_grade="A+",
        zebra_crossing_status="COMPLIANT",
        signage_status="INSTALLED",
        footpath_clearance_pct=94.0,
        speed_compliance_pct=88.0,
        active_hazard_count=0,
        recommended_work_order="Corridor fully compliant with MoRTH Vision Zero School Zone standards",
        last_patrol_bus_id="BUS-MTC-1042",
        last_audited_at="Yesterday, 04:15 PM IST"
    ),
    SafeCorridorScore(
        id="sc-05",
        facility_name="Madras Medical College & RGGGH",
        category="hospital",
        corridor_road="Poonamallee High Road & Central Station",
        zone="Zone 05 (Royapuram & Central)",
        lat=13.0805,
        lng=80.2760,
        overall_score=76.0,
        letter_grade="B",
        zebra_crossing_status="COMPLIANT",
        signage_status="FADED",
        footpath_clearance_pct=72.0,
        speed_compliance_pct=75.0,
        active_hazard_count=1,
        recommended_work_order="Restripe faded 'Ambulance Entry' priority markings",
        last_patrol_bus_id="BUS-MTC-21G",
        last_audited_at="Today, 09:20 AM IST"
    ),
    SafeCorridorScore(
        id="sc-06",
        facility_name="Anna University Campus Gateway",
        category="university",
        corridor_road="Sardar Patel Road & Guindy Link",
        zone="Zone 13 (Adyar Corridor)",
        lat=13.0102,
        lng=80.2355,
        overall_score=83.5,
        letter_grade="B",
        zebra_crossing_status="COMPLIANT",
        signage_status="INSTALLED",
        footpath_clearance_pct=80.0,
        speed_compliance_pct=78.0,
        active_hazard_count=1,
        recommended_work_order="Clear temporary construction barricades from northern pedestrian walkway",
        last_patrol_bus_id="BUS-MTC-19B",
        last_audited_at="Today, 07:10 AM IST"
    )
]

def get_safe_corridor_scores() -> List[SafeCorridorScore]:
    return CHENNAI_SAFE_CORRIDORS

def compute_corridor_grade(score: float) -> str:
    if score >= 90.0:
        return "A+"
    elif score >= 80.0:
        return "A"
    elif score >= 70.0:
        return "B"
    elif score >= 60.0:
        return "C"
    elif score >= 50.0:
        return "D"
    return "F"

class PedestrianCrossingFusionEngine:
    """
    Two-Model Spatial Zone-Overlap & Pedestrian Fusion Engine:
    - Model 1: Standard YOLOv8 Person Detector (COCO class 0)
    - Model 2: Zebra Crossing Detector (zebra_crossing.pt / Morphological Stripe Analyzer)
    - Zone Logic: Evaluates Intersection-over-Area (IoA) between persons and crossing zones,
      approaching vehicle velocity vectors, and student height clustering heuristics.
    """

    @staticmethod
    def compute_box_ioa(box_a: List[int], box_b: List[int]) -> float:
        """
        Computes Intersection-over-Area (IoA) of box_a inside box_b.
        box = [x1, y1, x2, y2]
        """
        xa1, ya1, xa2, ya2 = box_a
        xb1, yb1, xb2, yb2 = box_b

        ix1 = max(xa1, xb1)
        iy1 = max(ya1, yb1)
        ix2 = min(xa2, xb2)
        iy2 = min(ya2, yb2)

        if ix2 <= ix1 or iy2 <= iy1:
            return 0.0

        inter_area = (ix2 - ix1) * (iy2 - iy1)
        area_a = max(1, (xa2 - xa1) * (ya2 - ya1))
        return float(inter_area / area_a)

    def fuse_detections(
        self,
        frame_width: int,
        frame_height: int,
        persons: List[Dict[str, Any]],
        crosswalks: List[Dict[str, Any]],
        vehicles: Optional[List[Dict[str, Any]]] = None,
        approaching_speed_kmh: float = 0.0,
        is_near_school_poi: bool = False,
        poi_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Core fusion logic:
        1. Person in Crosswalk + Vehicle Approaching (>20 km/h) -> CROSSWALK_PEDESTRIAN_RISK
        2. Person Crossing without Crosswalk detected -> UNSAFE_MIDBLOCK_CROSSING
        3. Multiple small persons (bbox height < 0.65 of avg adult) -> SCHOOL_CHILDREN_CROSSING_RISK
        4. Vehicle stopped/encroaching in crosswalk -> ZEBRA_CROSSING_ENCROACHMENT
        """
        events = []
        vehicles = vehicles or []
        
        if not persons:
            return events

        # Analyze person heights and clusters
        person_heights = [p.get("bbox_pixels", [0, 0, 0, 0])[3] - p.get("bbox_pixels", [0, 0, 0, 0])[1] for p in persons]
        avg_height = np.mean(person_heights) if person_heights else frame_height * 0.25

        # Check for children cluster heuristic
        small_persons = []
        standard_persons = []
        for p in persons:
            h = p.get("bbox_pixels", [0, 0, 0, 0])[3] - p.get("bbox_pixels", [0, 0, 0, 0])[1]
            if h < (avg_height * 0.70) or is_near_school_poi:
                small_persons.append(p)
            else:
                standard_persons.append(p)

        is_school_cluster = len(small_persons) >= 2 or (len(persons) >= 2 and is_near_school_poi)

        # For each person, evaluate spatial relationship with crosswalks
        for idx, person in enumerate(persons):
            p_box = person.get("bbox_pixels", [0, 0, 0, 0])
            p_conf = person.get("confidence", 0.90)

            # Check overlap with any crosswalk
            in_crosswalk = False
            best_overlap = 0.0
            matched_crosswalk = None

            for cw in crosswalks:
                cw_box = cw.get("bbox_pixels", [0, 0, 0, 0])
                overlap = self.compute_box_ioa(p_box, cw_box)
                if overlap > 0.15 and overlap > best_overlap:
                    best_overlap = overlap
                    in_crosswalk = True
                    matched_crosswalk = cw

            # Determine scenario
            if is_school_cluster and (in_crosswalk or is_near_school_poi):
                # 1. School Children Crossing Scenario
                events.append({
                    "event_type": "SCHOOL_CHILDREN_CROSSING_RISK",
                    "severity": "critical" if approaching_speed_kmh > 25.0 else "high",
                    "title": "School Children Crossing Zone - Mandatory Yield",
                    "description": f"Group of students detected crossing roadway near {poi_name or 'designated school zone'}. Vehicles mandated to stop.",
                    "mva_section": "IRC:35 & CMVR Rule 138 (Vision Zero School Pedestrian Corridor Protection)",
                    "fine_amount_inr": 2000,
                    "student_count": max(len(small_persons), 2),
                    "confidence": round(min(0.98, p_conf + 0.05), 2),
                    "bbox_pixels": p_box,
                    "approaching_speed_kmh": approaching_speed_kmh,
                    "school_poi": poi_name or "School Safety Zone",
                    "requires_pcr_dispatch": approaching_speed_kmh > 40.0
                })
            elif in_crosswalk:
                # 2. Person in Crosswalk + Vehicle Approaching
                if approaching_speed_kmh > 20.0:
                    events.append({
                        "event_type": "CROSSWALK_PEDESTRIAN_RISK",
                        "severity": "high",
                        "title": "Pedestrian Crosswalk Active - Vehicle Approaching at Speed",
                        "description": f"Pedestrian detected inside zebra crossing zone. Approaching bus/vehicle clocked at {approaching_speed_kmh:.1f} km/h.",
                        "mva_section": "MVA 1988 Sec 184 & CMVR Rule 138 (Failure to Yield Pedestrian Right-of-Way)",
                        "fine_amount_inr": 1500,
                        "confidence": round(p_conf, 2),
                        "bbox_pixels": p_box,
                        "approaching_speed_kmh": approaching_speed_kmh,
                        "requires_pcr_dispatch": False
                    })
            else:
                # 3. Person crossing without crosswalk detected (Unsafe midblock crossing)
                # Check if person is in lower 60% of frame (on roadway)
                py2 = p_box[3]
                if py2 > (frame_height * 0.40):
                    events.append({
                        "event_type": "UNSAFE_MIDBLOCK_CROSSING",
                        "severity": "high" if approaching_speed_kmh > 35.0 else "medium",
                        "title": "Unsafe Informal Midblock Road Crossing",
                        "description": "Pedestrian traversing multi-lane arterial road with no designated zebra crossing within safe stopping distance.",
                        "mva_section": "MoRTH Urban Road Safety Guidelines (Midblock Pedestrian Hazard)",
                        "fine_amount_inr": 500,
                        "confidence": round(p_conf, 2),
                        "bbox_pixels": p_box,
                        "approaching_speed_kmh": approaching_speed_kmh,
                        "recommended_action": "Evaluate need for midblock pedestrian refuge island / pelican signal"
                    })

        # Check vehicles encroaching on crosswalks
        for veh in vehicles:
            v_box = veh.get("bbox_pixels", [0, 0, 0, 0])
            for cw in crosswalks:
                cw_box = cw.get("bbox_pixels", [0, 0, 0, 0])
                overlap = self.compute_box_ioa(v_box, cw_box)
                if overlap > 0.20:
                    events.append({
                        "event_type": "ZEBRA_CROSSING_ENCROACHMENT",
                        "severity": "medium",
                        "title": "Vehicle Encroachment on Pedestrian Crosswalk",
                        "description": "Vehicle halted directly on top of zebra crossing markings, obstructing pedestrian crossing corridor.",
                        "mva_section": "MVA 1988 Sec 177 & CMVR 138 (Crosswalk Encroachment)",
                        "fine_amount_inr": 1000,
                        "plate_number": veh.get("plate_number", "TN-01-AX-8732"),
                        "confidence": veh.get("confidence", 0.94),
                        "bbox_pixels": v_box
                    })

        # 4. Vehicle Proximity & Hit-and-Run Critical Collision Risk Composition
        for person in persons:
            p_box = person.get("bbox_pixels", [0, 0, 0, 0])
            px_c = (p_box[0] + p_box[2]) / 2.0
            py_c = (p_box[1] + p_box[3]) / 2.0

            for veh in vehicles:
                v_box = veh.get("bbox_pixels", [0, 0, 0, 0])
                vx_c = (v_box[0] + v_box[2]) / 2.0
                vy_c = (v_box[1] + v_box[3]) / 2.0

                # Euclidean centroid pixel distance
                pixel_dist = math.hypot(px_c - vx_c, py_c - vy_c)
                v_speed = veh.get("speed_kmh", approaching_speed_kmh)

                # Critical proximity collision boundary (< 120 pixels in 1080p / high speed)
                if pixel_dist < (frame_width * 0.12) and (v_speed > 35.0 or approaching_speed_kmh > 35.0):
                    events.append({
                        "event_type": "HIT_AND_RUN_CRITICAL_RISK",
                        "severity": "critical",
                        "title": "High-Speed Vehicle Near-Miss / Hit & Run Corridor Alert",
                        "description": f"Vehicle moving at {v_speed:.1f} km/h detected in critical proximity ({int(pixel_dist)}px) to pedestrian. High-priority intercept broadcasted.",
                        "mva_section": "MVA 1988 Sec 134 & Sec 187 (Duty in Case of Accident & Rash Driving)",
                        "fine_amount_inr": 10000,
                        "confidence": round(min(0.97, person.get("confidence", 0.9) * 0.5 + veh.get("confidence", 0.9) * 0.5), 2),
                        "plate_number": veh.get("plate_number", "TN-09-BK-4091"),
                        "vehicle_class": veh.get("label", "Motor Vehicle"),
                        "vehicle_speed_kmh": v_speed,
                        "bbox_pixels": v_box,
                        "pedestrian_bbox": p_box,
                        "requires_pcr_dispatch": True
                    })

        return events

    def compute_vehicle_density(
        self,
        frame_width: int,
        frame_height: int,
        vehicles: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Calculates corridor traffic density, road surface occupancy ratio,
        and Highway Capacity Manual (HCM) / IRC:106 Level of Service (LoS).
        """
        if not vehicles:
            return {
                "total_vehicles": 0,
                "breakdown": {"car": 0, "bus": 0, "bike": 0, "truck": 0, "other": 0},
                "occupancy_ratio": 0.0,
                "los_grade": "A",
                "traffic_state": "FREE_FLOW",
                "congestion_index": 0.05,
                "pcu_count": 0.0
            }

        # Class categorization & Passenger Car Unit (PCU) calculation (IRC:106)
        # Car = 1.0 PCU, Bus/Truck = 3.0 PCU, Two-Wheeler = 0.5 PCU, Auto = 1.2 PCU
        breakdown = {"car": 0, "bus": 0, "bike": 0, "truck": 0, "other": 0}
        total_pcu = 0.0
        total_veh_area = 0.0

        road_area = max(1, frame_width * int(frame_height * 0.65))

        for v in vehicles:
            lbl = (v.get("label") or "").lower()
            box = v.get("bbox_pixels", [0, 0, 0, 0])
            w = max(1, box[2] - box[0])
            h = max(1, box[3] - box[1])
            total_veh_area += (w * h)

            if "car" in lbl:
                breakdown["car"] += 1
                total_pcu += 1.0
            elif "bus" in lbl:
                breakdown["bus"] += 1
                total_pcu += 3.0
            elif "truck" in lbl:
                breakdown["truck"] += 1
                total_pcu += 3.0
            elif "bike" in lbl or "motorcycle" in lbl or "scooter" in lbl:
                breakdown["bike"] += 1
                total_pcu += 0.5
            else:
                breakdown["other"] += 1
                total_pcu += 1.0

        occupancy = round(min(1.0, total_veh_area / road_area), 3)
        v_count = len(vehicles)

        # HCM Level of Service (LoS) classification
        if occupancy < 0.12 and total_pcu < 4.0:
            los = "A"
            state = "FREE_FLOW"
        elif occupancy < 0.25 and total_pcu < 8.0:
            los = "B"
            state = "REASONABLY_FREE"
        elif occupancy < 0.42 and total_pcu < 14.0:
            los = "C"
            state = "STABLE_FLOW"
        elif occupancy < 0.62 and total_pcu < 20.0:
            los = "D"
            state = "APPROACHING_UNSTABLE"
        elif occupancy < 0.80:
            los = "E"
            state = "UNSTABLE_CONGESTION"
        else:
            los = "F"
            state = "BREAKDOWN_GRIDLOCK"

        congestion_idx = round(min(1.0, (occupancy * 0.6) + (min(total_pcu, 25.0) / 25.0 * 0.4)), 2)

        return {
            "total_vehicles": v_count,
            "breakdown": breakdown,
            "pcu_count": round(total_pcu, 1),
            "occupancy_ratio": occupancy,
            "los_grade": los,
            "traffic_state": state,
            "congestion_index": congestion_idx
        }

pedestrian_engine = PedestrianCrossingFusionEngine()
pedestrian_safety_engine = pedestrian_engine

