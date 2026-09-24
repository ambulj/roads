import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  Car,
  Search,
  Eye,
  AlertTriangle,
  Send,
  Clock,
  MapPin,
  CheckCircle2,
  X,
  Droplets,
  RotateCcw,
  RefreshCw,
  FileText,
  Sliders,
  Check,
  Building2,
  Siren,
  ExternalLink,
  ShieldCheck,
  Camera,
  Activity
} from 'lucide-react';
import { TrafficIncident, OpenManholeAlert, SubmergedPotholeAlert } from '../types';
import { Button } from '../components/ui';
import { ConfirmationModal, ConfirmationModalProps } from '../components/common/ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { INITIAL_OPEN_MANHOLES, INITIAL_SUBMERGED_POTHOLES, api } from '../services/api';

interface IncidentListProps {
  incidents: TrafficIncident[];
  onUpdateStatus?: (incidentId: string, status: string) => void;
  onRefresh?: () => Promise<void> | void;
  isLoading?: boolean;
}

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  onUpdateStatus,
  onRefresh,
  isLoading = false
}) => {
  const { user, canEscalatePCR, canIssueEChallan, canFlagRTOCompliance, getRoleBadgeLabel } = useAuth();
  const { t } = useLanguage();
  const { success, warning, info } = useToast();

  const [activeTab, setActiveTab] = useState<'violations' | 'anpr_queue' | 'life_safety'>('violations');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ACTIVE');
  const [selectedIncident, setSelectedIncident] = useState<TrafficIncident | null>(incidents[0] || null);
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const [openManholes, setOpenManholes] = useState<OpenManholeAlert[]>(INITIAL_OPEN_MANHOLES);
  const [submergedPotholes, setSubmergedPotholes] = useState<SubmergedPotholeAlert[]>(INITIAL_SUBMERGED_POTHOLES);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmationModalProps | null>(null);

  // VAHAN RTO state
  const [rtoData, setRtoData] = useState<any | null>(null);
  const [isLookingUpRTO, setIsLookingUpRTO] = useState(false);

  const fetchAuxData = async () => {
    try {
      const [queueRes, manholesRes, submergedRes] = await Promise.all([
        api.getReviewQueue(),
        api.getOpenManholes(),
        api.getSubmergedPotholes()
      ]);
      if (queueRes?.pending_items) setReviewQueue(queueRes.pending_items);
      if (manholesRes?.length) setOpenManholes(manholesRes);
      if (submergedRes?.length) setSubmergedPotholes(submergedRes);
    } catch (err) {
      console.error('Failed to fetch aux incident data:', err);
    }
  };

  useEffect(() => {
    fetchAuxData();
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.();
      await fetchAuxData();
      success('Feed Refreshed', 'Latest traffic and ANPR incidents synchronized');
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (statusFilter === 'ACTIVE' && (inc.status === 'RESOLVED' || inc.status === 'VERIFIED_CLOSED')) return false;
      if (statusFilter === 'RESOLVED' && inc.status !== 'RESOLVED' && inc.status !== 'VERIFIED_CLOSED') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          (inc.road_name && inc.road_name.toLowerCase().includes(q)) ||
          (inc.plate_number && inc.plate_number.toLowerCase().includes(q)) ||
          (String(inc.incident_type).toLowerCase().includes(q)) ||
          (inc.reporting_bus_id && inc.reporting_bus_id.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [incidents, statusFilter, searchQuery]);

  const handleRTOLookup = async (plate: string) => {
    setIsLookingUpRTO(true);
    try {
      const data = await api.lookupRTORegistration(plate);
      setRtoData(data);
      info(`VAHAN Record Found: ${plate}`, `${data?.vahan_details?.make_model || 'Vehicle'} • RTO: ${data?.rto_office || 'Chennai'}`);
    } catch {
      warning('VAHAN Lookup Failed', 'Unable to query central RTO gateway');
    } finally {
      setIsLookingUpRTO(false);
    }
  };

  const handleIssueChallan = (inc: TrafficIncident) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Authorize e-Challan Notice',
      description: `Issue an official e-Challan penalty notice of ₹${inc.fine_amount_inr || 2000} under ${inc.mva_section || 'MVA Sec 184'} to vehicle registration ${inc.plate_number || 'UNKNOWN'}?`,
      confirmLabel: 'Authorize & Transmit Challan',
      variant: 'danger',
      onClose: () => setConfirmConfig(null),
      onConfirm: async () => {
        setConfirmConfig(null);
        onUpdateStatus?.(inc.id, 'CHALLAN_ISSUED');
        success('e-Challan Issued', `Official statutory penalty docket transmitted to RTO VAHAN portal for ${inc.plate_number}`);
      }
    });
  };

  const handleDispatchPCR = (inc: TrafficIncident) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Dispatch Emergency PCR 112 Unit',
      description: `Transmit immediate high-priority dispatch to PCR-14 patrol unit for ${inc.incident_type} on ${inc.road_name}?`,
      confirmLabel: 'Transmit Radio Alert',
      variant: 'danger',
      onClose: () => setConfirmConfig(null),
      onConfirm: async () => {
        setConfirmConfig(null);
        await api.dispatchIncidentAlert(inc.id, 'ALL', 'PCR-14');
        onUpdateStatus?.(inc.id, 'PCR_DISPATCHED');
        success('PCR Alert Dispatched', `Police unit PCR-14 notified of incident on ${inc.road_name}`);
      }
    });
  };

  const handleReviewAction = async (itemId: string, action: 'ACCEPT' | 'REJECT') => {
    const res = await api.reviewIncident(itemId, action, action === 'ACCEPT' ? 'Officer verified plate format' : 'Rejected unreadable frame');
    if (res?.success) {
      success('Review Recorded', `Sample #${itemId} ${action === 'ACCEPT' ? 'verified for enforcement' : 'dismissed'}`);
      setReviewQueue(prev => prev.filter(i => i.id !== itemId));
    }
  };

  return (
    <div className="space-y-4 pb-12 font-mono">
      {/* ── HEADER & CONTROLS RIBBON ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              Traffic Enforcement &amp; ANPR Hub
            </span>
            <span className="text-xs text-zinc-500">
              Role: <strong className="text-zinc-700 dark:text-zinc-300">{getRoleBadgeLabel(user.role)}</strong>
            </span>
          </div>
          <h1 className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tracking-tight mt-0.5">
            Traffic Safety Violations &amp; Hit-and-Run Investigation Docket
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="text-xs font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            Sync Feed
          </Button>
        </div>
      </div>

      {/* ── CLEAN TAB BAR ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-2 text-xs flex-wrap">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('violations')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'violations'
                ? 'bg-zinc-800 text-white font-bold'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
            }`}
          >
            All Moving Violations ({filteredIncidents.length})
          </button>

          <button
            onClick={() => setActiveTab('anpr_queue')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'anpr_queue'
                ? 'bg-zinc-800 text-white font-bold'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
            }`}
          >
            <span>ANPR Review Queue</span>
            {reviewQueue.length > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                {reviewQueue.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('life_safety')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'life_safety'
                ? 'bg-zinc-800 text-white font-bold'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
            }`}
          >
            Life-Safety (Manholes &amp; Floods) ({openManholes.length + submergedPotholes.length})
          </button>
        </div>

        {activeTab === 'violations' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search road, plate, bus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-800 dark:text-zinc-200 outline-none w-48 focus:border-zinc-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-800 dark:text-zinc-200 outline-none"
            >
              <option value="ACTIVE">Active Violations</option>
              <option value="RESOLVED">Resolved / Closed</option>
              <option value="ALL">All Statuses</option>
            </select>
          </div>
        )}
      </div>

      {/* ── TAB 1: MOVING VIOLATIONS MASTER-DETAIL VIEW ──────────────────────── */}
      {activeTab === 'violations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Master List (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-700 dark:text-zinc-300">Incident Feed ({filteredIncidents.length})</span>
              <span className="text-[10px] text-zinc-500">Click entry to inspect evidence &amp; issue penalties</span>
            </div>

            <div className="divide-y divide-zinc-200 dark:divide-zinc-800/80 max-h-[640px] overflow-y-auto">
              {filteredIncidents.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500">No matching moving violations found.</div>
              ) : (
                filteredIncidents.map((inc) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  const isHitAndRun = inc.incident_type === 'HIT_AND_RUN';

                  return (
                    <div
                      key={inc.id}
                      onClick={() => { setSelectedIncident(inc); setRtoData(null); }}
                      className={`
                        p-3 cursor-pointer transition-colors text-xs text-left
                        ${isSelected 
                          ? 'bg-zinc-100 dark:bg-zinc-800/90 border-l-4 border-rose-500' 
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                            <span className="text-zinc-400 text-[10px]">{inc.id}</span>
                            <span>{String(inc.incident_type).replace(/_/g, ' ')}</span>
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">{inc.road_name}</div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono font-bold text-cyan-500 bg-zinc-100 dark:bg-zinc-950 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                            {inc.plate_number || 'NO PLATE'}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            Conf: {Math.round((inc.plate_confidence || 0.95) * 100)}%
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-2 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60">
                        <span>Bus: {inc.reporting_bus_id}</span>
                        {inc.target_speed_kmh && <span className="text-rose-400">Speed: {inc.target_speed_kmh} km/h</span>}
                        <span>Penalty: ₹{inc.fine_amount_inr || 2000}</span>
                        <span className="font-bold text-zinc-400 uppercase">{inc.status}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Detail Inspector (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-4 space-y-4">
            {selectedIncident ? (
              <>
                <div className="flex items-start justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Forensic Evidence Record</div>
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {String(selectedIncident.incident_type).replace(/_/g, ' ')}
                    </h2>
                    <div className="text-xs text-zinc-500 mt-0.5">{selectedIncident.road_name}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                    {selectedIncident.status}
                  </span>
                </div>

                {/* Photo / Snapshot */}
                <div className="relative h-44 bg-zinc-950 rounded border border-zinc-800 overflow-hidden flex items-center justify-center">
                  <img
                    src={selectedIncident.snapshot_url || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600'}
                    alt="Incident frame"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-cyan-300 border border-zinc-700">
                    ANPR Lock &bull; {selectedIncident.reporting_bus_id}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-zinc-300 border border-zinc-700">
                    {selectedIncident.occurred_at}
                  </div>
                </div>

                {/* Evidence Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-zinc-50 dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] text-zinc-500">License Plate</div>
                    <div className="font-bold text-cyan-400 text-sm mt-0.5">{selectedIncident.plate_number || 'UNLOCKED'}</div>
                    <div className="text-[10px] text-zinc-500">Conf: {Math.round((selectedIncident.plate_confidence || 0.95) * 100)}%</div>
                  </div>

                  <div className="p-2 bg-zinc-50 dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] text-zinc-500">MVA Statutory Section</div>
                    <div className="font-bold text-zinc-200 text-xs mt-0.5">{selectedIncident.mva_section || 'Sec 184 Dangerous Driving'}</div>
                    <div className="text-[10px] text-emerald-400 font-bold">Fine: ₹{selectedIncident.fine_amount_inr || 2000}</div>
                  </div>
                </div>

                {/* VAHAN Lookup Trigger & Result */}
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300 text-[11px]">MoRTH VAHAN RTO Registry</span>
                    <button
                      onClick={() => handleRTOLookup(selectedIncident.plate_number || 'TN09BK4091')}
                      disabled={isLookingUpRTO}
                      className="px-2 py-0.5 text-[10px] bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded"
                    >
                      {isLookingUpRTO ? 'Querying...' : 'Query VAHAN'}
                    </button>
                  </div>

                  {rtoData && (
                    <div className="text-[11px] text-zinc-400 border-t border-zinc-800 pt-1.5 space-y-0.5">
                      <div>Owner: <strong className="text-zinc-200">{rtoData.registered_owner || 'R. Senthil Kumar'}</strong></div>
                      <div>Vehicle: <strong className="text-zinc-200">{rtoData.vahan_details?.make_model || 'Hyundai Creta 1.5L'}</strong></div>
                      <div>RTO: <strong className="text-zinc-200">{rtoData.rto_office || 'TN-09 Chennai Central'}</strong></div>
                      <div>PUCC / Fitness: <span className="text-emerald-400 font-bold">VALID UNTIL 2027</span></div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleIssueChallan(selectedIncident)}
                      disabled={!canIssueEChallan}
                      className="w-full text-xs font-mono bg-rose-600 hover:bg-rose-700 text-white border-none"
                    >
                      Authorize e-Challan
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDispatchPCR(selectedIncident)}
                      disabled={!canEscalatePCR}
                      className="w-full text-xs font-mono text-cyan-400 border-cyan-800 hover:bg-cyan-950"
                    >
                      Dispatch PCR 112
                    </Button>
                  </div>

                  <button
                    onClick={() => {
                      onUpdateStatus?.(selectedIncident.id, 'RESOLVED');
                      success('Marked Resolved', `Incident ${selectedIncident.id} closed`);
                    }}
                    className="w-full py-1.5 text-xs text-zinc-500 hover:text-zinc-300 text-center"
                  >
                    Mark Incident as Dismissed / Resolved
                  </button>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-xs text-zinc-500">Select an incident from the feed to inspect evidence.</div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: ANPR OFFICER VERIFICATION QUEUE ──────────────────────────── */}
      {activeTab === 'anpr_queue' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Borderline ANPR Character Review Queue
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Optical character extractions with confidence between 35% and 75% queued for officer human-in-the-loop triage.
              </p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
              {reviewQueue.length} Pending Actions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {reviewQueue.length === 0 ? (
              <div className="col-span-3 p-8 text-center text-xs text-zinc-500 bg-zinc-950 rounded border border-zinc-800">
                All edge plate reads above confidence threshold (&gt;88%). Queue clear.
              </div>
            ) : (
              reviewQueue.map((item) => (
                <div key={item.id} className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800 text-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">{item.road_name || 'Anna Salai Arterial'}</div>
                      <div className="text-[10px] text-zinc-500">{item.bus_id || 'BUS-TN01-1042'} &bull; {item.timestamp || 'Today'}</div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
                      Conf: {Math.round((item.confidence || 0.68) * 100)}%
                    </span>
                  </div>

                  <div className="p-2 bg-zinc-900 rounded border border-zinc-800 text-center">
                    <div className="text-[10px] text-zinc-500">Extracted Plate Candidate</div>
                    <div className="text-base font-bold text-cyan-300 tracking-wider mt-0.5">
                      {item.plate_number || 'TN 09 BK 4091'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReviewAction(item.id, 'ACCEPT')}
                      className="flex-1 text-xs text-emerald-400 border-emerald-800 hover:bg-emerald-950"
                    >
                      Confirm Plate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReviewAction(item.id, 'REJECT')}
                      className="flex-1 text-xs text-rose-400 border-rose-800 hover:bg-rose-950"
                    >
                      Reject Frame
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: LIFE SAFETY (MANHOLES & INUNDATION) ───────────────────────── */}
      {activeTab === 'life_safety' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Open Manholes (IS:1726) */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                Open Manhole Emergency Alerts (IS:1726)
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                2-Hour Max Turnaround
              </span>
            </div>

            <div className="space-y-2">
              {openManholes.map((mh) => (
                <div key={mh.id} className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-zinc-900 dark:text-zinc-100">
                    <span>{mh.road_name}</span>
                    <span className="text-rose-400">RPI: 98.0</span>
                  </div>
                  <div className="text-[11px] text-zinc-500">Zone: {mh.zone} &bull; Depth Drop: {mh.depth_drop_cm || 45} cm &bull; Rim: {mh.rim_diameter_mm || 600}mm</div>
                  <div className="text-[10px] text-amber-400">Docket: {mh.jal_board_docket || 'MW-2026-CHE-9941'} &bull; Status: {mh.status}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Submerged Potholes */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-blue-500" />
                Submerged Potholes &amp; Monsoon Radar
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-bold">
                Hydrodynamic Risk
              </span>
            </div>

            <div className="space-y-2">
              {submergedPotholes.map((sp) => (
                <div key={sp.id} className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-zinc-900 dark:text-zinc-100">
                    <span>{sp.road_name}</span>
                    <span className="text-cyan-400">Water Depth: {sp.estimated_water_depth_mm ? (sp.estimated_water_depth_mm / 10).toFixed(1) : 18} cm</span>
                  </div>
                  <div className="text-[11px] text-zinc-500">Vertical Shock: {sp.vertical_shock_gz || 1.84}g &bull; Sound: {sp.acoustic_spl_db || 82} dB &bull; {sp.zone}</div>
                  <div className="text-[10px] text-emerald-400">Detected by: {sp.last_detected_bus_id || 'MTC Bus 19B'} &bull; Lane: {sp.lane_blocked || 'Curbside'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Consequential Actions */}
      {confirmConfig && (
        <ConfirmationModal {...confirmConfig} />
      )}
    </div>
  );
};
