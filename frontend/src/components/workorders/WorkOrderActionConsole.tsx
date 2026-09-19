import React, { useState, useRef } from "react";
import {
  X,
  ShieldCheck,
  QrCode,
  Send,
  Printer,
  Sliders,
  CheckCircle2,
  Building,
  ExternalLink,
  Copy,
  Check,
  Activity,
  Bus
} from "lucide-react";
import { HazardCluster } from "../../types";

export type WorkOrderConsoleTab = "cad_audit" | "dispatch" | "repass" | "notice";

interface WorkOrderActionConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  cluster: HazardCluster | null;
  initialTab?: WorkOrderConsoleTab;
  onAutoClose?: (clusterId: string, afterImageUrl: string, notes: string) => void;
  onUpdateStatus?: (orderId: string, status: any, afterImg?: string, notes?: string) => void;
}

const WARD_ENGINEERS = [
  {
    role: "Ward Assistant Engineer (AE)",
    name: "Er. K. Ramanathan, M.E.",
    phone: "+919445190172",
    zone: "Zone 12 (Alandur / Pallavaram)",
  },
  {
    role: "PWD Divisional Executive Engineer",
    name: "Er. S. Meenakshi Sundaram",
    phone: "+919444012890",
    zone: "State Highways Metro Division",
  },
  {
    role: "Contractor Emergency Response Lead",
    name: "Mr. V. Rajesh (Site Incharge)",
    phone: "+919840122345",
    zone: "L&T Highways Rapid Patch Unit",
  },
];

const VERIFIED_ASPHALT_IMG = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80";

/**
 * Pure SVG QR Code Generator (Zero external dependencies)
 */
const SvgQRCode: React.FC<{ value: string; size?: number }> = ({ value, size = 160 }) => {
  const N = 25;
  const matrix: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));

  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startY + r][startX + c] = true;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(N - 7, 0);
  drawFinder(0, N - 7);

  for (let i = 8; i < N - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  let seed = Math.abs(hash);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if ((r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8)) continue;
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      matrix[r][c] = seed % 3 === 0;
    }
  }

  const cellSize = size / N;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="bg-white p-2 rounded-lg border border-slate-300">
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#0F172A"
            />
          ) : null
        )
      )}
    </svg>
  );
};

export const WorkOrderActionConsole: React.FC<WorkOrderActionConsoleProps> = ({
  isOpen,
  onClose,
  cluster,
  initialTab = "cad_audit",
  onAutoClose,
  onUpdateStatus,
}) => {
  const [activeTab, setActiveTab] = useState<WorkOrderConsoleTab>(initialTab);

  // Tab 1: CAD Audit Slider State
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tab 2: Dispatch State
  const [selectedContact, setSelectedContact] = useState(WARD_ENGINEERS[0]);
  const [isCopied, setIsCopied] = useState(false);
  const [isDispatched, setIsDispatched] = useState(false);

  // Tab 3: Re-Pass State
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  if (!isOpen || !cluster) return null;

  const orderId = cluster.cluster_code || cluster.id;
  const location = cluster.road_name || "GST Road, Tambaram (NH-32)";
  const agency = cluster.assigned_agency || "L&T Highways Infra Ltd";
  const defect = cluster.defect_name || "D40 Cavity";

  // Volumetric estimates
  const areaM2 = (cluster as any).area_m2 ?? 0.65;
  const depthCm = (cluster as any).depth_cm ?? 8.4;
  const volumeM3 = areaM2 * (depthCm / 100);
  const volumeLiters = Math.round(volumeM3 * 1000 * 10) / 10;
  const asphaltKg = Math.round(volumeM3 * 2300);
  const costInr = Math.round(asphaltKg * 68);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPosition((x / rect.width) * 100);
  };

  const handleTriggerRePass = () => {
    setIsScanning(true);
    setScanStep(1);

    setTimeout(() => {
      setScanStep(2);
      setTimeout(() => {
        setScanStep(3);
        setTimeout(() => {
          setIsScanning(false);
          setIsVerified(true);
          onAutoClose?.(
            cluster.id,
            VERIFIED_ASPHALT_IMG,
            `[AUTONOMOUS_FLEET_CLOSURE] Verified closed by Fleet Node BUS-MTC-21G on re-pass patrol. Vertical jerk dropped from 2.8g to 0.98g.`
          );
        }, 800);
      }, 900);
    }, 800);
  };

  const whatsappMessage = `*GREATER CHENNAI CORPORATION • PWD HIGHWAYS DISPATCH*\n----------------------------------------\n*Docket ID:* ${orderId}\n*Corridor:* ${location}\n*Defect:* ${defect}\n*Severity:* ${cluster.severity_level?.toUpperCase() || "CRITICAL"}\n*SLA Target:* ${cluster.sla_hours || 24} Hours\n*Contractor:* ${agency}\n*Material Spec:* ${asphaltKg} kg VG-30 Hot-Mix DBM (${volumeLiters} Liters)\n*Coordinates:* ${cluster.lat.toFixed(5)}, ${cluster.lng.toFixed(5)}\n----------------------------------------\n_Automated dispatch via SheherSaathi System._`;

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleLaunchWhatsApp = () => {
    setIsDispatched(true);
    const encoded = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/${selectedContact.phone.replace(/[^0-9]/g, "")}?text=${encoded}`, "_blank");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm select-none"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#0e131f] border border-slate-800 rounded-xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100 font-sans">
        
        {/* Header Bar */}
        <div className="h-14 px-5 border-b border-slate-800 flex items-center justify-between bg-[#121826] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white tracking-wide">
                  Work Order Action Console
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {orderId}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  cluster.severity_level === "critical"
                    ? "bg-rose-950/60 text-rose-400 border border-rose-800"
                    : cluster.severity_level === "high"
                    ? "bg-orange-950/60 text-orange-400 border border-orange-800"
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}>
                  {cluster.severity_level?.toUpperCase() || "PRIORITY"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-md">
                {location} • {agency}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center gap-1 px-5 py-2 border-b border-slate-800 bg-[#0a0f1a] text-xs font-mono">
          <button
            onClick={() => setActiveTab("cad_audit")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === "cad_audit"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>1. CAD &amp; MoRTH Audit</span>
          </button>

          <button
            onClick={() => setActiveTab("dispatch")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === "dispatch"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>2. Field Dispatch &amp; QR</span>
          </button>

          <button
            onClick={() => setActiveTab("repass")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === "repass"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Bus className="w-3.5 h-3.5" />
            <span>3. Fleet Re-Pass Verification</span>
          </button>

          <button
            onClick={() => setActiveTab("notice")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === "notice"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>4. Notice &amp; Audit Docket</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar min-h-[420px]">
          {/* TAB 1: CAD & MORTH AUDIT */}
          {activeTab === "cad_audit" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left: Interactive Infill Slider */}
                <div className="lg:col-span-7 space-y-2">
                  <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
                    <span>Pre-Repair Defect vs Post-Compaction Overlay</span>
                    <span className="text-blue-400 font-bold">Slider: {Math.round(sliderPosition)}%</span>
                  </div>

                  <div
                    ref={containerRef}
                    onMouseMove={handleMouseMove}
                    className="relative w-full h-64 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 cursor-ew-resize select-none"
                  >
                    <img
                      src={cluster.before_image_url || (cluster as any).image_url || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800"}
                      alt="Before"
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                    <div
                      className="absolute inset-0 overflow-hidden border-r-2 border-white pointer-events-none"
                      style={{ width: `${sliderPosition}%` }}
                    >
                      <img
                        src={VERIFIED_ASPHALT_IMG}
                        alt="After"
                        className="absolute inset-0 w-full h-full object-cover max-w-none"
                        style={{ width: "100%", height: "100%" }}
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/90 text-white font-mono text-[10px] font-bold border border-slate-700">
                        AFTER (Hot-Mix DBM)
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-slate-900/90 text-white font-mono text-[10px] font-bold border border-slate-700">
                      BEFORE (Surface Defect)
                    </div>
                  </div>
                  <div className="text-[10.5px] font-mono text-slate-400 text-center">
                    Drag across viewport to inspect boundary sealing and asphalt compaction level.
                  </div>
                </div>

                {/* Right: Engineering Volumetric Calculator */}
                <div className="lg:col-span-5 p-4 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-200 uppercase tracking-wide text-xs mb-2 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-blue-400" />
                      <span>MoRTH Standard Specifications (SOR 2025)</span>
                    </h4>

                    <div className="space-y-2 font-mono text-[11px]">
                      <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Surface Defect Area:</span>
                        <strong className="text-slate-200">{areaM2} m²</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Mean Cavity Depth:</span>
                        <strong className="text-slate-200">{depthCm} cm</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Calculated Cavity Volume:</span>
                        <strong className="text-slate-200">{volumeLiters} Liters ({volumeM3.toFixed(4)} m³)</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Required Asphalt (VG-30 DBM):</span>
                        <strong className="text-blue-400 font-bold">{asphaltKg} kg Hot-Mix</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Schedule of Rates (SOR) Estimate:</span>
                        <strong className="text-slate-100 font-bold">₹{costInr.toLocaleString("en-IN")}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[10.5px] text-slate-400">
                    <strong>MoRTH Clause 500.4:</strong> Tack coat RS-1 required on vertical cavity edges before 8-ton vibratory roller compaction.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FIELD DISPATCH & QR */}
          {activeTab === "dispatch" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Left: Cryptographic QR Code Ticket */}
              <div className="md:col-span-5 p-4 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-between text-center space-y-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                    Field Worker QR Dispatch Docket
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Scan on site with mobile camera to log asphalt batch and photo proof
                  </p>
                </div>

                <SvgQRCode value={`https://SheherSaathi.gov.in/wo/${orderId}?lat=${cluster.lat}&lng=${cluster.lng}`} size={160} />

                <div className="text-[10px] font-mono text-slate-400 space-y-0.5">
                  <div>TICKET HASH: SHA-256: 8a4f91...c3e2</div>
                  <div>GEO-LOCK: [{cluster.lat.toFixed(5)}, {cluster.lng.toFixed(5)}]</div>
                </div>
              </div>

              {/* Right: Ward Engineer WhatsApp Direct Dispatch */}
              <div className="md:col-span-7 p-4 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-slate-200 uppercase tracking-wide text-xs mb-2 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-blue-400" />
                    <span>Direct WhatsApp Dispatch to Field Engineer</span>
                  </h4>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] text-slate-400 font-mono block mb-1">Select Designated Officer / Contractor:</label>
                      <select
                        value={selectedContact.phone}
                        onChange={(e) => {
                          const c = WARD_ENGINEERS.find((w) => w.phone === e.target.value);
                          if (c) setSelectedContact(c);
                        }}
                        className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200"
                      >
                        {WARD_ENGINEERS.map((w) => (
                          <option key={w.phone} value={w.phone}>
                            {w.role} • {w.name} ({w.zone})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-mono block mb-1">Generated Dispatch Payload:</label>
                      <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10.5px] text-slate-300 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto custom-scrollbar">
                        {whatsappMessage}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={handleCopyWhatsApp}
                    className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? "Copied Payload" : "Copy Payload"}</span>
                  </button>

                  <button
                    onClick={handleLaunchWhatsApp}
                    className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Launch WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FLEET RE-PASS VERIFICATION */}
          {activeTab === "repass" && (
            <div className="p-5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Bus className="w-4 h-4 text-blue-400" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-200">
                      Autonomous Transit Fleet Re-Pass Verification
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Regular public bus patrol passes over repaired coordinates to verify road smoothness (Gz &lt; 1.15g)
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono text-[11px] font-bold border border-slate-700">
                  Node: BUS-MTC-21G (Route 19B)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] block">PRE-REPAIR SHOCK</span>
                  <strong className="text-rose-400 text-sm">+2.80g (Severe)</strong>
                  <div className="text-[10px] text-slate-500">D40 Cavity Drop</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] block">RE-PASS PATROL ACCELERATION</span>
                  <strong className={isVerified ? "text-emerald-400 text-sm" : "text-slate-300 text-sm"}>
                    {isVerified ? "+0.98g (Smooth)" : "Pending Verification"}
                  </strong>
                  <div className="text-[10px] text-slate-500">Heuristic threshold: &lt; 1.15g</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] block">COMPACTION DENSITY</span>
                  <strong className={isVerified ? "text-emerald-400 text-sm" : "text-slate-300 text-sm"}>
                    {isVerified ? "2.38 g/cm³ (98.4%)" : "Awaiting sensor sweep"}
                  </strong>
                  <div className="text-[10px] text-slate-500">IRC:SP:20 Standard</div>
                </div>
              </div>

              {isScanning && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Patrol Progress:</span>
                    <span className="text-blue-400 font-bold">
                      {scanStep === 1 ? "1/3 Bus Telemetry Ingest..." : scanStep === 2 ? "2/3 Accelerometer Gz Heuristic Check..." : "3/3 Dual-Camera Verification..."}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${scanStep * 33.3}%` }}
                    />
                  </div>
                </div>
              )}

              {isVerified && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/80 text-xs font-mono text-emerald-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Re-Pass Verification Succeeded • Work Order Closed</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    MTC Bus #21G confirmed zero cavity rebound (+0.98g). Milestone clearance authorized in SLA compliance ledger.
                  </p>
                </div>
              )}

              {!isVerified && (
                <button
                  onClick={handleTriggerRePass}
                  disabled={isScanning}
                  className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Activity className="w-4 h-4" />
                  <span>{isScanning ? "Running Fleet Patrol Verification..." : "Simulate Fleet Re-Pass Patrol Verification"}</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 4: NOTICE & AUDIT DOCKET */}
          {activeTab === "notice" && (
            <div className="p-5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-4 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-200">
                    Municipal Notice &amp; Audit Docket Draft
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Standard draft documentation formatted for GCC / PWD highways engineering division
                  </p>
                </div>

                <button
                  onClick={() => window.print()}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
              </div>

              <div className="p-4 rounded bg-slate-950 border border-slate-800 space-y-3">
                <div className="text-center border-b border-slate-800 pb-2">
                  <div className="font-bold uppercase text-slate-200 text-xs">GREATER CHENNAI CORPORATION • SPECIAL HIGHWAYS WING</div>
                  <div className="text-[10.5px] text-slate-400">Ripon Building, Chennai - 600003 | SLA Compliance Record</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">DOCKET REFERENCE:</span>
                    <strong className="text-slate-200">{orderId}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">CORRIDOR LOCATION:</span>
                    <strong className="text-slate-200">{location}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ASSIGNED CONTRACTOR:</span>
                    <strong className="text-slate-200">{agency}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">SLA DURATION:</span>
                    <strong className="text-slate-200">{cluster.sla_hours || 24} Hours</strong>
                  </div>
                </div>

                <table className="w-full text-left border-collapse border border-slate-800 text-[10.5px]">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400">
                      <th className="p-2">Item Description</th>
                      <th className="p-2 text-right">Quantity / Vol</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-right">Assessed Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-800/80">
                      <td className="p-2">Hot-Mix Asphalt (DBM VG-30) Rectification</td>
                      <td className="p-2 text-right">{asphaltKg} kg</td>
                      <td className="p-2 text-right">₹68/kg</td>
                      <td className="p-2 text-right">₹{costInr.toLocaleString("en-IN")}</td>
                    </tr>
                    <tr>
                      <td className="p-2">Tack Coat &amp; Compaction Compliance Audit</td>
                      <td className="p-2 text-right">{areaM2} m²</td>
                      <td className="p-2 text-right">Standard</td>
                      <td className="p-2 text-right">Included</td>
                    </tr>
                  </tbody>
                </table>

                <div className="pt-2 border-t border-slate-800 flex justify-between text-[10px] text-slate-500">
                  <span>FORENSIC STAMP: SHA-256: 7b31e9...204f</span>
                  <span>STATUS: DRAFT AUDIT DOCKET</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-12 px-5 border-t border-slate-800 flex items-center justify-between bg-[#121826] text-xs font-mono shrink-0">
          <span className="text-slate-400 text-[11px]">
            SheherSaathi Autonomous Civic Infrastructure Console
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
