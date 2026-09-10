import React, { useEffect, useId, useRef, useState } from 'react';
import { Bus, AlertTriangle, ShieldCheck, HelpCircle, Layers, Clock3 } from 'lucide-react';
import { TruthStatus } from '../../types';

interface MultiBusTruthBadgeProps {
  passesCount?: number;
  busesCount?: number;
  consensusScore?: number;
  defectType?: string;
  lastVerifiedAgo?: string;
  busesList?: string[];
  compact?: boolean;
}

export const MultiBusTruthBadge: React.FC<MultiBusTruthBadgeProps> = ({
  passesCount = 14,
  busesCount = 3,
  consensusScore = 94,
  defectType = 'D40',
  lastVerifiedAgo = '12m ago',
  busesList = ['MTC-1042', 'MTC-1088', 'MTC-2015'],
  compact = false,
}) => {
  const [showPopover, setShowPopover] = useState(false);
  const popoverId = useId();
  const badgeRef = useRef<HTMLDivElement>(null);

  // Derive truth status
  let status: TruthStatus = 'CONFIRMED';
  if (busesCount >= 3 && consensusScore >= 85) {
    status = 'CONFIRMED';
  } else if (busesCount >= 2) {
    status = 'STRONG_SIGNAL';
  } else if (busesCount === 1) {
    status = 'UNVERIFIED';
  } else {
    status = 'STALE';
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'CONFIRMED':
        return {
          label: `Confirmed (${busesCount} Buses)`,
          shortLabel: `${busesCount} Buses`,
          icon: ShieldCheck,
          bg: 'bg-emerald-50 dark:bg-emerald-950/60',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-200 dark:border-emerald-800/80',
          ring: 'ring-emerald-500/20'
        };
      case 'STRONG_SIGNAL':
        return {
          label: 'Strong Signal (2 Passes)',
          shortLabel: '2 Passes',
          icon: Layers,
          bg: 'bg-amber-50 dark:bg-amber-950/60',
          text: 'text-amber-700 dark:text-amber-300',
          border: 'border-amber-200 dark:border-amber-800/80',
          ring: 'ring-amber-500/20'
        };
      case 'UNVERIFIED':
        return {
          label: 'Single Raw Detection',
          shortLabel: '1 Pass',
          icon: AlertTriangle,
          bg: 'bg-slate-100 dark:bg-slate-800',
          text: 'text-slate-600 dark:text-slate-400',
          border: 'border-slate-200 dark:border-slate-700',
          ring: 'ring-slate-500/20'
        };
      case 'STALE':
        return {
          label: 'Stale / No Recurrence',
          shortLabel: 'Stale',
          icon: HelpCircle,
          bg: 'bg-slate-100 dark:bg-slate-800',
          text: 'text-slate-700 dark:text-slate-300',
          border: 'border-slate-200 dark:border-slate-700',
          ring: 'ring-slate-500/20'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  // Accept the human-readable values already used across the command centre
  // ("12m ago", "2h ago", "1d ago") without relying on the client clock.
  const freshnessMinutes = (() => {
    const match = String(lastVerifiedAgo).trim().match(/(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days)?/i);
    if (!match) return 360;
    const amount = Number(match[1]);
    if (!Number.isFinite(amount)) return 360;
    const unit = (match[2] || 'm').toLowerCase();
    const multiplier = unit.startsWith('d') ? 1440 : unit.startsWith('h') ? 60 : 1;
    return Math.max(0, Math.round(amount * multiplier));
  })();
  const freshness = freshnessMinutes <= 30
    ? { label: 'Freshly verified', action: 'No re-verification needed', meter: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300' }
    : freshnessMinutes <= 120
      ? { label: 'Review window', action: 'Re-verify on the next fleet pass', meter: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300' }
      : { label: 'Re-verification due', action: 'Request a new independent observation', meter: 'bg-slate-500', text: 'text-slate-700 dark:text-slate-300' };
  const freshnessPercent = Math.max(8, Math.min(100, Math.round(100 - (freshnessMinutes / 240) * 100)));

  useEffect(() => {
    const dismissOutside = (event: MouseEvent) => {
      if (badgeRef.current && !badgeRef.current.contains(event.target as Node)) setShowPopover(false);
    };
    const dismissEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowPopover(false);
    };
    document.addEventListener('mousedown', dismissOutside);
    document.addEventListener('keydown', dismissEscape);
    return () => {
      document.removeEventListener('mousedown', dismissOutside);
      document.removeEventListener('keydown', dismissEscape);
    };
  }, []);

  return (
    <div ref={badgeRef} className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setShowPopover((open) => !open)}
        aria-expanded={showPopover}
        aria-controls={popoverId}
        aria-haspopup="dialog"
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] font-semibold transition-all shadow-2xs hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${config.bg} ${config.text} ${config.border} ring-1 ${config.ring}`}
        title="View Multi-Bus observation provenance"
      >
        <Icon className="w-3 h-3 shrink-0" />
        <span>{compact ? config.shortLabel : config.label}</span>
        <span className="font-mono text-[10px] opacity-80 font-bold">({consensusScore}%)</span>
        <span className="inline-flex items-center gap-0.5 font-mono text-[9px] opacity-75" aria-label={`Last verified ${lastVerifiedAgo}`}>
          <Clock3 className="w-2.5 h-2.5" aria-hidden="true" />{lastVerifiedAgo}
        </span>
        <span className="w-7 h-1 rounded-full bg-slate-200/80 dark:bg-slate-700/80 overflow-hidden" aria-label={`${freshness.label}; freshness ${freshnessPercent}%`}>
          <span className={`block h-full ${freshness.meter}`} style={{ width: `${freshnessPercent}%` }} />
        </span>
      </button>

      {/* Provenance Details Popover */}
      {showPopover && (
        <div id={popoverId} role="dialog" aria-label="Multi-Bus observation provenance" className="absolute left-0 mt-1.5 w-64 p-3.5 rounded-2xl bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 shadow-xl z-50 text-xs animate-fadeIn">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Bus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Sensor Consensus Truth
            </span>
            <span className="text-[10px] font-mono text-slate-400">{lastVerifiedAgo}</span>
          </div>

          <div className="space-y-2 text-slate-600 dark:text-slate-300">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Total Sensing Passes:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{passesCount} passes</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Independent Buses:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{busesCount} units</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Model-IMU Agreement:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{consensusScore}% consensus</span>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Confidence freshness</span>
                <span className={`font-mono text-[10px] font-bold ${freshness.text}`}>{freshness.label}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden" role="progressbar" aria-label="Confidence freshness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={freshnessPercent}>
                <div className={`h-full rounded-full ${freshness.meter}`} style={{ width: `${freshnessPercent}%` }} />
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">{freshness.action}. Last independent confirmation: {lastVerifiedAgo}.</p>
            </div>

            {/* Buses Badge List */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Cross-Validating Fleet Units:
              </span>
              <div className="flex flex-wrap gap-1">
                {busesList.map((busId) => (
                  <span
                    key={busId}
                    className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    {busId}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
