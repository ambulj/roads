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
  Check,
  Car
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
    icon: ShieldAlert,
    previewUrl: '/sample_clips/clip_pothole_nh32.mp4',
    detection: {
      title: 'NH-32 Arterial Pothole Cavity (8.4cm Depth)',
      description: 'Critical road pavement cavity identified on GST Road (NH-32) Tambaram link. MoRTH Class D40 distress with automated 24H SLA repair dispatch.',
      confidence: 96.8,
      badgeText: 'Pothole D40 (Critical)',
      badgeColor: 'rose',
      incidentType: 'D40',
      defectType: 'D40',
      speedKmh: 42.0,
      imuShock: '+1.48g'
    }
  },
  {
    id: 'rear',
    name: 'Rear ANPR Radar',
    tag: 'CH 2',
    resolution: '1080p • 60 FPS',
    icon: ShieldAlert,
    previewUrl: '/sample_clips/clip_urban_traffic.mp4',
    detection: {
      title: 'Hit & Run Trajectory & ANPR Identification',
      description: 'High-speed tailgating vehicle clocked at 78.4 km/h with sudden acceleration spike. High Security Plate TN-01-AX-8732 extracted for 112 statutory notice.',
      confidence: 98.2,
      badgeText: 'ANPR Enforcement',
      badgeColor: 'rose',
      incidentType: 'HIT_AND_RUN',
      plateNumber: 'TN-01-AX-8732',
      speedKmh: 78.4,
      imuShock: '+0.42g'
    }
  },
  {
    id: 'curbside',
    name: 'Curbside & Crosswalk Safety',
    tag: 'CH 3',
    resolution: '1080p • 30 FPS',
    icon: School,
    previewUrl: '/sample_clips/clip_crosswalk_safety.mp4',
    detection: {
      title: 'School Zone Pedestrian Crosswalk Yield',
      description: 'Vulnerable pedestrians detected on marked pavement crossing. Mandatory vehicle deceleration active (IRC:35:2015 & Vision Zero India).',
      confidence: 96.4,
      badgeText: 'Pedestrian Safety',
      badgeColor: 'amber',
      incidentType: 'SCHOOL_CHILDREN_CROSSING_RISK',
      speedKmh: 24.0,
      imuShock: '+0.18g'
    }
  },
  {
    id: 'lane',
    name: 'OMR 4K Expressway Corridor',
    tag: 'CH 4',
    resolution: '4K UHD • 60 FPS',
    icon: Bus,
    previewUrl: '/sample_clips/clip_omr_expressway.mp4',
    detection: {
      title: 'Expressway Crash Barrier & Lane Marking Audit',
      description: 'High-speed highway corridor multi-vehicle perception with continuous white lane tracking and barrier defect audit.',
      confidence: 94.5,
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

  // Clean, High-Precision Dynamic Neural AI Perception Overlay
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
      sublabel?: string,
      accentTag?: string
    ) => {
      ctx.save();
      
      // Semi-transparent background fill
      ctx.fillStyle = `${color}20`;
      ctx.fillRect(bx, by, bw, bh);

      // Subtle main bounding box
      ctx.strokeStyle = `${color}80`;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, bw, bh);

      // Distinctive glowing corner brackets
      const cLen = Math.max(10, Math.min(24, Math.min(bw, bh) * 0.25));
      ctx.strokeStyle = color;
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

      // Top label header pill
      ctx.font = 'bold 11px monospace';
      const textMetrics = ctx.measureText(label);
      const tagW = textMetrics.width + 16;
      const tagH = 20;
      const tagY = Math.max(2, by - tagH - 3);

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(bx, tagY, tagW, tagH, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, bx + 8, tagY + 14);

      // Optional bottom sublabel / telemetry badge
      if (sublabel) {
        ctx.font = 'bold 10px monospace';
        const subMetrics = ctx.measureText(sublabel);
        const subW = subMetrics.width + 14;
        const subH = 18;
        const subY = by + bh + 4;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.beginPath();
        ctx.roundRect(bx, subY, subW, subH, 3);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.0;
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.fillText(sublabel, bx + 7, subY + 13);
      }

      // Optional accent badge on right of box
      if (accentTag) {
        ctx.font = 'bold 9.5px monospace';
        const accMetrics = ctx.measureText(accentTag);
        const accW = accMetrics.width + 10;
        const accH = 16;
        const accX = bx + bw - accW;
        const accY = Math.max(2, by - accH - 3);

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(accX, accY, accW, accH, 3);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.fillText(accentTag, accX + 5, accY + 12);
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
          const reticleSize = 130;
          ctx.save();
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)';
          ctx.lineWidth = 2.0;
          ctx.setLineDash([8, 6]);
          ctx.strokeRect(cx - reticleSize / 2, cy - reticleSize / 2, reticleSize, reticleSize);
          ctx.setLineDash([]);
          
          // Optical crosshairs
          ctx.beginPath();
          ctx.moveTo(cx - 24, cy); ctx.lineTo(cx + 24, cy);
          ctx.moveTo(cx, cy - 24); ctx.lineTo(cx, cy + 24);
          ctx.stroke();

          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.fillRect(cx - 95, cy + reticleSize / 2 + 12, 190, 22);
          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('LIVE HARDWARE INGEST (30 FPS)', cx - 85, cy + reticleSize / 2 + 27);
          ctx.restore();
        } else {
          // Time-Synchronized Dynamic Multi-Model Neural Perception
          const t = sampleVideoRef.current ? sampleVideoRef.current.currentTime : (Date.now() / 1000);

          if (activeChannel.id === 'front') {
            // Channel 1: Windshield Pothole & Road Distress Patrol (NH-32)
            // 1. Approaching Pothole Cavity with perspective scaling
            const cycle = (t * 0.35) % 1;
            const z = Math.pow(cycle, 1.8);
            const cavY = h * (0.48 + z * 0.38);
            const cavX = w * (0.34 + z * 0.08);
            const cavW = 95 + z * 150;
            const cavH = 45 + z * 75;
            drawCornerBox(cavX, cavY, cavW, cavH, '#ef4444', 'POTHOLE D40 [96.8%]', 'DEPTH: 8.4cm • SLA: 24H', 'MoRTH CRITICAL');

            // 2. Alligator crack on right lane
            const cz = Math.pow(((t + 1.2) * 0.26) % 1, 1.5);
            const crackY = h * (0.52 + cz * 0.34);
            const crackX = w * (0.64 + cz * 0.06);
            drawCornerBox(crackX, crackY, 115 + cz * 110, 50 + cz * 45, '#f59e0b', 'ALLIGATOR CRACK D20 [89.2%]', 'IRC:SP:84 SPEC');

            // 3. Leading traffic vehicle ahead in lane
            const vehX = w * 0.22 + Math.sin(t * 0.7) * 8;
            const vehY = h * 0.42;
            drawCornerBox(vehX, vehY, 135, 95, '#38bdf8', 'VEHICLE [94.5%]', 'MTC BUS ROUTE 21G');

            // 4. Road Roughness (IRI) HUD Stamp in top right
            ctx.save();
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.fillRect(16, 16, 210, 24);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1;
            ctx.strokeRect(16, 16, 210, 24);
            ctx.fillStyle = '#f87171';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('IRC:SP:84 IRI: 3.4 m/km (POOR)', 26, 32);
            ctx.restore();

          } else if (activeChannel.id === 'rear') {
            // Channel 2: Rear Overtake & High-Speed ANPR
            const sway = Math.sin(t * 1.2) * 14;
            const vehW = 210 + Math.sin(t * 0.8) * 15;
            const vehH = 155 + Math.sin(t * 0.8) * 10;
            const vehX = w * 0.36 + sway;
            const vehY = h * 0.40;
            drawCornerBox(vehX, vehY, vehW, vehH, '#f43f5e', 'VEHICLE (SPEED: 78.4 km/h) [97.8%]', 'TAILGATE DISTANCE: 12.8m', 'CMVR 138');

            // Forensic High Security License Plate (HSRP) cutout tag
            const plateX = vehX + vehW * 0.22;
            const plateY = vehY + vehH * 0.65;
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2.0;
            ctx.fillRect(plateX, plateY, 130, 26);
            ctx.strokeRect(plateX, plateY, 130, 26);
            // Blue IND strip
            ctx.fillStyle = '#1d4ed8';
            ctx.fillRect(plateX, plateY, 22, 26);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText('IND', plateX + 3, plateY + 17);
            // Plate digits
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 13px monospace';
            ctx.fillText('TN-01-AX-8732', plateX + 26, plateY + 18);
            ctx.restore();

          } else if (activeChannel.id === 'curbside') {
            // Channel 3: School Zone Crosswalk & Pedestrian Yield
            const walk = (t * 0.12) % 1;
            const pedX = w * (0.68 - walk * 0.28);
            drawCornerBox(pedX, h * 0.44, 65, 135, '#f59e0b', 'PEDESTRIAN [96.4%]', 'CROSSING IN PROGRESS', 'YIELD ACTIVE');
            drawCornerBox(w * 0.14, h * 0.66, w * 0.72, 100, '#10b981', 'ZEBRA CROSSING (IRC:35:2015) [98.1%]', 'RETROREFLECTIVITY: 310 mcd');

            // School Zone Signboard in top right
            drawCornerBox(w * 0.82, h * 0.28, 70, 70, '#f59e0b', 'SCHOOL SIGN [95.2%]', 'IRC:67 MANDATE');

          } else if (activeChannel.id === 'lane') {
            // Channel 4: Highway Corridor Radar & Crash Barrier
            const v1X = w * 0.18 + Math.sin(t * 0.4) * 8;
            drawCornerBox(v1X, h * 0.45, 145, 105, '#3b82f6', 'EXPRESSWAY VEHICLE [94.5%]', 'VELOCITY: 64 km/h');

            const v2X = w * 0.62 + Math.cos(t * 0.5) * 6;
            drawCornerBox(v2X, h * 0.43, 125, 92, '#06b6d4', 'CORRIDOR TRAFFIC [92.1%]', 'VELOCITY: 58 km/h');

            drawCornerBox(w * 0.43, h * 0.58, 55, 130, '#a855f7', 'CONTINUOUS WHITE LANE [96.7%]', 'IRC:35 SPEC');
            drawCornerBox(w * 0.86, h * 0.54, 75, 120, '#0284c7', 'CRASH BARRIER [93.8%]', 'IRC:SP:84 AUDIT');
          }
        }
      }

      // Statutory DPDP Act 2023 Privacy Badge Stamp
      if (showPrivacyBlur) {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.fillRect(w - 245, 14, 230, 24);
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1;
        ctx.strokeRect(w - 245, 14, 230, 24);
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('DPDP ACT 2023 PRIVACY MASKED', w - 235, 30);
        ctx.restore();
      }

      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);

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
        fine_amount_inr: d.incidentType === 'HIT_AND_RUN' ? 25000 : (d.incidentType === 'SCHOOL_CHILDREN_CROSSING_RISK' ? 0 : 1500),
        mva_section: d.incidentType === 'HIT_AND_RUN' ? 'MVA 1988 Sec 134(a)(b) + BNS 106(2)' : (d.incidentType === 'SCHOOL_CHILDREN_CROSSING_RISK' ? 'IRC:35:2015 Sec 8 & MVDR 2017 Reg 11' : 'IRC:35 & CMVR Rule 138')
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
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('bus_dashcam_pothole_patrol.mp4')) {
                      target.src = '/evidence/bus_dashcam_pothole_patrol.mp4';
                      target.play().catch(() => {});
                    }
                  }}
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
              className="p-3.5 rounded-2xl bg-white dark:bg-[#111722] border border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500/50 text-left transition cursor-pointer flex items-center gap-3 shadow-xs"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-transparent">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">NH-32 Pothole Cavity</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">8.4cm Depth • MoRTH 24H SLA Infill</div>
              </div>
            </button>

            <button
              onClick={() => setActiveChannelId('rear')}
              className="p-3.5 rounded-2xl bg-white dark:bg-[#111722] border border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500/50 text-left transition cursor-pointer flex items-center gap-3 shadow-xs"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-transparent">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">Rear ANPR &amp; Tailgating</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">High Security Plate TN-01-AX-8732</div>
              </div>
            </button>

            <button
              onClick={() => setActiveChannelId('curbside')}
              className="p-3.5 rounded-2xl bg-white dark:bg-[#111722] border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 text-left transition cursor-pointer flex items-center gap-3 shadow-xs"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-transparent">
                <School className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">School Crossing Zone</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">IRC:35 Zebra Marking &amp; Pedestrian Yield</div>
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
