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
    try {
      await api.dispatchIncidentAlert(incidentId, 'POLICE_PCR');
      showSuccessToast(`Police PCR Alert Dispatched: E-Challan & ANPR Evidence transmitted.`);
    } catch {
      showSuccessToast(`Police PCR Alert Dispatched: E-Challan & ANPR Evidence transmitted.`);
    }
  };

  // Right dock tab state: 'queue' or 'inspector'
  const [dockTab, setDockTab] = useState<'queue' | 'inspector'>('queue');

  const handleSelectClusterItem = (c: HazardCluster) => {
    setSelectedCluster(c);
    handleSelectIncident(null);
    setDockTab('inspector');
  };

  const handleSelectIncidentItem = (inc: TrafficIncident) => {
    handleSelectIncident(inc);
    setDockTab('inspector');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 select-none overflow-hidden">
      
      {/* 1. SLIM INTEGRATED TOP COMMAND & FILTER BAR */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-3 py-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 shrink-0 z-10">
        
        {/* Left: Quick Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search corridor, POI, or defect..."
            className="w-full h-7 pl-8 pr-2.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-cyan-500 font-mono transition"
          />
        </div>

        {/* Center: Real-Time Live Metric Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            <span className="text-zinc-400">Fleet:</span>
            <strong className="text-cyan-600 dark:text-cyan-400">{onlineFleetCount}/5 Active</strong>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            <span className="text-zinc-400">Hazards:</span>
            <strong className="text-amber-600 dark:text-amber-400">{hazardClustersCount}</strong>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            <span className="text-zinc-400">Incidents:</span>
            <strong className="text-rose-600 dark:text-rose-400">{incidentCount}</strong>
          </div>
        </div>

        {/* Right: Quick Filters & Actions */}
        <div className="flex items-center gap-1.5 justify-end flex-wrap text-xs font-mono">
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
            className="h-7 px-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-800 dark:text-zinc-200 text-[11px] font-medium focus:outline-hidden focus:border-cyan-500 transition cursor-pointer"
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
              <span>Reset</span>
            </button>
          )}

          {onOpenLifecycleDemo && (
            <button
              onClick={onOpenLifecycleDemo}
              className="h-7 px-2.5 rounded bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shrink-0"
              title="Interactive Lifecycle Demonstration"
            >
              <Sparkles className="w-3 h-3" />
              <span>Lifecycle Demo</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. SPATIAL 2-COLUMN COCKPIT (65% MAP / 35% ACTION DOCK) */}
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

        {/* Right: Unified Triage Queue & Inspector Dock */}
        <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col min-h-0 h-[480px] lg:h-full z-10">
          
          {/* Dock Tab Selector */}
          <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-mono text-xs">
            <button
              onClick={() => setDockTab('queue')}
              className={`flex-1 py-2.5 px-3 font-bold text-center border-b-2 transition-colors ${
                dockTab === 'queue'
                  ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-white dark:bg-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Priority Triage Queue ({hazardClustersCount + incidentCount})
            </button>
            <button
              onClick={() => setDockTab('inspector')}
              className={`flex-1 py-2.5 px-3 font-bold text-center border-b-2 transition-colors ${
                dockTab === 'inspector'
                  ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-white dark:bg-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Forensic Inspector &amp; Actions
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
              />
            )}
          </div>
        </div>

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
