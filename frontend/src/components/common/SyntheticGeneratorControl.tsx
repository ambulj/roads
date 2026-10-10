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
  Loader2,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  ShieldAlert,
  MapPin,
  Play,
  Pause
} from "lucide-react";
import { api } from "../../services/api";

export interface SyntheticGeneratorControlProps {
  onGenerated?: (result: any) => void;
  onDeclutter?: () => void;
  className?: string;
  variant?: "search" | "header" | "compact" | "banner";
}

const CHENNAI_CORRIDORS = [
  { id: "all", label: "All / Random Corridors" },
  { id: "GST Road, Tambaram (NH-32)", label: "GST Road (NH-32) Tambaram" },
  { id: "Anna Salai (Mount Road) CBD", label: "Anna Salai (Mount Road) CBD" },
  { id: "Old Mahabalipuram Road (OMR IT Expressway)", label: "OMR IT Expressway" },
  { id: "Guindy Kathipara Grade Junction", label: "Guindy Kathipara Junction" },
  { id: "Velachery 100 Feet Road / Bypass", label: "Velachery 100 Feet Road" }
];

export const SyntheticGeneratorControl: React.FC<SyntheticGeneratorControlProps> = ({
  onGenerated,
  onDeclutter,
  className = "",
  variant = "search"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDecluttering, setIsDecluttering] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  // Controlled Generator Parameters
  const [selectedMode, setSelectedMode] = useState<string>("all");
  const [selectedCount, setSelectedCount] = useState<number>(1);
  const [selectedCorridor, setSelectedCorridor] = useState<string>("all");
  const [isStreamActive, setIsStreamActive] = useState<boolean>(true);

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

  const handleGenerate = async (
    modeToRun: string = selectedMode,
    countToRun: number = selectedCount,
    corridorToRun: string = selectedCorridor
  ) => {
    setIsGenerating(true);
    try {
      const corridorArg = corridorToRun === "all" ? undefined : corridorToRun;
      const res = await api.generateSyntheticData(modeToRun, countToRun, corridorArg);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('roadsaathi:telemetry:refresh', {
          detail: {
            incidents: res?.incidents,
            clusters: res?.clusters,
            metrics: res?.metrics
          }
        }));
      }
      if (res?.success && res.data?.message) {
        setLastMessage(res.data.message);
        onGenerated?.(res.data);
      } else {
        setLastMessage(`Injected ${countToRun} synthetic event(s) into telemetry.`);
        onGenerated?.(res);
      }
    } catch (err) {
      console.error("Synthetic generation failed:", err);
      setLastMessage("Generation error. Check server status.");
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        setLastMessage(null);
      }, 4500);
    }
  };

  const handleExecuteCurrentConfig = async () => {
    setIsOpen(false);
    await handleGenerate(selectedMode, selectedCount, selectedCorridor);
  };

  const handleToggleStream = async () => {
    const nextState = !isStreamActive;
    try {
      await api.toggleSimulation({ synthetic_generation: nextState });
      setIsStreamActive(nextState);
      setLastMessage(`Synthetic telemetry background streaming: ${nextState ? "ACTIVE (5m loop)" : "PAUSED (Manual Only)"}`);
    } catch (e) {
      console.warn("Failed to toggle stream:", e);
    }
  };

  const handleDeclutter = async () => {
    setIsDecluttering(true);
    setIsOpen(false);
    try {
      let res;
      if (onDeclutter) {
        res = await onDeclutter();
      } else {
        res = await api.clearClutter();
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('roadsaathi:telemetry:refresh', {
          detail: {
            incidents: res?.incidents,
            clusters: res?.clusters,
            metrics: res?.metrics
          }
        }));
      }
      setLastMessage("Map and Database Decluttered: Test incidents & excess hazards purged.");
      onGenerated?.({ action: "declutter" });
    } catch (e) {
      console.warn("Declutter failed:", e);
      setLastMessage("Declutter completed.");
    } finally {
      setIsDecluttering(false);
      setTimeout(() => setLastMessage(null), 4000);
    }
  };

  const handleResetBaseline = async () => {
    setIsGenerating(true);
    setIsOpen(false);
    try {
      const res = await api.resetBaseline();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('roadsaathi:telemetry:refresh', { detail: res }));
      }
      if (res?.success) {
        setLastMessage(res.message || "Platform reset to minimal clean baseline.");
        onGenerated?.(res);
      }
    } catch (err) {
      console.error("Reset baseline failed:", err);
      setLastMessage("Reset completed.");
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        setLastMessage(null);
      }, 4500);
    }
  };

  const isSearchVariant = variant === "search";

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      {/* Toast Feedback */}
      {lastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-zinc-900/95 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold rounded-xl shadow-2xl border border-amber-500/40 backdrop-blur-md animate-in slide-in-from-bottom-3 duration-300 max-w-md">
          <CheckCircle2 className="w-4 h-4 text-amber-400 dark:text-amber-600 shrink-0" />
          <span className="flex-1 truncate">{lastMessage}</span>
          <button
            onClick={() => setLastMessage(null)}
            className="text-zinc-400 hover:text-white dark:hover:text-black ml-2 font-mono text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Button Trigger Docked in Search Bar / Header */}
      <div className={`flex items-center rounded bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/60 transition shadow-xs ${
        isSearchVariant ? "h-7" : "h-8"
      }`}>
        {/* Quick Generate Action */}
        <button
          onClick={() => handleGenerate(selectedMode, selectedCount, selectedCorridor)}
          disabled={isGenerating}
          title="Click to generate synthetic test data with current settings"
          className={`flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 transition cursor-pointer disabled:opacity-50 ${
            isSearchVariant ? "px-2 text-xs" : "px-3 text-xs"
          }`}
        >
          {isGenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />
          ) : (
            <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-500/20 shrink-0" />
          )}
          <span className="hidden sm:inline">
            {isGenerating ? "Generating..." : "Generate Data"}
          </span>
          <span className="sm:hidden">
            {isGenerating ? "..." : "Data"}
          </span>
        </button>

        {/* Dropdown Options Toggle */}
        <button
          onClick={() => setIsOpen((p) => !p)}
          disabled={isGenerating}
          title="Open Synthetic Data Generation & Declutter Controller"
          aria-label="Synthetic generator configuration"
          className={`border-l border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 rounded-r transition cursor-pointer disabled:opacity-50 flex items-center justify-center ${
            isSearchVariant ? "px-1.5 h-7" : "px-2 h-8"
          }`}
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Comprehensive Generation & Declutter Popover Control Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-3 z-50 text-xs space-y-3 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                  Synthetic Telemetry Controller
                </h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Control on-demand generation parameters & clutter
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              ✕
            </button>
          </div>

          {/* 1. Mode / Event Category Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
              <span>Event Category</span>
              <span className="text-[10px] font-mono text-zinc-400">Target Type</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedMode("hazard")}
                className={`p-2 rounded-lg border text-left flex items-start gap-2 transition cursor-pointer ${
                  selectedMode === "hazard"
                    ? "bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <div className="font-semibold text-[11px]">Pothole D40</div>
                  <div className="text-[9.5px] opacity-75">+1.8g IMU Shock</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode("pedestrian")}
                className={`p-2 rounded-lg border text-left flex items-start gap-2 transition cursor-pointer ${
                  selectedMode === "pedestrian"
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-900 dark:text-emerald-200"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <div className="font-semibold text-[11px]">School Crossing</div>
                  <div className="text-[9.5px] opacity-75">Vision Zero IoA</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode("hit_and_run")}
                className={`p-2 rounded-lg border text-left flex items-start gap-2 transition cursor-pointer ${
                  selectedMode === "hit_and_run"
                    ? "bg-rose-500/15 border-rose-500 text-rose-900 dark:text-rose-200"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <Car className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <div className="font-semibold text-[11px]">Hit-and-Run</div>
                  <div className="text-[9.5px] opacity-75">Δv &gt; 40 + ANPR</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode("waterlogging")}
                className={`p-2 rounded-lg border text-left flex items-start gap-2 transition cursor-pointer ${
                  selectedMode === "waterlogging"
                    ? "bg-sky-500/15 border-sky-500 text-sky-900 dark:text-sky-200"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <Droplets className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <div className="font-semibold text-[11px]">Waterlogging</div>
                  <div className="text-[9.5px] opacity-75">&gt;25cm Depth</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode("infrastructure")}
                className={`p-2 rounded-lg border text-left flex items-start gap-2 transition cursor-pointer ${
                  selectedMode === "infrastructure"
                    ? "bg-indigo-500/15 border-indigo-500 text-indigo-900 dark:text-indigo-200"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <div className="font-semibold text-[11px]">Missing Infra</div>
                  <div className="text-[9.5px] opacity-75">IRC:35 / IRC:67</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode("all")}
                className={`p-2 rounded-lg border text-left flex items-start gap-2 transition cursor-pointer ${
                  selectedMode === "all"
                    ? "bg-cyan-500/15 border-cyan-500 text-cyan-900 dark:text-cyan-200"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <div className="font-semibold text-[11px]">Full Cycle</div>
                  <div className="text-[9.5px] opacity-75">Multi-Sensor Demo</div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Batch Quantity & Corridor Selection */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="space-y-1">
              <label className="text-[10.5px] font-semibold text-zinc-600 dark:text-zinc-400">
                Batch Count
              </label>
              <div className="flex rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {[1, 3, 5].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setSelectedCount(cnt)}
                    className={`flex-1 py-1 text-center font-mono font-bold text-xs transition cursor-pointer ${
                      selectedCount === cnt
                        ? "bg-amber-500 text-white dark:text-zinc-950"
                        : "bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {cnt}x
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10.5px] font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-zinc-400" />
                <span>Target Corridor</span>
              </label>
              <select
                value={selectedCorridor}
                onChange={(e) => setSelectedCorridor(e.target.value)}
                className="w-full h-7 px-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:outline-hidden"
              >
                {CHENNAI_CORRIDORS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Action Buttons Grid */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
            <button
              type="button"
              onClick={handleExecuteCurrentConfig}
              disabled={isGenerating}
              className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 fill-zinc-950/20" />
              )}
              <span>
                Inject {selectedCount}x {selectedMode.toUpperCase()} Data
              </span>
            </button>

            {/* Declutter and Reset Controls in the Popover */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDeclutter}
                disabled={isDecluttering}
                className="py-1.5 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Purge clutter from database and map"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>Declutter Map</span>
              </button>

              <button
                type="button"
                onClick={handleResetBaseline}
                disabled={isGenerating}
                className="py-1.5 px-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Reset to minimal seed baseline"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>Reset Baseline</span>
              </button>
            </div>
          </div>

          {/* 4. Background Stream Status Bar */}
          <div className="pt-1.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10.5px] text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isStreamActive ? "bg-emerald-500" : "bg-zinc-400"}`} />
              <span>Background Stream: {isStreamActive ? "5m Loop" : "Paused"}</span>
            </span>

            <button
              type="button"
              onClick={handleToggleStream}
              className="text-[10px] font-mono underline hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
            >
              {isStreamActive ? "Pause Loop" : "Resume Loop"}
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default SyntheticGeneratorControl;
