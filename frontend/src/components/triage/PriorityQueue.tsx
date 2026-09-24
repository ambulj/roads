import React, { useState, useMemo } from 'react';
import { TriangleAlert, ShieldAlert, Radio, Clock, Cpu, Sparkles, Activity, AlertOctagon, Car, Layers } from 'lucide-react';
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
    <div className="flex-1 flex flex-col min-h-0 h-full select-none bg-white dark:bg-zinc-900 overflow-hidden font-mono border-t lg:border-t-0 border-zinc-200 dark:border-zinc-800">
      {/* Header Tabs */}
      <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
        <button
          onClick={() => setQueueTab('defects')}
          className={`flex-1 py-2.5 px-2 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
            queueTab === 'defects'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-white dark:bg-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <TriangleAlert className="w-3.5 h-3.5" />
          <span>Road Hazards ({clusters.length})</span>
        </button>

        <button
          onClick={() => setQueueTab('incidents')}
          className={`flex-1 py-2.5 px-2 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
            queueTab === 'incidents'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-white dark:bg-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>Incidents ({incidents.length})</span>
        </button>

        <button
          onClick={() => setQueueTab('logs')}
          className={`flex-1 py-2.5 px-2 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
            queueTab === 'logs'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-white dark:bg-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Edge Logs</span>
        </button>
      </div>

      {/* Filter Chips for Hazards */}
      {queueTab === 'defects' && (
        <div className="p-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <button
            onClick={() => setPoiFilter('all')}
            className={`px-2 py-0.5 rounded transition-colors ${poiFilter === 'all' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
          >
            All Hazards
          </button>
          <button
            onClick={() => setPoiFilter('critical_pois')}
            className={`px-2 py-0.5 rounded transition-colors ${poiFilter === 'critical_pois' ? 'bg-cyan-800 text-white font-bold' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
          >
            Hospital / School POIs
          </button>
          <button
            onClick={() => setPoiFilter('d40')}
            className={`px-2 py-0.5 rounded transition-colors ${poiFilter === 'd40' ? 'bg-amber-800 text-white font-bold' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
          >
            Potholes (D40)
          </button>
        </div>
      )}

      {/* Triage List Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800/80">
        {queueTab === 'defects' && (
          sortedAndFilteredClusters.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500">No active road hazard clusters found matching filter.</div>
          ) : (
            sortedAndFilteredClusters.map((cluster) => {
              const isSelected = selectedClusterId === cluster.id;
              const rpiScore = Math.round(cluster.rpi_boosted ?? cluster.rpi_score);
              const isCritical = rpiScore >= 85 || cluster.severity_level === 'critical';

              return (
                <div
                  key={cluster.id}
                  onClick={() => onSelectCluster(cluster)}
                  className={`
                    p-3 cursor-pointer transition-colors text-xs text-left
                    ${isSelected 
                      ? 'bg-zinc-100 dark:bg-zinc-800/90 border-l-4 border-cyan-500' 
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1.5">
                      <span className="text-zinc-400 text-[10px]">{cluster.cluster_code}</span>
                      <span className="truncate">{cluster.defect_name || cluster.defect_type}</span>
                    </div>
                    <span
                      className={`
                        text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0
                        ${isCritical ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-900' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-900'}
                      `}
                    >
                      RPI: {rpiScore}
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate mt-1">
                    {cluster.road_name}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-cyan-500" />
                      {cluster.pass_count} Multi-Bus Passes
                    </span>
                    <span>{cluster.nearest_poi || cluster.classification}</span>
                  </div>
                </div>
              );
            })
          )
        )}

        {queueTab === 'incidents' && (
          incidents.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500">No active incidents awaiting enforcement.</div>
          ) : (
            incidents.map((inc) => {
              const isSelected = selectedIncidentId === inc.id;
              const isHitAndRun = inc.incident_type === 'HIT_AND_RUN' || inc.incident_type === 'Rash Driving';

              return (
                <div
                  key={inc.id}
                  onClick={() => onSelectIncident?.(inc)}
                  className={`
                    p-3 cursor-pointer transition-colors text-xs text-left
                    ${isSelected 
                      ? 'bg-zinc-100 dark:bg-zinc-800/90 border-l-4 border-rose-500' 
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {String(inc.incident_type).replace(/_/g, ' ')}
                    </div>
                    <span
                      className={`
                        text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0
                        ${isHitAndRun ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-900' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'}
                      `}
                    >
                      {inc.plate_number || 'UNLOCKED'}
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate mt-1">
                    {inc.road_name || 'Transit Corridor'}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                    <span>Conf: {Math.round((inc.plate_confidence || 0.94) * 100)}%</span>
                    <span className="text-rose-500 font-semibold">{inc.status || 'OPEN'}</span>
                  </div>
                </div>
              );
            })
          )
        )}

        {queueTab === 'logs' && (
          auditLogs.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500">No telemetry perception logs captured yet.</div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-2.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                <div className="flex justify-between text-zinc-400 text-[10px]">
                  <span>{log.bus_id}</span>
                  <span>{log.latency_ms} ms</span>
                </div>
                <div className="mt-0.5 text-zinc-800 dark:text-zinc-200">{log.message}</div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};
