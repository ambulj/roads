import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { 
  MapPin, 
  Smartphone, 
  Camera, 
  ShieldCheck, 
  Calculator, 
  Layers, 
  AlertCircle, 
  Flame, 
  Navigation, 
  Waves,
  ChevronDown,
  Check,
  Info,
  PanelLeftClose,
  PanelLeft,
  Hospital,
  GraduationCap,
  Activity,
  TrendingUp,
  X,
  Radio,
  Clock
} from 'lucide-react';
import { HazardCluster, FleetNode, TrafficIncident } from '../../types';
import { Button } from '../ui/Button';
import { api, CHENNAI_POIS } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface WebGISMapProps {
  clusters: HazardCluster[];
  fleet: FleetNode[];
  incidents?: TrafficIncident[];
  selectedCluster: HazardCluster | null;
  selectedIncident?: TrafficIncident | null;
  onSelectCluster: (cluster: HazardCluster) => void;
  onSelectIncident?: (incident: TrafficIncident) => void;
  isSplitView: boolean;
  onToggleSplitView: () => void;
  onOpenRPIModal: () => void;
  onOpenBriefModal: () => void;
  onNavigateToCapture: () => void;
  isQueueOpen?: boolean;
  onToggleQueue?: () => void;
}

const CHENNAI_QUICK_CORRIDORS = [
  { name: "GST Road", lat: 12.9516, lng: 80.1462, zoom: 15.0 },
  { name: "Kathipara Cloverleaf", lat: 13.0067, lng: 80.2030, zoom: 15.2 },
  { name: "OMR IT Expressway", lat: 12.9719, lng: 80.2500, zoom: 14.8 },
  { name: "Anna Salai CBD", lat: 13.0604, lng: 80.2496, zoom: 15.0 },
  { name: "Central Station Link", lat: 13.0827, lng: 80.2707, zoom: 15.4 },
];

const SAMPLE_BREADCRUMBS = [
  { id: 'bc-1', bus_id: 'BUS-TN01-1042', lat: 12.9516, lng: 80.1462, iri: 4.8, imu_gz: 1.58, speed_kmh: 38, time: '11:42 AM', road: 'GST Road Tambaram (Severe Pothole Impact)' },
  { id: 'bc-2', bus_id: 'BUS-TN01-1042', lat: 12.9580, lng: 80.1412, iri: 3.4, imu_gz: 1.18, speed_kmh: 44, time: '11:45 AM', road: 'Chromepet Underpass (Moderate Roughness)' },
  { id: 'bc-3', bus_id: 'BUS-TN01-1042', lat: 12.9850, lng: 80.1650, iri: 1.9, imu_gz: 1.02, speed_kmh: 58, time: '11:51 AM', road: 'Airport Flyover (Smooth Riding Surface)' },
  { id: 'bc-4', bus_id: 'BUS-TN01-1042', lat: 13.0067, lng: 80.2030, iri: 2.1, imu_gz: 1.05, speed_kmh: 46, time: '11:56 AM', road: 'Kathipara Interchange (Good Riding Quality)' },
  { id: 'bc-5', bus_id: 'BUS-TN01-1042', lat: 13.0110, lng: 80.2120, iri: 4.4, imu_gz: 1.42, speed_kmh: 32, time: '12:02 PM', road: 'Guindy Industrial Slip (Alligator Crack Impact)' },
  { id: 'bc-6', bus_id: 'BUS-TN01-1042', lat: 13.0350, lng: 80.2300, iri: 2.0, imu_gz: 1.03, speed_kmh: 50, time: '12:09 PM', road: 'Anna Salai Primary Arterial (Smooth)' },
  { id: 'bc-7', bus_id: 'BUS-TN01-2015', lat: 12.9719, lng: 80.2500, iri: 1.8, imu_gz: 1.01, speed_kmh: 55, time: '12:15 PM', road: 'OMR IT Expressway - Tidel Park (Smooth)' },
  { id: 'bc-8', bus_id: 'BUS-TN01-2015', lat: 12.9010, lng: 80.2280, iri: 3.6, imu_gz: 1.22, speed_kmh: 42, time: '12:22 PM', road: 'OMR Sholinganallur Junction (Moderate Wear)' }
];

const CORRIDOR_PROFILES: Record<string, Array<{ km: number; elevation: number; iri: number; road: string }>> = {
  'GST Road': [
    { km: 0.0, elevation: 12.4, iri: 4.8, road: 'Tambaram Sanatorium Ch. 0.0' },
    { km: 2.5, elevation: 14.1, iri: 3.6, road: 'Chromepet Underpass Ch. 2.5' },
    { km: 5.0, elevation: 11.2, iri: 2.1, road: 'Pallavaram Flyover Ch. 5.0' },
    { km: 8.2, elevation: 16.5, iri: 1.8, road: 'Airport Meenambakkam Ch. 8.2' },
    { km: 11.0, elevation: 22.0, iri: 2.3, road: 'Guindy Kathipara Interchange Ch. 11.0' },
    { km: 14.8, elevation: 15.2, iri: 4.2, road: 'Saidapet Bridge Ch. 14.8' },
  ],
  'OMR Expressway': [
    { km: 0.0, elevation: 8.2, iri: 1.8, road: 'Madhya Kailash Ch. 0.0' },
    { km: 3.0, elevation: 7.5, iri: 2.0, road: 'Tidel Park Ch. 3.0' },
    { km: 6.5, elevation: 6.8, iri: 2.4, road: 'Perungudi Toll Ch. 6.5' },
    { km: 10.0, elevation: 6.1, iri: 3.8, road: 'Thoraipakkam Junction Ch. 10.0' },
    { km: 14.5, elevation: 5.4, iri: 2.2, road: 'Sholinganallur SEZ Ch. 14.5' },
    { km: 18.2, elevation: 5.0, iri: 1.9, road: 'Siruseri SIPCOT Ch. 18.2' },
  ],
  'Anna Salai': [
    { km: 0.0, elevation: 9.0, iri: 2.2, road: 'Chennai Central Ch. 0.0' },
    { km: 2.2, elevation: 11.5, iri: 2.4, road: 'LIC Building Ch. 2.2' },
    { km: 4.5, elevation: 14.0, iri: 1.9, road: 'Thousand Lights Ch. 4.5' },
    { km: 7.0, elevation: 13.2, iri: 2.8, road: 'Teynampet DMS Ch. 7.0' },
    { km: 9.5, elevation: 16.0, iri: 3.1, road: 'Nandanam Signal Ch. 9.5' },
  ]
};

const MONSOON_CONTOURS = [
  {
    id: 'flood-chromepet',
    name: 'Chromepet Underpass Depression Zone',
    elevation_m: 11.2,
    water_depth_mm: 140,
    risk: 'CRITICAL HYDROPLANING RISK',
    bottleneck: 'Storm drain discharge capacity exceeded (>80 mm/hr)',
    coordinates: [
      [80.1380, 12.9550],
      [80.1440, 12.9550],
      [80.1450, 12.9610],
      [80.1390, 12.9610],
      [80.1380, 12.9550]
    ]
  },
  {
    id: 'flood-kathipara',
    name: 'Kathipara Ramp 3 Descent Basin',
    elevation_m: 8.8,
    water_depth_mm: 95,
    risk: 'HIGH RISK',
    bottleneck: 'Grade descent runoff stagnation zone',
    coordinates: [
      [80.2000, 13.0040],
      [80.2060, 13.0040],
      [80.2065, 13.0090],
      [80.2010, 13.0090],
      [80.2000, 13.0040]
    ]
  },
  {
    id: 'flood-velachery',
    name: 'Velachery Canal Link Stagnation Sector',
    elevation_m: 6.4,
    water_depth_mm: 165,
    risk: 'CRITICAL HYDROPLANING RISK',
    bottleneck: 'Pallikaranai Marshland backflow choke-point',
    coordinates: [
      [80.2180, 12.9750],
      [80.2250, 12.9750],
      [80.2260, 12.9810],
      [80.2190, 12.9810],
    ]
  }
];

export function generateBezierArc(p0: [number, number], p2: [number, number], curvature = 0.18, numPoints = 24): [number, number][] {
  const lng0 = p0[0];
  const lat0 = p0[1];
  const lng2 = p2[0];
  const lat2 = p2[1];
  const midLng = (lng0 + lng2) / 2.0;
  const midLat = (lat0 + lat2) / 2.0;
  const dx = lng2 - lng0;
  const dy = lat2 - lat0;
  const p1Lng = midLng - dy * curvature;
  const p1Lat = midLat + dx * curvature;

  const coords: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const invT = 1.0 - t;
    const lng = (invT ** 2) * lng0 + 2.0 * invT * t * p1Lng + (t ** 2) * lng2;
    const lat = (invT ** 2) * lat0 + 2.0 * invT * t * p1Lat + (t ** 2) * lat2;
    coords.push([Number(lng.toFixed(6)), Number(lat.toFixed(6))]);
  }
  return coords;
}

export const OD_DESIRE_LINES_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: generateBezierArc([80.1462, 12.9516], [80.2850, 13.0850], 0.16)
      },
      properties: {
        id: 'od-tambaram-broadway',
        name: 'GST Arterial Transit Trunk (Route 21G)',
        origin: 'Tambaram Sanatorium (South Gateway)',
        destination: 'Broadway Bus Terminal (Central Hub)',
        originZone: 'Zone 12 (Tambaram Gateway)',
        destZone: 'Zone 05 (Broadway CBD Hub)',
        route_code: '21G',
        tripsPerDay: 4820,
        daily_passengers: 4820,
        peak_hour_flow: 2840,
        hourly_pcu_flow: 2840,
        corridor_iri: 4.8,
        roughness_delay_minutes: 5.4,
        distressDelayMins: '5.4 min lost to road distress',
        distress_delay_attribution_mins: 5.4,
        congestion_factor: 1.18,
        cabinLoadProxy: '84% Cabin Capacity',
        los: 'LoS D (Approaching Capacity)',
        level_of_service: 'LoS D (Approaching Capacity)',
        color: '#06b6d4'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: generateBezierArc([80.1948, 13.0694], [80.2280, 12.8600], 0.18)
      },
      properties: {
        id: 'od-koyambedu-siruseri',
        name: 'OMR IT Expressway Express (Route 570X)',
        origin: 'CMBT Koyambedu Terminal',
        destination: 'Siruseri IT Park (Tech Corridor)',
        originZone: 'Zone 10 (CMBT Koyambedu)',
        destZone: 'Zone 15 (Siruseri Tech SEZ)',
        route_code: '570X',
        tripsPerDay: 6450,
        daily_passengers: 6450,
        peak_hour_flow: 3450,
        hourly_pcu_flow: 3450,
        corridor_iri: 3.8,
        roughness_delay_minutes: 7.2,
        distressDelayMins: '7.2 min lost to road distress',
        distress_delay_attribution_mins: 7.2,
        congestion_factor: 1.20,
        cabinLoadProxy: '92% Cabin Capacity',
        los: 'LoS E (Peak Choke-points)',
        level_of_service: 'LoS E (Peak Choke-points)',
        color: '#8b5cf6'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: generateBezierArc([80.2707, 13.0827], [80.2030, 13.0067], -0.15)
      },
      properties: {
        id: 'od-central-guindy',
        name: 'Mount Road Metro Spine (Route 1B)',
        origin: 'Chennai Central Station Hub',
        destination: 'Guindy Intermodal / Kathipara Cloverleaf',
        originZone: 'Zone 05 (Central Rail Station)',
        destZone: 'Zone 13 (Guindy Industrial)',
        route_code: '1B',
        tripsPerDay: 5200,
        daily_passengers: 5200,
        peak_hour_flow: 3120,
        hourly_pcu_flow: 3120,
        corridor_iri: 2.4,
        roughness_delay_minutes: 3.8,
        distressDelayMins: '3.8 min lost to road distress',
        distress_delay_attribution_mins: 3.8,
        congestion_factor: 1.18,
        cabinLoadProxy: '78% Cabin Capacity',
        los: 'LoS C (Stable Flow)',
        level_of_service: 'LoS C (Stable Flow)',
        color: '#10b981'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: generateBezierArc([80.2850, 13.0850], [80.2450, 12.7900], 0.14)
      },
      properties: {
        id: 'od-broadway-kelambakkam',
        name: 'East Coast Marine Link (Route 102)',
        origin: 'Broadway Bus Terminal',
        destination: 'Kelambakkam Junction Hub',
        originZone: 'Zone 05 (Broadway Terminal)',
        destZone: 'Zone 14 (Kelambakkam Gateway)',
        route_code: '102',
        tripsPerDay: 3180,
        daily_passengers: 3180,
        peak_hour_flow: 1960,
        hourly_pcu_flow: 1960,
        corridor_iri: 2.1,
        roughness_delay_minutes: 3.6,
        distressDelayMins: '3.6 min lost to road distress',
        distress_delay_attribution_mins: 3.6,
        congestion_factor: 1.09,
        cabinLoadProxy: '65% Cabin Capacity',
        los: 'LoS C (Free Flow)',
        level_of_service: 'LoS C (Free Flow)',
        color: '#f59e0b'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: generateBezierArc([80.2030, 13.0067], [80.2480, 12.9890], -0.16)
      },
      properties: {
        id: 'od-kathipara-omr',
        name: 'Kathipara to OMR Tidel Transit Spine (Route 570S)',
        origin: 'Kathipara Cloverleaf Interchange',
        destination: 'OMR Tidel Park (Tech Corridor)',
        originZone: 'Zone 12 (Kathipara Cloverleaf)',
        destZone: 'Zone 11 (OMR Tidel Park)',
        route_code: '570S',
        tripsPerDay: 4100,
        daily_passengers: 4100,
        peak_hour_flow: 2750,
        hourly_pcu_flow: 2750,
        corridor_iri: 3.1,
        roughness_delay_minutes: 4.2,
        distressDelayMins: '4.2 min lost to road distress',
        distress_delay_attribution_mins: 4.2,
        congestion_factor: 1.22,
        cabinLoadProxy: '74% Cabin Capacity',
        los: 'LoS D (Approaching Capacity)',
        level_of_service: 'LoS D (Approaching Capacity)',
        color: '#38bdf8'
      }
    }
  ]
};

export const COVERAGE_GAPS_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [80.2300, 13.0420], [80.2360, 13.0390], [80.2400, 13.0370], [80.2420, 13.0320]
        ]
      },
      properties: {
        sector: 'T. Nagar Residential Inner Wards (Zone 10)',
        busPasses14d: 0,
        gapType: 'High Density Residential Core',
        targetFleet: 'Swachh Bharat Waste Compactor Trucks'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [80.2650, 13.0350], [80.2700, 13.0320], [80.2720, 13.0280], [80.2680, 13.0250]
        ]
      },
      properties: {
        sector: 'Mylapore Heritage & Temple Inner Grid (Zone 09)',
        busPasses14d: 0,
        gapType: 'Narrow Lane Urban Grid',
        targetFleet: 'Municipal Electric Waste Midi-Vans'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [80.2150, 12.9820], [80.2100, 12.9780], [80.2050, 12.9750]
        ]
      },
      properties: {
        sector: 'Velachery Interior Residential Sector (Zone 13)',
        busPasses14d: 0,
        gapType: 'Suburban Feeder Lanes',
        targetFleet: 'Postal Delivery & Water Tanker Fleets'
      }
    }
  ]
};

function createGeoJSONCircle(center: [number, number], radiusInMeters: number, points = 64) {
  const coords: [number, number][] = [];
  const km = radiusInMeters / 1000;
  const distanceX = km / (111.32 * Math.cos((center[1] * Math.PI) / 180));
  const distanceY = km / 110.574;

  for (let i = 0; i <= points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([center[0] + x, center[1] + y]);
  }
  return coords;
}

function fleetToGeoJSON(busList: FleetNode[]) {
  return {
    type: 'FeatureCollection' as const,
    features: busList.map((bus) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [bus.lng, bus.lat]
      },
      properties: {
        id: bus.id,
        route_name: bus.route_name,
        speed_kmh: bus.speed_kmh || 35,
        heading: bus.heading || 0,
        is_online: bus.is_online
      }
    }))
  };
}

export const WebGISMap: React.FC<WebGISMapProps> = ({
  clusters,
  fleet,
  incidents = [],
  selectedCluster,
  selectedIncident,
  onSelectCluster,
  onSelectIncident,
  isSplitView,
  onToggleSplitView,
  onOpenRPIModal,
  onOpenBriefModal,
  onNavigateToCapture,
  isQueueOpen = true,
  onToggleQueue
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const busMarkersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const incidentMarkersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const poiMarkersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const { theme } = useTheme();
  
  const [basemap, setBasemap] = useState<'dark' | 'street' | 'satellite' | 'topo'>(() => {
    return theme === 'dark' ? 'dark' : 'street';
  });

  useEffect(() => {
    setBasemap(theme === 'dark' ? 'dark' : 'street');
  }, [theme]);

  const [layerFilter, setLayerFilter] = useState<'all' | 'hazards' | 'incidents' | 'safety'>('all');
  const [isMapReady, setIsMapReady] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showTrafficCongestion, setShowTrafficCongestion] = useState(false);
  const [showBreadcrumbs, setShowBreadcrumbs] = useState(false);
  const [showMonsoonContours, setShowMonsoonContours] = useState(false);
  const [showODDesireLines, setShowODDesireLines] = useState(false);
  const [showCoverageGaps, setShowCoverageGaps] = useState(false);
  const [isGisMenuOpen, setIsGisMenuOpen] = useState(false);
  const [isInfoMenuOpen, setIsInfoMenuOpen] = useState(false);


  // Elevation & Roughness Profile Bottom Pop-up state
  const [activeProfileCorridor, setActiveProfileCorridor] = useState<string | null>(null);
  const [hoveredProfileIndex, setHoveredProfileIndex] = useState<number | null>(null);

  const activeGisCount = (showHeatmap ? 1 : 0) + (showTrafficCongestion ? 1 : 0) + (showBreadcrumbs ? 1 : 0) + (showMonsoonContours ? 1 : 0) + (showODDesireLines ? 1 : 0) + (showCoverageGaps ? 1 : 0);

  const UNIFIED_BASEMAP_STYLE = {
    version: 8,
    sources: {
      'dark': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      },
      'street': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors'
      },
      'satellite': {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: '&copy; Esri World Imagery'
      },
      'topo': {
        type: 'raster',
        tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; OpenTopoMap contributors',
        maxzoom: 17
      }
    },
    layers: [
      { id: 'dark-layer', type: 'raster', source: 'dark', layout: { visibility: basemap === 'dark' ? 'visible' : 'none' }, minzoom: 0, maxzoom: 19 },
      { id: 'street-layer', type: 'raster', source: 'street', layout: { visibility: basemap === 'street' ? 'visible' : 'none' }, minzoom: 0, maxzoom: 19 },
      { id: 'satellite-layer', type: 'raster', source: 'satellite', layout: { visibility: basemap === 'satellite' ? 'visible' : 'none' }, minzoom: 0, maxzoom: 19 },
      { id: 'topo-layer', type: 'raster', source: 'topo', layout: { visibility: basemap === 'topo' ? 'visible' : 'none' }, minzoom: 0, maxzoom: 17 }
    ]
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: UNIFIED_BASEMAP_STYLE as any,
      center: [80.2030, 13.0067], // Chennai center (Kathipara junction)
      zoom: 11.5,
      pitch: 35,
      bearing: -10,
      attributionControl: false
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');
    mapRef.current = map;

    map.on('load', () => {
      setIsMapReady(true);
      setTimeout(() => { map.resize(); }, 150);
      setTimeout(() => { map.resize(); }, 500);
    });

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      map.remove();
      mapRef.current = null;
      setIsMapReady(false);
    };
  }, []);

  // Update Basemap Style via instant layer visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const basemaps = ['dark', 'street', 'satellite', 'topo'] as const;
    const updateVisibility = () => {
      basemaps.forEach((mode) => {
        const layerId = `${mode}-layer`;
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', mode === basemap ? 'visible' : 'none');
        }
      });
    };

    if (map.isStyleLoaded()) {
      updateVisibility();
    } else {
      map.once('style.load', updateVisibility);
    }
  }, [basemap, isMapReady]);

  // Add/Update Heatmap and Traffic Congestion layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    // 1. Pothole Severity Heatmap
    const heatmapGeoJSON = {
      type: 'FeatureCollection',
      features: clusters.map(c => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
        properties: { rpi: c.rpi_score, severity: c.severity_level === 'critical' ? 1.0 : 0.6 }
      }))
    };

    if (!map.getSource('potholes-heatmap-src')) {
      map.addSource('potholes-heatmap-src', {
        type: 'geojson',
        data: heatmapGeoJSON as any
      });

      map.addLayer({
        id: 'potholes-heat-layer',
        type: 'heatmap',
        source: 'potholes-heatmap-src',
        layout: { visibility: showHeatmap ? 'visible' : 'none' },
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'rpi'], 0, 0, 100, 1],
          'heatmap-intensity': 1.8,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0, 0, 255, 0)',
            0.2, '#3b82f6',
            0.4, '#06b6d4',
            0.6, '#10b981',
            0.8, '#f59e0b',
            1.0, '#ef4444'
          ],
          'heatmap-radius': 35,
          'heatmap-opacity': 0.85
        }
      });
    } else {
      (map.getSource('potholes-heatmap-src') as maplibregl.GeoJSONSource).setData(heatmapGeoJSON as any);
      if (map.getLayer('potholes-heat-layer')) {
        map.setLayoutProperty('potholes-heat-layer', 'visibility', showHeatmap ? 'visible' : 'none');
      }
    }

    // 2. Real-time Bus Speed & Congestion Polylines
    const congestionGeoJSON = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [80.1170, 12.9250], [80.1462, 12.9516], [80.1580, 12.9680], [80.1750, 12.9880], [80.2030, 13.0067]
            ]
          },
          properties: { corridor: 'GST Road (NH-32)', speed: 42, color: '#10b981', status: 'Free Flow (42 km/h)' }
        },
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [80.2520, 13.0080], [80.2480, 12.9890], [80.2430, 12.9650], [80.2360, 12.9380], [80.2280, 12.9010]
            ]
          },
          properties: { corridor: 'OMR IT Expressway', speed: 52, color: '#10b981', status: 'Expressway (52 km/h)' }
        },
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [80.2707, 13.0827], [80.2630, 13.0640], [80.2520, 13.0580], [80.2450, 13.0410], [80.2250, 13.0210]
            ]
          },
          properties: { corridor: 'Anna Salai (Mount Road)', speed: 19, color: '#ef4444', status: 'Dense Congestion (19 km/h)' }
        },
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [80.2150, 13.0020], [80.2200, 12.9880], [80.2180, 12.9780], [80.2310, 12.9720]
            ]
          },
          properties: { corridor: 'Velachery Main Road', speed: 28, color: '#f59e0b', status: 'Moderate Flow (28 km/h)' }
        }
      ]
    };

    if (!map.getSource('traffic-congestion-src')) {
      map.addSource('traffic-congestion-src', {
        type: 'geojson',
        data: congestionGeoJSON as any
      });

      map.addLayer({
        id: 'traffic-congestion-lines',
        type: 'line',
        source: 'traffic-congestion-src',
        layout: { 
          'line-join': 'round', 
          'line-cap': 'round',
          'visibility': showTrafficCongestion ? 'visible' : 'none' 
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 5.5,
          'line-opacity': 0.85
        }
      });
    } else {
      if (map.getLayer('traffic-congestion-lines')) {
        map.setLayoutProperty('traffic-congestion-lines', 'visibility', showTrafficCongestion ? 'visible' : 'none');
      }
    }
  }, [clusters, showHeatmap, showTrafficCongestion, isMapReady]);

  // 3. Origin-Destination Transit Desire Lines (PS 26124)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    if (!map.getSource('od-desire-lines-src')) {
      map.addSource('od-desire-lines-src', {
        type: 'geojson',
        data: OD_DESIRE_LINES_GEOJSON as any
      });

      map.addLayer({
        id: 'od-desire-lines-layer',
        type: 'line',
        source: 'od-desire-lines-src',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          'visibility': showODDesireLines ? 'visible' : 'none'
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['interpolate', ['linear'], ['get', 'tripsPerDay'], 3000, 3.5, 5000, 4.5, 7000, 5.5],
          'line-opacity': 0.85
        }
      });

      map.on('mouseenter', 'od-desire-lines-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'od-desire-lines-layer', () => {
        map.getCanvas().style.cursor = '';
      });

      map.on('click', 'od-desire-lines-layer', (e) => {
        if (!e.features || !e.features[0]) return;
        const p = e.features[0].properties;
        new maplibregl.Popup({ offset: 12 })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 11px; padding: 4px; min-width: 230px;">
              <div style="font-weight: 800; font-size: 12px; color: ${p.color || '#06b6d4'}; margin-bottom: 2px;">
                ${p.name || 'Transit Corridor'}
              </div>
              <div style="font-size: 10px; color: #64748b; margin-bottom: 6px;">
                <b>Origin:</b> ${p.origin || p.originZone} &rarr; <b>Dest:</b> ${p.destination || p.destZone}
              </div>
              <div style="background: #f1f5f9; padding: 6px; border-radius: 6px; font-family: monospace; font-size: 10px; line-height: 1.5; color: #0f172a;">
                <div>Daily Transit: <b>${Number(p.daily_passengers || p.tripsPerDay || 0).toLocaleString()} trips/day</b></div>
                <div>Peak Hour Flow: <b>${Number(p.peak_hour_flow || p.hourly_pcu_flow || 0).toLocaleString()} PCU/hr</b></div>
                <div>Passenger Load: <b style="color: #0284c7;">${p.cabinLoadProxy || '80% Capacity'}</b></div>
                <div>Corridor Roughness: <b>${p.corridor_iri ? `${p.corridor_iri} m/km (IRI)` : '3.2 m/km'}</b></div>
                <div>Distress Delay Penalty: <b style="color: #dc2626;">${p.distressDelayMins || `${p.roughness_delay_minutes || 4.5}m delay`}</b></div>
                <div>Level of Service: <b>${p.level_of_service || p.los || 'LoS D'}</b></div>
              </div>
            </div>
          `)
          .addTo(map);
      });
    } else {
      if (map.getLayer('od-desire-lines-layer')) {
        map.setLayoutProperty('od-desire-lines-layer', 'visibility', showODDesireLines ? 'visible' : 'none');
      }
    }

    // Attempt live fetch from backend traffic API if active
    if (showODDesireLines) {
      api.getODMatrix().then((res) => {
        if (res && res.geojson && map.getSource('od-desire-lines-src')) {
          (map.getSource('od-desire-lines-src') as maplibregl.GeoJSONSource).setData(res.geojson as any);
        }
      }).catch((err) => {
        console.warn('OD Matrix live fetch fallback:', err);
      });
    }
  }, [showODDesireLines, isMapReady]);

  // 4. Municipal Coverage Gaps & Blind Spots (Phase 2 Expansion)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    if (!map.getSource('coverage-gaps-src')) {
      map.addSource('coverage-gaps-src', {
        type: 'geojson',
        data: COVERAGE_GAPS_GEOJSON as any
      });

      map.addLayer({
        id: 'coverage-gaps-layer',
        type: 'line',
        source: 'coverage-gaps-src',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          'visibility': showCoverageGaps ? 'visible' : 'none'
        },
        paint: {
          'line-color': '#f59e0b',
          'line-width': 4.0,
          'line-dasharray': [2, 2],
          'line-opacity': 0.90
        }
      });

      map.on('click', 'coverage-gaps-layer', (e) => {
        if (!e.features || !e.features[0]) return;
        const p = e.features[0].properties;
        new maplibregl.Popup({ offset: 12 })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family: system-ui, sans-serif; font-size: 11px; padding: 4px; min-width: 220px;">
              <div style="font-weight: 800; font-size: 12px; color: #d97706; margin-bottom: 2px;">
                Municipal Coverage Blind Spot
              </div>
              <div style="font-size: 10px; color: #475569; margin-bottom: 4px;">
                <b>Sector:</b> ${p.sector}
              </div>
              <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 6px; border-radius: 6px; font-size: 10px; color: #92400e; line-height: 1.4;">
                <div>Fleet Status: <b>0 Bus Passes in last 14 Days</b></div>
                <div style="margin-top: 4px;"><b>Phase 2 Expansion:</b> Targeted for deployment on <em>${p.targetFleet}</em>.</div>
              </div>
            </div>
          `)
          .addTo(map);
      });
    } else {
      if (map.getLayer('coverage-gaps-layer')) {
        map.setLayoutProperty('coverage-gaps-layer', 'visibility', showCoverageGaps ? 'visible' : 'none');
      }
    }
  }, [showCoverageGaps, isMapReady]);

  // Hook global window method for RPI formula live explain from popup
  useEffect(() => {
    (window as any).__roadsaathi_open_rpi_modal = (clusterId: string) => {
      const cl = clusters.find(c => c.id === clusterId) || selectedCluster;
      if (cl) onSelectCluster(cl);
      onOpenRPIModal();
    };
    return () => {
      delete (window as any).__roadsaathi_open_rpi_modal;
    };
  }, [clusters, selectedCluster, onSelectCluster, onOpenRPIModal]);

  // Render Defect Cluster Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    // Clear removed markers
    Object.keys(markersRef.current).forEach((id) => {
      if (!clusters.some((c) => c.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    const showClusters = layerFilter === 'all' || layerFilter === 'hazards';

    clusters.forEach((cluster) => {
      const isCritical = cluster.severity_level === 'critical';
      const isHigh = cluster.severity_level === 'high';
      const isResolved = cluster.status === 'resolved' || cluster.status === 'verified_closed';
      const color = isResolved ? '#10b981' : isCritical ? '#f43f5e' : isHigh ? '#f59e0b' : '#3b82f6';

      if (!markersRef.current[cluster.id]) {
        const el = document.createElement('div');
        el.className = 'cursor-pointer transition-transform hover:scale-125';
        el.style.display = showClusters ? 'block' : 'none';
        el.innerHTML = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="width: 24px; height: 24px; border-radius: 50%; background: #ffffff; border: 2.5px solid ${color}; box-shadow: 0 2px 8px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color};"></div>
            </div>
            <div style="position: absolute; top: -18px; font-family: system-ui, -apple-system, sans-serif; font-size: 9px; font-weight: 700; background: #ffffff; color: ${color}; padding: 1px 5px; border-radius: 4px; border: 1.5px solid ${color}; box-shadow: 0 1px 4px rgba(0,0,0,0.2); white-space: nowrap;">
              ${cluster.defect_type} (${cluster.rpi_score})
            </div>
          </div>
        `;

        const popup = new maplibregl.Popup({ offset: 15, closeButton: false }).setHTML(`
          <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 11px; padding: 2px;">
            <div style="font-weight: 700; color: ${color}; font-size: 12px; margin-bottom: 2px;">
              ${cluster.defect_name} &bull; RPI: ${cluster.rpi_score}
            </div>
            <div style="font-weight: 600; opacity: 0.9; margin-bottom: 4px;">${cluster.road_name}</div>
            <div style="font-size: 10px; opacity: 0.8; line-height: 1.4;">
              Near: <b>${cluster.nearest_poi}</b> (${cluster.poi_distance_m}m)<br/>
              Contractor: <b>${cluster.assigned_agency}</b><br/>
              Status: <span style="text-transform: uppercase; color: ${color}; font-weight: bold;">${cluster.status}</span> &bull; ${cluster.pass_count} passes
            </div>
            <button onclick="window.__roadsaathi_open_rpi_modal?.('${cluster.id}')" style="margin-top: 6px; width: 100%; padding: 4px 6px; background: #2563eb; color: #ffffff; font-size: 10px; font-weight: 700; border-radius: 4px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
              Explain RPI Formula Live &rarr;
            </button>
          </div>
        `);

        el.addEventListener('click', () => {
          onSelectCluster(cluster);
          if (cluster.road_name.includes('GST')) setActiveProfileCorridor('GST Road');
          else if (cluster.road_name.includes('OMR')) setActiveProfileCorridor('OMR Expressway');
          else if (cluster.road_name.includes('Anna')) setActiveProfileCorridor('Anna Salai');
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([cluster.lng, cluster.lat])
          .setPopup(popup)
          .addTo(map);

        markersRef.current[cluster.id] = marker;
      } else {
        markersRef.current[cluster.id].getElement().style.display = showClusters ? 'block' : 'none';
        markersRef.current[cluster.id].setLngLat([cluster.lng, cluster.lat]);
      }
    });
  }, [clusters, layerFilter, isMapReady, onSelectCluster]);

  // Render Fleet Bus Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    fleet.forEach((bus) => {
      if (!busMarkersRef.current[bus.id]) {
        const el = document.createElement('div');
        el.className = 'cursor-pointer group';
        el.id = `bus-marker-${bus.id}`;
        el.innerHTML = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="width: 34px; height: 34px; border-radius: 50%; background: #0284c7; border: 2.5px solid #ffffff; box-shadow: 0 4px 14px rgba(2,132,199,0.5); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 10px; font-weight: 800; font-family: monospace;">
              BUS
            </div>
            <div style="position: absolute; top: -3px; width: 6px; height: 6px; background: #38bdf8; border-radius: 50%; box-shadow: 0 0 8px #38bdf8;"></div>
            <div style="position: absolute; bottom: -18px; font-family: monospace; font-size: 9.5px; font-weight: 700; background: #09090b; color: #38bdf8; padding: 1px 5px; border-radius: 4px; border: 1px solid #27272a; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">
              ${bus.id.replace('BUS-', '')} • ${bus.speed_kmh || 35}k
            </div>
          </div>
        `;

        el.addEventListener('click', () => {
          if (bus.route_name.includes('GST')) setActiveProfileCorridor('GST Road');
          else if (bus.route_name.includes('OMR')) setActiveProfileCorridor('OMR Expressway');
          else setActiveProfileCorridor('Anna Salai');
        });

        const popupHtml = `
          <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px; min-width: 220px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 6px; margin-bottom: 6px;">
              <div>
                <div style="font-weight: 800; font-size: 12px; color: #60a5fa; font-family: monospace;">${bus.id}</div>
                <div style="font-size: 10px; color: #94a3b8; font-family: sans-serif;">${bus.route_name}</div>
              </div>
              <div style="background: #059669; color: #ffffff; font-size: 9px; font-weight: 700; padding: 2px 5px; border-radius: 4px; font-family: monospace;">5Hz LIVE</div>
            </div>
            <div style="position: relative; width: 100%; height: 120px; border-radius: 6px; overflow: hidden; background: #020617; margin-bottom: 6px; border: 1px solid #334155;">
              <img src="/api/streams/snapshot/${bus.id}?t=${Date.now()}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/uploads/evidence/pothole_annotated.jpg'" alt="${bus.id} live" />
              <div style="position: absolute; top: 4px; left: 4px; background: rgba(0,0,0,0.75); color: #34d399; font-size: 9px; font-family: monospace; padding: 2px 4px; border-radius: 3px;">
                ● CCTV STREAM
              </div>
              <div style="position: absolute; bottom: 4px; right: 4px; background: rgba(0,0,0,0.75); color: #fbbf24; font-size: 9px; font-family: monospace; padding: 2px 4px; border-radius: 3px;">
                ${bus.speed_kmh || 38} km/h
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 9.5px; font-family: monospace; color: #94a3b8;">
              <div>NPU: <span style="color: #38bdf8;">${bus.npu_hardware || 'Zero-HW'}</span></div>
              <div>Rate: <span style="color: #34d399;">${bus.edge_fps || 30} FPS</span></div>
            </div>
          </div>
        `;

        const popup = new maplibregl.Popup({ offset: 20, closeButton: true, className: 'map-live-cctv-popup' })
          .setHTML(popupHtml);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([bus.lng, bus.lat])
          .setPopup(popup)
          .addTo(map);

        busMarkersRef.current[bus.id] = marker;
      } else {
        busMarkersRef.current[bus.id].setLngLat([bus.lng, bus.lat]);
        const mEl = document.getElementById(`bus-marker-${bus.id}`);
        if (mEl) {
          const speedLabel = mEl.querySelector('div[style*="bottom: -18px"]');
          if (speedLabel) {
            speedLabel.textContent = `${bus.id.replace('BUS-', '')} • ${bus.speed_kmh || 35}k`;
          }
        }
      }
    });
  }, [fleet, isMapReady]);

  // Decoupled 5Hz Telemetry Listener & 'bus-positions' MapLibre GeoJSON source:
  // Directly updates MapLibre GeoJSON source and DOM markers to maintain locked 60 FPS WebGIS performance
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    // Initialize 'bus-positions' GeoJSON source and glowing pulse layer if not present
    const initialGeoData = fleetToGeoJSON(fleet);
    if (!map.getSource('bus-positions')) {
      map.addSource('bus-positions', {
        type: 'geojson',
        data: initialGeoData as any
      });

      map.addLayer({
        id: 'bus-positions-pulse',
        type: 'circle',
        source: 'bus-positions',
        paint: {
          'circle-radius': 16,
          'circle-color': '#0284c7',
          'circle-opacity': 0.18,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#38bdf8',
          'circle-stroke-opacity': 0.6
        }
      });
    } else {
      (map.getSource('bus-positions') as maplibregl.GeoJSONSource).setData(initialGeoData as any);
    }

    const handleFleetTelemetry = (e: Event) => {
      const customEvent = e as CustomEvent<FleetNode[]>;
      const liveFleet = customEvent.detail;
      if (!liveFleet || !Array.isArray(liveFleet)) return;

      const currentMap = mapRef.current;
      if (currentMap) {
        const source = currentMap.getSource('bus-positions') as maplibregl.GeoJSONSource | undefined;
        if (source) {
          source.setData(fleetToGeoJSON(liveFleet) as any);
        }
      }

      liveFleet.forEach((bus) => {
        const marker = busMarkersRef.current[bus.id];
        if (marker) {
          marker.setLngLat([bus.lng, bus.lat]);
          const mEl = document.getElementById(`bus-marker-${bus.id}`);
          if (mEl) {
            const speedLabel = mEl.querySelector('div[style*="bottom: -18px"]');
            if (speedLabel) {
              speedLabel.textContent = `${bus.id.replace('BUS-', '')} • ${bus.speed_kmh || 35}k`;
            }
          }
        }
      });
    };

    window.addEventListener('roadsaathi:telemetry:fleet', handleFleetTelemetry);
    return () => {
      window.removeEventListener('roadsaathi:telemetry:fleet', handleFleetTelemetry);
    };
  }, [isMapReady]);

  // Render Incidents
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    // Clear removed incident markers
    Object.keys(incidentMarkersRef.current).forEach((id) => {
      if (!incidents.some((inc) => inc.id === id)) {
        incidentMarkersRef.current[id].remove();
        delete incidentMarkersRef.current[id];
      }
    });

    const showIncidents = layerFilter === 'all' || layerFilter === 'incidents';

    incidents.forEach((incident) => {
      const isHitAndRun = incident.incident_type === 'HIT_AND_RUN';
      const isRashDriving = incident.incident_type === 'RASH_DRIVING';
      const isWaterlog = incident.incident_type === 'WATERLOGGING';
      const color = isHitAndRun ? '#ef4444' : isRashDriving ? '#f97316' : isWaterlog ? '#06b6d4' : '#e11d48';

      if (!incidentMarkersRef.current[incident.id]) {
        const el = document.createElement('div');
        el.className = 'cursor-pointer group transition-transform hover:scale-125';
        el.style.display = showIncidents ? 'block' : 'none';
        el.innerHTML = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="width: 22px; height: 22px; border-radius: 50%; background: #09090b; border: 2px solid ${color}; box-shadow: 0 0 8px ${color}66; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; font-family: monospace; color: ${color};">
              !
            </div>
            <div class="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150" style="position: absolute; top: -20px; font-family: monospace; font-size: 8.5px; font-weight: 700; background: #09090b; color: ${color}; padding: 1px 5px; border-radius: 3px; border: 1px solid ${color}; white-space: nowrap; z-index: 30;">
              ${String(incident.incident_type).replace(/_/g, ' ')}
            </div>
          </div>
        `;

        const popupHtml = `
          <div style="font-family: monospace; font-size: 11px; padding: 2px; min-width: 200px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-bottom: 3px;">
              <span style="font-weight: 800; color: ${color}; font-size: 11px; text-transform: uppercase;">
                ${isWaterlog ? 'Waterlog Hazard' : 'Safety Violation'}
              </span>
              <span style="font-family: monospace; font-size: 9.5px; background: ${color}20; color: ${color}; padding: 1px 4px; border-radius: 3px; font-weight: bold;">
                ${incident.id}
              </span>
            </div>
            <div style="font-weight: 700; font-size: 11px; margin-bottom: 2px; color: #18181b;">
              ${String(incident.incident_type).replace(/_/g, ' ')}
            </div>
            <div style="font-size: 10px; color: #71717a; margin-bottom: 4px;">
              <b>${incident.road_name}</b>
            </div>
            <div style="font-size: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 6px; margin-bottom: 4px; line-height: 1.4;">
              ${incident.plate_number ? `<div>Plate: <b style="font-family: monospace; color: #0284c7;">${incident.plate_number}</b> (${Math.round((incident.plate_confidence || 0.95) * 100)}% Conf)</div>` : ''}
              ${incident.target_speed_kmh ? `<div>Speed: <b style="color: #dc2626;">${incident.target_speed_kmh} km/h</b></div>` : ''}
              <div>Section: <b>${incident.mva_section || 'MVA Sec 184 / 134'}</b></div>
              ${incident.fine_amount_inr ? `<div>Penalty: <b style="color: #059669;">₹${incident.fine_amount_inr.toLocaleString()}</b></div>` : ''}
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 9.5px; color: #64748b;">
              <span>Status: <b style="color: ${color}; text-transform: uppercase;">${String(incident.status || 'ACTIVE').replace(/_/g, ' ')}</b></span>
              <span>${incident.occurred_at || 'Live Telemetry'}</span>
            </div>
          </div>
        `;

        const popup = new maplibregl.Popup({ offset: 16, closeButton: false })
          .setHTML(popupHtml);

        el.addEventListener('click', () => {
          onSelectIncident?.(incident);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([incident.lng, incident.lat])
          .setPopup(popup)
          .addTo(map);

        incidentMarkersRef.current[incident.id] = marker;
      } else {
        incidentMarkersRef.current[incident.id].getElement().style.display = showIncidents ? 'block' : 'none';
        incidentMarkersRef.current[incident.id].setLngLat([incident.lng, incident.lat]);
      }
    });
  }, [incidents, layerFilter, isMapReady, onSelectIncident]);

  return (
    <main className="flex-1 w-full h-full flex flex-col relative overflow-hidden bg-slate-100 dark:bg-slate-950 select-none">
      
      {/* Top Map Action Toolbar - Sleek Minimal Pill */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-1 pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-md text-xs font-semibold">
          <button
            onClick={() => setBasemap(basemap === 'dark' ? 'street' : basemap === 'street' ? 'satellite' : 'dark')}
            title="Switch Basemap Mode"
            className="px-2.5 py-1 rounded-lg transition bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 capitalize font-mono text-[11px]"
          >
            {basemap}
          </button>

          <div className="relative">
            <button
              onClick={() => setIsGisMenuOpen(!isGisMenuOpen)}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-bold transition ${
                activeGisCount > 0
                  ? 'bg-amber-500 text-white'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Layers</span>
              {activeGisCount > 0 && (
                <span className="w-3.5 h-3.5 rounded-full bg-white text-amber-600 text-[9px] font-bold flex items-center justify-center">
                  {activeGisCount}
                </span>
              )}
            </button>

            {isGisMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 shadow-2xl z-50 text-xs flex flex-col gap-1"
                onMouseLeave={() => setIsGisMenuOpen(false)}
              >
                <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  Analytical Layers
                </div>

                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`flex items-center justify-between p-2 rounded-xl text-left transition ${
                    showHeatmap ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-500" />
                    <span>Pothole Severity Heatmap</span>
                  </div>
                  {showHeatmap && <Check className="w-4 h-4 text-rose-500" />}
                </button>

                <button
                  onClick={() => setShowTrafficCongestion(!showTrafficCongestion)}
                  className={`flex items-center justify-between p-2 rounded-xl text-left transition ${
                    showTrafficCongestion ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-500" />
                    <span>Speed Congestion Flow</span>
                  </div>
                  {showTrafficCongestion && <Check className="w-4 h-4 text-purple-500" />}
                </button>

                <button
                  onClick={() => setShowBreadcrumbs(!showBreadcrumbs)}
                  className={`flex items-center justify-between p-2 rounded-xl text-left transition ${
                    showBreadcrumbs ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-emerald-500" />
                    <span>24h Bus Trajectory</span>
                  </div>
                  {showBreadcrumbs && <Check className="w-4 h-4 text-emerald-500" />}
                </button>

                <button
                  onClick={() => setShowMonsoonContours(!showMonsoonContours)}
                  className={`flex items-center justify-between p-2 rounded-xl text-left transition ${
                    showMonsoonContours ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Waves className="w-4 h-4 text-blue-500" />
                    <span>Monsoon Hydro Contours</span>
                  </div>
                  {showMonsoonContours && <Check className="w-4 h-4 text-blue-500" />}
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <button
                  onClick={() => setShowODDesireLines(!showODDesireLines)}
                  className={`flex items-center justify-between p-2 rounded-xl text-left transition ${
                    showODDesireLines ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-500" />
                    <span>O-D Transit Desire Lines (PS 26124)</span>
                  </div>
                  {showODDesireLines && <Check className="w-4 h-4 text-cyan-500" />}
                </button>

                <button
                  onClick={() => setShowCoverageGaps(!showCoverageGaps)}
                  className={`flex items-center justify-between p-2 rounded-xl text-left transition ${
                    showCoverageGaps ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span>Coverage Blind Spots (Phase 2)</span>
                  </div>
                  {showCoverageGaps && <Check className="w-4 h-4 text-amber-500" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Map Canvas */}
      <div className="flex-1 w-full h-full relative">
        <div ref={mapContainerRef} className="w-full h-full" style={{ width: "100%", height: "100%", minHeight: "460px" }} />

        {/* FLOATING HUD 1: O-D FLOW MATRIX CARD (WHEN ACTIVE) */}
        {showODDesireLines && (
          <div className="absolute top-14 right-3 z-20 max-w-sm w-full bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 rounded-xl p-3 shadow-xl text-xs text-slate-200 font-sans animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-1.5 font-bold text-cyan-400">
                <TrendingUp className="w-4 h-4" />
                <span>O-D Transit Desire Lines (PS 26124)</span>
              </div>
              <button 
                onClick={() => setShowODDesireLines(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10.5px] text-slate-400 mb-2 leading-tight">
              Aggregated passenger-load proxies from cabin cameras &amp; bus GPS trip frequencies across city wards.
            </p>
            <div className="space-y-1.5 font-mono text-[10.5px] max-h-64 overflow-y-auto pr-1">
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-cyan-300">Tambaram &rarr; Broadway</span>
                  <div className="text-[9.5px] text-slate-400 font-sans">Route 21G &bull; GST Trunk</div>
                  <div className="text-[9px] text-rose-400 font-sans">IRI 4.8 &bull; 5.4 min distress delay</div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-white">4,820 trips/d</span>
                  <div className="text-[9px] text-emerald-400">84% Cabin Load</div>
                </div>
              </div>
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-purple-300">Koyambedu &rarr; Siruseri</span>
                  <div className="text-[9.5px] text-slate-400 font-sans">Route 570X &bull; OMR Tech SEZ</div>
                  <div className="text-[9px] text-rose-400 font-sans">IRI 3.8 &bull; 7.2 min distress delay</div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-white">6,450 trips/d</span>
                  <div className="text-[9px] text-rose-400">92% Load (LoS E)</div>
                </div>
              </div>
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-300">Central &rarr; Guindy</span>
                  <div className="text-[9.5px] text-slate-400 font-sans">Route 1B &bull; Mount Road Spine</div>
                  <div className="text-[9px] text-amber-400 font-sans">IRI 2.4 &bull; 3.8 min distress delay</div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-white">5,200 trips/d</span>
                  <div className="text-[9px] text-cyan-400">78% Cabin Load</div>
                </div>
              </div>
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-300">Broadway &rarr; Kelambakkam</span>
                  <div className="text-[9.5px] text-slate-400 font-sans">Route 102 &bull; East Coast Link</div>
                  <div className="text-[9px] text-emerald-400 font-sans">IRI 2.1 &bull; 3.6 min distress delay</div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-white">3,180 trips/d</span>
                  <div className="text-[9px] text-slate-300">65% Cabin Load</div>
                </div>
              </div>
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sky-300">Kathipara &rarr; OMR Tidel</span>
                  <div className="text-[9.5px] text-slate-400 font-sans">Route 570S &bull; IT Feeder Link</div>
                  <div className="text-[9px] text-rose-400 font-sans">IRI 3.1 &bull; 4.2 min distress delay</div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-white">4,100 trips/d</span>
                  <div className="text-[9px] text-sky-400">74% Cabin Load</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FLOATING HUD 2: COVERAGE GAPS & PHASE 2 EXPANSION BANNER */}
        {showCoverageGaps && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 bg-slate-950/90 backdrop-blur-md border border-amber-500/50 rounded-xl px-4 py-2.5 shadow-xl text-xs text-slate-200 max-w-md w-full animate-fadeIn flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <div className="font-bold text-amber-300 text-[11px]">
                  Municipal Blind Spots (Dashed Amber Lines)
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Streets with 0 transit bus passes in 14 days. <strong>Phase 2 Scope:</strong> Deploy Edge AI on Swachh Bharat garbage trucks &amp; utility fleets to close coverage gap.
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowCoverageGaps(false)}
              className="text-slate-400 hover:text-white shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bottom Legend */}
        <div className="absolute bottom-3 left-3 z-10 pointer-events-none flex items-center gap-2">
          <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-1 rounded-lg flex items-center gap-3 text-[11px] font-mono pointer-events-auto shadow-md">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-slate-300">Fleet</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-slate-300">Pothole (D40)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-slate-300">Crack (D20)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              <span className="text-slate-300">Waterlog</span>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
};
