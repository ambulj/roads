import React from "react";
import { Camera, Cpu, Navigation, CloudLightning, Wrench, CheckCircle2, ChevronRight, Layers, Database, Sparkles } from "lucide-react";

interface UserJourneyRibbonProps {
  onNavigate?: (route: string) => void;
}

export const UserJourneyRibbon: React.FC<UserJourneyRibbonProps> = ({ onNavigate }) => {
  const steps = [
    { num: 1, label: "Fleet Bus Mounted Dashcam", sub: "IMX335 1080p 60fps", icon: Camera, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
    { num: 2, label: "Edge AI YOLOv8 Detection", sub: "6-TOPS INT8 NPU", icon: Cpu, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
    { num: 3, label: "GPS + Telemetry Tagging", sub: "NavIC ±1.2m & Gz IMU", icon: Navigation, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
    { num: 4, label: "Cloud Ingestion & DBSCAN", sub: "15m Spatial Clustering", icon: CloudLightning, color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
    { num: 5, label: "Automated Work Order", sub: "MoHUA IRC:SP:20 SLA", icon: Wrench, color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
    { num: 6, label: "Contractor Repair & Audit", sub: "AI Before/After QC", icon: CheckCircle2, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  ];

  const frontendModules = [
    { name: "Command Center", route: "command" },
    { name: "Safety Incidents", route: "incidents" },
    { name: "Road History", route: "memory" },
    { name: "Analytics", route: "analytics" },
    { name: "Fleet Nodes", route: "fleet" },
    { name: "Work Orders", route: "work-orders" },
    { name: "Mobile Dashcam", route: "capture" },
  ];

  const futureDataConnections = [
    "NavIC GPS Tracker",
    "6-Axis IMU Shock Sensors",
    "Traffic Police CCTV Feed",
    "IMD Doppler Weather Radar",
    "National Accident Database (RADMS)",
  ];

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0E1424] border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs select-none space-y-4">
      {/* 1. User Journey Step-by-Step Flow */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Sparkles className="w-3 h-3" />
          </div>
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
            User Journey (From Detection to Resolution)
          </h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col justify-between relative group hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono font-bold flex items-center justify-center border border-slate-700">
                    {step.num}
                  </span>
                  <div className={`p-1.5 rounded-lg border ${step.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{step.label}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{step.sub}</div>
                </div>
                {idx < steps.length - 1 && (
                  <div className="hidden xl:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-600 pointer-events-none">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Inspiring Mission Banner */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-base">🇮🇳</span>
          <p className="text-slate-600 dark:text-slate-300 font-medium tracking-wide">
            <span className="text-slate-900 dark:text-white font-bold">MoRTH Smart City Mission:</span> Transforming every public transit bus into an AI-powered urban intelligence sensor for safer and resilient Indian cities.
          </p>
        </div>
        <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-mono font-semibold shrink-0">
          VISION ZERO
        </span>
      </div>
    </div>
  );
};
