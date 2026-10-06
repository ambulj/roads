import React from "react";
import {
  LayoutDashboard,
  Bus,
  Compass,
  Wrench,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  X,
  Cpu,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";

interface SidebarNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  incidentsCount: number;
  fleetCount: number;
  clustersCount: number;
  isBackendConnected: boolean;
  onTriggerDedup?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  route: string;
  badge?: string | number | null;
  badgeVariant?: "indigo" | "cyan" | "rose" | "amber" | "emerald" | "zinc";
  pulseDot?: boolean;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentRoute,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  incidentsCount,
  fleetCount,
  clustersCount,
  isBackendConnected,
}) => {
  const { t } = useLanguage();
  const { user, hasAccessToRoute } = useAuth();
  const isExpanded = !isCollapsed || isMobileOpen;

  // ── 5 Core High-Cohesion Municipal Workspaces ──
  const allMenuItems: NavItem[] = [
    {
      id: "command",
      label: t("nav.command", "Command Center & Map"),
      icon: LayoutDashboard,
      route: "command",
      pulseDot: true,
    },
    {
      id: "work-orders",
      label: t("nav.workOrders", "Work Orders & SLA"),
      icon: Wrench,
      route: "work-orders",
      badge: clustersCount > 0 ? clustersCount : "8",
      badgeVariant: "amber",
    },
    {
      id: "analytics",
      label: user.role === "admin2" ? "Edge AI Analytics" : t("nav.analytics", "Safety & Traffic Analytics"),
      icon: user.role === "admin2" ? Cpu : ChartColumn,
      route: "analytics",
      badge: user.role === "admin2" ? "RK3588" : (incidentsCount > 0 ? incidentsCount : "7"),
      badgeVariant: "rose",
    },
    {
      id: "fleet",
      label: t("nav.fleet", "Fleet Perception & Edge"),
      icon: Bus,
      route: "fleet",
      badge: fleetCount > 0 ? `${fleetCount} Nodes` : "5 Nodes",
      badgeVariant: "indigo",
    },
    {
      id: "memory",
      label: t("nav.memory", "Governance & Memory"),
      icon: Compass,
      route: "memory",
      badge: "MoHUA",
      badgeVariant: "zinc",
    },
  ];

  // Filter items authorized for active persona
  const menuItems = allMenuItems.filter((item) => hasAccessToRoute(item.route));

  const handleClick = (route: string) => {
    onNavigate(route);
    if (isMobileOpen) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:static top-0 bottom-0 left-0 z-50
          flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300
          border-r border-slate-200 dark:border-slate-800
          transition-all duration-150 ease-in-out select-none
          ${isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"}
          ${isCollapsed && !isMobileOpen ? "md:w-[60px]" : "md:w-64"}
        `}
      >
        {/* Mobile-only Top Close Bar */}
        <div className="md:hidden h-12 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-100 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-bold text-xs tracking-wider">
              RS
            </div>
            <span className="font-bold text-xs font-mono text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              RoadSaathi
            </span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;
            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handleClick(item.route)}
                  className={`
                    w-full min-h-[40px] flex items-center gap-3 px-3 py-2 text-xs transition-all text-left rounded-lg cursor-pointer
                    ${isActive
                      ? "border-l-3 border-indigo-600 dark:border-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-100 font-semibold shadow-xs"
                      : "border-l-3 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
                    }
                    ${!isExpanded ? "justify-center px-0 border-l-0" : ""}
                  `}
                  aria-label={item.label}
                >
                  <div className="relative shrink-0 flex items-center justify-center">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-indigo-700 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
                      }`}
                    />
                    {item.pulseDot && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  {isExpanded && (
                    <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.label}
                    </span>
                  )}
                  {isExpanded && item.badge && (
                    <span
                      className={`
                        text-[11px] px-2 py-0.5 rounded-full font-semibold tabular-nums shrink-0
                        ${item.badgeVariant === "rose" ? "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300" : ""}
                        ${item.badgeVariant === "amber" ? "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300" : ""}
                        ${item.badgeVariant === "indigo" ? "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300" : ""}
                        ${item.badgeVariant === "cyan" ? "bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300" : ""}
                        ${item.badgeVariant === "emerald" ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300" : ""}
                        ${item.badgeVariant === "zinc" || !item.badgeVariant ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" : ""}
                      `}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>

                {/* Floating Tooltip in Collapsed Desktop Mode */}
                {!isExpanded && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs px-2.5 py-1 rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center gap-1.5">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-700 dark:bg-zinc-300 text-white dark:text-zinc-900 font-mono">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Collapse Toggle & System Status */}
        <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-100/40 dark:bg-slate-950/40 text-xs flex items-center justify-between">
          {isExpanded ? (
            <>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isBackendConnected ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                <span className="text-slate-500 font-medium">
                  {isBackendConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <button
                onClick={onToggleCollapse}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded cursor-pointer"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onToggleCollapse}
              className="w-full flex justify-center py-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
