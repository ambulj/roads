import React, { useState } from 'react';
import {
  Shield,
  BusFront,
  Building2,
  Lock,
  KeyRound,
  CheckCircle2,
  Sparkles,
  Fingerprint,
  ChevronRight,
  Radio,
  Eye,
  EyeOff,
  Cpu,
  BadgeCheck,
  AlertTriangle,
  User,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuth, OFFICER_DETAILS } from '../context/AuthContext';
import { CivicRole } from '../types';

interface LoginPortalProps {
  onLoginSuccess?: () => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({ onLoginSuccess }) => {
  const { login, getRoleBadgeLabel, getRoleColor } = useAuth();
  const [selectedRole, setSelectedRole] = useState<CivicRole>('maintenance');
  const [authMethod, setAuthMethod] = useState<'card' | 'manual'>('card');
  const [emailInput, setEmailInput] = useState(OFFICER_DETAILS['maintenance'].profile.email);
  const [passwordInput, setPasswordInput] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<string | null>(null);

  const roles: CivicRole[] = ['maintenance', 'safety', 'operations', 'admin', 'analyst'];

  const handleSelectRole = (r: CivicRole) => {
    setSelectedRole(r);
    setEmailInput(OFFICER_DETAILS[r].profile.email);
    setAuthFeedback(null);
  };

  const handleAuthenticate = () => {
    setIsAuthenticating(true);
    setAuthFeedback('Verifying Departmental Biometrics & Token Clearance...');

    setTimeout(() => {
      login(selectedRole, rememberMe);
      setIsAuthenticating(false);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }, 600);
  };

  const currentOfficer = OFFICER_DETAILS[selectedRole];

  return (
    <div className="min-h-screen w-screen bg-[#0d1117] text-slate-100 flex flex-col justify-between font-sans select-none relative overflow-x-hidden">
      {/* Background Subtle Gradient & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(56,189,248,0.12),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d_1px,transparent_1px),linear-gradient(to_bottom,#1f293d_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />

      {/* Top Municipal Bar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 border border-blue-400/30">
            <BusFront className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">ROADSAARTHI</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                PROD v2.6.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Greater Chennai Metropolitan Urban Intelligence & Transit Grid</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>GovNet TLS 1.3 / ISO-27001</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>TN Civic Identity SSO</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Department Officer Selector */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
                <BadgeCheck className="w-3.5 h-3.5" />
                Select Municipal Officer Persona
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                Authorized Field & Command Access
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                Each verified officer is granted role-restricted tools, live dispatch authority, and GIS data matching their civic jurisdiction.
              </p>
            </div>

            {/* Officer Cards Grid */}
            <div className="space-y-2.5 pt-2">
              {roles.map((r) => {
                const item = OFFICER_DETAILS[r];
                const isSelected = selectedRole === r;
                const isAnalyst = r === 'analyst';

                return (
                  <button
                    key={r}
                    onClick={() => handleSelectRole(r)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-slate-900/95 border-blue-500 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/40'
                        : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-xl font-extrabold text-sm flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                          : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}>
                        {item.profile.avatar_initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white truncate">{item.profile.name}</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase ${
                            r === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                            r === 'safety' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                            r === 'maintenance' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            r === 'operations' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                            'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                          }`}>
                            {getRoleBadgeLabel(r)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                          {item.profile.designation} &bull; <span className="text-slate-500">{item.profile.agency}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          Focus: {item.meta.commandFocus}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-700 bg-slate-900'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Dynamic Credentials & Biometric Login Terminal */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              
              {/* Officer Clearance Badge Top */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-blue-400">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">Clearance Credentials</span>
                    <span className="text-sm font-bold text-white">{currentOfficer.profile.badge_number}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 justify-end font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Chip Ready
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">GCC Node 04</span>
                </div>
              </div>

              {/* Officer Highlight Card */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 mb-5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Active Officer</span>
                  <span className="text-white font-bold">{currentOfficer.profile.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Department</span>
                  <span className="text-slate-200 font-medium">{currentOfficer.profile.department}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Jurisdiction</span>
                  <span className="text-slate-300 truncate max-w-[200px]">{currentOfficer.meta.jurisdiction}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                  <span className="text-slate-400">Permitted Modules</span>
                  <span className="text-blue-400 font-mono text-[11px] font-bold">
                    {currentOfficer.meta.allowedRoutes.length} Accessible Views
                  </span>
                </div>
              </div>

              {/* Login Method Tabs */}
              <div className="flex gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800/80 mb-5">
                <button
                  type="button"
                  onClick={() => setAuthMethod('card')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                    authMethod === 'card'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  Biometric SSO
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('manual')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                    authMethod === 'manual'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  GovNet PIN
                </button>
              </div>

              {/* Form Fields if Manual */}
              {authMethod === 'manual' && (
                <div className="space-y-3 mb-5 animate-fadeIn">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Official Email ID
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Security PIN / Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500 transition pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Remember Me Toggle */}
              <div className="flex items-center justify-between mb-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>Keep session active on this console</span>
                </label>
                <span className="text-[11px] font-mono text-slate-500">2FA Active</span>
              </div>

              {/* Authenticate Trigger Button */}
              <button
                type="button"
                onClick={handleAuthenticate}
                disabled={isAuthenticating}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authorizing Clearance...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate & Access Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {authFeedback && (
                <p className="text-center text-[11px] font-mono text-blue-400 mt-3 animate-pulse">
                  {authFeedback}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Live System Telemetry Ticker */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            5 Fleet Nodes Broadcasting
          </span>
          <span className="text-slate-600 hidden sm:inline">&bull;</span>
          <span className="text-slate-400">PostgreSQL / PostGIS DB Connected</span>
          <span className="text-slate-600 hidden sm:inline">&bull;</span>
          <span className="text-slate-400">Sony IMX335 ANPR AI Engine: Active</span>
        </div>

        <div className="text-[11px] text-slate-500">
          Government of Tamil Nadu &bull; Municipal Smart Mobility Initiative
        </div>
      </footer>
    </div>
  );
};
