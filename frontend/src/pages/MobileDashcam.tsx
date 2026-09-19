import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, 
  Upload, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Bus, 
  Wrench, 
  ArrowLeft, 
  Check, 
  Sparkles,
  RefreshCw,
  Send, 
  Sliders, 
  ChevronRight, 
  Eye, 
  Layers, 
  Radio, 
  Maximize2, 
  Video, 
  Cpu, 
  UploadCloud,
  School,
  Droplets,
  RotateCcw,
  Pause,
  Play,
  Download,
  Printer,
  Compass,
  Zap,
  Grid,
  Square,
  Activity,
  SlidersHorizontal,
  HardDrive,
  Gauge,
  FileText,
  Volume2,
  VolumeX,
  Crosshair,
  Shield,
  Disc
} from 'lucide-react';
import { HazardCluster, WorkOrderStatus, DefectCode } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import { UploadFootageModal } from '../components/modals/UploadFootageModal';
import { DocumentExportModal } from '../components/modals/DocumentExportModal';
import { StreamModelConfigModal } from '../components/modals/StreamModelConfigModal';

interface MobileDashcamProps {
  clusters?: HazardCluster[];
  onBackToDashboard: () => void;
  onSendIngest: (payload: any) => void;
  onSendIncident?: (payload: any) => void;
  onUpdateWorkOrder?: (orderId: string, newStatus: WorkOrderStatus, beforeImg?: string, afterImg?: string, notes?: string) => void;
  onAddCluster?: (newCluster: HazardCluster) => void;
}

export type CameraMountPosition = 'front_road' | 'curb_pedestrian' | 'street_lane' | 'rear_anpr';

export interface BusMountedCamera {
  position: CameraMountPosition;
  channelNum: number;
  label: string;
  shortTag: string;
  lensModel: string;
  resolution: string;
  fps: number;
  fov: string;
  feedPreviewUrl: string;
  primaryRole: string;
  detectedOverlay: {
    label: string;
    confidence: number;
    subtext: string;
    hudColor: string;
    incidentType: string;
    defectType?: string;
    speedKmh?: number;
    plateNumber?: string;
    zoneType?: 'school_crossing' | 'hit_and_run' | 'pothole_depth' | 'waterlog' | 'open_manhole' | 'bus_lane';
  };
}

export interface FleetBusRig {
  id: string;
  routeCode: string;
  routeCorridor: string;
  vehicleType: string;
  npuHardware: string;
  edgeTops: number;
  powerWatts: number;
  cameras: BusMountedCamera[];
}

const FLEET_BUS_RIGS: FleetBusRig[] = [
  {
    id: 'BUS-TN01-1042',
    routeCode: 'MTC-118A',
    routeCorridor: 'Avvai Shanmugam Salai & Anna Salai Link',
    vehicleType: 'Tata Ultra EV 12M Transit Bus',
    npuHardware: 'NVIDIA Jetson AGX Orin 64GB',
    edgeTops: 275,
    powerWatts: 24.5,
    cameras: [
      {
        position: 'front_road',
        channelNum: 1,
        label: 'Front 4K Windshield Vision Zero & Road Mesh Camera',
        shortTag: 'CH 1 • FRONT 4K',
        lensModel: 'Sony IMX490 Automotive HDR (F/1.6)',
        resolution: '3840x2160 (4K UHD)',
        fps: 30,
        fov: '120° Wide Horizontal',
        feedPreviewUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&auto=format&fit=crop&q=80',
        primaryRole: 'Zebra Crossing, School Children & Pedestrian Safety',
        detectedOverlay: {
          label: 'SCHOOL CHILDREN CROSSING (VISION ZERO)',
          confidence: 96.8,
          subtext: '3 Students Detected • Zone-Overlap 88% • Mandatory Yield',
          hudColor: '#f59e0b',
          incidentType: 'SCHOOL_CHILDREN_CROSSING_RISK',
          zoneType: 'school_crossing',
          speedKmh: 22.4
        }
      },
      {
        position: 'rear_anpr',
        channelNum: 2,
        label: 'Rear Dragnet ANPR & Hit-and-Run Intercept Radar',
        shortTag: 'CH 2 • REAR ANPR',
        lensModel: 'Basler Ace 2 Pro GigE Global Shutter',
        resolution: '1920x1080 (Global Shutter)',
        fps: 60,
        fov: '85° Telephoto ANPR',
        feedPreviewUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&auto=format&fit=crop&q=80',
        primaryRole: 'Behavioral Trajectory Tracking & Hit & Run Dragnet',
        detectedOverlay: {
          label: 'HIT & RUN EVASION TRAJECTORY (CRITICAL)',
          confidence: 97.4,
          subtext: 'Plate TN-01-AX-8732 • Accel Spike +36.4 km/h • 112 Intercept',
          hudColor: '#e11d48',
          incidentType: 'HIT_AND_RUN',
          zoneType: 'hit_and_run',
          plateNumber: 'TN-01-AX-8732',
          speedKmh: 78.4
        }
      },
      {
        position: 'curb_pedestrian',
        channelNum: 3,
        label: 'Left Curbside Pedestrian & Drain Inspection Camera',
        shortTag: 'CH 3 • CURBSIDE DRAIN',
        lensModel: 'Sony Starvis II 1080p Low-Light Optical',
        resolution: '1920x1080 (Full HD)',
        fps: 30,
        fov: '95° Curb Directed',
        feedPreviewUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1200&auto=format&fit=crop&q=80',
        primaryRole: 'Open Manholes, Footpath Distress & Cavity Scans',
        detectedOverlay: {
          label: 'OPEN MANHOLE VOID (P0 HAZARD)',
          confidence: 94.2,
          subtext: '650mm Dia Open Drain • Zone 5 Barricade Squad Alerted',
          hudColor: '#dc2626',
          incidentType: 'OPEN_MANHOLE',
          defectType: 'OPEN_MANHOLE',
          zoneType: 'open_manhole'
        }
      },
      {
        position: 'street_lane',
        channelNum: 4,
        label: 'Right Street-Side Dedicated BRTS Corridor Camera',
        shortTag: 'CH 4 • BRTS LANE',
        lensModel: 'Allied Vision Alvium 1800 C-500 Sensor',
        resolution: '1920x1080 (Full HD)',
        fps: 60,
        fov: '110° Lateral Traffic',
        feedPreviewUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=80',
        primaryRole: 'BRTS Corridor Encroachments & Unsafe Overtakes',
        detectedOverlay: {
          label: 'BUS LANE ENCROACHMENT (MVA 177)',
          confidence: 98.1,
          subtext: 'Commercial SUV • Plate TN-09-BK-4012 • ₹2,000 Fine',
          hudColor: '#3b82f6',
          incidentType: 'BUS_LANE_ENCROACH',
          plateNumber: 'TN-09-BK-4012',
          zoneType: 'bus_lane'
        }
      }
    ]
  },
  {
    id: 'BUS-TN02-3891',
    routeCode: 'MTC-570X',
    routeCorridor: 'Old Mahabalipuram Road (OMR IT Corridor)',
    vehicleType: 'Ashok Leyland Switch EiV12 Electric',
    npuHardware: 'Hailo-8 Dual AI Accelerators',
    edgeTops: 52,
    powerWatts: 14.2,
    cameras: [
      {
        position: 'front_road',
        channelNum: 1,
        label: 'Front 4K Road Surface & Pothole Profiler',
        shortTag: 'CH 1 • FRONT ROAD',
        lensModel: 'Sony IMX490 Automotive HDR (F/1.6)',
        resolution: '3840x2160 (4K UHD)',
        fps: 30,
        fov: '120° Wide Horizontal',
        feedPreviewUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1200&auto=format&fit=crop&q=80',
        primaryRole: 'Road Geometry, Alligator Cracks & Rutting',
        detectedOverlay: {
          label: 'POTHOLE D40 CAVITY (VG-30 REPAIR)',
          confidence: 96.4,
          subtext: 'Depth: 8.4cm • Vertical Shock: +1.84g • PWD Docket',
          hudColor: '#f43f5e',
          incidentType: 'POTHOLE_D40',
          defectType: 'D40',
          zoneType: 'pothole_depth',
          speedKmh: 34.0
        }
      },
      {
        position: 'rear_anpr',
        channelNum: 2,
        label: 'Rear ANPR Dragnet Camera',
        shortTag: 'CH 2 • REAR ANPR',
        lensModel: 'Basler Ace 2 Pro GigE Global Shutter',
        resolution: '1920x1080 (Global Shutter)',
        fps: 60,
        fov: '85° Telephoto ANPR',
        feedPreviewUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&auto=format&fit=crop&q=80',
        primaryRole: 'High-Speed Reckless Driving Tracking',
        detectedOverlay: {
          label: 'RASH DRIVING & TAILGATING ALERT',
          confidence: 97.2,
          subtext: 'Speed: 88.0 km/h • 112 PCR Alerted • Sec 184 MVA',
          hudColor: '#f43f5e',
          incidentType: 'RASH_DRIVING',
          zoneType: 'hit_and_run',
          speedKmh: 88.0,
          plateNumber: 'TN-02-AZ-8819'
        }
      },
      {
        position: 'curb_pedestrian',
        channelNum: 3,
        label: 'Left Curbside Monsoon Basin Sensor',
        shortTag: 'CH 3 • DRAIN & BASIN',
        lensModel: 'Sony Starvis II 1080p Low-Light Optical',
        resolution: '1920x1080 (Full HD)',
        fps: 30,
        fov: '95° Curb Directed',
        feedPreviewUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=80',
        primaryRole: 'Monsoon Flooding & Drainage Blockages',
        detectedOverlay: {
          label: 'WATERLOGGING BASIN (DEPTH 18CM)',
          confidence: 95.0,
          subtext: 'GCC Hydro-Vac & 1500 LPM Submersible Pump Requested',
          hudColor: '#06b6d4',
          incidentType: 'WATERLOGGING',
          defectType: 'WATERLOGGING',
          zoneType: 'waterlog'
        }
      },
      {
        position: 'street_lane',
        channelNum: 4,
        label: 'Right Lane Blind-Spot Camera',
        shortTag: 'CH 4 • LATERAL',
        lensModel: 'Allied Vision Alvium 1800 C-500 Sensor',
        resolution: '1920x1080 (Full HD)',
        fps: 60,
        fov: '110° Lateral Traffic',
        feedPreviewUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&auto=format&fit=crop&q=80',
        primaryRole: 'Unsafe Overtake & Cutting Detection',
        detectedOverlay: {
          label: 'UNSAFE LATERAL OVERTAKE',
          confidence: 93.8,
          subtext: 'Proximity: 0.6m • Driver Cabin Haptic Warning Triggered',
          hudColor: '#eab308',
          incidentType: 'UNSAFE_OVERTAKE',
          plateNumber: 'TN-07-CM-1104',
          speedKmh: 62.0
        }
      }
    ]
  }
];

export const MobileDashcam: React.FC<MobileDashcamProps> = ({
  clusters = [],
  onBackToDashboard,
  onSendIngest,
  onSendIncident,
  onUpdateWorkOrder,
  onAddCluster
}) => {
  const { t } = useLanguage();
  const { success: showSuccessToast, info: showInfoToast, warning: showWarningToast } = useToast();

  const [activeBusRigIndex, setActiveBusRigIndex] = useState<number>(0);
  const activeBusRig = FLEET_BUS_RIGS[activeBusRigIndex];
  
  const [activeCameraPosition, setActiveCameraPosition] = useState<CameraMountPosition>('front_road');
  const [viewMode, setViewMode] = useState<'single' | 'quad_matrix'>('single');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  
  // HUD Layer Toggles
  const [showAiBboxes, setShowAiBboxes] = useState<boolean>(true);
  const [showPrivacyBlur, setShowPrivacyBlur] = useState<boolean>(true);
  const [showTelemetryHUD, setShowTelemetryHUD] = useState<boolean>(true);
  const [showImuShockWave, setShowImuShockWave] = useState<boolean>(true);
  const [showCrosswalkZone, setShowCrosswalkZone] = useState<boolean>(true);
  
  // Hardware Diagnostics & Telemetry
  const [edgeFps, setEdgeFps] = useState<number>(30);
  const [inferenceLatencyMs, setInferenceLatencyMs] = useState<number>(14.2);
  const [npuTempC, setNpuTempC] = useState<number>(47.8);
  const [recordedPacketsCount, setRecordedPacketsCount] = useState<number>(142);
  const [isRecordingLocal, setIsRecordingLocal] = useState<boolean>(false);

  // WebRTC Device Camera Stream Mode
  const [useDeviceWebcam, setUseDeviceWebcam] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Active camera selection
  const activeCamera = activeBusRig.cameras.find(c => c.position === activeCameraPosition) || activeBusRig.cameras[0];

  // Simulated Animation Loop on Canvas
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

      // Draw simulated road background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.45);
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.45);

      // Asphalt Road
      const roadGrad = ctx.createLinearGradient(0, h * 0.45, 0, h);
      roadGrad.addColorStop(0, '#1e293b');
      roadGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, h * 0.45, w, h * 0.55);

      // Horizon line
      const horizonY = h * 0.45;

      // Perspective Road Edges
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      // Left edge
      ctx.beginPath();
      ctx.moveTo(w * 0.42, horizonY);
      ctx.lineTo(w * 0.05, h);
      ctx.stroke();

      // Right edge
      ctx.beginPath();
      ctx.moveTo(w * 0.58, horizonY);
      ctx.lineTo(w * 0.95, h);
      ctx.stroke();

      // Dashed Center Lanes (Moving)
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      const laneOffset = isPlaying ? (tick * 4) % 60 : 0;
      for (let y = horizonY; y < h; y += 40) {
        const progress = (y + laneOffset - horizonY) / (h - horizonY);
        if (progress > 0 && progress < 1) {
          const cy = horizonY + progress * (h - horizonY);
          const cx = w * 0.5;
          const segLen = 15 * progress;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx, cy + segLen);
          ctx.stroke();
        }
      }

      // Feature specific overlays based on position
      if (activeCamera.position === 'front_road') {
        // Pedestrian Crosswalk
        if (showCrosswalkZone) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(w * 0.32, h * 0.62);
          ctx.lineTo(w * 0.68, h * 0.62);
          ctx.lineTo(w * 0.78, h * 0.78);
          ctx.lineTo(w * 0.22, h * 0.78);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // White Zebra Stripes
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          for (let s = -3; s <= 3; s++) {
            const sx = w * 0.5 + s * (w * 0.06);
            ctx.fillRect(sx - 10, h * 0.65, 20, h * 0.1);
          }
        }

        // Bounding box for pedestrians / school children
        if (showAiBboxes) {
          const bx = w * 0.45;
          const by = h * 0.55;
          const bw = 90;
          const bh = 110;

          // Box
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(bx, by, bw, bh);

          // Header Tag
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(bx, by - 22, 190, 22);
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 11px monospace';
          ctx.fillText('PEDESTRIAN YIELD [96.8%]', bx + 5, by - 7);

          // Distance Tag
          ctx.fillStyle = 'rgba(0,0,0,0.75)';
          ctx.fillRect(bx, by + bh, 120, 18);
          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('DIST: 14.2m | 22 km/h', bx + 5, by + bh + 13);
        }
      } else if (activeCamera.position === 'rear_anpr') {
        // Rear Car Target
        const bx = w * 0.38;
        const by = h * 0.48;
        const bw = 160;
        const bh = 140;

        // Vehicle Box
        ctx.strokeStyle = '#e11d48';
        ctx.lineWidth = 3;
        ctx.strokeRect(bx, by, bw, bh);

        // Header
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(bx, by - 24, 210, 24);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('EVASION TARGET [97.4%]', bx + 5, by - 8);

        // Plate Box
        ctx.fillStyle = '#000000';
        ctx.fillRect(bx + 20, by + 70, 120, 32);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx + 20, by + 70, 120, 32);
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 15px monospace';
        ctx.fillText('TN-01-AX-8732', bx + 26, by + 92);

        // Speed Delta Vector
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(bx, by + bh + 4, 160, 20);
        ctx.fillStyle = '#fb7185';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('SPEED: 78.4 km/h (+36 Δv)', bx + 6, by + bh + 18);
      } else if (activeCamera.position === 'curb_pedestrian') {
        // Open Manhole Cavity
        const mx = w * 0.35;
        const my = h * 0.65;
        const mw = 130;
        const mh = 70;

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(mx + mw / 2, my + mh / 2, mw / 2, mh / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#dc2626';
        ctx.fillRect(mx, my - 22, 190, 22);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('OPEN MANHOLE VOID [94.2%]', mx + 5, my - 7);
      } else if (activeCamera.position === 'street_lane') {
        // BRTS Corridor Box
        const bx = w * 0.52;
        const by = h * 0.50;
        const bw = 170;
        const bh = 120;

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(bx, by, bw, bh);

        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(bx, by - 22, 185, 22);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('BUS LANE ENCROACH [98.1%]', bx + 5, by - 7);
      }

      // Privacy Blur Mask (DPDP Act)
      if (showPrivacyBlur) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
        // Redaction stamp on top right corner
        ctx.fillRect(w - 220, 15, 205, 24);
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('DPDP ACT 2023 PRIVACY ACTIVE', w - 210, 31);
      }

      animFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [isPlaying, activeCameraPosition, showAiBboxes, showPrivacyBlur, showCrosswalkZone]);

  // Handle Ingestion to DB / WebSockets
  const handleSimulateIncidentTrigger = (customOverlay?: any) => {
    const ov = customOverlay || activeCamera.detectedOverlay;
    showSuccessToast('Edge Event Triggered', `[${activeCamera.shortTag}] Ingested ${ov.label} with ${ov.confidence}% confidence.`);

    setRecordedPacketsCount(prev => prev + 1);

    if (ov.defectType) {
      onSendIngest({
        bus_id: activeBusRig.id,
        defect_type: ov.defectType,
        lat: 12.9516,
        lng: 80.1462,
        vertical_g_force: activeCamera.position === 'front_road' ? 1.84 : 0.98,
        confidence: ov.confidence / 100,
        captured_at: new Date().toISOString()
      });
    } else if (onSendIncident) {
      onSendIncident({
        reporting_bus_id: activeBusRig.id,
        incident_type: ov.incidentType,
        lat: 13.0450,
        lng: 80.2380,
        road_name: activeBusRig.routeCorridor,
        plate_number: ov.plateNumber || (activeCamera.position === 'rear_anpr' ? 'TN-01-AX-8732' : undefined),
        target_speed_kmh: ov.speedKmh || 45.0,
        fine_amount_inr: ov.incidentType === 'HIT_AND_RUN' ? 25000 : (ov.incidentType === 'SCHOOL_CHILDREN_CROSSING_RISK' ? 2000 : 1500),
        mva_section: ov.incidentType === 'HIT_AND_RUN' ? 'MVA 1988 Sec 134(a)(b) + BNS 106(2)' : 'IRC:35 & CMVR Rule 138'
      });
    }
  };

  // Toggle Device Camera Mode
  const toggleDeviceCamera = async () => {
    if (!useDeviceWebcam) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setUseDeviceWebcam(true);
        showSuccessToast('WebRTC Device Camera Active', 'Streaming live from local optical hardware.');
      } catch (err) {
        showWarningToast('Camera Permission Error', 'Could not access device webcam. Reverting to edge simulator.');
        setUseDeviceWebcam(false);
      }
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
      setUseDeviceWebcam(false);
      showInfoToast('Edge Simulation Restored', 'Switched back to multi-channel synthetic playback.');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar bg-[#090d16] text-slate-100 select-none">
      
      {/* ── Top Header Navigation Bar ── */}
      <div className="sticky top-0 z-40 bg-[#0b111e]/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        
        {/* Left Title & Rig Selector */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-300 transition cursor-pointer shadow-xs"
            title="Back to Command Center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
                <Video className="w-4 h-4" />
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Edge Dashcam &amp; 360° Multi-Camera Ingestion
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                NPU ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time YOLOv8 + ByteTrack edge inference, Section 63 BSA legal timestamping &amp; IMU sensor shock fusion.
            </p>
          </div>
        </div>

        {/* Right Bus Rig Selector & Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Rig Select Pill */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1 text-xs">
            <Bus className="w-3.5 h-3.5 text-blue-400 ml-2 mr-1.5" />
            <select
              value={activeBusRigIndex}
              onChange={(e) => setActiveBusRigIndex(Number(e.target.value))}
              className="bg-transparent text-slate-200 font-semibold focus:outline-hidden pr-2 cursor-pointer"
            >
              {FLEET_BUS_RIGS.map((rig, idx) => (
                <option key={rig.id} value={idx} className="bg-slate-900 text-slate-200">
                  {rig.id} ({rig.routeCode})
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle: Single Cam vs Quad Matrix */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('single')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'single' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>Single</span>
            </button>
            <button
              onClick={() => setViewMode('quad_matrix')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'quad_matrix' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Quad 360°</span>
            </button>
          </div>

          {/* WebRTC Camera Mode */}
          <button
            onClick={toggleDeviceCamera}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              useDeviceWebcam 
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300' 
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{useDeviceWebcam ? 'Device Cam Active' : 'Use Device Cam'}</span>
          </button>

          {/* Demonstration Scenario Modal */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            icon={<UploadCloud className="w-3.5 h-3.5" />}
          >
            Footage Ingest
          </Button>

          {/* Export Dossier */}
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

      <div className="p-4 sm:p-6 space-y-5 max-w-[1750px] mx-auto w-full">
        
        {/* ── 1. Channel Switcher & Stream Telemetry Ribbon ── */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-3 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Camera Channel Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
            {activeBusRig.cameras.map((cam) => {
              const isActive = cam.position === activeCameraPosition && viewMode === 'single';
              return (
                <button
                  key={cam.position}
                  onClick={() => {
                    setActiveCameraPosition(cam.position);
                    setViewMode('single');
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                    isActive
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{cam.shortTag}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {cam.fps} FPS
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick HUD Overlays Toggle Strip */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAiBboxes(!showAiBboxes)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1 ${
                showAiBboxes
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>AI BBoxes: {showAiBboxes ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setShowPrivacyBlur(!showPrivacyBlur)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1 ${
                showPrivacyBlur
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DPDP Privacy: {showPrivacyBlur ? 'MASKED' : 'RAW'}</span>
            </button>

            <button
              onClick={() => setShowCrosswalkZone(!showCrosswalkZone)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1 ${
                showCrosswalkZone
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>Vision Zero Zone</span>
            </button>
          </div>
        </div>

        {/* ── 2. Main Stage: Video Viewport & Real-Time Edge Telemetry Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Main Visual Viewport (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            
            {viewMode === 'single' ? (
              /* Single Camera Focused Viewport */
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-black min-h-[480px] flex items-center justify-center shadow-2xl">
                
                {useDeviceWebcam ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover min-h-[480px]"
                  />
                ) : (
                  <canvas 
                    ref={canvasRef} 
                    width={960} 
                    height={540} 
                    className="w-full h-full object-contain max-h-[520px] bg-slate-950"
                  />
                )}

                {/* Top Optical HUD Ribbon */}
                <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between text-xs font-mono text-white pointer-events-none">
                  <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-lg">
                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span className="font-bold text-emerald-400">{activeCamera.shortTag}</span>
                    <span className="text-slate-400">&bull; {activeCamera.resolution}</span>
                    <span className="text-slate-400">&bull; {activeBusRig.id}</span>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-lg">
                    <Compass className="w-3.5 h-3.5 text-blue-400" />
                    <span>CORRIDOR: <b className="text-amber-400">{activeBusRig.routeCode}</b></span>
                    <span className="text-slate-400">&bull; {activeCamera.detectedOverlay.speedKmh || 32.0} km/h</span>
                  </div>
                </div>

                {/* Bottom Left Corner: IMU Shock & DPDP Privacy Badges */}
                <div className="absolute bottom-3 left-3 z-30 flex flex-col gap-2 pointer-events-none">
                  {showPrivacyBlur && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500/40 text-[10px] text-emerald-300 font-mono backdrop-blur-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>DPDP ACT 2023 &bull; CITIZEN FACIAL PRIVACY MASKED</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-mono text-slate-300 backdrop-blur-xs">
                    <Activity className="w-3 h-3 text-rose-400" />
                    <span>IMU JERK: <b className="text-rose-400">{activeCamera.position === 'front_road' ? '+1.84g' : '+0.21g'}</b></span>
                    <span className="text-slate-500">|</span>
                    <span>LATENCY: <b className="text-emerald-400">{inferenceLatencyMs}ms</b></span>
                  </div>
                </div>

                {/* Bottom Right: Playback & Action Controls */}
                <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 hover:bg-slate-800 text-white cursor-pointer shadow-lg"
                    title={isPlaying ? 'Pause Playback' : 'Resume Playback'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
                  </button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSimulateIncidentTrigger()}
                    icon={<Sparkles className="w-4 h-4" />}
                  >
                    Log Edge Ingest
                  </Button>
                </div>
              </div>
            ) : (
              /* Quad 360° Multi-Camera Matrix View */
              <div className="grid grid-cols-2 gap-3 bg-black p-3 rounded-2xl border border-slate-800 shadow-2xl">
                {activeBusRig.cameras.map((cam) => (
                  <div 
                    key={cam.position}
                    onClick={() => {
                      setActiveCameraPosition(cam.position);
                      setViewMode('single');
                    }}
                    className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video group cursor-pointer hover:border-blue-500 transition"
                  >
                    <img 
                      src={cam.feedPreviewUrl} 
                      alt={cam.label}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
                    />
                    <div className="absolute top-2 left-2 bg-slate-950/90 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400">
                      {cam.shortTag}
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 bg-slate-950/90 border border-slate-800 p-1.5 rounded text-[10px] flex items-center justify-between text-slate-300">
                      <span className="font-bold text-white truncate">{cam.detectedOverlay.label}</span>
                      <span className="text-emerald-400 font-mono">{cam.fps} FPS</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Playback & Stream Timeline Bar */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Disc className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>EDGE BUFFER: 128 MB RING CACHE</span>
                </div>
                <span className="text-slate-600">|</span>
                <span>PACKETS INGESTED: <b className="text-white">{recordedPacketsCount}</b></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRecordingLocal(!isRecordingLocal)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    isRecordingLocal
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${isRecordingLocal ? 'bg-rose-500' : 'bg-slate-500'}`} />
                  <span>{isRecordingLocal ? 'Recording Stream Clip...' : 'Record Incident Clip'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Edge Diagnostics & Perception Suite (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* 1. Active Channel Perception Dossier */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Edge Perception Intel
                  </span>
                </div>
                <Badge variant="info" size="sm">
                  {Math.round(activeCamera.detectedOverlay.confidence)}% Confidence
                </Badge>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">CLASS DETECTION</span>
                  <span className="text-xs font-mono font-bold text-amber-400">{activeCamera.detectedOverlay.incidentType}</span>
                </div>
                <h3 className="font-extrabold text-sm text-white leading-snug">
                  {activeCamera.detectedOverlay.label}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {activeCamera.detectedOverlay.subtext}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Camera Sensor</div>
                  <div className="text-slate-200 font-bold truncate mt-0.5">{activeCamera.lensModel}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Field of View</div>
                  <div className="text-slate-200 font-bold mt-0.5">{activeCamera.fov}</div>
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => handleSimulateIncidentTrigger()}
                className="w-full"
                icon={<Send className="w-4 h-4" />}
              >
                Ingest to Central Command DB
              </Button>
            </div>

            {/* 2. Edge Hardware & TensorRT Benchmarks */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Edge NPU Telemetry
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  {activeBusRig.edgeTops} TOPS
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-400">SoC Compute:</span>
                  <span className="font-bold text-white">{activeBusRig.npuHardware}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-400">TensorRT Latency:</span>
                  <span className="font-bold text-emerald-400">{inferenceLatencyMs} ms / frame</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-400">NPU Core Temp:</span>
                  <span className="font-bold text-amber-400">{npuTempC} °C</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-400">Power Consumption:</span>
                  <span className="font-bold text-blue-400">{activeBusRig.powerWatts} W</span>
                </div>
              </div>
            </div>

            {/* 3. Quick Scenario Presets */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2.5">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Quick Scenario Selectors:
              </span>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setActiveCameraPosition('front_road');
                    setViewMode('single');
                    setShowCrosswalkZone(true);
                  }}
                  className="w-full p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:border-amber-500 text-left transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 text-xs">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <School className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white">School Crossing (Vision Zero)</div>
                      <div className="text-[10.5px] text-amber-300/80">D.A.V. Senior Secondary Zone</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    setActiveCameraPosition('rear_anpr');
                    setViewMode('single');
                  }}
                  className="w-full p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:border-rose-500 text-left transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 text-xs">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white">Hit &amp; Run Evasion Trajectory</div>
                      <div className="text-[10.5px] text-rose-300/80">ANPR OCR + Acceleration Spike</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    setActiveCameraPosition('curb_pedestrian');
                    setViewMode('single');
                  }}
                  className="w-full p-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:border-cyan-500 text-left transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 text-xs">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white">Open Manhole &amp; Waterlog</div>
                      <div className="text-[10.5px] text-cyan-300/80">IS:1726 Void &amp; 1500 LPM Pump</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Connections */}
        <UploadFootageModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          busId={activeBusRig.id}
          onUploadSuccess={(res) => {
            showSuccessToast('Scenario Ingested', `Ingested ${res.defectLabel} into live corridor.`);
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
