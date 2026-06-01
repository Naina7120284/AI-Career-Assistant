'use client';

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
        className="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed"
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
          px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2
          ${isListening 
            ? 'bg-red-500 text-white animate-pulse' 
            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90'
          }
        `}
      >
        {isListening ? (
          <>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            Listening...
          </>
        ) : (
          <>
            🎤 Voice
          </>
        )}
      </button>
      
      {error && (
        <div className="absolute bottom-full left-0 mb-2 bg-red-100 text-red-700 text-xs rounded px-2 py-1 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}