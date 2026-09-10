import React, { useState, useMemo } from 'react';
import { TriangleAlert, MapPin, ShieldAlert, Car, Zap, Droplets, AlertTriangle, Hospital, Clock, Sparkles } from 'lucide-react';
import { HazardCluster, PerceptionLogEntry, TrafficIncident } from '../../types';
import { Badge } from '../ui/Badge';
import { POIBadge } from '../fleet/POIBadge';

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
  onSelectIncident
}) => {
  const [queueTab, setQueueTab] = useState<'defects' | 'incidents'>('defects');
  const [poiFilter, setPoiFilter] = useState<'all' | 'critical_pois' | 'd40'>('all');

  // Sort clusters by boosted RPI score (prioritizing schools & hospitals)
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
    <div className="flex-1 flex flex-col min-h-0 select-none">
      {/* Priority Repair Queue Box */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-card">
        {/* Sub-tab switcher */}
        <div className="p-1.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setQueueTab('defects')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              queueTab === 'defects'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
            }`}
          >
            <TriangleAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>Defects ({clusters.length})</span>
          </button>
          <button
            onClick={() => setQueueTab('incidents')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              queueTab === 'incidents'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs border border-slate-200 dark:border-slate-700 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Incidents ({incidents.length})</span>
          </button>
        </div>

        {/* POI Priority Quick-Filter strip */}
        {queueTab === 'defects' && (
          <div className="px-2 py-1.5 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-1 overflow-x-auto custom-scrollbar shrink-0">
            <button
              onClick={() => setPoiFilter('all')}
              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-medium whitespace-nowrap transition-colors ${
                poiFilter === 'all'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All ({clusters.length})
            </button>
            <button
              onClick={() => setPoiFilter('critical_pois')}
              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
                poiFilter === 'critical_pois'
                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Hospital className="w-3 h-3 text-rose-500 shrink-0" />
              <span>Hospitals & Schools</span>
            </button>
            <button
              onClick={() => setPoiFilter('d40')}
              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-medium whitespace-nowrap transition-colors ${
                poiFilter === 'd40'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Potholes Only
            </button>
          </div>
        )}

        {/* Content depending on selected tab */}
        {queueTab === 'defects' ? (
          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar min-h-0">
            {sortedAndFilteredClusters.map((cluster) => {
              const isSelected = selectedClusterId === cluster.id;
              const isCritical = cluster.severity_level === 'critical';
              const isHigh = cluster.severity_level === 'high';
              const isMedium = cluster.severity_level === 'medium';
              const effectiveRpi = cluster.rpi_boosted ?? cluster.rpi_score;
              const hasPoiBoost = (cluster.poi_boost_applied || 0) > 0;

              const borderLeft = isCritical
                ? 'border-l-4 border-l-rose-500'
                : isHigh
                ? 'border-l-4 border-l-amber-500'
                : isMedium
                ? 'border-l-4 border-l-blue-500'
                : 'border-l-4 border-l-emerald-500';

              const badgeVariant = isCritical
                ? 'critical'
                : isHigh
                ? 'warning'
                : isMedium
                ? 'medium'
                : 'success';

              return (
                <div
                  key={cluster.id}
                  onClick={() => onSelectCluster(cluster)}
                  className={`p-3 rounded-xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-slate-800/95 dark:text-slate-100 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-white dark:bg-[#0B101D] hover:bg-slate-50 dark:hover:bg-slate-900/80 border-slate-200 dark:border-slate-800 shadow-xs'
                  }`}
                >
                  {/* Top Bar: Monospace Ticket Code + Road Classification + Severity Pulse */}
                  <div className="flex items-center justify-between gap-1.5 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded font-mono font-bold tracking-wider ${
                        isSelected ? 'bg-amber-400 text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {cluster.cluster_code}
                      </span>
                      <span className={`font-mono text-[9.5px] truncate max-w-[120px] ${
                        isSelected ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {cluster.classification}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 font-mono font-bold">
                      <span className={`w-2 h-2 rounded-full ${
                        isCritical ? 'bg-rose-500 animate-ping' : isHigh ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      <span className={`text-[10px] uppercase ${
                        isCritical ? 'text-rose-500' : isHigh ? 'text-amber-500' : 'text-blue-500'
                      }`}>
                        {cluster.severity_level}
                      </span>
                    </div>
                  </div>

                  {/* Middle Row: Defect Name & Location */}
                  <div className="mt-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`font-bold text-xs tracking-tight ${
                        isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                      }`}>
                        {cluster.defect_name}
                      </span>
                      <span className={`text-[11px] font-mono font-extrabold ${
                        hasPoiBoost
                          ? (isSelected ? 'text-amber-300' : 'text-rose-600 dark:text-rose-400')
                          : (isSelected ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300')
                      }`}>
                        RPI {effectiveRpi}
                      </span>
                    </div>

                    <div className={`mt-0.5 flex items-center gap-1.5 text-[11px] truncate ${
                      isSelected ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{cluster.road_name}</span>
                    </div>
                  </div>

                  {/* Nearby Critical POI Badges (Schools, Hospitals) */}
                  {cluster.poi_tags && cluster.poi_tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {cluster.poi_tags.map((poi, idx) => (
                        <POIBadge
                          key={idx}
                          name={poi.name}
                          category={poi.category}
                          boost={cluster.poi_boost_applied}
                        />
                      ))}
                    </div>
                  )}

                  {/* Bottom Row: Field Passes + Agency + SLA */}
                  <div className={`mt-2 pt-2 border-t flex items-center justify-between text-[10px] font-mono ${
                    isSelected ? 'border-slate-800 text-slate-300' : 'border-slate-100 dark:border-slate-800/80 text-slate-500 dark:text-slate-400'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">{cluster.pass_count} passes</span>
                      <span>•</span>
                      <span className="truncate max-w-[110px]">{cluster.assigned_agency}</span>
                    </div>

                    <span className="text-rose-500 font-bold flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {cluster.sla_hours}h SLA
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar min-h-0">
            {incidents.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                No active safety incidents recorded.
              </div>
            ) : (
              incidents.map((incident) => {
                const isSelected = selectedIncidentId === incident.id;
                const isHitAndRun = incident.incident_type === 'HIT_AND_RUN';
                const isRashDriving = incident.incident_type === 'RASH_DRIVING';
                const isWaterlogging = incident.incident_type === 'WATERLOGGING';

                const borderLeft = isHitAndRun
                  ? 'border-l-4 border-l-rose-500'
                  : isRashDriving
                  ? 'border-l-4 border-l-orange-500'
                  : isWaterlogging
                  ? 'border-l-4 border-l-blue-500'
                  : 'border-l-4 border-l-amber-500';

                return (
                  <div
                    key={incident.id}
                    onClick={() => onSelectIncident?.(incident)}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer border ${borderLeft} ${
                      isSelected
                        ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-500/60 shadow-xs ring-1 ring-rose-500/20'
                        : 'bg-white dark:bg-slate-900/70 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Top Row: Type & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100 text-xs">
                        {isHitAndRun ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        ) : isRashDriving ? (
                          <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        ) : isWaterlogging ? (
                          <Droplets className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        )}
                        <span className="capitalize">{incident.incident_type.replace(/_/g, ' ').toLowerCase()}</span>
                      </div>
                      <Badge variant="critical" size="sm" className="uppercase font-semibold">
                        {incident.status}
                      </Badge>
                    </div>

                    {/* ANPR Plate Badge if present */}
                    {incident.plate_number && (
                      <div className="mt-1.5 flex items-center justify-between bg-slate-50 dark:bg-slate-800/70 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs font-mono">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                          <Car className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <span>{incident.plate_number}</span>
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          ANPR {Math.round((incident.plate_confidence || 0.95) * 100)}%
                        </span>
                      </div>
                    )}

                    {/* Location */}
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{incident.road_name}</span>
                    </div>

                    {/* Footer */}
                    <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      <span>Node: <b className="text-slate-700 dark:text-slate-300 font-medium">{incident.reporting_bus_id}</b></span>
                      <span>{incident.occurred_at}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
