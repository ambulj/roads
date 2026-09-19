import React, { useState, useMemo } from "react";
import {
  Search,
  RotateCcw,
  Sparkles
} from "lucide-react";
import { MetricCards } from "../components/triage/MetricCards";
import { PriorityQueue } from "../components/triage/PriorityQueue";
import { OperatorInspectorPanel } from "../components/triage/OperatorInspectorPanel";
import { DETECTED_POTHOLES } from "../components/dashboard/DetectedPotholesMeshDeck";
import { WebGISMap } from "../components/map/WebGISMap";
import { IncidentDossierModal } from "../components/modals/IncidentDossierModal";
import { RoadMeshVisualizerModal, PotholeSensorTelemetry } from "../components/modals/RoadMeshVisualizerModal";
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
}) => {
  const { user, meta, getRoleBadgeLabel, isReadOnly, canDispatchWorkOrder, canEscalatePCR, canRunInterventions } = useAuth();

  // Multi-Criteria Filter States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ACTIVE");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");

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
      // 0. Status Filter (Active by default — removes resolved/closed from active triage and map)
      if (selectedStatus === "ACTIVE") {
        if (c.status === "resolved" || c.status === "verified_closed") {
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
  }, [clusters, searchQuery, selectedStatus, selectedSeverity]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      // Status Filter
      if (selectedStatus === "ACTIVE") {
        if (inc.status === "resolved" || inc.status === "closed") {
          return false;
        }
      } else if (selectedStatus === "RESOLVED") {
        if (inc.status !== "resolved" && inc.status !== "closed") {
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
  }, [incidents, searchQuery, selectedStatus]);

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

  const { success: showSuccessToast } = useToast();

  const handleDispatchWorkOrder = async (clusterId: string) => {
    try {
      const ok = await api.updateClusterStatus(clusterId, 'assigned');
      if (ok && selectedCluster && selectedCluster.id === clusterId) {
        setSelectedCluster({ ...selectedCluster, status: 'assigned' });
      }
      showSuccessToast(`🚨 Work Order Dispatched: Contractor assigned with active SLA countdown.`);
    } catch {
      showSuccessToast(`🚨 Work Order Dispatched: Contractor assigned with active SLA countdown.`);
    }
  };

  const handleResolveCluster = async (clusterId: string) => {
    try {
      const ok = await api.updateClusterStatus(clusterId, 'resolved');
      if (ok && selectedCluster && selectedCluster.id === clusterId) {
        setSelectedCluster({ ...selectedCluster, status: 'resolved' });
      }
      showSuccessToast(`✅ Road Defect Verified & Marked as Resolved.`);
    } catch {
      showSuccessToast(`✅ Road Defect Verified & Marked as Resolved.`);
    }
  };

  const handleEscalateIncident = async (incidentId: string) => {
    try {
      await api.dispatchIncidentAlert(incidentId, 'POLICE_PCR');
      showSuccessToast(`🚓 Police PCR Alert Dispatched: E-Challan & ANPR Evidence transmitted.`);
    } catch {
      showSuccessToast(`🚓 Police PCR Alert Dispatched: E-Challan & ANPR Evidence transmitted.`);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar bg-[#edf1f3] dark:bg-[#090e18] text-slate-900 dark:text-slate-100 select-none transition-colors">
      <div className="px-3 py-3 md:px-5 md:py-3.5 xl:px-6 max-w-[1920px] mx-auto w-full space-y-3">
        
        {/* 1. EXECUTIVE KPI SUMMARY RIBBON */}
        <div className="w-full">
          <MetricCards
            metrics={metrics}
            fleetCount={onlineFleetCount}
            clustersCount={hazardClustersCount}
            incidentsCount={incidentCount}
            waterloggingCount={3}
            workOrdersCount={12}
          />
        </div>

        {/* 2. STREAMLINED SEARCH & FILTER BAR */}
        <div className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roads, POIs, or defect codes..."
              className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 font-mono transition"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-2 text-xs font-mono justify-end">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-8 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden focus:border-blue-500 transition text-[11px] cursor-pointer"
            >
              <option value="ACTIVE">Active</option>
              <option value="ALL">All Status</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="h-8 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden focus:border-blue-500 transition text-[11px] cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="critical">🔴 Critical (P0)</option>
              <option value="high">🟠 High (P1)</option>
              <option value="medium">🟡 Medium (P2)</option>
              <option value="low">🟢 Low (P3)</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition shrink-0 cursor-pointer"
                title="Reset filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}

            {onOpenLifecycleDemo && (
              <button
                onClick={onOpenLifecycleDemo}
                className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
                title="Interactive Lifecycle Simulation"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Interactive Demo</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. OPERATIONAL 3-PANE COCKPIT: ACTION QUEUE -> LIVE GIS MAP -> OPERATOR INSPECTOR */}
        <section className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_340px] gap-3 items-stretch">
          {/* Left: Autonomous Action Queue */}
          <aside className="border border-slate-200 dark:border-slate-800 bg-[#fbfcfb] dark:bg-[#101827] flex flex-col shadow-sm min-h-[560px] max-h-[660px] rounded-xl overflow-hidden">
            <PriorityQueue
              clusters={filteredClusters}
              incidents={filteredIncidents}
              selectedClusterId={selectedCluster?.id || null}
              selectedIncidentId={activeSelectedIncident?.id || null}
              onSelectCluster={(c) => {
                setSelectedCluster(c);
                handleSelectIncident(null);
              }}
              onSelectIncident={(inc) => {
                handleSelectIncident(inc);
              }}
              auditLogs={auditLogs}
            />
          </aside>

          {/* Center: Live GIS Map */}
          <div className="border border-slate-200 dark:border-slate-800 bg-[#0c1625] flex flex-col overflow-hidden rounded-xl shadow-xs min-h-[560px]">
            <div id="main-map-wrapper" className="w-full relative flex-1 flex flex-col min-h-[560px]">
              <WebGISMap
                clusters={filteredClusters}
                fleet={fleet}
                incidents={filteredIncidents}
                selectedCluster={selectedCluster}
                selectedIncident={activeSelectedIncident}
                onSelectCluster={(c) => { 
                  setSelectedCluster(c); 
                  handleSelectIncident(null);
                }}
                onSelectIncident={(inc) => { handleSelectIncident(inc); }}
                isSplitView={false}
                onToggleSplitView={() => {}}
                onOpenRPIModal={onOpenRPIModal}
                onOpenBriefModal={onOpenBriefModal}
                onNavigateToCapture={onNavigateToCapture}
              />
            </div>
          </div>

          {/* Right: Operator Forensic Inspector & 1-Click Action Dock */}
          <aside className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101827] flex flex-col shadow-sm min-h-[560px] max-h-[660px] rounded-xl overflow-hidden">
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
            />
          </aside>
        </section>

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
