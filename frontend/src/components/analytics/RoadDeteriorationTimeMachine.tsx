import React, { useState } from 'react';
import { 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  DollarSign, 
  Layers, 
  Activity, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2
} from 'lucide-react';

export const RoadDeteriorationTimeMachine: React.FC = () => {
  const [timeStep, setTimeStep] = useState<number>(0); // 0 = Day 0, 1 = +30 Days, 2 = +60 Days, 3 = +90 Days, 4 = +180 Days
  const [monsoonIntensity, setMonsoonIntensity] = useState<'normal' | 'heavy'>('heavy');
  const [showMatrixSpec, setShowMatrixSpec] = useState<boolean>(false);

  const steps = [
    {
      days: 0,
      label: 'Today (Baseline)',
      stageTitle: 'Stage 1: Hairline Micro-Crack (D10/D20)',
      pavementStatus: 'Good - Preventative Window Open',
      crackWidthMm: 1.8,
      cavityDepthCm: 0.5,
      areaM2: 0.28,
      iriRoughness: 2.1,
      rpiScore: 42.0,
      recommendedAction: 'Bituminous Cold Slurry Seal (IRC:SP:20)',
      repairCostInr: 1800,
      costEscalationFactor: '1.0x (Baseline)',
      taxpayerSavingsPct: 93.7,
      diagramColor: '#FBBF24',
      cavitySvgWidth: 40,
      cavitySvgDepth: 8,
    },
    {
      days: 30,
      label: '+30 Days',
      stageTitle: 'Stage 2: Interconnected Alligator Crack Web',
      pavementStatus: 'Fair - Moisture Infiltration Active',
      crackWidthMm: 4.5,
      cavityDepthCm: 2.1,
      areaM2: 0.55,
      iriRoughness: 3.2,
      rpiScore: 68.5,
      recommendedAction: 'Micro-Surfacing & Edge Routing',
      repairCostInr: 4500,
      costEscalationFactor: '2.5x Increase',
      taxpayerSavingsPct: 84.2,
      diagramColor: '#F97316',
      cavitySvgWidth: 90,
      cavitySvgDepth: 22,
    },
    {
      days: 60,
      label: '+60 Days',
      stageTitle: 'Stage 3: Subgrade Weakening & Ravelling',
      pavementStatus: 'Poor - Wheel Path Depressions Forming',
      crackWidthMm: 12.0,
      cavityDepthCm: 4.8,
      areaM2: 0.85,
      iriRoughness: 4.6,
      rpiScore: 84.0,
      recommendedAction: 'Tack Coat + Hot-Mix Dense Bituminous Patch',
      repairCostInr: 9200,
      costEscalationFactor: '5.1x Increase',
      taxpayerSavingsPct: 67.7,
      diagramColor: '#EF4444',
      cavitySvgWidth: 140,
      cavitySvgDepth: 45,
    },
    {
      days: 90,
      label: '+90 Days (Monsoon Exceeded)',
      stageTitle: 'Stage 4: Severe P0 Pothole Crater (D40)',
      pavementStatus: 'Critical - Axle Shock & Rim Impact Zone',
      crackWidthMm: 28.0,
      cavityDepthCm: 8.4,
      areaM2: 1.40,
      iriRoughness: 5.8,
      rpiScore: 98.0,
      recommendedAction: 'Full-Depth Base Course Excavation + Compaction',
      repairCostInr: 16800,
      costEscalationFactor: '9.3x Increase',
      taxpayerSavingsPct: 41.1,
      diagramColor: '#DC2626',
      cavitySvgWidth: 190,
      cavitySvgDepth: 75,
    },
    {
      days: 180,
      label: '+180 Days',
      stageTitle: 'Stage 5: Complete Structural Base Course Failure',
      pavementStatus: 'Catastrophic - Road Bed Erosion',
      crackWidthMm: 65.0,
      cavityDepthCm: 14.5,
      areaM2: 3.20,
      iriRoughness: 7.4,
      rpiScore: 100.0,
      recommendedAction: 'Full Roadway Reconstruction & Sub-base Stabilization',
      repairCostInr: 28500,
      costEscalationFactor: '15.8x Increase',
      taxpayerSavingsPct: 0.0,
      diagramColor: '#991B1B',
      cavitySvgWidth: 260,
      cavitySvgDepth: 110,
    }
  ];

  const current = steps[timeStep];

  return (
    <div className="bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Markov-Chain Pavement Deterioration "Time-Machine"
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono text-xs font-bold">
                MORTH IRC:37 MODEL
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simulates physical defect expansion over 180 days under Chennai MTC heavy axle loads & monsoon moisture infiltration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Monsoon Factor:</span>
          <button
            onClick={() => setMonsoonIntensity(monsoonIntensity === 'normal' ? 'heavy' : 'normal')}
            className={`px-3 py-1 rounded-xl font-bold border transition ${
              monsoonIntensity === 'heavy'
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            {monsoonIntensity === 'heavy' ? '⛈️ Heavy Monsoon (2.2x Decay)' : '☀️ Dry Weather (1.0x)'}
          </button>
        </div>
      </div>

      <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>SELECT PREDICTIVE TIMELINE:</span>
          </span>
          <span className="text-purple-600 dark:text-purple-400 font-extrabold text-sm">
            {current.label}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {steps.map((s, idx) => (
            <button
              key={s.days}
              onClick={() => setTimeStep(idx)}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 border ${
                timeStep === idx
                  ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-900/20'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span className="font-mono text-[11px]">{s.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                timeStep === idx ? 'bg-purple-700 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'
              }`}>
                ₹{s.repairCostInr.toLocaleString('en-IN')}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center space-y-4 min-h-[280px]">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center justify-between w-full">
            <span>Simulated Cross-Section Cut</span>
            <span className="text-rose-400 font-bold">RPI: {current.rpiScore}/100</span>
          </div>

          <div className="w-full max-w-sm h-36 bg-slate-900 rounded-xl relative overflow-hidden border border-slate-700 flex items-center justify-center">
            <div className="absolute top-0 left-0 right-0 h-4 bg-slate-800 border-b border-slate-700 flex items-center justify-center text-[9px] font-mono text-slate-400">
              Wearing Course (VG-30 Bitumen)
            </div>

            <div 
              className="absolute top-4 rounded-b-3xl transition-all duration-500 shadow-inner flex items-center justify-center"
              style={{
                width: `${current.cavitySvgWidth}px`,
                height: `${current.cavitySvgDepth}px`,
                backgroundColor: current.diagramColor,
                opacity: 0.85
              }}
            >
              {current.cavityDepthCm > 2 && (
                <span className="text-[10px] font-mono font-bold text-black drop-shadow">
                  {current.cavityDepthCm}cm
                </span>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-10 bg-amber-950/40 border-t border-amber-900/60 flex items-center justify-center text-[9px] font-mono text-amber-500/80">
              Granular Sub-Base Course (WMM Layer)
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full text-center font-mono text-xs">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">CRACK WIDTH</span>
              <strong className="text-slate-200">{current.crackWidthMm} mm</strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">CAVITY DEPTH</span>
              <strong className="text-rose-400">{current.cavityDepthCm} cm</strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">IRI ROUGHNESS</span>
              <strong className="text-amber-400">{current.iriRoughness} m/km</strong>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-purple-600 dark:text-purple-400 font-bold">
              {current.stageTitle}
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {current.pavementStatus}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Required Intervention: <strong className="text-slate-800 dark:text-slate-200">{current.recommendedAction}</strong>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block">
                  ESTIMATED MUNICIPAL REPAIR COST:
                </span>
                <div className="text-2xl font-extrabold text-purple-950 dark:text-purple-200 font-mono">
                  ₹{current.repairCostInr.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block">
                  COST ESCALATION:
                </span>
                <span className="text-xs font-bold text-rose-600 font-mono">
                  {current.costEscalationFactor}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-purple-200 dark:border-purple-800/60 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                Taxpayer Savings vs Late Reconstruction:
              </span>
              <span className="font-bold text-emerald-600 font-mono text-sm">
                +{current.taxpayerSavingsPct}% Saved
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
            <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-snug">
              <strong>MoRTH Guideline Insight:</strong> Addressing distress at Day 0 (slurry seal) preserves the structural subgrade, preventing ₹26,700 in emergency capital excavation.
            </p>
          </div>
        </div>
      </div>

      {/* Markov Chain Transition Probability Matrix (TPM) Deep-Dive Accordion */}
      <div className="border-t border-slate-200 dark:border-slate-800/80 pt-4">
        <button
          type="button"
          onClick={() => setShowMatrixSpec(!showMatrixSpec)}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 font-semibold text-xs transition flex items-center justify-between border border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">P(S_{'{t+1}'}|S_{'{t}'})</span>
            <span>Markov Transition Probability Matrix (IRC:37 Stochastic Engine)</span>
          </div>
          <span className="text-slate-400 text-[11px] font-mono">
            {showMatrixSpec ? '▲ Collapse Matrix' : '▼ Inspect 5x5 TPM'}
          </span>
        </button>

        {showMatrixSpec && (
          <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
              <div className="text-slate-300">
                <span className="text-purple-400 font-bold">Stochastic Law:</span> π(t) = π₀ · P^(t / 30)
              </div>
              <div className="text-slate-400">
                Current Condition: <span className="text-amber-400 font-bold">{monsoonIntensity === 'heavy' ? '2.2x Monsoon Accelerated' : '1.0x Dry Baseline'}</span>
              </div>
            </div>

            {/* 5x5 Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[10.5px]">
                    <th className="p-2">From State (t) \ To (t+30d)</th>
                    <th className="p-2 text-center text-amber-400">S1: Micro-Crack</th>
                    <th className="p-2 text-center text-orange-400">S2: Alligator</th>
                    <th className="p-2 text-center text-rose-400">S3: Ravelling</th>
                    <th className="p-2 text-center text-red-500">S4: Pothole P0</th>
                    <th className="p-2 text-center text-purple-400">S5: Failure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  {(monsoonIntensity === 'heavy' ? [
                    [0.52, 0.48, 0.00, 0.00, 0.00],
                    [0.00, 0.44, 0.56, 0.00, 0.00],
                    [0.00, 0.00, 0.35, 0.65, 0.00],
                    [0.00, 0.00, 0.00, 0.25, 0.75],
                    [0.00, 0.00, 0.00, 0.00, 1.00]
                  ] : [
                    [0.78, 0.22, 0.00, 0.00, 0.00],
                    [0.00, 0.72, 0.28, 0.00, 0.00],
                    [0.00, 0.00, 0.65, 0.35, 0.00],
                    [0.00, 0.00, 0.00, 0.58, 0.42],
                    [0.00, 0.00, 0.00, 0.00, 1.00]
                  ]).map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx === timeStep ? 'bg-purple-950/30' : ''}>
                      <td className="p-2 font-bold text-slate-400">
                        S{rIdx + 1}: {['Micro-Crack', 'Alligator Web', 'Ravelling', 'Pothole D40', 'Base Collapse'][rIdx]}
                      </td>
                      {row.map((val, cIdx) => (
                        <td 
                          key={cIdx} 
                          className={`p-2 text-center font-bold ${
                            val === 0 
                              ? 'text-slate-700' 
                              : val >= 0.5 
                              ? 'text-purple-400 bg-purple-950/20' 
                              : 'text-slate-200'
                          }`}
                        >
                          {val.toFixed(2)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Statutory Compliance Footer */}
            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>
                Standard: <strong className="text-slate-400 font-mono">IRC:37-2018 Clause 9.3</strong> &bull; Absorbing State: <span className="text-rose-400 font-mono">S5 (P_55 = 1.0)</span>
              </span>
              <span className="text-slate-500 font-mono">
                API: <code className="text-purple-400">/api/analytics/deterioration-matrix</code>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
