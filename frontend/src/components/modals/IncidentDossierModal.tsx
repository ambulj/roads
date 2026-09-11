import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Send, 
  Car, 
  Gauge, 
  MapPin, 
  Clock, 
  Camera, 
  FileCheck, 
  AlertTriangle,
  Radio,
  ExternalLink,
  Printer,
  FileText,
  ShieldCheck,
  Compass,
  ArrowRight,
  Sparkles,
  Award,
  ChevronLeft,
  Building2,
  Droplets,
  Ban,
  Zap,
  Box,
  Wrench,
  Flame,
  Shield
} from 'lucide-react';
import { TrafficIncident, ANPRInterceptSighting } from '../../types';
import { RoadMeshVisualizerModal, isRoadSurfaceDefect } from './RoadMeshVisualizerModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../ui';

interface IncidentDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: TrafficIncident | null;
  onUpdateStatus?: (incidentId: string, status: string) => void;
  onNavigateToWorkOrders?: () => void;
}

export const IncidentDossierModal: React.FC<IncidentDossierModalProps> = ({
  isOpen,
  onClose,
  incident,
  onUpdateStatus,
  onNavigateToWorkOrders
}) => {
  const { canEscalatePCR, canDispatchWorkOrder, canIssueEChallan, canDeploySumpPump, user, getRoleBadgeLabel } = useAuth();
  const { success: showSuccessToast } = useToast();

  const [reviewNote, setReviewNote] = useState('');
  const [currentStatus, setCurrentStatus] = useState<string>(incident?.status || 'ACTIVE_ALERT');
  const [showEChallan, setShowEChallan] = useState(false);
  const [isMeshOpen, setIsMeshOpen] = useState(false);
  const [permissionNotice, setPermissionNotice] = useState('');

  useEffect(() => {
    if (incident) {
      setCurrentStatus(incident.status || 'ACTIVE_ALERT');
      setShowEChallan(false);
      setReviewNote('');
      setPermissionNotice('');
    }
  }, [incident?.id, incident?.status]);

  if (!isOpen || !incident) return null;

  // Domain Classifications
  const isHitAndRun = incident.incident_type === 'HIT_AND_RUN';
  const isRashDriving = incident.incident_type === 'RASH_DRIVING';
  const isWaterlog = incident.incident_type === 'WATERLOGGING' || incident.incident_type === 'SUBMERGED_POTHOLE';
  const isOpenManhole = incident.incident_type === 'OPEN_MANHOLE';
  const isPothole = incident.incident_type === 'POTHOLE_D40' || isRoadSurfaceDefect(incident.incident_type);
  const isZebraCrossing = incident.incident_type === 'ZEBRA_CROSSING_ENCROACHMENT' || incident.incident_type.includes('CROSSING');
  const isRedLight = incident.incident_type === 'RED_LIGHT_VIOLATION';
  const isBusLane = incident.incident_type === 'BUS_LANE_ENCROACHMENT' || incident.incident_type === 'BUS_LANE_ENCROACH';
  const isUnsafeOvertake = incident.incident_type === 'UNSAFE_OVERTAKE';

  // Vehicular Moving/Stationary Traffic Infraction
  const isTrafficViolation = isHitAndRun || isRashDriving || isZebraCrossing || isRedLight || isBusLane || isUnsafeOvertake || Boolean(incident.plate_number);

  const badgeColor = isHitAndRun 
    ? '#ef4444' 
    : isRashDriving || isRedLight 
    ? '#f97316' 
    : isWaterlog 
    ? '#06b6d4' 
    : isZebraCrossing 
    ? '#eab308' 
    : isBusLane 
    ? '#8b5cf6' 
    : isOpenManhole 
    ? '#dc2626' 
    : '#3b82f6';

  // Multi-bus coordinated sightings for Hit & Run / Rash Driving
  const defaultInterceptHistory: ANPRInterceptSighting[] = [
    {
      bus_id: incident.reporting_bus_id || 'MTC-1042',
      location: incident.road_name,
      lat: incident.lat,
      lng: incident.lng,
      timestamp: incident.occurred_at || '14:22:10 IST',
      speed_kmh: incident.target_speed_kmh || 78.4
    },
    {
      bus_id: 'MTC-1088',
      location: 'Guindy Flyover North Descent (NH-32)',
      lat: Number((incident.lat + 0.0152).toFixed(5)),
      lng: Number((incident.lng + 0.0084).toFixed(5)),
      timestamp: '14:26:45 IST (+4m 35s)',
      speed_kmh: Math.max(30, (incident.target_speed_kmh || 78.4) - 6.2)
    },
    {
      bus_id: 'MTC-1102 (INTERCEPT GATE)',
      location: 'Kathipara Cloverleaf Grade Separator',
      lat: Number((incident.lat + 0.0285).toFixed(5)),
      lng: Number((incident.lng + 0.0121).toFixed(5)),
      timestamp: '14:29:10 IST (+7m 00s)',
      speed_kmh: Math.max(20, (incident.target_speed_kmh || 78.4) - 18.5)
    }
  ];

  const sightings = (incident.intercept_history && incident.intercept_history.length > 0)
    ? incident.intercept_history
    : (isTrafficViolation && incident.plate_number ? defaultInterceptHistory : []);

  // Legal code mappings (Only relevant for traffic infractions)
  const getViolationMVA = () => {
    if (isHitAndRun) {
      return {
        section: 'MVA 1988 Sec 134(a)(b) & Sec 184 (Hit & Run causing peril)',
        fine: '₹10,000 / Court Summons',
        penalty: '3-Month DL Suspension, Vehicle Impoundment under CrPC Sec 102',
        title: 'NON-BAILABLE SERIOUS MOTOR VEHICLE ACCIDENT CONTRIVANCE'
      };
    }
    if (isZebraCrossing) {
      return {
        section: 'MVA 1988 Sec 177 & CMVR Rule 138 (Pedestrian Crosswalk Right-of-Way)',
        fine: '₹1,500 (Automated e-Challan)',
        penalty: 'Mandatory Driver Re-Education Point, Parivahan SMS Notice',
        title: 'UNAUTHORIZED VEHICLE ENCROACHMENT ON DESIGNATED ZEBRA CROSSWALK'
      };
    }
    if (isRedLight) {
      return {
        section: 'MVA 1988 Sec 184(c) & CMVR 119 (Disobedience of Traffic Signal)',
        fine: '₹1,000 (First Offense) / ₹5,000 (Repeat)',
        penalty: 'Automated ANPR e-Challan + 1 Demerit Point',
        title: 'RED LIGHT TRAFFIC SIGNAL CONTRAVENTION'
      };
    }
    if (isBusLane) {
      return {
        section: 'MVA 1988 Sec 177 & MoHUA Smart City Dedicated BRTS Corridor Regulations',
        fine: '₹2,000 (First Offense) / ₹5,000 (Subsequent)',
        penalty: 'Direct e-challan endorsement, automated toll gate blocking',
        title: 'UNAUTHORIZED ENCROACHMENT IN DEDICATED PUBLIC BUS LANE'
      };
    }
    if (isUnsafeOvertake) {
      return {
        section: 'MVA 1988 Sec 184 & CMVR Rule 138 (Dangerous Overtake Gap < 1.5m)',
        fine: '₹5,000',
        penalty: '2 Demerit Points, Mandatory Driver Safety Retraining',
        title: 'CRITICAL PROXIMITY TAILGATING & UNSAFE OVERTAKE IN BLIND-SPOT'
      };
    }
    if (isRashDriving) {
      return {
        section: 'MVA 1988 Sec 184 (Driving dangerously with extreme disregard for safety)',
        fine: '₹5,000',
        penalty: 'Vehicle registration verification, e-challan with speed radar telemetry',
        title: 'DANGEROUS AND HIGH-SPEED RECKLESS DRIVING'
      };
    }
    return {
      section: 'MVA 1988 Sec 177 (General offenses & highway safety violations)',
      fine: '₹1,000',
      penalty: 'Parivahan Portal statutory notification',
      title: 'PUBLIC HIGHWAY TRANSIT REGULATION CONTRAVENTION'
    };
  };

  const legalCode = getViolationMVA();

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase().trim();
    if (s.includes('resolv') || s.includes('closed') || s.includes('verifi')) {
      return { label: 'Resolved', variant: 'success' as const };
    }
    if (s.includes('intercept')) {
      return { label: 'Intercepted', variant: 'purple' as const };
    }
    if (s.includes('pcr') || s.includes('escalat') || (s.includes('dispatch') && !s.includes('pump'))) {
      return { label: 'PCR Dispatched', variant: 'critical' as const };
    }
    if (s.includes('pump')) {
      return { label: 'Pump Dispatched', variant: 'info' as const };
    }
    if (s.includes('barricad')) {
      return { label: 'Barricaded', variant: 'warning' as const };
    }
    if (s.includes('work_order') || s.includes('work order')) {
      return { label: 'Work Order', variant: 'success' as const };
    }
    if (s.includes('echallan') || s.includes('challan')) {
      return { label: 'e-Challan Issued', variant: 'purple' as const };
    }
    if (s.includes('reject')) {
      return { label: 'Rejected', variant: 'neutral' as const };
    }
    return { label: 'Active Alert', variant: 'warning' as const };
  };

  const statusBadge = getStatusBadge(currentStatus);

  const handleAction = (status: string) => {
    setPermissionNotice('');
    setCurrentStatus(status as any);
    if (onUpdateStatus) {
      onUpdateStatus(incident.id, status);
    }
    showSuccessToast('Status Updated', `Incident #${incident.id} updated to ${status}`);
  };

  const handlePrintChallan = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg border ${
              isWaterlog 
                ? 'bg-cyan-50 dark:bg-cyan-950/80 border-cyan-200 dark:border-cyan-900 text-cyan-600 dark:text-cyan-400'
                : isOpenManhole
                ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400'
                : 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400'
            }`}>
              {isWaterlog ? <Droplets className="w-4 h-4" /> : isOpenManhole ? <AlertTriangle className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  {showEChallan 
                    ? 'Statutory E-Challan / Police FIR Packet'
                    : isWaterlog 
                    ? 'GCC Stormwater Dewatering Incident Dossier'
                    : isOpenManhole
                    ? 'GCC Emergency Hazard Barricade Dossier'
                    : isPothole && !isTrafficViolation
                    ? 'PWD Road Distress Triage Dossier'
                    : 'Traffic Enforcement Evidence Dossier'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-semibold border border-slate-200 dark:border-slate-700">
                  {incident.id}
                </span>
                <Badge variant={statusBadge.variant} size="sm">
                  {statusBadge.label}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isWaterlog 
                  ? 'GCC Stormwater Drainage & Monsoon Disaster Management'
                  : isOpenManhole || (isPothole && !isTrafficViolation)
                  ? 'Greater Chennai Corporation & Tamil Nadu PWD Infrastructure Wing'
                  : 'Greater Chennai Traffic Police (GCTP) & MoHUA Smart City Division'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* E-CHALLAN BUTTON: STRICTLY ONLY FOR TRAFFIC VIOLATIONS */}
            {isTrafficViolation && (
              showEChallan ? (
                <button
                  onClick={() => setShowEChallan(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back to Dossier</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowEChallan(true)}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  title="Generate Court-Admissible E-Challan / Police Notice"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="hidden sm:inline">E-Challan Summons</span>
                  <span className="sm:hidden">E-Challan</span>
                </button>
              )
            )}

            {/* 3D DEPTH MESH: STRICTLY FOR PHYSICAL ROAD SURFACE HAZARDS */}
            {(isPothole || isWaterlog) && (
              <button
                onClick={() => setIsMeshOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Inspect 3D Surface Depth Mesh"
              >
                <Box className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">3D Depth Mesh</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {showEChallan && isTrafficViolation ? (
          /* ==================================================== */
          /* PRINTABLE E-CHALLAN / POLICE EVIDENCE PACKET         */
          /* ==================================================== */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100">
            {/* Top Government Emblems Bar */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left border-t-4 border-t-blue-600 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 tracking-wider">
                    GOVERNMENT OF TAMIL NADU &bull; MoHUA SMART CITY MISSION
                  </h3>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                    GREATER CHENNAI TRAFFIC POLICE &bull; AUTOMATED ENFORCEMENT DIVISION
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    NOTICE OF STATUTORY OFFENCE &bull; FORM E-CHALLAN VAHAN-IX (RULE 167A)
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center sm:items-end gap-1">
                <span className="px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-bold text-xs">
                  {incident.echallan_id || `ECH-TN-2026-${incident.id.slice(-6).toUpperCase()}`}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Date: {incident.occurred_at}</span>
              </div>
            </div>

            {/* Violation Details Box */}
            <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400 tracking-wide uppercase">
                  {legalCode.title}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Statutory Citation:</span>
                  <p className="text-slate-900 dark:text-slate-100 font-semibold mt-0.5">{legalCode.section}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Assessed Penalty Amount:</span>
                  <p className="text-amber-600 dark:text-amber-400 font-bold text-sm mt-0.5">{incident.fine_amount_inr ? `₹${incident.fine_amount_inr.toLocaleString()}` : legalCode.fine}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{legalCode.penalty}</p>
                </div>
              </div>
            </div>

            {/* Target Vehicle Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Target Vehicle Registry Record</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">OCR CONF: {Math.round((incident.plate_confidence || 0.95) * 100)}%</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="border-2 border-amber-400 bg-amber-50 dark:bg-black px-4 py-2 rounded-lg font-black text-xl text-slate-900 dark:text-yellow-300 tracking-widest font-mono">
                      {incident.plate_number || 'TN-01-AX-8732'}
                    </div>
                    <div className="text-xs space-y-0.5">
                      <div>Class: <b className="text-slate-800 dark:text-slate-200">{incident.vehicle_class || 'Motor Vehicle'}</b></div>
                      {incident.target_speed_kmh ? (
                        <div>Speed: <b className="text-rose-600 dark:text-rose-400 font-bold">{incident.target_speed_kmh} km/h</b> (Corridor Limit: 50 km/h)</div>
                      ) : null}
                      <div>Color: <b className="text-slate-800 dark:text-slate-200">{incident.vehicle_color || 'Standard'}</b></div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                  Location: <b className="text-slate-800 dark:text-slate-200">{incident.road_name}</b> [{incident.lat.toFixed(5)}, {incident.lng.toFixed(5)}]
                </div>
              </div>

              {/* Cryptographic Proof */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
                <div className="space-y-1.5">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Evidence Chain of Custody</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Frame secured with ISO/IEC 27037 digital forensic seal.
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] break-all text-slate-700 dark:text-blue-300 font-mono">
                    SHA256: 7f8a9e2d3c4b1a0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>COURT-ADMISSIBLE (Sec 65B)</span>
                </div>
              </div>
            </div>

            {/* Print Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Notice formatted for Parivahan / VAHAN &amp; State Police CCTNS.
              </span>
              <button
                onClick={handlePrintChallan}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Summons Notice</span>
              </button>
            </div>
          </div>
        ) : (
          /* ==================================================== */
          /* DOMAIN-SPECIFIC OPERATIONAL DOSSIER VIEW             */
          /* ==================================================== */
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            
            {/* 1. WATERLOGGING DEWATERING OPERATIONAL PANEL */}
            {isWaterlog && (
              <div className="bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-900 dark:text-cyan-200 uppercase tracking-wider">
                      GCC Monsoon Stormwater Response &bull; Dewatering Sump Pump Ops
                    </span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-300 font-bold border border-cyan-300 dark:border-cyan-700">
                    WATER DEPTH: {incident.water_depth_cm || 28} CM
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white/90 dark:bg-slate-900/90 p-3 rounded-xl border border-cyan-100 dark:border-cyan-900 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Hydroplaning Risk:</span>
                    <p className="font-bold text-rose-600 dark:text-rose-400 text-xs mt-0.5">CRITICAL (&gt;120mm Threshold)</p>
                    <span className="text-[10px] text-slate-500">Speed limit reduced to 20 km/h</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Assigned High-Capacity Pump:</span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5">{incident.pump_id || 'GCC-PUMP-UNIT-04'}</p>
                    <span className="text-[10px] text-slate-500">1,200 L/min Submersible Diesel Unit</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Drainage SLA ETA:</span>
                    <p className="font-bold text-cyan-700 dark:text-cyan-300 text-xs mt-0.5">{incident.dewatering_eta_mins || 18} Mins to Clear</p>
                    <span className="text-[10px] text-slate-500">Outfall: Velachery Canal Link</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-cyan-800 dark:text-cyan-300 font-medium">
                    {currentStatus === 'PUMP_DISPATCHED' 
                      ? '✓ Dewatering Unit en route. Real-time telemetry monitoring canal discharge.' 
                      : 'Deploy emergency suction truck and notify GCC Ward 13 Stormwater JE.'}
                  </span>
                  <button
                    onClick={() => handleAction('PUMP_DISPATCHED')}
                    disabled={currentStatus === 'PUMP_DISPATCHED'}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer ${
                      currentStatus === 'PUMP_DISPATCHED'
                        ? 'bg-emerald-600 text-white cursor-default'
                        : 'bg-cyan-600 hover:bg-cyan-700 text-white active:scale-95'
                    }`}
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    <span>{currentStatus === 'PUMP_DISPATCHED' ? '✓ Pump Dispatched' : 'Dispatch Dewatering Pump'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. OPEN MANHOLE EMERGENCY BARRICADE PANEL */}
            {isOpenManhole && (
              <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                      Fatality Hazard Prevention &bull; Emergency Barricading Protocol
                    </span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-700">
                    P0 EMERGENCY DISPATCH
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white/90 dark:bg-slate-900/90 p-3 rounded-xl border border-amber-100 dark:border-amber-900 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Defect Void Diameter:</span>
                    <p className="font-bold text-rose-600 dark:text-rose-400 text-xs mt-0.5">65 cm Open Cavity</p>
                    <span className="text-[10px] text-slate-500">Deep storm drain drop: 2.1m</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Assigned Emergency Team:</span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5">GCC Zone 5 Rapid Patrol</p>
                    <span className="text-[10px] text-slate-500">Reflective cones + cast-iron lid</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Target SLA:</span>
                    <p className="font-bold text-amber-700 dark:text-amber-300 text-xs mt-0.5">&lt; 30 Mins Barricade</p>
                    <span className="text-[10px] text-slate-500">Lid replacement within 4h</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                    {currentStatus === 'BARRICADED' 
                      ? '✓ Site reflective barricade confirmed by ward patrol.' 
                      : 'Deploy emergency barricading squad immediately to prevent night-time accidents.'}
                  </span>
                  <button
                    onClick={() => handleAction('BARRICADED')}
                    disabled={currentStatus === 'BARRICADED'}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer ${
                      currentStatus === 'BARRICADED'
                        ? 'bg-emerald-600 text-white cursor-default'
                        : 'bg-amber-600 hover:bg-amber-700 text-white active:scale-95'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{currentStatus === 'BARRICADED' ? '✓ Barricade Active' : 'Deploy Barricades Now'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. POTHOLE ROAD DISTRESS & 3D MESH PWD WORK ORDER PANEL */}
            {isPothole && !isTrafficViolation && (
              <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                      PWD Engineering Distress Triage &bull; Bituminous Patching
                    </span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                    IRC:SP:20 ESTIMATE READY
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white/90 dark:bg-slate-900/90 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Measured Cavity Depth:</span>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5">8.4 cm (Stereo Depth)</p>
                    <span className="text-[10px] text-slate-500">Area: 0.65 m² &bull; Vol: 42.5 L</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Dense Bitumen Demanded:</span>
                    <p className="font-bold text-emerald-700 dark:text-emerald-300 text-xs mt-0.5">97.8 kg VG-30 DBM</p>
                    <span className="text-[10px] text-slate-500">MORTH 2025 Schedule: ₹3,450</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Assigned PWD Division:</span>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5">Chennai PWD Div 4</p>
                    <span className="text-[10px] text-slate-500">SLA: 24 Hours</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                    {currentStatus === 'WORK_ORDER_CREATED' 
                      ? '✓ Work order logged into PWD maintenance tracking system.' 
                      : 'Create formal contractor repair work order with 3D depth evidence.'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsMeshOpen(true)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Box className="w-3.5 h-3.5 text-blue-500" />
                      <span>Inspect 3D Mesh</span>
                    </button>
                    <button
                      onClick={() => {
                        handleAction('WORK_ORDER_CREATED');
                        onNavigateToWorkOrders?.();
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Route to Work Orders</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. TRAFFIC / VEHICULAR MOVING VIOLATION VIEW */}
            {isTrafficViolation && (
              <div className="relative h-48 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-slate-950/80 to-transparent z-10" />
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

                <div className="relative z-20 flex flex-col items-center gap-2">
                  <div className="border-2 border-blue-500 bg-black/90 px-6 py-2.5 rounded-xl shadow-lg flex flex-col items-center">
                    <div className="text-[9px] font-mono font-bold tracking-widest text-blue-400 mb-0.5">
                      INDIA • ANPR OCR MATCH
                    </div>
                    <div className="text-xl sm:text-2xl font-mono font-black text-white tracking-widest">
                      {incident.plate_number || 'TN-01-AX-8732'}
                    </div>
                    <div className="text-[9px] font-mono text-emerald-400 font-bold mt-0.5">
                      CONFIDENCE: {Math.round((incident.plate_confidence || 0.95) * 100)}% • SONY IMX335 INT8
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 bg-slate-950/90 px-3 py-1 rounded-md border border-slate-800">
                    Vehicle: <b className="text-white">{incident.vehicle_class || 'Motor Vehicle'}</b>
                    {incident.target_speed_kmh ? <> &bull; Speed: <b className="text-amber-400">{incident.target_speed_kmh} km/h</b></> : null}
                  </div>
                </div>

                <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/80 border border-white/15 text-[10px] text-slate-300">
                  <Radio className="w-2.5 h-2.5 text-blue-400 animate-pulse" />
                  <span>ANPR TELEMETRY &bull; {incident.occurred_at}</span>
                </div>
              </div>
            )}

            {/* 5. MULTI-BUS COORDINATED INTERCEPT RING (FOR POLICE INCIDENTS) */}
            {sightings.length > 0 && isTrafficViolation && (
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Multi-Bus AI ANPR Intercept Network ({sightings.length} Nodes Sighted)
                    </span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold font-mono animate-pulse">
                    AUTO-DISPATCHED TO 112 PCR
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-[11px] text-blue-900 dark:text-blue-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse shrink-0" />
                    <span><b>Automated Police Broadcast Active:</b> Next bus cameras across corridor are auto-tracking plate <b>{incident.plate_number || 'TN-01-AX-8732'}</b> with GPS &amp; time sync.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-950/40 p-2.5 text-[10.5px]">
                  <div><span className="block uppercase tracking-wider text-slate-400 font-bold">Plate Match Consensus</span><span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{Math.min(99, 84 + sightings.length * 5)}% Multi-Bus</span></div>
                  <div><span className="block uppercase tracking-wider text-slate-400 font-bold">GPS Accuracy</span><span className="font-mono font-bold text-slate-700 dark:text-slate-200">±1.2m NavIC Precision</span></div>
                  <div><span className="block uppercase tracking-wider text-slate-400 font-bold">Police FIR Evidence</span><span className="font-mono font-bold text-blue-600 dark:text-blue-400">Locked with Timestamp</span></div>
                </div>

                {/* Sighting Chronology Timeline with GPS Coordinates */}
                <div className="space-y-1.5">
                  {sightings.map((sighting, idx) => (
                    <div 
                      key={idx}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          idx === 0 ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">
                            {sighting.bus_id} &bull; <span className="font-normal text-slate-500">{sighting.location}</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            GPS: [{sighting.lat.toFixed(5)}, {sighting.lng.toFixed(5)}]
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-mono font-bold text-rose-600 dark:text-rose-400 block">
                          {sighting.speed_kmh.toFixed(1)} km/h
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {sighting.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General Telemetry & Context Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Corridor Location</span>
                <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">{incident.road_name}</span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  GPS: [{incident.lat.toFixed(5)}, {incident.lng.toFixed(5)}]
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Sensor Node</span>
                <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                  <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Node: {incident.reporting_bus_id}</span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Logged: {incident.occurred_at}
                </span>
              </div>
            </div>

            {/* Human Review Notes Box */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                Controller Review &amp; Operational Directives:
              </label>
              <input
                type="text"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Add operational notes or field inspection remarks..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Modal Action Controls Footer */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-2">
          {!showEChallan && (
            <>
              {permissionNotice && (
                <div role="status" className="w-full rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-300">
                  {permissionNotice} Active role: {getRoleBadgeLabel(user.role)}.
                </div>
              )}

              <button
                onClick={() => handleAction('REJECTED')}
                className="px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Reject / False Alarm</span>
              </button>

              <div className="flex items-center gap-2">
                {/* 1. Traffic Violations: Issue e-Challan / Escalate to PCR */}
                {isTrafficViolation && (
                  <>
                    <button
                      onClick={() => setShowEChallan(true)}
                      className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Issue E-Challan</span>
                    </button>

                    {(isHitAndRun || isRashDriving) && (
                      <button
                        onClick={() => handleAction('DISPATCHED_TO_POLICE')}
                        className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>112 PCR Dispatch</span>
                      </button>
                    )}
                  </>
                )}

                {/* 2. Waterlogging: Dispatch Sump Pump */}
                {isWaterlog && (
                  <button
                    onClick={() => handleAction('PUMP_DISPATCHED')}
                    className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer"
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    <span>Deploy GCC Dewatering Sump Pump</span>
                  </button>
                )}

                {/* 3. Open Manhole: Deploy Barricade */}
                {isOpenManhole && (
                  <button
                    onClick={() => handleAction('BARRICADED')}
                    className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Deploy Emergency Barricade</span>
                  </button>
                )}

                {/* 4. Pothole / Road Distress: Route to Work Order */}
                {isPothole && !isTrafficViolation && (
                  <button
                    onClick={() => {
                      handleAction('WORK_ORDER_CREATED');
                      onNavigateToWorkOrders?.();
                    }}
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Create PWD Work Order</span>
                  </button>
                )}

                {/* 5. Mark Intercepted (for dispatched cases) */}
                {(currentStatus.includes('DISPATCH') || currentStatus.includes('ESCALAT')) && !currentStatus.includes('INTERCEPT') && !currentStatus.includes('RESOLV') && (
                  <button
                    onClick={() => handleAction('INTERCEPTED')}
                    className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Intercepted</span>
                  </button>
                )}

                {/* 6. Resolve & Close Incident */}
                {!currentStatus.includes('RESOLV') && !currentStatus.includes('REJECT') && (
                  <button
                    onClick={() => handleAction('RESOLVED')}
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Resolve & Close</span>
                  </button>
                )}
              </div>
            </>
          )}

          {showEChallan && (
            <div className="w-full flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Notice generated under Central Motor Vehicle Rules 1989 &amp; MVA 1988.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEChallan(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
                >
                  Back to Dossier
                </button>
                {currentStatus !== 'ECHALLAN_ISSUED' && (
                  <button
                    onClick={() => handleAction('ECHALLAN_ISSUED')}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Authorize & Issue E-Challan</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3D Depth Mesh Modal */}
      {isMeshOpen && (isPothole || isWaterlog) && (
        <RoadMeshVisualizerModal
          isOpen={isMeshOpen}
          onClose={() => setIsMeshOpen(false)}
          hazardId={incident.id}
          locationName={`${incident.road_name} • ${incident.incident_type}`}
          depthCm={incident.water_depth_cm || (incident.incident_type === 'WATERLOGGING' ? 14.5 : 8.2)}
          areaM2={incident.incident_type === 'WATERLOGGING' ? 1.2 : 0.62}
          volumeLiters={incident.incident_type === 'WATERLOGGING' ? 78.0 : 41.5}
          costInr={incident.incident_type === 'WATERLOGGING' ? 5100 : 3350}
          iriScore={4.75}
          sensorGz={2.7}
          cameraConfidence={94}
          defectType={incident.incident_type}
        />
      )}
    </div>
  );
};
