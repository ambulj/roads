import React from 'react';
import { CircleCheck } from 'lucide-react';
import { PerceptionLogEntry } from '../../types';

interface PerceptionLogProps {
  latestLog?: PerceptionLogEntry;
  latencyMs: number;
}

export const PerceptionLog: React.FC<PerceptionLogProps> = ({ latestLog, latencyMs }) => {
  const displayLog = latestLog || {
    bus_id: 'MTC Bus #1042',
    corridor: 'GST Road (NH-32)',
    message: 'Ingested GPS telemetry pass from MTC Bus #1042 on GST Road (NH-32) • 5Hz coordinate lock confirmed.',
    type: 'FLEET TELEMETRY'
  };

  return (
    <div className="px-3 pt-1.5 pb-0 shrink-0 z-10 select-none">
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs overflow-hidden shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 tracking-wider hidden sm:inline">
              AUDIT LOG
            </span>
          </div>
          <div className="h-3.5 w-px bg-slate-200 dark:border-slate-800 shrink-0" />
          <div className="flex items-center gap-2 min-w-0 transition-opacity duration-200 opacity-100">
            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold tracking-wide border shrink-0 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60">
              {displayLog.type}
            </span>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 truncate">
              {displayLog.message}
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 shrink-0 pl-3">
          <CircleCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">Latency: {latencyMs}ms</span>
        </div>
      </div>
    </div>
  );
};
