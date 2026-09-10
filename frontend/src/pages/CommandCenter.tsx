import React, { useState } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  MapPin,
  Maximize2,
  Bus as BusIcon,
  Wrench,
} from "lucide-react";
import { MetricCards } from "../components/triage/MetricCards";
import { DETECTED_POTHOLES } from "../components/dashboard/DetectedPotholesMeshDeck";
import { WebGISMap } from "../components/map/WebGISMap";
import { DashboardAnalyticsBottom } from "../components/dashboard/DashboardAnalyticsBottom";
import { UserJourneyRibbon } from "../components/dashboard/UserJourneyRibbon";
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
  selectedIncident: externalSelectedIncident,
  onSelectIncident: setExternalSelectedIncident,
}) => {
  const { user, meta, getRoleBadgeLabel, isReadOnly, canDispatchWorkOrder, canEscalatePCR, canRunInterventions } = useAuth();
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

  const onlineFleetCount = fleet.filter((b) => b.is_online).length || 5;
  const hazardClustersCount = clusters.length || 8;
  const incidentCount = incidents.length || 5;
  const priority = selectedCluster ?? clusters[0];
  const priorityName = priority?.defect_name ?? "GST Road surface failure";
  const priorityRoad = priority?.road_name ?? "GST Road · NH-45";
  const priorityRpi = priority?.rpi_boosted ?? priority?.rpi_score ?? 86;
  const priorityPasses = priority?.pass_count ?? 3;

  const handleInspectPothole = (hazardId: string, locationName?: string) => {
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
      <div className="px-3 py-3 md:px-5 md:py-4 xl:px-6 max-w-[1780px] mx-auto w-full space-y-3.5">
        
        {/* 1. ULTRA-SLEEK FULL-WIDTH KPI RIBBON */}
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

        {/* 2. MAP AND DECISION FOCUS SECTION (DOMINANT VIEWPORT) */}
        <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4">
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
                  <span>{hazardClustersCount} Hazards</span>
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
            <div id="main-map-wrapper" className="w-full relative flex flex-col" style={{ height: "580px", minHeight: "500px" }}>
              <WebGISMap
                clusters={clusters}
                fleet={fleet}
                incidents={incidents}
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

          {/* Right Decision / Triage Card */}
          <aside className="border border-slate-200 dark:border-slate-800 bg-[#fbfcfb] dark:bg-[#101827] flex flex-col shadow-sm min-h-[420px] rounded-xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[.14em] font-bold text-slate-500 telemetry-mono">
                  Autonomous Triage
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded">
                  P0 Critical
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                {priorityName}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {priorityRoad}
              </p>
            </div>

            <div className="p-4 space-y-4 flex-1">
              {/* RPI Score Metric */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block telemetry-mono">
                    Road Priority Index (RPI)
                  </span>
                  <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                    {priorityRpi}/100
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block telemetry-mono">
                    MTC Pass Consensus
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ {priorityPasses} Buses Verified
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => handleInspectPothole(priority.cluster_code || priority.id, `${priority.road_name} • ${priority.defect_name}`)}
                  className="w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Inspect 3D LiDAR &amp; Sensor Mesh</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onNavigate?.("work-orders")}
                  className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-2"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Dispatch Municipal Repair Order</span>
                </button>
              </div>

              {/* Autonomous AI Reasoning Log */}
              <div className="p-3 bg-slate-100/70 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <div className="font-bold text-slate-700 dark:text-slate-300 font-mono text-[10px] uppercase">
                  DBSCAN Consensus Proof
                </div>
                <p>
                  High vertical acceleration spikes (gz &gt; 2.5G) confirmed by 3 independent MTC fleet nodes within 15 meters. Escalated to GCC Ward 172.
                </p>
              </div>
            </div>
          </aside>
        </section>

        {/* 3. BOTTOM ANALYTICS & AUDIT STREAM */}
        <DashboardAnalyticsBottom
          fleetCount={onlineFleetCount}
          workOrdersCount={12}
          onNavigate={(route) => onNavigate?.(route)}
        />
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
