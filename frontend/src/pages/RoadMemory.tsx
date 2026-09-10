import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { RoadMemoryCorridor, RoadMemoryTimelineEvent } from '../types';
import { Card, Badge, Button } from '../components/ui';
import { INITIAL_ROAD_MEMORY_CORRIDORS, api } from '../services/api';
import { RoadDeteriorationTimeMachine } from '../components/analytics/RoadDeteriorationTimeMachine';

export const RoadMemory: React.FC = () => {
  const [corridors, setCorridors] = useState<RoadMemoryCorridor[]>(INITIAL_ROAD_MEMORY_CORRIDORS);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('corridor-gst');
  const [timelineFilter, setTimelineFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'timeline' | 'timemachine'>('timeline');

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

  React.useEffect(() => {
    fetchCorridors();
  }, []);

  const activeCorridor = corridors.find(c => c.id === selectedCorridorId) || corridors[0] || INITIAL_ROAD_MEMORY_CORRIDORS[0];

  const filteredTimeline = activeCorridor.timeline.filter(ev => {
    if (timelineFilter === 'ALL') return true;
    if (timelineFilter === 'CONFIRMATIONS') return ev.type === 'MULTI_BUS_CONFIRM' || ev.type === 'DETECTION';
    if (timelineFilter === 'REPAIRS') return ev.type === 'REPAIR_DONE' || ev.type === 'WORK_ORDER';
    if (timelineFilter === 'RISKS') return ev.type === 'WATERLOG' || ev.type === 'RECURRENCE' || ev.type === 'RISK_SPIKE';
    return true;
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
      {/* Top Module Sub-Tab Switcher */}
      <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-semibold w-fit shadow-xs">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'timeline'
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Corridor Maintenance History</span>
        </button>

        <button
          onClick={() => setActiveTab('timemachine')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'timemachine'
              ? 'bg-purple-600 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Markov-Chain Deterioration Time-Machine</span>
        </button>
      </div>

      {activeTab === 'timemachine' && (
        <RoadDeteriorationTimeMachine />
      )}

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
                      ? 'bg-blue-600 text-white font-semibold border-blue-600 shadow-xs'
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
    </div>
  );
};
