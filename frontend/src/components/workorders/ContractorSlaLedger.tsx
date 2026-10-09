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
  Download,
  Filter,
  Check,
  FileCheck
} from 'lucide-react';
import { HazardCluster } from '../../types';
import { api, ContractorAgency, AutoDebitRecord, Form14NoticeRecord } from '../../services/api';
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
    dlpMonths: 36,
    dlpTierMonths: 36,
    contractType: 'Bituminous Macadam / Arterial'
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
    dlpMonths: 36,
    dlpTierMonths: 36,
    contractType: 'Bituminous Macadam / Arterial'
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
    dlpMonths: 60,
    dlpTierMonths: 60,
    contractType: 'Rigid Pavement / PQC'
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
    dlpMonths: 12,
    dlpTierMonths: 12,
    contractType: 'Surface Dressing / Overlay'
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
    dlpMonths: 36,
    dlpTierMonths: 36,
    contractType: 'Bituminous Macadam / Arterial'
  },
];

const INITIAL_AUTO_DEBITS: AutoDebitRecord[] = [
  {
    id: 'SCN-2026-081',
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
    clause: 'Contractual DLP Clause & Section 63/65B BSA 2023',
    status: 'UNDER_NOTICE_7D_CURE',
    evidenceSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    noticeDocketNo: 'GCC/HW/FORM-14/2026/0928-081',
    cureDeadline: '2026-10-05 14:15 IST',
    section65bCertId: 'CERT-BSA2023-2026-081',
    dlpTierMonths: 12,
  },
  {
    id: 'SCN-2026-079',
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
    clause: 'Contractual DLP Clause & Section 63/65B BSA 2023',
    status: 'NOTICE_SERVED',
    evidenceSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    noticeDocketNo: 'GCC/HW/FORM-14/2026/0926-079',
    cureDeadline: '2026-10-03 11:30 IST',
    section65bCertId: 'CERT-BSA2023-2026-079',
    dlpTierMonths: 36,
    eeSignoffBy: 'Er. S. Meenakshi Sundaram (EE Highways)',
    eeSignoffAt: '2026-09-26 14:00 IST'
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
  const [isSimulatingNotice, setIsSimulatingNotice] = useState<boolean>(false);
  const [activeViewTab, setActiveViewTab] = useState<'sla_table' | 'auto_debit_ledger'>('sla_table');
  const [dlpFilter, setDlpFilter] = useState<'all' | '12' | '36' | '60'>('all');
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [isEnforcing, setIsEnforcing] = useState<boolean>(false);

  useEffect(() => {
    api.getContractorLedger().then((data) => {
      if (data && data.length > 0) setContractors(data);
    }).catch(() => {});

    api.getContractorPenalties().then((data) => {
      if (data && data.length > 0) setAutoDebits(data);
    }).catch(() => {});
  }, []);

  // Listen for Copilot Form 14 Notice drafting deep-link event
  useEffect(() => {
    const handleOpenForm14 = (e: Event) => {
      const customEvent = e as CustomEvent<AutoDebitRecord>;
      if (customEvent.detail) {
        const record = customEvent.detail;
        setAutoDebits((prev) => {
          if (prev.some(d => d.id === record.id || (d.noticeDocketNo && d.noticeDocketNo === record.noticeDocketNo))) {
            return prev;
          }
          return [record, ...prev];
        });
        setSelectedDebitRecord(record);
        const matchedCtr = contractors.find(
          c => c.id === record.contractorId || (record.contractorName && c.name.toLowerCase().includes(record.contractorName.toLowerCase().slice(0, 5)))
        ) || contractors[0];
        setSelectedContractor(matchedCtr);
        setActiveViewTab('auto_debit_ledger');
        setActiveModal('auto_debit_voucher');
      }
    };

    window.addEventListener('roadsaathi:open-form14', handleOpenForm14);
    return () => window.removeEventListener('roadsaathi:open-form14', handleOpenForm14);
  }, [contractors]);

  const totalGrossBonds = contractors.reduce((acc, c) => acc + c.securityDepositInr, 0);
  const totalSecurityDeposits = contractors.reduce((acc, c) => acc + (c.securityDepositInr - c.penaltiesDeductedInr), 0);
  const totalPenaltiesCollected = contractors.reduce((acc, c) => acc + c.penaltiesDeductedInr, 0);
  const totalBreaches = contractors.reduce((acc, c) => acc + c.breachedWorkOrders, 0);
  const totalAutoDebitsInr = autoDebits.reduce((acc, d) => acc + d.penaltyDebitInr, 0);
  const criticalDebarmentCount = contractors.filter(c => c.debarmentRisk === 'Critical Debarment Warning').length;
  const netEscrowRatio = totalGrossBonds > 0 ? (totalSecurityDeposits / totalGrossBonds) * 100 : 0;

  // Filtered Contractors by DLP Tier
  const filteredContractors = contractors.filter(c => {
    if (dlpFilter === 'all') return true;
    const tier = (c.dlpTierMonths || c.dlpMonths || 36).toString();
    return tier === dlpFilter;
  });

  // Filtered Show-Cause Notices / Dockets by DLP Tier
  const filteredNotices = autoDebits.filter(d => {
    if (dlpFilter === 'all') return true;
    const tier = (d.dlpTierMonths || 36).toString();
    return tier === dlpFilter;
  });

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

  // Statutory Show-Cause Notice Trigger calling /api/contractors/penalties/issue-form-14
  const handleIssueForm14Notice = async () => {
    if (isSimulatingNotice) return;
    setIsSimulatingNotice(true);

    const targetId = 'CTR-04';
    const debitAmount = 25000;
    const measuredShock = 1.48; // Gz > 1.30g trigger

    try {
      const clusterCode = `WO-2026-CHE-${Math.floor(500 + Math.random() * 400)}`;
      const result = await api.issueForm14Notice({
        cluster_code: clusterCode,
        measured_gz: measuredShock,
        patrol_bus_id: 'BUS-MTC-19B'
      }).catch(() => null);

      const docketNo = result?.notice_docket_no || `GCC/HW/FORM-14/2026/${Math.floor(1000 + Math.random() * 9000)}`;
      const certId = result?.certificate_id || `CERT-BSA2023-${Date.now().toString().slice(-6)}`;
      const cureDeadline = result?.cure_deadline || new Date(Date.now() + 7 * 86400000).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

      const newRecord: AutoDebitRecord = {
        id: `SCN-2026-${Math.floor(100 + Math.random() * 900)}`,
        timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
        contractorId: targetId,
        contractorName: 'HCC - Hindustan Construction Co.',
        corridor: 'Inner Ring Road / Koyambedu Arterial',
        clusterCode: clusterCode,
        patrolBusId: 'BUS-MTC-19B',
        measuredGz: measuredShock,
        thresholdGz: 1.30,
        penaltyDebitInr: debitAmount,
        remainingDepositInr: 2695000,
        pfmsTxnRef: `PFMS/DLP-RETENTION/${Date.now().toString().slice(-8)}`,
        clause: 'Contractual DLP Clause & Section 63/65B BSA 2023',
        status: 'UNDER_NOTICE_7D_CURE',
        evidenceSha256: result?.evidence_hash || '7f8a3c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        noticeDocketNo: docketNo,
        cureDeadline: cureDeadline,
        section65bCertId: certId,
        dlpTierMonths: 12,
      };

      setAutoDebits(prev => [newRecord, ...prev]);
      setSelectedDebitRecord(newRecord);
      setSelectedContractor(contractors.find(c => c.id === targetId) || contractors[0]);
      setIsSimulatingNotice(false);
      setActiveModal('auto_debit_voucher');

      showSuccessToast(
        "Statutory Form 14 Notice Served",
        `Docket: ${docketNo}. 7-day cure window initiated under Contractual DLP Clause & Section 63/65B BSA 2023.`
      );
    } catch (err) {
      setIsSimulatingNotice(false);
      showErrorToast("Notice Generation Failed", "Network timeout contacting municipal notice gateway.");
    }
  };

  // Executive Engineer Digital Sign-Off
  const handleEeDigitalSignoff = async () => {
    if (!selectedDebitRecord || isSigning) return;
    setIsSigning(true);

    try {
      const penaltyId = String(parseInt(selectedDebitRecord.id.replace(/\D/g, '')) || 81);
      const signResult = await api.signForm14Notice(penaltyId, {
        signoff_by: "Er. S. Meenakshi Sundaram (Divisional EE Highways)",
        remarks: "Statutory multi-pass telematics and BSA 2023 Section 65B hash verified."
      }).catch(() => null);

      const signTime = signResult?.ee_signoff_at || new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
      const signerName = signResult?.ee_signoff_by || "Er. S. Meenakshi Sundaram (Divisional EE Highways)";

      const updatedRecord: AutoDebitRecord = {
        ...selectedDebitRecord,
        status: 'NOTICE_SERVED',
        eeSignoffBy: signerName,
        eeSignoffAt: signTime,
      };

      setAutoDebits(prev => prev.map(d => d.id === selectedDebitRecord.id ? updatedRecord : d));
      setSelectedDebitRecord(updatedRecord);
      setIsSigning(false);

      showSuccessToast(
        "EE Digital Sign-Off Completed",
        `Form 14 docket ${selectedDebitRecord.noticeDocketNo || selectedDebitRecord.id} digitally endorsed.`
      );
    } catch (err) {
      setIsSigning(false);
      showErrorToast("Sign-off Error", "Could not complete cryptographic sign-off.");
    }
  };

  // Enforce Liquidated Damages SD / Retention Deduction
  const handleEnforceLiquidation = async () => {
    if (!selectedDebitRecord || isEnforcing) return;
    setIsEnforcing(true);

    try {
      const penaltyId = String(parseInt(selectedDebitRecord.id.replace(/\D/g, '')) || 81);
      const result = await api.enforceLiquidation(penaltyId).catch(() => null);

      const updatedRecord: AutoDebitRecord = {
        ...selectedDebitRecord,
        status: 'LIQUIDATED_DAMAGES',
        pfmsTxnRef: result?.pfms_reference || `PFMS/LIQ-DAMAGES/${Date.now().toString().slice(-8)}`,
      };

      // Deduct from contractor deposit in state
      setContractors(prev => prev.map(c => {
        if (c.id === selectedDebitRecord.contractorId) {
          return {
            ...c,
            penaltiesDeductedInr: c.penaltiesDeductedInr + selectedDebitRecord.penaltyDebitInr
          };
        }
        return c;
      }));

      setAutoDebits(prev => prev.map(d => d.id === selectedDebitRecord.id ? updatedRecord : d));
      setSelectedDebitRecord(updatedRecord);
      setIsEnforcing(false);

      showSuccessToast(
        "Liquidated Damages Enforced",
        `₹${selectedDebitRecord.penaltyDebitInr.toLocaleString('en-IN')} deducted from Security Deposit (SD) / Retention Money.`
      );
    } catch (err) {
      setIsEnforcing(false);
      showErrorToast("Enforcement Failed", "Failed to communicate with municipal treasury.");
    }
  };

  // Status Badge Helper
  const renderNoticeStatusBadge = (status?: string) => {
    switch (status) {
      case 'UNDER_NOTICE_7D_CURE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-amber-500/15 border border-amber-500/40 text-amber-500 dark:text-amber-400">
            <Clock className="w-3 h-3" />
            <span>Under Notice (7d Cure)</span>
          </span>
        );
      case 'NOTICE_SERVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-blue-500/15 border border-blue-500/40 text-blue-600 dark:text-blue-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>Notice Served</span>
          </span>
        );
      case 'LIQUIDATED_DAMAGES':
      case 'EXECUTED_VIA_PFMS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-400">
            <AlertOctagon className="w-3 h-3" />
            <span>Liquidated Damages</span>
          </span>
        );
      case 'CURED_BY_CONTRACTOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            <span>Cured by Contractor</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-amber-500/15 border border-amber-500/40 text-amber-500 dark:text-amber-400">
            <Clock className="w-3 h-3" />
            <span>Under Notice (7d Cure)</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 select-none">
      
      {/* HIGHLIGHTED STATUTORY SHOW-CAUSE NOTICE BANNER: CONTRACTUAL DLP CLAUSE & BSA 2023 SEC 63/65B */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono text-[11px] font-bold flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-indigo-400" />
                <span>CONTRACTUAL DLP CLAUSE &bull; STATUTORY SHOW-CAUSE NOTICE SYSTEM</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10.5px] font-mono font-bold">
                BSA 2023 SEC 63/65B CERTIFIED
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Statutory Form 14 Show-Cause Notice &amp; Retention Money Governance
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When transit fleet buses re-cross repaired defects and confirm recurrent vertical shocks within the active Defect Liability Period (DLP), RoadSaathi serves a statutory Form 14 Show-Cause Notice with a <strong className="text-amber-300 font-mono">7-day cure window</strong> backed by Section 63/65B BSA 2023 evidence before liquidated damages are deducted from held Security Deposit (SD) / Retention Money.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <button
              onClick={handleIssueForm14Notice}
              disabled={isSimulatingNotice}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-amber-600 hover:from-indigo-500 hover:to-amber-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <FileCheck className={`w-4 h-4 ${isSimulatingNotice ? 'animate-spin' : ''}`} />
              <span>{isSimulatingNotice ? 'Generating Form 14 Docket...' : 'Issue Form 14 Show-Cause Notice'}</span>
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
                <span>Notice Audit Docket</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DLP TIER INTERACTIVE FILTER STRIP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
          <Filter className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold uppercase tracking-wider text-[11px]">Defect Liability Period (DLP) Tier Filter:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setDlpFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
              dlpFilter === 'all'
                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All DLP Tiers
          </button>
          <button
            onClick={() => setDlpFilter('12')}
            className={`px-3 py-1.5 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
              dlpFilter === '12'
                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            12-Month Overlay (365d)
          </button>
          <button
            onClick={() => setDlpFilter('36')}
            className={`px-3 py-1.5 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
              dlpFilter === '36'
                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            36-Month Arterial (1,095d)
          </button>
          <button
            onClick={() => setDlpFilter('60')}
            className={`px-3 py-1.5 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
              dlpFilter === '60'
                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            60-Month Rigid PQC (1,825d)
          </button>
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

        {/* Card 2: Statutory Form 14 Exposure */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Statutory Form 14 Exposure</span>
            <AlertOctagon className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
            ₹{(totalPenaltiesCollected / 100000).toFixed(2)} Lakhs
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full" 
              style={{ width: `${Math.min(100, Math.max(5, (totalPenaltiesCollected / totalGrossBonds) * 100 * 10))}%` }}
            />
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
            <Receipt className="w-3 h-3" />
            <span>Contractual DLP Clause 7d Cure Exposure</span>
          </div>
        </div>

        {/* Card 3: Security Deposit (SD) / Retention Money */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Security Deposit (SD) / Retention Money</span>
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
            <span>Safety Margin: {netEscrowRatio.toFixed(1)}% Retention Available</span>
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
            <span>HCC at statutory limit &bull; Notice served</span>
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
                Automated SLA tracking, dynamic DLP tier windows, and Form 14 liquidated damages accounting under MoRTH guidelines.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 font-semibold">
                MoRTH Clause 108.4 Active
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 font-semibold">
                Contractual DLP Form 14 Active
              </span>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4">Contractor / Agency</th>
                  <th className="py-3 px-4">DLP Tier &amp; Specification</th>
                  <th className="py-3 px-4">Assigned Corridor &amp; Zone</th>
                  <th className="py-3 px-4 text-right">Deposit Balance (Tracked)</th>
                  <th className="py-3 px-4 text-right">Penalties Deducted</th>
                  <th className="py-3 px-4 text-center">On-Time SLA</th>
                  <th className="py-3 px-4 text-center">Quality Index</th>
                  <th className="py-3 px-4 text-center">Breaches</th>
                  <th className="py-3 px-4 text-center">Debarment Risk</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredContractors.map((ctr) => {
                  const currentBalance = ctr.securityDepositInr - ctr.penaltiesDeductedInr;
                  const isBreached = ctr.breachedWorkOrders > 0;
                  const dlpTier = ctr.dlpTierMonths || ctr.dlpMonths || 36;

                  return (
                    <tr key={ctr.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{ctr.name}</div>
                        <div className="text-[10.5px] font-mono text-slate-400">{ctr.cin}</div>
                        <div className="text-[10px] text-slate-500">Rep: {ctr.director}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                          dlpTier === 60 
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : dlpTier === 12
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        }`}>
                          {dlpTier}m Tier ({dlpTier * 30.4 > 1000 ? (dlpTier === 60 ? '1,825d' : '1,095d') : '365d'})
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">{ctr.contractType || 'Bituminous Macadam'}</div>
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
                        <div className="text-[10px] text-slate-400">Contractual DLP &amp; SLA</div>
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
                              className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-amber-600 hover:bg-amber-500 text-white transition shadow-xs flex items-center gap-1 cursor-pointer"
                              title="Generate and review Form 14 Show-Cause Notice Draft"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Form 14</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenCert(ctr)}
                            className="px-2.5 py-1 rounded-lg font-semibold text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer"
                            title="View / issue Contractual DLP Work Completion Certificate"
                          >
                            <Award className="w-3 h-3 text-blue-500" />
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
        /* VIEW TAB 2: STATUTORY FORM 14 SHOW-CAUSE AUDIT TRAIL */
        <div className="bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-500" />
                <span>Contractual DLP Clause &bull; Statutory Form 14 Notice &amp; Audit Docket</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Statutory 7-day cure window notices and certified liquidated damage debits served under Section 63/65B BSA 2023.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              Total Form 14 Exposure: ₹{totalAutoDebitsInr.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4">Notice Docket &amp; Time</th>
                  <th className="py-3 px-4">Contractor Agency &amp; DLP Tier</th>
                  <th className="py-3 px-4">Corridor &amp; Defect</th>
                  <th className="py-3 px-4 text-center">Sensor Re-Shock</th>
                  <th className="py-3 px-4 text-center">Statutory Status</th>
                  <th className="py-3 px-4 text-right">Exposure / Damages</th>
                  <th className="py-3 px-4 text-right">Notice Pack</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredNotices.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{rec.noticeDocketNo || rec.id}</div>
                      <div className="text-[10px] text-slate-400">{rec.timestamp}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{rec.contractorName}</div>
                      <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                        {rec.dlpTierMonths || 36}m DLP Tier Window
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 dark:text-slate-200">{rec.corridor}</div>
                      <div className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">{rec.clusterCode}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 font-bold text-[11px] tabular-nums">
                        Gz={rec.measuredGz}g &gt; {rec.thresholdGz}g
                      </span>
                      <div className="text-[9.5px] text-slate-400 mt-0.5">{rec.patrolBusId}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {renderNoticeStatusBadge(rec.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        ₹{rec.penaltyDebitInr.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">Contractual DLP Retention</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenDebitVoucher(rec)}
                        className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <FileText className="w-3 h-3 text-indigo-500" />
                        <span>Form 14 Pack</span>
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
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 bg-amber-50 dark:bg-amber-950/60">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-sm font-bold text-amber-950 dark:text-amber-100">
                    FORM 14 SHOW-CAUSE NOTICE (STATUTORY DRAFT)
                  </h3>
                  <div className="text-[10px] font-mono text-amber-700 dark:text-amber-300">
                    GCC/HW/FORM-14/2026-089 &bull; CONTRACTUAL DLP CLAUSE &bull; 7-DAY CURE NOTICE
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
                  GREATER CHENNAI CORPORATION &bull; SPECIAL HIGHWAYS DIVISION
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Ripon Building, Chennai - 600003 | Statutory Notice under Contractual DLP Clause &amp; BSA 2023 Sec 63/65B
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
                  <div className="text-[10px] text-amber-600 font-bold mt-1">
                    DLP Window: {selectedContractor.dlpTierMonths || 36} Months ({selectedContractor.contractType || 'Arterial'})
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
                  <div className="grid grid-cols-3 p-2.5 bg-amber-50/60 dark:bg-amber-950/40 font-bold text-slate-900 dark:text-white">
                    <span>TOTAL CONTRACTUAL DLP LIQUIDATED DAMAGES:</span>
                    <span className="text-center">7-Day Cure Window</span>
                    <span className="text-right text-amber-700 dark:text-amber-400 font-extrabold tabular-nums">₹45,000</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Take notice that in accordance with Contractual Defect Liability Period (DLP) Clause (PWD/MORTH GCC Clause 16/17) and Section 63/65B BSA 2023, you are hereby granted a statutory <strong>7-day cure window</strong> from the service of this notice to rectify defects. Failure to cure within this period will result in immediate deduction of liquidated damages from held Security Deposit (SD) / Retention Money.
              </p>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <div>
                  <div>SECTION 65B EVIDENCE HASH: SHA-256: 7f8a3c...91b0</div>
                  <div>ISSUING AUTHORITY: Superintending Engineer (Highways), GCC</div>
                </div>
                <div className="p-2 rounded border border-amber-400 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold uppercase text-[9px]">
                  FORM 14 NOTICE
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Notice Pack</span>
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
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
                    CONTRACTUAL DLP COMPLIANCE &bull; CERT NO: GCC-QC-2026-8819
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
                  <span>Verified Specifications under Contractual DLP Clause:</span>
                </div>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-0.5 text-[10.5px]">
                  <li>Dense Bituminous Macadam (DBM) grade: VG-30 hot-mix asphalt (126 kg installed).</li>
                  <li>Tack coat RS-1 applied to cavity edges; 8-ton vibratory roller compaction verified.</li>
                  <li>Bus fleet re-pass IMU confirms vertical acceleration dropped from 2.8g to 0.98g.</li>
                  <li>Defect Liability Warranty Tier: {selectedContractor.dlpTierMonths || 36} Months active.</li>
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

      {/* MODAL 3: FORM 14 STATUTORY SHOW-CAUSE NOTICE PACK (CONTRACTUAL DLP CLAUSE & BSA 2023 SEC 63/65B) */}
      {activeModal === 'auto_debit_voucher' && selectedDebitRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 bg-indigo-50 dark:bg-indigo-950/60">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    FORM 14 STATUTORY SHOW-CAUSE NOTICE PACK
                  </h3>
                  <div className="text-[10px] font-mono text-indigo-700 dark:text-indigo-300">
                    DOCKET: {selectedDebitRecord.noticeDocketNo || selectedDebitRecord.id} &bull; CONTRACTUAL DLP CLAUSE
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
                  GREATER CHENNAI CORPORATION &bull; SPECIAL HIGHWAYS &amp; BRIDGES DIVISION
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Ripon Building, Chennai - 600003 | Form 14 Show-Cause Notice Pack (Contractual DLP / PWD GCC 16/17)
                </div>
              </div>

              {/* 7-DAY CURE WINDOW NOTICE STATUS BANNER */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-amber-800 dark:text-amber-300 text-xs uppercase tracking-wide">
                      Statutory 7-Day Cure Window Active
                    </span>
                    {renderNoticeStatusBadge(selectedDebitRecord.status)}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    In accordance with Contractual Defect Liability Period (DLP) Clause (PWD/MORTH GCC Clause 16/17) and Section 63/65B BSA 2023, the contractor is served this statutory show-cause notice. The contractor is granted a period of <strong>7 days</strong> to rectify the recurrent defect prior to the automatic deduction of liquidated damages from their Security Deposit (SD) / Retention Money.
                  </p>
                  <div className="font-mono text-[11px] text-amber-700 dark:text-amber-400">
                    Cure Deadline: <strong>{selectedDebitRecord.cureDeadline || '2026-10-05 14:15 IST'}</strong>
                  </div>
                </div>
              </div>

              {/* CONTRACTOR & JURISDICTION SUMMARY */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">NOTICE SERVED TO:</span>
                  <strong className="text-slate-900 dark:text-white">{selectedDebitRecord.contractorName}</strong>
                  <div className="text-[10px] text-slate-500">{selectedDebitRecord.corridor}</div>
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-1">
                    DLP Window: {selectedDebitRecord.dlpTierMonths || 36} Months
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">WORK ORDER &amp; TIME:</span>
                  <strong className="text-slate-900 dark:text-white">{selectedDebitRecord.clusterCode}</strong>
                  <div className="text-[10px] text-slate-500">{selectedDebitRecord.timestamp}</div>
                  <div className="text-[10px] text-slate-500">Transit Node: {selectedDebitRecord.patrolBusId}</div>
                </div>
              </div>

              {/* TELEMETRICS & DEFECT DETAILS */}
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 font-mono space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 dark:text-slate-300">Measured Vertical Shock:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    Gz = {selectedDebitRecord.measuredGz}g (Threshold: {selectedDebitRecord.thresholdGz}g)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 dark:text-slate-300">Statutory Governing Clause:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedDebitRecord.clause}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white">Assessed Liquidated Damages:</span>
                  <span className="font-extrabold text-rose-600 dark:text-rose-400 text-sm tabular-nums">
                    ₹{selectedDebitRecord.penaltyDebitInr.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* SECTION 63 / 65B BSA 2023 ELECTRONIC RECORD CERTIFICATE SEAL */}
              <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 space-y-2 text-[10.5px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-950 dark:text-indigo-200">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Bharatiya Sakshya Adhiniyam, 2023 (BSA) &bull; Section 63 &amp; 65B Certificate</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-[9.5px] bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                    {selectedDebitRecord.section65bCertId || 'CERT-BSA2023-2026-081'}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                  I hereby certify that the computer output (IMU z-axis acceleration readings and dashcam telemetry) was generated in the ordinary course of operations by transit fleet nodes. The hash below certifies integrity against tampering under Sections 63 and 65B of the BSA 2023.
                </p>
                <div className="font-mono text-[10px] text-slate-500 break-all bg-white dark:bg-slate-900 p-2 rounded border border-indigo-100 dark:border-indigo-950">
                  SHA-256 EVIDENCE HASH: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{selectedDebitRecord.evidenceSha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</span>
                </div>
              </div>

              {/* EXECUTIVE ENGINEER DIGITAL SIGN-OFF SEAL */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-mono">EXECUTIVE ENGINEER SIGN-OFF:</span>
                  {selectedDebitRecord.eeSignoffBy ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{selectedDebitRecord.eeSignoffBy}</span>
                    </div>
                  ) : (
                    <div className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                      Pending Divisional EE Digital Signature
                    </div>
                  )}
                  <div className="text-[10px] text-slate-500 font-mono">
                    {selectedDebitRecord.eeSignoffAt ? `Signed At: ${selectedDebitRecord.eeSignoffAt}` : 'Sign-off required before statutory enforcement'}
                  </div>
                </div>

                {!selectedDebitRecord.eeSignoffBy ? (
                  <button
                    onClick={handleEeDigitalSignoff}
                    disabled={isSigning}
                    className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Check className={`w-3.5 h-3.5 ${isSigning ? 'animate-spin' : ''}`} />
                    <span>{isSigning ? 'Signing Docket...' : 'EE Digital Sign-Off'}</span>
                  </button>
                ) : (
                  <span className="px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-[11px] border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Legally Sealed</span>
                  </span>
                )}
              </div>

              {/* LIQUIDATED DAMAGES ENFORCEMENT ACTION (IF SIGNED) */}
              {selectedDebitRecord.eeSignoffBy && selectedDebitRecord.status !== 'LIQUIDATED_DAMAGES' && selectedDebitRecord.status !== 'EXECUTED_VIA_PFMS' && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-rose-900 dark:text-rose-200">
                      Enforce Security Deposit / Retention Deduction
                    </div>
                    <div className="text-[10.5px] text-rose-700 dark:text-rose-400">
                      Use after 7-day cure window has elapsed without rectification by contractor.
                    </div>
                  </div>
                  <button
                    onClick={handleEnforceLiquidation}
                    disabled={isEnforcing}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isEnforcing ? 'Deducting SD / Retention...' : 'Enforce Deduction'}
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Form 14 Notice Pack</span>
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
              >
                Close Docket
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
