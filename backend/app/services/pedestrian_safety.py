import math
from typing import List, Dict, Any
from app.models.schemas import SafeCorridorScore

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
