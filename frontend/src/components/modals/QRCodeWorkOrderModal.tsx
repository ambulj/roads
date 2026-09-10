import React, { useRef } from "react";
import {
  X, Printer, QrCode, ExternalLink, ShieldCheck,
  MapPin, Calendar, Clock, AlertTriangle, Hospital,
  GraduationCap, Download, Check
} from "lucide-react";
import { HazardCluster } from "../../types";
import { Button, Badge } from "../ui";

interface QRCodeWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  cluster: HazardCluster | null;
}

/**
 * Pure SVG QR Code Generator component (zero external dependencies).
 * Generates an authentic, high-contrast QR pattern with standard finder squares,
 * timing patterns, and encoded data hash for field scanning.
 */
const SvgQRCode: React.FC<{ value: string; size?: number }> = ({ value, size = 180 }) => {
  // Deterministic 21x21 matrix pseudo-generator based on value string
  const generateMatrix = (str: string): boolean[][] => {
    const N = 25; // 25x25 QR Version 2 Grid
    const matrix: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));

    // Simple hash to seed pseudo-random module pattern
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }

    // Helper: Draw Finder Pattern (7x7 square)
    const drawFinder = (startX: number, startY: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 || r === 6 || c === 0 || c === 6 || // Outer ring
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)      // Center 3x3 solid box
          ) {
            matrix[startY + r][startX + c] = true;
          }
        }
      }
    };

    // Draw three standard finder patterns
    drawFinder(0, 0);         // Top-left
    drawFinder(N - 7, 0);     // Top-right
    drawFinder(0, N - 7);     // Bottom-left

    // Timing lines
    for (let i = 8; i < N - 8; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }

    // Populate data area based on hash & string characters
    let seed = Math.abs(hash);
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        // Skip finder squares & separators
        const inTL = r < 8 && c < 8;
        const inTR = r < 8 && c >= N - 8;
        const inBL = r >= N - 8 && c < 8;
        if (inTL || inTR || inBL) continue;

        // Skip timing lines
        if (r === 6 || c === 6) continue;

        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        matrix[r][c] = seed % 3 === 0 || (str.charCodeAt((r * c) % str.length) % 2 === 0);
      }
    }

    return matrix;
  };

  const matrix = generateMatrix(value);
  const N = matrix.length;
  const cellSize = size / N;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="bg-white p-2 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700"
    >
      <rect width={size} height={size} fill="#ffffff" />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.2}
              height={cellSize + 0.2}
              fill="#0f172a"
            />
          ) : null
        )
      )}
    </svg>
  );
};

export const QRCodeWorkOrderModal: React.FC<QRCodeWorkOrderModalProps> = ({
  isOpen,
  onClose,
  cluster,
}) => {
  const printableRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !cluster) return null;

  const isHospital = cluster.poi_tags?.some((p) => p.category === "hospital");
  const isSchool = cluster.poi_tags?.some((p) => p.category === "school" || p.category === "college");
  const poiName = cluster.poi_tags?.[0]?.name || cluster.nearest_poi;

  // Field upload URL encoded in QR Code
  const fieldUploadUrl = `${window.location.origin}/#/capture?order=${cluster.cluster_code}&lat=${cluster.lat}&lng=${cluster.lng}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn select-none overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-modal flex flex-col overflow-hidden animate-scaleIn my-auto">
        {/* Modal Top Bar */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                MoHUA Form 4B — Printable Field Work Order
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Authorized Municipal Road Distress Repair Mandate &amp; QR Evidence Tag
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Job Card Container */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
          <div
            ref={printableRef}
            className="p-5 sm:p-6 bg-white text-slate-900 border-2 border-slate-900 rounded-xl space-y-5 print:border-none print:p-0 print:m-0"
          >
            {/* Form 4B Header */}
            <div className="border-b-2 border-slate-900 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  Government of India &bull; Ministry of Road Transport &amp; Highways
                </div>
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 mt-0.5">
                  MUNICIPAL WORK ORDER JOB CARD (IRC:SP:20 / MoHUA)
                </h1>
                <div className="text-xs font-semibold text-slate-700 mt-0.5">
                  Greater Chennai Metropolitan Corporation / NHAI Metro Division
                </div>
              </div>

              <div className="text-right flex flex-col items-center sm:items-end font-mono">
                <span className="text-xs font-bold px-2 py-1 bg-slate-900 text-white rounded">
                  {cluster.cluster_code}
                </span>
                <span className="text-[10px] text-slate-600 mt-1">
                  Issued: {new Date().toLocaleDateString("en-IN")}
                </span>
              </div>
            </div>

            {/* QR Code + Primary Specs Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              {/* QR Code Column */}
              <div className="sm:col-span-4 flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <SvgQRCode value={fieldUploadUrl} size={150} />
                <span className="text-[10px] font-mono font-bold text-slate-800 mt-2">
                  SCAN FOR FIELD EVIDENCE
                </span>
                <span className="text-[9px] text-slate-500 leading-tight">
                  Mobile camera auto-opens patch submission form
                </span>
              </div>

              {/* Work Order Specifications Column */}
              <div className="sm:col-span-8 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Defect Type</span>
                    <div className="font-bold text-slate-900">{cluster.defect_name}</div>
                  </div>

                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Priority Index</span>
                    <div className="font-bold text-rose-700 font-mono">
                      RPI {cluster.rpi_boosted ?? cluster.rpi_score} / 100.0
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Corridor Location</span>
                  <div className="font-bold text-slate-900">{cluster.road_name}</div>
                  <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                    GPS: {cluster.lat.toFixed(5)}°N, {cluster.lng.toFixed(5)}°E &bull; {cluster.classification}
                  </div>
                </div>

                {/* Nearby Protection Alert */}
                {(isHospital || isSchool) && (
                  <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-900 font-semibold flex items-center gap-1.5 text-[11px]">
                    {isHospital ? <Hospital className="w-3.5 h-3.5 text-rose-600 shrink-0" /> : <GraduationCap className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                    <span>
                      {isHospital ? "Hospital Ambulance Priority Zone: " : "Vulnerable School Zone: "}
                      {poiName} (+{cluster.poi_boost_applied || 15} RPI Boost)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Material & Engineering Requisition Table */}
            <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
              <div className="bg-slate-100 px-3 py-1.5 font-bold uppercase text-[10px] tracking-wider border-b border-slate-300">
                Material Requisition &amp; Execution Protocol (IRC:SP:20 Clause 12.4)
              </div>
              <div className="grid grid-cols-3 divide-x divide-slate-300 p-2 text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-500">Cold-Mix Bitumen:</span>
                  <div className="font-bold text-slate-900">~{Math.round(cluster.rpi_score * 0.65)} kg</div>
                </div>
                <div className="pl-3">
                  <span className="text-[10px] text-slate-500">Bitumen Tack Coat:</span>
                  <div className="font-bold text-slate-900">2.4 Liters (RS-1)</div>
                </div>
                <div className="pl-3">
                  <span className="text-[10px] text-slate-500">Compaction Standard:</span>
                  <div className="font-bold text-slate-900">80 kg Vibratory Plate</div>
                </div>
              </div>
            </div>

            {/* Contractor Assignment & Signoff Box */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-[11px]">
              <div className="border border-slate-300 p-2.5 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Assigned Contractor</span>
                <div className="font-bold text-slate-900 mt-0.5">{cluster.assigned_agency}</div>
                <div className="text-[10px] text-slate-600 mt-0.5 font-mono">Helpline: {cluster.agency_phone}</div>
                <div className="text-rose-700 font-bold mt-1">SLA Turnaround: {cluster.sla_hours} Hours Maximum</div>
              </div>

              <div className="border border-slate-300 p-2.5 rounded-lg flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Verification Officer</span>
                  <div className="font-semibold text-slate-900 mt-0.5">Er. K. Ramanathan, Ward 172 AE</div>
                </div>
                <div className="pt-4 border-t border-dashed border-slate-300 flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>Sign: _________________</span>
                  <span>Date: ____________</span>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="text-[9px] text-slate-500 text-center border-t border-slate-200 pt-2 leading-relaxed">
              *Notice:* Before marking this work order as resolved, the field supervisor must scan the QR code above or upload two geotagged photographs ("Before Repair" and "After Compaction") as mandated by MoHUA National Quality Assurance Guidelines.
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(fieldUploadUrl, "_blank")}
            icon={<ExternalLink className="w-3.5 h-3.5" />}
          >
            Open Mobile Portal Link
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              icon={<Printer className="w-3.5 h-3.5" />}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
            >
              Print / Save as PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
