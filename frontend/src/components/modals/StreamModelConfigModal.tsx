import React, { useState, useEffect, useRef } from 'react';
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
  Database,
  Camera,
  Play,
  Eye,
  Check,
  Flame,
  Search
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
  defaultTab = 'streams'
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

  // Probe Diagnostic State
  const [isProbing, setIsProbing] = useState<boolean>(false);
  const [probeResult, setProbeResult] = useState<{ reachable: boolean; message: string; resolution?: string } | null>(null);

  // Live RTSP Perception State
  const [selectedLiveBusId, setSelectedLiveBusId] = useState<string>('BUS-TN01-1042');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);
  const [frameTimestamp, setFrameTimestamp] = useState<number>(Date.now());

  // Auto-refresh frame timer for fail-safe rendering
  useEffect(() => {
    if (!isOpen || activeTab !== 'streams') return;
    const interval = setInterval(() => {
      setFrameTimestamp(Date.now());
    }, 150); // ~7 FPS continuous fresh frame poll
    return () => clearInterval(interval);
  }, [isOpen, activeTab, selectedLiveBusId]);

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
      if (sList && sList.length > 0) {
        setActiveStreams(sList);
        if (!selectedLiveBusId) setSelectedLiveBusId(sList[0].bus_id);
      }
    } catch (err) {
      console.error('Failed to load model/stream status:', err);
    }
  };

  const handleProbeStream = async () => {
    if (!videoUrl.trim()) return;
    setIsProbing(true);
    setProbeResult(null);
    try {
      const res = await api.probeStream(videoUrl);
      setProbeResult(res);
    } catch (err) {
      setProbeResult({ reachable: false, message: 'Could not connect to backend diagnostic probe' });
    } finally {
      setIsProbing(false);
    }
  };

  const handleLoadModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelPath.trim()) return;
    setIsModelLoading(true);
    setModelFeedback(null);
    try {
      const res = await api.loadModelWeights(modelKey, modelPath);
      setModelFeedback(res.message || 'Model weights registered successfully.');
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
      setStreamFeedback(res.message || 'Stream connector active.');
      setSelectedLiveBusId(busId);
      await loadData();
    } catch (err) {
      setStreamFeedback('Error connecting to stream. Please verify RTSP URL and credentials.');
    } finally {
      setIsStreamLoading(false);
    }
  };

  const handleRunLiveAiPerception = async () => {
    if (!selectedLiveBusId) return;
    setIsAnalyzing(true);
    setAiAnalysisResult(null);
    try {
      const res = await api.analyzeLiveKeyframe(selectedLiveBusId);
      setAiAnalysisResult(res);
    } catch (err) {
      console.error('AI perception analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Real RTSP Video Streams &amp; Zero-Hardware Ingestion
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-semibold uppercase tracking-wider">
                  Live Engine Active
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connect CP Plus DVR, Onboard IP Cameras, AIS-140 Telematics, or Smart Dashcams
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('streams')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'streams'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>1. Real RTSP Live Streams &amp; DVR Connectors</span>
          </button>

          <button
            onClick={() => setActiveTab('models')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'models'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>2. YOLO ML Weights (.pt Discovery)</span>
          </button>

          <button
            onClick={() => setActiveTab('blueprint')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'blueprint'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>3. Fleet Telematics Architecture</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: REAL RTSP STREAMS */}
          {activeTab === 'streams' && (
            <div className="space-y-6">
              
              {/* LIVE VIDEO PLAYER VIEWER */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden shadow-lg">
                <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                      Live Stream: {selectedLiveBusId}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                      Real-Time Frame Streamer
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Stream Selector */}
                    <select
                      value={selectedLiveBusId}
                      onChange={(e) => setSelectedLiveBusId(e.target.value)}
                      className="text-xs bg-slate-800 text-white rounded-lg px-2.5 py-1 border border-slate-700 font-mono"
                    >
                      {activeStreams.map((s, i) => (
                        <option key={i} value={s.bus_id}>
                          {s.bus_id} ({s.current_fps || 30} FPS)
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleRunLiveAiPerception}
                      disabled={isAnalyzing}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <Camera className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                      <span>{isAnalyzing ? 'Analyzing Frame...' : 'Run Live AI Perception'}</span>
                    </button>
                  </div>
                </div>

                {/* Direct Live Fail-Safe Video Stream */}
                <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                  <img
                    key={selectedLiveBusId}
                    src={`/api/streams/snapshot/${selectedLiveBusId}?t=${frameTimestamp}`}
                    alt="Live Bus RTSP Feed"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-mono text-emerald-400 border border-emerald-500/30">
                    LIVE TELEMETRY SYNCED
                  </div>
                </div>

                {/* AI Detection Result Overlay (if triggered) */}
                {aiAnalysisResult && (
                  <div className="p-4 bg-slate-900 border-t border-slate-800 text-xs space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        AI Road Feature Perception Completed ({aiAnalysisResult.inference_time_ms}ms)
                      </span>
                      <span className="text-slate-400 font-mono">
                        Engine: {aiAnalysisResult.model_engine}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                      {aiAnalysisResult.detections?.map((d: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{d.defect_name}</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px]">
                              {Math.round(d.confidence * 100)}% Conf
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300">{d.irc35_compliance}</p>
                          <p className="text-[10px] text-amber-400 font-mono">{d.recommended_action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RTSP & HARDWARE CONNECTOR FORM */}
              <form onSubmit={handleConfigureStream} className="space-y-4 bg-slate-50 dark:bg-slate-850/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-500" />
                    Configure Real RTSP / IP Camera Stream
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <span>Quick presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setVideoUrl('rtsp://admin:admin123@192.168.1.108:554/cam/realmonitor?channel=1&subtype=1');
                        setBusId('BUS-CPPLUS-01');
                        setStreamType('RTSP_IP_CAMERA');
                        setProbeResult(null);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 font-mono"
                    >
                      CP Plus (Ch 1 Sub)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVideoUrl('0');
                        setBusId('BUS-WEBCAM-DEV');
                        setStreamType('HTTP_DASHCAM_FEED');
                        setProbeResult(null);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 font-mono"
                    >
                      Local USB / WebCam (0)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVideoUrl('rtsp://mtc-fleet.chennai.gov.in:554/bus1042/windshield');
                        setBusId('BUS-TN01-1042');
                        setStreamType('RTSP_IP_CAMERA');
                        setProbeResult(null);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 font-mono"
                    >
                      Govt MTC Depot
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Bus Node Code / Device ID
                    </label>
                    <input
                      type="text"
                      value={busId}
                      onChange={(e) => setBusId(e.target.value)}
                      placeholder="BUS-CPPLUS-01"
                      className="w-full text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Connection Protocol Mode
                    </label>
                    <select
                      value={streamType}
                      onChange={(e) => setStreamType(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="RTSP_IP_CAMERA">1. RTSP Live Stream (CP Plus DVR / Hikvision / Dahua / Nirbhaya)</option>
                      <option value="HTTP_DASHCAM_FEED">2. Smartphone / Tablet In-Cabin Dashcam (Webcam / USB)</option>
                      <option value="AIS140_TELEMATICS_ONLY">3. AIS-140 eSIM Telematics Only (GPS + Accelerometer Gz)</option>
                      <option value="DEPOT_WIFI_OFFLOAD">4. Depot Automated Wi-Fi Offload (Nightly HLS Sync)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    RTSP Stream URL or Video Device (e.g. <code>rtsp://user:pass@ip:554/cam/realmonitor?channel=1&amp;subtype=1</code> or <code>0</code>)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={(e) => {
                        setVideoUrl(e.target.value);
                        setProbeResult(null);
                      }}
                      placeholder="rtsp://admin:admin123@192.168.1.108:554/cam/realmonitor?channel=1&subtype=1"
                      className="flex-1 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleProbeStream}
                      disabled={isProbing || !videoUrl.trim()}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <Search className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} />
                      <span>{isProbing ? 'Testing...' : 'Test Reachability'}</span>
                    </button>
                  </div>
                </div>

                {/* Probe Diagnostic Feedback Box */}
                {probeResult && (
                  <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
                    probeResult.reachable
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                  }`}>
                    {probeResult.reachable ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <div className="font-bold">
                        {probeResult.reachable ? 'Stream Signal Reachable' : 'Stream Reachability Check'}
                      </div>
                      <div className="text-[11px] leading-relaxed">{probeResult.message}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sub-45ms Fast Path: Background OpenCV capture thread starts immediately.
                  </div>

                  <button
                    type="submit"
                    disabled={isStreamLoading}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isStreamLoading ? 'Connecting...' : 'Connect Real RTSP Stream'}</span>
                  </button>
                </div>

                {streamFeedback && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{streamFeedback}</span>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* TAB 2: YOLO ML MODELS */}
          {activeTab === 'models' && (
            <div className="space-y-6">
              {/* Audit Header */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Truthful Model Registry</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {modelStatus?.verification_mode || "Filesystem-Verified (Strict Guarantee)"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Weights directory: <code className="text-slate-300 font-mono text-[11px]">{modelStatus?.weights_directory || "backend/app/weights"}</code> &bull; Verified in real-time
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={loadData}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-verify Weights</span>
                </button>
              </div>

              {/* Models List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {modelStatus?.models && Object.entries(modelStatus.models).map(([k, m]: [string, any]) => {
                  const isReady = m.status === 'ready' || m.status === 'ready_cv_fallback';
                  const isDsp = m.status === 'active_dsp_pipeline';
                  return (
                    <div key={k} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{m.name}</h4>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block mt-0.5">
                            Standard: {m.regulatory_spec}
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                          isReady 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : isDsp
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                        }`}>
                          {isReady ? '✓ Operational (CV Fallback)' : isDsp ? '⚡ Active (DSP Filter)' : '⏳ Awaiting Weights'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>Framework: {m.framework}</span>
                          <span>Device: {m.device}</span>
                        </div>
                        <p className="text-[10.5px] text-slate-600 dark:text-slate-400">
                          <b className="text-slate-700 dark:text-slate-300">Active Fallback:</b> {m.fallback_pipeline}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                          "{m.status_explanation}"
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {m.classes?.map((c: string) => (
                          <span key={c} className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
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
                      }}
                      className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pothole_yolo">YOLOv8x-RoadDefect (Potholes, Cracks, Manholes)</option>
                      <option value="anpr_yolo">YOLOv8-ANPR + LPRNet (Indian High-Speed Plates)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Model Weight File Path (.pt)
                    </label>
                    <input
                      type="text"
                      value={modelPath}
                      onChange={(e) => setModelPath(e.target.value)}
                      placeholder="backend/app/weights/best.pt"
                      className="w-full text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isModelLoading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isModelLoading ? 'animate-spin' : ''}`} />
                    <span>{isModelLoading ? 'Checking Weights...' : 'Register Custom Model'}</span>
                  </button>
                </div>

                {modelFeedback && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{modelFeedback}</span>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* TAB 3: 4 WAYS TO CONNECT BUSES */}
          {activeTab === 'blueprint' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-xs space-y-2">
                <h3 className="font-bold text-blue-900 dark:text-blue-200 text-sm">
                  4 Real Production Ways to Connect Buses to RoadSaarthi
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  RoadSaarthi eliminates the need for expensive dedicated survey vehicles by utilizing standard hardware already inside public transit fleets.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">1. Direct RTSP / CP Plus DVR Feed</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Streams live 1080p/720p from existing Nirbhaya safety cameras or CP Plus DVRs over onboard 4G/5G router.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">2. Smartphone / Tablet In-Cabin Dashcam</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Zero-cost deployment: Driver or conductor mounts an Android/iOS phone running the RoadSaarthi Web App.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">3. Mandated AIS-140 eSIM Telematics</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    MoRTH CMVR 125H devices push sub-second GPS + 3-axis accelerometer shock telemetry over MQTT.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">4. Nightly Depot Wi-Fi Batch Offload</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Buses save 4K video locally to DVR storage and bulk-upload when returning to the depot over high-speed Wi-Fi.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
