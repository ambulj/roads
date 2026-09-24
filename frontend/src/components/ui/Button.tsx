import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  className = '',
  disabled,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium font-sans transition-colors duration-150 rounded-md select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const sizeStyles = {
    xs: 'text-xs px-2 py-1 gap-1 h-6',
    sm: 'text-xs px-2.5 py-1.5 gap-1.5 h-8',
    md: 'text-xs px-3.5 py-2 gap-2 h-9',
    lg: 'text-sm px-4 py-2.5 gap-2 h-10',
  };

  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 focus-visible:ring-blue-500',
    secondary: 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 focus-visible:ring-slate-400',
    outline: 'bg-transparent text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-slate-400',
    ghost: 'bg-transparent text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent focus-visible:ring-slate-400',
    danger: 'bg-rose-700 hover:bg-rose-800 text-white border border-rose-800 focus-visible:ring-rose-500',
    success: 'bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-800 focus-visible:ring-emerald-500',
  };

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';
