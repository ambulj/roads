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
        className={`w-full font-sans text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 transition-colors duration-150 outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:opacity-50 disabled:pointer-events-none ${
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
        <div className="absolute left-3 pointer-events-none text-slate-500 dark:text-slate-400 flex items-center justify-center">
          {leftIcon}
        </div>
      )}
      <select
        ref={ref}
        className={`w-full font-sans text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 transition-colors duration-150 outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${
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
