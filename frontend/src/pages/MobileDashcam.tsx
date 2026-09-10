import React, { useState, useRef } from 'react';
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
  Cpu
} from 'lucide-react';
import { HazardCluster, WorkOrderStatus, DefectCode } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import { StreamModelConfigModal } from '../components/modals/StreamModelConfigModal';
import { DocumentExportModal } from '../components/modals/DocumentExportModal';
import { RotateCcw, Pause, Play, Download, Printer } from 'lucide-react';

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
    routeCorridor: 'GST Road, Tambaram (NH-32)',
    vehicleType: 'Tata Ultra EV 12M Transit Bus',
    npuHardware: 'NVIDIA Jetson AGX Orin 64GB (275 TOPS)',
    cameras: [
      {
        position: 'front_road',
        label: 'Front 4K Road Surface Camera',
        lensModel: 'Sony IMX490 Automotive HDR Sensor (F/1.6)',
        resolution: '3840x2160 (4K UHD)',
        fps: 30,
        fov: '120° Wide Horizontal',
        feedPreviewUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1200&auto=format&fit=crop&q=80',
        primaryRole: 'Road Geometry, Pothole Cavity & Water Disparity',
        detectedOverlay: {
          label: 'POTHOLE D40 CAVITY',
          confidence: 96.4,
          subtext: 'Depth: 8.4cm • Shock: +1.48g',
          bboxStyle: 'border-rose-500 bg-rose-500/10 text-rose-300',
          hudColor: 'rose',
          incidentType: 'POTHOLE_D40',
          defectType: 'D40'
        }
      },
      {
        position: 'curb_pedestrian',
        label: 'Curb-Side Pedestrian & Drain Camera',
        lensModel: 'Sony Starvis II 1080p Low-Light Optical',
        resolution: '1920x1080 (Full HD)',
        fps: 30,
        fov: '95° Curb Directed',
        feedPreviewUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&auto=format&fit=crop&q=80',
        primaryRole: 'Zebra Crossing, Open Manholes & Footpath Obstructions',
        detectedOverlay: {
          label: 'OPEN MANHOLE VOID',
          confidence: 94.2,
          subtext: '650mm Dia Void • Ward Barricade Req',
          bboxStyle: 'border-red-600 bg-red-600/15 text-red-300',
          hudColor: 'red',
          incidentType: 'OPEN_MANHOLE'
        }
      },
      {
        position: 'street_lane',
        label: 'Street-Side Bus Lane & Traffic Camera',
        lensModel: 'Allied Vision Alvium 1800 C-500 Sensor',
        resolution: '1920x1080 (Full HD)',
        fps: 60,
        fov: '110° Lateral Traffic',
        feedPreviewUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=80',
        primaryRole: 'Bus Lane Encroachments & Reckless Overtakes',
        detectedOverlay: {
          label: 'BUS LANE VIOLATION (MVA 115)',
          confidence: 98.1,
          subtext: 'TN-09-BK-4012 • ₹1,500 Fine',
          bboxStyle: 'border-amber-500 bg-amber-500/15 text-amber-300',
          hudColor: 'amber',
          incidentType: 'BUS_LANE_ENCROACH'
        }
      },
      {
        position: 'rear_anpr',
        label: 'Rear High-Speed ANPR & Tailgate Camera',
        lensModel: 'Basler Ace 2 Pro GigE Global Shutter',
        resolution: '1920x1080 (Global Shutter)',
        fps: 60,
        fov: '85° Telephoto ANPR',
        feedPreviewUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&auto=format&fit=crop&q=80',
        primaryRole: 'Tailgating, Hit & Run Escape Plate Tracking',
        detectedOverlay: {
          label: 'SPEEDING TAILGATER (ANPR)',
          confidence: 99.4,
          subtext: 'TN-01-XX-9901 • Speed: 84 km/h',
          bboxStyle: 'border-purple-500 bg-purple-500/15 text-purple-300',
          hudColor: 'purple',
          incidentType: 'HIT_AND_RUN'
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
          label: 'ALLIGATOR CRACK D20',
          confidence: 92.5,
          subtext: 'Area: 0.28m² • IRC:SP:20 Slurry Seal',
          bboxStyle: 'border-amber-500 bg-amber-500/10 text-amber-300',
          hudColor: 'amber',
          incidentType: 'D20',
          defectType: 'D20'
        }
      },
      {
        position: 'street_lane',
        label: 'Street-Side Bus Lane Camera',
        lensModel: 'Allied Vision Alvium 1800 C-500 Sensor',
        resolution: '1920x1080 (Full HD)',
        fps: 60,
        fov: '110° Lateral Traffic',
        feedPreviewUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=80',
        primaryRole: 'Bus Priority Lane Enforcement',
        detectedOverlay: {
          label: 'BUS LANE VIOLATION',
          confidence: 95.8,
          subtext: 'Commercial SUV • Plate TN-02-BA-4412',
          bboxStyle: 'border-blue-500 bg-blue-500/15 text-blue-300',
          hudColor: 'blue',
          incidentType: 'BUS_LANE_ENCROACH'
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
          subtext: 'Speed: 88 km/h • 112 PCR Alerted',
          bboxStyle: 'border-rose-500 bg-rose-500/15 text-rose-300',
          hudColor: 'rose',
          incidentType: 'RASH_DRIVING'
        }
      }
    ]
  },
  {
    id: 'BUS-TN01-2098',
    routeCode: 'MTC-29C',
    routeCorridor: 'Anna Salai (Mount Road) CBD',
    vehicleType: 'Eicher Skyline Pro EV City Bus',
    npuHardware: 'Intel OpenVINO Movidius Myriad X Rig',
    cameras: [
      {
        position: 'front_road',
        label: 'Front 4K Road Surface Camera',
        lensModel: 'Sony IMX490 Automotive HDR Sensor (F/1.6)',
        resolution: '3840x2160 (4K UHD)',
        fps: 30,
        fov: '120° Wide Horizontal',
        feedPreviewUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1200&auto=format&fit=crop&q=80',
        primaryRole: 'Surface Distress & Potholes',
        detectedOverlay: {
          label: 'SURFACE TRANSVERSE CRACK D10',
          confidence: 89.4,
          subtext: 'Length: 2.4m • Bitumen Sealant',
          bboxStyle: 'border-amber-500 bg-amber-500/10 text-amber-300',
          hudColor: 'amber',
          incidentType: 'D10',
          defectType: 'D10'
        }
      },
      {
        position: 'curb_pedestrian',
        label: 'Curb-Side Pedestrian & Zebra Camera',
        lensModel: 'Sony Starvis II 1080p Optical',
        resolution: '1920x1080 (Full HD)',
        fps: 30,
        fov: '95° Curb Directed',
        feedPreviewUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&auto=format&fit=crop&q=80',
        primaryRole: 'Pedestrian Zebra Crossing & Wheelchair Ramps',
        detectedOverlay: {
          label: 'ZEBRA CROSSING ENCROACHMENT',
          confidence: 96.0,
          subtext: 'Auto Rickshaw blocking ramp • MVA 177',
          bboxStyle: 'border-amber-500 bg-amber-500/15 text-amber-300',
          hudColor: 'amber',
          incidentType: 'ZEBRA_CROSSING_ENCROACHMENT'
        }
      }
    ]
  },
  {
    id: 'BUS-TN03-4410',
    routeCode: 'MTC-5A',
    routeCorridor: 'Velachery Main Road & Bypass',
    vehicleType: 'Tata Ultra Electric High-Floor',
    npuHardware: 'NVIDIA Jetson Orin Nano 8GB (40 TOPS)',
    cameras: [
      {
        position: 'front_road',
        label: 'Dual Stereo 3D Depth Camera Rig',
        lensModel: 'Intel RealSense D435i Dual Optical Stereo Sensor',
        resolution: '1920x1080 x 2 (Stereo Disparity)',
        fps: 60,
        fov: '87° x 58° Depth Field',
        feedPreviewUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=80',
        primaryRole: 'Monsoon Flood Waterlogging Depth & Basin Profiling',
        detectedOverlay: {
          label: 'WATERLOGGING BASIN (DEPTH CALIPER)',
          confidence: 96.8,
          subtext: 'Depth: 28cm • GCC Dewatering Sump Req',
          bboxStyle: 'border-cyan-500 bg-cyan-500/15 text-cyan-300',
          hudColor: 'cyan',
          incidentType: 'WATERLOGGING'
        }
      }
    ]
  },
  {
    id: 'BUS-TN02-5501',
    routeCode: 'MTC-70V',
    routeCorridor: 'Guindy Kathipara Grade Junction',
    vehicleType: 'Ashok Leyland Switch EiV12',
    npuHardware: 'NVIDIA Jetson Xavier NX (21 TOPS)',
    cameras: [
      {
        position: 'front_road',
        label: 'Front 4K Road Surface Camera',
        lensModel: 'Sony IMX490 Automotive HDR Sensor (F/1.6)',
        resolution: '3840x2160 (4K UHD)',
        fps: 30,
        fov: '120° Wide Horizontal',
        feedPreviewUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1200&auto=format&fit=crop&q=80',
        primaryRole: 'Flyover Structural Joint & Road Defects',
        detectedOverlay: {
          label: 'POTHOLE D40 GRADE JOINT',
          confidence: 94.1,
          subtext: 'Depth: 6.8cm • High Axle Shock +2.1g',
          bboxStyle: 'border-rose-500 bg-rose-500/10 text-rose-300',
          hudColor: 'rose',
          incidentType: 'POTHOLE_D40',
          defectType: 'D40'
        }
      },
      {
        position: 'street_lane',
        label: 'Street-Side Overtake Enforcement Camera',
        lensModel: 'Allied Vision Alvium 1800 C-500 Sensor',
        resolution: '1920x1080 (Full HD)',
        fps: 60,
        fov: '110° Lateral Traffic',
        feedPreviewUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&auto=format&fit=crop&q=80',
        primaryRole: 'Unsafe Grade Junction Overtakes',
        detectedOverlay: {
          label: 'UNSAFE FLYOVER OVERTAKE',
          confidence: 97.4,
          subtext: 'MVA Sec 184 • Hazardous Manoeuvre',
          bboxStyle: 'border-amber-500 bg-amber-500/15 text-amber-300',
          hudColor: 'amber',
          incidentType: 'UNSAFE_OVERTAKE'
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
  const { t, language } = useLanguage();

  // Primary active tab
  const [activeTab, setActiveTab] = useState<'citizen' | 'dashcam' | 'contractor'>('dashcam');

  // ── 360° MULTI-CAMERA BUS RIG STATE ───────────────────────────────────────
  const [selectedBusId, setSelectedBusId] = useState<string>('BUS-TN01-1042');
  const activeBusRig = FLEET_BUS_RIGS.find(b => b.id === selectedBusId) || FLEET_BUS_RIGS[0];

  const [activeCameraPos, setActiveCameraPos] = useState<CameraMountPosition>('front_road');
  
  // Ensure selected camera position is physically mounted on the selected bus
  const activeCamera = activeBusRig.cameras.find(c => c.position === activeCameraPos) || activeBusRig.cameras[0];

  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [scanShockGz, setScanShockGz] = useState<number>(0.98);
  const [lastTriggerNotice, setLastTriggerNotice] = useState<string | null>(null);
  const [isStreamConfigModalOpen, setIsStreamConfigModalOpen] = useState<boolean>(false);
  const [isDvrRewindActive, setIsDvrRewindActive] = useState<boolean>(false);
  const [dvrSeconds, setDvrSeconds] = useState<number>(0);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState<boolean>(false);
  const [snapshotDownloadedNotice, setSnapshotDownloadedNotice] = useState<string | null>(null);

  const handleExportEvidenceSnapshot = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1280, 720);

    // Draw frame simulation
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, 40, 1200, 640);

    // Draw metadata watermark
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`ROADSAARTHI FORENSIC EVIDENCE SNAPSHOT • ${activeBusRig.id}`, 60, 90);

    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Camera: ${activeCamera.label} (${activeCamera.position})`, 60, 130);
    ctx.fillText(`GPS Coordinates: 12.9516° N, 80.1462° E (GST Road Tambaram NH-32)`, 60, 160);
    ctx.fillText(`Time: ${new Date().toISOString()} • Frame: #${Math.floor(Math.random() * 8000 + 1000)}`, 60, 190);
    ctx.fillText(`Detection: ${activeCamera.detectedOverlay.label} (Conf: ${activeCamera.detectedOverlay.confidence}%)`, 60, 220);

    // Draw bounding box
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.strokeRect(340, 280, 600, 320);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(340, 240, 280, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(activeCamera.detectedOverlay.label, 350, 268);

    // Trigger download
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.download = `RoadSaarthi_Evidence_${activeBusRig.id}_${Date.now()}.jpg`;
    link.href = dataUrl;
    link.click();

    setSnapshotDownloadedNotice('✓ Forensic Evidence Snapshot Exported with GPS EXIF Watermark!');
    setTimeout(() => setSnapshotDownloadedNotice(null), 4000);
  };

  // ── CITIZEN REPORT STATE ───────────────────────────────────────────────────
  const [selectedDefect, setSelectedDefect] = useState<DefectCode>('D40');
  const [selectedRoad, setSelectedRoad] = useState<string>('GST Road, Tambaram (NH-32)');
  const [nearPOI, setNearPOI] = useState<boolean>(true);
  const [poiType, setPoiType] = useState<'hospital' | 'school'>('hospital');
  const [userNote, setUserNote] = useState<string>('Deep pothole cavity in middle lane causing severe two-wheeler skid hazard.');
  const [photoPreview, setPhotoPreview] = useState<string>(
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80'
  );
  const [submittedTicket, setSubmittedTicket] = useState<HazardCluster | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // ── YOLO INFERENCE STATE ──────────────────────────────────────────────────
  const [isYoloRunning, setIsYoloRunning] = useState<boolean>(false);
  const [yoloResult, setYoloResult] = useState<any>(null);

  // ── CONTRACTOR REPAIR UPLOAD STATE ────────────────────────────────────────
  const [contractorOrderId, setContractorOrderId] = useState<string>(clusters[0]?.id || 'cl-0001');
  const [afterRepairPhoto, setAfterRepairPhoto] = useState<string>(
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80'
  );
  const [repairNotes, setRepairNotes] = useState<string>(
    'Cavity squared to IRC:SP:20 specs, tack coat RS-1 applied, filled with cold-mix asphalt and vibratory compacted.'
  );
  const [autoCloseSuccess, setAutoCloseSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const contractorFileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleContractorPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAfterRepairPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRunYoloInference = async () => {
    if (!photoPreview) return;
    setIsYoloRunning(true);
    try {
      const res = await api.inferYolo(photoPreview, selectedRoad, 12.9516, 80.1462);
      setYoloResult(res);
      if (res?.detections?.length > 0) {
        const top = res.detections[0];
        if (top.defect_code === 'ZEBRA_CROSSING' || top.defect_code === 'FADED_CROSSING') {
          setSelectedDefect('ZEBRA_CROSSING');
        }
      }
    } catch {
      // fallback in api
    } finally {
      setIsYoloRunning(false);
    }
  };

  const handleSubmitCitizenReport = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const ticketId = `WO-00${Math.floor(10 + Math.random() * 89)}`;
      const baseRpi = selectedDefect === 'D40' ? 88.0 : selectedDefect === 'D20' ? 76.0 : 65.0;
      const boost = nearPOI ? 15 : 0;
      const finalRpi = Math.min(100.0, baseRpi + boost);

      const newCluster: HazardCluster = {
        id: `cl-${Date.now()}`,
        cluster_code: ticketId,
        defect_type: selectedDefect,
        defect_name: selectedDefect === 'D40' ? 'Pothole' : selectedDefect === 'D20' ? 'Alligator Crack' : 'Zebra Crossing',
        severity_level: finalRpi > 80 ? 'critical' : 'high',
        rpi_score: finalRpi,
        pass_count: 1,
        total_observations: 1,
        road_name: selectedRoad,
        classification: 'Major Urban Arterial',
        nearest_poi: nearPOI ? 'St. Thomas Convent School' : 'Tambaram Junction',
        poi_distance_m: nearPOI ? 45 : 320,
        assigned_agency: 'L&T Highways Infra Ltd',
        agency_phone: '+91 98401 22345',
        sla_hours: nearPOI ? 24 : 48,
        status: 'open',
        lat: 12.9516,
        lng: 80.1462,
        created_at: 'Just now',
        updated_at: 'Just now',
        before_image_url: photoPreview
      };

      onAddCluster?.(newCluster);
      setSubmittedTicket(newCluster);
      setIsSubmitting(false);
    }, 800);
  };

  const handleTriggerActiveCameraAI = () => {
    const ov = activeCamera.detectedOverlay;
    setScanShockGz(activeCamera.position === 'front_road' ? 1.48 : 0.98);
    setLastTriggerNotice(`[${activeCamera.label}] -> Logged: ${ov.label} with ${ov.confidence}% confidence!`);
    setTimeout(() => setScanShockGz(0.98), 1200);

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
        lat: 12.9516,
        lng: 80.1462,
        road_name: activeBusRig.routeCorridor,
        plate_number: activeCamera.position === 'rear_anpr' ? 'TN-01-XX-9901' : (activeCamera.position === 'street_lane' ? 'TN-09-BK-4012' : undefined),
        fine_amount_inr: activeCamera.position === 'street_lane' ? 1500 : undefined,
        mva_section: activeCamera.position === 'street_lane' ? 'MVA Sec 115/194' : undefined,
        water_depth_cm: ov.incidentType === 'WATERLOGGING' ? 28 : undefined
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar bg-[#EEF2F7] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 select-none transition-colors">
      <div className="p-5 md:p-6 lg:p-7 space-y-5 max-w-[1700px] mx-auto w-full">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBackToDashboard}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition shadow-2xs"
              title="Back to Command Center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight font-sans flex items-center gap-2">
                <span>Fleet 360° Edge AI &amp; Field Diagnostics</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold">
                  MULTI-CAM RIG
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Multi-perspective bus sensor rigs, citizen geo-tag ticketing, and contractor photo audits.
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-white dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold self-start sm:self-auto shadow-2xs">
            <button
              onClick={() => setActiveTab('dashcam')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'dashcam'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>360° Bus Rig AI</span>
            </button>

            <button
              onClick={() => setActiveTab('citizen')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'citizen'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Citizen Report</span>
            </button>

            <button
              onClick={() => setActiveTab('contractor')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'contractor'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Contractor Audit</span>
            </button>
          </div>
        </div>

        {/* ── TAB 1: 360° MULTI-CAMERA BUS RIG ──────────────────────────────── */}
        {activeTab === 'dashcam' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Bus & Hardware Selector Bar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                    Active Patrolling Vehicle:
                  </label>
                  <select
                    value={selectedBusId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setSelectedBusId(newId);
                      const rig = FLEET_BUS_RIGS.find(b => b.id === newId);
                      if (rig && rig.cameras.length > 0) {
                        setActiveCameraPos(rig.cameras[0].position);
                      }
                    }}
                    className="mt-0.5 text-sm font-bold bg-transparent border-b border-blue-500 text-slate-900 dark:text-white outline-none cursor-pointer pr-4"
                  >
                    {FLEET_BUS_RIGS.map(rig => (
                      <option key={rig.id} value={rig.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {rig.id} ({rig.routeCode}) • {rig.routeCorridor}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hardware Specs Pills */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <div className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  <span className="text-slate-400">NPU: </span>
                  <strong className="text-blue-600 dark:text-blue-400">{activeBusRig.npuHardware}</strong>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>{activeBusRig.cameras.length} Active Feeds</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStreamConfigModalOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold flex items-center gap-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition cursor-pointer"
                  title="Configure Live RTSP URLs and Custom .pt Weights"
                >
                  <Cpu className="w-3 h-3" />
                  <span>Stream &amp; Model Config</span>
                </button>
              </div>
            </div>

            {/* Dynamic Camera Mount Buttons - ONLY SHOW MOUNTED CAMERAS FOR THIS BUS */}
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider shrink-0 pr-2">
                Mounted Feeds:
              </span>
              {activeBusRig.cameras.map((cam) => {
                const isActive = activeCamera.position === cam.position;
                return (
                  <button
                    key={cam.position}
                    onClick={() => setActiveCameraPos(cam.position)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 border ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/20'
                        : 'bg-white dark:bg-[#0B101D] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{cam.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isActive ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {cam.fps} FPS
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Camera Viewport with Perspective-Specific HUD Overlay */}
            <div className="bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{activeCamera.label}</span>
                    <span className="text-xs font-mono font-normal text-slate-400">
                      ({activeCamera.lensModel})
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono text-[11px]">
                    Role: {activeCamera.primaryRole} • Resolution: {activeCamera.resolution} • FOV: {activeCamera.fov}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                    {activeCamera.fps} FPS INT8
                  </span>
                </div>
              </div>

              {/* DVR Rewind & Evidence Snapshot Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDvrRewindActive(!isDvrRewindActive);
                      if (!isDvrRewindActive) setDvrSeconds(8);
                    }}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition ${
                      isDvrRewindActive ? 'bg-purple-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isDvrRewindActive ? `Rewound -${dvrSeconds}s (DVR Active)` : 'Rewind 15s Buffer'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFrozen(!isFrozen)}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition ${
                      isFrozen ? 'bg-amber-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {isFrozen ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{isFrozen ? 'Resume Stream' : 'Freeze Frame'}</span>
                  </button>
                </div>

                {isDvrRewindActive && (
                  <div className="flex items-center gap-2 flex-1 max-w-xs px-2">
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">-15s</span>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      value={dvrSeconds}
                      onChange={(e) => setDvrSeconds(Number(e.target.value))}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">0s</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportEvidenceSnapshot}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition"
                    title="Export High-Res Evidence JPG with GPS EXIF metadata"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Snapshot</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDocModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition"
                    title="Generate Official Statutory Summons or E-Challan PDF"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Generate PDF Summons</span>
                  </button>
                </div>
              </div>

              {snapshotDownloadedNotice && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-bold font-mono">
                  {snapshotDownloadedNotice}
                </div>
              )}

              {/* Viewport Frame */}
              <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                <img
                  src={activeCamera.feedPreviewUrl}
                  alt={activeCamera.label}
                  className="w-full h-full object-cover opacity-85"
                />

                {/* Perspective Bounding Box HUD */}
                <div className={`absolute top-1/3 left-1/4 w-48 sm:w-64 h-28 sm:h-36 border-2 rounded-xl flex flex-col justify-between p-2 animate-pulse ${activeCamera.detectedOverlay.bboxStyle}`}>
                  <div className="flex items-center justify-between text-[10.5px] font-mono font-bold bg-black/80 px-2 py-1 rounded">
                    <span>{activeCamera.detectedOverlay.label}</span>
                    <span className="text-emerald-400">{activeCamera.detectedOverlay.confidence}%</span>
                  </div>
                  <div className="text-[10px] font-mono bg-black/80 px-2 py-0.5 rounded self-start">
                    {activeCamera.detectedOverlay.subtext}
                  </div>
                </div>

                {/* Top Left HUD */}
                <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-white font-mono text-xs flex items-center gap-2 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>REC ● {activeBusRig.id}</span>
                  <span className="text-slate-400">|</span>
                  <span>{activeCamera.position.toUpperCase()}</span>
                </div>

                {/* Bottom Right Telemetry */}
                <div className="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-amber-300 font-mono text-[11px] shadow-lg">
                  NAVIC 5Hz LOCK • 11 SATELLITES • 38 km/h
                </div>
              </div>

              {/* Live AI Trigger Action */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Simulate Live Detection for {activeCamera.label}:
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    Triggers {activeCamera.detectedOverlay.label} edge telemetry and dispatches to central CAD / Enforcement.
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleTriggerActiveCameraAI}
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold shrink-0"
                >
                  Trigger {activeCamera.label.split(' ')[0]} AI Detection
                </Button>
              </div>

              {lastTriggerNotice && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between font-mono animate-fadeIn">
                  <span>{lastTriggerNotice}</span>
                  <span className="font-bold text-emerald-600">DISPATCHED</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: CITIZEN REPORT ─────────────────────────────────────────── */}
        {activeTab === 'citizen' && (
          <div className="bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            {!submittedTicket ? (
              <>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Camera className="w-4 h-4 text-rose-500" />
                    <span>Citizen Geo-Tagged Road Hazard Reporting</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Upload street photo evidence; onboard YOLOv8 validates distress geometry and generates an official municipal work order.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
                      <img src={photoPreview} alt="Defect" className="w-full h-full object-cover" />
                      <input 
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-slate-900/85 text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 hover:bg-slate-800 transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Custom Photo</span>
                      </button>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRunYoloInference}
                      disabled={isYoloRunning}
                      className="w-full text-xs font-bold"
                    >
                      {isYoloRunning ? 'Analyzing Defect Mesh...' : 'Run YOLOv8 AI Validation'}
                    </Button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Defect Classification:</label>
                      <select
                        value={selectedDefect}
                        onChange={(e) => setSelectedDefect(e.target.value as DefectCode)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-200"
                      >
                        <option value="D40">Pothole / Deep Cavity (D40)</option>
                        <option value="D20">Alligator / Fatigue Crack (D20)</option>
                        <option value="D10">Transverse Crack (D10)</option>
                        <option value="WATERLOGGING">Monsoon Waterlogging Basin</option>
                        <option value="ZEBRA_CROSSING">Faded Pedestrian Crossing</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Corridor Location:</label>
                      <select
                        value={selectedRoad}
                        onChange={(e) => setSelectedRoad(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-200"
                      >
                        <option value="GST Road, Tambaram (NH-32)">GST Road, Tambaram (NH-32)</option>
                        <option value="Anna Salai (Mount Road)">Anna Salai (Mount Road)</option>
                        <option value="Old Mahabalipuram Road (OMR)">Old Mahabalipuram Road (OMR)</option>
                        <option value="Velachery Main Road">Velachery Main Road</option>
                      </select>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <div>
                          <div className="font-bold text-amber-900 dark:text-amber-200">Near Hospital / School (+15 Priority)</div>
                          <div className="text-[10.5px] text-amber-700 dark:text-amber-300">Triggers statutory 24-hour SLA turnaround.</div>
                        </div>
                      </div>
                      <input 
                        type="checkbox"
                        checked={nearPOI}
                        onChange={(e) => setNearPOI(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                      />
                    </div>

                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleSubmitCitizenReport}
                      disabled={isSubmitting}
                      className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold"
                    >
                      {isSubmitting ? 'Generating Work Order...' : 'Submit Defect with Photo Evidence'}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-100">
                    Work Order {submittedTicket.cluster_code} Successfully Created!
                  </h4>
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  Assigned to <strong>{submittedTicket.assigned_agency}</strong> under {submittedTicket.sla_hours}h SLA. Photo evidence verified with GPS tag.
                </p>
                <Button variant="outline" size="sm" onClick={() => setSubmittedTicket(null)}>
                  Report Another Issue
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: CONTRACTOR REPAIR UPLOAD & AUDIT ───────────────────────── */}
        {activeTab === 'contractor' && (
          <div className="bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <span>Contractor Proof-of-Repair &amp; Auto-Close Upload</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Contractors upload post-repair compaction photos to unlock Escrow payments under IRC:SP:20.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
                  <img src={afterRepairPhoto} alt="After Repair" className="w-full h-full object-cover" />
                  <input 
                    ref={contractorFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleContractorPhotoUpload}
                    className="hidden"
                  />
                  <button 
                    onClick={() => contractorFileInputRef.current?.click()}
                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-slate-900/85 text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 hover:bg-slate-800 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload After-Repair Photo</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Select Work Order Ticket:</label>
                  <select
                    value={contractorOrderId}
                    onChange={(e) => setContractorOrderId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-200"
                  >
                    {clusters.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.cluster_code || c.id} • {c.defect_name} ({c.road_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Field Compaction Notes:</label>
                  <textarea
                    value={repairNotes}
                    onChange={(e) => setRepairNotes(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    onUpdateWorkOrder?.(contractorOrderId, 'verified_closed', undefined, afterRepairPhoto, repairNotes);
                    setAutoCloseSuccess(true);
                    setTimeout(() => setAutoCloseSuccess(false), 4000);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Submit Proof-of-Repair &amp; Claim Escrow
                </Button>

                {autoCloseSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold font-mono">
                    ✓ Repair proof submitted! Work order marked Verified Closed.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Real-time Stream & Custom Model Configuration Modal */}
        <DocumentExportModal
          isOpen={isDocModalOpen}
          onClose={() => setIsDocModalOpen(false)}
          documentType={activeCamera.position === 'rear_anpr' ? 'POLICE_ECHALLAN' : 'CONTRACTOR_SUMMONS'}
        />
        <StreamModelConfigModal
          isOpen={isStreamConfigModalOpen}
          onClose={() => setIsStreamConfigModalOpen(false)}
        />
      </div>
    </div>
  );
};
