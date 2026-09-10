import React, { useState } from "react";
import { 
  CloudRain, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  ShieldAlert, 
  Waves, 
  Bus, 
  Navigation,
  ChevronRight,
  Info,
  X
} from "lucide-react";

interface MonsoonPredictorWidgetProps {
  onTimeChange?: (hoursAhead: number) => void;
  onActivateDetour?: (routeId: string) => void;
  onClose?: () => void;
}

interface FloodForecast {
  hoursAhead: number;
  label: string;
  rainfallRate: string;
  waterDepth: string;
  submergedCorridors: string[];
  affectedBuses: number;
  detourRoute: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

const FORECAST_STEPS: FloodForecast[] = [
  {
    hoursAhead: 0,
    label: "Now (Dry)",
    rainfallRate: "0.2 mm/hr",
    waterDepth: "< 2 cm",
    submergedCorridors: [],
    affectedBuses: 0,
    detourRoute: "Normal Transit Corridors Active",
    riskLevel: "LOW",
  },
  {
    hoursAhead: 1,
    label: "+1h (Moderate Rain)",
    rainfallRate: "24.5 mm/hr",
    waterDepth: "6 – 12 cm",
    submergedCorridors: ["Civil Lines Low-Point"],
    affectedBuses: 2,
    detourRoute: "Pre-alert issued to Bus #04 & #12",
    riskLevel: "MEDIUM",
  },
  {
    hoursAhead: 2,
    label: "+2h (Waterlogging Alert)",
    rainfallRate: "52.0 mm/hr",
    waterDepth: "22 – 34 cm",
    submergedCorridors: ["NH-334 Underpass", "Civil Lines Market"],
    affectedBuses: 5,
    detourRoute: "Auto-Reroute via Ring Road Bypass (+4 min)",
    riskLevel: "HIGH",
  },
  {
    hoursAhead: 4,
    label: "+4h (Severe Monsoon)",
    rainfallRate: "78.4 mm/hr",
    waterDepth: "38 – 52 cm",
    submergedCorridors: ["NH-334 Underpass", "Civil Lines", "Canal Siphon Road"],
    affectedBuses: 9,
    detourRoute: "Emergency Elevated Expressway Rerouting Active",
    riskLevel: "CRITICAL",
  },
];

export const MonsoonPredictorWidget: React.FC<MonsoonPredictorWidgetProps> = ({
  onTimeChange,
  onActivateDetour,
  onClose,
}) => {
  const [selectedStep, setSelectedStep] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const forecast = FORECAST_STEPS[selectedStep];

  const handleSelectStep = (idx: number) => {
    setSelectedStep(idx);
    onTimeChange?.(FORECAST_STEPS[idx].hoursAhead);
  };

  return (
    <div className="rounded-xl bg-[#F0F4FA] dark:bg-[#0C1424] border border-blue-200 dark:border-blue-900/40 p-3 select-none shadow-xs transition-colors">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <CloudRain className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900 dark:text-white">
                Monsoon Flood Anticipation Engine
              </span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded leading-tight ${
                forecast.riskLevel === "CRITICAL"
                  ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                  : forecast.riskLevel === "HIGH"
                    ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                    : forecast.riskLevel === "MEDIUM"
                      ? "bg-blue-500/20 text-blue-700 dark:text-blue-300"
                      : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
              }`}>
                {forecast.riskLevel} RISK
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
              Correlating IMD Doppler radar with road elevation contour models
            </p>
          </div>
        </div>

        {/* Forecast Timeline Tabs + Close Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            {FORECAST_STEPS.map((step, idx) => (
              <button
                key={step.hoursAhead}
                onClick={() => handleSelectStep(idx)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                  selectedStep === idx
                    ? "bg-blue-600 text-white font-bold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {step.label}
              </button>
            ))}
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              title="Close Forecast Widget"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Forecast Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5">
        {/* Stat 1: Rainfall Rate */}
        <div className="p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <CloudRain className="w-3 h-3 text-cyan-500" />
            <span>Precipitation</span>
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white font-mono mt-0.5">
            {forecast.rainfallRate}
          </div>
        </div>

        {/* Stat 2: Predicted Depth */}
        <div className="p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Waves className="w-3 h-3 text-blue-500" />
            <span>Water Accumulation</span>
          </div>
          <div className={`text-xs font-bold font-mono mt-0.5 ${forecast.hoursAhead >= 2 ? "text-rose-500 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
            {forecast.waterDepth}
          </div>
        </div>

        {/* Stat 3: Inundated Zones */}
        <div className="p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>At-Risk Corridors</span>
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white font-mono mt-0.5">
            {forecast.submergedCorridors.length > 0 ? `${forecast.submergedCorridors.length} Low Points` : "None"}
          </div>
        </div>

        {/* Stat 4: Bus Re-routings */}
        <div className="p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Bus className="w-3 h-3 text-emerald-500" />
            <span>Affected Transit</span>
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white font-mono mt-0.5">
            {forecast.affectedBuses > 0 ? `${forecast.affectedBuses} Buses Re-routed` : "On Schedule"}
          </div>
        </div>
      </div>

      {/* Recommended Detour Banner if Risk > 0 */}
      {forecast.submergedCorridors.length > 0 && (
        <div className="mt-2.5 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
            <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              <strong>Automated Detour:</strong> {forecast.detourRoute}
            </span>
          </div>
          <button
            onClick={() => onActivateDetour?.(forecast.detourRoute)}
            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10.5px] transition shrink-0 self-start sm:self-auto"
          >
            Dispatch Detour to Fleet
          </button>
        </div>
      )}
    </div>
  );
};
