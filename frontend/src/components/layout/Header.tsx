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

        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate("command")}>
          <div className="w-8 h-8 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-lg flex items-center justify-center font-semibold text-sm shadow-xs">
            RS
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">RoadSaarthi</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">v2.6</span>
            </div>
            <div className="text-xs text-zinc-500 hidden sm:block font-normal">
              Civic Road Intelligence
            </div>
          </div>
        </div>

        {/* System Status Indicator */}
        <div className="hidden lg:flex items-center gap-2 ml-4 pl-4 border-l border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{activeNodesCount} Fleet Nodes Online</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium">
            <span className={`w-2 h-2 rounded-full ${isBackendConnected ? "bg-emerald-500" : "bg-rose-500"}`}></span>
            <span>{isBackendConnected ? "Central Live" : "Offline"}</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT: TOOLS, ROLE PROFILE & CONTROLS ─────────────────────────── */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-zinc-400" />
          <span>Search command...</span>
          <kbd className="text-xs bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400 font-mono">⌘K</kbd>
        </button>

        {/* Audio Mute Toggle */}
        <button
          onClick={handleToggleMute}
          className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          title={isMuted ? "Unmute alerts audio" : "Mute alerts audio"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-zinc-400" /> : <Volume2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />}
        </button>

        {/* Theme & Language Toggles */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageToggle />
        </div>

        {/* Incident Alerts Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationCenterOpen(!isNotificationCenterOpen)}
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors relative"
            title="Real-Time Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute 1 top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
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
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors text-left cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold flex items-center justify-center">
              {user.avatar_initials || "AD"}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                {getRoleBadgeLabel(user.role)}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl py-1.5 z-50 text-xs">
              <div className="px-3.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{user.name}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{user.designation}</div>
                <div className="text-xs text-zinc-400 dark:text-zinc-500">{user.department}</div>
                <div className="mt-2 inline-block text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-md font-mono">
                  ID: {user.badge_number}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => { setIsProfileMenuOpen(false); onOpenAuthModal?.(); }}
                  className="w-full px-3.5 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-zinc-500" />
                  <span>Switch Officer Role</span>
                </button>
                <button
                  onClick={() => { setIsProfileMenuOpen(false); onOpenShortcutsModal?.(); }}
                  className="w-full px-3.5 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Keyboard className="w-4 h-4 text-zinc-500" />
                  <span>Keyboard Shortcuts</span>
                </button>
                <button
                  onClick={() => { setIsProfileMenuOpen(false); onOpenDocumentModal?.(); }}
                  className="w-full px-3.5 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-zinc-500" />
                  <span>Export Reports</span>
                </button>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-1">
                <button
                  onClick={() => { setIsProfileMenuOpen(false); logout(); }}
                  className="w-full px-3.5 py-2 text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2.5 transition-colors cursor-pointer font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
