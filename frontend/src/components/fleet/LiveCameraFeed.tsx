import React, { useRef, useEffect, useState } from "react";
import {
  Camera, Eye, EyeOff, Maximize2, Minimize2,
  Sun, Moon, Radio, ShieldAlert, Zap,
  Scan, Gauge, Play, Pause,
  LayoutGrid, Video, UploadCloud, RotateCcw,
  ShieldCheck, Sliders, Settings, Activity, Compass,
  Sparkles, CheckCircle2, AlertTriangle, Layers
} from "lucide-react";
import { FleetNode, PrivacyStatus } from "../../types";
import { api } from "../../services/api";
import { UploadFootageModal } from "../modals/UploadFootageModal";

export const DVR_CHANNELS = [
  { id: 1, name: "CH 1", role: "Windshield Road", subtitle: "Road Distress & Roughness (IRC:SP:84 / YOLO11)" },
  { id: 2, name: "CH 2", role: "Rear Overtake", subtitle: "Tailgating & Rash Overtaking (ANPR / MVA 184)" },
  { id: 3, name: "CH 3", role: "Curbside Lane", subtitle: "Bus Lane Encroachment & Pedestrians (IRC:35)" },
  { id: 4, name: "CH 4", role: "Driver Cabin", subtitle: "Driver DMS Attention & AIS-140 Occupancy Safety" },
];

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
  z: number;
  lane: number;
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
  const [currentJerk, setCurrentJerk] = useState(bus.imu_jerk_gz || 0.98);
  const [simPace, setSimPace] = useState<number>(1.0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [feedMode, setFeedMode] = useState<'rtsp' | 'canvas' | 'webcam'>('rtsp');
  const [frameTimestamp, setFrameTimestamp] = useState<number>(Date.now());
  const [rtspError, setRtspError] = useState<boolean>(false);
  const [selectedChannel, setSelectedChannel] = useState<number>(1);
  const [isQuadView, setIsQuadView] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const [isWebcamRunning, setIsWebcamRunning] = useState<boolean>(false);
  const [uploadedMediaInfo, setUploadedMediaInfo] = useState<{
    active: boolean;
    filename?: string;
    mediaType?: string;
    channel?: number;
    count?: number;
  }>({ active: false });
  const [activeDetections, setActiveDetections] = useState<any[]>([]);
  const [privacyStatus, setPrivacyStatus] = useState<PrivacyStatus | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Fetch real DPDP 2023 privacy status
  useEffect(() => {
    api.getPrivacyStatus().then((res) => {
      if (res) setPrivacyStatus(res);
    }).catch(() => {});
  }, []);

  // Poll live video frame snapshots
  useEffect(() => {
    if (isPaused || feedMode !== 'rtsp') return;
    const interval = setInterval(() => {
      setFrameTimestamp(Date.now());
    }, 200);
    return () => clearInterval(interval);
  }, [isPaused, feedMode]);

  // Check real CV detections and uploaded media status
  useEffect(() => {
    if (feedMode !== 'rtsp') return;
    let isMounted = true;
    const checkDetections = async () => {
      try {
        const res = await api.getStreamDetections(bus.id, selectedChannel);
        if (isMounted && res && res.success) {
          setUploadedMediaInfo({
            active: Boolean(res.is_uploaded),
            filename: res.filename,
            mediaType: res.media_type,
            channel: res.channel,
            count: res.count
          });
          setActiveDetections(res.detections || []);
        }
      } catch {}
    };
    checkDetections();
    const interval = setInterval(checkDetections, 1200);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [bus.id, selectedChannel, feedMode]);

  const animationFrameId = useRef<number>(0);
  const roadOffset = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Staggered hazards queue for realistic succession
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

      // Sky & Horizon
      const horizonY = height * 0.44;

      if (isNightMode) {
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        skyGrad.addColorStop(0, "#050813");
        skyGrad.addColorStop(1, "#111827");
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, horizonY);

        ctx.fillStyle = "rgba(255, 235, 180, 0.6)";
        for (let i = 0; i < 20; i++) {
          const sx = (i * 47) % width;
          const sy = (i * 19) % (horizonY * 0.7);
          ctx.fillRect(sx, sy, 1.5, 1.5);
        }
      } else {
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        skyGrad.addColorStop(0, "#7DD3FC");
        skyGrad.addColorStop(0.7, "#BAE6FD");
        skyGrad.addColorStop(1, "#E0F2FE");
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, horizonY);

        ctx.fillStyle = "rgba(254, 240, 138, 0.4)";
        ctx.beginPath();
        ctx.arc(width * 0.78, horizonY * 0.4, 28, 0, Math.PI * 2);
        ctx.fill();
      }

      // Distant City Skyline
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

      // Ground Terrain
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

      // Perspective Asphalt Road
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

      // Road Shoulders
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

      // Lane Markings
      const rawSpeed = Math.max(15, bus.speed_kmh || 35);
      const effectiveSpeed = isPaused ? 0 : rawSpeed * simPace;

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

        // Left lane divider
        const leftLaneX = vanishingX - currentRoadW * 0.28;
        ctx.fillRect(leftLaneX - dashWidth / 2, curY, dashWidth, dashHeight);

        // Right lane divider
        const rightLaneX = vanishingX + currentRoadW * 0.28;
        ctx.fillRect(rightLaneX - dashWidth / 2, curY, dashWidth, dashHeight);
        ctx.globalAlpha = 1.0;
      }

      // Hazards Animation
      const hazardAdvanceRate = (effectiveSpeed / 35) * 0.18 * dt;

      hazardsRef.current.forEach((hazard) => {
        hazard.z += hazardAdvanceRate;

        if (hazard.z > 1.08) {
          const minZ = Math.min(...hazardsRef.current.map(h => h.z));
          hazard.z = Math.min(-0.5, minZ - 0.75);
          hazard.lane = (Math.random() - 0.5) * 0.55;

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

        if (hazard.z > 0.02 && hazard.z <= 1.05) {
          const z = Math.pow(hazard.z, 2.3);
          const y = horizonY + (height - horizonY) * z;
          const currentRoadW = roadTopWidth + (roadBottomWidth - roadTopWidth) * z;
          const x = vanishingX + currentRoadW * hazard.lane;

          const defectSizeW = Math.max(14, currentRoadW * (hazard.type === "D40" ? 0.14 : hazard.type === "UNMARKED_SPEED_BREAKER" ? 0.32 : 0.22));
          const defectSizeH = defectSizeW * 0.55;

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
            ctx.stroke();
          } else if (hazard.type === "OPEN_MANHOLE") {
            ctx.fillStyle = "#000000";
            ctx.beginPath();
            ctx.arc(x, y, defectSizeW * 0.38, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#DC2626";
            ctx.lineWidth = Math.max(2, 3.5 * z);
            ctx.stroke();
          }
          ctx.restore();

          // YOLO AI Bounding Box
          if (showBoundingBoxes && z > 0.12) {
            const pad = Math.max(4, 12 * z);
            const boxX = x - defectSizeW / 2 - pad;
            const boxY = y - defectSizeH / 2 - pad;
            const boxW = defectSizeW + pad * 2;
            const boxH = defectSizeH + pad * 2;

            ctx.strokeStyle = hazard.color;
            ctx.lineWidth = 2.0;

            const bracketLen = Math.max(6, boxW * 0.22);
            ctx.beginPath();
            ctx.moveTo(boxX, boxY + bracketLen); ctx.lineTo(boxX, boxY); ctx.lineTo(boxX + bracketLen, boxY);
            ctx.moveTo(boxX + boxW - bracketLen, boxY); ctx.lineTo(boxX + boxW, boxY); ctx.lineTo(boxX + boxW, boxY + bracketLen);
            ctx.moveTo(boxX, boxY + boxH - bracketLen); ctx.lineTo(boxX, boxY + boxH); ctx.lineTo(boxX + bracketLen, boxY + boxH);
            ctx.moveTo(boxX + boxW - bracketLen, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH - bracketLen);
            ctx.stroke();

            const labelText = `${hazard.label} [${(hazard.confidence * 100).toFixed(1)}%]`;
            ctx.font = "bold 10.5px 'JetBrains Mono', monospace";
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

      // Vignette & Timestamp Watermark
      const vignette = ctx.createRadialGradient(
        width / 2, height / 2, width * 0.35,
        width / 2, height / 2, width * 0.75
      );
      vignette.addColorStop(0, "transparent");
      vignette.addColorStop(1, isNightMode ? "rgba(0, 0, 0, 0.75)" : "rgba(15, 23, 42, 0.25)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

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

  useEffect(() => {
    return () => {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      webcamStreamRef.current = stream;
      setIsWebcamRunning(true);
      setFeedMode("webcam");
      setIsQuadView(false);
      setTimeout(() => {
        if (webcamVideoRef.current) {
          webcamVideoRef.current.srcObject = stream;
          webcamVideoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch {
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        webcamStreamRef.current = fallbackStream;
        setIsWebcamRunning(true);
        setFeedMode("webcam");
        setIsQuadView(false);
        setTimeout(() => {
          if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = fallbackStream;
            webcamVideoRef.current.play().catch(() => {});
          }
        }, 100);
      } catch {
        alert("Camera permission denied or camera not found on this device.");
      }
    }
  };

  const stopWebcam = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((t) => t.stop());
      webcamStreamRef.current = null;
    }
    setIsWebcamRunning(false);
    setFeedMode("rtsp");
  };

  const handleCaptureSnapshot = () => {
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    if (feedMode === "webcam" && webcamVideoRef.current) {
      const video = webcamVideoRef.current;
      const offscreen = document.createElement("canvas");
      offscreen.width = video.videoWidth || 1280;
      offscreen.height = video.videoHeight || 720;
      const ctx = offscreen.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, offscreen.width, offscreen.height);
        const dataUrl = offscreen.toDataURL("image/jpeg", 0.9);
        if (onSnapshot) onSnapshot(dataUrl);
        return;
      }
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    if (onSnapshot) {
      onSnapshot(dataUrl);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl select-none ${className}`}
    >
      {/* Visual Flash Feedback on Snapshot */}
      {flashEffect && (
        <div className="absolute inset-0 bg-white z-50 animate-fadeOut pointer-events-none transition-opacity duration-150" />
      )}

      {/* ── 1. SLEEK TOP TELEMETRY HUD BAR ─────────────────────────────────── */}
      <div className="relative z-20 px-4 py-2.5 bg-slate-950/90 backdrop-blur-md flex items-center justify-between border-b border-slate-800/80 text-xs">
        {/* Left: Live Status + Optical Sensor Tag */}
        <div className="flex items-center gap-2.5">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] shadow-sm ${
            isPaused ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isPaused ? "bg-amber-400" : "bg-rose-500 animate-pulse"}`} />
            <span>{isPaused ? "STREAM PAUSED" : "LIVE 5Hz"}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
            <Camera className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-white">{bus.id}</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-bold">{bus.edge_fps || 28.4} FPS</span>
          </div>

          {uploadedMediaInfo.active && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/40 text-[11px] font-mono text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="truncate max-w-[130px] font-medium">{uploadedMediaInfo.filename}</span>
              <button
                onClick={async () => {
                  await api.resetStreamSource(bus.id, selectedChannel);
                  setUploadedMediaInfo({ active: false });
                  setActiveDetections([]);
                  setFrameTimestamp(Date.now());
                }}
                title="Reset to default stream"
                className="hover:text-white ml-0.5 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-cyan-400 hover:text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Pause / Play */}
          <button
            onClick={() => setIsPaused(p => !p)}
            title={isPaused ? "Resume Live Stream" : "Freeze Stream"}
            className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
              isPaused 
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold" 
                : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* AI Bounding Box Overlay Toggle */}
          <button
            onClick={() => setShowBoundingBoxes(p => !p)}
            title={showBoundingBoxes ? "Hide AI Bounding Boxes" : "Show AI Bounding Boxes"}
            className={`px-2 py-1 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition cursor-pointer ${
              showBoundingBoxes
                ? "bg-blue-600 border-blue-500 text-white font-bold shadow-xs"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {showBoundingBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
            <span className="hidden sm:inline">AI Overlay</span>
          </button>

          {/* 1-Click Snapshot */}
          <button
            onClick={handleCaptureSnapshot}
            title="Capture Forensic Snapshot Evidence"
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Snap</span>
          </button>

          {/* Upload Custom Video / Footage */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            title="Upload Custom Video or Photo to Stream & Analyze"
            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 hover:text-cyan-300 text-xs font-mono font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Upload</span>
          </button>

          {/* Hardware Webcam Toggle */}
          <button
            onClick={feedMode === 'webcam' ? stopWebcam : startWebcam}
            title={feedMode === 'webcam' ? "Disconnect WebCam" : "Connect Local Camera / WebCam"}
            className={`px-2 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
              feedMode === 'webcam'
                ? "bg-emerald-500 text-slate-950 shadow-xs animate-pulse"
                : "bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 hover:text-emerald-300"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{feedMode === 'webcam' ? "Cam Active" : "Connect Cam"}</span>
          </button>

          {/* Settings / Diagnostics Popover */}
          <div className="relative">
            <button
              onClick={() => setIsSettingsOpen(p => !p)}
              title="Stream Diagnostics & DPDP Privacy Filters"
              className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                isSettingsOpen
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {isSettingsOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900/98 backdrop-blur-xl border border-slate-700/90 rounded-2xl p-4 shadow-2xl z-50 text-xs font-mono space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                    <Sliders className="w-4 h-4" />
                    <span>Stream Diagnostics &amp; Filters</span>
                  </div>
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="text-slate-400 hover:text-white text-xs px-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* DPDP Act 2023 Blur Configuration */}
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>DPDP Act 2023 Privacy Blur</span>
                    </div>
                    <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      ACTIVE
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-1">
                    {(["GAUSSIAN", "PIXELATE", "BLACKOUT"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={async () => {
                          const updated = await api.updatePrivacyConfig({ blur_mode: mode });
                          if (updated) setPrivacyStatus(updated);
                        }}
                        className={`py-1 px-1 rounded text-[10px] text-center font-bold transition border cursor-pointer ${
                          privacyStatus?.blur_mode === mode
                            ? "bg-emerald-600/30 text-emerald-300 border-emerald-500/50"
                            : "bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800"
                        }`}
                      >
                        {mode === "GAUSSIAN" ? "Gaussian" : mode === "PIXELATE" ? "Pixelate" : "Blackout"}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <span>Faces Redacted: <strong className="text-white">{privacyStatus?.total_faces_redacted ?? 142}</strong></span>
                    <span>Edge Privacy: <strong className="text-emerald-400">On-Frame</strong></span>
                  </div>
                </div>

                {/* Simulation Pace */}
                <div>
                  <div className="text-[10.5px] text-slate-400 font-semibold mb-1.5">Simulation Patrol Pace:</div>
                  <div className="grid grid-cols-3 gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
                    {[
                      { pace: 0.5, label: "0.5x Slow" },
                      { pace: 1.0, label: "1.0x Real" },
                      { pace: 1.5, label: "1.5x Fast" },
                    ].map(({ pace, label }) => (
                      <button
                        key={pace}
                        onClick={() => setSimPace(pace)}
                        className={`py-1 text-center rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          simPace === pace
                            ? "bg-blue-600 text-white"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Day / Night Vision Mode */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-300 text-[11px]">Night Starlight Mode:</span>
                  <button
                    onClick={() => setIsNightMode(p => !p)}
                    className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 text-[10.5px] font-bold transition cursor-pointer ${
                      isNightMode
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                        : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    {isNightMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-400" />}
                    <span>{isNightMode ? "Night Mode" : "Daylight"}</span>
                  </button>
                </div>

                {/* Feed Source Engine */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-300 text-[11px]">Feed Engine:</span>
                  <div className="flex gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setFeedMode('rtsp')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                        feedMode === 'rtsp' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      RTSP
                    </button>
                    <button
                      onClick={() => setFeedMode('canvas')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                        feedMode === 'canvas' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Sim
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Live View"}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── 2. MOBILE DVR CHANNEL SELECTOR STRIP ───────────────────────────── */}
      <div className="z-20 px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 custom-scrollbar">
          <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 font-semibold mr-1">
            <Video className="w-3.5 h-3.5" />
            <span>MDVR:</span>
          </div>
          {DVR_CHANNELS.slice(0, Math.max(1, Math.min(4, bus.dvr_channels || 4))).map((ch) => (
            <button
              key={ch.id}
              onClick={() => {
                setSelectedChannel(ch.id);
                setIsQuadView(false);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                !isQuadView && selectedChannel === ch.id
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/30"
                  : "bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/60"
              }`}
            >
              {ch.name}: {ch.role}
            </button>
          ))}
          <button
            onClick={() => setIsQuadView(true)}
            className={`px-3 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
              isQuadView
                ? "bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30"
                : "bg-slate-800/80 hover:bg-slate-750 text-emerald-400 border border-emerald-500/40"
            }`}
            title="View all 4 DVR cameras simultaneously in 2x2 split-screen"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Quad (2×2)</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[10.5px] font-mono text-slate-400">
          <span className="text-cyan-400 font-medium truncate max-w-[280px]">
            {isQuadView ? "4 CAMERAS SYNCHRONIZED" : DVR_CHANNELS[selectedChannel - 1]?.subtitle}
          </span>
        </div>
      </div>

      {/* ── 3. MAIN VIDEO VIEWPORT ────────────────────────────────────────── */}
      <div className="relative w-full aspect-video min-h-[320px] max-h-[560px] bg-slate-950 flex items-center justify-center overflow-hidden">
        {isQuadView ? (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1.5 p-1.5 bg-slate-950">
            {DVR_CHANNELS.slice(0, 4).map((ch) => (
              <div
                key={ch.id}
                onClick={() => {
                  setSelectedChannel(ch.id);
                  setIsQuadView(false);
                }}
                className="relative group cursor-pointer bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-cyan-400 transition-all flex flex-col"
              >
                <img
                  src={`/api/streams/snapshot/${bus.id}?channel=${ch.id}&t=${frameTimestamp}`}
                  alt={`${bus.id} CH${ch.id}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-slate-950/85 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-700/80 text-[10.5px] font-mono font-bold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{ch.name}: {ch.role}</span>
                </div>
                <div className="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[9.5px] font-mono text-slate-400">
                  {ch.subtitle.split('(')[0]}
                </div>
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-cyan-500 text-slate-950 text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow flex items-center gap-1">
                  <span>Focus</span>
                  <Maximize2 className="w-2.5 h-2.5" />
                </div>
              </div>
            ))}
          </div>
        ) : feedMode === 'rtsp' ? (
          <div className="relative w-full h-full">
            <img
              src={`/api/streams/snapshot/${bus.id}?channel=${selectedChannel}&t=${frameTimestamp}`}
              onError={() => setRtspError(true)}
              onLoad={() => setRtspError(false)}
              alt={`Live Stream ${bus.id} CH${selectedChannel}`}
              className="w-full h-full object-cover"
            />
            {/* Live AI Perception Overlay Card */}
            {showBoundingBoxes && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-2 pointer-events-none">
                <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-[11px] font-mono flex items-center gap-2 shadow-xl">
                  <span className={`w-2 h-2 rounded-full ${activeDetections.length > 0 ? "bg-rose-500 animate-pulse" : "bg-emerald-400"}`} />
                  <span className="text-slate-200">
                    AI CV: <strong className={activeDetections.length > 0 ? "text-rose-400 font-bold" : "text-emerald-400"}>
                      {activeDetections.length > 0 ? `${activeDetections.length} HAZARD DETECTED` : "ALL CLEAR"}
                    </strong>
                  </span>
                  {activeDetections.length > 0 && (
                    <span className="text-rose-300 font-bold bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-600/40 text-[10px]">
                      {activeDetections[0].defect_name || activeDetections[0].label || 'D40'} ({Math.round((activeDetections[0].confidence || 0.95) * 100)}%)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : feedMode === 'webcam' ? (
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            <video
              ref={webcamVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {showBoundingBoxes && (
              <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 items-end pointer-events-none">
                <div className="bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-[11px] font-mono flex items-center gap-2 shadow-xl">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-slate-200 font-semibold">
                    LOCAL WEBCAM INGEST (30 FPS)
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={854}
            height={480}
            className="w-full h-full object-cover"
          />
        )}

        {/* Minimal Optical Reticle */}
        {!isQuadView && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-25">
            <div className="w-10 h-0.5 bg-cyan-400" />
            <div className="h-10 w-0.5 bg-cyan-400 -ml-5" />
          </div>
        )}
      </div>

      {/* ── 4. MODERN GLASS BOTTOM TELEMETRY RIBBON ───────────────────────── */}
      <div className="px-4 py-3 bg-slate-950/95 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Node Identity & Corridor */}
        <div className="flex items-center gap-2.5">
          <div className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs shadow-xs">
            {bus.id}
          </div>
          <div>
            <div className="text-white font-semibold text-xs truncate max-w-[200px] sm:max-w-[300px]">
              {bus.route_name}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Vehicle Class: {bus.vehicle_type || 'Tata Ultra EV 12M'}
            </div>
          </div>
        </div>

        {/* Center: Live Dynamic Gauges */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          {/* Speed Card */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 text-[10px]">SPEED</span>
            <span className="text-amber-400 font-bold text-xs">{((bus.speed_kmh || 38) * (isPaused ? 0 : simPace)).toFixed(0)} km/h</span>
          </div>

          {/* Vertical IMU Jerk (G_z) Card with Dynamic Severity Color */}
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-colors ${
            currentJerk >= 1.30 
              ? "bg-rose-950/70 border-rose-600 text-rose-300 animate-pulse"
              : currentJerk > 1.08 
                ? "bg-amber-950/60 border-amber-600 text-amber-300"
                : "bg-slate-900 border-slate-800 text-slate-200"
          }`}>
            <Zap className={`w-3.5 h-3.5 ${currentJerk >= 1.30 ? "text-rose-400" : currentJerk > 1.08 ? "text-amber-400" : "text-emerald-400"}`} />
            <span className="text-slate-400 text-[10px]">IMU G_z</span>
            <span className={`font-bold text-xs ${currentJerk >= 1.30 ? "text-rose-400" : currentJerk > 1.08 ? "text-amber-400" : "text-emerald-400"}`}>
              {currentJerk.toFixed(2)}g
            </span>
          </div>

          {/* Lux Ambient Meter */}
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${
            isNightMode ? "bg-slate-900 border-slate-800 text-rose-400" : "bg-slate-900 border-slate-800 text-slate-200"
          }`}>
            <Sun className={`w-3.5 h-3.5 ${isNightMode ? "text-rose-400" : "text-amber-400"}`} />
            <span className="text-slate-400 text-[10px]">LUX</span>
            <span className="font-bold text-xs">{isNightMode ? "2.4 lx" : "480 lx"}</span>
          </div>
        </div>

        {/* Right: GPS Telemetry & NavIC Status */}
        <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>NavIC: <b>{bus.lat.toFixed(4)}°N, {bus.lng.toFixed(4)}°E</b></span>
        </div>
      </div>

      {/* Upload Footage Modal */}
      <UploadFootageModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        busId={bus.id}
        selectedChannel={selectedChannel}
        onUploadSuccess={(res) => {
          if (res?.reset) {
            setUploadedMediaInfo({ active: false });
            setActiveDetections([]);
          } else if (res?.success) {
            setUploadedMediaInfo({
              active: true,
              filename: res.filename,
              mediaType: res.media_type,
              channel: res.channel || selectedChannel,
              count: res.detections_count
            });
            if (res.channel) {
              setSelectedChannel(res.channel);
            }
            setFeedMode('rtsp');
            setIsQuadView(false);
            setRtspError(false);
          }
          setFrameTimestamp(Date.now());
        }}
      />
    </div>
  );
};
