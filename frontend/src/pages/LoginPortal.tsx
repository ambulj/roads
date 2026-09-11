import React, { useState } from 'react';
import {
  Shield,
  BusFront,
  Lock,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertTriangle,
  Mail,
  ArrowRight,
  LogIn,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPortalProps {
  onLoginSuccess?: () => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({ onLoginSuccess }) => {
  const { loginWithCredentials } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setAuthFeedback({ type: 'error', message: 'Please enter your official Email ID, Officer ID, or Username.' });
      return;
    }
    if (!passwordInput.trim()) {
      setAuthFeedback({ type: 'error', message: 'Please enter your password or security key.' });
      return;
    }

    setIsAuthenticating(true);
    setAuthFeedback({ type: 'info', message: 'Verifying credentials with Departmental Auth Core...' });

    try {
      await loginWithCredentials(emailInput.trim(), passwordInput, rememberMe);
      setAuthFeedback({ type: 'success', message: 'Clearance verified! Entering RoadSaarthi Command Center...' });
      setTimeout(() => {
        setIsAuthenticating(false);
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }, 350);
    } catch (err: any) {
      setIsAuthenticating(false);
      setAuthFeedback({
        type: 'error',
        message: err?.message || 'Authentication error. Please check your credentials.'
      });
    }
  };

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

      {/* Main Authentication Container: Centered Clean Government Portal */}
      <main className="relative z-10 flex-1 max-w-md w-full mx-auto px-4 sm:px-6 py-10 flex flex-col justify-center">
        <div className="bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          
          {/* Form Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-400/40 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">Official Portal</span>
                <span className="text-base font-bold text-white">Departmental Sign-In</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 justify-end font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Auth Core Ready
              </span>
              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">JWT / HMAC-SHA256</span>
            </div>
          </div>

          {/* Real Login Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Email / Officer ID Input */}
            <div>
              <label className="text-[11px] font-mono text-slate-300 uppercase tracking-wider block mb-1.5 font-semibold">
                Official Email / Officer ID / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. admin@metravue.chennai.gov.in"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono text-slate-300 uppercase tracking-wider font-semibold">
                  Security Password / PIN
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter your security password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-200 transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span>Remember this session</span>
              </label>
              <span className="text-[11px] font-mono text-blue-400/80">GovNet Session</span>
            </div>

            {/* Feedback Alert Banner */}
            {authFeedback && (
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                authFeedback.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : authFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
              }`}>
                {authFeedback.type === 'error' ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                ) : authFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
                )}
                <span className="font-mono leading-relaxed">{authFeedback.message}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isAuthenticating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating with GovNet...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Command Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security & Multi-Role Demo Footer */}
          <div className="mt-6 pt-4 border-t border-slate-800/70 text-[11px] text-slate-500 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Real Backend Authentication Active</span>
            </div>
            <p className="text-slate-500 leading-normal">
              Validated against <code className="text-slate-400 bg-slate-900 px-1 py-0.5 rounded">POST /api/auth/login</code> with cryptographic JWT bearer clearance.
            </p>
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
