import React from 'react';
import { X, Keyboard, Command, Sparkles, Navigation, Sliders, Volume2, Shield } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: ShortcutItem[] = [
  // Navigation
  { keys: ['1'], description: 'Jump to Command Center (WebGIS Map)', category: 'Navigation' },
  { keys: ['2'], description: 'Jump to Traffic Incidents & E-Challans', category: 'Navigation' },
  { keys: ['3'], description: 'Jump to Road Memory & Time-Machine', category: 'Navigation' },
  { keys: ['4'], description: 'Jump to Analytics & QC Audits', category: 'Navigation' },
  { keys: ['5'], description: 'Jump to Fleet Telematics Nodes', category: 'Navigation' },
  { keys: ['6'], description: 'Jump to Work Orders & Escrow Ledger', category: 'Navigation' },
  { keys: ['7'], description: 'Jump to Mobile Dashcam Ingest', category: 'Navigation' },

  // Control Room Actions
  { keys: ['Ctrl', 'K'], description: 'Open Universal Command Palette & Search', category: 'Global Controls' },
  { keys: ['?'], description: 'Show Keyboard Shortcuts Cheat Sheet', category: 'Global Controls' },
  { keys: ['T'], description: 'Toggle Theme (Light / Dark)', category: 'Global Controls' },
  { keys: ['S'], description: 'Toggle Left Navigation Sidebar', category: 'Global Controls' },
  { keys: ['M'], description: 'Toggle Control Room Tactical Audio Alert Mute', category: 'Global Controls' },
  { keys: ['Esc'], description: 'Close any active modal or overlay', category: 'Global Controls' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const categories = Array.from(new Set(SHORTCUTS.map(s => s.category)));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden select-none">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Keyboard Shortcuts
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  POWER USER
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Execute rapid control room dispatches using single keystrokes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {categories.map((cat) => (
            <div key={cat} className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                {cat}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {SHORTCUTS.filter(s => s.category === cat).map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                      {s.description}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {s.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-0.5 min-w-[24px] text-center text-[11px] font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 shadow-xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50 text-xs text-slate-500">
          <span>Press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono font-bold">Esc</kbd> to dismiss at any time</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow-xs"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
};
