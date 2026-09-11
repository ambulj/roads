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
      setRtspUrl(`rtsp://mtc-fleet.chennai.gov.in:554/bus${num}/ch{channel}/main`);
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

    const payload: FleetNodeCreatePayload = {
      id: cleanBusId,
      route_name: routeName.trim() || `${corridor.name} Active Patrol`,
      route_code: routeCode.trim() || corridor.routeCode,
      vehicle_type: vehicleType,
      npu_hardware: npuHardware,
      camera_model: cameraModel,
      dvr_channels: dvrChannels,
      dvr_ip: dvrIp.trim() || '192.168.1.100',
      rtsp_url: rtspUrl.trim() || undefined,
      edge_fps: Number(edgeFps) || 30.0,
      is_online: true,
      last_lat: corridor.lat + (Math.random() - 0.5) * 0.005,
      last_lng: corridor.lng + (Math.random() - 0.5) * 0.005,
      corridor: corridor.name
    };

    setIsSubmitting(true);
    try {
      const res = await api.createFleetNode(payload);
      if (res.success && res.node) {
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
                  MULTI-CHANNEL MDVR
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Commission a public transit bus with Mobile DVR cameras & AIS-140 edge telematics
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

          {/* Vehicle & Edge AI Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Vehicle Transit Class
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                {VEHICLE_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Edge NPU Hardware
              </label>
              <select
                value={npuHardware}
                onChange={(e) => setNpuHardware(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                {NPU_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile DVR & Channel Multiplexing Box */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Mobile DVR (MDVR) Multi-Camera Rig
                </span>
              </div>
              <span className="text-[11px] text-cyan-400 font-medium">
                {dvrChannels} Cameras Integrated
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  DVR Hardware Model
                </label>
                <select
                  value={cameraModel}
                  onChange={(e) => setCameraModel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                >
                  {DVR_MODELS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Active Channels
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {[1, 2, 4, 8].map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setDvrChannels(ch)}
                      className={`py-1 rounded text-xs font-bold transition-all ${
                        dvrChannels === ch
                          ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {ch} CH
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  MDVR Local IP Address
                </label>
                <input
                  type="text"
                  placeholder="192.168.10.88"
                  value={dvrIp}
                  onChange={(e) => setDvrIp(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 font-mono focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-400">
                  RTSP Stream Template (Optional)
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  Use &#123;channel&#125; placeholder for multi-camera multiplexing
                </span>
              </div>
              <input
                type="text"
                placeholder="rtsp://mtc-fleet.chennai.gov.in:554/bus8921/ch{channel}/main"
                value={rtspUrl}
                onChange={(e) => setRtspUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 font-mono focus:outline-none"
              />
            </div>

            {/* Camera Channel Preview Tags */}
            <div className="pt-1 flex flex-wrap gap-1.5">
              {[
                { ch: 1, label: 'CH1: Windshield Road' },
                { ch: 2, label: 'CH2: Rear Tailgate' },
                { ch: 3, label: 'CH3: Curbside / Lane' },
                { ch: 4, label: 'CH4: Driver Cabin DMS' }
              ].slice(0, dvrChannels).map((c) => (
                <span
                  key={c.ch}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-cyan-500/30 text-[10px] text-cyan-300 font-mono"
                >
                  ● {c.label}
                </span>
              ))}
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>AIS-140 eSIM & SQLite Store-and-Forward Active</span>
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
                    <span>Registering Node...</span>
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
