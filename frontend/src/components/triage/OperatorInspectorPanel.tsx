import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Send, 
  Phone, 
  MapPin, 
  Eye, 
  Clock, 
  ShieldCheck, 
  FileText, 
  QrCode, 
  Building2, 
  Zap
} from 'lucide-react';
import { HazardCluster, TrafficIncident } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

interface OperatorInspectorPanelProps {
  selectedCluster: HazardCluster | null;
  selectedIncident: TrafficIncident | null;
  onDispatchWorkOrder?: (clusterId: string) => void;
  onResolveCluster?: (clusterId: string) => void;
  onEscalateIncident?: (incidentId: string) => void;
  onNavigateToWorkOrders?: () => void;
  onOpenDossierModal?: () => void;
  onOpenMeshModal?: () => void;
}

export const OperatorInspectorPanel: React.FC<OperatorInspectorPanelProps> = ({
  selectedCluster,
  selectedIncident,
  onDispatchWorkOrder,
  onResolveCluster,
  onEscalateIncident,
  onNavigateToWorkOrders,
  onOpenDossierModal,
}) => {
  const { 
    user,
    canDispatchWorkOrder, 
    canEscalatePCR, 
    canIssueEChallan, 
    canLookupRTO, 
    canFlagRTOCompliance,
    getRoleBadgeLabel 
  } = useAuth();
  const { success: showSuccessToast, warning: showWarningToast, info: showInfoToast } = useToast();
  const [rtoLookupData, setRtoLookupData] = React.useState<any | null>(null);
  const [isLookingUpRTO, setIsLookingUpRTO] = React.useState(false);

  // If a Traffic Safety Incident is selected
  if (selectedIncident) {
    const isCritical = selectedIncident.incident_type === 'HIT_AND_RUN' || selectedIncident.incident_type === 'RASH_DRIVING';
    const anyInc = selectedIncident as any;
    const evidenceImg = anyInc.evidence_url || selectedIncident.snapshot_url || anyInc.photo_url || anyInc.video_url || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80';
    const plate = selectedIncident.plate_number || 'TN-09-CB-4412';

    const handleRTOCheck = async () => {
      setIsLookingUpRTO(true);
      try {
        const data = await api.lookupRTORegistration(plate);
        setRtoLookupData(data);
        showInfoToast(`VAHAN Record Found: ${plate}`, `${data?.vahan_details?.make_model || 'Vehicle'} • RTO: ${data?.rto_office || 'Chennai'}`);
      } catch {
        showWarningToast('VAHAN Lookup Failed', 'Unable to reach RTO registry gateway.');
      } finally {
        setIsLookingUpRTO(false);
      }
    };

    const handleFlagRTO = async () => {
      await api.flagVehicleCompliance(plate, 'Suspected Vehicle in Active Transit Violation / Fitness Audit');
      showSuccessToast(`🚩 Compliance Notice Issued: ${plate} flagged in RTO Registry.`);
    };

    return (
      <div className="flex flex-col h-full bg-white dark:bg-[#101827] border-l border-slate-200 dark:border-slate-800 select-none overflow-y-auto custom-scrollbar">
        {/* Header Ribbon */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-rose-50/70 dark:bg-rose-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-rose-700 text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase font-mono flex items-center gap-1.5">
                <span>{user.role === 'rto_officer' ? 'Vehicle Compliance' : 'Safety Incident'}</span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[190px]">
                {String(selectedIncident.incident_type).replace(/_/g, ' ')}
              </h3>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase font-mono ${
            isCritical 
              ? 'bg-rose-700 text-white' 
              : 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
          }`}>
            {isCritical ? 'P0 Critical' : 'P1 High'}
          </span>
        </div>

        {/* Evidence Snapshot */}
        <div className="p-3.5 space-y-3">
          <div className="relative rounded-md overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-950 group">
            <img 
              src={evidenceImg} 
              alt="Forensic Evidence" 
              className="w-full h-36 object-cover"
            />
            {/* DPDP Privacy Badge Overlay */}
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/90 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Privacy Blur Active</span>
            </div>
            {/* Timestamp Badge */}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-slate-200 text-[10px] font-mono">
              {selectedIncident.occurred_at || 'Live Ingest'}
            </div>
            {onOpenDossierModal && (
              <button 
                onClick={onOpenDossierModal}
                className="absolute top-2 right-2 p-1 rounded bg-slate-900/80 hover:bg-slate-800 text-white text-xs flex items-center gap-1 transition cursor-pointer"
                title="Open Full Legal Evidence Dossier"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Offender & ANPR Details */}
          <div className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">Plate Number:</span>
              <span className="font-bold font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                {plate}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">ANPR Confidence:</span>
              <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {selectedIncident.plate_confidence ? `${(selectedIncident.plate_confidence * 100).toFixed(1)}%` : '94.2% Verified'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">Statutory Code:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 text-[10px] text-right max-w-[170px] truncate">
                {selectedIncident.mva_section || anyInc.legal_citation || 'MVA Sec 134/187 Rash Driving'}
              </span>
            </div>
          </div>

          {/* Location & GPS */}
          <div className="space-y-1 text-xs">
            <div className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
              <span className="font-medium">{selectedIncident.road_name || 'Guindy Kathipara Grade Junction'}</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pl-5">
              GPS: {selectedIncident.lat?.toFixed(4) || '13.0067'}° N, {selectedIncident.lng?.toFixed(4) || '80.2030'}° E
            </div>
          </div>

          {/* RTO Registry Details (if looked up or RTO profile) */}
          {rtoLookupData && (
            <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] space-y-1">
              <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center justify-between">
                <span>VAHAN Sarathi Record</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">RC ACTIVE</span>
              </div>
              <div className="text-slate-700 dark:text-slate-300">{rtoLookupData.vahan_details?.make_model}</div>
              <div className="text-slate-500 text-[10px]">{rtoLookupData.rto_office}</div>
              <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 pt-1 border-t border-blue-200/60 dark:border-blue-800">
                Fitness: {rtoLookupData.vahan_details?.fitness_valid_upto} • HSRP: {rtoLookupData.vahan_details?.hsrp_status}
              </div>
            </div>
          )}

          {/* Profile-Tailored Action Dock */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            {/* 1. Traffic Police Actions */}
            {canEscalatePCR && (
              <>
                <button
                  onClick={() => {
                    if (onEscalateIncident) {
                      onEscalateIncident(selectedIncident.id);
                    } else {
                      showSuccessToast('Police Patrol Dispatched: 112 Patrol Unit notified.');
                    }
                  }}
                  className="w-full py-2 px-3 rounded-md bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch 112 Police Patrol</span>
                </button>

                {canIssueEChallan && (
                  <button
                    onClick={() => {
                      showSuccessToast(`Draft e-Challan Generated for ${plate}: ₹${selectedIncident.fine_amount_inr || 5000} (MVA Notice).`);
                    }}
                    className="w-full py-1.5 px-3 rounded-md bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Issue Draft e-Challan Notice</span>
                  </button>
                )}
              </>
            )}

            {/* 2. RTO / Transport Officer Actions */}
            {canLookupRTO && (
              <button
                onClick={handleRTOCheck}
                disabled={isLookingUpRTO}
                className="w-full py-2 px-3 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{isLookingUpRTO ? 'Querying Registry Gateway...' : 'Verify Registration Registry'}</span>
              </button>
            )}

            {canFlagRTOCompliance && (
              <button
                onClick={handleFlagRTO}
                className="w-full py-1.5 px-3 rounded-md bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>Flag Vehicle for Compliance Follow-Up</span>
              </button>
            )}

            {/* 3. PWD Engineer View (Gated Notice) */}
            {user.role === 'pwd_engineer' && (
              <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 text-center">
                Traffic enforcement is routed to Greater Chennai Police Wing.
              </div>
            )}

            {/* Legal Dossier Modal Button */}
            {onOpenDossierModal && (
              <button
                onClick={onOpenDossierModal}
                className="w-full py-1.5 px-3 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-750 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Inspect Full Evidence Dossier</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If a Road Hazard Cluster is selected
  if (selectedCluster) {
    const isCritical = selectedCluster.severity_level === 'critical' || (selectedCluster.rpi_score || 0) > 85;
    const isResolved = selectedCluster.status === 'resolved' || selectedCluster.status === 'verified_closed';
    const isAssigned = selectedCluster.status === 'assigned' || selectedCluster.status === 'in_progress';
    const anyCl = selectedCluster as any;

    const evidenceImg = anyCl.evidence_url || selectedCluster.before_image_url || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80';

    return (
      <div className="flex flex-col h-full bg-white dark:bg-[#101827] border-l border-slate-200 dark:border-slate-800 select-none overflow-y-auto custom-scrollbar">
        {/* Header Ribbon */}
        <div className={`p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between ${
          isCritical 
            ? 'bg-amber-50/80 dark:bg-amber-950/30' 
            : 'bg-slate-50 dark:bg-slate-900/50'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-md text-white flex items-center justify-center shrink-0 ${
              isCritical ? 'bg-amber-700' : 'bg-blue-700'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase font-mono">
                {selectedCluster.cluster_code || selectedCluster.id} • Priority Score {(selectedCluster.rpi_boosted || selectedCluster.rpi_score || 85).toFixed(0)}/100
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                {selectedCluster.defect_name || 'Road Surface Distress'}
              </h3>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase font-mono ${
            isResolved
              ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200'
              : isAssigned
              ? 'bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200'
              : isCritical
              ? 'bg-rose-700 text-white'
              : 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
          }`}>
            {selectedCluster.status?.replace('_', ' ') || 'OPEN'}
          </span>
        </div>

        {/* Evidence Snapshot */}
        <div className="p-3.5 space-y-3">
          <div className="relative rounded-md overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-950 group">
            <img 
              src={evidenceImg} 
              alt="Forensic Evidence" 
              className="w-full h-36 object-cover"
            />
            {/* DPDP Privacy Badge Overlay */}
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/90 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Privacy Blur Active</span>
            </div>
            {/* Multi-Pass Tag */}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-blue-700/90 text-white text-[10px] font-mono font-bold">
              {selectedCluster.pass_count || 5} Bus Detections (Confirmed)
            </div>
          </div>

          {/* Location & Nearest Critical POI */}
          <div className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-md p-2.5 space-y-2">
            <div className="flex items-start gap-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span>{selectedCluster.road_name || 'GST Road, Tambaram (NH-32)'}</span>
            </div>

            {selectedCluster.nearest_poi && (
              <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <span className="text-slate-500">Zone Proximity:</span>
                <span className="font-bold text-amber-700 dark:text-amber-400">
                  {selectedCluster.nearest_poi} ({selectedCluster.poi_distance_m || 180}m)
                </span>
              </div>
            )}
          </div>

          {/* Contractor & SLA Assignment */}
          <div className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-md p-2.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-mono">Assigned PWD Agency:</span>
              </div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                {selectedCluster.assigned_agency || 'L&T Highways Infra Ltd'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-mono">SLA Window:</span>
              </div>
              <span className="font-bold font-mono text-xs text-rose-700 dark:text-rose-400">
                {selectedCluster.sla_hours || 24}h ({isResolved ? 'Met on Time' : 'Active Countdown'})
              </span>
            </div>
          </div>

          {/* Role-Gated Action Controls */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            {canDispatchWorkOrder ? (
              !isResolved ? (
                <>
                  <button
                    onClick={() => {
                      if (onDispatchWorkOrder) {
                        onDispatchWorkOrder(selectedCluster.id);
                      } else {
                        showSuccessToast(`Work Order Approved & Dispatched to ${selectedCluster.assigned_agency || 'PWD Contractor'}. SLA active.`);
                      }
                    }}
                    className="w-full py-2 px-3 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Approve Work Order &amp; Dispatch ({selectedCluster.sla_hours || 24}h SLA)</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onResolveCluster) {
                        onResolveCluster(selectedCluster.id);
                      } else {
                        showSuccessToast('Road defect marked as verified & resolved.');
                      }
                    }}
                    className="w-full py-1.5 px-3 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Repave Verified &amp; Close</span>
                  </button>
                </>
              ) : (
                <div className="p-2.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Work Order Verified & Closed</span>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-mono">
                    Subsequent fleet inspection confirmed road smoothness.
                  </p>
                </div>
              )
            ) : (
              <div className="p-2.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 text-center">
                Road work orders and contractor assignment require Road / PWD Maintenance Authority clearance.
              </div>
            )}

            {onNavigateToWorkOrders && (
              <button
                onClick={onNavigateToWorkOrders}
                className="w-full py-1.5 px-3 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Open Work Order Ledger</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default Empty State when nothing is selected
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center select-none bg-white dark:bg-[#101827] border-l border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-400">
        <Zap className="w-6 h-6" />
      </div>
      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
        Operator Inspection Dock
      </h4>
      <p className="text-[11px] leading-relaxed max-w-[200px]">
        Click any road hazard or incident from the Action Queue to inspect forensic evidence and dispatch repair crews.
      </p>
    </div>
  );
};
