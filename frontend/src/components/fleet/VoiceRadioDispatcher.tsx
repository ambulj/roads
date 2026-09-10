import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Volume2, 
  VolumeX, 
  Mic, 
  Play, 
  AlertTriangle, 
  Activity,
  Send
} from 'lucide-react';
import { FleetNode } from '../../types';

interface VoiceRadioDispatcherProps {
  activeBus?: FleetNode;
  fleet?: FleetNode[];
}

interface DispatchMessage {
  id: string;
  timestamp: string;
  channel: string;
  sender: string;
  hazardType: string;
  textEn: string;
  textTa: string;
  audioDurationSec: number;
  priority: 'P0_EMERGENCY' | 'P1_WARNING' | 'P2_INFO';
}

const PRESET_DISPATCHES: DispatchMessage[] = [
  {
    id: 'disp-1',
    timestamp: '19:42:10 IST',
    channel: 'CH-1 (GCC Central Dispatch)',
    sender: 'GCC Control Center',
    hazardType: 'OPEN_MANHOLE',
    textEn: 'Attention all MTC drivers on Anna Salai. Open manhole void reported 120 meters ahead near Guindy Flyover. Reduce speed to 20 km/h.',
    textTa: 'அனைத்து ஓட்டுநர்களுக்கும் எச்சரிக்கை. கிண்டி மேம்பாலம் அருகில் 120 மீட்டர் தொலைவில் திறந்த மேன்ஹோல் உள்ளது. வாகன வேகத்தை 20 கிலோமீட்டராக குறைக்கவும்.',
    audioDurationSec: 6.2,
    priority: 'P0_EMERGENCY'
  },
  {
    id: 'disp-2',
    timestamp: '19:40:05 IST',
    channel: 'CH-4 (SWD Monsoon Emergency)',
    sender: 'GCC Flood Control Wing',
    hazardType: 'WATERLOGGING',
    textEn: 'Monsoon Alert for Route 118A: Waterlogging depth 32 centimeters at Gengu Reddy Subway. Divert via EVR Periyar High Road immediately.',
    textTa: 'பருவமழை எச்சரிக்கை: கெங்கு ரெட்டி சுரங்கப்பாதையில் 32 சென்டிமீட்டர் அளவுக்கு மழைநீர் தேங்கியுள்ளது. உடனடியாக மாற்றுப்பாதையில் செல்லவும்.',
    audioDurationSec: 7.5,
    priority: 'P0_EMERGENCY'
  },
  {
    id: 'disp-3',
    timestamp: '19:35:18 IST',
    channel: 'CH-2 (Highways PWD Ops)',
    sender: 'PWD Corridor Engineer',
    hazardType: 'POTHOLE_D40',
    textEn: 'Notice to GST Road corridor: D40 deep cavity in middle lane near Tambaram. Caution during lane change.',
    textTa: 'தாம்பரம் ஜிஎஸ்டி சாலையில் நடுவழியில் ஆழமான குழி உள்ளது. பாதை மாறும்போது கவனமாக இயக்கவும்.',
    audioDurationSec: 5.8,
    priority: 'P1_WARNING'
  },
  {
    id: 'disp-4',
    timestamp: '19:28:44 IST',
    channel: 'CH-3 (GCTP Traffic Safety)',
    sender: 'Traffic Control Room',
    hazardType: 'CLEARANCE',
    textEn: 'All clear on Mount-Poonamallee corridor: Footpath encroachment cleared. Normal bus headway resumed.',
    textTa: 'மவுண்ட்-பூந்தமல்லி சாலையில் ஆக்கிரமிப்புகள் அகற்றப்பட்டது. பேருந்துகள் வழக்கம்போல் இயங்கலாம்.',
    audioDurationSec: 4.9,
    priority: 'P2_INFO'
  }
];

export const VoiceRadioDispatcher: React.FC<VoiceRadioDispatcherProps> = () => {
  const [selectedLang, setSelectedLang] = useState<'ta' | 'en'>('ta');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeDispatchId, setActiveDispatchId] = useState<string | null>(null);
  const [isPushToTalk, setIsPushToTalk] = useState<boolean>(false);
  const [customDispatchText, setCustomDispatchText] = useState<string>('');
  const [customChannel, setCustomChannel] = useState<string>('CH-1 (GCC Central)');
  const [audioSquelchMuted, setAudioSquelchMuted] = useState<boolean>(false);
  const [history, setHistory] = useState<DispatchMessage[]>(PRESET_DISPATCHES);

  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const playVoiceDispatch = (item: DispatchMessage, langOverride?: 'ta' | 'en') => {
    const lang = langOverride || selectedLang;
    const textToSpeak = lang === 'ta' ? item.textTa : item.textEn;

    if (!synthRef.current) {
      console.warn('SpeechSynthesis not supported on this browser.');
      return;
    }

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = lang === 'ta' ? 0.92 : 0.98;
    utterance.pitch = 1.05;
    utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';

    const voices = synthRef.current.getVoices();
    const matchedVoice = voices.find(v => v.lang.startsWith(lang === 'ta' ? 'ta' : 'en'));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    setIsPlaying(true);
    setActiveDispatchId(item.id);

    utterance.onend = () => {
      setIsPlaying(false);
      setActiveDispatchId(null);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setActiveDispatchId(null);
    };

    synthRef.current.speak(utterance);
  };

  const handleStopAudio = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    setActiveDispatchId(null);
  };

  const handleBroadcastCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDispatchText.trim()) return;

    const newDispatch: DispatchMessage = {
      id: `disp-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST',
      channel: customChannel,
      sender: 'Dispatcher Terminal (HQ)',
      hazardType: 'MANUAL_DISPATCH',
      textEn: customDispatchText,
      textTa: customDispatchText,
      audioDurationSec: 4.5,
      priority: 'P1_WARNING'
    };

    setHistory([newDispatch, ...history]);
    setCustomDispatchText('');
    playVoiceDispatch(newDispatch, selectedLang);
  };

  return (
    <div className="bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                MTC In-Cabin AI Voice Radio Dispatcher
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-mono text-[10.5px] font-bold">
                800 MHz DMR
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live text-to-speech radio transceiver broadcasting real-time road hazard alerts to transit bus drivers and highway crews.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setSelectedLang('ta')}
              className={`px-2.5 py-1 rounded-lg transition font-bold ${
                selectedLang === 'ta'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              தமிழ் (Tamil)
            </button>
            <button
              onClick={() => setSelectedLang('en')}
              className={`px-2.5 py-1 rounded-lg transition font-bold ${
                selectedLang === 'en'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              English (Indian)
            </button>
          </div>

          <button
            onClick={() => setAudioSquelchMuted(p => !p)}
            title={audioSquelchMuted ? 'Unmute Radio Squelch' : 'Mute Radio Squelch'}
            className={`p-2 rounded-xl border transition ${
              audioSquelchMuted 
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-600'
                : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {audioSquelchMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
            <span className="uppercase tracking-wider">Tactical Geo-Fence Broadcast Queue:</span>
            <span>{history.length} Radio Channels Active</span>
          </div>

          <div className="space-y-2.5 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
            {history.map((disp) => {
              const isThisPlaying = isPlaying && activeDispatchId === disp.id;
              const isP0 = disp.priority === 'P0_EMERGENCY';

              return (
                <div
                  key={disp.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isThisPlaying
                      ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-400 dark:border-blue-600 shadow-md ring-2 ring-blue-500/20'
                      : isP0
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                      : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        isP0 
                          ? 'bg-rose-600 text-white' 
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      }`}>
                        {disp.channel}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 font-sans">
                        {disp.sender}
                      </span>
                    </div>
                    <span className="font-mono text-[10.5px] text-slate-400">
                      {disp.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 dark:text-slate-200 mt-2 font-medium leading-relaxed">
                    {selectedLang === 'ta' ? disp.textTa : disp.textEn}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      <Activity className={`w-3.5 h-3.5 ${isThisPlaying ? 'text-blue-500 animate-spin' : 'text-slate-400'}`} />
                      <span>{disp.audioDurationSec}s Audio Stream</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isThisPlaying ? (
                        <button
                          onClick={handleStopAudio}
                          className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
                        >
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>STOP RADIO</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => playVoiceDispatch(disp)}
                          className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>TRANSMIT AUDIO</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 flex flex-col justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-rose-500" />
                <span>PTT DISPATCH MIC</span>
              </span>
              <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">
                800 MHz ENCRYPTED
              </span>
            </div>

            <button
              onMouseDown={() => setIsPushToTalk(true)}
              onMouseUp={() => setIsPushToTalk(false)}
              onTouchStart={() => setIsPushToTalk(true)}
              onTouchEnd={() => setIsPushToTalk(false)}
              className={`w-full py-4 rounded-2xl font-bold font-mono text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 ${
                isPushToTalk 
                  ? 'bg-rose-600 text-white ring-4 ring-rose-500/30 animate-pulse'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
              }`}
            >
              <Mic className={`w-5 h-5 ${isPushToTalk ? 'text-white' : 'text-rose-500'}`} />
              <span>{isPushToTalk ? 'TRANSMITTING LIVE (HOLD)...' : 'HOLD TO TALK (PTT)'}</span>
              <span className="text-[9.5px] font-normal opacity-75">
                {isPushToTalk ? 'Broadcasting across all fleet nodes' : 'Simulates walkie-talkie mic'}
              </span>
            </button>
          </div>

          <form onSubmit={handleBroadcastCustom} className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
              Send Live Radio Text:
            </label>
            <input
              type="text"
              value={customDispatchText}
              onChange={(e) => setCustomDispatchText(e.target.value)}
              placeholder="e.g., Waterlogging 20cm ahead near Anna Flyover..."
              className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 font-sans"
            />
            <div className="flex items-center justify-between gap-2">
              <select
                value={customChannel}
                onChange={(e) => setCustomChannel(e.target.value)}
                className="text-[11px] font-mono px-2 py-1 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="CH-1 (GCC Central)">CH-1 Central</option>
                <option value="CH-2 (PWD Highways)">CH-2 Highways</option>
                <option value="CH-3 (Traffic Police)">CH-3 Police</option>
                <option value="CH-4 (Monsoon Emergency)">CH-4 Monsoon</option>
              </select>

              <button
                type="submit"
                disabled={!customDispatchText.trim()}
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1 transition shadow-xs"
              >
                <Send className="w-3 h-3" />
                <span>Broadcast</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
