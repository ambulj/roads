import React from "react";
import { LayoutDashboard, Bus, AlertTriangle, Wrench, ChartColumn } from "lucide-react";

interface BottomNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

const ITEMS = [
  { id: "command",     icon: LayoutDashboard, label: "Dashboard" },
  { id: "fleet",       icon: Bus,             label: "Fleet"     },
  { id: "incidents",   icon: AlertTriangle,   label: "Incidents" },
  { id: "work-orders", icon: Wrench,          label: "Orders"    },
  { id: "analytics",   icon: ChartColumn,     label: "Analytics" },
] as const;

export const BottomNav: React.FC<BottomNavProps> = ({ currentRoute, onNavigate }) => (
  <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#fcfbf8] dark:bg-[#151820] border-t border-[#d9d5ce] dark:border-[#30323b] px-2 pb-safe pt-1.5 flex items-end justify-around safe-area-inset-bottom">
    {ITEMS.map((item) => {
      const Icon = item.icon;
      const isActive = currentRoute === item.id;
      return (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className="flex flex-col items-center gap-1 py-1 px-2 transition-all active:scale-95 outline-none"
          aria-label={item.label}
        >
          <div className={`p-1.5 transition-colors ${isActive ? "bg-[#e6e8fa] dark:bg-[#20264b]" : "bg-transparent"}`}>
            <Icon className={`w-4.5 h-4.5 ${isActive ? "text-[#3949ab] dark:text-[#aeb8ff]" : "text-[#737783] dark:text-[#a6a8b0]"}`} style={{ width: "18px", height: "18px" }} />
          </div>
          <span className={`text-[10px] font-medium leading-none ${isActive ? "text-[#3949ab] dark:text-[#aeb8ff] font-bold" : "text-[#737783] dark:text-[#a6a8b0]"}`}>
            {item.label}
          </span>
        </button>
      );
    })}
  </nav>
);
