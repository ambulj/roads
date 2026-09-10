import React from "react";
import { Bell, AlertTriangle, Droplets, Car, ShieldAlert, ArrowRight, Box } from "lucide-react";
import { HazardCluster, TrafficIncident } from "../../types";

interface AlertItem {
  id: string;
  title: string;
  location: string;
  time: string;
  severity: "HIGH" | "MEDIUM";
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  severityColor: string;
}

interface RecentAlertsCardProps {
  clusters?: HazardCluster[];
  incidents?: TrafficIncident[];
  onViewAll?: () => void;
  onSelectCluster?: (cluster: HazardCluster) => void;
  onInspect3DMesh?: (hazardId: string, location: string) => void;
}

const DEFAULT_ALERTS: AlertItem[] = [
  {
    id: "CL-0001",
    title: "Pothole Detected",
    location: "GST Road (NH-32), Near RIT Chennai",
    time: "2 min ago",
    severity: "HIGH",
    icon: AlertTriangle,
    iconBg: "bg-orange-100 dark:bg-orange-500/20",
    iconColor: "text-orange-500",
    severityColor: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/20 border-rose-200 dark:border-rose-500/30",
  },
  {
    id: "alt-2",
    title: "Waterlogging Detected",
    location: "Civil Lines, Chennai",
    time: "8 min ago",
    severity: "MEDIUM",
    icon: Droplets,
    iconBg: "bg-cyan-100 dark:bg-cyan-500/20",
    iconColor: "text-cyan-500",
    severityColor: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30",
  },
  {
    id: "alt-3",
    title: "Traffic Congestion",
    location: "Chennai Bus Stand",
    time: "12 min ago",
    severity: "MEDIUM",
    icon: Car,
    iconBg: "bg-purple-100 dark:bg-purple-500/20",
    iconColor: "text-purple-500",
    severityColor: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30",
  },
  {
    id: "alt-4",
    title: "Pedestrian Safety Risk",
    location: "Railway Crossing",
    time: "18 min ago",
    severity: "HIGH",
    icon: ShieldAlert,
    iconBg: "bg-rose-100 dark:bg-rose-500/20",
    iconColor: "text-rose-500",
    severityColor: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/20 border-rose-200 dark:border-rose-500/30",
  },
  {
    id: "alt-5",
    title: "Rash Driving Detected",
    location: "GST Road (NH-32) (towards Haridwar)",
    time: "27 min ago",
    severity: "MEDIUM",
    icon: Car,
    iconBg: "bg-purple-100 dark:bg-purple-500/20",
    iconColor: "text-purple-500",
    severityColor: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30",
  },
];

export const RecentAlertsCard: React.FC<RecentAlertsCardProps> = ({
  onViewAll,
  onInspect3DMesh,
}) => {
  const alerts: AlertItem[] = DEFAULT_ALERTS;

  return (
    <div className="bg-[#F8FAFD] dark:bg-[#0E1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl flex flex-col justify-between h-full shadow-xs select-none overflow-hidden transition-colors">
      {/* Header - Aligned with Map Header */}
      <div className="px-4 py-3 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-3 bg-[#F8FAFD] dark:bg-[#0E1424]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight leading-tight">
              Recent Alerts
            </h3>
            <p className="text-[11px] text-slate-400 leading-none mt-0.5">
              Real-time incident &amp; hazard stream
            </p>
          </div>
        </div>

        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors shrink-0"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Alert Rows List */}
      <div className="p-4 space-y-2.5 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {alerts.map((alert) => {
          const Icon = alert.icon;
          const isPothole = alert.title.includes("Pothole");

          return (
            <div
              key={alert.id}
              onClick={() => {
                if (isPothole && onInspect3DMesh) {
                  onInspect3DMesh(alert.id, alert.location);
                } else {
                  onViewAll?.();
                }
              }}
              className="flex items-center justify-between gap-2.5 p-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group border border-transparent hover:border-slate-200/80 dark:hover:border-slate-800"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Round Pastel Icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${alert.iconBg}`}>
                  <Icon className={`w-4 h-4 ${alert.iconColor}`} />
                </div>

                {/* Title & Location */}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {alert.title}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                    {alert.location}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">
                    {alert.time}
                  </div>
                </div>
              </div>

              {/* Severity Pill */}
              <span
                className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 border ${alert.severityColor}`}
              >
                {alert.severity}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer Summary Bar - Balanced Bottom Alignment */}
      <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>2 Critical Actions Pending</span>
        </span>
        <span className="font-mono text-[11px] text-slate-400">
          5 Total Alerts
        </span>
      </div>
    </div>
  );
};
