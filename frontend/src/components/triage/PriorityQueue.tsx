import React, { useState, useMemo } from 'react';
import { TriangleAlert, ShieldAlert, Radio, Clock, Cpu, Sparkles, Activity } from 'lucide-react';
import { HazardCluster, PerceptionLogEntry, TrafficIncident } from '../../types';

import { useAuth } from '../../context/AuthContext';

interface PriorityQueueProps {
  clusters: HazardCluster[];
  incidents?: TrafficIncident[];
  selectedClusterId: string | null;
  selectedIncidentId?: string | null;
  onSelectCluster: (cluster: HazardCluster) => void;
  onSelectIncident?: (incident: TrafficIncident) => void;
  auditLogs?: PerceptionLogEntry[];
}

export const PriorityQueue: React.FC<PriorityQueueProps> = ({
  clusters,
  incidents = [],
  selectedClusterId,
  selectedIncidentId,
  onSelectCluster,
  onSelectIncident,
  auditLogs = []
}) => {
  const { user } = useAuth();
  const defaultTab = (user.role === 'traffic_police' || user.role === 'rto_officer') ? 'incidents' : 'defects';
  const [queueTab, setQueueTab] = useState<'defects' | 'incidents' | 'logs'>(defaultTab);
  const [poiFilter, setPoiFilter] = useState<'all' | 'critical_pois' | 'd40'>('all');

  React.useEffect(() => {
    setQueueTab((user.role === 'traffic_police' || user.role === 'rto_officer') ? 'incidents' : 'defects');
  }, [user.role]);

  // Sort clusters by boosted RPI score
  const sortedAndFilteredClusters = useMemo(() => {
    let list = [...clusters].sort((a, b) => {
      const scoreA = a.rpi_boosted ?? a.rpi_score;
      const scoreB = b.rpi_boosted ?? b.rpi_score;
      return scoreB - scoreA;
    });

    if (poiFilter === 'critical_pois') {
      list = list.filter((c) =>
        c.poi_tags?.some((p) => p.category === 'hospital' || p.category === 'school' || p.category === 'emergency')
      );
    } else if (poiFilter === 'd40') {
      list = list.filter((c) => c.defect_type === 'D40');
    }

    return list;
  }, [clusters, poiFilter]);

  return (
    <div className="flex-1 flex flex-col min-h-0 select-none bg-white dark:bg-slate-900">
      {/* Header Tabs */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
        <button
          onClick={() => setQueueTab('defects')}
          className={`flex-1 py-2 px-2 text-xs font-semibold flex items-center justify-center gap-1 transition border-b-2 ${
            queueTab === 'defects'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TriangleAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="truncate">Hazards ({clusters.length})</span>
        </button>
        <button
          onClick={() => setQueueTab('incidents')}
          className={`flex-1 py-2 px-2 text-xs font-semibold flex items-center justify-center gap-1 transition border-b-2 ${
            queueTab === 'incidents'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span className="truncate">{user.role === 'rto_officer' ? `Compliance (${incidents.length})` : `Safety (${incidents.length})`}</span>
        </button>
        <button
          onClick={() => setQueueTab('logs')}
          className={`py-2 px-2.5 text-xs font-semibold flex items-center justify-center gap-1 transition border-b-2 relative ${
            queueTab === 'logs'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Real-time AI Perception & Telemetry Log"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="truncate font-mono">Live AI</span>
        </button>
      </div>

      {/* Subfilter Pills */}
      {queueTab === 'defects' && (
        <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 text-[11px]">
          <button
            onClick={() => setPoiFilter('all')}
            className={`px-2 py-0.5 rounded transition ${
              poiFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-700 dark:text-white font-medium'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setPoiFilter('critical_pois')}
            className={`px-2 py-0.5 rounded transition ${
              poiFilter === 'critical_pois'
                ? 'bg-slate-900 text-white dark:bg-slate-700 dark:text-white font-medium'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Hospitals &amp; Schools
          </button>
          <button
            onClick={() => setPoiFilter('d40')}
            className={`px-2 py-0.5 rounded transition ${
              poiFilter === 'd40'
                ? 'bg-slate-900 text-white dark:bg-slate-700 dark:text-white font-medium'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Potholes
          </button>
        </div>
      )}

      {/* Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 custom-scrollbar">
        {queueTab === 'defects' ? (
          sortedAndFilteredClusters.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No matching road hazards.
            </div>
          ) : (
            sortedAndFilteredClusters.map((cluster) => {
              const isSelected = selectedClusterId === cluster.id;
              const effectiveRpi = cluster.rpi_boosted ?? cluster.rpi_score;
              const isCritical = cluster.severity_level === 'critical';
              const isHigh = cluster.severity_level === 'high';

              return (
                <div
                  key={cluster.id}
                  onClick={() => onSelectCluster(cluster)}
                  className={`p-3 transition cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-slate-800/90 border-l-3 border-l-blue-600'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-850/60'
                  }`}
                >
                  {/* Top Line: Severity Tag + Title + RPI */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold shrink-0 ${
                        isCritical
                          ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900'
                          : isHigh
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900'
                            : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}>
                        {cluster.severity_level === 'critical' ? 'P0' : cluster.severity_level === 'high' ? 'P1' : 'P2'}
                      </span>
                      <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                        {cluster.defect_name}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 shrink-0">
                      RPI {effectiveRpi}
                    </span>
                  </div>

                  {/* Bottom Line: Corridor + Contractor + SLA */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span className="truncate max-w-[200px]">{cluster.road_name}</span>
                    <span className="shrink-0 text-slate-400">{cluster.sla_hours || 24}h SLA</span>
                  </div>
                </div>
              );
            })
          )
        ) : queueTab === 'incidents' ? (
          incidents.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No active safety incidents.
            </div>
          ) : (
            incidents.map((incident) => {
              const isSelected = selectedIncidentId === incident.id;
              return (
                <div
                  key={incident.id}
                  onClick={() => onSelectIncident?.(incident)}
                  className={`p-3 transition cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-slate-800/90 border-l-3 border-l-blue-600'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-850/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {incident.incident_type?.replace('_', ' ')}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {incident.plate_number || incident.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span className="truncate max-w-[200px]">{incident.road_name}</span>
                    <span className="capitalize">{incident.status}</span>
                  </div>
                </div>
              );
            })
          )
        ) : (
          /* Live AI Perception & Telemetry Stream */
          auditLogs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 font-mono">
              Listening for real-time edge telemetry events...
            </div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-2.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                    {log.type || 'TELEMETRY'}
                  </span>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span>{log.latency_ms || 42}ms</span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
                  {log.message}
                </div>
                {log.bus_id && (
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Radio className="w-2.5 h-2.5 text-blue-500" />
                    <span>{log.bus_id}</span>
                  </div>
                )}
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};
