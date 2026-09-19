import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  FileText, 
  X, 
  RotateCcw
} from 'lucide-react';
import { Button } from '../ui';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reasonOrNotes?: string) => Promise<void> | void;
  title: string;
  description: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success';
  confirmLabel?: string;
  cancelLabel?: string;
  requireReason?: boolean;
  reasonPlaceholder?: string;
  reasonOptions?: string[];
  details?: { label: string; value: string; highlight?: boolean }[];
  icon?: 'alert' | 'challan' | 'pcr' | 'resolve' | 'reject';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  variant = 'primary',
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  requireReason = false,
  reasonPlaceholder = 'Specify reason or inspection remarks...',
  reasonOptions = [],
  details = [],
  icon = 'alert'
}) => {
  const [reason, setReason] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setSelectedPreset('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePresetClick = (preset: string) => {
    setSelectedPreset(preset);
    setReason(preset);
  };

  const handleConfirm = async () => {
    const finalReason = reason.trim() || selectedPreset;
    if (requireReason && !finalReason) return;
    try {
      setIsSubmitting(true);
      await onConfirm(finalReason);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = () => {
    switch (icon) {
      case 'challan':
        return <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'pcr':
        return <Send className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'resolve':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'reject':
        return <RotateCcw className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    }
  };

  const isConfirmDisabled = (requireReason && !reason.trim() && !selectedPreset) || isSubmitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl shrink-0 ${
              variant === 'danger'
                ? 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900'
                : variant === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900'
                : variant === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900'
                : 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900'
            }`}>
              {getIcon()}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                {description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Key Context Details */}
          {details.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-850 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Action Parameters
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {details.map((d, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{d.label}</span>
                    <span className={`font-semibold font-mono text-xs ${
                      d.highlight ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-900 dark:text-slate-100'
                    }`}>
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reason presets / input */}
          {(requireReason || reasonOptions.length > 0) && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {requireReason ? 'Reason for Decision (Required):' : 'Operator Notes (Optional):'}
              </label>

              {reasonOptions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {reasonOptions.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handlePresetClick(opt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                        selectedPreset === opt
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-semibold'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              <input
                type="text"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (selectedPreset && e.target.value !== selectedPreset) {
                    setSelectedPreset('');
                  }
                }}
                placeholder={reasonPlaceholder}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-end gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </Button>

          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            isLoading={isSubmitting}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
