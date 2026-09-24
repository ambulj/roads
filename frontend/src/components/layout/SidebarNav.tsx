import React from "react";
import {
  LayoutDashboard,
  Bus,
  Compass,
  AlertTriangle,
  Wrench,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
  Camera,
  Cpu,
  Layers,
  Activity,
  HardDrive
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
  onTriggerDedup: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  route: string;
  tier: "edge" | "central";
  badge?: string | number | null;
  badgeVariant?: "cyan" | "rose" | "amber" | "emerald" | "zinc";
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
  const { user, meta, hasAccessToRoute, getRoleBadgeLabel } = useAuth();
  const isExpanded = !isCollapsed || isMobileOpen;

  const allMenuItems: NavItem[] = [
    // ── Tier 1: On-Bus Edge Intelligence ──
    {
      id: "fleet",
      label: t("nav.fleet", "Fleet Edge Nodes"),
      icon: Bus,
      route: "fleet",
      tier: "edge",
      badge: fleetCount > 0 ? `${fleetCount} Nodes` : "5 Nodes",
      badgeVariant: "cyan"
    },
    {
      id: "capture",
      label: t("nav.capture", "Dashcam Ingest"),
      icon: Camera,
      route: "capture",
      tier: "edge",
      badge: "AIS-140",
      badgeVariant: "zinc"
    },
    // ── Tier 2: Centralized Civic Platform ──
    {
      id: "command",
      label: t("nav.command", "Command Center"),
      icon: LayoutDashboard,
      route: "command",
      tier: "central"
    },
    {
      id: "incidents",
      label: t("nav.incidents", "Incidents & ANPR"),
      icon: AlertTriangle,
      route: "incidents",
      tier: "central",
      badge: incidentsCount > 0 ? incidentsCount : "7",
      badgeVariant: "rose"
    },
    {
      id: "work-orders",
      label: t("nav.workOrders", "Work Orders & SLA"),
      icon: Wrench,
      route: "work-orders",
      tier: "central",
      badge: clustersCount > 0 ? clustersCount : "8",
      badgeVariant: "amber"
    },
    {
      id: "memory",
      label: t("nav.memory", "Road Intelligence"),
      icon: Compass,
      route: "memory",
      tier: "central"
    },
    {
      id: "analytics",
      label: user.role === "admin2" ? "Edge AI Analytics" : t("nav.analytics", "Transit Analytics"),
      icon: user.role === "admin2" ? Cpu : ChartColumn,
      route: "analytics",
      tier: user.role === "admin2" ? "edge" : "central",
      badge: user.role === "admin2" ? "RK3588" : "GTFS",
      badgeVariant: "cyan"
    }
  ];

  // Filter items authorized for active persona
  const menuItems = allMenuItems.filter((item) => hasAccessToRoute(item.route));
  const edgeItems = menuItems.filter((item) => item.tier === "edge");
  const centralItems = menuItems.filter((item) => item.tier === "central");

  const handleClick = (route: string) => {
    onNavigate(route);
    if (isMobileOpen) onCloseMobile();
  };

  const renderNavGroup = (title: string, subtitle: string, items: NavItem[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        {isExpanded && (
          <div className="px-3 mb-1.5">
            <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              {title}
            </div>
          </div>
        )}
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.route)}
                title={!isExpanded ? item.label : undefined}
                className={`
                  w-full min-h-[38px] flex items-center gap-3 px-3 py-2 text-xs transition-all text-left rounded-lg cursor-pointer
                  ${isActive 
                    ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 font-semibold shadow-xs" 
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium"
                  }
                  ${!isExpanded ? "justify-center px-0" : ""}
                `}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"}`} />
                {isExpanded && (
                  <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
                )}
                {isExpanded && item.badge && (
                  <span
                    className={`
                      text-xs px-2 py-0.5 rounded-full font-medium shrink-0
                      ${item.badgeVariant === "rose" ? "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300" : ""}
                      ${item.badgeVariant === "amber" ? "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300" : ""}
                      ${item.badgeVariant === "cyan" ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300" : ""}
                      ${item.badgeVariant === "emerald" ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300" : ""}
                      ${item.badgeVariant === "zinc" || !item.badgeVariant ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400" : ""}
                    `}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
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
          flex flex-col bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300
          border-r border-zinc-200 dark:border-zinc-800
          transition-all duration-150 ease-in-out select-none
          ${isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"}
          ${isCollapsed && !isMobileOpen ? "md:w-[60px]" : "md:w-64"}
        `}
      >
        {/* Mobile-only Top Close Bar */}
        <div className="md:hidden h-12 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-100 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-500" />
            <span className="font-bold text-xs font-mono text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">RoadSaarthi</span>
          </div>
          <button onClick={onCloseMobile} className="p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Role Persona Tag */}
        {isExpanded && (
          <div className="px-3.5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/40 dark:bg-zinc-950/40">
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {getRoleBadgeLabel(user.role)}
            </div>
            <div className="text-xs text-zinc-500 truncate mt-0.5 font-normal">
              {user.name}
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {renderNavGroup("Onboard Edge", "Onboard", edgeItems)}
          {renderNavGroup("Central Platform", "ICCC", centralItems)}
        </div>

        {/* Bottom Collapse Toggle & System Status */}
        <div className="p-2.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100/40 dark:bg-zinc-950/40 text-xs flex items-center justify-between">
          {isExpanded ? (
            <>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isBackendConnected ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                <span className="text-zinc-500 font-medium">{isBackendConnected ? "Connected" : "Disconnected"}</span>
              </div>
              <button
                onClick={onToggleCollapse}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded cursor-pointer"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onToggleCollapse}
              className="w-full flex justify-center py-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded cursor-pointer"
              title="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
