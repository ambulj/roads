import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Printer,
  AlertOctagon,
  Zap
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

export interface SvgGaugeProps {
  percentage: number;
  strokeColor: string;
  trackColor?: string;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

export const SvgGauge: React.FC<SvgGaugeProps> = ({
  percentage,
  strokeColor,
  trackColor = "stroke-slate-200 dark:stroke-slate-800",
  size = 48,
  strokeWidth = 4,
  children
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`${trackColor} fill-transparent`}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`${strokeColor} fill-transparent transition-all duration-700 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
};

interface WorkOrdersProps {
  clusters: HazardCluster[];
  onUpdateStatus: (orderId: string, status: WorkOrderStatus, afterImg?: string, notes?: string) => void;
}

type SortField = 'code' | 'rpi' | 'road' | 'cost' | 'sla' | 'status';
type SortDirection = 'asc' | 'desc';

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

  // Tab View with Query Sync (e.g. ?tab=sla or ?tab=cad)
  const getInitialTab = (): 'cad' | 'kanban' | 'sla' => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const query = hash.split('?')[1];
      if (query) {
        const params = new URLSearchParams(query);
        const t = params.get('tab');
        if (t === 'sla' || t === 'ledger') return 'sla';
        if (t === 'kanban') return 'kanban';
        if (t === 'cad' || t === 'backlog') return 'cad';
      }
    }
    return 'cad';
  };

  const [activeTab, setActiveTab] = useState<'cad' | 'kanban' | 'sla'>(getInitialTab);

  const handleTabChange = (tab: 'cad' | 'kanban' | 'sla') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const [base] = window.location.hash.split('?');
      window.location.hash = `${base || '#/work-orders'}?tab=${tab}`;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const query = hash.split('?')[1];
      if (query) {
        const params = new URLSearchParams(query);
        const t = params.get('tab');
        if (t === 'sla' || t === 'ledger') setActiveTab('sla');
        else if (t === 'kanban') setActiveTab('kanban');
        else if (t === 'cad' || t === 'backlog') setActiveTab('cad');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Search, Filter Chips & Sorting States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [contractorFilter, setContractorFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('rpi');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isDrillExpanded, setIsDrillExpanded] = useState<boolean>(false);

  const hasActiveFilters = Boolean(
    search.trim() || statusFilter !== 'all' || severityFilter !== 'all' || contractorFilter !== 'all'
  );

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSeverityFilter('all');
    setContractorFilter('all');
  };

  const [inspectingMeshCluster, setInspectingMeshCluster] = useState<HazardCluster | null>(null);

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
          const auditNotes = `[AUTONOMOUS_FLEET_CLOSURE] Verified closed by Fleet Node BUS-MTC-19B on re-pass patrol. Telemetry: Gz vertical shock = 0.98g (nominal baseline, threshold < 1.15g). Optical AI: Defect cavity 0% detected per IRC:82 standard. MoHUA cryptographic audit logged.`;
          
          onUpdateStatus(
            newClusterId,
            'verified_closed' as WorkOrderStatus,
            'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=800&auto=format&fit=crop&q=80',
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

  const requestStatusUpdate = (orderId: string, status: WorkOrderStatus, afterImg?: string, notes?: string) => {
    onUpdateStatus(orderId, status, afterImg, notes);
    showSuccessToast(
      "Work Order Updated",
      `Order #${orderId} marked as ${status.replace('_', ' ').toUpperCase()}`
    );
  };

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filtered & Sorted Tickets
  const filteredAndSortedClusters = useMemo(() => {
    const filtered = clusters.filter((c) => {
      const matchesSearch = 
        (c.cluster_code && c.cluster_code.toLowerCase().includes(search.toLowerCase())) ||
        (c.road_name && c.road_name.toLowerCase().includes(search.toLowerCase())) ||
        (c.defect_name && c.defect_name.toLowerCase().includes(search.toLowerCase())) ||
        (c.assigned_agency && c.assigned_agency.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = 
        statusFilter === 'all' || 
        c.status === statusFilter || 
        (statusFilter === 'verified_closed' && (c.status === 'resolved' || c.status === 'verified_closed')) ||
        (statusFilter === 'active' && c.status !== 'resolved' && c.status !== 'verified_closed') ||
        (statusFilter === 'breached' && (c as any).is_breached);

      const matchesSeverity = severityFilter === 'all' || c.severity_level === severityFilter;

      const matchesContractor = contractorFilter === 'all' || 
        (c.assigned_agency && c.assigned_agency.toLowerCase().includes(contractorFilter.toLowerCase()));

      return matchesSearch && matchesStatus && matchesSeverity && matchesContractor;
    });

    return filtered.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      switch (sortField) {
        case 'code':
          valA = a.cluster_code || a.id;
          valB = b.cluster_code || b.id;
          break;
        case 'rpi':
          valA = a.rpi_boosted ?? a.rpi_score ?? 0;
          valB = b.rpi_boosted ?? b.rpi_score ?? 0;
          break;
        case 'road':
          valA = a.road_name || '';
          valB = b.road_name || '';
          break;
        case 'cost':
          valA = calculateMaterial(a).costInr;
          valB = calculateMaterial(b).costInr;
          break;
        case 'sla':
          valA = a.sla_hours || 24;
          valB = b.sla_hours || 24;
          break;
        case 'status':
          valA = a.status || '';
          valB = b.status || '';
          break;
      }

      if (typeof valA === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
  }, [clusters, search, statusFilter, severityFilter, contractorFilter, sortField, sortDirection]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, severityFilter, contractorFilter, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedClusters.length / PAGE_SIZE));
  const paginatedClusters = filteredAndSortedClusters.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Executive KPI calculations
  const totalCount = clusters.length;
  const activeClusters = useMemo(() => 
    clusters.filter(c => ['open', 'assigned', 'in_progress', 'reinspection_pending'].includes(c.status)),
    [clusters]
  );
  const activeCount = activeClusters.length;
  const inProgressCount = useMemo(() => 
    clusters.filter(c => c.status === 'in_progress' || c.status === 'reinspection_pending').length,
    [clusters]
  );
  const closedCount = useMemo(() => 
    clusters.filter(c => c.status === 'verified_closed' || c.status === 'resolved').length,
    [clusters]
  );
  const completionRatio = totalCount > 0 ? (closedCount / totalCount) * 100 : 0;

  const criticalClusters = useMemo(() => 
    clusters.filter(c => 
      (c.severity_level === 'critical' || (c as any).severity === 'critical' || (c.sla_hours || 24) <= 6 || (c as any).is_breached) &&
      !['resolved', 'verified_closed'].includes(c.status)
    ),
    [clusters]
  );
  const criticalCount = criticalClusters.length;
  const breachedCount = useMemo(() => 
    clusters.filter(c => ((c as any).is_breached || (c.sla_hours || 24) <= 0) && !['resolved', 'verified_closed'].includes(c.status)).length,
    [clusters]
  );
  const criticalRiskRatio = activeCount > 0 ? Math.min(100, (criticalCount / activeCount) * 100) : 0;

  const totalBudget = useMemo(() => 
    clusters.reduce((acc, c) => acc + calculateMaterial(c).costInr, 0),
    [clusters]
  );
  const activeAtRiskBudget = useMemo(() => 
    activeClusters.reduce((acc, c) => acc + calculateMaterial(c).costInr, 0),
    [activeClusters]
  );
  const escrowExposureRatio = totalBudget > 0 ? Math.min(100, (activeAtRiskBudget / totalBudget) * 100) : 0;

  const verifiedClusters = useMemo(() => 
    clusters.filter(c => c.status === 'verified_closed' || (c.total_observations && c.total_observations >= 3)),
    [clusters]
  );
  const verifiedCount = verifiedClusters.length;
  const verificationRatio = totalCount > 0 ? Math.min(100, (verifiedCount / totalCount) * 100) : 100;

  const handleExportCSV = () => {
    window.open('/api/work-orders/export/csv', '_blank');
    showInfoToast("Exporting PWD Work Orders", "Streaming complete work order backlog audit trail in CSV format.");
  };

  const contractorsList = [
    { label: 'All Agencies', value: 'all' },
    { label: 'L&T Highways', value: 'L&T' },
    { label: 'GMR Urban', value: 'GMR' },
    { label: 'TNRDC', value: 'TNRDC' },
    { label: 'HCC', value: 'HCC' },
    { label: 'Chettinad', value: 'Chettinad' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 select-none transition-colors">
      <div className="p-4 sm:p-5 md:p-6 space-y-4 max-w-[1700px] mx-auto w-full">
        
        {/* 1. SLEEK INTEGRATED COMMAND NAVBAR */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
          {/* Left: Branding & Overview Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight leading-none">
                  Municipal Work Orders &amp; SLA Cockpit
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 tabular-nums">
                  {totalCount} Total · {activeCount} Active
                </span>
              </div>
              <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-1 leading-none">
                Autonomous Contractual DLP dispatch, statutory SLA compliance &amp; multi-pass concurrence verification.
              </p>
            </div>
          </div>

          {/* Center & Right: Workspace Switcher & Primary Action Controls */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between xl:justify-end">
            {/* 3-Workspace Segmented Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl">
              <button
                onClick={() => handleTabChange('cad')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'cad'
                    ? 'font-bold bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-xs border border-slate-200/80 dark:border-slate-700'
                    : 'font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                <span>CAD Backlog</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-mono ${
                  activeTab === 'cad' 
                    ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold' 
                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {filteredAndSortedClusters.length}
                </span>
              </button>

              <button
                onClick={() => handleTabChange('kanban')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'kanban'
                    ? 'font-bold bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-xs border border-slate-200/80 dark:border-slate-700'
                    : 'font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                <span>Kanban Board</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </button>

              <button
                onClick={() => handleTabChange('sla')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'sla'
                    ? 'font-bold bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-xs border border-slate-200/80 dark:border-slate-700'
                    : 'font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                <span>Contractor SLA Ledger</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              <SyntheticGeneratorControl />

              <button
                onClick={() => openConsole(clusters[0] || null, 'concurrence_release')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-xs font-semibold text-emerald-800 dark:text-emerald-200 transition cursor-pointer"
                title="Verify Multi-Pass Sensor Concurrence for Payment Clearance"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Concurrence Gate</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition active:scale-95 cursor-pointer shadow-xs"
                title="Export complete Work Orders register to RFC 4180 CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* EXECUTIVE TOP METRICS STRIP (4 PERSISTENT SCORECARDS WITH PURE SVG CIRCULAR GAUGES) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Active Work Orders */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Work Orders</span>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                  {activeCount}
                </div>
                <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                  {inProgressCount} repairs in progress
                </div>
              </div>
              <SvgGauge
                percentage={completionRatio}
                strokeColor="stroke-indigo-600 dark:stroke-indigo-400"
                trackColor="stroke-slate-100 dark:stroke-slate-800"
                size={52}
                strokeWidth={4.5}
              >
                <span className="font-mono text-[10px] font-bold text-indigo-700 dark:text-indigo-300 tabular-nums">
                  {Math.round(completionRatio)}%
                </span>
              </SvgGauge>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10.5px] text-slate-500 dark:text-slate-400">
              Repairs actively underway in city corridors
            </div>
          </div>

          {/* Card 2: Critical P0 SLA Breaches & Countdowns */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Critical P0 SLA Breaches</span>
                <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                  {criticalCount}
                </div>
                <div className="text-[11px] text-rose-500 font-medium">
                  {breachedCount} breached / overdue
                </div>
              </div>
              <SvgGauge
                percentage={criticalRiskRatio}
                strokeColor="stroke-rose-600 dark:stroke-rose-400"
                trackColor="stroke-rose-100 dark:stroke-rose-950/40"
                size={52}
                strokeWidth={4.5}
              >
                <span className="font-mono text-[10px] font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                  {Math.round(criticalRiskRatio)}%
                </span>
              </SvgGauge>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10.5px] text-slate-500 dark:text-slate-400">
              &lt;6h or SLA breached &bull; MoRTH penalty liability
            </div>
          </div>

          {/* Card 3: Total Escrow Under Statutory Notice */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Total Escrow Under Statutory Notice</span>
                <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                  ₹{(activeAtRiskBudget / 100000).toFixed(2)} L
                </div>
                <div className="text-[11px] text-amber-600/80 font-medium">
                  Contractual DLP 7-Day Cure Window Exposure
                </div>
              </div>
              <SvgGauge
                percentage={escrowExposureRatio}
                strokeColor="stroke-amber-600 dark:stroke-amber-400"
                trackColor="stroke-amber-100 dark:stroke-amber-950/40"
                size={52}
                strokeWidth={4.5}
              >
                <span className="font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                  {Math.round(escrowExposureRatio)}%
                </span>
              </SvgGauge>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10.5px] text-slate-500 dark:text-slate-400">
              Form 14 show-cause &bull; 7-day cure window active
            </div>
          </div>

          {/* Card 4: 3-Pass Verified Repairs */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">3-Pass Verified Repairs</span>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                  {verifiedCount}
                </div>
                <div className="text-[11px] text-emerald-600 font-medium">
                  100% sensor consensus
                </div>
              </div>
              <SvgGauge
                percentage={verificationRatio}
                strokeColor="stroke-emerald-600 dark:stroke-emerald-400"
                trackColor="stroke-emerald-100 dark:stroke-emerald-950/40"
                size={52}
                strokeWidth={4.5}
              >
                <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {Math.round(verificationRatio)}%
                </span>
              </SvgGauge>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10.5px] text-slate-500 dark:text-slate-400">
              Multi-bus consensus &bull; Ready for escrow release
            </div>
          </div>
        </div>

        {activeTab === 'sla' ? (
          <ContractorSlaLedger clusters={clusters} />
        ) : activeTab === 'kanban' ? (
          /* MODERNIZED HIGH-CONTRAST KANBAN BOARD (4 OPERATIONAL SWIMLANES) */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Lane 1: Assigned */}
              <div className="flex flex-col bg-slate-100/80 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">1. Assigned</h4>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 tabular-nums">
                    {clusters.filter(c => c.status === 'assigned' || c.status === 'open').length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[68vh] custom-scrollbar pr-1">
                  {clusters.filter(c => c.status === 'assigned' || c.status === 'open').map(c => {
                    const material = calculateMaterial(c);
                    const remainingHours = c.sla_hours || 24;
                    const isBreached = (c as any).is_breached || remainingHours <= 0;
                    const slaPercent = Math.min(100, Math.max(10, (remainingHours / 24) * 100));
                    const ringColor = isBreached || remainingHours < 6 ? 'stroke-rose-500' : remainingHours <= 12 ? 'stroke-amber-500' : 'stroke-emerald-500';

                    return (
                      <div key={c.id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition space-y-2.5">
                        <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-950 group">
                          <img
                            src={c.before_image_url || (c as any).evidence_img || "/evidence/bus_pass_1_detect.jpg"}
                            alt={c.defect_name || "Defect"}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/evidence/bus_pass_1_detect.jpg";
                            }}
                          />
                          <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                            <span className="font-mono font-extrabold text-[10px] px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-white border border-white/20 tabular-nums">
                              {c.cluster_code || c.id}
                            </span>
                          </div>
                          <div className="absolute top-1.5 right-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold font-mono border backdrop-blur-xs tabular-nums ${
                              c.severity_level === 'critical'
                                ? 'bg-rose-950/80 text-rose-300 border-rose-700'
                                : c.severity_level === 'high'
                                  ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                                  : 'bg-slate-900/80 text-slate-300 border-slate-700'
                            }`}>
                              RPI {c.rpi_boosted ?? c.rpi_score ?? 75}
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {c.road_name || "Chennai Metropolitan Corridor"}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="truncate max-w-[150px]">{c.defect_name}</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              ₹{material.costInr.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                          <div className="flex items-center gap-1.5">
                            <SvgGauge
                              percentage={slaPercent}
                              strokeColor={ringColor}
                              trackColor="stroke-slate-200 dark:stroke-slate-800"
                              size={28}
                              strokeWidth={3}
                            >
                              <Clock className={`w-2.5 h-2.5 ${isBreached || remainingHours < 6 ? 'text-rose-500' : remainingHours <= 12 ? 'text-amber-500' : 'text-emerald-500'}`} />
                            </SvgGauge>
                            <div className="font-mono text-[10px] leading-tight">
                              <div className={`font-bold tabular-nums ${isBreached || remainingHours < 6 ? 'text-rose-600 dark:text-rose-400' : remainingHours <= 12 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {remainingHours}h SLA
                              </div>
                              <div className="text-[9px] text-slate-400">
                                {isBreached ? 'Breached' : `${remainingHours}h left`}
                              </div>
                            </div>
                          </div>

                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold truncate max-w-[120px]" title={c.assigned_agency}>
                            {c.assigned_agency || "L&T Highways"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>Concurrence Pending</span>
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openConsole(c, 'cad_audit')}
                              className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                              title="Inspect CAD Audit"
                            >
                              <Eye className="w-3 h-3 text-blue-500" />
                            </button>
                            <button
                              onClick={() => openConsole(c, 'contractor_sla')}
                              disabled={!canDispatchWorkOrder}
                              className={`p-1 rounded transition ${
                                canDispatchWorkOrder
                                  ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer'
                                  : 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                              }`}
                              title="Dispatch Notice"
                            >
                              <Send className="w-3 h-3 text-indigo-500" />
                            </button>
                            <button
                              onClick={() => openConsole(c, 'concurrence_release')}
                              className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                              title="Release Escrow Concurrence"
                            >
                              <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => requestStatusUpdate(c.id, 'in_progress')}
                          className="w-full py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-600 hover:text-white text-amber-800 dark:text-amber-300 font-bold text-[11px] border border-amber-200 dark:border-amber-800 transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Commence Repair</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lane 2: In Progress */}
              <div className="flex flex-col bg-slate-100/80 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">2. In Progress</h4>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 tabular-nums">
                    {clusters.filter(c => c.status === 'in_progress' || c.status === 'reinspection_pending').length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[68vh] custom-scrollbar pr-1">
                  {clusters.filter(c => c.status === 'in_progress' || c.status === 'reinspection_pending').map(c => {
                    const material = calculateMaterial(c);
                    const remainingHours = c.sla_hours || 24;
                    const isBreached = (c as any).is_breached || remainingHours <= 0;
                    const slaPercent = Math.min(100, Math.max(10, (remainingHours / 24) * 100));
                    const ringColor = isBreached || remainingHours < 6 ? 'stroke-rose-500' : remainingHours <= 12 ? 'stroke-amber-500' : 'stroke-emerald-500';

                    return (
                      <div key={c.id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition space-y-2.5">
                        <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-950 group">
                          <img
                            src={c.before_image_url || (c as any).evidence_img || "/evidence/bus_pass_1_detect.jpg"}
                            alt={c.defect_name || "Defect"}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/evidence/bus_pass_1_detect.jpg";
                            }}
                          />
                          <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                            <span className="font-mono font-extrabold text-[10px] px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-white border border-white/20 tabular-nums">
                              {c.cluster_code || c.id}
                            </span>
                          </div>
                          <div className="absolute top-1.5 right-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold font-mono border backdrop-blur-xs tabular-nums ${
                              c.severity_level === 'critical'
                                ? 'bg-rose-950/80 text-rose-300 border-rose-700'
                                : c.severity_level === 'high'
                                  ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                                  : 'bg-slate-900/80 text-slate-300 border-slate-700'
                            }`}>
                              RPI {c.rpi_boosted ?? c.rpi_score ?? 75}
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {c.road_name || "Chennai Metropolitan Corridor"}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="truncate max-w-[150px]">{c.defect_name}</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              ₹{material.costInr.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                          <div className="flex items-center gap-1.5">
                            <SvgGauge
                              percentage={slaPercent}
                              strokeColor={ringColor}
                              trackColor="stroke-slate-200 dark:stroke-slate-800"
                              size={28}
                              strokeWidth={3}
                            >
                              <Clock className={`w-2.5 h-2.5 ${isBreached || remainingHours < 6 ? 'text-rose-500' : remainingHours <= 12 ? 'text-amber-500' : 'text-emerald-500'}`} />
                            </SvgGauge>
                            <div className="font-mono text-[10px] leading-tight">
                              <div className={`font-bold tabular-nums ${isBreached || remainingHours < 6 ? 'text-rose-600 dark:text-rose-400' : remainingHours <= 12 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {remainingHours}h SLA
                              </div>
                              <div className="text-[9px] text-slate-400">
                                {isBreached ? 'Breached' : `${remainingHours}h left`}
                              </div>
                            </div>
                          </div>

                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold truncate max-w-[120px]" title={c.assigned_agency}>
                            {c.assigned_agency || "L&T Highways"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                            <Wrench className="w-3 h-3 text-blue-500" />
                            <span>Repair Active</span>
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openConsole(c, 'cad_audit')}
                              className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                              title="Inspect CAD Audit"
                            >
                              <Eye className="w-3 h-3 text-blue-500" />
                            </button>
                            <button
                              onClick={() => openConsole(c, 'contractor_sla')}
                              disabled={!canDispatchWorkOrder}
                              className={`p-1 rounded transition ${
                                canDispatchWorkOrder
                                  ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer'
                                  : 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                              }`}
                              title="Dispatch Notice"
                            >
                              <Send className="w-3 h-3 text-indigo-500" />
                            </button>
                            <button
                              onClick={() => openConsole(c, 'concurrence_release')}
                              className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                              title="Release Escrow Concurrence"
                            >
                              <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => requestStatusUpdate(c.id, 'assigned')}
                            className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-[10.5px] border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                            title="Return to Assigned"
                          >
                            &larr; Assigned
                          </button>
                          <button
                            onClick={() => requestStatusUpdate(c.id, 'resolved')}
                            className="flex-1 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-600 hover:text-white text-blue-800 dark:text-blue-300 font-bold text-[11px] border border-blue-200 dark:border-blue-800 transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>Mark Resolved</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lane 3: Resolved */}
              <div className="flex flex-col bg-slate-100/80 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">3. Resolved</h4>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 tabular-nums">
                    {clusters.filter(c => c.status === 'resolved').length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[68vh] custom-scrollbar pr-1">
                  {clusters.filter(c => c.status === 'resolved').map(c => {
                    const material = calculateMaterial(c);
                    const remainingHours = c.sla_hours || 24;
                    const isBreached = (c as any).is_breached || remainingHours <= 0;
                    const slaPercent = Math.min(100, Math.max(10, (remainingHours / 24) * 100));
                    const ringColor = isBreached || remainingHours < 6 ? 'stroke-rose-500' : remainingHours <= 12 ? 'stroke-amber-500' : 'stroke-emerald-500';

                    return (
                      <div key={c.id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition space-y-2.5">
                        <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-950 group">
                          <img
                            src={c.before_image_url || (c as any).evidence_img || "/evidence/bus_pass_1_detect.jpg"}
                            alt={c.defect_name || "Defect"}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/evidence/bus_pass_1_detect.jpg";
                            }}
                          />
                          <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                            <span className="font-mono font-extrabold text-[10px] px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-white border border-white/20 tabular-nums">
                              {c.cluster_code || c.id}
                            </span>
                          </div>
                          <div className="absolute top-1.5 right-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold font-mono border backdrop-blur-xs tabular-nums ${
                              c.severity_level === 'critical'
                                ? 'bg-rose-950/80 text-rose-300 border-rose-700'
                                : c.severity_level === 'high'
                                  ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                                  : 'bg-slate-900/80 text-slate-300 border-slate-700'
                            }`}>
                              RPI {c.rpi_boosted ?? c.rpi_score ?? 75}
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {c.road_name || "Chennai Metropolitan Corridor"}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="truncate max-w-[150px]">{c.defect_name}</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              ₹{material.costInr.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                          <div className="flex items-center gap-1.5">
                            <SvgGauge
                              percentage={slaPercent}
                              strokeColor={ringColor}
                              trackColor="stroke-slate-200 dark:stroke-slate-800"
                              size={28}
                              strokeWidth={3}
                            >
                              <Clock className={`w-2.5 h-2.5 ${isBreached || remainingHours < 6 ? 'text-rose-500' : remainingHours <= 12 ? 'text-amber-500' : 'text-emerald-500'}`} />
                            </SvgGauge>
                            <div className="font-mono text-[10px] leading-tight">
                              <div className={`font-bold tabular-nums ${isBreached || remainingHours < 6 ? 'text-rose-600 dark:text-rose-400' : remainingHours <= 12 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {remainingHours}h SLA
                              </div>
                              <div className="text-[9px] text-slate-400">
                                {isBreached ? 'Breached' : `${remainingHours}h left`}
                              </div>
                            </div>
                          </div>

                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold truncate max-w-[120px]" title={c.assigned_agency}>
                            {c.assigned_agency || "L&T Highways"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-blue-500" />
                            <span>Awaiting Re-Pass</span>
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openConsole(c, 'cad_audit')}
                              className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                              title="Inspect CAD Audit"
                            >
                              <Eye className="w-3 h-3 text-blue-500" />
                            </button>
                            <button
                              onClick={() => openConsole(c, 'contractor_sla')}
                              disabled={!canDispatchWorkOrder}
                              className={`p-1 rounded transition ${
                                canDispatchWorkOrder
                                  ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer'
                                  : 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                              }`}
                              title="Dispatch Notice"
                            >
                              <Send className="w-3 h-3 text-indigo-500" />
                            </button>
                            <button
                              onClick={() => openConsole(c, 'concurrence_release')}
                              className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                              title="Release Escrow Concurrence"
                            >
                              <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => requestStatusUpdate(c.id, 'in_progress')}
                            className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-[10.5px] border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                            title="Return to In Progress"
                          >
                            &larr; Repair
                          </button>
                          <button
                            onClick={() => requestStatusUpdate(c.id, 'verified_closed', 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=800&auto=format&fit=crop&q=80', '[AUTONOMOUS_FLEET_CLOSURE] Verified closed by Fleet Node BUS-MTC-19B on re-pass patrol. Gz=0.98g normal.')}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Verify &amp; Close</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lane 4: Verified Closed */}
              <div className="flex flex-col bg-slate-100/80 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">4. Verified Closed</h4>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 tabular-nums">
                    {clusters.filter(c => c.status === 'verified_closed').length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[68vh] custom-scrollbar pr-1">
                  {clusters.filter(c => c.status === 'verified_closed').map(c => {
                    const material = calculateMaterial(c);

                    return (
                      <div key={c.id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 shadow-xs hover:shadow-md transition space-y-2.5">
                        <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-950 group">
                          <img
                            src={c.before_image_url || (c as any).evidence_img || "/evidence/bus_pass_1_detect.jpg"}
                            alt={c.defect_name || "Defect"}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/evidence/bus_pass_1_detect.jpg";
                            }}
                          />
                          <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                            <span className="font-mono font-extrabold text-[10px] px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-white border border-white/20 tabular-nums">
                              {c.cluster_code || c.id}
                            </span>
                          </div>
                          <div className="absolute top-1.5 right-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold font-mono border backdrop-blur-xs tabular-nums bg-emerald-950/80 text-emerald-300 border-emerald-700">
                              Gz = 0.98g
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {c.road_name || "Chennai Metropolitan Corridor"}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="truncate max-w-[150px]">{c.defect_name}</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              ₹{material.costInr.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                          <div className="flex items-center gap-1.5">
                            <SvgGauge
                              percentage={100}
                              strokeColor="stroke-emerald-500"
                              trackColor="stroke-emerald-100 dark:stroke-emerald-950"
                              size={28}
                              strokeWidth={3}
                            >
                              <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            </SvgGauge>
                            <div className="font-mono text-[10px] leading-tight">
                              <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                MoHUA Verified
                              </div>
                              <div className="text-[9px] text-slate-400">
                                Passes: {c.pass_count || 3}
                              </div>
                            </div>
                          </div>

                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold truncate max-w-[120px]" title={c.assigned_agency}>
                            {c.assigned_agency || "L&T Highways"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            <span>3-Pass Verified</span>
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openConsole(c, 'cad_audit')}
                              className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                              title="Inspect CAD Audit"
                            >
                              <Eye className="w-3 h-3 text-blue-500" />
                            </button>
                            <button
                              onClick={() => openConsole(c, 'concurrence_release')}
                              className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                              title="View Escrow Concurrence"
                            >
                              <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex-1 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold text-[10.5px] text-center border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Escrow Cleared</span>
                          </div>
                          <button
                            onClick={() => requestStatusUpdate(c.id, 'in_progress')}
                            className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-[10px] border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                            title="Reopen for maintenance"
                          >
                            Reopen
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 3. COMPACT COCKPIT FILTER BAR */}
            <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              {/* Left: Search input + Dropdown Filters */}
              <div className="flex items-center gap-2 flex-1 flex-wrap sm:flex-nowrap">
                {/* Search Input */}
                <div className="relative min-w-[180px] sm:w-64 max-w-sm flex-1 sm:flex-none">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search Order ID, Road, Defect, Agency..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-8 pl-8 pr-7 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Severity Dropdown */}
                <div className="relative">
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="h-8 pl-2.5 pr-7 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden focus:border-indigo-500 appearance-none cursor-pointer"
                  >
                    <option value="all">Severity: All</option>
                    <option value="critical">P0 Critical</option>
                    <option value="high">P1 High</option>
                    <option value="medium">P2 Medium</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Agency Dropdown */}
                <div className="relative">
                  <select
                    value={contractorFilter}
                    onChange={(e) => setContractorFilter(e.target.value)}
                    className="h-8 pl-2.5 pr-7 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden focus:border-indigo-500 appearance-none cursor-pointer"
                  >
                    {contractorsList.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.value === 'all' ? 'Agency: All' : item.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* SLA State Dropdown */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-8 pl-2.5 pr-7 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden focus:border-indigo-500 appearance-none cursor-pointer"
                  >
                    <option value="all">SLA: All States</option>
                    <option value="active">Active SLA</option>
                    <option value="breached">Breached SLA</option>
                    <option value="verified_closed">Verified Closed</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Reset Filters Button */}
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                    title="Reset all active filters"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Right: Lifecycle Simulation Accordion Toggle */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsDrillExpanded((prev) => !prev)}
                  className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                    isDrillExpanded || isDrillRunning
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                  }`}
                  title="Toggle Autonomous Lifecycle SOP Drill"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isDrillRunning ? 'animate-spin text-indigo-600' : 'text-amber-500'}`} />
                  <span>Lifecycle SOP Drill</span>
                  {isDrillExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* COLLAPSIBLE ON-DEMAND LIFECYCLE SIMULATION ACCORDION */}
            {isDrillExpanded && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 transition-all animate-fadeIn">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {t("lifecycle.title", "Automated Defect-to-Closure Lifecycle Simulation")}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        MoHUA SOP
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {t("lifecycle.subtitle", "Optical Detection -> Service Order Registered -> Contractor SLA Repair -> Re-Inspection Verification")}
                    </p>
                  </div>

                  <button
                    onClick={handleRunLifecycleDrill}
                    disabled={isDrillRunning}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition disabled:opacity-60 cursor-pointer shadow-xs shrink-0"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isDrillRunning ? 'animate-spin' : ''}`} />
                    <span>
                      {isDrillRunning 
                        ? t("lifecycle.runningDrill", "Simulating Lifecycle Workflow...") 
                        : t("lifecycle.runDrill", "Run Lifecycle Simulation")}
                    </span>
                  </button>
                </div>

                {/* 4 Pipeline Stages Progress Visualization */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                  <div className={`p-2 rounded-lg border flex items-center gap-2 transition ${
                    drillStep === 1 
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-blue-900 dark:text-blue-200 font-bold' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    <span className="w-4 h-4 rounded bg-blue-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                    <span className="truncate text-[11px]">{t("lifecycle.step1", "1. Impact & Camera Detection")}</span>
                  </div>

                  <div className={`p-2 rounded-lg border flex items-center gap-2 transition ${
                    drillStep === 2 
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-200 font-bold' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    <span className="w-4 h-4 rounded bg-amber-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                    <span className="truncate text-[11px]">{t("lifecycle.step2", "2. Order Open (SLA Active)")}</span>
                  </div>

                  <div className={`p-2 rounded-lg border flex items-center gap-2 transition ${
                    drillStep === 3 
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-blue-900 dark:text-blue-200 font-bold' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    <span className="w-4 h-4 rounded bg-blue-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                    <span className="truncate text-[11px]">{t("lifecycle.step3", "3. Contractor Patch")}</span>
                  </div>

                  <div className={`p-2 rounded-lg border flex items-center gap-2 transition ${
                    drillStep === 4 
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-bold' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    <span className="w-4 h-4 rounded bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0">4</span>
                    <span className="truncate text-[11px]">{t("lifecycle.step4", "4. Re-Pass Closure")}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. ACCESSIBLE DATA TABLE WITH STICKY HEADER & MULTI-COLUMN SORT */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div className="overflow-x-auto max-h-[580px] custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 backdrop-blur-md bg-slate-50/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 shadow-xs">
                    <tr className="text-slate-600 dark:text-slate-400 font-semibold uppercase text-[11px]">
                      <th 
                        onClick={() => handleSort('code')}
                        className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
                      >
                        <div className="flex items-center gap-1 font-mono">
                          <span>Ticket ID</span>
                          {sortField === 'code' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-500" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('rpi')}
                        className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
                      >
                        <div className="flex items-center gap-1 font-mono">
                          <span>RPI Score</span>
                          {sortField === 'rpi' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-500" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('road')}
                        className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
                      >
                        <div className="flex items-center gap-1">
                          <span>Defect &amp; Corridor</span>
                          {sortField === 'road' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-500" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('cost')}
                        className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
                      >
                        <div className="flex items-center gap-1 font-mono">
                          <span>Volumetric Cost</span>
                          {sortField === 'cost' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-500" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th className="py-2.5 px-3">Contractor Agency</th>
                      <th 
                        onClick={() => handleSort('sla')}
                        className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
                      >
                        <div className="flex items-center gap-1 font-mono">
                          <span>SLA Countdown</span>
                          {sortField === 'sla' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-500" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('status')}
                        className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
                      >
                        <div className="flex items-center gap-1">
                          <span>Status</span>
                          {sortField === 'status' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-500" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedClusters.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center">
                          <EmptyState
                            icon={ClipboardList}
                            title="No Work Orders Found"
                            description="Adjust your search or filter chips to view records."
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
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                          >
                            <td className="py-2.5 px-3 font-mono font-bold text-xs tabular-nums text-slate-900 dark:text-white">
                              {cluster.cluster_code || cluster.id}
                            </td>

                            <td className="py-2.5 px-3 font-mono">
                              <span className={`font-mono font-bold text-[10.5px] px-2 py-0.5 rounded-full border tabular-nums ${
                                cluster.severity_level === "critical"
                                  ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                                  : cluster.severity_level === "high"
                                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                                    : "bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 font-medium"
                              }`}>
                                RPI {cluster.rpi_boosted ?? cluster.rpi_score ?? 75}
                              </span>
                            </td>

                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900 dark:text-white text-xs">
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

                            <td className="py-2.5 px-3 font-mono tabular-nums">
                              <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                                ₹{material.costInr.toLocaleString()}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {material.asphaltKg} kg Bitumen Mix
                              </div>
                            </td>

                            <td className="py-2.5 px-3">
                              <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                                {cluster.assigned_agency || "Apex Urban Infra Ltd"}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {cluster.agency_phone || "+91 98401 22345"}
                              </div>
                            </td>

                            <td className="py-2.5 px-3 font-mono tabular-nums">
                              <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 text-xs">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{cluster.sla_hours || 24}h SLA</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {(cluster as any).turnaround_hrs ? `${(cluster as any).turnaround_hrs}h spent` : "14h remaining"}
                              </div>
                            </td>

                            <td className="py-2.5 px-3">
                              <select
                                value={cluster.status}
                                onChange={(e) => requestStatusUpdate(cluster.id, e.target.value as WorkOrderStatus)}
                                title="Update work order status"
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold outline-none cursor-pointer border transition-colors ${
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

                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Inspect cluster: CAD audit drawer (+ 3D mesh for surface defects) */}
                                <div className="inline-flex items-stretch rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
                                  <button
                                    onClick={() => openConsole(cluster, 'cad_audit')}
                                    className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer"
                                    title="Inspect: open CAD audit drawer (before/after slider & volumetrics)"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    <span>Inspect</span>
                                  </button>
                                  {isRoadSurfaceDefect(cluster.defect_name || cluster.defect_type) && (
                                    <button
                                      onClick={() => setInspectingMeshCluster(cluster)}
                                      className="px-2 py-1 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-600 dark:text-amber-400 hover:text-amber-500 transition cursor-pointer flex items-center gap-1"
                                      title="Inspect 3D Surface Depth Mesh (Concept)"
                                      aria-label="Open 3D surface mesh (Concept)"
                                    >
                                      <Box className="w-3.5 h-3.5" />
                                      <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 px-1 py-0.2 rounded border border-amber-500/30">Concept</span>
                                    </button>
                                  )}
                                </div>

                                {/* Release Escrow: 3-pass concurrence gate */}
                                <button
                                  onClick={() => openConsole(cluster, 'concurrence_release')}
                                  className="px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-2xs"
                                  title="Release Escrow: open 3-pass concurrence gate"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>Release Escrow</span>
                                </button>

                                {/* Dispatch: WhatsApp / SMS ward notice */}
                                <button
                                  onClick={() => openConsole(cluster, 'contractor_sla')}
                                  disabled={!canDispatchWorkOrder}
                                  className={`px-2.5 py-1 rounded-lg border font-semibold text-[11px] flex items-center gap-1 transition shadow-2xs ${
                                    canDispatchWorkOrder
                                      ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 cursor-pointer'
                                      : 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                                  }`}
                                  title={canDispatchWorkOrder ? "Dispatch: instant WhatsApp / SMS & QR ward notice" : "Dispatch disabled: Read-Only Analyst role"}
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Dispatch</span>
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

              {filteredAndSortedClusters.length > PAGE_SIZE && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-500 dark:text-zinc-400">
                  <div>
                    Showing <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">{Math.min(currentPage * PAGE_SIZE, filteredAndSortedClusters.length)}</span> of{' '}
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">{filteredAndSortedClusters.length}</span> work orders
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-700 transition cursor-pointer"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2.5 py-1 rounded-lg font-medium text-zinc-700 dark:text-zinc-300">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-700 transition cursor-pointer"
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
        onInspect3DMesh={(cl) => {
          setIsConsoleOpen(false);
          setInspectingMeshCluster(cl);
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
          footageImageUrl={inspectingMeshCluster.before_image_url || "/evidence/bus_pass_1_detect.jpg"}
          detectedBusId="Bus #04 (TN-01-N-1042 • MTC 19B)"
          videoEvidenceUrl="/evidence/bus_dashcam_pothole_patrol.mp4"
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
