import React from 'react';
import {
  X, 
  Shield, 
  UserCheck, 
  Building2, 
  CheckCircle2, 
  Lock, 
  KeyRound, 
  Briefcase,
  LogOut
} from 'lucide-react';
import { useAuth, SEEDED_OFFICERS } from '../../context/AuthContext';
import { CivicRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, switchRole, returnToDemo, getRoleBadgeLabel, getRoleColor } = useAuth();

  if (!isOpen) return null;

  const roles: CivicRole[] = ['admin', 'operations', 'maintenance', 'safety', 'analyst'];

  const roleDescriptions: Record<CivicRole, { summary: string; permissions: string[] }> = {
    admin: {
      summary: 'Executive authority with full system configuration, threshold controls, and audit trails.',
      permissions: ['All Municipal Actions', 'System Parameter Tuning', 'Audit Trail Declassification', 'User Management']
    },
    operations: {
      summary: 'Monitors real-time MTC fleet bus positions, delays, telemetry telemetry streams, and route diversions.',
      permissions: ['Fleet Dispatch & Rerouting', 'Run What-If Interventions', 'Bottleneck Decongestion Orders', 'Transit Sensor Analytics']
    },
    maintenance: {
      summary: 'Triage road defects, verify 3D depth meshes, calculate IRC:SP:20 asphalt, and dispatch contractor work orders.',
      permissions: ['Work Order Creation & Closeout', 'WhatsApp Contractor Dispatch', 'Fleet Re-pass Verification', '3D Mesh Inspection']
    },
    safety: {
      summary: 'Law enforcement console reviewing reckless driving, hit-and-run ANPR tracking, and rapid PCR dispatch.',
      permissions: ['Police PCR Immediate Escalation', 'Unredacted Evidence Access', 'ANPR OCR Multi-Candidate Verification', 'Near-Miss Heatmaps']
    },
    analyst: {
      summary: 'Read-only research and planning access for CMDA mobility engineers and urban transport researchers.',
      permissions: ['View All Dashboards & Maps', 'Export CSV Operations Reports', 'Inspect 3D Geometry Read-Only', 'No Action Modifications']
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Municipal Identity & Role Switcher</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Role-Based Access Control (RBAC) &bull; Civic Operations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: Active Officer Card + Role Switcher */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {/* Active Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-base flex items-center justify-center shadow-sm">
                {user.avatar_initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</span>
                  <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800">
                    {getRoleBadgeLabel(user.role)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">{user.designation}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{user.agency} &bull; <span className="font-mono">{user.badge_number}</span></p>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <span className="text-[10.5px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Authenticated
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{user.last_login}</span>
            </div>
          </div>

          {/* Quick Switch Role Grid */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2.5">
              Switch Officer Persona (Immediate Role Grant)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {roles.map((r) => {
                const profile = SEEDED_OFFICERS[r];
                const isActive = user.role === r;
                const colors = getRoleColor(r);

                return (
                  <button
                    key={r}
                    onClick={() => switchRole(r)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800">
                        {getRoleBadgeLabel(r)}
                      </span>
                      {isActive && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{profile.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{profile.agency}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Role Permissions Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-300 font-bold text-xs">
              <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Privileges for {getRoleBadgeLabel(user.role)}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              {roleDescriptions[user.role].summary}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {roleDescriptions[user.role].permissions.map((perm, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{perm}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40 text-xs">
          <button
            onClick={() => { returnToDemo(); onClose(); }}
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition"
            title="Clear the role selection and return to the municipal engineering demo account"
          >
            <LogOut className="w-3.5 h-3.5" />
            Return to demo
          </button>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-slate-400 font-mono">TN-GOV-ID: {user.id}</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm"
            >
              Apply & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
