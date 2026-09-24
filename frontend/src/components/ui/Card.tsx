import React from "react";

// ── Root Card ────────────────────────────────────────────────────────────────
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children, className = "", ...props
}) => (
  <div
    className={`rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-none ${className}`}
    {...props}
  >
    {children}
  </div>
);

// ── Card Header ─────────────────────────────────────────────────────────────
export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children, className = "", ...props
}) => (
  <div
    className={`px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 ${className}`}
    {...props}
  >
    {children}
  </div>
);

// ── Card Title ──────────────────────────────────────────────────────────────
export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children, className = "", ...props
}) => (
  <h3
    className={`text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight ${className}`}
    {...props}
  >
    {children}
  </h3>
);

// ── Card Description ────────────────────────────────────────────────────────
export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children, className = "", ...props
}) => (
  <p
    className={`text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed ${className}`}
    {...props}
  >
    {children}
  </p>
);

// ── Card Content ─────────────────────────────────────────────────────────────
export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children, className = "", ...props
}) => (
  <div className={`p-4 ${className}`} {...props}>
    {children}
  </div>
);

// ── Card Footer ──────────────────────────────────────────────────────────────
export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children, className = "", ...props
}) => (
  <div
    className={`px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-lg flex items-center justify-between gap-3 ${className}`}
    {...props}
  >
    {children}
  </div>
);
