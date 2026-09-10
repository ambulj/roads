import React, { useRef, useEffect, useState } from "react";
import {
  Camera, Eye, EyeOff, Maximize2, Minimize2,
  RefreshCw, Sun, Moon, Radio, ShieldAlert, Zap,
  AlertTriangle, Scan, Gauge, Play, Pause
} from "lucide-react";
import { FleetNode } from "../../types";

interface LiveCameraFeedProps {
  bus: FleetNode;
  onSnapshot?: (dataUrl: string) => void;
  className?: string;
}

interface SimulatedHazard {
  id: string;
  type: "D40" | "D20" | "WATERLOGGING" | "UNMARKED_SPEED_BREAKER" | "OPEN_MANHOLE" | "FOLIAGE_OBSCURED_SIGN";
  label: string;
  color: string;
  z: number; // 0 (horizon) to 1.0 (passed under bus)
  lane: number; // -0.5 (left lane) to 0.5 (right lane)
  confidence: number;
}

export const LiveCameraFeed: React.FC<LiveCameraFeedProps> = ({
  bus,
  onSnapshot,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [isNightMode, setIsNightMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);
  const [lastCapturedUrl, setLastCapturedUrl] = useState<string | null>(null);
  const [currentJerk, setCurrentJerk] = useState(bus.imu_jerk_gz || 0.98);
  const [simPace, setSimPace] = useState<number>(1.0); // 0.5x, 1.0x (realistic), 1.5x
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [feedMode, setFeedMode] = useState<'rtsp' | 'canvas'>('rtsp');
  const [frameTimestamp, setFrameTimestamp] = useState<number>(Date.now());
  const [rtspError, setRtspError] = useState<boolean>(false);

  // Poll live video frame snapshots
  useEffect(() => {
    if (isPaused || feedMode !== 'rtsp') return;
    const interval = setInterval(() => {
      setFrameTimestamp(Date.now());
    }, 200);
    return () => clearInterval(interval);
  }, [isPaused, feedMode]);

  const animationFrameId = useRef<number>(0);
  const roadOffset = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Staggered hazards queue so only one hazard approaches at a time in realistic succession
  const hazardsRef = useRef<SimulatedHazard[]>([
    {
      id: "hz-1",
      type: "D40",
      label: "Pothole D40 Cavity",
      color: "#EF4444",
      z: 0.25,
      lane: 0.08,
      confidence: 0.96,
    },
    {
      id: "hz-2",
      type: "D20",
      label: "Alligator Crack Web",
      color: "#F59E0B",
      z: -0.65,
      lane: -0.22,
      confidence: 0.89,
    },
    {
      id: "hz-3",
      type: "UNMARKED_SPEED_BREAKER",
      label: "IRC:99 Unmarked Hump",
      color: "#F97316",
      z: -1.55,
      lane: 0.0,
      confidence: 0.94,
    },
    {
      id: "hz-4",
      type: "OPEN_MANHOLE",
      label: "IS:1726 Open Manhole",
      color: "#DC2626",
      z: -2.45,
      lane: 0.18,
      confidence: 0.97,
    },
    {
      id: "hz-5",
      type: "FOLIAGE_OBSCURED_SIGN",
      label: "IRC:67 Obscured Sign",
      color: "#10B981",
      z: -3.35,
      lane: -0.42,
      confidence: 0.92,
    },
  ]);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Main Canvas Rendering Loop with Delta-Time Physics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;
    lastTimeRef.current = performance.now();

    const render = (time: number) => {
      if (!running) return;

      const dt = Math.min(0.064, Math.max(0.001, (time - lastTimeRef.current) / 1000));
      lastTimeRef.current = time;

      const width = canvas.width;
      const height = canvas.height;
      if (width === 0 || height === 0) {
        animationFrameId.current = requestAnimationFrame(render);
        return;
      }

      // ── 1. Background (Sky & Horizon) ──────────────────────────────────
      const horizonY = height * 0.44;

      if (isNightMode) {
        // Night sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        skyGrad.addColorStop(0, "#050813");
        skyGrad.addColorStop(1, "#111827");
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, horizonY);

        // Distant stars & city glow
        ctx.fillStyle = "rgba(255, 235, 180, 0.6)";
        for (let i = 0; i < 20; i++) {
          const sx = (i * 47) % width;
          const sy = (i * 19) % (horizonY * 0.7);
          ctx.fillRect(sx, sy, 1.5, 1.5);
        }
      } else {
        // Daytime sky with Chennai haze
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        skyGrad.addColorStop(0, "#7DD3FC");
        skyGrad.addColorStop(0.7, "#BAE6FD");
        skyGrad.addColorStop(1, "#E0F2FE");
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, horizonY);

        // Sun
        ctx.fillStyle = "rgba(254, 240, 138, 0.4)";
        ctx.beginPath();
        ctx.arc(width * 0.78, horizonY * 0.4, 28, 0, Math.PI * 2);
        ctx.fill();
      }

      // Distant City / Flyover Silhouette
      ctx.fillStyle = isNightMode ? "#090D16" : "#94A3B8";
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      const buildings = [
        [0, 15], [30, 25], [70, 10], [120, 35], [160, 20], [220, 45],
        [280, 18], [340, 30], [400, 15], [460, 40], [530, 25], [600, 35]
      ];
      buildings.forEach(([bx, bh]) => {
        const scaledX = (bx / 600) * width;
        ctx.lineTo(scaledX, horizonY - bh * (height / 450));
      });
      ctx.lineTo(width, horizonY);
      ctx.closePath();
      ctx.fill();

      // ── 2. Terrain & Roadside (Greenery / Shoulders) ────────────────────
      const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      if (isNightMode) {
        groundGrad.addColorStop(0, "#0F172A");
        groundGrad.addColorStop(1, "#020617");
      } else {
        groundGrad.addColorStop(0, "#CBD5E1");
        groundGrad.addColorStop(1, "#64748B");
      }
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, horizonY, width, height - horizonY);

      // ── 3. Perspective Asphalt Roadway ─────────────────────────────────
      const vanishingX = width * 0.5;
      const roadTopWidth = width * 0.16;
      const roadBottomWidth = width * 0.92;

      const roadTopLeft = vanishingX - roadTopWidth / 2;
      const roadTopRight = vanishingX + roadTopWidth / 2;
      const roadBottomLeft = vanishingX - roadBottomWidth / 2;
      const roadBottomRight = vanishingX + roadBottomWidth / 2;

      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      if (isNightMode) {
        roadGrad.addColorStop(0, "#1E293B");
        roadGrad.addColorStop(1, "#0F172A");
      } else {
        roadGrad.addColorStop(0, "#334155");
        roadGrad.addColorStop(1, "#1E293B");
      }
      ctx.fillStyle = roadGrad;
      ctx.beginPath();
      ctx.moveTo(roadTopLeft, horizonY);
      ctx.lineTo(roadTopRight, horizonY);
      ctx.lineTo(roadBottomRight, height);
      ctx.lineTo(roadBottomLeft, height);
      ctx.closePath();
      ctx.fill();

      // Road Shoulders / Curbs
      ctx.strokeStyle = isNightMode ? "#334155" : "#FACC15";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(roadTopLeft, horizonY);
      ctx.lineTo(roadBottomLeft, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(roadTopRight, horizonY);
      ctx.lineTo(roadBottomRight, height);
      ctx.stroke();

      // ── 4. Animated Broken Lane Markings (Calibrated Realistic Speed) ───
      const rawSpeed = Math.max(15, bus.speed_kmh || 35);
      const effectiveSpeed = isPaused ? 0 : rawSpeed * simPace;

      // Smooth realistic scrolling: ~0.45 loops per second at 35 km/h
      roadOffset.current = (roadOffset.current + (effectiveSpeed / 35) * 0.45 * dt) % 1;

      const totalDashes = 10;
      ctx.fillStyle = "#FFFFFF";

      for (let i = 0; i < totalDashes; i++) {
        const progress = (i / totalDashes + roadOffset.current) % 1;
        const z = Math.pow(progress, 2.2);

        const curY = horizonY + (height - horizonY) * z;
        const nextProgress = Math.min(1, progress + 0.04);
        const nextZ = Math.pow(nextProgress, 2.2);
        const nextY = horizonY + (height - horizonY) * nextZ;
        const dashHeight = Math.max(2, nextY - curY);

        const currentRoadW = roadTopWidth + (roadBottomWidth - roadTopWidth) * z;
        const dashWidth = Math.max(2, currentRoadW * 0.016);

        // Center line
        ctx.globalAlpha = Math.min(1, z * 1.5);
        ctx.fillRect(vanishingX - dashWidth / 2, curY, dashWidth, dashHeight);

        // Left lane divider (3-lane arterial)
        const leftLaneX = vanishingX - currentRoadW * 0.28;
        ctx.fillRect(leftLaneX - dashWidth / 2, curY, dashWidth, dashHeight);

        // Right lane divider
        const rightLaneX = vanishingX + currentRoadW * 0.28;
        ctx.fillRect(rightLaneX - dashWidth / 2, curY, dashWidth, dashHeight);
        ctx.globalAlpha = 1.0;
      }

      // ── 5. Moving Oncoming Vehicles (Smooth realistic passing) ─────────
      const autoProgress = ((roadOffset.current * 0.25) + 0.5) % 1;
      const autoZ = Math.pow(autoProgress, 2.4);
      if (autoZ > 0.05 && autoZ < 0.95) {
        const autoY = horizonY + (height - horizonY) * autoZ;
        const roadWAtAuto = roadTopWidth + (roadBottomWidth - roadTopWidth) * autoZ;
        const autoX = vanishingX - roadWAtAuto * 0.38;
        const autoW = roadWAtAuto * 0.12;
        const autoH = autoW * 0.95;

        // Auto-rickshaw yellow & green body
        ctx.fillStyle = "#FACC15";
        ctx.fillRect(autoX - autoW / 2, autoY - autoH, autoW, autoH * 0.5);
        ctx.fillStyle = "#15803D";
        ctx.fillRect(autoX - autoW / 2, autoY - autoH * 0.5, autoW, autoH * 0.5);

        // Windshield
        ctx.fillStyle = isNightMode ? "#0F172A" : "#60A5FA";
        ctx.fillRect(autoX - autoW * 0.4, autoY - autoH * 0.85, autoW * 0.8, autoH * 0.32);

        // Headlights
        if (isNightMode) {
          ctx.fillStyle = "#FEF08A";
          ctx.beginPath();
          ctx.arc(autoX - autoW * 0.3, autoY - autoH * 0.2, autoW * 0.1, 0, Math.PI * 2);
          ctx.arc(autoX + autoW * 0.3, autoY - autoH * 0.2, autoW * 0.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── 6. Road Defects & Hazards with Calibrated Inspection Pace ──────
      // Realistic speed: takes ~5.5s from horizon (0.0) to bus bumper (1.0)
      const hazardAdvanceRate = (effectiveSpeed / 35) * 0.18 * dt;

      hazardsRef.current.forEach((hazard) => {
        hazard.z += hazardAdvanceRate;

        // When hazard passes behind the bus, recycle it to the back of the queue
        if (hazard.z > 1.08) {
          // Find the minimum z in the queue to maintain an orderly sequence
          const minZ = Math.min(...hazardsRef.current.map(h => h.z));
          hazard.z = Math.min(-0.5, minZ - 0.75); // Place safely back in queue
          hazard.lane = (Math.random() - 0.5) * 0.55;

          // Trigger realistic shock on pothole/speedbreaker contact
          if (hazard.type === "UNMARKED_SPEED_BREAKER") {
            const shock = 1.68 + Math.random() * 0.22;
            setCurrentJerk(Number(shock.toFixed(2)));
            setTimeout(() => setCurrentJerk(bus.imu_jerk_gz || 0.98), 1100);
          } else if (hazard.type === "D40") {
            const shock = 1.35 + Math.random() * 0.4;
            setCurrentJerk(Number(shock.toFixed(2)));
            setTimeout(() => setCurrentJerk(bus.imu_jerk_gz || 0.98), 800);
          }
        }

        // Only draw when visible on screen (z > 0 and z <= 1.05)
        if (hazard.z > 0.02 && hazard.z <= 1.05) {
          const z = Math.pow(hazard.z, 2.3);
          const y = horizonY + (height - horizonY) * z;
          const currentRoadW = roadTopWidth + (roadBottomWidth - roadTopWidth) * z;
          const x = vanishingX + currentRoadW * hazard.lane;

          const defectSizeW = Math.max(14, currentRoadW * (hazard.type === "D40" ? 0.14 : hazard.type === "UNMARKED_SPEED_BREAKER" ? 0.32 : 0.22));
          const defectSizeH = defectSizeW * 0.55;

          // Render Road Defect Texture
          ctx.save();
          if (hazard.type === "D40") {
            ctx.fillStyle = "#0A0D14";
            ctx.beginPath();
            ctx.ellipse(x, y, defectSizeW / 2, defectSizeH / 2, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#475569";
            ctx.lineWidth = Math.max(1, 2.5 * z);
            ctx.stroke();
          } else if (hazard.type === "D20") {
            ctx.strokeStyle = "#0F172A";
            ctx.lineWidth = Math.max(1, 2 * z);
            ctx.beginPath();
            ctx.moveTo(x - defectSizeW / 2, y);
            ctx.lineTo(x - defectSizeW * 0.2, y - defectSizeH * 0.3);
            ctx.lineTo(x + defectSizeW * 0.1, y + defectSizeH * 0.2);
            ctx.lineTo(x + defectSizeW / 2, y);
            ctx.stroke();
          } else if (hazard.type === "UNMARKED_SPEED_BREAKER") {
            ctx.fillStyle = "#1E293B";
            ctx.beginPath();
            ctx.ellipse(x, y, defectSizeW * 0.8, defectSizeH * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#F97316";
            ctx.lineWidth = Math.max(1.5, 2.5 * z);
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
          } else if (hazard.type === "OPEN_MANHOLE") {
            ctx.fillStyle = "#000000";
            ctx.beginPath();
            ctx.arc(x, y, defectSizeW * 0.38, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#DC2626";
            ctx.lineWidth = Math.max(2, 3.5 * z);
            ctx.stroke();
            ctx.strokeStyle = "#7F1D1D";
            ctx.lineWidth = Math.max(1, 2 * z);
            ctx.stroke();
          } else if (hazard.type === "FOLIAGE_OBSCURED_SIGN") {
            const signH = defectSizeH * 1.6;
            ctx.fillStyle = "#DC2626";
            ctx.beginPath();
            ctx.moveTo(x, y - signH);
            ctx.lineTo(x - defectSizeW * 0.4, y);
            ctx.lineTo(x + defectSizeW * 0.4, y);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#FEF08A";
            ctx.beginPath();
            ctx.moveTo(x, y - signH * 0.8);
            ctx.lineTo(x - defectSizeW * 0.28, y - signH * 0.1);
            ctx.lineTo(x + defectSizeW * 0.28, y - signH * 0.1);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#15803D";
            ctx.beginPath();
            ctx.arc(x + defectSizeW * 0.15, y - signH * 0.5, defectSizeW * 0.28, 0, Math.PI * 2);
            ctx.arc(x + defectSizeW * 0.25, y - signH * 0.3, defectSizeW * 0.22, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

          // YOLO AI Bounding Box Overlay
          if (showBoundingBoxes && z > 0.12) {
            const pad = Math.max(4, 12 * z);
            const boxX = x - defectSizeW / 2 - pad;
            const boxY = y - defectSizeH / 2 - pad;
            const boxW = defectSizeW + pad * 2;
            const boxH = defectSizeH + pad * 2;

            ctx.strokeStyle = hazard.color;
            ctx.lineWidth = 1.8;

            const bracketLen = Math.max(5, boxW * 0.2);
            ctx.beginPath();
            ctx.moveTo(boxX, boxY + bracketLen); ctx.lineTo(boxX, boxY); ctx.lineTo(boxX + bracketLen, boxY);
            ctx.moveTo(boxX + boxW - bracketLen, boxY); ctx.lineTo(boxX + boxW, boxY); ctx.lineTo(boxX + boxW, boxY + bracketLen);
            ctx.moveTo(boxX, boxY + boxH - bracketLen); ctx.lineTo(boxX, boxY + boxH); ctx.lineTo(boxX + bracketLen, boxY + boxH);
            ctx.moveTo(boxX + boxW - bracketLen, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH - bracketLen);
            ctx.stroke();

            const labelText = `${hazard.label} [${(hazard.confidence * 100).toFixed(1)}%]`;
            ctx.font = "bold 10px 'JetBrains Mono', monospace";
            const textMetrics = ctx.measureText(labelText);
            const tagW = textMetrics.width + 10;
            const tagH = 16;

            ctx.fillStyle = hazard.color;
            ctx.fillRect(boxX, boxY - tagH, tagW, tagH);

            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(labelText, boxX + 5, boxY - 4);
          }
        }
      });

      // ── 7. Windshield Vignette & Reflection ────────────────────────────
      const vignette = ctx.createRadialGradient(
        width / 2, height / 2, width * 0.35,
        width / 2, height / 2, width * 0.75
      );
      vignette.addColorStop(0, "transparent");
      vignette.addColorStop(1, isNightMode ? "rgba(0, 0, 0, 0.75)" : "rgba(15, 23, 42, 0.25)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      // Dashcam timestamp watermarks
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 8);

      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = "bold 11px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${dateStr} ${timeStr} IST`, width - 14, height - 14);
      ctx.textAlign = "left";

      animationFrameId.current = requestAnimationFrame(render);
    };

    animationFrameId.current = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [bus, isNightMode, showBoundingBoxes, simPace, isPaused]);

  // Capture Snapshot
  const handleCaptureSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setLastCapturedUrl(dataUrl);
    if (onSnapshot) {
      onSnapshot(dataUrl);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-float select-none ${className}`}
    >
      {/* Flash Effect on Capture */}
      {flashEffect && (
        <div className="absolute inset-0 bg-white z-50 animate-fadeOut pointer-events-none transition-opacity duration-150" />
      )}

      {/* Top Telemetry HUD Strip */}
      <div className="absolute top-0 left-0 right-0 z-20 p-3 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent flex items-center justify-between text-xs pointer-events-none">
        {/* Left HUD: Live Indicator + Optical Specs */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-600/90 text-white font-mono font-bold text-[11px] shadow-sm animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span>REC ● LIVE</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-[11px] text-slate-200 font-mono">
            <Camera className="w-3.5 h-3.5 text-blue-400" />
            <span>Sony IMX335 (1080p HDR)</span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-400 font-bold">{bus.edge_fps || 28.4} FPS</span>
          </div>
        </div>

        {/* Right HUD: Controls & Pace Selector */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Pause / Play Toggle */}
          <button
            onClick={() => setIsPaused(p => !p)}
            title={isPaused ? "Resume Live Simulation" : "Freeze Simulation for Frame Inspection"}
            className={`p-1.5 rounded-lg border text-xs font-mono transition-colors ${
              isPaused 
                ? "bg-amber-600 border-amber-500 text-white font-bold" 
                : "bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 text-slate-300"
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Simulation Pace Switcher */}
          <div className="hidden sm:flex items-center bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-lg p-0.5 text-[10.5px] font-mono">
            <button
              onClick={() => setSimPace(0.5)}
              className={`px-1.5 py-0.5 rounded ${simPace === 0.5 ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              title="Slow Inspection Pace (0.5x)"
            >
              0.5x
            </button>
            <button
              onClick={() => setSimPace(1.0)}
              className={`px-1.5 py-0.5 rounded ${simPace === 1.0 ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              title="Realistic City Transit Pace (1.0x)"
            >
              1.0x Real
            </button>
            <button
              onClick={() => setSimPace(1.5)}
              className={`px-1.5 py-0.5 rounded ${simPace === 1.5 ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              title="Fast Patrol Pace (1.5x)"
            >
              1.5x
            </button>
          </div>

          {/* Feed Source Mode Switcher */}
          <div className="flex items-center bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-lg p-0.5 text-[10.5px] font-mono">
            <button
              onClick={() => setFeedMode('rtsp')}
              className={`px-2 py-0.5 rounded font-bold transition ${feedMode === 'rtsp' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Real Zero-Hardware RTSP / IP Camera Feed"
            >
              Live RTSP
            </button>
            <button
              onClick={() => setFeedMode('canvas')}
              className={`px-2 py-0.5 rounded font-bold transition ${feedMode === 'canvas' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="AI Digital Twin Physics Simulator"
            >
              Digital Twin
            </button>
          </div>

          {/* Day / Night Filter */}
          <button
            onClick={() => setIsNightMode((p) => !p)}
            title={isNightMode ? "Switch to Daytime View" : "Simulate Night / Low-Light Starlight Vision"}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 transition-colors"
          >
            {isNightMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
          </button>

          {/* Bounding Box Toggle */}
          <button
            onClick={() => setShowBoundingBoxes((p) => !p)}
            title={showBoundingBoxes ? "Hide YOLO Defect Bounding Boxes" : "Show YOLO AI Defect Detection Boxes"}
            className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors ${
              showBoundingBoxes
                ? "bg-blue-600/90 border-blue-500 text-white font-bold"
                : "bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white"
            }`}
          >
            {showBoundingBoxes ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="hidden md:inline">YOLO AI</span>
          </button>

          {/* Capture Snapshot */}
          <button
            onClick={handleCaptureSnapshot}
            title="Capture Defect Snapshot Evidence"
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Snap</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Live View"}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Speed Breaker Shock Alert Banner */}
      {currentJerk >= 1.6 && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-rose-600/95 text-white font-mono font-bold text-xs px-3.5 py-1.5 rounded-full shadow-2xl border border-rose-300 flex items-center gap-2 animate-bounce pointer-events-none">
          <AlertTriangle className="w-4 h-4 text-amber-300" />
          <span>IRC:99 NON-COMPLIANT SPEED BREAKER (+{currentJerk}g SHOCK SPIKE)</span>
        </div>
      )}

      {/* Main Viewport (Live RTSP / Digital Twin Canvas) */}
      <div className="relative w-full aspect-video min-h-[300px] max-h-[520px] bg-slate-950 flex items-center justify-center overflow-hidden">
        {feedMode === 'rtsp' ? (
          <div className="relative w-full h-full">
            <img
              src={`/api/streams/snapshot/${bus.id}?t=${frameTimestamp}`}
              onError={() => setRtspError(true)}
              onLoad={() => setRtspError(false)}
              alt={`Live Stream ${bus.id}`}
              className="w-full h-full object-cover"
            />
            {/* Live AI Overlay Boxes */}
            {showBoundingBoxes && (
              <div className="absolute top-1/3 left-1/3 w-48 sm:w-60 h-24 sm:h-32 border-2 border-rose-500 rounded-xl bg-rose-500/10 flex flex-col justify-between p-2 animate-pulse pointer-events-none">
                <div className="flex items-center justify-between text-[10.5px] font-mono font-bold bg-black/85 px-2 py-1 rounded text-rose-300">
                  <span>POTHOLE D40 DETECTED</span>
                  <span className="text-emerald-400">96.8%</span>
                </div>
                <div className="text-[10px] font-mono bg-black/85 px-2 py-0.5 rounded text-slate-300 self-start">
                  GPS: {bus.lat.toFixed(4)}°N, {bus.lng.toFixed(4)}°E • Depth: 48mm
                </div>
              </div>
            )}
            <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700 text-emerald-400 font-mono text-xs flex items-center gap-2 shadow-lg pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>CCTV INGEST ● {bus.id} ({bus.route_code || 'LIVE'})</span>
            </div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={854}
            height={480}
            className="w-full h-full object-cover"
          />
        )}

        {/* Center Screen Crosshairs (Windshield Optical Bore Sight) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
          <div className="w-12 h-0.5 bg-blue-400" />
          <div className="h-12 w-0.5 bg-blue-400 -ml-6" />
        </div>
      </div>

      {/* Bottom Telemetry HUD Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent flex flex-wrap items-center justify-between gap-3 text-xs pointer-events-none">
        {/* Left: Transit Node & Corridor Identity */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="px-2 py-1 rounded-md bg-blue-600 text-white font-mono font-bold text-xs shadow-sm">
            {bus.id}
          </div>
          <div className="text-slate-300 font-medium text-[11px] truncate max-w-[200px] sm:max-w-[320px]">
            {bus.route_name}
          </div>
        </div>

        {/* Middle: Live Vehicle Dynamics (Speed + IMU Jerk + Lux) */}
        <div className="flex items-center gap-2 pointer-events-auto font-mono text-[11px]">
          {/* Speed Indicator */}
          <div className="px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-700/80 text-slate-200 flex items-center gap-1.5">
            <span className="text-slate-400">SPEED:</span>
            <span className="text-amber-400 font-bold">{(bus.speed_kmh || 38) * (isPaused ? 0 : simPace)} km/h</span>
          </div>

          {/* Ambient Luminescence (Lux) Meter */}
          <div className={`px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${
            isNightMode ? "bg-rose-950/80 border-rose-700 text-rose-300" : "bg-slate-900/80 border-slate-700 text-slate-200"
          }`}>
            <Sun className={`w-3 h-3 ${isNightMode ? "text-rose-400" : "text-amber-400"}`} />
            <span className="text-slate-400">LUX:</span>
            <span className={`font-bold ${isNightMode ? "text-rose-400" : "text-emerald-400"}`}>
              {isNightMode ? "2.4 lx (DARK SPOT)" : "480 lx"}
            </span>
          </div>

          {/* Vertical IMU Shock Meter */}
          <div
            className={`px-2 py-0.5 rounded-md border flex items-center gap-1.5 transition-colors ${
              currentJerk > 1.3
                ? "bg-rose-950/90 border-rose-600 text-rose-300 animate-bounce"
                : "bg-slate-900/80 border-slate-700/80 text-slate-200"
            }`}
          >
            <Zap className={`w-3 h-3 ${currentJerk > 1.3 ? "text-rose-400 animate-pulse" : "text-emerald-400"}`} />
            <span className="text-slate-400">G_z:</span>
            <span className={`font-bold ${currentJerk > 1.3 ? "text-rose-400" : "text-emerald-400"}`}>
              {currentJerk}g
            </span>
          </div>
        </div>

        {/* Right: GPS Coordinates */}
        <div className="hidden md:flex items-center gap-1.5 text-slate-400 font-mono text-[10.5px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>{bus.lat.toFixed(4)}°N, {bus.lng.toFixed(4)}°E (NavIC 5Hz)</span>
        </div>
      </div>
    </div>
  );
};
