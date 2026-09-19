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
  ShieldCheck
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
  onOpenInterventionModal?: () => void;
  onOpenStreamModelModal?: () => void;
  onOpenDocumentModal?: () => void;
  onOpenShortcutsModal?: () => void;
  onOpenSensorFusionModal?: () => void;
  onOpenLifecycleDemo?: () => void;
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
  onOpenStreamModelModal,
  onOpenDocumentModal,
  onOpenShortcutsModal,
  onOpenSensorFusionModal,
  onOpenLifecycleDemo,
  incidents = [],
  onSelectIncident
}) => {
  const { user, logout, canRunInterventions, getRoleBadgeLabel } = useAuth();
  const { t } = useLanguage();
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(audioAlerts.getIsMuted());
  const [simStatus, setSimStatus] = useState<{ demo_mode: boolean; fleet_simulation_active: boolean; synthetic_generation_active: boolean } | null>(null);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  const toggleNav = () => (window.innerWidth < 768 ? onToggleMobileMenu?.() : onToggleSidebar?.());
  const unreadAlertsCount = incidents.length;

  useEffect(() => {
    api.getSimulationStatus().then((status) => {
      if (status) setSimStatus(status);
    }).catch(() => {});
  }, []);

  const handleToggleSimulation = async () => {
    const nextDemoMode = !(simStatus?.demo_mode);
    const res = await api.toggleSimulation({ demo_mode: nextDemoMode });
    if (res?.status) {
      setSimStatus(res.status);
    }
  };


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

        {/* Right Header Navigation & Actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Live System Clock */}
          <LiveClock className="hidden lg:flex text-xs font-mono text-slate-500" />

          {/* End-to-End Simulation Demo Button */}
          {onOpenLifecycleDemo && (
            <button
              onClick={onOpenLifecycleDemo}
              title="Run End-to-End Interactive Civic Lifecycle Simulation (Bus -> Verification -> Re-Pass)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-sm shadow-blue-900/20 transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Interactive Demo</span>
            </button>
          )}

          {/* Active Nodes Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-700 dark:text-slate-300 font-semibold">{activeNodesCount || 5} Buses Active</span>
          </div>

          {/* Notification Center */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationCenterOpen((p) => !p)}
              title="Notifications"
              className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>

            {isNotificationCenterOpen && (
              <NotificationCenter
                isOpen={isNotificationCenterOpen}
                incidents={incidents}
                onNavigate={onNavigate}
                onSelectIncident={(inc) => {
                  setIsNotificationCenterOpen(false);
                  onSelectIncident?.(inc);
                }}
                onClose={() => setIsNotificationCenterOpen(false)}
              />
            )}
          </div>

          {/* Language Toggle */}
          <LanguageToggle />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Officer Persona & Account Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen((p) => !p)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs font-medium cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px]">
                {user.name.charAt(0)}
              </div>
              <div className="hidden md:block text-left leading-none">
                <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">{user.name}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{getRoleBadgeLabel(user.role)}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-2 z-50 text-xs space-y-1">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white">{user.name}</div>
                  <div className="text-[11px] text-slate-500">{user.designation}</div>
                  <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400 mt-0.5">{user.agency}</div>
                </div>

                <button
                  onClick={handleOpenSwitcher}
                  className="w-full px-3 py-2 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium"
                >
                  <KeyRound className="w-3.5 h-3.5 text-blue-500" />
                  <span>Switch Officer Role</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2 text-left rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
