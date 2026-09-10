// ============================================================
//  RoadSaarthi Type Definitions
// ============================================================

export type DefectCode = 
  | "D40" | "D20" | "D10" | "D00" 
  | "WATERLOGGING" | "MISSING_SIGN" | "MISSING_DIVIDER" 
  | "ZEBRA_CROSSING" | "FADED_CROSSING" 
  | "UNMARKED_SPEED_BREAKER" | "ILLEGAL_SPEED_BREAKER" 
  | "DARK_SPOT_OUTAGE"
  | "OPEN_MANHOLE" | "SUNKEN_TRENCH" | "SUBMERGED_POTHOLE" 
  | "FOLIAGE_OBSCURED_SIGN" | "BANNER_OBSCURED_SIGN";
export type Severity   = "critical" | "high" | "medium" | "low";
export type WorkOrderStatus =
  | "open" | "assigned" | "in_progress"
  | "reinspection_pending" | "verified_closed" | "resolved" | "disputed";

// ── POI Types ────────────────────────────────────────────────────────────────
export type POICategory =
  | "hospital"   // +15 RPI boost
  | "school"     // +10 RPI boost
  | "emergency"  // +15 RPI boost (fire/police station)
  | "transit"    // +5  RPI boost (bus terminus, railway)
  | "market"     // +5  RPI boost
  | "college"    // +8  RPI boost
  | "government";// +8  RPI boost

export interface POIZone {
  id: string;
  name: string;
  category: POICategory;
  lat: number;
  lng: number;
  radius_m: number;    // Influence radius
  rpi_boost: number;   // Points added to RPI score of hazards within radius
}

// ── Sensor Readings ──────────────────────────────────────────────────────────
export interface SensorReading {
  // 6-Axis IMU (MPU-6050)
  imu_accel_x: number;   // m/s²
  imu_accel_y: number;
  imu_accel_z: number;
  imu_gyro_x: number;    // deg/s
  imu_gyro_y: number;
  imu_gyro_z: number;
  imu_jerk_gz: number;   // Peak vertical shock (g)
  imu_temp_c: number;    // Sensor die temperature

  // GPS (u-blox NEO-6M)
  gps_lat: number;
  gps_lng: number;
  gps_speed_kmh: number;
  gps_heading: number;   // degrees 0-360
  gps_fix_quality: number; // 0=no fix, 1=GPS, 2=DGPS, 3=NavIC
  gps_satellites: number;
  gps_hdop: number;      // Horizontal dilution of precision

  // Camera (Sony IMX335)
  cam_fps: number;
  cam_temp_c: number;
  cam_exposure_ms: number;
  cam_brightness: number; // 0-255
  cam_confidence: number; // Defect detection confidence

  // 4G Modem (Quectel EC25)
  lte_rssi_dbm: number;  // e.g. -65 to -110
  lte_signal_bars: number; // 0-5
  lte_network: "4G LTE" | "3G" | "2G" | "No Signal";
  lte_latency_ms: number;

  // Power Monitor (INA219)
  power_voltage_v: number;
  power_current_ma: number;
  power_watt: number;

  // Environment (DHT22)
  env_temp_c: number;
  env_humidity_pct: number;

  // OBD-II CAN Bus (if available)
  obd_rpm: number | null;
  obd_throttle_pct: number | null;
  obd_brake_active: boolean | null;

  // Derived
  iri: number;           // International Roughness Index
  road_surface_quality: "smooth" | "fair" | "poor" | "critical";
}

// ── Defect Detection Box ─────────────────────────────────────────────────────
export interface DetectionBox {
  x: number;        // 0-1 normalized
  y: number;
  w: number;
  h: number;
  label: string;    // e.g. "D40 Pothole"
  confidence: number;
  severity: Severity;
}

// ── Fleet Node ───────────────────────────────────────────────────────────────
export interface FleetNode {
  id: string;
  route_name: string;
  route_code: string;
  vehicle_type: string;
  npu_hardware: string;
  camera_model: string;
  is_online: boolean;
  speed_kmh: number;
  lat: number;
  lng: number;
  heading: number;
  last_ping_at: string;
  raw_ingests_count: number;
  edge_fps: number;
  imu_jerk_gz: number;
  // Extended sensor data (optional, populated by WebSocket)
  sensors?: SensorReading;
  // POI proximity tags
  nearby_pois?: Array<{ name: string; category: POICategory; distance_m: number }>;
}

// ── Hazard Cluster ───────────────────────────────────────────────────────────
export interface HazardCluster {
  id: string;
  cluster_code: string;
  defect_type: DefectCode;
  defect_name: string;
  severity_level: Severity;
  rpi_score: number;
  rpi_boosted?: number;       // Score after POI boost
  poi_boost_applied?: number; // Points of boost
  poi_tags?: Array<{ name: string; category: POICategory }>; // Nearby POIs
  pass_count: number;
  /** Compatibility alias supplied by the consensus endpoint. */
  total_observations?: number;
  road_name: string;
  classification: string;
  nearest_poi: string;
  poi_distance_m: number;
  assigned_agency: string;
  agency_phone: string;
  sla_hours: number;
  sla_deadline_iso?: string;  // ISO timestamp of SLA deadline
  status: WorkOrderStatus;
  lat: number;
  lng: number;
  created_at: string;
  updated_at: string;
  before_image_url?: string;
  after_image_url?: string;
  field_notes?: string;
}

// ── Corridor Risk ─────────────────────────────────────────────────────────────
export interface CorridorRisk {
  corridor_name: string;
  classification: string;
  description: string;
  clusters_count: number;
  raw_ingests: number;
  critical_d40_count: number;
  average_rpi: number;
  action_status: "PRIORITY DISPATCH" | "NORMAL PATROL";
}

// ── Metrics ───────────────────────────────────────────────────────────────────
export interface MetricSummary {
  total_ingests: number;
  dbscan_clusters: number;
  critical_hazards: number;
  active_fleet_nodes: number;
  active_incidents?: number;
  deduplication_ratio: number;
  avg_priority_score: number;
  ingest_sparkline: number[];
  cluster_sparkline: number[];
}

// ── Traffic Incident ──────────────────────────────────────────────────────────
export type IncidentType =
  | "HIT_AND_RUN"
  | "RASH_DRIVING"
  | "VULNERABLE_PEDESTRIAN"
  | "ZEBRA_CROSSING_ENCROACHMENT"
  | "RED_LIGHT_VIOLATION"
  | "WATERLOGGING"
  | "BUS_LANE_ENCROACHMENT"
  | "UNSAFE_OVERTAKE"
  | "OPEN_MANHOLE"
  | "POTHOLE_D40"
  | "NO_PARKING_OBSTRUCTION";

export interface TrafficIncident {
  id: string;
  reporting_bus_id: string;
  incident_type: IncidentType | string;
  plate_number?: string;
  plate_confidence?: number;
  vehicle_color?: string;
  vehicle_class?: string;
  target_speed_kmh?: number;
  is_intercepted?: boolean;
  intercepted_by_bus_id?: string;
  intercept_history?: ANPRInterceptSighting[];
  snapshot_url?: string;
  road_name: string;
  lat: number;
  lng: number;
  occurred_at: string;
  status: string;
  // Civic enforcement & operational response fields
  fine_amount_inr?: number;
  mva_section?: string;
  echallan_issued?: boolean;
  echallan_id?: string;
  echallan_timestamp?: string;
  water_depth_cm?: number;
  pump_deployed?: boolean;
  pump_id?: string;
  dewatering_eta_mins?: number;
  pcr_unit_assigned?: string;
  pcr_dispatch_time?: string;
  work_order_id?: string;
  description?: string;
}

// ── Other Types ───────────────────────────────────────────────────────────────
export interface PerceptionLogEntry {
  id: string;
  timestamp: string;
  bus_id: string;
  corridor: string;
  message: string;
  latency_ms: number;
  type: string;
}

export interface HardwareBOMItem {
  id: string;
  category: string;
  title: string;
  component: string;
  cost_inr: number;
  specs: Record<string, string>;
  description: string;
  tier: string;
}

export interface RoadMemoryTimelineEvent {
  id: string;
  date: string;
  type: "DETECTION" | "MULTI_BUS_CONFIRM" | "WATERLOG" | "WORK_ORDER" | "REPAIR_DONE" | "RECURRENCE" | "RISK_SPIKE";
  title: string;
  description: string;
  severity?: Severity;
  buses_involved?: string[];
  pass_count?: number;
}

export interface RoadMemoryCorridor {
  id: string;
  name: string;
  classification: string;
  length_km: number;
  health_score: number;
  first_monitored_date: string;
  last_updated: string;
  total_confirmations: number;
  recurrence_rate_pct: number;
  repair_durability_score: number;
  monsoon_risk_index: "HIGH" | "MEDIUM" | "LOW";
  pothole_count: number;
  waterlog_count: number;
  crack_count: number;
  active_work_orders: number;
  nearby_vulnerable_zones: string[];
  timeline: RoadMemoryTimelineEvent[];
}

export interface ANPRInterceptSighting {
  bus_id: string;
  location: string;
  lat: number;
  lng: number;
  timestamp: string;
  speed_kmh: number;
}

export interface BreadcrumbPoint {
  id: string;
  bus_id: string;
  lat: number;
  lng: number;
  timestamp: string;
  iri: number;
  imu_jerk_gz: number;
  speed_kmh: number;
}

export interface MonsoonContourZone {
  id: string;
  name: string;
  elevation_m: number;
  predicted_water_depth_mm: number;
  hydroplaning_risk: "CRITICAL" | "HIGH" | "MODERATE";
  drainage_bottleneck: string;
  polygon: [number, number][];
}

export interface ContractorScorecard {
  agency: string;
  phone: string;
  zone: string;
  assigned_tickets: number;
  completed_tickets: number;
  sla_compliance_pct: number;
  avg_turnaround_hrs: number;
  durability_score_pct: number;
  recurrence_penalty_deductions_inr: number;
  star_rating: number;
  tender_eligibility: "ELIGIBLE - GRADE A" | "ELIGIBLE - GRADE B" | "PROBATION" | "DISQUALIFIED";
}

export interface DarkSpotSegment {
  id: string;
  road_name: string;
  zone: string;
  length_meters: number;
  avg_lux: number;
  exposure_gain_score: number;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  risk_level: "CRITICAL_UNLIT" | "HIGH_RISK" | "MODERATE";
  nearby_poi: string;
  transit_routes: string[];
  identified_at: string;
  ward_engineer_notified: boolean;
}

export interface SafeCorridor {
  id: string;
  facility_name: string;
  category: "school" | "hospital" | "university";
  corridor_road: string;
  zone: string;
  lat: number;
  lng: number;
  overall_score: number;
  letter_grade: "A+" | "A" | "B" | "C" | "D" | "F";
  zebra_crossing_status: "COMPLIANT" | "FADED" | "MISSING";
  signage_status: "INSTALLED" | "FADED" | "MISSING";
  footpath_clearance_pct: number;
  speed_compliance_pct: number;
  active_hazard_count: number;
  recommended_work_order: string;
  last_patrol_bus_id: string;
  last_audited_at: string;
}

export interface ContractorPenaltyDebit {
  id: string;
  work_order_code: string;
  agency_name: string;
  road_name: string;
  zone: string;
  original_closed_at: string;
  recurrence_detected_at: string;
  days_to_recurrence: number;
  recurrence_distance_meters: number;
  defect_type: string;
  penalty_amount_inr: number;
  legal_clause: string;
  bank_guarantee_deducted: boolean;
  status: "DEBIT_CONFIRMED" | "UNDER_APPEAL";
}

export interface OpenManholeAlert {
  id: string;
  road_name: string;
  zone: string;
  lat: number;
  lng: number;
  rim_diameter_mm: number;
  depth_drop_cm: number;
  is_standard_is1726: boolean;
  emergency_level: "LEVEL_1_RED_ALERT";
  sla_hours: number;
  jal_board_docket: string;
  police_cones_dispatched: boolean;
  detected_at: string;
  status: "ACTIVE_EMERGENCY" | "BARRICADED" | "RESOLVED";
}

export interface SubmergedPotholeAlert {
  id: string;
  road_name: string;
  zone: string;
  lat: number;
  lng: number;
  estimated_water_depth_mm: number;
  acoustic_spl_db: number;
  vertical_shock_gz: number;
  lane_blocked: string;
  avoid_advisory_active: boolean;
  last_detected_bus_id: string;
  detected_at: string;
}

export interface ObscuredSignAudit {
  id: string;
  road_name: string;
  zone: string;
  lat: number;
  lng: number;
  sign_type: string;
  obscuration_pct: number;
  obstruction_source: "OVERGROWN_TREE_BRANCH" | "POLITICAL_FLEX_BANNER";
  parks_dept_work_order: string;
  identified_at: string;
  status: "PRUNING_ORDERED" | "CLEARED";
}

export interface ContractorDebarmentDossier {
  id: string;
  agency_name: string;
  legal_cin: string;
  director_name: string;
  zone: string;
  durability_score_pct: number;
  total_recurrence_penalties_inr: number;
  sla_breach_count: number;
  debarment_status: "STATUTORY_BARRED" | "PROBATION" | "ELIGIBLE";
  debarment_order_no?: string;
  gem_portal_notified: boolean;
  statutory_clause: string;
  valid_until?: string;
}

export interface AsphaltQualityAudit {
  id: string;
  work_order_code: string;
  road_name: string;
  agency_name: string;
  mix_type: "COLD_MIX_RS1" | "VG30_HOT_MIX";
  lay_surface_temp_c: number;
  statutory_min_temp_c: number;
  is_temp_compliant: boolean;
  geometric_milling_shape: "RECTANGULAR_IRC_SP20" | "IRREGULAR_NON_COMPLIANT";
  compaction_score_pct: number;
  qc_certification: "PASSED_MORTH_SEC_500" | "REJECTED_REPAVE_ORDERED";
  audited_at: string;
}

// ── Civic Roles & RBAC ──────────────────────────────────────────────────────
export type CivicRole = "admin" | "operations" | "maintenance" | "safety" | "analyst";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: CivicRole;
  designation: string;
  department: string;
  agency: string;
  badge_number: string;
  avatar_initials: string;
  last_login: string;
}

// ── Multi-Bus Urban Truth & Confidence Consensus ───────────────────────────
export type TruthStatus = "CONFIRMED" | "STRONG_SIGNAL" | "UNVERIFIED" | "STALE";

export interface MultiBusObservation {
  bus_id: string;
  timestamp: string;
  confidence: number;
  depth_cm?: number;
  sensor_accel_gz?: number;
}

export interface DefectTruthSummary {
  truth_status: TruthStatus;
  total_passes: number;
  unique_buses_count: number;
  consensus_score_pct: number;
  last_verified_ago: string;
  observations: MultiBusObservation[];
}

// ── Intervention Simulator Types ───────────────────────────────────────────
export interface InterventionScenario {
  id: string;
  title: string;
  category: "PATCHING" | "REROUTING" | "TRAFFIC_MARSHAL" | "SUMP_PUMPING";
  corridor_name: string;
  description: string;
  baseline_delay_mins: number;
  baseline_accidents_month: number;
  baseline_roughness_iri: number;
  cost_estimate_inr: number;
}
