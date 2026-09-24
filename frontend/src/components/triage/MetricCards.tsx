import React from "react";
import { Bus, AlertTriangle, Droplets, Car, Wrench, ShieldAlert } from "lucide-react";
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

export const MetricCards: React.FC<MetricCardsProps> = ({
  fleetCount = 5,
  clustersCount = 8,
  incidentsCount = 7,
  waterloggingCount = 3,
  workOrdersCount = 8,
}) => {
  const { t } = useLanguage();

  const items = [
    {
      label: t("kpi.activeBuses", "Active Edge Buses"),
      value: `${fleetCount} / 5`,
      icon: Bus,
      tag: "T1 Edge Sensing",
      color: "text-cyan-500"
    },
    {
      label: t("kpi.roadHazards", "15m DBSCAN Clusters"),
      value: clustersCount,
      icon: AlertTriangle,
      tag: "T2 Multi-Bus",
      color: "text-amber-500"
    },
    {
      label: t("kpi.congestionZones", "Traffic Incidents"),
      value: incidentsCount,
      icon: Car,
      tag: "Hit & Run / ANPR",
      color: "text-rose-500"
    },
    {
      label: t("kpi.workOrders", "Active PWD Orders"),
      value: workOrdersCount,
      icon: Wrench,
      tag: "48h SLA Tracking",
      color: "text-blue-500"
    },
    {
      label: t("kpi.waterlogging", "Life-Safety Hazards"),
      value: waterloggingCount,
      icon: ShieldAlert,
      tag: "IS:1726 / Flood",
      color: "text-purple-500"
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5 w-full select-none">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-colors"
          >
            <div>
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                {item.tag}
              </div>
              <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mt-0.5">
                {item.label}
              </div>
              <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 leading-tight">
                {item.value}
              </div>
            </div>
            <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
              <Icon className={`w-4 h-4 ${item.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
