from sqlalchemy import Column, String, Integer, Float, Boolean, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class DBDistressCluster(Base):
    __tablename__ = "distress_clusters"

    id = Column(String(64), primary_key=True, index=True)
    cluster_code = Column(String(32), unique=True, index=True, nullable=False)
    defect_type = Column(String(32), nullable=False)
    defect_name = Column(String(64), nullable=False)
    severity_level = Column(String(16), nullable=False)
    rpi_score = Column(Float, nullable=False, index=True)
    pass_count = Column(Integer, default=1)
    road_name = Column(String(255), nullable=False)
    classification = Column(String(64), nullable=False)
    nearest_poi = Column(String(255))
    poi_distance_m = Column(Float)
    assigned_agency = Column(String(128))
    agency_phone = Column(String(32))
    sla_hours = Column(Integer, default=48)
    status = Column(String(32), default="open", index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    before_image_url = Column(Text, nullable=True)
    after_image_url = Column(Text, nullable=True)
    field_notes = Column(Text, nullable=True)
    detecting_camera_position = Column(String(32), default="FRONT_WINDSHIELD")
    detecting_channel = Column(Integer, default=1)
    created_at = Column(String(64))
    updated_at = Column(String(64))

class DBTrafficIncident(Base):
    __tablename__ = "traffic_incidents"

    id = Column(String(64), primary_key=True, index=True)
    reporting_bus_id = Column(String(64), nullable=False)
    incident_type = Column(String(64), nullable=False, index=True)
    plate_number = Column(String(32), nullable=True, index=True)
    plate_confidence = Column(Float, default=0.95)
    vehicle_color = Column(String(32), nullable=True)
    vehicle_class = Column(String(64), nullable=True)
    target_speed_kmh = Column(Float, default=0.0)
    is_intercepted = Column(Boolean, default=False)
    intercepted_by_bus_id = Column(String(64), nullable=True)
    snapshot_url = Column(Text, nullable=True)
    road_name = Column(String(255), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    occurred_at = Column(String(64))
    status = Column(String(32), default="ACTIVE_ALERT", index=True)
    fine_amount_inr = Column(Float, nullable=True)
    mva_section = Column(String(255), nullable=True)
    echallan_issued = Column(Boolean, default=False)
    echallan_id = Column(String(64), nullable=True)
    water_depth_cm = Column(Float, nullable=True)
    pump_deployed = Column(Boolean, default=False)
    pcr_unit_assigned = Column(String(64), nullable=True)
    description = Column(Text, nullable=True)
    # Camera Position & Multi-Channel Schema
    camera_position = Column(String(32), default="REAR_OVERTAKE")
    channel = Column(Integer, default=2)
    statutory_provenance = Column(String(64), default="MVA_1988_RULE_ENGINE")
    # Review Queue & Workflow Extensions
    review_status = Column(String(32), default="AUTO_ADMISSIBLE", index=True) # PENDING_REVIEW, ACCEPTED, REJECTED, AUTO_ADMISSIBLE
    reviewed_by = Column(String(64), nullable=True)
    reviewed_at = Column(String(64), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    dispatch_status = Column(String(32), default="UNASSIGNED") # UNASSIGNED, PCR_DISPATCHED, ECHALLAN_ISSUED

class DBRawIngest(Base):
    __tablename__ = "raw_ingests"

    id = Column(String(64), primary_key=True, index=True)
    bus_id = Column(String(64), nullable=False)
    cluster_id = Column(String(64), nullable=True)
    defect_type = Column(String(32), nullable=False)
    confidence = Column(Float, nullable=False)
    speed_kmh = Column(Float, default=40.0)
    vertical_g_force = Column(Float, default=1.0)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    camera_position = Column(String(32), default="FRONT_WINDSHIELD")
    channel = Column(Integer, default=1)
    captured_at = Column(String(64))

class DBFleetNode(Base):
    __tablename__ = "fleet_nodes"

    id = Column(String(64), primary_key=True, index=True)
    route_name = Column(String(128), nullable=False)
    route_code = Column(String(128), nullable=False)
    vehicle_type = Column(String(64), default="Transit Bus")
    npu_hardware = Column(String(64), default="Rockchip RK3588 (6 TOPS)")
    camera_model = Column(String(64), default="Sony IMX335 1080p HDR")
    is_online = Column(Boolean, default=True)
    speed_kmh = Column(Float, default=40.0)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    heading = Column(Float, default=0.0)
    last_ping_at = Column(String(64))
    raw_ingests_count = Column(Integer, default=0)
    edge_fps = Column(Float, default=24.0)
    imu_jerk_gz = Column(Float, default=0.98)
    dvr_channels = Column(Integer, default=4)
    dvr_ip = Column(String(128), nullable=True)
    camera_position = Column(String(32), default="FRONT_WINDSHIELD")
    cameras_config = Column(Text, nullable=True)

class DBAuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(64), primary_key=True, index=True)
    bus_id = Column(String(64), nullable=True)
    corridor = Column(String(255), nullable=True)
    message = Column(Text, nullable=False)
    latency_ms = Column(Integer, default=50)
    type = Column(String(64), default="PERCEPTION_AUDIT")
    timestamp = Column(String(64), default="Just now")
    created_at = Column(String(64))

# ── New Ground-Truth Compliance & Traffic Models ─────────────────────────────

class DBTrafficDensity(Base):
    __tablename__ = "traffic_density"

    id = Column(String(64), primary_key=True, index=True)
    corridor_id = Column(String(64), index=True)
    road_name = Column(String(255), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    vehicle_count = Column(Integer, default=0)
    density_pcu_per_km = Column(Float, default=0.0)
    average_speed_kmh = Column(Float, default=35.0)
    free_flow_speed_kmh = Column(Float, default=50.0)
    congestion_level = Column(String(32), default="MODERATE") # FREE_FLOW, MODERATE, CONGESTED, GRIDLOCK
    is_bottleneck = Column(Boolean, default=False, index=True)
    bottleneck_cause = Column(String(255), nullable=True)
    reported_by = Column(String(64), nullable=True)
    measured_at = Column(String(64))

class DBContractorPenalty(Base):
    __tablename__ = "contractor_penalties"

    id = Column(String(64), primary_key=True, index=True)
    contractor_name = Column(String(128), nullable=False, index=True)
    cluster_code = Column(String(32), nullable=False)
    corridor_name = Column(String(255), nullable=False)
    re_pothole_count = Column(Integer, default=1)
    penalty_amount_inr = Column(Float, nullable=False)
    statutory_clause = Column(String(128), default="MoHUA IRC:SP:20 Clause 14.2")
    status = Column(String(32), default="DEBIT_ISSUED") # DEBIT_ISSUED, CONTESTED, RECOVERED
    provenance = Column(String(64), default="DERIVED_FROM_RECURRENT_DISTRESS")
    issued_at = Column(String(64))

class DBOpenManholeAlert(Base):
    __tablename__ = "open_manholes"

    id = Column(String(64), primary_key=True, index=True)
    docket_number = Column(String(64), unique=True, index=True)
    location_name = Column(String(255), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    void_diameter_cm = Column(Float, default=60.0)
    depth_meters = Column(Float, default=1.8)
    is_barricaded = Column(Boolean, default=False)
    agency_responsible = Column(String(128), default="Chennai Metro Water (CMWSSB) / GCC")
    statutory_standard = Column(String(64), default="IS:1726 Cast Iron Sump Code")
    sla_minutes_remaining = Column(Integer, default=120)
    status = Column(String(32), default="EMERGENCY_DISPATCHED") # EMERGENCY_DISPATCHED, BARRICADED, REPAIRED
    detected_at = Column(String(64))

class DBDarkSpot(Base):
    __tablename__ = "dark_spots"

    id = Column(String(64), primary_key=True, index=True)
    corridor_name = Column(String(255), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    illuminance_lux = Column(Float, default=2.1)
    statutory_threshold_lux = Column(Float, default=15.0)
    pedestrian_risk = Column(String(32), default="CRITICAL")
    dark_length_meters = Column(Float, default=450.0)
    status = Column(String(32), default="AUDIT_FLAGGED")
    detected_at = Column(String(64))

class DBContractorDebarment(Base):
    __tablename__ = "contractor_debarments"

    id = Column(String(64), primary_key=True, index=True)
    contractor_name = Column(String(128), unique=True, index=True)
    demerit_score = Column(Float, default=0.0)
    debarment_status = Column(String(64), default="STATUTORY_DEBARMENT_NOTICE")
    reason = Column(Text)
    gem_portal_reference = Column(String(64))
    effective_date = Column(String(64))

class DBUser(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    password_hash = Column(String(128), nullable=False)
    salt = Column(String(64), nullable=False)
    role = Column(String(32), nullable=False, index=True)
    name = Column(String(128), nullable=False)
    designation = Column(String(128), nullable=False)
    department = Column(String(128), nullable=False)
    agency = Column(String(128), nullable=False)
    badge_number = Column(String(64), unique=True, index=True, nullable=False)
    permissions = Column(Text, default="[]")
    is_active = Column(Boolean, default=True)
    last_login_at = Column(String(64), nullable=True)
    created_at = Column(String(64), nullable=True)

class DBRepairAudit(Base):
    __tablename__ = "repair_audits"

    id = Column(String(64), primary_key=True, index=True)
    cluster_id = Column(String(64), index=True, nullable=False)
    cluster_code = Column(String(32), index=True, nullable=False)
    contractor_name = Column(String(128), nullable=True)
    road_name = Column(String(255), nullable=False)
    verifying_bus_id = Column(String(64), nullable=False)
    vertical_gz = Column(Float, nullable=False)
    optical_status = Column(String(64), default="SMOOTH_SURFACE")
    audit_verdict = Column(String(32), nullable=False)  # REPAIR_VERIFIED, REPAIR_FAILED_RECURRENCE, AWAITING_PASS
    penalty_debit_inr = Column(Float, default=0.0)
    statutory_clause = Column(String(128), default="MoHUA IRC:SP:20 Clause 14.2")
    notes = Column(Text, nullable=True)
    verified_at = Column(String(64))


