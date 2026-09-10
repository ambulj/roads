import React from 'react';
import { X, ShieldCheck, Cpu, Database, Radio, Award } from 'lucide-react';

interface BriefModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BriefModal: React.FC<BriefModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
            <Award className="w-5 h-5" />
            <span>RoadSaarthi — Executive Architecture Brief (BEL / MoHUA)</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Overview */}
        <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <span className="text-blue-700 dark:text-blue-300 font-bold">Strategic Vision: </span> 
          RoadSaarthi transforms standard public transit buses into mobile urban edge sensing nodes. By eliminating costly dedicated inspection vehicles, municipal road audits become a continuous, real-time by-product of daily public transit operations.
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
              <Cpu className="w-4 h-4" />
              <span>Sub-₹3,000 Edge Intelligence</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              INT8 quantized YOLO11 models running on heterogeneous NPUs (Rockchip RK3588 / Coral Edge TPU). Inferences at 24-30 FPS with zero recurring cloud GPU consumption.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
              <Radio className="w-4 h-4" />
              <span>Low-Bandwidth Micro-Telemetry</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Never streams raw 1080p video over 4G SIM cards. Transmits only 450-byte compact JSON event payloads over TLS 8883 MQTT, reducing cellular data bills by 99.8%.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold">
              <Database className="w-4 h-4" />
              <span>15m DBSCAN Spatial Deduplication</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              PostGIS geodesic clustering prevents duplicate tickets when 50 buses encounter the same pothole. Rejects 85.9% of telemetry noise and duplicate detections.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Automated PWD SLA Dispatch</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Direct integration with municipal maintenance contractors. Enforces 24h, 48h, and 72h SLAs, and uses subsequent bus passes for autonomous post-repair verification.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Deployment: Sovereign Self-Hosted</span>
          <span className="text-blue-600 dark:text-blue-400 font-semibold">Ministry of Housing &amp; Urban Affairs</span>
        </div>
      </div>
    </div>
  );
};
