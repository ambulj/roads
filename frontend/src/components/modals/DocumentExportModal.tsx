import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  ShieldAlert, 
  Building2, 
  Calendar, 
  Clock, 
  MapPin, 
  QrCode, 
  AlertTriangle, 
  CheckCircle2, 
  Stamp,
  Award
} from 'lucide-react';
import { HazardCluster, TrafficIncident } from '../../types';

interface DocumentExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType?: 'CONTRACTOR_SUMMONS' | 'POLICE_ECHALLAN' | 'MUNICIPAL_AUDIT';
  targetCluster?: HazardCluster | null;
  targetIncident?: TrafficIncident | null;
}

export const DocumentExportModal: React.FC<DocumentExportModalProps> = ({
  isOpen,
  onClose,
  documentType = 'CONTRACTOR_SUMMONS',
  targetCluster,
  targetIncident
}) => {
  const [activeDoc, setActiveDoc] = useState<'CONTRACTOR_SUMMONS' | 'POLICE_ECHALLAN' | 'MUNICIPAL_AUDIT'>(documentType);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Statutory Document &amp; Summons Generator
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                MoHUA / MoRTH / GCC Official Formats with Cryptographic Verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Selector Pills */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 py-2 bg-slate-100/50 dark:bg-slate-900/50 gap-2 print:hidden">
          <button
            onClick={() => setActiveDoc('CONTRACTOR_SUMMONS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeDoc === 'CONTRACTOR_SUMMONS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Contractor SLA Penalty Summons
          </button>
          <button
            onClick={() => setActiveDoc('POLICE_ECHALLAN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeDoc === 'POLICE_ECHALLAN'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Traffic Police MVA E-Challan
          </button>
          <button
            onClick={() => setActiveDoc('MUNICIPAL_AUDIT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeDoc === 'MUNICIPAL_AUDIT'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Weekly Municipal Pavement Audit
          </button>
        </div>

        {/* Printable Paper Canvas Container */}
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-200/50 dark:bg-slate-950 flex justify-center">
          
          {/* Printable Sheet */}
          <div className="w-full max-w-[760px] bg-white text-slate-900 p-8 rounded-2xl shadow-xl border border-slate-300 print:shadow-none print:border-none print:p-0 font-serif leading-relaxed text-xs">
            
            {/* 1. CONTRACTOR SUMMONS */}
            {activeDoc === 'CONTRACTOR_SUMMONS' && (
              <div className="space-y-5">
                {/* Government Header */}
                <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                  <div className="flex items-center justify-center gap-2 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
                    <Building2 className="w-4 h-4" />
                    <span>Greater Chennai Corporation &bull; Special Projects Engineering Wing</span>
                  </div>
                  <h1 className="text-base font-extrabold uppercase tracking-tight text-slate-900">
                    Statutory Notice of Liquidated Damages &amp; Escrow Debit
                  </h1>
                  <p className="text-[10px] font-mono text-slate-600">
                    Issued under MoHUA IRC:SP:20 Clause 14.2 &amp; Tamil Nadu Transparency in Tenders Act
                  </p>
                </div>

                {/* Dossier Metadata Grid */}
                <div className="grid grid-cols-2 gap-4 border border-slate-300 p-3.5 bg-slate-50 rounded-xl font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Notice Reference:</span>
                    <strong className="text-slate-900 font-bold">GCC/ENG/SLA-2026/WO-0001</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Date of Issue:</span>
                    <strong className="text-slate-900 font-bold">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Assigned Contractor:</span>
                    <strong className="text-slate-900 font-bold">{targetCluster?.assigned_agency || 'L&T Highways Infra Ltd'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Corridor Location:</span>
                    <strong className="text-slate-900 font-bold">{targetCluster?.road_name || 'GST Road, Tambaram (NH-32)'}</strong>
                  </div>
                </div>

                {/* Penalty Details */}
                <div className="space-y-2">
                  <h3 className="font-bold font-sans text-xs uppercase tracking-wider border-b pb-1">
                    1. Breach Findings &amp; Ground-Truth Evidence
                  </h3>
                  <p className="text-justify text-slate-700 leading-normal">
                    RoadSaarthi Multi-Bus Consensus System has verified persistent road distress <strong className="font-mono font-bold">{targetCluster?.defect_name || 'D40 Pothole Cavity'}</strong> (Ground Truth ID: <code className="font-bold">{targetCluster?.cluster_code || 'WO-0001'}</code>) at coordinates <code className="font-bold">[{targetCluster?.lat || 12.9516}, {targetCluster?.lng || 80.1462}]</code> with {targetCluster?.pass_count || 7} verified fleet passes.
                  </p>
                  <p className="text-justify text-slate-700 leading-normal">
                    The statutory emergency repair SLA of <strong>{targetCluster?.sla_hours || 24} Hours</strong> has been breached without municipal engineer closure certification.
                  </p>
                </div>

                {/* Escrow Debit Calculation Table */}
                <table className="w-full border-collapse border border-slate-400 font-mono text-[10.5px]">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-400 p-2 text-left">Statutory Clause</th>
                      <th className="border border-slate-400 p-2 text-left">Description</th>
                      <th className="border border-slate-400 p-2 text-right">Debit Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-400 p-2">IRC:SP:20 Cl. 14.2</td>
                      <td className="border border-slate-400 p-2">Defect Liability Guarantee Breach Penalty</td>
                      <td className="border border-slate-400 p-2 text-right font-bold">₹25,000</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2">MoRTH Sec 500</td>
                      <td className="border border-slate-400 p-2">Liquidated Damages (Late Dispatch Fee @ ₹500/hr)</td>
                      <td className="border border-slate-400 p-2 text-right font-bold">₹6,000</td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={2} className="border border-slate-400 p-2 text-right">TOTAL ESCROW DEDUCTION:</td>
                      <td className="border border-slate-400 p-2 text-right text-rose-700 font-bold text-xs">₹31,000</td>
                    </tr>
                  </tbody>
                </table>

                {/* Statutory Signatures & Stamp */}
                <div className="pt-6 flex items-end justify-between border-t border-slate-300 font-sans">
                  <div className="space-y-1">
                    <div className="w-16 h-16 border-2 border-slate-400 rounded-lg flex items-center justify-center p-1 text-[9px] font-mono text-center text-slate-500">
                      [DIGITAL QR VERIFY]
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Hash: 0x9f82...a41c</span>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-bold text-slate-900">Executive Engineer (Works)</div>
                    <div className="text-[11px] text-slate-600">Greater Chennai Corporation</div>
                    <div className="text-[10px] text-emerald-700 font-mono font-semibold">✓ Digitally Signed &amp; Escrow Locked</div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. POLICE MVA E-CHALLAN */}
            {activeDoc === 'POLICE_ECHALLAN' && (
              <div className="space-y-5">
                {/* Police Header */}
                <div className="text-center border-b-2 border-rose-900 pb-4 space-y-1">
                  <div className="flex items-center justify-center gap-2 text-rose-800 font-bold uppercase tracking-wider text-[11px]">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Greater Chennai Traffic Police &bull; Automated ANPR Enforcement Wing</span>
                  </div>
                  <h1 className="text-base font-extrabold uppercase tracking-tight text-slate-900">
                    Motor Vehicles Act (MVA) Electronic Traffic Summons
                  </h1>
                  <p className="text-[10px] font-mono text-slate-600">
                    Automated Camera Evidence Docket under Section 136A &amp; Rule 167A CMVR 1989
                  </p>
                </div>

                {/* Violation Box */}
                <div className="bg-rose-50 border border-rose-300 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-rose-700 font-bold uppercase block">Vehicle Registration Number:</span>
                    <span className="text-xl font-extrabold font-mono text-slate-900 tracking-wider">
                      {targetIncident?.plate_number || 'TN-09-CB-4412'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-rose-700 font-bold uppercase block">Statutory Fine:</span>
                    <span className="text-xl font-extrabold font-mono text-rose-700">
                      ₹{targetIncident?.fine_amount_inr?.toLocaleString() || '10,000'}
                    </span>
                  </div>
                </div>

                {/* Evidence Grid */}
                <div className="grid grid-cols-2 gap-3 border border-slate-300 p-3.5 bg-slate-50 rounded-xl font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Challan Docket No:</span>
                    <strong>{targetIncident?.echallan_id || 'ECH-CH-2026-99042'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Detection Time:</span>
                    <strong>{targetIncident?.occurred_at || '5 Sept, 05:12 am'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">MVA Statutory Clause:</span>
                    <strong>{targetIncident?.mva_section || 'MVA 1988 Sec 134(a)(b) & Sec 184 (Hit & Run)'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Reporting Bus Sensor:</span>
                    <strong>{targetIncident?.reporting_bus_id || 'BUS-TN01-1042'}</strong>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-bold font-sans text-xs uppercase tracking-wider border-b pb-1">
                    Offence Description &amp; Interceptor Directive
                  </h3>
                  <p className="text-justify text-slate-700 leading-normal">
                    {targetIncident?.description || 'High-speed reckless driving detected across zebra crossing in hospital safety zone. Video frame analysis confirmed plate recognition confidence of 96.4% with automatic 112 PCR dispatch.'}
                  </p>
                </div>

                {/* Footer QR & Payment Notice */}
                <div className="pt-4 flex items-center justify-between border-t border-slate-300 font-sans">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-800">Pay Online via MoRTH Parivahan eChallan Portal</p>
                    <p className="text-[10px] text-slate-500 font-mono">Notice must be settled within 14 days to prevent RTO blacklisting</p>
                  </div>
                  <div className="text-right font-mono text-[10px] font-bold text-slate-700">
                    GREATER CHENNAI TRAFFIC POLICE
                  </div>
                </div>
              </div>
            )}

            {/* 3. MUNICIPAL AUDIT DOSSIER */}
            {activeDoc === 'MUNICIPAL_AUDIT' && (
              <div className="space-y-5">
                <div className="text-center border-b-2 border-blue-900 pb-4 space-y-1">
                  <div className="flex items-center justify-center gap-2 text-blue-800 font-bold uppercase tracking-wider text-[11px]">
                    <Award className="w-4 h-4" />
                    <span>Greater Chennai Corporation &bull; Municipal Works Department</span>
                  </div>
                  <h1 className="text-base font-extrabold uppercase tracking-tight text-slate-900">
                    Weekly Metropolitan Pavement Health &amp; Durability Scorecard
                  </h1>
                  <p className="text-[10px] font-mono text-slate-600">
                    Consolidated Autonomous Bus Fleet Telemetry &bull; Period: {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </p>
                </div>

                {/* High-level KPI Ribbon */}
                <div className="grid grid-cols-4 gap-2 text-center font-mono">
                  <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Total Ingests</span>
                    <strong className="text-sm font-bold text-slate-900">4,290</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">DBSCAN Clusters</span>
                    <strong className="text-sm font-bold text-slate-900">9 Active</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Durability Score</span>
                    <strong className="text-sm font-bold text-emerald-700">83.8%</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Escrow Penalties</span>
                    <strong className="text-sm font-bold text-rose-700">₹70,000</strong>
                  </div>
                </div>

                {/* Corridor Breakdown */}
                <div className="space-y-2">
                  <h3 className="font-bold font-sans text-xs uppercase tracking-wider border-b pb-1">
                    Key Monitored Corridors
                  </h3>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="p-2 bg-slate-50 border rounded flex justify-between">
                      <span>Grand Southern Trunk Road (NH-45 GST) &bull; 18.4 km</span>
                      <strong className="text-emerald-700">Health: 74/100 (4 Active WOs)</strong>
                    </div>
                    <div className="p-2 bg-slate-50 border rounded flex justify-between">
                      <span>Rajiv Gandhi IT Expressway (OMR) &bull; 21.0 km</span>
                      <strong className="text-emerald-700">Health: 86/100 (2 Active WOs)</strong>
                    </div>
                    <div className="p-2 bg-slate-50 border rounded flex justify-between">
                      <span>Kathipara Interchange &amp; Inner Ring Road &bull; 8.6 km</span>
                      <strong className="text-amber-700">Health: 68/100 (6 Active WOs)</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex justify-between items-end border-t border-slate-300 text-[11px]">
                  <div>
                    <p className="font-bold">Autonomous Sensor Network Fix: 5Hz GNSS</p>
                    <p className="text-slate-500 font-mono text-[10px]">Verified across MTC Fleet Buses #1042, #3891, #2098</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">Superintending Engineer</p>
                    <p className="text-slate-500 text-[10px]">Greater Chennai Corporation</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
