import React from 'react';
import {
  X, 
  Shield, 
  CheckCircle2, 
  Lock, 
  Briefcase,
  AlertTriangle,
  Car,
  Wrench,
  FileCheck2,
  Crown,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useAuth, OFFICER_DETAILS } from '../../context/AuthContext';
import { CivicRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, switchRole, getRoleBadgeLabel, getRoleColor } = useAuth();

  if (!isOpen) return null;

  const roleSpecs: Record<CivicRole, { 
    title: string; 
    equivalent: string;
    icon: React.ElementType;
    iconColor: string;
    summary: string; 
    sees: string[];
    operations: string[];
    gated: string[];
  }> = {
    admin: {
      title: 'State ICCC Administrator (Master Control)',
      equivalent: 'Chief Director / System Superuser (Integrated Command & Control Centre)',
      icon: Sparkles,
      iconColor: 'text-emerald-500',
      summary: 'Omnipotent root clearance with full write / dispatch authority across all civic branches.',
      sees: [
        'Complete unified telemetry: Police alerts, PWD work orders, VAHAN queries & Executive Rollups',
        'Raw AI ingestion streams, live fleet GPS telemetry, and 3D defect point clouds',
        'Unrestricted access to all audit trails, contractor ledgers, and system configurations'
      ],
      operations: [
        'Full administrative authority to approve work orders, dispatch PCR units, and issue e-challans',
        'Direct override of contractor SLAs, penalty debits, and debarment registries',
        'Trigger live deduplication passes, VAHAN audits, and export statutory state reports'
      ],
      gated: [
        'Omnipotent System Master: Complete control over all civic subsystems & zero operational restrictions'
      ]
    },
    traffic_police: {
      title: 'Traffic Police (City Police — Traffic Wing)',
      equivalent: 'DCP Traffic / Traffic Inspector on Patrol Duty',
      icon: Shield,
      iconColor: 'text-rose-500',
      summary: 'Enforcement command console prioritizing active evasions, high-speed danger, and pedestrian zones.',
      sees: [
        'Incident List filtered to Hit & Run / Rash Driving / Vulnerable Pedestrians',
        'Low-Confidence ANPR Review Queue (<85% candidate inspection)',
        'Live Incident Dossiers with GPS, ISO timestamp & Plate confidence'
      ],
      operations: [
        'Review and accept / reject low-confidence ANPR reads before fine issuance',
        'Approve instant dispatch of PCR / 112 emergency interceptor patrol unit',
        'Issue draft e-Challan with automated MVA 1988 statutory citations',
        'Mark incident as RESOLVED once field enforcement action is confirmed'
      ],
      gated: [
        'Issuing & confirming statutory violation notices',
        'Dispatching emergency PCR / 112 response units'
      ]
    },
    pwd_engineer: {
      title: 'Road / PWD Maintenance Authority',
      equivalent: 'PWD Superintending Engineer / GCC & TN Highways Roads Wing',
      icon: Wrench,
      iconColor: 'text-amber-500',
      summary: 'Infrastructure engineering authority triaging 3D road distress, asphalt demand, and contractor SLAs.',
      sees: [
        'Work Orders (Kanban lifecycle + statutory SLA countdown ledger)',
        'Road Memory & deterioration forecasts (IRI roughness, surface degradation)',
        'Road condition heatmap filtered by jurisdiction / arterial transit corridor'
      ],
      operations: [
        'Approve work orders and assign road infrastructure contractors (L&T, GMR, TNRDC)',
        'Review before / after repair photographic compliance audits',
        'Set and adjust SLA deadlines for specific distress classes (D40/D20/D10/D00)',
        'View deterioration forecasts to plan preventive maintenance and asphalt budget'
      ],
      gated: [
        'Work order approval & contractor assignment',
        'SLA penalty enforcement & contractor debarment'
      ]
    },
    rto_officer: {
      title: 'RTO / Transport Department',
      equivalent: 'Regional Transport Officer — Vehicle Registration & Compliance Authority',
      icon: FileCheck2,
      iconColor: 'text-blue-500',
      summary: 'Vehicle compliance and registration authority verifying VAHAN / Sarathi data and HSRP standards.',
      sees: [
        'Narrow slice: confirmed (not pending-review) ANPR hits tied to specific vehicles',
        'High Security Registration Plate (HSRP) compliance and emission status',
        'State & Chennai RTO jurisdiction breakdown (TN-01 to TN-22)'
      ],
      operations: [
        'Cross-reference flagged plates against VAHAN / Sarathi national vehicle records',
        'Flag commercial & private vehicles for compliance follow-up (expired FC, missing HSRP)',
        'Audit vehicle registration series, fuel type, and fitness expiry certificates'
      ],
      gated: [
        'VAHAN compliance registry cross-referencing',
        'Vehicle fitness & HSRP compliance flag auditing'
      ]
    },
    commissioner: {
      title: 'Senior Oversight / Transport Commissioner',
      equivalent: 'District Transport Commissioner / State-level Oversight Official (IAS)',
      icon: Crown,
      iconColor: 'text-purple-500',
      summary: 'Executive leadership rollup providing macro-level KPIs, multi-corridor risk, and budget impacts.',
      sees: [
        'Read-mostly executive rollup: city-wide KPIs and spatial safety index',
        'Cross-corridor risk comparison across NH-32, OMR, and Anna Salai',
        'Budget-impact estimates from preventive maintenance models — zero low-level clutter'
      ],
      operations: [
        'Approve high-value infrastructure contracts and emergency civil interventions',
        'Export aggregated statutory policy reports for Government of Tamil Nadu decision-making',
        'Direct multi-agency coordination across Police, PWD, and Transport'
      ],
      gated: [
        'High-value executive contract sanctions',
        'Statutory policy report export & inter-agency directives'
      ]
    }
  };

  const availableRoles: CivicRole[] = ['admin', 'traffic_police', 'pwd_engineer', 'rto_officer', 'commissioner'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Officer Clearance & Role Switcher</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Official Government Personas &bull; Role-Based Access Control (RBAC)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: 4 Profile Cards */}
        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Select an operational profile to assume that officer's exact authority, filtered views, and gated operations:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableRoles.map((roleKey) => {
              const spec = roleSpecs[roleKey];
              const details = OFFICER_DETAILS[roleKey];
              const isActive = user.role === roleKey;
              const Icon = spec.icon;

              return (
                <div
                  key={roleKey}
                  onClick={() => switchRole(roleKey)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                    isActive
                      ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 shadow-md ring-2 ring-blue-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div>
                    {/* Header with Icon & Active Tag */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 ${spec.iconColor}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                            {spec.title}
                          </h3>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                            {spec.equivalent}
                          </span>
                        </div>
                      </div>

                      {isActive ? (
                        <span className="shrink-0 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold">
                          ACTIVE
                        </span>
                      ) : (
                        <button className="shrink-0 text-[10.5px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline">
                          Switch <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Officer Identity */}
                    <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-850/70 border border-slate-200/70 dark:border-slate-800 text-[11px] mb-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{details.profile.name}</div>
                      <div className="text-slate-500 text-[10.5px]">{details.profile.designation} &bull; <span className="font-mono">{details.profile.badge_number}</span></div>
                    </div>

                    {/* What They See */}
                    <div className="space-y-1 mb-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        What They See:
                      </span>
                      {spec.sees.map((s, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>

                    {/* Operations They Perform */}
                    <div className="space-y-1 mb-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                        Operations Allowed:
                      </span>
                      {spec.operations.map((op, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{op}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* What's Gated to Only Them */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[10.5px]">
                    <span className="font-bold text-purple-600 dark:text-purple-400 block mb-0.5">
                      Gated Privilege:
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {spec.gated.join(' • ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40 text-xs">
          <span className="text-slate-400 font-mono text-[11px]">
            Active Clearance: <strong className="text-slate-700 dark:text-slate-300">{getRoleBadgeLabel(user.role)}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm cursor-pointer"
          >
            Apply &amp; Return to Console
          </button>
        </div>
      </div>
    </div>
  );
};
