import React from "react";
import { LayoutDashboard, Bus, AlertTriangle, Wrench, ChartColumn, Camera, Cpu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface BottomNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentRoute, onNavigate }) => {
  const { user, hasAccessToRoute } = useAuth();

  const allItems = [
    { id: "command",     icon: LayoutDashboard, label: "GIS Command" },
    { id: "fleet",       icon: Bus,             label: "Edge Fleet"  },
    { id: "incidents",   icon: AlertTriangle,   label: "Incidents"   },
    { id: "work-orders", icon: Wrench,          label: "Orders"      },
    { 
      id: "analytics",   
      icon: user.role === "admin2" ? Cpu : ChartColumn,     
      label: user.role === "admin2" ? "Edge MLOps" : "Analytics" 
    },
  ] as const;

  const visibleItems = allItems.filter(item => hasAccessToRoute(item.id));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 px-2 pb-safe pt-1 flex items-center justify-around font-mono">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentRoute === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`
              flex flex-col items-center gap-0.5 py-1 px-2 transition-colors
              ${isActive ? "text-cyan-600 dark:text-cyan-400 font-bold" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900"}
            `}
            aria-label={item.label}
          >
            <div className={`p-1 rounded ${isActive ? "bg-zinc-100 dark:bg-zinc-800" : ""}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[9.5px] leading-tight truncate max-w-[64px]">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
