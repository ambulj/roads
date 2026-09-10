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
