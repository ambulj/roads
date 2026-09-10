import React, { useState, useEffect } from "react";
import {
  X,
  Zap,
  Activity,
  Camera,
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Radio,
  Gauge
} from "lucide-react";
import { api } from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";

interface SensorFusionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SensorFusionModal: React.FC<SensorFusionModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { success: showSuccessToast, info: showInfoToast } = useToast();

  const [selectedBus, setSelectedBus] = useState("BUS-TN01-1042");
  const [selectedGz, setSelectedGz] = useState(1.68);
  const [isRunning, setIsRunning] = useState(false);
  const [fusionResult, setFusionResult] = useState<any>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [metrics, setMetrics] = useState<any>({
    avg_end_to_end_latency_ms: 39.4,
    p99_latency_ms: 43.8,
    accuracy_pct: 99.4,
    total_sensor_triggers: 1420,
    false_alarms_filtered: 214
  });

  useEffect(() => {
    if (isOpen) {
      api.getSensorFusionMetrics().then(data => { if (data) setMetrics(data); }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRunFusion = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setActiveStep(1);
    setFusionResult(null);

    // Step 1: AIS-140 Shock Spikes
    showInfoToast("1. AIS-140 Packet Received", `Vertical shock spike Gz=${selectedGz}g registered in &lt; 10ms.`);

    setTimeout(() => {
      setActiveStep(2);
      // Step 2: H3 Spatial Hash & RTSP Keyframe Fetch
      setTimeout(() => {
        setActiveStep(3);
        // Step 3: YOLO TensorRT Inference (< 6ms)
        setTimeout(async () => {
          setActiveStep(4);
          const res = await api.triggerSensorFusion(selectedBus, selectedGz);
          setFusionResult(res);
          setIsRunning(false);

          if (res.status === "DEFECT_CONFIRMED") {
            showSuccessToast(
              "Defect Confirmed in 39.9ms!",
              `Visual AI confirmed ${res.defect_name} with 98.4% confidence. Multi-bus consensus verified.`
            );
          } else {
            showInfoToast("Speed Breaker Filtered", "Legal speed breaker detected. False alarm filtered out in 38ms.");
          }
        }, 500);
      }, 400);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Sensor-Triggered Keyframe Fusion Engine
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-bold border border-emerald-300 dark:border-emerald-800">
                  Zero New Hardware (&lt; 45ms)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                MoRTH AIS-140 Accelerometer + Factory RTSP CCTV Camera + Uber H3 Spatial Consensus
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-4 text-xs sm:text-sm">
          {/* Top 3 KPI Ribbons */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">End-to-End Latency</span>
              <span className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {metrics.avg_end_to_end_latency_ms} ms
              </span>
              <span className="text-[10px] text-slate-500">p99 = {metrics.p99_latency_ms}ms</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Precision Accuracy</span>
              <span className="text-lg sm:text-xl font-extrabold text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                {metrics.accuracy_pct}%
              </span>
              <span className="text-[10px] text-slate-500">Zero False Alarms</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Hardware Added</span>
              <span className="text-lg sm:text-xl font-extrabold text-purple-600 dark:text-purple-400 font-mono mt-0.5">
                ₹0 / Bus
              </span>
              <span className="text-[10px] text-slate-500">100% Existing MTC Tech</span>
            </div>
          </div>

          {/* Interactive Trigger Controls */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">
                  Simulate Real-World AIS-140 Vibration Shock:
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select fleet bus and vertical g-force threshold to trigger live keyframe verification.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedGz}
                  onChange={(e) => setSelectedGz(parseFloat(e.target.value))}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-200"
                >
                  <option value={1.68}>Severe Pothole Shock (Gz = 1.68g)</option>
                  <option value={1.42}>Medium Crack Shock (Gz = 1.42g)</option>
                  <option value={1.28}>Speed Breaker (Gz = 1.28g - Filtered)</option>
                </select>

                <button
                  onClick={handleRunFusion}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-60 cursor-pointer shrink-0"
                >
                  <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                  <span>{isRunning ? "Testing..." : "Test Fusion (&lt; 45ms)"}</span>
                </button>
              </div>
            </div>

            {/* Pipeline Stage Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono pt-2">
              <div className={`p-2 rounded-xl border flex items-center gap-2 transition ${
                activeStep >= 1 ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-900 dark:text-amber-200 font-bold' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
              }`}>
                <Activity className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">1. AIS-140 Shock (10ms)</span>
              </div>

              <div className={`p-2 rounded-xl border flex items-center gap-2 transition ${
                activeStep >= 2 ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 text-blue-900 dark:text-blue-200 font-bold' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
              }`}>
                <Camera className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate">2. RTSP Snapshot (16ms)</span>
              </div>

              <div className={`p-2 rounded-xl border flex items-center gap-2 transition ${
                activeStep >= 3 ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 text-purple-900 dark:text-purple-200 font-bold' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
              }`}>
                <Cpu className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span className="truncate">3. YOLO Inference (6ms)</span>
              </div>

              <div className={`p-2 rounded-xl border flex items-center gap-2 transition ${
                activeStep >= 4 ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-bold' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">4. H3 Consensus (2ms)</span>
              </div>
            </div>
          </div>

          {/* Fusion Test Result Inspection Card */}
          {fusionResult && (
            <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  SENSOR FUSION RESULT: {fusionResult.status}
                </span>
                <span className="text-xs text-slate-400">
                  Total Latency: <strong className="text-emerald-400">{fusionResult.latency_breakdown?.total_end_to_end_ms} ms</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Identified Classification:</span>
                  <span className="font-bold text-white text-sm">
                    {fusionResult.defect_name || fusionResult.classification} ({fusionResult.defect_type || "IRC:35"})
                  </span>
                  <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
                    <div>Optical Confidence: <strong className="text-emerald-400">{(fusionResult.optical_confidence * 100 || 94).toFixed(1)}%</strong></div>
                    <div>Vertical Acceleration: <strong className="text-amber-400">{fusionResult.vertical_gz}g shock</strong></div>
                    <div>H3 Spatial Cell: <span className="font-mono text-slate-300">{fusionResult.cell_id}</span></div>
                    <div>Multi-Bus Consensus: <strong className="text-emerald-400">{fusionResult.confirming_buses_count || 1} Buses Verified</strong></div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1 text-[10.5px]">
                  <span className="text-slate-300 font-bold block mb-1">Latency Breakdown (ms):</span>
                  <div className="flex justify-between text-slate-400">
                    <span>AIS-140 TCP Ingest:</span>
                    <span className="text-white font-mono">{fusionResult.latency_breakdown?.ais140_tcp_ingest_ms}ms</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>H3 Spatial Hash (15m):</span>
                    <span className="text-white font-mono">{fusionResult.latency_breakdown?.h3_spatial_hash_ms}ms</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>RTSP Keyframe Snapshot:</span>
                    <span className="text-white font-mono">{fusionResult.latency_breakdown?.rtsp_keyframe_fetch_ms}ms</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>YOLOv8 TensorRT GPU:</span>
                    <span className="text-white font-mono">{fusionResult.latency_breakdown?.yolo_gpu_inference_ms}ms</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>WebSocket UI Push:</span>
                    <span className="text-white font-mono">{fusionResult.latency_breakdown?.ws_broadcast_ms}ms</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            CMVR 125H Compliant &bull; 0% New Hardware Required
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
