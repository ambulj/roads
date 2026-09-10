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
  Sparkles
} from "lucide-react";
import { ThemeToggle } from "../common/ThemeToggle";
import { LanguageToggle } from "../common/LanguageToggle";
import { LiveClock } from "../common/LiveClock";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { TrafficIncident } from "../../types";
import { NotificationCenter } from "./NotificationCenter";
import { audioAlerts } from "../../utils/audioAlerts";

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
  onOpenInterventionModal?: () => void;
  onOpenScenarioModal?: () => void;
  onOpenStreamModelModal?: () => void;
  onOpenDocumentModal?: () => void;
  onOpenShortcutsModal?: () => void;
  onOpenSensorFusionModal?: () => void;
  isDemoMode?: boolean;
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
  onOpenInterventionModal,
  onOpenScenarioModal,
  onOpenStreamModelModal,
  onOpenDocumentModal,
  onOpenShortcutsModal,
  onOpenSensorFusionModal,
  isDemoMode = false,
  incidents = [],
  onSelectIncident
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
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    logout();
  };

  const handleOpenSwitcher = () => {
    setIsProfileMenuOpen(false);
    onOpenAuthModal?.();
  };

  return (
    <header className="relative z-40 h-[64px] shrink-0 border-b border-[#d9d5ce] bg-[#fcfbf8] px-3 text-[#20232a] dark:border-[#2b303d] dark:bg-[#11141c] dark:text-[#f3f0e9] sm:px-5">
      <div className="flex h-full items-center gap-3">
        {/* Mobile / Sidebar Menu Toggle */}
        <button
          onClick={toggleNav}
          aria-label="Toggle Sidebar"
          title="Toggle navigation sidebar"
          className="grid h-9 w-9 place-items-center rounded-lg border border-transparent text-[#5f6470] transition hover:border-[#d9d5ce] hover:bg-[#f1efe9] dark:text-[#a6a8b0] dark:hover:border-[#30323b] dark:hover:bg-[#1d2028]"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Brand Logo & Name */}
        <button
          onClick={() => onNavigate("command")}
          aria-label="RoadSaarthi command center"
          className="group flex items-center gap-2.5 text-left shrink-0"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#252a3a] text-[#f5c552] shadow-[2px_2px_0_#f5c552] dark:bg-[#f5c552] dark:text-[#20232a]">
            <BusFront className="h-4 w-4" />
          </span>
          <span className="hidden min-[480px]:block">
            <span className="block font-serif text-[16px] font-bold leading-none tracking-tight">
              RoadSaarthi
            </span>
            <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[.14em] text-[#737783] dark:text-[#9da0aa]">
              Chennai Intelligence
            </span>
          </span>
        </button>

        <div className="hidden h-6 w-px bg-[#d9d5ce] sm:block dark:bg-[#2b303d]" />

        {/* Global Omnibox Search (Ctrl+K) */}
        <button
          onClick={onOpenCommandPalette}
          title={t("header.searchPlaceholder", "Search buses, roads, hazards... (Ctrl+K)")}
          className="flex h-9 max-w-[380px] flex-1 items-center gap-2 rounded-lg border border-[#d9d5ce] bg-white px-3 text-left font-mono text-[11px] text-[#737783] transition hover:border-[#777b86] dark:border-[#2b303d] dark:bg-[#161a24] dark:text-[#a6a8b0]"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="truncate">{t("header.searchPlaceholder", "Search buses, corridors, incidents...")}</span>
          <kbd className="ml-auto hidden rounded border border-[#d9d5ce] px-1.5 py-0.5 text-[9px] sm:block dark:border-[#424550]">
            Ctrl K
          </kbd>
        </button>

        {/* Right Header Navigation & Unified Tools */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {/* Live System Clock */}
          <LiveClock className="hidden lg:flex" />

          {/* Live Node Telemetry Pulse Pill */}
          <button
            onClick={onOpenScenarioModal}
            title={
              isDemoMode
                ? "Demo Mode Active — Click to manage scenarios"
                : "Live Telemetry Active — Click to run simulation drill"
            }
            className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 font-mono text-[10.5px] font-bold tracking-wide transition ${
              isDemoMode
                ? "border-[#dcae3b] bg-[#fff6dc] text-[#8b5e00] dark:bg-[#332810] dark:text-[#f5c552]"
                : "border-[#b7d9c3] bg-[#edf8f0] text-[#17623a] dark:border-[#235b43] dark:bg-[#10261c] dark:text-[#90d7aa]"
            }`}
          >
            {isDemoMode ? <Play className="h-3 w-3" /> : <Radio className="h-3 w-3 animate-pulse" />}
            <span className="hidden sm:inline">
              {isDemoMode ? "Demo Mode" : `${activeNodesCount || 24} Nodes`}
            </span>
          </button>

          {/* Unified "Tools & Actions" Popover Dropdown (Cleanly replaces 4 separate buttons) */}
          <div className="relative" ref={toolsMenuRef}>
            <button
              onClick={() => setIsToolsMenuOpen((prev) => !prev)}
              title="Command Tools & Diagnostics"
              className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 font-mono text-[10.5px] font-bold transition shadow-xs ${
                isToolsMenuOpen
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                  : "border-[#d9d5ce] bg-white text-[#20232a] hover:border-[#777b86] dark:border-[#2b303d] dark:bg-[#161a24] dark:text-[#f3f0e9]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden md:inline">{t("header.tools", "Tools")}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {isToolsMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121722] shadow-2xl z-50 p-2 select-none animate-slideUp flex flex-col gap-1">
                <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                  {t("header.toolsTitle", "Executive Tools & Actions")}
                </div>

                {canRunInterventions && (
                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      onOpenInterventionModal?.();
                    }}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition text-left"
                  >
                    <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <div className="leading-tight">{t("header.whatIf", "What-If Intervention")}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{t("header.whatIfSub", "Simulate road repair actions")}</div>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsToolsMenuOpen(false);
                    onOpenStreamModelModal?.();
                  }}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition text-left"
                >
                  <Cpu className="w-4 h-4 text-blue-500 shrink-0" />
                  <div>
                    <div className="leading-tight">{t("header.aiWeights", "AI Weights & Streams")}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{t("header.aiWeightsSub", "Zero-hardware RTSP & .pt models")}</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsToolsMenuOpen(false);
                    onOpenSensorFusionModal?.();
                  }}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition text-left"
                >
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <div className="leading-tight">{t("header.sensorFusion", "Sensor Fusion (<45ms)")}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{t("header.sensorFusionSub", "AIS-140 & RTSP Zero-Hardware Engine")}</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsToolsMenuOpen(false);
                    onOpenDocumentModal?.();
                  }}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition text-left"
                >
                  <Printer className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <div className="leading-tight">{t("header.pdfSummons", "1-Click PDF Summons")}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{t("header.pdfSummonsSub", "Contractor liquidated damages notice")}</div>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

                {/* Quick Audio & Shortcuts in Tools */}
                <button
                  onClick={() => {
                    const next = audioAlerts.toggleMute();
                    setIsMuted(next);
                  }}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-2">
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-blue-500" />}
                    <span>{t("header.soundAlerts", "Sound Alerts")}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">Key 'M'</span>
                </button>

                <button
                  onClick={() => {
                    setIsToolsMenuOpen(false);
                    onOpenShortcutsModal?.();
                  }}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-2">
                    <Keyboard className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t("header.shortcuts", "Keyboard Hotkeys")}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">Key '?'</span>
                </button>
              </div>
            )}
          </div>

          <ThemeToggle compact />
          <LanguageToggle />

          {/* Notification Bell with Live Counter & Popover */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationCenterOpen((prev) => !prev)}
              title="Live Incident Notifications"
              aria-label="Notifications"
              className="relative grid h-8 w-8 place-items-center rounded-lg text-[#5f6470] transition hover:bg-[#f1efe9] dark:text-[#a6a8b0] dark:hover:bg-[#1d2028]"
            >
              <Bell className="h-4 w-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#d85045]"></span>
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

          {/* Officer Profile Button & Interactive Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              title={`Logged in as ${user.name} (${getRoleBadgeLabel(user.role)})`}
              className="flex h-8 items-center gap-2 rounded-lg border border-[#d9d5ce] bg-white py-1 pl-2 pr-1.5 transition hover:border-[#777b86] dark:border-[#2b303d] dark:bg-[#161a24] cursor-pointer"
            >
              <span className="hidden max-w-[110px] text-left xl:block">
                <span className="block truncate font-mono text-[9px] font-bold uppercase tracking-[.06em] text-[#3949ab] dark:text-[#aeb8ff]">
                  {getRoleBadgeLabel(user.role)}
                </span>
                <span className="block truncate text-[10px] text-[#737783]">{user.name}</span>
              </span>
              <span className="grid h-6 w-6 place-items-center rounded bg-[#20232a] font-mono text-[9.5px] font-bold text-[#f5c552] dark:bg-[#f5c552] dark:text-[#20232a]">
                {user.avatar_initials}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1320] shadow-2xl z-50 p-3 select-none animate-slideUp">
                {/* Officer Header Card */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      {user.avatar_initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">{user.designation}</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>{user.badge_number}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">● {t("header.activeSession", "Active Session")}</span>
                  </div>
                </div>

                {/* Switch Role Button */}
                <button
                  onClick={handleOpenSwitcher}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center gap-2.5 transition"
                >
                  <Shield className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t("header.switchRole", "Switch Officer Persona")}</span>
                </button>

                {/* Sign Out / Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2 mt-1 rounded-xl text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition border-t border-slate-100 dark:border-slate-800 pt-2"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>{t("header.signOut", "Sign Out of Console")}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
