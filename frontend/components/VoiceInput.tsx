'use client';

import { Mic } from 'lucide-react';
import { useState, useEffect } from 'react';
interface VoiceInputProps {
  onTranscript: (text: string) => void;
  language?: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
} 

export function VoiceInput({ onTranscript, language = 'en-US' }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
      setError('Speech recognition not supported in this browser');
    }
  }, []);

  const startListening = () => {
    if (!isSupported) return;

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(`Error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setIsListening(false);
    };

    recognition.start();
  };

  if (!isSupported) {
    return (
      <button
        disabled
        className="w-9 h-9 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center cursor-not-allowed"
        title="Speech recognition not supported in your browser"
      >
        🎤 Unsupported
      </button>
    );
  }

  return (
    <div className="relative">
      <button
  onClick={startListening}
  disabled={isListening}
  className={`
    w-9 h-9 rounded-xl flex items-center justify-center transition-all
    ${
      isListening
        ? 'bg-red-500 text-white scale-110'
        : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
    }
  `}
>
  {isListening ? (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
    </span>
  ) : (
    <Mic size={16} />
  )}
</button>
      
      {error && (
        <div className="absolute bottom-full left-0 mb-2 bg-red-100 text-red-700 text-[11px] rounded-lg px-2 py-1 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}