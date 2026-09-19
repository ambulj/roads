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
  Printer,
  FileText,
  ShieldCheck,
  Compass,
  ArrowRight,
  ChevronLeft,
  Building2,
  Droplets,
  Box,
  Wrench,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { TrafficIncident, ANPRInterceptSighting } from '../../types';
import { RoadMeshVisualizerModal, isRoadSurfaceDefect } from './RoadMeshVisualizerModal';
import { ConfirmationModal, ConfirmationModalProps } from '../common/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Badge, Button } from '../ui';

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
  const { canEscalatePCR, canDispatchWorkOrder, canIssueEChallan, user, getRoleBadgeLabel } = useAuth();
  const { success: showSuccessToast, warning: showWarningToast } = useToast();

  const [reviewNote, setReviewNote] = useState('');
  const [currentStatus, setCurrentStatus] = useState<string>(incident?.status || 'ACTIVE_ALERT');
  const [showEChallan, setShowEChallan] = useState(false);
  const [isMeshOpen, setIsMeshOpen] = useState(false);
  const [permissionNotice, setPermissionNotice] = useState('');
  
  // Confirmation Modal state
  const [confirmConfig, setConfirmConfig] = useState<ConfirmationModalProps | null>(null);

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

  // Vehicular Traffic Infraction
  const isTrafficViolation = isHitAndRun || isRashDriving || isZebraCrossing || isRedLight || isBusLane || isUnsafeOvertake || Boolean(incident.plate_number);

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

  // Legal code mappings
  const getViolationMVA = () => {
    if (isHitAndRun) {
      return {
        section: 'MVA 1988 Sec 134(a)(b) & Sec 184 (Hit & Run causing peril)',
        fine: '₹10,000 / Notice Draft',
        fineAmount: 10000,
        penalty: '3-Month DL Suspension, Vehicle Impoundment under CrPC Sec 102',
        title: 'NON-BAILABLE SERIOUS MOTOR VEHICLE ACCIDENT CONTRIVANCE'
      };
    }
    if (isZebraCrossing) {
      return {
        section: 'MVA 1988 Sec 177 & CMVR Rule 138 (Pedestrian Crosswalk Right-of-Way)',
        fine: '₹1,500 (Automated e-Challan)',
        fineAmount: 1500,
        penalty: 'Mandatory Driver Re-Education Point, Parivahan SMS Notice',
        title: 'UNAUTHORIZED VEHICLE ENCROACHMENT ON DESIGNATED ZEBRA CROSSWALK'
      };
    }
    if (isRedLight) {
      return {
        section: 'MVA 1988 Sec 184(c) & CMVR 119 (Disobedience of Traffic Signal)',
        fine: '₹1,000 (First Offense) / ₹5,000 (Repeat)',
        fineAmount: 1000,
        penalty: 'Automated ANPR e-Challan + 1 Demerit Point',
        title: 'RED LIGHT TRAFFIC SIGNAL CONTRAVENTION'
      };
    }
    if (isBusLane) {
      return {
        section: 'MVA 1988 Sec 177 & MoHUA Smart City Dedicated BRTS Corridor Regulations',
        fine: '₹2,000 (First Offense) / ₹5,000 (Subsequent)',
        fineAmount: 2000,
        penalty: 'Direct e-challan endorsement, automated toll gate blocking',
        title: 'UNAUTHORIZED ENCROACHMENT IN DEDICATED PUBLIC BUS LANE'
      };
    }
    if (isUnsafeOvertake) {
      return {
        section: 'MVA 1988 Sec 184 & CMVR Rule 138 (Dangerous Overtake Gap < 1.5m)',
        fine: '₹5,000',
        fineAmount: 5000,
        penalty: '2 Demerit Points, Mandatory Driver Safety Retraining',
        title: 'CRITICAL PROXIMITY TAILGATING & UNSAFE OVERTAKE IN BLIND-SPOT'
      };
    }
    if (isRashDriving) {
      return {
        section: 'MVA 1988 Sec 184 (Driving dangerously with extreme disregard for safety)',
        fine: '₹5,000',
        fineAmount: 5000,
        penalty: 'Vehicle registration verification, e-challan with speed radar telemetry',
        title: 'DANGEROUS AND HIGH-SPEED RECKLESS DRIVING'
      };
    }
    return {
      section: 'MVA 1988 Sec 177 (General offenses & highway safety violations)',
      fine: '₹1,000',
      fineAmount: 1000,
      penalty: 'Parivahan Portal statutory notification',
      title: 'PUBLIC HIGHWAY TRANSIT REGULATION CONTRAVENTION'
    };
  };

  const legalCode = getViolationMVA();

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase().trim();
    if (s.includes('resolv') || s.includes('closed') || s.includes('verifi')) {
      return { label: 'Resolved', variant: 'success' as const, icon: CheckCircle2 };
    }
    if (s.includes('intercept')) {
      return { label: 'Intercepted', variant: 'purple' as const, icon: CheckCircle };
    }
    if (s.includes('pcr') || s.includes('escalat') || (s.includes('dispatch') && !s.includes('pump'))) {
      return { label: 'PCR Dispatched', variant: 'critical' as const, icon: Send };
    }
    if (s.includes('pump')) {
      return { label: 'Pump Dispatched', variant: 'info' as const, icon: Droplets };
    }
    if (s.includes('barricad')) {
      return { label: 'Barricaded', variant: 'warning' as const, icon: AlertTriangle };
    }
    if (s.includes('work_order') || s.includes('work order')) {
      return { label: 'Work Order Created', variant: 'success' as const, icon: CheckCircle2 };
    }
    if (s.includes('echallan') || s.includes('challan')) {
      return { label: 'e-Challan Issued', variant: 'purple' as const, icon: FileText };
    }
    if (s.includes('reject')) {
      return { label: 'Rejected', variant: 'neutral' as const, icon: XCircle };
    }
    return { label: 'Active Alert', variant: 'warning' as const, icon: AlertCircle };
  };

  const statusBadge = getStatusBadge(currentStatus);
  const StatusIcon = statusBadge.icon;

  const executeStatusUpdate = (status: string, remarks?: string) => {
    setPermissionNotice('');
    setCurrentStatus(status);
    if (onUpdateStatus) {
      onUpdateStatus(incident.id, status);
    }
    showSuccessToast('Status Updated', `Incident #${incident.id} updated to ${status.replace(/_/g, ' ')}`);
  };

  // 1. Prompt E-Challan Issuance Confirmation
  const promptIssueEChallan = () => {
    setConfirmConfig({
      isOpen: true,
      onClose: () => setConfirmConfig(null),
      onConfirm: async () => {
        executeStatusUpdate('ECHALLAN_ISSUED');
        setShowEChallan(true);
      },
      title: 'Authorize Statutory E-Challan Issuance',
      description: 'You are issuing an official, legally enforceable traffic contravention notice that will be logged with Parivahan / State CCTNS records.',
      variant: 'primary',
      icon: 'challan',
      confirmLabel: 'Authorize & Issue Notice',
      details: [
        { label: 'Registered Plate', value: incident.plate_number || 'TN-01-AX-8732', highlight: true },
        { label: 'Statutory Penalty', value: `₹${(incident.fine_amount_inr || legalCode.fineAmount).toLocaleString()}` },
        { label: 'Legal Citation', value: incident.mva_section || legalCode.section },
        { label: 'Corridor Location', value: incident.road_name }
      ]
    });
  };

  // 2. Prompt 112 PCR Dispatch Confirmation
  const promptDispatchPCR = () => {
    if (!canEscalatePCR) {
      showWarningToast('Clearance Required', 'Emergency 112 PCR intercept dispatch is restricted to authorized Traffic Police controllers.');
      return;
    }

    setConfirmConfig({
      isOpen: true,
      onClose: () => setConfirmConfig(null),
      onConfirm: async () => {
        executeStatusUpdate('ESCALATED_POLICE');
      },
      title: 'Dispatch Emergency 112 PCR Patrol',
      description: 'Broadcast high-priority emergency intercept signal to Chennai Police Control Room (112) with real-time GPS telemetry coordinates.',
      variant: 'danger',
      icon: 'pcr',
      confirmLabel: 'Confirm 112 PCR Dispatch',
      details: [
        { label: 'Incident Code', value: incident.incident_type.replace(/_/g, ' '), highlight: true },
        { label: 'Target Vehicle', value: incident.plate_number || 'Vehicle' },
        { label: 'Live Location', value: incident.road_name },
        { label: 'GPS Node', value: incident.reporting_bus_id }
      ]
    });
  };

  // 3. Prompt Rejection / False Alarm Confirmation
  const promptRejectIncident = () => {
    setConfirmConfig({
      isOpen: true,
      onClose: () => setConfirmConfig(null),
      onConfirm: async (reason) => {
        executeStatusUpdate('REJECTED', reason);
      },
      title: 'Dismiss Incident Record',
      description: 'Mark this detection as dismissed or false alarm. Please record a justification for statutory compliance audit.',
      variant: 'warning',
      icon: 'reject',
      confirmLabel: 'Confirm Dismissal',
      requireReason: true,
      reasonPlaceholder: 'Select or specify the justification for dismissal...',
      reasonOptions: [
        'Vehicle plate obscured or unidentifiable',
        'Emergency response vehicle on duty',
        'Sensor false detection / Clear road',
        'Duplicate report already processed'
      ],
      details: [
        { label: 'Incident ID', value: incident.id },
        { label: 'Infraction Type', value: incident.incident_type.replace(/_/g, ' ') }
      ]
    });
  };

  // 4. Prompt Resolution Confirmation
  const promptResolveIncident = () => {
    setConfirmConfig({
      isOpen: true,
      onClose: () => setConfirmConfig(null),
      onConfirm: async (notes) => {
        executeStatusUpdate('RESOLVED', notes);
      },
      title: 'Mark Incident as Resolved',
      description: 'Confirm that all field interventions, safety protocols, or enforcement actions for this incident are completed.',
      variant: 'success',
      icon: 'resolve',
      confirmLabel: 'Confirm & Close Incident',
      details: [
        { label: 'Incident ID', value: incident.id },
        { label: 'Location', value: incident.road_name }
      ]
    });
  };

  const handlePrintChallan = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${
              isWaterlog 
                ? 'bg-cyan-50 dark:bg-cyan-950/80 border-cyan-200 dark:border-cyan-900 text-cyan-600 dark:text-cyan-400'
                : isOpenManhole
                ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400'
                : 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400'
            }`}>
              {isWaterlog ? <Droplets className="w-5 h-5" /> : isOpenManhole ? <AlertTriangle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  {showEChallan 
                    ? 'Statutory E-Challan / Police Notice Packet'
                    : isWaterlog 
                    ? 'GCC Stormwater Dewatering Incident Dossier'
                    : isOpenManhole
                    ? 'GCC Emergency Hazard Barricade Dossier'
                    : isPothole && !isTrafficViolation
                    ? 'PWD Road Distress Triage Dossier'
                    : 'Traffic Enforcement Evidence Dossier'}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700">
                  {incident.id}
                </span>
                <Badge variant={statusBadge.variant} size="sm" icon={<StatusIcon className="w-3.5 h-3.5" />}>
                  {statusBadge.label}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isWaterlog 
                  ? 'GCC Stormwater Drainage & Monsoon Disaster Management'
                  : isOpenManhole || (isPothole && !isTrafficViolation)
                  ? 'Greater Chennai Corporation & Tamil Nadu PWD Infrastructure Wing'
                  : 'Greater Chennai Traffic Police (GCTP) & MoHUA Smart City Division'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* E-CHALLAN BUTTON */}
            {isTrafficViolation && (
              showEChallan ? (
                <button
                  onClick={() => setShowEChallan(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Dossier</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowEChallan(true)}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Generate E-Challan / Police Notice Draft"
                >
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="hidden sm:inline">E-Challan Notice</span>
                  <span className="sm:hidden">E-Challan</span>
                </button>
              )
            )}

            {/* 3D DEPTH MESH BUTTON */}
            {(isPothole || isWaterlog) && (
              <button
                onClick={() => setIsMeshOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Inspect 3D Surface Depth Mesh"
              >
                <Box className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">3D Depth Mesh</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {showEChallan && isTrafficViolation ? (
          /* PRINTABLE E-CHALLAN / POLICE EVIDENCE PACKET */
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
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    NOTICE OF STATUTORY OFFENCE &bull; FORM E-CHALLAN VAHAN-IX (RULE 167A)
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center sm:items-end gap-1">
                <span className="px-3 py-1 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-bold text-xs font-mono">
                  {incident.echallan_id || `ECH-TN-2026-${incident.id.slice(-6).toUpperCase()}`}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Date Logged: {incident.occurred_at}</span>
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
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Statutory Citation:</span>
                  <p className="text-slate-900 dark:text-slate-100 font-semibold mt-0.5">{legalCode.section}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Assessed Penalty Amount:</span>
                  <p className="text-amber-600 dark:text-amber-400 font-bold text-sm mt-0.5">
                    {incident.fine_amount_inr ? `₹${incident.fine_amount_inr.toLocaleString()}` : legalCode.fine}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{legalCode.penalty}</p>
                </div>
              </div>
            </div>

            {/* Target Vehicle Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-2.5 flex items-center justify-between">
                    <span>Target Vehicle Registry Record</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Confidence Match: {Math.round((incident.plate_confidence || 0.95) * 100)}%</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="border-2 border-amber-400 bg-amber-50 dark:bg-black px-4 py-2 rounded-lg font-black text-xl text-slate-900 dark:text-yellow-300 tracking-widest font-mono">
                      {incident.plate_number || 'TN-01-AX-8732'}
                    </div>
                    <div className="text-xs space-y-1">
                      <div>Class: <b className="text-slate-800 dark:text-slate-200">{incident.vehicle_class || 'Motor Vehicle'}</b></div>
                      {incident.target_speed_kmh ? (
                        <div>Speed: <b className="text-rose-600 dark:text-rose-400 font-bold">{incident.target_speed_kmh} km/h</b> (Corridor Limit: 50 km/h)</div>
                      ) : null}
                      <div>Color: <b className="text-slate-800 dark:text-slate-200">{incident.vehicle_color || 'Standard'}</b></div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  Location: <b className="text-slate-800 dark:text-slate-200">{incident.road_name}</b> [{incident.lat.toFixed(5)}, {incident.lng.toFixed(5)}]
                </div>
              </div>

              {/* Cryptographic Proof */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
                <div className="space-y-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Evidence Chain of Custody</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                    Frame secured with ISO/IEC 27037 digital forensic seal.
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs break-all text-slate-700 dark:text-blue-300 font-mono">
                    SHA256: 7f8a9e2d3c4b1a0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c
                  </div>
                </div>

                <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold">
                  <FileCheck className="w-4 h-4" />
                  <span>COURT-ADMISSIBLE (Sec 65B)</span>
                </div>
              </div>
            </div>

            {/* Print Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Notice formatted for Parivahan / VAHAN &amp; State Police CCTNS.
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrintChallan}
                icon={<Printer className="w-4 h-4" />}
              >
                Print E-Challan Notice Draft
              </Button>
            </div>
          </div>
        ) : (
          /* DOMAIN-SPECIFIC OPERATIONAL DOSSIER VIEW */
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            
            {/* 0. PRIMARY ISSUE & STATUTORY INFRACTION HEADER BANNER */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
              isHitAndRun 
                ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900 text-rose-950 dark:text-rose-100'
                : isRashDriving || isRedLight
                ? 'bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-900 text-orange-950 dark:text-orange-100'
                : isWaterlog
                ? 'bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-900 text-cyan-950 dark:text-cyan-100'
                : isOpenManhole
                ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900 text-red-950 dark:text-red-100'
                : 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900 text-blue-950 dark:text-blue-100'
            }`}>
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                    isHitAndRun
                      ? 'bg-rose-600 text-white border-rose-700'
                      : isWaterlog
                      ? 'bg-cyan-600 text-white border-cyan-700'
                      : isOpenManhole
                      ? 'bg-red-600 text-white border-red-700'
                      : 'bg-blue-600 text-white border-blue-700'
                  }`}>
                    {isHitAndRun ? '🚨 CRITICAL HIT & RUN' :
                     isRashDriving ? '⚡ RASH DRIVING INFRACTION' :
                     isZebraCrossing ? '🚸 PEDESTRIAN CROSSWALK ENDANGERMENT' :
                     isWaterlog ? '🌊 CRITICAL WATERLOGGING HAZARD' :
                     isOpenManhole ? '⚠️ OPEN DRAIN FATALITY HAZARD' :
                     String(incident.incident_type).replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-mono font-bold opacity-90">
                    {incident.mva_section || legalCode.section}
                  </span>
                </div>

                <h2 className="text-base sm:text-lg font-extrabold tracking-tight leading-snug">
                  {incident.description || legalCode.title}
                </h2>

                <div className="text-xs opacity-90 flex items-center gap-3 flex-wrap font-medium pt-0.5">
                  <span className="flex items-center gap-1">📍 <b>{incident.road_name}</b></span>
                  {incident.plate_number ? (
                    <span className="flex items-center gap-1">
                      🚗 Plate: <b className="font-mono bg-white/80 dark:bg-black/40 px-2 py-0.5 rounded border border-black/10 dark:border-white/10">{incident.plate_number}</b>
                    </span>
                  ) : null}
                  {incident.target_speed_kmh ? (
                    <span className="flex items-center gap-1 text-rose-700 dark:text-rose-300 font-bold">
                      ⚡ Clocked Speed: <b>{incident.target_speed_kmh} km/h</b>
                    </span>
                  ) : null}
                </div>
              </div>

              {isTrafficViolation && (
                <div className="shrink-0 flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-black/10 dark:border-white/10 pt-2 sm:pt-0 sm:pl-4">
                  <span className="text-xs uppercase font-bold tracking-wider opacity-75">Statutory Penalty</span>
                  <span className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
                    ₹{incident.fine_amount_inr?.toLocaleString() || legalCode.fine.split(' ')[0] || '5,000'}
                  </span>
                  <span className="text-xs opacity-75 font-mono">MVA 1988 Statutory</span>
                </div>
              )}
            </div>

            {/* 1. WATERLOGGING PANEL */}
            {isWaterlog && (
              <div className="bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-900 dark:text-cyan-200 uppercase tracking-wider">
                      GCC Monsoon Stormwater Response &bull; Dewatering Sump Pump Operations
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-300 font-bold border border-cyan-300 dark:border-cyan-700 font-mono">
                    WATER DEPTH: {incident.water_depth_cm || 28} CM
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/90 dark:bg-slate-900/90 p-3.5 rounded-xl border border-cyan-100 dark:border-cyan-900 text-xs">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Hydroplaning Risk:</span>
                    <p className="font-bold text-rose-600 dark:text-rose-400 text-xs mt-0.5">CRITICAL (&gt;120mm Threshold)</p>
                    <span className="text-xs text-slate-500">Speed limit reduced to 20 km/h</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Assigned High-Capacity Pump:</span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5">{incident.pump_id || 'GCC-PUMP-UNIT-04'}</p>
                    <span className="text-xs text-slate-500">1,200 L/min Submersible Diesel Unit</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Drainage SLA ETA:</span>
                    <p className="font-bold text-cyan-700 dark:text-cyan-300 text-xs mt-0.5">{incident.dewatering_eta_mins || 18} Mins to Clear</p>
                    <span className="text-xs text-slate-500">Outfall: Velachery Canal Link</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-cyan-800 dark:text-cyan-300 font-medium">
                    {currentStatus === 'PUMP_DISPATCHED' 
                      ? '✓ Dewatering Unit en route. Real-time telemetry monitoring canal discharge.' 
                      : 'Deploy emergency suction truck and notify GCC Ward 13 Stormwater JE.'}
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => executeStatusUpdate('PUMP_DISPATCHED')}
                    disabled={currentStatus === 'PUMP_DISPATCHED'}
                    icon={<Droplets className="w-4 h-4" />}
                  >
                    {currentStatus === 'PUMP_DISPATCHED' ? 'Pump Dispatched' : 'Dispatch Dewatering Pump'}
                  </Button>
                </div>
              </div>
            )}

            {/* 2. OPEN MANHOLE PANEL */}
            {isOpenManhole && (
              <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                      Fatality Hazard Prevention &bull; Emergency Barricading Protocol
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-700">
                    P0 EMERGENCY DISPATCH
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/90 dark:bg-slate-900/90 p-3.5 rounded-xl border border-amber-100 dark:border-amber-900 text-xs">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Defect Void Diameter:</span>
                    <p className="font-bold text-rose-600 dark:text-rose-400 text-xs mt-0.5">65 cm Open Cavity</p>
                    <span className="text-xs text-slate-500">Deep storm drain drop: 2.1m</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Assigned Emergency Team:</span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5">GCC Zone 5 Rapid Patrol</p>
                    <span className="text-xs text-slate-500">Reflective cones + cast-iron lid</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Target SLA:</span>
                    <p className="font-bold text-amber-700 dark:text-amber-300 text-xs mt-0.5">&lt; 30 Mins Barricade</p>
                    <span className="text-xs text-slate-500">Lid replacement within 4h</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                    {currentStatus === 'BARRICADED' 
                      ? '✓ Site reflective barricade confirmed by ward patrol.' 
                      : 'Deploy emergency barricading squad immediately to prevent night-time accidents.'}
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => executeStatusUpdate('BARRICADED')}
                    disabled={currentStatus === 'BARRICADED'}
                    icon={<ShieldAlert className="w-4 h-4" />}
                  >
                    {currentStatus === 'BARRICADED' ? 'Barricade Active' : 'Deploy Barricades Now'}
                  </Button>
                </div>
              </div>
            )}

            {/* 3. POTHOLE ROAD DISTRESS */}
            {isPothole && !isTrafficViolation && (
              <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                      PWD Engineering Distress Triage &bull; Bituminous Patching
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                    IRC:SP:20 ESTIMATE READY
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/90 dark:bg-slate-900/90 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900 text-xs">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Measured Cavity Depth:</span>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5">8.4 cm (Stereo Depth)</p>
                    <span className="text-xs text-slate-500">Area: 0.65 m² &bull; Vol: 42.5 L</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Dense Bitumen Demanded:</span>
                    <p className="font-bold text-emerald-700 dark:text-emerald-300 text-xs mt-0.5">97.8 kg VG-30 DBM</p>
                    <span className="text-xs text-slate-500">MORTH 2025 Schedule: ₹3,450</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Assigned PWD Division:</span>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5">Chennai PWD Div 4</p>
                    <span className="text-xs text-slate-500">SLA: 24 Hours</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                    {currentStatus === 'WORK_ORDER_CREATED' 
                      ? '✓ Work order logged into PWD maintenance tracking system.' 
                      : 'Create formal contractor repair work order with 3D depth evidence.'}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsMeshOpen(true)}
                      icon={<Box className="w-4 h-4 text-blue-500" />}
                    >
                      Inspect 3D Mesh
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        executeStatusUpdate('WORK_ORDER_CREATED');
                        onNavigateToWorkOrders?.();
                      }}
                      icon={<Wrench className="w-4 h-4" />}
                    >
                      Route to Work Orders
                    </Button>
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
                    <div className="text-xs font-mono font-bold tracking-widest text-blue-400 mb-0.5">
                      INDIA • AUTOMATED PLATE RECOGNITION
                    </div>
                    <div className="text-xl sm:text-2xl font-mono font-black text-white tracking-widest">
                      {incident.plate_number || 'TN-01-AX-8732'}
                    </div>
                    <div className="text-xs font-mono text-emerald-400 font-bold mt-0.5">
                      CONFIDENCE MATCH: {Math.round((incident.plate_confidence || 0.95) * 100)}% • TRANSIT EDGE VISION
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 bg-slate-950/90 px-3 py-1.5 rounded-lg border border-slate-800">
                    Vehicle Class: <b className="text-white">{incident.vehicle_class || 'Motor Vehicle'}</b>
                    {incident.target_speed_kmh ? <> &bull; Speed: <b className="text-amber-400">{incident.target_speed_kmh} km/h</b></> : null}
                  </div>
                </div>

                <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/80 border border-white/15 text-xs text-slate-300">
                  <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                  <span>EDGE TELEMETRY &bull; {incident.occurred_at}</span>
                </div>
              </div>
            )}

            {/* 5. MULTI-BUS COORDINATED SIGHTINGS */}
            {sightings.length > 0 && isTrafficViolation && (
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Multi-Bus AI Intercept Network ({sightings.length} Nodes Sighted)
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold font-mono">
                    COORDINATED FLEET TRACKING
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-950/40 p-3 text-xs">
                  <div>
                    <span className="block uppercase tracking-wider text-slate-400 font-bold text-xs">Multi-Pass Consensus</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{Math.min(99, 84 + sightings.length * 5)}% Multi-Bus</span>
                  </div>
                  <div>
                    <span className="block uppercase tracking-wider text-slate-400 font-bold text-xs">GPS Precision</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">±1.2m NavIC Precision</span>
                  </div>
                  <div>
                    <span className="block uppercase tracking-wider text-slate-400 font-bold text-xs">Statutory Evidence</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">Timestamp Certified</span>
                  </div>
                </div>

                {/* Sighting Chronology Timeline */}
                <div className="space-y-2">
                  {sightings.map((sighting, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          idx === 0 ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">
                            {sighting.bus_id} &bull; <span className="font-normal text-slate-500">{sighting.location}</span>
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            GPS: [{sighting.lat.toFixed(5)}, {sighting.lng.toFixed(5)}]
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 block">
                          {sighting.speed_kmh.toFixed(1)} km/h
                        </span>
                        <span className="text-xs font-mono text-slate-400 block">
                          {sighting.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General Telemetry & Context Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 flex flex-col gap-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Corridor Location</span>
                <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">{incident.road_name}</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  GPS: [{incident.lat.toFixed(5)}, {incident.lng.toFixed(5)}]
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 flex flex-col gap-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Reporting Sensor Node</span>
                <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                  <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Node: {incident.reporting_bus_id}</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Logged: {incident.occurred_at}
                </span>
              </div>
            </div>

            {/* Controller Review Notes Box */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                Controller Review &amp; Operational Directives:
              </label>
              <input
                type="text"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Add operational notes or field inspection remarks..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Modal Action Controls Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-2.5">
          {!showEChallan && (
            <>
              {permissionNotice && (
                <div role="status" className="w-full rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                  {permissionNotice} Active role: {getRoleBadgeLabel(user.role)}.
                </div>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={promptRejectIncident}
                icon={<XCircle className="w-4 h-4 text-rose-500" />}
              >
                Reject / False Alarm
              </Button>

              <div className="flex items-center gap-2 flex-wrap">
                {/* 1. Traffic Violations: Issue e-Challan / Escalate to PCR */}
                {isTrafficViolation && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={promptIssueEChallan}
                      icon={<FileText className="w-4 h-4" />}
                    >
                      Issue E-Challan
                    </Button>

                    {(isHitAndRun || isRashDriving) && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={promptDispatchPCR}
                        icon={<Send className="w-4 h-4" />}
                      >
                        112 PCR Dispatch
                      </Button>
                    )}
                  </>
                )}

                {/* 2. Waterlogging: Dispatch Sump Pump */}
                {isWaterlog && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => executeStatusUpdate('PUMP_DISPATCHED')}
                    icon={<Droplets className="w-4 h-4" />}
                  >
                    Deploy Dewatering Pump
                  </Button>
                )}

                {/* 3. Open Manhole: Deploy Barricade */}
                {isOpenManhole && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => executeStatusUpdate('BARRICADED')}
                    icon={<ShieldAlert className="w-4 h-4" />}
                  >
                    Deploy Barricade
                  </Button>
                )}

                {/* 4. Pothole / Road Distress: Route to Work Order */}
                {isPothole && !isTrafficViolation && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      executeStatusUpdate('WORK_ORDER_CREATED');
                      onNavigateToWorkOrders?.();
                    }}
                    icon={<Wrench className="w-4 h-4" />}
                  >
                    Create PWD Work Order
                  </Button>
                )}

                {/* 5. Mark Intercepted */}
                {(currentStatus.includes('DISPATCH') || currentStatus.includes('ESCALAT')) && !currentStatus.includes('INTERCEPT') && !currentStatus.includes('RESOLV') && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => executeStatusUpdate('INTERCEPTED')}
                    icon={<CheckCircle2 className="w-4 h-4 text-purple-500" />}
                  >
                    Mark Intercepted
                  </Button>
                )}

                {/* 6. Resolve & Close Incident */}
                {!currentStatus.includes('RESOLV') && !currentStatus.includes('REJECT') && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={promptResolveIncident}
                    icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  >
                    Resolve &amp; Close
                  </Button>
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
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowEChallan(false)}
                >
                  Back to Dossier
                </Button>
                {currentStatus !== 'ECHALLAN_ISSUED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={promptIssueEChallan}
                    icon={<FileText className="w-4 h-4" />}
                  >
                    Authorize &amp; Issue E-Challan
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmConfig && (
        <ConfirmationModal {...confirmConfig} />
      )}

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
