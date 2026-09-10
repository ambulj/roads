import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  MapPin, 
  ShieldAlert, 
  Droplets, 
  AlertTriangle, 
  ChevronRight, 
  CheckCheck, 
  ExternalLink
} from 'lucide-react';
import { TrafficIncident } from '../../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: TrafficIncident[];
  onSelectIncident?: (incident: TrafficIncident) => void;
  onNavigate: (route: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  incidents,
  onSelectIncident,
  onNavigate,
}) => {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'safety' | 'monsoon'>('all');

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    setReadIds(new Set(incidents.map((i) => i.id)));
  };

  const handleItemClick = (incident: TrafficIncident) => {
    setReadIds((prev) => new Set([...prev, incident.id]));
    onSelectIncident?.(incident);
    onNavigate('command');
    onClose();
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (activeTab === 'safety') {
      return (
        inc.incident_type === 'HIT_AND_RUN' ||
        inc.incident_type === 'RASH_DRIVING' ||
        inc.incident_type === 'RED_LIGHT_VIOLATION' ||
        inc.incident_type.includes('CROSSING')
      );
    }
    if (activeTab === 'monsoon') {
      return (
        inc.incident_type === 'WATERLOGGING' ||
        inc.incident_type === 'OPEN_MANHOLE' ||
        inc.incident_type === 'POTHOLE_D40'
      );
    }
    return true;
  });

  const unreadCount = incidents.filter((i) => !readIds.has(i.id)).length;

  return (
    <div className="absolute right-3 top-[68px] z-50 w-96 max-w-[calc(100vw-24px)] rounded-2xl border border-slate-200 bg-white/95 p-0 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-900 dark:text-slate-100 select-none">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
              </span>
            )}
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Live Incident Notifications
            </span>
            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              {unreadCount} Unread
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition"
              title="Mark all alerts as read"
            >
              <CheckCheck className="h-3 w-3" />
              <span>Read All</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50/70 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950/40 text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 rounded-lg py-1 text-center font-semibold transition ${
            activeTab === 'all'
              ? 'bg-white shadow-xs text-blue-600 dark:bg-slate-800 dark:text-blue-400'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          All ({incidents.length})
        </button>
        <button
          onClick={() => setActiveTab('safety')}
          className={`flex-1 rounded-lg py-1 text-center font-semibold transition ${
            activeTab === 'safety'
              ? 'bg-white shadow-xs text-blue-600 dark:bg-slate-800 dark:text-blue-400'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Safety &amp; PCR
        </button>
        <button
          onClick={() => setActiveTab('monsoon')}
          className={`flex-1 rounded-lg py-1 text-center font-semibold transition ${
            activeTab === 'monsoon'
              ? 'bg-white shadow-xs text-blue-600 dark:bg-slate-800 dark:text-blue-400'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Monsoon &amp; PWD
        </button>
      </div>

      {/* Incident Alert List */}
      <div className="max-h-[380px] overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
        {filteredIncidents.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No active alerts in this category
          </div>
        ) : (
          filteredIncidents.map((incident) => {
            const isUnread = !readIds.has(incident.id);
            const isHitAndRun = incident.incident_type === 'HIT_AND_RUN';
            const isWaterlog = incident.incident_type === 'WATERLOGGING';
            const isZebra = incident.incident_type.includes('CROSSING');
            const isManhole = incident.incident_type === 'OPEN_MANHOLE';

            const badgeColor = isHitAndRun
              ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
              : isWaterlog
              ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300'
              : isZebra
              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
              : isManhole
              ? 'border-red-600 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
              : 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300';

            return (
              <div
                key={incident.id}
                onClick={() => handleItemClick(incident)}
                className={`group relative cursor-pointer rounded-xl border p-2.5 transition ${
                  isUnread
                    ? 'border-blue-200 bg-blue-50/40 dark:border-blue-900/60 dark:bg-blue-950/30'
                    : 'border-slate-100 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm">
                      {isWaterlog ? '💧' : isZebra ? '🚶' : isHitAndRun ? '🚨' : isManhole ? '⚠️' : '⚡'}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${badgeColor}`}>
                      {incident.incident_type.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-medium shrink-0">
                    {incident.occurred_at || 'Just now'}
                  </span>
                </div>

                <div className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <MapPin className="h-3 w-3 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">{incident.road_name}</span>
                </div>

                {/* Subtext info */}
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="truncate font-mono text-[10px]">
                    {isWaterlog ? (
                      `Depth: ${incident.water_depth_cm || 28}cm • GCC Pump`
                    ) : isManhole ? (
                      `Void: 650mm • Ward Barricade`
                    ) : incident.plate_number ? (
                      incident.fine_amount_inr ? `Plate: ${incident.plate_number} • ₹${incident.fine_amount_inr}` : `Plate: ${incident.plate_number} • ${incident.pcr_unit_assigned || '112 PCR'}`
                    ) : (
                      `Node: ${incident.reporting_bus_id}`
                    )}
                  </span>
                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-0.5 transition">
                    <span>Fly to Map</span>
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Drawer Footer */}
      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950/60 text-xs">
        <button
          onClick={() => {
            onNavigate('incidents');
            onClose();
          }}
          className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
        >
          <span>View All Incidents CAD</span>
          <ExternalLink className="h-3 w-3" />
        </button>
        <span className="text-[10px] text-slate-400">Real-time Telemetry Sync</span>
      </div>
    </div>
  );
};
