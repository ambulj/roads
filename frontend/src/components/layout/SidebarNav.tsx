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
  Camera
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
  badge?: string | number | null;
  badgeVariant?: "blue" | "rose" | "amber" | "emerald";
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
    { id: "command", label: t("nav.command", "Dashboard"), icon: LayoutDashboard, route: "command" },
    { id: "fleet", label: t("nav.fleet", "Fleet Telemetry"), icon: Bus, route: "fleet", badge: fleetCount > 0 ? fleetCount : "5", badgeVariant: "blue" },
    { id: "memory", label: t("nav.memory", "Road Intelligence"), icon: Compass, route: "memory" },
    { id: "incidents", label: t("nav.incidents", "Incidents & Enforcement"), icon: AlertTriangle, route: "incidents", badge: incidentsCount > 0 ? incidentsCount : "5", badgeVariant: "rose" },
    { id: "work-orders", label: t("nav.workOrders", "Work Orders & 3D"), icon: Wrench, route: "work-orders", badge: clustersCount > 0 ? clustersCount : "12", badgeVariant: "amber" },
    { id: "analytics", label: t("nav.analytics", "Analytics & Reports"), icon: ChartColumn, route: "analytics" },
    { id: "capture", label: t("nav.capture", "Edge Dashcam Ingest"), icon: Camera, route: "capture" }
  ];

  // Filter only items this officer persona is authorized to access
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
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:static top-0 bottom-0 left-0 z-50
          flex flex-col bg-[#f6f4ef] dark:bg-[#151820] text-[#4f535d] dark:text-[#c4c5ca]
          border-r border-[#d9d5ce] dark:border-[#30323b]
          shadow-xl md:shadow-none transition-all duration-200 ease-in-out select-none
          ${isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"}
          ${isCollapsed && !isMobileOpen ? "md:w-[68px]" : "md:w-60"}
        `}
      >
        {/* Mobile-only Close Bar */}
        <div className="md:hidden h-12 px-4 border-b border-[#d9d5ce] dark:border-[#30323b] flex items-center justify-between bg-[#eeece6] dark:bg-[#111319]">
          <div className="flex items-center gap-2">
            <Bus className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
            <span className="font-extrabold text-xs text-[#20232a] dark:text-[#f3f0e9] uppercase tracking-wider">ROADSAARTHI</span>
          </div>
          <button onClick={onCloseMobile} className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clearance Level Label */}
        {isExpanded && (
          <div className="px-4 pt-3 pb-1">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3 h-3 text-blue-500" />
                {getRoleBadgeLabel(user.role)}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {menuItems.length} {t("nav.views", "Views")}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;
            const collapsed = isCollapsed && !isMobileOpen;

            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handleClick(item.route)}
                  title={item.label}
                  className={`
                    w-full flex items-center text-xs font-sans border-l-2 transition-all duration-150 outline-none cursor-pointer
                    ${collapsed ? "justify-center p-2.5" : "justify-between gap-3 px-3.5 py-2.5"}
                    ${isActive
                      ? "border-[#3949ab] bg-[#e6e8fa] dark:bg-[#20264b] text-[#20235b] dark:text-[#dce0ff] font-bold"
                      : "border-transparent text-[#5f6470] dark:text-[#a6a8b0] hover:bg-[#ebe9e3] dark:hover:bg-[#20232c] hover:text-[#20232a] dark:hover:text-[#f3f0e9] font-medium"
                    }
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? "text-[#3949ab] dark:text-[#aeb8ff]" : "text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-400"}`} />
                    {!collapsed && <span className="truncate tracking-wide">{item.label}</span>}
                  </div>

                  {!collapsed && item.badge && (
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full leading-none ${
                      isActive 
                        ? "bg-[#3949ab]/10 text-[#3949ab] dark:text-[#aeb8ff]" 
                        : item.badgeVariant === "rose" 
                          ? "bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30"
                          : item.badgeVariant === "amber"
                            ? "bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30"
                            : "bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>

                {/* Collapsed Tooltip */}
                {collapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 z-50 shadow-2xl border border-slate-700 transition-opacity">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Collapse Toggle & System Status Card */}
        <div className="p-3 border-t border-[#d9d5ce] dark:border-[#30323b] bg-[#eeece6] dark:bg-[#111319] flex flex-col gap-2 shrink-0 transition-colors">
          {/* Collapse Toggle Icon (Desktop) */}
          <div className="hidden md:flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {!isCollapsed ? t("nav.jurisdiction", "JURISDICTION") : ""}
            </span>
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800/80 transition-colors"
              title={isCollapsed ? "Expand sidebar (S)" : "Collapse sidebar (S)"}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Officer Jurisdiction / Status Card */}
          {isExpanded ? (
            <div className="rounded-xl bg-[#F8FAFD] dark:bg-[#0C1A2E] border border-slate-200 dark:border-blue-900/40 p-2.5 relative overflow-hidden shadow-2xs dark:shadow-none transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                <span className="text-[10.5px] font-bold text-slate-900 dark:text-white truncate">
                  {user.department}
                </span>
              </div>

              <div className="text-[10px] text-slate-600 dark:text-slate-300 font-sans pl-1 border-l border-slate-200 dark:border-slate-700/50 space-y-0.5">
                <div className="truncate text-slate-500 dark:text-slate-400">
                  {meta.jurisdiction}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500 dark:text-slate-400 font-mono">{user.badge_number}</span>
                  <span className="font-mono text-[9.5px] text-emerald-600 dark:text-emerald-400 font-semibold">{t("nav.authorized", "Authorized")}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title={`Authorized: ${user.name}`} />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
