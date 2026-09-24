import React from "react";
import { Sun, Moon, Zap, Cpu } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface ThemeToggleProps {
  compact?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Theme: ${theme.toUpperCase()} (Click to toggle Light/Dark)`}
      aria-label={`Toggle theme, current theme: ${theme}`}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer ${className}`}
    >
      {theme === "edge" ? (
        <Zap className="w-4 h-4 text-emerald-500 animate-pulse" />
      ) : theme === "dark" ? (
        <Moon className="w-4 h-4 text-cyan-400" />
      ) : (
        <Sun className="w-4 h-4 text-amber-500" />
      )}
    </button>
  );
};
