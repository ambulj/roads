import React from "react";

// ── Root Card ────────────────────────────────────────────────────────────────
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children, className = "", ...props
}) => (
  <div
    className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-card transition-shadow hover:shadow-card-hover ${className}`}
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
    className={`px-4 py-3 sm:px-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 ${className}`}
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
    className={`text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-none ${className}`}
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
    className={`text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed ${className}`}
    {...props}
  >
    {children}
  </p>
);

// ── Card Content ─────────────────────────────────────────────────────────────
export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children, className = "", ...props
}) => (
  <div className={`p-4 sm:p-5 ${className}`} {...props}>
    {children}
  </div>
);

// ── Card Footer ──────────────────────────────────────────────────────────────
export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children, className = "", ...props
}) => (
  <div
    className={`px-4 py-3 sm:px-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 rounded-b-2xl flex items-center justify-between gap-3 ${className}`}
    {...props}
  >
    {children}
  </div>
);
