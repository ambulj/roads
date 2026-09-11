import React, { useState, useRef } from 'react';
import {
  X, UploadCloud, FileVideo, Image as ImageIcon, AlertCircle,
  CheckCircle2, RefreshCw, Zap, ShieldCheck, Play, ArrowRight,
  Sliders, Trash2, Cpu
} from 'lucide-react';
import { api } from '../../services/api';

interface UploadFootageModalProps {
  isOpen: boolean;
  onClose: () => void;
  busId: string;
  selectedChannel?: number;
  onUploadSuccess?: (result: any) => void;
}

export const UploadFootageModal: React.FC<UploadFootageModalProps> = ({
  isOpen,
  onClose,
  busId,
  selectedChannel = 1,
  onUploadSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [channel, setChannel] = useState<number>(selectedChannel);
  const [autoIngest, setAutoIngest] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; details?: any } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const isVideo = file?.type.startsWith('video/') || /\.(mp4|mov|avi|webm|mkv)$/i.test(file?.name || '');
  const isImage = file?.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|bmp)$/i.test(file?.name || '');

  const handleFileSelect = (selectedFile: File) => {
    setFeedback(null);
    setFile(selectedFile);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) {
      setFeedback({ type: 'error', message: 'Please select a video or image file to upload.' });
      return;
    }

    setIsUploading(true);
    setFeedback(null);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bus_id', busId);
    formData.append('channel', String(channel));
    formData.append('auto_ingest', String(autoIngest));

    try {
      setUploadProgress(50);
      const res = await api.uploadStreamMedia(formData);
      setUploadProgress(100);

      if (res && res.success) {
        setFeedback({
          type: 'success',
          message: `Footage uploaded successfully! The system is now streaming '${res.filename}' on CH${channel} with real computer vision active.`,
          details: res
        });
        if (onUploadSuccess) {
          onUploadSuccess(res);
        }
      } else {
        setFeedback({
          type: 'error',
          message: res?.error || 'Upload failed. Please verify the file format and try again.'
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Network error occurred during upload.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetToRTSP = async () => {
    setIsUploading(true);
    try {
      const res = await api.resetStreamSource(busId, channel);
      if (res && res.success) {
        setFeedback({
          type: 'success',
          message: `Stream for ${busId} CH${channel} has been reverted to standard live RTSP / IP camera.`
        });
        setFile(null);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        if (onUploadSuccess) {
          onUploadSuccess({ reset: true, bus_id: busId, channel });
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Failed to reset stream source.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Upload Custom Road Footage</span>
                <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  REAL-FRAME CV
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Replace camera stream with your uploaded video or photo • Runs actual pixel analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Target Camera Channel Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                TARGET BUS NODE
              </label>
              <div className="px-3 py-2 bg-slate-950 rounded-lg border border-slate-800 text-cyan-400 font-mono text-xs font-bold flex items-center justify-between">
                <span>{busId}</span>
                <span className="text-[10px] text-slate-500">MTC Fleet Node</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                MDVR CAMERA CHANNEL
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 rounded-lg border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value={1}>CH 1 — Forward Windshield Road Cam (Distress Perception)</option>
                <option value={2}>CH 2 — Rear Overtake Radar (Tailgating Vehicles)</option>
                <option value={3}>CH 3 — Left Curbside Bus Lane (Encroachment)</option>
                <option value={4}>CH 4 — Driver Cabin DMS (Attention Telematics)</option>
              </select>
            </div>
          </div>

          {/* File Upload Dropzone */}
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
              ROAD FOOTAGE FILE (VIDEO OR PHOTO)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 rounded-xl p-8 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-950/70 group"
              >
                <div className="flex justify-center mb-3">
                  <div className="p-3 rounded-full bg-slate-800 group-hover:bg-cyan-500/20 text-slate-400 group-hover:text-cyan-400 transition-colors">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-200 mb-1">
                  Click to select or drag and drop road footage
                </div>
                <div className="text-xs text-slate-400 max-w-md mx-auto mb-3">
                  Upload a video (<span className="text-cyan-400 font-mono">.mp4, .mov, .avi, .webm</span>) or high-res photo (<span className="text-emerald-400 font-mono">.jpg, .png</span>)
                </div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-500 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/50">
                  <span>Videos loop indefinitely</span>
                  <span>•</span>
                  <span>Photos refreshed continuously</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {isVideo ? (
                      <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        <FileVideo className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div className="truncate">
                      <div className="text-xs font-semibold text-slate-200 truncate">{file.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • {isVideo ? 'Continuous Video Loop' : 'Static Frame Perception'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                        setPreviewUrl(null);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove selected file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Media Preview Box */}
                {previewUrl && (
                  <div className="relative w-full aspect-video max-h-48 bg-black rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
                    {isVideo ? (
                      <video
                        src={previewUrl}
                        controls
                        muted
                        autoPlay
                        loop
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Upload preview"
                        className="w-full h-full object-contain"
                      />
                    )}
                    <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 border border-slate-700">
                      PREVIEW
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Real AI Perception Notice */}
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-cyan-300">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Real Computer Vision Pixel Analysis</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11.5px]">
              Unlike early prototype mockups that placed static boxes at fixed coordinates, our active CV engine performs real OpenCV contour segmentation on your uploaded frames:
              measuring true pixel cavity depth, dark depression contrast, crack edge density, and vehicle proximity.
            </p>
          </div>

          {/* Auto Ingest Checkbox */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              id="auto-ingest-toggle"
              type="checkbox"
              checked={autoIngest}
              onChange={(e) => setAutoIngest(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
            />
            <label htmlFor="auto-ingest-toggle" className="text-xs text-slate-300 cursor-pointer select-none">
              Automatically register newly detected potholes into RoadSaarthi Work Orders & Incidents ledger
            </label>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/60 border border-rose-500/40 text-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-semibold">{feedback.message}</div>
                {feedback.details?.detections_count !== undefined && (
                  <div className="font-mono text-[11px] text-emerald-300">
                    Defects Found: {feedback.details.detections_count} • Auto-Ingested: {feedback.details.ingested_count}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>Processing footage & launching stream worker...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={handleResetToRTSP}
            disabled={isUploading}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors disabled:opacity-50"
            title="Revert camera stream to default RTSP feed"
          >
            Reset to Live RTSP
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 transition-colors disabled:opacity-50"
            >
              Close
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="px-5 py-2 rounded-lg text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Activating...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Stream This Footage Only</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
