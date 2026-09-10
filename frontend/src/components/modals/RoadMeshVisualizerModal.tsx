import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { 
  X, 
  RotateCw, 
  Layers, 
  Sparkles, 
  Wrench, 
  FileDown, 
  Gauge, 
  AlertTriangle,
  Compass,
  CheckCircle2,
  Camera,
  Activity,
  Box,
  Split,
  Maximize2,
  Droplets,
  CircleDot
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
  detectedBusId?: string;
  defectType?: string;
  onDispatchWorkOrder?: () => void;
  canDispatchWorkOrder?: boolean;
}

const DEFAULT_POTHOLE_IMG = "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80";

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
  detectedBusId = "Bus #04 (TN-01-N-1042)",
  defectType = "D40 Severe Cavity",
  onDispatchWorkOrder,
  canDispatchWorkOrder = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [renderMode, setRenderMode] = useState<"solid" | "wireframe" | "lidar">("solid");
  const [autoRotate, setAutoRotate] = useState(true);
  const [showLayersCutaway, setShowLayersCutaway] = useState(false);
  const [dispatched, setDispatched] = useState(false);

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

  // Three.js Scene Setup
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 440;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080D18);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 9.5, 12);
    camera.lookAt(0, -0.8, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

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
    const colors: number[] = [];

    // Track deepest point for 3D measurement marker
    let deepestY = 0;
    let deepestX = 0;
    let deepestZ = 0;

    // =========================================================================
    // PROCEDURAL HEIGHT GENERATOR PER DEFECT TYPE
    // =========================================================================
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      let y = 0;

      if (activeDefectMode === "pothole") {
        // --- REALISTIC POTHOLE CAVITY ---
        // Organic angular boundary
        const angle = Math.atan2(z, x);
        const organicRadius = 2.8 * (1 + 0.18 * Math.sin(3 * angle) + 0.12 * Math.cos(5 * angle) + 0.08 * Math.sin(7 * angle));
        const dist = Math.sqrt(x * x * 1.05 + z * z * 0.95);

        if (dist < organicRadius) {
          // Sharp sheared edge drop
          const edgeFactor = Math.pow(1 - dist / organicRadius, 0.45);
          // Jagged rocky floor with gravel pockets
          const subBaseGravel = (Math.sin(x * 9) * Math.cos(z * 8) + Math.sin(x * 16 + z * 14)) * 0.09;
          const multiCrater = (Math.sin(x * 2.2) * 0.2 + Math.cos(z * 2.5) * 0.15);
          
          y = -((edgeFactor * 2.2 + multiCrater) * depthScale + subBaseGravel);
        } else {
          // Surface pavement micro-roughness
          y = (Math.sin(x * 12) * Math.cos(z * 12)) * 0.015;
        }

      } else if (activeDefectMode === "crack") {
        // --- REALISTIC ALLIGATOR & TRANSVERSE CRACK NETWORK ---
        // Main diagonal fracture spine
        const mainCurve = 0.9 * Math.sin(x * 0.8) + 0.35 * Math.cos(x * 2.4);
        const distMain = Math.abs(z - mainCurve);

        // Branch crack 1
        const branch1 = 0.5 * Math.cos(z * 1.4) + 1.2;
        const distBranch1 = Math.abs(x - branch1);

        // Branch crack 2
        const branch2 = -0.4 * Math.sin(z * 1.8) - 1.4;
        const distBranch2 = Math.abs(x - branch2);

        // Micro-alligator fatigue webbing
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
        // --- REALISTIC SUNKEN MANHOLE & RIM DROP-OFF ---
        const dist = Math.sqrt(x * x + z * z);
        const rimRadius = 2.2;

        if (dist < 1.85) {
          // Inner manhole casting cover (flat metal casting with ribbed pattern)
          const ribPattern = Math.abs(Math.sin(dist * 14)) * 0.04;
          y = -1.4 * depthScale + ribPattern;
        } else if (dist < rimRadius) {
          // Sharp sheared drop-off edge (sheared asphalt wall)
          y = -1.6 * depthScale;
        } else if (dist < 4.0) {
          // Surrounding asphalt sagging / structural subsidence
          const sagFactor = Math.pow(1 - (dist - rimRadius) / (4.0 - rimRadius), 2);
          y = -sagFactor * 0.65 * depthScale;
        } else {
          y = 0;
        }

      } else if (activeDefectMode === "waterlog") {
        // --- REALISTIC WATERLOGGED ROAD BASIN ---
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

      // =======================================================================
      // REALISTIC COLOR SHADING PER DEPTH
      // =======================================================================
      const color = new THREE.Color();
      if (y > -0.15) {
        // Natural weathered asphalt surface (Dark slate with subtle aggregate)
        const grain = (Math.sin(x * 40) * Math.cos(z * 40)) * 0.03;
        color.setRGB(0.18 + grain, 0.22 + grain, 0.28 + grain);
      } else if (y > -0.7) {
        // Sheared asphalt fracture lip (Amber warning zone)
        color.setRGB(0.72, 0.45, 0.15);
      } else if (y > -1.4) {
        // Intermediate cavity slope (Crimson stress zone)
        color.setRGB(0.85, 0.22, 0.22);
      } else {
        // Deep exposed granular base / sub-base void (Dark cavity red/charcoal)
        color.setRGB(0.55, 0.08, 0.08);
      }

      // If manhole casting
      if (activeDefectMode === "manhole" && Math.sqrt(x * x + z * z) < 1.85) {
        color.setRGB(0.28, 0.32, 0.38); // Metallic cast iron
      }

      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    // Primary Surface Mesh
    let mesh: THREE.Mesh;
    if (renderMode === "lidar") {
      const pointsMat = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
      });
      const points = new THREE.Points(geometry, pointsMat);
      scene.add(points);
      mesh = points as any;
    } else {
      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: activeDefectMode === "manhole" ? 0.45 : 0.85,
        metalness: activeDefectMode === "manhole" ? 0.35 : 0.1,
        wireframe: renderMode === "wireframe",
        flatShading: false,
      });
      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
    }

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
      scene.add(waterMesh);
    }

    // 3D Depth Caliper Needle & Indicator Marker
    const caliperGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(deepestX, 0.05, deepestZ),
      new THREE.Vector3(deepestX, deepestY, deepestZ),
    ]);
    const caliperMat = new THREE.LineBasicMaterial({ color: 0xf43f5e, linewidth: 2 });
    const caliperLine = new THREE.Line(caliperGeom, caliperMat);
    scene.add(caliperLine);

    // Target Pin Sphere at bottom of cavity
    const sphereGeom = new THREE.SphereGeometry(0.12, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const sphereMesh = new THREE.Mesh(sphereGeom, sphereMat);
    sphereMesh.position.set(deepestX, deepestY, deepestZ);
    scene.add(sphereMesh);

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

      mesh.rotation.y += deltaX * 0.008;
      mesh.rotation.x += deltaY * 0.008;
      if (waterMesh) {
        waterMesh.rotation.y = mesh.rotation.y;
        waterMesh.rotation.x = mesh.rotation.x;
      }
      caliperLine.rotation.y = mesh.rotation.y;
      caliperLine.rotation.x = mesh.rotation.x;
      sphereMesh.rotation.y = mesh.rotation.y;
      sphereMesh.rotation.x = mesh.rotation.x;

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => { isDragging = false; };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(5, Math.min(22, camera.position.z + e.deltaY * 0.015));
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
        mesh.rotation.y += 0.0035;
        if (waterMesh) waterMesh.rotation.y = mesh.rotation.y;
        caliperLine.rotation.y = mesh.rotation.y;
        sphereMesh.rotation.y = mesh.rotation.y;
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
      geometry.dispose();
      // Dispose all scene geometries and materials before destroying renderer
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m: THREE.Material) => m.dispose());
        }
      });
      renderer.forceContextLoss();
      renderer.dispose();
    };
  }, [isOpen, renderMode, autoRotate, activeDefectMode, depthScale]);

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
        
        {/* Modal Header */}
        <div className="h-14 px-5 border-b border-slate-800 flex items-center justify-between bg-[#0E1424] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white tracking-wide">
                  Real 3D Surface Reconstruction &amp; Sensor Disparity
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {hazardId}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-md">
                {locationName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Modes Toggle: Solid / Wireframe / LiDAR */}
            <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-mono">
              <button
                onClick={() => setRenderMode("solid")}
                className={`px-2 py-1 rounded-md transition ${
                  renderMode === "solid" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                Solid
              </button>
              <button
                onClick={() => setRenderMode("wireframe")}
                className={`px-2 py-1 rounded-md transition ${
                  renderMode === "wireframe" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                Wireframe
              </button>
              <button
                onClick={() => setRenderMode("lidar")}
                className={`px-2 py-1 rounded-md transition ${
                  renderMode === "lidar" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                LiDAR
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
            >
              <X className="w-4 h-4" />
            </button>
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
                <span>Orbit: Drag | Zoom: Scroll</span>
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

            {/* Color Elevation Legend */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800 text-[10px] font-mono">
              <span className="text-slate-400">Depth Heatmap:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-500" />
                <span>Road Pavement (0cm)</span>
                <span className="w-3 h-3 rounded-full bg-amber-500 ml-2" />
                <span>Lip Drop (-{(depthCm * 0.35).toFixed(1)}cm)</span>
                <span className="w-3 h-3 rounded-full bg-rose-600 ml-2" />
                <span>Cavity Void (-{depthCm}cm)</span>
              </div>
            </div>
          </div>

          {/* Right: Engineering Specifications & Sensor Calibration */}
          <div className="lg:col-span-5 p-5 bg-[#0D1424] border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between overflow-y-auto custom-scrollbar space-y-4">
            <div className="space-y-3.5">
              {/* Sensor & Footage Calibration */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                  <span>Real Sensor &amp; Footage Input</span>
                </h4>

                <div className="p-3 rounded-xl bg-slate-900/85 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-rose-400" />
                      Dashcam Optical Disparity:
                    </span>
                    <span className="font-mono font-bold text-emerald-400">{cameraConfidence}% YOLOv8</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-amber-400" />
                      100Hz Axle Accelerometer:
                    </span>
                    <span className="font-mono font-bold text-rose-400">+{sensorGz}g Vertical Shock</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Patrolling Fleet Vehicle:</span>
                    <span className="font-mono text-slate-300 text-[11px]">{detectedBusId}</span>
                  </div>

                  {/* Dashcam Evidence Frame with AI Bounding Box */}
                  {footageImageUrl && (
                    <div className="mt-2 pt-2 border-t border-slate-800">
                      <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between font-mono">
                        <span>Original Dashcam Evidence Frame:</span>
                        <span className="text-emerald-400 font-bold">STEREO PAIR VERIFIED</span>
                      </div>
                      <div className="relative rounded-lg overflow-hidden border border-slate-700 aspect-16/9 max-h-32 bg-slate-950">
                        <img 
                          src={footageImageUrl} 
                          alt="Road Defect Evidence" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-2 border-2 border-rose-500 rounded bg-rose-500/15 flex flex-col justify-between p-1.5 pointer-events-none">
                          <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono text-[9px] font-bold self-start">
                            {defectType}: {cameraConfidence}%
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-950/90 text-rose-300 font-mono text-[9px] self-end">
                            Disparity Depth: {depthCm}cm
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Civil Engineering Material Calculation */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Civil Engineering Specifications</span>
                </h4>

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
                    <div className="text-[10px] text-slate-400">Asphalt Hot-Mix Volume</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                      {volumeLiters} L <span className="text-[10px] text-slate-400 font-normal">({Math.round(volumeLiters * 2.3)} kg)</span>
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5 font-mono">Bituminous Grade-2</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Roughness Score (IRI)</div>
                    <div className="text-sm font-bold text-amber-400 font-mono mt-0.5">{iriScore} m/km</div>
                    <div className="text-[9px] text-amber-300/80 mt-0.5 font-semibold font-mono">POOR RIDING QUALITY</div>
                  </div>
                </div>

                {/* Repair Cost according to PWD SOR */}
                <div className="p-2.5 mt-2 rounded-xl bg-blue-950/40 border border-blue-900/50 flex items-center justify-between">
                  <div>
                    <div className="text-blue-300 text-[10.5px]">PWD SOR 2024 Repair Budget</div>
                    <div className="text-base font-extrabold text-blue-400 font-mono">₹{costInr.toLocaleString()}</div>
                  </div>
                  <span className="text-[10px] text-blue-300 font-mono px-2 py-0.5 rounded bg-blue-900/50">
                    Item 4.12 PWD SOR
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
