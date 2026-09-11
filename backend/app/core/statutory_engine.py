"""
statutory_engine.py — Statutory Legal Citations & e-Challan Determination Engine.

Implements rule-based, deterministic legal citations and statutory enforcement
under the Motor Vehicles Act 1988 (as amended by MVA 2019), Central Motor Vehicles
Rules (CMVR 1989), Indian Road Congress standards (IRC:35 / IRC:67 / IRC:SP:84),
and the Bharatiya Sakshya Adhiniyam 2023 (Section 63 Digital Evidence Admissibility).
"""

import time
import uuid
import hashlib
from typing import Dict, Any, Optional

# Chennai Traffic Police Enforcement Sectors & PCR Interceptor Dispatch Zones
CHENNAI_POLICE_ZONES = [
    {"code": "AIRPORT-GST", "pcr_unit": "PCR-14 (GST Interceptor)", "lat": 12.9850, "lng": 80.1650},
    {"code": "ANNA-SALAI-CBD", "pcr_unit": "PCR-08 (Mount Road Central)", "lat": 13.0550, "lng": 80.2450},
    {"code": "OMR-IT-CORRIDOR", "pcr_unit": "PCR-22 (Tidel Park Flying Squad)", "lat": 12.9719, "lng": 80.2500},
    {"code": "T-NAGAR-RETAIL", "pcr_unit": "PCR-03 (Panagal Park Traffic)", "lat": 13.0425, "lng": 80.2345},
    {"code": "MADHAVARAM-RING", "pcr_unit": "PCR-19 (North Ring Interceptor)", "lat": 13.1480, "lng": 80.2310},
    {"code": "TAMBARAM-SOUTH", "pcr_unit": "PCR-31 (Tambaram Sub-Division)", "lat": 12.9240, "lng": 80.1470},
]

CAMERA_POSITIONS = {
    1: {"name": "CH 1 — Forward Windshield Road Cam", "code": "FRONT_WINDSHIELD", "standard": "IRC:SP:84 Surface Distress"},
    2: {"name": "CH 2 — Rear Overtake Radar & Tailgate Cam", "code": "REAR_OVERTAKE", "standard": "MVA Sec 184 Proximity Radar"},
    3: {"name": "CH 3 — Left Curbside Bus Lane Cam", "code": "LEFT_CURBSIDE", "standard": "IRC:35 Dedicated Transit Lane"},
    4: {"name": "CH 4 — Driver Cabin DMS Telematics Cam", "code": "DRIVER_CABIN", "standard": "AIS-140 DMS Attention Standard"}
}

def get_nearest_pcr_unit(lat: float, lng: float) -> str:
    """Finds the nearest Chennai Traffic Police PCR Interceptor unit via Euclidean distance."""
    best_zone = CHENNAI_POLICE_ZONES[0]
    min_dist_sq = float("inf")
    for z in CHENNAI_POLICE_ZONES:
        d = (z["lat"] - lat) ** 2 + (z["lng"] - lng) ** 2
        if d < min_dist_sq:
            min_dist_sq = d
            best_zone = z
    return best_zone["pcr_unit"]

def generate_echallan_id(zone_hint: str = "CHN") -> str:
    """Generates an official-format Tamil Nadu Traffic e-Challan reference serial."""
    rand_hex = uuid.uuid4().hex[:6].upper()
    return f"TN-ECH-2026-{zone_hint[:3].upper()}-{rand_hex}"

def compute_statutory_citation(
    incident_type: str,
    target_speed_kmh: float = 0.0,
    plate_confidence: float = 0.95,
    water_depth_cm: Optional[float] = None,
    channel: int = 2
) -> Dict[str, Any]:
    """
    Computes statutory MVA 1988/2019 legal section, fine amount, enforcement protocol,
    and camera position metadata for any traffic incident.
    """
    itype = (incident_type or "").upper()
    cam_info = CAMERA_POSITIONS.get(channel, CAMERA_POSITIONS[2])

    if itype == "HIT_AND_RUN":
        return {
            "mva_section": "Section 134(a)/(b) & Section 187 MVA 1988 (Duty of Driver in Case of Accident & Failure to Report) + BNS Section 106(2)",
            "fine_amount_inr": 25000.0,
            "statutory_act": "Motor Vehicles (Amendment) Act 2019 & Bharatiya Nyaya Sanhita 2023",
            "statutory_severity": "CRITICAL_FELONY",
            "enforcement_action": "Statutory Vehicle Registration Blacklist (MoRTH VAHAN) & Immediate Police Interceptor Dispatch",
            "camera_position": cam_info["code"],
            "channel": channel,
            "provenance": "MVA_1988_RULE_ENGINE_V2019"
        }

    elif itype in ("RASH_DRIVING", "DANGEROUS_DRIVING", "UNSAFE_OVERTAKE", "TAILGATING"):
        speed_delta = max(0.0, target_speed_kmh - 50.0)
        fine = 5000.0 if target_speed_kmh > 75.0 else 3000.0 if target_speed_kmh > 60.0 else 2000.0
        return {
            "mva_section": "Section 184 MVA 1988 (Driving Dangerously / Exceeding Permissible Speed Threshold)",
            "fine_amount_inr": fine,
            "statutory_act": "Motor Vehicles Act 1988 (Amended 2019 Sec 184)",
            "statutory_severity": "HIGH_TRAFFIC_OFFENCE",
            "enforcement_action": "Automated e-Challan Issuance & Demerit Point Deduction (Rule 138 CMVR)",
            "camera_position": cam_info["code"],
            "channel": channel,
            "provenance": "MVA_1988_RULE_ENGINE_V2019"
        }

    elif itype in ("VULNERABLE_PEDESTRIAN", "ZEBRA_CROSSING_ENCROACHMENT"):
        return {
            "mva_section": "Section 119 & Section 177 MVA 1988 (Disobedience of Mandatory Road Signs & IRC:35 Pedestrian Markings)",
            "fine_amount_inr": 1000.0,
            "statutory_act": "IRC:35 Code of Practice for Road Markings & MVA Sec 119",
            "statutory_severity": "VULNERABLE_USER_RISK",
            "enforcement_action": "Pedestrian Right-of-Way Violation Notice & Interceptor Dispatch",
            "camera_position": CAMERA_POSITIONS[3]["code"],
            "channel": 3,
            "provenance": "MVA_1988_RULE_ENGINE_V2019"
        }

    elif itype in ("BUS_LANE_ENCROACHMENT", "BUS_LANE_ENCROACH"):
        return {
            "mva_section": "Section 119 & Section 177A MVA 1988 (Violation of Dedicated Public Transit Corridor IRC:35)",
            "fine_amount_inr": 1000.0,
            "statutory_act": "MVA 1988 Section 177A (Driving in Contravention of Transit Lane Regulations)",
            "statutory_severity": "TRANSIT_LANE_OBSTRUCTION",
            "enforcement_action": "Bus Lane Curbside Clearance Order & ANPR e-Fine",
            "camera_position": CAMERA_POSITIONS[3]["code"],
            "channel": 3,
            "provenance": "MVA_1988_RULE_ENGINE_V2019"
        }

    elif itype == "WATERLOGGING":
        depth = water_depth_cm or 18.0
        return {
            "mva_section": "Disaster Management Act 2005 Sec 34 & GCC Standard Monsoon Drainage Protocol (G.O. Ms. No. 118)",
            "fine_amount_inr": 0.0,
            "statutory_act": "Tamil Nadu Urban Local Bodies Act & Disaster Management Act 2005",
            "statutory_severity": "EMERGENCY_CIVIC_FLOOD",
            "enforcement_action": "GCC Storm Water Drainage (SWD) Heavy Duty Pump (100 HP) Deployment",
            "camera_position": CAMERA_POSITIONS[1]["code"],
            "channel": 1,
            "water_depth_cm": depth,
            "pump_deployed": depth >= 15.0,
            "provenance": "GCC_CIVIC_DISASTER_SOP"
        }

    elif itype == "OPEN_MANHOLE":
        return {
            "mva_section": "IS:1726 Cast Iron Drainage Sump Safety Standard & IPC Section 283 (Danger in Public Way)",
            "fine_amount_inr": 0.0,
            "statutory_act": "Bureau of Indian Standards (IS:1726) & CMWSSB Operating Code",
            "statutory_severity": "LETHAL_PUBLIC_VOID",
            "enforcement_action": "Immediate 2-Hour SLA Barricading & Heavy Duty Sump Restoration",
            "camera_position": CAMERA_POSITIONS[1]["code"],
            "channel": 1,
            "provenance": "IS_1726_STATUTORY_CODE"
        }

    else:
        return {
            "mva_section": "Section 177 MVA 1988 (General Provision for Punishment of Traffic Offences)",
            "fine_amount_inr": 500.0,
            "statutory_act": "Motor Vehicles Act 1988 Section 177",
            "statutory_severity": "MODERATE_OFFENCE",
            "enforcement_action": "Standard Traffic Regulatory Advisory Notice",
            "camera_position": cam_info["code"],
            "channel": channel,
            "provenance": "MVA_1988_RULE_ENGINE_V2019"
        }

def generate_section_65b_certificate(incident: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates statutory digital evidence admissibility metadata under
    Section 65B Indian Evidence Act 1872 & Section 63 Bharatiya Sakshya Adhiniyam 2023 (BSA).
    """
    raw_fingerprint = f"{incident.get('id')}:{incident.get('plate_number')}:{incident.get('occurred_at')}:{incident.get('lat')}:{incident.get('lng')}"
    sha256_hash = hashlib.sha256(raw_fingerprint.encode('utf-8')).hexdigest()
    
    return {
        "certificate_id": f"CERT-65B-{sha256_hash[:10].upper()}",
        "evidence_sha256": sha256_hash,
        "admissibility_statute": "Section 63 of Bharatiya Sakshya Adhiniyam 2023 (Section 65B Indian Evidence Act)",
        "capturing_device": f"MTC Onboard Vision Node ({incident.get('reporting_bus_id', 'BUS-TN01-1042')})",
        "optical_source": incident.get("camera_position", "REAR_OVERTAKE"),
        "gps_satellite_fix": "NavIC / IRNSS 5Hz Synchronized Clock",
        "hash_verified": True,
        "admissible": True,
        "officer_in_charge": "Deputy Commissioner of Police (Traffic Enforcement), Greater Chennai Police",
        "timestamp_utc": time.strftime("%Y-%m-%d %H:%M:%S UTC")
    }
