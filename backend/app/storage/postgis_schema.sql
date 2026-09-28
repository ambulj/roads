-- ====================================================================
-- RoadSaarthi Sovereign WebGIS Platform — PostgreSQL 16 + PostGIS 3.4
-- Author: MoHUA / Smart Cities Mission / Government of India
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Fleet Vehicle Register
CREATE TABLE IF NOT EXISTS fleet_nodes (
    id VARCHAR(64) PRIMARY KEY,
    route_name VARCHAR(128) NOT NULL,
    route_code VARCHAR(128) NOT NULL,
    vehicle_type VARCHAR(64) DEFAULT 'Transit Bus',
    npu_hardware VARCHAR(64) DEFAULT 'Rockchip RK3588 (6 TOPS)',
    camera_model VARCHAR(64) DEFAULT 'Sony IMX335 1080p HDR',
    is_online BOOLEAN DEFAULT TRUE,
    speed_kmh NUMERIC(5, 2) DEFAULT 0.0,
    heading NUMERIC(5, 2) DEFAULT 0.0,
    edge_fps NUMERIC(4, 1) DEFAULT 24.0,
    imu_jerk_gz NUMERIC(4, 2) DEFAULT 0.98,
    raw_ingests_count INT DEFAULT 0,
    current_geom GEOMETRY(Point, 4326),
    last_ping_at VARCHAR(64)
);
CREATE INDEX IF NOT EXISTS idx_fleet_nodes_geom ON fleet_nodes USING GIST(current_geom);

-- 2. Deduplicated Hazard Clusters (Ground Truth Maintenance Units)
CREATE TABLE IF NOT EXISTS distress_clusters (
    id VARCHAR(64) PRIMARY KEY,
    cluster_code VARCHAR(32) UNIQUE NOT NULL,
    defect_type VARCHAR(32) NOT NULL,
    defect_name VARCHAR(64) NOT NULL,
    severity_level VARCHAR(16) NOT NULL,
    rpi_score NUMERIC(5, 2) NOT NULL,
    pass_count INT DEFAULT 1,
    road_name VARCHAR(255) NOT NULL,
    classification VARCHAR(64) NOT NULL,
    nearest_poi VARCHAR(255),
    poi_distance_m NUMERIC(7, 2),
    assigned_agency VARCHAR(128),
    agency_phone VARCHAR(32),
    sla_hours INT DEFAULT 48,
    status VARCHAR(32) DEFAULT 'open',
    before_image_url TEXT,
    after_image_url TEXT,
    field_notes TEXT,
    lat NUMERIC(9, 6),
    lng NUMERIC(9, 6),
    geom GEOMETRY(Point, 4326),
    created_at VARCHAR(64),
    updated_at VARCHAR(64)
);
CREATE INDEX IF NOT EXISTS idx_distress_clusters_geom ON distress_clusters USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_distress_clusters_rpi ON distress_clusters(rpi_score DESC);
CREATE INDEX IF NOT EXISTS idx_distress_clusters_status ON distress_clusters(status);

-- 3. Raw Windshield Detections & Edge Ingestion Stream
CREATE TABLE IF NOT EXISTS raw_ingests (
    id VARCHAR(64) PRIMARY KEY,
    bus_id VARCHAR(64) NOT NULL,
    cluster_id VARCHAR(64),
    defect_type VARCHAR(32) NOT NULL,
    confidence NUMERIC(4, 3) NOT NULL,
    speed_kmh NUMERIC(5, 2),
    vertical_g_force NUMERIC(4, 2),
    snapshot_url TEXT,
    lat NUMERIC(9, 6),
    lng NUMERIC(9, 6),
    geom GEOMETRY(Point, 4326),
    captured_at VARCHAR(64)
);
CREATE INDEX IF NOT EXISTS idx_raw_ingests_geom ON raw_ingests USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_raw_ingests_time ON raw_ingests(captured_at DESC);

-- 4. Traffic & Safety Violations Register (ANPR Intercept & Review Queue)
CREATE TABLE IF NOT EXISTS traffic_incidents (
    id VARCHAR(64) PRIMARY KEY,
    reporting_bus_id VARCHAR(64) NOT NULL,
    incident_type VARCHAR(64) NOT NULL,
    plate_number VARCHAR(32),
    plate_confidence NUMERIC(4, 3) DEFAULT 0.95,
    vehicle_color VARCHAR(32),
    vehicle_class VARCHAR(64),
    target_speed_kmh NUMERIC(5, 2) DEFAULT 0.0,
    is_intercepted BOOLEAN DEFAULT FALSE,
    intercepted_by_bus_id VARCHAR(64),
    snapshot_url TEXT,
    road_name VARCHAR(255) NOT NULL,
    lat NUMERIC(9, 6) NOT NULL,
    lng NUMERIC(9, 6) NOT NULL,
    geom GEOMETRY(Point, 4326),
    occurred_at VARCHAR(64),
    status VARCHAR(32) DEFAULT 'ACTIVE_ALERT',
    fine_amount_inr NUMERIC(10, 2),
    mva_section VARCHAR(255),
    echallan_issued BOOLEAN DEFAULT FALSE,
    echallan_id VARCHAR(64),
    water_depth_cm NUMERIC(5, 2),
    pump_deployed BOOLEAN DEFAULT FALSE,
    pcr_unit_assigned VARCHAR(64),
    description TEXT,
    review_status VARCHAR(32) DEFAULT 'AUTO_ADMISSIBLE',
    reviewed_by VARCHAR(64),
    reviewed_at VARCHAR(64),
    rejection_reason TEXT,
    dispatch_status VARCHAR(32) DEFAULT 'UNASSIGNED'
);
CREATE INDEX IF NOT EXISTS idx_traffic_incidents_geom ON traffic_incidents USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_traffic_incidents_status ON traffic_incidents(status);
CREATE INDEX IF NOT EXISTS idx_traffic_incidents_plate ON traffic_incidents(plate_number);
CREATE INDEX IF NOT EXISTS idx_traffic_incidents_review ON traffic_incidents(review_status);

-- 5. Traffic Density & Congestion Register (IRC:106)
CREATE TABLE IF NOT EXISTS traffic_density (
    id VARCHAR(64) PRIMARY KEY,
    corridor_id VARCHAR(64),
    road_name VARCHAR(255) NOT NULL,
    lat NUMERIC(9, 6) NOT NULL,
    lng NUMERIC(9, 6) NOT NULL,
    vehicle_count INT DEFAULT 0,
    density_pcu_per_km NUMERIC(7, 2) DEFAULT 0.0,
    average_speed_kmh NUMERIC(5, 2) DEFAULT 35.0,
    free_flow_speed_kmh NUMERIC(5, 2) DEFAULT 50.0,
    congestion_level VARCHAR(32) DEFAULT 'MODERATE',
    is_bottleneck BOOLEAN DEFAULT FALSE,
    bottleneck_cause VARCHAR(255),
    reported_by VARCHAR(64),
    measured_at VARCHAR(64)
);
CREATE INDEX IF NOT EXISTS idx_traffic_density_bottleneck ON traffic_density(is_bottleneck);

-- 6. Statutory Contractor Penalties (MoHUA IRC:SP:20 Cl 14.2)
CREATE TABLE IF NOT EXISTS contractor_penalties (
    id VARCHAR(64) PRIMARY KEY,
    contractor_name VARCHAR(128) NOT NULL,
    cluster_code VARCHAR(32) NOT NULL,
    corridor_name VARCHAR(255) NOT NULL,
    re_pothole_count INT DEFAULT 1,
    penalty_amount_inr NUMERIC(10, 2) NOT NULL,
    statutory_clause VARCHAR(128) DEFAULT 'MoHUA IRC:SP:20 Clause 14.2',
    status VARCHAR(32) DEFAULT 'DEBIT_ISSUED',
    provenance VARCHAR(64) DEFAULT 'DERIVED_FROM_RECURRENT_DISTRESS',
    issued_at VARCHAR(64)
);

-- 7. Open Manhole Emergency Register (IS:1726)
CREATE TABLE IF NOT EXISTS open_manholes (
    id VARCHAR(64) PRIMARY KEY,
    docket_number VARCHAR(64) UNIQUE NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    lat NUMERIC(9, 6) NOT NULL,
    lng NUMERIC(9, 6) NOT NULL,
    void_diameter_cm NUMERIC(5, 2) DEFAULT 60.0,
    depth_meters NUMERIC(4, 2) DEFAULT 1.8,
    is_barricaded BOOLEAN DEFAULT FALSE,
    agency_responsible VARCHAR(128) DEFAULT 'Chennai Metro Water (CMWSSB) / GCC',
    statutory_standard VARCHAR(64) DEFAULT 'IS:1726 Cast Iron Sump Code',
    sla_minutes_remaining INT DEFAULT 120,
    status VARCHAR(32) DEFAULT 'EMERGENCY_DISPATCHED',
    detected_at VARCHAR(64)
);

-- 8. Night-Time Dark Spot Register (< 5 Lux)
CREATE TABLE IF NOT EXISTS dark_spots (
    id VARCHAR(64) PRIMARY KEY,
    corridor_name VARCHAR(255) NOT NULL,
    lat NUMERIC(9, 6) NOT NULL,
    lng NUMERIC(9, 6) NOT NULL,
    illuminance_lux NUMERIC(4, 2) DEFAULT 2.1,
    statutory_threshold_lux NUMERIC(4, 2) DEFAULT 15.0,
    pedestrian_risk VARCHAR(32) DEFAULT 'CRITICAL',
    dark_length_meters NUMERIC(6, 1) DEFAULT 450.0,
    status VARCHAR(32) DEFAULT 'AUDIT_FLAGGED',
    detected_at VARCHAR(64)
);

-- 9. Contractor Statutory Debarments (GeM / GFR Rule 151)
CREATE TABLE IF NOT EXISTS contractor_debarments (
    id VARCHAR(64) PRIMARY KEY,
    contractor_name VARCHAR(128) UNIQUE NOT NULL,
    demerit_score NUMERIC(5, 2) DEFAULT 0.0,
    debarment_status VARCHAR(64) DEFAULT 'STATUTORY_DEBARMENT_NOTICE',
    reason TEXT,
    gem_portal_reference VARCHAR(64),
    effective_date VARCHAR(64)
);
