import React, { useState, useRef } from "react";
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  DollarSign, 
  RotateCcw,
  Sparkles,
  Sliders,
  Calendar,
  Building,
  MapPin,
  TrendingDown
} from "lucide-react";

interface ContractorAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrderId?: string;
  contractorName?: string;
  locationName?: string;
  onApprove?: () => void;
  canApprove?: boolean;
}

export const ContractorAuditModal: React.FC<ContractorAuditModalProps> = ({
  isOpen,
  onClose,
  workOrderId = "WO-2025-0842",
  contractorName = "Apex Urban Infra Ltd",
  locationName = "GST Road (NH-32) (Near Chennai Bypass, Ch. 18.4 km)",
  onApprove,
  canApprove = true,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0-100
  const [isApproved, setIsApproved] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [activeTab, setActiveTab] = useState<"pass" | "fail">("pass");
  const containerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const pct = (x / rect.width) * 100;
    setSliderPosition(pct);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || !e.touches[0]) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    const pct = (x / rect.width) * 100;
    setSliderPosition(pct);
  };

  const isPass = activeTab === "pass";

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-fadeIn select-none"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#0B101D] border border-slate-700/90 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] text-white animate-scaleIn">
        
        {/* Header */}
        <div className="h-14 px-5 border-b border-slate-800 flex items-center justify-between bg-[#0E1424]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white tracking-wide">
                  AI "Before vs. After" Contractor Repair Verification
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {workOrderId}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Automated vision audit based on subsequent fleet camera passes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Simulation Tab Switcher */}
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab("pass")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${isPass ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                Simulate Flush Pass (98%)
              </button>
              <button
                onClick={() => setActiveTab("fail")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${!isPass ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                Simulate Sunken Defect
              </button>
            </div>

            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0">
          
          {/* Left: Interactive Split Slider (8 cols) */}
          <div className="lg:col-span-8 p-5 flex flex-col justify-between bg-[#070B14]">
            <div className="flex items-center justify-between mb-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-800 text-[10px] font-bold uppercase">
                  ◀ BEFORE: Severe Pothole D40
                </span>
                <span className="text-slate-500">vs</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[10px] font-bold uppercase">
                  AFTER: Post-Repair Bus Pass ▶
                </span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">
                Drag handle to compare: <strong>{Math.round(sliderPosition)}%</strong>
              </span>
            </div>

            {/* Split Comparison Frame */}
            <div 
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden cursor-ew-resize border border-slate-700 bg-slate-900 shadow-inner group"
            >
              {/* After Image (Full background) */}
              <div 
                className="absolute inset-0 bg-cover bg-center flex items-end p-4"
                style={{
                  backgroundImage: isPass 
                    ? "radial-gradient(circle at 50% 60%, #334155 0%, #1e293b 60%, #0f172a 100%)"
                    : "radial-gradient(circle at 50% 60%, #1e293b 0%, #0f172a 70%, #020617 100%)",
                }}
              >
                {/* Synthetic Road Markings for After */}
                <div className="w-full h-full absolute inset-0 opacity-40 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-28 rounded-full border-2 border-emerald-400/80 bg-emerald-950/30 flex items-center justify-center text-emerald-300 font-mono text-xs font-bold shadow-lg">
                    {isPass ? "✓ FLUSH ASPHALT PATCH" : "⚠ SUNKEN EMBEDDING (-3.4cm)"}
                  </div>
                </div>

                <div className="relative z-10 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300">
                  <span className="text-emerald-400 font-bold">Post-Repair Audit:</span> Bus #12 (2h ago)
                </div>
              </div>

              {/* Before Image (Clipped overlay) */}
              <div 
                className="absolute inset-0 overflow-hidden flex items-end p-4"
                style={{ width: `${sliderPosition}%` }}
              >
                <div 
                  className="absolute inset-0 w-full h-full bg-cover bg-center"
                  style={{
                    width: containerRef.current ? `${containerRef.current.clientWidth}px` : "100%",
                    backgroundImage: "radial-gradient(circle at 50% 60%, #020617 0%, #0f172a 50%, #1e293b 100%)",
                  }}
                >
                  {/* Pothole cavity drawing */}
                  <div className="w-full h-full absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-52 h-32 rounded-[55%] border-2 border-rose-500 bg-black/90 flex flex-col items-center justify-center text-rose-400 font-mono text-xs font-bold shadow-2xl">
                      <span>D40 POTHOLE CAVITY</span>
                      <span className="text-[10px] text-rose-300">Depth: -8.4 cm</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300">
                  <span className="text-rose-400 font-bold">Original Defect:</span> Bus #04 (Aug 28)
                </div>
              </div>

              {/* Draggable Divider Line & Handle */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl z-20 pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-blue-600 text-white border-2 border-white shadow-xl flex items-center justify-center text-[10px] font-bold">
                  ↔
                </div>
              </div>
            </div>

            {/* Instruction Footer */}
            <div className="text-[11px] text-slate-400 mt-3 flex items-center justify-between">
              <span>Drag slider left/right to inspect repair edge flushness</span>
              <span className="text-slate-500">Verified via YOLOv8 Surface Texture Model</span>
            </div>
          </div>

          {/* Right: AI Inspection Badge & Approval Actions (4 cols) */}
          <div className="lg:col-span-4 p-5 bg-[#0D1424] border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between overflow-y-auto space-y-4">
            <div>
              {/* Status Badge */}
              <div className={`p-4 rounded-xl border mb-4 ${
                isPass 
                  ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                  : "bg-rose-950/30 border-rose-500/40 text-rose-300"
              }`}>
                <div className="flex items-center gap-2 font-bold text-xs">
                  {isPass ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                  <span>{isPass ? "PATCH VERIFIED: FLUSH (98% Quality)" : "DEFECT RE-EMERGENCE: SUNKEN"}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {isPass 
                    ? "Surface roughness matches baseline pavement tolerances. Structural compaction verified with 0 vertical step." 
                    : "Sunken depression of 3.4 cm detected. Water pooling risk persists. Penalty of ₹5,000 recommended per contract clause 14.2."}
                </p>
              </div>

              {/* Telemetry Metrics */}
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Audit Metrics & Metadata
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Assigned Contractor:</span>
                  <strong className="text-white font-medium">{contractorName}</strong>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Surface Flatness:</span>
                  <strong className={`font-mono font-bold ${isPass ? "text-emerald-400" : "text-rose-400"}`}>
                    {isPass ? "98.4% (Flush)" : "68.2% (Depression)"}
                  </strong>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Texture Embedding Distance:</span>
                  <strong className="font-mono text-white">{isPass ? "0.042 (High match)" : "0.381 (Poor blend)"}</strong>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Claimed Invoice Amount:</span>
                  <strong className="font-mono text-white">₹3,450</strong>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Quality Clause:</span>
                  <span className="font-mono text-blue-400 font-medium">PWD-SOR-CL14</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-3 border-t border-slate-800">
              {isPass ? (
                <button
                  onClick={() => {
                    setIsApproved(true);
                    onApprove?.();
                  }}
                  disabled={isApproved || !canApprove}
                  title={canApprove ? 'Approve invoice and release payment' : 'Approval requires a Road Maintenance Officer or Platform Administrator role.'}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md ${
                    isApproved
                      ? "bg-emerald-600 text-white" 
                      : canApprove ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 active:scale-98" : "bg-slate-700 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isApproved ? "Invoice Approved & Released!" : canApprove ? "Approve Invoice & Release Payment" : "Approval restricted by role"}</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsRejected(true)}
                  disabled={isRejected}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-2 transition shadow-md shadow-rose-900/30 active:scale-98"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>{isRejected ? "Rectification Notice Issued!" : "Issue Notice & Impose ₹5,000 Penalty"}</span>
                </button>
              )}

              <button
                onClick={() => alert(`Generated PDF Audit Certificate for ${workOrderId} with timestamp verification.`)}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Export Audit Certificate (PDF)</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
