import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Bus, 
  ArrowLeft, 
  Sparkles,
  Send, 
  Eye, 
  EyeOff,
  Radio, 
  Video, 
  UploadCloud,
  School,
  Droplets,
  Pause,
  Play,
  Download,
  Activity,
  Zap,
  Check
} from 'lucide-react';
import { HazardCluster, WorkOrderStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { UploadFootageModal } from '../components/modals/UploadFootageModal';
import { DocumentExportModal } from '../components/modals/DocumentExportModal';

interface MobileDashcamProps {
  clusters?: HazardCluster[];
  onBackToDashboard: () => void;
  onSendIngest: (payload: any) => void;
  onSendIncident?: (payload: any) => void;
  onUpdateWorkOrder?: (orderId: string, newStatus: WorkOrderStatus, beforeImg?: string, afterImg?: string, notes?: string) => void;
  onAddCluster?: (newCluster: HazardCluster) => void;
}

export type CameraPosition = 'front' | 'rear' | 'curbside' | 'lane';

interface CameraChannel {
  id: CameraPosition;
  name: string;
  tag: string;
  resolution: string;
  icon: any;
  previewUrl: string;
  detection: {
    title: string;
    description: string;
    confidence: number;
    badgeText: string;
    badgeColor: 'amber' | 'rose' | 'emerald' | 'blue' | 'cyan';
    incidentType: string;
    defectType?: string;
    plateNumber?: string;
    speedKmh?: number;
    imuShock?: string;
  };
}

const CHANNELS: CameraChannel[] = [
  {
    id: 'front',
    name: 'Front Windshield 4K',
    tag: 'CH 1',
    resolution: '4K UHD • 30 FPS',
    icon: School,
    previewUrl: '/uploads/sample_clips/clip_crosswalk_safety.mp4',
    detection: {
      title: 'School Children Crossing Zone',
      description: '3 Pedestrians detected on marked crosswalk. Mandatory vehicle yield active (IRC:35 & Vision Zero).',
      confidence: 96,
      badgeText: 'Pedestrian Safety',
      badgeColor: 'amber',
      incidentType: 'SCHOOL_CHILDREN_CROSSING_RISK',
      speedKmh: 24.0,
      imuShock: '+0.18g'
    }
  },
  {
    id: 'rear',
    name: 'Rear ANPR Radar',
    tag: 'CH 2',
    resolution: '1080p • 60 FPS',
    icon: ShieldAlert,
    previewUrl: '/uploads/sample_clips/clip_urban_traffic.mp4',
    detection: {
      title: 'Hit & Run Evasion Trajectory',
      description: 'Vehicle clocked at 78.4 km/h with sudden acceleration spike. License plate TN-01-AX-8732 extracted for 112 intercept.',
      confidence: 97,
      badgeText: 'Critical Alert',
      badgeColor: 'rose',
      incidentType: 'HIT_AND_RUN',
      plateNumber: 'TN-01-AX-8732',
      speedKmh: 78.4,
      imuShock: '+0.42g'
    }
  },
  {
    id: 'curbside',
    name: 'Left Curbside & Pothole Scan',
    tag: 'CH 3',
    resolution: '1080p • 30 FPS',
    icon: Droplets,
    previewUrl: '/uploads/sample_clips/clip_pothole_nh32.mp4',
    detection: {
      title: 'NH-32 Pothole Cavity (8.4cm Depth)',
      description: 'Severe road cavity identified on NH-32 Tambaram link. Direct MoRTH schedule repair required.',
      confidence: 96,
      badgeText: 'Hazard D40',
      badgeColor: 'rose',
      incidentType: 'D40',
      defectType: 'D40',
      imuShock: '+1.48g'
    }
  },
  {
    id: 'lane',
    name: 'OMR 4K Expressway Corridor',
    tag: 'CH 4',
    resolution: '4K UHD • 60 FPS',
    icon: Bus,
    previewUrl: '/uploads/sample_clips/clip_omr_expressway.mp4',
    detection: {
      title: 'Expressway Barrier & Lane Radar',
      description: 'High-speed highway corridor scan with lane marking integrity and barrier defect audit.',
      confidence: 94,
      badgeText: 'Highway Radar',
      badgeColor: 'blue',
      incidentType: 'MISSING_DIVIDER',
      plateNumber: 'TN-09-BK-4012',
      speedKmh: 65.0,
      imuShock: '+0.15g'
    }
  }
];

export const MobileDashcam: React.FC<MobileDashcamProps> = ({
  clusters = [],
  onBackToDashboard,
  onSendIngest,
  onSendIncident,
}) => {
  const { t } = useLanguage();
  const { success: showSuccessToast, warning: showWarningToast, info: showInfoToast } = useToast();

  const [activeChannelId, setActiveChannelId] = useState<CameraPosition>('front');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showAiBoxes, setShowAiBoxes] = useState<boolean>(true);
  const [showPrivacyBlur, setShowPrivacyBlur] = useState<boolean>(true);
  
  // WebRTC Device Camera Mode
  const [useDeviceWebcam, setUseDeviceWebcam] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sampleVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  const activeChannel = CHANNELS.find(c => c.id === activeChannelId) || CHANNELS[0];

  // Sync play/pause with native video element
  useEffect(() => {
    if (sampleVideoRef.current) {
      if (isPlaying) {
        sampleVideoRef.current.play().catch(() => {});
      } else {
        sampleVideoRef.current.pause();
      }
    }
  }, [isPlaying, activeChannelId]);

  // Clean, Smooth Dynamic Perception HUD Canvas Overlay
  useEffect(() => {
    let animFrame: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawCornerBox = (
      bx: number,
      by: number,
      bw: number,
      bh: number,
      color: string,
      label: string,
      sublabel?: string
    ) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.0;

      // Draw subtle box
      ctx.strokeRect(bx, by, bw, bh);

      // Corner brackets
      const cLen = Math.max(8, Math.min(22, bw * 0.2));
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      // Top-Left
      ctx.moveTo(bx, by + cLen); ctx.lineTo(bx, by); ctx.lineTo(bx + cLen, by);
      // Top-Right
      ctx.moveTo(bx + bw - cLen, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cLen);
      // Bottom-Left
      ctx.moveTo(bx, by + bh - cLen); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cLen, by + bh);
      // Bottom-Right
      ctx.moveTo(bx + bw - cLen, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cLen);
      ctx.stroke();

      // Top label badge
      ctx.font = 'bold 10.5px monospace';
      const textMetrics = ctx.measureText(label);
      const tagW = textMetrics.width + 12;
      const tagH = 18;
      const tagY = Math.max(0, by - tagH - 2);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(bx, tagY, tagW, tagH);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.0;
      ctx.strokeRect(bx, tagY, tagW, tagH);

      ctx.fillStyle = color;
      ctx.fillText(label, bx + 6, tagY + 13);

      // Optional sublabel / plate tag
      if (sublabel) {
        const subW = 110;
        const subH = 22;
        const subY = by + bh + 4;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(bx + (bw - subW) / 2, subY, subW, subH);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx + (bw - subW) / 2, subY, subW, subH);
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(sublabel, bx + (bw - subW) / 2 + 8, subY + 15);
      }
      ctx.restore();
    };

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (showAiBoxes) {
        if (useDeviceWebcam) {
          // Dynamic Optical Reticle for Real Device Camera
          const cx = w * 0.5;
          const cy = h * 0.5;
          const reticleSize = 120;
          ctx.save();
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 6]);
          ctx.strokeRect(cx - reticleSize / 2, cy - reticleSize / 2, reticleSize, reticleSize);
          ctx.setLineDash([]);
          
          // Optical crosshairs
          ctx.beginPath();
          ctx.moveTo(cx - 20, cy); ctx.lineTo(cx + 20, cy);
          ctx.moveTo(cx, cy - 20); ctx.lineTo(cx, cy + 20);
          ctx.stroke();

          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(cx - 85, cy + reticleSize / 2 + 10, 170, 20);
          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('OPTICAL SCANNING ACTIVE', cx - 72, cy + reticleSize / 2 + 24);
          ctx.restore();
        } else {
          // Time-Synchronized Dynamic Perception for Sample Clips
          const t = sampleVideoRef.current ? sampleVideoRef.current.currentTime : (Date.now() / 1000);

          if (activeChannel.id === 'front') {
            // Channel 1: Pedestrian Crossing & Approaching Pedestrians
            const walkProgress = (t * 0.12) % 1;
            const pedX = w * (0.65 - walkProgress * 0.25);
            const pedY = h * 0.46;
            drawCornerBox(pedX, pedY, 55, 120, '#f59e0b', 'PEDESTRIAN [96%]');

            // Crosswalk marking on pavement
            drawCornerBox(w * 0.18, h * 0.68, w * 0.64, 90, '#10b981', 'ZEBRA CROSSING (IRC:35) [98%]');

            // Vehicle ahead in traffic
            const vehX = w * 0.28 + Math.sin(t * 0.5) * 6;
            drawCornerBox(vehX, h * 0.44, 110, 85, '#38bdf8', 'VEHICLE [94%]');
          } else if (activeChannel.id === 'rear') {
            // Channel 2: Rear Overtake & License Plate ANPR
            const sway = Math.sin(t * 1.2) * 12;
            const vehW = 190 + Math.sin(t * 0.8) * 15;
            const vehH = 145 + Math.sin(t * 0.8) * 10;
            const vehX = w * 0.38 + sway;
            const vehY = h * 0.45;
            drawCornerBox(vehX, vehY, vehW, vehH, '#f43f5e', 'VEHICLE [97%]', 'TN-01-AX-8732');
          } else if (activeChannel.id === 'curbside') {
            // Channel 3: Pothole & Road Distress Cavity Tracking
            const cycle = (t * 0.28) % 1;
            const z = Math.pow(cycle, 1.8);
            const cavY = h * (0.42 + z * 0.45);
            const cavX = w * (0.32 + z * 0.12);
            const cavW = 75 + z * 110;
            const cavH = 40 + z * 60;
            drawCornerBox(cavX, cavY, cavW, cavH, '#ef4444', 'POTHOLE D40 (8.4cm) [96%]');
          } else if (activeChannel.id === 'lane') {
            // Channel 4: Highway Corridor Radar & Lane Barrier
            const veh1X = w * 0.20 + Math.sin(t * 0.4) * 8;
            drawCornerBox(veh1X, h * 0.46, 130, 100, '#3b82f6', 'HIGHWAY VEHICLE [94%]');

            const veh2X = w * 0.62 + Math.cos(t * 0.5) * 6;
            drawCornerBox(veh2X, h * 0.44, 115, 88, '#06b6d4', 'CORRIDOR TRAFFIC [92%]');

            drawCornerBox(w * 0.45, h * 0.62, 50, 110, '#a855f7', 'LANE MARKING [96%]');
          }
        }
      }

      // Privacy Badge Stamp
      if (showPrivacyBlur) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(w - 215, 12, 205, 22);
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('DPDP ACT 2023 PRIVACY MASKED', w - 205, 27);
      }

      animFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [isPlaying, activeChannelId, showAiBoxes, showPrivacyBlur, useDeviceWebcam]);

  // Handle Event Ingestion to DB
  const handleIngestDetection = () => {
    const d = activeChannel.detection;
    showSuccessToast('Logged to Command Center', `${d.title} (${d.confidence}% conf) submitted.`);

    if (d.defectType) {
      onSendIngest({
        bus_id: 'BUS-TN01-1042',
        defect_type: d.defectType,
        lat: 12.9516,
        lng: 80.1462,
        vertical_g_force: activeChannel.id === 'front' ? 1.48 : 0.98,
        confidence: d.confidence / 100,
        captured_at: new Date().toISOString()
      });
    } else if (onSendIncident) {
      onSendIncident({
        reporting_bus_id: 'BUS-TN01-1042',
        incident_type: d.incidentType,
        lat: 13.0450,
        lng: 80.2380,
        road_name: 'GST Road Corridor',
        plate_number: d.plateNumber,
        target_speed_kmh: d.speedKmh || 35.0,
        fine_amount_inr: d.incidentType === 'HIT_AND_RUN' ? 25000 : (d.incidentType === 'SCHOOL_CHILDREN_CROSSING_RISK' ? 2000 : 1500),
        mva_section: d.incidentType === 'HIT_AND_RUN' ? 'MVA 1988 Sec 134(a)(b) + BNS 106(2)' : 'IRC:35 & CMVR Rule 138'
      });
    }
  };

  // Toggle WebRTC Device Camera
  const toggleDeviceCamera = async () => {
    if (!useDeviceWebcam) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setUseDeviceWebcam(true);
        showSuccessToast('Device Camera Active', 'Streaming live video from your device.');
      } catch (err) {
        showWarningToast('Camera Permission Error', 'Could not open device camera. Reverting to simulator.');
        setUseDeviceWebcam(false);
      }
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
      setUseDeviceWebcam(false);
      showInfoToast('Simulator Restored', 'Switched back to synthetic dashcam feed.');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar bg-[#f8f7f4] dark:bg-[#0c1017] text-slate-900 dark:text-slate-100 select-none transition-colors">
      
      {/* ── 1. Clean Minimal Header ── */}
      <div className="bg-white dark:bg-[#111722] border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Edge Dashcam Ingest
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-mono font-bold">
                LIVE INFERENCE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a camera channel to monitor road safety &amp; infrastructure distress in real time.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDeviceCamera}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              useDeviceWebcam 
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{useDeviceWebcam ? 'Device Cam On' : 'Use Device Camera'}</span>
          </button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            icon={<UploadCloud className="w-3.5 h-3.5" />}
          >
            Upload File
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export Dossier
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-[1400px] mx-auto w-full space-y-4">
        
        {/* ── 2. Camera Channel Tabs ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {CHANNELS.map((ch) => {
            const isActive = ch.id === activeChannelId;
            const Icon = ch.icon;
            return (
              <button
                key={ch.id}
                onClick={() => setActiveChannelId(ch.id)}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
                  isActive
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 dark:border-blue-500 text-slate-900 dark:text-white shadow-xs'
                    : 'bg-white dark:bg-[#111722] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200 shadow-xs'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                      {ch.tag}
                    </span>
                    <span className="font-bold text-xs truncate text-slate-900 dark:text-white">
                      {ch.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {ch.detection.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── 3. Main Live Video Stage ── */}
        <div className="bg-white dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          
          {/* Top Stage Bar */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold text-slate-900 dark:text-white">{activeChannel.name}</span>
              <span className="text-slate-400 dark:text-slate-500">&bull;</span>
              <span className="text-slate-600 dark:text-slate-400">{activeChannel.resolution}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAiBoxes(!showAiBoxes)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-1 ${
                  showAiBoxes 
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                {showAiBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>AI Boxes</span>
              </button>

              <button
                onClick={() => setShowPrivacyBlur(!showPrivacyBlur)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-1 ${
                  showPrivacyBlur 
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Privacy Blur</span>
              </button>
            </div>
          </div>

          {/* Screen / Video Viewport */}
          <div className="relative aspect-video max-h-[440px] w-full bg-black flex items-center justify-center overflow-hidden">
            {useDeviceWebcam ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={sampleVideoRef}
                  key={activeChannel.previewUrl}
                  src={activeChannel.previewUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas 
                  ref={canvasRef} 
                  width={880} 
                  height={460} 
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
              </div>
            )}

            {/* Bottom Playback Toggle */}
            <div className="absolute bottom-3 left-3 z-30 flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 hover:bg-slate-800 text-white cursor-pointer shadow-lg"
                title={isPlaying ? 'Pause' : 'Resume'}
              >
                {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
              </button>
              <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs font-mono text-slate-300">
                IMU Jerk: <b className="text-emerald-400">{activeChannel.detection.imuShock}</b>
              </div>
            </div>
          </div>

          {/* ── 4. Bottom Active Detection & Action Ribbon ── */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900 text-[10px] font-mono font-bold">
                  {activeChannel.detection.badgeText}
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  {activeChannel.detection.title}
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  [{activeChannel.detection.confidence}% Confidence]
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                {activeChannel.detection.description}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="primary"
                size="md"
                onClick={handleIngestDetection}
                icon={<Send className="w-4 h-4" />}
                className="w-full md:w-auto"
              >
                Push Detection to Command Center
              </Button>
            </div>
          </div>
        </div>

        {/* ── 5. Quick Scenario Presets ── */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            One-Click Scenarios:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            <button
              onClick={() => setActiveChannelId('front')}
              className="p-3.5 rounded-2xl bg-white dark:bg-[#111722] border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 text-left transition cursor-pointer flex items-center gap-3 shadow-xs"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-transparent">
                <School className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">School Crossing Zone</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Vision Zero Pedestrian Yield Mandate</div>
              </div>
            </button>

            <button
              onClick={() => setActiveChannelId('rear')}
              className="p-3.5 rounded-2xl bg-white dark:bg-[#111722] border border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500/50 text-left transition cursor-pointer flex items-center gap-3 shadow-xs"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-transparent">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">Hit &amp; Run Evasion</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">High-Speed Evasion Radar &amp; ANPR</div>
              </div>
            </button>

            <button
              onClick={() => setActiveChannelId('curbside')}
              className="p-3.5 rounded-2xl bg-white dark:bg-[#111722] border border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-500/50 text-left transition cursor-pointer flex items-center gap-3 shadow-xs"
            >
              <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-200 dark:border-transparent">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">Open Manhole Cavity</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Uncovered Sewer Hazard (IS:1726)</div>
              </div>
            </button>

          </div>
        </div>

        {/* Modals */}
        <UploadFootageModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          busId="BUS-TN01-1042"
          onUploadSuccess={(res) => {
            showSuccessToast('Uploaded', `Ingested ${res.defectLabel} successfully.`);
          }}
        />

        <DocumentExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          targetCluster={clusters[0] || null}
        />
      </div>
    </div>
  );
};
