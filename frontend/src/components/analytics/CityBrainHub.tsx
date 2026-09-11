import React, { useState, useEffect } from 'react';
import {
  Brain, Coins, Sliders, ShieldAlert, FileText, Activity, Cpu, HardDrive,
  Wifi, RefreshCw, CheckCircle2, AlertTriangle, Scale, X, Zap,
  TrendingDown, MapPin, Clock, ArrowUpRight, Check, Eye
} from 'lucide-react';
import {
  BudgetOptimizationResult, ShiftTriageResult, ShiftTriageItem,
  XAIReasoningTrace, ChronicFailuresResult, FleetEdgeDiagnosticsResult,
  FederatedRoundResult
} from '../../types';
import { api } from '../../services/api';
import { Card, Badge, Button } from '../ui';
import { useTheme } from '../../context/ThemeContext';

export const CityBrainHub: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Active City Brain Tab
  const [activeTab, setActiveTab] = useState<'BUDGET' | 'TRIAGE' | 'CHRONIC' | 'MLOPS'>('BUDGET');

  // Budget Optimizer State
  const [budgetLakhs, setBudgetLakhs] = useState<number>(15.0);
  const [targetCorridor, setTargetCorridor] = useState<string>('ALL');
  const [budgetResult, setBudgetResult] = useState<BudgetOptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  // Shift Triage State
  const [shiftName, setShiftName] = useState<string>('Morning Shift (06:00 - 14:00)');
  const [triageResult, setTriageResult] = useState<ShiftTriageResult | null>(null);
  const [isTriaging, setIsTriaging] = useState<boolean>(false);

  // Chronic Hotspots State
  const [chronicResult, setChronicResult] = useState<ChronicFailuresResult | null>(null);
  const [isLoadingChronic, setIsLoadingChronic] = useState<boolean>(false);

  // Edge MLOps & Diagnostics State
  const [edgeDiagnostics, setEdgeDiagnostics] = useState<FleetEdgeDiagnosticsResult | null>(null);
  const [fedRoundResult, setFedRoundResult] = useState<FederatedRoundResult | null>(null);
  const [isRunningFedRound, setIsRunningFedRound] = useState<boolean>(false);

  // XAI Trace Modal State
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [xaiTrace, setXaiTrace] = useState<XAIReasoningTrace | null>(null);
  const [isLoadingXAI, setIsLoadingXAI] = useState<boolean>(false);

  // Load initial data
  useEffect(() => {
    loadBudgetOptimization(budgetLakhs, targetCorridor);
    loadShiftTriage(shiftName);
    loadChronicFailures();
    loadEdgeDiagnostics();
  }, []);

  const loadBudgetOptimization = async (budget: number, corridor: string) => {
    setIsOptimizing(true);
    try {
      const res = await api.optimizeBudget(budget, corridor);
      setBudgetResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const loadShiftTriage = async (shift: string) => {
    setIsTriaging(true);
    try {
      const res = await api.getShiftTriage(shift, 20);
      setTriageResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTriaging(false);
    }
  };

  const loadChronicFailures = async () => {
    setIsLoadingChronic(true);
    try {
      const res = await api.getChronicFailures(180, 3);
      setChronicResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingChronic(false);
    }
  };

  const loadEdgeDiagnostics = async () => {
    try {
      const res = await api.getFleetEdgeDiagnostics();
      setEdgeDiagnostics(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenXAI = async (entityId: string) => {
    setSelectedEntityId(entityId);
    setIsLoadingXAI(true);
    try {
      const res = await api.getXAIReasoningTrace(entityId);
      setXaiTrace(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingXAI(false);
    }
  };

  const handleTriggerFedRound = async () => {
    setIsRunningFedRound(true);
    try {
      const res = await api.triggerFederatedRound();
      setFedRoundResult(res);
      await loadEdgeDiagnostics();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunningFedRound(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header Banner ──────────────────────────────────────────────── */}
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-900/50' : 'bg-gradient-to-r from-slate-50 via-indigo-50/50 to-white border-indigo-200'} shadow-lg relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                <Brain className="w-6 h-6" />
              </div>
              <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                City Brain Decision AI & Autonomous Municipal Triage
              </h2>
              <Badge variant="purple" className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold px-2.5 py-0.5">
                Points 51–90 Complete
              </Badge>
            </div>
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'} max-w-3xl leading-relaxed`}>
              Closed-loop municipal intelligence: <strong className="text-indigo-400">0/1 Knapsack Budget Optimization</strong>,{' '}
              <strong className="text-amber-400">MoRTH Section 198A Statutory XAI Reasoning</strong>,{' '}
              <strong className="text-rose-400">IRC:37 Chronic Structural Hotspots</strong>, and{' '}
              <strong className="text-emerald-400">Decentralized Federated Edge MLOps</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadBudgetOptimization(budgetLakhs, targetCorridor);
                loadShiftTriage(shiftName);
                loadChronicFailures();
                loadEdgeDiagnostics();
              }}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Sync Digital Twin
            </Button>
          </div>
        </div>

        {/* ── Navigation Tabs ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-700/40 overflow-x-auto">
          <button
            onClick={() => setActiveTab('BUDGET')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'BUDGET'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Coins className="w-4 h-4" />
            Knapsack Budget Optimizer
          </button>
          <button
            onClick={() => setActiveTab('TRIAGE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'TRIAGE'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Shift Workload Triage (Top 20)
          </button>
          <button
            onClick={() => setActiveTab('CHRONIC')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'CHRONIC'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            IRC:37 Chronic Hotspots
          </button>
          <button
            onClick={() => setActiveTab('MLOPS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'MLOPS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Edge MLOps & FedAvg
          </button>
        </div>
      </div>

      {/* ── TAB 1: KNAPSACK BUDGET OPTIMIZER ─────────────────────────────────── */}
      {activeTab === 'BUDGET' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <Card className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <Coins className="w-4 h-4 text-indigo-400" />
                    Municipal Capital Budget Allocation:
                    <span className="text-xl font-black text-indigo-400">₹{budgetLakhs.toFixed(1)} Lakhs</span>
                  </label>
                  <span className="text-xs text-slate-400">Integer 0/1 Knapsack DP Model</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="50.0"
                  step="0.5"
                  value={budgetLakhs}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setBudgetLakhs(val);
                    loadBudgetOptimization(val, targetCorridor);
                  }}
                  className="w-full accent-indigo-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
                />
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
                  {[5, 10, 15, 25, 50].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setBudgetLakhs(preset);
                        loadBudgetOptimization(preset, targetCorridor);
                      }}
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold border transition-all ${
                        budgetLakhs === preset
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : isDark ? 'border-slate-700 text-slate-300 hover:border-slate-600' : 'border-slate-300 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      ₹{preset}L
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div>
                  <label className="text-xs font-semibold block text-slate-400 mb-1">Target Corridor Filter</label>
                  <select
                    value={targetCorridor}
                    onChange={(e) => {
                      setTargetCorridor(e.target.value);
                      loadBudgetOptimization(budgetLakhs, e.target.value);
                    }}
                    className={`text-sm px-3 py-2 rounded-xl border font-medium ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="ALL">All City Corridors</option>
                    <option value="Anna Salai">Anna Salai (CBD)</option>
                    <option value="GST Road">GST Road (NH-32)</option>
                    <option value="OMR">OMR IT Expressway</option>
                    <option value="Poonamallee">Poonamallee High Road</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Metric KPI Highlights */}
            {budgetResult && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/50">
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Budget Utilized</div>
                  <div className="text-2xl font-black text-indigo-400">
                    ₹{budgetResult.budget_utilized_lakhs.toFixed(2)}L
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Remainder: ₹{budgetResult.budget_remaining_lakhs.toFixed(2)}L
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Interventions Selected</div>
                  <div className="text-2xl font-black text-emerald-400">
                    {budgetResult.interventions_selected_count} <span className="text-sm font-normal text-slate-400">/ {budgetResult.total_candidate_defects}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Optimized subset of defects
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Safety Benefit</div>
                  <div className="text-2xl font-black text-amber-400">
                    {budgetResult.total_safety_benefit_points.toFixed(0)} <span className="text-xs font-normal">pts</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Weighted by POI & Severity
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total ΔRPI Reduction</div>
                  <div className="text-2xl font-black text-cyan-400">
                    -{budgetResult.total_delta_rpi_reduction.toFixed(0)} <span className="text-xs font-normal">pts</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Net risk eliminated
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Pareto Trade-Off Curve Visualizer */}
          {budgetResult && budgetResult.pareto_tradeoff_curve?.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Scale className="w-4 h-4 text-indigo-400" />
                    Pareto Safety Trade-Off Curve (Cost vs. Risk Reduction Benefit)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Demonstrates diminishing marginal returns per additional ₹1 Lakh expenditure
                  </p>
                </div>
                <Badge variant="info" className="text-xs">
                  Optimal Knee Point: ~₹15 Lakhs
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {budgetResult.pareto_tradeoff_curve.map((point) => (
                  <div
                    key={point.budget_lakhs}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      Math.abs(point.budget_lakhs - budgetLakhs) <= 2.5
                        ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/30'
                        : isDark ? 'border-slate-800 bg-slate-800/40' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-400">Budget ₹{point.budget_lakhs}L</div>
                    <div className="text-lg font-black text-indigo-400 my-1">{point.benefit_points} pts</div>
                    <div className="text-xs text-slate-400">{point.interventions_count} repairs</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Selected Interventions Table */}
          <Card className="p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold">Optimal Interventions Selected by Knapsack Algorithm</h3>
                <p className="text-xs text-slate-400">Highest risk reduction per rupee spent under statutory constraints</p>
              </div>
              <Badge variant="info" className="text-xs font-mono">
                {budgetResult?.optimization_algorithm || 'DP_Knapsack'}
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className={`border-b text-xs uppercase tracking-wider font-semibold ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                    <th className="py-3 px-4">Defect Code</th>
                    <th className="py-3 px-4">Corridor & Vulnerable POI</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Severity / RPI</th>
                    <th className="py-3 px-4">Estimated Cost</th>
                    <th className="py-3 px-4">Safety Gain (ΔRPI)</th>
                    <th className="py-3 px-4 text-right">Audit & XAI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {budgetResult?.selected_interventions.map((item) => (
                    <tr key={item.cluster_code} className={`transition-colors ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                        {item.cluster_code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold">{item.road_name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-rose-400" />
                          {item.nearest_poi}
                          {item.is_vulnerable_zone && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">
                              SCHOOL/HOSPITAL
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium">
                        {item.defect_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          item.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' :
                          item.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {item.severity} (RPI {item.rpi_score})
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-300">
                        ₹{item.cost_lakhs.toFixed(2)}L
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-400">
                        +{item.benefit_value} pts
                        <span className="text-xs text-slate-400 font-normal block">ΔRPI -{item.delta_rpi}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenXAI(item.cluster_code)}
                          className="text-xs gap-1 py-1 px-2.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          Explain AI
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {(!budgetResult || budgetResult.selected_interventions.length === 0) && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No candidate interventions meet the selected budget. Increase the budget slider above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB 2: SHIFT WORKLOAD TRIAGE (TOP 20) ────────────────────────────── */}
      {activeTab === 'TRIAGE' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  Command Centre Shift Workload Triage & Alert-Fatigue Filter
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Distills high-volume sensor noise into the Top 20 actionable interventions for today's active shift
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={shiftName}
                  onChange={(e) => {
                    setShiftName(e.target.value);
                    loadShiftTriage(e.target.value);
                  }}
                  className={`text-sm px-3 py-2 rounded-xl border font-medium ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="Morning Shift (06:00 - 14:00)">Morning Shift (06:00 - 14:00)</option>
                  <option value="Afternoon Shift (14:00 - 22:00)">Afternoon Shift (14:00 - 22:00)</option>
                  <option value="Night Patrol Shift (22:00 - 06:00)">Night Patrol Shift (22:00 - 06:00)</option>
                </select>
              </div>
            </div>

            {/* Triage Count Banners */}
            {triageResult && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/50">
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-rose-950/20 border-rose-900/40' : 'bg-rose-50 border-rose-200'}`}>
                  <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">P1 Immediate (SLA 2h)</div>
                  <div className="text-2xl font-black text-rose-400 mt-1">{triageResult.p1_immediate_count}</div>
                  <div className="text-xs text-slate-400 mt-1">Hazard to life / Wrong-way</div>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'bg-amber-950/20 border-amber-900/40' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">P2 Four-Hour (SLA 4h)</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">{triageResult.p2_four_hour_count}</div>
                  <div className="text-xs text-slate-400 mt-1">Major arterial disruption</div>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'bg-indigo-950/20 border-indigo-900/40' : 'bg-indigo-50 border-indigo-200'}`}>
                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">P3 Shift Queue (SLA 24h)</div>
                  <div className="text-2xl font-black text-indigo-400 mt-1">{triageResult.p3_shift_sla_count}</div>
                  <div className="text-xs text-slate-400 mt-1">Routine maintenance dispatch</div>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50 border-emerald-200'}`}>
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Fatigue Silenced</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {triageResult.alert_fatigue_suppressed_count}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Repeated duplicate pings filtered</div>
                </div>
              </div>
            )}
          </Card>

          {/* Top 20 Interventions Table */}
          <Card className="p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Shift Workload Priority Action List (Top 20)</h3>
              <Badge variant="info" className="text-xs">
                Active Shift: {shiftName}
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className={`border-b text-xs uppercase tracking-wider font-semibold ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Code / Type</th>
                    <th className="py-3 px-4">Corridor & POI</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Assigned Agency</th>
                    <th className="py-3 px-4">Action Directive</th>
                    <th className="py-3 px-4 text-right">Statutory XAI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {triageResult?.top_interventions.map((it) => (
                    <tr key={it.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-black px-2 py-0.5 rounded ${
                          it.shift_priority === 'P1_IMMEDIATE' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          it.shift_priority === 'P2_WITHIN_4H' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        }`}>
                          {it.shift_priority.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        <div className="font-bold text-white">{it.code}</div>
                        <div className="text-[10px] text-slate-400">{it.type}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{it.corridor}</div>
                        {it.nearest_poi && (
                          <div className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-rose-400" />
                            {it.nearest_poi}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium">
                        {it.category}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-300">
                        {it.assigned_agency}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-emerald-400">
                        {it.action}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenXAI(it.code)}
                          className="text-xs gap-1 py-1 px-2.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          XAI Trace
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB 3: IRC:37 CHRONIC HOTSPOTS ──────────────────────────────────── */}
      {activeTab === 'CHRONIC' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  IRC:37 Citywide Chronic Infrastructure Failure Recurrence Engine
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detects chronic failure recurrence (&gt;3 repair cycles in 180 days) indicating subgrade structural shear failure
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total Est. Rehabilitation Budget</span>
                <span className="text-xl font-black text-rose-400">
                  ₹{chronicResult?.total_rehabilitation_budget_lakhs.toFixed(1)} Lakhs
                </span>
              </div>
            </div>

            {/* Statutory Standard Card */}
            <div className={`mt-6 p-4 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-start gap-3">
                <Scale className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Statutory Specification: {chronicResult?.governing_statute}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Under IRC:37 Clause 6.4, repeated pavement distress recurrence proves inadequate sub-base modulus or subgrade water saturation.
                    Superficial pothole patching or asphalt filling is legally non-compliant; municipal contractors must execute full-depth milling,
                    wet-mix macadam sub-base stabilization, and minimum 50mm DBM + 40mm Bituminous Concrete overlay.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Chronic Corridors Hotspots List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {chronicResult?.chronic_corridors.map((corridor) => (
              <Card key={corridor.corridor_name} className="p-6 border-rose-900/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 bg-rose-500/20 text-rose-400 border-b border-l border-rose-500/30 text-[10px] font-black uppercase tracking-wider rounded-bl-xl">
                  CHRONIC RECURRENCE HOTSPOT
                </div>

                <h4 className="text-lg font-black text-white mb-1">{corridor.corridor_name}</h4>
                <div className="text-xs text-slate-400 flex items-center gap-2 mb-4">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  GPS: {corridor.avg_lat}, {corridor.avg_lng}
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Distress Clusters</span>
                    <span className="text-lg font-black text-white">{corridor.total_distress_clusters}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Failed Repairs</span>
                    <span className="text-lg font-black text-rose-400">{corridor.recurrent_failures_count}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Penalties Debit</span>
                    <span className="text-lg font-black text-amber-400">₹{corridor.penalties_recovered_inr.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block">Structural Diagnosis:</span>
                    <span className="text-rose-300 font-medium">{corridor.diagnosis}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Statutory Mandate:</span>
                    <span className="text-slate-300 leading-relaxed block">{corridor.statutory_mandate}</span>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                    <span className="font-semibold text-slate-400">Capital Rehab Estimate:</span>
                    <span className="text-base font-black text-indigo-400">₹{corridor.estimated_rehab_budget_lakhs} Lakhs</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: EDGE MLOPS & FEDAVG ───────────────────────────────────────── */}
      {activeTab === 'MLOPS' && (
        <div className="space-y-6">
          {/* Federated Learning Simulation Header */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Cpu className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold">Federated Learning (FedAvg) & Bandwidth Optimization</h3>
                  <Badge variant="success" className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    99.9% Bandwidth Saved
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">
                  Decentralized model refinement across transit fleet nodes: transmits only compressed gradient vectors (ΔW_k, N_k).
                  Raw passenger video never leaves the bus.
                </p>
              </div>

              <Button
                variant="primary"
                onClick={handleTriggerFedRound}
                disabled={isRunningFedRound}
                className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
              >
                <Zap className={`w-4 h-4 ${isRunningFedRound ? 'animate-spin' : ''}`} />
                {isRunningFedRound ? 'Aggregating Round...' : 'Execute FedAvg Training Round'}
              </Button>
            </div>

            {/* Live Federated Round Outcome */}
            {fedRoundResult && (
              <div className="mt-6 p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Federated Round #{fedRoundResult.round_number} Completed Successfully
                  </span>
                  <span className="text-xs font-mono text-slate-400">{fedRoundResult.server_aggregation_time_ms}ms wall-clock</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 rounded-lg bg-slate-800/60">
                    <span className="text-[10px] text-slate-400 block uppercase">Clients Aggregated</span>
                    <span className="text-lg font-black text-white">{fedRoundResult.participating_clients_count} Transit Nodes</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/60">
                    <span className="text-[10px] text-slate-400 block uppercase">Global Loss</span>
                    <span className="text-lg font-black text-emerald-400">{fedRoundResult.global_aggregated_loss}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/60">
                    <span className="text-[10px] text-slate-400 block uppercase">Model mAP@0.5</span>
                    <span className="text-lg font-black text-cyan-400">{fedRoundResult.model_mAP50_score}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/60">
                    <span className="text-[10px] text-slate-400 block uppercase">Cellular Data Saved</span>
                    <span className="text-lg font-black text-indigo-400">
                      {fedRoundResult.bandwidth_efficiency.raw_video_avoided_mb} MB ({fedRoundResult.bandwidth_efficiency.bandwidth_saved_pct}%)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Fleet Edge NPU Hardware Telemetry Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-400" />
                Fleet Edge NPU Hardware & 128GB SSD Ring-Buffer Diagnostics
              </h3>
              <Badge variant="info" className="text-xs font-mono">
                Model: {edgeDiagnostics?.active_model_version} • Canary: {edgeDiagnostics?.canary_rollout_stage}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {edgeDiagnostics?.bus_diagnostics.map((bus) => (
                <Card key={bus.bus_id} className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        {bus.bus_id}
                        <span className={`w-2 h-2 rounded-full ${bus.is_online ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                      </div>
                      <div className="text-xs text-slate-400">{bus.route_name}</div>
                    </div>
                    <Badge variant={bus.health_verdict === 'NOMINAL_HEALTH' ? 'success' : 'warning'} className="text-xs">
                      {bus.health_verdict}
                    </Badge>
                  </div>

                  {/* Hardware Specs & Temperature */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-800/40 text-center text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Inference FPS</span>
                      <span className="font-black text-cyan-400 text-base">{bus.edge_fps} FPS</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">NPU Core Temp</span>
                      <span className={`font-black text-base ${bus.npu_temperature_c > 75 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {bus.npu_temperature_c}°C
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Camera PTP Sync</span>
                      <span className="font-black text-indigo-400 text-xs mt-1 block">33.3ms LOCKED</span>
                    </div>
                  </div>

                  {/* SSD Ring Buffer Meter */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-400 flex items-center gap-1">
                        <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                        128GB SSD Circular Ring Buffer
                      </span>
                      <span className="text-slate-200">{bus.ssd_ring_buffer.used_gb} GB / {bus.ssd_ring_buffer.capacity_gb} GB ({bus.ssd_ring_buffer.used_pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          bus.ssd_ring_buffer.used_pct > 85 ? 'bg-rose-500' :
                          bus.ssd_ring_buffer.used_pct > 70 ? 'bg-amber-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${bus.ssd_ring_buffer.used_pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                      <span>FIFO Overwrite Margin: <strong className="text-slate-300">{bus.ssd_ring_buffer.retention_buffer_hours}h</strong></span>
                      <span>Locked Incidents: <strong className="text-amber-400">{bus.ssd_ring_buffer.locked_incident_clips}</strong> clips</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── XAI REASONING TRACE MODAL / DRAWER ─────────────────────────────────── */}
      {selectedEntityId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-2xl p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-indigo-900/60' : 'bg-white border-slate-300'} shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-600 text-white">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Defensible XAI Reasoning Trace</h3>
                  <p className="text-xs text-slate-400 font-mono">Entity: {selectedEntityId}</p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedEntityId(null); setXaiTrace(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingXAI ? (
              <div className="py-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                Generating legally defensible XAI reasoning trace...
              </div>
            ) : xaiTrace ? (
              <div className="space-y-4 text-sm">
                {/* Corridor & Severity Banner */}
                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Road Corridor:</div>
                    <div className="font-bold text-white text-base">{xaiTrace.road_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Time-to-Collision (TTC):</div>
                    <div className="font-black text-rose-400 text-base">{xaiTrace.time_to_collision_sec}s</div>
                  </div>
                </div>

                {/* Statutory Liability Section */}
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                    <Scale className="w-4 h-4" />
                    Statutory Liability: {xaiTrace.statutory_liability.clause}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {xaiTrace.statutory_liability.mandate}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-rose-900/30">
                    <span>Statutory Penalty Exposure: <strong className="text-rose-400">₹{xaiTrace.statutory_liability.penalty_exposure_inr.toLocaleString()}</strong></span>
                    <span>Statutory SLA: <strong className="text-amber-400">{xaiTrace.statutory_liability.statutory_sla_hours} Hours</strong></span>
                  </div>
                </div>

                {/* Risk Factor Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contributing Risk Factor Weights</h4>
                  <div className="space-y-2.5">
                    {xaiTrace.contributing_factors.map((cf) => (
                      <div key={cf.factor} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200">{cf.factor}</span>
                          <span className="font-mono text-indigo-400">Weight: {(cf.weight * 100).toFixed(0)}% • Score: {cf.score}</span>
                        </div>
                        <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${cf.score * 100}%` }} />
                        </div>
                        <div className="text-[11px] text-slate-400">{cf.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Natural Language Explanation */}
                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
                  <span className="text-xs font-bold text-slate-400 block mb-1 uppercase tracking-wider">AI Reasoning Justification</span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {xaiTrace.xai_narrative_explanation}
                  </p>
                </div>

                {/* Recommended Intervention Directive */}
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase block">Actionable Directive</span>
                    <span className="font-bold text-white text-xs">{xaiTrace.recommended_intervention}</span>
                  </div>
                  <Check className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
            ) : null}

            <div className="pt-2 text-right">
              <Button variant="outline" size="sm" onClick={() => { setSelectedEntityId(null); setXaiTrace(null); }}>
                Close Trace
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
