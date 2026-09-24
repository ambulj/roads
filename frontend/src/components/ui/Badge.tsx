import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'critical' | 'warning' | 'high' | 'medium' | 'info' | 'success' | 'purple' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  icon,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
  };

  const variantStyles = {
    critical: 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800 font-semibold',
    warning: 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800 font-semibold',
    high: 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800 font-semibold',
    medium: 'bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-800 font-medium',
    info: 'bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-200 border-sky-300 dark:border-sky-800 font-medium',
    success: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800 font-semibold',
    purple: 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-800 font-medium',
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 font-medium',
  };

  const dotColors = {
    critical: 'bg-rose-600',
    warning: 'bg-amber-600',
    high: 'bg-amber-600',
    medium: 'bg-blue-600',
    info: 'bg-sky-600',
    success: 'bg-emerald-600',
    purple: 'bg-purple-600',
    neutral: 'bg-slate-500',
  };

  return (
    <span
      className={`inline-flex items-center font-sans rounded-md border select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

