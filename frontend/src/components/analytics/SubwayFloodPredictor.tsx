import React, { useState } from 'react';
import { 
  Droplets, 
  CloudRain, 
  AlertTriangle, 
  Compass, 
  CheckCircle2, 
  ArrowRight,
  Zap,
  Activity,
  ShieldCheck,
  Building2,
  Sliders
} from 'lucide-react';

interface SubwayProfile {
  id: string;
  name: string;
  location: string;
  criticalBasinElevationM: number;
  catchmentAreaKm2: number;
  maxSumpPumpCapacityLpm: number;
  baseDepthCm: number;
  outfallCanal: string;
}

const CHENNAI_SUBWAYS: SubwayProfile[] = [
  {
    id: 'subway-1',
    name: 'Gengu Reddy Subway',
    location: 'Egmore / EVR Periyar High Road (Zone 5)',
    criticalBasinElevationM: -2.4,
    catchmentAreaKm2: 2.1,
    maxSumpPumpCapacityLpm: 65000,
    baseDepthCm: 14.0,
    outfallCanal: 'Otteri Nullah Outfall Canal'
  },
  {
    id: 'subway-2',
    name: 'Madley Subway',
    location: 'T. Nagar South Usman Road (Zone 10)',
    criticalBasinElevationM: -1.9,
    catchmentAreaKm2: 1.8,
    maxSumpPumpCapacityLpm: 52000,
    baseDepthCm: 8.5,
    outfallCanal: 'Mambalam Canal Link Drain'
  },
  {
    id: 'subway-3',
    name: 'Vyasarpadi Subway',
    location: 'North Chennai Basin Bridge (Zone 4)',
    criticalBasinElevationM: -2.8,
    catchmentAreaKm2: 3.4,
    maxSumpPumpCapacityLpm: 80000,
    baseDepthCm: 22.0,
    outfallCanal: 'Buckingham Canal North Outfall'
  },
  {
    id: 'subway-4',
    name: 'RBI Subway',
    location: 'George Town Rajaji Salai (Zone 5)',
    criticalBasinElevationM: -1.6,
    catchmentAreaKm2: 1.2,
    maxSumpPumpCapacityLpm: 45000,
    baseDepthCm: 6.0,
    outfallCanal: 'Chennai Port Tidal Sluice'
  }
];

export const SubwayFloodPredictor: React.FC = () => {
  const [selectedSubwayId, setSelectedSubwayId] = useState<string>('subway-1');
  const [rainfallMmPerHour, setRainfallMmPerHour] = useState<number>(38); // 0 to 80 mm/hr
  const [pumpDeployed, setPumpDeployed] = useState<boolean>(false);
  const [transitDiverted, setTransitDiverted] = useState<boolean>(false);

  const activeSubway = CHENNAI_SUBWAYS.find(s => s.id === selectedSubwayId) || CHENNAI_SUBWAYS[0];

  // Inundation Model: Depth increases with rainfall intensity and catchment area
  const pumpReduction = pumpDeployed ? 18.0 : 0.0;
  const computedDepthCm = Math.max(
    0,
    Math.round(activeSubway.baseDepthCm + (rainfallMmPerHour * 0.58 * activeSubway.catchmentAreaKm2) - pumpReduction)
  );

  const isCritical = computedDepthCm >= 25;
  const isModerate = computedDepthCm >= 12 && computedDepthCm < 25;

  return (
    <div className="bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-950/70 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
            <CloudRain className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Monsoon Inundation & Subway Hydro-Lock Predictor
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-mono text-xs font-bold">
                GCC SWD TELEMETRY
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Correlates IMU Doppler rain intensity with subway micro-elevation to trigger automated sump pumps & bus diversions.
            </p>
          </div>
        </div>

        <select
          value={selectedSubwayId}
          onChange={(e) => setSelectedSubwayId(e.target.value)}
          className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none shadow-xs"
        >
          {CHENNAI_SUBWAYS.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.location.split('(')[1]?.replace(')', '') || 'Chennai'})</option>
          ))}
        </select>
      </div>

      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-600" />
            <span>IMD LIVE DOPPLER RAIN INTENSITY:</span>
          </span>
          <span className="text-cyan-600 dark:text-cyan-400 text-sm font-extrabold">
            {rainfallMmPerHour} mm/hr ({rainfallMmPerHour > 50 ? 'Heavy Downpour' : rainfallMmPerHour > 25 ? 'Moderate Monsoon Rain' : 'Light Drizzle'})
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="80"
          value={rainfallMmPerHour}
          onChange={(e) => setRainfallMmPerHour(Number(e.target.value))}
          className="w-full accent-cyan-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
        />

        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>0 mm/hr (Dry)</span>
          <span>25 mm/hr (Moderate)</span>
          <span>50 mm/hr (Heavy Storm)</span>
          <span>80 mm/hr (Cloudburst)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>INUNDATION BASIN GAUGE</span>
            <span className={isCritical ? 'text-rose-400 font-bold' : isModerate ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
              {isCritical ? 'HIGH RISK' : isModerate ? 'CAUTION' : 'CLEAR'}
            </span>
          </div>

          <div className="flex items-center justify-center my-auto">
            <div className="relative w-36 h-48 bg-slate-900 border-2 border-slate-700 rounded-2xl overflow-hidden flex flex-col justify-end">
              <div 
                className={`w-full transition-all duration-500 flex items-center justify-center font-mono font-bold text-xs ${
                  isCritical ? 'bg-rose-600/80 text-white' : isModerate ? 'bg-amber-500/80 text-white' : 'bg-cyan-500/80 text-white'
                }`}
                style={{ height: `${Math.min(100, (computedDepthCm / 50) * 100)}%` }}
              >
                {computedDepthCm} cm
              </div>
            </div>
          </div>

          <div className="text-center font-mono text-xs text-slate-400">
            Critical Threshold: <strong className="text-rose-400">25.0 cm</strong>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              {activeSubway.name} — Civic Inundation Telemetry
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">MICRO-ELEVATION:</span>
                <strong className="text-slate-800 dark:text-slate-200">{activeSubway.criticalBasinElevationM} meters below datum</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">CATCHMENT AREA:</span>
                <strong className="text-slate-800 dark:text-slate-200">{activeSubway.catchmentAreaKm2} sq km</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">OUTFALL DESTINATION:</span>
                <strong className="text-slate-800 dark:text-slate-200">{activeSubway.outfallCanal}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">SUMP CAPACITY:</span>
                <strong className="text-slate-800 dark:text-slate-200">{activeSubway.maxSumpPumpCapacityLpm.toLocaleString('en-IN')} L/min</strong>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Automated Municipal Inundation Response:
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                Dispatches high-capacity diesel dewatering sump units and routes MTC bus fleets around deep basins.
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setPumpDeployed(p => !p)}
                className={`px-3.5 py-2 rounded-xl font-bold font-mono text-xs transition shadow-xs flex items-center gap-1.5 ${
                  pumpDeployed
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                <Droplets className="w-3.5 h-3.5" />
                <span>{pumpDeployed ? 'PUMP ACTIVE (-18cm)' : 'DEPLOY SUMP PUMP'}</span>
              </button>

              <button
                onClick={() => setTransitDiverted(p => !p)}
                className={`px-3.5 py-2 rounded-xl font-bold font-mono text-xs transition border ${
                  transitDiverted
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>{transitDiverted ? 'DIVERTED TO HIGHWAY' : 'DIVERT MTC FLEET'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
