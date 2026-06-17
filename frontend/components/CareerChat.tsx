'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Send, Mic, Plus, RotateCcw, Search, Brain,
  Image as ImageIcon, AudioLines, FileText, X
} from 'lucide-react';
import { AdvancedVoiceChat } from './AdvancedVoiceChat';
import { apiUrl } from '@/lib/api';
import { useUser } from '@/hooks/useUser';
 
interface Message {
  id: number;
  text?: string;
  sender: 'user' | 'ai';
  fileName?: string;
  imageUrl?: string;
  type?: 'text' | 'file' | 'image';
}
 
// ── Simple Markdown Renderer (no library needed) ──────────────────────────────
function MarkdownText({ text, isUser }: { text: string; isUser: boolean }) {
  const lines = text.split('\n');
 
const renderInline = (line: string, key: number) => {

  // Match markdown links + raw URLs + bold + code
  const regex =
    /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(https?:\/\/[^\s]+)|(\*\*[^*]+\*\*)|(`[^`]+`)/g;

  const elements: React.ReactNode[] = [];

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(line)) !== null) {

    // Normal text before match
    if (match.index > lastIndex) {
      elements.push(line.slice(lastIndex, match.index));
    }

    // Markdown link [text](url)
    if (match[1]) {

      const text = match[2];
      const url = match[3];

      elements.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline break-all hover:text-blue-700"
        >
          {text}
        </a>
      );
    }

    // Raw URL
    else if (match[4]) {

      const url = match[4];

      elements.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline break-all hover:text-blue-700"
        >
          {url}
        </a>
      );
    }

    // Bold text
    else if (match[5]) {

      const boldText = match[5].slice(2, -2);

      elements.push(
        <strong key={match.index} className="font-semibold">
          {boldText}
        </strong>
      );
    }

    // Code block
    else if (match[6]) {

      const codeText = match[6].slice(1, -1);

      elements.push(
        <code
          key={match.index}
          className="bg-black/10 rounded px-1 py-0.5 text-xs font-mono"
        >
          {codeText}
        </code>
      );
    }

    lastIndex = regex.lastIndex;
  }

  // Remaining text
  if (lastIndex < line.length) {
    elements.push(line.slice(lastIndex));
  }

  return <span key={key}>{elements}</span>;
};
 
  const elements: React.ReactNode[] = [];
  let i = 0;
 
  while (i < lines.length) {
    const line = lines[i];
 
    if (line.trim() === '') { i++; continue; }
 
    // Bullet list
    if (/^[-*•]\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^[-*•]\s/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc pl-5 my-1 space-y-0.5">
          {listItems.map((item, j) => (
            <li key={j} className="leading-relaxed">{renderInline(item, j)}</li>
          ))}
        </ul>
      );
      continue;
    }
 
    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal pl-5 my-1 space-y-0.5">
          {listItems.map((item, j) => (
            <li key={j} className="leading-relaxed">{renderInline(item, j)}</li>
          ))}
        </ol>
      );
      continue;
    }
 
    // Headings
    if (/^#{1,3}\s/.test(line)) {
      const content = line.replace(/^#{1,3}\s/, '');
      elements.push(
        <p key={`h-${i}`} className="font-semibold mt-2 mb-0.5">
          {renderInline(content, i)}
        </p>
      );
      i++;
      continue;
    }
 
    // Normal line
    elements.push(
      <p key={`p-${i}`} className="mb-1 last:mb-0 leading-relaxed">
        {renderInline(line, i)}
      </p>
    );
    i++;
  }
 
  return (
    <div className={`text-sm ${isUser ? 'text-white' : 'text-slate-800'}`}>
      {elements}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
 
export default function CareerChat() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const userId = user?.id ?? 'user?.id';
  const interviewRole =
    (searchParams.get('interview_role') || '').trim() || null;

  const [messages, setMessages]         = useState<Message[]>([]);
  const [inputText, setInputText]       = useState('');
  const [isDictating, setIsDictating]   = useState(false);
  const [isConversing, setIsConversing] = useState(false);
  const [isTyping, setIsTyping]         = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ file: File; url: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const interviewIntroStarted = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const bootstrapInterviewIntro = useCallback(async () => {
    if (!interviewRole) return;
    setIsTyping(true);
    const controller = new AbortController();
    const abortTimer = setTimeout(() => controller.abort(), 25000);
    try {
      const res = await fetch(apiUrl('/api/v1/chat/ask'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message:
            'Start the mock interview now. Welcome the candidate briefly, then ask your first interview question (one question only).',
          user_id: userId,
          interview_role: interviewRole,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errText =
          typeof data?.response === 'string'
            ? data.response
            : `Request failed (${res.status}). Check NEXT_PUBLIC_API_URL and that the backend is running.`;
        setMessages((prev) => {
          if (prev.length > 0) return prev;
          return [
            {
              id: Date.now(),
              text: errText,
              sender: 'ai',
              type: 'text',
            },
          ];
        });
        return;
      }
      setMessages((prev) => {
        if (prev.length > 0) return prev;
        return [
          {
            id: Date.now(),
            text: data.response ?? 'Could not start interview.',
            sender: 'ai',
            type: 'text',
          },
        ];
      });
    } catch (e) {
      const aborted = e instanceof Error && e.name === 'AbortError';
      setMessages((prev) => {
        if (prev.length > 0) return prev;
        return [
          {
            id: Date.now(),
            text: aborted
              ? 'The AI backend did not respond in time. Check that it is running and that NEXT_PUBLIC_API_URL points to it, then tap reset (↻) to retry.'
              : 'Could not reach the AI backend. From the project root, run the API (for example: uvicorn on port 8000) and try again.',
            sender: 'ai',
            type: 'text',
          },
        ];
      });
    } finally {
      clearTimeout(abortTimer);
      setIsTyping(false);
    }
  }, [interviewRole, userId]);

  useEffect(() => {
    interviewIntroStarted.current = false;
  }, [interviewRole]);

  useEffect(() => {
    if (!interviewRole || interviewIntroStarted.current) return;
    interviewIntroStarted.current = true;
    void bootstrapInterviewIntro();
  }, [interviewRole, bootstrapInterviewIntro]);
 
  // ── dictation ──────────────────────────────────────────────────────────────
  const startDictation = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.onstart  = () => setIsDictating(true);
    r.onend    = () => setIsDictating(false);
    r.onresult = (e: any) => setInputText(e.results[0][0].transcript);
    r.start();
  };
 
  // ── helpers ────────────────────────────────────────────────────────────────
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = (reader.result as string).split(',')[1];
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
 
  // ── MAIN SEND ──────────────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!inputText.trim() && !pendingImage) return;
 
    const userMsg: Message = {
      id: Date.now(),
      text: inputText || undefined,
      sender: 'user',
      type: pendingImage ? 'image' : 'text',
      imageUrl: pendingImage?.url,
    };
    setMessages(prev => [...prev, userMsg]);
 
    const currentInput = inputText;
    const currentImage = pendingImage;
 
    setInputText('');
    setPendingImage(null);
    setIsTyping(true);
    setShowPlusMenu(false);
 
    try {
      if (currentImage) {
        const base64 = await fileToBase64(currentImage.file);
        const res = await fetch(apiUrl('/api/v1/image/analyze'), {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_base64: base64,
            mime_type:    currentImage.file.type,
           user_prompt:
            currentInput.trim()
               ? `Answer this question about the uploaded image: ${currentInput}`
               : 'Describe this image in detail.',
          }),
        });
        const data = await res.json();
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: data.response || 'Image analyzed.',
          sender: 'ai',
          type: 'text',
        }]);
      } else {
        const historyPayload = [
          ...messages
            .filter((m) => m.type === 'text' && m.text)
            .map((m) => ({
              role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
              content: m.text as string,
            })),
        ]
        if (currentInput.trim()) {
          historyPayload.push({ role: 'user' as const, content: currentInput })
        }
        const res = await fetch(apiUrl('/api/v1/chat/ask'), {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: currentInput,
            user_id: userId,
            conversation_history: historyPayload,
            ...(interviewRole ? { interview_role: interviewRole } : {}),
          }),
        });
        const data = await res.json();
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: data.response,
          sender: 'ai',
          type: 'text',
        }]);
      }
    } catch (err) {
      console.error('Send error:', err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: '❌ Could not connect to backend. Make sure it is running:\n\ncd backend\nuvicorn app.main:app --reload --port 8000',
        sender: 'ai',
        type: 'text',
      }]);
    } finally {
      setIsTyping(false);
    }
  };
 
  // ── file upload ────────────────────────────────────────────────────────────
  const handleFileUpload = async (file: File) => {
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', type: 'file', fileName: file.name }]);
    setShowPlusMenu(false);
    const formData = new FormData();
    formData.append('file', file);
    setIsTyping(true);
    try {
      const res  = await fetch(apiUrl('/api/v1/resume/upload'), { method: 'POST', body: formData });
      const data = await res.json();
      setMessages(prev => [...prev, {
        id: Date.now() + 1, sender: 'ai', type: 'text',
        text: data.message || 'Resume uploaded successfully.',
      }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };
 
  // ── image select ───────────────────────────────────────────────────────────
  const handleImageSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    setPendingImage({ file, url });
    setShowPlusMenu(false);
  };
 
  // ── web search ─────────────────────────────────────────────────────────────
  const handleWebSearch = async () => {
    const query = inputText.trim();
    if (!query) {
      alert('Type something in the input box first, then click Web Search.');
      return;
    }
    setInputText('');
    setShowPlusMenu(false);
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', type: 'text', text: `🌐 ${query}` }]);
    setIsTyping(true);
    try {
      const res  = await fetch(apiUrl('/api/v1/web-search'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', type: 'text', text: data.response }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };
 
  // ── voice mode ─────────────────────────────────────────────────────────────
  if (isConversing) {
    return <AdvancedVoiceChat onBack={() => setIsConversing(false)} />;
  }
 
  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden font-sans">
 
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
            <span className="font-bold text-slate-700 text-sm truncate">
              {interviewRole ? 'Mock interview' : 'AI Career Assistant'}
            </span>
          </div>
          {interviewRole && (
            <div className="flex items-center gap-2 pl-4">
              <span className="text-xs text-slate-500 truncate max-w-[200px] md:max-w-md">
                Role: {interviewRole}
              </span>
              <button
                type="button"
                onClick={() => router.push('/interview-prep')}
                className="text-xs font-medium text-indigo-600 hover:underline flex-shrink-0"
              >
                Back to Interview Prep
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            setMessages([]);
            setPendingImage(null);
            if (interviewRole) {
              interviewIntroStarted.current = false;
              void bootstrapInterviewIntro();
            }
          }}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-all"
        >
          <RotateCcw size={16} />
        </button>
      </div>
 
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && !interviewRole && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <Brain size={32} strokeWidth={1.5} />
            <p className="text-xs uppercase tracking-wider font-semibold">How can I help you today?</p>
          </div>
        )}
        {messages.length === 0 && interviewRole && isTyping && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <Brain size={32} strokeWidth={1.5} />
            <p className="text-xs uppercase tracking-wider font-semibold">Starting your mock interview...</p>
          </div>
        )}
 
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm leading-relaxed ${
              msg.sender === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-none'
                : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
            }`}>
 
              {msg.type === 'text' && msg.text && (
                <MarkdownText text={msg.text} isUser={msg.sender === 'user'} />
              )}
 
              {msg.type === 'file' && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText size={18} />
                  <span>{msg.fileName}</span>
                </div>
              )}
 
              {msg.type === 'image' && msg.imageUrl && (
                <div>
                  <img src={msg.imageUrl} alt="upload" className="rounded-xl max-w-[240px]" />
                  {msg.text && <p className="mt-2 text-sm text-white/90">{msg.text}</p>}
                </div>
              )}
            </div>
          </div>
        ))}
 
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-200">
              <span className="text-xs text-slate-500 animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>
 
      {/* Input Section */}
      <div className="p-4 bg-white relative">
 
        {/* Plus Menu */}
        {showPlusMenu && (
          <div className="absolute bottom-20 left-6 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 w-64 z-50">
            <div className="flex flex-col text-sm">
 
              <label className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-slate-600 cursor-pointer">
                <FileText size={16} className="text-blue-500" />
                <span>Docs & Files</span>
                <input type="file" hidden accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ''; }} />
              </label>
 
              <button onClick={handleWebSearch}
                className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-slate-600 text-left">
                <Search size={16} className="text-orange-500" />
                <div>
                  <div>Web Search</div>
                  {!inputText.trim() && <div className="text-xs text-slate-400 mt-0.5">Type a query first</div>}
                </div>
              </button>
 
              <label className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-slate-600 cursor-pointer">
                <ImageIcon size={16} className="text-pink-500" />
                <div>
                  <div>Attach Image</div>
                  <div className="text-xs text-slate-400 mt-0.5">Select, then type your question</div>
                </div>
                <input type="file" hidden accept="image/*"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); e.target.value = ''; }} />
              </label>
 
            </div>
          </div>
        )}
 
        {/* Pending image preview */}
        {pendingImage && (
          <div className="flex items-center gap-3 mb-2 px-3 py-2 bg-slate-50 rounded-2xl border border-slate-200">
            <img src={pendingImage.url} alt="preview"
              className="h-12 w-12 rounded-xl object-cover border border-slate-200 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-600 font-medium truncate">{pendingImage.file.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">Type your question and hit send ↓</p>
            </div>
            <button onClick={() => setPendingImage(null)}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <X size={14} />
            </button>
          </div>
        )}
 
        {/* Input Bar */}
       <div className="flex items-center gap-1 sm:gap-2 bg-slate-100 rounded-full px-2 sm:px-4 py-1 border border-slate-200 w-full">
  
  <button
    onClick={() => setShowPlusMenu(!showPlusMenu)}
    className={`p-2 shrink-0 rounded-full transition-colors ${
      showPlusMenu
        ? 'text-indigo-600 bg-indigo-50'
        : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    <Plus size={18} />
  </button>

  <input
    type="text"
    value={inputText}
    onChange={(e) => setInputText(e.target.value)}
    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
    placeholder={
      pendingImage
        ? 'Ask something about this image...'
        : 'Message Career Assistant...'
    }
    className="flex-1 min-w-0 bg-transparent border-none outline-none py-3 text-sm text-slate-700"
  />

  <button
    onClick={startDictation}
    className={`p-2 shrink-0 transition-all ${
      isDictating
        ? 'text-red-500 scale-125'
        : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    <Mic size={18} />
  </button>

  <button
    onClick={() => setIsConversing(true)}
    className="p-2 shrink-0 text-slate-400 hover:text-indigo-600"
  >
    <AudioLines size={18} />
  </button>

  <button
    onClick={handleSendMessage}
    disabled={!inputText.trim() && !pendingImage}
    className={`p-2 shrink-0 rounded-full transition-all ${
      !inputText.trim() && !pendingImage
        ? 'text-slate-300'
        : 'text-indigo-600 hover:scale-110'
    }`}
  >
    <Send size={18} />
  </button>

</div>
      </div>
    </div>
  );
}