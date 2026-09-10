import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toasts: Toast[];
  success: (title: string, message?: string) => void;
  error:   (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info:    (title: string, message?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [...prev.slice(-4), { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismiss = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  return (
    <ToastContext.Provider value={{
      toasts,
      success: (t, m) => add('success', t, m),
      error:   (t, m) => add('error',   t, m),
      warning: (t, m) => add('warning', t, m),
      info:    (t, m) => add('info',    t, m),
      dismiss,
    }}>
      {children}
      <ToastStack />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  error:   <AlertTriangle className="w-4 h-4 text-rose-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  info:    <Info className="w-4 h-4 text-blue-500" />,
};

const COLORS: Record<ToastType, string> = {
  success: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/80',
  error:   'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/80',
  warning: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/80',
  info:    'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/80',
};

const ToastStack: React.FC = () => {
  const { toasts, dismiss } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 w-80 max-w-[90vw] rounded-xl border shadow-lg px-4 py-3 backdrop-blur-sm transition-all animate-slideUp ${COLORS[toast.type]}`}
        >
          <div className="mt-0.5 shrink-0">{ICONS[toast.type]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">{toast.title}</p>
            {toast.message && <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">{toast.message}</p>}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="shrink-0 p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
