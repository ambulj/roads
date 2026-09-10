import {
  HazardCluster, FleetNode, CorridorRisk, MetricSummary, PerceptionLogEntry,
  HardwareBOMItem, WorkOrderStatus, TrafficIncident, POIZone, POICategory, SensorReading,
  SafeCorridor, DarkSpotSegment, ContractorPenaltyDebit,
  OpenManholeAlert, SubmergedPotholeAlert, ObscuredSignAudit, ContractorDebarmentDossier, AsphaltQualityAudit,
  RoadMemoryCorridor
} from '../types';

const API_BASE = '/api';

// ── Chennai Critical POI Registry (Hospitals, Schools, Transit Hubs) ────────
export const CHENNAI_POIS: POIZone[] = [
  { id: "poi-hosp-1", name: "MIOT International Hospital", category: "hospital", lat: 13.0189, lng: 80.1878, radius_m: 1500, rpi_boost: 15 },
  { id: "poi-hosp-2", name: "Apollo Main Hospital Greams Rd", category: "hospital", lat: 13.0602, lng: 80.2520, radius_m: 1500, rpi_boost: 15 },
  { id: "poi-hosp-3", name: "Fortis Malar Hospital Adyar", category: "hospital", lat: 13.0035, lng: 80.2560, radius_m: 1500, rpi_boost: 15 },
  { id: "poi-hosp-4", name: "Madras Medical College & RGGGH", category: "hospital", lat: 13.0805, lng: 80.2780, radius_m: 1500, rpi_boost: 15 },
  { id: "poi-hosp-5", name: "SRM Medical College & Hospital", category: "hospital", lat: 12.8235, lng: 80.0435, radius_m: 1500, rpi_boost: 15 },
  { id: "poi-sch-1",  name: "D.A.V. Senior Secondary School T.Nagar", category: "school", lat: 13.0420, lng: 80.2335, radius_m: 1000, rpi_boost: 10 },
  { id: "poi-sch-2",  name: "Kendriya Vidyalaya Anna Nagar", category: "school", lat: 13.0870, lng: 80.2135, radius_m: 1000, rpi_boost: 10 },
  { id: "poi-sch-3",  name: "SRM Public School Potheri", category: "school", lat: 12.8240, lng: 80.0450, radius_m: 1000, rpi_boost: 10 },
  { id: "poi-edu-1",  name: "Anna University Guindy Campus", category: "college", lat: 13.0125, lng: 80.2355, radius_m: 1200, rpi_boost: 10 },
  { id: "poi-edu-2",  name: "IIT Madras Zone", category: "college", lat: 12.9915, lng: 80.2337, radius_m: 1200, rpi_boost: 8 },
  { id: "poi-hub-1",  name: "Koyambedu CMBT Terminal", category: "transit", lat: 13.0694, lng: 80.1948, radius_m: 1200, rpi_boost: 5 },
  { id: "poi-hub-2",  name: "Guindy Kathipara Cloverleaf", category: "transit", lat: 13.0067, lng: 80.2030, radius_m: 1000, rpi_boost: 5 },
];

/**
 * Calculates POI proximity boost for any coordinate in Chennai.
 * Boosts +15 for Hospital / Emergency Zones, +10 for School Zones, +5 for Transit Hubs.
 */
export function calculatePOIBoost(lat: number, lng: number, baseRpi: number): {
  boostedRpi: number;
  boostApplied: number;
  nearbyPois: Array<{ name: string; category: POICategory; distance_m: number }>;
} {
  const nearby: Array<{ name: string; category: POICategory; distance_m: number; boost: number }> = [];

  for (const poi of CHENNAI_POIS) {
    // Equirectangular approximation for fast distance calculation
    const dLat = (poi.lat - lat) * 111139;
    const dLng = (poi.lng - lng) * 111139 * Math.cos((lat * Math.PI) / 180);
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);

    if (dist <= poi.radius_m) {
      nearby.push({ name: poi.name, category: poi.category, distance_m: dist, boost: poi.rpi_boost });
    }
  }

  // Take the highest single POI boost to prevent unbounded inflation, plus small fractional for multiple POIs
  nearby.sort((a, b) => b.boost - a.boost);
  const primaryBoost = nearby[0]?.boost || 0;
  const secondaryBoost = nearby.length > 1 ? Math.min(5, (nearby.length - 1) * 2) : 0;
  const totalBoost = primaryBoost + secondaryBoost;
  const boostedRpi = Math.min(100.0, Number((baseRpi + totalBoost).toFixed(1)));

  return {
    boostedRpi,
    boostApplied: totalBoost,
    nearbyPois: nearby.map(({ name, category, distance_m }) => ({ name, category, distance_m })),
  };
}

// Fallback seed data matching Chennai transit corridors enriched with POI prioritization
export const INITIAL_CLUSTERS: HazardCluster[] = [
  {
    id: "cl-0001",
    cluster_code: "WO-0001",
    defect_type: "D40",
    defect_name: "Pothole",
    severity_level: "critical",
    rpi_score: 94.5,
    rpi_boosted: 100.0,
    poi_boost_applied: 15,
    poi_tags: [{ name: "MIOT International Hospital", category: "hospital" }],
    pass_count: 7,
    road_name: "GST Road, Tambaram (NH-32)",
    classification: "National Highway (NH)",
    nearest_poi: "MIOT Hospital Corridor",
    poi_distance_m: 420.0,
    assigned_agency: "L&T Highways Infra Ltd",
    agency_phone: "+91 98401 22345",
    sla_hours: 24,
    sla_deadline_iso: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    status: "open",
    lat: 12.9516,
    lng: 80.1462,
    created_at: "5 Sept, 05:04 am",
    updated_at: "5 Sept, 05:04 am",
  },
  {
    id: "cl-0004",
    cluster_code: "WO-0004",
    defect_type: "D40",
    defect_name: "Pothole",
    severity_level: "critical",
    rpi_score: 88.0,
    rpi_boosted: 100.0,
    poi_boost_applied: 15,
    poi_tags: [
      { name: "SRM Medical College", category: "hospital" },
      { name: "SRM Public School", category: "school" }
    ],
    pass_count: 6,
    road_name: "SRM Institute / Potheri Highway",
    classification: "National Highway (NH)",
    nearest_poi: "SRM Medical College",
    poi_distance_m: 180.0,
    assigned_agency: "Chettinad Road Infra Pvt Ltd",
    agency_phone: "+91 97900 88990",
    sla_hours: 24,
    sla_deadline_iso: new Date(Date.now() + 14 * 3600 * 1000).toISOString(),
    status: "open",
    lat: 12.8231,
    lng: 80.0442,
    created_at: "5 Sept, 02:04 am",
    updated_at: "5 Sept, 02:04 am",
  },
  {
    id: "cl-0002",
    cluster_code: "WO-0002",
    defect_type: "D40",
    defect_name: "Pothole",
    severity_level: "critical",
    rpi_score: 89.2,
    rpi_boosted: 99.2,
    poi_boost_applied: 10,
    poi_tags: [{ name: "Anna University Guindy", category: "college" }],
    pass_count: 5,
    road_name: "Guindy Kathipara Grade Junction",
    classification: "Major Arterial",
    nearest_poi: "Anna University",
    poi_distance_m: 850.0,
    assigned_agency: "NHAI Metro Division Chennai",
    agency_phone: "+91 91760 55667",
    sla_hours: 12,
    sla_deadline_iso: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    status: "assigned",
    lat: 13.0067,
    lng: 80.2030,
    created_at: "5 Sept, 04:04 am",
    updated_at: "5 Sept, 04:15 am",
  },
  {
    id: "cl-0003",
    cluster_code: "WO-0003",
    defect_type: "D20",
    defect_name: "Alligator Crack",
    severity_level: "high",
    rpi_score: 82.1,
    rpi_boosted: 97.1,
    poi_boost_applied: 15,
    poi_tags: [{ name: "Apollo Main Hospital", category: "hospital" }],
    pass_count: 4,
    road_name: "Anna Salai (Mount Road)",
    classification: "Major Arterial",
    nearest_poi: "Apollo Hospital, Greams Rd",
    poi_distance_m: 310.0,
    assigned_agency: "GMR Urban Highways Ltd",
    agency_phone: "+91 98840 77890",
    sla_hours: 24,
    sla_deadline_iso: new Date(Date.now() + 19 * 3600 * 1000).toISOString(),
    status: "open",
    lat: 13.0604,
    lng: 80.2496,
    created_at: "5 Sept, 03:04 am",
    updated_at: "5 Sept, 03:04 am",
  },
  {
    id: "cl-0007",
    cluster_code: "WO-0007",
    defect_type: "D40",
    defect_name: "Pothole",
    severity_level: "high",
    rpi_score: 79.8,
    rpi_boosted: 94.8,
    poi_boost_applied: 15,
    poi_tags: [{ name: "Fortis Malar Hospital", category: "hospital" }],
    pass_count: 3,
    road_name: "Velachery Main Road",
    classification: "Suburban Arterial",
    nearest_poi: "Fortis Malar Hospital",
    poi_distance_m: 1400.0,
    assigned_agency: "Chennai Corp Zone 13 (Adyar)",
    agency_phone: "+91 94451 90013",
    sla_hours: 72,
    sla_deadline_iso: new Date(Date.now() + 42 * 3600 * 1000).toISOString(),
    status: "open",
    lat: 12.9815,
    lng: 80.2180,
    created_at: "4 Sept, 11:04 pm",
    updated_at: "4 Sept, 11:04 pm",
  },
  {
    id: "cl-0008",
    cluster_code: "WO-0008",
    defect_type: "D20",
    defect_name: "Alligator Crack",
    severity_level: "high",
    rpi_score: 76.2,
    rpi_boosted: 86.2,
    poi_boost_applied: 10,
    poi_tags: [{ name: "D.A.V. Senior Secondary School", category: "school" }],
    pass_count: 5,
    road_name: "T. Nagar Usman Road Commercial",
    classification: "Commercial Transit Corridor",
    nearest_poi: "D.A.V. School Link",
    poi_distance_m: 920.0,
    assigned_agency: "Chennai Corp Zone 10 (T.Nagar)",
    agency_phone: "+91 94451 90010",
    sla_hours: 48,
    sla_deadline_iso: new Date(Date.now() + 28 * 3600 * 1000).toISOString(),
    status: "open",
    lat: 13.0418,
    lng: 80.2341,
    created_at: "4 Sept, 10:04 pm",
    updated_at: "4 Sept, 10:04 pm",
  },
  {
    id: "cl-0005",
    cluster_code: "WO-0005",
    defect_type: "D10",
    defect_name: "Transverse Crack",
    severity_level: "high",
    rpi_score: 74.5,
    rpi_boosted: 82.5,
    poi_boost_applied: 8,
    poi_tags: [{ name: "IIT Madras Tech Park", category: "college" }],
    pass_count: 3,
    road_name: "Old Mahabalipuram Road (OMR)",
    classification: "State Highway (SH)",
    nearest_poi: "IIT Madras Zone",
    poi_distance_m: 1200.0,
    assigned_agency: "Tamil Nadu Road Dev Corp (TNRDC)",
    agency_phone: "+91 99400 33445",
    sla_hours: 48,
    sla_deadline_iso: new Date(Date.now() + 35 * 3600 * 1000).toISOString(),
    status: "assigned",
    lat: 12.9719,
    lng: 80.2500,
    created_at: "5 Sept, 01:04 am",
    updated_at: "5 Sept, 01:30 am",
  },
  {
    id: "cl-0006",
    cluster_code: "WO-0006",
    defect_type: "D00",
    defect_name: "Surface Line Crack",
    severity_level: "medium",
    rpi_score: 68.4,
    rpi_boosted: 83.4,
    poi_boost_applied: 15,
    poi_tags: [{ name: "Madras Medical College", category: "hospital" }],
    pass_count: 4,
    road_name: "Poonamallee High Road",
    classification: "Major Arterial",
    nearest_poi: "Madras Medical College",
    poi_distance_m: 650.0,
    assigned_agency: "Tamil Nadu PWD Division 4",
    agency_phone: "+91 94440 12890",
    sla_hours: 48,
    status: "resolved",
    lat: 13.0827,
    lng: 80.2707,
    created_at: "4 Sept, 08:30 pm",
    updated_at: "5 Sept, 06:00 am",
  },
  {
    id: "cl-0009",
    cluster_code: "WO-0009",
    defect_type: "D00",
    defect_name: "Surface Line Crack",
    severity_level: "low",
    rpi_score: 52.0,
    rpi_boosted: 62.0,
    poi_boost_applied: 10,
    poi_tags: [{ name: "Kendriya Vidyalaya", category: "school" }],
    pass_count: 2,
    road_name: "Anna Nagar 2nd Avenue",
    classification: "Major Arterial",
    nearest_poi: "Kendriya Vidyalaya",
    poi_distance_m: 1600.0,
    assigned_agency: "Chennai Corp Zone 8 (Anna Nagar)",
    agency_phone: "+91 94451 90008",
    sla_hours: 72,
    status: "resolved",
    lat: 13.0878,
    lng: 80.2140,
    created_at: "4 Sept, 06:15 pm",
    updated_at: "5 Sept, 05:30 am",
  }
];

export const INITIAL_FLEET: FleetNode[] = [
  {
    id: "BUS-TN01-1042",
    route_name: "GST Road, Tambaram (NH-32)",
    route_code: "Route 21G: Tambaram ➔ Broadway via NH-32 GST Road",
    vehicle_type: "MTC Public Transit Bus",
    npu_hardware: "Rockchip RK3588 NPU (6 TOPS)",
    camera_model: "Sony IMX335 1080p HDR",
    is_online: true,
    speed_kmh: 42.0,
    lat: 12.9516,
    lng: 80.1462,
    heading: 45.0,
    last_ping_at: "2m ago",
    raw_ingests_count: 18,
    edge_fps: 28.4,
    imu_jerk_gz: 0.98,
  },
  {
    id: "BUS-TN02-3891",
    route_name: "Guindy Kathipara Grade Junction",
    route_code: "Route 570: CMBT ➔ Siruseri IT Park via Kathipara & OMR",
    vehicle_type: "MTC Public Transit Bus",
    npu_hardware: "Raspberry Pi 4 + Coral TPU",
    camera_model: "Sony IMX335 1080p HDR",
    is_online: true,
    speed_kmh: 36.5,
    lat: 13.0067,
    lng: 80.2030,
    heading: 130.0,
    last_ping_at: "4m ago",
    raw_ingests_count: 15,
    edge_fps: 24.0,
    imu_jerk_gz: 1.02,
  },
  {
    id: "MUNICIPAL-TRUCK-07",
    route_name: "SRM Institute / Potheri Highway",
    route_code: "Municipal Arterial PWD Maintenance Patrol 07",
    vehicle_type: "Municipal Utility Carrier",
    npu_hardware: "Rockchip RK3588 (6 TOPS)",
    camera_model: "Sony IMX335 1080p HDR",
    is_online: true,
    speed_kmh: 48.0,
    lat: 12.8231,
    lng: 80.0442,
    heading: 210.0,
    last_ping_at: "6m ago",
    raw_ingests_count: 14,
    edge_fps: 29.1,
    imu_jerk_gz: 0.95,
  },
  {
    id: "PATROL-VAN-12",
    route_name: "Anna Salai (Mount Road)",
    route_code: "Traffic Enforcement Interceptor Patrol 12",
    vehicle_type: "Traffic Police Patrol Van",
    npu_hardware: "Jetson Orin Nano (40 TOPS)",
    camera_model: "Sony IMX335 1080p HDR Dual",
    is_online: true,
    speed_kmh: 28.0,
    lat: 13.0604,
    lng: 80.2496,
    heading: 35.0,
    last_ping_at: "8m ago",
    raw_ingests_count: 10,
    edge_fps: 30.0,
    imu_jerk_gz: 0.99,
  },
  {
    id: "BUS-TN22-5501",
    route_name: "Old Mahabalipuram Road (OMR)",
    route_code: "Route 102: Broadway ➔ Kelambakkam via OMR IT Corridor",
    vehicle_type: "MTC Express Transit",
    npu_hardware: "Rockchip RK3588 (6 TOPS)",
    camera_model: "Sony IMX335 1080p HDR",
    is_online: true,
    speed_kmh: 50.0,
    lat: 12.9719,
    lng: 80.2500,
    heading: 180.0,
    last_ping_at: "10m ago",
    raw_ingests_count: 7,
    edge_fps: 27.5,
    imu_jerk_gz: 1.01,
  },
];

export const INITIAL_CORRIDORS: CorridorRisk[] = [
  {
    corridor_name: "GST Road (NH-32)",
    classification: "National Highway corridor connecting airport & southern hubs",
    description: "Primary north-south freight and airport artery",
    clusters_count: 1,
    raw_ingests: 7,
    critical_d40_count: 1,
    average_rpi: 94.5,
    action_status: "PRIORITY DISPATCH",
  },
  {
    corridor_name: "Kathipara Cloverleaf Junction",
    classification: "Largest grade-separated interchange in Asia",
    description: "Crucial Grade-separated transit junction",
    clusters_count: 1,
    raw_ingests: 5,
    critical_d40_count: 1,
    average_rpi: 89.2,
    action_status: "PRIORITY DISPATCH",
  },
  {
    corridor_name: "SRM / Potheri Highway",
    classification: "National Highway university & tech corridor",
    description: "High-volume suburban arterial with heavy bus traffic",
    clusters_count: 1,
    raw_ingests: 6,
    critical_d40_count: 1,
    average_rpi: 88.0,
    action_status: "PRIORITY DISPATCH",
  },
  {
    corridor_name: "Anna Salai (Mount Road)",
    classification: "Primary arterial CBD commercial corridor",
    description: "Central business spine of Chennai",
    clusters_count: 2,
    raw_ingests: 6,
    critical_d40_count: 0,
    average_rpi: 67.0,
    action_status: "NORMAL PATROL",
  },
  {
    corridor_name: "T. Nagar Usman Road",
    classification: "High-density commercial transit district",
    description: "Bustling retail zone with dense pedestrian movement",
    clusters_count: 1,
    raw_ingests: 5,
    critical_d40_count: 0,
    average_rpi: 76.2,
    action_status: "NORMAL PATROL",
  },
  {
    corridor_name: "Old Mahabalipuram Road (OMR)",
    classification: "Expressway IT Corridor connecting tech parks",
    description: "Multi-lane expressway serving IT SEZs",
    clusters_count: 1,
    raw_ingests: 3,
    critical_d40_count: 0,
    average_rpi: 74.5,
    action_status: "NORMAL PATROL",
  },
  {
    corridor_name: "Velachery Main Road",
    classification: "High-traffic southern suburban residential arterial",
    description: "Monsoon flood prone arterial connector",
    clusters_count: 1,
    raw_ingests: 3,
    critical_d40_count: 0,
    average_rpi: 79.8,
    action_status: "NORMAL PATROL",
  },
  {
    corridor_name: "Poonamallee High Road",
    classification: "Western radial arterial artery",
    description: "Heavy logistics and hospital transit artery",
    clusters_count: 1,
    raw_ingests: 4,
    critical_d40_count: 0,
    average_rpi: 68.4,
    action_status: "NORMAL PATROL",
  },
];

export const INITIAL_METRICS: MetricSummary = {
  total_ingests: 64,
  dbscan_clusters: 9,
  critical_hazards: 14,
  active_fleet_nodes: 5,
  deduplication_ratio: 85.9,
  avg_priority_score: 78.3,
  ingest_sparkline: [32, 45, 48, 52, 58, 61, 64],
  cluster_sparkline: [6, 7, 7, 8, 8, 9, 9],
};

export const INITIAL_AUDIT_LOGS: PerceptionLogEntry[] = [
  {
    id: "log-1",
    timestamp: "Just now",
    bus_id: "BUS-TN01-1042",
    corridor: "GST Road (NH-32)",
    message: "Ingested GPS telemetry pass from MTC Bus #1042 on GST Road (NH-32) • 5Hz coordinate lock confirmed.",
    latency_ms: 72,
    type: "FLEET TELEMETRY"
  },
  {
    id: "log-2",
    timestamp: "1m ago",
    bus_id: "BUS-TN02-3891",
    corridor: "Kathipara Grade Junction",
    message: "DBSCAN 15m cluster verified: Pothole confirmed with 5 fleet passes.",
    latency_ms: 85,
    type: "SPATIAL DEDUP"
  },
  {
    id: "log-3",
    timestamp: "3m ago",
    bus_id: "PATROL-VAN-12",
    corridor: "Anna Salai (Mount Road)",
    message: "Edge NPU INT8 inference cycle completed at 30.0 FPS. Zero frame drop.",
    latency_ms: 68,
    type: "EDGE INFERENCE"
  }
];

export const HARDWARE_BOM: HardwareBOMItem[] = [
  {
    id: "optics",
    category: "OPTICS",
    title: "Optics & Vision Sensor Module",
    component: "Sony IMX335 1080p HDR CMOS Sensor",
    cost_inr: 650,
    specs: {
      "Resolution": "1920x1080 @ 30 FPS",
      "Dynamic Range": "120 dB True WDR",
      "Low-Light Sensitivity": "0.005 Lux Starlight"
    },
    description: "Wide-angle 120° FOV lens with dynamic auto-exposure and anti-glare polarization filter. Calibrated specifically for Indian road asphalt variations, monsoon water-reflection compensation, and bright tropical sunlight.",
    tier: "Production Prototype"
  },
  {
    id: "compute",
    category: "AI COMPUTE",
    title: "Neural Processing Unit (NPU) & Edge Compute",
    component: "Rockchip RK3588 NPU (6 TOPS) / ARM Cortex-A76",
    cost_inr: 1250,
    specs: {
      "Architecture": "Quad-core A76 + Quad-core A55",
      "NPU Throughput": "6.0 TOPS INT8 Peak",
      "Power Draw": "6.5W Max Sustained"
    },
    description: "Heterogeneous neural compute unit running quantized INT8 YOLO11 models for road defect classification and ByteTrack vehicle tracking.",
    tier: "Automotive Edge SBC"
  },
  {
    id: "positioning",
    category: "POSITIONING",
    title: "GNSS High-Precision Satellite Positioning",
    component: "u-blox NEO-6M High-Sensitivity GPS Engine",
    cost_inr: 350,
    specs: {
      "Update Rate": "5 Hz Real-Time Fix",
      "Accuracy": "1.5m CEP (SBAS Enabled)",
      "Constellations": "GPS + GLONASS + NavIC"
    },
    description: "High-gain active ceramic patch antenna module maintaining continuous coordinate lock beneath dense metro pillars and multi-level flyovers.",
    tier: "Industrial Grade"
  },
  {
    id: "telemetry",
    category: "TELEMETRY",
    title: "Cellular Modem & Store-and-Forward Flash",
    component: "Quectel 4G LTE eSIM + 32GB High-Endurance eMMC",
    cost_inr: 400,
    specs: {
      "Cellular Bands": "LTE Cat 4 (150 Mbps DL / 50 Mbps UL)",
      "Security": "Hardware TLS 1.3 / DTLS 1.2",
      "Offline Storage": "32GB Industrial eMMC (500k events)"
    },
    description: "MQTT-over-TLS telemetry transmission pipeline with local SQLite store-and-forward fallback for cellular dead zones.",
    tier: "Automotive Grade"
  },
  {
    id: "power",
    category: "POWER & CASING",
    title: "Automotive Power & IP67 Rugged Enclosure",
    component: "12V/24V Vehicle Regulator & Polycarbonate Shell",
    cost_inr: 200,
    specs: {
      "Input Voltage": "9V - 36V Wide Input",
      "Protection": "Surge, Reverse Polarity, Over-temp",
      "Ingress Protection": "IP67 Dust & Water Resistant"
    },
    description: "Custom vibration-damped polycarbonate windshield suction mount engineered for Indian pothole vibration resistance.",
    tier: "Ruggedized Transit"
  }
];

export const INITIAL_INCIDENTS: TrafficIncident[] = [
  {
    id: "inc-001",
    reporting_bus_id: "BUS-TN01-1042",
    incident_type: "HIT_AND_RUN",
    plate_number: "TN-09-CB-4412",
    plate_confidence: 0.96,
    vehicle_color: "Black",
    vehicle_class: "SUV (Scorpio)",
    target_speed_kmh: 84.5,
    is_intercepted: false,
    pcr_unit_assigned: "PCR-DELTA-09 (Guindy Station)",
    pcr_dispatch_time: "5 Sept, 05:14 am",
    road_name: "GST Road, Tambaram (NH-32)",
    lat: 12.9535,
    lng: 80.1478,
    occurred_at: "5 Sept, 05:12 am",
    status: "ACTIVE_ALERT",
    mva_section: "MVA 1988 Sec 134(a)(b) & Sec 184 (Hit & Run)",
    fine_amount_inr: 10000,
    description: "High-speed side impact with two-wheeler followed by non-stop evasion towards Airport Flyover."
  },
  {
    id: "inc-002",
    reporting_bus_id: "BUS-TN02-3891",
    incident_type: "ZEBRA_CROSSING_ENCROACHMENT",
    plate_number: "TN-01-AX-8732",
    plate_confidence: 0.95,
    vehicle_color: "Pearl White",
    vehicle_class: "Private Compact SUV (Hyundai Creta)",
    target_speed_kmh: 0,
    is_intercepted: true,
    echallan_issued: true,
    echallan_id: "ECH-CH-2026-99042",
    echallan_timestamp: "5 Sept, 05:19 am",
    mva_section: "MVA 1988 Sec 177 & CMVR Rule 138 (Pedestrian Safety)",
    fine_amount_inr: 1500,
    road_name: "Anna Salai near Thousand Lights Crossing",
    lat: 13.0604,
    lng: 80.2520,
    occurred_at: "5 Sept, 05:18 am",
    status: "RESOLVED",
    description: "Vehicle halted directly inside marked zebra pedestrian crosswalk during active pedestrian walk phase."
  },
  {
    id: "inc-003",
    reporting_bus_id: "MUNICIPAL-TRUCK-07",
    incident_type: "WATERLOGGING",
    plate_number: undefined,
    vehicle_class: "Critical Flood Pool",
    water_depth_cm: 28,
    pump_deployed: false,
    pump_id: "GCC-PUMP-UNIT-04",
    dewatering_eta_mins: 18,
    road_name: "Velachery Main Road (Near Lake Link Canal)",
    lat: 12.9750,
    lng: 80.2180,
    occurred_at: "5 Sept, 05:25 am",
    status: "ACTIVE_ALERT",
    description: "Severe stormwater accumulation across 2 lanes. Hydroplaning warning threshold exceeded (>120mm)."
  },
  {
    id: "inc-004",
    reporting_bus_id: "BUS-TN03-9021",
    incident_type: "RASH_DRIVING",
    plate_number: "TN-07-BW-9921",
    plate_confidence: 0.94,
    vehicle_color: "Metallic Silver",
    vehicle_class: "Commercial Sedan (Swift Dzire)",
    target_speed_kmh: 92.0,
    is_intercepted: false,
    echallan_issued: true,
    echallan_id: "ECH-CH-2026-99043",
    mva_section: "MVA 1988 Sec 183 (Excess Speed) & Sec 184 (Dangerous Driving)",
    fine_amount_inr: 5000,
    road_name: "Guindy Kathipara Grade Junction (Ramp 3)",
    lat: 13.0078,
    lng: 80.2045,
    occurred_at: "5 Sept, 05:32 am",
    status: "ACTIVE_ALERT",
    description: "Speed radar clocked at 92 km/h in 50 km/h municipal flyover interchange zone with aggressive lane weaving."
  },
  {
    id: "inc-005",
    reporting_bus_id: "BUS-TN22-5501",
    incident_type: "BUS_LANE_ENCROACHMENT",
    plate_number: "TN-10-EA-4109",
    plate_confidence: 0.97,
    vehicle_color: "Red",
    vehicle_class: "Private Hatchback (Polo)",
    target_speed_kmh: 46.0,
    is_intercepted: true,
    echallan_issued: true,
    echallan_id: "ECH-CH-2026-99044",
    mva_section: "MVA Sec 177 & GCC Dedicated BRTS Regulations",
    fine_amount_inr: 2000,
    road_name: "OMR IT Expressway (Tidel Park Dedicated Bus Corridor)",
    lat: 12.9719,
    lng: 80.2500,
    occurred_at: "5 Sept, 05:42 am",
    status: "RESOLVED",
    description: "Unauthorized private vehicle obstruction inside green-painted MTC transit right-of-way."
  },
  {
    id: "inc-006",
    reporting_bus_id: "BUS-TN04-7719",
    incident_type: "OPEN_MANHOLE",
    plate_number: undefined,
    vehicle_class: "Exposed Storm Drain Pit (Diameter 65cm)",
    work_order_id: "WO-MANHOLE-8812",
    road_name: "Poonamallee High Road (Near Central Railway)",
    lat: 13.0827,
    lng: 80.2707,
    occurred_at: "5 Sept, 05:48 am",
    status: "ACTIVE_ALERT",
    description: "Missing cast-iron manhole cover creating immediate fatality hazard for two-wheelers and pedestrians."
  },
  {
    id: "inc-007",
    reporting_bus_id: "BUS-TN01-1042",
    incident_type: "POTHOLE_D40",
    plate_number: undefined,
    vehicle_class: "Severe Cavity (Depth 9.2cm, 42.5 Liters)",
    work_order_id: "WO-0001",
    road_name: "GST Road Tambaram Flyover Descent",
    lat: 12.9516,
    lng: 80.1462,
    occurred_at: "5 Sept, 05:52 am",
    status: "ACTIVE_ALERT",
    description: "High vertical G-force impact (2.85 Gz) detected by MTC bus IMU. Surface asphalt displacement."
  }
];

export const INITIAL_ROAD_MEMORY_CORRIDORS: RoadMemoryCorridor[] = [
  {
    id: 'corridor-gst',
    name: 'Grand Southern Trunk Road (GST / NH-45)',
    classification: 'National Highway / Arterial Core',
    length_km: 18.4,
    health_score: 74,
    first_monitored_date: '2025-11-14',
    last_updated: 'Just now (12m ago via MTC 1042)',
    total_confirmations: 4290,
    recurrence_rate_pct: 16.2,
    repair_durability_score: 83.8,
    monsoon_risk_index: 'HIGH',
    pothole_count: 14,
    waterlog_count: 5,
    crack_count: 22,
    active_work_orders: 4,
    nearby_vulnerable_zones: ['Tambaram Bus Depot Junction', 'Chromepet Underpass', 'Sanatorium Flyover'],
    timeline: [
      {
        id: 'ev-1',
        date: 'Today, 11:42 AM',
        type: 'MULTI_BUS_CONFIRM',
        title: 'Multi-Bus Cross-Verification (3+ Units)',
        description: 'Buses BUS-TN01-1042, BUS-TN01-1088, and BUS-TN01-2015 confirmed persistent longitudinal cracking near Chromepet Bridge at 12.9518° N, 80.1412° E.',
        buses_involved: ['BUS-TN01-1042', 'BUS-TN01-1088', 'BUS-TN01-2015'],
        pass_count: 28
      },
      {
        id: 'ev-2',
        date: 'Yesterday, 04:15 PM',
        type: 'WATERLOG',
        title: 'Monsoon Depression Waterlogging Spike',
        description: 'Surface water depth estimated > 120mm following localized thunderstorm. Sensor flagged elevated hydroplaning risk for high-speed corridor traffic.',
        severity: 'critical',
        buses_involved: ['BUS-TN01-1042']
      },
      {
        id: 'ev-3',
        date: '3 Days Ago',
        type: 'WORK_ORDER',
        title: 'Automated PWD / NHAI Work Order #WO-GST-881 Generated',
        description: 'Auto-triaged by RoadSaarthi AI to Tambaram Municipal Zone Maintenance Unit. Target SLA: 48h emergency patching.',
        severity: 'high'
      },
      {
        id: 'ev-4',
        date: '2 Weeks Ago',
        type: 'REPAIR_DONE',
        title: 'Cold-Mix Asphalt Patch Applied & Closed',
        description: 'Field repair team completed mastic asphalt filling. Post-repair inspection pending continuous bus telemetry pass verification.',
        severity: 'low'
      },
      {
        id: 'ev-5',
        date: '3 Weeks Ago',
        type: 'DETECTION',
        title: 'Initial Edge Detection (YOLOv8-RoadDefect)',
        description: 'Edge Dashcam on MTC Express route detected severe pothole cluster (depth 65mm, radius 40cm) at 48 km/h.',
        severity: 'high',
        buses_involved: ['BUS-TN01-1042']
      }
    ]
  },
  {
    id: 'corridor-omr',
    name: 'Rajiv Gandhi IT Expressway (OMR / SH-49A)',
    classification: 'State Highway / Urban IT Expressway',
    length_km: 21.0,
    health_score: 86,
    first_monitored_date: '2025-10-02',
    last_updated: '28m ago via MTC 2015',
    total_confirmations: 6810,
    recurrence_rate_pct: 9.4,
    repair_durability_score: 91.2,
    monsoon_risk_index: 'MEDIUM',
    pothole_count: 6,
    waterlog_count: 2,
    crack_count: 11,
    active_work_orders: 2,
    nearby_vulnerable_zones: ['Tidel Park Underpass', 'Thoraipakkam Toll Plaza', 'Siruseri SIPCOT'],
    timeline: [
      {
        id: 'omr-ev-1',
        date: 'Today, 09:20 AM',
        type: 'MULTI_BUS_CONFIRM',
        title: 'Routine Surface Roughness Survey',
        description: 'Continuous accelerometry (IRI estimated 2.3 m/km) indicates stable riding surface along Madhya Kailash to Perungudi stretch.',
        buses_involved: ['BUS-TN01-2015', 'BUS-TN01-3044'],
        pass_count: 64
      },
      {
        id: 'omr-ev-2',
        date: '5 Days Ago',
        type: 'REPAIR_DONE',
        title: 'Mastic Seal Coat Completed',
        description: 'GCC engineering wing completed micro-surfacing on IT Corridor Service Lane following citizen and bus telemetric alerts.',
        severity: 'low'
      },
      {
        id: 'omr-ev-3',
        date: '10 Days Ago',
        type: 'DETECTION',
        title: 'Manhole Cover Depression Detected',
        description: 'Edge camera detected 70mm drop around storm drainage manhole slab near Sholinganallur junction.',
        severity: 'medium',
        buses_involved: ['BUS-TN01-2015']
      }
    ]
  },
  {
    id: 'corridor-kathipara',
    name: 'Kathipara Interchange & Inner Ring Road',
    classification: 'Multi-Level Grade Separator & Arterial',
    length_km: 8.6,
    health_score: 68,
    first_monitored_date: '2025-09-18',
    last_updated: '5m ago via MTC 1088',
    total_confirmations: 8940,
    recurrence_rate_pct: 23.5,
    repair_durability_score: 76.5,
    monsoon_risk_index: 'HIGH',
    pothole_count: 19,
    waterlog_count: 8,
    crack_count: 34,
    active_work_orders: 6,
    nearby_vulnerable_zones: ['Guindy Industrial Estate Link', 'Airport Grade Descent', 'Alandur Metro Slipway'],
    timeline: [
      {
        id: 'kat-1',
        date: 'Today, 01:10 PM',
        type: 'RISK_SPIKE',
        title: 'Expansion Joint Shear Stress Alert',
        description: 'Repeated vertical accelerometer spike (>0.85g) detected across Flyover Ramp 3 expansion finger joint under heavy axle bus transit.',
        severity: 'critical',
        buses_involved: ['BUS-TN01-1088', 'BUS-TN01-1042'],
        pass_count: 52
      },
      {
        id: 'kat-2',
        date: '2 Days Ago',
        type: 'RECURRENCE',
        title: 'Recurring Pothole Cluster Post-Rain',
        description: 'Same location (#DEF-8831) previously patched on Nov 12 re-emerged due to water ingress beneath sub-base layer.',
        severity: 'high',
        buses_involved: ['BUS-TN01-1088']
      },
      {
        id: 'kat-3',
        date: '1 Week Ago',
        type: 'WORK_ORDER',
        title: 'Emergency Milling & Asphalt Overlay Scheduled',
        description: 'Tender assigned to Highway Maintenance Zone 2 with strict IRC:SP:20 compliance.',
        severity: 'medium'
      }
    ]
  },
  {
    id: 'corridor-anna',
    name: 'Anna Salai (Mount Road - Central to Guindy)',
    classification: 'Metropolitan Primary Arterial',
    length_km: 14.2,
    health_score: 81,
    first_monitored_date: '2025-08-10',
    last_updated: '45m ago via MTC 3044',
    total_confirmations: 11200,
    recurrence_rate_pct: 12.1,
    repair_durability_score: 87.9,
    monsoon_risk_index: 'MEDIUM',
    pothole_count: 8,
    waterlog_count: 3,
    crack_count: 15,
    active_work_orders: 3,
    nearby_vulnerable_zones: ['Nandanam Signal', 'Thousand Lights Metro', 'Saidapet Bridge'],
    timeline: [
      {
        id: 'anna-1',
        date: 'Today, 10:05 AM',
        type: 'MULTI_BUS_CONFIRM',
        title: 'Bus Lane Thermoplastic Marking Integrity',
        description: 'Bus camera optical analysis detected 82% retroreflectivity retention along Dedicated Bus Lane markings.',
        buses_involved: ['BUS-TN01-3044'],
        pass_count: 89
      },
      {
        id: 'anna-2',
        date: '4 Days Ago',
        type: 'REPAIR_DONE',
        title: 'Utility Cut Reinstatement Verified',
        description: 'Metro Water trenching reinstatement verified closed with continuous levelness compliance.',
        severity: 'low'
      }
    ]
  }
];

class ApiService {
  private isServerHealthy = true;

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/telemetry/metrics`, { signal: AbortSignal.timeout(1500) });
      this.isServerHealthy = res.ok;
      return res.ok;
    } catch {
      this.isServerHealthy = false;
      return false;
    }
  }

  async getMetrics(): Promise<MetricSummary> {
    try {
      const res = await fetch(`${API_BASE}/telemetry/metrics`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return INITIAL_METRICS;
  }

  async getClusters(): Promise<HazardCluster[]> {
    try {
      const res = await fetch(`${API_BASE}/clusters`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return INITIAL_CLUSTERS;
  }

  async updateClusterStatus(
    orderId: string, 
    status: WorkOrderStatus,
    beforeImageUrl?: string,
    afterImageUrl?: string,
    fieldNotes?: string
  ): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/work-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status,
          before_image_url: beforeImageUrl,
          after_image_url: afterImageUrl,
          field_notes: fieldNotes
        })
      });
      return res.ok;
    } catch {
      return false;
    }
  }

    async simulateAutoLifecycle(defectType: string = 'D40', corridorName?: string): Promise<any> {
    try {
      const query = new URLSearchParams({ defect_type: defectType });
      if (corridorName) query.append('corridor_name', corridorName);
      const res = await fetch(`${API_BASE}/telemetry/simulate-auto-lifecycle?${query.toString()}`, {
        method: 'POST'
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Using local simulated auto-lifecycle handler:", e);
    }
    return { status: "success", message: "Auto-lifecycle triggered" };
  }

    async triggerSensorFusion(busId: string = 'BUS-TN01-1042', gz: number = 1.65): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/telemetry/sensor-fusion-trigger?bus_id=${busId}&vertical_gz=${gz}`, {
        method: 'POST'
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Using local simulated sensor fusion handler:", e);
    }
    return {
      status: "DEFECT_CONFIRMED",
      cell_id: "H3_15M_96052_59371",
      bus_id: busId,
      defect_type: "D40",
      defect_name: "Pothole",
      vertical_gz: gz,
      optical_confidence: 0.984,
      multi_bus_consensus: true,
      confirming_buses_count: 3,
      latency_breakdown: {
        ais140_tcp_ingest_ms: 10.4,
        h3_spatial_hash_ms: 1.8,
        rtsp_keyframe_fetch_ms: 16.2,
        yolo_gpu_inference_ms: 6.4,
        ws_broadcast_ms: 5.1,
        total_end_to_end_ms: 39.9
      },
      snapshot_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80"
    };
  }

  async getSensorFusionMetrics(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/telemetry/fusion-metrics`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return {
      avg_end_to_end_latency_ms: 39.4,
      p99_latency_ms: 43.8,
      accuracy_pct: 99.4,
      total_sensor_triggers: 1420,
      false_alarms_filtered: 214,
      zero_new_hardware: true
    };
  }

  async triggerDeduplication(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/telemetry/deduplicate`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return { status: 'success', eps_meters: 15.0 };
  }

  async getFleetNodes(): Promise<FleetNode[]> {
    try {
      const res = await fetch(`${API_BASE}/fleet`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return INITIAL_FLEET;
  }

  async getCorridors(): Promise<CorridorRisk[]> {
    try {
      const res = await fetch(`${API_BASE}/analytics/corridors`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return INITIAL_CORRIDORS;
  }

  async getAuditLogs(): Promise<PerceptionLogEntry[]> {
    try {
      const res = await fetch(`${API_BASE}/telemetry/audit-logs`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return INITIAL_AUDIT_LOGS;
  }

  async ingestTelemetry(data: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/telemetry/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return { status: 'simulated_local' };
  }

  async getIncidents(): Promise<TrafficIncident[]> {
    try {
      const res = await fetch(`${API_BASE}/incidents`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return INITIAL_INCIDENTS;
  }

  async createIncident(incident: Partial<TrafficIncident>): Promise<TrafficIncident> {
    try {
      const res = await fetch(`${API_BASE}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incident)
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    const fallback: TrafficIncident = {
      id: `inc-${Date.now().toString(36)}`,
      reporting_bus_id: incident.reporting_bus_id || 'MOBILE-DASHCAM-01',
      incident_type: incident.incident_type || 'RASH_DRIVING',
      plate_number: incident.plate_number,
      plate_confidence: incident.plate_confidence ?? 0.95,
      vehicle_color: incident.vehicle_color,
      vehicle_class: incident.vehicle_class,
      target_speed_kmh: incident.target_speed_kmh ?? 0.0,
      is_intercepted: false,
      road_name: incident.road_name || 'Chennai Metropolitan Arterial',
      lat: incident.lat || 13.0067,
      lng: incident.lng || 80.2030,
      occurred_at: 'Just now',
      status: 'ACTIVE_ALERT'
    };
    return fallback;
  }

  async updateIncident(incidentId: string, status: string, isIntercepted?: boolean, interceptedBy?: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, is_intercepted: isIntercepted, intercepted_by: interceptedBy })
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getYoloStatus(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/telemetry/yolo/status`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return {
      engine: "YOLO Zebra Crossing Engine (Ready)",
      is_custom_model_loaded: false,
      target_task: "Zebra Crossing & Pedestrian Safety Markings (IRC:35)"
    };
  }

  async inferYolo(imageB64: string, roadName?: string, lat?: number, lng?: number, autoIngest = false): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('image_b64', imageB64);
      if (roadName) formData.append('road_name', roadName);
      if (lat) formData.append('lat', lat.toString());
      if (lng) formData.append('lng', lng.toString());
      if (autoIngest) formData.append('auto_ingest', 'true');

      const res = await fetch(`${API_BASE}/telemetry/yolo/infer`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback simulation if backend is offline
    }

    // Client-side fallback simulation for zebra crossing
    return {
      success: true,
      model_engine: "YOLOv8 Zebra Crossing Inference (Local)",
      detections_count: 1,
      inference_time_ms: 19.5,
      detections: [
        {
          class_id: 0,
          label: "zebra_crossing",
          defect_code: "ZEBRA_CROSSING",
          defect_name: "Zebra Crossing (Pedestrian Markings)",
          severity: "low",
          confidence: 0.93,
          bbox_normalized: { x: 0.5, y: 0.65, w: 0.68, h: 0.30 },
          bbox_pixels: [100, 280, 540, 420],
          irc35_compliance: "COMPLIANT - Standard 500mm white bars verified",
          recommended_action: "Pedestrian safety zone verified near school/hospital"
        }
      ]
    };
  }

  async getSafeCorridors(): Promise<SafeCorridor[]> {
    try {
      const res = await fetch(`${API_BASE}/analytics/safe-corridors`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return INITIAL_SAFE_CORRIDORS;
  }

  async getDarkSpots(): Promise<DarkSpotSegment[]> {
    try {
      const res = await fetch(`${API_BASE}/analytics/dark-spots`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return INITIAL_DARK_SPOTS;
  }

  async getContractorPenalties(): Promise<ContractorPenaltyDebit[]> {
    try {
      const res = await fetch(`${API_BASE}/analytics/recurrence-penalties`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return INITIAL_PENALTIES;
  }

  async getOpenManholes(): Promise<OpenManholeAlert[]> {
    try {
      const res = await fetch(`${API_BASE}/analytics/open-manholes`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {}
    return INITIAL_OPEN_MANHOLES;
  }

  async getRoadMemoryCorridors(): Promise<RoadMemoryCorridor[]> {
    try {
      const res = await fetch(`${API_BASE}/analytics/road-memory-corridors`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {}
    return INITIAL_ROAD_MEMORY_CORRIDORS;
  }

  async getSubmergedPotholes(): Promise<SubmergedPotholeAlert[]> {
    try {
      const res = await fetch(`${API_BASE}/analytics/submerged-potholes`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {}
    return INITIAL_SUBMERGED_POTHOLES;
  }

  async getObscuredSigns(): Promise<ObscuredSignAudit[]> {
    try {
      const res = await fetch(`${API_BASE}/analytics/obscured-signs`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {}
    return INITIAL_OBSCURED_SIGNS;
  }

  async getContractorDebarments(): Promise<ContractorDebarmentDossier[]> {
    try {
      const res = await fetch(`${API_BASE}/analytics/contractor-debarments`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {}
    return INITIAL_DEBARMENTS;
  }

  async getAsphaltQualityAudits(): Promise<AsphaltQualityAudit[]> {
    try {
      const res = await fetch(`${API_BASE}/analytics/asphalt-quality`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {}
    return INITIAL_ASPHALT_QC;
  }

  async getModelStatus(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/v1/models/status`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return await res.json();
    } catch {}
    return {
      total_models: 4,
      weights_directory: "backend/app/weights",
      models: {
        pothole_yolo: { name: "YOLOv8x-RoadDefect (Potholes & Cracks)", status: "ready", framework: "Ultralytics PyTorch", device: "CUDA:0 / CPU" },
        anpr_yolo: { name: "YOLOv8-ANPR + LPRNet (Indian Plates)", status: "ready", framework: "Ultralytics + STN-LPRNet", device: "CUDA:0 / CPU" },
        depth_3d: { name: "Depth-Anything-V2 (Metric Stereo)", status: "ready", framework: "PyTorch Vision Transformer", device: "CUDA:0 / CPU" },
        acoustic_imu: { name: "ResNet-1D-Acoustic (Axle Shock & Submerged Cavity)", status: "ready", framework: "1D-CNN PyTorch", device: "Edge MCU / CPU" }
      }
    };
  }

  async loadModelWeights(modelKey: string, modelPath: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/v1/models/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_key: modelKey, model_path: modelPath })
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, message: `Model ${modelKey} configured with path: ${modelPath}` };
  }

  async getActiveStreams(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/v1/streams/`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return await res.json();
    } catch {}
    return [
      {
        bus_id: "BUS-TN01-1042",
        stream_type: "RTSP_IP_CAMERA",
        rtsp_url: "rtsp://mtc-fleet.chennai.gov.in:554/bus1042/windshield",
        ais140_endpoint: "mqtt://ais140.transport.tn.gov.in:1883/MTC-118A",
        status: "STREAMING_LIVE",
        resolution: "1920x1080 (1080p)",
        current_fps: 30.0,
        latency_ms: 34,
        hardware_mode: "Zero-Hardware (Existing Nirbhaya IP Cam + AIS-140 eSIM)"
      }
    ];
  }

  async configureStream(config: { bus_id: string; stream_type?: string; video_url: string; ais140_url?: string; sampling_fps?: number }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/v1/streams/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, message: `Zero-Hardware Stream Connector registered for ${config.bus_id}` };
  }

  async analyzeLiveKeyframe(busId: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/v1/streams/analyze/${busId}`, {
        method: 'POST'
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.error('Failed to analyze live keyframe:', err);
    }
    return { success: false, error: 'Analysis failed' };
  }

  async probeStream(url: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/v1/streams/probe?url=${encodeURIComponent(url)}`);
      if (res.ok) return await res.json();
    } catch (err) {
      console.error('Failed to probe stream:', err);
    }
    return { reachable: false, message: 'Could not connect to backend stream probe' };
  }
}

export const INITIAL_SAFE_CORRIDORS: SafeCorridor[] = [
  {
    id: "sc-01",
    facility_name: "D.A.V. Senior Secondary School",
    category: "school",
    corridor_road: "Avvai Shanmugam Salai & Anna Salai Arterial",
    zone: "Zone 09 (Teynampet Central)",
    lat: 13.0450,
    lng: 80.2380,
    overall_score: 88.5,
    letter_grade: "A",
    zebra_crossing_status: "COMPLIANT",
    signage_status: "INSTALLED",
    footpath_clearance_pct: 86.0,
    speed_compliance_pct: 82.5,
    active_hazard_count: 0,
    recommended_work_order: "Routine quarterly thermoplastic retroreflectivity check per IRC:35",
    last_patrol_bus_id: "BUS-MTC-21G",
    last_audited_at: "Today, 07:45 AM IST"
  },
  {
    id: "sc-02",
    facility_name: "MIOT International Hospital",
    category: "hospital",
    corridor_road: "Mount-Poonamallee Arterial & GST Link",
    zone: "Zone 12 (Alandur Corridor)",
    lat: 13.0232,
    lng: 80.1872,
    overall_score: 64.0,
    letter_grade: "C",
    zebra_crossing_status: "FADED",
    signage_status: "MISSING",
    footpath_clearance_pct: 58.0,
    speed_compliance_pct: 61.0,
    active_hazard_count: 2,
    recommended_work_order: "Urgent: Install 'Hospital Quiet Zone' sign and repaint pedestrian crossing",
    last_patrol_bus_id: "BUS-MTC-19B",
    last_audited_at: "Today, 08:12 AM IST"
  },
  {
    id: "sc-03",
    facility_name: "SRM Public School & Institute",
    category: "school",
    corridor_road: "GST Road Corridor (NH-32 Potheri)",
    zone: "Zone 15 (Chengalpattu NHAI Division)",
    lat: 12.8236,
    lng: 80.0450,
    overall_score: 48.5,
    letter_grade: "F",
    zebra_crossing_status: "MISSING",
    signage_status: "MISSING",
    footpath_clearance_pct: 42.0,
    speed_compliance_pct: 49.0,
    active_hazard_count: 3,
    recommended_work_order: "CRITICAL VISION ZERO VIOLATION: Immediate zebra crossing installation & speed calm striping required",
    last_patrol_bus_id: "BUS-MTC-570",
    last_audited_at: "Today, 06:30 AM IST"
  },
  {
    id: "sc-04",
    facility_name: "Kendriya Vidyalaya Anna Nagar",
    category: "school",
    corridor_road: "2nd Avenue Arterial Road",
    zone: "Zone 08 (Anna Nagar West)",
    lat: 13.0890,
    lng: 80.2120,
    overall_score: 92.0,
    letter_grade: "A+",
    zebra_crossing_status: "COMPLIANT",
    signage_status: "INSTALLED",
    footpath_clearance_pct: 94.0,
    speed_compliance_pct: 88.0,
    active_hazard_count: 0,
    recommended_work_order: "Corridor fully compliant with MoRTH Vision Zero School Zone standards",
    last_patrol_bus_id: "BUS-MTC-1042",
    last_audited_at: "Yesterday, 04:15 PM IST"
  },
  {
    id: "sc-05",
    facility_name: "Madras Medical College & RGGGH",
    category: "hospital",
    corridor_road: "Poonamallee High Road & Central Station",
    zone: "Zone 05 (Royapuram & Central)",
    lat: 13.0805,
    lng: 80.2760,
    overall_score: 76.0,
    letter_grade: "B",
    zebra_crossing_status: "COMPLIANT",
    signage_status: "FADED",
    footpath_clearance_pct: 72.0,
    speed_compliance_pct: 75.0,
    active_hazard_count: 1,
    recommended_work_order: "Restripe faded 'Ambulance Entry' priority markings",
    last_patrol_bus_id: "BUS-MTC-21G",
    last_audited_at: "Today, 09:20 AM IST"
  }
];

export const INITIAL_DARK_SPOTS: DarkSpotSegment[] = [
  {
    id: "dsp-01",
    road_name: "Poonamallee High Road (Near Central Station link)",
    zone: "Zone 05 (Royapuram & Central)",
    length_meters: 120.0,
    avg_lux: 2.1,
    exposure_gain_score: 92.4,
    start_lat: 13.0815,
    start_lng: 80.2720,
    end_lat: 13.0830,
    end_lng: 80.2740,
    risk_level: "CRITICAL_UNLIT",
    nearby_poi: "Madras Medical College & Metro Sub-way",
    transit_routes: ["Route 21G", "Route 570"],
    identified_at: "Yesterday, 10:45 PM IST",
    ward_engineer_notified: true
  },
  {
    id: "dsp-02",
    road_name: "Guindy Industrial Estate Outer Link",
    zone: "Zone 13 (Adyar Corridor)",
    length_meters: 85.0,
    avg_lux: 3.4,
    exposure_gain_score: 84.1,
    start_lat: 13.0080,
    start_lng: 80.2060,
    end_lat: 13.0090,
    end_lng: 80.2075,
    risk_level: "HIGH_RISK",
    nearby_poi: "Guindy Metro Interchange (Women Commuter Corridor)",
    transit_routes: ["Route 19B", "Route 570"],
    identified_at: "Yesterday, 11:12 PM IST",
    ward_engineer_notified: true
  },
  {
    id: "dsp-03",
    road_name: "OMR Cyber Gateway Underpass Service Road",
    zone: "Zone 11 (OMR IT Corridor)",
    length_meters: 65.0,
    avg_lux: 1.8,
    exposure_gain_score: 95.0,
    start_lat: 12.9780,
    start_lng: 80.2450,
    end_lat: 12.9790,
    end_lng: 80.2460,
    risk_level: "CRITICAL_UNLIT",
    nearby_poi: "TIDEL Park Transit Stop",
    transit_routes: ["Route 570"],
    identified_at: "Yesterday, 09:30 PM IST",
    ward_engineer_notified: true
  }
];

export const INITIAL_PENALTIES: ContractorPenaltyDebit[] = [
  {
    id: "pen-01",
    work_order_code: "WO-0001",
    agency_name: "L&T Highways Infra Ltd",
    road_name: "GST Road, Tambaram (NH-32)",
    zone: "Zone 08 (Tambaram Corridor)",
    original_closed_at: "12 Aug, 04:30 PM",
    recurrence_detected_at: "24 Sept, 11:15 AM",
    days_to_recurrence: 42,
    recurrence_distance_meters: 1.8,
    defect_type: "D40 (Pothole Cavity Recurrence)",
    penalty_amount_inr: 25000,
    legal_clause: "MoHUA IRC:SP:20 Clause 14.2 (Defect Liability Guarantee)",
    bank_guarantee_deducted: true,
    status: "DEBIT_CONFIRMED"
  },
  {
    id: "pen-02",
    work_order_code: "WO-0004",
    agency_name: "GMR Urban Infra Corp",
    road_name: "Anna Salai Arterial Link",
    zone: "Zone 05 (Anna Salai Central)",
    original_closed_at: "28 July, 02:00 PM",
    recurrence_detected_at: "5 Oct, 09:40 AM",
    days_to_recurrence: 68,
    recurrence_distance_meters: 2.4,
    defect_type: "D40 (Pothole Cavity Recurrence)",
    penalty_amount_inr: 25000,
    legal_clause: "MoHUA IRC:SP:20 Clause 14.2 (Defect Liability Guarantee)",
    bank_guarantee_deducted: true,
    status: "DEBIT_CONFIRMED"
  }
];

export const INITIAL_OPEN_MANHOLES: OpenManholeAlert[] = [
  {
    id: "om-01",
    road_name: "GST Road (NH-32) Chromepet Flyover Ramp",
    zone: "Zone 08 (Tambaram Corridor)",
    lat: 12.9516,
    lng: 80.1462,
    rim_diameter_mm: 600,
    depth_drop_cm: 22.5,
    is_standard_is1726: true,
    emergency_level: "LEVEL_1_RED_ALERT",
    sla_hours: 2,
    jal_board_docket: "CMWSSB-EMERG-8921",
    police_cones_dispatched: true,
    detected_at: "22 mins ago (Bus #1042)",
    status: "ACTIVE_EMERGENCY"
  },
  {
    id: "om-02",
    road_name: "Anna Salai (Mount Road) Nandanam Junction",
    zone: "Zone 09 (Teynampet Central)",
    lat: 13.0298,
    lng: 80.2390,
    rim_diameter_mm: 550,
    depth_drop_cm: 18.0,
    is_standard_is1726: true,
    emergency_level: "LEVEL_1_RED_ALERT",
    sla_hours: 2,
    jal_board_docket: "CMWSSB-EMERG-8944",
    police_cones_dispatched: true,
    detected_at: "48 mins ago (Bus #2098)",
    status: "ACTIVE_EMERGENCY"
  }
];

export const INITIAL_SUBMERGED_POTHOLES: SubmergedPotholeAlert[] = [
  {
    id: "sph-01",
    road_name: "Velachery Main Road (Near Vijayanagar Junction)",
    zone: "Zone 13 (Velachery Basin)",
    lat: 12.9790,
    lng: 80.2185,
    estimated_water_depth_mm: 95,
    acoustic_spl_db: 89.2,
    vertical_shock_gz: 1.84,
    lane_blocked: "Middle Lane (Inward City)",
    avoid_advisory_active: true,
    last_detected_bus_id: "BUS-TN01-1042",
    detected_at: "Today, 08:14 AM"
  },
  {
    id: "sph-02",
    road_name: "GST Road Sub-Surface Dip near Kathipara Grade Link",
    zone: "Zone 12 (Guindy Corridor)",
    lat: 13.0067,
    lng: 80.2025,
    estimated_water_depth_mm: 120,
    acoustic_spl_db: 94.1,
    vertical_shock_gz: 2.10,
    lane_blocked: "Left Bus Bay Lane",
    avoid_advisory_active: true,
    last_detected_bus_id: "BUS-TN01-2098",
    detected_at: "Today, 07:45 AM"
  }
];

export const INITIAL_OBSCURED_SIGNS: ObscuredSignAudit[] = [
  {
    id: "obs-01",
    road_name: "Poonamallee High Road (Opposite St. John's Higher Secondary)",
    zone: "Zone 07 (Ambattur Corridor)",
    lat: 13.0820,
    lng: 80.2100,
    sign_type: "IRC:67 SCHOOL_AHEAD (Cautionary Triangular)",
    obscuration_pct: 48.5,
    obstruction_source: "OVERGROWN_TREE_BRANCH",
    parks_dept_work_order: "GCC-PARKS-2026-441",
    identified_at: "Yesterday, 04:30 PM",
    status: "PRUNING_ORDERED"
  },
  {
    id: "obs-02",
    road_name: "Anna Salai Junction (Thousand Lights Crossing)",
    zone: "Zone 09 (Teynampet Central)",
    lat: 13.0580,
    lng: 80.2520,
    sign_type: "IRC:67 MANDATORY_STOP (Octagonal Red)",
    obscuration_pct: 62.0,
    obstruction_source: "POLITICAL_FLEX_BANNER",
    parks_dept_work_order: "GCC-ENFORCEMENT-882",
    identified_at: "Yesterday, 02:15 PM",
    status: "PRUNING_ORDERED"
  }
];

export const INITIAL_DEBARMENTS: ContractorDebarmentDossier[] = [
  {
    id: "deb-01",
    agency_name: "Chennai Metro Roadways & Works",
    legal_cin: "U45203TN2011PTC082341",
    director_name: "R. Kalyanasundaram",
    zone: "Zone 03 (Madhavaram & Ring Road)",
    durability_score_pct: 68.4,
    total_recurrence_penalties_inr: 120000,
    sla_breach_count: 14,
    debarment_status: "STATUTORY_BARRED",
    debarment_order_no: "GCC/RD/2026/DB-084",
    gem_portal_notified: true,
    statutory_clause: "MoHUA Rule 151(iii) GFR 2017 & IRC:SP:20 Clause 14.2",
    valid_until: "31 Dec 2027 (2-Year Bar)"
  },
  {
    id: "deb-02",
    agency_name: "URC Construction Pvt Ltd",
    legal_cin: "U45201TN1995PTC031245",
    director_name: "S. Vasanth Kumar",
    zone: "Zone 11 (OMR IT Expressway)",
    durability_score_pct: 84.5,
    total_recurrence_penalties_inr: 45000,
    sla_breach_count: 6,
    debarment_status: "PROBATION",
    debarment_order_no: "SHOW-CAUSE-SC-2026-11",
    gem_portal_notified: false,
    statutory_clause: "IRC:SP:20 Clause 14.2 Defect Audit Review",
    valid_until: "30 Jun 2026 (Under Probation)"
  },
  {
    id: "deb-03",
    agency_name: "L&T Highways Infra Ltd",
    legal_cin: "L45200TN1946PLC001426",
    director_name: "K. Sundaram",
    zone: "Zone 08 (Tambaram Corridor)",
    durability_score_pct: 98.4,
    total_recurrence_penalties_inr: 0,
    sla_breach_count: 0,
    debarment_status: "ELIGIBLE",
    debarment_order_no: undefined,
    gem_portal_notified: false,
    statutory_clause: "MoHUA Grade A Certified Compliant",
    valid_until: "Perpetual Grade A Priority"
  }
];

export const INITIAL_ASPHALT_QC: AsphaltQualityAudit[] = [
  {
    id: "aqc-01",
    work_order_code: "WO-0001",
    road_name: "GST Road, Tambaram (NH-32)",
    agency_name: "L&T Highways Infra Ltd",
    mix_type: "VG30_HOT_MIX",
    lay_surface_temp_c: 138.5,
    statutory_min_temp_c: 110.0,
    is_temp_compliant: true,
    geometric_milling_shape: "RECTANGULAR_IRC_SP20",
    compaction_score_pct: 97.2,
    qc_certification: "PASSED_MORTH_SEC_500",
    audited_at: "Today, 08:30 AM"
  },
  {
    id: "aqc-02",
    work_order_code: "WO-0004",
    road_name: "Anna Salai Arterial Link",
    agency_name: "GMR Urban Infra Corp",
    mix_type: "COLD_MIX_RS1",
    lay_surface_temp_c: 28.0,
    statutory_min_temp_c: 20.0,
    is_temp_compliant: true,
    geometric_milling_shape: "RECTANGULAR_IRC_SP20",
    compaction_score_pct: 92.8,
    qc_certification: "PASSED_MORTH_SEC_500",
    audited_at: "Yesterday, 03:15 PM"
  },
  {
    id: "aqc-03",
    work_order_code: "WO-0008",
    road_name: "Madhavaram Ring Road",
    agency_name: "Chennai Metro Roadways & Works",
    mix_type: "VG30_HOT_MIX",
    lay_surface_temp_c: 89.0,
    statutory_min_temp_c: 110.0,
    is_temp_compliant: false,
    geometric_milling_shape: "IRREGULAR_NON_COMPLIANT",
    compaction_score_pct: 64.0,
    qc_certification: "REJECTED_REPAVE_ORDERED",
    audited_at: "2 days ago"
  }
];

export const api = new ApiService();

