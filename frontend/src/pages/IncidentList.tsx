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
  Gauge, 
  Download, 
  List, 
  LayoutGrid, 
  X, 
  Droplets,
  RotateCcw,
  AlertOctagon,
  Volume2,
  Waves,
  Siren,
  Box,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Radio,
  Sparkles,
  Zap,
  Sliders,
  ShieldCheck,
  FileCheck,
  DollarSign
} from 'lucide-react';
import { TrafficIncident, OpenManholeAlert, SubmergedPotholeAlert } from '../types';
import { IncidentDossierModal } from '../components/modals/IncidentDossierModal';
import { RoadMeshVisualizerModal, isRoadSurfaceDefect } from '../components/modals/RoadMeshVisualizerModal';
import { Button, Badge, Card, Input } from '../components/ui';
import { EmptyState } from '../components/common/EmptyState';
import { MultiBusTruthBadge } from '../components/triage/MultiBusTruthBadge';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { INITIAL_OPEN_MANHOLES, INITIAL_SUBMERGED_POTHOLES, api } from '../services/api';

interface IncidentListProps {
  incidents: TrafficIncident[];
  onUpdateStatus?: (incidentId: string, status: string) => void;
  onRefresh?: () => Promise<void> | void;
}

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  onUpdateStatus,
  onRefresh
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [selectedIncident, setSelectedIncident] = useState<TrafficIncident | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [meshIncident, setMeshIncident] = useState<{
    id: string;
    location: string;
    depthCm: number;
    areaM2: number;
    volumeLiters: number;
    costInr: number;
    iriScore: number;
    sensorGz: number;
    cameraConfidence: number;
    defectType: string;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showEmergencyDetails, setShowEmergencyDetails] = useState(false);
  const { canEscalatePCR } = useAuth();
  const { t } = useLanguage();
  const { warning: showWarningToast } = useToast();

  // Open Manholes & Submerged Potholes State
  const [openManholes, setOpenManholes] = useState<OpenManholeAlert[]>(INITIAL_OPEN_MANHOLES);
  const [submergedPotholes, setSubmergedPotholes] = useState<SubmergedPotholeAlert[]>(INITIAL_SUBMERGED_POTHOLES);
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);

  const fetchReviewQueue = () => {
    api.getReviewQueue().then(data => {
      if (data?.pending_items) setReviewQueue(data.pending_items);
    }).catch(() => {});
  };

  useEffect(() => {
    api.getOpenManholes().then(data => { if (data?.length) setOpenManholes(data); }).catch(() => {});
    api.getSubmergedPotholes().then(data => { if (data?.length) setSubmergedPotholes(data); }).catch(() => {});
    fetchReviewQueue();
  }, []);

  const handleReviewAction = async (itemId: string, action: 'ACCEPT' | 'REJECT', notes?: string) => {
    try {
      const res = await api.reviewIncident(itemId, action, notes || (action === 'ACCEPT' ? 'Officer verified e-challan issued' : 'Rejected - insufficient evidence'));
      if (res?.success) {
        setToastMessage(`Incident ${itemId} review recorded: ${action}`);
        setTimeout(() => setToastMessage(null), 3000);
        setReviewQueue(prev => prev.filter(item => item.id !== itemId));
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Executive Metrics Calculations
  const stats = useMemo(() => {
    const total = incidents.length;
    const hitAndRun = incidents.filter(i => i.incident_type === 'HIT_AND_RUN').length;
    const rashDriving = incidents.filter(i => i.incident_type === 'RASH_DRIVING').length;
    const pcrDispatched = incidents.filter(i => {
      const s = (i.status || '').toLowerCase();
      return s.includes('escalat') || s.includes('dispatch') || s.includes('pcr');
    }).length;
    const totalFines = incidents.reduce((acc, curr) => acc + (curr.fine_amount_inr || 2000), 0);

    return {
      total,
      hitAndRun,
      rashDriving,
      pcrDispatched,
      totalFines,
      pendingReview: reviewQueue.length
    };
  }, [incidents, reviewQueue.length]);

  // Category counts
  const categories = useMemo(() => {
    const totalCount = incidents.length;
    const hitAndRunCount = incidents.filter(i => i.incident_type === 'HIT_AND_RUN').length;
    const rashDrivingCount = incidents.filter(i => i.incident_type === 'RASH_DRIVING').length;
    const waterlogCount = incidents.filter(i => i.incident_type === 'WATERLOGGING').length;
    const pedestrianCount = incidents.filter(i => i.incident_type === 'VULNERABLE_PEDESTRIAN').length;
    const dispatchedCount = incidents.filter(i => {
      const s = (i.status || '').toLowerCase();
      return s.includes('escalat') || s.includes('dispatch');
    }).length;
    const resolvedCount = incidents.filter(i => {
      const s = (i.status || '').toLowerCase();
      return s.includes('resolv') || s.includes('closed') || s.includes('verifi') || s.includes('intercept');
    }).length;

    return [
      { id: 'ALL', label: t('cat.all', 'All Incidents'), count: totalCount },
      { id: 'REVIEW_QUEUE', label: 'ANPR Review (<85%)', count: reviewQueue.length },
      { id: 'HIT_AND_RUN', label: t('defect.hitAndRun', 'Hit & Run (MVA 161)'), count: hitAndRunCount },
      { id: 'RASH_DRIVING', label: t('cat.rashDriving', 'Rash Driving (MVA 184)'), count: rashDrivingCount },
      { id: 'WATERLOGGING', label: t('defect.waterlog', 'Waterlogging'), count: waterlogCount },
      { id: 'VULNERABLE_PEDESTRIAN', label: t('cat.pedestrian', 'Pedestrian (IRC:35)'), count: pedestrianCount },
      { id: 'ESCALATED', label: t('incidents.pcrSent', 'Dispatched / PCR'), count: dispatchedCount },
      { id: 'RESOLVED', label: 'Resolved / Intercepted', count: resolvedCount }
    ];
  }, [incidents, reviewQueue.length, t]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        (item.plate_number?.toLowerCase() || '').includes(q) ||
        (item.road_name?.toLowerCase() || '').includes(q) ||
        (item.reporting_bus_id?.toLowerCase() || '').includes(q) ||
        (item.vehicle_class?.toLowerCase() || '').includes(q) ||
        (item.incident_type?.toLowerCase() || '').includes(q);

      let matchesCategory = true;
      if (activeCategory === 'ESCALATED') {
        const s = (item.status || '').toLowerCase();
        matchesCategory = s.includes('escalat') || s.includes('dispatch');
      } else if (activeCategory === 'RESOLVED') {
        const s = (item.status || '').toLowerCase();
        matchesCategory = s.includes('resolv') || s.includes('closed') || s.includes('verifi') || s.includes('intercept');
      } else if (activeCategory !== 'ALL') {
        matchesCategory = item.incident_type === activeCategory;
      }

      return matchesSearch && matchesCategory;
    });
  }, [incidents, searchQuery, activeCategory]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory, viewMode]);

  const totalPages = Math.max(1, Math.ceil(filteredIncidents.length / PAGE_SIZE));
  const paginatedIncidents = useMemo(() => {
    return filteredIncidents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [filteredIncidents, currentPage, PAGE_SIZE]);

  const getIncidentBadge = (type: string) => {
    switch (type) {
      case 'HIT_AND_RUN':
        return { 
          label: 'Hit & Run', 
          variant: 'critical' as const,
          icon: ShieldAlert 
        };
      case 'RASH_DRIVING':
        return { 
          label: 'Rash Driving', 
          variant: 'warning' as const,
          icon: Gauge 
        };
      case 'VULNERABLE_PEDESTRIAN':
        return { 
          label: 'Pedestrian', 
          variant: 'purple' as const,
          icon: AlertTriangle 
        };
      case 'WATERLOGGING':
        return { 
          label: 'Waterlog', 
          variant: 'info' as const,
          icon: Droplets 
        };
      default:
        return { 
          label: type.replace(/_/g, ' '), 
          variant: 'neutral' as const,
          icon: Car 
        };
    }
  };

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

  const handleOpenDossier = (incident: TrafficIncident) => {
    setSelectedIncident(incident);
    setIsDossierOpen(true);
  };

  const handleQuickStatus = (incident: TrafficIncident, newStatus: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onUpdateStatus) {
      onUpdateStatus(incident.id, newStatus);
    }
    setToastMessage(`Incident #${incident.id} status updated to ${newStatus}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleQuickEscalate = (incident: TrafficIncident, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!canEscalatePCR) {
      showWarningToast('Insufficient Clearance', 'PCR / 112 emergency interceptor dispatch is restricted to Traffic Police (City Wing).');
      return;
    }
    if (onUpdateStatus) {
      onUpdateStatus(incident.id, 'ESCALATED_POLICE');
    }
    setToastMessage(`Incident ${incident.id} dispatched to Emergency Response (PCR)`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportCSV = () => {
    window.open('/api/incidents/export/csv', '_blank');
    setToastMessage("Downloading official GCTP statutory enforcement log CSV");
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-7 space-y-5 max-w-[1750px] mx-auto w-full select-none font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-blue-500 rounded-xl text-white text-xs shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
          <Send className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. EXECUTIVE ENFORCEMENT & TRAFFIC COMMAND RIBBON */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Active Detections */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Enforcement Incidents
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-900">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{stats.total}</span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 font-mono">Live 5Hz</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>{stats.hitAndRun} Hit &amp; Run</span>
            <span>{stats.rashDriving} Rash Driving</span>
          </div>
        </div>

        {/* Card 2: ANPR Review Queue */}
        <div 
          onClick={() => setActiveCategory('REVIEW_QUEUE')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 hover:border-amber-400 dark:hover:border-amber-600 shadow-sm flex flex-col justify-between relative overflow-hidden cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              ANPR Review (&lt;85%)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-900">
              <Sliders className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{stats.pendingReview}</span>
            <span className="text-xs font-semibold text-amber-500 font-mono">HITL Mandate</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            CMVR Rule 50 Officer Clearance
          </div>
        </div>

        {/* Card 3: PCR Interceptors */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              112 / PCR Interceptors
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-900">
              <Siren className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{stats.pcrDispatched}</span>
            <span className="text-xs font-semibold text-rose-500 font-mono">Dispatched</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Coordinated Multi-Bus Pursuit Active
          </div>
        </div>

        {/* Card 4: Fines Valuation */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Assessed Penalties
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-900">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              ₹{stats.totalFines.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-emerald-500 font-mono">e-Challan</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            MVA 1988 §177 / §184 Statutory Log
          </div>
        </div>
      </div>

      {/* 2. EMERGENCY HAZARDS PROTOCOL BANNER */}
      {(openManholes.length > 0 || submergedPotholes.length > 0) && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/30 p-3.5 shadow-xs transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertOctagon className="w-4 h-4 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs text-rose-900 dark:text-rose-200">
                    High-Priority Infrastructure Hazards Active
                  </span>
                  <span className="text-[10px] font-bold bg-rose-200/80 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded-md font-mono">
                    {openManholes.length} Open Manholes • {submergedPotholes.length} Submerged Traps
                  </span>
                </div>
                <p className="text-[11px] text-rose-700 dark:text-rose-300/80 truncate mt-0.5">
                  IS:1726 sewer rim drop-offs (&gt;15cm) &amp; acoustic hydro-dynamic cavities requiring 2h containment.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowEmergencyDetails(!showEmergencyDetails)}
              className="px-3 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg border border-rose-300/80 dark:border-rose-800 transition cursor-pointer shrink-0"
            >
              {showEmergencyDetails ? "Hide Emergency Cases ▲" : "View Emergency Cases ▼"}
            </button>
          </div>

          {showEmergencyDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3.5 pt-3.5 border-t border-rose-200 dark:border-rose-900/50">
              {openManholes.map((om) => (
                <div key={om.id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-300/60 dark:border-rose-800/60 flex flex-col justify-between gap-2 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        <span>{om.road_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{om.zone} &bull; {om.detected_at}</div>
                    </div>
                    <Badge variant="critical" size="sm" className="font-mono font-bold">
                      Δ {om.depth_drop_cm}cm Drop
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800 font-mono">
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      Docket: {om.jal_board_docket}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setMeshIncident({
                          id: om.id,
                          location: `${om.road_name} (${om.zone})`,
                          depthCm: om.depth_drop_cm || 18.0,
                          areaM2: 0.52,
                          volumeLiters: 32.0,
                          costInr: 2800,
                          iriScore: 5.2,
                          sensorGz: 3.2,
                          cameraConfidence: 96,
                          defectType: "Open Manhole Rim Drop"
                        })}
                        className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300/60 dark:border-blue-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Box className="w-2.5 h-2.5" />
                        <span>3D Mesh</span>
                      </button>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Cones Dispatched</span>
                    </div>
                  </div>
                </div>
              ))}

              {submergedPotholes.map((sph) => (
                <div key={sph.id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-sky-300/60 dark:border-sky-800/60 flex items-center justify-between gap-3 shadow-xs">
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">{sph.road_name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {sph.lane_blocked} &bull; Water: {sph.estimated_water_depth_mm}mm
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                      {sph.acoustic_spl_db} dB &bull; +{sph.vertical_shock_gz}g
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 justify-end">
                      <button
                        onClick={() => setMeshIncident({
                          id: sph.id,
                          location: sph.road_name,
                          depthCm: Math.round(sph.estimated_water_depth_mm / 10) || 12.0,
                          areaM2: 0.75,
                          volumeLiters: 55.0,
                          costInr: 4200,
                          iriScore: 4.85,
                          sensorGz: sph.vertical_shock_gz || 2.8,
                          cameraConfidence: 93,
                          defectType: "Submerged Pothole Cavity"
                        })}
                        className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300/60 dark:border-blue-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Box className="w-2.5 h-2.5" />
                        <span>3D Mesh</span>
                      </button>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">Advisory Active</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. CONSOLIDATED EXECUTIVE TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm shrink-0">
        {/* Search Input & Category Pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
          <div className="w-full sm:w-64 shrink-0">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plate, road, bus..."
              leftIcon={<Search className="w-3.5 h-3.5" />}
              rightElement={
                searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null
              }
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            {categories.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition whitespace-nowrap font-medium cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive ? 'bg-white/25 text-white font-bold' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* View Switcher, Sync, and Export */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {(searchQuery || activeCategory !== 'ALL') && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('ALL');
              }}
              icon={<RotateCcw className="w-3 h-3 text-rose-500" />}
              className="text-rose-500 hover:text-rose-600 cursor-pointer"
            >
              Reset
            </Button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs gap-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="CAD Board Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Evidence Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Real-time Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="hidden md:inline font-bold">5Hz Live</span>
          </div>

          {onRefresh && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onRefresh();
                setToastMessage("Synchronized incidents from live database");
                setTimeout(() => setToastMessage(null), 2000);
              }}
              icon={<RotateCcw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
              title="Synchronize live database"
            >
              <span className="hidden sm:inline">Sync</span>
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            icon={<Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
            title="Export statutory CSV log"
          >
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* 4. MAIN VIEW: REVIEW QUEUE, CAD TABLE, OR EVIDENCE CARDS */}
      {activeCategory === 'REVIEW_QUEUE' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                  Human-in-the-Loop ANPR Verification Queue
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Mandatory under Central Motor Vehicles Rules (CMVR) Rule 50 &amp; BNS: Plates with confidence &lt; 85% require officer clearance before issuing automated notices.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300">
                {reviewQueue.length} Pending
              </span>
              <button
                onClick={fetchReviewQueue}
                className="px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer font-medium"
              >
                Refresh
              </button>
            </div>
          </div>

          {reviewQueue.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Review Queue is Clear</h4>
              <p className="text-xs text-slate-500 mt-1">All high-speed camera captures have been processed or meet the 85% confidence threshold.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewQueue.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">{item.id}</span>
                        <span className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                          {Math.round((item.plate_confidence || 0.74) * 100)}% Conf
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{item.road_name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">Detected by {item.reporting_bus_id} &bull; {item.occurred_at}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                      PENDING REVIEW
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Candidate Plate:</span>
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {item.plate_number || 'Plate Obscured / Pending Review'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Flag Reason:</span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium">{item.review_flag_reason}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800 font-mono">
                      <span>Mandate:</span>
                      <span className="italic">{item.statutory_mandate}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleReviewAction(item.id, 'REJECT')}
                    >
                      Reject Notice
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleReviewAction(item.id, 'ACCEPT')}
                    >
                      Approve e-Challan
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* CAD BOARD TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3.5 font-semibold">Time</th>
                  <th className="py-2.5 px-3.5 font-semibold">Type</th>
                  <th className="py-2.5 px-3.5 font-semibold">Vehicle / Identification</th>
                  <th className="py-2.5 px-3.5 font-semibold">Corridor Location</th>
                  <th className="py-2.5 px-3.5 font-semibold text-center">Speed</th>
                  <th className="py-2.5 px-3.5 font-semibold">Node</th>
                  <th className="py-2.5 px-3.5 font-semibold">Status</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        icon={ShieldAlert}
                        title="No incidents match your search"
                        description="Try a different search term or select a different category."
                        actionLabel="Clear Search"
                        onAction={() => { setSearchQuery(''); setActiveCategory('ALL'); }}
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedIncidents.map((incident) => {
                    const badge = getIncidentBadge(incident.incident_type);
                    const BadgeIcon = badge.icon;
                    const statusBadge = getStatusBadge(incident.status);
                    const statusLower = (incident.status || '').toLowerCase();
                    const isEscalated = statusLower.includes('escalat') || statusLower.includes('dispatch');
                    const isIntercepted = statusLower.includes('intercept');
                    const isResolved = statusLower.includes('resolv') || statusLower.includes('closed') || statusLower.includes('verifi');

                    return (
                      <tr 
                        key={incident.id} 
                        onClick={() => handleOpenDossier(incident)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors cursor-pointer group"
                      >
                        {/* Time */}
                        <td className="py-2.5 px-3.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span className="text-[11px] text-slate-700 dark:text-slate-300 font-mono">{incident.occurred_at}</span>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          <Badge variant={badge.variant} dot size="sm" icon={<BadgeIcon className="w-3 h-3" />}>
                            {badge.label}
                          </Badge>
                        </td>

                        {/* Identification / Plate */}
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          {incident.plate_number ? (
                            <div className="flex items-center gap-2">
                              <span className="bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold text-[11px] font-mono tracking-wider">
                                {incident.plate_number}
                              </span>
                              {incident.plate_confidence && (
                                <span className={`text-[10px] font-bold font-mono ${
                                  incident.plate_confidence >= 0.85 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
                                }`}>
                                  {(incident.plate_confidence * 100).toFixed(0)}%
                                </span>
                              )}
                              {incident.vehicle_class && (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
                                  {incident.vehicle_class}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400 text-xs">
                              {incident.vehicle_class || 'Non-Vehicular Hazard'}
                            </span>
                          )}
                        </td>

                        {/* Location */}
                        <td className="py-2.5 px-3.5 text-slate-800 dark:text-slate-200">
                          <div className="flex items-center gap-1 max-w-xs truncate text-[11px]">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{incident.road_name}</span>
                          </div>
                        </td>

                        {/* Speed */}
                        <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                          {incident.target_speed_kmh ? (
                            <span className={`font-bold text-xs font-mono px-1.5 py-0.5 rounded ${
                              incident.target_speed_kmh > 65 
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' 
                                : 'text-amber-600 dark:text-amber-400'
                            }`}>
                              {incident.target_speed_kmh} km/h
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">&mdash;</span>
                          )}
                        </td>

                        {/* Node */}
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold">
                              {incident.reporting_bus_id}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-[10px] font-mono text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                              CH {incident.channel || 2} • {incident.camera_position || 'REAR_OVERTAKE'}
                            </span>
                            {isRoadSurfaceDefect(incident.incident_type) && (
                              <MultiBusTruthBadge
                                passesCount={3}
                                busesCount={2}
                                consensusScore={96}
                                compact={true}
                              />
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          <Badge variant={statusBadge.variant} size="sm">
                            {statusBadge.label}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                            {/* Official Printable Legal Dossier */}
                            <a
                              href={`/api/incidents/${incident.id}/report`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                              title="Print / Save Section 65B Official Legal Dossier"
                            >
                              <Eye className="w-3 h-3 text-blue-500" /> Dossier
                            </a>

                            {/* Waterlogging: GCC Sump Pump */}
                            {incident.incident_type === 'WATERLOGGING' && (
                              <button
                                onClick={() => handleOpenDossier(incident)}
                                className="px-2 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/80 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                                title="Deploy GCC Dewatering Sump Pump"
                              >
                                <Droplets className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Sump Pump
                              </button>
                            )}

                            {/* Open Manhole: Emergency Barricade */}
                            {incident.incident_type === 'OPEN_MANHOLE' && (
                              <button
                                onClick={() => handleOpenDossier(incident)}
                                className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                                title="Deploy Emergency Barricade Squad"
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Barricade
                              </button>
                            )}

                            {/* Road Distress / Pothole: 3D Depth Mesh */}
                            {(incident.incident_type === 'POTHOLE_D40' || isRoadSurfaceDefect(incident.incident_type)) && (
                              <Button
                                variant="secondary"
                                size="xs"
                                onClick={() => setMeshIncident({
                                  id: incident.id,
                                  location: incident.road_name,
                                  depthCm: incident.incident_type === 'WATERLOGGING' ? 14.5 : 8.2,
                                  areaM2: incident.incident_type === 'WATERLOGGING' ? 1.2 : 0.62,
                                  volumeLiters: incident.incident_type === 'WATERLOGGING' ? 78.0 : 41.5,
                                  costInr: incident.incident_type === 'WATERLOGGING' ? 5100 : 3350,
                                  iriScore: 4.75,
                                  sensorGz: 2.7,
                                  cameraConfidence: 94,
                                  defectType: incident.incident_type
                                })}
                                icon={<Box className="w-3 h-3 text-blue-500" />}
                                title="Inspect 3D Surface Depth Mesh"
                              >
                                3D Mesh
                              </Button>
                            )}

                            {/* Traffic Violations: Statutory e-Challan */}
                            {(incident.plate_number || incident.incident_type.includes('CROSSING') || incident.incident_type.includes('LANE') || incident.incident_type.includes('LIGHT') || incident.incident_type === 'UNSAFE_OVERTAKE') && (
                              <button
                                onClick={() => handleOpenDossier(incident)}
                                className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                                title="Issue / Print Statutory e-Challan (MVA Sec 177/184)"
                              >
                                <span className="font-mono text-[10px]">₹</span> e-Challan
                              </button>
                            )}

                            {/* Police Intercept */}
                            {(incident.incident_type === 'HIT_AND_RUN' || incident.incident_type === 'RASH_DRIVING') && !isEscalated && !isResolved && (
                              <Button
                                variant="danger"
                                size="xs"
                                onClick={(e) => handleQuickEscalate(incident, e)}
                                icon={<Send className="w-3 h-3" />}
                                title="Dispatch 112 Police Control Room (PCR)"
                              >
                                112 PCR
                              </Button>
                            )}

                            {/* Intercept Button */}
                            {isEscalated && !isIntercepted && !isResolved && (
                              <button
                                onClick={(e) => handleQuickStatus(incident, 'INTERCEPTED', e)}
                                className="px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                                title="Mark target vehicle intercepted by PCR / Patrol"
                              >
                                <CheckCircle2 className="w-3 h-3 text-purple-600 dark:text-purple-400" /> Intercept
                              </button>
                            )}

                            {/* Quick Resolve Button */}
                            {!isResolved && (isEscalated || isIntercepted || incident.status?.includes('PUMP') || incident.status?.includes('BARRICAD') || incident.status?.includes('WORK_ORDER') || incident.status?.includes('ECHALLAN')) && (
                              <button
                                onClick={(e) => handleQuickStatus(incident, 'RESOLVED', e)}
                                className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                                title="Mark incident resolved"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Resolve
                              </button>
                            )}

                            <Button
                              variant="primary"
                              size="xs"
                              onClick={() => handleOpenDossier(incident)}
                              icon={<Eye className="w-3 h-3" />}
                              title="Inspect Full Evidence Dossier"
                            >
                              Inspect
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredIncidents.length > PAGE_SIZE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <div>
                Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.min(currentPage * PAGE_SIZE, filteredIncidents.length)}</span> of{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredIncidents.length}</span> incidents
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2.5 py-1 rounded-lg font-bold text-slate-700 dark:text-slate-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* FORENSIC EVIDENCE CARDS GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIncidents.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={ShieldAlert}
                title="No incidents match your search"
                description="Try a different search term or select a different category."
                actionLabel="Clear Search"
                onAction={() => { setSearchQuery(''); setActiveCategory('ALL'); }}
              />
            </div>
          ) : (
            paginatedIncidents.map(incident => {
              const badge = getIncidentBadge(incident.incident_type);
              const BadgeIcon = badge.icon;
              const statusBadge = getStatusBadge(incident.status);
              const statusLower = (incident.status || '').toLowerCase();
              const isEscalated = statusLower.includes('escalat') || statusLower.includes('dispatch');
              const isIntercepted = statusLower.includes('intercept');
              const isResolved = statusLower.includes('resolv') || statusLower.includes('closed') || statusLower.includes('verifi');

              return (
                <div
                  key={incident.id}
                  onClick={() => handleOpenDossier(incident)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 rounded-2xl p-4 flex flex-col justify-between transition-all duration-150 cursor-pointer shadow-sm group"
                >
                  <div>
                    {/* Header: Type & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <Badge variant={badge.variant} dot size="sm" icon={<BadgeIcon className="w-3 h-3" />}>
                        {badge.label}
                      </Badge>
                      <Badge variant={statusBadge.variant} size="sm">
                        {statusBadge.label}
                      </Badge>
                    </div>

                    {/* Plate or Hazard summary */}
                    <div className="h-11 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 flex items-center justify-between mb-3">
                      {incident.plate_number ? (
                        <>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs font-mono tracking-wider">
                            {incident.plate_number}
                          </span>
                          {incident.plate_confidence && (
                            <span className={`text-[10px] font-bold font-mono ${
                              incident.plate_confidence >= 0.85 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
                            }`}>
                              {(incident.plate_confidence * 100).toFixed(0)}% OCR
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-slate-600 dark:text-slate-400 truncate font-medium">
                          {incident.vehicle_class || 'Non-Vehicular Hazard'}
                        </span>
                      )}
                    </div>

                    {/* Compact Details */}
                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-3">
                      <div className="flex items-center gap-1.5 text-[11px] truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate text-slate-800 dark:text-slate-200 font-medium">{incident.road_name}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 font-mono">
                        <span>{incident.occurred_at}</span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-[10px] text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                          CH {incident.channel || 2} • {incident.camera_position || 'REAR_OVERTAKE'}
                        </span>
                      </div>
                      {incident.mva_section && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate pt-0.5 font-mono">
                          <span className="font-bold text-rose-600 dark:text-rose-400">₹{incident.fine_amount_inr || 2000}</span> • {incident.mva_section}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                    <a
                      href={`/api/incidents/${incident.id}/report`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      title="Print Section 65B Dossier"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-500" /> Dossier
                    </a>

                    <div className="flex items-center gap-1.5">
                      {(incident.incident_type === 'HIT_AND_RUN' || incident.incident_type === 'RASH_DRIVING') && !isEscalated && !isResolved && (
                        <Button
                          variant="danger"
                          size="xs"
                          onClick={(e) => handleQuickEscalate(incident, e)}
                          icon={<Send className="w-3 h-3" />}
                        >
                          112 PCR
                        </Button>
                      )}

                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => handleOpenDossier(incident)}
                        icon={<Eye className="w-3 h-3" />}
                      >
                        Inspect
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Incident Dossier Modal */}
      {selectedIncident && (
        <IncidentDossierModal
          isOpen={isDossierOpen}
          onClose={() => {
            setIsDossierOpen(false);
            setSelectedIncident(null);
          }}
          incident={selectedIncident}
          onUpdateStatus={onUpdateStatus}
        />
      )}

      {/* 3D Road Mesh Visualizer Modal */}
      {meshIncident && (
        <RoadMeshVisualizerModal
          isOpen={Boolean(meshIncident)}
          onClose={() => setMeshIncident(null)}
          hazardId={meshIncident.id}
          locationName={meshIncident.location}
          depthCm={meshIncident.depthCm}
          areaM2={meshIncident.areaM2}
          volumeLiters={meshIncident.volumeLiters}
          costInr={meshIncident.costInr}
          iriScore={meshIncident.iriScore}
          sensorGz={meshIncident.sensorGz}
          cameraConfidence={meshIncident.cameraConfidence}
          defectType={meshIncident.defectType}
        />
      )}
    </div>
  );
};
