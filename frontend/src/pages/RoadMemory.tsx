import React, { useState, useEffect } from 'react';
import { 
  History, 
  Layers, 
  ShieldCheck, 
  AlertTriangle, 
  Droplets, 
  Wrench, 
  Bus, 
  TrendingDown, 
  TrendingUp, 
  Sparkles, 
  ChevronRight, 
  RefreshCw, 
  Calendar, 
  Clock, 
  Activity, 
  FileText, 
  Building2,
  CheckCircle2,
  AlertCircle,
  Brain,
  Download,
  Lock,
  FileCheck,
  Printer,
  Shield,
  Search,
  Filter
} from 'lucide-react';
import { RoadMemoryCorridor, RoadMemoryTimelineEvent } from '../types';
import { Card, Badge, Button } from '../components/ui';
import { INITIAL_ROAD_MEMORY_CORRIDORS, api } from '../services/api';
import { RoadDeteriorationTimeMachine } from '../components/analytics/RoadDeteriorationTimeMachine';
import { SelfLearningStudio } from '../components/analytics/SelfLearningStudio';
import { DocumentExportModal } from '../components/modals/DocumentExportModal';

interface MohuaAuditRecord {
  id: string;
  timestamp: string;
  clusterCode: string;
  corridor: string;
  officer: string;
  action: string;
  clause: string;
  hash: string;
  status: 'SEALED' | 'VERIFIED' | 'COMPLIANT';
}

const SAMPLE_MOHUA_AUDITS: MohuaAuditRecord[] = [
  {
    id: 'AUD-2026-0891',
    timestamp: '2026-10-06 14:32:18 IST',
    clusterCode: 'WO-2026-CHE-104',
    corridor: 'GST Road (NH-32) • Tambaram Sanatorium',
    officer: 'Er. K. Shanmugam (PWD-ENG-312)',
    action: 'Autonomous Fleet Re-Pass Verified Closure',
    clause: 'Contractual DLP Clause & Section 63/65B BSA 2023',
    hash: 'sha256:e4b98cf91023a48e71c991823abf104d99c82301982736451029384756',
    status: 'SEALED'
  },
  {
    id: 'AUD-2026-0890',
    timestamp: '2026-10-06 11:15:02 IST',
    clusterCode: 'WO-2026-CHE-212',
    corridor: 'OMR IT Expressway (SH-49A) • Perungudi',
    officer: 'State ICCC Super Administrator (ICCC-ADMIN-001)',
    action: 'Contractor DLP Retention Deduction (₹24,500 Debit)',
    clause: 'MoHUA Rule 151(iii) GFR 2017',
    hash: 'sha256:91823acbbef01923485761029384756cba9810293847561029384756ab',
    status: 'COMPLIANT'
  },
  {
    id: 'AUD-2026-0889',
    timestamp: '2026-10-06 09:44:31 IST',
    clusterCode: 'WO-2026-CHE-305',
    corridor: 'Anna Salai (Mount Road) • Guindy Kathipara',
    officer: 'Er. K. Shanmugam (PWD-ENG-312)',
    action: 'Tri-Bus Spatial Consensus Verification Gate (94% Score)',
    clause: 'Contractual DLP Concurrence Gate',
    hash: 'sha256:c029384756ab91823a48e71c991823abf104d99c823019827364510293',
    status: 'VERIFIED'
  },
  {
    id: 'AUD-2026-0888',
    timestamp: '2026-10-05 18:20:14 IST',
    clusterCode: 'WO-2026-CHE-441',
    corridor: 'Jawaharlal Nehru Road (Inner Ring Rd) • Vadapalani',
    officer: 'Dr. R. Sundaravel, IAS (GOV-IAS-001)',
    action: 'Executive Statutory Annual Pavement Sanction Release',
    clause: 'MoHUA National Smart Cities Mission Directive',
    hash: 'sha256:71c991823abf104d99c82301982736451029384756e4b98cf91023a48e',
    status: 'SEALED'
  },
  {
    id: 'AUD-2026-0887',
    timestamp: '2026-10-05 14:02:55 IST',
    clusterCode: 'WO-2026-CHE-502',
    corridor: 'Poonamallee High Road (NH-48) • Koyambedu',
    officer: 'S. Priya, IPS (GCTP-IPS-009)',
    action: 'Multi-Pass Radar Hydro-Hazard Darkspot Tagging',
    clause: 'IRC:35 Road Marking & Safety Compliance',
    hash: 'sha256:104d99c82301982736451029384756e4b98cf91023a48e71c991823abf',
    status: 'VERIFIED'
  }
];

export const RoadMemory: React.FC = () => {
  const [corridors, setCorridors] = useState<RoadMemoryCorridor[]>(INITIAL_ROAD_MEMORY_CORRIDORS);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('corridor-gst');
  const [timelineFilter, setTimelineFilter] = useState<string>('ALL');
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');

  // Sub-Tab Switcher State with Deep Query Sync
  const getInitialTab = (): 'timeline' | 'timemachine' | 'audit' => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const query = hash.split('?')[1];
      if (query) {
        const params = new URLSearchParams(query);
        const tab = params.get('tab');
        if (tab === 'timemachine' || tab === 'mlops' || tab === 'markov') return 'timemachine';
        if (tab === 'audit' || tab === 'mohua' || tab === 'statutory') return 'audit';
        if (tab === 'timeline' || tab === 'corridor' || tab === 'memory') return 'timeline';
      }
    }
    return 'timeline';
  };

  const [activeTab, setActiveTab] = useState<'timeline' | 'timemachine' | 'audit'>(getInitialTab);

  const handleTabChange = (tab: 'timeline' | 'timemachine' | 'audit') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const [base] = window.location.hash.split('?');
      window.location.hash = `${base || '#/memory'}?tab=${tab}`;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const query = hash.split('?')[1];
      if (query) {
        const params = new URLSearchParams(query);
        const tab = params.get('tab');
        if (tab === 'timemachine' || tab === 'mlops' || tab === 'markov') {
          setActiveTab('timemachine');
        } else if (tab === 'audit' || tab === 'mohua' || tab === 'statutory') {
          setActiveTab('audit');
        } else if (tab === 'timeline' || tab === 'corridor' || tab === 'memory') {
          setActiveTab('timeline');
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const fetchCorridors = async () => {
    setIsLoading(true);
    try {
      const data = await api.getRoadMemoryCorridors();
      if (data && data.length > 0) {
        setCorridors(data);
      }
    } catch (err) {
      console.error('Failed to load road memory corridors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCorridors();
  }, []);

  const activeCorridor = corridors.find(c => c.id === selectedCorridorId) || corridors[0] || INITIAL_ROAD_MEMORY_CORRIDORS[0];

  const filteredTimeline = (activeCorridor?.timeline || []).filter(ev => {
    if (timelineFilter === 'ALL') return true;
    if (timelineFilter === 'CONFIRMATIONS') return ev.type === 'MULTI_BUS_CONFIRM' || ev.type === 'DETECTION';
    if (timelineFilter === 'REPAIRS') return ev.type === 'REPAIR_DONE' || ev.type === 'WORK_ORDER';
    if (timelineFilter === 'RISKS') return ev.type === 'WATERLOG' || ev.type === 'RECURRENCE' || ev.type === 'RISK_SPIKE';
    return true;
  });

  const filteredAudits = SAMPLE_MOHUA_AUDITS.filter(a => {
    if (!auditSearch) return true;
    const q = auditSearch.toLowerCase();
    return (
      a.id.toLowerCase().includes(q) ||
      a.clusterCode.toLowerCase().includes(q) ||
      a.corridor.toLowerCase().includes(q) ||
      a.officer.toLowerCase().includes(q) ||
      a.action.toLowerCase().includes(q)
    );
  });

  const getEventBadge = (type: RoadMemoryTimelineEvent['type']) => {
    switch (type) {
      case 'MULTI_BUS_CONFIRM':
        return { label: 'Multi-Bus Verified', bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', icon: Bus };
      case 'WATERLOG':
        return { label: 'Hydro Hazard / Waterlog', bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', icon: Droplets };
      case 'WORK_ORDER':
        return { label: 'Work Order Issued', bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', icon: Wrench };
      case 'REPAIR_DONE':
        return { label: 'Repair Completed', bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', icon: CheckCircle2 };
      case 'RECURRENCE':
        return { label: 'Recurrent Degradation', bg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800', icon: AlertTriangle };
      case 'RISK_SPIKE':
        return { label: 'Structural Dynamic Spike', bg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800', icon: Activity };
      default:
        return { label: 'Edge Vision Detection', bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700', icon: Sparkles };
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar p-5 md:p-6 lg:p-7 space-y-5 max-w-[1750px] mx-auto w-full select-none">
      
      {/* 1. Header with Tokenized Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Governance &amp; Road Memory
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-normal">
              Spatiotemporal corridor deterioration history, Markov IRI forecasts, and statutory MoHUA compliance audit trail.
            </p>
          </div>
        </div>

        {/* Standardized In-Workspace Sub-Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs flex-wrap">
          <button
            onClick={() => handleTabChange('timeline')}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'timeline'
                ? 'font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                : 'font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Spatial Road Memory</span>
          </button>

          <button
            onClick={() => handleTabChange('timemachine')}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'timemachine'
                ? 'font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                : 'font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Markov Deterioration &amp; MLOps</span>
          </button>

          <button
            onClick={() => handleTabChange('audit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'audit'
                ? 'font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                : 'font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>MoHUA Statutory Audit Trail</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
              Contractual DLP
            </span>
          </button>
        </div>
      </div>

      {/* View 2: Markov Deterioration & MLOps */}
      {activeTab === 'timemachine' && (
        <div className="space-y-6">
          <RoadDeteriorationTimeMachine />
          <SelfLearningStudio />
        </div>
      )}

      {/* View 3: MoHUA Statutory Audit Trail */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Statutory Verification Banner */}
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>Contractual DLP Statutory Audit Ledger</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      CRYPTOGRAPHICALLY SEALED
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Immutable append-only ledger for municipal road works, contractor liquidated damages, and multi-pass AI closures.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDocumentModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Generate MoHUA Form 4B</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search & Audit Table */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 flex-wrap">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Audit ID, Work Order, Corridor, Officer..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full h-8 pl-9 pr-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-indigo-600 transition"
                />
              </div>

              <div className="text-xs text-slate-500 font-mono">
                Showing {filteredAudits.length} Sealed Audit Dockets
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Audit Docket ID</th>
                    <th className="py-3 px-4">Timestamp (IST)</th>
                    <th className="py-3 px-4">Work Order</th>
                    <th className="py-3 px-4">Corridor &amp; Action</th>
                    <th className="py-3 px-4">Officer Authority</th>
                    <th className="py-3 px-4">Statutory Clause</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredAudits.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700 dark:text-indigo-400">
                        {item.id}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-600 dark:text-zinc-400 text-[11px]">
                        {item.timestamp}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.clusterCode}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{item.action}</div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-xs">{item.corridor}</div>
                        <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 truncate max-w-xs mt-0.5">{item.hash}</div>
                      </td>
                      <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300 font-medium">
                        {item.officer}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[10.5px]">
                          {item.clause}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>{item.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View 1: Spatial Road Memory & Timeline */}
      {activeTab === 'timeline' && (
        <>
          {/* Corridor Quick Switcher Toolbar */}
          <Card className="p-3.5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                  <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">Corridor Maintenance History</span>
                    <Badge variant="medium" size="sm">
                      Monitored Route
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-md">
                    {activeCorridor.name} &bull; {activeCorridor.length_km} km span
                  </p>
                </div>
              </div>

              {/* Corridor Quick Switcher + Refresh Button */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
                {corridors.map(corridor => {
                  const isSelected = corridor.id === selectedCorridorId;
                  return (
                    <button
                      key={corridor.id}
                      onClick={() => setSelectedCorridorId(corridor.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs transition-all shrink-0 flex items-center gap-2 border font-medium ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-semibold border-indigo-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span>{corridor.name.split('(')[0].trim()}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        corridor.health_score >= 80 ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' :
                        corridor.health_score >= 70 ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                      }`}>
                        {corridor.health_score}/100
                      </span>
                    </button>
                  );
                })}
                <button
                  onClick={fetchCorridors}
                  disabled={isLoading}
                  title="Refresh Corridor Data"
                  className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-500' : ''}`} />
                </button>
              </div>
            </div>
          </Card>

          {/* Sleek 4-Stat Corridor KPI Ribbon */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Health Score */}
            <Card className="p-3.5 flex flex-col justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="uppercase tracking-wider font-semibold">Health Score</span>
                <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="my-1.5 flex items-baseline gap-2">
                <span className={`text-2xl font-bold tracking-tight tabular-nums ${
                  activeCorridor.health_score >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                  activeCorridor.health_score >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {activeCorridor.health_score}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">/ 100</span>
                <span className="ml-auto text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {activeCorridor.length_km} km
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    activeCorridor.health_score >= 80 ? 'bg-emerald-500' :
                    activeCorridor.health_score >= 70 ? 'bg-amber-500' :
                    'bg-rose-500'
                  }`}
                  style={{ width: `${activeCorridor.health_score}%` }}
                />
              </div>
            </Card>

            {/* Repair Durability Score */}
            <Card className="p-3.5 flex flex-col justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="uppercase tracking-wider font-semibold">Durability Score</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="my-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {activeCorridor.repair_durability_score}%
                </span>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 ml-auto">
                  <TrendingUp className="w-3 h-3" /> +4.2% QoQ
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Surviving &gt;180d under bus axle load
              </p>
            </Card>

            {/* Recurrence Rate */}
            <Card className="p-3.5 flex flex-col justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="uppercase tracking-wider font-semibold">Recurrence (90d)</span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="my-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
                  {activeCorridor.recurrence_rate_pct}%
                </span>
                <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-0.5 ml-auto">
                  <TrendingDown className="w-3 h-3" /> -1.8% QoQ
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Re-opening &lt;90d post-contract closure
              </p>
            </Card>

            {/* Monsoon & Multi-bus Passes */}
            <Card className="p-3.5 flex flex-col justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="uppercase tracking-wider font-semibold">Monsoon Risk</span>
                <Droplets className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="my-1.5 flex items-center justify-between">
                <Badge
                  variant={activeCorridor.monsoon_risk_index === 'HIGH' ? 'critical' : activeCorridor.monsoon_risk_index === 'MEDIUM' ? 'warning' : 'success'}
                  size="sm"
                >
                  {activeCorridor.monsoon_risk_index} RISK
                </Badge>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {activeCorridor.total_confirmations.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1">sweeps</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Updated: {activeCorridor.last_updated}
              </p>
            </Card>
          </div>

          {/* Main Split: Detailed Corridor Metadata & Spatiotemporal Memory Timeline */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
            {/* Left Col (4 cols): Corridor Attributes & Vulnerable Hotspots */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{activeCorridor.name}</h3>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{activeCorridor.classification}</span>
                  </div>
                  <Building2 className="w-4 h-4 text-slate-400" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-medium">Active Potholes</span>
                    <span className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono">{activeCorridor.pothole_count}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-medium">Waterlogged Puddles</span>
                    <span className="text-base font-bold text-blue-600 dark:text-blue-400 font-mono">{activeCorridor.waterlog_count}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-medium">Longitudinal Cracks</span>
                    <span className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono">{activeCorridor.crack_count}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-medium">Active Work Orders</span>
                    <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 font-mono">{activeCorridor.active_work_orders}</span>
                  </div>
                </div>

                <div className="mt-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    High-Risk Bottlenecks &amp; Intersections:
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {activeCorridor.nearby_vulnerable_zones.map((zone, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{zone}</span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          Watch Zone
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span>Telemetry First Seen:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{activeCorridor.first_monitored_date}</span>
                </div>
              </div>

              {/* AI Predictive Insight Box */}
              <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-2xl p-4 flex flex-col gap-2 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Corridor Maintenance Insight</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Based on historical pass data across 4,200+ bus traversals, surface degradation accelerates 3.4&times; faster during post-monsoon water stagnation on the outer bus lane. Recommended mitigation: install sub-surface perforated geotextile drain before next resurfacing tender.
                </p>
              </div>
            </div>

            {/* Right Col (8 cols): Interactive Timeline Feed */}
            <div className="lg:col-span-8 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              {/* Header & Filter Bar */}
              <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/60 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Corridor Event History</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {filteredTimeline.length} Events
                  </span>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium">
                  {(['ALL', 'CONFIRMATIONS', 'REPAIRS', 'RISKS'] as const).map(filter => (
                    <button
                      key={filter}
                      onClick={() => setTimelineFilter(filter)}
                      className={`px-2.5 py-1 rounded-md text-[11px] transition-all capitalize ${
                        timelineFilter === filter
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-semibold shadow-xs border border-slate-200 dark:border-slate-600'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {filter.toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeline Feed Container */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
                {filteredTimeline.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                    No historical events match the selected category filter.
                  </div>
                ) : (
                  filteredTimeline.map((ev, index) => {
                    const badge = getEventBadge(ev.type);
                    const BadgeIcon = badge.icon;
                    return (
                      <div key={ev.id} className="relative flex gap-3.5 group">
                        {/* Vertical Connector Line */}
                        {index !== filteredTimeline.length - 1 && (
                          <div className="absolute top-9 left-4 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800 -ml-px group-hover:bg-blue-300 dark:group-hover:bg-blue-800 transition-colors" />
                        )}

                        {/* Node Dot / Icon */}
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 z-10 ${badge.bg}`}>
                          <BadgeIcon className="w-4 h-4" />
                        </div>

                        {/* Event Body Card */}
                        <div className="flex-1 bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-750 hover:border-slate-300 dark:hover:border-slate-650 rounded-xl p-3.5 transition-all shadow-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                                {badge.label}
                              </span>
                              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">{ev.title}</h4>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{ev.date}</span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                            {ev.description}
                          </p>

                          {/* Buses and telemetry badge footer */}
                          {(ev.buses_involved || ev.pass_count) && (
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-750 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              {ev.buses_involved && (
                                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                                  <Bus className="w-3 h-3" />
                                  <span>Buses: {ev.buses_involved.join(', ')}</span>
                                </div>
                              )}
                              {ev.pass_count && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium">
                                  {ev.pass_count} Total Verified Traversal Passes
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Document Export Modal */}
      <DocumentExportModal
        isOpen={isDocumentModalOpen}
        onClose={() => setIsDocumentModalOpen(false)}
      />
    </div>
  );
};
