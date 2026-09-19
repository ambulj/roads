import React, { useState, useRef, useEffect } from "react";
import {
  Zap,
  ChevronDown,
  AlertTriangle,
  UserCheck,
  Car,
  Droplets,
  RefreshCw,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { api } from "../../services/api";

interface SyntheticGeneratorControlProps {
  onGenerated?: (result: any) => void;
  className?: string;
  variant?: "header" | "compact" | "banner";
}

export const SyntheticGeneratorControl: React.FC<SyntheticGeneratorControlProps> = ({
  onGenerated,
  className = "",
  variant = "header"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGenerate = async (mode: string) => {
    setIsGenerating(true);
    setIsOpen(false);
    try {
      const res = await api.generateSyntheticData(mode);
      if (res?.success && res.data?.message) {
        setLastMessage(res.data.message);
        onGenerated?.(res.data);
      } else {
        setLastMessage("Synthetic data created and broadcasted to fleet.");
      }
    } catch (err) {
      console.error("Synthetic generation failed:", err);
      setLastMessage("Generation error. Check server logs.");
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        setLastMessage(null);
      }, 4500);
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      {/* Toast Notification */}
      {lastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900/95 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold rounded-xl shadow-2xl border border-amber-500/40 backdrop-blur-md animate-in slide-in-from-bottom-3 duration-300 max-w-md">
          <CheckCircle2 className="w-4 h-4 text-amber-400 dark:text-amber-600 shrink-0" />
          <span className="flex-1 truncate">{lastMessage}</span>
          <button
            onClick={() => setLastMessage(null)}
            className="text-slate-400 hover:text-white dark:hover:text-black ml-2 font-mono text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Trigger Button */}
      <div className="flex items-center rounded-lg bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/60 transition shadow-xs">
        <button
          onClick={() => handleGenerate("all")}
          disabled={isGenerating}
          title="Click to generate 1 complete synthetic urban cycle on-demand"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 transition cursor-pointer disabled:opacity-50"
        >
          {isGenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />
          ) : (
            <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-500/20" />
          )}
          <span className="hidden sm:inline">
            {isGenerating ? "Generating..." : "Generate Synthetic Data"}
          </span>
          <span className="sm:hidden">
            {isGenerating ? "..." : "Generate"}
          </span>
        </button>

        <button
          onClick={() => setIsOpen((p) => !p)}
          disabled={isGenerating}
          title="Choose targeted synthetic event type to generate"
          aria-label="Synthetic generator options"
          className="px-1.5 py-1.5 border-l border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 rounded-r-lg transition cursor-pointer disabled:opacity-50"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Options Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-2 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>On-Demand Synthetic Generator</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Continuous auto-generation is disabled. Click below to inject verified test telemetry.
            </p>
          </div>

          {/* Quick Option 1: Pothole Defect */}
          <button
            onClick={() => handleGenerate("hazard")}
            className="w-full px-3 py-2 text-left rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-start gap-2.5 transition text-slate-800 dark:text-slate-200 cursor-pointer group"
          >
            <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-[12px] flex items-center gap-1.5">
                <span>Pothole Road Hazard (D40)</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-amber-200 dark:bg-amber-800/60 rounded text-amber-900 dark:text-amber-200 font-mono">
                  +1.8g IMU
                </span>
              </div>
              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                Ingest single high-severity pothole cluster on active corridor.
              </div>
            </div>
          </button>

          {/* Quick Option 2: Pedestrian Crossing Safety */}
          <button
            onClick={() => handleGenerate("pedestrian")}
            className="w-full px-3 py-2 text-left rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-start gap-2.5 transition text-slate-800 dark:text-slate-200 cursor-pointer group"
          >
            <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-[12px] flex items-center gap-1.5">
                <span>School Crossing Pedestrian</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-emerald-200 dark:bg-emerald-800/60 rounded text-emerald-900 dark:text-emerald-200 font-mono">
                  Zone IoA
                </span>
              </div>
              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                Inject pedestrian right-of-way alert in DAV school corridor.
              </div>
            </div>
          </button>

          {/* Quick Option 3: Hit & Run Evasion */}
          <button
            onClick={() => handleGenerate("hit_and_run")}
            className="w-full px-3 py-2 text-left rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-start gap-2.5 transition text-slate-800 dark:text-slate-200 cursor-pointer group"
          >
            <div className="p-1.5 rounded-md bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <Car className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-[12px] flex items-center gap-1.5">
                <span>Hit-and-Run Evasion Alert</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-rose-200 dark:bg-rose-800/60 rounded text-rose-900 dark:text-rose-200 font-mono">
                  Δv &gt; 40
                </span>
              </div>
              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                High-speed collision and evasion incident with plate ANPR trail.
              </div>
            </div>
          </button>

          {/* Quick Option 4: Monsoon Flood */}
          <button
            onClick={() => handleGenerate("waterlogging")}
            className="w-full px-3 py-2 text-left rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/40 flex items-start gap-2.5 transition text-slate-800 dark:text-slate-200 cursor-pointer group"
          >
            <div className="p-1.5 rounded-md bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <Droplets className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-[12px] flex items-center gap-1.5">
                <span>Monsoon Waterlogging</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-sky-200 dark:bg-sky-800/60 rounded text-sky-900 dark:text-sky-200 font-mono">
                  &gt;25cm
                </span>
              </div>
              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                Inundation cavity alert with municipal pump dispatch request.
              </div>
            </div>
          </button>

          <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
            {/* Quick Option 5: Full Cycle */}
            <button
              onClick={() => handleGenerate("all")}
              className="w-full px-3 py-2 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition text-slate-900 dark:text-white font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
              <span>Generate Full Urban Demo Cycle (5 Items)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
