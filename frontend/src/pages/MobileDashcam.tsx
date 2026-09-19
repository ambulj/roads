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
    previewUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&auto=format&fit=crop&q=80',
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
    previewUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&auto=format&fit=crop&q=80',
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
    name: 'Left Curbside & Drain',
    tag: 'CH 3',
    resolution: '1080p • 30 FPS',
    icon: Droplets,
    previewUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1200&auto=format&fit=crop&q=80',
    detection: {
      title: 'Open Manhole Cavity (IS:1726)',
      description: 'Uncovered sewer rim detected on curb shoulder. High risk for two-wheelers and pedestrians.',
      confidence: 94,
      badgeText: 'Hazard P0',
      badgeColor: 'rose',
      incidentType: 'OPEN_MANHOLE',
      defectType: 'OPEN_MANHOLE',
      imuShock: '+0.12g'
    }
  },
  {
    id: 'lane',
    name: 'Right Dedicated Bus Lane',
    tag: 'CH 4',
    resolution: '1080p • 60 FPS',
    icon: Bus,
    previewUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=80',
    detection: {
      title: 'Bus Lane Encroachment (MVA 177)',
      description: 'Unauthorized commercial vehicle blocking designated rapid transit corridor.',
      confidence: 98,
      badgeText: 'Traffic Violation',
      badgeColor: 'blue',
      incidentType: 'BUS_LANE_ENCROACH',
      plateNumber: 'TN-09-BK-4012',
      speedKmh: 42.0,
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  const activeChannel = CHANNELS.find(c => c.id === activeChannelId) || CHANNELS[0];

  // Clean, Smooth Animated Road Canvas
  useEffect(() => {
    let animFrame: number;
    let tick = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      tick++;
      const w = canvas.width;
      const h = canvas.height;

      // Clean Dark Gradient Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.45);
      skyGrad.addColorStop(0, '#0b1120');
      skyGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.45);

      // Road Asphalt
      const roadGrad = ctx.createLinearGradient(0, h * 0.45, 0, h);
      roadGrad.addColorStop(0, '#1e293b');
      roadGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, h * 0.45, w, h * 0.55);

      const horizonY = h * 0.45;

      // Road Edges
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.44, horizonY);
      ctx.lineTo(w * 0.08, h);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w * 0.56, horizonY);
      ctx.lineTo(w * 0.92, h);
      ctx.stroke();

      // Moving Center Lane Markings
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3.5;
      const laneOffset = isPlaying ? (tick * 4) % 60 : 0;
      for (let y = horizonY; y < h; y += 38) {
        const progress = (y + laneOffset - horizonY) / (h - horizonY);
        if (progress > 0 && progress < 1) {
          const cy = horizonY + Math.pow(progress, 1.4) * (h - horizonY);
          const cx = w * 0.5;
          const segLen = 14 * progress;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx, cy + segLen);
          ctx.stroke();
        }
      }

      // Feature specific overlays
      if (activeChannel.id === 'front') {
        // Zebra Crosswalk
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        for (let s = -3; s <= 3; s++) {
          const sx = w * 0.5 + s * (w * 0.06);
          ctx.fillRect(sx - 10, h * 0.65, 20, h * 0.1);
        }

        // Bounding Box
        if (showAiBoxes) {
          const bx = w * 0.43;
          const by = h * 0.52;
          const bw = 100;
          const bh = 115;

          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(bx, by, bw, bh);

          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(bx, by - 22, 180, 22);
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('PEDESTRIAN CROSSING [96%]', bx + 5, by - 7);
        }
      } else if (activeChannel.id === 'rear') {
        // Vehicle Box
        if (showAiBoxes) {
          const bx = w * 0.38;
          const by = h * 0.48;
          const bw = 160;
          const bh = 135;

          ctx.strokeStyle = '#e11d48';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(bx, by, bw, bh);

          ctx.fillStyle = '#e11d48';
          ctx.fillRect(bx, by - 22, 190, 22);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('EVASION TARGET [97%]', bx + 5, by - 7);

          // Plate Tag
          ctx.fillStyle = '#000000';
          ctx.fillRect(bx + 20, by + 65, 120, 28);
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(bx + 20, by + 65, 120, 28);
          ctx.fillStyle = '#facc15';
          ctx.font = 'bold 14px monospace';
          ctx.fillText('TN-01-AX-8732', bx + 26, by + 84);
        }
      } else if (activeChannel.id === 'curbside') {
        // Open Manhole
        const mx = w * 0.35;
        const my = h * 0.65;
        const mw = 130;
        const mh = 65;

        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.ellipse(mx + mw / 2, my + mh / 2, mw / 2, mh / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 3;
        ctx.stroke();

        if (showAiBoxes) {
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(mx, my - 22, 180, 22);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('OPEN MANHOLE VOID [94%]', mx + 5, my - 7);
        }
      } else if (activeChannel.id === 'lane') {
        if (showAiBoxes) {
          const bx = w * 0.50;
          const by = h * 0.50;
          const bw = 160;
          const bh = 115;

          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(bx, by, bw, bh);

          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(bx, by - 22, 175, 22);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('BUS LANE VIOLATION [98%]', bx + 5, by - 7);
        }
      }

      // Privacy Badge Stamp
      if (showPrivacyBlur) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fillRect(w - 205, 12, 195, 22);
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('DPDP ACT 2023 PRIVACY MASKED', w - 195, 27);
      }

      animFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [isPlaying, activeChannelId, showAiBoxes, showPrivacyBlur]);

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

          {/* Screen / Canvas */}
          <div className="relative aspect-video max-h-[440px] w-full bg-black flex items-center justify-center">
            {useDeviceWebcam ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
            ) : (
              <canvas 
                ref={canvasRef} 
                width={880} 
                height={460} 
                className="w-full h-full object-contain bg-slate-950"
              />
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
