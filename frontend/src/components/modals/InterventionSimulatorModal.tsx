import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Zap, 
  Clock, 
  TrendingDown, 
  ShieldCheck, 
  Wrench, 
  Bus, 
  Droplets, 
  DollarSign, 
  CheckCircle2, 
  Layers, 
  ArrowRight,
  Sliders,
  Send
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface InterventionSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ScenarioTemplate {
  id: string;
  title: string;
  category: 'PATCHING' | 'REROUTING' | 'SUMP_PUMPING' | 'TRAFFIC_MARSHAL';
  corridor: string;
  badge: string;
  icon: any;
  defaultIntensity: number; // 1 to 100
  baseDelayMins: number;
  baseVehiclesDay: number;
  baseCostInr: number;
  description: string;
}

const TEMPLATES: ScenarioTemplate[] = [
  {
    id: 'patch-gst',
    title: 'Hot-Mix Bitumen Resurfacing (#DEF-GST-881)',
    category: 'PATCHING',
    corridor: 'Grand Southern Trunk Road (NH-45 • Chromepet to Tambaram)',
    badge: 'Road Infrastructure',
    icon: Wrench,
    defaultIntensity: 75,
    baseDelayMins: 14.5,
    baseVehiclesDay: 48000,
    baseCostInr: 185000,
    description: 'Emergency IRC:SP:20 rectangular milling and dense bituminous asphalt overlay across 8 continuous road cavities.'
  },
  {
    id: 'pump-kathipara',
    title: 'High-Discharge Monsoon Sump Pumping',
    category: 'SUMP_PUMPING',
    corridor: 'Kathipara Multi-Level Grade Separator (Ramp 3 Flyover)',
    badge: 'Monsoon Hazard',
    icon: Droplets,
    defaultIntensity: 90,
    baseDelayMins: 22.0,
    baseVehiclesDay: 62000,
    baseCostInr: 75000,
    description: 'Deploy 5000 LPM dewatering diesel pump to eliminate 140mm deep waterlogging causing transit hydroplaning alerts.'
  },
  {
    id: 'reroute-omr',
    title: 'Peak-Hour Dynamic Bus Lane Rerouting',
    category: 'REROUTING',
    corridor: 'Rajiv Gandhi IT Expressway (OMR • Tidel Park Underpass)',
    badge: 'Transit Operations',
    icon: Bus,
    defaultIntensity: 60,
    baseDelayMins: 18.0,
    baseVehiclesDay: 35000,
    baseCostInr: 25000,
    description: 'Divert Routes 19D & 570 via Service Lane Flyover Bypass during bottleneck peak hours (08:30–11:00).'
  },
  {
    id: 'marshal-school',
    title: 'School Zone Traffic Marshal & Speed Calming',
    category: 'TRAFFIC_MARSHAL',
    corridor: 'D.A.V. Senior Secondary Zone (T.Nagar Panagal Park link)',
    badge: 'Vulnerable Safety',
    icon: ShieldCheck,
    defaultIntensity: 85,
    baseDelayMins: 6.5,
    baseVehiclesDay: 22000,
    baseCostInr: 18000,
    description: 'Station 2 municipal traffic wardens with portable variable messaging signs during school drop/pickup intervals.'
  }
];

export const InterventionSimulatorModal: React.FC<InterventionSimulatorModalProps> = ({ isOpen, onClose }) => {
  const { success, warning } = useToast();
  const { user, canRunInterventions } = useAuth();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('patch-gst');
  const [intensity, setIntensity] = useState<number>(75);
  const [isCommitted, setIsCommitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentTemplate = TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];

  // Dynamic simulation impact calculations based on intensity
  const factor = intensity / 100;
  const delayReducedMins = Number((currentTemplate.baseDelayMins * factor * 0.72).toFixed(1));
  const delayPercent = Math.round((delayReducedMins / currentTemplate.baseDelayMins) * 100);
  const commuterHoursSaved = Math.round((currentTemplate.baseVehiclesDay * 1.8 * delayReducedMins) / 60);
  const vehicleDamageSavingsInr = Math.round(currentTemplate.baseVehiclesDay * 0.12 * factor * 450);
  const safetyRiskReductionPct = Math.round(45 + factor * 48);
  const estimatedCostInr = Math.round(currentTemplate.baseCostInr * (0.6 + factor * 0.6));
  const benefitCostRatio = ((vehicleDamageSavingsInr + (commuterHoursSaved * 120)) / estimatedCostInr).toFixed(1);

  const handleCommitDirective = () => {
    if (!canRunInterventions) {
      warning('Insufficient Permissions', 'Analyst role is read-only. Switch to Operations Manager or Engineer to dispatch directives.');
      return;
    }

    setIsCommitted(true);
    success(
      'Intervention Directive Dispatched',
      `${currentTemplate.title} committed to MTC & GCC field dispatch queue.`
    );
    setTimeout(() => {
      setIsCommitted(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-transparent dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Intervention Impact Simulator</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  What If We Act?
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Predict civic return-on-investment & commuter impact before allocating field capital
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* 1. Select Intervention Archetype */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2.5">
              1. Choose Candidate Operational Intervention
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {TEMPLATES.map((t) => {
                const Icon = t.icon;
                const isSelected = t.id === selectedTemplateId;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTemplateId(t.id);
                      setIntensity(t.defaultIntensity);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {t.badge}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                        {t.title}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 truncate block">
                      {t.corridor.split('(')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Intensity & Scope Slider */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Intervention Intensity & Resource Scale</span>
              </div>
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 rounded-md">
                {intensity}% Operational Coverage
              </span>
            </div>
            <input
              type="range"
              min="25"
              max="100"
              step="5"
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>Minimal Spot Patch (25%)</span>
              <span>Standard Municipal Shift (75%)</span>
              <span>Full High-Spec Capital Overhaul (100%)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 italic">
              {currentTemplate.description}
            </p>
          </div>

          {/* 3. Projected Outcome Impact Dashboard */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2.5">
              3. Projected Civic Return & Commuter Benefits (Based on MTC Telemetry)
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Delay Reduction */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                  <span>Transit Delay Saved</span>
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div className="my-2">
                  <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200 font-mono">
                    -{delayPercent}%
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    -{delayReducedMins} mins / trip
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-500">
                  Base: {currentTemplate.baseDelayMins}m bottleneck
                </span>
              </div>

              {/* Commuter Hours */}
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between text-blue-800 dark:text-blue-300 text-[11px] font-bold">
                  <span>Commuter Time</span>
                  <Clock className="w-4 h-4" />
                </div>
                <div className="my-2">
                  <div className="text-2xl font-black text-blue-900 dark:text-blue-200 font-mono">
                    {commuterHoursSaved.toLocaleString()}
                  </div>
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                    Man-hours / month saved
                  </span>
                </div>
                <span className="text-[10px] text-blue-600 dark:text-blue-500">
                  {currentTemplate.baseVehiclesDay.toLocaleString()} vehicles/day
                </span>
              </div>

              {/* Fleet Damage Savings */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between text-indigo-800 dark:text-indigo-300 text-[11px] font-bold">
                  <span>Damage Averted</span>
                  <DollarSign className="w-4 h-4" />
                </div>
                <div className="my-2">
                  <div className="text-2xl font-black text-indigo-900 dark:text-indigo-200 font-mono">
                    ₹{(vehicleDamageSavingsInr / 100000).toFixed(1)}L
                  </div>
                  <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                    Annual fleet savings
                  </span>
                </div>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-500">
                  Axle & suspension protection
                </span>
              </div>

              {/* Safety Conflict Reduction */}
              <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between text-purple-800 dark:text-purple-300 text-[11px] font-bold">
                  <span>Safety Conflict Drop</span>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="my-2">
                  <div className="text-2xl font-black text-purple-900 dark:text-purple-200 font-mono">
                    -{safetyRiskReductionPct}%
                  </div>
                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">
                    Pedestrian incident drop
                  </span>
                </div>
                <span className="text-[10px] text-purple-600 dark:text-purple-500">
                  Near-miss conflict model
                </span>
              </div>
            </div>
          </div>

          {/* 4. Financial Cost-Benefit Summary */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Estimated Municipal Expense:
                </span>
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                  ₹{estimatedCostInr.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Calculated Benefit-Cost Ratio (BCR): <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{benefitCostRatio}x</strong> return on civic mobility investment
              </p>
            </div>

            <button
              onClick={handleCommitDirective}
              disabled={isCommitted}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isCommitted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Directive Issued!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Commit to Live Operations Directive</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
