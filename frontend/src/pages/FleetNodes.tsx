import React, { useState, useEffect } from 'react';
import {
  Truck, Radio, Gauge, Camera, Cpu, Image as ImageIcon, SlidersVertical, Activity, CheckCircle2, Wifi,
  Plus, Trash2, AlertTriangle, Video, UploadCloud, Eye, Download, ShieldCheck, MapPin, Zap
} from 'lucide-react';
import { FleetNode } from '../types';
import { LiveCameraFeed } from '../components/fleet/LiveCameraFeed';
import { SensorDiagnosticsPanel } from '../components/fleet/SensorDiagnosticsPanel';
import { Card, Badge, Button } from '../components/ui';
import { api } from '../services/api';
import { AddBusModal } from '../components/modals/AddBusModal';
import { UploadFootageModal } from '../components/modals/UploadFootageModal';

interface FleetNodesProps {
  fleet: FleetNode[];
  onFleetChange?: React.Dispatch<React.SetStateAction<FleetNode[]>>;
}

export const FleetNodes: React.FC<FleetNodesProps> = ({ fleet, onFleetChange }) => {
  const [selectedBusId, setSelectedBusId] = useState<string>(fleet[0]?.id || 'BUS-TN01-1042');
  const [viewMode, setViewMode] = useState<'camera' | 'sensors'>('camera');
  const [capturedSnapshots, setCapturedSnapshots] = useState<Array<{ id: string; url: string; time: string; busId: string }>>([]);
  const [edgeStatus, setEdgeStatus] = useState<any>(null);
  const [isAddBusModalOpen, setIsAddBusModalOpen] = useState(false);
  const [isUploadFootageOpen, setIsUploadFootageOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeBus = fleet.find((b) => b.id === selectedBusId) || fleet[0];

  useEffect(() => {
    if (selectedBusId) {
      api.getEdgeBufferStatus(selectedBusId).then(setEdgeStatus).catch(() => {});
    }
  }, [selectedBusId]);

  const handleSnapshotCapture = (dataUrl: string) => {
    const newSnap = {
      id: `snap-${Date.now()}`,
      url: dataUrl,
      time: new Date().toLocaleTimeString(),
      busId: activeBus.id,
    };
    setCapturedSnapshots((prev) => [newSnap, ...prev.slice(0, 5)]);
  };

  const onlineCount = fleet.filter((b) => b.is_online).length;

  const handleDeleteBus = async (busId: string) => {
    setIsDeleting(true);
    try {
      await api.deleteFleetNode(busId);
      if (onFleetChange) {
        onFleetChange((prev) => prev.filter((b) => b.id !== busId));
      }
      setConfirmDeleteId(null);
      if (selectedBusId === busId) {
        const remaining = fleet.filter((b) => b.id !== busId);
        if (remaining.length > 0) {
          setSelectedBusId(remaining[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to decommission bus:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSuccessAdd = (newBus: FleetNode) => {
    if (onFleetChange) {
      onFleetChange((prev) => [newBus, ...prev.filter((b) => b.id !== newBus.id)]);
    }
    setSelectedBusId(newBus.id);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-4 max-w-[1750px] mx-auto w-full select-none">
      
      {/* 1. Sleek Fleet Executive Command Ribbon */}
      <Card className="p-3 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Active Bus Selector + Route Info */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>

            <select
              value={selectedBusId}
              onChange={(e) => setSelectedBusId(e.target.value)}
              className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-xs outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {fleet.map((bus) => (
                <option key={bus.id} value={bus.id}>
                  {bus.id} — {bus.speed_kmh} km/h ({bus.route_name.split('·')[0].trim()})
                </option>
              ))}
            </select>

            <Badge variant="success" size="sm" dot className="font-semibold">
              {onlineCount}/{fleet.length} Fleet Online
            </Badge>

            <span className="hidden sm:inline-block text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Route: <strong className="text-slate-700 dark:text-slate-200">{activeBus.route_name}</strong>
            </span>
          </div>

          {/* Right: Quick Operational Actions */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <button
              onClick={() => setIsUploadFootageOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
              title="Upload custom video or road inspection footage to stream and analyze with AI"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Video</span>
            </button>

            <button
              onClick={() => setIsAddBusModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
              title="Commission a new transit bus node with Mobile DVR"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Bus</span>
            </button>

            {activeBus && (
              <button
                onClick={() => setConfirmDeleteId(activeBus.id)}
                className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/80 transition-colors shrink-0 cursor-pointer"
                title={`Decommission bus ${activeBus.id}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* 2. Operational Mode Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit">
          <button
            onClick={() => setViewMode('camera')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'camera'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-rose-500" />
            <span>Live Video &amp; Telemetry Stream</span>
          </button>

          <button
            onClick={() => setViewMode('sensors')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'sensors'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>7-Sensor Diagnostic Fusion</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Edge Ingest: <b>{activeBus.id}</b> (5Hz Lock)</span>
        </div>
      </div>

      {/* 3. Main Stream Viewport / Sensors */}
      {viewMode === 'camera' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main Video Stream Player */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            <LiveCameraFeed
              bus={activeBus}
              onSnapshot={handleSnapshotCapture}
            />

            {/* Captured Evidence Filmstrip */}
            {capturedSnapshots.length > 0 && (
              <Card className="p-3 bg-slate-900 text-slate-100 border-slate-800">
                <div className="flex items-center justify-between mb-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Captured Forensic Snapshots ({capturedSnapshots.length})</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Auto-Watermarked with GPS &amp; Timestamp</span>
                </div>
                <div className="flex gap-2.5 overflow-x-auto custom-scrollbar pb-1">
                  {capturedSnapshots.map((snap) => (
                    <div key={snap.id} className="relative group shrink-0 w-32 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                      <img src={snap.url} alt="Snapshot evidence" className="w-full h-20 object-cover" />
                      <div className="p-1.5 text-[9.5px] font-mono text-slate-300 truncate bg-slate-900 flex items-center justify-between">
                        <span>{snap.time}</span>
                        <a
                          href={snap.url}
                          download={`Evidence_${snap.busId}_${snap.id}.jpg`}
                          className="text-cyan-400 hover:text-cyan-300 p-0.5"
                          title="Download Evidence Frame"
                        >
                          <Download className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right: Node Telemetry Metrics Cockpit */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <Card className="p-4 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                    <SlidersVertical className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Live Telemetry Dynamics</span>
                  </div>
                  <Badge variant="medium" size="sm" className="font-bold font-mono">
                    {activeBus.id}
                  </Badge>
                </div>

                <div className="space-y-3 mt-3 text-xs">
                  {/* Route & Corridor */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-slate-500 text-[11px] font-mono">Monitored Route</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right truncate max-w-[180px]">
                      {activeBus.route_name}
                    </span>
                  </div>

                  {/* IMU Accelerometer Jerk (G_z) */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between mb-1.5 text-[11px] font-mono">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span>Vertical Shock (G_z):</span>
                      </span>
                      <span className={`font-bold ${activeBus.imu_jerk_gz >= 1.30 ? 'text-rose-500' : activeBus.imu_jerk_gz > 1.08 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {activeBus.imu_jerk_gz}g
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${activeBus.imu_jerk_gz >= 1.30 ? 'bg-rose-500' : activeBus.imu_jerk_gz > 1.08 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${Math.min(100, (activeBus.imu_jerk_gz / 2.0) * 100)}%` }} 
                      />
                    </div>
                  </div>

                  {/* Velocity */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between mb-1.5 text-[11px] font-mono">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-blue-500" />
                        <span>Transit Velocity:</span>
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        {activeBus.speed_kmh} km/h
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (activeBus.speed_kmh / 80) * 100)}%` }} />
                    </div>
                  </div>

                  {/* Edge Vision Rate */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between mb-1.5 text-[11px] font-mono">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Activity className="w-3 h-3 text-blue-500" />
                        <span>Inference Rate:</span>
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">
                        {activeBus.edge_fps || 28.4} FPS
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: '92%' }} />
                    </div>
                  </div>

                  {/* Edge Sync Status */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Sync Pipeline:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Wifi className="w-3 h-3" />
                      <span>{edgeStatus?.connectivity_mode || "Depot 5GHz WiFi"}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between font-mono">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span>{activeBus.lat.toFixed(4)}° N, {activeBus.lng.toFixed(4)}° E</span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">● 5Hz Locked</span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {viewMode === 'sensors' && (
        <SensorDiagnosticsPanel bus={activeBus} />
      )}

      {/* 4. Active Fleet Unit Roster Grid */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Active Transit Fleet Unit Roster ({fleet.length})</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {fleet.map((bus) => (
            <Card
              key={bus.id}
              onClick={() => setSelectedBusId(bus.id)}
              className={`p-3.5 flex flex-col justify-between gap-2.5 cursor-pointer transition ${
                selectedBusId === bus.id
                  ? 'border-blue-500 bg-blue-50/40 dark:bg-slate-800/80 ring-1 ring-blue-500/20 shadow-xs'
                  : 'hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm font-mono">{bus.id}</span>
                    <Badge variant="success" size="sm" dot>
                      ONLINE
                    </Badge>
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                      {bus.dvr_channels || 4} CH MDVR
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{bus.vehicle_type}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(bus.id);
                    }}
                    title={`Decommission bus ${bus.id}`}
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-500 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400">
                    <Radio className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-xs">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Corridor</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium text-[11px] truncate block">{bus.route_name}</span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-600 dark:text-slate-400">Speed: <b className="text-slate-900 dark:text-slate-100">{bus.speed_kmh} km/h</b></span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">IMU: {bus.imu_jerk_gz}g</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Decommission Confirmation Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Decommission Bus Node?</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Are you sure you want to decommission <b className="text-rose-300 font-mono">{confirmDeleteId}</b>? This will terminate all active RTSP background video workers, release channel buffers, and permanently remove the node from the fleet registry.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBus(confirmDeleteId)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? "Decommissioning..." : "Yes, Decommission Node"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Bus Modal */}
      <AddBusModal
        isOpen={isAddBusModalOpen}
        onClose={() => setIsAddBusModalOpen(false)}
        onSuccess={handleSuccessAdd}
      />

      {/* Upload Footage Modal */}
      <UploadFootageModal
        isOpen={isUploadFootageOpen}
        onClose={() => setIsUploadFootageOpen(false)}
        busId={activeBus.id}
        selectedChannel={1}
        onUploadSuccess={() => {
          setViewMode('camera');
        }}
      />
    </div>
  );
};
