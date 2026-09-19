import React from "react";
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

export const MetricCards: React.FC<MetricCardsProps> = ({
  fleetCount = 24,
  clustersCount = 8,
  incidentsCount = 5,
  waterloggingCount = 3,
  workOrdersCount = 12,
}) => {
  const { t } = useLanguage();

  const items = [
    {
      label: t("kpi.activeBuses", "Active Buses"),
      value: `${fleetCount}/32`,
      icon: Bus,
      detail: "Live telemetry",
    },
    {
      label: t("kpi.roadHazards", "Road Hazards"),
      value: clustersCount,
      icon: AlertTriangle,
      detail: "Active triage",
    },
    {
      label: t("kpi.waterlogging", "Waterlogging"),
      value: waterloggingCount,
      icon: Droplets,
      detail: "Monsoon grid",
    },
    {
      label: t("kpi.congestionZones", "Traffic Incidents"),
      value: incidentsCount,
      icon: Car,
      detail: "Enforcement",
    },
    {
      label: t("kpi.workOrders", "Work Orders"),
      value: workOrdersCount,
      icon: Wrench,
      detail: "SLA tracked",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5 w-full select-none">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs"
          >
            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                {item.label}
              </span>
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-white block leading-tight mt-0.5">
                {item.value}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
              <Icon className="w-4 h-4" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
