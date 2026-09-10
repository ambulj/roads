import React from "react";
import { 
  Box, 
  Layers, 
  Camera, 
  Activity, 
  Gauge, 
  ChevronRight, 
  Sparkles, 
  MapPin, 
  Compass, 
  AlertTriangle 
} from "lucide-react";
import { PotholeSensorTelemetry } from "../modals/RoadMeshVisualizerModal";

export const DETECTED_POTHOLES: PotholeSensorTelemetry[] = [
  {
    id: "CL-0001",
    locationName: "GST Road NH-32 (Near Chennai Bypass, Ch. 18.4 km)",
    roadName: "GST Road NH-32",
    defectType: "D40 Severe Cavity",
    depthCm: 8.4,
    areaM2: 0.65,
    volumeLiters: 42.5,
    costInr: 3450,
    iriScore: 4.82,
    sensorGz: 2.8,
    cameraConfidence: 94,
    detectedBusId: "Bus #04 (TN-01-N-1042)",
    footageImageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "CL-0004",
    locationName: "SRM Potheri Highway (Opp. Medical Block)",
    roadName: "SRM / Potheri Arterial",
    defectType: "D40 Deep Edge Pit",
    depthCm: 10.2,
    areaM2: 0.88,
    volumeLiters: 64.0,
    costInr: 4850,
    iriScore: 5.45,
    sensorGz: 3.4,
    cameraConfidence: 91,
    detectedBusId: "Bus #12 (DL-1PC-3088)",
    footageImageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "CL-0002",
    locationName: "Guindy Kathipara Grade Junction (Ramp 2)",
    roadName: "Kathipara Grade Separator",
    defectType: "D20 Transverse Crack-Cavity",
    depthCm: 5.6,
    areaM2: 0.42,
    volumeLiters: 22.8,
    costInr: 2100,
    iriScore: 3.92,
    sensorGz: 1.9,
    cameraConfidence: 89,
    detectedBusId: "Bus #18 (DL-1PC-5012)",
    footageImageUrl: "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "CL-0005",
    locationName: "Chennai Cantt Canal Road (Near Siphon Point)",
    roadName: "Canal Road Arterial",
    defectType: "D40 Wheel-Path Depression",
    depthCm: 9.1,
    areaM2: 0.72,
    volumeLiters: 49.6,
    costInr: 3950,
    iriScore: 4.95,
    sensorGz: 3.1,
    cameraConfidence: 96,
    detectedBusId: "Bus #24 (DL-1PC-1042)",
    footageImageUrl: "https://images.unsplash.com/photo-1584463699039-307994849d15?w=600&auto=format&fit=crop&q=80",
  },
];

interface DetectedPotholesMeshDeckProps {
  onInspectPotholeMesh: (pothole: PotholeSensorTelemetry) => void;
}

export const DetectedPotholesMeshDeck: React.FC<DetectedPotholesMeshDeckProps> = ({
  onInspectPotholeMesh,
}) => {
  return (
    <div className="rounded-2xl bg-[#F8FAFD] dark:bg-[#0E1424] border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-colors select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight leading-none">
                Detected Potholes &amp; 3D Depth Mesh Reconstructions
              </h3>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                ● 4 Active Cavities Surveyed
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none mt-1">
              Depth and volume calculated separately per defect using dual-dashcam disparity and 100Hz bus accelerometer shock
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EEF2F7] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px]">
            <Activity className="w-3 h-3 text-emerald-500" />
            <span>Stereo Disparity + IMU Fusion</span>
          </span>
        </div>
      </div>

      {/* 4 Detected Pothole Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 pt-3.5">
        {DETECTED_POTHOLES.map((pothole) => (
          <div
            key={pothole.id}
            onClick={() => onInspectPotholeMesh(pothole)}
            className="group flex flex-col justify-between p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0A101D] hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 hover:shadow-md cursor-pointer"
          >
            <div>
              {/* Top: Defect Code + Severity Pill */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
                  {pothole.id}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 font-mono">
                  {pothole.depthCm} cm DEPTH
                </span>
              </div>

              {/* Footage Snapshot Preview with AI Bounding Box */}
              <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 aspect-16/10 mb-2.5 bg-slate-900">
                <img 
                  src={pothole.footageImageUrl} 
                  alt={pothole.locationName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
                <div className="absolute inset-0 bg-slate-950/20" />
                
                {/* AI Box Overlay */}
                <div className="absolute inset-2 border-2 border-rose-500 rounded bg-rose-500/10 flex flex-col justify-between p-1 pointer-events-none">
                  <div className="flex items-center justify-between">
                    <span className="px-1 py-0.2 rounded bg-rose-600 text-white font-mono text-[8.5px] font-bold">
                      YOLOv8: {pothole.cameraConfidence}%
                    </span>
                    <span className="px-1 py-0.2 rounded bg-slate-950/90 text-rose-300 font-mono text-[8.5px]">
                      +{pothole.sensorGz}g IMU
                    </span>
                  </div>
                  <div className="text-[8.5px] font-mono text-white/90 bg-slate-950/80 px-1 py-0.5 rounded self-start">
                    Disparity: {pothole.depthCm}cm
                  </div>
                </div>
              </div>

              {/* Location & Road */}
              <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 leading-tight">
                {pothole.defectType}
              </h4>
              <p className="text-[10.5px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{pothole.locationName}</span>
              </p>
            </div>

            {/* Calculated Metrics Grid & Action Button */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 mt-2.5 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                <div className="p-1.5 rounded-lg bg-[#EEF2F7] dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-slate-400 block text-[9px]">Calculated Vol:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">{pothole.volumeLiters} L</strong>
                </div>
                <div className="p-1.5 rounded-lg bg-[#EEF2F7] dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-slate-400 block text-[9px]">Est. SOR Cost:</span>
                  <strong className="text-blue-600 dark:text-blue-400">₹{pothole.costInr.toLocaleString()}</strong>
                </div>
              </div>

              <button
                type="button"
                className="w-full py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 shadow-xs"
              >
                <Box className="w-3.5 h-3.5" />
                <span>Inspect 3D Surface Mesh</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
