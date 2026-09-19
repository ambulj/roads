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
  Sliders
} from 'lucide-react';
import { TrafficIncident, OpenManholeAlert, SubmergedPotholeAlert } from '../types';
import { IncidentDossierModal } from '../components/modals/IncidentDossierModal';
import { RoadMeshVisualizerModal, isRoadSurfaceDefect } from '../components/modals/RoadMeshVisualizerModal';
import { Button, Badge, Input } from '../components/ui';
import { EmptyState } from '../components/common/EmptyState';
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
  const { canEscalatePCR } = useAuth();
  const { t } = useLanguage();
  const { warning: showWarningToast } = useToast();

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
        setToastMessage(`Incident #${itemId} ${action === 'ACCEPT' ? 'approved' : 'rejected'}`);
        setTimeout(() => setToastMessage(null), 3000);
        setReviewQueue(prev => prev.filter(item => item.id !== itemId));
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

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
      { id: 'REVIEW_QUEUE', label: 'Review Queue (<85%)', count: reviewQueue.length },
      { id: 'HIT_AND_RUN', label: 'Hit & Run', count: hitAndRunCount },
      { id: 'RASH_DRIVING', label: 'Rash Driving', count: rashDrivingCount },
      { id: 'WATERLOGGING', label: 'Waterlogging', count: waterlogCount },
      { id: 'VULNERABLE_PEDESTRIAN', label: 'Pedestrian', count: pedestrianCount },
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
        return { label: 'Hit & Run', variant: 'critical' as const, icon: ShieldAlert };
      case 'RASH_DRIVING':
        return { label: 'Rash Driving', variant: 'warning' as const, icon: Gauge };
      case 'VULNERABLE_PEDESTRIAN':
        return { label: 'Pedestrian', variant: 'purple' as const, icon: AlertTriangle };
      case 'WATERLOGGING':
        return { label: 'Waterlog', variant: 'info' as const, icon: Droplets };
      default:
        return { label: type.replace(/_/g, ' '), variant: 'neutral' as const, icon: Car };
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
    return { label: 'Active Alert', variant: 'warning' as const };
  };

  const handleOpenDossier = (incident: TrafficIncident) => {
    setSelectedIncident(incident);
    setIsDossierOpen(true);
  };

  const handleQuickEscalate = (incident: TrafficIncident, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!canEscalatePCR) {
      showWarningToast('Insufficient Clearance', 'PCR / 112 emergency interceptor dispatch is restricted to Traffic Police.');
      return;
    }
    if (onUpdateStatus) {
      onUpdateStatus(incident.id, 'ESCALATED_POLICE');
    }
    setToastMessage(`Incident #${incident.id} dispatched to 112 PCR`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportCSV = () => {
    window.open('/api/incidents/export/csv', '_blank');
    setToastMessage("Downloading statutory enforcement CSV log");
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar p-5 md:p-6 lg:p-8 space-y-4 max-w-[1600px] mx-auto w-full select-none font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
          <Send className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. CLEAN HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Safety &amp; Traffic Incidents
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-mono">
              {incidents.length} total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Live edge camera detections, ANPR infractions, and emergency incident triage
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {onRefresh && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onRefresh();
                setToastMessage("Synchronized incidents");
                setTimeout(() => setToastMessage(null), 2000);
              }}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Sync
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export
          </Button>
        </div>
      </div>

      {/* 2. SIMPLE FILTER & SEARCH BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Search */}
        <div className="w-full lg:w-72 shrink-0">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plate, road, bus..."
            leftIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
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
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar p-0.5">
          {categories.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MAIN CONTENT: REVIEW QUEUE, TABLE, OR CARDS */}
      {activeCategory === 'REVIEW_QUEUE' ? (
        /* Simple Review Queue */
        <div className="space-y-3">
          {reviewQueue.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Review Queue is Clear</div>
              <p className="text-xs text-slate-500 mt-0.5">All camera captures meet the 85% confidence threshold.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reviewQueue.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between gap-3 shadow-xs">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">{item.id}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                        {Math.round((item.plate_confidence || 0.74) * 100)}% OCR
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {item.plate_number || 'Plate Obscured'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.road_name} &bull; {item.reporting_bus_id}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleReviewAction(item.id, 'REJECT')}
                    >
                      Reject
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
        /* Simple Clean Table */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 font-medium text-[11px]">
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Violation Type</th>
                  <th className="py-2.5 px-4">Plate / Vehicle</th>
                  <th className="py-2.5 px-4">Location</th>
                  <th className="py-2.5 px-4 text-center">Speed</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={ShieldAlert}
                        title="No incidents found"
                        description="Try adjusting your search query or selected filter."
                        actionLabel="Clear Filters"
                        onAction={() => { setSearchQuery(''); setActiveCategory('ALL'); }}
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedIncidents.map((incident) => {
                    const badge = getIncidentBadge(incident.incident_type);
                    const BadgeIcon = badge.icon;
                    const statusBadge = getStatusBadge(incident.status);

                    return (
                      <tr 
                        key={incident.id} 
                        onClick={() => handleOpenDossier(incident)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors cursor-pointer"
                      >
                        {/* Time */}
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                          {incident.occurred_at}
                        </td>

                        {/* Type */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge variant={badge.variant} dot size="sm" icon={<BadgeIcon className="w-3 h-3" />}>
                            {badge.label}
                          </Badge>
                        </td>

                        {/* Plate / Vehicle */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {incident.plate_number ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                                {incident.plate_number}
                              </span>
                              {incident.vehicle_class && (
                                <span className="text-[11px] text-slate-400">
                                  ({incident.vehicle_class})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400 text-xs">
                              {incident.vehicle_class || 'Non-Vehicular'}
                            </span>
                          )}
                        </td>

                        {/* Location */}
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{incident.road_name}</span>
                          </div>
                        </td>

                        {/* Speed */}
                        <td className="py-3 px-4 text-center whitespace-nowrap font-mono">
                          {incident.target_speed_kmh ? (
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {incident.target_speed_kmh} km/h
                            </span>
                          ) : (
                            <span className="text-slate-400">&mdash;</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge variant={statusBadge.variant} size="sm">
                            {statusBadge.label}
                          </Badge>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                            {(incident.incident_type === 'HIT_AND_RUN' || incident.incident_type === 'RASH_DRIVING') && !incident.status?.includes('ESCALAT') && !incident.status?.includes('RESOLV') && (
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
                              variant="secondary"
                              size="xs"
                              onClick={() => handleOpenDossier(incident)}
                              icon={<Eye className="w-3 h-3" />}
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
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-500 dark:text-slate-400">
              <div>
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredIncidents.length)} of {filteredIncidents.length}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-medium">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Simple Clean Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredIncidents.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={ShieldAlert}
                title="No incidents found"
                description="Try adjusting your search query or selected filter."
                actionLabel="Clear Filters"
                onAction={() => { setSearchQuery(''); setActiveCategory('ALL'); }}
              />
            </div>
          ) : (
            paginatedIncidents.map(incident => {
              const badge = getIncidentBadge(incident.incident_type);
              const BadgeIcon = badge.icon;
              const statusBadge = getStatusBadge(incident.status);

              return (
                <div
                  key={incident.id}
                  onClick={() => handleOpenDossier(incident)}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer shadow-xs flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge variant={badge.variant} dot size="sm" icon={<BadgeIcon className="w-3 h-3" />}>
                        {badge.label}
                      </Badge>
                      <Badge variant={statusBadge.variant} size="sm">
                        {statusBadge.label}
                      </Badge>
                    </div>

                    <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                      {incident.plate_number || incident.vehicle_class || 'Hazard Alert'}
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                      <span className="truncate">{incident.road_name}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono mt-1.5 flex items-center justify-between">
                      <span>{incident.occurred_at}</span>
                      {incident.target_speed_kmh ? (
                        <span>{incident.target_speed_kmh} km/h</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {incident.reporting_bus_id}
                    </span>
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => handleOpenDossier(incident)}
                      icon={<Eye className="w-3 h-3" />}
                    >
                      Inspect
                    </Button>
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
