import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  Radio,
  Video,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FolderOpen,
  Zap,
  Server,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Database
} from 'lucide-react';
import { api } from '../../services/api';

interface StreamModelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'models' | 'streams' | 'blueprint';
}

export const StreamModelConfigModal: React.FC<StreamModelConfigModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'models'
}) => {
  const [activeTab, setActiveTab] = useState<'models' | 'streams' | 'blueprint'>(defaultTab);

  // Models State
  const [modelKey, setModelKey] = useState<string>('pothole_yolo');
  const [modelPath, setModelPath] = useState<string>('backend/app/weights/yolov8x_road_defect.pt');
  const [modelStatus, setModelStatus] = useState<any>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelFeedback, setModelFeedback] = useState<string | null>(null);

  // Streams State
  const [busId, setBusId] = useState<string>('BUS-TN01-1042');
  const [streamType, setStreamType] = useState<string>('RTSP_IP_CAMERA');
  const [videoUrl, setVideoUrl] = useState<string>('rtsp://mtc-fleet.chennai.gov.in:554/bus1042/windshield');
  const [ais140Url, setAis140Url] = useState<string>('mqtt://ais140.transport.tn.gov.in:1883/MTC-118A');
  const [samplingFps, setSamplingFps] = useState<number>(30);
  const [activeStreams, setActiveStreams] = useState<any[]>([]);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [streamFeedback, setStreamFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [mStatus, sList] = await Promise.all([
        api.getModelStatus(),
        api.getActiveStreams()
      ]);
      if (mStatus) setModelStatus(mStatus);
      if (sList) setActiveStreams(sList);
    } catch (err) {
      console.error('Failed to load model/stream status:', err);
    }
  };

  const handleLoadModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelPath.trim()) return;
    setIsModelLoading(true);
    setModelFeedback(null);
    try {
      const res = await api.loadModelWeights(modelKey, modelPath);
      setModelFeedback(res.message || 'Model weights loaded successfully.');
      await loadData();
    } catch (err) {
      setModelFeedback('Error loading model weights. Please verify file path.');
    } finally {
      setIsModelLoading(false);
    }
  };

  const handleConfigureStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;
    setIsStreamLoading(true);
    setStreamFeedback(null);
    try {
      const res = await api.configureStream({
        bus_id: busId,
        stream_type: streamType,
        video_url: videoUrl,
        ais140_url: ais140Url,
        sampling_fps: Number(samplingFps)
      });
      setStreamFeedback(res.message || 'Live stream connector registered successfully.');
      await loadData();
    } catch (err) {
      setStreamFeedback('Error registering stream connector.');
    } finally {
      setIsStreamLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Real-Time AI Pipeline &amp; Zero-Hardware Stream Config
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  HOT-RELOAD READY
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Drop in custom <code className="text-blue-600 dark:text-blue-400 font-mono">.pt</code> PyTorch weights or bind existing bus CCTV RTSP / AIS-140 streams.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-100/50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('models')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'models'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Custom .pt Weight Loader</span>
          </button>
          <button
            onClick={() => setActiveTab('streams')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'streams'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Zero-Hardware Stream Connectors</span>
          </button>
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'blueprint'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>ML Architecture Blueprint</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">

          {/* TAB 1: CUSTOM .PT MODEL WEIGHT LOADER */}
          {activeTab === 'models' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-xs flex items-start gap-3">
                <FileCode className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Universal Ultralytics / PyTorch Model Ingestion
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    You can dynamically specify any absolute path to a <code className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded font-mono text-blue-600 dark:text-blue-400">.pt</code> file (e.g., <code className="font-mono">C:\models\best.pt</code>) or place weights into <code className="font-mono text-blue-600 dark:text-blue-400 font-semibold">backend/app/weights/</code>. RoadSaarthi will hot-reload the weights at runtime without server restart.
                  </p>
                </div>
              </div>

              <form onSubmit={handleLoadModel} className="space-y-4 bg-slate-50 dark:bg-slate-850/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Target AI/ML Pipeline
                    </label>
                    <select
                      value={modelKey}
                      onChange={(e) => {
                        setModelKey(e.target.value);
                        if (e.target.value === 'pothole_yolo') setModelPath('backend/app/weights/yolov8x_road_defect.pt');
                        else if (e.target.value === 'anpr_yolo') setModelPath('backend/app/weights/anpr_india.pt');
                        else if (e.target.value === 'depth_3d') setModelPath('backend/app/weights/depth_anything_v2_small.pt');
                        else if (e.target.value === 'acoustic_imu') setModelPath('backend/app/weights/resnet_acoustic_imu.pt');
                      }}
                      className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pothole_yolo">YOLOv8x-RoadDefect (Potholes, Cracks, Manholes)</option>
                      <option value="anpr_yolo">YOLOv8-ANPR + LPRNet (Indian High-Speed Plates)</option>
                      <option value="depth_3d">Depth-Anything-V2 (Metric Disparity &amp; 3D Volume)</option>
                      <option value="acoustic_imu">ResNet-1D-Acoustic (Submerged Cavities &amp; Axle Drops)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Model Weight File Path (.pt / .onnx / .engine)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={modelPath}
                        onChange={(e) => setModelPath(e.target.value)}
                        placeholder="C:\path\to\your_custom_model.pt"
                        className="w-full text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-3 pr-9 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <FolderOpen className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Quick presets:</span>
                    <button
                      type="button"
                      onClick={() => setModelPath('backend/app/weights/yolov8x_road_defect.pt')}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
                    >
                      Default YOLOv8x
                    </button>
                    <button
                      type="button"
                      onClick={() => setModelPath('C:/models/road_defect_fine_tuned.pt')}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 font-mono"
                    >
                      Fine-Tuned .pt
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isModelLoading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isModelLoading ? 'animate-spin' : ''}`} />
                    <span>{isModelLoading ? 'Loading Weights...' : 'Load & Hot-Reload Weights'}</span>
                  </button>
                </div>

                {modelFeedback && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{modelFeedback}</span>
                  </div>
                )}
              </form>

              {/* Active Model Registry Status Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Active Model Weight Pipelines ({modelStatus?.total_models || 4})
                  </h3>
                  <button
                    onClick={loadData}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Refresh Status</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {modelStatus?.models ? (
                    Object.entries(modelStatus.models).map(([key, info]: [string, any]) => (
                      <div
                        key={key}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between gap-2 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{info.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold uppercase">
                            {info.status || 'READY'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                          {info.path}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                          <span>{info.framework}</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{info.device}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-6 text-xs text-slate-500">
                      Loading model registry...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ZERO-HARDWARE STREAM CONNECTORS */}
          {activeTab === 'streams' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs flex items-start gap-3">
                <Radio className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Zero-Hardware Ingest Architecture (Indian Transit Standard)
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    No physical sensor kit needs to be bolted to the bus. RoadSaarthi natively connects to the bus’s already-installed <strong>Nirbhaya Security IP Cameras (via RTSP URL)</strong> and Government-mandated <strong>AIS-140 GPS &amp; 3-Axis IMU (via MQTT / HTTP M2M endpoint)</strong>.
                  </p>
                </div>
              </div>

              <form onSubmit={handleConfigureStream} className="space-y-4 bg-slate-50 dark:bg-slate-850/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Bus Identifier / Node Code
                    </label>
                    <input
                      type="text"
                      value={busId}
                      onChange={(e) => setBusId(e.target.value)}
                      placeholder="BUS-TN01-1042"
                      className="w-full text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Stream Protocol &amp; Ingestion Mode
                    </label>
                    <select
                      value={streamType}
                      onChange={(e) => setStreamType(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="RTSP_IP_CAMERA">RTSP Live Stream (Nirbhaya CCTV / IP Cam)</option>
                      <option value="DEPOT_WIFI_OFFLOAD">Depot Wi-Fi Batch Offload (M3U8 / HLS)</option>
                      <option value="AIS140_TELEMATICS_ONLY">AIS-140 M2M Telematics (GPS + IMU Shock only)</option>
                      <option value="HTTP_DASHCAM_FEED">Direct Mobile HTTP Dashcam Feed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Live Video Feed URL (RTSP / HTTP / HLS)
                  </label>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="rtsp://mtc-fleet.chennai.gov.in:554/bus1042/windshield"
                    className="w-full text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      AIS-140 Telematics Broker URL (MQTT / Webhook)
                    </label>
                    <input
                      type="text"
                      value={ais140Url}
                      onChange={(e) => setAis140Url(e.target.value)}
                      placeholder="mqtt://ais140.transport.tn.gov.in:1883/MTC-118A"
                      className="w-full text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Inference Frame Rate
                    </label>
                    <select
                      value={samplingFps}
                      onChange={(e) => setSamplingFps(Number(e.target.value))}
                      className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={30}>30 FPS (Full Real-Time)</option>
                      <option value={15}>15 FPS (Balanced Compute)</option>
                      <option value={5}>5 FPS (Low Bandwidth LTE)</option>
                      <option value={1}>1 FPS (Keyframe Survey)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isStreamLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isStreamLoading ? 'Connecting Stream...' : 'Connect Live Stream Connector'}</span>
                  </button>
                </div>

                {streamFeedback && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{streamFeedback}</span>
                  </div>
                )}
              </form>

              {/* Active Stream Connectors List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Active Bus Stream Connectors ({activeStreams.length})
                </h3>

                <div className="space-y-2">
                  {activeStreams.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">{s.bus_id}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono">
                              {s.stream_type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-lg mt-0.5">
                            {s.rtsp_url}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono text-slate-600 dark:text-slate-400 shrink-0">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {s.current_fps} FPS
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {s.latency_ms}ms latency
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMPLETE ML ARCHITECTURE BLUEPRINT */}
          {activeTab === 'blueprint' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 text-xs space-y-2">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>RoadSaarthi Zero-Hardware ML Architecture</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  RoadSaarthi can run completely in real-time across 4 specialized AI pipelines without requiring any physical sensor modifications to existing public transit fleets.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Model 1 */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">1. YOLOv8x-RoadDefect</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200">Vision</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Detects Indian road distresses (D40 Potholes, D20 Alligator Cracks, D10 Transverse Cracks, Open Manholes, Faded Zebra Crossings).
                  </p>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    Input: 1080p Windshield RGB &bull; FPS: 30 &bull; Weight: <code className="text-blue-600 font-bold">yolov8x_road_defect.pt</code>
                  </div>
                </div>

                {/* Model 2 */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">2. YOLOv8-ANPR + LPRNet</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200">Traffic &amp; MVA</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Performs high-speed license plate recognition on hit-and-run violators, zebra crossing encroachers, and bus-lane blockers.
                  </p>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    Input: HSRP Plates &bull; Target: E-Challan auto-issuance &bull; Weight: <code className="text-blue-600 font-bold">anpr_india.pt</code>
                  </div>
                </div>

                {/* Model 3 */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">3. Depth-Anything-V2</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200">3D Geometry</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Transforms monocular 2D dashcam frames into dense metric depth point clouds to calculate exact pothole cavity depth (cm) and asphalt volume (liters).
                  </p>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    Input: Single RGB Frame &bull; Output: 3D Pointcloud &bull; Weight: <code className="text-blue-600 font-bold">depth_anything_v2.pt</code>
                  </div>
                </div>

                {/* Model 4 */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">4. ResNet-1D-Acoustic</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200">Acoustic/IMU</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Classifies tire hydroplaning shockwaves and vertical axle drops to detect invisible submerged potholes beneath standing floodwater.
                  </p>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    Input: AIS-140 IMU + Audio FFT &bull; Weight: <code className="text-blue-600 font-bold">resnet_acoustic_imu.pt</code>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono">
            <Database className="w-3.5 h-3.5" />
            <span>Weights Dir: <span className="text-slate-800 dark:text-slate-200 font-semibold">backend/app/weights/</span></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
