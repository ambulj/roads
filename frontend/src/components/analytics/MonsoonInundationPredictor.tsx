import React, { useState } from 'react';
import { 
  CloudRain, 
  Compass, 
  Droplets,
  Sliders,
  BadgeAlert
} from 'lucide-react';
import { Card, Badge } from '../ui';

interface InundationZone {
  id: string;
  name: string;
  location: string;
  elevation_m: number;
  critical_depth_mm: number;
  drainage_capacity_mm_hr: number;
  outfall: string;
  divertRoute: string;
}

const INUNDATION_ZONES: InundationZone[] = [
  {
    id: 'gengu-reddy',
    name: 'Gengu Reddy Railway Subway',
    location: 'Egmore / EVR Periyar High Road (Zone 5)',
    elevation_m: -2.4,
    critical_depth_mm: 140,
    drainage_capacity_mm_hr: 45,
    outfall: 'Otteri Nullah Outfall Canal',
    divertRoute: 'EVR Periyar Highway Flyover Upper Deck'
  },
  {
    id: 'vyasarpadi',
    name: 'Vyasarpadi Low Basin Subway',
    location: 'North Chennai Basin Bridge (Zone 4)',
    elevation_m: -2.8,
    critical_depth_mm: 180,
    drainage_capacity_mm_hr: 50,
    outfall: 'Buckingham Canal North Sluice',
    divertRoute: 'Basin Bridge Elevated Expressway'
  },
  {
    id: 'velachery',
    name: 'Velachery Lake Overflow & MRTS Link',
    location: 'Velachery Bypass (Zone 13)',
    elevation_m: 5.4,
    critical_depth_mm: 110,
    drainage_capacity_mm_hr: 38,
    outfall: 'Pallikaranai Marshland Canal',
    divertRoute: 'Taramani 100ft Link Road'
  },
  {
    id: 'madley',
    name: 'Madley Subway Depression',
    location: 'T. Nagar South Usman Road (Zone 10)',
    elevation_m: -1.9,
    critical_depth_mm: 95,
    drainage_capacity_mm_hr: 48,
    outfall: 'Mambalam Canal Link Drain',
    divertRoute: 'Usman Road Flyover'
  }
];

export const MonsoonInundationPredictor: React.FC = () => {
  const [selectedZoneId, setSelectedZoneId] = useState<string>('gengu-reddy');
  const [rainfallRate, setRainfallRate] = useState<number>(54); // mm/hr
  const [pumpDeployed, setPumpDeployed] = useState<boolean>(false);
  const [transitDiverted, setTransitDiverted] = useState<boolean>(false);

  const activeZone = INUNDATION_ZONES.find(z => z.id === selectedZoneId) || INUNDATION_ZONES[0];

  // Net Accumulation Model
  const netRate = Math.max(0, rainfallRate - activeZone.drainage_capacity_mm_hr);
  const pumpMitigation = pumpDeployed ? 60 : 0;
  const predictedDepthMm = Math.max(0, Math.round(netRate * 1.6 + (activeZone.elevation_m < 0 ? 55 : 20) - pumpMitigation));

  const isCritical = predictedDepthMm >= activeZone.critical_depth_mm;
  const isModerate = predictedDepthMm >= activeZone.critical_depth_mm * 0.5 && !isCritical;

  // IMU Wheel hydroplaning slip probability (IRC:SP:42 Standard)
  const tireSlipPct = isCritical ? 28.4 : isModerate ? 14.2 : 4.5;

  return (
    <Card className="p-4 sm:p-6 shadow-xs border-cyan-200 dark:border-cyan-900/60 bg-gradient-to-b from-white to-cyan-50/20 dark:from-slate-900 dark:to-slate-900 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-600 text-white shadow-xs">
            <CloudRain className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Monsoon Inundation &amp; Hydroplaning Predictor
              </h3>
              <Badge variant="info" size="sm" className="font-mono font-bold">
                GCC SWD &bull; AI RADAR
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Correlates road micro-elevation with real-time IMD Doppler rain radar to trigger automated dewatering pumps &amp; bus diversions.
            </p>
          </div>
        </div>

        <select
          value={selectedZoneId}
          onChange={(e) => setSelectedZoneId(e.target.value)}
          className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none shadow-xs"
        >
          {INUNDATION_ZONES.map(z => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </select>
      </div>

      {/* Doppler Rainfall Rate Slider */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-600" />
            <span>LIVE IMD DOPPLER RAIN INTENSITY:</span>
          </span>
          <span className="text-cyan-600 dark:text-cyan-400 text-sm font-extrabold">
            {rainfallRate} mm/hr ({rainfallRate > 50 ? 'Heavy Downpour' : rainfallRate > 25 ? 'Moderate Rain' : 'Light Drizzle'})
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="80"
          value={rainfallRate}
          onChange={(e) => setRainfallRate(Number(e.target.value))}
          className="w-full accent-cyan-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
        />

        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>0 mm/hr (Dry)</span>
          <span>25 mm/hr (Moderate)</span>
          <span>50 mm/hr (Storm Surge)</span>
          <span>80 mm/hr (Cloudburst)</span>
        </div>
      </div>

      {/* Metrics & Response Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Water Gauge & Hydroplaning Risk */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between text-white space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>WATERLOG GAUGE</span>
            <span className={isCritical ? 'text-rose-400 font-bold' : isModerate ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
              {isCritical ? 'CRITICAL RISK' : isModerate ? 'CAUTION' : 'SAFE'}
            </span>
          </div>

          <div className="flex items-center justify-center my-2">
            <div className="relative w-32 h-36 bg-slate-900 border-2 border-slate-700 rounded-xl overflow-hidden flex flex-col justify-end">
              <div 
                className={`w-full transition-all duration-500 flex items-center justify-center font-mono font-bold text-xs ${
                  isCritical ? 'bg-rose-600/90 text-white' : isModerate ? 'bg-amber-500/90 text-white' : 'bg-cyan-500/90 text-white'
                }`}
                style={{ height: `${Math.min(100, (predictedDepthMm / 200) * 100)}%` }}
              >
                {predictedDepthMm} mm
              </div>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono flex items-center justify-between">
            <span className="text-slate-400">Tire Slip Risk:</span>
            <span className={`font-bold ${isCritical ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-emerald-400'}`}>
              {tireSlipPct}% (Aquaplaning)
            </span>
          </div>
        </div>

        {/* Right: Micro-Elevation & Automated Response */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Micro-Elevation</span>
              <strong className="text-slate-800 dark:text-slate-200 text-xs">
                {activeZone.elevation_m > 0 ? `+${activeZone.elevation_m}m MSL` : `${activeZone.elevation_m}m below grade`}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Drain Capacity</span>
              <strong className="text-slate-800 dark:text-slate-200 text-xs">{activeZone.drainage_capacity_mm_hr} mm/hr</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Outfall Canal</span>
              <strong className="text-slate-800 dark:text-slate-200 text-xs truncate block">{activeZone.outfall}</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Critical Limit</span>
              <strong className="text-rose-600 dark:text-rose-400 text-xs">{activeZone.critical_depth_mm} mm</strong>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">
                AI Automated Dispatch Response:
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                {transitDiverted 
                  ? `Fleet rerouted via ${activeZone.divertRoute}` 
                  : `Normal route active. Recommended alternate: ${activeZone.divertRoute}`}
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
                <span>{pumpDeployed ? 'PUMP ACTIVE (-60mm)' : 'DEPLOY SUMP PUMP'}</span>
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
                <span>{transitDiverted ? 'FLEET DIVERTED' : 'DIVERT MTC FLEET'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
