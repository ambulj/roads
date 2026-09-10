import React, { useRef, useEffect } from "react";
import { Bus, AlertTriangle, Droplets, Car, Wrench } from "lucide-react";
import { MetricSummary } from "../../types";
import { useLanguage } from "../../context/LanguageContext";

interface MetricCardsProps {
  metrics: MetricSummary;
  clustersCount?: number;
  fleetCount?: number;
  incidentsCount?: number;
  waterloggingCount?: number;
  workOrdersCount?: number;
}

// Sleek 24-Hour SVG Micro-Sparkline Component
const Sparkline: React.FC<{ data: number[]; color: string; width?: number; height?: number }> = ({
  data,
  color,
  width = 44,
  height = 18,
}) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="shrink-0 overflow-visible opacity-75 group-hover:opacity-100 transition-opacity">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export const MetricCards: React.FC<MetricCardsProps> = ({
  fleetCount = 24,
  clustersCount = 8,
  incidentsCount = 5,
  waterloggingCount = 3,
  workOrdersCount = 12,
}) => {
  const { t } = useLanguage();
  const prevRef = useRef<{ fleet: number; clusters: number; incidents: number; waterlogging: number }>({
    fleet: 0, clusters: 0, incidents: 0, waterlogging: 0,
  });

  useEffect(() => {
    prevRef.current = {
      fleet: fleetCount,
      clusters: clustersCount,
      incidents: incidentsCount,
      waterlogging: waterloggingCount,
    };
  });

  const calcTrend = (curr: number, prev: number) => {
    if (prev === 0) return { label: t("nav.live", "Live"), up: false };
    const pct = Math.round(((curr - prev) / prev) * 100);
    return { label: `${pct >= 0 ? "↑" : "↓"} ${Math.abs(pct)}%`, up: pct >= 0 };
  };

  const fleetTrend = calcTrend(fleetCount, prevRef.current.fleet);
  const clusterTrend = calcTrend(clustersCount, prevRef.current.clusters);
  const waterlogTrend = calcTrend(waterloggingCount, prevRef.current.waterlogging);
  const incidentTrend = calcTrend(incidentsCount, prevRef.current.incidents);

  const items = [
    {
      label: t("kpi.activeBuses", "Active Buses"),
      value: `${fleetCount}/32`,
      icon: Bus,
      iconColor: "text-blue-500",
      trend: fleetTrend.label,
      trendColor: "text-emerald-500",
      sparklineColor: "#3b82f6",
      history: [18, 20, 22, 21, 23, 24, fleetCount],
    },
    {
      label: t("kpi.roadHazards", "Road Hazards"),
      value: clustersCount,
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      trend: clusterTrend.label,
      trendColor: clusterTrend.up ? "text-rose-500" : "text-emerald-500",
      sparklineColor: "#f59e0b",
      history: [14, 12, 11, 10, 9, 8, clustersCount],
    },
    {
      label: t("kpi.waterlogging", "Waterlogging"),
      value: waterloggingCount,
      icon: Droplets,
      iconColor: "text-cyan-500",
      trend: waterlogTrend.label,
      trendColor: "text-slate-400",
      sparklineColor: "#06b6d4",
      history: [6, 5, 4, 3, 4, 3, waterloggingCount],
    },
    {
      label: t("kpi.congestionZones", "Congestion Zones"),
      value: incidentsCount,
      icon: Car,
      iconColor: "text-purple-500",
      trend: incidentTrend.label,
      trendColor: incidentTrend.up ? "text-rose-500" : "text-emerald-500",
      sparklineColor: "#a855f7",
      history: [9, 11, 10, 8, 6, 5, incidentsCount],
    },
    {
      label: t("kpi.workOrders", "Work Orders"),
      value: workOrdersCount,
      icon: Wrench,
      iconColor: "text-emerald-500",
      trend: "↓ 25%",
      trendColor: "text-emerald-500",
      sparklineColor: "#10b981",
      history: [22, 19, 18, 16, 15, 13, workOrdersCount],
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5 w-full select-none py-0.5">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="group flex items-center justify-between px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#121722]/90 backdrop-blur-sm shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icon className={`w-4 h-4 ${item.iconColor} shrink-0`} />
              <div className="min-w-0">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate block">
                  {item.label}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums block leading-tight">
                  {item.value}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-2">
              <Sparkline data={item.history} color={item.sparklineColor} width={40} height={16} />
              <span className={`text-[10px] font-mono font-semibold ${item.trendColor}`}>
                {item.trend}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
