import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  className = '',
  leftIcon,
  rightElement,
  ...props
}, ref) => {
  return (
    <div className="relative flex items-center w-full">
      {leftIcon && (
        <div className="absolute left-3 pointer-events-none text-slate-400 dark:text-slate-500 flex items-center justify-center">
          {leftIcon}
        </div>
      )}
      <input
        ref={ref}
        className={`w-full font-sans text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 transition-all duration-150 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:pointer-events-none shadow-xs ${
          leftIcon ? 'pl-9' : ''
        } ${rightElement ? 'pr-9' : ''} ${className}`}
        {...props}
      />
      {rightElement && (
        <div className="absolute right-3 flex items-center justify-center">
          {rightElement}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  leftIcon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  className = '',
  children,
  leftIcon,
  ...props
}, ref) => {
  return (
    <div className="relative flex items-center w-full">
      {leftIcon && (
        <div className="absolute left-3 pointer-events-none text-slate-400 dark:text-slate-500 flex items-center justify-center">
          {leftIcon}
        </div>
      )}
      <select
        ref={ref}
        className={`w-full font-sans text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 transition-all duration-150 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:pointer-events-none shadow-xs appearance-none cursor-pointer ${
          leftIcon ? 'pl-9' : ''
        } ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
});

Select.displayName = 'Select';
