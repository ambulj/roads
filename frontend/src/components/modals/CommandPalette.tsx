import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, LayoutDashboard, ChartColumn, Truck, ClipboardList, Smartphone,
  Cpu, Calculator, Award, History, ShieldAlert, X, Sun, Moon, Keyboard
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  onTriggerDedup: () => void;
  onOpenRPIModal: () => void;
  onOpenBriefModal: () => void;
}

interface Action {
  id: string;
  label: string;
  icon: React.ElementType;
  category: string;
  shortcut?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen, onClose, onNavigate, onTriggerDedup, onOpenRPIModal, onOpenBriefModal,
}) => {
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState(0);
  const { toggleTheme, theme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const actions: Action[] = [
    { id: "nav-command",   label: "Command Center — Road Map",          icon: LayoutDashboard, category: "Navigate", shortcut: "1",   action: () => { onNavigate("command");     onClose(); } },
    { id: "nav-incidents", label: "Safety Incidents",                   icon: ShieldAlert,     category: "Navigate", shortcut: "2",   action: () => { onNavigate("incidents");   onClose(); } },
    { id: "nav-memory",    label: "Road History",                       icon: History,         category: "Navigate", shortcut: "3",   action: () => { onNavigate("memory");      onClose(); } },
    { id: "nav-analytics", label: "Analytics & Reports",                icon: ChartColumn,     category: "Navigate", shortcut: "4",   action: () => { onNavigate("analytics");   onClose(); } },
    { id: "nav-fleet",     label: "Fleet Nodes & Telemetry",            icon: Truck,           category: "Navigate", shortcut: "5",   action: () => { onNavigate("fleet");       onClose(); } },
    { id: "nav-orders",    label: "Work Orders",                        icon: ClipboardList,   category: "Navigate", shortcut: "6",   action: () => { onNavigate("work-orders"); onClose(); } },
    { id: "nav-capture",   label: "Report Issue / Field Camera",        icon: Smartphone,      category: "Navigate", shortcut: "7",   action: () => { onNavigate("capture");     onClose(); } },
    { id: "act-dedup",     label: "Run Spatial Deduplication (DBSCAN)", icon: Cpu,             category: "Action",   shortcut: "",    action: () => { onTriggerDedup();          onClose(); } },
    { id: "act-theme",     label: `Toggle Theme (currently ${theme === "dark" ? "Dark" : "Light"})`, icon: theme === "dark" ? Sun : Moon, category: "Action", shortcut: "T", action: () => { toggleTheme(); onClose(); } },
    { id: "act-rpi",       label: "Road Priority Index Formula",        icon: Calculator,      category: "Info",     shortcut: "",    action: () => { onOpenRPIModal();          onClose(); } },
    { id: "act-brief",     label: "Architecture & Project Brief",       icon: Award,           category: "Info",     shortcut: "",    action: () => { onOpenBriefModal();        onClose(); } },
  ];

  const filtered = actions.filter(
    (a) => a.label.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => { setCursor(0); }, [search]);

  const runCurrent = useCallback(() => {
    if (filtered[cursor]) filtered[cursor].action();
  }, [filtered, cursor]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((p) => Math.min(p + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((p) => Math.max(p - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        runCurrent();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, cursor, runCurrent, onClose]);

  // Scroll active item into view
  useEffect(() => {
    const item = listRef.current?.querySelector(`[data-cursor="${cursor}"]`) as HTMLButtonElement | null;
    item?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const CATEGORY_ORDER = ["Navigate", "Action", "Info"];
  const grouped = CATEGORY_ORDER.map((cat) => ({ cat, items: filtered.filter((a) => a.category === cat) })).filter((g) => g.items.length > 0);

  let globalIndex = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-xl shadow-modal overflow-hidden flex flex-col animate-scaleIn">
        {/* Search row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, navigate, or search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-medium min-w-0"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action list */}
        <div ref={listRef} className="max-h-80 overflow-y-auto custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No commands found for "{search}"</p>
            </div>
          ) : (
            grouped.map(({ cat, items }) => (
              <div key={cat}>
                <div className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {cat}
                </div>
                {items.map((item) => {
                  const Icon = item.icon;
                  const idx = globalIndex++;
                  const isActive = cursor === idx;
                  return (
                    <button
                      key={item.id}
                      data-cursor={idx}
                      onMouseEnter={() => setCursor(idx)}
                      onClick={item.action}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`} />
                        <span className="font-medium truncate">{item.label}</span>
                      </div>
                      {item.shortcut && (
                        <kbd className="shrink-0 ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <Keyboard className="w-3.5 h-3.5" />
            <span><kbd className="font-mono">↑ ↓</kbd> navigate</span>
            <span><kbd className="font-mono">↵</kbd> select</span>
            <span><kbd className="font-mono">Esc</kbd> close</span>
          </div>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">RoadSaarthi</span>
        </div>
      </div>
    </div>
  );
};
