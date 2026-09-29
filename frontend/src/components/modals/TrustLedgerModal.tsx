import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  FileCheck, 
  UserCheck, 
  Lock, 
  Search, 
  Filter, 
  Printer, 
  Download,
  AlertTriangle,
  Scale,
  Award,
  Building,
  CheckCircle2
} from 'lucide-react';
import { CivicRole } from '../../types';
import { useAuth, OFFICER_DETAILS } from '../../context/AuthContext';

export interface TrustLedgerEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: CivicRole | 'contractor' | 'system';
  badgeNumber: string;
  agency: string;
  actionCategory: 
    | 'WORK_ORDER_ISSUED' 
    | 'REPAIR_PROOF_SUBMITTED' 
    | 'REPAIR_INSPECTOR_VERIFIED' 
    | 'PENALTY_ESCROW_DEBIT' 
    | 'PCR_DISPATCH_AUTHORIZED' 
    | 'ANPR_CONFIDENCE_OVERRIDE'
    | 'FALSE_POSITIVE_FLAGGED';
  entityId: string;
  entitySummary: string;
  sha256Hash: string;
  courtAdmissible: boolean;
  notes: string;
}

const INITIAL_TRUST_LEDGER: TrustLedgerEntry[] = [
  {
    id: 'TR-2026-0929-001',
    timestamp: '2026-09-29 10:14:22 IST',
    actorName: 'Er. K. Shanmugam, M.E.',
    actorRole: 'pwd_engineer',
    badgeNumber: 'PWD-ENG-312',
    agency: 'GCC & Tamil Nadu Highways PWD',
    actionCategory: 'REPAIR_INSPECTOR_VERIFIED',
    entityId: 'WO-2026-CHE-004',
    entitySummary: 'Pothole Cavity Rectification on GST Road Tambaram',
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    courtAdmissible: true,
    notes: 'Dual photo cross-check verified. Sensor re-pass IMU confirms Gz=0.98g (<1.15g ceiling). Payment authorized.'
  },
  {
    id: 'TR-2026-0929-002',
    timestamp: '2026-09-29 09:48:10 IST',
    actorName: 'S. Priya, IPS',
    actorRole: 'traffic_police',
    badgeNumber: 'GCTP-IPS-009',
    agency: 'Greater Chennai Traffic Police (GCTP)',
    actionCategory: 'PCR_DISPATCH_AUTHORIZED',
    entityId: 'INC-2026-CHE-8812',
    entitySummary: 'Hit-and-Run Intercept on Anna Salai (Offender TN-09-CB-4412)',
    sha256Hash: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
    courtAdmissible: true,
    notes: 'Triggered PCR-12 Quick Response Unit intercept under MVA Sec 134/187 and BNS Section 106(2).'
  },
  {
    id: 'TR-2026-0929-003',
    timestamp: '2026-09-29 08:32:05 IST',
    actorName: 'State ICCC Super Administrator',
    actorRole: 'admin',
    badgeNumber: 'ICCC-ADMIN-001',
    agency: 'Integrated Command and Control Centre (ICCC)',
    actionCategory: 'PENALTY_ESCROW_DEBIT',
    entityId: 'CTR-04 (HCC Infra)',
    entitySummary: 'IRC:SP:20 Clause 14.2 Auto-Debit Voucher ₹25,000',
    sha256Hash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    courtAdmissible: true,
    notes: 'Recurrent impact Gz=1.48g detected by Fleet Node BUS-MTC-19B. Executed automated security deposit debit via PFMS escrow.'
  },
  {
    id: 'TR-2026-0928-004',
    timestamp: '2026-09-28 17:20:11 IST',
    actorName: 'K. Rajasekaran (VP Infra)',
    actorRole: 'contractor',
    badgeNumber: 'CTR-LNT-001',
    agency: 'L&T Highways Infra Ltd',
    actionCategory: 'REPAIR_PROOF_SUBMITTED',
    entityId: 'WO-2026-CHE-001',
    entitySummary: 'VG-30 Hot-mix DBM Asphalt Batching Proof',
    sha256Hash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    courtAdmissible: true,
    notes: 'Uploaded post-compaction evidence with delivery challan #LNT-CH-8819 for PWD engineering review.'
  },
  {
    id: 'TR-2026-0928-005',
    timestamp: '2026-09-28 15:44:30 IST',
    actorName: 'Dr. V. Arvind, Ph.D.',
    actorRole: 'admin2',
    badgeNumber: 'EDGE-ADMIN-002',
    agency: 'Decentralized Edge Telematics & MLOps Command',
    actionCategory: 'FALSE_POSITIVE_FLAGGED',
    entityId: 'DET-2026-7719',
    entitySummary: 'Overconfident Shadow Mistake Flagged on Koyambedu Link',
    sha256Hash: '6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e',
    courtAdmissible: true,
    notes: 'High-confidence (0.88) tree shadow classified as asphalt fissure. Routed to Active Learning hard-negative training queue.'
  },
  {
    id: 'TR-2026-0928-006',
    timestamp: '2026-09-28 14:10:00 IST',
    actorName: 'S. Priya, IPS',
    actorRole: 'traffic_police',
    badgeNumber: 'GCTP-IPS-009',
    agency: 'Greater Chennai Traffic Police (GCTP)',
    actionCategory: 'ANPR_CONFIDENCE_OVERRIDE',
    entityId: 'INC-2026-CHE-6610',
    entitySummary: 'Low-Confidence (<70%) ANPR Plate Human Review & Verification',
    sha256Hash: 'b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4',
    courtAdmissible: true,
    notes: 'Occluded plate candidate 64% verified as TN-07-BW-9921 from secondary rear-chassis snapshot. Statutory e-Challan endorsed.'
  }
];

interface TrustLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrustLedgerModal: React.FC<TrustLedgerModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [ledgerEntries] = useState<TrustLedgerEntry[]>(INITIAL_TRUST_LEDGER);

  if (!isOpen) return null;

  const filtered = ledgerEntries.filter(entry => {
    const matchesRole = selectedRole === 'all' || entry.actorRole === selectedRole;
    const matchesSearch = 
      entry.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.actionCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.notes.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl p-5 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Civic Role RBAC Trust Ledger &amp; Inspector Accountability Audit Trail
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold">
                  BSA 2023 &bull; SEC 65B
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cryptographically sealed log of every officer approval, contractor repair, and enforcement action.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Personas' },
              { id: 'pwd_engineer', label: 'PWD Engineers' },
              { id: 'traffic_police', label: 'Traffic Police' },
              { id: 'admin', label: 'ICCC Admins' },
              { id: 'contractor', label: 'Contractors' },
              { id: 'admin2', label: 'Edge MLOps' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedRole === r.id
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs font-mono outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Ledger Table Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold z-10">
              <tr>
                <th className="py-2.5 px-3">Timestamp &amp; Actor</th>
                <th className="py-2.5 px-3">Role &amp; Badge</th>
                <th className="py-2.5 px-3">Action Category</th>
                <th className="py-2.5 px-3">Target Entity</th>
                <th className="py-2.5 px-3">Cryptographic SHA-256 Stamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{entry.actorName}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{entry.timestamp}</div>
                    <div className="text-[10px] text-slate-500 mt-1 max-w-xs">{entry.notes}</div>
                  </td>

                  <td className="py-3 px-3 font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10.5px]">
                      {entry.badgeNumber}
                    </span>
                    <div className="text-[10px] text-slate-400 font-sans mt-0.5">{entry.agency}</div>
                  </td>

                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                      entry.actionCategory === 'REPAIR_INSPECTOR_VERIFIED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      entry.actionCategory === 'PENALTY_ESCROW_DEBIT' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                      entry.actionCategory === 'PCR_DISPATCH_AUTHORIZED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                      entry.actionCategory === 'FALSE_POSITIVE_FLAGGED' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}>
                      {entry.actionCategory.replace(/_/g, ' ')}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200 font-mono">{entry.entityId}</div>
                    <div className="text-[10.5px] text-slate-500 max-w-[200px] truncate">{entry.entitySummary}</div>
                  </td>

                  <td className="py-3 px-3 font-mono text-[10px]">
                    <div className="text-cyan-600 dark:text-cyan-400 truncate max-w-[150px]" title={entry.sha256Hash}>
                      {entry.sha256Hash.slice(0, 16)}...
                    </div>
                    <div className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                      <Lock className="w-2.5 h-2.5" />
                      <span>COURT ADMISSIBLE</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Immutable Trust Ledger: Zero officer approvals without verifiable fleet sensor corroboration.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Legal Evidence Docket</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
            >
              Close Ledger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
