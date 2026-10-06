import React from "react";
import { Bus, AlertTriangle, Car, Wrench, ShieldAlert } from "lucide-react";
import { MetricSummary } from "../../types";
import { useLanguage } from "../../context/LanguageContext";

export const SvgProgressRing: React.FC<{
  percentage: number;
  colorClass: string;
  bgClass: string;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}> = ({ percentage, colorClass, bgClass, size = 38, strokeWidth = 3.5, children }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className={bgClass}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${colorClass} transition-all duration-700 ease-out`}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
};

export interface MetricCardsProps {
  metrics?: MetricSummary;
  clustersCount?: number;
  fleetCount?: number;
  incidentsCount?: number;
  waterloggingCount?: number;
  workOrdersCount?: number;
  resolvedClustersCount?: number;
  onTimeSlaPct?: number;
  fpsRate?: number;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  fleetCount = 5,
  clustersCount = 8,
  incidentsCount = 7,
  waterloggingCount = 3,
  workOrdersCount = 8,
  resolvedClustersCount = 42,
  onTimeSlaPct = 94.2,
  fpsRate = 30,
}) => {
  const { t } = useLanguage();

  const totalClusters = (clustersCount || 0) + (resolvedClustersCount || 0);
  const clusterResolvedPct = totalClusters > 0 ? Math.round(((resolvedClustersCount || 0) / totalClusters) * 100) : 84;
  const fleetPct = Math.min(100, Math.round((fleetCount / 5) * 100));

  const items = [
    {
      id: "fleet",
      label: t("kpi.activeBuses", "Active Edge Buses"),
      value: `${fleetCount} / 5`,
      icon: Bus,
      tag: "Tier 1 Edge Sensing",
      percentage: fleetPct,
      colorClass: "text-cyan-500",
      bgClass: "text-cyan-950/30 dark:text-cyan-950/60",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      badgeText: `+0% drop • ${fpsRate} FPS`,
      badgeClass: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
      dotClass: "bg-emerald-500 animate-pulse",
    },
    {
      id: "clusters",
      label: t("kpi.roadHazards", "15m DBSCAN Clusters"),
      value: `${clustersCount} Active`,
      subtext: `${resolvedClustersCount} Resolved`,
      icon: AlertTriangle,
      tag: "Spatial Consensus",
      percentage: clusterResolvedPct,
      colorClass: "text-amber-500",
      bgClass: "text-amber-950/30 dark:text-amber-950/60",
      iconColor: "text-amber-600 dark:text-amber-400",
      badgeText: "↑ 12.4% vs last week",
      badgeClass: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20",
      dotClass: "bg-amber-500",
    },
    {
      id: "incidents",
      label: t("kpi.congestionZones", "Traffic Incidents"),
      value: `${incidentsCount} Incidents`,
      icon: Car,
      tag: "Hit & Run / ANPR",
      percentage: 100,
      colorClass: "text-rose-500",
      bgClass: "text-rose-950/30 dark:text-rose-950/60",
      iconColor: "text-rose-600 dark:text-rose-400",
      badgeText: "100% PCR Dispatched",
      badgeClass: "bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/20",
      dotClass: "bg-rose-500 animate-ping",
    },
    {
      id: "work_orders",
      label: t("kpi.workOrders", "Active PWD Orders"),
      value: `${workOrdersCount} In Backlog`,
      icon: Wrench,
      tag: "48h SLA Tracking",
      percentage: onTimeSlaPct,
      colorClass: "text-blue-500",
      bgClass: "text-blue-950/30 dark:text-blue-950/60",
      iconColor: "text-blue-600 dark:text-blue-400",
      badgeText: `${onTimeSlaPct}% On-Time SLA`,
      badgeClass: "bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/20",
      dotClass: "bg-blue-500",
    },
    {
      id: "hazards",
      label: t("kpi.waterlogging", "Life-Safety Hazards"),
      value: `${waterloggingCount} Critical`,
      icon: ShieldAlert,
      tag: "IS:1726 / Flood Risk",
      percentage: 100,
      colorClass: "text-purple-500",
      bgClass: "text-purple-950/30 dark:text-purple-950/60",
      iconColor: "text-purple-600 dark:text-purple-400",
      badgeText: "Zero Incident Goal",
      badgeClass: "bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-500/20",
      dotClass: "bg-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5 w-full select-none">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            className="flex flex-col justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider truncate">
                {item.tag}
              </div>
              <SvgProgressRing
                percentage={item.percentage}
                colorClass={item.colorClass}
                bgClass={item.bgClass}
                size={34}
                strokeWidth={3}
              >
                <Icon className={`w-3.5 h-3.5 ${item.iconColor}`} />
              </SvgProgressRing>
            </div>

            <div className="mt-1">
              <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                {item.label}
              </div>
              <div className="text-lg font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100 mt-0.5 leading-tight">
                {item.value}
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
              <span
                className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 border ${item.badgeClass}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${item.dotClass}`} />
                <span>{item.badgeText}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
