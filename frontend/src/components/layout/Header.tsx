import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  BusFront,
  Menu,
  Play,
  Radio,
  Search,
  Zap,
  LogOut,
  Shield,
  ChevronDown,
  Cpu,
  Volume2,
  VolumeX,
  Printer,
  Keyboard,
  Sparkles,
  KeyRound,
  ShieldCheck,
  UploadCloud,
  Layers,
  Activity,
  HardDrive
} from "lucide-react";
import { ThemeToggle } from "../common/ThemeToggle";
import { LanguageToggle } from "../common/LanguageToggle";
import { LiveClock } from "../common/LiveClock";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { TrafficIncident } from "../../types";
import { NotificationCenter } from "./NotificationCenter";
import { audioAlerts } from "../../utils/audioAlerts";
import { api } from "../../services/api";

interface HeaderProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onOpenCommandPalette: () => void;
  onToggleMobileMenu?: () => void;
  onToggleSidebar?: () => void;
  isBackendConnected: boolean;
  activeNodesCount: number;
  onOpenRPIModal?: () => void;
  onOpenBriefModal?: () => void;
  onTriggerDedup?: () => void;
  onOpenAuthModal?: () => void;
  onOpenStreamModelModal?: () => void;
  onOpenDocumentModal?: () => void;
  onOpenShortcutsModal?: () => void;
  onOpenSensorFusionModal?: () => void;
  onOpenLifecycleDemo?: () => void;
  onOpenUploadModal?: () => void;
  incidents?: TrafficIncident[];
  onSelectIncident?: (incident: TrafficIncident) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
  onOpenCommandPalette,
  onToggleMobileMenu,
  onToggleSidebar,
  activeNodesCount,
  onOpenAuthModal,
  onOpenStreamModelModal,
  onOpenDocumentModal,
  onOpenShortcutsModal,
  onOpenSensorFusionModal,
  onOpenLifecycleDemo,
  onOpenUploadModal,
  incidents = [],
  onSelectIncident,
  isBackendConnected
}) => {
  const { user, logout, canRunInterventions, getRoleBadgeLabel } = useAuth();
  const { t } = useLanguage();
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(audioAlerts.getIsMuted());

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  const toggleNav = () => (window.innerWidth < 768 ? onToggleMobileMenu?.() : onToggleSidebar?.());
  const unreadAlertsCount = incidents.length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleMute = () => {
    const nextMuted = audioAlerts.toggleMute();
    setIsMuted(nextMuted);
  };

  return (
    <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 md:px-4 flex items-center justify-between z-30 select-none">
      {/* ── LEFT: BRAND & ARCHITECTURAL TIERS ──────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleNav}
          className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate("command")}>
          <div className="w-7 h-7 bg-cyan-950 border border-cyan-700 rounded flex items-center justify-center">
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">RoadSaarthi</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">v2.6</span>
            </div>
            <div className="text-[9.5px] text-zinc-500 font-mono hidden sm:block">
              AI Transit Sensing &amp; Municipal Platform
            </div>
          </div>
        </div>

        {/* Two-Tier Status Badges */}
        <div className="hidden lg:flex items-center gap-2 ml-3 pl-3 border-l border-zinc-200 dark:border-zinc-800 font-mono text-[10px]">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>T1 Edge: <strong>{activeNodesCount}/5 Nodes</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
            <span className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? "bg-emerald-400" : "bg-rose-400"}`}></span>
            <span>T2 Central: <strong>{isBackendConnected ? "Sync OK" : "Offline"}</strong></span>
          </div>
        </div>
      </div>

      {/* ── RIGHT: TOOLS, ROLE PROFILE & CONTROLS ─────────────────────────── */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-2 px-2.5 py-1 text-xs font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-zinc-400" />
          <span>Search</span>
          <kbd className="text-[9px] bg-zinc-200 dark:bg-zinc-800 px-1 py-0.2 rounded text-zinc-600 dark:text-zinc-400 font-mono">⌘K</kbd>
        </button>

        {/* Audio Mute Toggle */}
        <button
          onClick={handleToggleMute}
          className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
          title={isMuted ? "Unmute alerts audio" : "Mute alerts audio"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-zinc-400" /> : <Volume2 className="w-4 h-4 text-cyan-500" />}
        </button>

        {/* Theme & Language Toggles */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <LanguageToggle />
        </div>

        {/* Incident Alerts Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationCenterOpen(!isNotificationCenterOpen)}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors relative"
            title="Real-Time Incident Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-600 text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          <NotificationCenter
            isOpen={isNotificationCenterOpen}
            onClose={() => setIsNotificationCenterOpen(false)}
            incidents={incidents}
            onSelectIncident={onSelectIncident}
            onNavigate={onNavigate}
          />
        </div>

        {/* Active Role Persona Selector */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors text-left"
          >
            <div className="w-6 h-6 rounded bg-zinc-800 text-cyan-300 font-mono text-[10px] font-bold flex items-center justify-center border border-zinc-700">
              {user.avatar_initials || "AD"}
            </div>
            <div className="hidden sm:block">
              <div className="text-[11px] font-mono font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                {getRoleBadgeLabel(user.role)}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded shadow-lg py-1.5 z-50 font-mono text-xs">
              <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Logged In Officer</div>
                <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mt-0.5">{user.name}</div>
                <div className="text-[10px] text-zinc-500">{user.designation}</div>
                <div className="text-[9.5px] text-zinc-400 mt-1">{user.department}</div>
                <div className="mt-1.5 inline-block text-[9px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800">
                  Badge: {user.badge_number}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => { setIsProfileMenuOpen(false); onOpenAuthModal?.(); }}
                  className="w-full px-3 py-1.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Switch Officer Role Persona</span>
                </button>
                <button
                  onClick={() => { setIsProfileMenuOpen(false); onOpenShortcutsModal?.(); }}
                  className="w-full px-3 py-1.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-2"
                >
                  <Keyboard className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Keyboard Shortcuts (1–7)</span>
                </button>
                <button
                  onClick={() => { setIsProfileMenuOpen(false); onOpenDocumentModal?.(); }}
                  className="w-full px-3 py-1.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-2"
                >
                  <Printer className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Export Statutory Reports</span>
                </button>
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-1">
                <button
                  onClick={() => { setIsProfileMenuOpen(false); logout(); }}
                  className="w-full px-3 py-1.5 text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
