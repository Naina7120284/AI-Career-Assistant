'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Volume2, Bot, Square, Mic } from 'lucide-react';
import { wsBaseUrl } from '@/lib/api';

export function AdvancedVoiceChat({ onBack }: { onBack: () => void }) {
  const [isListening, setIsListening]     = useState(false);
  const [isSpeaking, setIsSpeaking]       = useState(false);
  const [isProcessing, setIsProcessing]   = useState(false);
  const [status, setStatus]               = useState('Connecting...');
  const [voiceType, setVoiceType]         = useState<'male' | 'female'>('female');
  const [sessionActive, setSessionActive] = useState(false);

  const wsRef             = useRef<WebSocket | null>(null);
  const currentAudioRef   = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
  const audioChunksRef    = useRef<Blob[]>([]);
  const silenceTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);

  const monitorStreamRef   = useRef<MediaStream | null>(null);
  const monitorAnalyserRef = useRef<AnalyserNode | null>(null);
  const monitorContextRef  = useRef<AudioContext | null>(null);
  const monitorActiveRef   = useRef(false);

  const isSpeakingRef    = useRef(false);
  const isListeningRef   = useRef(false);
  const isProcessingRef  = useRef(false);
  const voiceTypeRef     = useRef<'male' | 'female'>('female');
  const interruptedRef   = useRef(false);
  const hasSpokeRef      = useRef(false);
  const sessionActiveRef = useRef(false);

  useEffect(() => { isSpeakingRef.current    = isSpeaking;    }, [isSpeaking]);
  useEffect(() => { isListeningRef.current   = isListening;   }, [isListening]);
  useEffect(() => { isProcessingRef.current  = isProcessing;  }, [isProcessing]);
  useEffect(() => { voiceTypeRef.current     = voiceType;     }, [voiceType]);
  useEffect(() => { sessionActiveRef.current = sessionActive; }, [sessionActive]);

  // ── WebSocket ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const ws = new WebSocket(`${wsBaseUrl()}/voice/ws/conversation`);
    wsRef.current = ws;
    ws.onopen  = () => { console.log('✅ WS Connected'); setStatus('Ready'); };
    ws.onclose = () => console.log('❌ WS Closed');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'audio_chunk') {
        if (interruptedRef.current) return;
        isSpeakingRef.current   = true;
        isProcessingRef.current = false;
        setIsSpeaking(true);
        setIsProcessing(false);
        setStatus('AI Speaking');
        if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current.src = ''; }
        const audio = new Audio(`data:audio/mp3;base64,${data.data}`);
        currentAudioRef.current = audio;
        audio.play().catch(() => { isSpeakingRef.current = false; setIsSpeaking(false); });
        audio.onended = () => {
          if (interruptedRef.current) return;
          isSpeakingRef.current = isProcessingRef.current = false;
          setIsSpeaking(false); setIsProcessing(false); setStatus('Listening...');
        };
      }
      if (data.type === 'response_end' && !isSpeakingRef.current && !interruptedRef.current) {
        isProcessingRef.current = false; setIsProcessing(false); setStatus('Listening...');
      }
      if (data.type === 'interrupt_ack') stopAllAudio();
      if (data.type === 'error' || data.type === 'tts_error') {
        isSpeakingRef.current = isProcessingRef.current = isListeningRef.current = false;
        setIsSpeaking(false); setIsProcessing(false); setIsListening(false); setStatus('Listening...');
      }
    };

    return () => {
      monitorActiveRef.current = false;
      monitorStreamRef.current?.getTracks().forEach(t => t.stop());
      try { monitorContextRef.current?.close(); } catch (_) {}
      ws.close();
    };
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function stopAllAudio() {
    if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current.src = ''; currentAudioRef.current = null; }
    isSpeakingRef.current = isProcessingRef.current = false;
    setIsSpeaking(false); setIsProcessing(false);
  }

  function sendAudioToBackend(blob: Blob): Promise<void> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'audio', data: base64, voice: voiceTypeRef.current }));
        }
        resolve();
      };
      reader.readAsDataURL(blob);
    });
  }

  // ── Recording ─────────────────────────────────────────────────────────────
  async function startRecording() {
    if (mediaRecorderRef.current?.state === 'recording' || isListeningRef.current) return;
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current   = [];
      hasSpokeRef.current      = false;
      interruptedRef.current   = false;

      const SPEECH_THRESH = 22, SILENCE_DUR = 1800, MAX_DUR = 15000;
      maxTimerRef.current = setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, MAX_DUR);

      function silenceLoop() {
        if (recorder.state !== 'recording') return;
        const an = monitorAnalyserRef.current;
        if (!an) return;
        const d = new Uint8Array(an.frequencyBinCount);
        an.getByteFrequencyData(d);
        const vol = d.reduce((a, b) => a + b) / d.length;
        if (vol > SPEECH_THRESH) {
          hasSpokeRef.current = true;
          if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
        } else if (hasSpokeRef.current && !silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, SILENCE_DUR);
        }
        requestAnimationFrame(silenceLoop);
      }

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        if (maxTimerRef.current)    { clearTimeout(maxTimerRef.current);    maxTimerRef.current    = null; }
        if (silenceTimerRef.current){ clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
        isListeningRef.current = false; setIsListening(false);
        stream.getTracks().forEach(t => t.stop());
        if (interruptedRef.current || !hasSpokeRef.current) return;
        isProcessingRef.current = true; setIsProcessing(true); setStatus('Thinking...');
        await sendAudioToBackend(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
      };

      recorder.start();
      isListeningRef.current = true; interruptedRef.current = false;
      setIsListening(true); setStatus('Listening...');
      silenceLoop();
    } catch (err) { console.error('Record error:', err); }
  }

  // ── Monitor ───────────────────────────────────────────────────────────────
 function runMonitor() {
  let lastTrigger = 0  // debounce guard

  function tick() {
    if (!monitorActiveRef.current) return
    const an = monitorAnalyserRef.current
    if (!an) return

    const d = new Uint8Array(an.frequencyBinCount)
    an.getByteFrequencyData(d)
    const vol = d.reduce((a, b) => a + b) / d.length
    const now = Date.now()

    // Interrupt AI while speaking
    if (isSpeakingRef.current && vol > 38) {
      doInterrupt()
      return
    }

    // Start recording only when truly idle + debounced
    if (
      !isSpeakingRef.current &&
      !isProcessingRef.current &&
      !isListeningRef.current &&
      vol > 22 &&
      now - lastTrigger > 2000  // ← 2s debounce prevents double-trigger
    ) {
      lastTrigger = now
      startRecording()
    }

    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}
  // ── Interrupt ─────────────────────────────────────────────────────────────
  function doInterrupt() {
    interruptedRef.current = true;
    stopAllAudio();
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: 'interrupt' }));
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    if (maxTimerRef.current)     { clearTimeout(maxTimerRef.current);     maxTimerRef.current     = null; }
    isListeningRef.current = isProcessingRef.current = isSpeakingRef.current = false;
    setIsListening(false); setIsProcessing(false); setIsSpeaking(false); setStatus('Listening...');
    monitorActiveRef.current = true;
    runMonitor();
  }

  // ── Session ───────────────────────────────────────────────────────────────
  async function startConversation() {
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
      monitorStreamRef.current  = stream;
      const ctx      = new AudioContext();
      monitorContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      monitorAnalyserRef.current = analyser;
      monitorActiveRef.current   = true;
      setSessionActive(true); sessionActiveRef.current = true;
      setStatus('Listening...');
      runMonitor();
    } catch (err) { console.error('Mic error:', err); setStatus('Mic access denied'); }
  }

  function endSession() {
    monitorActiveRef.current = sessionActiveRef.current = false;
    doInterrupt();
    monitorStreamRef.current?.getTracks().forEach(t => t.stop());
    try { monitorContextRef.current?.close(); } catch (_) {}
    monitorStreamRef.current = monitorContextRef.current = monitorAnalyserRef.current = null;
    setSessionActive(false);
    onBack();
  }

  function handleVoiceSwitch(type: 'male' | 'female') { setVoiceType(type); voiceTypeRef.current = type; }

  const orb = isListening ? 'listening' : isSpeaking ? 'speaking' : isProcessing ? 'processing' : 'idle';

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        /* ✅ KEY FIX: relative + w-full + h-full so it fits inside parent container */
        .avc-root {
          position: relative;
          width: 100%; height: 100%;
          display: flex; flex-direction: column;
          background: #080C14;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          border-radius: 24px;
          overflow: hidden;
        }
        .avc-root::before {
          content: ''; position: absolute; inset: 0; border-radius: 32px;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 0;
        }
        .avc-ambient { position: absolute; inset: 0; pointer-events: none; z-index: 0; transition: all 1s ease; border-radius: 32px; }
        .avc-ambient-listening  { background: radial-gradient(ellipse 60% 50% at 50% 100%, rgba(52,211,153,0.15) 0%, transparent 70%); }
        .avc-ambient-speaking   { background: radial-gradient(ellipse 60% 50% at 50% 100%, rgba(99,102,241,0.20) 0%, transparent 70%); }
        .avc-ambient-processing { background: radial-gradient(ellipse 60% 50% at 50% 100%, rgba(251,191,36,0.12) 0%, transparent 70%); }
        .avc-ambient-idle       { background: radial-gradient(ellipse 40% 30% at 50% 100%, rgba(99,102,241,0.07) 0%, transparent 70%); }

        .avc-header {
          position: relative; z-index: 10;
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .avc-back-btn {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 11px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.5); cursor: pointer; transition: all 0.2s;
        }
        .avc-back-btn:hover { background: rgba(255,255,255,0.10); color: white; }
        .avc-status-pill {
          display: flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 100px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
        }
        .avc-status-dot { width: 6px; height: 6px; border-radius: 50%; transition: background 0.4s; }
        .avc-status-dot-idle       { background: rgba(255,255,255,0.2); }
        .avc-status-dot-listening  { background: #34d399; animation: avc-pulse 1.5s infinite; }
        .avc-status-dot-speaking   { background: #818cf8; animation: avc-pulse 1.2s infinite; }
        .avc-status-dot-processing { background: #fbbf24; animation: avc-pulse 0.8s infinite; }
        .avc-status-text { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.4); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
        @keyframes avc-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }

        .avc-body {
          position: relative; z-index: 10; flex: 1; min-height: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 0 24px; gap: 0;
        }

        /* Orb */
        .avc-orb-wrap { position: relative; width: 110px; height: 110px; margin-bottom: 20px; flex-shrink: 0; }
        .avc-orb-ring { position: absolute; inset: -14px; border-radius: 50%; border: 1px solid transparent; transition: all 0.6s ease; }
        .avc-orb-ring-listening  { border-color: rgba(52,211,153,0.28); animation: avc-spin 4s linear infinite; }
        .avc-orb-ring-speaking   { border-color: rgba(99,102,241,0.28); animation: avc-spin 3s linear infinite reverse; }
        .avc-orb-ring-processing { border-color: rgba(251,191,36,0.22); animation: avc-spin 2s linear infinite; }
        .avc-orb-ring-idle       { border-color: transparent; }
        @keyframes avc-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        .avc-orb {
          width: 110px; height: 110px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.5s ease; overflow: hidden;
        }
        .avc-orb-idle       { background: rgba(255,255,255,0.03); border: 1.5px solid rgba(255,255,255,0.08); }
        .avc-orb-listening  { background: rgba(52,211,153,0.07); border: 1.5px solid rgba(52,211,153,0.32); box-shadow: 0 0 40px rgba(52,211,153,0.14), inset 0 0 24px rgba(52,211,153,0.06); }
        .avc-orb-speaking   { background: rgba(99,102,241,0.09); border: 1.5px solid rgba(99,102,241,0.38); box-shadow: 0 0 50px rgba(99,102,241,0.20), inset 0 0 28px rgba(99,102,241,0.07); animation: avc-breathe 2s ease-in-out infinite; }
        .avc-orb-processing { background: rgba(251,191,36,0.05); border: 1.5px solid rgba(251,191,36,0.22); }
        @keyframes avc-breathe {
          0%,100%{transform:scale(1);   box-shadow:0 0 50px rgba(99,102,241,0.20),inset 0 0 28px rgba(99,102,241,0.07)}
          50%    {transform:scale(1.04);box-shadow:0 0 70px rgba(99,102,241,0.30),inset 0 0 38px rgba(99,102,241,0.10)}
        }

        .avc-bars { display:flex; gap:5px; align-items:flex-end; height:38px; }
        .avc-bar  { width:4px; border-radius:2px; background:#34d399; }
        .avc-bar:nth-child(1){animation:avc-bar .8s ease-in-out infinite .00s}
        .avc-bar:nth-child(2){animation:avc-bar .8s ease-in-out infinite .15s}
        .avc-bar:nth-child(3){animation:avc-bar .8s ease-in-out infinite .30s}
        .avc-bar:nth-child(4){animation:avc-bar .8s ease-in-out infinite .15s}
        .avc-bar:nth-child(5){animation:avc-bar .8s ease-in-out infinite .00s}
        @keyframes avc-bar { 0%,100%{height:5px;opacity:.5} 50%{height:34px;opacity:1} }

        .avc-dots { display:flex; gap:8px; align-items:center; }
        .avc-dot  { width:8px; height:8px; border-radius:50%; background:#fbbf24; animation:avc-dot-b 1.2s ease-in-out infinite; }
        .avc-dot:nth-child(2){animation-delay:.2s} .avc-dot:nth-child(3){animation-delay:.4s}
        @keyframes avc-dot-b { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} }

        .avc-headline { font-size:20px; font-weight:500; color:rgba(255,255,255,.92); letter-spacing:-.02em; text-align:center; margin-bottom:8px; }
        .avc-subline  { font-size:12px; color:rgba(255,255,255,.25); text-align:center; min-height:18px; }

        /* Voice toggle */
        .avc-voice-toggle { display:flex; margin-top:18px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); border-radius:13px; padding:4px; }
        .avc-voice-btn { padding:6px 14px; border-radius:9px; font-size:12px; font-weight:500; cursor:pointer; transition:all .2s; color:rgba(255,255,255,.35); border:none; background:transparent; }
        .avc-voice-btn:hover { color:rgba(255,255,255,.6); }
        .avc-voice-btn-female-active { background:linear-gradient(135deg,#ec4899,#be185d); color:white; box-shadow:0 2px 12px rgba(236,72,153,.35); }
        .avc-voice-btn-male-active   { background:linear-gradient(135deg,#6366f1,#4338ca); color:white; box-shadow:0 2px 12px rgba(99,102,241,.35); }

        /* Footer */
        .avc-footer { position:relative; z-index:10; padding:16px 24px 22px; display:flex; justify-content:center; flex-shrink:0; }
        .avc-start-btn {
          display:flex; align-items:center; gap:10px;
          padding:11px 28px; border-radius:100px;
          background:linear-gradient(135deg,#6366f1,#8b5cf6); color:white;
          font-size:13px; font-weight:600; cursor:pointer; border:none;
          transition:all .2s;
          box-shadow:0 4px 24px rgba(99,102,241,.35), 0 1px 0 rgba(255,255,255,.1) inset;
        }
        .avc-start-btn:hover { transform:translateY(-1px); box-shadow:0 8px 32px rgba(99,102,241,.45), 0 1px 0 rgba(255,255,255,.1) inset; }
        .avc-end-btn {
          display:flex; align-items:center; gap:8px;
          padding:10px 22px; border-radius:100px;
          background:rgba(239,68,68,.08); border:1px solid rgba(239,68,68,.2);
          color:rgba(239,68,68,.75); font-size:13px; font-weight:500;
          cursor:pointer; transition:all .2s;
        }
        .avc-end-btn:hover { background:rgba(239,68,68,.14); border-color:rgba(239,68,68,.35); color:#ef4444; }
      `}</style>

      <div className="avc-root">
        <div className={`avc-ambient avc-ambient-${orb}`} />

        {/* Header */}
        <div className="avc-header">
          <button className="avc-back-btn" onClick={onBack}><ArrowLeft size={17} /></button>
          <div className="avc-status-pill">
            <div className={`avc-status-dot avc-status-dot-${orb}`} />
            <span className="avc-status-text">{status}</span>
          </div>
          <div style={{ width: 38 }} />
        </div>

        {/* Body */}
        <div className="avc-body">
          <div className="avc-orb-wrap">
            <div className={`avc-orb-ring avc-orb-ring-${orb}`} />
            <div className={`avc-orb avc-orb-${orb}`}>
              {isListening ? (
                <div className="avc-bars">{[1,2,3,4,5].map(i=><div key={i} className="avc-bar"/>)}</div>
              ) : isSpeaking ? (
                <Volume2 size={30} color="rgba(165,180,252,0.9)" strokeWidth={1.5} />
              ) : isProcessing ? (
                <div className="avc-dots"><div className="avc-dot"/><div className="avc-dot"/><div className="avc-dot"/></div>
              ) : (
                <Bot size={30} color="rgba(255,255,255,0.15)" strokeWidth={1.5} />
              )}
            </div>
          </div>

          <div className="avc-headline">
            {isListening ? "I'm listening…" : isSpeaking ? 'Alex is speaking' : isProcessing ? 'Thinking…' : 'Hey!'}
          </div>
          <div className="avc-subline">
            {isSpeaking   ? 'Speak over me anytime to interrupt'  :
             isListening  ? "Take your time, I'll wait for you"   :
             isProcessing ? 'Processing your message…'            :
             sessionActive ? 'Ready — just start speaking'        : ''}
          </div>

          <div className="avc-voice-toggle">
            <button className={`avc-voice-btn ${voiceType==='female'?'avc-voice-btn-female-active':''}`} onClick={()=>handleVoiceSwitch('female')}>♀ Female</button>
            <button className={`avc-voice-btn ${voiceType==='male'  ?'avc-voice-btn-male-active':''}`}   onClick={()=>handleVoiceSwitch('male')}>♂ Male</button>
          </div>
        </div>

        {/* Footer */}
        <div className="avc-footer">
          {!sessionActive ? (
            <button className="avc-start-btn" onClick={startConversation}>
              <Mic size={17} /> Start Conversation
            </button>
          ) : (
            <button className="avc-end-btn" onClick={endSession}>
              <Square size={13} fill="currentColor" /> End Session
            </button>
          )}
        </div>
      </div>
    </>
  );
}
