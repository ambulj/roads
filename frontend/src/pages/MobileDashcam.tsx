import React, { useState, useEffect, useRef } from 'react';
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
  Compass
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
  label: string;
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
    bboxStyle: string;
    hudColor: string;
    incidentType: string;
    defectType?: string;
    speedKmh?: number;
    plateNumber?: string;
    zoneType?: 'school_crossing' | 'hit_and_run' | 'pothole_depth' | 'waterlog';
  };
}

export interface FleetBusRig {
  id: string;
  routeCode: string;
  routeCorridor: string;
  vehicleType: string;
  npuHardware: string;
  cameras: BusMountedCamera[];
}

const FLEET_BUS_RIGS: FleetBusRig[] = [
  {
    id: 'BUS-TN01-1042',
    routeCode: 'MTC-118A',
    routeCorridor: 'Avvai Shanmugam Salai & Anna Salai Link',
    vehicleType: 'Tata Ultra EV 12M Transit Bus',
    npuHardware: 'NVIDIA Jetson AGX Orin 64GB (275 TOPS)',
    cameras: [
      {
        position: 'front_road',
        label: 'Front 4K Vision Zero & Crosswalk Camera',
        lensModel: 'Sony IMX490 Automotive HDR Sensor (F/1.6)',
        resolution: '3840x2160 (4K UHD)',
        fps: 30,
        fov: '120° Wide Horizontal',
        feedPreviewUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&auto=format&fit=crop&q=80',
        primaryRole: 'Zebra Crossing, School Children & Pedestrian Safety',
        detectedOverlay: {
          label: 'SCHOOL CHILDREN CROSSING (VISION ZERO)',
          confidence: 96.8,
          subtext: '3 Students Detected • Zone-Overlap 88% • Mandatory Yield',
          bboxStyle: 'border-amber-500 bg-amber-500/15 text-amber-300',
          hudColor: 'amber',
          incidentType: 'SCHOOL_CHILDREN_CROSSING_RISK',
          zoneType: 'school_crossing',
          speedKmh: 22.4
        }
      },
      {
        position: 'rear_anpr',
        label: 'Rear Dragnet ANPR & Hit-and-Run Intercept Radar',
        lensModel: 'Basler Ace 2 Pro GigE Global Shutter',
        resolution: '1920x1080 (Global Shutter)',
        fps: 60,
        fov: '85° Telephoto ANPR',
        feedPreviewUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&auto=format&fit=crop&q=80',
        primaryRole: 'Behavioral Trajectory Tracking & Hit & Run Evasion Dragnet',
        detectedOverlay: {
          label: 'HIT & RUN EVASION TRAJECTORY (CRITICAL)',
          confidence: 97.4,
          subtext: 'Plate TN-01-AX-8732 • Accel Spike +36.4 km/h • 112 Intercept',
          bboxStyle: 'border-rose-600 bg-rose-600/20 text-rose-300',
          hudColor: 'rose',
          incidentType: 'HIT_AND_RUN',
          zoneType: 'hit_and_run',
          plateNumber: 'TN-01-AX-8732',
          speedKmh: 78.4
        }
      },
      {
        position: 'curb_pedestrian',
        label: 'Curb-Side Pedestrian & Drain Inspection Camera',
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
          bboxStyle: 'border-red-600 bg-red-600/15 text-red-300',
          hudColor: 'red',
          incidentType: 'OPEN_MANHOLE'
        }
      },
      {
        position: 'street_lane',
        label: 'Street-Side Dedicated Bus Lane Camera',
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
          bboxStyle: 'border-blue-500 bg-blue-500/15 text-blue-300',
          hudColor: 'blue',
          incidentType: 'BUS_LANE_ENCROACH',
          plateNumber: 'TN-09-BK-4012'
        }
      }
    ]
  },
  {
    id: 'BUS-TN02-3891',
    routeCode: 'MTC-570X',
    routeCorridor: 'Old Mahabalipuram Road (OMR IT Expressway)',
    vehicleType: 'Ashok Leyland Switch EiV12 Electric',
    npuHardware: 'Hailo-8 Dual AI Accelerators (52 TOPS)',
    cameras: [
      {
        position: 'front_road',
        label: 'Front 4K Road Surface Camera',
        lensModel: 'Sony IMX490 Automotive HDR Sensor (F/1.6)',
        resolution: '3840x2160 (4K UHD)',
        fps: 30,
        fov: '120° Wide Horizontal',
        feedPreviewUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1200&auto=format&fit=crop&q=80',
        primaryRole: 'Road Geometry, Alligator Cracks & Rutting',
        detectedOverlay: {
          label: 'POTHOLE D40 CAVITY',
          confidence: 96.4,
          subtext: 'Depth: 8.4cm • IRC:SP:20 3D Mesh • Cost: ₹3,450',
          bboxStyle: 'border-rose-500 bg-rose-500/10 text-rose-300',
          hudColor: 'rose',
          incidentType: 'POTHOLE_D40',
          defectType: 'D40'
        }
      },
      {
        position: 'rear_anpr',
        label: 'Rear ANPR Dragnet Camera',
        lensModel: 'Basler Ace 2 Pro GigE Global Shutter',
        resolution: '1920x1080 (Global Shutter)',
        fps: 60,
        fov: '85° Telephoto ANPR',
        feedPreviewUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&auto=format&fit=crop&q=80',
        primaryRole: 'High-Speed Reckless Driving Tracking',
        detectedOverlay: {
          label: 'RASH DRIVING ALERT',
          confidence: 97.2,
          subtext: 'Speed: 88.0 km/h • 112 PCR Alerted',
          bboxStyle: 'border-rose-500 bg-rose-500/15 text-rose-300',
          hudColor: 'rose',
          incidentType: 'RASH_DRIVING',
          speedKmh: 88.0
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
  const { success: showSuccessToast } = useToast();

  const [activeBusRig, setActiveBusRig] = useState<FleetBusRig>(FLEET_BUS_RIGS[0]);
  const [activeCameraPosition, setActiveCameraPosition] = useState<CameraMountPosition>('front_road');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [hudOverlayActive, setHudOverlayActive] = useState<boolean>(true);
  const [privacyBlurActive, setPrivacyBlurActive] = useState<boolean>(true);
  const [showTelemetryHUD, setShowTelemetryHUD] = useState<boolean>(true);
  const [activeMode, setActiveMode] = useState<'live_bus_rig' | 'citizen_report' | 'contractor_audit'>('live_bus_rig');
  
  // Interactive HUD layers
  const [showPedestrianZoneHUD, setShowPedestrianZoneHUD] = useState<boolean>(true);
  const [showHitRunVectorHUD, setShowHitRunVectorHUD] = useState<boolean>(true);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Active camera selection
  const activeCamera = activeBusRig.cameras.find(c => c.position === activeCameraPosition) || activeBusRig.cameras[0];

  const handleSimulateIncidentTrigger = (customOverlay?: any) => {
    const ov = customOverlay || activeCamera.detectedOverlay;
    showSuccessToast('Edge Event Triggered', `[${activeCamera.label}] Logged ${ov.label} with ${ov.confidence}% confidence.`);

    if (ov.defectType) {
      onSendIngest({
        bus_id: activeBusRig.id,
        defect_type: ov.defectType,
        lat: 12.9516,
        lng: 80.1462,
        vertical_g_force: activeCamera.position === 'front_road' ? 1.48 : 0.98,
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
        target_speed_kmh: ov.speedKmh,
        fine_amount_inr: ov.incidentType === 'HIT_AND_RUN' ? 10000 : (ov.incidentType === 'SCHOOL_CHILDREN_CROSSING_RISK' ? 2000 : 1500),
        mva_section: ov.incidentType === 'HIT_AND_RUN' ? 'MVA 1988 Sec 134(a)(b)' : 'IRC:35 & CMVR Rule 138'
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none">
      <div className="p-4 md:p-6 lg:p-7 space-y-5 max-w-[1700px] mx-auto w-full">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBackToDashboard}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer shadow-xs"
              title="Back to Command Center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Fleet 360° Edge Vision &amp; Live Stream HUD
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-mono font-bold">
                  MULTI-CAM RIG
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time video inference HUD for pedestrian crossings, hit-and-run tracking, and surface distress.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsUploadModalOpen(true)}
              icon={<UploadCloud className="w-4 h-4" />}
            >
              Demonstration Scenario Pack
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsExportModalOpen(true)}
              icon={<Download className="w-4 h-4" />}
            >
              Export Dossier
            </Button>
          </div>
        </div>

        {/* 1. CAMERA SELECTION CHANNEL BAR */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar p-0.5">
            {activeBusRig.cameras.map((cam) => {
              const isActive = cam.position === activeCameraPosition;
              return (
                <button
                  key={cam.position}
                  onClick={() => setActiveCameraPosition(cam.position)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>{cam.label}</span>
                  <span className={`text-[11px] px-2 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {cam.fps} FPS
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHudOverlayActive(!hudOverlayActive)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                hudOverlayActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>HUD Overlays: {hudOverlayActive ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setPrivacyBlurActive(!privacyBlurActive)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                privacyBlurActive
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DPDP Privacy: {privacyBlurActive ? 'ACTIVE' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* 2. MAIN LIVE STREAM VIEWPORT & HUD STAGE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Main Video Viewport (2 Cols) */}
          <div className="lg:col-span-2 relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black min-h-[460px] flex items-center justify-center shadow-md">
            
            {/* Background Stream Video / Image */}
            <img
              src={activeCamera.feedPreviewUrl}
              alt="Feed Preview"
              className="w-full h-full object-cover min-h-[460px]"
            />

            {/* Top Optical HUD Ribbon */}
            <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between text-xs font-mono text-white pointer-events-none">
              <div className="flex items-center gap-2 bg-black/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/20">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="font-bold text-emerald-400">LIVE FEED &bull; {activeCamera.resolution}</span>
                <span className="text-slate-400">&bull; {activeBusRig.id} ({activeBusRig.routeCode})</span>
              </div>

              <div className="flex items-center gap-2 bg-black/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/20">
                <span>SPEED: <b className="text-amber-400">{activeCamera.detectedOverlay.speedKmh || 32.0} km/h</b></span>
                <span className="text-slate-400">&bull; 0.98g Shock</span>
              </div>
            </div>

            {/* DPDP Act 2023 Face Redaction Badge */}
            {privacyBlurActive && (
              <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-[11px] text-emerald-300 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>DPDP ACT 2023 &bull; OPTICAL PRIVACY REDACTION ACTIVE</span>
              </div>
            )}

            {/* DYNAMIC HUD OVERLAYS */}
            {hudOverlayActive && (
              <>
                {/* 1. School Children & Pedestrian Crosswalk Overlay (Front Camera) */}
                {activeCamera.position === 'front_road' && showPedestrianZoneHUD && (
                  <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center p-8">
                    {/* Crosswalk Green Polygon */}
                    <div className="absolute bottom-12 w-3/4 h-36 rounded-xl border-2 border-emerald-400/80 bg-emerald-500/10 backdrop-blur-[1px] flex flex-col justify-between p-2.5 animate-pulse">
                      <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300 font-bold bg-black/60 px-2 py-0.5 rounded w-fit">
                        <span>IRC:35 PEDESTRIAN CROSSING ZONE (COMPLIANT)</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 text-right">AREA IOA: 88.5% &bull; SPEED LIMIT 20 KM/H</span>
                    </div>

                    {/* Pedestrian / School Children Bounding Boxes */}
                    <div className="absolute bottom-24 left-1/3 border-2 border-amber-400 bg-amber-500/20 px-4 py-2 rounded-lg text-amber-200 text-xs font-mono font-bold flex flex-col items-start gap-1 shadow-lg animate-bounce">
                      <div className="flex items-center gap-1.5 bg-amber-950/90 text-amber-300 px-2 py-0.5 rounded text-[11px]">
                        <School className="w-3.5 h-3.5" />
                        <span>SCHOOL CHILDREN CROSSING (3 STUDENTS)</span>
                      </div>
                      <span className="text-[10.5px] text-white">YIELD MANDATE &bull; PROXIMITY: 18m</span>
                    </div>
                  </div>
                )}

                {/* 2. Hit-and-Run Dragnet Radar Overlay (Rear Camera) */}
                {activeCamera.position === 'rear_anpr' && showHitRunVectorHUD && (
                  <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center p-8">
                    {/* Vehicle Target Box */}
                    <div className="border-2 border-rose-500 bg-rose-500/15 p-4 rounded-xl shadow-2xl flex flex-col items-center gap-2 animate-pulse">
                      <div className="flex items-center gap-2 bg-rose-950/90 border border-rose-500 text-rose-200 px-3 py-1 rounded-lg text-xs font-mono font-bold">
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        <span>FLEEING VEHICLE BEHAVIORAL SIGNATURE</span>
                      </div>

                      {/* License Plate HUD Card */}
                      <div className="border-2 border-yellow-400 bg-black/95 px-5 py-2 rounded-lg font-mono font-black text-xl text-yellow-300 tracking-widest">
                        TN-01-AX-8732
                      </div>

                      <div className="text-[11px] font-mono bg-black/80 px-2.5 py-0.5 rounded text-white flex items-center gap-2">
                        <span>CLOCK SPEED: <b className="text-rose-400">78.4 km/h</b></span>
                        <span className="text-amber-400">&Delta;v: +36.4 km/h (Spike)</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Viewport Control Bar */}
            <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSimulateIncidentTrigger()}
                icon={<Sparkles className="w-4 h-4" />}
              >
                Log Edge Detection to Pipeline
              </Button>
            </div>
          </div>

          {/* Right Inspection & Telemetry Panel (1 Col) */}
          <div className="space-y-4">
            
            {/* Active Perception Summary Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Active Channel Perception
                </span>
                <Badge variant="info" size="sm">
                  {Math.round(activeCamera.detectedOverlay.confidence)}% Confidence
                </Badge>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                  {activeCamera.detectedOverlay.label}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                  {activeCamera.detectedOverlay.subtext}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mount Sensor:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{activeCamera.lensModel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Corridor Road:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{activeBusRig.routeCorridor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">NPU Compute:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">{activeBusRig.npuHardware}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSimulateIncidentTrigger()}
                className="w-full"
                icon={<Send className="w-4 h-4" />}
              >
                Trigger &amp; Ingest into Live DB
              </Button>
            </div>

            {/* Quick Demonstration Scenario Triggers */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Quick Scenario Selectors:
              </span>

              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    setActiveCameraPosition('front_road');
                    setShowPedestrianZoneHUD(true);
                  }}
                  className="w-full p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/40 hover:border-amber-400 text-left transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <School className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">School Children Crossing</div>
                      <div className="text-[10.5px] text-slate-500">D.A.V. Senior Secondary Zone</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    setActiveCameraPosition('rear_anpr');
                    setShowHitRunVectorHUD(true);
                  }}
                  className="w-full p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/40 hover:border-rose-400 text-left transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">Hit &amp; Run Evasion Trajectory</div>
                      <div className="text-[10.5px] text-slate-500">ANPR OCR + Speed Acceleration</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => setActiveCameraPosition('curb_pedestrian')}
                  className="w-full p-2.5 rounded-xl border border-cyan-200 dark:border-cyan-900/60 bg-cyan-50/50 dark:bg-cyan-950/40 hover:border-cyan-400 text-left transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <Droplets className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">Open Manhole &amp; Waterlog</div>
                      <div className="text-[10.5px] text-slate-500">Emergency Barricade &amp; Pump</div>
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
