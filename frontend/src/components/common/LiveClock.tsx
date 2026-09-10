import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const LiveClock: React.FC<{ compact?: boolean; className?: string }> = ({ 
  compact = false,
  className = '' 
}) => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDigits = (n: number) => n.toString().padStart(2, '0');

  const hours = formatDigits(time.getHours());
  const minutes = formatDigits(time.getMinutes());
  const seconds = formatDigits(time.getSeconds());

  const dateFormatted = time.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div 
      className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#121622] backdrop-blur-sm text-slate-800 dark:text-slate-200 font-mono shadow-2xs select-none ${className}`}
      title={`Live System Clock (IST) — Synchronized with NavIC Master Clock\n${time.toLocaleString('en-IN')}`}
    >
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 hidden sm:block" />
      </div>

      <div className="flex items-baseline gap-1 text-xs font-bold tracking-wider">
        <span className="text-slate-900 dark:text-white tabular-nums">
          {hours}:{minutes}:{seconds}
        </span>
        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
          IST
        </span>
      </div>

      {!compact && (
        <div className="hidden xl:flex items-center border-l border-slate-200 dark:border-slate-800 pl-2 text-[10.5px] text-slate-500 dark:text-slate-400 font-sans">
          <span>{dateFormatted}</span>
        </div>
      )}
    </div>
  );
};
