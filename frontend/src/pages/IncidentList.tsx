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
  Box,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sliders,
  CheckCircle,
  FileText,
  AlertCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { TrafficIncident, OpenManholeAlert, SubmergedPotholeAlert } from '../types';
import { IncidentDossierModal } from '../components/modals/IncidentDossierModal';
import { RoadMeshVisualizerModal } from '../components/modals/RoadMeshVisualizerModal';
import { Button, Badge, Input } from '../components/ui';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmationModal, ConfirmationModalProps } from '../components/common/ConfirmationModal';
import { SyntheticGeneratorControl } from '../components/common/SyntheticGeneratorControl';
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
  const [isSyncing, setIsSyncing] = useState(false);
  const { canEscalatePCR } = useAuth();
  const { t } = useLanguage();
  const { warning: showWarningToast, success: showSuccessToast } = useToast();

  const [openManholes, setOpenManholes] = useState<OpenManholeAlert[]>(INITIAL_OPEN_MANHOLES);
  const [submergedPotholes, setSubmergedPotholes] = useState<SubmergedPotholeAlert[]>(INITIAL_SUBMERGED_POTHOLES);
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);

  // Confirmation dialog state
  const [confirmConfig, setConfirmConfig] = useState<ConfirmationModalProps | null>(null);

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
        showSuccessToast('Action Completed', `Incident #${itemId} ${action === 'ACCEPT' ? 'authorized for e-challan notice' : 'dismissed'}`);
        setReviewQueue(prev => prev.filter(item => item.id !== itemId));
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger confirmation for Review Queue Approve
  const promptApproveReview = (item: any) => {
    setConfirmConfig({
      isOpen: true,
      onClose: () => setConfirmConfig(null),
      onConfirm: async (notes) => {
        await handleReviewAction(item.id, 'ACCEPT', notes || 'Officer verified license plate record and authorized e-challan');
      },
      title: 'Authorize Statutory E-Challan Notice',
      description: 'You are issuing a legally enforceable motor vehicle contravention notice to the registered owner.',
      variant: 'primary',
      icon: 'challan',
      confirmLabel: 'Authorize & Dispatch E-Challan',
      details: [
        { label: 'License Plate', value: item.plate_number || 'TN-01-AX-8732', highlight: true },
        { label: 'Location', value: item.road_name || 'Corridor Junction' },
        { label: 'Camera Match', value: `${Math.round((item.plate_confidence || 0.74) * 100)}% Match` },
        { label: 'Statutory Action', value: 'MVA 1988 Notice Draft' }
      ]
    });
  };

  // Trigger confirmation for Review Queue Reject
  const promptRejectReview = (item: any) => {
    setConfirmConfig({
      isOpen: true,
      onClose: () => setConfirmConfig(null),
      onConfirm: async (notes) => {
        await handleReviewAction(item.id, 'REJECT', notes);
      },
      title: 'Dismiss Capture from Review Queue',
      description: 'Mark this automated camera detection as invalid or unresolvable. Please select a reason for audit records.',
      variant: 'warning',
      icon: 'reject',
      confirmLabel: 'Confirm Dismissal',
      requireReason: true,
      reasonPlaceholder: 'Enter reason or select a preset below...',
      reasonOptions: [
        'License plate obscured / unreadable',
        'False trigger / Non-infraction',
        'Emergency response vehicle',
        'Duplicate sighting'
      ],
      details: [
        { label: 'Incident Reference', value: item.id },
        { label: 'Plate Candidate', value: item.plate_number || 'Obscured' }
      ]
    });
  };

  // Trigger confirmation for Quick Escalate (112 PCR)
  const promptQuickEscalate = (incident: TrafficIncident, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!canEscalatePCR) {
      showWarningToast('Clearance Required', 'Emergency 112 PCR dispatch is restricted to authorized Traffic Police controllers.');
      return;
    }

    setConfirmConfig({
      isOpen: true,
      onClose: () => setConfirmConfig(null),
      onConfirm: async () => {
        if (onUpdateStatus) {
          onUpdateStatus(incident.id, 'ESCALATED_POLICE');
        }
        showSuccessToast('112 Interceptor Dispatched', `Emergency intercept patrol notified for ${incident.plate_number || incident.road_name}`);
      },
      title: 'Dispatch 112 Emergency Police Patrol',
      description: 'Broadcast high-priority intercept alert to Chennai Police Control Room (112) with real-time GPS telemetry.',
      variant: 'danger',
      icon: 'pcr',
      confirmLabel: 'Confirm 112 Patrol Dispatch',
      details: [
        { label: 'Incident Type', value: incident.incident_type.replace(/_/g, ' '), highlight: true },
        { label: 'Target Vehicle', value: incident.plate_number || incident.vehicle_class || 'Vehicle' },
        { label: 'Corridor Location', value: incident.road_name },
        { label: 'Clocked Speed', value: incident.target_speed_kmh ? `${incident.target_speed_kmh} km/h` : 'N/A' }
      ]
    });
  };

  // Category counts
  const categories = useMemo(() => {
    const totalCount = incidents.length;
    const schoolCount = incidents.filter(i => 
      i.incident_type === 'SCHOOL_CHILDREN_CROSSING_RISK' ||
      i.incident_type === 'ZEBRA_CROSSING_ENCROACHMENT' ||
      (i.road_name || '').toLowerCase().includes('school') ||
      (i.description || '').toLowerCase().includes('school')
    ).length;
    const hitAndRunCount = incidents.filter(i => i.incident_type === 'HIT_AND_RUN').length;
    const rashDrivingCount = incidents.filter(i => i.incident_type === 'RASH_DRIVING' || i.incident_type === 'UNSAFE_OVERTAKE').length;
    const waterlogCount = incidents.filter(i => i.incident_type === 'WATERLOGGING').length;
    const pedestrianCount = incidents.filter(i => 
      i.incident_type === 'VULNERABLE_PEDESTRIAN' || 
      i.incident_type === 'CROSSWALK_PEDESTRIAN_RISK' ||
      i.incident_type === 'UNSAFE_MIDBLOCK_CROSSING' ||
      i.incident_type === 'SCHOOL_CHILDREN_CROSSING_RISK'
    ).length;
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
      { id: 'REVIEW_QUEUE', label: 'Unclear Plate Review (<85%)', count: reviewQueue.length },
      { id: 'SCHOOL_ZONE_RISK', label: 'School Zone Risk', count: schoolCount },
      { id: 'HIT_AND_RUN', label: 'Hit & Run Intercept', count: hitAndRunCount },
      { id: 'PEDESTRIAN', label: 'Pedestrian Crossings', count: pedestrianCount },
      { id: 'RASH_DRIVING', label: 'Rash Driving / Speed', count: rashDrivingCount },
      { id: 'WATERLOGGING', label: 'Waterlogging', count: waterlogCount },
      { id: 'ESCALATED', label: 'Dispatched / PCR', count: dispatchedCount },
      { id: 'RESOLVED', label: 'Resolved', count: resolvedCount }
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
      } else if (activeCategory === 'SCHOOL_ZONE_RISK') {
        matchesCategory = 
          item.incident_type === 'SCHOOL_CHILDREN_CROSSING_RISK' ||
          item.incident_type === 'ZEBRA_CROSSING_ENCROACHMENT' ||
          (item.road_name || '').toLowerCase().includes('school') ||
          (item.description || '').toLowerCase().includes('school');
      } else if (activeCategory === 'PEDESTRIAN') {
        matchesCategory = 
          item.incident_type === 'VULNERABLE_PEDESTRIAN' ||
          item.incident_type === 'CROSSWALK_PEDESTRIAN_RISK' ||
          item.incident_type === 'UNSAFE_MIDBLOCK_CROSSING' ||
          item.incident_type === 'SCHOOL_CHILDREN_CROSSING_RISK' ||
          item.incident_type === 'ZEBRA_CROSSING_ENCROACHMENT';
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
      case 'SCHOOL_CHILDREN_CROSSING_RISK':
        return { label: 'School Children Crossing', variant: 'critical' as const, icon: AlertTriangle };
      case 'CROSSWALK_PEDESTRIAN_RISK':
        return { label: 'Crosswalk Pedestrian Risk', variant: 'warning' as const, icon: AlertTriangle };
      case 'UNSAFE_MIDBLOCK_CROSSING':
        return { label: 'Unsafe Midblock Crossing', variant: 'purple' as const, icon: AlertTriangle };
      case 'ZEBRA_CROSSING_ENCROACHMENT':
        return { label: 'Crosswalk Encroachment', variant: 'warning' as const, icon: Car };
      case 'HIT_AND_RUN':
        return { label: 'Hit & Run', variant: 'critical' as const, icon: ShieldAlert };
      case 'RASH_DRIVING':
        return { label: 'Rash Driving', variant: 'warning' as const, icon: Gauge };
      case 'VULNERABLE_PEDESTRIAN':
        return { label: 'Pedestrian Crossing', variant: 'purple' as const, icon: AlertTriangle };
      case 'WATERLOGGING':
        return { label: 'Waterlogging', variant: 'info' as const, icon: Droplets };
      default:
        return { label: type.replace(/_/g, ' '), variant: 'neutral' as const, icon: Car };
    }
  };

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
    return { label: 'Active Alert', variant: 'warning' as const, icon: AlertCircle };
  };

  const handleOpenDossier = (incident: TrafficIncident) => {
    setSelectedIncident(incident);
    setIsDossierOpen(true);
  };

  const handleSync = async () => {
    if (onRefresh) {
      setIsSyncing(true);
      try {
        await onRefresh();
        fetchReviewQueue();
        showSuccessToast('Sync Complete', 'Incident registry updated with live edge observations');
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleExportCSV = () => {
    window.open('/api/incidents/export/csv', '_blank');
    showSuccessToast('Exporting Data', 'Downloading statutory enforcement and incident log CSV');
  };

  const getEmptyStateMessage = () => {
    if (searchQuery) {
      return {
        title: 'No matching incidents',
        desc: `No incident records match "${searchQuery}". Try clearing search or changing filters.`
      };
    }
    switch (activeCategory) {
      case 'HIT_AND_RUN':
        return { title: 'No Hit & Run Incidents', desc: 'No active hit & run emergency cases logged across the transit network.' };
      case 'RASH_DRIVING':
        return { title: 'No Rash Driving Incidents', desc: 'All vehicle speed telemetry is within statutory corridor thresholds.' };
      case 'WATERLOGGING':
        return { title: 'No Waterlogging Hazards', desc: 'No critical road stormwater pooling detected on transit routes.' };
      case 'VULNERABLE_PEDESTRIAN':
        return { title: 'No Pedestrian Crosswalk Blockages', desc: 'Pedestrian crossings and zebra markers are clear.' };
      case 'ESCALATED':
        return { title: 'No Active Dispatches', desc: 'No incidents currently assigned to emergency 112 police intercept.' };
      case 'RESOLVED':
        return { title: 'No Resolved Incidents Yet', desc: 'Resolved and closed cases will appear in this audit log.' };
      default:
        return { title: 'No incidents found', desc: 'No active traffic safety incidents recorded.' };
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8 space-y-4 max-w-[1600px] mx-auto w-full select-none font-sans">
      
      {/* 1. CLEAN OPERATIONAL HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Safety &amp; Traffic Incidents
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-mono">
              {incidents.length} Records
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time edge camera detections, license plate contraventions, and emergency incident triage
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-medium' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-medium' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <SyntheticGeneratorControl onGenerated={() => { if (onRefresh) onRefresh(); }} />

          {onRefresh && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />}
            >
              {isSyncing ? 'Syncing...' : 'Sync'}
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* 2. FILTER & SEARCH BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Search */}
        <div className="w-full lg:w-80 shrink-0">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by plate, corridor, bus node..."
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            rightElement={
              searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null
            }
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar p-0.5">
          {categories.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-xs px-2 py-0.2 rounded-full font-mono ${
                  isActive ? 'bg-white/20 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MAIN CONTENT */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Syncing live incident registry...
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Connecting to high-speed edge perception nodes and ANPR streams.
          </p>
        </div>
      ) : activeCategory === 'REVIEW_QUEUE' ? (
        /* Manual Plate Review Queue */
        <div className="space-y-3">
          {reviewQueue.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <div className="text-base font-bold text-slate-900 dark:text-white">
                Manual Verification Queue is Clear
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                All edge camera detections meet the 85% automated confidence threshold. No plates currently pending manual verification.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {reviewQueue.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between gap-3 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        ID: {item.id}
                      </span>
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                        {Math.round((item.plate_confidence || 0.74) * 100)}% Match
                      </span>
                    </div>

                    <div className="text-base font-bold text-slate-900 dark:text-white font-mono mt-1.5">
                      {item.plate_number || 'Plate Obscured / Unclear'}
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{item.road_name} &bull; Sensor Node: {item.reporting_bus_id}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => promptRejectReview(item)}
                    >
                      Dismiss Record
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => promptApproveReview(item)}
                    >
                      Authorize E-Challan
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Operational Clean Table */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                  <th className="py-3 px-4">Time Logged</th>
                  <th className="py-3 px-4">Violation / Incident</th>
                  <th className="py-3 px-4">Plate / Vehicle Class</th>
                  <th className="py-3 px-4">Corridor Location</th>
                  <th className="py-3 px-4 text-center">Clocked Speed</th>
                  <th className="py-3 px-4">Operational Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={ShieldAlert}
                        title={getEmptyStateMessage().title}
                        description={getEmptyStateMessage().desc}
                        actionLabel="Reset Filters"
                        onAction={() => { setSearchQuery(''); setActiveCategory('ALL'); }}
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedIncidents.map((incident) => {
                    const badge = getIncidentBadge(incident.incident_type);
                    const BadgeIcon = badge.icon;
                    const statusBadge = getStatusBadge(incident.status);
                    const StatusIcon = statusBadge.icon;

                    return (
                      <tr 
                        key={incident.id} 
                        onClick={() => handleOpenDossier(incident)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors cursor-pointer"
                      >
                        {/* Time */}
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono text-xs">
                          {incident.occurred_at}
                        </td>

                        {/* Type */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge variant={badge.variant} dot size="sm" icon={<BadgeIcon className="w-3.5 h-3.5" />}>
                            {badge.label}
                          </Badge>
                        </td>

                        {/* Plate / Vehicle */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {incident.plate_number ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                {incident.plate_number}
                              </span>
                              {incident.vehicle_class && (
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  ({incident.vehicle_class})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600 dark:text-slate-400 text-xs font-medium">
                              {incident.vehicle_class || 'Non-Vehicular Incident'}
                            </span>
                          )}
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                          <div className="flex items-center gap-1.5 truncate text-xs">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{incident.road_name}</span>
                          </div>
                        </td>

                        {/* Speed */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono">
                          {incident.target_speed_kmh ? (
                            <span className="font-bold text-rose-600 dark:text-rose-400 text-xs">
                              {incident.target_speed_kmh} km/h
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">&mdash;</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge variant={statusBadge.variant} size="sm" icon={<StatusIcon className="w-3.5 h-3.5" />}>
                            {statusBadge.label}
                          </Badge>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                            {(incident.incident_type === 'HIT_AND_RUN' || incident.incident_type === 'RASH_DRIVING') && !incident.status?.includes('ESCALAT') && !incident.status?.includes('RESOLV') && (
                              <Button
                                variant="danger"
                                size="xs"
                                onClick={(e) => promptQuickEscalate(incident, e)}
                                icon={<Send className="w-3.5 h-3.5" />}
                              >
                                112 PCR
                              </Button>
                            )}

                            <Button
                              variant="secondary"
                              size="xs"
                              onClick={() => handleOpenDossier(incident)}
                              icon={<Eye className="w-3.5 h-3.5" />}
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-600 dark:text-slate-400">
              <div>
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredIncidents.length)} of {filteredIncidents.length} records
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2.5 font-semibold text-slate-800 dark:text-slate-200">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Operational Clean Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredIncidents.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={ShieldAlert}
                title={getEmptyStateMessage().title}
                description={getEmptyStateMessage().desc}
                actionLabel="Reset Filters"
                onAction={() => { setSearchQuery(''); setActiveCategory('ALL'); }}
              />
            </div>
          ) : (
            paginatedIncidents.map(incident => {
              const badge = getIncidentBadge(incident.incident_type);
              const BadgeIcon = badge.icon;
              const statusBadge = getStatusBadge(incident.status);
              const StatusIcon = statusBadge.icon;

              return (
                <div
                  key={incident.id}
                  onClick={() => handleOpenDossier(incident)}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer shadow-xs flex flex-col justify-between gap-3.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <Badge variant={badge.variant} dot size="sm" icon={<BadgeIcon className="w-3.5 h-3.5" />}>
                        {badge.label}
                      </Badge>
                      <Badge variant={statusBadge.variant} size="sm" icon={<StatusIcon className="w-3.5 h-3.5" />}>
                        {statusBadge.label}
                      </Badge>
                    </div>

                    <div className="text-base font-bold text-slate-900 dark:text-white font-mono">
                      {incident.plate_number || incident.vehicle_class || 'Safety Hazard Alert'}
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{incident.road_name}</span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-2 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>{incident.occurred_at}</span>
                      {incident.target_speed_kmh ? (
                        <span className="text-rose-600 dark:text-rose-400 font-bold">{incident.target_speed_kmh} km/h</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      Node: {incident.reporting_bus_id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {(incident.incident_type === 'HIT_AND_RUN' || incident.incident_type === 'RASH_DRIVING') && !incident.status?.includes('ESCALAT') && !incident.status?.includes('RESOLV') && (
                        <Button
                          variant="danger"
                          size="xs"
                          onClick={(e) => promptQuickEscalate(incident, e)}
                          icon={<Send className="w-3.5 h-3.5" />}
                        >
                          112 PCR
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => handleOpenDossier(incident)}
                        icon={<Eye className="w-3.5 h-3.5" />}
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

      {/* Confirmation Modal */}
      {confirmConfig && (
        <ConfirmationModal {...confirmConfig} />
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

      {/* 3D Road Mesh Modal */}
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
