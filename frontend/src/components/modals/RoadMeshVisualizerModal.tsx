import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { 
  X, 
  RotateCw, 
  Layers, 
  Sparkles, 
  Wrench, 
  FileDown, 
  AlertTriangle,
  CheckCircle2, 
  Camera, 
  Activity, 
  Box, 
  Split, 
  Droplets, 
  CircleDot, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Video, 
  Eye, 
  Zap, 
  Bus,
  Info,
  Sliders
} from "lucide-react";

export type Defect3DType = "pothole" | "crack" | "manhole" | "waterlog";

/**
 * Guard function to determine if a defect / incident type represents a physical road surface
 * structural defect (e.g. potholes, cracks, manhole subsidence, waterlogging cavities)
 * rather than a vehicular, driver, or behavioral violation (e.g. hit & run, harsh/rash driving, speeding).
 */
export const isRoadSurfaceDefect = (type?: string): boolean => {
  if (!type) return false;
  const t = type.toLowerCase().trim();

  // 1. Explicitly reject vehicular, driver, and behavioral violations
  const behavioralKeywords = [
    "hit", "run", "rash", "harsh", "reckless", "driving",
    "overtake", "lane", "encroach", "pedestrian", "jaywalk",
    "speed", "overspeed", "vehicle", "traffic", "signal",
    "challan", "fir", "plate", "anpr", "congestion"
  ];
  if (behavioralKeywords.some(k => t.includes(k))) {
    return false;
  }

  // 2. Explicitly accept physical road surface deformities & structural voids
  const surfaceDefectKeywords = [
    "pothole", "cavity", "crater", "d40", "potholes",
    "crack", "fissure", "alligator", "transverse", "longitudinal",
    "d10", "d20", "ravelling", "rutting",
    "manhole", "subsidence", "depression",
    "waterlog", "submerged", "road damage", "road hazard", "surface"
  ];
  return surfaceDefectKeywords.some(k => t.includes(k));
};

export interface PotholeSensorTelemetry {
  id: string;
  locationName: string;
  roadName?: string;
  depthCm: number;
  areaM2: number;
  volumeLiters: number;
  costInr: number;
  iriScore: number;
  sensorGz: number;
  cameraConfidence: number;
  footageImageUrl?: string;
  detectedBusId?: string;
  defectType?: string;
}

export interface BusEvidencePass {
  id: string;
  busId: string;
  routeNumber: string;
  routeName: string;
  timestamp: string;
  speedKmh: number;
  imuGz: number;
  imageUrl: string;
  cameraConfidence: number;
  passNumber: number;
  label: string;
  phase: string;
  relativeTime: string;
  bBox?: { top: number; left: number; width: number; height: number };
}

export type ExteriorChannelId = "cam1_front" | "cam2_rear" | "cam3_left_curb" | "cam4_right_carriage";

export interface ExteriorCameraFeed {
  id: ExteriorChannelId;
  channelCode: string;
  label: string;
  perspectiveDesc: string;
  imageUrl: string;
  videoUrl?: string;
  speedKmh: number;
  imuGz: number;
  gNorm: number;
  confidence: number;
  timestamp: string;
  busId: string;
  coords: string;
  inspectionRole: string;
}

interface RoadMeshVisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  hazardId?: string;
  locationName?: string;
  depthCm?: number;
  areaM2?: number;
  volumeLiters?: number;
  costInr?: number;
  iriScore?: number;
  sensorGz?: number;
  cameraConfidence?: number;
  footageImageUrl?: string;
  videoEvidenceUrl?: string;
  evidencePasses?: BusEvidencePass[];
  detectedBusId?: string;
  defectType?: string;
  onDispatchWorkOrder?: () => void;
  canDispatchWorkOrder?: boolean;
}

const DEFAULT_POTHOLE_IMG = "/evidence/bus_pass_1_detect.jpg";
const DEFAULT_DASHCAM_VIDEO = "/evidence/bus_dashcam_pothole_patrol.mp4";

export const buildDefaultPasses = (
  busId: string,
  gz: number,
  conf: number,
  primaryImg?: string,
  _defectName: string = "D40 Cavity",
  _depth: number = 8.4
): BusEvidencePass[] => {
  const pImg = primaryImg && !primaryImg.includes("Broken_Roads_in_India") && !primaryImg.includes("Pothole_in_an_asphalt")
    ? primaryImg 
    : "/evidence/bus_pass_1_detect.jpg";

  return [
    {
      id: "pass-1-approach",
      busId: busId || "TN-01-N-1042",
      routeNumber: "MTC 19B",
      routeName: "Tambaram ↔ Broadway Express Corridor",
      timestamp: "Today, 07:14:21.180 IST",
      speedKmh: 42.4,
      imuGz: 0.98,
      imageUrl: "/evidence/bus_pass_1_approach.jpg",
      cameraConfidence: Math.max(76, conf - 12),
      passNumber: 1,
      label: "Pass 1 • Approach (T-1.2s)",
      phase: "Approach Phase (T -1.2s)",
      relativeTime: "-1.2s",
      bBox: { top: 48, left: 42, width: 22, height: 16 }
    },
    {
      id: "pass-1-detect",
      busId: busId || "TN-01-N-1042",
      routeNumber: "MTC 19B",
      routeName: "Tambaram ↔ Broadway Express Corridor",
      timestamp: "Today, 07:14:22.420 IST",
      speedKmh: 38.1,
      imuGz: 1.45,
      imageUrl: pImg,
      cameraConfidence: conf,
      passNumber: 1,
      label: "Pass 1 • Detection (T-0.5s)",
      phase: "Stereo Disparity Trigger (T -0.5s)",
      relativeTime: "-0.5s",
      bBox: { top: 50, left: 40, width: 28, height: 22 }
    },
    {
      id: "pass-1-impact",
      busId: busId || "TN-01-N-1042",
      routeNumber: "MTC 19B",
      routeName: "Tambaram ↔ Broadway Express Corridor",
      timestamp: "Today, 07:14:22.920 IST",
      speedKmh: 34.6,
      imuGz: gz,
      imageUrl: "/evidence/bus_pass_1_impact.jpg",
      cameraConfidence: Math.min(99, conf + 2),
      passNumber: 1,
      label: "Pass 1 • Axle Impact (T-0.0s)",
      phase: "Axle Shock Peak (T 0.0s)",
      relativeTime: "0.0s",
      bBox: { top: 60, left: 36, width: 34, height: 26 }
    },
    {
      id: "pass-2-daylight",
      busId: "TN-02-N-3891",
      routeNumber: "MTC 570",
      routeName: "Koyambedu ↔ Siruseri IT Expressway",
      timestamp: "Today, 09:32:15.040 IST",
      speedKmh: 41.2,
      imuGz: Number((gz * 0.93).toFixed(2)),
      imageUrl: "/evidence/bus_pass_2_confirm.jpg",
      cameraConfidence: Math.max(88, conf - 4),
      passNumber: 2,
      label: "Pass 2 • Validation (09:32)",
      phase: "Secondary Bus Patrol (2h 18m later)",
      relativeTime: "+2h 18m",
      bBox: { top: 54, left: 38, width: 25, height: 18 }
    },
    {
      id: "pass-3-fleet",
      busId: "TN-09-E-7721",
      routeNumber: "MTC 21G",
      routeName: "Vandalur Zoo ↔ Broadway Express",
      timestamp: "Today, 11:05:48.880 IST",
      speedKmh: 36.8,
      imuGz: Number((gz * 0.97).toFixed(2)),
      imageUrl: "/evidence/bus_pass_3_concurrence.jpg",
      cameraConfidence: Math.min(97, conf + 1),
      passNumber: 3,
      label: "Pass 3 • Fleet Audit (11:05)",
      phase: "Independent Cross-Fleet Concurrence",
      relativeTime: "+3h 51m",
      bBox: { top: 48, left: 44, width: 22, height: 16 }
    }
  ];
};

export const buildExteriorCameraFeeds = (
  busId: string,
  sensorGz: number,
  cameraConfidence: number,
  footageImageUrl?: string,
  videoEvidenceUrl?: string
): ExteriorCameraFeed[] => {
  const frontImg = footageImageUrl && !footageImageUrl.includes("Broken_Roads_in_India") && !footageImageUrl.includes("Pothole_in_an_asphalt")
    ? footageImageUrl
    : "/evidence/bus_pass_1_detect.jpg";

  const v1 = 38.4;
  const gNorm1 = Number((Math.abs(sensorGz - 1.0) / (v1 / 30)).toFixed(2));

  const v2 = 36.2;
  const gz2 = Number((sensorGz * 1.15).toFixed(2));
  const gNorm2 = Number((Math.abs(gz2 - 1.0) / (v2 / 30)).toFixed(2));

  return [
    {
      id: "cam1_front",
      channelCode: "CAM-01",
      label: "Front Windshield Dashcam",
      perspectiveDesc: "Primary forward optical hazard detection & disparity depth estimation",
      imageUrl: frontImg,
      videoUrl: videoEvidenceUrl || DEFAULT_DASHCAM_VIDEO,
      speedKmh: v1,
      imuGz: sensorGz,
      gNorm: gNorm1,
      confidence: cameraConfidence,
      timestamp: "Today, 07:14:22.420 IST",
      busId: busId || "TN-01-N-1042",
      coords: "12.9516°N, 80.1462°E",
      inspectionRole: "Primary optical hazard detection & road corridor line-of-sight",
    },
    {
      id: "cam2_rear",
      channelCode: "CAM-02",
      label: "Rear Road Surface Overview",
      perspectiveDesc: "Trailing axle distress verification & post-wheel strike cavity inspection",
      imageUrl: "/evidence/bus_pass_1_impact.jpg",
      speedKmh: v2,
      imuGz: gz2,
      gNorm: gNorm2,
      confidence: Math.min(99, cameraConfidence + 2),
      timestamp: "Today, 07:14:22.920 IST",
      busId: busId || "TN-01-N-1042",
      coords: "12.9515°N, 80.1461°E",
      inspectionRole: "Trailing rear axle impact verification & pavement rebound profile",
    },
    {
      id: "cam3_left_curb",
      channelCode: "CAM-03",
      label: "Left Curb / Footpath View",
      perspectiveDesc: "Curb subsidence, sidewalk clearance, open manholes & roadside drainage",
      imageUrl: "/evidence/bus_pass_2_confirm.jpg",
      speedKmh: 38.4,
      imuGz: 1.42,
      gNorm: 0.42,
      confidence: Math.max(88, cameraConfidence - 4),
      timestamp: "Today, 07:14:22.420 IST",
      busId: busId || "TN-01-N-1042",
      coords: "12.9516°N, 80.1460°E",
      inspectionRole: "Curb subsidence, sidewalk pedestrian clearance & drainage inlets",
    },
    {
      id: "cam4_right_carriage",
      channelCode: "CAM-04",
      label: "Right Carriageway / Overtaking Lane",
      perspectiveDesc: "Median dividers, lane encroachment, overtaking clearance & traffic flow",
      imageUrl: "/evidence/bus_pass_3_concurrence.jpg",
      speedKmh: 38.4,
      imuGz: 1.38,
      gNorm: 0.38,
      confidence: Math.min(97, cameraConfidence + 1),
      timestamp: "Today, 07:14:22.420 IST",
      busId: busId || "TN-01-N-1042",
      coords: "12.9517°N, 80.1464°E",
      inspectionRole: "Median divider integrity, lane encroachment & traffic flow monitoring",
    },
  ];
};

export const RoadMeshVisualizerModal: React.FC<RoadMeshVisualizerModalProps> = ({
  isOpen,
  onClose,
  hazardId = "CL-0042",
  locationName = "GST Road NH-32 (Near Chennai Bypass)",
  depthCm = 8.4,
  areaM2 = 0.65,
  volumeLiters = 42.5,
  costInr = 3450,
  iriScore = 4.82,
  sensorGz = 2.8,
  cameraConfidence = 94,
  footageImageUrl = DEFAULT_POTHOLE_IMG,
  videoEvidenceUrl = DEFAULT_DASHCAM_VIDEO,
  evidencePasses,
  detectedBusId = "Bus #04 (TN-01-N-1042)",
  defectType = "D40 Severe Cavity",
  onDispatchWorkOrder,
  canDispatchWorkOrder = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cutPlaneGroupRef = useRef<THREE.Group | null>(null);
  const deepestYRef = useRef<number>(-2.2);

  // 3D Viewport Controls State
  const [renderMode, setRenderMode] = useState<"solid" | "wireframe" | "contour">("solid");
  const [cameraMode, setCameraMode] = useState<"turntable" | "walk">("turntable");
  const [autoRotate, setAutoRotate] = useState(true);
  const [showLayersCutaway, setShowLayersCutaway] = useState(false);
  const [dispatched, setDispatched] = useState(false);

  // Interactive Depth Slicing Cut-Plane State (0.0 to 25.0 cm, step 0.5 cm)
  const [cutDepthCm, setCutDepthCm] = useState<number>(0);

  // 4-Channel Multi-Camera Perspective Switcher State
  const [activeChannelId, setActiveChannelId] = useState<ExteriorChannelId>("cam1_front");

  // Evidence deck states
  const [evidenceTab, setEvidenceTab] = useState<"multi-cam" | "multi-pass" | "telemetry" | "dashcam-video">("multi-cam");
  const [activePassIdx, setActivePassIdx] = useState(1); // default to detection frame
  const [isPlayingBurst, setIsPlayingBurst] = useState(false);
  const [showDepthOverlay, setShowDepthOverlay] = useState(false);
  const [showCameraInset, setShowCameraInset] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Resolve multi-pass evidence
  const passes: BusEvidencePass[] = evidencePasses && evidencePasses.length > 0 
    ? evidencePasses 
    : buildDefaultPasses(detectedBusId, sensorGz, cameraConfidence, footageImageUrl, defectType, depthCm);

  const activePass = passes[activePassIdx] || passes[0];

  // Resolve 4-channel exterior feeds
  const exteriorFeeds = buildExteriorCameraFeeds(detectedBusId, sensorGz, cameraConfidence, footageImageUrl, videoEvidenceUrl);
  const activeFeed = exteriorFeeds.find((f) => f.id === activeChannelId) || exteriorFeeds[0];

  // IRC:82 Civil Engineering Physical Allowances
  const SAW_CUT_MARGIN_PCT = 15.0; // Rectangular saw-cut perimeter box trim (+15%)
  const COMPACTION_FACTOR = 1.10;  // Bulk asphalt compaction factor (+10%)
  const IRC82_VOLUME_FACTOR = (1.0 + SAW_CUT_MARGIN_PCT / 100.0) * COMPACTION_FACTOR; // 1.265

  // Dynamic Volumetric Cavity Fill & PWD SOR Cost Recalculation
  // V(d_cut) = volumeLiters * (max(0, (depthCm - cutDepthCm) / depthCm))^1.5
  const rawSlicedVolume = Number(
    (volumeLiters * Math.pow(Math.max(0, (depthCm - cutDepthCm) / Math.max(0.1, depthCm)), 1.5)).toFixed(2)
  );
  const slicedVolume = Number((rawSlicedVolume * IRC82_VOLUME_FACTOR).toFixed(2));
  const slicedMassKg = Math.round(slicedVolume * 2.35); // 2.35 g/cm³ bulk density (MoRTH 500)
  const slicedCost = Math.round(costInr * (slicedVolume / Math.max(0.1, volumeLiters * IRC82_VOLUME_FACTOR)));

  // Auto-play burst sequence logic
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlayingBurst && evidenceTab === "multi-pass") {
      timer = setInterval(() => {
        setActivePassIdx((prev) => (prev + 1) % 3);
      }, 750);
    }
    return () => clearInterval(timer);
  }, [isPlayingBurst, evidenceTab]);

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsVideoPlaying(true);
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  };

  // Determine initial active 3D defect model from defectType prop
  const getInitialMode = (typeStr: string): Defect3DType => {
    const t = typeStr.toLowerCase();
    if (t.includes("water") || t.includes("flood") || t.includes("submerged")) return "waterlog";
    if (t.includes("crack") || t.includes("d10") || t.includes("d20") || t.includes("fatigue") || t.includes("ravelling")) return "crack";
    if (t.includes("manhole") || t.includes("trench") || t.includes("drop")) return "manhole";
    return "pothole";
  };

  const [activeDefectMode, setActiveDefectMode] = useState<Defect3DType>(() => getInitialMode(defectType));

  // Dynamic depth scale
  const depthScale = Math.max(0.4, Math.min(depthCm / 8.4, 2.2));

  // Update Cut-Plane Mesh Elevation when cutDepthCm changes
  useEffect(() => {
    if (cutPlaneGroupRef.current) {
      const dY = Math.abs(deepestYRef.current) || (2.2 * depthScale);
      // Cut position: 0cm is at surface (0.02 above plane to avoid z-fighting), max void is at deepestY
      const fraction = cutDepthCm === 0 ? 0 : cutDepthCm / Math.max(0.1, depthCm);
      const yCut = cutDepthCm === 0 ? 0.02 : -(fraction * dY);
      cutPlaneGroupRef.current.position.y = yCut;
    }
  }, [cutDepthCm, depthCm, depthScale]);

  // Update Camera View Mode (Turntable Orbit vs Driver Walk POV)
  useEffect(() => {
    if (cameraRef.current) {
      if (cameraMode === "walk") {
        cameraRef.current.position.set(0, 1.8, 6.2);
        cameraRef.current.lookAt(0, -0.4, 0);
      } else {
        cameraRef.current.position.set(0, 9.5, 12);
        cameraRef.current.lookAt(0, -0.8, 0);
      }
    }
  }, [cameraMode]);

  // Three.js Scene Setup & Disposal
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 440;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080D18);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    if (cameraMode === "walk") {
      camera.position.set(0, 1.8, 6.2);
      camera.lookAt(0, -0.4, 0);
    } else {
      camera.position.set(0, 9.5, 12);
      camera.lookAt(0, -0.8, 0);
    }
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Root rotation group for synchronized drag & auto-rotate
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0x93c5fd, 1.4);
    sunLight.position.set(8, 14, 10);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0xf43f5e, 0.6);
    rimLight.position.set(-8, -4, -6);
    scene.add(rimLight);

    // 3. Grid Plane Geometry (96 x 96 segments for high-resolution realism)
    const size = 10;
    const segments = 96;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const pos = geometry.attributes.position;
    const solidColors: number[] = [];
    const contourColors: number[] = [];

    // Track deepest point for 3D measurement marker
    let deepestY = 0;
    let deepestX = 0;
    let deepestZ = 0;

    // PROCEDURAL HEIGHT GENERATOR PER DEFECT TYPE
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      let y = 0;

      if (activeDefectMode === "pothole") {
        const angle = Math.atan2(z, x);
        const organicRadius = 2.8 * (1 + 0.18 * Math.sin(3 * angle) + 0.12 * Math.cos(5 * angle) + 0.08 * Math.sin(7 * angle));
        const dist = Math.sqrt(x * x * 1.05 + z * z * 0.95);

        if (dist < organicRadius) {
          const edgeFactor = Math.pow(1 - dist / organicRadius, 0.45);
          const subBaseGravel = (Math.sin(x * 9) * Math.cos(z * 8) + Math.sin(x * 16 + z * 14)) * 0.09;
          const multiCrater = (Math.sin(x * 2.2) * 0.2 + Math.cos(z * 2.5) * 0.15);
          y = -((edgeFactor * 2.2 + multiCrater) * depthScale + subBaseGravel);
        } else {
          y = (Math.sin(x * 12) * Math.cos(z * 12)) * 0.015;
        }

      } else if (activeDefectMode === "crack") {
        const mainCurve = 0.9 * Math.sin(x * 0.8) + 0.35 * Math.cos(x * 2.4);
        const distMain = Math.abs(z - mainCurve);
        const branch1 = 0.5 * Math.cos(z * 1.4) + 1.2;
        const distBranch1 = Math.abs(x - branch1);
        const branch2 = -0.4 * Math.sin(z * 1.8) - 1.4;
        const distBranch2 = Math.abs(x - branch2);
        const alligatorGrid = Math.abs(Math.sin(x * 3.5) * Math.sin(z * 3.5));

        let crackDepth = 0;
        if (distMain < 0.4) {
          crackDepth = Math.max(crackDepth, Math.pow(1 - distMain / 0.4, 2.5) * 1.3 * depthScale);
        }
        if (distBranch1 < 0.28 && z > -1.5) {
          crackDepth = Math.max(crackDepth, Math.pow(1 - distBranch1 / 0.28, 2) * 0.9 * depthScale);
        }
        if (distBranch2 < 0.28 && z < 1.5) {
          crackDepth = Math.max(crackDepth, Math.pow(1 - distBranch2 / 0.28, 2) * 0.85 * depthScale);
        }
        if (alligatorGrid > 0.82 && Math.sqrt(x * x + z * z) < 3.2) {
          crackDepth = Math.max(crackDepth, (alligatorGrid - 0.82) * 2.0 * depthScale);
        }

        y = -crackDepth + (Math.sin(x * 15) * 0.01);

      } else if (activeDefectMode === "manhole") {
        const dist = Math.sqrt(x * x + z * z);
        const rimRadius = 2.2;

        if (dist < 1.85) {
          const ribPattern = Math.abs(Math.sin(dist * 14)) * 0.04;
          y = -1.4 * depthScale + ribPattern;
        } else if (dist < rimRadius) {
          y = -1.6 * depthScale;
        } else if (dist < 4.0) {
          const sagFactor = Math.pow(1 - (dist - rimRadius) / (4.0 - rimRadius), 2);
          y = -sagFactor * 0.65 * depthScale;
        } else {
          y = 0;
        }

      } else if (activeDefectMode === "waterlog") {
        const dist = Math.sqrt(x * x * 0.8 + z * z * 1.2);
        if (dist < 3.6) {
          const basin = Math.pow(1 - dist / 3.6, 1.8) * 2.0 * depthScale;
          const noise = (Math.sin(x * 6) + Math.cos(z * 6)) * 0.06;
          y = -basin + noise;
        } else {
          y = 0;
        }
      }

      pos.setY(i, y);

      if (y < deepestY) {
        deepestY = y;
        deepestX = x;
        deepestZ = z;
      }

      // 1. Realistic asphalt color palette
      const color = new THREE.Color();
      if (y > -0.15) {
        const grain = (Math.sin(x * 40) * Math.cos(z * 40)) * 0.03;
        color.setRGB(0.18 + grain, 0.22 + grain, 0.28 + grain);
      } else if (y > -0.7) {
        color.setRGB(0.72, 0.45, 0.15);
      } else if (y > -1.4) {
        color.setRGB(0.85, 0.22, 0.22);
      } else {
        color.setRGB(0.55, 0.08, 0.08);
      }

      if (activeDefectMode === "manhole" && Math.sqrt(x * x + z * z) < 1.85) {
        color.setRGB(0.28, 0.32, 0.38);
      }
      solidColors.push(color.r, color.g, color.b);

      // 2. High-contrast Elevation Contour Heatmap Colors (D-16-02)
      // Emerald Green: 0cm baseline (y >= -0.06 * depthScale)
      // Goldenrod Amber: 1-5cm minor rutting / shear (-0.06 * depthScale > y >= -0.55 * depthScale)
      // Crimson Red: >5cm critical void (y < -0.55 * depthScale)
      const contourColor = new THREE.Color();
      if (y >= -0.06 * depthScale) {
        contourColor.setRGB(0.063, 0.725, 0.506); // Emerald Green #10B981
      } else if (y >= -0.55 * depthScale) {
        contourColor.setRGB(0.961, 0.620, 0.043); // Goldenrod Amber #F59E0B
      } else {
        contourColor.setRGB(0.882, 0.114, 0.282); // Crimson Red #E11D48
      }
      contourColors.push(contourColor.r, contourColor.g, contourColor.b);
    }

    deepestYRef.current = deepestY;

    // Apply active vertex colors
    const activeColorAttr = renderMode === "contour" 
      ? new THREE.Float32BufferAttribute(contourColors, 3) 
      : new THREE.Float32BufferAttribute(solidColors, 3);
    geometry.setAttribute("color", activeColorAttr);
    geometry.computeVertexNormals();

    // Primary Surface Mesh
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: renderMode === "contour" ? 0.55 : activeDefectMode === "manhole" ? 0.45 : 0.85,
      metalness: renderMode === "contour" ? 0.1 : activeDefectMode === "manhole" ? 0.35 : 0.1,
      wireframe: renderMode === "wireframe",
      flatShading: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    rootGroup.add(mesh);

    // Water Surface Plane for Waterlogged Mode
    let waterMesh: THREE.Mesh | null = null;
    if (activeDefectMode === "waterlog") {
      const waterGeom = new THREE.CircleGeometry(3.1, 48);
      waterGeom.rotateX(-Math.PI / 2);
      const waterMat = new THREE.MeshPhysicalMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.68,
        roughness: 0.08,
        transmission: 0.6,
        reflectivity: 0.85,
      });
      waterMesh = new THREE.Mesh(waterGeom, waterMat);
      waterMesh.position.set(0, -0.65 * depthScale, 0);
      rootGroup.add(waterMesh);
    }

    // Interactive Depth Cut-Plane Mesh (Cyan Slice Plane + Bounding Edge)
    const cutPlaneGroup = new THREE.Group();
    const cutGeom = new THREE.PlaneGeometry(10, 10);
    cutGeom.rotateX(-Math.PI / 2);
    const cutMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.35,
      roughness: 0.2,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const cutMesh = new THREE.Mesh(cutGeom, cutMat);
    const cutEdgeGeom = new THREE.EdgesGeometry(cutGeom);
    const cutEdgeMat = new THREE.LineBasicMaterial({ color: 0x22d3ee, linewidth: 2 });
    const cutEdgeLines = new THREE.LineSegments(cutEdgeGeom, cutEdgeMat);
    cutPlaneGroup.add(cutMesh);
    cutPlaneGroup.add(cutEdgeLines);

    // Position cut-plane based on initial cutDepthCm
    const dY = Math.abs(deepestY) || (2.2 * depthScale);
    const initialFraction = cutDepthCm === 0 ? 0 : cutDepthCm / Math.max(0.1, depthCm);
    cutPlaneGroup.position.y = cutDepthCm === 0 ? 0.02 : -(initialFraction * dY);
    rootGroup.add(cutPlaneGroup);
    cutPlaneGroupRef.current = cutPlaneGroup;

    // 3D Depth Caliper Needle & Indicator Marker
    const caliperGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(deepestX, 0.05, deepestZ),
      new THREE.Vector3(deepestX, deepestY, deepestZ),
    ]);
    const caliperMat = new THREE.LineBasicMaterial({ color: 0xf43f5e, linewidth: 2 });
    const caliperLine = new THREE.Line(caliperGeom, caliperMat);
    rootGroup.add(caliperLine);

    // Target Pin Sphere at bottom of cavity
    const sphereGeom = new THREE.SphereGeometry(0.12, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const sphereMesh = new THREE.Mesh(sphereGeom, sphereMat);
    sphereMesh.position.set(deepestX, deepestY, deepestZ);
    rootGroup.add(sphereMesh);

    // Mouse Drag Orbit Controls
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    const dom = mountRef.current;
    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      rootGroup.rotation.y += deltaX * 0.008;
      rootGroup.rotation.x += deltaY * 0.008;

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => { isDragging = false; };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(4.5, Math.min(22, camera.position.z + e.deltaY * 0.015));
    };

    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    dom.addEventListener("wheel", onWheel, { passive: false });

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (autoRotate && !isDragging) {
        rootGroup.rotation.y += 0.0035;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight || 440;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      dom.removeEventListener("wheel", onWheel);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Clean resource disposal to prevent WebGL context exhaustion (T-16-02)
      scene.traverse((object) => {
        const o = object as any;
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) {
            o.material.forEach((m: THREE.Material) => m.dispose());
          } else {
            o.material.dispose();
          }
        }
      });
      renderer.forceContextLoss();
      renderer.dispose();
      cutPlaneGroupRef.current = null;
      cameraRef.current = null;
    };
  }, [isOpen, renderMode, autoRotate, activeDefectMode, depthScale, cameraMode]);

  if (!isOpen) return null;

  const handleDispatch = () => {
    setDispatched(true);
    onDispatchWorkOrder?.();
    setTimeout(() => setDispatched(false), 3000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn select-none"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#0B101D] border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-white animate-scaleIn">
        
        {/* Modal Header Bar */}
        <div className="h-14 px-5 border-b border-slate-800 flex items-center justify-between bg-[#0E1424] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white tracking-wide">
                  3D Surface Corridor Mesh Digital Twin
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Concept Prototype
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {hazardId}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-md">
                {locationName} • <span className="text-amber-400/90 font-medium">Non-LiDAR Exploratory Reconstruction</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Modes Toggle: Solid / Wireframe / Depth Contour (D-16-02) */}
            <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-mono">
              <button
                type="button"
                onClick={() => setRenderMode("solid")}
                className={`px-2 py-1 rounded-md transition ${
                  renderMode === "solid" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                Solid
              </button>
              <button
                type="button"
                onClick={() => setRenderMode("wireframe")}
                className={`px-2 py-1 rounded-md transition ${
                  renderMode === "wireframe" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                Wireframe
              </button>
              <button
                type="button"
                onClick={() => setRenderMode("contour")}
                className={`px-2 py-1 rounded-md transition ${
                  renderMode === "contour" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                Depth Contour
              </button>
            </div>

            {/* Camera View Mode Toggle: Turntable vs Driver Walk POV (D-16-02) */}
            <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-mono">
              <button
                type="button"
                onClick={() => setCameraMode("turntable")}
                className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
                  cameraMode === "turntable" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
                title="Turntable Orbit 360°"
              >
                <RotateCw className="w-3 h-3" />
                <span>Turntable</span>
              </button>
              <button
                type="button"
                onClick={() => setCameraMode("walk")}
                className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
                  cameraMode === "walk" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
                title="Driver Walk POV View"
              >
                <Eye className="w-3 h-3" />
                <span>Walk POV</span>
              </button>
            </div>

            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-1.5 rounded-lg border transition ${
                autoRotate 
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" 
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
              title="Toggle Auto-Rotation"
            >
              <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? "animate-spin" : ""}`} />
            </button>

            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close 3D Visualizer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Persistent Concept Disclaimer Banner (Mandatory Constraint D-16-01) */}
        <div className="bg-amber-950/40 border-b border-amber-500/30 px-5 py-2 flex items-center justify-between text-xs text-amber-200 shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-medium tracking-wide">
              <strong>⚠️ Experimental Concept / Proof-of-Concept Prototype:</strong> Pavement 3D surface mesh synthesized from monocular dashcam depth + IMU elevation profile (Non-LiDAR exploratory prototype).
            </span>
          </div>
          <div className="relative group shrink-0">
            <button 
              type="button"
              className="p-1 rounded hover:bg-amber-900/50 text-amber-300 hover:text-amber-100 transition flex items-center gap-1 font-mono text-[10px] cursor-help"
              aria-label="Sensor Fusion Derivation Details"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Derivation Info</span>
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-84 p-3.5 rounded-xl bg-slate-900/95 border border-amber-500/40 text-[10.5px] text-slate-300 shadow-2xl backdrop-blur-md hidden group-hover:block z-50 pointer-events-none font-sans leading-relaxed">
              <div className="font-bold text-amber-300 mb-1 flex items-center gap-1 font-mono">
                <Sparkles className="w-3 h-3 text-amber-400" /> Sensor Fusion Derivation
              </div>
              Pavement 3D elevation topology is generated via optical disparity inference from monocular dashcam frames cross-correlated with speed-normalized vertical axle acceleration (<code className="text-amber-300 font-mono">G_norm = |Gz - 1.0| / (v / 30)</code>). It provides interactive civil engineering estimation for rapid triage, rather than sub-millimeter terrestrial LiDAR surveying.
            </div>
          </div>
        </div>

        {/* Defect Type Selector Bar (Realistic Geometry Models) */}
        <div className="px-5 py-2 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3 text-xs overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              3D Geometry Model:
            </span>
            
            <button
              onClick={() => setActiveDefectMode("pothole")}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition border ${
                activeDefectMode === "pothole"
                  ? "bg-rose-600 text-white border-rose-500 shadow-xs"
                  : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
              <span>Pothole Crater (D40)</span>
            </button>

            <button
              onClick={() => setActiveDefectMode("crack")}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition border ${
                activeDefectMode === "crack"
                  ? "bg-amber-600 text-white border-amber-500 shadow-xs"
                  : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-amber-300" />
              <span>Alligator / Fatigue Cracks (D10/D20)</span>
            </button>

            <button
              onClick={() => setActiveDefectMode("manhole")}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition border ${
                activeDefectMode === "manhole"
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                  : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <CircleDot className="w-3.5 h-3.5 text-indigo-300" />
              <span>Sunken Manhole Rim Drop</span>
            </button>

            <button
              onClick={() => setActiveDefectMode("waterlog")}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition border ${
                activeDefectMode === "waterlog"
                  ? "bg-sky-600 text-white border-sky-500 shadow-xs"
                  : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <Droplets className="w-3.5 h-3.5 text-sky-300" />
              <span>Waterlogged Pool Cavity</span>
            </button>
          </div>

          <button
            onClick={() => setShowLayersCutaway(!showLayersCutaway)}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold shrink-0 transition border flex items-center gap-1.5 ${
              showLayersCutaway
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
            }`}
          >
            <Split className="w-3 h-3" />
            <span>{showLayersCutaway ? "Hide Sub-Layers" : "Pavement Layers (IRC)"}</span>
          </button>
        </div>

        {/* Content Body: Left 3D Viewport + Right Engineering Specs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0">
          {/* 3D WebGL Canvas Viewport */}
          <div className="lg:col-span-7 relative bg-[#070B14] min-h-[380px] lg:min-h-[480px] flex items-center justify-center">
            <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            {/* Depth Overlay Caliper HUD */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700 text-xs font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-slate-400">Deepest Void: </span>
                <strong className="text-rose-400 font-bold">-{depthCm} cm</strong>
              </div>
              <div className="px-3 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[10.5px] font-mono text-slate-300">
                <span>{cameraMode === "walk" ? "Driver POV: Drag / Scroll" : "Orbit: Drag | Zoom: Scroll"}</span>
              </div>
            </div>

            {/* Interactive Depth Cut-Plane Slider Dock (D-16-02) */}
            <div className="absolute top-16 left-3 w-72 p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 shadow-xl space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Depth Cut-Plane Slice</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-bold text-[10px]">
                  {cutDepthCm.toFixed(1)} cm
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={25}
                step={0.5}
                value={cutDepthCm}
                onChange={(e) => setCutDepthCm(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />

              <div className="flex items-center justify-between text-[9px] text-slate-400">
                <button 
                  type="button" 
                  onClick={() => setCutDepthCm(0)}
                  className={`hover:text-cyan-300 transition ${cutDepthCm === 0 ? "text-cyan-300 font-bold" : ""}`}
                >
                  Surface (0cm)
                </button>
                <button 
                  type="button" 
                  onClick={() => setCutDepthCm(Number((depthCm / 2).toFixed(1)))}
                  className={`hover:text-cyan-300 transition ${cutDepthCm === Number((depthCm / 2).toFixed(1)) ? "text-cyan-300 font-bold" : ""}`}
                >
                  Mid ({(depthCm / 2).toFixed(1)}cm)
                </button>
                <button 
                  type="button" 
                  onClick={() => setCutDepthCm(depthCm)}
                  className={`hover:text-cyan-300 transition ${cutDepthCm === depthCm ? "text-cyan-300 font-bold" : ""}`}
                >
                  Base ({depthCm}cm)
                </button>
              </div>

              <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[9.5px]">
                <span className="text-slate-400">IRC:82 Patch Mix:</span>
                <span className="text-emerald-400 font-bold">{slicedVolume.toFixed(1)} L ({slicedMassKg} kg)</span>
                <span className="text-cyan-300 font-bold">₹{slicedCost.toLocaleString()}</span>
              </div>
            </div>

            {/* Pavement Sub-Layers Cross-Section Overlay */}
            {showLayersCutaway && (
              <div className="absolute top-3 right-3 p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-[10.5px] font-mono w-56 space-y-1.5 shadow-xl animate-fadeIn">
                <div className="font-bold text-white border-b border-slate-700 pb-1 flex items-center justify-between">
                  <span>IRC:37 Pavement Layers</span>
                  <span className="text-blue-400">Total 370mm</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-slate-700" />
                    Bituminous Concrete (BC):
                  </span>
                  <strong>40 mm</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-amber-700" />
                    Dense Macadam (DBM):
                  </span>
                  <strong>80 mm</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-emerald-700" />
                    Wet Mix Base (WMM):
                  </span>
                  <strong>250 mm</strong>
                </div>
                <div className="pt-1 border-t border-slate-800 text-rose-400 font-semibold">
                  Fracture penetrates into DBM Binder!
                </div>
              </div>
            )}

            {/* Optical Evidence PIP Inset (Synchronized to Active Exterior Angle) */}
            {showCameraInset && (
              <div className="absolute bottom-16 right-3 w-64 rounded-xl overflow-hidden border border-slate-700 bg-slate-900/90 backdrop-blur-md p-2 space-y-1.5 shadow-2xl animate-fadeIn">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Camera className="w-3 h-3 text-emerald-400" />
                    {activeFeed.channelCode} • Optical View
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[9px] font-bold">
                    {activeFeed.speedKmh} km/h
                  </span>
                </div>
                <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                  <img
                    src={activeFeed.imageUrl}
                    alt={activeFeed.label}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_POTHOLE_IMG;
                    }}
                  />
                  {activeChannelId === "cam1_front" && activePass.bBox && (
                    <div 
                      style={{
                        top: `${activePass.bBox.top}%`,
                        left: `${activePass.bBox.left}%`,
                        width: `${activePass.bBox.width}%`,
                        height: `${activePass.bBox.height}%`,
                      }}
                      className="absolute border-2 border-rose-500 rounded bg-rose-500/20 pointer-events-none"
                    />
                  )}
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-mono text-slate-200">
                    {activeFeed.busId} • G_norm: {activeFeed.gNorm.toFixed(2)}g
                  </div>
                </div>
                <div className="text-[9px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Axle IMU: <strong className="text-rose-400">+{activeFeed.imuGz}g</strong></span>
                  <span className="text-emerald-400 font-bold">Disparity Model</span>
                </div>
              </div>
            )}

            {/* Color Elevation Legend */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800 text-[10px] font-mono">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">
                  {renderMode === "contour" ? "Contour Heatmap:" : "Elevation Scale:"}
                </span>
                {renderMode === "contour" ? (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span>Grade (0cm)</span>
                    <span className="w-3 h-3 rounded-full bg-amber-500 ml-2" />
                    <span>Rutting (1-5cm)</span>
                    <span className="w-3 h-3 rounded-full bg-rose-600 ml-2" />
                    <span>Void (&gt;5cm)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-500" />
                    <span>Road (0cm)</span>
                    <span className="w-3 h-3 rounded-full bg-amber-500 ml-2" />
                    <span>Lip Drop (-{(depthCm * 0.35).toFixed(1)}cm)</span>
                    <span className="w-3 h-3 rounded-full bg-rose-600 ml-2" />
                    <span>Cavity (-{depthCm}cm)</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowCameraInset(!showCameraInset)}
                className={`px-2 py-1 rounded text-[10px] font-semibold transition border flex items-center gap-1 ${
                  showCameraInset
                    ? "bg-blue-600/30 text-blue-300 border-blue-500/50"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                }`}
              >
                <Camera className="w-3 h-3" />
                <span>{showCameraInset ? "Hide Camera Inset" : "Show Camera Inset"}</span>
              </button>
            </div>
          </div>

          {/* Right: Engineering Specifications, Multi-Camera Dock & Sensor Calibration */}
          <div className="lg:col-span-5 p-5 bg-[#0D1424] border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between overflow-y-auto custom-scrollbar space-y-4">
            <div className="space-y-3.5">
              {/* Transit Fleet Forensic Evidence Console */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Bus className="w-3.5 h-3.5 text-blue-400" />
                    <span>Transit Bus Optical Evidence</span>
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    DPDP ACT 2023 REDACTED
                  </span>
                </div>

                {/* Evidence Source Mode Tabs (Including 4-Cam Exterior D-16-03) */}
                <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-[10.5px] font-mono">
                  <button
                    type="button"
                    onClick={() => { setEvidenceTab("multi-cam"); setIsPlayingBurst(false); }}
                    className={`flex-1 py-1 px-1.5 rounded-lg flex items-center justify-center gap-1 transition font-semibold ${
                      evidenceTab === "multi-cam" 
                        ? "bg-blue-600 text-white shadow-xs font-bold" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                  >
                    <Layers className="w-3 h-3 text-cyan-400" />
                    <span>4-Cam Exterior</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvidenceTab("multi-pass")}
                    className={`py-1 px-1.5 rounded-lg flex items-center justify-center gap-1 transition font-semibold ${
                      evidenceTab === "multi-pass" 
                        ? "bg-blue-600 text-white shadow-xs font-bold" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                  >
                    <Camera className="w-3 h-3 text-emerald-400" />
                    <span>Passes ({passes.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEvidenceTab("telemetry"); setIsPlayingBurst(false); }}
                    className={`py-1 px-1.5 rounded-lg flex items-center justify-center gap-1 transition font-semibold ${
                      evidenceTab === "telemetry" 
                        ? "bg-blue-600 text-white shadow-xs font-bold" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                  >
                    <Activity className="w-3 h-3 text-amber-400" />
                    <span>100Hz IMU</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEvidenceTab("dashcam-video"); setIsPlayingBurst(false); }}
                    className={`py-1 px-1.5 rounded-lg flex items-center justify-center gap-1 transition font-semibold ${
                      evidenceTab === "dashcam-video" 
                        ? "bg-blue-600 text-white shadow-xs font-bold" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                  >
                    <Video className="w-3 h-3 text-blue-400" />
                    <span>Video</span>
                  </button>
                </div>

                {/* TAB 0: 4-CHANNEL MULTI-CAMERA EXTERIOR PERSPECTIVE DOCK (D-16-03) */}
                {evidenceTab === "multi-cam" && (
                  <div className="space-y-2">
                    {/* 4-Channel Perspective Switcher Dock */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {exteriorFeeds.map((feed) => (
                        <button
                          key={feed.id}
                          type="button"
                          onClick={() => setActiveChannelId(feed.id)}
                          className={`p-1.5 rounded-lg border text-left transition font-mono flex flex-col justify-between ${
                            activeChannelId === feed.id
                              ? "bg-blue-950/80 border-blue-500 text-white shadow-md shadow-blue-950/50"
                              : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[9.5px]">
                            <span className="font-bold text-cyan-400">{feed.channelCode}</span>
                            <span className="text-[8.5px] px-1 py-0.2 rounded bg-slate-900 text-slate-300">
                              {feed.speedKmh} km/h
                            </span>
                          </div>
                          <div className="text-[10px] font-semibold text-slate-200 truncate mt-0.5">
                            {feed.label}
                          </div>
                          <div className="text-[8.5px] text-amber-400/90 mt-0.5">
                            G_norm: {feed.gNorm.toFixed(2)}g
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Active Camera Perspective Frame Viewer */}
                    <div className="relative rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 aspect-video">
                      <img
                        src={activeFeed.imageUrl}
                        alt={activeFeed.label}
                        className={`w-full h-full object-cover transition duration-300 ${
                          showDepthOverlay ? "filter contrast-150 saturate-200 hue-rotate-15" : ""
                        }`}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = DEFAULT_POTHOLE_IMG;
                        }}
                      />
                      {showDepthOverlay && (
                        <div 
                          className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-60 bg-gradient-to-t from-emerald-500/30 via-amber-500/20 to-rose-600/30"
                        />
                      )}

                      {/* Header Badge */}
                      <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between text-[10px] font-mono pointer-events-none">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold">
                            {activeFeed.channelCode}
                          </span>
                          <span className="text-white font-semibold truncate max-w-[170px]">
                            {activeFeed.label}
                          </span>
                        </div>
                        <span className="text-emerald-400 text-[9px] bg-black/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                          CALIBRATED
                        </span>
                      </div>

                      {/* Bounding box on primary front channel */}
                      {activeChannelId === "cam1_front" && activePass.bBox && (
                        <div 
                          style={{
                            top: `${activePass.bBox.top}%`,
                            left: `${activePass.bBox.left}%`,
                            width: `${activePass.bBox.width}%`,
                            height: `${activePass.bBox.height}%`,
                          }}
                          className="absolute border-2 border-rose-500 rounded bg-rose-500/20 flex flex-col justify-between p-1 pointer-events-none shadow-md shadow-rose-950/50"
                        >
                          <span className="px-1 py-0.5 rounded bg-rose-600 text-white font-mono text-[8px] font-bold self-start">
                            {defectType}: {activeFeed.confidence}%
                          </span>
                          <span className="px-1 py-0.5 rounded bg-slate-950/90 text-rose-300 font-mono text-[8px] self-end">
                            Depth: {depthCm}cm
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Synchronized Telemetry HUD Strip (D-16-03) */}
                    <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800 text-[10px] font-mono space-y-1">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-cyan-300 font-bold">
                          {activeFeed.channelCode} • {activeFeed.label.toUpperCase()}
                        </span>
                        <span className="text-emerald-400 font-bold">{activeFeed.timestamp}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <div>
                          <span>SPD: <strong className="text-white">{activeFeed.speedKmh} KM/H</strong></span>
                          <span className="mx-1 text-slate-600">|</span>
                          <span>SHOCK: <strong className="text-amber-400">G_norm {activeFeed.gNorm.toFixed(2)}g</strong></span>
                          <span className="mx-1 text-slate-600">|</span>
                          <span>IMU: <strong className="text-rose-400">+{activeFeed.imuGz}g Z</strong></span>
                        </div>
                        <span className="text-slate-400">{activeFeed.coords}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-slate-400">Bus: <strong className="text-white">{activeFeed.busId}</strong></span>
                        <span className="text-blue-300 truncate max-w-[220px]">{activeFeed.inspectionRole}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => setShowDepthOverlay(!showDepthOverlay)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition flex items-center gap-1 font-mono ${
                          showDepthOverlay 
                            ? "bg-emerald-600/30 text-emerald-300 border-emerald-500/50" 
                            : "bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        <span>Disparity Heatmap: {showDepthOverlay ? "ON" : "OFF"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab 1: Live Forward Windshield Dashcam Video Feed */}
                {evidenceTab === "dashcam-video" && (
                  <div className="space-y-2">
                    <div className="relative rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 aspect-video group">
                      <video
                        ref={videoRef}
                        src={videoEvidenceUrl || DEFAULT_DASHCAM_VIDEO}
                        autoPlay
                        loop
                        muted={isMuted}
                        playsInline
                        className={`w-full h-full object-cover transition duration-300 ${
                          showDepthOverlay ? "filter contrast-150 saturate-200 hue-rotate-15" : ""
                        }`}
                      />
                      {showDepthOverlay && (
                        <div 
                          className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-60 bg-gradient-to-t from-emerald-500/30 via-amber-500/20 to-rose-600/30"
                        />
                      )}

                      {/* Top Dashcam HUD Bar */}
                      <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between text-[10px] font-mono pointer-events-none">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-600/90 text-white font-bold animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            REC 1080p60
                          </span>
                          <span className="text-slate-200 font-semibold">{detectedBusId}</span>
                        </div>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded border border-emerald-500/30 text-[9px]">
                          STEREO IMX390 HDR
                        </span>
                      </div>

                      {/* Dynamic YOLO Defect Target Box */}
                      <div className="absolute top-[46%] left-[34%] w-[32%] h-[26%] border-2 border-rose-500 rounded bg-rose-500/15 pointer-events-none transition-all duration-300 flex flex-col justify-between p-1 shadow-lg shadow-rose-950/40">
                        <div className="flex items-center justify-between">
                          <span className="px-1 py-0.5 rounded bg-rose-600 text-white font-mono text-[8.5px] font-bold">
                            {defectType}: {cameraConfidence}%
                          </span>
                          <span className="px-1 py-0.5 rounded bg-black/80 text-emerald-400 font-mono text-[8.5px] font-bold">
                            CALIBRATED
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[8.5px] font-mono text-rose-300 bg-slate-950/80 px-1 rounded">
                          <span>Est Depth:</span>
                          <span className="font-bold text-white">{depthCm} cm</span>
                        </div>
                      </div>

                      {/* Bottom Dashcam Telemetry HUD */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between text-[9.5px] font-mono pointer-events-none text-slate-300">
                        <div>
                          <span>SPD: </span>
                          <span className="text-white font-bold">38.4 KM/H</span>
                          <span className="mx-1.5 text-slate-600">|</span>
                          <span>IMU: </span>
                          <span className="text-amber-400 font-bold">+{sensorGz}g Z-AXLE</span>
                        </div>
                        <div>
                          <span className="text-slate-400">12.9516°N, 80.1462°E</span>
                        </div>
                      </div>
                    </div>

                    {/* Video Control Bar */}
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] font-mono">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={toggleVideoPlay}
                          className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
                          title={isVideoPlaying ? "Pause Dashcam" : "Play Dashcam"}
                        >
                          {isVideoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsMuted(!isMuted)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
                          title={isMuted ? "Unmute" : "Mute"}
                        >
                          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                        <span className="text-slate-400 text-[10px]">Patrol Dashcam Stream</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowDepthOverlay(!showDepthOverlay)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition flex items-center gap-1 ${
                          showDepthOverlay 
                            ? "bg-emerald-600/30 text-emerald-300 border-emerald-500/50" 
                            : "bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        <span>Disparity Heatmap: {showDepthOverlay ? "ON" : "OFF"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab 2: Multi-Bus Patrol Passes & Approach Burst */}
                {evidenceTab === "multi-pass" && (
                  <div className="space-y-2">
                    {/* Pass Selector Pills */}
                    <div className="flex items-center justify-between gap-1 overflow-x-auto custom-scrollbar pb-1">
                      <div className="flex items-center gap-1">
                        {passes.map((p, idx) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => { setActivePassIdx(idx); setIsPlayingBurst(false); }}
                            className={`px-2 py-1 rounded-md text-[10px] font-mono whitespace-nowrap border transition ${
                              activePassIdx === idx
                                ? "bg-blue-600 text-white border-blue-500 font-bold shadow-xs"
                                : "bg-slate-900/90 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPlayingBurst(!isPlayingBurst)}
                        className={`px-2 py-1 rounded-md text-[10px] font-mono whitespace-nowrap border shrink-0 transition flex items-center gap-1 ${
                          isPlayingBurst
                            ? "bg-amber-600 text-white border-amber-500 font-bold animate-pulse"
                            : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                        }`}
                        title="Auto-step through vehicle approach sequence"
                      >
                        {isPlayingBurst ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                        <span>{isPlayingBurst ? "Stop Burst" : "Auto Burst"}</span>
                      </button>
                    </div>

                    {/* Displayed Frame */}
                    <div className="relative rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 aspect-video">
                      <img
                        src={activePass.imageUrl}
                        alt={`Bus Evidence Pass ${activePass.passNumber}`}
                        className={`w-full h-full object-cover transition duration-300 ${
                          showDepthOverlay ? "filter contrast-150 saturate-200 hue-rotate-15" : ""
                        }`}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = DEFAULT_POTHOLE_IMG;
                        }}
                      />
                      {showDepthOverlay && (
                        <div 
                          className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-60 bg-gradient-to-t from-emerald-500/30 via-amber-500/20 to-rose-600/30"
                        />
                      )}

                      {/* Frame Top Header */}
                      <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between text-[10px] font-mono pointer-events-none">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold">
                            PASS {activePass.passNumber}
                          </span>
                          <span className="text-white font-semibold">{activePass.phase}</span>
                        </div>
                        <span className="text-slate-300 text-[9px]">{activePass.relativeTime}</span>
                      </div>

                      {/* Defect Bounding Box */}
                      {activePass.bBox && (
                        <div 
                          style={{
                            top: `${activePass.bBox.top}%`,
                            left: `${activePass.bBox.left}%`,
                            width: `${activePass.bBox.width}%`,
                            height: `${activePass.bBox.height}%`,
                          }}
                          className="absolute border-2 border-rose-500 rounded bg-rose-500/20 flex flex-col justify-between p-1 pointer-events-none shadow-md shadow-rose-950/50"
                        >
                          <span className="px-1 py-0.5 rounded bg-rose-600 text-white font-mono text-[8px] font-bold self-start">
                            {defectType}: {activePass.cameraConfidence}%
                          </span>
                          <span className="px-1 py-0.5 rounded bg-slate-950/90 text-rose-300 font-mono text-[8px] self-end">
                            Depth: {depthCm}cm
                          </span>
                        </div>
                      )}

                      {/* Frame Bottom Telemetry Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between text-[9.5px] font-mono pointer-events-none text-slate-300">
                        <div>
                          <span className="text-slate-400">Bus: </span>
                          <span className="text-white font-bold">{activePass.busId}</span>
                          <span className="mx-1 text-slate-600">•</span>
                          <span className="text-slate-400">{activePass.routeNumber}</span>
                        </div>
                        <div>
                          <span className="text-emerald-400 font-bold">{activePass.speedKmh} km/h</span>
                          <span className="mx-1 text-slate-600">|</span>
                          <span className="text-amber-400 font-bold">+{activePass.imuGz}g</span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata & Controls Bar */}
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[10.5px] font-mono space-y-1">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Patrol Timestamp:</span>
                        <span className="text-white font-bold">{activePass.timestamp}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Transit Fleet Corridor:</span>
                        <span className="text-blue-300">{activePass.routeName}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Synchronized 100Hz IMU Axle Waveform */}
                {evidenceTab === "telemetry" && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-300 font-bold flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        100Hz Axle IMU Shock Waveform
                      </span>
                      <span className="text-emerald-400 font-bold text-[10px]">CROSS-CORR r=0.942</span>
                    </div>

                    {/* SVG Waveform Graphic */}
                    <div className="relative h-24 w-full bg-slate-900/90 rounded-lg p-2 border border-slate-800 overflow-hidden">
                      <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
                        <line x1="0" y1="40" x2="300" y2="40" stroke="#334155" strokeDasharray="3,3" strokeWidth="0.8" />
                        <line x1="150" y1="0" x2="150" y2="80" stroke="#ef4444" strokeDasharray="2,2" strokeWidth="1" />
                        
                        <path
                          d="M 0,40 Q 40,39 70,41 T 110,40 T 130,48 L 140,52 L 150,8 L 160,65 L 175,25 L 190,50 L 210,36 L 240,42 L 300,40"
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2"
                        />
                        <path
                          d="M 0,40 Q 40,39 70,41 T 110,40 T 130,48 L 140,52 L 150,8 L 160,65 L 175,25 L 190,50 L 210,36 L 240,42 L 300,40 L 300,80 L 0,80 Z"
                          fill="url(#imuGrad)"
                          opacity="0.25"
                        />
                        <defs>
                          <linearGradient id="imuGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" />
                            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>

                      <div className="absolute top-1 left-[50%] -translate-x-1/2 px-1.5 py-0.5 rounded bg-rose-600/90 text-white font-mono text-[8px] font-bold shadow">
                        Peak: +{sensorGz}g Wheel Strike
                      </div>
                      <div className="absolute bottom-1 left-2 text-[8px] font-mono text-slate-500">
                        T -1000ms
                      </div>
                      <div className="absolute bottom-1 right-2 text-[8px] font-mono text-slate-500">
                        T +1000ms
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block">Axle Z-Axis Shock</span>
                        <span className="text-xs font-bold text-rose-400 font-mono">+{sensorGz}g Vertical</span>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block">Damping Deceleration</span>
                        <span className="text-xs font-bold text-amber-400 font-mono">0.38 m/s²</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Civil Engineering Material Calculation Scorecard */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Civil Engineering Specifications</span>
                  </h4>
                  {cutDepthCm > 0 && (
                    <span className="text-[9.5px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
                      Sliced at {cutDepthCm.toFixed(1)}cm
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Reconstructed Depth</div>
                    <div className="text-base font-extrabold text-rose-400 font-mono mt-0.5">{depthCm} cm</div>
                    <div className="text-[9px] text-rose-300/80 mt-0.5 font-semibold font-mono">CRITICAL SEVERITY</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Surface Area Defect</div>
                    <div className="text-base font-bold text-white font-mono mt-0.5">{areaM2} m²</div>
                    <div className="text-[9px] text-slate-400 mt-0.5 font-mono">~{(Math.sqrt(areaM2) * 3.5).toFixed(1)}m span</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Asphalt Hot-Mix Volume</span>
                      <span className="text-[8.5px] px-1 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-mono">IRC:82 Cl 5.2/5.4</span>
                    </div>
                    <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                      {slicedVolume} L <span className="text-[10px] text-slate-400 font-normal">({slicedMassKg} kg)</span>
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5 font-mono">
                      Raw: {rawSlicedVolume.toFixed(1)}L • Patch (+26.5% trim/compaction)
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Roughness Score (IRI)</div>
                    <div className="text-sm font-bold text-amber-400 font-mono mt-0.5">{iriScore} m/km</div>
                    <div className="text-[9px] text-amber-300/80 mt-0.5 font-semibold font-mono">POOR RIDING QUALITY</div>
                  </div>
                </div>

                {/* Repair Cost according to PWD SOR 2025 */}
                <div className="p-2.5 mt-2 rounded-xl bg-blue-950/40 border border-blue-900/50 flex items-center justify-between">
                  <div>
                    <div className="text-blue-300 text-[10.5px]">
                      PWD SOR 2025 Repair Cost {cutDepthCm > 0 && <span className="text-cyan-300">(Cut-Plane Pro-Rated)</span>}
                    </div>
                    <div className="text-base font-extrabold text-blue-400 font-mono">
                      ₹{slicedCost.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-blue-300/80 font-mono mt-0.5">
                      IRC:82 Cl 5.2 (+15% Saw-Cut) &amp; Cl 5.4 (+10% Compaction @ 2.35 kg/L)
                    </div>
                  </div>
                  <span className="text-[10px] text-blue-300 font-mono px-2 py-0.5 rounded bg-blue-900/50">
                    Item 4.12 PWD SOR 2025
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                onClick={handleDispatch}
                disabled={dispatched || !canDispatchWorkOrder}
                title={canDispatchWorkOrder ? 'Generate and dispatch work order' : 'Dispatch requires a Road Maintenance Officer or Platform Administrator role.'}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md ${
                  dispatched 
                    ? "bg-emerald-600 text-white" 
                    : canDispatchWorkOrder ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 active:scale-98" : "bg-slate-700 text-slate-400 cursor-not-allowed"
                }`}
              >
                {dispatched ? <CheckCircle2 className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                <span>{dispatched ? "Work Order Dispatched to Contractor!" : canDispatchWorkOrder ? "Generate Work Order & Dispatch" : "Dispatch restricted by role"}</span>
              </button>

              <button
                onClick={() => alert(`Exported high-res 3D scan mesh (.OBJ) and IRC layer profile for ${hazardId}.`)}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-400" />
                <span>Export 3D CAD (.OBJ) &amp; Disparity Map</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
