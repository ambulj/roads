import React, { useState } from 'react';
import { 
  Building2, 
  Clock, 
  CheckCircle2, 
  X, 
  Scale, 
  Printer,
  Award,
  AlertOctagon,
  FileText
} from 'lucide-react';
import { HazardCluster } from '../../types';

interface ContractorAgency {
  id: string;
  name: string;
  cin: string;
  director: string;
  assignedCorridor: string;
  zone: string;
  escrowDepositInr: number;
  penaltiesDeductedInr: number;
  pendingInvoicesInr: number;
  qualityScorePct: number;
  onTimeSlaPct: number;
  activeWorkOrders: number;
  breachedWorkOrders: number;
  contactPhone: string;
}

const INITIAL_CONTRACTORS: ContractorAgency[] = [
  {
    id: 'ctr-01',
    name: 'L&T Highways Infra Ltd',
    cin: 'U45203TN2008PLC069812',
    director: 'K. Rajasekaran, VP Infra',
    assignedCorridor: 'GST Road, Tambaram (NH-32)',
    zone: 'Zone 12 & 14 (Southern Radials)',
    escrowDepositInr: 5000000,
    penaltiesDeductedInr: 45000,
    pendingInvoicesInr: 485000,
    qualityScorePct: 94.2,
    onTimeSlaPct: 91.5,
    activeWorkOrders: 4,
    breachedWorkOrders: 1,
    contactPhone: '+91 98401 22345'
  },
  {
    id: 'ctr-02',
    name: 'GMR Urban Highways Ltd',
    cin: 'U45201DL1996PLC077890',
    director: 'S. Narayanan, Project Dir',
    assignedCorridor: 'Anna Salai (Mount Road) CBD',
    zone: 'Zone 09 (Teynampet Central)',
    escrowDepositInr: 5000000,
    penaltiesDeductedInr: 125000,
    pendingInvoicesInr: 320000,
    qualityScorePct: 88.0,
    onTimeSlaPct: 82.4,
    activeWorkOrders: 3,
    breachedWorkOrders: 2,
    contactPhone: '+91 98840 77890'
  },
  {
    id: 'ctr-03',
    name: 'Tamil Nadu Road Dev Corp (TNRDC)',
    cin: 'U45203TN1998SGC040441',
    director: 'Er. V. Murugesan, CE',
    assignedCorridor: 'Old Mahabalipuram Road (OMR IT Expressway)',
    zone: 'TNRDC Special IT Corridor',
    escrowDepositInr: 4000000,
    penaltiesDeductedInr: 20000,
    pendingInvoicesInr: 610000,
    qualityScorePct: 96.5,
    onTimeSlaPct: 95.8,
    activeWorkOrders: 2,
    breachedWorkOrders: 0,
    contactPhone: '+91 94440 99881'
  },
  {
    id: 'ctr-04',
    name: 'Chettinad Road Infra Pvt Ltd',
    cin: 'U45200TN2012PTC085112',
    director: 'M. Annamalai, Managing Partner',
    assignedCorridor: 'Guindy Kathipara Grade Junction',
    zone: 'Zone 13 (Adyar/Guindy)',
    escrowDepositInr: 3000000,
    penaltiesDeductedInr: 85000,
    pendingInvoicesInr: 195000,
    qualityScorePct: 83.5,
    onTimeSlaPct: 78.0,
    activeWorkOrders: 5,
    breachedWorkOrders: 2,
    contactPhone: '+91 97900 88990'
  },
  {
    id: 'ctr-05',
    name: 'Chennai Corp Zone 10 (Kodambakkam)',
    cin: 'GCC-MUNICIPAL-DIRECT-2025',
    director: 'Er. T. Gomathy, Executive Engineer',
    assignedCorridor: 'T. Nagar Usman Road Commercial Link',
    zone: 'Zone 10 (Kodambakkam / T.Nagar)',
    escrowDepositInr: 2500000,
    penaltiesDeductedInr: 0,
    pendingInvoicesInr: 140000,
    qualityScorePct: 92.0,
    onTimeSlaPct: 94.0,
    activeWorkOrders: 2,
    breachedWorkOrders: 0,
    contactPhone: '+91 94451 90010'
  }
];

interface ContractorEscrowLedgerProps {
  clusters: HazardCluster[];
}

export const ContractorEscrowLedger: React.FC<ContractorEscrowLedgerProps> = ({ clusters }) => {
  const [contractors] = useState<ContractorAgency[]>(INITIAL_CONTRACTORS);
  const [selectedContractor, setSelectedContractor] = useState<ContractorAgency | null>(null);
  const [activeModal, setActiveModal] = useState<'penalty_summons' | 'completion_cert' | null>(null);
  const [selectedClusterForCert, setSelectedClusterForCert] = useState<HazardCluster | null>(clusters[0] || null);

  const totalEscrowHeld = contractors.reduce((acc, c) => acc + (c.escrowDepositInr - c.penaltiesDeductedInr), 0);
  const totalPenaltiesCollected = contractors.reduce((acc, c) => acc + c.penaltiesDeductedInr, 0);
  const totalBreaches = contractors.reduce((acc, c) => acc + c.breachedWorkOrders, 0);

  const handleOpenPenaltySummons = (ctr: ContractorAgency) => {
    setSelectedContractor(ctr);
    setActiveModal('penalty_summons');
  };

  const handleOpenCert = (ctr: ContractorAgency) => {
    setSelectedContractor(ctr);
    const related = clusters.find(c => c.assigned_agency?.toLowerCase().includes(ctr.name.toLowerCase().slice(0, 5))) || clusters[0];
    setSelectedClusterForCert(related || null);
    setActiveModal('completion_cert');
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Overview Metric Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            <span>Municipal Escrow Vault</span>
            <Scale className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            ₹{(totalEscrowHeld / 100000).toFixed(1)}L
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>5 Active Contractor Security Bonds</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            <span>Liquidated Damages Deducted</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
            ₹{totalPenaltiesCollected.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Statutory ₹500/hr late penalty applied
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            <span>Active SLA Breaches</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            {totalBreaches} Overdue
          </div>
          <div className="text-[11px] text-rose-500 font-medium mt-1">
            Immediate Liquidated Damages Active
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            <span>Avg Quality & Audit Index</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
            90.8%
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            IRC:SP:20 Compaction Compliance
          </div>
        </div>
      </div>

      {/* Contractor Performance & Escrow Table */}
      <div className="bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Contractor Performance & Smart Escrow Ledger</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated SLA enforcement, liquidated damage deductions, and escrow releases under Tamil Nadu Transparency in Tenders Act.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 font-semibold">
              MoRTH Clause 108.4 Active
            </span>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Contractor / Agency</th>
                <th className="py-3 px-4">Assigned Corridor & Zone</th>
                <th className="py-3 px-4 text-right">Escrow Balance</th>
                <th className="py-3 px-4 text-right">Penalties Deducted</th>
                <th className="py-3 px-4 text-center">On-Time SLA</th>
                <th className="py-3 px-4 text-center">Quality Index</th>
                <th className="py-3 px-4 text-center">Breaches</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {contractors.map((ctr) => {
                const currentBalance = ctr.escrowDepositInr - ctr.penaltiesDeductedInr;
                const isBreached = ctr.breachedWorkOrders > 0;

                return (
                  <tr key={ctr.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{ctr.name}</div>
                      <div className="text-[10.5px] font-mono text-slate-400">{ctr.cin}</div>
                      <div className="text-[10px] text-slate-500">Rep: {ctr.director}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{ctr.assignedCorridor}</div>
                      <div className="text-[10.5px] text-slate-400">{ctr.zone}</div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        ₹{currentBalance.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Deposit: ₹{(ctr.escrowDepositInr / 100000).toFixed(0)}L
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className={`font-bold ${ctr.penaltiesDeductedInr > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                        {ctr.penaltiesDeductedInr > 0 ? `-₹${ctr.penaltiesDeductedInr.toLocaleString('en-IN')}` : '₹0'}
                      </div>
                      <div className="text-[10px] text-slate-400">₹500/hr late rate</div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {ctr.onTimeSlaPct}%
                      </div>
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mt-1 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${ctr.onTimeSlaPct >= 90 ? 'bg-emerald-500' : ctr.onTimeSlaPct >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${ctr.onTimeSlaPct}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full font-bold font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {ctr.qualityScorePct}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {isBreached ? (
                        <span className="px-2 py-0.5 rounded-md font-bold font-mono text-[10.5px] bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 animate-pulse">
                          {ctr.breachedWorkOrders} Breached
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md font-medium text-[10.5px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                          All On-Time
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isBreached && (
                          <button
                            onClick={() => handleOpenPenaltySummons(ctr)}
                            className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-rose-600 hover:bg-rose-500 text-white transition shadow-xs flex items-center gap-1"
                            title="Generate and print official Liquidated Damages Summons"
                          >
                            <AlertOctagon className="w-3 h-3" />
                            <span>Summons</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenCert(ctr)}
                          className="px-2.5 py-1 rounded-lg font-semibold text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                          title="View / issue IRC:SP:20 Work Completion Certificate"
                        >
                          <FileText className="w-3 h-3 text-blue-500" />
                          <span>Cert</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CONTRACTOR PENALTY SUMMONS (PRINTABLE LEGAL NOTICE) */}
      {activeModal === 'penalty_summons' && selectedContractor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 bg-rose-50 dark:bg-rose-950/60">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-600" />
                <div>
                  <h3 className="text-sm font-bold text-rose-950 dark:text-rose-100">
                    MUNICIPAL CONTRACTOR PENALTY SUMMONS
                  </h3>
                  <div className="text-[10px] font-mono text-rose-700 dark:text-rose-300">
                    GCC/HW/SLA-PENALTY/2026-089 • LIQUIDATED DAMAGES CLAUSE 108.4
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-800 dark:text-slate-200 font-sans custom-scrollbar">
              <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="font-bold uppercase tracking-widest text-slate-900 dark:text-white text-xs">
                  GREATER CHENNAI CORPORATION • SPECIAL HIGHWAYS DIVISION
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Ripon Building, Chennai - 600003 | Statutory Enforcement Under Tamil Nadu Tenders Act
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">SERVED TO CONTRACTOR:</span>
                  <strong className="text-slate-900 dark:text-white">{selectedContractor.name}</strong>
                  <div className="text-[10px] font-mono text-slate-500">CIN: {selectedContractor.cin}</div>
                  <div className="text-[10px] text-slate-500">Attn: {selectedContractor.director}</div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">JURISDICTION & CORRIDOR:</span>
                  <strong className="text-slate-900 dark:text-white">{selectedContractor.assignedCorridor}</strong>
                  <div className="text-[10px] text-slate-500">{selectedContractor.zone}</div>
                  <div className="text-[10px] text-rose-600 font-bold mt-1">
                    Active Breached Tickets: {selectedContractor.breachedWorkOrders} Overdue
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                  SLA Default & Escrow Deduction Summary:
                </h4>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden font-mono text-[11px]">
                  <div className="grid grid-cols-3 p-2.5 bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <span>Default Category</span>
                    <span className="text-center">Overdue Duration</span>
                    <span className="text-right">Penalty Assessed</span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 border-b border-slate-200 dark:border-slate-800">
                    <span>P0 Emergency Pothole (24h SLA)</span>
                    <span className="text-center text-rose-600 font-bold">+38 Hours Past SLA</span>
                    <span className="text-right font-bold text-rose-600">₹19,000</span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 border-b border-slate-200 dark:border-slate-800">
                    <span>P1 Alligator Crack Resurfacing</span>
                    <span className="text-center text-rose-600 font-bold">+52 Hours Past SLA</span>
                    <span className="text-right font-bold text-rose-600">₹26,000</span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 bg-rose-50/60 dark:bg-rose-950/40 font-bold text-slate-900 dark:text-white">
                    <span>TOTAL DEDUCTION FROM ESCROW:</span>
                    <span className="text-center">Rate: ₹500/hr</span>
                    <span className="text-right text-rose-600 font-extrabold">-₹45,000</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Take notice that in accordance with MoRTH Standard Specifications Clause 108.4 and GCC Contract Agreement, the aforesaid sum has been automatically debited from your Smart Escrow Retention Account. You are directed to complete rectification within <strong>12 hours</strong> of this notice, failing which debarment proceedings under Section 11 of the TNTT Act shall be initiated.
              </p>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <div>
                  <div>DIGITAL AUDIT STAMP: SHA-256: 7f8a3c...91b0</div>
                  <div>ISSUING AUTHORITY: Superintending Engineer (Highways), GCC</div>
                </div>
                <div className="p-2 rounded border border-rose-400 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold uppercase text-[9px]">
                  LEGALLY ENFORCEABLE
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Summons</span>
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
              >
                Close &amp; File in Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: WORK COMPLETION & QUALITY CERTIFICATE */}
      {activeModal === 'completion_cert' && selectedContractor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 bg-emerald-50 dark:bg-emerald-950/60">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                    MUNICIPAL WORK COMPLETION &amp; QUALITY CERTIFICATE
                  </h3>
                  <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
                    FORM IRC:SP:20 (2025 COMPLIANCE) • CERT NO: GCC-QC-2026-8819
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-800 dark:text-slate-200 font-sans custom-scrollbar">
              <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="font-bold uppercase tracking-widest text-slate-900 dark:text-white text-xs">
                  GREATER CHENNAI CORPORATION • QUALITY ASSURANCE WING
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Standard Pavement Rectification &amp; Defect Liability Warranty Certificate
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">CERTIFIED CONTRACTOR:</span>
                  <strong className="text-slate-900 dark:text-white">{selectedContractor.name}</strong>
                  <div className="text-[10px] font-mono text-slate-500">CIN: {selectedContractor.cin}</div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">CORRIDOR &amp; WORK ORDER:</span>
                  <strong className="text-slate-900 dark:text-white">{selectedContractor.assignedCorridor}</strong>
                  <div className="text-[10px] font-mono text-emerald-600 font-bold">
                    Ticket ID: {selectedClusterForCert?.cluster_code || 'WO-0004'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                  Dual Photo Evidence &amp; Sensor Re-Pass Verification:
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950">
                    <div className="p-1.5 bg-rose-600 text-white font-mono text-[9px] font-bold text-center">
                      BEFORE REPAIR (Initial Pothole Defect)
                    </div>
                    <img 
                      src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600" 
                      alt="Before Repair"
                      className="w-full h-28 object-cover"
                    />
                    <div className="p-1.5 text-[10px] text-slate-300 font-mono flex items-center justify-between">
                      <span>Depth: 8.4cm</span>
                      <span className="text-rose-400">Shock: +2.8g</span>
                    </div>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950">
                    <div className="p-1.5 bg-emerald-600 text-white font-mono text-[9px] font-bold text-center">
                      AFTER REPAIR (Hot-Mix DBM Compacted)
                    </div>
                    <img 
                      src="https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600" 
                      alt="After Repair"
                      className="w-full h-28 object-cover"
                    />
                    <div className="p-1.5 text-[10px] text-slate-300 font-mono flex items-center justify-between">
                      <span>Compaction: 98.4%</span>
                      <span className="text-emerald-400">Shock: 0.98g (Smooth)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1.5 text-[11px]">
                <div className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Verified Specifications under IRC:SP:20:</span>
                </div>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-0.5 text-[10.5px]">
                  <li>Dense Bituminous Macadam (DBM) grade: VG-30 hot-mix asphalt (126 kg installed).</li>
                  <li>Tack coat RS-1 applied to cavity edges; 8-ton vibratory roller compaction verified.</li>
                  <li>Bus fleet re-pass IMU confirms vertical acceleration dropped from 2.8g to 0.98g.</li>
                  <li>3-Year Defect Liability Warranty active until September 2029.</li>
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <div>ISSUED BY: Executive Engineer, Quality Control Wing, GCC</div>
                <div className="text-emerald-600 font-bold uppercase">ESCROW RELEASE APPROVED</div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Certificate</span>
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
              >
                Approve Invoice &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
