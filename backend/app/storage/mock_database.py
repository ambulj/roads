import uuid
import random
import math
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from sqlalchemy.orm import Session
from app.models.schemas import DefectType, SeverityLevel
from app.spatial.poi_database import find_nearest_poi
from app.core.rpi_engine import calculate_rpi, get_severity_label, get_recommended_sla

INITIAL_SEED_FLEET = [
    {
        "id": "BUS-TN01-1042",
        "route_name": "GST Road, Tambaram (NH-32)",
        "route_code": "Route 21G: Tambaram ➔ Broadway via NH-32 GST Road",
        "vehicle_type": "MTC Public Transit Bus",
        "npu_hardware": "Rockchip RK3588 NPU (6 TOPS)",
        "camera_model": "Sony IMX335 1080p HDR",
        "is_online": True,
        "speed_kmh": 42.0,
        "lat": 12.9516,
        "lng": 80.1462,
        "heading": 45.0,
        "last_ping_at": "2m ago",
        "raw_ingests_count": 18,
        "edge_fps": 28.4,
        "imu_jerk_gz": 0.98,
    },
    {
        "id": "BUS-TN02-3891",
        "route_name": "Guindy Kathipara Grade Junction",
        "route_code": "Route 570: CMBT ➔ Siruseri IT Park via Kathipara & OMR",
        "vehicle_type": "MTC Public Transit Bus",
        "npu_hardware": "Raspberry Pi 4 + Coral TPU",
        "camera_model": "Sony IMX335 1080p HDR",
        "is_online": True,
        "speed_kmh": 36.5,
        "lat": 13.0067,
        "lng": 80.2030,
        "heading": 130.0,
        "last_ping_at": "4m ago",
        "raw_ingests_count": 15,
        "edge_fps": 24.0,
        "imu_jerk_gz": 1.02,
    },
    {
        "id": "MUNICIPAL-TRUCK-07",
        "route_name": "SRM Institute / Potheri Highway",
        "route_code": "Municipal Arterial PWD Maintenance Patrol 07",
        "vehicle_type": "Municipal Utility Carrier",
        "npu_hardware": "Rockchip RK3588 (6 TOPS)",
        "camera_model": "Sony IMX335 1080p HDR",
        "is_online": True,
        "speed_kmh": 48.0,
        "lat": 12.8231,
        "lng": 80.0442,
        "heading": 210.0,
        "last_ping_at": "6m ago",
        "raw_ingests_count": 14,
        "edge_fps": 29.1,
        "imu_jerk_gz": 0.95,
    },
    {
        "id": "PATROL-VAN-12",
        "route_name": "Anna Salai (Mount Road)",
        "route_code": "Traffic Enforcement Interceptor Patrol 12",
        "vehicle_type": "Traffic Police Patrol Van",
        "npu_hardware": "Jetson Orin Nano (40 TOPS)",
        "camera_model": "Sony IMX335 1080p HDR Dual",
        "is_online": True,
        "speed_kmh": 28.0,
        "lat": 13.0604,
        "lng": 80.2496,
        "heading": 35.0,
        "last_ping_at": "8m ago",
        "raw_ingests_count": 10,
        "edge_fps": 30.0,
        "imu_jerk_gz": 0.99,
    },
    {
        "id": "BUS-TN22-5501",
        "route_name": "Old Mahabalipuram Road (OMR)",
        "route_code": "Route 102: Broadway ➔ Kelambakkam via OMR IT Corridor",
        "vehicle_type": "MTC Express Transit",
        "npu_hardware": "Rockchip RK3588 (6 TOPS)",
        "camera_model": "Sony IMX335 1080p HDR",
        "is_online": True,
        "speed_kmh": 50.0,
        "lat": 12.9719,
        "lng": 80.2500,
        "heading": 180.0,
        "last_ping_at": "10m ago",
        "raw_ingests_count": 7,
        "edge_fps": 27.5,
        "imu_jerk_gz": 1.01,
    },
]

INITIAL_SEED_CLUSTERS = [
    {
        "id": "cl-0001",
        "cluster_code": "WO-0001",
        "defect_type": "D40",
        "defect_name": "Pothole",
        "severity_level": "critical",
        "rpi_score": 94.5,
        "pass_count": 7,
        "road_name": "GST Road, Tambaram (NH-32)",
        "classification": "National Highway (NH)",
        "nearest_poi": "MIOT Hospital Corridor",
        "poi_distance_m": 420.0,
        "assigned_agency": "L&T Highways Infra Ltd",
        "agency_phone": "+91 98401 22345",
        "sla_hours": 24,
        "status": "open",
        "lat": 12.9516,
        "lng": 80.1462,
        "created_at": "5 Sept, 05:04 am",
        "updated_at": "5 Sept, 05:04 am",
    },
    {
        "id": "cl-0002",
        "cluster_code": "WO-0002",
        "defect_type": "D40",
        "defect_name": "Pothole",
        "severity_level": "critical",
        "rpi_score": 89.2,
        "pass_count": 5,
        "road_name": "Guindy Kathipara Grade Junction",
        "classification": "Major Arterial",
        "nearest_poi": "Anna University",
        "poi_distance_m": 850.0,
        "assigned_agency": "NHAI Metro Division Chennai",
        "agency_phone": "+91 91760 55667",
        "sla_hours": 12,
        "status": "assigned",
        "lat": 13.0067,
        "lng": 80.2030,
        "created_at": "5 Sept, 04:04 am",
        "updated_at": "5 Sept, 04:15 am",
    },
    {
        "id": "cl-0004",
        "cluster_code": "WO-0004",
        "defect_type": "D40",
        "defect_name": "Pothole",
        "severity_level": "critical",
        "rpi_score": 88.0,
        "pass_count": 6,
        "road_name": "SRM Institute / Potheri Highway",
        "classification": "National Highway (NH)",
        "nearest_poi": "SRM Medical College",
        "poi_distance_m": 180.0,
        "assigned_agency": "Chettinad Road Infra Pvt Ltd",
        "agency_phone": "+91 97900 88990",
        "sla_hours": 24,
        "status": "open",
        "lat": 12.8231,
        "lng": 80.0442,
        "created_at": "5 Sept, 02:04 am",
        "updated_at": "5 Sept, 02:04 am",
    },
    {
        "id": "cl-0003",
        "cluster_code": "WO-0003",
        "defect_type": "D20",
        "defect_name": "Alligator Crack",
        "severity_level": "high",
        "rpi_score": 82.1,
        "pass_count": 4,
        "road_name": "Anna Salai (Mount Road)",
        "classification": "Major Arterial",
        "nearest_poi": "Apollo Hospital, Greams Rd",
        "poi_distance_m": 310.0,
        "assigned_agency": "GMR Urban Highways Ltd",
        "agency_phone": "+91 98840 77890",
        "sla_hours": 24,
        "status": "open",
        "lat": 13.0604,
        "lng": 80.2496,
        "created_at": "5 Sept, 03:04 am",
        "updated_at": "5 Sept, 03:04 am",
    },
    {
        "id": "cl-0007",
        "cluster_code": "WO-0007",
        "defect_type": "D40",
        "defect_name": "Pothole",
        "severity_level": "high",
        "rpi_score": 79.8,
        "pass_count": 3,
        "road_name": "Velachery Main Road",
        "classification": "Suburban Arterial",
        "nearest_poi": "Fortis Malar Hospital",
        "poi_distance_m": 1400.0,
        "assigned_agency": "Chennai Corp Zone 13 (Adyar)",
        "agency_phone": "+91 94451 90013",
        "sla_hours": 72,
        "status": "open",
        "lat": 12.9815,
        "lng": 80.2180,
        "created_at": "4 Sept, 11:04 pm",
        "updated_at": "4 Sept, 11:04 pm",
    },
    {
        "id": "cl-0008",
        "cluster_code": "WO-0008",
        "defect_type": "D20",
        "defect_name": "Alligator Crack",
        "severity_level": "high",
        "rpi_score": 76.2,
        "pass_count": 5,
        "road_name": "T. Nagar Usman Road Commercial",
        "classification": "Commercial Transit Corridor",
        "nearest_poi": "D.A.V. School Link",
        "poi_distance_m": 920.0,
        "assigned_agency": "Chennai Corp Zone 10 (T.Nagar)",
        "agency_phone": "+91 94451 90010",
        "sla_hours": 48,
        "status": "open",
        "lat": 13.0418,
        "lng": 80.2341,
        "created_at": "4 Sept, 10:04 pm",
        "updated_at": "4 Sept, 10:04 pm",
    },
    {
        "id": "cl-0005",
        "cluster_code": "WO-0005",
        "defect_type": "D10",
        "defect_name": "Transverse Crack",
        "severity_level": "high",
        "rpi_score": 74.5,
        "pass_count": 3,
        "road_name": "Old Mahabalipuram Road (OMR)",
        "classification": "State Highway (SH)",
        "nearest_poi": "IIT Madras Zone",
        "poi_distance_m": 1200.0,
        "assigned_agency": "Tamil Nadu Road Dev Corp (TNRDC)",
        "agency_phone": "+91 99400 33445",
        "sla_hours": 48,
        "status": "assigned",
        "lat": 12.9719,
        "lng": 80.2500,
        "created_at": "5 Sept, 01:04 am",
        "updated_at": "5 Sept, 01:30 am",
    },
    {
        "id": "cl-0006",
        "cluster_code": "WO-0006",
        "defect_type": "D00",
        "defect_name": "Surface Line Crack",
        "severity_level": "medium",
        "rpi_score": 68.4,
        "pass_count": 4,
        "road_name": "Poonamallee High Road",
        "classification": "Major Arterial",
        "nearest_poi": "Madras Medical College",
        "poi_distance_m": 650.0,
        "assigned_agency": "Tamil Nadu PWD Division 4",
        "agency_phone": "+91 94440 12890",
        "sla_hours": 48,
        "status": "resolved",
        "lat": 13.0827,
        "lng": 80.2707,
        "created_at": "4 Sept, 08:30 pm",
        "updated_at": "5 Sept, 06:00 am",
    },
    {
        "id": "cl-0009",
        "cluster_code": "WO-0009",
        "defect_type": "D00",
        "defect_name": "Surface Line Crack",
        "severity_level": "low",
        "rpi_score": 52.0,
        "pass_count": 2,
        "road_name": "Anna Nagar 2nd Avenue",
        "classification": "Major Arterial",
        "nearest_poi": "Kendriya Vidyalaya",
        "poi_distance_m": 1600.0,
        "assigned_agency": "Chennai Corp Zone 8 (Anna Nagar)",
        "agency_phone": "+91 94451 90008",
        "sla_hours": 72,
        "status": "resolved",
        "lat": 13.0878,
        "lng": 80.2140,
        "created_at": "4 Sept, 06:15 pm",
        "updated_at": "5 Sept, 05:30 am",
    }
]

class PersistentStore:
    def __init__(self):
        # Initialize DB and ensure tables and seed data exist
        from app.storage.database import init_db
        init_db()

        self.audit_logs: List[Dict[str, Any]] = [
            {
                "id": "log-1",
                "timestamp": "Just now",
                "bus_id": "BUS-TN01-1042",
                "corridor": "GST Road (NH-32)",
                "message": "Ingested GPS telemetry pass from MTC Bus #1042 on GST Road (NH-32) • 5Hz coordinate lock confirmed.",
                "latency_ms": 72,
                "type": "FLEET TELEMETRY"
            },
            {
                "id": "log-2",
                "timestamp": "1m ago",
                "bus_id": "BUS-TN02-3891",
                "corridor": "Kathipara Grade Junction",
                "message": "DBSCAN 15m cluster verified: Pothole confirmed with 5 fleet passes.",
                "latency_ms": 85,
                "type": "SPATIAL DEDUP"
            },
            {
                "id": "log-3",
                "timestamp": "2m ago",
                "bus_id": "PATROL-VAN-12",
                "corridor": "Anna Salai (Mount Road)",
                "message": "Hit-and-Run alert: Offender vehicle TN-09-CB-4412 tracking trail broadcasted to fleet.",
                "latency_ms": 68,
                "type": "INCIDENT ALERT"
            }
        ]

        self.arterial_corridors: List[Dict[str, Any]] = [
            {
                "corridor_name": "GST Road (NH-32)",
                "classification": "National Highway",
                "description": "National Highway corridor connecting airport & southern hubs",
                "clusters_count": 1,
                "raw_ingests": 7,
                "critical_d40_count": 1,
                "average_rpi": 94.5,
                "action_status": "PRIORITY DISPATCH",
            },
            {
                "corridor_name": "Kathipara Cloverleaf Junction",
                "classification": "Grade-Separated Interlink",
                "description": "Largest grade-separated interchange in Asia",
                "clusters_count": 1,
                "raw_ingests": 5,
                "critical_d40_count": 1,
                "average_rpi": 89.2,
                "action_status": "PRIORITY DISPATCH",
            },
            {
                "corridor_name": "SRM / Potheri Highway",
                "classification": "National Highway",
                "description": "High-density university and tech transit arterial",
                "clusters_count": 1,
                "raw_ingests": 6,
                "critical_d40_count": 1,
                "average_rpi": 88.0,
                "action_status": "PRIORITY DISPATCH",
            },
            {
                "corridor_name": "Anna Salai (Mount Road)",
                "classification": "Primary CBD Arterial",
                "description": "Primary arterial CBD commercial corridor",
                "clusters_count": 2,
                "raw_ingests": 6,
                "critical_d40_count": 0,
                "average_rpi": 67.0,
                "action_status": "NORMAL PATROL",
            },
            {
                "corridor_name": "T. Nagar Usman Road",
                "classification": "Commercial District",
                "description": "High-density commercial transit district",
                "clusters_count": 1,
                "raw_ingests": 5,
                "critical_d40_count": 0,
                "average_rpi": 76.2,
                "action_status": "NORMAL PATROL",
            },
            {
                "corridor_name": "Old Mahabalipuram Road (OMR)",
                "classification": "IT Expressway",
                "description": "Expressway IT Corridor connecting major tech parks",
                "clusters_count": 1,
                "raw_ingests": 3,
                "critical_d40_count": 0,
                "average_rpi": 74.5,
                "action_status": "NORMAL PATROL",
            },
            {
                "corridor_name": "Velachery Main Road",
                "classification": "Suburban Arterial",
                "description": "High-traffic southern suburban residential arterial",
                "clusters_count": 1,
                "raw_ingests": 3,
                "critical_d40_count": 0,
                "average_rpi": 79.8,
                "action_status": "NORMAL PATROL",
            },
            {
                "corridor_name": "Poonamallee High Road",
                "classification": "Western Radial",
                "description": "Western radial arterial artery towards industrial zones",
                "clusters_count": 1,
                "raw_ingests": 4,
                "critical_d40_count": 0,
                "average_rpi": 68.4,
                "action_status": "NORMAL PATROL",
            },
        ]

        self.contractor_penalties: List[Dict[str, Any]] = [
            {
                "id": "pen-01",
                "work_order_code": "WO-0001",
                "agency_name": "L&T Highways Infra Ltd",
                "road_name": "GST Road, Tambaram (NH-32)",
                "zone": "Zone 08 (Tambaram Corridor)",
                "original_closed_at": "12 Aug, 04:30 PM",
                "recurrence_detected_at": "24 Sept, 11:15 AM",
                "days_to_recurrence": 42,
                "recurrence_distance_meters": 1.8,
                "defect_type": "D40 (Pothole Cavity Recurrence)",
                "penalty_amount_inr": 25000,
                "legal_clause": "MoHUA IRC:SP:20 Clause 14.2 (Defect Liability Guarantee)",
                "bank_guarantee_deducted": True,
                "status": "DEBIT_CONFIRMED"
            },
            {
                "id": "pen-02",
                "work_order_code": "WO-0004",
                "agency_name": "GMR Urban Infra Corp",
                "road_name": "Anna Salai Arterial Link",
                "zone": "Zone 05 (Anna Salai Central)",
                "original_closed_at": "28 July, 02:00 PM",
                "recurrence_detected_at": "5 Oct, 09:40 AM",
                "days_to_recurrence": 68,
                "recurrence_distance_meters": 2.4,
                "defect_type": "D40 (Pothole Cavity Recurrence)",
                "penalty_amount_inr": 25000,
                "legal_clause": "MoHUA IRC:SP:20 Clause 14.2 (Defect Liability Guarantee)",
                "bank_guarantee_deducted": True,
                "status": "DEBIT_CONFIRMED"
            }
        ]

        self.dark_spot_segments: List[Dict[str, Any]] = [
            {
                "id": "dsp-01",
                "road_name": "Poonamallee High Road (Near Central Station link)",
                "zone": "Zone 05 (Royapuram & Central)",
                "length_meters": 120.0,
                "avg_lux": 2.1,
                "exposure_gain_score": 92.4,
                "start_lat": 13.0815,
                "start_lng": 80.2720,
                "end_lat": 13.0830,
                "end_lng": 80.2740,
                "risk_level": "CRITICAL_UNLIT",
                "nearby_poi": "Madras Medical College & Metro Sub-way",
                "transit_routes": ["Route 21G", "Route 570"],
                "identified_at": "Yesterday, 10:45 PM IST",
                "ward_engineer_notified": True
            },
            {
                "id": "dsp-02",
                "road_name": "Guindy Industrial Estate Outer Link",
                "zone": "Zone 13 (Adyar Corridor)",
                "length_meters": 85.0,
                "avg_lux": 3.4,
                "exposure_gain_score": 84.1,
                "start_lat": 13.0080,
                "start_lng": 80.2060,
                "end_lat": 13.0090,
                "end_lng": 80.2075,
                "risk_level": "HIGH_RISK",
                "nearby_poi": "Guindy Metro Interchange (Women Commuter Corridor)",
                "transit_routes": ["Route 19B", "Route 570"],
                "identified_at": "Yesterday, 11:12 PM IST",
                "ward_engineer_notified": True
            },
            {
                "id": "dsp-03",
                "road_name": "OMR Cyber Gateway Underpass Service Road",
                "zone": "Zone 11 (OMR IT Corridor)",
                "length_meters": 65.0,
                "avg_lux": 1.8,
                "exposure_gain_score": 95.0,
                "start_lat": 12.9780,
                "start_lng": 80.2450,
                "end_lat": 12.9790,
                "end_lng": 80.2460,
                "risk_level": "CRITICAL_UNLIT",
                "nearby_poi": "TIDEL Park Transit Stop",
                "transit_routes": ["Route 570"],
                "identified_at": "Yesterday, 09:30 PM IST",
                "ward_engineer_notified": True
            }
        ]

        self.open_manholes: List[Dict[str, Any]] = [
            {
                "id": "om-01",
                "road_name": "GST Road (NH-32) Chromepet Flyover Ramp",
                "zone": "Zone 08 (Tambaram Corridor)",
                "lat": 12.9516,
                "lng": 80.1462,
                "rim_diameter_mm": 600,
                "depth_drop_cm": 22.5,
                "is_standard_is1726": True,
                "emergency_level": "LEVEL_1_RED_ALERT",
                "sla_hours": 2,
                "jal_board_docket": "CMWSSB-EMERG-8921",
                "police_cones_dispatched": True,
                "detected_at": "22 mins ago (Bus #1042)",
                "status": "ACTIVE_EMERGENCY"
            },
            {
                "id": "om-02",
                "road_name": "Anna Salai (Mount Road) Nandanam Junction",
                "zone": "Zone 09 (Teynampet Central)",
                "lat": 13.0298,
                "lng": 80.2390,
                "rim_diameter_mm": 550,
                "depth_drop_cm": 18.0,
                "is_standard_is1726": True,
                "emergency_level": "LEVEL_1_RED_ALERT",
                "sla_hours": 2,
                "jal_board_docket": "CMWSSB-EMERG-8944",
                "police_cones_dispatched": True,
                "detected_at": "48 mins ago (Bus #2098)",
                "status": "ACTIVE_EMERGENCY"
            }
        ]

        self.submerged_potholes: List[Dict[str, Any]] = [
            {
                "id": "sph-01",
                "road_name": "Velachery Main Road (Near Vijayanagar Junction)",
                "zone": "Zone 13 (Velachery Basin)",
                "lat": 12.9790,
                "lng": 80.2185,
                "estimated_water_depth_mm": 95,
                "acoustic_spl_db": 89.2,
                "vertical_shock_gz": 1.84,
                "lane_blocked": "Middle Lane (Inward City)",
                "avoid_advisory_active": True,
                "last_detected_bus_id": "BUS-TN01-1042",
                "detected_at": "Today, 08:14 AM"
            },
            {
                "id": "sph-02",
                "road_name": "GST Road Sub-Surface Dip near Kathipara Grade Link",
                "zone": "Zone 12 (Guindy Corridor)",
                "lat": 13.0067,
                "lng": 80.2025,
                "estimated_water_depth_mm": 120,
                "acoustic_spl_db": 94.1,
                "vertical_shock_gz": 2.10,
                "lane_blocked": "Left Bus Bay Lane",
                "avoid_advisory_active": True,
                "last_detected_bus_id": "BUS-TN01-2098",
                "detected_at": "Today, 07:45 AM"
            }
        ]

        self.obscured_signs: List[Dict[str, Any]] = [
            {
                "id": "obs-01",
                "road_name": "Poonamallee High Road (Opposite St. John's Higher Secondary)",
                "zone": "Zone 07 (Ambattur Corridor)",
                "lat": 13.0820,
                "lng": 80.2100,
                "sign_type": "IRC:67 SCHOOL_AHEAD (Cautionary Triangular)",
                "obscuration_pct": 48.5,
                "obstruction_source": "OVERGROWN_TREE_BRANCH",
                "parks_dept_work_order": "GCC-PARKS-2026-441",
                "identified_at": "Yesterday, 04:30 PM",
                "status": "PRUNING_ORDERED"
            },
            {
                "id": "obs-02",
                "road_name": "Anna Salai Junction (Thousand Lights Crossing)",
                "zone": "Zone 09 (Teynampet Central)",
                "lat": 13.0580,
                "lng": 80.2520,
                "sign_type": "IRC:67 MANDATORY_STOP (Octagonal Red)",
                "obscuration_pct": 62.0,
                "obstruction_source": "POLITICAL_FLEX_BANNER",
                "parks_dept_work_order": "GCC-ENFORCEMENT-882",
                "identified_at": "Yesterday, 02:15 PM",
                "status": "PRUNING_ORDERED"
            }
        ]

        self.contractor_debarments: List[Dict[str, Any]] = [
            {
                "id": "deb-01",
                "agency_name": "Chennai Metro Roadways & Works",
                "legal_cin": "U45203TN2011PTC082341",
                "director_name": "R. Kalyanasundaram",
                "zone": "Zone 03 (Madhavaram & Ring Road)",
                "durability_score_pct": 68.4,
                "total_recurrence_penalties_inr": 120000,
                "sla_breach_count": 14,
                "debarment_status": "STATUTORY_BARRED",
                "debarment_order_no": "GCC/RD/2026/DB-084",
                "gem_portal_notified": True,
                "statutory_clause": "MoHUA Rule 151(iii) GFR 2017 & IRC:SP:20 Clause 14.2",
                "valid_until": "31 Dec 2027 (2-Year Bar)"
            },
            {
                "id": "deb-02",
                "agency_name": "URC Construction Pvt Ltd",
                "legal_cin": "U45201TN1995PTC031245",
                "director_name": "S. Vasanth Kumar",
                "zone": "Zone 11 (OMR IT Expressway)",
                "durability_score_pct": 84.5,
                "total_recurrence_penalties_inr": 45000,
                "sla_breach_count": 6,
                "debarment_status": "PROBATION",
                "debarment_order_no": "SHOW-CAUSE-SC-2026-11",
                "gem_portal_notified": False,
                "statutory_clause": "IRC:SP:20 Clause 14.2 Defect Audit Review",
                "valid_until": "30 Jun 2026 (Under Probation)"
            },
            {
                "id": "deb-03",
                "agency_name": "L&T Highways Infra Ltd",
                "legal_cin": "L45200TN1946PLC001426",
                "director_name": "K. Sundaram",
                "zone": "Zone 08 (Tambaram Corridor)",
                "durability_score_pct": 98.4,
                "total_recurrence_penalties_inr": 0,
                "sla_breach_count": 0,
                "debarment_status": "ELIGIBLE",
                "debarment_order_no": None,
                "gem_portal_notified": False,
                "statutory_clause": "MoHUA Grade A Certified Compliant",
                "valid_until": "Perpetual Grade A Priority"
            }
        ]

        self.asphalt_quality_audits: List[Dict[str, Any]] = [
            {
                "id": "aqc-01",
                "work_order_code": "WO-0001",
                "road_name": "GST Road, Tambaram (NH-32)",
                "agency_name": "L&T Highways Infra Ltd",
                "mix_type": "VG30_HOT_MIX",
                "lay_surface_temp_c": 138.5,
                "statutory_min_temp_c": 110.0,
                "is_temp_compliant": True,
                "geometric_milling_shape": "RECTANGULAR_IRC_SP20",
                "compaction_score_pct": 97.2,
                "qc_certification": "PASSED_MORTH_SEC_500",
                "audited_at": "Today, 08:30 AM"
            },
            {
                "id": "aqc-02",
                "work_order_code": "WO-0004",
                "road_name": "Anna Salai Arterial Link",
                "agency_name": "GMR Urban Infra Corp",
                "mix_type": "COLD_MIX_RS1",
                "lay_surface_temp_c": 28.0,
                "statutory_min_temp_c": 20.0,
                "is_temp_compliant": True,
                "geometric_milling_shape": "RECTANGULAR_IRC_SP20",
                "compaction_score_pct": 92.8,
                "qc_certification": "PASSED_MORTH_SEC_500",
                "audited_at": "Yesterday, 03:15 PM"
            },
            {
                "id": "aqc-03",
                "work_order_code": "WO-0008",
                "road_name": "Madhavaram Ring Road",
                "agency_name": "Chennai Metro Roadways & Works",
                "mix_type": "VG30_HOT_MIX",
                "lay_surface_temp_c": 89.0,
                "statutory_min_temp_c": 110.0,
                "is_temp_compliant": False,
                "geometric_milling_shape": "IRREGULAR_NON_COMPLIANT",
                "compaction_score_pct": 64.0,
                "qc_certification": "REJECTED_REPAVE_ORDERED",
                "audited_at": "2 days ago"
            }
        ]


        self.road_memory_corridors: List[Dict[str, Any]] = [
            {
                "id": "corridor-gst",
                "name": "Grand Southern Trunk Road (GST / NH-45)",
                "classification": "National Highway / Arterial Core",
                "length_km": 18.4,
                "health_score": 74,
                "first_monitored_date": "2025-11-14",
                "last_updated": "Just now (12m ago via MTC 1042)",
                "total_confirmations": 4290,
                "recurrence_rate_pct": 16.2,
                "repair_durability_score": 83.8,
                "monsoon_risk_index": "HIGH",
                "pothole_count": 14,
                "waterlog_count": 5,
                "crack_count": 22,
                "active_work_orders": 4,
                "nearby_vulnerable_zones": ["Tambaram Bus Depot Junction", "Chromepet Underpass", "Sanatorium Flyover"],
                "timeline": [
                    {
                        "id": "ev-1",
                        "date": "Today, 11:42 AM",
                        "type": "MULTI_BUS_CONFIRM",
                        "title": "Multi-Bus Cross-Verification (3+ Units)",
                        "description": "Buses BUS-TN01-1042, BUS-TN01-1088, and BUS-TN01-2015 confirmed persistent longitudinal cracking near Chromepet Bridge at 12.9518° N, 80.1412° E.",
                        "buses_involved": ["BUS-TN01-1042", "BUS-TN01-1088", "BUS-TN01-2015"],
                        "pass_count": 28
                    },
                    {
                        "id": "ev-2",
                        "date": "Yesterday, 04:15 PM",
                        "type": "WATERLOG",
                        "title": "Monsoon Depression Waterlogging Spike",
                        "description": "Surface water depth estimated > 120mm following localized thunderstorm. Sensor flagged elevated hydroplaning risk for high-speed corridor traffic.",
                        "severity": "critical",
                        "buses_involved": ["BUS-TN01-1042"]
                    },
                    {
                        "id": "ev-3",
                        "date": "3 Days Ago",
                        "type": "WORK_ORDER",
                        "title": "Automated PWD / NHAI Work Order #WO-GST-881 Generated",
                        "description": "Auto-triaged by RoadSaarthi AI to Tambaram Municipal Zone Maintenance Unit. Target SLA: 48h emergency patching.",
                        "severity": "high"
                    },
                    {
                        "id": "ev-4",
                        "date": "2 Weeks Ago",
                        "type": "REPAIR_DONE",
                        "title": "Cold-Mix Asphalt Patch Applied & Closed",
                        "description": "Field repair team completed mastic asphalt filling. Post-repair inspection pending continuous bus telemetry pass verification.",
                        "severity": "low"
                    },
                    {
                        "id": "ev-5",
                        "date": "3 Weeks Ago",
                        "type": "DETECTION",
                        "title": "Initial Edge Detection (YOLOv8-RoadDefect)",
                        "description": "Edge Dashcam on MTC Express route detected severe pothole cluster (depth 65mm, radius 40cm) at 48 km/h.",
                        "severity": "high",
                        "buses_involved": ["BUS-TN01-1042"]
                    }
                ]
            },
            {
                "id": "corridor-omr",
                "name": "Rajiv Gandhi IT Expressway (OMR / SH-49A)",
                "classification": "State Highway / Urban IT Expressway",
                "length_km": 21.0,
                "health_score": 86,
                "first_monitored_date": "2025-10-02",
                "last_updated": "28m ago via MTC 2015",
                "total_confirmations": 6810,
                "recurrence_rate_pct": 9.4,
                "repair_durability_score": 91.2,
                "monsoon_risk_index": "MEDIUM",
                "pothole_count": 6,
                "waterlog_count": 2,
                "crack_count": 11,
                "active_work_orders": 2,
                "nearby_vulnerable_zones": ["Tidel Park Underpass", "Thoraipakkam Toll Plaza", "Siruseri SIPCOT"],
                "timeline": [
                    {
                        "id": "omr-ev-1",
                        "date": "Today, 09:20 AM",
                        "type": "MULTI_BUS_CONFIRM",
                        "title": "Routine Surface Roughness Survey",
                        "description": "Continuous accelerometry (IRI estimated 2.3 m/km) indicates stable riding surface along Madhya Kailash to Perungudi stretch.",
                        "buses_involved": ["BUS-TN01-2015", "BUS-TN01-3044"],
                        "pass_count": 64
                    },
                    {
                        "id": "omr-ev-2",
                        "date": "5 Days Ago",
                        "type": "REPAIR_DONE",
                        "title": "Mastic Seal Coat Completed",
                        "description": "GCC engineering wing completed micro-surfacing on IT Corridor Service Lane following citizen and bus telemetric alerts.",
                        "severity": "low"
                    },
                    {
                        "id": "omr-ev-3",
                        "date": "10 Days Ago",
                        "type": "DETECTION",
                        "title": "Manhole Cover Depression Detected",
                        "description": "Edge camera detected 70mm drop around storm drainage manhole slab near Sholinganallur junction.",
                        "severity": "medium",
                        "buses_involved": ["BUS-TN01-2015"]
                    }
                ]
            },
            {
                "id": "corridor-kathipara",
                "name": "Kathipara Interchange & Inner Ring Road",
                "classification": "Multi-Level Grade Separator & Arterial",
                "length_km": 8.6,
                "health_score": 68,
                "first_monitored_date": "2025-09-18",
                "last_updated": "5m ago via MTC 1088",
                "total_confirmations": 8940,
                "recurrence_rate_pct": 23.5,
                "repair_durability_score": 76.5,
                "monsoon_risk_index": "HIGH",
                "pothole_count": 19,
                "waterlog_count": 8,
                "crack_count": 34,
                "active_work_orders": 6,
                "nearby_vulnerable_zones": ["Guindy Industrial Estate Link", "Airport Grade Descent", "Alandur Metro Slipway"],
                "timeline": [
                    {
                        "id": "kat-1",
                        "date": "Today, 01:10 PM",
                        "type": "RISK_SPIKE",
                        "title": "Expansion Joint Shear Stress Alert",
                        "description": "Repeated vertical accelerometer spike (>0.85g) detected across Flyover Ramp 3 expansion finger joint under heavy axle bus transit.",
                        "severity": "critical",
                        "buses_involved": ["BUS-TN01-1088", "BUS-TN01-1042"],
                        "pass_count": 52
                    },
                    {
                        "id": "kat-2",
                        "date": "2 Days Ago",
                        "type": "RECURRENCE",
                        "title": "Recurring Pothole Cluster Post-Rain",
                        "description": "Same location (#DEF-8831) previously patched on Nov 12 re-emerged due to water ingress beneath sub-base layer.",
                        "severity": "high",
                        "buses_involved": ["BUS-TN01-1088"]
                    }
                ]
            },
            {
                "id": "corridor-anna",
                "name": "Anna Salai (Mount Road - Central to Guindy)",
                "classification": "Metropolitan Primary Arterial",
                "length_km": 14.2,
                "health_score": 81,
                "first_monitored_date": "2025-08-10",
                "last_updated": "45m ago via MTC 3044",
                "total_confirmations": 11200,
                "recurrence_rate_pct": 12.1,
                "repair_durability_score": 87.9,
                "monsoon_risk_index": "MEDIUM",
                "pothole_count": 8,
                "waterlog_count": 3,
                "crack_count": 15,
                "active_work_orders": 3,
                "nearby_vulnerable_zones": ["Nandanam Signal", "Thousand Lights Metro", "Saidapet Bridge"],
                "timeline": [
                    {
                        "id": "anna-1",
                        "date": "Today, 10:05 AM",
                        "type": "MULTI_BUS_CONFIRM",
                        "title": "Bus Lane Thermoplastic Marking Integrity",
                        "description": "Bus camera optical analysis detected 82% retroreflectivity retention along Dedicated Bus Lane markings.",
                        "buses_involved": ["BUS-TN01-3044"],
                        "pass_count": 89
                    },
                    {
                        "id": "anna-2",
                        "date": "4 Days Ago",
                        "type": "REPAIR_DONE",
                        "title": "Utility Cut Reinstatement Verified",
                        "description": "Metro Water trenching reinstatement verified closed with continuous levelness compliance.",
                        "severity": "low"
                    }
                ]
            }
        ]

    def get_dark_spots(self) -> List[Dict[str, Any]]:
        db = self._get_db_session()
        try:
            from app.models.db_models import DBDarkSpot
            rows = db.query(DBDarkSpot).all()
            if rows:
                return [
                    {
                        "id": r.id,
                        "road_name": r.corridor_name,
                        "zone": "Zone 8 / Zone 11 Arterial",
                        "lat": r.lat,
                        "lng": r.lng,
                        "lux_reading": r.illuminance_lux,
                        "dark_spot_length_m": int(r.dark_length_meters),
                        "pedestrian_risk": r.pedestrian_risk,
                        "surrounding_poi": "Maduravoyal Transit Core",
                        "identified_at": r.detected_at,
                        "status": r.status,
                        "provenance": "NIGHT_PATROL_TELEMETRY"
                    }
                    for r in rows
                ]
            return self.dark_spot_segments
        except Exception:
            return self.dark_spot_segments
        finally:
            db.close()

    def get_contractor_penalties(self) -> List[Dict[str, Any]]:
        db = self._get_db_session()
        try:
            from app.models.db_models import DBContractorPenalty
            rows = db.query(DBContractorPenalty).all()
            if rows:
                return [
                    {
                        "id": r.id,
                        "contractor_name": r.contractor_name,
                        "zone": "Zone 12 (Tambaram) / NHAI",
                        "road_name": r.corridor_name,
                        "cluster_code": r.cluster_code,
                        "re_pothole_count": r.re_pothole_count,
                        "penalty_debit_inr": int(r.penalty_amount_inr),
                        "penalty_reason": f"Recurrent pothole after initial mastic repair ({r.statutory_clause})",
                        "statutory_clause": r.statutory_clause,
                        "issued_at": r.issued_at,
                        "status": r.status,
                        "provenance": r.provenance or "DERIVED_FROM_RECURRENT_DISTRESS"
                    }
                    for r in rows
                ]
            return self.contractor_penalties
        except Exception:
            return self.contractor_penalties
        finally:
            db.close()

    def get_open_manholes(self) -> List[Dict[str, Any]]:
        db = self._get_db_session()
        try:
            from app.models.db_models import DBOpenManholeAlert
            rows = db.query(DBOpenManholeAlert).all()
            if rows:
                return [
                    {
                        "id": r.id,
                        "road_name": r.location_name,
                        "zone": "Zone 10 (Kodambakkam)",
                        "lat": r.lat,
                        "lng": r.lng,
                        "void_diameter_cm": int(r.void_diameter_cm),
                        "depth_meters": r.depth_meters,
                        "sla_hours": 2,
                        "jal_board_docket": r.docket_number,
                        "police_cones_dispatched": r.is_barricaded,
                        "detected_at": r.detected_at,
                        "status": r.status,
                        "statutory_standard": r.statutory_standard
                    }
                    for r in rows
                ]
            return self.open_manholes
        except Exception:
            return self.open_manholes
        finally:
            db.close()

    def get_submerged_potholes(self) -> List[Dict[str, Any]]:
        return self.submerged_potholes

    def get_obscured_signs(self) -> List[Dict[str, Any]]:
        return self.obscured_signs

    def get_contractor_debarments(self) -> List[Dict[str, Any]]:
        db = self._get_db_session()
        try:
            from app.models.db_models import DBContractorDebarment
            rows = db.query(DBContractorDebarment).all()
            if rows:
                return [
                    {
                        "id": r.id,
                        "agency_name": r.contractor_name,
                        "legal_cin": "U45201TN2012PTC088219",
                        "director_name": "K. R. Natarajan",
                        "zone": "Greater Chennai Metropolitan",
                        "durability_score_pct": 34.2,
                        "total_recurrence_penalties_inr": 185000,
                        "sla_breach_count": 8,
                        "debarment_status": "STATUTORY_BARRED",
                        "debarment_order_no": r.gem_portal_reference,
                        "gem_portal_notified": True,
                        "statutory_clause": "MoHUA Rule 151(iii) GFR 2017 & IRC:SP:20",
                        "valid_until": "31 Dec 2026",
                        "provenance": "STATUTORY_GFR_151_DOCKET"
                    }
                    for r in rows
                ]
            return self.contractor_debarments
        except Exception:
            return self.contractor_debarments
        finally:
            db.close()

    def get_asphalt_quality_audits(self) -> List[Dict[str, Any]]:
        return self.asphalt_quality_audits


    def get_road_memory_corridors(self) -> List[Dict[str, Any]]:
        return self.road_memory_corridors


    def _get_db_session(self) -> Session:
        from app.storage.database import SessionLocal
        return SessionLocal()

    def get_clusters(self) -> List[Dict[str, Any]]:
        db = self._get_db_session()
        try:
            from app.models.db_models import DBDistressCluster
            rows = db.query(DBDistressCluster).order_by(DBDistressCluster.rpi_score.desc()).all()
            return [
                {
                    "id": r.id,
                    "cluster_code": r.cluster_code,
                    "defect_type": r.defect_type,
                    "defect_name": r.defect_name,
                    "severity_level": r.severity_level,
                    "rpi_score": r.rpi_score,
                    "pass_count": r.pass_count,
                    "road_name": r.road_name,
                    "classification": r.classification,
                    "nearest_poi": r.nearest_poi,
                    "poi_distance_m": r.poi_distance_m,
                    "assigned_agency": r.assigned_agency,
                    "agency_phone": r.agency_phone,
                    "sla_hours": r.sla_hours,
                    "status": r.status,
                    "lat": r.lat,
                    "lng": r.lng,
                    "before_image_url": getattr(r, "before_image_url", None),
                    "after_image_url": getattr(r, "after_image_url", None),
                    "field_notes": getattr(r, "field_notes", None),
                    "created_at": r.created_at,
                    "updated_at": r.updated_at,
                }
                for r in rows
            ]
        finally:
            db.close()

    def get_incidents(self) -> List[Dict[str, Any]]:
        db = self._get_db_session()
        try:
            from app.models.db_models import DBTrafficIncident
            rows = db.query(DBTrafficIncident).order_by(DBTrafficIncident.occurred_at.desc()).all()
            return [
                {
                    "id": r.id,
                    "reporting_bus_id": r.reporting_bus_id,
                    "incident_type": r.incident_type,
                    "plate_number": r.plate_number,
                    "plate_confidence": r.plate_confidence,
                    "vehicle_color": r.vehicle_color,
                    "vehicle_class": r.vehicle_class,
                    "target_speed_kmh": r.target_speed_kmh,
                    "is_intercepted": r.is_intercepted,
                    "intercepted_by_bus_id": r.intercepted_by_bus_id,
                    "snapshot_url": r.snapshot_url,
                    "road_name": r.road_name,
                    "lat": r.lat,
                    "lng": r.lng,
                    "occurred_at": r.occurred_at,
                    "status": r.status,
                    "fine_amount_inr": getattr(r, "fine_amount_inr", None),
                    "mva_section": getattr(r, "mva_section", None),
                    "echallan_issued": getattr(r, "echallan_issued", None),
                    "echallan_id": getattr(r, "echallan_id", None),
                    "water_depth_cm": getattr(r, "water_depth_cm", None),
                    "pump_deployed": getattr(r, "pump_deployed", None),
                    "pcr_unit_assigned": getattr(r, "pcr_unit_assigned", None),
                    "description": getattr(r, "description", None),
                }
                for r in rows
            ]
        finally:
            db.close()

    def get_fleet_nodes(self) -> List[Dict[str, Any]]:
        db = self._get_db_session()
        try:
            from app.models.db_models import DBFleetNode
            rows = db.query(DBFleetNode).all()
            return [
                {
                    "id": r.id,
                    "route_name": r.route_name,
                    "route_code": r.route_code,
                    "vehicle_type": r.vehicle_type,
                    "npu_hardware": r.npu_hardware,
                    "camera_model": r.camera_model,
                    "is_online": r.is_online,
                    "speed_kmh": r.speed_kmh,
                    "lat": r.lat,
                    "lng": r.lng,
                    "heading": r.heading,
                    "last_ping_at": r.last_ping_at,
                    "raw_ingests_count": r.raw_ingests_count,
                    "edge_fps": r.edge_fps,
                    "imu_jerk_gz": r.imu_jerk_gz,
                    "dvr_channels": getattr(r, "dvr_channels", 4) or 4,
                    "dvr_ip": getattr(r, "dvr_ip", None),
                }
                for r in rows
            ]
        finally:
            db.close()

    def upsert_fleet_node(self, node_data: Dict[str, Any]) -> Dict[str, Any]:
        db = self._get_db_session()
        try:
            from app.models.db_models import DBFleetNode
            bus_id = node_data.get("id")
            existing = db.query(DBFleetNode).filter(DBFleetNode.id == bus_id).first()
            if existing:
                for k, v in node_data.items():
                    if hasattr(existing, k) and v is not None:
                        setattr(existing, k, v)
                existing.is_online = True
            else:
                new_node = DBFleetNode(
                    id=bus_id,
                    route_name=node_data.get("route_name", "Live RTSP Patrolling Route"),
                    route_code=node_data.get("route_code", "LIVE-CAM"),
                    vehicle_type=node_data.get("vehicle_type", "MTC Volvo 8400 Low-Floor (Live Camera)"),
                    npu_hardware=node_data.get("npu_hardware", "Zero-Hardware RTSP Ingest"),
                    camera_model=node_data.get("camera_model", "Real RTSP / IP Camera"),
                    is_online=True,
                    speed_kmh=node_data.get("speed_kmh", 34.5),
                    lat=node_data.get("lat", 12.9516),
                    lng=node_data.get("lng", 80.1462),
                    heading=node_data.get("heading", 45.0),
                    last_ping_at=datetime.utcnow().isoformat(),
                    raw_ingests_count=node_data.get("raw_ingests_count", 12),
                    edge_fps=node_data.get("edge_fps", 30.0),
                    imu_jerk_gz=node_data.get("imu_jerk_gz", 0.98),
                    dvr_channels=node_data.get("dvr_channels", 4),
                    dvr_ip=node_data.get("dvr_ip", None),
                )
                db.add(new_node)
            db.commit()
            return {"success": True, "bus_id": bus_id}
        finally:
            db.close()

    def delete_fleet_node(self, bus_id: str) -> bool:
        db = self._get_db_session()
        try:
            from app.models.db_models import DBFleetNode
            node = db.query(DBFleetNode).filter(
                (DBFleetNode.id == bus_id) | 
                (DBFleetNode.id == bus_id.lower()) | 
                (DBFleetNode.id == bus_id.upper())
            ).first()
            if node:
                db.delete(node)
                db.commit()
                return True
            return False
        finally:
            db.close()

    @property
    def fleet_nodes(self) -> List[Dict[str, Any]]:
        return self.get_fleet_nodes()

    @property
    def clusters(self) -> List[Dict[str, Any]]:
        return self.get_clusters()

    def get_metrics(self) -> Dict[str, Any]:
        db = self._get_db_session()
        try:
            from app.models.db_models import DBDistressCluster, DBRawIngest, DBFleetNode, DBTrafficIncident
            clusters_count = db.query(DBDistressCluster).count()
            raw_count = max(64, db.query(DBRawIngest).count() + 64)
            active_buses = db.query(DBFleetNode).filter(DBFleetNode.is_online == True).count()
            active_incidents = db.query(DBTrafficIncident).filter(DBTrafficIncident.status == "ACTIVE_ALERT").count()
            critical_hazards = db.query(DBDistressCluster).filter(DBDistressCluster.severity_level == "critical").count()

            clusters = db.query(DBDistressCluster).all()
            avg_rpi = round(sum(c.rpi_score for c in clusters) / len(clusters), 1) if clusters else 0.0
            dedup_ratio = round((1.0 - (clusters_count / max(1, raw_count))) * 100, 1)

            return {
                "total_ingests": raw_count,
                "dbscan_clusters": clusters_count,
                "critical_hazards": critical_hazards,
                "active_fleet_nodes": active_buses,
                "active_incidents": active_incidents,
                "deduplication_ratio": dedup_ratio,
                "avg_priority_score": avg_rpi,
                "ingest_sparkline": [32, 45, 48, 52, 58, 61, raw_count],
                "cluster_sparkline": [6, 7, 7, 8, 8, 9, clusters_count],
            }
        finally:
            db.close()

    def update_cluster_status(
        self, 
        cluster_id: str, 
        new_status: str,
        before_image_url: Optional[str] = None,
        after_image_url: Optional[str] = None,
        field_notes: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        db = self._get_db_session()
        try:
            from app.models.db_models import DBDistressCluster
            now_str = datetime.now(timezone.utc).strftime("%d %b, %I:%M %p")
            cluster = db.query(DBDistressCluster).filter(
                (DBDistressCluster.id == cluster_id) | (DBDistressCluster.cluster_code == cluster_id)
            ).first()
            if cluster:
                cluster.status = new_status
                if before_image_url is not None:
                    cluster.before_image_url = before_image_url
                if after_image_url is not None:
                    cluster.after_image_url = after_image_url
                if field_notes is not None:
                    cluster.field_notes = field_notes
                cluster.updated_at = now_str
                db.commit()
                return {
                    "id": cluster.id,
                    "cluster_code": cluster.cluster_code,
                    "status": cluster.status,
                    "before_image_url": cluster.before_image_url,
                    "after_image_url": cluster.after_image_url,
                    "field_notes": cluster.field_notes,
                    "updated_at": cluster.updated_at
                }
            else:
                # Upsert record if not previously in persistent storage (e.g. newly generated or drill)
                code = cluster_id if cluster_id.startswith("WO-") else f"WO-{cluster_id[-4:].upper()}"
                new_cluster = DBDistressCluster(
                    id=cluster_id,
                    cluster_code=code,
                    defect_type="D40",
                    defect_name="Pothole",
                    severity_level="high",
                    rpi_score=85.0,
                    pass_count=2,
                    road_name="GST Road, Tambaram (NH-32)",
                    classification="National Highway (NH)",
                    nearest_poi="MIOT Hospital Corridor",
                    poi_distance_m=350.0,
                    assigned_agency="L&T Highways Infra Ltd",
                    agency_phone="+91 98401 22345",
                    sla_hours=24,
                    status=new_status,
                    lat=12.9516,
                    lng=80.1462,
                    before_image_url=before_image_url or "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7",
                    after_image_url=after_image_url,
                    field_notes=field_notes,
                    created_at=now_str,
                    updated_at=now_str
                )
                db.add(new_cluster)
                db.commit()
                return {
                    "id": new_cluster.id,
                    "cluster_code": new_cluster.cluster_code,
                    "status": new_cluster.status,
                    "before_image_url": new_cluster.before_image_url,
                    "after_image_url": new_cluster.after_image_url,
                    "field_notes": new_cluster.field_notes,
                    "updated_at": new_cluster.updated_at
                }
        finally:
            db.close()

    def update_incident_status(self, incident_id: str, new_status: str, is_intercepted: Optional[bool] = None, intercepted_by: Optional[str] = None) -> Optional[Dict[str, Any]]:
        db = self._get_db_session()
        try:
            from app.models.db_models import DBTrafficIncident
            now_str = datetime.now(timezone.utc).strftime("%d %b, %I:%M %p")
            inc = db.query(DBTrafficIncident).filter(DBTrafficIncident.id == incident_id).first()
            if inc:
                inc.status = new_status
                if is_intercepted is not None:
                    inc.is_intercepted = is_intercepted
                elif new_status == "INTERCEPTED":
                    inc.is_intercepted = True
                if intercepted_by is not None:
                    inc.intercepted_by_bus_id = intercepted_by
                if new_status == "PUMP_DISPATCHED":
                    inc.pump_deployed = True
                if new_status == "ECHALLAN_ISSUED":
                    inc.echallan_issued = True
                    if not inc.echallan_id:
                        inc.echallan_id = f"ECH-2026-{uuid.uuid4().hex[:6].upper()}"
                db.commit()
                return {
                    "id": inc.id,
                    "status": inc.status,
                    "is_intercepted": inc.is_intercepted,
                    "intercepted_by_bus_id": inc.intercepted_by_bus_id,
                    "echallan_id": getattr(inc, "echallan_id", None),
                    "pump_deployed": getattr(inc, "pump_deployed", None)
                }
            else:
                new_inc = DBTrafficIncident(
                    id=incident_id,
                    reporting_bus_id="BUS-TN01-1042",
                    incident_type="HIT_AND_RUN",
                    plate_number="TN09CA1234",
                    plate_confidence=0.96,
                    road_name="GST Road, Tambaram",
                    lat=12.9516,
                    lng=80.1462,
                    occurred_at=now_str,
                    status=new_status,
                    is_intercepted=bool(is_intercepted) or (new_status == "INTERCEPTED"),
                    intercepted_by_bus_id=intercepted_by
                )
                db.add(new_inc)
                db.commit()
                return {
                    "id": new_inc.id,
                    "status": new_inc.status,
                    "is_intercepted": new_inc.is_intercepted,
                    "intercepted_by_bus_id": new_inc.intercepted_by_bus_id
                }
        finally:
            db.close()

    def add_incident(self, incident_data: Dict[str, Any]) -> Dict[str, Any]:
        """Saves a traffic incident (Hit-and-run, rash driving, pedestrian risk) to persistent DB."""
        db = self._get_db_session()
        try:
            from app.models.db_models import DBTrafficIncident
            inc_id = f"inc-{uuid.uuid4().hex[:6]}"
            road_name = incident_data.get("road_name") or find_nearest_poi(incident_data["lat"], incident_data["lng"])[0]
            
            new_inc = DBTrafficIncident(
                id=inc_id,
                reporting_bus_id=incident_data.get("reporting_bus_id", "MOBILE-DASHCAM-01"),
                incident_type=incident_data["incident_type"],
                plate_number=incident_data.get("plate_number"),
                plate_confidence=incident_data.get("plate_confidence", 0.95),
                vehicle_color=incident_data.get("vehicle_color"),
                vehicle_class=incident_data.get("vehicle_class"),
                target_speed_kmh=incident_data.get("target_speed_kmh", 0.0),
                is_intercepted=False,
                intercepted_by_bus_id=None,
                snapshot_url=incident_data.get("snapshot_url"),
                road_name=road_name,
                lat=incident_data["lat"],
                lng=incident_data["lng"],
                occurred_at=datetime.now(timezone.utc).strftime("%d %b, %I:%M %p"),
                status="ACTIVE_ALERT",
                fine_amount_inr=incident_data.get("fine_amount_inr"),
                mva_section=incident_data.get("mva_section"),
                echallan_issued=incident_data.get("echallan_issued"),
                echallan_id=incident_data.get("echallan_id"),
                water_depth_cm=incident_data.get("water_depth_cm"),
                pump_deployed=incident_data.get("pump_deployed"),
                pcr_unit_assigned=incident_data.get("pcr_unit_assigned"),
                description=incident_data.get("description"),
            )
            db.add(new_inc)
            db.commit()

            # Add to perception audit log
            self.audit_logs.insert(0, {
                "id": f"log-{uuid.uuid4().hex[:6]}",
                "timestamp": "Just now",
                "bus_id": new_inc.reporting_bus_id,
                "corridor": new_inc.road_name,
                "message": f"🚨 {new_inc.incident_type} Incident Logged: {new_inc.plate_number or new_inc.vehicle_class or new_inc.road_name} at [{new_inc.lat:.4f}, {new_inc.lng:.4f}]",
                "latency_ms": random.randint(55, 80),
                "type": "INCIDENT ALERT"
            })

            return {
                "id": new_inc.id,
                "reporting_bus_id": new_inc.reporting_bus_id,
                "incident_type": new_inc.incident_type,
                "plate_number": new_inc.plate_number,
                "plate_confidence": new_inc.plate_confidence,
                "vehicle_color": new_inc.vehicle_color,
                "vehicle_class": new_inc.vehicle_class,
                "target_speed_kmh": new_inc.target_speed_kmh,
                "is_intercepted": new_inc.is_intercepted,
                "road_name": new_inc.road_name,
                "lat": new_inc.lat,
                "lng": new_inc.lng,
                "occurred_at": new_inc.occurred_at,
                "status": new_inc.status,
                "fine_amount_inr": new_inc.fine_amount_inr,
                "mva_section": new_inc.mva_section,
                "echallan_issued": new_inc.echallan_issued,
                "echallan_id": new_inc.echallan_id,
                "water_depth_cm": new_inc.water_depth_cm,
                "pump_deployed": new_inc.pump_deployed,
                "pcr_unit_assigned": new_inc.pcr_unit_assigned,
                "description": new_inc.description,
            }
        finally:
            db.close()

    def add_ingest(self, ingest: Dict[str, Any]) -> Dict[str, Any]:
        """Saves telemetry ping to DB and executes DBSCAN 15m clustering merge persistently."""
        db = self._get_db_session()
        try:
            from app.models.db_models import DBDistressCluster, DBRawIngest
            from app.spatial.dbscan import deduplicate_ingest_into_clusters

            lat = ingest.get("lat", 13.0067)
            lng = ingest.get("lng", 80.2030)
            defect_type = ingest.get("defect_type", "D40")
            bus_id = ingest.get("bus_id", "MOBILE-DASHCAM")

            # 1. Record raw ingest
            raw = DBRawIngest(
                id=f"raw-{uuid.uuid4().hex[:8]}",
                bus_id=bus_id,
                cluster_id=None,
                defect_type=defect_type,
                confidence=ingest.get("confidence", 0.92),
                speed_kmh=ingest.get("speed_kmh", 40.0),
                vertical_g_force=ingest.get("vertical_g_force", 1.0),
                lat=lat,
                lng=lng,
                captured_at=datetime.now(timezone.utc).isoformat()
            )
            db.add(raw)

            # 2. Query existing clusters for 15m deduplication
            existing = db.query(DBDistressCluster).all()
            cluster_dicts = [
                {"id": c.id, "cluster_code": c.cluster_code, "lat": c.lat, "lng": c.lng, "defect_type": c.defect_type, "pass_count": c.pass_count, "classification": c.classification, "poi_distance_m": c.poi_distance_m}
                for c in existing
            ]

            dedup_result = deduplicate_ingest_into_clusters(
                {"lat": lat, "lng": lng, "defect_type": defect_type},
                cluster_dicts,
                eps_meters=15.0
            )

            nearest_poi, poi_dist = find_nearest_poi(lat, lng)

            if dedup_result["is_merged"]:
                target_dict = dedup_result["target_cluster"]
                cluster_row = db.query(DBDistressCluster).filter(DBDistressCluster.id == target_dict["id"]).first()
                if cluster_row:
                    cluster_row.pass_count += 1
                    raw.cluster_id = cluster_row.id
                    cluster_row.rpi_score = calculate_rpi(
                        DefectType(cluster_row.defect_type),
                        cluster_row.pass_count,
                        cluster_row.classification,
                        cluster_row.poi_distance_m
                    )
                    cluster_row.severity_level = get_severity_label(cluster_row.rpi_score)
                    cluster_row.updated_at = datetime.now(timezone.utc).strftime("%d %b, %I:%M %p")
                    db.commit()

                    affected_code = cluster_row.cluster_code
                    passes = cluster_row.pass_count
                    action_desc = f"Merged into cluster {affected_code} ({passes} passes)"
                    affected_cluster_id = cluster_row.id
            else:
                # Create new cluster in persistent DB
                total_clusters = db.query(DBDistressCluster).count()
                new_code = f"WO-{total_clusters + 1:04d}"
                rpi = calculate_rpi(DefectType(defect_type), 1, "Major Arterial", poi_dist)
                sev = get_severity_label(rpi)
                sla = get_recommended_sla(sev)
                new_id = f"cl-{uuid.uuid4().hex[:6]}"

                new_cluster = DBDistressCluster(
                    id=new_id,
                    cluster_code=new_code,
                    defect_type=defect_type,
                    defect_name='Pothole' if defect_type == 'D40' else ('Alligator Crack' if defect_type == 'D20' else 'Surface Crack'),
                    severity_level=sev,
                    rpi_score=rpi,
                    pass_count=1,
                    road_name="Mobile Ingest Corridor",
                    classification="Major Arterial",
                    nearest_poi=nearest_poi,
                    poi_distance_m=poi_dist,
                    assigned_agency="Chennai Corporation PWD Emergency",
                    agency_phone="+91 94451 90000",
                    sla_hours=sla,
                    status="open",
                    lat=lat,
                    lng=lng,
                    created_at=datetime.now(timezone.utc).strftime("%d %b, %I:%M %p"),
                    updated_at=datetime.now(timezone.utc).strftime("%d %b, %I:%M %p")
                )
                db.add(new_cluster)
                raw.cluster_id = new_id
                db.commit()

                affected_code = new_code
                action_desc = f"Created new maintenance cluster {new_code}"
                affected_cluster_id = new_id

            # Prepend to perception log
            self.audit_logs.insert(0, {
                "id": f"log-{uuid.uuid4().hex[:6]}",
                "timestamp": "Just now",
                "bus_id": bus_id,
                "corridor": "Mobile Ingest Corridor",
                "message": f"Mobile Telemetry Ingested: {defect_type} at [{lat:.4f}, {lng:.4f}] • {action_desc}",
                "latency_ms": random.randint(65, 95),
                "type": "MOBILE INGEST"
            })

            return {
                "status": "ingested",
                "cluster_code": affected_code,
                "cluster_id": affected_cluster_id,
                "action": action_desc,
                "total_ingests": db.query(DBRawIngest).count() + 64
            }
        finally:
            db.close()

    def trigger_deduplication(self) -> Dict[str, Any]:
        metrics = self.get_metrics()
        self.audit_logs.insert(0, {
            "id": f"log-{uuid.uuid4().hex[:6]}",
            "timestamp": "Just now",
            "bus_id": "CENTRAL-BROKER",
            "corridor": "Greater Chennai Metropolitan Area",
            "message": f"Manual 15-meter DBSCAN executed: {metrics['total_ingests']} ingests clustered into {metrics['dbscan_clusters']} ground truth nodes in PostgreSQL DB.",
            "latency_ms": 38,
            "type": "SPATIAL DEDUP"
        })
        return {
            "status": "success",
            "clusters_count": metrics['dbscan_clusters'],
            "raw_ingests": metrics['total_ingests'],
            "eps_meters": 15.0,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    # Chennai Transit Corridor Waypoints for Realistic Telemetry Tracking
    BUS_CORRIDOR_WAYPOINTS = {
        "BUS-TN01-1042": [
            (12.9250, 80.1170),  # Tambaram Sanatorium
            (12.9516, 80.1462),  # Chromepet
            (12.9680, 80.1580),  # Pallavaram
            (12.9880, 80.1750),  # Airport Meenambakkam
            (13.0067, 80.2030),  # Guindy Kathipara
        ],
        "BUS-TN02-3891": [
            (13.0080, 80.2520),  # Madhya Kailash
            (12.9890, 80.2480),  # Tidel Park
            (12.9650, 80.2430),  # Perungudi
            (12.9380, 80.2360),  # Thoraipakkam
            (12.9010, 80.2280),  # Sholinganallur
        ],
        "BUS-TN01-2098": [
            (13.0827, 80.2707),  # Chennai Central
            (13.0640, 80.2630),  # LIC Building
            (13.0580, 80.2520),  # Thousand Lights
            (13.0410, 80.2450),  # DMS Teynampet
            (13.0210, 80.2250),  # Saidapet
        ],
        "BUS-TN03-4410": [
            (13.0020, 80.2150),  # Guindy Race Course
            (12.9880, 80.2200),  # Velachery Checkpost
            (12.9780, 80.2180),  # Vijayanagar Terminus
            (12.9720, 80.2310),  # Taramani 100ft Road
        ],
        "BUS-TN02-5501": [
            (13.0067, 80.2030),  # Kathipara Junction
            (13.0200, 80.2070),  # Ekkattuthangal
            (13.0350, 80.2110),  # Ashok Nagar
            (13.0510, 80.2120),  # Vadapalani
            (13.0690, 80.1980),  # Koyambedu
        ],
    }

    _bus_progress: Dict[str, float] = {}
    _bus_forward: Dict[str, bool] = {}

    def step_simulation(self):
        """Advances fleet buses smoothly along defined corridor polylines with realistic speed and bearing angles."""
        db = self._get_db_session()
        try:
            from app.models.db_models import DBFleetNode
            buses = db.query(DBFleetNode).all()
            
            for bus in buses:
                waypoints = self.BUS_CORRIDOR_WAYPOINTS.get(bus.id)
                if not waypoints or len(waypoints) < 2:
                    continue

                if bus.id not in self._bus_progress:
                    self._bus_progress[bus.id] = random.uniform(0.0, 0.8)
                    self._bus_forward[bus.id] = True

                # Step progress along polyline (0.015 - 0.025 per step)
                is_fwd = self._bus_forward[bus.id]
                delta_prog = random.uniform(0.012, 0.022)
                curr_prog = self._bus_progress[bus.id] + (delta_prog if is_fwd else -delta_prog)

                if curr_prog >= 1.0:
                    curr_prog = 1.0
                    self._bus_forward[bus.id] = False
                elif curr_prog <= 0.0:
                    curr_prog = 0.0
                    self._bus_forward[bus.id] = True

                self._bus_progress[bus.id] = curr_prog

                # Interpolate between waypoint segments
                num_segments = len(waypoints) - 1
                segment_float = curr_prog * num_segments
                segment_idx = min(int(segment_float), num_segments - 1)
                segment_t = segment_float - segment_idx

                p1 = waypoints[segment_idx]
                p2 = waypoints[segment_idx + 1]

                new_lat = p1[0] + (p2[0] - p1[0]) * segment_t
                new_lng = p1[1] + (p2[1] - p1[1]) * segment_t

                # Calculate true heading angle in degrees (0-360)
                d_lat = p2[0] - p1[0] if is_fwd else p1[0] - p2[0]
                d_lng = p2[1] - p1[1] if is_fwd else p1[1] - p2[1]
                rad = math.atan2(d_lng * math.cos(math.radians(new_lat)), d_lat)
                deg_heading = (math.degrees(rad) + 360.0) % 360.0

                bus.lat = round(new_lat, 5)
                bus.lng = round(new_lng, 5)
                bus.heading = round(deg_heading, 1)
                bus.speed_kmh = round(random.uniform(28.0, 44.0), 1)
                bus.edge_fps = round(random.uniform(26.0, 30.0), 1)
                bus.imu_jerk_gz = round(0.98 + random.uniform(-0.06, 0.06), 2)
                bus.last_ping_at = "Just now"

            db.commit()
        finally:
            db.close()

store = PersistentStore()
