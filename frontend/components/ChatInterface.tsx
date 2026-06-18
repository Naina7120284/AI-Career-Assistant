'use client';

import { useState, useRef, useEffect } from 'react';
import { VoiceInput } from './VoiceInput';
import { ArrowLeft, Send, Sparkles, User, Bot, Info } from 'lucide-react';
import { apiUrl } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Contract: Added the onBack prop to fix the TypeScript error
interface ChatInterfaceProps {
  onBack: () => void;
}

export function ChatInterface({ onBack }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "👋 Hi! I've analyzed your resume. Ask me anything about your career, job opportunities, or skill development!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl('/api/v1/chat/ask'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: messageText, 
          user_id: 'user?.id' // Contract: Using the same user ID logic as in the backend
        }),
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Chat failed:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    sendMessage(input);
    setInput('');
  };

  const handleVoiceTranscript = (text: string) => {
    setInput(text);
    setTimeout(() => {
      sendMessage(text);
      setInput('');
    }, 100);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-[18px] shadow-xl shadow-indigo-100/50 border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-300">
      
      {/* --- CHAT HEADER --- */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Bot size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-[15px] text-slate-800">Career Assistant</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Agent Online</p>
              </div>
            </div>
          </div>
        </div>
        <button className="text-slate-300 hover:text-slate-500 transition-colors">
          <Info size={20} />
        </button>
      </div>

      {/* --- MESSAGES AREA --- */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 chat-scroll bg-[#FDFDFF] custom-scrollbar">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-3`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                <Bot size={14} />
              </div>
            )}
            <div
              className={`max-w-[85%] md:max-w-[68%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 mb-1">
                <User size={14} />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
              <Bot size={14} />
            </div>
            <div className="bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* --- QUICK SUGGESTIONS --- */}
      <div className="px-6 py-2 bg-white border-t border-slate-50">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['What jobs fit my skills?', 'Improve my resume', 'Interview tips', 'Salary expectations'].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => sendMessage(suggestion)}
              disabled={isLoading}
              className="whitespace-nowrap text-[10px] font-bold uppercase tracking-tight px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 rounded-xl border border-slate-100 transition-all"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* --- INPUT AREA --- */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-[24px] p-1.5 pr-2 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
          <div className="pl-2">
             <VoiceInput onTranscript={handleVoiceTranscript} />
          </div>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about your career..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-700 placeholder:text-slate-400 py-2"
            disabled={isLoading}
          />
          
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 text-white w-9 h-9 rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-30 disabled:grayscale shadow-lg shadow-indigo-100"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}