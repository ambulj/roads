import React, { useState } from "react";
import {
  LayoutDashboard,
  Bus,
  Wrench,
  ChartColumn,
  Cpu,
  MoreHorizontal,
  Compass,
  ShieldCheck,
  Keyboard,
  X,
  ShieldAlert,
  Radio,
  FileCheck
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface BottomNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onOpenAuthModal?: () => void;
  onOpenShortcutsModal?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentRoute,
  onNavigate,
  onOpenAuthModal,
  onOpenShortcutsModal,
}) => {
  const { user, hasAccessToRoute, getRoleBadgeLabel } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // 4 Primary Mobile Touch Targets
  const primaryItems = [
    { id: "command", icon: LayoutDashboard, label: "Map" },
    { id: "work-orders", icon: Wrench, label: "Orders" },
    {
      id: "analytics",
      icon: user.role === "admin2" ? Cpu : ChartColumn,
      label: "Analytics",
    },
    { id: "fleet", icon: Bus, label: "Fleet" },
  ] as const;

  const visibleItems = primaryItems.filter((item) => hasAccessToRoute(item.id));

  const handleItemClick = (route: string) => {
    onNavigate(route);
    setIsMoreOpen(false);
  };

  return (
    <>
      {/* Mobile "More" Drawer Modal */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsMoreOpen(false)}
            aria-label="Close drawer overlay"
          />
          <div className="relative bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 rounded-t-2xl p-4 space-y-3 shadow-2xl z-10 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-mono">
                  Municipal System Menu
                </h3>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Officer Persona Status */}
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-850/70 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs">
                  {user.avatar_initials || "AD"}
                </div>
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">{user.name}</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{getRoleBadgeLabel(user.role)}</div>
                </div>
              </div>
            </div>

            {/* Drawer Options */}
            <div className="space-y-1.5 pt-1">
              {hasAccessToRoute("memory") && (
                <button
                  onClick={() => handleItemClick("memory")}
                  className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                    currentRoute === "memory"
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80"
                      : "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent"
                  }`}
                >
                  <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <div className="flex-1">
                    <div>Governance &amp; Road Memory</div>
                    <div className="text-[10.5px] font-normal text-zinc-500 dark:text-zinc-400">
                      Spatiotemporal corridor deterioration &amp; MoHUA audit
                    </div>
                  </div>
                </button>
              )}

              {onOpenAuthModal && (
                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenAuthModal();
                  }}
                  className="w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-left cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="flex-1">
                    <div>Officer Persona &amp; Clearance</div>
                    <div className="text-[10.5px] font-normal text-zinc-500 dark:text-zinc-400">
                      Switch between Police, PWD, RTO &amp; Super Admin
                    </div>
                  </div>
                </button>
              )}

              {onOpenShortcutsModal && (
                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenShortcutsModal();
                  }}
                  className="w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-left cursor-pointer"
                >
                  <Keyboard className="w-4 h-4 text-zinc-500 shrink-0" />
                  <div className="flex-1">
                    <div>Keyboard Shortcuts</div>
                    <div className="text-[10.5px] font-normal text-zinc-500 dark:text-zinc-400">
                      Keys 1-5 direct workspace navigation
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4 Primary Touch Targets + More Trigger */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 px-2 pb-safe pt-1 flex items-center justify-around font-sans">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`
                min-h-[44px] min-w-[56px] flex flex-col items-center justify-center gap-0.5 py-1 px-2 transition-colors cursor-pointer
                ${isActive ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900"}
              `}
              aria-label={item.label}
            >
              <div
                className={`p-1 rounded-lg transition-colors ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                    : "text-zinc-500"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] leading-tight truncate max-w-[64px]">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* 5th More Button */}
        <button
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={`
            min-h-[44px] min-w-[56px] flex flex-col items-center justify-center gap-0.5 py-1 px-2 transition-colors cursor-pointer
            ${currentRoute === "memory" || isMoreOpen ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900"}
          `}
          aria-label="More options"
        >
          <div
            className={`p-1 rounded-lg transition-colors ${
              currentRoute === "memory" || isMoreOpen
                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                : "text-zinc-500"
            }`}
          >
            <MoreHorizontal className="w-4 h-4" />
          </div>
          <span className="text-[10px] leading-tight truncate max-w-[64px]">
            More
          </span>
        </button>
      </nav>
    </>
  );
};
