import React from 'react';
import { X, Calculator, ShieldCheck } from 'lucide-react';

interface RPIFormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RPIFormulaModal: React.FC<RPIFormulaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
            <Calculator className="w-5 h-5" />
            <span>Dynamic Road Priority Index (RPI) Formulation</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formula Box */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">MoHUA / CRDDC Benchmark Mathematical Formulation (v2.6)</p>
          <div className="text-sm font-semibold text-blue-700 dark:text-blue-300 py-2.5 px-3 tracking-wide font-mono bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
            RPI = min(100.0, w₁·S_defect + w₂·log₂(1+Passes)·20 + w₃·C_road + w₄·(1 - min(D_poi, 1500)/1500)·100)
          </div>
        </div>

        {/* Factor Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 flex flex-col gap-1">
            <div className="flex items-center justify-between font-bold text-rose-600 dark:text-rose-400">
              <span>w₁: Defect Severity (40%)</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-[10px] font-mono font-semibold">0.40</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
              Base score based on CRDDC / RDD2022 standards:
            </p>
            <ul className="text-[11px] text-slate-500 dark:text-slate-400 list-disc list-inside space-y-0.5 mt-0.5">
              <li><b className="text-slate-800 dark:text-slate-200">Pothole (D40):</b> 100 pts (Deep asphalt road cavity &amp; hazard)</li>
              <li><b className="text-slate-800 dark:text-slate-200">Alligator Crack (D20):</b> 75 pts (Severe fatigue web cracks)</li>
              <li><b className="text-slate-800 dark:text-slate-200">Transverse Crack (D10):</b> 50 pts (Across-road stress crack)</li>
              <li><b className="text-slate-800 dark:text-slate-200">Surface Line Crack (D00):</b> 30 pts (Early asphalt surface wear)</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 flex flex-col gap-1">
            <div className="flex items-center justify-between font-bold text-amber-600 dark:text-amber-400">
              <span>w₂: Pass Frequency (20%)</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-semibold">0.20</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
              Logarithmic multi-bus consensus scale:
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
              Filters phantom defects. 1 pass = 20 pts, 3 passes = 40 pts, 7 passes = 60 pts, 15+ passes = 80 pts. Multiple transit vehicle confirmations validate ground truth.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 flex flex-col gap-1">
            <div className="flex items-center justify-between font-bold text-blue-600 dark:text-blue-400">
              <span>w₃: Road Class Weight (20%)</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-semibold">0.20</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
              Traffic velocity &amp; passenger volume priority:
            </p>
            <ul className="text-[11px] text-slate-500 dark:text-slate-400 list-disc list-inside space-y-0.5 mt-0.5">
              <li><b className="text-slate-800 dark:text-slate-200">National Highway (NH):</b> 100 pts</li>
              <li><b className="text-slate-800 dark:text-slate-200">State Highway (SH):</b> 80 pts</li>
              <li><b className="text-slate-800 dark:text-slate-200">Major City Arterial:</b> 65 pts</li>
              <li><b className="text-slate-800 dark:text-slate-200">Commercial Transit Hub:</b> 60 pts</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 flex flex-col gap-1">
            <div className="flex items-center justify-between font-bold text-indigo-600 dark:text-indigo-400">
              <span>w₄: Critical POI Proximity (20%)</span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono font-semibold">0.20</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
              Safety impact on sensitive urban zones:
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
              Linear decay within 1500m of Trauma Centers, Hospitals, Schools, and Metro Interchanges. A pothole 100m from a hospital scores 93.3/100 for proximity factor.
            </p>
          </div>
        </div>

        {/* SLA Matrix */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="font-semibold">Automated Contractor SLA Triage:</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-semibold">&gt;85: 24h SLA</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 font-semibold">70-85: 48h SLA</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-semibold">&lt;70: 72h SLA</span>
          </div>
        </div>
      </div>
    </div>
  );
};
