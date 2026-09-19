import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Bus,
  Layers,
  Cpu,
  ClipboardList,
  Wrench,
  ShieldCheck,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileCheck,
  Send,
  Eye,
  Camera,
  SlidersHorizontal,
  Check,
  Award,
  Box,
  MapPin,
  TrendingUp,
  Activity,
  Droplets,
  AlertOctagon
} from 'lucide-react';
import { HazardCluster, WorkOrderStatus } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export type DemoDefectType = 'D40' | 'D20' | 'OPEN_MANHOLE' | 'WATERLOGGING' | 'UNMARKED_SPEED_BREAKER' | 'ZEBRA_CROSSING';

interface DefectConfig {
  id: DemoDefectType;
  name: string;
  code: string;
  badge: string;
  color: string;
  confidence: number;
  imuShock: number;
  depthStr: string;
  volumeStr: string;
  repairMaterial: string;
  costInr: number;
  agency: string;
  docketCode: string;
  beforeImg: string;
  afterImg: string;
  beforeLabel: string;
  afterLabel: string;
  verificationPassText: string;
}

const DEFECT_CONFIGS: Record<DemoDefectType, DefectConfig> = {
  D40: {
    id: 'D40',
    name: 'Severe Pothole Cavity',
    code: 'D40',
    badge: 'Pothole (D40)',
    color: '#ef4444',
    confidence: 96.8,
    imuShock: 1.84,
    depthStr: '-6.8 cm Depth',
    volumeStr: '54.6L (126kg DBM Hot-Mix)',
    repairMaterial: 'VG-30 Hot-Mix Dense Bituminous Macadam',
    costInr: 8568,
    agency: 'L&T Urban Infra Ltd (State Highways)',
    docketCode: 'WO-2026-CHE-892',
    beforeImg: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1200&auto=format&fit=crop&q=80',
    afterImg: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&auto=format&fit=crop&q=80',
    beforeLabel: 'BEFORE: 6.8cm Cavity Skid Hazard',
    afterLabel: 'AFTER: VG-30 Hot-Mix Bitumen Infill',
    verificationPassText: 'Gz = 0.96g nominal baseline vibration & 0% cavity confirmed.',
  },
  D20: {
    id: 'D20',
    name: 'Alligator Surface Fatigue Crack',
    code: 'D20',
    badge: 'Cracks (D20)',
    color: '#f59e0b',
    confidence: 94.2,
    imuShock: 1.28,
    depthStr: '-3.2 cm Fissure',
    volumeStr: '18.4L (42kg Slurry Seal)',
    repairMaterial: 'IRC:SP:20 Polymer-Modified Micro-Surfacing',
    costInr: 2840,
    agency: 'Apex Urban Infra Ltd',
    docketCode: 'WO-2026-CHE-441',
    beforeImg: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=80',
    afterImg: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&auto=format&fit=crop&q=80',
    beforeLabel: 'BEFORE: Severe Alligator Webbing',
    afterLabel: 'AFTER: Polymer Slurry Seal Coating',
    verificationPassText: 'Crack index = 0.00 / 100 per IRC:SP:20 optical verification.',
  },
  OPEN_MANHOLE: {
    id: 'OPEN_MANHOLE',
    name: 'Open Sewer Manhole Rim Drop',
    code: 'IS:1726',
    badge: 'Open Manhole',
    color: '#dc2626',
    confidence: 98.4,
    imuShock: 2.15,
    depthStr: '-18.0 cm Void Drop',
    volumeStr: 'Heavy-Duty Ductile Iron Cover (Class D400)',
    repairMaterial: 'IS:1726 Grade D400 Hinged Manhole Cover & Frame',
    costInr: 4500,
    agency: 'Chennai Metro Water & Sewerage Board (CMWSSB)',
    docketCode: 'EMERGENCY-JAL-7712',
    beforeImg: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&auto=format&fit=crop&q=80',
    afterImg: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&auto=format&fit=crop&q=80',
    beforeLabel: 'BEFORE: Uncovered Sewer Shaft Void',
    afterLabel: 'AFTER: Heavy Ductile Iron Cover Fitted',
    verificationPassText: 'Sewer shaft 100% sealed, safety bar flush with asphalt.',
  },
  WATERLOGGING: {
    id: 'WATERLOGGING',
    name: 'Monsoon Flood Waterlogging Basin',
    code: 'HYDRO',
    badge: 'Waterlogging',
    color: '#06b6d4',
    confidence: 97.1,
    imuShock: 1.12,
    depthStr: '28 cm Inundation',
    volumeStr: '240,000 Liters Stormwater Basin',
    repairMaterial: 'GCC Dewatering 1500 LPM Submersible Pump Rig',
    costInr: 6200,
    agency: 'Greater Chennai Corporation (GCC Stormwater Dept)',
    docketCode: 'GCC-FLOOD-092',
    beforeImg: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=80',
    afterImg: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&auto=format&fit=crop&q=80',
    beforeLabel: 'BEFORE: 28cm Flooded Lane Inundation',
    afterLabel: 'AFTER: Dewatered & Storm Drain Restored',
    verificationPassText: 'Acoustic Doppler confirms water level < 1cm. Lanes dry.',
  },
  UNMARKED_SPEED_BREAKER: {
    id: 'UNMARKED_SPEED_BREAKER',
    name: 'Unmarked Speed Breaker (Non-Compliant)',
    code: 'IRC:99',
    badge: 'Speed Breaker',
    color: '#f97316',
    confidence: 95.6,
    imuShock: 2.24,
    depthStr: '+14.5 cm Height Bump',
    volumeStr: 'Thermoplastic Retroreflective Chevron Painting',
    repairMaterial: 'IRC:35 Cat-Eye Studs & Thermoplastic White Chevrons',
    costInr: 3200,
    agency: 'Chennai Traffic Engineering Division',
    docketCode: 'GCTP-IRC99-318',
    beforeImg: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&auto=format&fit=crop&q=80',
    afterImg: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&auto=format&fit=crop&q=80',
    beforeLabel: 'BEFORE: Invisible Camouflaged Asphalt Hump',
    afterLabel: 'AFTER: Retroreflective Painted IRC:99 Markings',
    verificationPassText: 'Retro-reflectivity > 300 mcd/lux/m² & visible warning studs.',
  },
  ZEBRA_CROSSING: {
    id: 'ZEBRA_CROSSING',
    name: 'Zebra Crossing Pedestrian Encroachment',
    code: 'MVA:177',
    badge: 'Zebra Blockage',
    color: '#a855f7',
    confidence: 98.9,
    imuShock: 0.98,
    depthStr: 'Pedestrian Path Blocked',
    volumeStr: 'Automated ANPR e-Challan Issuance',
    repairMaterial: 'Statutory MVA Sec 177 Penalty (₹1,500)',
    costInr: 1500,
    agency: 'Greater Chennai Traffic Police (GCTP Enforcement)',
    docketCode: 'ECH-2026-CHE-911',
    beforeImg: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&auto=format&fit=crop&q=80',
    afterImg: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&auto=format&fit=crop&q=80',
    beforeLabel: 'BEFORE: Commercial Auto blocking crossing',
    afterLabel: 'AFTER: e-Challan Dispatched & Lane Cleared',
    verificationPassText: 'Zebra walkway 100% unobstructed. Compliance achieved.',
  }
};

interface FullLifecycleSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (clusterId: string, newStatus: WorkOrderStatus, afterImg?: string, notes?: string) => void;
  onAddCluster?: (newCluster: HazardCluster) => void;
}

export const FullLifecycleSimulationModal: React.FC<FullLifecycleSimulationModalProps> = ({
  isOpen,
  onClose,
  onUpdateStatus,
  onAddCluster,
}) => {
  const { success: showSuccessToast, info: showInfoToast } = useToast();
  const [selectedDefectType, setSelectedDefectType] = useState<DemoDefectType>('D40');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simulatedClusterId, setSimulatedClusterId] = useState<string>('cl-demo-2026');
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [shockWaveform, setShockWaveform] = useState<number[]>([0.98, 0.99, 0.97, 0.98, 1.01, 0.98, 0.99]);
  const timerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeDefect = DEFECT_CONFIGS[selectedDefectType];

  // Dynamic Road Animation Loop for Stage 1
  useEffect(() => {
    if (currentStep !== 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let offset = 0;
    let hazardZ = 0.1;

    const render = () => {
      offset = (offset + 0.04) % 1;
      hazardZ = hazardZ + 0.008;
      if (hazardZ > 1.0) {
        hazardZ = 0.05;
        // Shock pulse based on defect type
        const peakShock = activeDefect.imuShock;
        setShockWaveform([0.98, 1.02, peakShock, peakShock * 0.85, 1.15, 0.96, 0.98]);
        setTimeout(() => setShockWaveform([0.98, 0.99, 0.97, 0.98, 1.01, 0.98, 0.99]), 1200);
      }

      const w = canvas.width;
      const h = canvas.height;
      const horizonY = h * 0.42;

      // Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#0a0f1d');
      skyGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, horizonY);

      // Roadway
      const roadTopW = w * 0.2;
      const roadBotW = w * 0.95;
      const vanX = w * 0.5;

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(vanX - roadTopW / 2, horizonY);
      ctx.lineTo(vanX + roadTopW / 2, horizonY);
      ctx.lineTo(vanX + roadBotW / 2, h);
      ctx.lineTo(vanX - roadBotW / 2, h);
      ctx.closePath();
      ctx.fill();

      // Road markings
      ctx.fillStyle = '#facc15';
      for (let i = 0; i < 8; i++) {
        const p = (i / 8 + offset) % 1;
        const z = Math.pow(p, 2.2);
        const y = horizonY + (h - horizonY) * z;
        const dashH = Math.max(3, 20 * z);
        const curW = (roadTopW + (roadBotW - roadTopW) * z) * 0.02;
        ctx.fillRect(vanX - curW / 2, y, curW, dashH);
      }

      // Render Approaching Defect based on selected type
      if (hazardZ > 0.05 && hazardZ <= 1.0) {
        const z = Math.pow(hazardZ, 2.2);
        const y = horizonY + (h - horizonY) * z;
        const curW = roadTopW + (roadBotW - roadTopW) * z;
        const x = vanX + curW * (selectedDefectType === 'ZEBRA_CROSSING' ? 0.2 : 0.08);
        const sizeW = Math.max(14, curW * (selectedDefectType === 'UNMARKED_SPEED_BREAKER' ? 0.4 : (selectedDefectType === 'WATERLOGGING' ? 0.35 : 0.2)));
        const sizeH = sizeW * (selectedDefectType === 'UNMARKED_SPEED_BREAKER' ? 0.35 : 0.55);

        ctx.save();
        if (selectedDefectType === 'D40') {
          // Pothole
          ctx.fillStyle = '#05070d';
          ctx.beginPath();
          ctx.ellipse(x, y, sizeW / 2, sizeH / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = Math.max(1, 2.5 * z);
          ctx.stroke();
        } else if (selectedDefectType === 'D20') {
          // Alligator Crack
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = Math.max(1.5, 2.5 * z);
          ctx.beginPath();
          ctx.moveTo(x - sizeW / 2, y);
          ctx.lineTo(x - sizeW * 0.2, y - sizeH * 0.3);
          ctx.lineTo(x + sizeW * 0.1, y + sizeH * 0.2);
          ctx.lineTo(x + sizeW / 2, y);
          ctx.stroke();
        } else if (selectedDefectType === 'OPEN_MANHOLE') {
          // Open Manhole
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(x, y, sizeW * 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = Math.max(2, 4 * z);
          ctx.stroke();
        } else if (selectedDefectType === 'WATERLOGGING') {
          // Waterlogging Basin
          const waterGrad = ctx.createLinearGradient(x - sizeW / 2, y, x + sizeW / 2, y);
          waterGrad.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
          waterGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.7)');
          waterGrad.addColorStop(1, 'rgba(6, 182, 212, 0.4)');
          ctx.fillStyle = waterGrad;
          ctx.beginPath();
          ctx.ellipse(x, y, sizeW * 0.6, sizeH * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = Math.max(1, 2 * z);
          ctx.stroke();
        } else if (selectedDefectType === 'UNMARKED_SPEED_BREAKER') {
          // Speed Breaker
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.ellipse(x, y, sizeW * 0.8, sizeH * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = Math.max(1.5, 3 * z);
          ctx.stroke();
        } else if (selectedDefectType === 'ZEBRA_CROSSING') {
          // Zebra Crossing with Vehicle Encroachment
          ctx.fillStyle = '#ffffff';
          for (let s = -2; s <= 2; s++) {
            ctx.fillRect(x + s * 14 * z - 4, y - 10 * z, 8 * z, 20 * z);
          }
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(x - 12 * z, y - 8 * z, 24 * z, 16 * z);
        }
        ctx.restore();

        // AI Bounding Box Overlay
        if (z > 0.15) {
          const boxPad = 8 * z;
          const boxX = x - sizeW / 2 - boxPad;
          const boxY = y - sizeH / 2 - boxPad;
          const boxW = sizeW + boxPad * 2;
          const boxH = sizeH + boxPad * 2;

          ctx.strokeStyle = activeDefect.color;
          ctx.lineWidth = 2;
          ctx.strokeRect(boxX, boxY, boxW, boxH);

          // Label Tag
          ctx.fillStyle = activeDefect.color;
          ctx.fillRect(boxX, boxY - 18, 160, 18);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`${activeDefect.name.toUpperCase().slice(0, 16)} [${activeDefect.confidence}%]`, boxX + 4, boxY - 5);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [currentStep, selectedDefectType, activeDefect]);

  // Step Switcher & Real-Time Telemetry Sync
  const handleStepChange = (newStep: number) => {
    setCurrentStep(newStep);

    if (newStep === 1) {
      const demoId = `cl-demo-${Date.now().toString().slice(-4)}`;
      setSimulatedClusterId(demoId);
      const newCluster: HazardCluster = {
        id: demoId,
        cluster_code: activeDefect.docketCode,
        lat: 12.9249,
        lng: 80.1492,
        road_name: 'GST Road, Tambaram (NH-32)',
        defect_type: activeDefect.code as any,
        defect_name: activeDefect.name,
        severity_level: 'critical',
        rpi_score: 94,
        rpi_boosted: 96,
        status: 'open',
        sla_hours: 24,
        pass_count: 1,
        total_observations: 1,
        nearest_poi: 'Tambaram Railway Terminal',
        poi_distance_m: 45,
        classification: 'Major Urban Arterial',
        assigned_agency: activeDefect.agency,
        agency_phone: '+91 98401 22345',
        before_image_url: activeDefect.beforeImg,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (onAddCluster) onAddCluster(newCluster);
      showInfoToast(`Simulation: ${activeDefect.name} Detected`, `Bus MTC-19B detected ${activeDefect.name} with Gz=+${activeDefect.imuShock}g.`);
    } else if (newStep === 2) {
      showInfoToast('Simulation: Model Verification', `DBSCAN merged 4 observation pings for ${activeDefect.name}.`);
    } else if (newStep === 3) {
      if (onUpdateStatus) {
        onUpdateStatus(simulatedClusterId, 'assigned', undefined, `Docket ${activeDefect.docketCode} routed to ${activeDefect.agency}.`);
      }
      showInfoToast('Simulation: CAD Docket Active', `Docket ${activeDefect.docketCode} assigned to ${activeDefect.agency}.`);
    } else if (newStep === 4) {
      if (onUpdateStatus) {
        onUpdateStatus(simulatedClusterId, 'in_progress', undefined, `Field intervention applied: ${activeDefect.repairMaterial}.`);
      }
      showInfoToast('Simulation: In Progress', `Intervention: ${activeDefect.repairMaterial}.`);
    } else if (newStep === 5) {
      if (onUpdateStatus) {
        onUpdateStatus(
          simulatedClusterId,
          'verified_closed',
          activeDefect.afterImg,
          `[AUTONOMOUS_FLEET_CLOSURE] Verified closed by Fleet Node BUS-MTC-21G on re-pass patrol. ${activeDefect.verificationPassText}`
        );
      }
      showSuccessToast('Simulation: Auto-Verified Closed', `Re-pass patrol verified ${activeDefect.name}. SLA verified & work order closed!`);
    }
  };

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setTimeout(() => {
        if (currentStep < 5) {
          handleStepChange(currentStep + 1);
        } else {
          setIsPlaying(false);
        }
      }, 4500);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep]);

  const handleReset = () => {
    setIsPlaying(false);
    handleStepChange(1);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0B101E] border border-slate-700/80 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-slate-100 animate-scaleIn">
        
        {/* ── Top Header ── */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-blue-950/70 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  Multi-Defect Civic Infrastructure Simulation
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold">
                  All Hazards &amp; Incidents
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate Potholes, Cracks, Open Manholes, Waterlogging, Speed Breakers, and Traffic Encroachments.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close Simulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Defect Type Selector Strip ── */}
        <div className="px-6 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Simulate Issue:
          </span>
          {(Object.keys(DEFECT_CONFIGS) as DemoDefectType[]).map((typeKey) => {
            const cfg = DEFECT_CONFIGS[typeKey];
            const isSelected = selectedDefectType === typeKey;
            return (
              <button
                key={typeKey}
                onClick={() => {
                  setSelectedDefectType(typeKey);
                  handleStepChange(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 border cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{cfg.badge}</span>
              </button>
            );
          })}
        </div>

        {/* ── 5-Step Pipeline Progress Bar ── */}
        <div className="px-6 py-2.5 bg-slate-950/70 border-b border-slate-800/80">
          <div className="grid grid-cols-5 gap-2">
            {[
              { idx: 1, title: '1. Edge Capture', icon: Bus },
              { idx: 2, title: '2. Model Check', icon: Layers },
              { idx: 3, title: '3. CAD Docket', icon: ClipboardList },
              { idx: 4, title: '4. Repair Infill', icon: Wrench },
              { idx: 5, title: '5. Re-Pass Closure', icon: ShieldCheck },
            ].map((step) => {
              const isActive = step.idx === currentStep;
              const isPassed = step.idx < currentStep;
              const IconComponent = step.icon;

              return (
                <button
                  key={step.idx}
                  onClick={() => handleStepChange(step.idx)}
                  className={`p-2 rounded-xl border text-left transition flex flex-col gap-0.5 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/20 border-blue-500 text-white ring-2 ring-blue-500/40'
                      : isPassed
                      ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold">
                      STAGE {step.idx}
                    </span>
                    {isPassed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                    )}
                  </div>
                  <div className="text-[11px] font-bold truncate">
                    {step.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Active Stage Visual Workspace ── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 custom-scrollbar">
          
          {/* Main Visual Display Screen */}
          <div className="relative aspect-video max-h-[350px] w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
            
            {/* STAGE 1 VISUAL: Live Moving Dashcam + YOLO Bounding Box & Waveform */}
            {currentStep === 1 && (
              <div className="relative w-full h-full">
                <canvas ref={canvasRef} width={854} height={480} className="w-full h-full object-cover" />
                {/* HUD Overlays */}
                <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-white font-mono text-xs flex items-center gap-2 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>BUS MTC-19B ● DETECTING: {activeDefect.name.toUpperCase()}</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-emerald-400 font-bold">29.8 FPS</span>
                </div>

                {/* Live IMU Shock Accelerometer Waveform */}
                <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-700 font-mono text-xs shadow-lg flex items-center gap-3">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Sensor Shock</div>
                    <div className="text-rose-400 font-extrabold text-sm">+{activeDefect.imuShock}g Spike</div>
                  </div>
                  <div className="flex items-end gap-1 h-8 w-24 px-1 bg-slate-950/80 rounded border border-slate-800">
                    {shockWaveform.map((val, idx) => (
                      <div
                        key={idx}
                        className={`w-2.5 rounded-t transition-all ${val > 1.3 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'}`}
                        style={{ height: `${Math.min(100, Math.max(15, (val / 2.5) * 100))}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* GPS Telemetry */}
                <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300 font-mono text-[11px]">
                  12.9249° N, 80.1492° E (GST Road Tambaram Corridor)
                </div>
              </div>
            )}

            {/* STAGE 2 VISUAL: 3D Depth Cavity Profile & DBSCAN Fusion Animation */}
            {currentStep === 2 && (
              <div className="w-full h-full p-5 bg-gradient-to-br from-slate-950 via-[#0B1222] to-slate-950 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 font-mono text-xs text-indigo-300 font-bold">
                    <Box className="w-4 h-4 text-indigo-400" />
                    <span>3D Cavity Depth Profile &amp; Multi-Bus DBSCAN Spatial Fusion</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-indigo-900/40 text-indigo-300 font-mono text-[10px] border border-indigo-700/50">
                    {activeDefect.code} Standard
                  </span>
                </div>

                {/* 3D Depth Cross Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center my-auto">
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                      <span>Defect Cross-Section Profile</span>
                      <span className="text-rose-400 font-bold">{activeDefect.depthStr}</span>
                    </div>
                    <svg viewBox="0 0 300 80" className="w-full h-20 bg-slate-950 rounded-lg p-1 border border-slate-800">
                      <path
                        d="M 10,25 L 80,25 Q 150,75 220,25 L 290,25"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="3"
                      />
                      <path
                        d="M 80,25 Q 150,75 220,25 L 220,78 L 80,78 Z"
                        fill="rgba(239, 68, 68, 0.25)"
                      />
                      <text x="110" y="55" fill="#f87171" fontSize="10" fontFamily="monospace" fontWeight="bold">
                        {activeDefect.depthStr}
                      </text>
                    </svg>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5 font-mono text-xs">
                    <div className="text-slate-400 text-[11px]">DBSCAN Spatial Consensus:</div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                      <span className="text-slate-300">Fused Bus Observations:</span>
                      <span className="text-emerald-400 font-bold">4 Buses (15m Radius)</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                      <span className="text-slate-300">Material Quantity:</span>
                      <span className="text-amber-400 font-bold">{activeDefect.volumeStr}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                      <span className="text-slate-300">MoRTH Estimate:</span>
                      <span className="text-emerald-400 font-bold">₹{activeDefect.costInr.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-400 text-center">
                  Centroid: 12.9249° N, 80.1492° E • Assigned Target: {activeDefect.agency}
                </div>
              </div>
            )}

            {/* STAGE 3 VISUAL: Municipal CAD Work Order & Dispatch Routing */}
            {currentStep === 3 && (
              <div className="w-full h-full p-5 bg-gradient-to-br from-slate-950 via-[#131320] to-slate-950 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 font-mono text-xs text-amber-300 font-bold">
                    <ClipboardList className="w-4 h-4 text-amber-400" />
                    <span>Municipal CAD Docket Generation &amp; Dispatch Routing</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] border border-amber-500/40">
                    24h SLA Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center my-auto">
                  <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/40 shadow-md space-y-2 font-mono text-xs">
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span className="text-amber-400 font-bold">DOCKET: {activeDefect.docketCode}</span>
                      <span className="text-slate-400">{activeDefect.code}</span>
                    </div>
                    <div className="text-white font-bold text-sm">GST Road, Tambaram (NH-32)</div>
                    <div className="text-slate-300 text-[11px]">Agency: {activeDefect.agency}</div>
                    <div className="text-slate-400 text-[11px]">Target: {activeDefect.name}</div>
                    <div className="text-amber-400 font-bold text-[11px]">SLA Countdown: 23h 58m Active</div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2 font-mono text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <Send className="w-4 h-4" />
                      <span>CAD Dispatch Confirmed</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      "Work Order {activeDefect.docketCode} routed to {activeDefect.agency}. Required Material: {activeDefect.repairMaterial}."
                    </p>
                    <div className="text-emerald-400 text-[10px] font-bold">✓ Delivered to Chief Engineer (+91 98401 22345)</div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-400 text-center">
                  Work Order status synchronized with WebGIS Map &amp; Priority Queue in real time.
                </div>
              </div>
            )}

            {/* STAGE 4 VISUAL: Before / After Repair Interactive Infill Slider */}
            {currentStep === 4 && (
              <div className="relative w-full h-full overflow-hidden">
                <img
                  src={activeDefect.beforeImg}
                  alt="Before Repair"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                <div
                  className="absolute inset-0 overflow-hidden border-r-2 border-white shadow-2xl"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={activeDefect.afterImg}
                    alt="After Repair"
                    className="absolute inset-0 w-full h-full object-cover max-w-none"
                    style={{ width: '100%', height: '100%' }}
                  />
                  <div className="absolute top-3 left-3 bg-emerald-600/90 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg">
                    {activeDefect.afterLabel}
                  </div>
                </div>

                <div className="absolute top-3 right-3 bg-rose-600/90 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg">
                  {activeDefect.beforeLabel}
                </div>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-3 text-xs font-mono text-white shadow-xl">
                  <span>Drag Before / After:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPos}
                    onChange={(e) => setSliderPos(Number(e.target.value))}
                    className="w-36 accent-emerald-500 cursor-pointer"
                  />
                  <span className="font-bold text-emerald-400">{sliderPos}%</span>
                </div>
              </div>
            )}

            {/* STAGE 5 VISUAL: Autonomous Re-Pass Verification & SLA Clearance */}
            {currentStep === 5 && (
              <div className="w-full h-full p-5 bg-gradient-to-br from-slate-950 via-[#0B1A1E] to-slate-950 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 font-mono text-xs text-emerald-300 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Fleet Patrol Node BUS-MTC-21G Autonomous Re-Pass Verification</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] border border-emerald-500/40">
                    SLA Verified Closed
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center my-auto">
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/50 space-y-2 font-mono text-xs">
                    <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <Activity className="w-4 h-4" />
                      <span>Post-Intervention Sensor Verification:</span>
                    </div>
                    <div className="p-2.5 rounded bg-slate-950 text-[11px] text-slate-300">
                      {activeDefect.verificationPassText}
                    </div>
                    <div className="flex justify-between p-2 rounded bg-slate-950 text-[11px]">
                      <span>Autonomous Confidence:</span>
                      <span className="text-emerald-400 font-bold">Consensus Confirmed</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/60 text-center space-y-2 font-mono text-xs">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center mx-auto text-emerald-400">
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="text-white font-extrabold text-sm uppercase tracking-wider">
                      SLA COMPLIANCE VERIFIED
                    </div>
                    <div className="text-emerald-400 font-bold text-xs">Milestone Payment Authorized for {activeDefect.agency.split(' ')[0]}</div>
                    <div className="text-slate-400 text-[10px]">Cryptographic SHA-256 Audit Hash Verified</div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-400 text-center">
                  Docket #{activeDefect.docketCode} autonomously closed with zero human paperwork.
                </div>
              </div>
            )}
          </div>

          {/* Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Defect Type', value: activeDefect.name, color: 'text-white' },
              { label: 'Detection Sensor', value: `Sony IMX335 + IMU (+${activeDefect.imuShock}g)`, color: 'text-blue-400' },
              { label: 'Material / Spec', value: activeDefect.repairMaterial, color: 'text-amber-400' },
              { label: 'Estimated Cost', value: `₹${activeDefect.costInr.toLocaleString()}`, color: 'text-emerald-400' },
            ].map((m, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                  {m.label}
                </div>
                <div className={`font-mono font-extrabold text-xs sm:text-sm truncate ${m.color}`}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom Playback Controls ── */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-900/30 transition active:scale-95 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Pause Demo' : `Auto-Play (${activeDefect.badge})`}</span>
            </button>

            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Reset to Step 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStepChange(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Stage</span>
            </button>

            <button
              onClick={() => {
                if (currentStep < 5) {
                  handleStepChange(currentStep + 1);
                } else {
                  onClose();
                }
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/20 transition active:scale-95 cursor-pointer"
            >
              <span>{currentStep === 5 ? 'Finish & Inspect Map' : 'Next Stage'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
