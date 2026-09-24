import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Download, 
  Clock, 
  Wrench, 
  CheckCircle2, 
  Search, 
  Filter, 
  Camera, 
  Eye, 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  Phone, 
  MessageSquare, 
  Send, 
  Sparkles,
  Award,
  Layers,
  Building,
  FileSpreadsheet,
  Plus,
  Box,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { HazardCluster, WorkOrderStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { WorkOrderActionConsole, WorkOrderConsoleTab } from '../components/workorders/WorkOrderActionConsole';
import { RoadMeshVisualizerModal, isRoadSurfaceDefect } from '../components/modals/RoadMeshVisualizerModal';
import { EmptyState } from '../components/common/EmptyState';
import { MultiBusTruthBadge } from '../components/triage/MultiBusTruthBadge';
import { ContractorSlaLedger } from '../components/workorders/ContractorSlaLedger';
import { SyntheticGeneratorControl } from '../components/common/SyntheticGeneratorControl';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface WorkOrdersProps {
  clusters: HazardCluster[];
  onUpdateStatus: (orderId: string, status: WorkOrderStatus, afterImg?: string, notes?: string) => void;
}

export const WorkOrders: React.FC<WorkOrdersProps> = ({ clusters, onUpdateStatus }) => {
  const { t } = useLanguage();
  const { canDispatchWorkOrder } = useAuth();
  const { success: showSuccessToast, info: showInfoToast } = useToast();
  const [isDrillRunning, setIsDrillRunning] = useState(false);
  const [drillStep, setDrillStep] = useState<number>(0);

  // Unified Work Order Action Console State
  const [consoleCluster, setConsoleCluster] = useState<HazardCluster | null>(null);
  const [consoleTab, setConsoleTab] = useState<WorkOrderConsoleTab>('cad_audit');
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);

  const handleRunLifecycleDrill = async () => {
    if (isDrillRunning) return;
    setIsDrillRunning(true);
    setDrillStep(1);

    // Step 1: Auto-Detect
    showInfoToast(
      t('lifecycle.step1', '1. Edge AI IMX335 + IMU Shock Detection'),
      'Edge Camera & IMU on Bus MTC-19B detected severe pothole (Depth 5.2cm, Gz=1.68g) on GST Road Corridor.'
    );

    const newClusterId = `cl-auto-${Date.now().toString().slice(-4)}`;
    const newClusterCode = `WO-2026-CHE-${Math.floor(100 + Math.random() * 900)}`;

    setTimeout(() => {
      setDrillStep(2);
      // Step 2: Auto-Case Created (OPEN)
      showInfoToast(
        t('lifecycle.step2', '2. Auto-Case Creation & SLA Active'),
        `Work Order ${newClusterCode} automatically generated in CAD with 24h SLA and assigned to L&T Highways.`
      );
      
      onUpdateStatus(
        newClusterId, 
        'in_progress' as WorkOrderStatus, 
        undefined,
        'Auto-triaged by Edge NPU. SLA timer activated.'
      );

      setTimeout(() => {
        setDrillStep(3);
        // Step 3: Repair in progress / patch applied
        showInfoToast(
          t('lifecycle.step3', '3. Contractor Hot-Mix Asphalt Patch'),
          'Emergency crew applied VG-30 hot-mix asphalt. Awaiting fleet re-pass patrol confirmation.'
        );

        setTimeout(() => {
          setDrillStep(4);
          // Step 4: Fleet Re-pass Autonomous Closure
          const auditNotes = `[AUTONOMOUS_FLEET_CLOSURE] Verified closed by Fleet Node BUS-MTC-19B on re-pass patrol. Telemetry: Gz vertical shock = 0.98g (nominal baseline, threshold < 1.15g). Optical AI: Defect cavity 0% detected per IRC:SP:20 standard. MoHUA cryptographic audit logged.`;
          
          onUpdateStatus(
            newClusterId,
            'verified_closed' as WorkOrderStatus,
            'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80',
            auditNotes
          );

          showSuccessToast(
            t('lifecycle.autoVerified', 'Auto-Verified Closed (Fleet Re-Pass)'),
            t('lifecycle.successNotice', 'Pothole case automatically verified & closed via Fleet Re-Pass (Bus MTC-19B)!')
          );

          api.simulateAutoLifecycle('D40', 'GST Road, Tambaram (NH-32)').catch(() => {});

          setTimeout(() => {
            setIsDrillRunning(false);
            setDrillStep(0);
          }, 2000);
        }, 1500);
      }, 1400);
    }, 1200);
  };

  const [activeTab, setActiveTab] = useState<'cad' | 'kanban' | 'sla'>('cad');

  const requestStatusUpdate = (orderId: string, status: WorkOrderStatus, afterImg?: string, notes?: string) => {
    onUpdateStatus(orderId, status, afterImg, notes);
    showSuccessToast(
      "Work Order Updated",
      `Order #${orderId} marked as ${status.replace('_', ' ').toUpperCase()}`
    );
  };

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const [inspectingMeshCluster, setInspectingMeshCluster] = useState<HazardCluster | null>(null);

  const openConsole = (cluster: HazardCluster | null, tab: WorkOrderConsoleTab = 'cad_audit') => {
    setConsoleCluster(cluster || clusters[0] || null);
    setConsoleTab(tab);
    setIsConsoleOpen(true);
  };

  // Material & Volume Cost Calculator
  const calculateMaterial = (cluster: HazardCluster) => {
    const areaM2   = (cluster as any).area_m2  ?? (cluster.defect_type === 'D40' ? 0.52 : 0.28);
    const depthCm  = (cluster as any).depth_cm ?? (cluster.defect_type === 'D40' ? 8.0  : 3.5);
    const volumeM3 = areaM2 * (depthCm / 100);
    const volumeLiters = Math.round(volumeM3 * 1000 * 10) / 10;
    const asphaltKg = Math.round(volumeM3 * 2300);
    const costInr   = Math.round(asphaltKg * 68);
    return { volumeLiters, asphaltKg, costInr };
  };

  // Filtered tickets
  const filteredClusters = clusters.filter((c) => {
    const matchesSearch = 
      (c.cluster_code && c.cluster_code.toLowerCase().includes(search.toLowerCase())) ||
      (c.road_name && c.road_name.toLowerCase().includes(search.toLowerCase())) ||
      (c.defect_name && c.defect_name.toLowerCase().includes(search.toLowerCase())) ||
      (c.assigned_agency && c.assigned_agency.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'all' || 
      c.status === statusFilter || 
      (statusFilter === 'verified_closed' && (c.status === 'resolved' || c.status === 'verified_closed'));
    const matchesSeverity = severityFilter === 'all' || c.severity_level === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, severityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredClusters.length / PAGE_SIZE));
  const paginatedClusters = filteredClusters.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // KPI calculations
  const totalCount = clusters.length;
  const openCount = clusters.filter((c) => c.status === 'open' || c.status === 'assigned').length;
  const inProgressCount = clusters.filter((c) => c.status === 'in_progress').length;
  const closedCount = clusters.filter((c) => c.status === 'verified_closed' || c.status === 'resolved').length;
  const totalBudget = clusters.reduce((acc, c) => acc + calculateMaterial(c).costInr, 0);

  const handleExportCSV = () => {
    window.open('/api/work-orders/export/csv', '_blank');
    showInfoToast("Downloading PWD Work Orders CSV", "Exporting live database records to CSV.");
  };


  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 select-none transition-colors">
      <div className="p-4 sm:p-5 md:p-6 space-y-4 max-w-[1700px] mx-auto w-full">
        
        {/* 1. TOP TITLE & ACTIONS BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg sm:text-xl text-zinc-900 dark:text-white tracking-tight">
                Municipal Work Orders &amp; SLA Compliance
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">
                Autonomous contract routing, SLA compliance &amp; penalty ledger, and proof-of-repair verification.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <div className="flex bg-white dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('cad')}
                className={`px-3 py-1.5 rounded-md transition ${
                  activeTab === 'cad'
                    ? 'bg-blue-700 text-white shadow-xs font-bold'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                CAD Table
              </button>
              <button
                onClick={() => setActiveTab('kanban')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                  activeTab === 'kanban'
                    ? 'bg-blue-700 text-white shadow-xs font-bold'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <span>Kanban Board</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </button>
              <button
                onClick={() => setActiveTab('sla')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                  activeTab === 'sla'
                    ? 'bg-blue-700 text-white shadow-xs font-bold'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <span>SLA &amp; Compliance</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </button>
            </div>

            <SyntheticGeneratorControl />

            <button
              onClick={() => openConsole(clusters[0] || null, 'repass')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Fleet Re-Pass</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {activeTab === 'sla' ? (
          <ContractorSlaLedger clusters={clusters} />
        ) : activeTab === 'kanban' ? (
          /* KANBAN BOARD 4-SWIMLANE VIEW */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Lane 1: Auto-Detected (Open) */}
              <div className="flex flex-col bg-zinc-100/80 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-800 dark:text-zinc-200">1. Auto-Detected (Open)</h4>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                    {clusters.filter(c => c.status === 'open').length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[68vh] custom-scrollbar pr-1">
                  {clusters.filter(c => c.status === 'open').map(c => (
                    <div key={c.id} className="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/40 shadow-xs space-y-2.5 hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-extrabold text-xs text-rose-600 dark:text-rose-400">{c.cluster_code || c.id}</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-900/30 text-rose-600 border border-rose-200 dark:border-rose-800">
                          RPI {c.rpi_boosted ?? c.rpi_score}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">{c.road_name}</div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>{c.defect_name}</span>
                        <span className="text-rose-600 font-semibold font-mono">SLA: {c.sla_hours}h</span>
                      </div>
                      <button
                        onClick={() => requestStatusUpdate(c.id, 'assigned')}
                        className="w-full py-1.5 rounded-md bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-600 hover:text-white text-blue-700 dark:text-blue-300 font-bold text-[11px] border border-blue-200 dark:border-blue-800 transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Assign to Contractor</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lane 2: Assigned to Contractor */}
              <div className="flex flex-col bg-zinc-100/80 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-800 dark:text-zinc-200">2. Contractor Assigned</h4>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                    {clusters.filter(c => c.status === 'assigned').length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[68vh] custom-scrollbar pr-1">
                  {clusters.filter(c => c.status === 'assigned').map(c => (
                    <div key={c.id} className="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-900/40 shadow-xs space-y-2.5 hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-extrabold text-xs text-amber-600 dark:text-amber-400">{c.cluster_code || c.id}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {c.assigned_agency}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">{c.road_name}</div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>Est: ₹{calculateMaterial(c).costInr}</span>
                        <span className="text-amber-600 font-mono font-semibold">24h Active</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => requestStatusUpdate(c.id, 'open')}
                          className="px-2 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-semibold text-[10.5px] border border-zinc-200 dark:border-zinc-700 transition cursor-pointer"
                          title="Return to Open pool"
                        >
                          ← Open
                        </button>
                        <button
                          onClick={() => requestStatusUpdate(c.id, 'in_progress')}
                          className="flex-1 py-1.5 rounded-md bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-600 hover:text-white text-amber-800 dark:text-amber-300 font-bold text-[11px] border border-amber-200 dark:border-amber-800 transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Commence Repair</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lane 3: Under Repair (SLA Active) */}
              <div className="flex flex-col bg-zinc-100/80 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-800 dark:text-zinc-200">3. Under Repair (In Progress)</h4>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                    {clusters.filter(c => c.status === 'in_progress' || c.status === 'reinspection_pending').length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[68vh] custom-scrollbar pr-1">
                  {clusters.filter(c => c.status === 'in_progress' || c.status === 'reinspection_pending').map(c => (
                    <div key={c.id} className="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/40 shadow-xs space-y-2.5 hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-extrabold text-xs text-blue-600 dark:text-blue-400">{c.cluster_code || c.id}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 border border-blue-200 dark:border-blue-800">
                          {c.status === 'reinspection_pending' ? 'Reinspection' : 'VG-30 Hot Mix'}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">{c.road_name}</div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>{c.assigned_agency}</span>
                        <span className="text-blue-600 font-mono font-semibold">Rolling In Progress</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => requestStatusUpdate(c.id, 'assigned')}
                          className="px-2 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-semibold text-[10.5px] border border-zinc-200 dark:border-zinc-700 transition cursor-pointer"
                          title="Return to Assigned"
                        >
                          ← Assigned
                        </button>
                        <button
                          onClick={() => requestStatusUpdate(c.id, 'verified_closed', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80', '[AUTONOMOUS_FLEET_CLOSURE] Verified closed by Fleet Node BUS-MTC-19B on re-pass patrol. Gz=0.98g normal.')}
                          className="flex-1 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-600 hover:text-white text-emerald-800 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800 transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-500" />
                          <span>Simulate Re-Pass Close</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lane 4: Fleet Re-Pass Verified & Closed */}
              <div className="flex flex-col bg-zinc-100/80 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-800 dark:text-zinc-200">4. Re-Pass Verified &amp; Closed</h4>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    {clusters.filter(c => c.status === 'verified_closed' || c.status === 'resolved').length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[68vh] custom-scrollbar pr-1">
                  {clusters.filter(c => c.status === 'verified_closed' || c.status === 'resolved').map(c => (
                    <div key={c.id} className="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/40 shadow-xs space-y-2.5 hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-extrabold text-xs text-emerald-600 dark:text-emerald-400">{c.cluster_code || c.id}</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Gz = 0.98g
                        </span>
                      </div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">{c.road_name}</div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span className="text-emerald-600 font-semibold font-mono">MoHUA Hash Verified</span>
                        <span>Passes: {c.pass_count}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex-1 py-1 rounded-md bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold text-[10.5px] text-center border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>SLA Verified</span>
                        </div>
                        <button
                          onClick={() => requestStatusUpdate(c.id, 'in_progress')}
                          className="px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-semibold text-[10px] border border-zinc-200 dark:border-zinc-700 transition cursor-pointer"
                          title="Reopen for maintenance"
                        >
                          Reopen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* AUTONOMOUS DEFECT-TO-CLOSURE LIFECYCLE BANNER */}
            <div className="p-4 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-none">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      {t("lifecycle.title", "Automated Defect-to-Closure Lifecycle")}
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold border border-slate-300 dark:border-slate-700">
                      Standard Operating Procedure
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {t("lifecycle.subtitle", "Optical Detection -> Service Order Registered -> Contractor SLA Repair -> Re-Inspection Verification")}
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                  <button
                    onClick={handleRunLifecycleDrill}
                    disabled={isDrillRunning}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition disabled:opacity-60 cursor-pointer"
                  >
                    <Sparkles className={`w-4 h-4 ${isDrillRunning ? 'animate-spin' : ''}`} />
                    <span>
                      {isDrillRunning 
                        ? t("lifecycle.runningDrill", "Simulating Lifecycle Workflow...") 
                        : t("lifecycle.runDrill", "Run Lifecycle Simulation")}
                    </span>
                  </button>
                </div>
              </div>

              {/* 4 Pipeline Stages Progress Visualization */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs font-mono">
                <div className={`p-2 rounded-md border flex items-center gap-2 transition ${
                  drillStep === 1 
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-blue-900 dark:text-blue-200 font-bold' 
                    : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  <span className="w-5 h-5 rounded bg-blue-700 text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
                  <span className="truncate">{t("lifecycle.step1", "1. Impact & Camera Detection")}</span>
                </div>

                <div className={`p-2 rounded-md border flex items-center gap-2 transition ${
                  drillStep === 2 
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-200 font-bold' 
                    : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  <span className="w-5 h-5 rounded bg-amber-700 text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
                  <span className="truncate">{t("lifecycle.step2", "2. Order Open (SLA Active)")}</span>
                </div>

                <div className={`p-2 rounded-md border flex items-center gap-2 transition ${
                  drillStep === 3 
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-blue-900 dark:text-blue-200 font-bold' 
                    : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  <span className="w-5 h-5 rounded bg-blue-700 text-white flex items-center justify-center font-bold text-xs shrink-0">3</span>
                  <span className="truncate">{t("lifecycle.step3", "3. Contractor Patch")}</span>
                </div>

                <div className={`p-2 rounded-md border flex items-center gap-2 transition ${
                  drillStep === 4 
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-bold' 
                    : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  <span className="w-5 h-5 rounded bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0">4</span>
                  <span className="truncate">{t("lifecycle.step4", "4. Re-Pass Closure")}</span>
                </div>
              </div>
            </div>

            {/* 2. TOP 4 KPI SUMMARY CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Total Orders */}
              <div className="p-3.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-none flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Total Work Orders</span>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-0.5">{totalCount}</div>
                  <span className="text-xs text-blue-700 dark:text-blue-400 font-medium">Logged in CAD</span>
                </div>
                <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4" />
                </div>
              </div>

              {/* Card 2: Open / Pending */}
              <div className="p-3.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-none flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Pending / Open</span>
                  <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 font-mono mt-0.5">{openCount}</div>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Under SLA Countdown</span>
                </div>
                <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>

              {/* Card 3: In Progress */}
              <div className="p-3.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-none flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">In Progress</span>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 font-mono mt-0.5">{inProgressCount}</div>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Contractor on Site</span>
                </div>
                <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
              </div>

              {/* Card 4: Estimated Budget */}
              <div className="p-3.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-none flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Est. Repair Budget</span>
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">₹{totalBudget.toLocaleString()}</div>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Standard Schedule of Rates</span>
                </div>
                <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* 3. SEARCH & FILTERS BAR */}
            <div className="p-3 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-none flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by Order ID, Corridor, Defect, Contractor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-8 pl-9 pr-3 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-500 outline-hidden focus:border-blue-600 transition"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 px-3 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-hidden cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open / Unassigned</option>
                  <option value="assigned">Assigned to Contractor</option>
                  <option value="in_progress">In Progress (Repair)</option>
                  <option value="resolved">Resolved (Awaiting Re-pass)</option>
                  <option value="reinspection_pending">Reinspection Pending</option>
                  <option value="verified_closed">Verified Closed</option>
                </select>

                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical (P0)</option>
                  <option value="high">High (P1)</option>
                  <option value="medium">Medium (P2)</option>
                  <option value="low">Low (P3)</option>
                </select>
              </div>
            </div>

            {/* 4. CAD WORK ORDER TABLE */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                      <th className="py-3 px-4">Ticket ID</th>
                      <th className="py-3 px-4">Severity</th>
                      <th className="py-3 px-4">Defect &amp; Location</th>
                      <th className="py-3 px-4">Volumetric Cost</th>
                      <th className="py-3 px-4">Contractor Agency</th>
                      <th className="py-3 px-4">SLA Time</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedClusters.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center">
                          <EmptyState
                            icon={ClipboardList}
                            title="No Work Orders Found"
                            description="Adjust your search or status filters to view records."
                          />
                        </td>
                      </tr>
                    ) : (
                      paginatedClusters.map((cluster) => {
                        const material = calculateMaterial(cluster);
                        const isClosed = cluster.status === "verified_closed" || cluster.status === "resolved";

                        return (
                          <tr
                            key={cluster.id}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition"
                          >
                            <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                              {cluster.cluster_code || cluster.id}
                            </td>

                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                                cluster.severity_level === "critical"
                                  ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900"
                                  : cluster.severity_level === "high"
                                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900"
                                    : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                              }`}>
                                {cluster.severity_level?.toUpperCase() || "MEDIUM"}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {cluster.defect_name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">
                                {cluster.road_name || "Chennai Metropolitan Corridor"}
                              </div>
                              <div className="mt-1">
                                <MultiBusTruthBadge 
                                  passesCount={cluster.total_observations || 14}
                                  busesCount={Math.min(4, Math.max(2, Math.floor((cluster.rpi_score || 70) / 24)))}
                                  consensusScore={Math.min(98, Math.max(82, Math.floor((cluster.rpi_score || 75) + 12)))}
                                  compact
                                />
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                ₹{material.costInr.toLocaleString()}
                              </div>
                              <div className="text-[10.5px] text-slate-400">
                                {material.asphaltKg} kg Bitumen Mix
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-medium text-slate-800 dark:text-slate-200">
                                {cluster.assigned_agency || "Apex Urban Infra Ltd"}
                              </div>
                              <div className="text-[10.5px] text-slate-400 font-mono">
                                {cluster.agency_phone || "+91 98401 22345"}
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{cluster.sla_hours || 24}h SLA</span>
                              </div>
                              <div className="text-[10.5px] text-slate-400">
                                {(cluster as any).turnaround_hrs ? `${(cluster as any).turnaround_hrs}h spent` : "14h remaining"}
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <select
                                value={cluster.status}
                                onChange={(e) => requestStatusUpdate(cluster.id, e.target.value as WorkOrderStatus)}
                                title="Update work order status"
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold outline-none cursor-pointer border transition-colors ${
                                  isClosed
                                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                                    : cluster.status === "in_progress"
                                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800"
                                      : cluster.status === "assigned"
                                        ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800"
                                        : cluster.status === "reinspection_pending"
                                          ? "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-800"
                                          : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800"
                                }`}
                              >
                                <option value="open">OPEN</option>
                                <option value="assigned">ASSIGNED</option>
                                <option value="in_progress">IN PROGRESS</option>
                                <option value="resolved">RESOLVED</option>
                                <option value="reinspection_pending">REINSPECTION</option>
                                <option value="verified_closed">VERIFIED CLOSED</option>
                                <option value="disputed">DISPUTED</option>
                              </select>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openConsole(cluster, 'cad_audit')}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold text-[11px] flex items-center gap-1 transition"
                                  title="Audit Contractor Repair Quality with Before/After Slider & Volumetrics"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                  <span>Audit &amp; Dispatch</span>
                                </button>

                                {isRoadSurfaceDefect(cluster.defect_name || cluster.defect_type) && (
                                  <button
                                    onClick={() => setInspectingMeshCluster(cluster)}
                                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-semibold text-[11px] flex items-center gap-1 transition"
                                    title="Inspect 3D Surface Depth Mesh for this road defect"
                                  >
                                    <Box className="w-3.5 h-3.5" />
                                    <span>3D Mesh</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => openConsole(cluster, 'dispatch')}
                                  disabled={!canDispatchWorkOrder}
                                  className={`p-1.5 rounded-lg border transition ${
                                    canDispatchWorkOrder
                                      ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                                      : 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                                  }`}
                                  title={canDispatchWorkOrder ? "Instant WhatsApp & QR Dispatch" : "Dispatch disabled: Read-Only Analyst role"}
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {filteredClusters.length > PAGE_SIZE && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs text-slate-500 dark:text-slate-400">
                  <div>
                    Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.min(currentPage * PAGE_SIZE, filteredClusters.length)}</span> of{' '}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredClusters.length}</span> work orders
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2.5 py-1 rounded-lg font-medium text-slate-700 dark:text-slate-300">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                      title="Next Page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

      </div>

      {/* UNIFIED WORK ORDER ACTION CONSOLE */}
      <WorkOrderActionConsole
        isOpen={isConsoleOpen}
        onClose={() => setIsConsoleOpen(false)}
        cluster={consoleCluster}
        initialTab={consoleTab}
        onAutoClose={(clusterId, afterImg, notes) => {
          requestStatusUpdate(clusterId, 'verified_closed', afterImg, notes);
          setIsConsoleOpen(false);
        }}
        onUpdateStatus={(orderId, status, afterImg, notes) => {
          requestStatusUpdate(orderId, status, afterImg, notes);
        }}
      />

      {/* 3D Surface Depth Mesh Visualizer for road surface defects */}
      {inspectingMeshCluster && (
        <RoadMeshVisualizerModal
          isOpen={!!inspectingMeshCluster}
          onClose={() => setInspectingMeshCluster(null)}
          hazardId={inspectingMeshCluster.cluster_code || inspectingMeshCluster.id}
          locationName={`${inspectingMeshCluster.road_name} • ${inspectingMeshCluster.defect_name}`}
          depthCm={inspectingMeshCluster.defect_type === "D40" ? 8.4 : 5.2}
          areaM2={inspectingMeshCluster.defect_type === "D40" ? 0.65 : 0.40}
          volumeLiters={calculateMaterial(inspectingMeshCluster).volumeLiters}
          costInr={calculateMaterial(inspectingMeshCluster).costInr}
          iriScore={inspectingMeshCluster.defect_type === "D40" ? 4.82 : 3.65}
          sensorGz={inspectingMeshCluster.defect_type === "D40" ? 2.8 : 1.6}
          cameraConfidence={94}
          defectType={inspectingMeshCluster.defect_name}
          onDispatchWorkOrder={() => {
            requestStatusUpdate(inspectingMeshCluster.id, 'in_progress');
            setInspectingMeshCluster(null);
          }}
          canDispatchWorkOrder={canDispatchWorkOrder}
        />
      )}
    </div>
  );
};
