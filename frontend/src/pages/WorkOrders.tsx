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
import { ContractorAuditModal } from '../components/modals/ContractorAuditModal';
import { WhatsAppDispatchModal } from '../components/modals/WhatsAppDispatchModal';
import { FleetRepassModal } from '../components/modals/FleetRepassModal';
import { RoadMeshVisualizerModal, isRoadSurfaceDefect } from '../components/modals/RoadMeshVisualizerModal';
import { EmptyState } from '../components/common/EmptyState';
import { MultiBusTruthBadge } from '../components/triage/MultiBusTruthBadge';
import { useAuth } from '../context/AuthContext';
import { ContractorEscrowLedger } from '../components/workorders/ContractorEscrowLedger';
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

  const [activeTab, setActiveTab] = useState<'cad' | 'kanban' | 'escrow'>('cad');

  const requestStatusUpdate = (orderId: string, status: WorkOrderStatus, afterImg?: string, notes?: string) => {
    if (!canDispatchWorkOrder) return;
    onUpdateStatus(orderId, status, afterImg, notes);
  };

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // Modals state
  const [selectedAuditWO, setSelectedAuditWO] = useState<{ id: string; contractor: string; location: string } | null>(null);
  const [whatsAppCluster, setWhatsAppCluster] = useState<HazardCluster | null>(null);
  const [isRepassModalOpen, setIsRepassModalOpen] = useState(false);
  const [inspectingCluster, setInspectingCluster] = useState<HazardCluster | null>(null);
  const [inspectingMeshCluster, setInspectingMeshCluster] = useState<HazardCluster | null>(null);

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

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
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
    const header = "Ticket,Corridor,Defect,Severity,RPI,Status,Contractor,Estimated_Cost_INR\n";
    const rows = clusters.map(c => 
      `${c.cluster_code || c.id},"${c.road_name || 'Corridor'}",${c.defect_name},${c.severity_level},${c.rpi_score},${c.status},"${c.assigned_agency || 'Apex Infra'}",${calculateMaterial(c).costInr}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `work_orders_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar bg-[#EEF2F7] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 select-none transition-colors">
      <div className="p-5 md:p-6 lg:p-7 space-y-5 max-w-[1700px] mx-auto w-full">
        
        {/* 1. TOP TITLE & ACTIONS BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-xs">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight font-sans">
                Municipal Work Orders &amp; Contractor Escrow
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Autonomous contract routing, smart escrow auto-penalty ledger, and proof-of-repair verification.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            <div className="flex bg-[#F8FAFD] dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('cad')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'cad'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                CAD Table
              </button>
              <button
                onClick={() => setActiveTab('kanban')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'kanban'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Kanban Board</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </button>
              <button
                onClick={() => setActiveTab('escrow')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'escrow'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Escrow &amp; SLA</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </button>
            </div>

            <button
              onClick={() => setIsRepassModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F8FAFD] dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Fleet Re-Pass</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-900/20 transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {activeTab === 'escrow' ? (
          <ContractorEscrowLedger clusters={clusters} />
        ) : activeTab === 'kanban' ? (
          /* KANBAN BOARD 4-SWIMLANE VIEW */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Lane 1: Auto-Detected (Open) */}
              <div className="flex flex-col bg-slate-100/80 dark:bg-[#0c101c] rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">1. Auto-Detected (Open)</h4>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                    {clusters.filter(c => c.status === 'open').length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[68vh] custom-scrollbar pr-1">
                  {clusters.filter(c => c.status === 'open').map(c => (
                    <div key={c.id} className="p-3.5 rounded-xl bg-white dark:bg-[#131826] border border-rose-200 dark:border-rose-900/40 shadow-xs space-y-2.5 hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-extrabold text-xs text-rose-600 dark:text-rose-400">{c.cluster_code || c.id}</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-900/30 text-rose-600 border border-rose-200 dark:border-rose-800">
                          RPI {c.rpi_boosted ?? c.rpi_score}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{c.road_name}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{c.defect_name}</span>
                        <span className="text-rose-600 font-semibold font-mono">SLA: {c.sla_hours}h</span>
                      </div>
                      <button
                        onClick={() => requestStatusUpdate(c.id, 'assigned')}
                        className="w-full py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-600 hover:text-white text-blue-700 dark:text-blue-300 font-bold text-[11px] border border-blue-200 dark:border-blue-800 transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Assign to Contractor</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lane 2: Assigned to Contractor */}
              <div className="flex flex-col bg-slate-100/80 dark:bg-[#0c101c] rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">2. Contractor Assigned</h4>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                    {clusters.filter(c => c.status === 'assigned').length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[68vh] custom-scrollbar pr-1">
                  {clusters.filter(c => c.status === 'assigned').map(c => (
                    <div key={c.id} className="p-3.5 rounded-xl bg-white dark:bg-[#131826] border border-amber-200 dark:border-amber-900/40 shadow-xs space-y-2.5 hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-extrabold text-xs text-amber-600 dark:text-amber-400">{c.cluster_code || c.id}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {c.assigned_agency}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{c.road_name}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Est: ₹{calculateMaterial(c).costInr}</span>
                        <span className="text-amber-600 font-mono font-semibold">24h Active</span>
                      </div>
                      <button
                        onClick={() => requestStatusUpdate(c.id, 'in_progress')}
                        className="w-full py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-600 hover:text-white text-amber-800 dark:text-amber-300 font-bold text-[11px] border border-amber-200 dark:border-amber-800 transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Commence Staging &amp; Repair</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lane 3: Under Repair (SLA Active) */}
              <div className="flex flex-col bg-slate-100/80 dark:bg-[#0c101c] rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">3. Under Repair (In Progress)</h4>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                    {clusters.filter(c => c.status === 'in_progress').length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[68vh] custom-scrollbar pr-1">
                  {clusters.filter(c => c.status === 'in_progress').map(c => (
                    <div key={c.id} className="p-3.5 rounded-xl bg-white dark:bg-[#131826] border border-blue-200 dark:border-blue-900/40 shadow-xs space-y-2.5 hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-extrabold text-xs text-blue-600 dark:text-blue-400">{c.cluster_code || c.id}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 border border-blue-200 dark:border-blue-800">
                          VG-30 Hot Mix
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{c.road_name}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{c.assigned_agency}</span>
                        <span className="text-blue-600 font-mono font-semibold">Rolling In Progress</span>
                      </div>
                      <button
                        onClick={() => requestStatusUpdate(c.id, 'verified_closed', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80', '[AUTONOMOUS_FLEET_CLOSURE] Verified closed by Fleet Node BUS-MTC-19B on re-pass patrol. Gz=0.98g normal.')}
                        className="w-full py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-600 hover:text-white text-emerald-800 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800 transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-500" />
                        <span>Simulate Fleet Re-pass Close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lane 4: Fleet Re-Pass Verified & Closed */}
              <div className="flex flex-col bg-slate-100/80 dark:bg-[#0c101c] rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">4. Re-Pass Verified &amp; Closed</h4>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    {clusters.filter(c => c.status === 'verified_closed' || c.status === 'resolved').length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[68vh] custom-scrollbar pr-1">
                  {clusters.filter(c => c.status === 'verified_closed' || c.status === 'resolved').map(c => (
                    <div key={c.id} className="p-3.5 rounded-xl bg-white dark:bg-[#131826] border border-emerald-200 dark:border-emerald-900/40 shadow-xs space-y-2.5 hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-extrabold text-xs text-emerald-600 dark:text-emerald-400">{c.cluster_code || c.id}</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          ✓ Gz = 0.98g
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{c.road_name}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="text-emerald-600 font-semibold font-mono">MoHUA Hash Verified</span>
                        <span>Passes: {c.pass_count}</span>
                      </div>
                      <div className="w-full py-1 rounded-lg bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold text-[10.5px] text-center border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Escrow Escrow Released</span>
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
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-900/10 via-emerald-900/10 to-blue-900/10 dark:from-blue-950/40 dark:via-emerald-950/40 dark:to-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 shadow-xs">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                      {t("lifecycle.title", "Autonomous Defect-to-Closure Lifecycle")}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-bold border border-emerald-300 dark:border-emerald-700">
                      Zero Human Paperwork
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {t("lifecycle.subtitle", "Edge AI Detection -> Auto-Case Open -> SLA Repair -> Fleet Re-Pass Autonomous Closure")}
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                  <button
                    onClick={handleRunLifecycleDrill}
                    disabled={isDrillRunning}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-900/20 transition active:scale-95 disabled:opacity-60 cursor-pointer"
                  >
                    <Sparkles className={`w-4 h-4 ${isDrillRunning ? 'animate-spin' : ''}`} />
                    <span>
                      {isDrillRunning 
                        ? t("lifecycle.runningDrill", "Simulating Autonomous Lifecycle...") 
                        : t("lifecycle.runDrill", "Simulate Auto-Detection -> Re-Pass Closure")}
                    </span>
                  </button>
                </div>
              </div>

              {/* 4 Pipeline Stages Progress Visualization */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 text-[11px] font-mono">
                <div className={`p-2 rounded-xl border flex items-center gap-2 transition ${
                  drillStep === 1 
                    ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 text-blue-800 dark:text-blue-200 ring-2 ring-blue-400 font-bold' 
                    : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  <span className="w-5 h-5 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                  <span className="truncate">{t("lifecycle.step1", "1. AI + IMU Shock Detection")}</span>
                </div>

                <div className={`p-2 rounded-xl border flex items-center gap-2 transition ${
                  drillStep === 2 
                    ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-400 text-amber-800 dark:text-amber-200 ring-2 ring-amber-400 font-bold' 
                    : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  <span className="w-5 h-5 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                  <span className="truncate">{t("lifecycle.step2", "2. Auto-Case Open (SLA)")}</span>
                </div>

                <div className={`p-2 rounded-xl border flex items-center gap-2 transition ${
                  drillStep === 3 
                    ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-400 text-purple-800 dark:text-purple-200 ring-2 ring-purple-400 font-bold' 
                    : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  <span className="w-5 h-5 rounded-lg bg-purple-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                  <span className="truncate">{t("lifecycle.step3", "3. Contractor Patch")}</span>
                </div>

                <div className={`p-2 rounded-xl border flex items-center gap-2 transition ${
                  drillStep === 4 
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-400 font-bold' 
                    : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  <span className="w-5 h-5 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">4</span>
                  <span className="truncate">{t("lifecycle.step4", "4. Fleet Re-Pass Auto-Closure")}</span>
                </div>
              </div>
            </div>

            {/* 2. TOP 4 KPI SUMMARY CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Orders */}
              <div className="p-4 rounded-2xl bg-[#F8FAFD] dark:bg-[#0E1424] border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Work Orders</span>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-sans mt-0.5">{totalCount}</div>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">100% Tracked in CAD</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5" />
                </div>
              </div>

              {/* Card 2: Open / Pending */}
              <div className="p-4 rounded-2xl bg-[#F8FAFD] dark:bg-[#0E1424] border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending / Open</span>
                  <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-sans mt-0.5">{openCount}</div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Under 24h/48h SLA</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              {/* Card 3: In Progress */}
              <div className="p-4 rounded-2xl bg-[#F8FAFD] dark:bg-[#0E1424] border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">In Progress</span>
                  <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-sans mt-0.5">{inProgressCount}</div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Contractor dispatched</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
              </div>

              {/* Card 4: Estimated Budget */}
              <div className="p-4 rounded-2xl bg-[#F8FAFD] dark:bg-[#0E1424] border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Est. Repair Budget</span>
                  <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-sans mt-0.5">₹{totalBudget.toLocaleString()}</div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">MORTH 2025 Schedule of Rates</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* 3. SEARCH & FILTERS BAR */}
            <div className="p-3 rounded-2xl bg-[#F8FAFD] dark:bg-[#0E1424] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Ticket ID, Road, Defect, Contractor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#EEF2F7] dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-[#EEF2F7] dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open / Unassigned</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="verified_closed">Verified Closed</option>
                </select>

                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-[#EEF2F7] dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                {(search || statusFilter !== 'all' || severityFilter !== 'all') && (
                  <button
                    onClick={() => { setSearch(''); setStatusFilter('all'); setSeverityFilter('all'); }}
                    className="h-9 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* 4. WORK ORDERS TABLE */}
            <div className="rounded-2xl bg-[#F8FAFD] dark:bg-[#0E1424] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-[#F0F4FA] dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10.5px]">
                      <th className="py-3 px-4">Ticket / RPI</th>
                      <th className="py-3 px-4">Hazard & Location</th>
                      <th className="py-3 px-4">Material Estimate</th>
                      <th className="py-3 px-4">Contractor & Contact</th>
                      <th className="py-3 px-4">SLA Deadline</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredClusters.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <EmptyState
                            icon={ClipboardList}
                            title="No work orders match your filters"
                            description="Try adjusting your search query, status filter, or severity level."
                            actionLabel="Clear Filters"
                            onAction={() => { setSearch(''); setStatusFilter('all'); setSeverityFilter('all'); }}
                          />
                        </td>
                      </tr>
                    ) : (
                      paginatedClusters.map((cluster) => {
                        const material = calculateMaterial(cluster);
                        const isClosed = cluster.status === 'verified_closed' || cluster.status === 'resolved';

                        return (
                          <tr 
                            key={cluster.id}
                            className="hover:bg-slate-100/70 dark:hover:bg-slate-850/50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="font-mono font-bold text-slate-900 dark:text-white">
                                {cluster.cluster_code || cluster.id}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-slate-400">RPI:</span>
                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                  {cluster.rpi_score}
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                  cluster.severity_level === 'critical'
                                    ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                                    : cluster.severity_level === 'high'
                                      ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                                      : 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                                }`}>
                                  {cluster.severity_level}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {cluster.defect_name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">
                                {cluster.road_name || "Chennai Metropolitan Corridor"}
                              </div>
                              <div className="mt-1.5">
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
                                disabled={!canDispatchWorkOrder}
                                title={canDispatchWorkOrder ? 'Update work order status' : 'Status changes require a Road Maintenance Officer or Platform Administrator role.'}
                                className={`px-2 py-1 rounded-lg text-xs font-bold outline-none cursor-pointer border disabled:opacity-45 disabled:cursor-not-allowed ${
                                  isClosed
                                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                                    : cluster.status === "in_progress"
                                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800"
                                      : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800"
                                }`}
                              >
                                <option value="open">OPEN</option>
                                <option value="assigned">ASSIGNED</option>
                                <option value="in_progress">IN PROGRESS</option>
                                <option value="verified_closed">VERIFIED CLOSED</option>
                              </select>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedAuditWO({
                                    id: cluster.cluster_code || cluster.id,
                                    contractor: cluster.assigned_agency || "Apex Urban Infra Ltd",
                                    location: cluster.road_name || "GST Road (NH-32) Tambaram"
                                  })}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-semibold text-[11px] flex items-center gap-1 transition"
                                  title="Audit Contractor Repair Quality with Before/After Slider"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>Audit Proof</span>
                                </button>

                                {isRoadSurfaceDefect(cluster.defect_name || cluster.defect_type) && (
                                  <button
                                    onClick={() => setInspectingMeshCluster(cluster)}
                                    className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-700 dark:text-blue-400 border border-blue-500/30 font-semibold text-[11px] flex items-center gap-1 transition"
                                    title="Inspect 3D Surface Depth Mesh for this road defect"
                                  >
                                    <Box className="w-3.5 h-3.5" />
                                    <span>3D Mesh</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    if (!canDispatchWorkOrder) return;
                                    setWhatsAppCluster(cluster);
                                  }}
                                  disabled={!canDispatchWorkOrder}
                                  className={`p-1.5 rounded-lg border transition ${
                                    canDispatchWorkOrder
                                      ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                      : 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                                  }`}
                                  title={canDispatchWorkOrder ? "Instant WhatsApp Dispatch to Contractor" : "Dispatch disabled: Read-Only Analyst role"}
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => setInspectingCluster(cluster)}
                                  className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                                  title="Inspect Photo Evidence"
                                >
                                  <Eye className="w-3.5 h-3.5" />
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-[#F0F4FA] dark:bg-slate-900/60 text-xs text-slate-500 dark:text-slate-400">
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

      {/* MODAL 1: AI Contractor Before/After Audit Modal */}
      {selectedAuditWO && (
        <ContractorAuditModal
          isOpen={!!selectedAuditWO}
          onClose={() => setSelectedAuditWO(null)}
          workOrderId={selectedAuditWO.id}
          contractorName={selectedAuditWO.contractor}
          locationName={selectedAuditWO.location}
          onApprove={() => {
            const match = clusters.find(c => (c.cluster_code || c.id) === selectedAuditWO.id);
            if (match) requestStatusUpdate(match.id, 'verified_closed');
            setSelectedAuditWO(null);
          }}
          canApprove={canDispatchWorkOrder}
        />
      )}

      {/* MODAL 2: WhatsApp Dispatch Modal */}
      {whatsAppCluster && (
        <WhatsAppDispatchModal
          isOpen={!!whatsAppCluster}
          onClose={() => setWhatsAppCluster(null)}
          cluster={whatsAppCluster}
        />
      )}

      {/* MODAL 3: Fleet Re-Pass Autonomous Modal */}
      <FleetRepassModal
        isOpen={isRepassModalOpen}
        onClose={() => setIsRepassModalOpen(false)}
        clusters={clusters}
        onAutoClose={(clusterId) => {
          requestStatusUpdate(clusterId, 'verified_closed');
          setIsRepassModalOpen(false);
        }}
      />

      {/* MODAL 5: 3D Surface Depth Mesh Visualizer for this particular issue */}
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

      {/* MODAL 4: Evidence Inspection Dialog */}
      {inspectingCluster && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn select-none"
          onClick={(e) => { if (e.target === e.currentTarget) setInspectingCluster(null); }}
        >
          <div className="bg-[#0B101D] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl p-5 text-white animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="font-bold text-sm">
                Evidence: {inspectingCluster.cluster_code || inspectingCluster.id}
              </div>
              <button onClick={() => setInspectingCluster(null)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-800 aspect-video flex items-center justify-center">
                {inspectingCluster.before_image_url ? (
                  <img src={inspectingCluster.before_image_url} alt="Evidence" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4 text-slate-400">
                    <Camera className="w-8 h-8 mx-auto mb-1 text-slate-500" />
                    <span className="text-xs">Camera Snapshot Captured from Bus Dashcam</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-300 space-y-1">
                <div><strong>Defect:</strong> {inspectingCluster.defect_name}</div>
                <div><strong>Corridor:</strong> {inspectingCluster.road_name || "GST Road (NH-32) Tambaram"}</div>
                <div><strong>GPS:</strong> {inspectingCluster.lat?.toFixed(4)}, {inspectingCluster.lng?.toFixed(4)}</div>
                <div><strong>Status:</strong> {inspectingCluster.status.toUpperCase()}</div>
              </div>

              <button
                onClick={() => setInspectingCluster(null)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-xs transition mt-2"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
