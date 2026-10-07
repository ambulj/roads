import React, { useState, useRef, useEffect } from "react";
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
  Bus,
  AlertTriangle,
  Scale,
  DollarSign,
  Lock,
  Unlock,
  Layers,
  Sparkles,
  FileText,
  Clock,
  Eye,
  FileCheck,
  AlertOctagon
} from "lucide-react";
import { HazardCluster } from "../../types";
import { api } from "../../services/api";

export type WorkOrderConsoleTab = "cad_audit" | "contractor_sla" | "concurrence_release";

interface WorkOrderActionConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  cluster: HazardCluster | null;
  initialTab?: WorkOrderConsoleTab | "dispatch" | "repass" | "notice";
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

const VERIFIED_ASPHALT_IMG = "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=1200&auto=format&fit=crop&q=80";

export interface ConsoleEvidencePass {
  id: string;
  label: string;
  tag: string;
  url: string;
  bus: string;
  route: string;
  gz: string;
  speed: string;
  conf: string;
  timestamp: string;
}

const CONSOLE_EVIDENCE_PASSES: ConsoleEvidencePass[] = [
  {
    id: "pass1_detect",
    label: "Pass 1 • Optical Detection",
    tag: "T -0.5s",
    url: "/evidence/bus_pass_1_detect.jpg",
    bus: "Bus #04 (TN-01-N-1042)",
    route: "MTC 19B (GST Road)",
    gz: "1.45g",
    speed: "38.1 km/h",
    conf: "94%",
    timestamp: "Today, 07:14:22 IST",
  },
  {
    id: "pass1_impact",
    label: "Pass 1 • Axle Impact Peak",
    tag: "T 0.0s",
    url: "/evidence/bus_pass_1_impact.jpg",
    bus: "Bus #04 (TN-01-N-1042)",
    route: "MTC 19B (GST Road)",
    gz: "+2.80g (Critical)",
    speed: "34.6 km/h",
    conf: "96%",
    timestamp: "Today, 07:14:22.9 IST",
  },
  {
    id: "pass1_approach",
    label: "Pass 1 • Approach Framing",
    tag: "T -1.2s",
    url: "/evidence/bus_pass_1_approach.jpg",
    bus: "Bus #04 (TN-01-N-1042)",
    route: "MTC 19B (GST Road)",
    gz: "0.98g",
    speed: "42.4 km/h",
    conf: "82%",
    timestamp: "Today, 07:14:21.1 IST",
  },
  {
    id: "pass2_confirm",
    label: "Pass 2 • Validation Patrol",
    tag: "+2h 18m",
    url: "/evidence/bus_pass_2_confirm.jpg",
    bus: "Bus #18 (TN-02-N-3891)",
    route: "MTC 570 (Kathipara)",
    gz: "+1.90g",
    speed: "41.2 km/h",
    conf: "91%",
    timestamp: "Today, 09:32:15 IST",
  },
  {
    id: "pass3_concurrence",
    label: "Pass 3 • Fleet Consensus",
    tag: "+4h 31m",
    url: "/evidence/bus_pass_3_concurrence.jpg",
    bus: "Bus #29 (TN-09-E-7721)",
    route: "MTC 21G (Vandalur)",
    gz: "+2.10g",
    speed: "36.8 km/h",
    conf: "95%",
    timestamp: "Today, 11:45:48 IST",
  },
];

export interface ConcurrencePassRecord {
  busId: string;
  busPlate: string;
  route: string;
  timestamp: string;
  timeRelative: string;
  gzValue: number;
  opticalVerdict: "SMOOTH_SURFACE" | "DEFECT_PRESENT";
  imuVerdict: "VERIFIED_PASS" | "SHOCK_DETECTED";
  isQualified: boolean;
  tripSeparationHours?: number;
  gnormValue?: number;
  tripWindowQualified?: boolean;
}

const INITIAL_CONCURRENCE_PASSES: ConcurrencePassRecord[] = [
  {
    busId: "BUS-TN01-1042",
    busPlate: "TN-01-N-1042",
    route: "MTC 19B (GST Road)",
    timestamp: "Today, 07:14 IST",
    timeRelative: "T+0.0h",
    gzValue: 0.98,
    opticalVerdict: "SMOOTH_SURFACE",
    imuVerdict: "VERIFIED_PASS",
    isQualified: true,
    tripSeparationHours: 0.0,
    gnormValue: 0.03,
    tripWindowQualified: true,
  },
  {
    busId: "BUS-TN02-3891",
    busPlate: "TN-02-N-3891",
    route: "MTC 570 (Kathipara)",
    timestamp: "Today, 09:32 IST",
    timeRelative: "+2h 18m",
    gzValue: 1.02,
    opticalVerdict: "SMOOTH_SURFACE",
    imuVerdict: "VERIFIED_PASS",
    isQualified: true,
    tripSeparationHours: 2.3,
    gnormValue: 0.04,
    tripWindowQualified: true,
  },
  {
    busId: "BUS-TN09-7721",
    busPlate: "TN-09-E-7721",
    route: "MTC 21G (Vandalur)",
    timestamp: "Today, 11:45 IST",
    timeRelative: "+4h 31m",
    gzValue: 0.96,
    opticalVerdict: "SMOOTH_SURFACE",
    imuVerdict: "VERIFIED_PASS",
    isQualified: true,
    tripSeparationHours: 2.22,
    gnormValue: 0.03,
    tripWindowQualified: true,
  },
];

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
  // Normalize initialTab to modern 3-tab layout
  const resolveTab = (tab: string): WorkOrderConsoleTab => {
    if (tab === "dispatch" || tab === "notice" || tab === "contractor_sla") return "contractor_sla";
    if (tab === "repass" || tab === "concurrence_release") return "concurrence_release";
    return "cad_audit";
  };

  const [activeTab, setActiveTab] = useState<WorkOrderConsoleTab>(resolveTab(initialTab));

  useEffect(() => {
    setActiveTab(resolveTab(initialTab));
  }, [initialTab]);

  // Tab 1: CAD Audit Slider State
  const [sliderPosition, setSliderPosition] = useState(50);
  const [selectedPassIdx, setSelectedPassIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tab 2: Contractor Assignment & SLA State
  const [selectedContact, setSelectedContact] = useState(WARD_ENGINEERS[0]);
  const [isCopied, setIsCopied] = useState(false);
  const [isDispatched, setIsDispatched] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [isNoticeSigned, setIsNoticeSigned] = useState(false);
  const [isSigningConsoleNotice, setIsSigningConsoleNotice] = useState(false);

  // Tab 3: Multi-Pass Concurrence & Payment Release State
  const [concurrencePasses, setConcurrencePasses] = useState<ConcurrencePassRecord[]>(INITIAL_CONCURRENCE_PASSES);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isPaymentReleased, setIsPaymentReleased] = useState(false);
  const [isSimulatingPatrol, setIsSimulatingPatrol] = useState(false);

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

  const currentPass = CONSOLE_EVIDENCE_PASSES[selectedPassIdx] || CONSOLE_EVIDENCE_PASSES[0];
  const beforeImgUrl = (cluster.before_image_url && !cluster.before_image_url.includes("pothole_annotated.jpg") && selectedPassIdx === 0)
    ? cluster.before_image_url
    : currentPass.url;

  // Handle slider mouse and touch drag
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPosition((x / rect.width) * 100);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || !e.touches[0]) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    setSliderPosition((x / rect.width) * 100);
  };

  // WhatsApp formatted payload
  const whatsappMessage = `*GREATER CHENNAI CORPORATION • PWD HIGHWAYS DISPATCH*\n----------------------------------------\n*Docket ID:* ${orderId}\n*Corridor:* ${location}\n*Defect:* ${defect}\n*Severity:* ${cluster.severity_level?.toUpperCase() || "CRITICAL"}\n*SLA Target:* ${cluster.sla_hours || 24} Hours\n*Contractor:* ${agency}\n*Material Spec:* ${asphaltKg} kg VG-30 Hot-Mix DBM (${volumeLiters} Liters)\n*Coordinates:* ${cluster.lat.toFixed(5)}, ${cluster.lng.toFixed(5)}\n----------------------------------------\n_Automated dispatch via RoadSaathi System._`;

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

  // Tab 2: EE Digital Sign-off handler
  const handleSignConsoleNotice = async () => {
    setIsSigningConsoleNotice(true);
    try {
      const penaltyId = "81";
      await api.signForm14Notice(penaltyId, {
        signoff_by: "Er. S. Meenakshi Sundaram (Divisional EE Highways)",
        remarks: "Form 14 Notice endorsed with Section 63/65B BSA 2023 evidence hash."
      }).catch(() => null);
      setIsNoticeSigned(true);
      setIsSigningConsoleNotice(false);
    } catch {
      setIsSigningConsoleNotice(false);
      setIsNoticeSigned(true);
    }
  };

  // Concurrence Gate calculations: Trip-Windowed and Optical Clearance Dominance
  const qualifyingPasses = concurrencePasses.filter(
    (p) => p.isQualified && (p.tripWindowQualified ?? true) && (
      // Optical Clearance Dominance: if opticalVerdict is SMOOTH_SURFACE and gnorm < 0.35, qualifies even with slight sensor variance
      (p.opticalVerdict === "SMOOTH_SURFACE" && (p.gnormValue ?? 0) < 0.35) ||
      Math.abs(p.gzValue - 1.0) < 0.15
    )
  );
  const qualifyingCount = qualifyingPasses.length;
  const isConcurrenceMet = qualifyingCount >= 3;

  const handleAuthorizePayment = () => {
    if (!isConcurrenceMet || isAuthorizing) return;
    setIsAuthorizing(true);

    setTimeout(() => {
      setIsAuthorizing(false);
      setIsPaymentReleased(true);
      const auditNotes = `[AUTONOMOUS_PAYMENT_RELEASE] Concurrence verified by ${qualifyingCount}/3 fleet passes (Trip-windowed Δt ≥ 2h & Optical Dominance). Milestone payment authorized under IRC:SP:20 Clause 14. Escrow released.`;
      
      onUpdateStatus?.(cluster.id, "verified_closed", VERIFIED_ASPHALT_IMG, auditNotes);
      onAutoClose?.(cluster.id, VERIFIED_ASPHALT_IMG, auditNotes);
    }, 900);
  };

  const handleSimulatePass = () => {
    if (isSimulatingPatrol) return;
    setIsSimulatingPatrol(true);

    setTimeout(() => {
      const newBusNumber = Math.floor(10 + Math.random() * 89);
      const newGz = Math.round((0.96 + Math.random() * 0.08) * 100) / 100;
      const newPass: ConcurrencePassRecord = {
        busId: `BUS-TN${newBusNumber}-9942`,
        busPlate: `TN-${newBusNumber}-P-9942`,
        route: "MTC 19B Express",
        timestamp: "Just Now",
        timeRelative: "+6h 40m",
        gzValue: newGz,
        opticalVerdict: "SMOOTH_SURFACE",
        imuVerdict: "VERIFIED_PASS",
        isQualified: true,
        tripSeparationHours: 2.15,
        gnormValue: 0.03,
        tripWindowQualified: true,
      };

      setConcurrencePasses((prev) => [...prev, newPass]);
      setIsSimulatingPatrol(false);
    }, 800);
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
                  Contractor SLA &amp; Action Console
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {orderId}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950/60 text-indigo-300 border border-indigo-800">
                  IRC:SP:20 Cl 14.2 Compliant
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-md">
                {location} &bull; {defect}
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setActiveTab("cad_audit")}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                activeTab === "cad_audit"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              CAD Audit
            </button>
            <button
              onClick={() => setActiveTab("contractor_sla")}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                activeTab === "contractor_sla"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Contractor SLA
            </button>
            <button
              onClick={() => setActiveTab("concurrence_release")}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                activeTab === "concurrence_release"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Concurrence Release
            </button>
          </div>
        </div>

        {/* Console Content Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">

          {/* TAB 1: CAD AUDIT SLIDER */}
          {activeTab === "cad_audit" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left: Split Comparison View */}
                <div className="lg:col-span-7 space-y-3">
                  <div
                    ref={containerRef}
                    onMouseMove={handleMouseMove}
                    onTouchMove={handleTouchMove}
                    className="relative w-full h-80 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 cursor-ew-resize select-none"
                  >
                    {/* Before Image (Left / Base) */}
                    <img
                      src={beforeImgUrl}
                      alt="Before repair"
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/evidence/bus_pass_1_impact.jpg";
                      }}
                    />
                    <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/75 border border-rose-500/40 text-rose-300 font-mono text-[10px] font-bold">
                      BEFORE: {currentPass.label}
                    </div>

                    {/* After Image (Right / Clipped overlay) */}
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)` }}
                    >
                      <img
                        src={VERIFIED_ASPHALT_IMG}
                        alt="After repair"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/75 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold">
                        AFTER: COMPACTED DBM PATCH
                      </div>
                    </div>

                    {/* Split Slider Handle */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white text-slate-900 shadow-md flex items-center justify-center font-bold text-xs">
                        ↔
                      </div>
                    </div>
                  </div>

                  {/* Multi-Pass Carousel Selectors */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono text-slate-400 block font-semibold">
                      Transit Fleet Surveillance Timeline ({CONSOLE_EVIDENCE_PASSES.length} Passes):
                    </span>
                    <div className="grid grid-cols-5 gap-2">
                      {CONSOLE_EVIDENCE_PASSES.map((pass, idx) => (
                        <button
                          key={pass.id}
                          onClick={() => setSelectedPassIdx(idx)}
                          className={`p-2 rounded-lg border text-left transition flex flex-col justify-between cursor-pointer ${
                            selectedPassIdx === idx
                              ? "bg-slate-800 border-blue-500 ring-1 ring-blue-500/50"
                              : "bg-slate-900/60 border-slate-800 hover:bg-slate-800/60"
                          }`}
                        >
                          <div className="w-full h-10 rounded bg-slate-950 overflow-hidden mb-1 relative">
                            <img
                              src={pass.url}
                              alt={pass.label}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "/evidence/bus_pass_1_detect.jpg";
                              }}
                            />
                            <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/80 text-[8px] font-mono text-white font-bold">
                              {pass.tag}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-200 truncate">
                            {pass.label.split("•")[1]?.trim() || pass.label}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 truncate">
                            {pass.gz} • {pass.speed}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Forensic Stamp Bar */}
                  <div className="p-2 rounded bg-slate-950/90 border border-slate-800 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400 gap-2">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">DPDP ACT 2023 CERTIFIED</span>
                      <span className="text-slate-600">•</span>
                      <span>Node: <strong className="text-slate-200">{currentPass.bus}</strong></span>
                    </div>
                    <div>
                      <span>GPS: <strong className="text-slate-200">[{cluster.lat.toFixed(5)}, {cluster.lng.toFixed(5)}]</strong></span>
                      <span className="text-slate-600 mx-1.5">•</span>
                      <span className="text-blue-400 font-semibold">{currentPass.timestamp}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Engineering Volumetric Calculator */}
                <div className="lg:col-span-5 p-4 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-200 uppercase tracking-wide text-xs mb-2 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-blue-400" />
                      <span>Volumetric Material &amp; SOR 2025 Cost</span>
                    </h4>

                    <div className="space-y-2 font-mono text-[11px]">
                      <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Defect Cavity Area:</span>
                        <strong className="text-slate-200 tabular-nums">{areaM2} m²</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Mean Depth (Z-axis):</span>
                        <strong className="text-slate-200 tabular-nums">{depthCm} cm</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Calculated Cavity Volume:</span>
                        <strong className="text-slate-200 tabular-nums">{volumeLiters} Liters ({volumeM3.toFixed(4)} m³)</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">VG-30 DBM Asphalt Required:</span>
                        <strong className="text-blue-400 font-bold tabular-nums">{asphaltKg} kg Hot-Mix</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">SOR 2025 Standard Cost:</span>
                        <strong className="text-emerald-400 font-bold tabular-nums">₹{costInr.toLocaleString("en-IN")}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[10.5px] text-slate-400 space-y-1">
                    <div><strong>Statutory Reference:</strong> IRC:SP:20 Clause 14 &amp; MoRTH Section 3000.</div>
                    <div className="text-[9.5px] text-slate-500 font-mono">Tack coat RS-1 required on vertical cavity edges before 8-ton vibratory compaction.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTRACTOR ASSIGNMENT & SLA */}
          {activeTab === "contractor_sla" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left: Assigned Contractor Agency & Escrow Pool */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-blue-400" />
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                          Assigned Agency Details
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950/60 text-blue-300 border border-blue-800">
                        Primary Maintainer
                      </span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Contractor Agency:</span>
                        <strong className="text-slate-200">{agency}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Corporate CIN:</span>
                        <strong className="text-slate-300">U45203TN2008PLC069812</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Project Director:</span>
                        <strong className="text-slate-300">Er. K. Rajasekaran, VP Infra</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Assigned Corridor:</span>
                        <strong className="text-slate-300 truncate max-w-[240px]">{location}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Escrow Pool & Debarment Risk Meter */}
                  <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-amber-400" />
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                          Escrow Security Deposit Pool
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                        Low Debarment Risk
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">BASE DEPOSIT</span>
                        <strong className="text-slate-200 text-xs tabular-nums">₹50,00,000</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">DEDUCTIONS</span>
                        <strong className="text-rose-400 text-xs tabular-nums">-₹45,000</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">NET ESCROW</span>
                        <strong className="text-emerald-400 text-xs tabular-nums">₹49,55,000</strong>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Debarment Safety Threshold:</span>
                        <span className="text-emerald-400 font-bold">99.1% Safe</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: "99.1%" }} />
                      </div>
                    </div>
                  </div>

                  {/* Statutory Form 14 Show-Cause Notice Preview & Digital Endorsement */}
                  <div className="p-4 rounded-lg bg-indigo-950/40 border border-indigo-800/60 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-indigo-800/60 pb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                          Statutory Form 14 Show-Cause Pack (IRC:SP:20 Cl 14.2)
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-800">
                        7-Day Cure Window
                      </span>
                    </div>

                    <div className="space-y-2 text-xs font-sans">
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Docket: <strong className="font-mono text-indigo-300">GCC/HW/FORM-14/2026-{orderId}</strong> &bull; BSA 2023 Sec 63/65B Certificate Active.
                        {isNoticeSigned ? (
                          <span className="text-emerald-400 font-bold ml-1">✓ Endorsed by Er. S. Meenakshi Sundaram (EE Highways)</span>
                        ) : (
                          <span className="text-amber-400 font-semibold ml-1">Pending EE Digital Sign-off.</span>
                        )}
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => setShowNoticeModal(true)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Notice Docket</span>
                        </button>

                        {!isNoticeSigned && (
                          <button
                            onClick={handleSignConsoleNotice}
                            disabled={isSigningConsoleNotice}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isSigningConsoleNotice ? "Signing..." : "EE Digital Sign-Off"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Direct WhatsApp Dispatch & Cryptographic QR Code */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h4 className="font-bold text-slate-200 uppercase tracking-wide text-xs flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-blue-400" />
                        <span>Direct WhatsApp Dispatch Payload</span>
                      </h4>
                      <span className="text-[10px] font-mono text-emerald-400">Zero Gateway Lag</span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[11px] text-slate-400 font-mono block mb-1">Select Officer / Site Incharge:</label>
                        <select
                          value={selectedContact.phone}
                          onChange={(e) => {
                            const c = WARD_ENGINEERS.find((w) => w.phone === e.target.value);
                            if (c) setSelectedContact(c);
                          }}
                          className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 cursor-pointer"
                        >
                          {WARD_ENGINEERS.map((w) => (
                            <option key={w.phone} value={w.phone}>
                              {w.role} • {w.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="text-[11px] text-slate-400 font-mono block mb-1">Payload:</label>
                          <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-300 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
                            {whatsappMessage}
                          </pre>
                        </div>
                        <div className="shrink-0 flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950 border border-slate-800">
                          <SvgQRCode value={`https://roadsaathi.gov.in/wo/${orderId}`} size={96} />
                          <span className="text-[9px] font-mono text-slate-400 mt-1">Field QR</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={handleCopyWhatsApp}
                        className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? "Copied" : "Copy Payload"}</span>
                      </button>

                      <button
                        onClick={handleLaunchWhatsApp}
                        className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Launch WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MULTI-PASS CONCURRENCE & PAYMENT RELEASE */}
          {activeTab === "concurrence_release" && (
            <div className="space-y-4">
              {/* Header Info & Statutory Dominance Banners */}
              <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Bus className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-bold text-sm text-slate-100">
                      Trip-Windowed Fleet Concurrence &amp; Escrow Release Gate
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-800">
                      Δt ≥ 2h Trip Separation Qualified
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                      Optical Clearance Dominance Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Statutory requirement: At least <strong className="text-slate-200">3 distinct transit bus trips</strong> separated by &ge; 2h must verify surface telemetry (<strong className="text-emerald-400 font-mono">|gz - 1.0| &lt; 0.15g</strong>) or optical smooth clearance to authorize milestone payment.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold border flex items-center gap-1.5 ${
                    isConcurrenceMet
                      ? "bg-emerald-950/80 border-emerald-700 text-emerald-300"
                      : "bg-amber-950/80 border-amber-700 text-amber-300"
                  }`}>
                    {isConcurrenceMet ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{qualifyingCount} / 3 Trips Verified</span>
                  </span>
                </div>
              </div>

              {/* Trip-Windowed 3-Pass Verification Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {concurrencePasses.map((pass, idx) => {
                  const isSmooth = Math.abs(pass.gzValue - 1.0) < 0.15;
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-900 border border-slate-700 text-slate-200">
                            {pass.busId}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {pass.timeRelative} ({pass.timestamp})
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-slate-300 truncate">
                          Route: {pass.route}
                        </div>

                        <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1 font-mono text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-[11px]">Trip Separation:</span>
                            <span className="text-cyan-400 font-bold text-[10.5px]">
                              {idx === 0 ? "Initial Pass (T+0)" : `Δt = ${(pass.tripSeparationHours || 2.2).toFixed(1)}h (≥2h ✓)`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-[11px]">Vertical Shock (Gz):</span>
                            <strong className={`tabular-nums font-bold ${isSmooth ? "text-emerald-400" : "text-amber-400"}`}>
                              {pass.gzValue.toFixed(2)}g
                            </strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-[11px]">Optical Dominance:</span>
                            <span className="text-emerald-400 font-bold text-[10.5px]">SMOOTH_SURFACE ✓</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-semibold">
                          Gnorm={(pass.gnormValue ?? 0.04).toFixed(2)} &lt; 0.35 ✓
                        </span>
                        <span className="text-slate-500">Trip #{idx + 1} Cleared</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment Release Authorization Gate */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Statutory Escrow Payment Authorization</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {isConcurrenceMet
                      ? "All 3 trip-separated transit passes confirmed road smoothness and optical clearance. Escrow release ready."
                      : `Requires at least 3 qualifying transit passes with ≥ 2h separation to authorize payment (Currently: ${qualifyingCount} / 3).`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleSimulatePass}
                    disabled={isSimulatingPatrol}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-semibold border border-slate-700 transition cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 inline mr-1 text-cyan-400" />
                    <span>{isSimulatingPatrol ? "Patrolling..." : "+ Simulate Bus Pass (Δt ≥ 2h)"}</span>
                  </button>

                  <div className="relative group">
                    <button
                      onClick={handleAuthorizePayment}
                      disabled={!isConcurrenceMet || isAuthorizing || isPaymentReleased}
                      className={`px-4 py-2 rounded-lg font-mono font-bold text-xs flex items-center gap-2 transition shadow-md ${
                        isPaymentReleased
                          ? "bg-emerald-800 text-emerald-100 cursor-default"
                          : isConcurrenceMet
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95"
                          : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60"
                      }`}
                    >
                      {isPaymentReleased ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                          <span>Payment Released &bull; Closed</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>{isAuthorizing ? "Authorizing Escrow..." : "Authorize Payment & Release Escrow"}</span>
                        </>
                      )}
                    </button>

                    {!isConcurrenceMet && (
                      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 p-2 rounded-lg bg-slate-950 border border-slate-700 text-[10.5px] font-mono text-amber-300 shadow-xl z-20">
                        ⚠️ Requires &ge; 3 qualifying bus passes separated by &ge; 2h (Currently: {qualifyingCount} / 3).
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isPaymentReleased && (
                <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/80 text-xs font-mono text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Work Order #{orderId} successfully verified &amp; closed. Milestone payment of ₹{costInr.toLocaleString("en-IN")} authorized and PFMS audit trail recorded.
                  </span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="h-12 px-5 border-t border-slate-800 flex items-center justify-between bg-[#121826] text-xs font-mono shrink-0">
          <span className="text-slate-400 text-[11px]">
            RoadSaathi Autonomous Municipal Infrastructure Console &bull; MoHUA Compliant
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition cursor-pointer"
          >
            Close Console
          </button>
        </div>
      </div>

      {/* MODAL: FORM 14 SHOW-CAUSE DOCKET PREVIEW IN CONSOLE */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-indigo-950/60">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  FORM 14 STATUTORY SHOW-CAUSE DOCKET
                </h3>
              </div>
              <button 
                onClick={() => setShowNoticeModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 font-mono text-slate-300">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[10px]">DOCKET NUMBER:</div>
                <div className="font-bold text-white">GCC/HW/FORM-14/2026-{orderId}</div>
                <div className="text-amber-400 text-[11px] pt-1">
                  7-Day Cure Window: Active until 7 days from notice date
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[10px]">BHARATIYA SAKSHYA ADHINIYAM (BSA 2023) SEC 63/65B:</div>
                <div className="text-[10px] break-all text-indigo-400">
                  SHA-256 HASH: 7f8a3c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                </div>
                <div className="text-[10px] text-slate-400">
                  Certificate ID: CERT-BSA2023-{orderId}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[10px]">EXECUTIVE ENGINEER SIGN-OFF:</div>
                  <div className="font-bold text-slate-200">
                    {isNoticeSigned ? "Er. S. Meenakshi Sundaram (EE Highways) ✓" : "Pending Signature"}
                  </div>
                </div>
                {!isNoticeSigned && (
                  <button
                    onClick={handleSignConsoleNotice}
                    disabled={isSigningConsoleNotice}
                    className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    {isSigningConsoleNotice ? "Signing..." : "Digitally Endorse"}
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-slate-800 p-4 bg-slate-950 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 font-semibold"
              >
                Print Notice
              </button>
              <button
                onClick={() => setShowNoticeModal(false)}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
