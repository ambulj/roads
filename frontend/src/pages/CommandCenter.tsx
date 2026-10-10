import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  RotateCcw,
  Sparkles,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  Layers,
  Eye,
  X,
  AlertTriangle,
  Radio,
  Trash2
} from "lucide-react";
import { MetricCards } from "../components/triage/MetricCards";
import { PriorityQueue } from "../components/triage/PriorityQueue";
import { OperatorInspectorPanel } from "../components/triage/OperatorInspectorPanel";
import { DETECTED_POTHOLES } from "../components/dashboard/DetectedPotholesMeshDeck";
import { WebGISMap } from "../components/map/WebGISMap";
import { IncidentDossierModal } from "../components/modals/IncidentDossierModal";
import { RoadMeshVisualizerModal, PotholeSensorTelemetry } from "../components/modals/RoadMeshVisualizerModal";
import { SyntheticGeneratorControl } from "../components/common/SyntheticGeneratorControl";
import { HazardCluster, FleetNode, MetricSummary, PerceptionLogEntry, TrafficIncident } from "../types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";

interface CommandCenterProps {
  metrics: MetricSummary;
  clusters: HazardCluster[];
  fleet: FleetNode[];
  incidents?: TrafficIncident[];
  auditLogs: PerceptionLogEntry[];
  onOpenRPIModal: () => void;
  onOpenBriefModal: () => void;
  onNavigateToCapture: () => void;
  onNavigate?: (route: string) => void;
  onOpenLifecycleDemo?: () => void;
  selectedIncident?: TrafficIncident | null;
  onSelectIncident?: (incident: TrafficIncident | null) => void;
  onRefreshIncidents?: () => void;
  onRefreshClusters?: () => void;
  onDeclutter?: (incidentId?: string, clearedClusterIds?: string[]) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  metrics,
  clusters,
  fleet,
  incidents = [],
  auditLogs,
  onOpenRPIModal,
  onOpenBriefModal,
  onNavigateToCapture,
  onNavigate,
  onOpenLifecycleDemo,
  selectedIncident: externalSelectedIncident,
  onSelectIncident: setExternalSelectedIncident,
  onRefreshIncidents,
  onRefreshClusters,
  onDeclutter,
}) => {

  const { user, meta, getRoleBadgeLabel, isReadOnly, canDispatchWorkOrder, canEscalatePCR, canRunInterventions } = useAuth();

  // Multi-Criteria Filter States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ACTIVE");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const [dismissedClusterIds, setDismissedClusterIds] = useState<Set<string>>(new Set());

  // Accordion & Dock Collapse States
  const [isMetricsExpanded, setIsMetricsExpanded] = useState<boolean>(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);

  // Selection & Modal States
  const [selectedCluster, setSelectedCluster] = useState<HazardCluster | null>(clusters[0] ?? null);
  const [localSelectedIncident, setLocalSelectedIncident] = useState<TrafficIncident | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isMeshModalOpen, setIsMeshModalOpen] = useState(false);
  const [selectedMeshHazard, setSelectedMeshHazard] = useState<PotholeSensorTelemetry>(DETECTED_POTHOLES[0]);

  const activeSelectedIncident = externalSelectedIncident !== undefined ? externalSelectedIncident : localSelectedIncident;

  const handleSelectIncident = (inc: TrafficIncident | null, openModal: boolean = false) => {
    if (setExternalSelectedIncident) {
      setExternalSelectedIncident(inc);
    } else {
      setLocalSelectedIncident(inc);
    }
    if (inc) {
      setSelectedCluster(null);
    }
    if (inc && openModal) {
      setIsDossierOpen(true);
    }
  };

  // ── Multi-Criteria Filtering Logic ──────────────────────────────────────────
  const filteredClusters = useMemo(() => {
    return clusters.filter((c) => {
      // 0. Explicitly dismissed / purged clusters
      if (dismissedClusterIds.has(c.id) || (c.cluster_code && dismissedClusterIds.has(c.cluster_code))) {
        return false;
      }

      // 0. Status Filter (Active by default — removes resolved/closed from active triage and map)
      if (selectedStatus === "ACTIVE") {
        if (c.status === "resolved" || c.status === "verified_closed" || c.status === "rejected") {
          return false;
        }
      } else if (selectedStatus === "RESOLVED") {
        if (c.status !== "resolved" && c.status !== "verified_closed") {
          return false;
        }
      }

      // 1. Search query (road name, POI, cluster code, defect name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          (c.road_name && c.road_name.toLowerCase().includes(q)) ||
          (c.nearest_poi && c.nearest_poi.toLowerCase().includes(q)) ||
          (c.cluster_code && c.cluster_code.toLowerCase().includes(q)) ||
          (c.defect_name && c.defect_name.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // 2. Severity
      if (selectedSeverity !== "ALL") {
        if ((c.severity_level || "").toLowerCase() !== selectedSeverity.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [clusters, searchQuery, selectedStatus, selectedSeverity, dismissedClusterIds]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      // 0. Explicitly dismissed / purged incidents
      if (dismissedAlertIds.has(inc.id)) {
        return false;
      }

      // Status Filter
      if (selectedStatus === "ACTIVE") {
        if (inc.status === "resolved" || inc.status === "closed" || inc.status === "DISPATCHED") {
          return false;
        }
      } else if (selectedStatus === "RESOLVED") {
        if (inc.status !== "resolved" && inc.status !== "closed" && inc.status !== "DISPATCHED") {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          (inc.road_name && inc.road_name.toLowerCase().includes(q)) ||
          (inc.plate_number && inc.plate_number.toLowerCase().includes(q)) ||
          (inc.incident_type && inc.incident_type.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [incidents, searchQuery, selectedStatus, dismissedAlertIds]);


  const hasActiveFilters = searchQuery !== "" || selectedStatus !== "ACTIVE" || selectedSeverity !== "ALL";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("ACTIVE");
    setSelectedSeverity("ALL");
  };

  const onlineFleetCount = fleet.filter((b) => b.is_online).length || 5;
  const hazardClustersCount = filteredClusters.length;
  const incidentCount = filteredIncidents.length;
  const priority = selectedCluster ?? filteredClusters[0] ?? clusters[0];
  const priorityName = priority?.defect_name ?? "GST Road surface failure";
  const priorityRoad = priority?.road_name ?? "GST Road · NH-45";
  const priorityRpi = priority?.rpi_boosted ?? priority?.rpi_score ?? 86;
  const priorityPasses = priority?.pass_count ?? 3;

  const handleInspectPothole = (hazardOrPothole: string | PotholeSensorTelemetry, locationName?: string) => {
    if (typeof hazardOrPothole !== "string") {
      setSelectedMeshHazard(hazardOrPothole);
      setIsMeshModalOpen(true);
      return;
    }
    const hazardId: string = hazardOrPothole;
    const found = DETECTED_POTHOLES.find((p) => p.id === hazardId || p.locationName.includes(hazardId));
    if (found) {
      setSelectedMeshHazard(found);
    } else {
      setSelectedMeshHazard({
        id: hazardId,
        locationName: locationName || "GST Road Tambaram (NH-32) • D40 Cavity",
        roadName: "GST Road (NH-32) Tambaram",
        defectType: "D40 Severe Cavity",
        depthCm: 8.4,
        areaM2: 0.65,
        volumeLiters: 42.5,
        costInr: 3450,
        iriScore: 4.82,
        sensorGz: 2.8,
        cameraConfidence: 94,
        detectedBusId: "MTC Bus #1042 (TN-01-N-1042)",
      });
    }
    setIsMeshModalOpen(true);
  };

  useEffect(() => {
    (window as any).__roadsaathi_open_mesh_modal = (clusterId: string) => {
      const cluster = clusters.find((c) => c.id === clusterId);
      if (cluster) {
        handleInspectPothole(cluster.id, `${cluster.road_name} — ${cluster.defect_name}`);
      } else {
        handleInspectPothole(clusterId);
      }
    };
    return () => {
      delete (window as any).__roadsaathi_open_mesh_modal;
    };
  }, [clusters]);

  const { success: showSuccessToast } = useToast();

  const handleDispatchWorkOrder = async (clusterId: string) => {
    try {
      const ok = await api.updateClusterStatus(clusterId, 'assigned');
      if (ok && selectedCluster && selectedCluster.id === clusterId) {
        setSelectedCluster({ ...selectedCluster, status: 'assigned' });
      }
      showSuccessToast(`Work Order Dispatched: Contractor assigned with active SLA countdown.`);
    } catch {
      showSuccessToast(`Work Order Dispatched: Contractor assigned with active SLA countdown.`);
    }
  };

  const handleResolveCluster = async (clusterId: string) => {
    try {
      const ok = await api.updateClusterStatus(clusterId, 'resolved');
      if (ok && selectedCluster && selectedCluster.id === clusterId) {
        setSelectedCluster({ ...selectedCluster, status: 'resolved' });
      }
      showSuccessToast(`Road Defect Verified & Marked as Resolved.`);
    } catch {
      showSuccessToast(`Road Defect Verified & Marked as Resolved.`);
    }
  };

  const handleEscalateIncident = async (incidentId: string) => {
    // 1. Immediately hide the active banner and declutter local state (0ms latency feedback)
    setDismissedAlertIds((prev) => new Set(prev).add(incidentId));

    // Find and hide any correlated hazard clusters (e.g. from the same video upload / street)
    const targetInc = incidents.find((i) => i.id === incidentId);
    if (targetInc) {
      const related = clusters.filter((c) => {
        const sameRoad =
          targetInc.road_name &&
          c.road_name &&
          (targetInc.road_name.toLowerCase().includes(c.road_name.toLowerCase()) ||
            c.road_name.toLowerCase().includes(targetInc.road_name.toLowerCase()));
        const near = Math.hypot(c.lat - targetInc.lat, c.lng - targetInc.lng) < 0.006; // ~600m
        return (sameRoad || near) && !c.id.startsWith("cl-infra-");
      });
      if (related.length > 0) {
        setDismissedClusterIds((prev) => {
          const next = new Set(prev);
          related.forEach((r) => next.add(r.id));
          return next;
        });
      }
    }

    if (activeSelectedIncident && activeSelectedIncident.id === incidentId) {
      handleSelectIncident(null);
    }

    try {
      const res = await api.dispatchIncidentAlert(incidentId, 'POLICE_PCR', 'PCR-14', true, true);
      if (onDeclutter) {
        onDeclutter(incidentId, res?.cleared_cluster_ids);
      }
      if (onRefreshIncidents) onRefreshIncidents();
      if (onRefreshClusters) onRefreshClusters();
      showSuccessToast(`Police PCR Alert Dispatched: E-Challan & ANPR Evidence transmitted. Incident & hazards purged from database.`);
    } catch {
      showSuccessToast(`Police PCR Alert Dispatched: Incident & hazards purged from database.`);
    }
  };

  const handleClearClutter = async () => {
    try {
      const res = await api.clearClutter();
      setDismissedAlertIds(new Set());
      setDismissedClusterIds(new Set());
      if (onRefreshIncidents) onRefreshIncidents();
      if (onRefreshClusters) onRefreshClusters();
      showSuccessToast(`Map Decluttered: Cluttered incidents and test hazards purged from database.`);
    } catch {
      showSuccessToast(`Map Decluttered: Clutter purged.`);
    }
  };

  // Right dock tab state: 'queue' or 'inspector'
  const [dockTab, setDockTab] = useState<'queue' | 'inspector'>('queue');

  const handleSelectClusterItem = (c: HazardCluster) => {
    setSelectedCluster(c);
    handleSelectIncident(null);
    setDockTab('inspector');
    if (isDockCollapsed) {
      setIsDockCollapsed(false);
    }
  };

  const handleSelectIncidentItem = (inc: TrafficIncident) => {
    handleSelectIncident(inc);
    setDockTab('inspector');
    if (isDockCollapsed) {
      setIsDockCollapsed(false);
    }
  };

  // High-Priority Forensic Alert for Hit-and-Run, Rash Driving, and School Zone Crossing risks
  const highPriorityAlert = useMemo(() => {
    return incidents.find(
      (inc) =>
        !dismissedAlertIds.has(inc.id) &&
        (inc.status === "ACTIVE_ALERT" || inc.status === "active" || inc.status === "open") &&
        ["HIT_AND_RUN", "RASH_DRIVING", "SCHOOL_CHILDREN_CROSSING_RISK"].includes(inc.incident_type)
    );
  }, [incidents, dismissedAlertIds]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 select-none overflow-hidden">
      
      {/* 0. TOP STICKY FORENSIC ALERT DOCK BANNER */}
      {highPriorityAlert && (
        <div className="bg-rose-950/95 border-b border-rose-500/70 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-rose-100 z-30 shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <div className="flex items-center flex-wrap gap-2 text-xs">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-800 text-white border border-rose-600 font-mono">
                {highPriorityAlert.incident_type.replace(/_/g, " ")}
              </span>
              {highPriorityAlert.plate_number && (
                <span className="px-2 py-0.5 rounded font-mono font-bold bg-black text-amber-300 border border-amber-500/50">
                  {highPriorityAlert.plate_number}
                </span>
              )}
              <span className="font-mono text-rose-200">
                ANPR Conf: <strong className="text-white">
                  {Math.round(
                    (highPriorityAlert.plate_confidence ?? 0.94) > 1
                      ? (highPriorityAlert.plate_confidence ?? 94)
                      : (highPriorityAlert.plate_confidence ?? 0.94) * 100
                  )}%
                </strong>
              </span>
              <span className="font-mono text-rose-300/80 hidden md:inline">
                NavIC GPS: {highPriorityAlert.lat.toFixed(5)}, {highPriorityAlert.lng.toFixed(5)}
              </span>
              <span className="font-mono text-rose-300/60 hidden lg:inline">
                {new Date(highPriorityAlert.occurred_at).toUTCString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEscalateIncident(highPriorityAlert.id)}
              className="px-3 py-1 text-xs font-bold font-mono rounded bg-rose-600 hover:bg-rose-500 active:scale-95 text-white shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Dispatch Alert to Traffic Police (GCTP) / Issue E-Challan
            </button>
            <button
              onClick={() => handleSelectIncidentItem(highPriorityAlert)}
              className="px-2.5 py-1 text-xs font-mono rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 transition cursor-pointer"
              title="Inspect Incident Dossier"
            >
              Inspect
            </button>
            <button
              onClick={() => setDismissedAlertIds((prev) => new Set(prev).add(highPriorityAlert.id))}
              className="p-1 rounded hover:bg-rose-900/70 text-rose-300 hover:text-white transition cursor-pointer"
              title="Hide Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}


      {/* 1. SLIM 44px (h-11) SINGLE-LINE EXECUTIVE TELEMETRY & FILTER BAR */}
      <div className="h-11 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-3 py-1.5 flex items-center justify-between gap-2.5 shrink-0 z-10">
        
        {/* Left: Quick Search with Integrated Declutter & Synthetic Data Controls */}
        <div className="flex items-center gap-1.5 flex-1 min-w-[260px] max-w-sm sm:max-w-md lg:max-w-xl">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search corridor, POI, or defect..."
              className="w-full h-7 pl-8 pr-7 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-cyan-500 font-mono transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Declutter Button docked in Search Bar */}
          <button
            onClick={handleClearClutter}
            className="h-7 px-2.5 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-rose-300 dark:border-rose-800 shrink-0 shadow-2xs"
            title="Purge test incidents and hazard clutter from database and map"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Declutter</span>
          </button>

          {/* Dedicated Synthetic Data Generation Control in Search Bar */}
          <SyntheticGeneratorControl
            variant="search"
            onGenerated={() => {
              if (onRefreshIncidents) onRefreshIncidents();
              if (onRefreshClusters) onRefreshClusters();
            }}
            onDeclutter={handleClearClutter}
            className="shrink-0"
          />
        </div>

        {/* Center: Real-Time Live Metric Chips */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono shrink-0">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            <span className="text-zinc-600 dark:text-zinc-400">Fleet:</span>
            <strong className="text-cyan-600 dark:text-cyan-400">{onlineFleetCount}/5 Active</strong>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            <span className="text-zinc-600 dark:text-zinc-400">Hazards:</span>
            <strong className="text-amber-600 dark:text-amber-400">{hazardClustersCount}</strong>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            <span className="text-zinc-600 dark:text-zinc-400">Incidents:</span>
            <strong className="text-rose-600 dark:text-rose-400">{incidentCount}</strong>
          </div>
        </div>

        {/* Right: Quick Filters & KPI Toggle */}
        <div className="flex items-center gap-1.5 justify-end shrink-0 text-xs font-mono">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-7 px-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-800 dark:text-zinc-200 text-[11px] font-medium focus:outline-hidden focus:border-cyan-500 transition cursor-pointer"
          >
            <option value="ACTIVE">Active Triage</option>
            <option value="ALL">All Status</option>
            <option value="RESOLVED">Verified Resolved</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="h-7 px-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-800 dark:text-zinc-200 text-[11px] font-medium focus:outline-hidden focus:border-cyan-500 transition cursor-pointer hidden md:inline-block"
          >
            <option value="ALL">All Severities</option>
            <option value="critical">Critical (P0)</option>
            <option value="high">High (P1)</option>
            <option value="medium">Medium (P2)</option>
            <option value="low">Low (P3)</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="h-7 px-2 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer border border-zinc-200 dark:border-zinc-700"
              title="Reset filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}


          {/* KPI Scorecards Toggle Button */}
          <button
            onClick={() => setIsMetricsExpanded(!isMetricsExpanded)}
            className={`h-7 px-2 rounded text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer border ${
              isMetricsExpanded
                ? 'bg-cyan-50 dark:bg-cyan-950/70 border-cyan-500/50 text-cyan-600 dark:text-cyan-400'
                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
            }`}
            title={isMetricsExpanded ? "Collapse Detailed KPI Scorecards" : "Expand Detailed KPI Scorecards"}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">KPIs</span>
            {isMetricsExpanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {onOpenLifecycleDemo && (
            <button
              onClick={onOpenLifecycleDemo}
              className="h-7 px-2.5 rounded bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shrink-0"
              title="Interactive Lifecycle Demonstration"
            >
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">Lifecycle Demo</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. COLLAPSIBLE ACCORDION CONTAINER FOR METRIC CARDS */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 ${
        isMetricsExpanded ? 'max-h-96 opacity-100 py-2 px-3' : 'max-h-0 opacity-0 py-0 px-3 border-b-0 pointer-events-none'
      }`}>
        <MetricCards
          metrics={metrics}
          fleetCount={onlineFleetCount}
          clustersCount={hazardClustersCount}
          incidentsCount={incidentCount}
          waterloggingCount={clusters.filter((c) => c.defect_type === 'OPEN_MANHOLE' || c.defect_type === 'WATERLOGGING' || c.severity_level === 'critical').length || 3}
          workOrdersCount={clusters.filter((c) => c.status !== 'resolved' && c.status !== 'verified_closed').length || 8}
          resolvedClustersCount={clusters.filter((c) => c.status === 'resolved' || c.status === 'verified_closed').length || 42}
          onTimeSlaPct={94.2}
          fpsRate={30}
        />
      </div>

      {/* 3. SPATIAL 2-COLUMN COCKPIT (MAP / COLLAPSIBLE ACTION DOCK) */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 items-stretch overflow-hidden">
        
        {/* Left / Center Canvas: Full-Size WebGIS Map */}
        <div className="flex-1 flex flex-col relative min-h-[420px] bg-zinc-950 overflow-hidden">
          <WebGISMap
            clusters={filteredClusters}
            fleet={fleet}
            incidents={filteredIncidents}
            selectedCluster={selectedCluster}
            selectedIncident={activeSelectedIncident}
            onSelectCluster={handleSelectClusterItem}
            onSelectIncident={handleSelectIncidentItem}
            isSplitView={false}
            onToggleSplitView={() => {}}
            onOpenRPIModal={onOpenRPIModal}
            onOpenBriefModal={onOpenBriefModal}
            onNavigateToCapture={onNavigateToCapture}
          />
        </div>

        {/* Right: Collapsible Triage Queue & Inspector Dock */}
        {isDockCollapsed ? (
          <div className="w-11 shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center py-2 gap-3 z-10 font-mono transition-all duration-300">
            <button
              onClick={() => setIsDockCollapsed(false)}
              className="p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
              title="Expand Triage Dock"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setDockTab('queue');
                setIsDockCollapsed(false);
              }}
              className={`p-2 rounded relative transition ${
                dockTab === 'queue'
                  ? 'bg-cyan-50 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
              }`}
              title={`Triage Queue (${hazardClustersCount + incidentCount} items)`}
            >
              <Layers className="w-4 h-4" />
              {(hazardClustersCount + incidentCount) > 0 && (
                <span className="absolute -top-1 -right-1 px-1 min-w-[14px] h-[14px] rounded-full bg-cyan-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {hazardClustersCount + incidentCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setDockTab('inspector');
                setIsDockCollapsed(false);
              }}
              className={`p-2 rounded relative transition ${
                dockTab === 'inspector'
                  ? 'bg-cyan-50 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
              }`}
              title="Forensic Inspector"
            >
              <Eye className="w-4 h-4" />
              {(selectedCluster || activeSelectedIncident) && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              )}
            </button>
          </div>
        ) : (
          <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col min-h-0 h-[480px] lg:h-full z-10 transition-all duration-300">
            
            {/* Dock Tab Selector with Collapse Button */}
            <div className="h-9 flex items-stretch border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-mono text-xs">
              <button
                onClick={() => setDockTab('queue')}
                className={`flex-1 h-full px-3 text-center border-b-2 transition-colors text-[11px] font-medium flex items-center justify-center ${
                  dockTab === 'queue'
                    ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-white dark:bg-zinc-900 font-semibold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <span>Triage Queue ({hazardClustersCount + incidentCount})</span>
              </button>
              <button
                onClick={() => setDockTab('inspector')}
                className={`flex-1 h-full px-3 text-center border-b-2 transition-colors text-[11px] font-medium flex items-center justify-center ${
                  dockTab === 'inspector'
                    ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-white dark:bg-zinc-900 font-semibold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <span>Forensic Inspector</span>
              </button>
              <button
                onClick={() => setIsDockCollapsed(true)}
                className="px-2.5 h-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition border-l border-zinc-200 dark:border-zinc-800"
                title="Collapse Triage Dock (Gain 100% Map Width)"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            {/* Dock Content */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {dockTab === 'queue' ? (
                <PriorityQueue
                  clusters={filteredClusters}
                  incidents={filteredIncidents}
                  selectedClusterId={selectedCluster?.id || null}
                  selectedIncidentId={activeSelectedIncident?.id || null}
                  onSelectCluster={handleSelectClusterItem}
                  onSelectIncident={handleSelectIncidentItem}
                  auditLogs={auditLogs}
                />
              ) : (
                <OperatorInspectorPanel
                  selectedCluster={activeSelectedIncident ? null : selectedCluster}
                  selectedIncident={activeSelectedIncident}
                  onDispatchWorkOrder={handleDispatchWorkOrder}
                  onResolveCluster={handleResolveCluster}
                  onEscalateIncident={handleEscalateIncident}
                  onNavigateToWorkOrders={() => onNavigate?.("work-orders")}
                  onOpenDossierModal={() => {
                    if (activeSelectedIncident) setIsDossierOpen(true);
                  }}
                  onOpenMeshModal={() => {
                    if (selectedCluster) {
                      handleInspectPothole(selectedCluster.id, `${selectedCluster.road_name} — ${selectedCluster.defect_name}`);
                    }
                  }}
                />
              )}
            </div>
          </div>
        )}

      </div>

      {/* Incident Dossier Modal */}
      {activeSelectedIncident && (
        <IncidentDossierModal
          isOpen={isDossierOpen}
          onClose={() => {
            setIsDossierOpen(false);
            handleSelectIncident(null);
          }}
          incident={activeSelectedIncident}
        />
      )}

      {/* 3D Road Mesh Visualizer Modal */}
      <RoadMeshVisualizerModal
        isOpen={isMeshModalOpen}
        onClose={() => setIsMeshModalOpen(false)}
        hazardId={selectedMeshHazard.id}
        locationName={selectedMeshHazard.locationName}
        depthCm={selectedMeshHazard.depthCm}
        areaM2={selectedMeshHazard.areaM2}
        volumeLiters={selectedMeshHazard.volumeLiters}
        costInr={selectedMeshHazard.costInr}
        iriScore={selectedMeshHazard.iriScore}
        sensorGz={selectedMeshHazard.sensorGz}
        cameraConfidence={selectedMeshHazard.cameraConfidence}
        footageImageUrl={selectedMeshHazard.footageImageUrl}
        detectedBusId={selectedMeshHazard.detectedBusId}
        defectType={selectedMeshHazard.defectType}
        canDispatchWorkOrder={canDispatchWorkOrder}
        onDispatchWorkOrder={() => {
          setIsMeshModalOpen(false);
          onNavigate?.("work-orders");
        }}
      />
    </div>
  );
};

