import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, Language } from '../../context/LanguageContext';
import { Languages, ChevronDown, Check } from 'lucide-react';

interface LanguageToggleProps {
  className?: string;
}

const LANGUAGES: { code: Language; label: string; nativeName: string; flag: string }[] = [
  { code: 'en', label: 'English', nativeName: 'English (EN)', flag: '🇬🇧' },
  { code: 'hi', label: 'हिन्दी', nativeName: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்', nativeName: 'தமிழ் (Tamil)', flag: '🏛️' }
];

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        title="Change Language (English / हिन्दी / தமிழ்)"
        aria-label="Change language"
        className={`h-8 px-2.5 rounded-lg border flex items-center gap-1.5 text-xs font-semibold transition-all shadow-xs select-none cursor-pointer ${
          language !== 'en'
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300'
            : 'bg-white dark:bg-[#161a24] border-[#d9d5ce] dark:border-[#2b303d] text-slate-700 dark:text-slate-300 hover:border-slate-400'
        }`}
      >
        <Languages className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
        <span className="font-mono text-[11px] font-bold">{currentLang.label}</span>
        <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121722] shadow-2xl z-50 p-1.5 animate-slideUp select-none">
          <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800/80 mb-1">
            Select Language
          </div>
          {LANGUAGES.map(lang => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-left cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
