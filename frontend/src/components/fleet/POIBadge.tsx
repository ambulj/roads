import React from "react";
import { Hospital, GraduationCap, Siren, Bus, ShoppingBag, Landmark } from "lucide-react";
import { POICategory } from "../../types";

interface POIBadgeProps {
  name: string;
  category: POICategory;
  boost?: number;
  distanceM?: number;
  compact?: boolean;
}

export const POIBadge: React.FC<POIBadgeProps> = ({
  name,
  category,
  boost,
  distanceM,
  compact = false,
}) => {
  const getCategoryConfig = () => {
    switch (category) {
      case "hospital":
        return {
          icon: Hospital,
          label: "Hospital Zone",
          bg: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
          iconColor: "text-rose-600 dark:text-rose-400",
          defaultBoost: 15,
        };
      case "emergency":
        return {
          icon: Siren,
          label: "Emergency Corridor",
          bg: "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
          iconColor: "text-red-600 dark:text-red-400",
          defaultBoost: 15,
        };
      case "school":
      case "college":
        return {
          icon: GraduationCap,
          label: category === "school" ? "School Zone" : "University Zone",
          bg: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
          iconColor: "text-amber-600 dark:text-amber-400",
          defaultBoost: 10,
        };
      case "transit":
        return {
          icon: Bus,
          label: "Transit Hub",
          bg: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
          iconColor: "text-blue-600 dark:text-blue-400",
          defaultBoost: 5,
        };
      case "market":
        return {
          icon: ShoppingBag,
          label: "Market / Pedestrian",
          bg: "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
          iconColor: "text-purple-600 dark:text-purple-400",
          defaultBoost: 5,
        };
      case "government":
      default:
        return {
          icon: Landmark,
          label: "Civic Zone",
          bg: "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
          iconColor: "text-slate-600 dark:text-slate-400",
          defaultBoost: 8,
        };
    }
  };

  const cfg = getCategoryConfig();
  const Icon = cfg.icon;
  const boostVal = boost ?? cfg.defaultBoost;

  return (
    <span
      title={`${cfg.label}: ${name}${distanceM !== undefined ? ` (~${Math.round(distanceM)}m away)` : ""} - RPI Priority Boost +${boostVal}`}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10.5px] font-semibold tracking-tight shadow-xs ${cfg.bg}`}
    >
      <Icon className={`w-3 h-3 shrink-0 ${cfg.iconColor}`} />
      {!compact && <span className="truncate max-w-[120px]">{name}</span>}
      <span className="font-mono text-[9.5px] font-bold opacity-90 leading-none">
        +{boostVal}
      </span>
    </span>
  );
};
