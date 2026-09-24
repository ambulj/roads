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
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-5 max-w-[1700px] mx-auto w-full select-none">
      
      {/* 1. Fleet Overview Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Fleet Overview</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-normal">
            Real-time multi-camera video streams, telematics telemetry, and on-vehicle edge health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadFootageOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-medium text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Footage</span>
          </button>

          <button
            onClick={() => setIsAddBusModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-zinc-200 dark:border-zinc-750"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* 2. Vehicle Selector & Mode Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Selected Vehicle:</span>
            <select
              value={selectedBusId}
              onChange={(e) => setSelectedBusId(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs outline-hidden focus:ring-2 focus:ring-zinc-400 cursor-pointer"
            >
              {fleet.map((bus) => (
                <option key={bus.id} value={bus.id}>
                  {bus.id} — {bus.route_name.split('·')[0].trim()} ({bus.speed_kmh} km/h)
                </option>
              ))}
            </select>
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>{onlineCount} of {fleet.length} Online</span>
          </span>

          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Corridor: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{activeBus.route_name}</span>
          </span>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-zinc-200/70 dark:bg-zinc-800 rounded-lg">
          <button
            onClick={() => setViewMode('camera')}
            className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'camera'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera Stream</span>
          </button>

          <button
            onClick={() => setViewMode('sensors')}
            className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'sensors'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Sensor Diagnostics</span>
          </button>
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
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 text-xs">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <SlidersVertical className="w-4 h-4 text-zinc-500" />
                    <span>Vehicle Telemetry</span>
                  </div>
                  <span className="font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                    {activeBus.id}
                  </span>
                </div>

                <div className="space-y-3 mt-3 text-xs">
                  {/* Route & Corridor */}
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-850/50 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-500">Route</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-right truncate max-w-[190px]">
                      {activeBus.route_name}
                    </span>
                  </div>

                  {/* IMU Accelerometer Jerk (G_z) */}
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-850/50 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Vertical Shock</span>
                    </span>
                    <span className={`font-semibold ${activeBus.imu_jerk_gz >= 1.30 ? 'text-rose-500' : activeBus.imu_jerk_gz > 1.08 ? 'text-amber-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                      {activeBus.imu_jerk_gz} g
                    </span>
                  </div>

                  {/* Velocity */}
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-850/50 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Speed</span>
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {activeBus.speed_kmh} km/h
                    </span>
                  </div>

                  {/* Edge Vision Rate */}
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-850/50 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Edge Inference</span>
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {activeBus.edge_fps || 28.4} FPS
                    </span>
                  </div>

                  {/* Edge Sync Status */}
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-850/50 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <Wifi className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Sync Mode</span>
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {edgeStatus?.connectivity_mode || "5GHz Depot WiFi"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="font-mono">{activeBus.lat.toFixed(4)}° N, {activeBus.lng.toFixed(4)}° E</span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">GPS Locked</span>
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
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Registered Fleet Vehicles ({fleet.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {fleet.map((bus) => (
            <div
              key={bus.id}
              onClick={() => setSelectedBusId(bus.id)}
              className={`p-4 rounded-xl border bg-white dark:bg-zinc-900 flex flex-col justify-between gap-3 cursor-pointer transition-all ${
                selectedBusId === bus.id
                  ? 'border-zinc-900 dark:border-zinc-100 ring-1 ring-zinc-900 dark:ring-zinc-100 shadow-sm'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{bus.id}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Online
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-normal">{bus.vehicle_type}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(bus.id);
                    }}
                    title={`Decommission vehicle ${bus.id}`}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-100 dark:border-zinc-800/80 p-2.5 rounded-lg text-xs">
                <span className="text-zinc-400 font-medium block">Route Corridor</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-semibold text-xs truncate block mt-0.5">{bus.route_name}</span>
              </div>

              <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800 text-xs flex items-center justify-between text-zinc-500">
                <span>Speed: <strong className="text-zinc-900 dark:text-zinc-100 font-medium">{bus.speed_kmh} km/h</strong></span>
                <span>Shock: <strong className="text-zinc-900 dark:text-zinc-100 font-medium">{bus.imu_jerk_gz} g</strong></span>
              </div>
            </div>
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
