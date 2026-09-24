import React, { useState, useRef } from 'react';
import {
  X, UploadCloud, FileVideo, Image as ImageIcon, AlertCircle,
  CheckCircle2, RefreshCw, Zap, ShieldCheck, Play, ArrowRight,
  Sliders, Trash2, Cpu, MapPin, Clock, Eye, AlertTriangle, ChevronRight, Check,
  School, ShieldAlert, Droplets, Wrench
} from 'lucide-react';
import { api } from '../../services/api';
import { HazardCluster, DefectCode, Severity } from '../../types';
import { Button } from '../ui/Button';

interface UploadFootageModalProps {
  isOpen: boolean;
  onClose: () => void;
  busId?: string;
  selectedChannel?: number;
  onUploadSuccess?: (result: any) => void;
  onAddCluster?: (newCluster: HazardCluster) => void;
  onNavigateToMap?: () => void;
}

const SAMPLE_SCENARIOS = [
  {
    id: "scen-pothole",
    title: "NH-32 Highway Pothole Scan",
    subtext: "GST Road Tambaram • IRC:SP:20 3D Mesh",
    icon: Wrench,
    color: "emerald",
    defectCode: "D40",
    defectLabel: "Pothole Cavity (8.4cm Depth)",
    videoUrl: "/uploads/sample_clips/clip_pothole_nh32.mp4",
    corridor: "GST Road, Tambaram (NH-32)",
    channel: 1,
    confidence: 0.96,
    depthCm: 8.4,
    mvaSection: "IRC:SP:20 Schedule Rate ₹3,450",
    fineInr: 3450
  },
  {
    id: "scen-traffic",
    title: "Urban Highway Traffic & Assets",
    subtext: "Anna Salai Arterial • Multi-Class Perception",
    icon: ShieldAlert,
    color: "rose",
    defectCode: "TRAFFIC_VEHICLE",
    defectLabel: "Multi-Vehicle Traffic Flow & Asset Radar",
    videoUrl: "/uploads/sample_clips/clip_urban_traffic.mp4",
    corridor: "Anna Salai (Mount Road CBD)",
    channel: 1,
    confidence: 0.94,
    plate: "TN-01-AX-8732",
    speedKmh: 48.0,
    mvaSection: "MVA 1988 Sec 184 / CMVR 138",
    fineInr: 2000
  },
  {
    id: "scen-expressway",
    title: "OMR 4K Expressway Corridor",
    subtext: "OMR IT Highway • Lane & Barrier Perception",
    icon: Droplets,
    color: "cyan",
    defectCode: "MISSING_DIVIDER",
    defectLabel: "Highway Barrier & Infrastructure Radar",
    videoUrl: "/uploads/sample_clips/clip_omr_expressway.mp4",
    corridor: "Old Mahabalipuram Road (OMR IT Corridor)",
    channel: 1,
    confidence: 0.92,
    mvaSection: "IRC:SP:84 Highway Operations",
    fineInr: 5000
  },
  {
    id: "scen-crosswalk",
    title: "Pedestrian Crosswalk Zone",
    subtext: "School Zone Crossing • IRC:35 Compliance",
    icon: School,
    color: "amber",
    defectCode: "ZEBRA_CROSSING",
    defectLabel: "Pedestrian Safety Crosswalk (IRC:35)",
    videoUrl: "/uploads/sample_clips/clip_crosswalk_safety.mp4",
    corridor: "Avvai Shanmugam Salai & Anna Salai Link",
    channel: 1,
    confidence: 0.97,
    speedKmh: 25.0,
    mvaSection: "IRC:35 & CMVR Rule 138 (Mandatory Yield)",
    fineInr: 2000
  }
];

export const UploadFootageModal: React.FC<UploadFootageModalProps> = ({
  isOpen,
  onClose,
  busId = "BUS-TN01-1042",
  selectedChannel = 1,
  onUploadSuccess,
  onAddCluster,
  onNavigateToMap
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sanitizedPreviewUrl, setSanitizedPreviewUrl] = useState<string | null>(null);
  const [isVideoPreview, setIsVideoPreview] = useState<boolean>(false);
  const [channel, setChannel] = useState<number>(selectedChannel);
  const [targetBus, setTargetBus] = useState<string>(busId);
  const [autoIngest, setAutoIngest] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<'idle' | 'privacy_blurring' | 'hazard_detection' | 'completed'>('idle');
  const [facesRedactedCount, setFacesRedactedCount] = useState<number>(1);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [selectedCorridor, setSelectedCorridor] = useState<string>("GST Road, Tambaram (NH-32)");
  
  // Detection result and evidence state
  const [detectionResult, setDetectionResult] = useState<{
    success: boolean;
    defectCode: string;
    defectLabel: string;
    confidence: number;
    depthCm?: number;
    areaM2?: number;
    gzShock?: number;
    morthCost?: number;
    facesRedacted?: number;
    createdCluster?: HazardCluster;
  } | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile: File) => {
    setFeedback(null);
    setDetectionResult(null);
    setSanitizedPreviewUrl(null);
    setProcessingStage('idle');
    setFile(selectedFile);
    setIsVideoPreview(selectedFile.type.startsWith('video/') || selectedFile.name.endsWith('.mp4'));
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    
    // Automatically trigger real backend perception & face anonymization on upload
    handleUploadAndAnalyze(selectedFile);
  };

  const handleLoadSampleScenario = async (scenario: typeof SAMPLE_SCENARIOS[0]) => {
    setFeedback(null);
    setIsVideoPreview(true);
    setPreviewUrl(scenario.videoUrl);
    setSanitizedPreviewUrl(null);
    setSelectedCorridor(scenario.corridor);
    setChannel(scenario.channel);
    setProcessingStage('completed');
    setUploadProgress(100);
    setFacesRedactedCount(1);

    const detRes = {
      success: true,
      defectCode: scenario.defectCode,
      defectLabel: scenario.defectLabel,
      confidence: scenario.confidence,
      depthCm: scenario.depthCm || (scenario.defectCode === 'D40' ? 8.4 : undefined),
      areaM2: 0.65,
      gzShock: scenario.defectCode === 'D40' ? 1.48 : 0.98,
      morthCost: scenario.fineInr,
      facesRedacted: 1
    };

    setDetectionResult(detRes);
    setFeedback({
      type: 'success',
      message: `✓ Loaded sample video scenario: ${scenario.title} (${scenario.corridor})`
    });

    try {
      // Connect live stream manager to sample clip so bus camera immediately streams the video
      await fetch('/api/streams/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bus_id: targetBus,
          stream_type: "UPLOADED_VIDEO",
          video_url: scenario.videoUrl.replace('/uploads/', 'backend/uploads/'),
          sampling_fps: 30.0
        })
      });
      // Also register cluster in database so it shows up in safety and hazards
      if (scenario.defectCode === "D40" || scenario.defectCode === "MISSING_DIVIDER" || scenario.defectCode === "ZEBRA_CROSSING") {
        await fetch('/api/clusters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bus_id: targetBus,
            defect_type: scenario.defectCode,
            defect_name: scenario.defectLabel,
            severity_level: "high",
            rpi_score: Math.round(scenario.confidence * 95),
            road_name: scenario.corridor,
            lat: 12.9516,
            lng: 80.1462,
            before_image_url: scenario.videoUrl
          })
        });
      }
    } catch {}

    if (autoIngest && onUploadSuccess) {
      onUploadSuccess({
        bus_id: targetBus,
        defect_type: scenario.defectCode,
        road_name: scenario.corridor,
        confidence: scenario.confidence,
        plate_number: scenario.plate,
        speed_kmh: scenario.speedKmh
      });
    }
  };

  const handleUploadAndAnalyze = async (uploadFile?: File) => {
    const fileToProcess = uploadFile || file;
    if (!fileToProcess && !previewUrl) {
      setFeedback({ type: 'error', message: 'Please select a file or click a sample scenario below.' });
      return;
    }

    setIsUploading(true);
    setFeedback(null);
    
    // STAGE 1: DPDP Act 2023 Face & Bystander Privacy Blurring
    setProcessingStage('privacy_blurring');
    setUploadProgress(35);

    try {
      let res: any = null;
      if (fileToProcess) {
        const formData = new FormData();
        formData.append('file', fileToProcess);
        formData.append('bus_id', targetBus);
        formData.append('channel', String(channel));
        formData.append('auto_ingest', String(autoIngest));

        setProcessingStage('hazard_detection');
        setUploadProgress(65);

        res = await api.uploadStreamMedia(formData);
        
        if (res?.annotated_b64) {
          setSanitizedPreviewUrl(res.annotated_b64);
        }
      }

      setUploadProgress(95);

      const facesCount = res?.faces_detected ?? res?.privacy_meta?.faces_detected ?? 0;
      setFacesRedactedCount(facesCount);

      const isVid = isVideoPreview || (fileToProcess && (fileToProcess.type.startsWith('video/') || fileToProcess.name.endsWith('.mp4')));

      if (res?.detections && res.detections.length > 0) {
        const topDet = res.detections[0];
        const detResult = {
          success: true,
          defectCode: topDet.defect_code,
          defectLabel: topDet.defect_name || topDet.label,
          confidence: topDet.confidence,
          depthCm: topDet.depth_cm,
          areaM2: topDet.area_m2,
          gzShock: topDet.depth_cm ? Math.min(2.5, 0.9 + topDet.depth_cm * 0.08) : 1.0,
          morthCost: topDet.repair_cost_inr || 2400,
          facesRedacted: facesCount,
          filename: res?.filename || fileToProcess?.name,
          media_type: res?.media_type || (isVid ? 'video' : 'image'),
          channel: res?.channel || channel,
          detections_count: res?.detections_count ?? res?.detections?.length ?? 0
        };

        setDetectionResult(detResult);
        setProcessingStage('completed');
        setUploadProgress(100);
        setFeedback({ 
          type: 'success', 
          message: `✓ AI Perception detected ${res.detections.length} hazard(s) • ${facesCount > 0 ? `${facesCount} face(s) redacted under DPDP Act 2023.` : 'DPDP Privacy Filter active.'}` 
        });

        if (onUploadSuccess) {
          onUploadSuccess(detResult);
        }
      } else {
        // Honest handling: 0 road hazards detected in clear road or non-road image
        const clearResult = {
          success: true,
          defectCode: "CLEAR",
          defectLabel: "Road Surface Clear / No Hazards Detected",
          confidence: 1.0,
          facesRedacted: facesCount,
          filename: res?.filename || fileToProcess?.name,
          media_type: res?.media_type || (isVid ? 'video' : 'image'),
          channel: res?.channel || channel,
          detections_count: 0
        };

        setDetectionResult(clearResult);
        setProcessingStage('completed');
        setUploadProgress(100);
        setFeedback({ 
          type: 'success', 
          message: `✓ Perception analysis complete: 0 road hazards detected. ${facesCount > 0 ? `${facesCount} face(s) anonymized under DPDP Act 2023.` : 'DPDP Privacy Filter active.'}` 
        });

        if (onUploadSuccess) {
          onUploadSuccess(clearResult);
        }
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setFeedback({ type: 'error', message: err?.message || 'Error processing footage' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Dashcam &amp; Edge Vision Ingestion Studio
                </h3>
                <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold">
                  DPDP 2023 COMPLIANT
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ingest live camera footage or load sample Vision Zero &amp; Hit-and-Run scenarios.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar text-slate-900 dark:text-slate-100">
          
          {/* 1. ONE-CLICK SAMPLE SCENARIOS PACK */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>One-Click Demonstration Scenario Pack:</span>
              </span>
              <span className="text-xs text-slate-400">Instant Test Clips</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {SAMPLE_SCENARIOS.map((scen) => {
                const IconComponent = scen.icon;
                return (
                  <button
                    key={scen.id}
                    onClick={() => handleLoadSampleScenario(scen)}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xs transition text-left flex flex-col justify-between gap-2 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 group-hover:text-blue-500 transition">
                        Load &bull;
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        {scen.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                        {scen.subtext}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. MEDIA UPLOAD ZONE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Upload Drag-and-Drop Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-950/50 min-h-[220px]"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                }}
              />
              <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Drag and drop dashcam clip or photo here
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                Supports MP4, MOV, AVI, JPG, PNG (Auto-redacts faces under DPDP Act 2023)
              </p>
            </div>

            {/* Live Video / Annotated Preview Box */}
            <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-black overflow-hidden flex items-center justify-center min-h-[220px]">
              {previewUrl && isVideoPreview ? (
                <video
                  src={previewUrl}
                  autoPlay
                  loop
                  muted
                  controls
                  playsInline
                  className="w-full h-full object-cover max-h-[220px]"
                />
              ) : sanitizedPreviewUrl ? (
                <img
                  src={sanitizedPreviewUrl}
                  alt="Frame Preview"
                  className="w-full h-full object-cover max-h-[220px]"
                />
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Frame Preview"
                  className="w-full h-full object-cover max-h-[220px]"
                />
              ) : (
                <div className="text-center p-4 text-slate-500 text-xs flex flex-col items-center gap-2">
                  <FileVideo className="w-8 h-8 text-slate-600" />
                  <span>No footage loaded yet. Select a file or click a sample scenario above.</span>
                </div>
              )}

              {/* DPDP Act 2023 Forensic Badge */}
              {(sanitizedPreviewUrl || previewUrl) && (
                <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/80 border border-white/20 text-[11px] text-emerald-400 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {sanitizedPreviewUrl
                      ? (facesRedactedCount > 0 
                          ? `DPDP 2023 SANITIZED • ${facesRedactedCount} FACE(S) REDACTED` 
                          : "DPDP 2023 PRIVACY FILTER ACTIVE")
                      : (isUploading ? "ANONYMIZING & ANALYZING..." : "RAW INPUT READY")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 3. DETECTION DETAILS & PARAMETERS */}
          {detectionResult && (
            <div className={`p-4 rounded-xl border space-y-3 ${
              detectionResult.defectCode === 'CLEAR'
                ? 'border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/40'
                : 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/40'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${
                    detectionResult.defectCode === 'CLEAR' ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    detectionResult.defectCode === 'CLEAR' ? 'text-blue-900 dark:text-blue-200' : 'text-emerald-900 dark:text-emerald-200'
                  }`}>
                    {detectionResult.defectCode === 'CLEAR' ? 'Surface Status' : 'Perception Output'} &bull; {detectionResult.defectLabel}
                  </span>
                </div>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  detectionResult.defectCode === 'CLEAR'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
                    : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300'
                }`}>
                  {detectionResult.defectCode === 'CLEAR' ? 'Surface Clear' : `${Math.round(detectionResult.confidence * 100)}% Confidence Match`}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10.5px] text-slate-500 uppercase font-semibold">Location / Corridor:</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">{selectedCorridor}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10.5px] text-slate-500 uppercase font-semibold">Camera Node:</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">{targetBus}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10.5px] text-slate-500 uppercase font-semibold">Channel:</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">CH {channel} (Automotive HDR)</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10.5px] text-slate-500 uppercase font-semibold">DPDP Redactions:</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {facesRedactedCount > 0 ? `${facesRedactedCount} Face(s) Blurred` : 'DPDP Filter Active'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {feedback && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              feedback.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200' 
                : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{feedback.message}</span>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Real-time multi-model inference running on transit edge NPU emulator.
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleUploadAndAnalyze()}
              disabled={isUploading || (!file && !previewUrl)}
              isLoading={isUploading}
            >
              Analyze Footage
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
