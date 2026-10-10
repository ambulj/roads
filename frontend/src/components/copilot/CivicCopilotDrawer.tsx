import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  CornerDownLeft,
  Compass,
  FileText,
  Building2,
  ExternalLink,
  Trash2,
  Bot,
  User,
  Zap,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock,
  Layers
} from 'lucide-react';
import {
  CopilotActionCard,
  CopilotQueryResponse,
  CopilotChatMessage,
  CopilotActionType,
} from '../../types';
import { api } from '../../services/api';
import { CivicCopilotLogo } from './CivicCopilotLogo';

interface CivicCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (route: string) => void;
  onFlyToMap?: (target: { lat: number; lng: number; zoom?: number; corridor?: string; cluster_code?: string }) => void;
  onInspectBacklog?: (clusterCode: string) => void;
  onViewLedger?: (contractorId: string) => void;
}

const DEFAULT_SUGGESTIONS: string[] = [
  "Show unaddressed P0 potholes on GST Road",
  "Contractors with highest SLA breaches",
  "Corridors with worst road condition",
  "Draft Form 14 notice for L&T breaches",
];

export const CivicCopilotDrawer: React.FC<CivicCopilotDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onFlyToMap,
  onInspectBacklog,
  onViewLedger,
}) => {
  const [messages, setMessages] = useState<CopilotChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: 'Welcome to RoadSaathi Civic Copilot. Query real-time road condition telemetry, audit contractor SLA liquidated damages, inspect corridor roughness rankings, or generate statutory Form 14 notice packets deterministically in sub-10ms.',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch suggestions on mount
  useEffect(() => {
    api.getCopilotSuggestions().then((res) => {
      if (res && res.length > 0) {
        setSuggestions(res);
      }
    }).catch(() => {});
  }, []);

  // Autofocus input when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Close on Escape key when open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleExecuteQuery = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: CopilotChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response: CopilotQueryResponse = await api.queryCopilot(trimmed);

      const assistantMsg: CopilotChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        response,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (response.suggested_queries && response.suggested_queries.length > 0) {
        setSuggestions(response.suggested_queries);
      }
    } catch (err) {
      const errorMsg: CopilotChatMessage = {
        id: `assistant-err-${Date.now()}`,
        role: 'assistant',
        content: 'Unable to contact municipal intelligence dispatcher. Please verify backend connection.',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: 'Session cleared. Ask a municipal question or click any preset chip to begin.',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleActionTrigger = (type?: CopilotActionType, payload?: Record<string, any>) => {
    if (!type || !payload) return;

    switch (type) {
      case 'FLY_TO_MAP': {
        if (onFlyToMap) {
          onFlyToMap({
            lat: payload.lat,
            lng: payload.lng,
            zoom: payload.zoom || 16,
            corridor: payload.corridor,
            cluster_code: payload.cluster_code,
          });
        }
        if (onNavigate) {
          onNavigate('command');
        }
        // Dispatch global DOM event for MapLibre instance
        window.dispatchEvent(
          new CustomEvent('roadsaathi:fly-to', {
            detail: {
              lat: payload.lat,
              lng: payload.lng,
              zoom: payload.zoom || 16,
              corridor: payload.corridor,
              clusterCode: payload.cluster_code,
            },
          })
        );
        break;
      }

      case 'INSPECT_BACKLOG': {
        if (onInspectBacklog && payload.cluster_code) {
          onInspectBacklog(payload.cluster_code);
        }
        if (onNavigate) {
          onNavigate('work-orders');
        }
        window.dispatchEvent(
          new CustomEvent('roadsaathi:inspect-ticket', {
            detail: { clusterCode: payload.cluster_code },
          })
        );
        break;
      }

      case 'VIEW_LEDGER': {
        if (onViewLedger && payload.contractor_id) {
          onViewLedger(payload.contractor_id);
        }
        if (onNavigate) {
          onNavigate('work-orders');
        }
        window.location.hash = '#/work-orders?tab=sla';
        break;
      }

      case 'OPEN_FORM14_MODAL': {
        if (onNavigate) {
          onNavigate('work-orders');
        }
        window.location.hash = '#/work-orders?tab=sla';
        // Dispatch statutory show-cause notice event for ContractorSlaLedger.tsx
        window.dispatchEvent(
          new CustomEvent('roadsaathi:open-form14', {
            detail: payload,
          })
        );
        break;
      }

      case 'FILTER_VIEW': {
        if (onNavigate) {
          onNavigate('command');
        }
        break;
      }

      default:
        break;
    }
  };

  const renderBadge = (badge?: string, variant: string = 'indigo') => {
    if (!badge) return null;
    let colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800';
    if (variant === 'rose') {
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800';
    } else if (variant === 'amber') {
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
    } else if (variant === 'emerald') {
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
    } else if (variant === 'slate') {
      colorClass = 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }

    return (
      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${colorClass}`}>
        {badge}
      </span>
    );
  };

  const renderActionCard = (card: CopilotActionCard) => {
    return (
      <div
        key={card.id}
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden p-4 space-y-3 transition-all hover:shadow-md"
      >
        {/* Card Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight">
              {card.title}
            </h4>
            {card.subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {card.subtitle}
              </p>
            )}
          </div>
          {renderBadge(card.badge, card.badge_variant)}
        </div>

        {/* Tabular Metrics Grid */}
        {card.metrics && Object.keys(card.metrics).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            {Object.entries(card.metrics).map(([key, val]) => (
              <div key={key} className="space-y-0.5">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
                  {key}
                </span>
                <p className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {String(val)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Description */}
        {card.description && (
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {card.description}
          </p>
        )}

        {/* Action Triggers */}
        {(card.primary_action_label || card.secondary_action_label) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            {card.primary_action_label && card.primary_action_type && (
              <button
                type="button"
                onClick={() => handleActionTrigger(card.primary_action_type, card.primary_action_payload)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
              >
                {card.primary_action_type === 'FLY_TO_MAP' && <Compass className="w-3.5 h-3.5" />}
                {card.primary_action_type === 'OPEN_FORM14_MODAL' && <FileText className="w-3.5 h-3.5" />}
                {card.primary_action_type === 'VIEW_LEDGER' && <Building2 className="w-3.5 h-3.5" />}
                {card.primary_action_type === 'INSPECT_BACKLOG' && <Layers className="w-3.5 h-3.5" />}
                <span>{card.primary_action_label}</span>
                <ArrowRight className="w-3 h-3 opacity-80" />
              </button>
            )}

            {card.secondary_action_label && card.secondary_action_type && (
              <button
                type="button"
                onClick={() => handleActionTrigger(card.secondary_action_type, card.secondary_action_payload)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 transition-all"
              >
                <span>{card.secondary_action_label}</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-Over Drawer */}
      <div
        role="dialog"
        aria-label="RoadSaathi Civic Copilot"
        aria-modal="true"
        className="fixed top-0 right-0 h-full w-full max-w-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-indigo-400 dark:text-indigo-600 flex items-center justify-center shadow-md border border-zinc-800 dark:border-zinc-200">
              <CivicCopilotLogo className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                  RoadSaathi Civic Copilot
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Deterministic AI
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Natural Language Intelligence • 100% Local • Sub-10ms
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleClearHistory}
              title="Clear conversation"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close drawer (Esc)"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick-Prompt Suggestions Scroll Strip */}
        <div className="px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200/60 dark:border-slate-800/60 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 flex items-center gap-1 pl-1">
              <Zap className="w-3 h-3 text-amber-500" /> Presets:
            </span>
            {suggestions.slice(0, 4).map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleExecuteQuery(s)}
                className="px-2.5 py-1 text-xs rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-2xs transition-all active:scale-95"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-zinc-200 dark:border-zinc-700">
                    <CivicCopilotLogo className="w-4 h-4" />
                  </div>
                )}

                <div className={`space-y-3 max-w-[88%] ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Message Bubble */}
                  {isUser ? (
                    <div className="rounded-2xl rounded-tr-xs bg-indigo-600 text-white px-4 py-2.5 text-sm shadow-sm font-medium">
                      {msg.content}
                    </div>
                  ) : msg.content ? (
                    <div className="rounded-2xl rounded-tl-xs bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 px-4 py-3 text-xs leading-relaxed">
                      {msg.content}
                    </div>
                  ) : null}

                  {/* Assistant Executive Summary & Structured Response */}
                  {!isUser && msg.response && (
                    <div className="space-y-3 w-full">
                      {/* Executive Summary Card */}
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50 via-slate-50 to-white dark:from-indigo-950/40 dark:via-slate-800/40 dark:to-slate-900 border-l-4 border-l-indigo-600 border border-slate-200 dark:border-slate-800 shadow-2xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Executive Summary
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {msg.response.latency_ms}ms
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                          {msg.response.executive_summary}
                        </p>
                        {msg.response.statutory_context && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 italic border-t border-slate-200/50 dark:border-slate-800/50 pt-1.5">
                            Authority: {msg.response.statutory_context}
                          </p>
                        )}
                      </div>

                      {/* Render Action Cards */}
                      {msg.response.cards && msg.response.cards.length > 0 && (
                        <div className="space-y-2.5">
                          {msg.response.cards.map(renderActionCard)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className={`text-[10px] text-slate-400 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Thinking State */}
          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="rounded-2xl rounded-tl-xs bg-slate-100 dark:bg-slate-800 px-4 py-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                  Querying schema & evaluating SLA rules...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecuteQuery(inputQuery);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask Civic Copilot... (e.g. audit contractor breaches, P0 potholes)"
                disabled={isLoading}
                className="w-full pl-3.5 pr-14 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 text-[10px] font-mono font-medium text-slate-400 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-700/70 px-1.5 py-0.5 rounded">
                <CornerDownLeft className="w-2.5 h-2.5 mr-0.5" /> Enter
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md shadow-indigo-600/20 shrink-0"
              title="Submit query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span>Deterministic Schema Matcher (v5.0)</span>
            <span>Shortcut: <kbd className="px-1 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">Ctrl+K</kbd></span>
          </div>
        </div>
      </div>
    </>
  );
};
