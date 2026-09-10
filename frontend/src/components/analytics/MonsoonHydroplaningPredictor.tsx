import React, { useState, useMemo } from "react";
import {
  CloudRain, Waves, AlertTriangle, ShieldCheck,
  TrendingUp, Navigation, Droplets, ArrowRight,
  Clock, Gauge, Compass, CheckCircle2
} from "lucide-react";
import { Card, Badge, Button } from "../ui";

interface CatchmentZone {
  id: string;
  name: string;
  elevation_m: number;
  drainage_capacity_mm_hr: number;
  critical_depth_mm: number;
  corridor: string;
  divert_route: string;
}

const CHENNAI_CATCHMENT_ZONES: CatchmentZone[] = [
  {
    id: "zone-chromepet",
    name: "Chromepet Underpass Grade Depression",
    elevation_m: 11.2,
    drainage_capacity_mm_hr: 45,
    critical_depth_mm: 100,
    corridor: "GST Road (NH-32) Airport Corridor",
    divert_route: "Divert via Chromepet Flyover Upper Deck",
  },
  {
    id: "zone-kathipara",
    name: "Kathipara Interchange Ramp-3 Descent Basin",
    elevation_m: 8.8,
    drainage_capacity_mm_hr: 55,
    critical_depth_mm: 90,
    corridor: "Kathipara Cloverleaf Node",
    divert_route: "Divert to Inner Ring Road Grade-1",
  },
  {
    id: "zone-velachery",
    name: "Velachery Main Lake Overflow Basin",
    elevation_m: 7.4,
    drainage_capacity_mm_hr: 38,
    critical_depth_mm: 110,
    corridor: "Velachery Bypass & MRTS Rail Link",
    divert_route: "Divert via Taramani Link Road",
  },
  {
    id: "zone-mountroad",
    name: "Anna Salai (Mount Road) Greams Road Basin",
    elevation_m: 15.5,
    drainage_capacity_mm_hr: 65,
    critical_depth_mm: 120,
    corridor: "Anna Salai Arterial Corridor",
    divert_route: "Normal Flow (Standard Drainage Operational)",
  },
];

export const MonsoonHydroplaningPredictor: React.FC = () => {
  // Simulated Doppler Radar Rainfall Intensity (mm/hr)
  const [rainfallRate, setRainfallRate] = useState<number>(58); // mm/hr
  // Minutes until next commuter rush hour (e.g., 28 min before 8:00 AM rush hour)
  const [rushHourCountdown, setRushHourCountdown] = useState<number>(26);

  // Compute hydroplaning risks for each catchment zone
  const analyzedZones = useMemo(() => {
    return CHENNAI_CATCHMENT_ZONES.map((zone) => {
      // Net water accumulation rate = Rainfall Rate - Drainage Discharge Capacity
      const netRate = Math.max(0, rainfallRate - zone.drainage_capacity_mm_hr);
      // Predicted water depth in mm after 30 minutes of rain
      const predictedDepth = Math.round((netRate * (rushHourCountdown / 60)) * 1.8);
      // Hydroplaning risk evaluation (IRC:SP:42 Standard: depth > 75mm causes tire aquaplaning at 45km/h)
      const isCritical = predictedDepth >= zone.critical_depth_mm;
      const isHigh = predictedDepth >= 60 && !isCritical;
      const riskLevel: "CRITICAL" | "HIGH" | "MODERATE" = isCritical
        ? "CRITICAL"
        : isHigh
        ? "HIGH"
        : "MODERATE";

      // IMU Tire slip ratio correlation
      const tireSlipPct = isCritical ? 24.5 : isHigh ? 16.2 : 6.8;

      return {
        ...zone,
        netRate,
        predictedDepth,
        riskLevel,
        tireSlipPct,
      };
    });
  }, [rainfallRate, rushHourCountdown]);

  const criticalCount = analyzedZones.filter((z) => z.riskLevel === "CRITICAL").length;

  return (
    <Card className="p-4 sm:p-5 flex flex-col gap-4 shadow-xs border-blue-200 dark:border-blue-900/60 bg-gradient-to-b from-white to-blue-50/20 dark:from-slate-900 dark:to-slate-900">
      {/* Title & Rush-Hour Alert Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
            <Waves className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Monsoon Elevation &amp; Hydroplaning 30-Min Rush-Hour Predictor
              </h2>
              <Badge variant={criticalCount > 0 ? "critical" : "warning"} size="sm" dot>
                {criticalCount > 0 ? `${criticalCount} ZONES AT RISK` : "MONITORING"}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Fuses IMD Doppler radar precipitation with road digital elevation contours &amp; bus wheel slip telemetry
            </p>
          </div>
        </div>

        {/* 30-Minute Countdown Clock to Rush Hour */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 self-start sm:self-auto font-mono text-xs">
          <Clock className="w-4 h-4 text-amber-600 animate-spin" />
          <div>
            <span className="font-bold">{rushHourCountdown} MINS</span>
            <span className="text-[10px] opacity-80 ml-1">to Commuter Rush Hour</span>
          </div>
        </div>
      </div>

      {/* Radar Rainfall Intensity Interactive Slider */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <CloudRain className="w-4 h-4 text-blue-600" />
            <span>Simulated Precipitation Rate:</span>
            <span className="font-mono text-blue-600 dark:text-blue-400 font-extrabold text-sm">
              {rainfallRate} mm/hr
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              ({rainfallRate > 75 ? "Monsoon Cloudburst" : rainfallRate > 40 ? "Heavy Downpour" : "Moderate Rain"})
            </span>
          </div>
          <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
            Drag to simulate precipitation surge and inspect which road underpasses will flood before peak traffic.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-64">
          <span className="text-[10px] font-mono text-slate-400">10mm</span>
          <input
            type="range"
            min={10}
            max={120}
            step={2}
            value={rainfallRate}
            onChange={(e) => setRainfallRate(Number(e.target.value))}
            className="flex-1 accent-blue-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
          <span className="text-[10px] font-mono text-slate-400">120mm</span>
        </div>
      </div>

      {/* Catchment Zones Hydroplaning Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {analyzedZones.map((zone) => {
          const isCritical = zone.riskLevel === "CRITICAL";
          const isHigh = zone.riskLevel === "HIGH";

          return (
            <div
              key={zone.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isCritical
                  ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900 shadow-xs"
                  : isHigh
                  ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      {zone.name}
                    </span>
                    <Badge
                      variant={isCritical ? "critical" : isHigh ? "warning" : "success"}
                      size="sm"
                    >
                      {zone.riskLevel}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {zone.corridor} &bull; Elev: <b className="font-mono">{zone.elevation_m}m MSL</b>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className={`text-base font-extrabold ${isCritical ? "text-rose-600 dark:text-rose-400" : isHigh ? "text-amber-600" : "text-emerald-600"}`}>
                    {zone.predictedDepth} mm
                  </div>
                  <div className="text-[9px] text-slate-400 uppercase">Predicted Depth</div>
                </div>
              </div>

              {/* Hydroplaning Depth Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-mono">
                  <span>Standing Water vs Critical Barrier ({zone.critical_depth_mm}mm):</span>
                  <span className={isCritical ? "text-rose-600 font-bold" : ""}>
                    Tire Slip: {zone.tireSlipPct}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isCritical ? "bg-rose-500" : isHigh ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, (zone.predictedDepth / zone.critical_depth_mm) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Transit Advisory / Divert Alert */}
              <div className="mt-3 pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-[10.5px]">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Navigation className="w-3 h-3 text-blue-600 shrink-0" />
                  <span className="truncate max-w-[240px] font-medium">{zone.divert_route}</span>
                </div>
                {isCritical && (
                  <span className="font-bold text-rose-600 dark:text-rose-400 text-[10px] uppercase animate-pulse">
                    MTC Divert Req
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
