import React, { useState, useEffect } from 'react';
import {
  X,
  Bus,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Activity,
  Camera,
  MapPin,
  ArrowRight,
  RefreshCw,
  Sliders,
  Check
} from 'lucide-react';
import { HazardCluster } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface FleetRepassModalProps {
  isOpen: boolean;
  onClose: () => void;
  clusters: HazardCluster[];
  onAutoClose: (clusterId: string, afterImageUrl: string, notes: string) => void;
}

const VERIFIED_ASPHALT_IMG = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80';

export const FleetRepassModal: React.FC<FleetRepassModalProps> = ({
  isOpen,
  onClose,
  clusters,
  onAutoClose
}) => {
  const { t, language } = useLanguage();

  // Find eligible tickets (open, assigned, in_progress, reinspection_pending)
  const eligibleClusters = clusters.filter(
    (c) => c.status !== 'verified_closed' && c.status !== 'resolved'
  );

  const [selectedClusterId, setSelectedClusterId] = useState<string>(
    eligibleClusters[0]?.id || ''
  );
  const [selectedBus, setSelectedBus] = useState<string>('BUS-MTC-19B');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  useEffect(() => {
    if (eligibleClusters.length > 0 && !selectedClusterId) {
      setSelectedClusterId(eligibleClusters[0].id);
    }
  }, [eligibleClusters, selectedClusterId]);

  if (!isOpen) return null;

  const currentCluster = clusters.find((c) => c.id === selectedClusterId) || eligibleClusters[0];

  const handleStartRepassSimulation = () => {
    if (!currentCluster) return;
    setIsScanning(true);
    setScanStep(1);
    setIsCompleted(false);

    // Step 1: GPS proximity lock (0.6s)
    setTimeout(() => {
      setScanStep(2);
      // Step 2: Edge NPU Optical Scan (1.3s)
      setTimeout(() => {
        setScanStep(3);
        // Step 3: IMU Telemetry Normalized (2.0s)
        setTimeout(() => {
          setScanStep(4);
          setIsScanning(false);
          setIsCompleted(true);
        }, 800);
      }, 700);
    }, 600);
  };

  const handleApplyClosure = () => {
    if (!currentCluster) return;
    const auditNotes = `[AUTONOMOUS_FLEET_CLOSURE] Verified closed by Fleet Node ${selectedBus} on re-pass patrol. Telemetry: Gz vertical shock = 0.98g (nominal baseline, threshold < 1.15g). Optical AI: Defect resolved per IRC:SP:20 standard. MoHUA cryptographic audit logged.`;
    onAutoClose(currentCluster.id, VERIFIED_ASPHALT_IMG, auditNotes);
    setIsCompleted(false);
    setScanStep(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {language === 'hi' ? 'बस पुनः जांच एवं स्वतः बंद इंजन' : 'Fleet Re-Pass & Auto-Close Engine'}
                </h3>
                <Badge variant="success" size="sm" className="hidden sm:inline-flex">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Autonomous
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'hi'
                  ? 'बस के कैमरे और IMU सेंसर द्वारा गड्ढे की मरम्मत का सत्यापन करके टिकट स्वतः बंद करें'
                  : 'Automated defect closure verified via MTC bus edge camera and 6-axis IMU shock sensors'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-5 text-xs sm:text-sm">
          {eligibleClusters.length === 0 ? (
            <div className="p-8 text-center bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl">
              <ShieldCheck className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
              <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                {language === 'hi' ? 'सभी कार्य आदेश पहले से सत्यापित और बंद हैं!' : 'All Work Orders Are Already Verified & Closed!'}
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                {language === 'hi'
                  ? 'इस वार्ड में कोई भी खुला गड्ढा सत्यापन हेतु लंबित नहीं है।'
                  : 'Zero open hazard clusters require re-pass verification at this time.'}
              </p>
            </div>
          ) : (
            <>
              {/* Step 1: Select Work Order & Patrol Bus */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'hi' ? 'सत्यापन हेतु कार्य आदेश चुनें:' : 'Target Work Order:'}
                  </label>
                  <select
                    value={selectedClusterId}
                    onChange={(e) => {
                      setSelectedClusterId(e.target.value);
                      setIsCompleted(false);
                      setScanStep(0);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {eligibleClusters.map((cl) => (
                      <option key={cl.id} value={cl.id}>
                        {cl.cluster_code} - {cl.road_name} ({cl.defect_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'hi' ? 'गश्त कर रही बस चुनें:' : 'Patrolling Fleet Bus Node:'}
                  </label>
                  <select
                    value={selectedBus}
                    onChange={(e) => setSelectedBus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="BUS-MTC-19B">BUS-MTC-19B (Tambaram → Broadway Express)</option>
                    <option value="BUS-MTC-21G">BUS-MTC-21G (Guindy → Central Station)</option>
                    <option value="BUS-MTC-570">BUS-MTC-570 (Koyambedu → OMR Cyber Corridor)</option>
                  </select>
                </div>
              </div>

              {/* Target Details Card */}
              {currentCluster && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {currentCluster.cluster_code}
                      </span>
                      <Badge variant="critical" size="sm">
                        {currentCluster.defect_name}
                      </Badge>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        RPI: {currentCluster.rpi_boosted ?? currentCluster.rpi_score}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{currentCluster.road_name}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-500 block">
                      {language === 'hi' ? 'आवंटित ठेकेदार' : 'Assigned Agency'}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {currentCluster.assigned_agency}
                    </span>
                  </div>
                </div>
              )}

              {/* Simulation Stage Display */}
              <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    AUTONOMOUS TELEMETRY PIPELINE
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    {scanStep === 4 ? 'VERIFIED PASSED' : isScanning ? 'ANALYZING ROAD...' : 'IDLE / READY'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className={`flex items-center justify-between p-2 rounded-lg ${scanStep >= 1 ? 'bg-slate-800/80 text-emerald-300' : 'text-slate-500'}`}>
                    <span className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" />
                      1. GPS Proximity Lock (15m radius)
                    </span>
                    <span>{scanStep >= 1 ? 'LOCKED [12.9516, 80.1462]' : 'WAITING'}</span>
                  </div>

                  <div className={`flex items-center justify-between p-2 rounded-lg ${scanStep >= 2 ? 'bg-slate-800/80 text-emerald-300' : 'text-slate-500'}`}>
                    <span className="flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5" />
                      2. Edge Sony IMX335 Optical Scan
                    </span>
                    <span>{scanStep >= 2 ? 'CAVITY FILLED (CONFIDENCE 0.04)' : 'PENDING'}</span>
                  </div>

                  <div className={`flex items-center justify-between p-2 rounded-lg ${scanStep >= 3 ? 'bg-slate-800/80 text-emerald-300' : 'text-slate-500'}`}>
                    <span className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5" />
                      3. MPU-6050 6-Axis IMU Shock Scan
                    </span>
                    <span>{scanStep >= 3 ? 'Gz = 0.98g (NORMAL, NO SPIKE)' : 'PENDING'}</span>
                  </div>

                  <div className={`flex items-center justify-between p-2 rounded-lg ${scanStep >= 4 ? 'bg-emerald-950/60 text-emerald-200 border border-emerald-800/50' : 'text-slate-500'}`}>
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      4. Auto-Verification &amp; Hash Seal
                    </span>
                    <span>{scanStep >= 4 ? 'SEALED (MoHUA #e4b9...f01)' : 'PENDING'}</span>
                  </div>
                </div>
              </div>

              {/* Before & After Dual Proof Inspection */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                      {language === 'hi' ? 'मरम्मत से पहले (Before)' : 'Before Repair (Defect)'}
                    </span>
                    <Badge variant="critical" size="sm">Gz = 1.45g Shock</Badge>
                  </div>
                  <div className="aspect-video rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700">
                    <img
                      src={currentCluster?.before_image_url || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80'}
                      alt="Before Repair"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      {language === 'hi' ? 'बस पुनः जांच में (After)' : 'Fleet Re-pass (After)'}
                    </span>
                    <Badge variant="success" size="sm">Gz = 0.98g Normal</Badge>
                  </div>
                  <div className="aspect-video rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 relative">
                    <img
                      src={VERIFIED_ASPHALT_IMG}
                      alt="After Repair"
                      className="w-full h-full object-cover"
                    />
                    {scanStep === 4 && (
                      <div className="absolute inset-0 bg-emerald-950/40 flex items-center justify-center backdrop-blur-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-lg">
                          <Check className="w-4 h-4" />
                          {language === 'hi' ? 'पुनः जांच में पास' : 'Re-pass Verified'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {language === 'hi' ? 'रद्द करें' : 'Close'}
          </Button>

          {eligibleClusters.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {!isCompleted ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStartRepassSimulation}
                  disabled={isScanning}
                  icon={isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bus className="w-4 h-4" />}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
                >
                  {isScanning
                    ? (language === 'hi' ? 'बस पुनः जांच चल रही है...' : 'Bus Re-pass In Progress...')
                    : (language === 'hi' ? 'बस पुनः निरीक्षण जांच शुरू करें' : 'Run Fleet Re-Pass Simulation')}
                </Button>
              ) : (
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleApplyClosure}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  className="w-full sm:w-auto"
                >
                  {language === 'hi' ? 'स्वतः बंद करें व डेटा सहेजें' : 'Confirm & Auto-Close Work Order'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
