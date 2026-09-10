import React from "react";
import { 
  Video, 
  CloudRain, 
  Moon, 
  Sparkles, 
  ChevronRight,
  Zap,
  Radio,
  Eye
} from "lucide-react";

interface CityIntelligenceFeaturesProps {
  onOpenLiveCam: () => void;
  onToggleMonsoon: () => void;
  isMonsoonActive: boolean;
  onOpenNightRadar: () => void;
  isLiveCamOpen?: boolean;
}

export const CityIntelligenceFeatures: React.FC<CityIntelligenceFeaturesProps> = ({
  onOpenLiveCam,
  onToggleMonsoon,
  isMonsoonActive,
  onOpenNightRadar,
  isLiveCamOpen = false,
}) => {
  const modules = [
    {
      id: "live-cam",
      title: "Live Bus Cam & AI HUD",
      subtitle: "Edge AI Perception & Telemetry",
      metric: "30 FPS @ 24ms • YOLOv8",
      badge: "LIVE PIP",
      badgeColor: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60",
      icon: Video,
      iconBg: "bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60",
      actionText: isLiveCamOpen ? "Cam Active (PIP)" : "Launch Live Feed",
      actionActive: isLiveCamOpen,
      actionBorder: "border-rose-300 dark:border-rose-800",
      actionBg: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300",
      onClick: onOpenLiveCam,
      pulse: true,
      description: "Real-time edge dashcam stream with live bounding boxes, GPS coordinates, and vehicle speed ribbon."
    },
    {
      id: "monsoon-flood",
      title: "Monsoon Flood Anticipation Radar",
      subtitle: "Doppler Elevation Modeling",
      metric: "52 mm/h • 3 Inundations Forecasted",
      badge: isMonsoonActive ? "RADAR ON" : "+4H RADAR",
      badgeColor: isMonsoonActive 
        ? "bg-sky-500 text-white border-sky-400 font-bold" 
        : "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900/60",
      icon: CloudRain,
      iconBg: "bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900/60",
      actionText: isMonsoonActive ? "Hide Flood Radar" : "Toggle Forecast Engine",
      actionActive: isMonsoonActive,
      actionBorder: "border-sky-300 dark:border-sky-800",
      actionBg: isMonsoonActive ? "bg-sky-600 text-white" : "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300",
      onClick: onToggleMonsoon,
      description: "Predicts low-lying waterlogging 2-4 hours ahead during heavy rainfall and auto-reroutes municipal buses."
    },
    {
      id: "night-radar",
      title: "Vision Zero: Night Safety Radar",
      subtitle: "Nocturnal Hazard & Lux Scanner",
      metric: "0.8 Lux Black Spots • Unmarked Bumps",
      badge: "VISION ZERO",
      badgeColor: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/60",
      icon: Moon,
      iconBg: "bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/60",
      actionText: "Scan Night Hazards",
      actionActive: false,
      actionBorder: "border-indigo-300 dark:border-indigo-800",
      actionBg: "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300",
      onClick: onOpenNightRadar,
      description: "Scans for defective streetlights, unpainted speed breakers, and missing road studs on dark arterial corridors."
    },
  ];

  return (
    <div className="rounded-2xl bg-[#F8FAFD] dark:bg-[#0E1424] border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-colors">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight leading-none">
                City Intelligence Autonomous Modules
              </h3>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                ● 3 Core Engines Online
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none mt-1">
              High-throughput edge vision, meteorological flood radar & Vision Zero night inspection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EEF2F7] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>5Hz Telemetry Active</span>
          </span>
        </div>
      </div>

      {/* 3-Card Balanced Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3.5">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              onClick={m.onClick}
              className={`group flex flex-col justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer bg-white dark:bg-[#0A101D] hover:shadow-md ${
                m.actionActive
                  ? "border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                  : "border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600"
              }`}
            >
              <div>
                {/* Card Header: Icon + Badge */}
                <div className="flex items-center justify-between gap-1.5 mb-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${m.iconBg} group-hover:scale-105 transition-transform shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-wider font-mono flex items-center gap-1 ${m.badgeColor}`}>
                    {m.pulse && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                    {m.badge}
                  </span>
                </div>

                {/* Title & Subtitle */}
                <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                  {m.title}
                </h4>
                <p className="text-[11px] text-slate-400 leading-snug mt-1 line-clamp-2">
                  {m.description}
                </p>
              </div>

              {/* Metric & Trigger Action */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-3 flex flex-col gap-2">
                <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 font-mono flex items-center justify-between">
                  <span>{m.metric}</span>
                </div>
                <button
                  type="button"
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                    m.actionActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : `${m.actionBg} ${m.actionBorder} hover:brightness-95 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600`
                  }`}
                >
                  <span>{m.actionText}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
