-- ====================================================================
-- RoadSaarthi Sovereign WebGIS Platform — PostgreSQL 16 + PostGIS 3.4
-- Author: MoHUA / Smart Cities Mission / Government of India
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Fleet Vehicle Register
CREATE TABLE IF NOT EXISTS fleet_nodes (
    id VARCHAR(32) PRIMARY KEY,
    route_name VARCHAR(128) NOT NULL,
    route_code VARCHAR(32) NOT NULL,
    vehicle_type VARCHAR(32) DEFAULT 'Transit Bus',
    npu_hardware VARCHAR(64) DEFAULT 'Rockchip RK3588 (6 TOPS)',
    camera_model VARCHAR(64) DEFAULT 'Sony IMX335 1080p HDR',
    is_online BOOLEAN DEFAULT TRUE,
    speed_kmh NUMERIC(5, 2) DEFAULT 0.0,
    heading NUMERIC(5, 2) DEFAULT 0.0,
    edge_fps NUMERIC(4, 1) DEFAULT 24.0,
    imu_jerk_gz NUMERIC(4, 2) DEFAULT 0.98,
    raw_ingests_count INT DEFAULT 0,
    current_geom GEOMETRY(Point, 4326),
    last_ping_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_fleet_nodes_geom ON fleet_nodes USING GIST(current_geom);

-- 2. Deduplicated Hazard Clusters (Ground Truth Maintenance Units)
CREATE TABLE IF NOT EXISTS distress_clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_code VARCHAR(32) UNIQUE NOT NULL,
    defect_type VARCHAR(16) NOT NULL, -- 'D40', 'D20', 'D10', 'D00', 'WATERLOGGING', etc.
    defect_name VARCHAR(64) NOT NULL,
    severity_level VARCHAR(16) NOT NULL, -- 'critical', 'high', 'medium', 'low'
    rpi_score NUMERIC(5, 2) NOT NULL,
    pass_count INT DEFAULT 1,
    road_name VARCHAR(255) NOT NULL,
    classification VARCHAR(64) NOT NULL,
    nearest_poi VARCHAR(255),
    poi_distance_m NUMERIC(7, 2),
    assigned_agency VARCHAR(128),
    agency_phone VARCHAR(32),
    sla_hours INT DEFAULT 48,
    status VARCHAR(16) DEFAULT 'open', -- 'open', 'assigned', 'resolved', 'disputed'
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
    defect_type VARCHAR(16) NOT NULL,
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

-- 4. Monitored Arterial Transit Corridors
CREATE TABLE IF NOT EXISTS arterial_corridors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(128) UNIQUE NOT NULL,
    classification VARCHAR(64) NOT NULL,
    description TEXT,
    route_geom GEOMETRY(LineString, 4326),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_arterial_corridors_geom ON arterial_corridors USING GIST(route_geom);

-- 5. Traffic & Safety Violations Register (DPDP Compliant & ANPR Intercept Ring)
CREATE TABLE IF NOT EXISTS traffic_incidents (
    id VARCHAR(64) PRIMARY KEY,
    reporting_bus_id VARCHAR(64) NOT NULL,
    incident_type VARCHAR(32) NOT NULL, -- 'HIT_AND_RUN', 'RASH_DRIVING', 'VULNERABLE_PEDESTRIAN', 'WATERLOGGING'
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
    status VARCHAR(32) DEFAULT 'ACTIVE_ALERT'
);
CREATE INDEX IF NOT EXISTS idx_traffic_incidents_geom ON traffic_incidents USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_traffic_incidents_status ON traffic_incidents(status);
CREATE INDEX IF NOT EXISTS idx_traffic_incidents_plate ON traffic_incidents(plate_number);

