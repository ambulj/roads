from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime

class DefectType(str, Enum):
    D40 = "D40"  # Pothole
    D20 = "D20"  # Alligator / Structural Crack
    D10 = "D10"  # Transverse Crack
    D00 = "D00"  # Longitudinal Crack
    WATERLOGGING = "WATERLOGGING"
    MISSING_SIGN = "MISSING_SIGN"
    MISSING_DIVIDER = "MISSING_DIVIDER"
    ZEBRA_CROSSING = "ZEBRA_CROSSING"
    FADED_CROSSING = "FADED_CROSSING"
    UNMARKED_SPEED_BREAKER = "UNMARKED_SPEED_BREAKER"
    ILLEGAL_SPEED_BREAKER = "ILLEGAL_SPEED_BREAKER"
    DARK_SPOT_OUTAGE = "DARK_SPOT_OUTAGE"
    OPEN_MANHOLE = "OPEN_MANHOLE"
    SUNKEN_TRENCH = "SUNKEN_TRENCH"
    SUBMERGED_POTHOLE = "SUBMERGED_POTHOLE"
    FOLIAGE_OBSCURED_SIGN = "FOLIAGE_OBSCURED_SIGN"
    BANNER_OBSCURED_SIGN = "BANNER_OBSCURED_SIGN"

class SeverityLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class WorkOrderStatus(str, Enum):
    OPEN = "open"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    REINSPECTION_PENDING = "reinspection_pending"
    RESOLVED = "resolved"
    VERIFIED_CLOSED = "verified_closed"
    DISPUTED = "disputed"

class IncidentType(str, Enum):
    HIT_AND_RUN = "HIT_AND_RUN"
    RASH_DRIVING = "RASH_DRIVING"
    VULNERABLE_PEDESTRIAN = "VULNERABLE_PEDESTRIAN"
    ZEBRA_CROSSING_ENCROACHMENT = "ZEBRA_CROSSING_ENCROACHMENT"
    RED_LIGHT_VIOLATION = "RED_LIGHT_VIOLATION"
    WATERLOGGING = "WATERLOGGING"
    BUS_LANE_ENCROACHMENT = "BUS_LANE_ENCROACHMENT"
    BUS_LANE_ENCROACH = "BUS_LANE_ENCROACH"
    UNSAFE_OVERTAKE = "UNSAFE_OVERTAKE"
    OPEN_MANHOLE = "OPEN_MANHOLE"
    POTHOLE_D40 = "POTHOLE_D40"
    NO_PARKING_OBSTRUCTION = "NO_PARKING_OBSTRUCTION"

class IncidentStatus(str, Enum):
    ACTIVE_ALERT = "ACTIVE_ALERT"
    DISPATCHED = "DISPATCHED"
    HUMAN_VERIFIED = "HUMAN_VERIFIED"
    DISPATCHED_TO_POLICE = "DISPATCHED_TO_POLICE"
    ESCALATED_POLICE = "ESCALATED_POLICE"
    PUMP_DISPATCHED = "PUMP_DISPATCHED"
    BARRICADED = "BARRICADED"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"

class TelemetryIngest(BaseModel):
    bus_id: str
    lat: float
    lng: float
    speed_kmh: float = 40.0
    heading: float = 0.0
    defect_type: DefectType
    confidence: float = Field(..., ge=0.0, le=1.0)
    vertical_g_force: float = 1.0
    snapshot_url: Optional[str] = None
    captured_at: Optional[datetime] = None

class HazardCluster(BaseModel):
    id: str
    cluster_code: str
    defect_type: str
    defect_name: str
    severity_level: SeverityLevel
    rpi_score: float
    pass_count: int
    road_name: str
    classification: str
    nearest_poi: str
    poi_distance_m: float
    assigned_agency: str
    agency_phone: str
    sla_hours: int
    status: WorkOrderStatus
    lat: float
    lng: float
    before_image_url: Optional[str] = None
    after_image_url: Optional[str] = None
    field_notes: Optional[str] = None
    created_at: str
    updated_at: str

class TrafficIncidentCreate(BaseModel):
    reporting_bus_id: str = "MOBILE-DASHCAM-01"
    incident_type: IncidentType
    plate_number: Optional[str] = None
    plate_confidence: float = 0.95
    vehicle_color: Optional[str] = None
    vehicle_class: Optional[str] = None
    target_speed_kmh: float = 0.0
    road_name: Optional[str] = "Chennai Metropolitan Arterial"
    lat: float
    lng: float
    snapshot_url: Optional[str] = None
    fine_amount_inr: Optional[float] = None
    mva_section: Optional[str] = None
    water_depth_cm: Optional[float] = None

class TrafficIncident(BaseModel):
    id: str
    reporting_bus_id: str
    incident_type: IncidentType
    plate_number: Optional[str] = None
    plate_confidence: float = 0.95
    vehicle_color: Optional[str] = None
    vehicle_class: Optional[str] = None
    target_speed_kmh: float = 0.0
    is_intercepted: bool = False
    road_name: str
    lat: float
    lng: float
    occurred_at: str
    status: IncidentStatus = IncidentStatus.ACTIVE_ALERT
    fine_amount_inr: Optional[float] = None
    mva_section: Optional[str] = None
    echallan_issued: Optional[bool] = None
    echallan_id: Optional[str] = None
    water_depth_cm: Optional[float] = None
    pump_deployed: Optional[bool] = None
    pcr_unit_assigned: Optional[str] = None
    description: Optional[str] = None
    intercepted_by_bus_id: Optional[str] = None
    snapshot_url: Optional[str] = None

class WorkOrderUpdate(BaseModel):
    status: WorkOrderStatus
    assigned_agency: Optional[str] = None
    notes: Optional[str] = None
    before_image_url: Optional[str] = None
    after_image_url: Optional[str] = None
    field_notes: Optional[str] = None

class FleetNode(BaseModel):
    id: str
    route_name: str
    route_code: str
    vehicle_type: str
    npu_hardware: str
    camera_model: str
    is_online: bool
    speed_kmh: float
    lat: float
    lng: float
    heading: float
    last_ping_at: str
    raw_ingests_count: int
    edge_fps: float = 24.0
    imu_jerk_gz: float = 0.98

class CorridorRisk(BaseModel):
    corridor_name: str
    classification: str
    description: str
    clusters_count: int
    raw_ingests: int
    critical_d40_count: int
    average_rpi: float
    action_status: str

class MetricSummary(BaseModel):
    total_ingests: int
    dbscan_clusters: int
    critical_hazards: int
    active_fleet_nodes: int
    active_incidents: int = 0
    deduplication_ratio: float
    avg_priority_score: float
    ingest_sparkline: List[int]
    cluster_sparkline: List[int]

class PerceptionLogEntry(BaseModel):
    id: str
    timestamp: str
    bus_id: str
    corridor: str
    message: str
    latency_ms: int
    type: str = "FLEET TELEMETRY"

class DarkSpotSegment(BaseModel):
    id: str
    road_name: str
    zone: str
    length_meters: float
    avg_lux: float
    exposure_gain_score: float
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    risk_level: str  # "CRITICAL_UNLIT" | "HIGH_RISK" | "MODERATE"
    nearby_poi: str
    transit_routes: List[str]
    identified_at: str
    ward_engineer_notified: bool = True

class SafeCorridorScore(BaseModel):
    id: str
    facility_name: str
    category: str  # "school" | "hospital" | "university"
    corridor_road: str
    zone: str
    lat: float
    lng: float
    overall_score: float  # 0 - 100
    letter_grade: str     # "A+" | "A" | "B" | "C" | "D" | "F"
    zebra_crossing_status: str  # "COMPLIANT" | "FADED" | "MISSING"
    signage_status: str         # "INSTALLED" | "FADED" | "MISSING"
    footpath_clearance_pct: float
    speed_compliance_pct: float
    active_hazard_count: int
    recommended_work_order: str
    last_patrol_bus_id: str
    last_audited_at: str

class ContractorPenaltyDebit(BaseModel):
    id: str
    work_order_code: str
    agency_name: str
    road_name: str
    zone: str
    original_closed_at: str
    recurrence_detected_at: str
    days_to_recurrence: int
    recurrence_distance_meters: float
    defect_type: str
    penalty_amount_inr: int
    legal_clause: str  # "MoHUA IRC:SP:20 Clause 14.2"
    bank_guarantee_deducted: bool
    status: str  # "DEBIT_CONFIRMED" | "UNDER_APPEAL"

class OpenManholeAlert(BaseModel):
    id: str
    road_name: str
    zone: str
    lat: float
    lng: float
    rim_diameter_mm: int
    depth_drop_cm: float
    is_standard_is1726: bool = True
    emergency_level: str = "LEVEL_1_RED_ALERT"
    sla_hours: int = 2
    jal_board_docket: str
    police_cones_dispatched: bool = True
    detected_at: str
    status: str = "ACTIVE_EMERGENCY"

class SubmergedPotholeAlert(BaseModel):
    id: str
    road_name: str
    zone: str
    lat: float
    lng: float
    estimated_water_depth_mm: int
    acoustic_spl_db: float
    vertical_shock_gz: float
    lane_blocked: str
    avoid_advisory_active: bool = True
    last_detected_bus_id: str
    detected_at: str

class ObscuredSignAudit(BaseModel):
    id: str
    road_name: str
    zone: str
    lat: float
    lng: float
    sign_type: str  # "IRC:67 STOP_SIGN", "SCHOOL_AHEAD", "SPEED_LIMIT_40"
    obscuration_pct: float
    obstruction_source: str  # "OVERGROWN_TREE_BRANCH" | "POLITICAL_FLEX_BANNER"
    parks_dept_work_order: str
    identified_at: str
    status: str = "PRUNING_ORDERED"

class ContractorDebarmentDossier(BaseModel):
    id: str
    agency_name: str
    legal_cin: str
    director_name: str
    zone: str
    durability_score_pct: float
    total_recurrence_penalties_inr: int
    sla_breach_count: int
    debarment_status: str  # "STATUTORY_BARRED" | "PROBATION" | "ELIGIBLE"
    debarment_order_no: Optional[str] = None
    gem_portal_notified: bool = True
    statutory_clause: str = "MoHUA Rule 151(iii) GFR 2017 & IRC:SP:20"
    valid_until: Optional[str] = None

class AsphaltQualityAudit(BaseModel):
    id: str
    work_order_code: str
    road_name: str
    agency_name: str
    mix_type: str  # "COLD_MIX_RS1" | "VG30_HOT_MIX"
    lay_surface_temp_c: float
    statutory_min_temp_c: float
    is_temp_compliant: bool
    geometric_milling_shape: str  # "RECTANGULAR_IRC_SP20" | "IRREGULAR_NON_COMPLIANT"
    compaction_score_pct: float
    qc_certification: str  # "PASSED_MORTH_SEC_500" | "REJECTED_REPAVE_ORDERED"
    audited_at: str

