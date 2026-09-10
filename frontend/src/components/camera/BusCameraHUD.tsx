import React, { useState, useEffect, useRef } from "react";
import { 
  Video, 
  Maximize2, 
  Minimize2, 
  X, 
  Eye, 
  EyeOff, 
  Camera, 
  Gauge, 
  Radio, 
  Cpu, 
  Sparkles,
  ChevronDown,
  Volume2,
  VolumeX,
  Play,
  Pause,
  AlertTriangle,
  Droplets,
  Layers
} from "lucide-react";

interface BusCameraHUDProps {
  isOpen: boolean;
  onClose: () => void;
  initialBusId?: string;
  onInspectPothole?: (hazardId: string) => void;
}

interface BusFeed {
  id: string;
  name: string;
  route: string;
  driver: string;
  speed: number;
  lat: number;
  lng: number;
  condition: string;
}

const BUS_FEEDS: BusFeed[] = [
  { id: "BUS-04", name: "Bus #04 • Front Dashcam", route: "Chennai ⇄ Haridwar GST Road (NH-32)", driver: "S. Sharma", speed: 42.4, lat: 29.8660, lng: 77.8950, condition: "Severe Pothole Detected" },
  { id: "BUS-12", name: "Bus #12 • Surface Cam", route: "Civil Lines ⇄ Railway Stn", driver: "R. Verma", speed: 28.1, lat: 29.8542, lng: 77.8881, condition: "Waterlogging Warning" },
  { id: "BUS-18", name: "Bus #18 • Corridor Express", route: "IIT Main Gate ⇄ Bus Stand", driver: "A. Kumar", speed: 36.5, lat: 29.8625, lng: 77.8992, condition: "Clear Corridor" },
  { id: "BUS-24", name: "Bus #24 • Night Patrol", route: "Canal Road ⇄ Chennai Cantt", driver: "M. Singh", speed: 48.0, lat: 29.8710, lng: 77.9040, condition: "Minor Cracking" },
];

export const BusCameraHUD: React.FC<BusCameraHUDProps> = ({
  isOpen,
  onClose,
  initialBusId = "BUS-04",
  onInspectPothole,
}) => {
  const [selectedBusId, setSelectedBusId] = useState(initialBusId);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [showTelemetry, setShowTelemetry] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [snapshotFlash, setSnapshotFlash] = useState(false);
  const [fps, setFps] = useState(30);
  const [latencyMs, setLatencyMs] = useState(24.2);
  const [currentSpeed, setCurrentSpeed] = useState(42.4);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const activeBus = BUS_FEEDS.find((b) => b.id === selectedBusId) || BUS_FEEDS[0];

  // Dynamic telemetry variation
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        setFps(Math.floor(29 + Math.random() * 2));
        setLatencyMs(Number((23.5 + Math.random() * 2.5).toFixed(1)));
        setCurrentSpeed((prev) => Number((activeBus.speed + (Math.random() * 3 - 1.5)).toFixed(1)));
      }
    }, 1200);
    return () => clearInterval(interval);
  }, [isPaused, activeBus]);

  // Synthetic Canvas Road Simulation with AI Bounding Boxes
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let offset = 0;

    const render = () => {
      if (!isPaused) {
        offset = (offset + 4.5) % 80;
      }

      const w = canvas.width;
      const h = canvas.height;

      // 1. Sky & Horizon
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.45);
      skyGrad.addColorStop(0, "#475569");
      skyGrad.addColorStop(1, "#94A3B8");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.45);

      // Distant Trees / Buildings
      ctx.fillStyle = "#334155";
      for (let i = 0; i < 12; i++) {
        const bx = (i * w) / 10;
        const bh = 15 + Math.sin(i * 99) * 12;
        ctx.fillRect(bx, h * 0.45 - bh, w / 12, bh);
      }

      // 2. Asphalt Road with Perspective
      const roadGrad = ctx.createLinearGradient(0, h * 0.45, 0, h);
      roadGrad.addColorStop(0, "#1E293B");
      roadGrad.addColorStop(1, "#0F172A");
      ctx.fillStyle = roadGrad;
      ctx.beginPath();
      ctx.moveTo(w * 0.35, h * 0.45);
      ctx.lineTo(w * 0.65, h * 0.45);
      ctx.lineTo(w * 1.05, h);
      ctx.lineTo(-w * 0.05, h);
      ctx.closePath();
      ctx.fill();

      // Road Edges (Curbs)
      ctx.strokeStyle = "#E2E8F0";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.35, h * 0.45);
      ctx.lineTo(-w * 0.05, h);
      ctx.moveTo(w * 0.65, h * 0.45);
      ctx.lineTo(w * 1.05, h);
      ctx.stroke();

      // 3. Center Dashed Lane Markings with Perspective
      ctx.strokeStyle = "#FACC15";
      ctx.lineWidth = 4;
      ctx.setLineDash([20, 25]);
      ctx.lineDashOffset = -offset;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.45);
      ctx.lineTo(w * 0.5, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4. Moving Road Defect Simulation (Pothole Cavity)
      const potholeY = (h * 0.55 + ((offset * 2.8) % (h * 0.35)));
      const potholeX = w * 0.42 + (potholeY - h * 0.55) * 0.15;
      const potholeW = 55 + (potholeY / h) * 45;
      const potholeH = 22 + (potholeY / h) * 20;

      // Dark asphalt pothole pit
      ctx.fillStyle = "#020617";
      ctx.beginPath();
      ctx.ellipse(potholeX, potholeY, potholeW / 2, potholeH / 2, -0.05, 0, Math.PI * 2);
      ctx.fill();

      // Pothole water puddle highlight
      ctx.fillStyle = "rgba(56, 189, 248, 0.4)";
      ctx.beginPath();
      ctx.ellipse(potholeX + 2, potholeY + 2, potholeW / 2.8, potholeH / 3.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // 5. AI Bounding Boxes Overlay
      if (showBoundingBoxes) {
        // Pothole D40 Detection Box
        ctx.strokeStyle = "#EF4444";
        ctx.lineWidth = 2;
        ctx.strokeRect(potholeX - potholeW / 2 - 8, potholeY - potholeH / 2 - 6, potholeW + 16, potholeH + 12);

        // Label Tag
        ctx.fillStyle = "rgba(239, 68, 68, 0.95)";
        ctx.fillRect(potholeX - potholeW / 2 - 8, potholeY - potholeH / 2 - 24, 130, 18);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 10px monospace";
        ctx.fillText("POTHOLE D40 (89%)", potholeX - potholeW / 2 - 4, potholeY - potholeH / 2 - 11);

        // Water Pooling Detection Box
        const waterX = w * 0.68;
        const waterY = h * 0.68;
        ctx.strokeStyle = "#06B6D4";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(waterX - 35, waterY - 15, 70, 30);
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(6, 182, 212, 0.9)";
        ctx.fillRect(waterX - 35, waterY - 30, 110, 15);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 9px monospace";
        ctx.fillText("WATERPOOL (94%)", waterX - 32, waterY - 19);

        // Safe Lane Corridor Overlay (Green Trapezoid)
        ctx.fillStyle = "rgba(16, 185, 129, 0.12)";
        ctx.beginPath();
        ctx.moveTo(w * 0.46, h * 0.48);
        ctx.lineTo(w * 0.54, h * 0.48);
        ctx.lineTo(w * 0.75, h);
        ctx.lineTo(w * 0.25, h);
        ctx.closePath();
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isOpen, isPaused, showBoundingBoxes]);

  if (!isOpen) return null;

  const handleTakeSnapshot = () => {
    setSnapshotFlash(true);
    setTimeout(() => setSnapshotFlash(false), 250);
  };

  return (
    <div
      className={`
        fixed z-50 transition-all duration-300 ease-out select-none
        ${isExpanded 
          ? "inset-4 sm:inset-10 md:inset-16 flex flex-col bg-slate-950/95 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl" 
          : "bottom-5 right-5 w-80 sm:w-96 rounded-2xl bg-slate-950/95 backdrop-blur-md border border-slate-700/80 shadow-2xl overflow-hidden"
        }
      `}
    >
      {/* 1. TOP CONTROL BAR */}
      <div className="h-10 px-3 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-900/90 text-white text-xs">
        {/* Left: Feed Selector */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
          <div className="relative group">
            <select
              value={selectedBusId}
              onChange={(e) => setSelectedBusId(e.target.value)}
              className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer pr-4 appearance-none hover:text-blue-400 transition-colors"
            >
              {BUS_FEEDS.map((bus) => (
                <option key={bus.id} value={bus.id} className="bg-slate-900 text-white">
                  {bus.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Right: Window Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* AI Bounding Box Toggle */}
          <button
            onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
            className={`p-1.5 rounded-lg transition-colors ${showBoundingBoxes ? "text-emerald-400 bg-emerald-950/50 border border-emerald-800" : "text-slate-400 hover:text-white"}`}
            title={showBoundingBoxes ? "Hide AI Bounding Boxes (B)" : "Show AI Bounding Boxes (B)"}
          >
            {showBoundingBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          {/* Telemetry HUD Toggle */}
          <button
            onClick={() => setShowTelemetry(!showTelemetry)}
            className={`p-1.5 rounded-lg transition-colors ${showTelemetry ? "text-blue-400 bg-blue-950/50 border border-blue-800" : "text-slate-400 hover:text-white"}`}
            title="Toggle Telemetry HUD (H)"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {/* Expand / Minimize */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isExpanded ? "Dock to corner" : "Expand Fullscreen"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Close Stream"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. VIDEO / CANVAS VIEWPORT */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        {/* Canvas Render */}
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="w-full h-full object-cover"
        />

        {/* Snapshot White Flash Animation */}
        {snapshotFlash && (
          <div className="absolute inset-0 bg-white opacity-80 pointer-events-none transition-opacity duration-200" />
        )}

        {/* Top-Left Live Watermark */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-rose-600/90 text-white font-mono font-bold text-[10px] tracking-wider uppercase shadow-xs">
            LIVE • REC
          </span>
          <span className="text-[10px] font-mono text-white/80 bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs">
            {activeBus.id}
          </span>
        </div>

        {/* Top-Right AI Inference Status Indicator */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-[10px] text-white font-mono">
          <Cpu className="w-3 h-3 text-cyan-400" />
          <span>YOLOv8 Edge: <span className="text-emerald-400 font-bold">{latencyMs}ms</span></span>
        </div>

        {/* Live Detected Alert Badge (Clickable to trigger 3D Mesh Inspection) */}
        <div className="absolute bottom-12 left-3 right-3 flex items-center justify-between">
          <div
            onClick={() => onInspectPothole?.("CL-0042")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/95 backdrop-blur-md border border-rose-500/50 cursor-pointer text-white text-xs shadow-lg transition-transform active:scale-95 group"
          >
            <AlertTriangle className="w-4 h-4 text-rose-500 animate-bounce" />
            <div>
              <div className="font-bold leading-tight group-hover:text-rose-400 transition-colors">
                Severe Pothole D40 Ahead
              </div>
              <div className="text-[10px] text-slate-400">
                Click to inspect 3D Mesh & Depth
              </div>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-rose-400 ml-1" />
          </div>

          {/* Quick Snapshot Action */}
          <button
            onClick={handleTakeSnapshot}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 shadow-md transition active:scale-90"
            title="Capture High-Res Evidence Snapshot"
          >
            <Camera className="w-4 h-4 text-blue-400" />
          </button>
        </div>

        {/* 3. BOTTOM TELEMETRY RIBBON */}
        {showTelemetry && (
          <div className="absolute bottom-0 left-0 right-0 h-9 px-3 bg-slate-950/85 backdrop-blur-md border-t border-slate-800/80 flex items-center justify-between text-[10.5px] font-mono text-slate-300">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold text-white">{currentSpeed}</span> km/h
              </span>
              <span className="hidden sm:inline-block text-slate-500">|</span>
              <span className="hidden sm:inline-block text-slate-400">
                {activeBus.lat.toFixed(4)}°N, {activeBus.lng.toFixed(4)}°E
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-emerald-400 font-bold">{fps} FPS</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">1080p WebRTC</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
          </div>
        )}
      </div>

      {/* 4. EXPANDED DETAILS BAR (When full screen) */}
      {isExpanded && (
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-4">
            <span>Route: <strong className="text-white">{activeBus.route}</strong></span>
            <span>Driver: <strong className="text-white">{activeBus.driver}</strong></span>
            <span>Status: <strong className="text-rose-400">{activeBus.condition}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? "Resume Feed" : "Freeze Frame"}</span>
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition"
              title={isMuted ? "Unmute Audio" : "Mute Audio"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
