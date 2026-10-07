import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Clock, 
  CheckCircle2, 
  X, 
  Scale, 
  Printer,
  Award,
  AlertOctagon,
  FileText,
  Zap,
  ShieldAlert,
  ArrowDownRight,
  Receipt,
  RotateCcw,
  Sliders,
  DollarSign,
  ShieldCheck,
  Download
} from 'lucide-react';
import { HazardCluster } from '../../types';
import { api, ContractorAgency, AutoDebitRecord } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const INITIAL_CONTRACTORS: ContractorAgency[] = [
  {
    id: 'CTR-01',
    name: 'L&T Highways Infra Ltd',
    cin: 'U45203TN2008PLC069812',
    director: 'K. Rajasekaran (VP Infra)',
    assignedCorridor: 'GST Road Arterial (Airport to Tambaram, NH-32)',
    zone: 'Zone 12 (Alandur / Pallavaram)',
    securityDepositInr: 5000000,
    penaltiesDeductedInr: 45000,
    activeWorkOrders: 4,
    resolvedWorkOrders: 42,
    breachedWorkOrders: 1,
    onTimeSlaPct: 94.2,
    qualityScorePct: 96.5,
    compactionDensityGcm3: 2.38,
    warrantyExpiry: 'March 2028',
    debarmentRisk: 'Low',
  },
  {
    id: 'CTR-02',
    name: 'GMR Urban Highways Ltd',
    cin: 'U45201DL1996PLC077890',
    director: 'S. Narayanan (Project Director)',
    assignedCorridor: 'Anna Salai (Mount Road) CBD Corridor',
    zone: 'Zone 09 (Teynampet Central)',
    securityDepositInr: 5000000,
    penaltiesDeductedInr: 125000,
    activeWorkOrders: 7,
    resolvedWorkOrders: 28,
    breachedWorkOrders: 3,
    onTimeSlaPct: 78.4,
    qualityScorePct: 84.0,
    compactionDensityGcm3: 2.18,
    warrantyExpiry: 'November 2026',
    debarmentRisk: 'Medium',
  },
  {
    id: 'CTR-03',
    name: 'Tamil Nadu Road Dev Corp (TNRDC)',
    cin: 'U45203TN1998SGC040441',
    director: 'Er. V. Murugesan (Chief Engineer)',
    assignedCorridor: 'Old Mahabalipuram Road (OMR IT Expressway)',
    zone: 'TNRDC Special IT Corridor',
    securityDepositInr: 4000000,
    penaltiesDeductedInr: 20000,
    activeWorkOrders: 2,
    resolvedWorkOrders: 36,
    breachedWorkOrders: 0,
    onTimeSlaPct: 98.6,
    qualityScorePct: 98.1,
    compactionDensityGcm3: 2.42,
    warrantyExpiry: 'August 2029',
    debarmentRisk: 'Low',
  },
  {
    id: 'CTR-04',
    name: 'HCC - Hindustan Construction Co.',
    cin: 'L45200MH1926PLC001228',
    director: 'Ajit Gulabchand',
    assignedCorridor: 'Inner Ring Road / Jawaharlal Nehru Salai (Koyambedu to Guindy)',
    zone: 'Zone 10 (Kodambakkam)',
    securityDepositInr: 3000000,
    penaltiesDeductedInr: 280000,
    activeWorkOrders: 9,
    resolvedWorkOrders: 19,
    breachedWorkOrders: 5,
    onTimeSlaPct: 62.1,
    qualityScorePct: 71.5,
    compactionDensityGcm3: 2.05,
    warrantyExpiry: 'Expired / Review Pending',
    debarmentRisk: 'Critical Debarment Warning',
  },
  {
    id: 'CTR-05',
    name: 'Chettinad Road Buildtech JV',
    cin: 'U45201TN2012PTC085431',
    director: 'M. Annamalai (Chief Engineer)',
    assignedCorridor: 'Mount-Poonamallee High Road (Kathipara to Porur)',
    zone: 'Zone 12 (Alandur)',
    securityDepositInr: 2500000,
    penaltiesDeductedInr: 15000,
    activeWorkOrders: 3,
    resolvedWorkOrders: 25,
    breachedWorkOrders: 0,
    onTimeSlaPct: 92.0,
    qualityScorePct: 93.8,
    compactionDensityGcm3: 2.34,
    warrantyExpiry: 'January 2028',
    debarmentRisk: 'Low',
  },
];

const INITIAL_AUTO_DEBITS: AutoDebitRecord[] = [
  {
    id: 'AD-2026-081',
    timestamp: '2026-09-28 14:15 IST',
    contractorId: 'CTR-04',
    contractorName: 'HCC - Hindustan Construction Co.',
    corridor: 'Inner Ring Road (Koyambedu Flyover)',
    clusterCode: 'WO-2026-CHE-441',
    patrolBusId: 'BUS-MTC-19B',
    measuredGz: 1.44,
    thresholdGz: 1.30,
    penaltyDebitInr: 25000,
    remainingDepositInr: 2720000,
    pfmsTxnRef: 'PFMS/DLP-DEBIT/2026/0928-8812',
    clause: 'IRC:SP:20 Clause 14.2 / MoRTH Sec 3000 DLP Penalty',
    status: 'EXECUTED_VIA_PFMS',
    evidenceSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  },
  {
    id: 'AD-2026-079',
    timestamp: '2026-09-26 11:30 IST',
    contractorId: 'CTR-02',
    contractorName: 'GMR Urban Highways Ltd',
    corridor: 'Anna Salai (Teynampet Signal Approach)',
    clusterCode: 'WO-2026-CHE-219',
    patrolBusId: 'BUS-TN01-1042',
    measuredGz: 1.38,
    thresholdGz: 1.30,
    penaltyDebitInr: 25000,
    remainingDepositInr: 4875000,
    pfmsTxnRef: 'PFMS/DLP-DEBIT/2026/0926-4401',
    clause: 'IRC:SP:20 Clause 14.2 / MoRTH Sec 3000 DLP Penalty',
    status: 'EXECUTED_VIA_PFMS',
    evidenceSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
  }
];

interface ContractorSlaLedgerProps {
  clusters: HazardCluster[];
}

export const ContractorSlaLedger: React.FC<ContractorSlaLedgerProps> = ({ clusters }) => {
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [contractors, setContractors] = useState<ContractorAgency[]>(INITIAL_CONTRACTORS);
  const [autoDebits, setAutoDebits] = useState<AutoDebitRecord[]>(INITIAL_AUTO_DEBITS);
  const [selectedContractor, setSelectedContractor] = useState<ContractorAgency | null>(null);
  const [activeModal, setActiveModal] = useState<'penalty_notice' | 'completion_cert' | 'auto_debit_voucher' | null>(null);
  const [selectedClusterForCert, setSelectedClusterForCert] = useState<HazardCluster | null>(clusters[0] || null);
  const [selectedDebitRecord, setSelectedDebitRecord] = useState<AutoDebitRecord | null>(INITIAL_AUTO_DEBITS[0]);
  const [isSimulatingAutoDebit, setIsSimulatingAutoDebit] = useState<boolean>(false);
  const [activeViewTab, setActiveViewTab] = useState<'sla_table' | 'auto_debit_ledger'>('sla_table');

  useEffect(() => {
    api.getContractorLedger().then((data) => {
      if (data && data.length > 0) setContractors(data);
    }).catch(() => {});

    api.getContractorPenalties().then((data) => {
      if (data && data.length > 0) setAutoDebits(data);
    }).catch(() => {});
  }, []);

  const totalGrossBonds = contractors.reduce((acc, c) => acc + c.securityDepositInr, 0);
  const totalSecurityDeposits = contractors.reduce((acc, c) => acc + (c.securityDepositInr - c.penaltiesDeductedInr), 0);
  const totalPenaltiesCollected = contractors.reduce((acc, c) => acc + c.penaltiesDeductedInr, 0);
  const totalBreaches = contractors.reduce((acc, c) => acc + c.breachedWorkOrders, 0);
  const totalAutoDebitsInr = autoDebits.reduce((acc, d) => acc + d.penaltyDebitInr, 0);
  const criticalDebarmentCount = contractors.filter(c => c.debarmentRisk === 'Critical Debarment Warning').length;
  const netEscrowRatio = totalGrossBonds > 0 ? (totalSecurityDeposits / totalGrossBonds) * 100 : 0;

  const handleOpenPenaltyNotice = (ctr: ContractorAgency) => {
    setSelectedContractor(ctr);
    setActiveModal('penalty_notice');
  };

  const handleOpenCert = (ctr: ContractorAgency) => {
    setSelectedContractor(ctr);
    const related = clusters.find(c => c.assigned_agency?.toLowerCase().includes(ctr.name.toLowerCase().slice(0, 5))) || clusters[0];
    setSelectedClusterForCert(related || null);
    setActiveModal('completion_cert');
  };

  const handleOpenDebitVoucher = (record: AutoDebitRecord) => {
    setSelectedDebitRecord(record);
    const matchedCtr = contractors.find(c => c.id === record.contractorId) || contractors[0];
    setSelectedContractor(matchedCtr);
    setActiveModal('auto_debit_voucher');
  };

  // Instant Auto-Debit Trigger calling /api/contractors/penalties/auto-debit
  const handleSimulateClause14AutoDebit = async () => {
    if (isSimulatingAutoDebit) return;
    setIsSimulatingAutoDebit(true);

    const targetId = 'CTR-04';
    const debitAmount = 25000;
    const measuredShock = 1.48; // Gz > 1.30g trigger

    try {
      // Call backend auto-debit endpoint
      const clusterCode = `WO-2026-CHE-${Math.floor(500 + Math.random() * 400)}`;
      const result = await api.triggerAutoDebit({
        cluster_code: clusterCode,
        measured_gz: measuredShock,
        patrol_bus_id: 'BUS-MTC-19B'
      }).catch(() => null);

      const txnRef = result?.transaction_id || `PFMS/DLP-ESCROW/${Date.now().toString().slice(-8)}`;

      const newRecord: AutoDebitRecord = {
        id: `AD-2026-${Math.floor(100 + Math.random() * 900)}`,
        timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
        contractorId: targetId,
        contractorName: 'HCC - Hindustan Construction Co.',
        corridor: 'Inner Ring Road / Koyambedu Arterial',
        clusterCode: `WO-2026-CHE-${Math.floor(500 + Math.random() * 400)}`,
        patrolBusId: 'BUS-MTC-19B',
        measuredGz: measuredShock,
        thresholdGz: 1.30,
        penaltyDebitInr: debitAmount,
        remainingDepositInr: 2695000,
        pfmsTxnRef: txnRef,
        clause: 'IRC:SP:20 Clause 14.2 / MoRTH Sec 3000 DLP Penalty',
        status: 'EXECUTED_VIA_PFMS',
        evidenceSha256: '7f8a3c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      };

      // Update contractor state
      setContractors(prev => prev.map(c => {
        if (c.id === targetId) {
          return {
            ...c,
            penaltiesDeductedInr: c.penaltiesDeductedInr + debitAmount
          };
        }
        return c;
      }));

      setAutoDebits(prev => [newRecord, ...prev]);
      setSelectedDebitRecord(newRecord);
      setSelectedContractor(contractors.find(c => c.id === targetId) || contractors[0]);
      setIsSimulatingAutoDebit(false);
      setActiveModal('auto_debit_voucher');

      showSuccessToast(
        "IRC:SP:20 Clause 14 Auto-Debit Executed",
        `₹${debitAmount.toLocaleString('en-IN')} debited from HCC Escrow Guarantee. PFMS Txn: ${txnRef}`
      );
    } catch (err) {
      setIsSimulatingAutoDebit(false);
      showErrorToast("Auto-Debit Execution Failed", "Network timeout contacting municipal treasury gateway.");
    }
  };

  return (
    <div className="space-y-5 select-none">
      
      {/* HIGHLIGHTED TAXPAYER PROTECTION BANNER: IRC:SP:20 CLAUSE 14 AUTO-DEBIT */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-amber-950/40 border border-rose-500/40 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 font-mono text-[11px] font-bold flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-rose-400" />
                <span>IRC:SP:20 CLAUSE 14.2 &bull; AUTONOMOUS DLP PENALTY DEBIT</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10.5px] font-mono font-bold">
                100% TAXPAYER RECOVERY
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Automated Contractor Bank Guarantee Escrow Deductions
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When transit fleet buses re-cross repaired potholes and detect recurrent vertical shocks (<strong className="text-rose-400 font-mono">Gz &ge; 1.30g</strong>), RoadSaathi auto-debits <strong className="text-amber-300 font-mono">₹25,000</strong> per defect directly from the contractor's held Security Deposit without human bureaucratic delays.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <button
              onClick={handleSimulateClause14AutoDebit}
              disabled={isSimulatingAutoDebit}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isSimulatingAutoDebit ? 'animate-spin' : ''}`} />
              <span>{isSimulatingAutoDebit ? 'Patrol Bus Re-Pass Detecting Gz=1.48g...' : '⚡ Trigger Clause 14 Auto-Debit Demo'}</span>
            </button>
            <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-700/80 rounded-xl shadow-xs">
              <button
                onClick={() => setActiveViewTab('sla_table')}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  activeViewTab === 'sla_table'
                    ? 'font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-xs'
                    : 'font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                Performance SLA Table
              </button>
              <button
                onClick={() => setActiveViewTab('auto_debit_ledger')}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeViewTab === 'auto_debit_ledger'
                    ? 'font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-xs'
                    : 'font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <span>Auto-Debit Audit Docket</span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* High-Contrast Summary Metric Cards with Visual Health Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Bank Guarantees */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Tracked Bank Guarantees</span>
            <Scale className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            ₹{(totalGrossBonds / 10000000).toFixed(2)} Cr
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full w-full" />
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>5 Active Contractor Bonds &bull; Clause 108.4</span>
          </div>
        </div>

        {/* Card 2: Clause 14 Auto-Debits */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Clause 14 Auto-Debits Executed</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
            ₹{(totalPenaltiesCollected / 100000).toFixed(2)} Lakhs
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-rose-500 rounded-full" 
              style={{ width: `${Math.min(100, Math.max(5, (totalPenaltiesCollected / totalGrossBonds) * 100 * 10))}%` }}
            />
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
            <Receipt className="w-3 h-3" />
            <span>Recurrent sensor shock (Gz &ge; 1.30g)</span>
          </div>
        </div>

        {/* Card 3: Net Available Escrow Balance */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Net Available Escrow</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            ₹{(totalSecurityDeposits / 10000000).toFixed(2)} Cr
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full" 
              style={{ width: `${netEscrowRatio}%` }}
            />
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1.5 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Safety Margin: {netEscrowRatio.toFixed(1)}% Available</span>
          </div>
        </div>

        {/* Card 4: Contractor Debarment Risk Meter */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Debarment Risk Meter</span>
            <AlertOctagon className="w-4 h-4 text-rose-500 animate-pulse" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
            {criticalDebarmentCount} Critical Warning
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full w-4/5 animate-pulse" />
          </div>
          <div className="text-[11px] text-rose-500 font-medium mt-1.5 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
            <span>HCC at statutory limit &bull; Notice drafted</span>
          </div>
        </div>
      </div>

      {/* VIEW TAB 1: CONTRACTOR SLA LEDGER TABLE */}
      {activeViewTab === 'sla_table' ? (
        <div className="bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Contractor SLA Compliance &amp; Performance Ledger</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automated SLA tracking, liquidated damages accounting, and payment authorizations under MoRTH guidelines.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 font-semibold">
                MoRTH Clause 108.4 Active
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-semibold">
                IRC:SP:20 Clause 14 Active
              </span>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4">Contractor / Agency</th>
                  <th className="py-3 px-4">Assigned Corridor &amp; Zone</th>
                  <th className="py-3 px-4 text-right">Deposit Balance (Tracked)</th>
                  <th className="py-3 px-4 text-right">Penalties Deducted</th>
                  <th className="py-3 px-4 text-center">On-Time SLA</th>
                  <th className="py-3 px-4 text-center">Quality Index</th>
                  <th className="py-3 px-4 text-center">Breaches</th>
                  <th className="py-3 px-4 text-center">Debarment Risk Meter</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {contractors.map((ctr) => {
                  const currentBalance = ctr.securityDepositInr - ctr.penaltiesDeductedInr;
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
                        <div className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                          ₹{currentBalance.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Bond: ₹{(ctr.securityDepositInr / 100000).toFixed(0)}L
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className={`font-bold tabular-nums ${ctr.penaltiesDeductedInr > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                          {ctr.penaltiesDeductedInr > 0 ? `-₹${ctr.penaltiesDeductedInr.toLocaleString('en-IN')}` : '₹0'}
                        </div>
                        <div className="text-[10px] text-slate-400">Clause 14.2 &amp; SLA</div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 font-mono tabular-nums">
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
                        <span className="px-2 py-0.5 rounded-full font-bold font-mono text-[11px] tabular-nums bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
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

                      <td className="py-3.5 px-4 text-center">
                        {ctr.debarmentRisk === 'Critical Debarment Warning' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold font-mono text-[10.5px] bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 animate-pulse">
                            <AlertOctagon className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                            <span>Critical Warning</span>
                          </span>
                        ) : ctr.debarmentRisk === 'Medium' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold font-mono text-[10.5px] bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>Medium Risk</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium font-mono text-[10.5px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Low Risk</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isBreached && (
                            <button
                              onClick={() => handleOpenPenaltyNotice(ctr)}
                              className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-rose-600 hover:bg-rose-500 text-white transition shadow-xs flex items-center gap-1 cursor-pointer"
                              title="Generate and print Liquidated Damages Notice Draft"
                            >
                              <AlertOctagon className="w-3 h-3" />
                              <span>Notice</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenCert(ctr)}
                            className="px-2.5 py-1 rounded-lg font-semibold text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer"
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
      ) : (
        /* VIEW TAB 2: AUTONOMOUS CLAUSE 14 AUTO-DEBIT AUDIT TRAIL */
        <div className="bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-500" />
                <span>IRC:SP:20 Clause 14.2 &bull; Automated DLP Penalty Debit Ledger</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Zero-human-intervention liquidated damage debits executed against contractor escrow deposits upon recurrent transit sensor shock detection.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              Total Auto-Debited: ₹{totalAutoDebitsInr.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4">Debit ID &amp; Time</th>
                  <th className="py-3 px-4">Contractor Agency</th>
                  <th className="py-3 px-4">Corridor &amp; Ticket</th>
                  <th className="py-3 px-4 text-center">Sensor Re-Shock</th>
                  <th className="py-3 px-4 text-right">Auto-Debited Amount</th>
                  <th className="py-3 px-4">PFMS / Treasury Reference</th>
                  <th className="py-3 px-4 text-right">Voucher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {autoDebits.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{rec.id}</div>
                      <div className="text-[10px] text-slate-400">{rec.timestamp}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{rec.contractorName}</div>
                      <div className="text-[10px] text-slate-400">{rec.clause}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 dark:text-slate-200">{rec.corridor}</div>
                      <div className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">{rec.clusterCode}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold text-[11px] tabular-nums">
                        Gz={rec.measuredGz}g &gt; {rec.thresholdGz}g
                      </span>
                      <div className="text-[9.5px] text-slate-400 mt-0.5">{rec.patrolBusId}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                        -₹{rec.penaltyDebitInr.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">Escrow Debit</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[10.5px] text-slate-500 dark:text-slate-400">
                      <div>{rec.pfmsTxnRef}</div>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 text-[9px] font-bold">
                        PFMS SETTLED
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenDebitVoucher(rec)}
                        className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <FileText className="w-3 h-3 text-rose-500" />
                        <span>Voucher</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: CONTRACTOR LIQUIDATED DAMAGES NOTICE (DRAFT) */}
      {activeModal === 'penalty_notice' && selectedContractor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 bg-rose-50 dark:bg-rose-950/60">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-600" />
                <div>
                  <h3 className="text-sm font-bold text-rose-950 dark:text-rose-100">
                    MUNICIPAL CONTRACTOR LIQUIDATED DAMAGES NOTICE (DRAFT)
                  </h3>
                  <div className="text-[10px] font-mono text-rose-700 dark:text-rose-300">
                    GCC/HW/SLA-PENALTY/2026-089 • LIQUIDATED DAMAGES CLAUSE 108.4
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
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
                  Ripon Building, Chennai - 600003 | SLA Enforcement Draft Under MoRTH Guidelines
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
                  <span className="text-slate-400 block text-[10px] font-semibold">JURISDICTION &amp; CORRIDOR:</span>
                  <strong className="text-slate-900 dark:text-white">{selectedContractor.assignedCorridor}</strong>
                  <div className="text-[10px] text-slate-500">{selectedContractor.zone}</div>
                  <div className="text-[10px] text-rose-600 font-bold mt-1">
                    Active Breached Tickets: {selectedContractor.breachedWorkOrders} Overdue
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                  SLA Default &amp; Penalty Assessment Summary:
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
                    <span className="text-right font-bold text-rose-600 tabular-nums">₹19,000</span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 border-b border-slate-200 dark:border-slate-800">
                    <span>P1 Alligator Crack Resurfacing</span>
                    <span className="text-center text-rose-600 font-bold">+52 Hours Past SLA</span>
                    <span className="text-right font-bold text-rose-600 tabular-nums">₹26,000</span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 bg-rose-50/60 dark:bg-rose-950/40 font-bold text-slate-900 dark:text-white">
                    <span>TOTAL LIQUIDATED DAMAGES ASSESSED:</span>
                    <span className="text-center">Rate: ₹500/hr</span>
                    <span className="text-right text-rose-600 font-extrabold tabular-nums">-₹45,000</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Take notice that in accordance with MoRTH Standard Specifications Clause 108.4 and GCC Contract Agreement, the aforesaid sum is assessed against overdue repairs. You are directed to complete rectification within <strong>12 hours</strong> of this notice.
              </p>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <div>
                  <div>DIGITAL AUDIT STAMP: SHA-256: 7f8a3c...91b0</div>
                  <div>ISSUING AUTHORITY: Superintending Engineer (Highways), GCC</div>
                </div>
                <div className="p-2 rounded border border-rose-400 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold uppercase text-[9px]">
                  DRAFT NOTICE
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Notice Draft</span>
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer"
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
                    FORM IRC:SP:20 (2025 COMPLIANCE) &bull; CERT NO: GCC-QC-2026-8819
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-800 dark:text-slate-200 font-sans custom-scrollbar">
              <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="font-bold uppercase tracking-widest text-slate-900 dark:text-white text-xs">
                  GREATER CHENNAI CORPORATION &bull; QUALITY ASSURANCE WING
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Standard Pavement Rectification &amp; Defect Liability Warranty Certificate
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">ASSIGNED CONTRACTOR:</span>
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
                      src="/evidence/bus_pass_1_detect.jpg" 
                      alt="Before Repair"
                      className="w-full h-28 object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/evidence/bus_pass_1_impact.jpg";
                      }}
                    />
                    <div className="p-1.5 text-[10px] text-slate-300 font-mono flex items-center justify-between">
                      <span>Depth: 8.4cm</span>
                      <span className="text-rose-400 font-bold">Shock: +2.8g</span>
                    </div>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950">
                    <div className="p-1.5 bg-emerald-600 text-white font-mono text-[9px] font-bold text-center">
                      AFTER REPAIR (Hot-Mix DBM Compacted)
                    </div>
                    <img 
                      src="https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600" 
                      alt="After Repair"
                      className="w-full h-28 object-cover"
                    />
                    <div className="p-1.5 text-[10px] text-slate-300 font-mono flex items-center justify-between">
                      <span>Compaction: 98.4%</span>
                      <span className="text-emerald-400 font-bold">Shock: 0.98g (Smooth)</span>
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
                <div className="text-emerald-600 font-bold uppercase">SLA COMPLIANCE VERIFIED / PAYMENT AUTHORIZED</div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Certificate</span>
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
              >
                Authorize &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CLAUSE 14 AUTO-DEBIT TREASURY VOUCHER */}
      {activeModal === 'auto_debit_voucher' && selectedDebitRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 bg-rose-50 dark:bg-rose-950/60">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-600" />
                <div>
                  <h3 className="text-sm font-bold text-rose-950 dark:text-rose-100">
                    TREASURY AUTO-DEBIT PFMS VOUCHER
                  </h3>
                  <div className="text-[10px] font-mono text-rose-700 dark:text-rose-300">
                    TXN: {selectedDebitRecord.pfmsTxnRef} &bull; IRC:SP:20 CLAUSE 14.2
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-800 dark:text-slate-200 font-sans custom-scrollbar">
              <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="font-bold uppercase tracking-widest text-slate-900 dark:text-white text-xs">
                  MUNICIPAL TREASURY &amp; ESCROW SETTLEMENT ENGINE
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Automated Liquidated Damages Debit Settlement Docket
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">DEBITED CONTRACTOR:</span>
                  <strong className="text-slate-900 dark:text-white">{selectedDebitRecord.contractorName}</strong>
                  <div className="text-[10px] text-slate-500">{selectedDebitRecord.corridor}</div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">TICKET &amp; TIME:</span>
                  <strong className="text-slate-900 dark:text-white">{selectedDebitRecord.clusterCode}</strong>
                  <div className="text-[10px] text-slate-500">{selectedDebitRecord.timestamp}</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 font-mono space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 dark:text-slate-300">Measured Vertical Shock:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                    Gz = {selectedDebitRecord.measuredGz}g (Threshold: {selectedDebitRecord.thresholdGz}g)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 dark:text-slate-300">Reporting Transit Fleet Node:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedDebitRecord.patrolBusId}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-rose-200 dark:border-rose-800/60">
                  <span className="font-bold text-slate-900 dark:text-white">Amount Auto-Debited:</span>
                  <span className="font-extrabold text-rose-600 dark:text-rose-400 text-sm tabular-nums">
                    -₹{selectedDebitRecord.penaltyDebitInr.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-[10.5px] font-mono text-slate-500">
                <div>EVIDENCE HASH: SHA-256: {selectedDebitRecord.evidenceSha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</div>
                <div>STATUS: EXECUTED_VIA_PFMS &bull; AUDIT TRAIL LOGGED</div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PFMS Voucher</span>
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
              >
                Close Voucher
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
