import React from "react";
import { Sun, Moon, Zap } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface ThemeToggleProps {
  compact?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();

  const getThemeTitle = () => {
    if (theme === "edge") return "Theme: Cyber Edge Mode (Click to switch to Light)";
    if (theme === "dark") return "Theme: Dark Mode (Click to switch to Cyber Edge)";
    return "Theme: Light Mode (Click to switch to Dark)";
  };

  const getAriaLabel = () => {
    if (theme === "edge") return "Switch to light theme (currently Cyber Edge mode)";
    if (theme === "dark") return "Switch to cyber edge theme (currently dark mode)";
    return "Switch to dark theme (currently light mode)";
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={getThemeTitle()}
      aria-label={getAriaLabel()}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer ${className}`}
    >
      {theme === "edge" ? (
        <Zap className="w-4 h-4 text-emerald-500 animate-pulse" />
      ) : theme === "dark" ? (
        <Moon className="w-4 h-4 text-indigo-400 dark:text-indigo-300" />
      ) : (
        <Sun className="w-4 h-4 text-amber-500" />
      )}
    </button>
  );
};
