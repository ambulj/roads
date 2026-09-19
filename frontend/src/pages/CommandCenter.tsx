import React, { useState, useMemo } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  MapPin,
  Maximize2,
  Bus as BusIcon,
  Wrench,
  Search,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { MetricCards } from "../components/triage/MetricCards";
import { PriorityQueue } from "../components/triage/PriorityQueue";
import { DETECTED_POTHOLES } from "../components/dashboard/DetectedPotholesMeshDeck";
import { WebGISMap } from "../components/map/WebGISMap";
import { IncidentDossierModal } from "../components/modals/IncidentDossierModal";
import { RoadMeshVisualizerModal, PotholeSensorTelemetry } from "../components/modals/RoadMeshVisualizerModal";
import { HazardCluster, FleetNode, MetricSummary, PerceptionLogEntry, TrafficIncident } from "../types";
import { useAuth } from "../context/AuthContext";

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
  const [selectedDefectType, setSelectedDefectType] = useState<string>("ALL");
  const [selectedCorridor, setSelectedCorridor] = useState<string>("ALL");
  const [selectedAgency, setSelectedAgency] = useState<string>("ALL");
  const [isFilterBarExpanded, setIsFilterBarExpanded] = useState<boolean>(false);

  // Selection & Modal States
  const [selectedCluster, setSelectedCluster] = useState<HazardCluster | null>(clusters[0] ?? null);
  const [localSelectedIncident, setLocalSelectedIncident] = useState<TrafficIncident | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isMeshModalOpen, setIsMeshModalOpen] = useState(false);
  const [selectedMeshHazard, setSelectedMeshHazard] = useState<PotholeSensorTelemetry>(DETECTED_POTHOLES[0]);

  const activeSelectedIncident = externalSelectedIncident !== undefined ? externalSelectedIncident : localSelectedIncident;

  const handleSelectIncident = (inc: TrafficIncident | null) => {
    if (setExternalSelectedIncident) {
      setExternalSelectedIncident(inc);
    } else {
      setLocalSelectedIncident(inc);
    }
    if (inc) {
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

      // 3. Defect Type
      if (selectedDefectType !== "ALL") {
        if ((c.defect_type || "").toUpperCase() !== selectedDefectType.toUpperCase()) {
          return false;
        }
      }

      // 4. Corridor / Road
      if (selectedCorridor !== "ALL") {
        if (!c.road_name || !c.road_name.toLowerCase().includes(selectedCorridor.toLowerCase())) {
          return false;
        }
      }

      // 5. Assigned Agency
      if (selectedAgency !== "ALL") {
        if (!c.assigned_agency || !c.assigned_agency.toLowerCase().includes(selectedAgency.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [clusters, searchQuery, selectedStatus, selectedSeverity, selectedDefectType, selectedCorridor, selectedAgency]);

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
      if (selectedCorridor !== "ALL") {
        if (!inc.road_name || !inc.road_name.toLowerCase().includes(selectedCorridor.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [incidents, searchQuery, selectedStatus, selectedCorridor]);

  const hasActiveFilters = searchQuery !== "" || selectedStatus !== "ACTIVE" || selectedSeverity !== "ALL" || selectedDefectType !== "ALL" || selectedCorridor !== "ALL" || selectedAgency !== "ALL";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("ACTIVE");
    setSelectedSeverity("ALL");
    setSelectedDefectType("ALL");
    setSelectedCorridor("ALL");
    setSelectedAgency("ALL");
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

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar bg-[#edf1f3] dark:bg-[#090e18] text-slate-900 dark:text-slate-100 select-none transition-colors">
      <div className="px-3 py-3 md:px-5 md:py-3.5 xl:px-6 max-w-[1780px] mx-auto w-full space-y-3">
        
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

        {/* 2. UNIFIED MULTI-CRITERIA SEARCH & FILTER BAR */}
        <div className="bg-white/95 dark:bg-[#101726]/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-2.5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by road, POI, or defect code..."
              className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 font-mono transition"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono justify-end">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-8 px-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-700 dark:text-slate-300 font-bold focus:outline-hidden focus:border-blue-500 transition text-[11px]"
            >
              <option value="ACTIVE">Status: Active Only</option>
              <option value="ALL">Status: All Statuses</option>
              <option value="RESOLVED">Status: Resolved Only</option>
            </select>

            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="h-8 px-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-700 dark:text-slate-300 font-bold focus:outline-hidden focus:border-blue-500 transition text-[11px]"
            >
              <option value="ALL">Severity: All</option>
              <option value="critical">🔴 P0 Critical (RPI &gt; 80)</option>
              <option value="high">🟠 High (RPI &gt; 65)</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>

            <select
              value={selectedDefectType}
              onChange={(e) => setSelectedDefectType(e.target.value)}
              className="h-8 px-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-700 dark:text-slate-300 font-bold focus:outline-hidden focus:border-blue-500 transition text-[11px]"
            >
              <option value="ALL">Defects: All Types</option>
              <option value="D40">🕳️ Potholes (D40)</option>
              <option value="D20">⚡ Cracks (D20)</option>
              <option value="D10">📏 Transverse (D10)</option>
              <option value="ZEBRA_CROSSING">🚶 Zebra (IRC:35)</option>
              <option value="WATERLOGGING">🌊 Waterlog</option>
              <option value="OPEN_MANHOLE">⚠️ Manholes</option>
            </select>

            <select
              value={selectedCorridor}
              onChange={(e) => setSelectedCorridor(e.target.value)}
              className="h-8 px-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-700 dark:text-slate-300 font-bold focus:outline-hidden focus:border-blue-500 transition text-[11px] hidden sm:block"
            >
              <option value="ALL">Corridor: All Chennai</option>
              <option value="Anna Salai">Anna Salai</option>
              <option value="GST Road">GST Road</option>
              <option value="OMR">OMR IT Exp</option>
              <option value="Poonamallee">Poonamallee</option>
              <option value="Inner Ring">Inner Ring</option>
            </select>

            <select
              value={selectedAgency}
              onChange={(e) => setSelectedAgency(e.target.value)}
              className="h-8 px-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-700 dark:text-slate-300 font-bold focus:outline-hidden focus:border-blue-500 transition text-[11px] hidden md:block"
            >
              <option value="ALL">Agency: All PWD</option>
              <option value="Greater Chennai">GCC</option>
              <option value="NHAI">NHAI</option>
              <option value="Highways">State Highways</option>
              <option value="TNRDC">TNRDC</option>
            </select>

            {onOpenLifecycleDemo && (
              <button
                onClick={onOpenLifecycleDemo}
                className="h-8 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm shadow-blue-900/20 transition active:scale-95 cursor-pointer shrink-0"
                title="Run End-to-End Civic Lifecycle Simulation (Bus Edge AI -> Model Checking -> SLA Repair -> Autonomous Fleet Re-Pass Closure)"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Interactive Demo</span>
              </button>
            )}

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="h-8 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1 transition shrink-0 cursor-pointer"
                title="Reset filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. OPERATIONAL WEBGIS MAP & AUTONOMOUS TRIAGE QUEUE */}
        <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-3.5">
          <div className="border border-slate-800 bg-[#0c1625] flex flex-col overflow-hidden shadow-[0_10px_28px_rgba(15,23,42,.14)] rounded-xl">
            {/* Map Header */}
            <div className="px-4 py-2.5 border-b border-slate-700 flex items-center justify-between gap-3 bg-[#101b2b]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-md bg-emerald-400/15 text-emerald-300 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-white tracking-tight leading-tight">
                    Live Operational WebGIS Map
                  </h3>
                  <p className="text-[9.5px] uppercase tracking-[.12em] text-slate-400 leading-none mt-0.5 telemetry-mono">
                    Real-Time GPS Telemetry &bull; Chennai Corridors
                  </p>
                </div>
              </div>

              {/* Right Map Status */}
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 border border-slate-700 text-slate-300 text-[10px] font-bold telemetry-mono">
                  <BusIcon className="w-3 h-3 text-blue-500" />
                  <span>{onlineFleetCount} Nodes</span>
                </span>

                <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 border border-amber-400/30 text-amber-200 text-[10px] font-bold telemetry-mono">
                  <span>{hazardClustersCount} Filtered Hazards</span>
                </span>

                <div className="flex items-center gap-1.5 px-2 py-0.5 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold telemetry-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>5Hz</span>
                </div>

                <button
                  onClick={() => {
                    const el = document.getElementById("main-map-wrapper");
                    if (el?.requestFullscreen) el.requestFullscreen();
                  }}
                  className="p-1 text-slate-400 hover:text-white hover:bg-white/10 transition-colors rounded"
                  title="Full Screen View"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Map Canvas */}
            <div id="main-map-wrapper" className="w-full relative flex flex-col" style={{ height: "600px", minHeight: "520px" }}>
              <WebGISMap
                clusters={filteredClusters}
                fleet={fleet}
                incidents={filteredIncidents}
                selectedCluster={selectedCluster}
                selectedIncident={activeSelectedIncident}
                onSelectCluster={(c) => { 
                  setSelectedCluster(c); 
                  handleSelectIncident(null);
                  handleInspectPothole(c.cluster_code || c.id, `${c.road_name || "GST Road (NH-32) Tambaram"} • D40 Cavity`);
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

          {/* Right Autonomous Triage Queue Column */}
          <aside className="border border-slate-200 dark:border-slate-800 bg-[#fbfcfb] dark:bg-[#101827] flex flex-col shadow-sm min-h-[520px] max-h-[660px] rounded-xl overflow-hidden">
            <PriorityQueue
              clusters={filteredClusters}
              incidents={filteredIncidents}
              selectedClusterId={selectedCluster?.id || null}
              selectedIncidentId={activeSelectedIncident?.id || null}
              onSelectCluster={(c) => {
                setSelectedCluster(c);
                handleSelectIncident(null);
                handleInspectPothole(c.cluster_code || c.id, `${c.road_name || "GST Road"} • ${c.defect_name}`);
              }}
              onSelectIncident={(inc) => {
                handleSelectIncident(inc);
              }}
              auditLogs={auditLogs}
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
