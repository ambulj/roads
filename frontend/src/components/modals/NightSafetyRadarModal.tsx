import React, { useState } from "react";
import { 
  X, 
  Moon, 
  Sun, 
  Lightbulb, 
  LightbulbOff, 
  AlertTriangle, 
  ShieldAlert, 
  Eye, 
  Sparkles, 
  Zap, 
  MapPin, 
  Send,
  CheckCircle2,
  Filter
} from "lucide-react";

interface NightSafetyRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NightHazard {
  id: string;
  type: "DARK_ZONE" | "UNMARKED_BUMP" | "MISSING_STUDS";
  title: string;
  location: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  luxOrHeight: string;
  riskDescription: string;
  department: string;
}

const NIGHT_HAZARDS: NightHazard[] = [
  {
    id: "NZ-01",
    type: "DARK_ZONE",
    title: "Non-Functional Streetlight Black Spot",
    location: "Canal Road (Opp. Chennai Cantt Gate 2)",
    severity: "CRITICAL",
    luxOrHeight: "0.8 lux (Dark Corridor)",
    riskDescription: "4 consecutive sodium-vapor lamps unlit. Heavy pedestrian crossing point with 0 illumination.",
    department: "City Electricity & Lighting Dept",
  },
  {
    id: "NZ-02",
    type: "UNMARKED_BUMP",
    title: "Unpainted Speed Breaker (Invisible at Night)",
    location: "GST Road (NH-32) Bypass (Near RIT Chennai)",
    severity: "CRITICAL",
    luxOrHeight: "14 cm height • 0% Paint",
    riskDescription: "No reflective thermoplastic zebra stripes. Causes harsh emergency braking (+3.1g jerk).",
    department: "Traffic Police & PWD Road Safety",
  },
  {
    id: "NZ-03",
    type: "MISSING_STUDS",
    title: "Missing Reflective Cat-Eyes on Blind Curve",
    location: "Railway Overbridge Ramp 2",
    severity: "HIGH",
    luxOrHeight: "18 Missing Retro-Reflective Studs",
    riskDescription: "Curvature radius 45m. Center line invisible in oncoming glare. Risk of head-on sideswipes.",
    department: "Highway Authority (NHAI)",
  },
  {
    id: "NZ-04",
    type: "DARK_ZONE",
    title: "Flickering / Burned Out LED Array",
    location: "Civil Lines Main Market Crossroad",
    severity: "MEDIUM",
    luxOrHeight: "2.1 lux (Sub-standard)",
    riskDescription: "Flickering luminaire creating strobe distraction for night transit drivers.",
    department: "City Electricity & Lighting Dept",
  },
];

export const NightSafetyRadarModal: React.FC<NightSafetyRadarModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [dispatchedId, setDispatchedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = NIGHT_HAZARDS.filter((h) => {
    if (selectedFilter === "ALL") return true;
    return h.type === selectedFilter;
  });

  const handleDispatch = (id: string) => {
    setDispatchedId(id);
    setTimeout(() => setDispatchedId(null), 2500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn select-none"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#090E1A] border border-blue-900/60 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white animate-scaleIn">
        
        {/* Top Header */}
        <div className="h-14 px-5 border-b border-slate-800 flex items-center justify-between bg-[#0B1222]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-xs">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white tracking-wide">
                  Vision Zero: Night Black-Spot & Road Stud Radar
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  NIGHT TELEMETRY
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Lux sensor logging, unmarked speed breaker detection, and cat-eye reflectance audits
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-[#070B14] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium mr-1">Filter:</span>
            {[
              { id: "ALL", label: "All Hazards (4)" },
              { id: "DARK_ZONE", label: "💡 Dark Corridors (2)" },
              { id: "UNMARKED_BUMP", label: "⚠️ Unmarked Bumps (1)" },
              { id: "MISSING_STUDS", label: "🔘 Missing Studs (1)" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  selectedFilter === f.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <span className="text-indigo-400 text-xs font-mono font-semibold">
            Night Crash Risk Multiplier: 3.4×
          </span>
        </div>

        {/* Hazards List */}
        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-3 bg-[#070B14]">
          {filtered.map((hazard) => {
            const isSent = dispatchedId === hazard.id;
            return (
              <div 
                key={hazard.id}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-800/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    hazard.type === "DARK_ZONE" 
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : hazard.type === "UNMARKED_BUMP"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  }`}>
                    {hazard.type === "DARK_ZONE" ? <LightbulbOff className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs sm:text-sm text-white truncate">
                        {hazard.title}
                      </h4>
                      <span className={`text-[9.5px] font-mono font-bold px-2 py-0.2 rounded border ${
                        hazard.severity === "CRITICAL"
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      }`}>
                        {hazard.severity}
                      </span>
                    </div>

                    <div className="text-xs text-indigo-400 font-mono flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{hazard.location}</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-amber-300 font-bold">{hazard.luxOrHeight}</span>
                    </div>

                    <p className="text-[11.5px] text-slate-400 mt-1 leading-relaxed">
                      {hazard.riskDescription}
                    </p>

                    <div className="text-[10px] text-slate-500 mt-1.5 font-medium">
                      Jurisdiction: <strong className="text-slate-300">{hazard.department}</strong>
                    </div>
                  </div>
                </div>

                {/* Right Action */}
                <div className="shrink-0 flex sm:flex-col items-center justify-between gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                  <button
                    onClick={() => handleDispatch(hazard.id)}
                    disabled={isSent}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
                      isSent
                        ? "bg-emerald-600 text-white"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30 active:scale-95"
                    }`}
                  >
                    {isSent ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{isSent ? "Dispatched!" : "Dispatch Notice"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Summary */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#0B1222] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Automatic lux sensor triggers when ambient light drops below <strong>5.0 lux</strong></span>
          </div>
          <button 
            onClick={() => alert("Exported Vision Zero Night Road Safety Audit report (GIS GeoJSON + PDF).")}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
          >
            Export Night Audit Report →
          </button>
        </div>

      </div>
    </div>
  );
};
