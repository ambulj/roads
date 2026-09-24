import React from "react";
import { Sun, Moon, Zap, Cpu } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface ThemeToggleProps {
  compact?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ compact = false, className = "" }) => {
  const { theme, setTheme, toggleTheme } = useTheme();

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        title={`Current: ${theme.toUpperCase()} mode (Click to cycle Light → Dark → Edge)`}
        aria-label="Toggle theme"
        className={`grid h-8 w-8 place-items-center rounded-lg border border-[#d9d5ce] bg-white text-slate-700 hover:border-slate-400 dark:border-[#2b303d] dark:bg-[#161a24] dark:text-slate-300 transition shadow-xs cursor-pointer ${className}`}
      >
        {theme === "edge" ? (
          <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
        ) : theme === "dark" ? (
          <Moon className="w-4 h-4 text-blue-400 hover:-rotate-12 transition-transform" />
        ) : (
          <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
        )}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Theme selector"
      className={`inline-flex items-center p-0.5 gap-0.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs ${className}`}
    >
      {/* Light */}
      <button
        type="button"
        onClick={() => setTheme("light")}
        title="Switch to Light mode"
        aria-pressed={theme === "light"}
        className={`
          flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
          transition-all duration-150 select-none outline-none cursor-pointer
          focus-visible:ring-2 focus-visible:ring-blue-500
          ${theme === "light"
            ? "bg-white text-amber-600 shadow-xs border border-slate-200"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/50"
          }
        `}
      >
        <Sun className={`w-3.5 h-3.5 shrink-0 ${theme === "light" ? "text-amber-500" : ""}`} />
        <span>Light</span>
      </button>

      {/* Dark */}
      <button
        type="button"
        onClick={() => setTheme("dark")}
        title="Switch to Dark mode"
        aria-pressed={theme === "dark"}
        className={`
          flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
          transition-all duration-150 select-none outline-none cursor-pointer
          focus-visible:ring-2 focus-visible:ring-blue-500
          ${theme === "dark"
            ? "bg-slate-800 text-blue-400 shadow-xs border border-slate-700"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/50"
          }
        `}
      >
        <Moon className={`w-3.5 h-3.5 shrink-0 ${theme === "dark" ? "text-blue-400" : ""}`} />
        <span>Dark</span>
      </button>

      {/* Edge Computing */}
      <button
        type="button"
        onClick={() => setTheme("edge")}
        title="Switch to Edge AI Matrix mode"
        aria-pressed={theme === "edge"}
        className={`
          flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold
          transition-all duration-150 select-none outline-none cursor-pointer
          focus-visible:ring-2 focus-visible:ring-emerald-500
          ${theme === "edge"
            ? "bg-emerald-950/80 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] border border-emerald-500/50"
            : "text-slate-500 dark:text-slate-400 hover:text-emerald-400 dark:hover:text-emerald-400 hover:bg-white/60 dark:hover:bg-slate-800/50"
          }
        `}
      >
        <Zap className={`w-3.5 h-3.5 shrink-0 ${theme === "edge" ? "text-emerald-400 animate-pulse" : ""}`} />
        <span>Edge</span>
      </button>
    </div>
  );
};
