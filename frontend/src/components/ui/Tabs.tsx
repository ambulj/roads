import React, { createContext, useContext } from "react";

interface TabsContextType {
  value: string;
  onChange: (v: string) => void;
}
const TabsCtx = createContext<TabsContextType | null>(null);

// ── Root Container ─────────────────────────────────────────────────────────
export const Tabs: React.FC<{
  value: string;
  onChange: (v: string) => void;
  className?: string;
  children: React.ReactNode;
}> = ({ value, onChange, className = "", children }) => (
  <TabsCtx.Provider value={{ value, onChange }}>
    <div className={className}>{children}</div>
  </TabsCtx.Provider>
);

// ── Tab List (segmented control row) ──────────────────────────────────────
export const TabsList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div
    role="tablist"
    className={`inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 gap-0.5 ${className}`}
    {...props}
  >
    {children}
  </div>
);

// ── Individual Tab Trigger ─────────────────────────────────────────────────
export const TabsTrigger: React.FC<{
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}> = ({ value, children, icon, className = "", disabled = false }) => {
  const ctx = useContext(TabsCtx)!;
  const isActive = ctx.value === value;
  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => ctx.onChange(value)}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-sans
        transition-all duration-150 select-none focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1
        disabled:opacity-50 disabled:pointer-events-none
        ${isActive
          ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200 dark:border-slate-700 font-semibold"
          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/50"
        } ${className}
      `}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

// ── Tab Content Panel ──────────────────────────────────────────────────────
export const TabsContent: React.FC<{
  value: string;
  children: React.ReactNode;
  className?: string;
}> = ({ value, children, className = "" }) => {
  const ctx = useContext(TabsCtx)!;
  if (ctx.value !== value) return null;
  return <div className={`animate-fadeIn ${className}`}>{children}</div>;
};
