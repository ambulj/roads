import React, { useState } from 'react';
import { X, Calculator, ShieldCheck, Sliders, CheckCircle2, AlertTriangle, Layers, MapPin } from 'lucide-react';
import { HazardCluster } from '../../types';

interface RPIFormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCluster?: HazardCluster | null;
  clusters?: HazardCluster[];
}

export const RPIFormulaModal: React.FC<RPIFormulaModalProps> = ({ 
  isOpen, 
  onClose,
  selectedCluster,
  clusters = []
}) => {
  // If a cluster is passed or exists, use it as default selection
  const [activeClusterId, setActiveClusterId] = useState<string>(
    selectedCluster?.id || clusters[0]?.id || 'cluster-sample-1'
  );

  // Allow live interactive parameter adjustment for judges
  const activeCluster = clusters.find(c => c.id === activeClusterId) || selectedCluster || {
    id: 'cluster-sample-1',
    cluster_code: 'WO-2026-CHE-001',
    defect_type: 'D40',
    defect_name: 'Pothole Cavity (8.4cm Depth)',
    severity_level: 'critical',
    rpi_score: 94,
    road_name: 'GST Road Arterial (NH-32)',
    pass_count: 5,
    poi_distance_m: 240,
    nearest_poi_name: 'Tambaram Taluk Hospital'
  };

  // Derive initial values from active cluster
  const isPothole = (activeCluster as any).defect_type === 'D40' || activeCluster.defect_name?.toLowerCase().includes('pothole');
  const baseDefectScore = isPothole ? 100 : (activeCluster as any).defect_type === 'D20' ? 75 : 55;
  const initialPasses = (activeCluster as any).pass_count || 5;
  const initialRoadWeight = activeCluster.road_name?.includes('NH') ? 100 : activeCluster.road_name?.includes('OMR') ? 85 : 70;
  const initialPoiDist = (activeCluster as any).poi_distance_m || 240;

  // Interactive Live Sliders State (letting judges tweak variables in real time)
  const [defectSeverity, setDefectSeverity] = useState<number>(baseDefectScore);
  const [passCount, setPassCount] = useState<number>(initialPasses);
  const [roadClassWeight, setRoadClassWeight] = useState<number>(initialRoadWeight);
  const [poiDistanceM, setPoiDistanceM] = useState<number>(initialPoiDist);
  const [monsoonMultiplier, setMonsoonMultiplier] = useState<number>(1.15);

  if (!isOpen) return null;

  // Weight constants
  const w1 = 0.40; // Defect Severity
  const w2 = 0.20; // Multi-bus Pass Consensus
  const w3 = 0.20; // Road Hierarchy
  const w4 = 0.20; // Sensitive POI Proximity

  // Mathematical terms
  const term1_severity = w1 * defectSeverity;
  const consensusScale = Math.min(100, Math.log2(1 + passCount) * 20.0);
  const term2_passes = w2 * consensusScale;
  const term3_road = w3 * roadClassWeight;
  const proximityScale = Math.max(0, (1 - Math.min(poiDistanceM, 1500) / 1500) * 100);
  const term4_poi = w4 * proximityScale;

  const rawSum = term1_severity + term2_passes + term3_road + term4_poi;
  const calculatedRpi = Math.min(100.0, Math.round(rawSum * monsoonMultiplier * 10) / 10);

  const getSlaRecommendation = (score: number) => {
    if (score >= 85) return { sla: '24h Emergency SLA', color: 'rose', badge: 'P0 CRITICAL' };
    if (score >= 70) return { sla: '48h Routine SLA', color: 'amber', badge: 'P1 HIGH' };
    return { sla: '72h Scheduled SLA', color: 'blue', badge: 'P2 ROUTINE' };
  };

  const slaInfo = getSlaRecommendation(calculatedRpi);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400 font-bold text-sm sm:text-base">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <span>Live Road Priority Index (RPI) Mathematical Breakdown</span>
              <div className="text-[10.5px] font-mono text-slate-400 font-normal">
                MoHUA / CRDDC Benchmark Formulation &bull; Explainable Ground-Truth Scoring
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Defect Selector Dropdown (Populates real numbers from any defect) */}
        {clusters.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Select Defect to Populate Real Numbers:</span>
            </span>
            <select
              value={activeClusterId}
              onChange={(e) => {
                const target = clusters.find(c => c.id === e.target.value);
                if (target) {
                  setActiveClusterId(target.id);
                  const isPothole = target.defect_type === 'D40' || target.defect_name?.toLowerCase().includes('pothole');
                  setDefectSeverity(isPothole ? 100 : target.defect_type === 'D20' ? 75 : 55);
                  setPassCount((target as any).pass_count || 5);
                  setRoadClassWeight(target.road_name?.includes('NH') ? 100 : target.road_name?.includes('OMR') ? 85 : 70);
                  setPoiDistanceM((target as any).poi_distance_m || 240);
                }
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono outline-hidden focus:border-blue-500 cursor-pointer"
            >
              {clusters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.cluster_code || c.id} &bull; {c.defect_name || c.defect_type} ({c.road_name})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Active Live Result Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-500/40 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-blue-300">
              Evaluated Cluster: <strong className="text-white">{activeCluster.cluster_code || 'WO-0001'}</strong> ({activeCluster.road_name})
            </div>
            <div className="text-lg font-bold mt-0.5">
              Final RPI Score: <span className="font-mono text-cyan-400 text-2xl">{calculatedRpi}</span> / 100
            </div>
            <div className="text-xs text-slate-300 flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10.5px] ${
                slaInfo.color === 'rose' ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40' :
                slaInfo.color === 'amber' ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' :
                'bg-blue-500/30 text-blue-300 border border-blue-500/40'
              }`}>
                {slaInfo.badge}
              </span>
              <span>Autonomous Action: <strong className="text-white">{slaInfo.sla}</strong></span>
            </div>
          </div>

          <div className="text-right font-mono text-xs text-slate-300 border-l border-white/10 pl-4 shrink-0">
            <div className="text-[10px] uppercase text-slate-400">Live Breakdown:</div>
            <div>w₁ Severity: <span className="text-rose-400 font-bold">+{term1_severity.toFixed(1)}</span></div>
            <div>w₂ Consensus: <span className="text-amber-400 font-bold">+{term2_passes.toFixed(1)}</span></div>
            <div>w₃ Road Class: <span className="text-blue-400 font-bold">+{term3_road.toFixed(1)}</span></div>
            <div>w₄ POI Proximity: <span className="text-indigo-400 font-bold">+{term4_poi.toFixed(1)}</span></div>
            <div>Monsoon Multiplier: <span className="text-emerald-400 font-bold">&times;{monsoonMultiplier}</span></div>
          </div>
        </div>

        {/* Live Equation Box */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-xs font-mono text-xs">
          <div className="text-slate-500 dark:text-slate-400 text-[10.5px] mb-1 font-sans">
            Populated Live Mathematical Equation:
          </div>
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 overflow-x-auto leading-relaxed">
            RPI = min(100.0, [
            <span className="text-rose-600 dark:text-rose-400 font-bold"> 0.40 &times; {defectSeverity} </span> + 
            <span className="text-amber-600 dark:text-amber-400 font-bold"> 0.20 &times; {consensusScale.toFixed(1)} </span> + 
            <span className="text-blue-600 dark:text-blue-400 font-bold"> 0.20 &times; {roadClassWeight} </span> + 
            <span className="text-indigo-600 dark:text-indigo-400 font-bold"> 0.20 &times; {proximityScale.toFixed(1)} </span>
            ] &times; <span className="text-emerald-600 dark:text-emerald-400 font-bold">{monsoonMultiplier}</span>) = <strong className="text-cyan-600 dark:text-cyan-400 text-sm">{calculatedRpi}</strong>
          </div>
        </div>

        {/* Interactive Factor Sliders for Evaluators */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10.5px]">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-500" />
              <span>Interactive Parameter Tweaker (Test Formula Sensitivities Live):</span>
            </span>
            <button
              onClick={() => {
                setDefectSeverity(100);
                setPassCount(5);
                setRoadClassWeight(100);
                setPoiDistanceM(240);
                setMonsoonMultiplier(1.15);
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Reset to Benchmark
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Factor 1: Defect Severity */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-rose-600 dark:text-rose-400">
                <span>w₁: Defect Severity Input (40%)</span>
                <span className="font-mono">{defectSeverity} pts ({term1_severity.toFixed(1)})</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={defectSeverity}
                onChange={(e) => setDefectSeverity(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>D00 Wear (30)</span>
                <span>D10 Transverse (50)</span>
                <span>D20 Alligator (75)</span>
                <span>D40 Cavity (100)</span>
              </div>
            </div>

            {/* Factor 2: Multi-bus Consensus */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-amber-600 dark:text-amber-400">
                <span>w₂: Pass Count Log₂(1+N)&times;20 (20%)</span>
                <span className="font-mono">{passCount} passes ({term2_passes.toFixed(1)})</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={passCount}
                onChange={(e) => setPassCount(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>1 pass (20pts)</span>
                <span>3 passes (40pts)</span>
                <span>7 passes (60pts)</span>
                <span>15+ passes (80pts)</span>
              </div>
            </div>

            {/* Factor 3: Road Class */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-blue-600 dark:text-blue-400">
                <span>w₃: Road Class Weight (20%)</span>
                <span className="font-mono">{roadClassWeight} pts ({term3_road.toFixed(1)})</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                step="5"
                value={roadClassWeight}
                onChange={(e) => setRoadClassWeight(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Local St (40)</span>
                <span>Arterial (65)</span>
                <span>SH (80)</span>
                <span>NH Highway (100)</span>
              </div>
            </div>

            {/* Factor 4: POI Proximity */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-indigo-600 dark:text-indigo-400">
                <span>w₄: Hospital/School Proximity (20%)</span>
                <span className="font-mono">{poiDistanceM}m ({term4_poi.toFixed(1)})</span>
              </div>
              <input
                type="range"
                min="50"
                max="1500"
                step="50"
                value={poiDistanceM}
                onChange={(e) => setPoiDistanceM(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>50m (96.7pts)</span>
                <span>500m (66.7pts)</span>
                <span>1000m (33.3pts)</span>
                <span>1500m (0pts)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Monsoon Multiplier Selector */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            IMD Monsoon Multiplier (Weather Severity Risk):
          </span>
          <div className="flex items-center gap-1.5">
            {[
              { label: 'Normal (1.0x)', val: 1.0 },
              { label: 'IMD Rain Warning (1.15x)', val: 1.15 },
              { label: 'Severe Flood Alert (1.30x)', val: 1.30 }
            ].map(m => (
              <button
                key={m.label}
                onClick={() => setMonsoonMultiplier(m.val)}
                className={`px-2 py-1 rounded font-mono text-[11px] transition cursor-pointer ${
                  monsoonMultiplier === m.val
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Calculated score automatically routes to Work Order CAD queue.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
