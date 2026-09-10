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
  Sliders,
  TrendingUp,
  X,
  Radio,
  Clock
} from 'lucide-react';
import { HazardCluster, FleetNode, TrafficIncident } from '../../types';
import { Button } from '../ui/Button';
import { CHENNAI_POIS } from '../../services/api';
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
  { name: "GST Road", lat: 12.9516, lng: 80.1462, zoom: 15.0, icon: "📍" },
  { name: "Kathipara Cloverleaf", lat: 13.0067, lng: 80.2030, zoom: 15.2, icon: "🏛️" },
  { name: "OMR IT Expressway", lat: 12.9719, lng: 80.2500, zoom: 14.8, icon: "⚡" },
  { name: "Anna Salai CBD", lat: 13.0604, lng: 80.2496, zoom: 15.0, icon: "🏙️" },
  { name: "Central Station Link", lat: 13.0827, lng: 80.2707, zoom: 15.4, icon: "🚉" },
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
  const [showPOIs, setShowPOIs] = useState(true);
  const [showVisionZeroBuffers, setShowVisionZeroBuffers] = useState(true);
  const [isGisMenuOpen, setIsGisMenuOpen] = useState(false);
  const [isInfoMenuOpen, setIsInfoMenuOpen] = useState(false);

  // Split-Screen "Before vs After" comparison slider state
  const [isBeforeAfterActive, setIsBeforeAfterActive] = useState(false);
  const [splitSliderPos, setSplitSliderPos] = useState<number>(50); // 0 - 100%

  // Elevation & Roughness Profile Bottom Pop-up state
  const [activeProfileCorridor, setActiveProfileCorridor] = useState<string | null>(null);
  const [hoveredProfileIndex, setHoveredProfileIndex] = useState<number | null>(null);

  const activeGisCount = (showHeatmap ? 1 : 0) + (showTrafficCongestion ? 1 : 0) + (showBreadcrumbs ? 1 : 0) + (showMonsoonContours ? 1 : 0) + (showPOIs ? 1 : 0) + (showVisionZeroBuffers ? 1 : 0);

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
      const isResolved = cluster.status === 'resolved';
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
        el.innerHTML = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: #2563eb; color: #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(37,99,235,0.4); border: 2px solid #ffffff; transform: rotate(${bus.heading || 0}deg);">
              🚌
            </div>
            <div style="position: absolute; bottom: -18px; font-family: monospace; font-size: 9px; font-weight: 700; background: #0f172a; color: #ffffff; padding: 1px 4px; border-radius: 4px; white-space: nowrap; border: 1px solid #3b82f6;">
              ${bus.id.replace('BUS-', '')}
            </div>
          </div>
        `;

        el.addEventListener('click', () => {
          if (bus.route_name.includes('GST')) setActiveProfileCorridor('GST Road');
          else if (bus.route_name.includes('OMR')) setActiveProfileCorridor('OMR Expressway');
          else setActiveProfileCorridor('Anna Salai');
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([bus.lng, bus.lat])
          .addTo(map);

        busMarkersRef.current[bus.id] = marker;
      } else {
        busMarkersRef.current[bus.id].setLngLat([bus.lng, bus.lat]);
      }
    });
  }, [fleet, isMapReady]);

  // Render Incidents
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    incidents.forEach((incident) => {
      if (!incidentMarkersRef.current[incident.id]) {
        const el = document.createElement('div');
        el.className = 'cursor-pointer group';
        el.innerHTML = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: #ffffff; border: 2.5px solid #ef4444; box-shadow: 0 0 10px #ef4444; display: flex; align-items: center; justify-content: center; font-size: 13px;">
              🚨
            </div>
          </div>
        `;

        el.addEventListener('click', () => {
          onSelectIncident?.(incident);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([incident.lng, incident.lat])
          .addTo(map);

        incidentMarkersRef.current[incident.id] = marker;
      }
    });
  }, [incidents, isMapReady]);

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

          <button
            onClick={() => setIsBeforeAfterActive(!isBeforeAfterActive)}
            title="Split-Screen Comparison"
            className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 text-[11px] ${
              isBeforeAfterActive
                ? 'bg-purple-600 text-white font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3 h-3 text-purple-400" />
            <span className="hidden sm:inline">Compare</span>
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Split-Screen Slider Overlay Banner */}
      {isBeforeAfterActive && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-2xl border border-purple-500/50 shadow-2xl flex items-center gap-4 text-xs font-mono animate-slideUp">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-bold text-rose-300">LEFT: Pre-Monsoon (Nov 2025)</span>
          </div>
          <div className="h-3 w-px bg-slate-700" />
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-emerald-300">RIGHT: Live Telemetry (Today)</span>
          </div>
          <input
            type="range"
            min="10"
            max="90"
            value={splitSliderPos}
            onChange={(e) => setSplitSliderPos(Number(e.target.value))}
            className="w-32 accent-purple-500 cursor-pointer"
          />
          <button
            onClick={() => setIsBeforeAfterActive(false)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Map Canvas */}
      <div className="flex-1 w-full h-full relative">
        <div ref={mapContainerRef} className="w-full h-full" style={{ width: "100%", height: "100%", minHeight: "460px" }} />

        {/* Split Divider Line on Map */}
        {isBeforeAfterActive && (
          <div 
            className="absolute top-0 bottom-0 z-10 pointer-events-none border-r-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.7)]"
            style={{ left: `${splitSliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -ml-3.5 w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-lg">
              ↔
            </div>
          </div>
        )}

        {/* Bottom Legend */}
        <div className="absolute bottom-3 left-3 z-10 pointer-events-none flex items-center gap-2">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-3 text-xs pointer-events-auto shadow-md">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-[10.5px] text-slate-700 dark:text-slate-300 font-medium">Bus</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-[10.5px] text-slate-700 dark:text-slate-300 font-medium">D40 Pothole</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-[10.5px] text-slate-700 dark:text-slate-300 font-medium">D20 Crack</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <span className="text-[10.5px] text-slate-700 dark:text-slate-300 font-medium">Waterlog</span>
            </div>
          </div>
        </div>

        {/* Live Elevation & IRI Roughness Profile Chart Pop-up */}
        {activeProfileCorridor && CORRIDOR_PROFILES[activeProfileCorridor] && (
          <div className="absolute bottom-12 right-3 z-20 w-96 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-3.5 shadow-2xl text-xs space-y-2.5 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-bold text-slate-900 dark:text-slate-100">{activeProfileCorridor} IRI Profile</span>
              </div>
              <button
                onClick={() => setActiveProfileCorridor(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* SVG Interactive Elevation Profile Chart */}
            <div className="h-24 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 320 80">
                {/* Grid Lines */}
                <line x1="0" y1="20" x2="320" y2="20" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 3" />
                <line x1="0" y1="50" x2="320" y2="50" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 3" />
                
                {/* Elevation Polyline */}
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  points={CORRIDOR_PROFILES[activeProfileCorridor].map((pt, i) => `${(i / (CORRIDOR_PROFILES[activeProfileCorridor].length - 1)) * 320},${80 - (pt.elevation / 25) * 70}`).join(' ')}
                />

                {/* IRI Roughness Nodes */}
                {CORRIDOR_PROFILES[activeProfileCorridor].map((pt, i) => {
                  const x = (i / (CORRIDOR_PROFILES[activeProfileCorridor].length - 1)) * 320;
                  const y = 80 - (pt.elevation / 25) * 70;
                  const isHovered = hoveredProfileIndex === i;
                  return (
                    <g key={i} onMouseEnter={() => setHoveredProfileIndex(i)} onMouseLeave={() => setHoveredProfileIndex(null)} className="cursor-pointer">
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? 6 : 4}
                        fill={pt.iri >= 4.0 ? '#ef4444' : pt.iri >= 3.0 ? '#f59e0b' : '#10b981'}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Selected / Hovered Node Metadata */}
            {hoveredProfileIndex !== null ? (
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-mono text-[11px] flex justify-between">
                <span>{CORRIDOR_PROFILES[activeProfileCorridor][hoveredProfileIndex].road}</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  IRI: {CORRIDOR_PROFILES[activeProfileCorridor][hoveredProfileIndex].iri} m/km
                </span>
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 font-mono text-center">
                Hover nodes along corridor to inspect IRI roughness &amp; elevation
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
};
