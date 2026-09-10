import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Layers, 
  CheckCircle2, 
  Droplets, 
  ShieldAlert, 
  AlertTriangle, 
  Bus, 
  Camera, 
  Activity, 
  Car,
  Clock,
  Sparkles
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface ScenarioRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectEvent?: (event: any) => void;
}

interface ScenarioStep {
  stepNumber: number;
  timeLabel: string;
  title: string;
  detail: string;
  telemetry: {
    busId: string;
    speed: number;
    sensorReading: string;
    status: string;
  };
}

interface ScriptedScenario {
  id: string;
  code: string;
  name: string;
  category: 'Monsoon' | 'SchoolSafety' | 'HitAndRun';
  icon: any;
  color: string;
  description: string;
  steps: ScenarioStep[];
}

const SCENARIOS: ScriptedScenario[] = [
  {
    id: 'scen-monsoon',
    code: 'SCEN-MONSOON-01',
    name: 'Monsoon Corridor Hydroplaning & Subsidence',
    category: 'Monsoon',
    icon: Droplets,
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
    description: 'Sudden localized thunderstorm triggers surface waterlogging (>120mm) and rapid pothole cavitation near Chromepet Bridge.',
    steps: [
      {
        stepNumber: 1,
        timeLabel: 'T+00:00 (11:40 AM)',
        title: 'Localized Heavy Precipitation Alert',
        detail: 'IMD Rain Radar flags 42mm/h downpour. MTC-1042 optical rain sensor confirms reduced windshield visibility.',
        telemetry: { busId: 'BUS-TN01-1042', speed: 42, sensorReading: 'Rain Optical: 88% attenuation', status: 'MONITORING' }
      },
      {
        stepNumber: 2,
        timeLabel: 'T+02:30 (11:42 AM)',
        title: 'Waterlogging Ingress & Hydroplaning Spike',
        detail: '6-Axis IMU detects tyre aquaplaning signature (drag coefficient jump + vertical Gz oscillation). Water depth: 135mm.',
        telemetry: { busId: 'BUS-TN01-1042', speed: 28, sensorReading: 'IMU Drag Spike: +0.48g', status: 'CRITICAL_ALERT' }
      },
      {
        stepNumber: 3,
        timeLabel: 'T+04:15 (11:44 AM)',
        title: 'Multi-Bus Cross-Confirmation',
        detail: 'Bus MTC-1088 behind passes the same coordinates and re-verifies severe waterlogged pothole void (#DEF-GST-881).',
        telemetry: { busId: 'BUS-TN01-1088', speed: 22, sensorReading: 'Consensus: 96% Match with Unit 1042', status: 'CONFIRMED_HAZARD' }
      },
      {
        stepNumber: 4,
        timeLabel: 'T+06:00 (11:46 AM)',
        title: 'Autonomous Reroute Directive Dispatched',
        detail: 'MTC Central System pushes reroute directive via Inner Ring Road to 6 following buses; GCC Sump Pump unit alerted.',
        telemetry: { busId: 'SYSTEM-DISPATCH', speed: 0, sensorReading: 'Reroute 6 units • Target Delay: -18m', status: 'DISPATCHED' }
      }
    ]
  },
  {
    id: 'scen-school',
    code: 'SCEN-SAFETY-02',
    name: 'School Zone Pedestrian Near-Miss Anomaly',
    category: 'SchoolSafety',
    icon: ShieldAlert,
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
    description: 'Reckless vehicle speeding in active D.A.V. school crossing zone, near-miss incident with vulnerable students.',
    steps: [
      {
        stepNumber: 1,
        timeLabel: 'T+00:00 (08:15 AM)',
        title: 'School Zone Geofence Activated',
        detail: 'Bus MTC-2015 enters designated 1000m D.A.V. Senior Secondary School POI zone (+10 RPI Priority).',
        telemetry: { busId: 'BUS-TN01-2015', speed: 25, sensorReading: 'POI Geofence: School Zone Active', status: 'GEOFENCE_ACTIVE' }
      },
      {
        stepNumber: 2,
        timeLabel: 'T+01:20 (08:16 AM)',
        title: 'Target Vehicle Speed Anomaly Detected',
        detail: 'Edge AI camera tracks approaching white SUV at 64 km/h in a 25 km/h statutory school crossing zone.',
        telemetry: { busId: 'BUS-TN01-2015', speed: 24, sensorReading: 'Target Speed: 64 km/h (+156% over limit)', status: 'VIOLATION_TRACKING' }
      },
      {
        stepNumber: 3,
        timeLabel: 'T+02:05 (08:17 AM)',
        title: 'Near-Miss Trajectory Intersection Alert',
        detail: 'Pedestrian AI detector identifies 3 students on zebra crossing. Target vehicle executes emergency brake skid.',
        telemetry: { busId: 'BUS-TN01-2015', speed: 20, sensorReading: 'Near-Miss Time-to-Collision: 1.2s', status: 'NEAR_MISS_FLAGGED' }
      },
      {
        stepNumber: 4,
        timeLabel: 'T+03:30 (08:18 AM)',
        title: 'ANPR Capture & Traffic Marshal Deployment',
        detail: 'License Plate OCR locks plate TN-07-BW-2041 (96% conf). Traffic Police Marshal unit assigned to junction.',
        telemetry: { busId: 'GCTP-CONSOLE', speed: 0, sensorReading: 'e-Challan Drafted & Marshal Pushed', status: 'RESOLVED_LOGGED' }
      }
    ]
  },
  {
    id: 'scen-hitandrun',
    code: 'SCEN-CRIM-03',
    name: 'Hit-and-Run Investigation & ANPR Consensus',
    category: 'HitAndRun',
    icon: AlertTriangle,
    color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
    description: 'Collision near Kathipara Grade Descent; suspect vehicle flees; multi-candidate license plate OCR ranking.',
    steps: [
      {
        stepNumber: 1,
        timeLabel: 'T+00:00 (01:10 PM)',
        title: 'Collision Acoustic & G-Force Shock Signature',
        detail: 'Acoustic sensor on MTC-1088 detects impact shockwave (>105dB) accompanied by lateral tilt jerk.',
        telemetry: { busId: 'BUS-TN01-1088', speed: 38, sensorReading: 'Impact Sensor: +1.2g Lateral Shock', status: 'IMPACT_DETECTED' }
      },
      {
        stepNumber: 2,
        timeLabel: 'T+00:45 (01:11 PM)',
        title: 'Fleeing Vehicle Tracking Vector',
        detail: 'Edge Dashcam ByteTrack tracker locks dark sedan accelerating away at 78 km/h without stopping.',
        telemetry: { busId: 'BUS-TN01-1088', speed: 36, sensorReading: 'Tracking ID #TRK-992 • Escape Vector NE', status: 'VEHICLE_FLEEING' }
      },
      {
        stepNumber: 3,
        timeLabel: 'T+01:30 (01:12 PM)',
        title: 'Multi-Candidate ANPR OCR Matrix',
        detail: 'Uncertainty engine computes candidate plates: TN-09-CB-4821 (94%), TN-09-GB-4821 (68%), TN-09-OB-4821 (32%).',
        telemetry: { busId: 'ANPR-ENGINE', speed: 0, sensorReading: 'Primary: TN-09-CB-4821 (94% Conf)', status: 'OCR_RESOLVED' }
      },
      {
        stepNumber: 4,
        timeLabel: 'T+02:45 (01:13 PM)',
        title: 'PCR Interceptor Unit Dispatched via Tetra',
        detail: 'Evidence dossier dispatched to Police Control Room Interceptor Unit PCR-SOUTH-04; highway toll gate notified.',
        telemetry: { busId: 'GCTP-PCR-04', speed: 52, sensorReading: 'Interceptor ETA: 3.5 mins to Kathipara', status: 'INTERCEPT_UNDERWAY' }
      }
    ]
  }
];

export const ScenarioRunnerModal: React.FC<ScenarioRunnerModalProps> = ({ isOpen, onClose, onInjectEvent }) => {
  const { success } = useToast();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scen-monsoon');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const scenario = SCENARIOS.find((s) => s.id === selectedScenarioId) || SCENARIOS[0];

  // Auto-play timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= scenario.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 3500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, scenario.steps.length]);

  if (!isOpen) return null;

  const currentStep = scenario.steps[currentStepIndex];
  const isComplete = currentStepIndex === scenario.steps.length - 1 && !isPlaying;
  const progressPercent = ((currentStepIndex + 1) / scenario.steps.length) * 100;
  const afterAction = scenario.id === 'scen-monsoon'
    ? { tempo: '06:00', evidence: '96%', impact: '6 buses rerouted', outcome: 'Service disruption contained' }
    : scenario.id === 'scen-school'
      ? { tempo: '03:30', evidence: '96%', impact: 'Marshal assigned', outcome: 'High-risk crossing protected' }
      : { tempo: '02:45', evidence: '94%', impact: 'PCR dispatched', outcome: 'Interceptor action underway' };

  const handleSelectScenario = (id: string) => {
    setSelectedScenarioId(id);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const handleStepForward = () => {
    if (currentStepIndex < scenario.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleTogglePlayback = () => {
    if (isComplete) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((playing) => !playing);
  };

  const handleApplyToDashboard = () => {
    success(
      'Scenario Event Injected',
      `Live telemetry updated with "${scenario.name}" for ${currentStep.title}.`
    );
    onInjectEvent?.(currentStep);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md">
              <Play className="w-4 h-4 ml-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Deterministic Scenario Runner</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Demo Environment
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Replay scripted municipal operations drills with deterministic bus sensor telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Scenario Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SCENARIOS.map((s) => {
              const Icon = s.icon;
              const isSelected = s.id === selectedScenarioId;
              return (
                <button
                  key={s.id}
                  onClick={() => handleSelectScenario(s.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-amber-300 dark:hover:border-amber-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center border ${s.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9.5px] font-mono font-bold text-slate-400">{s.code}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                      {s.name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Timeline Playback Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTogglePlayback}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                  <span>{isPlaying ? 'Pause Drill' : isComplete ? 'Replay Drill' : 'Play Scenario'}</span>
                </button>

                <button
                  onClick={handleStepForward}
                  disabled={currentStepIndex >= scenario.steps.length - 1}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-750 transition"
                  title="Step Forward"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  onClick={handleReset}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 transition"
                  title="Reset Scenario to T+0"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <div className="text-right">
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                  Step {currentStepIndex + 1} of {scenario.steps.length}
                </span>
                <span className="text-[11px] font-mono text-slate-400 block">{currentStep.timeLabel}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 mb-2" aria-live="polite">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider ${
                isComplete ? 'text-emerald-600 dark:text-emerald-400' : isPlaying ? 'text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isComplete ? 'bg-emerald-500' : isPlaying ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`} />
                {isComplete ? 'Drill complete — ready to inject' : isPlaying ? 'Live replay in progress' : 'Replay paused'}
              </span>
              <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">Elapsed progress: {Math.round(progressPercent)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700" role="progressbar" aria-label="Scenario replay progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progressPercent)}>
              <div className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${progressPercent}%` }} />
            </div>

            {/* Stepper Progress Bar */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              {scenario.steps.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => { setCurrentStepIndex(idx); setIsPlaying(false); }}
                    aria-label={`Jump to step ${idx + 1}: ${step.title}`}
                    aria-current={isCurrent ? 'step' : undefined}
                    className="cursor-pointer space-y-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                  >
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        isPassed ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'
                      } ${isCurrent ? 'ring-2 ring-amber-300 dark:ring-amber-700' : ''}`}
                    />
                    <span className="text-[10px] truncate block font-medium text-slate-600 dark:text-slate-300">
                      {step.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Step Telemetry Dossier */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0F1D] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10.5px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">
                  Active Event Stage &bull; {currentStep.timeLabel}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{currentStep.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {currentStep.detail}
                </p>
              </div>
              <span className="text-[10.5px] font-mono font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shrink-0 border border-slate-200 dark:border-slate-700">
                {currentStep.telemetry.status}
              </span>
            </div>

            {/* Live Sensor Metrics Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Originating Node</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{currentStep.telemetry.busId}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Vehicle Speed</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{currentStep.telemetry.speed} km/h</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Sensor Observation</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate block">
                  {currentStep.telemetry.sensorReading}
                </span>
              </div>
            </div>
          </div>

          {isComplete && (
            <section aria-labelledby="after-action-title" className="border border-emerald-200 dark:border-emerald-900/80 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl p-4 sm:p-5 animate-fadeIn">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Replay conclusion</p>
                  <h3 id="after-action-title" className="text-sm font-bold text-slate-900 dark:text-white mt-1">After-action decision scorecard</h3>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" /> REVIEW READY</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
                <div><span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Response tempo</span><strong className="text-sm text-slate-900 dark:text-white">{afterAction.tempo}</strong><span className="block text-[10px] text-slate-500 dark:text-slate-400">to action</span></div>
                <div><span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Evidence strength</span><strong className="text-sm text-emerald-700 dark:text-emerald-300">{afterAction.evidence}</strong><span className="block text-[10px] text-slate-500 dark:text-slate-400">cross-verified</span></div>
                <div><span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Predicted impact</span><strong className="text-sm text-slate-900 dark:text-white">{afterAction.impact}</strong><span className="block text-[10px] text-slate-500 dark:text-slate-400">operational mitigation</span></div>
                <div className="col-span-2 lg:col-span-1 border-l-2 border-emerald-500 pl-3"><span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Outcome</span><strong className="text-sm leading-snug text-emerald-800 dark:text-emerald-200">{afterAction.outcome}</strong></div>
              </div>
            </section>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40 text-xs">
          <span className="text-slate-400 font-mono">SCENARIO RUNNER: {scenario.code}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyToDashboard}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-xs"
            >
              Inject Event to Live Map
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
