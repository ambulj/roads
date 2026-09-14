import React, { useState } from 'react';
import {
  X,
  Bus,
  Cpu,
  Video,
  Radio,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
  HardDrive
} from 'lucide-react';
import { api } from '../../services/api';
import { FleetNode, FleetNodeCreatePayload } from '../../types';

interface AddBusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBus: FleetNode) => void;
}

const VEHICLE_TYPES = [
  'MTC Transit Bus (Electric Low-Floor)',
  'MTC Standard BS-VI Diesel City Bus',
  'MTC Volvo 8400 Low-Floor AC',
  'CMRL Metro Feeder Mini-Bus',
  'Interstate High-Capacity Transit'
];

const NPU_OPTIONS = [
  'Rockchip RK3588 NPU (6 TOPS INT8)',
  'Hailo-8 M.2 Edge AI Accelerator (26 TOPS)',
  'NVIDIA Jetson Orin Nano (40 TOPS)',
  'Zero-Hardware Nirbhaya Telematics Hub'
];

const DVR_MODELS = [
  'Hikvision DS-MP7608HN 8-CH Mobile NVR',
  'Dahua MXVR4104-GFW 4-CH Mobile DVR',
  'CP PLUS CP-VNR-2104-E1 4-CH MDVR',
  'Standard Zero-Hardware ONVIF IP Bridge'
];

const CORRIDOR_PRESETS = [
  { name: 'GST Road Corridor (NH-32)', lat: 12.9516, lng: 80.1462, routeCode: 'MTC-118A' },
  { name: 'OMR IT Expressway Corridor (SH-49)', lat: 12.9890, lng: 80.2480, routeCode: 'MTC-570X' },
  { name: 'Anna Salai Central Arterial (NH-45)', lat: 13.0602, lng: 80.2520, routeCode: 'MTC-21G' },
  { name: 'Poonamallee High Road Corridor (NH-48)', lat: 13.0827, lng: 80.2135, routeCode: 'MTC-54' },
  { name: 'Inner Ring Road / 100 Feet Rd', lat: 13.0067, lng: 80.2030, routeCode: 'MTC-70V' }
];

export const AddBusModal: React.FC<AddBusModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [busId, setBusId] = useState('');
  const [routeName, setRouteName] = useState('');
  const [routeCode, setRouteCode] = useState('');
  const [vehicleType, setVehicleType] = useState(VEHICLE_TYPES[0]);
  const [npuHardware, setNpuHardware] = useState(NPU_OPTIONS[0]);
  const [cameraModel, setCameraModel] = useState(DVR_MODELS[0]);
  const [dvrChannels, setDvrChannels] = useState<number>(4);
  const [dvrIp, setDvrIp] = useState('192.168.10.88');
  const [rtspUrl, setRtspUrl] = useState('');
  const [selectedCorridorIdx, setSelectedCorridorIdx] = useState(0);
  const [edgeFps, setEdgeFps] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Stream & Footage State
  const [streamProtocol, setStreamProtocol] = useState<'SRT' | 'RTSP' | 'WEBCAM' | 'UPLOAD'>('SRT');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Sensor Telematics Insertion State
  const [initialImuGz, setInitialImuGz] = useState<number>(1.25);
  const [initialSpeedKmh, setInitialSpeedKmh] = useState<number>(42.5);
  const [ais140MqttUrl, setAis140MqttUrl] = useState<string>('mqtt://ais140.transport.tn.gov.in:1883/MTC');
  const [injectInitialSensorPacket, setInjectInitialSensorPacket] = useState<boolean>(true);

  // Diagnostic Probe State
  const [isProbing, setIsProbing] = useState<boolean>(false);
  const [probeResult, setProbeResult] = useState<{ status: 'success' | 'warning' | 'error'; title: string; message: string } | null>(null);

  if (!isOpen) return null;

  const handleCorridorChange = (idx: number) => {
    setSelectedCorridorIdx(idx);
    const c = CORRIDOR_PRESETS[idx];
    if (c) {
      if (!routeCode) setRouteCode(c.routeCode);
      if (!routeName) setRouteName(`${c.name} Express Patrol`);
    }
  };

  const handleGenerateRandomId = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    const rto = ['TN01', 'TN02', 'TN09', 'TN14', 'TN22'][Math.floor(Math.random() * 5)];
    const generated = `BUS-${rto}-${num}`;
    setBusId(generated);
    if (!rtspUrl) {
      if (streamProtocol === 'SRT') {
        setRtspUrl(`srt://0.0.0.0:${9000 + Math.floor(Math.random() * 100)}?mode=listener`);
      } else {
        setRtspUrl(`rtsp://mtc-fleet.chennai.gov.in:554/bus${num}/ch{channel}/main`);
      }
    }
  };

  const handleProbeEndpoints = async () => {
    setProbeResult(null);
    let targetUrl = rtspUrl.trim();
    if (!targetUrl) {
      if (streamProtocol === 'SRT') targetUrl = 'srt://0.0.0.0:9000?mode=listener';
      else if (streamProtocol === 'WEBCAM') targetUrl = '0';
    }

    // 1. SRT Syntax Check
    if (streamProtocol === 'SRT' && targetUrl && !targetUrl.startsWith('srt://')) {
      setProbeResult({
        status: 'error',
        title: 'Invalid SRT Stream Syntax',
        message: 'SRT stream URL must start with srt:// (e.g. srt://0.0.0.0:9000?mode=listener or srt://10.8.0.42:9000?mode=caller).'
      });
      return;
    }

    // 2. RTSP Syntax Check
    if (streamProtocol === 'RTSP' && targetUrl && !targetUrl.startsWith('rtsp://')) {
      setProbeResult({
        status: 'error',
        title: 'Invalid RTSP Stream Syntax',
        message: 'RTSP stream URL must start with rtsp:// (e.g. rtsp://192.168.1.100:554/ch1/main).'
      });
      return;
    }

    // 3. MQTT Syntax Check
    if (ais140MqttUrl.trim() && !ais140MqttUrl.startsWith('mqtt://') && !ais140MqttUrl.startsWith('mqtts://')) {
      setProbeResult({
        status: 'error',
        title: 'Invalid AIS-140 MQTT Syntax',
        message: 'MQTT Broker endpoint must start with mqtt:// or mqtts:// (e.g. mqtt://ais140.transport.tn.gov.in:1883/MTC).'
      });
      return;
    }

    if (streamProtocol === 'UPLOAD' || !targetUrl) {
      setProbeResult({
        status: 'success',
        title: 'Validation Successful',
        message: 'Footage Media File / Standby Mode ready for commissioning.'
      });
      return;
    }

    setIsProbing(true);
    try {
      const res = await api.probeStream(targetUrl);
      if (res.reachable) {
        setProbeResult({
          status: 'success',
          title: 'Endpoint Signal Verified',
          message: res.message || 'Stream socket connected successfully.'
        });
      } else {
        setProbeResult({
          status: 'warning',
          title: 'Endpoint Currently Offline',
          message: res.message || 'Stream signal unreachable right now. The bus node will commission in Store-and-Forward Standby Mode without failing.'
        });
      }
    } catch {
      setProbeResult({
        status: 'warning',
        title: 'Offline Store-and-Forward Standby',
        message: 'Network connection to stream URL timed out. Bus node will be registered safely in Standby Mode.'
      });
    } finally {
      setIsProbing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanBusId = busId.trim().toUpperCase();
    if (!cleanBusId) {
      setErrorMsg('Bus Registration ID is required (e.g. BUS-TN01-5082)');
      return;
    }

    const corridor = CORRIDOR_PRESETS[selectedCorridorIdx];

    let finalRtsp = rtspUrl.trim();
    if (!finalRtsp) {
      if (streamProtocol === 'SRT') {
        finalRtsp = `srt://0.0.0.0:9000?mode=listener`;
      } else if (streamProtocol === 'WEBCAM') {
        finalRtsp = '0';
      }
    }

    // Pre-submit validation
    if (streamProtocol === 'SRT' && finalRtsp && !finalRtsp.startsWith('srt://')) {
      setErrorMsg('SRT stream URL format invalid. Must start with srt:// (e.g. srt://0.0.0.0:9000?mode=listener)');
      return;
    }
    if (streamProtocol === 'RTSP' && finalRtsp && !finalRtsp.startsWith('rtsp://')) {
      setErrorMsg('RTSP stream URL format invalid. Must start with rtsp:// (e.g. rtsp://192.168.1.100:554/ch1/main)');
      return;
    }
    if (ais140MqttUrl.trim() && !ais140MqttUrl.startsWith('mqtt://') && !ais140MqttUrl.startsWith('mqtts://')) {
      setErrorMsg('MQTT endpoint format invalid. Must start with mqtt:// or mqtts://');
      return;
    }

    const payload: FleetNodeCreatePayload = {
      id: cleanBusId,
      route_name: routeName.trim() || `${corridor.name} Active Patrol`,
      route_code: routeCode.trim() || corridor.routeCode,
      vehicle_type: vehicleType,
      npu_hardware: npuHardware,
      camera_model: streamProtocol === 'SRT' ? 'SRT 4G/5G Cellular Stream' : cameraModel,
      dvr_channels: dvrChannels,
      dvr_ip: dvrIp.trim() || '192.168.1.100',
      rtsp_url: finalRtsp || undefined,
      edge_fps: Number(edgeFps) || 30.0,
      is_online: true,
      last_lat: corridor.lat + (Math.random() - 0.5) * 0.005,
      last_lng: corridor.lng + (Math.random() - 0.5) * 0.005,
      corridor: corridor.name
    };

    setIsSubmitting(true);
    try {
      // 1. Commission Fleet Node in Database
      const res = await api.createFleetNode(payload);
      if (res.success && res.node) {
        
        // 2. Insert Footage Media File (if uploaded)
        if (uploadedFile) {
          const formData = new FormData();
          formData.append('file', uploadedFile);
          formData.append('bus_id', cleanBusId);
          formData.append('channel', '1');
          formData.append('auto_ingest', 'true');
          await api.uploadStreamMedia(formData).catch(() => {});
        }

        // 3. Inject Initial Sensor Packet (if checked)
        if (injectInitialSensorPacket) {
          await api.ingestTelemetry({
            bus_id: cleanBusId,
            defect_type: 'D40',
            confidence: 0.96,
            speed_kmh: Number(initialSpeedKmh) || 42.5,
            vertical_g_force: Number(initialImuGz) || 1.25,
            lat: corridor.lat,
            lng: corridor.lng,
            camera_position: 'FRONT_WINDSHIELD',
            channel: 1
          }).catch(() => {});
        }

        onSuccess(res.node);
        onClose();
      } else {
        setErrorMsg(res.message || 'Failed to register bus node.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving bus node.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-w-2xl w-full my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                Register Transit Bus Node
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  FOOTAGE &amp; TELEMETRY READY
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Commission bus node with SRT/RTSP video footage stream and AIS-140 6-axis sensor insertion
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Bus ID & Corridor Preset Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Bus Registration ID <span className="text-emerald-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateRandomId}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono hover:underline"
                >
                  Auto-Generate
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. BUS-TN01-5082"
                value={busId}
                onChange={(e) => setBusId(e.target.value)}
                required
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-mono focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Corridor Deployment
              </label>
              <select
                value={selectedCorridorIdx}
                onChange={(e) => handleCorridorChange(Number(e.target.value))}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
              >
                {CORRIDOR_PRESETS.map((c, i) => (
                  <option key={i} value={i}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Route Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Route Patrol Name
              </label>
              <input
                type="text"
                placeholder="e.g. OMR IT Expressway Arterial"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Route Code
              </label>
              <input
                type="text"
                placeholder="e.g. 570X"
                value={routeCode}
                onChange={(e) => setRouteCode(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 font-mono focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* ── SECTION 1: FOOTAGE STREAM & FILE INSERTION ──────────────────── */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  1. Video Footage Stream &amp; File Insertion
                </span>
              </div>
              <span className="text-[11px] text-cyan-400 font-medium font-mono">
                {streamProtocol} MODE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Video Transmission Protocol
                </label>
                <select
                  value={streamProtocol}
                  onChange={(e: any) => {
                    const p = e.target.value;
                    setStreamProtocol(p);
                    if (p === 'SRT') setRtspUrl('srt://0.0.0.0:9000?mode=listener');
                    else if (p === 'WEBCAM') setRtspUrl('0');
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none font-medium"
                >
                  <option value="SRT">⚡ 1. SRT 4G/5G Cellular Stream (Reliable ARQ)</option>
                  <option value="RTSP">2. Direct RTSP Stream (CP Plus / IP Camera)</option>
                  <option value="WEBCAM">3. Local USB Webcam / Dashcam (0)</option>
                  <option value="UPLOAD">4. Upload Recorded MP4/JPG Video File</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-400">
                    Stream Endpoint / Device Path
                  </label>
                  <button
                    type="button"
                    onClick={handleProbeEndpoints}
                    disabled={isProbing}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono font-bold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <span>{isProbing ? 'Testing Signal...' : '⚡ Test Signal Reachability'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder={streamProtocol === 'SRT' ? 'srt://0.0.0.0:9000?mode=listener' : 'rtsp://...'}
                  value={rtspUrl}
                  onChange={(e) => {
                    setRtspUrl(e.target.value);
                    setProbeResult(null);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-600 font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Diagnostic Reachability Feedback Box */}
            {probeResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                probeResult.status === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : probeResult.status === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                {probeResult.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : probeResult.status === 'warning' ? (
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <div className="font-bold text-xs">{probeResult.title}</div>
                  <div className="text-[11px] leading-relaxed opacity-90">{probeResult.message}</div>
                </div>
              </div>
            )}

            {streamProtocol === 'UPLOAD' && (
              <div className="p-3 bg-slate-900/90 border border-dashed border-cyan-500/40 rounded-xl space-y-1">
                <label className="text-xs font-bold text-cyan-300 block">
                  Select Footage File (MP4, MOV, WEBM or JPG)
                </label>
                <input
                  type="file"
                  accept="video/*,image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setUploadedFile(f);
                  }}
                  className="text-xs text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/30"
                />
                <p className="text-[10px] text-slate-400">
                  The system will run real-time YOLOv8 AI hazard perception frame-by-frame on your uploaded video file.
                </p>
              </div>
            )}
          </div>

          {/* ── SECTION 2: SENSOR & TELEMETRY INSERTION ───────────────────── */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  2. Sensor &amp; Telematics Calibration (AIS-140 &amp; IMU)
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 font-medium font-mono">
                5Hz TELEMETRY
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Initial IMU G-Force Shock ({initialImuGz}g)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="3.0"
                  value={initialImuGz}
                  onChange={(e) => setInitialImuGz(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Initial Transit Speed
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={initialSpeedKmh}
                    onChange={(e) => setInitialSpeedKmh(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 font-mono">km/h</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  AIS-140 MQTT Endpoint
                </label>
                <input
                  type="text"
                  value={ais140MqttUrl}
                  onChange={(e) => setAis140MqttUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="inject-sensor-cb"
                checked={injectInitialSensorPacket}
                onChange={(e) => setInjectInitialSensorPacket(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
              <label htmlFor="inject-sensor-cb" className="text-xs text-slate-300 cursor-pointer select-none">
                Inject Initial AIS-140 Telemetry Packet ({initialImuGz}g shock, {initialSpeedKmh} km/h) into Database on Commissioning
              </label>
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>AIS-140 eSIM Telematics &amp; SQLite Store-and-Forward Active</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Commissioning Node...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Commission Bus Node</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
