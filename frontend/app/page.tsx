'use client';
 
import { useState, useEffect } from 'react';
import {
  ArrowRight, Sparkles, MessageSquare,
  Briefcase, Map, Target, TrendingUp,
  BrainCircuit, Lightbulb, ChevronRight,
  Zap, ArrowLeft, Lock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import CareerChat from '@/components/CareerChat';
import { ResumeUploader } from '@/components/ResumeUploader';
import { AdvancedVoiceChat } from '@/components/AdvancedVoiceChat';
import { ResumeDashboard } from '@/components/ResumeDashboard';
import { BlurGate } from '@/components/BlurGate';
import { useUser } from '@/hooks/useUser';
import { apiUrl } from '@/lib/api';
 
export default function Home() {
  const [hasResume,  setHasResume]  = useState(false);
  const [chatMode,   setChatMode]   = useState<'text' | 'voice' | 'overview'>('overview');
  const [resumeData, setResumeData] = useState<any>(null);
 
  const { isLoggedIn, isPro, user } = useUser();
  const router = useRouter();
  useEffect(() => {

  fetchLatestResume()

}, [user])

useEffect(() => {

  if (!user) {

    setResumeData(null)

    setHasResume(false)

  }

}, [user])

const fetchLatestResume = async () => {

  // USER LOGGED OUT
  if (!user?.id) {

    setResumeData(null)
    setHasResume(false)

    return
  }

  try {

    const response = await fetch(
       apiUrl(`/api/v1/resume/latest?user_id=${user?.id}`)
    )

    const data = await response.json()

    // SUCCESS + RESUME EXISTS
    if (data.success && data.review) {

      setResumeData(data.review)
      setHasResume(true)

    } else {

      // NO RESUME FOUND
      setResumeData(null)
      setHasResume(false)

    }

  } catch (error) {

    console.error(error)

    // ERROR => CLEAR OLD DATA
    setResumeData(null)
    setHasResume(false)

  }

}
 
  // ── Text chat ──────────────────────────────────────────────────────────────
  if (hasResume && chatMode === 'text') {
    return (
      <div className="flex flex-col animate-in fade-in duration-300" style={{ height: 'calc(100vh - 120px)' }}>
        <button
          onClick={() => setChatMode('overview')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm transition-all w-fit mb-3 self-start"
        >
          <ArrowLeft size={15} /> Back to Results
        </button>
        <div className="flex-1 min-h-0">
          <CareerChat />
        </div>
      </div>
    );
  }
 
  // ── Voice chat — Pro only ──────────────────────────────────────────────────
  if (chatMode === 'voice') {
    return (
      <div className="flex flex-col animate-in fade-in duration-300" style={{ height: 'calc(100vh - 120px)' }}>
        <button
          onClick={() => setChatMode('overview')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm transition-all w-fit mb-3 self-start"
        >
          <ArrowLeft size={15} /> Back to Results
        </button>
 
        <div className="flex-1 min-h-0 rounded-[32px] overflow-hidden shadow-2xl">
            <AdvancedVoiceChat onBack={() => setChatMode('overview')} />
        </div>
      </div>
    );
  }
 
  // ── Overview ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-12">
 
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden rounded-[42px] min-h-[470px] border border-white/40 shadow-[0_25px_80px_rgba(120,130,180,0.08)]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.60)_0%,rgba(255,255,255,0.18)_100%)] backdrop-blur-[1px]" />
        <div className="absolute top-[20px] right-[180px] w-[320px] h-[320px] bg-[#C5B7FF]/30 rounded-full blur-[90px] animate-pulse" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between px-8 lg:px-14 py-14 lg:py-10 min-h-[470px]">
          <div className="flex-1 max-w-2xl">
            <h1 className="text-[28px] lg:text-[54px] font-[900] leading-[1] tracking-[-0.04em] text-transparent bg-clip-text bg-gradient-to-br from-[#7FAFFF] via-[#5F9CFF] to-[#3D84F5]">
              Your AI Partner<br />for a Better Career
            </h1>
            <p className="mt-7 text-[17px] lg:text-[20px] text-[#64748B] leading-9 max-w-2xl">
              Get personalized guidance, expert insights, and AI-powered tools
              to help you plan, grow, and land your dream job.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <button onClick={() => router.push(isLoggedIn ? '/' : '/register')}
                className="group relative overflow-hidden h-[54px] px-6 rounded-[18px] border border-[#FFE38A] bg-gradient-to-r from-[#FFE27A] via-[#FFD84D] to-[#FFEFB0] shadow-[0_10px_24px_rgba(255,215,90,0.18)] hover:scale-[1.01] transition-all">
                <div className="relative z-10 flex items-center gap-2 font-[800] text-[#111827] text-[15px] tracking-[-0.01em]">
                  Let&apos;s Get Started
                  <ArrowRight size={16} strokeWidth={2.4} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
          <div className="relative w-full lg:w-[520px] h-[420px] mt-14 lg:mt-0 flex items-center justify-center">
            <div className="absolute w-[340px] h-[340px] bg-[#C7B7FF]/40 rounded-full blur-[80px] animate-pulse" />
            <img src="/bot.png" alt="AI Robot" className="relative z-20 w-[390px] lg:w-[430px] object-contain drop-shadow-[0_35px_60px_rgba(90,90,180,0.30)] animate-float" />
            <div className="absolute top-10 right-6 bg-white/75 backdrop-blur-xl p-4 rounded-[22px] shadow-xl border border-white/70 z-30 animate-bounce">
              <div className="bg-[#EEF2FF] p-3 rounded-2xl"><Briefcase className="text-[#5B5CF0]" size={22} /></div>
            </div>
            <div className="absolute top-1/2 -right-2 -translate-y-1/2 bg-white/75 backdrop-blur-xl p-4 rounded-[22px] shadow-xl border border-white/70 z-30 animate-pulse">
              <div className="bg-[#F3E8FF] p-3 rounded-2xl"><TrendingUp className="text-[#7C3AED]" size={22} /></div>
            </div>
            <div className="absolute bottom-10 right-8 bg-white/75 backdrop-blur-xl p-4 rounded-[22px] shadow-xl border border-white/70 z-30 animate-bounce">
              <div className="bg-[#DCFCE7] p-3 rounded-2xl"><Target className="text-[#10B981]" size={22} /></div>
            </div>
          </div>
        </div>
      </section>
      
      {/* ── DASHBOARD GRID ── */}
      <div className="grid grid-cols-12 gap-6 lg:gap-8">
 
        {/* LEFT COLUMN */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              {!resumeData ? 'What can I help you with?' : 'Analysis Dashboard'}
            </h2>
            <div className="h-1 w-16 bg-indigo-100 rounded-full" />
          </div>
 
          {!resumeData ? (
            <div className="bg-white/50 backdrop-blur-sm border-4 border-dashed border-slate-200 rounded-[36px] p-10 lg:p-16">
              <ResumeUploader onUploadComplete={(data) => { setResumeData(data); setHasResume(true); }} />
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-white rounded-[36px] p-6 lg:p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
                <header className="mb-6">
                  <h1 className="text-2xl font-bold text-slate-800">
                    Welcome back, {resumeData.name || 'there'}
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    AI has analyzed your profile. Here are your personalized insights.
                  </p>
                </header>
 
                {/* Only show results if logged in, otherwise show blurred content with lock */}
                {isLoggedIn ? (
                  <ResumeDashboard data={resumeData} />
                ) : (
                  <div className="relative">
                    {/* Blurred content */}
                    <div className="filter blur-[6px] opacity-60 pointer-events-none select-none">
                      <ResumeDashboard data={resumeData} />
                    </div>
                    {/* Lock Overlay */}
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                        <Lock size={28} className="text-indigo-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Unlock Your Analysis</h3>
                      <p className="text-slate-500 text-sm mb-5 max-w-sm">
                        Create a free account to see your ATS score, skill analysis, and personalized career recommendations.
                      </p>
                      <div className="flex gap-3">
                        <button onClick={() => router.push('/register')} className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                          Create free account
                        </button>
                        <button onClick={() => router.push('/login')} className="border border-slate-200 text-slate-600 px-5 py-2 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
                          Sign in
                        </button>
                      </div>
                    </div>
                  </div>
                )}
 
                {/* Action buttons - only for logged in */}
                {isLoggedIn && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button onClick={() => setChatMode('text')} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 text-sm">
                      <MessageSquare size={16} /> Discuss Results with AI
                    </button>
                    <button onClick={() => setChatMode('voice')}className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 text-sm">
                        <Zap size={16} />AI Voice Coach
                    </button>
                    <button onClick={() => {setResumeData(null); setHasResume(false);}} 
                    className="flex items-center gap-2 bg-slate-200 text-slate-700 px-6 py-3.5 rounded-2xl font-bold hover:bg-slate-200 transition-all shadow-sm text-sm"
                        >
                   Upload Different Resume
                </button>
                  </div>
                )}
              </div>
 
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ActionCard icon={<BrainCircuit className="text-amber-500" />} title="Interview Prep" desc="Practice with these results." color="amber" />
                <ActionCard icon={<Map className="text-emerald-500" />} title="Career Roadmap" desc="Plan your next steps." color="emerald" />
              </div>
            </div>
          )}
        </div>
 
        {/* RIGHT COLUMN - With Blur for non-logged-in users */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* Career Snapshot - Blurred for non-logged-in users */}
          <div className="bg-white rounded-[36px] p-6 lg:p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-slate-800 text-lg">Career Snapshot</h3>
              <TrendingUp size={18} className="text-indigo-600" />
            </div>
            
            {isLoggedIn ? (
              resumeData ? (
                <>
                  {/* ATS Score Circle - Only visible when logged in */}
                  <div className="flex justify-center mb-6">
                    <div className="relative w-36 h-36 sm:w-40 sm:h-40">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="80" cy="80" r="68" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
                        <circle
                          cx="80" cy="80" r="68"
                          stroke="currentColor" strokeWidth="10" fill="transparent"
                          strokeDasharray="427"
                          strokeDashoffset={427 - (427 * (resumeData?.ats_score || 0)) / 100}
                          strokeLinecap="round"
                          className="text-indigo-600 transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl sm:text-3xl font-black text-slate-800">
                          {resumeData?.ats_score || 0}%
                        </span>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                          ATS Score
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Resume Quality</span>
                        <span className="text-xs font-black text-slate-800">{resumeData?.resume_quality || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${resumeData?.resume_quality || 0}%` }} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Interview Skills</span>
                        <span className="text-xs font-black text-slate-800">{resumeData?.interview_skills || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-rose-400 rounded-full transition-all duration-700" style={{ width: `${resumeData?.interview_skills || 0}%` }} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Market Demand</span>
                        <span className="text-xs font-black text-slate-800">{resumeData?.market_demand || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full transition-all duration-700" style={{ width: `${resumeData?.market_demand || 0}%` }} />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Logged in but no resume yet */
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mb-3">
                    <TrendingUp size={26} className="text-indigo-400" />
                  </div>
                  <p className="text-slate-500 text-sm font-medium">Upload your resume to see your career scores</p>
                </div>
              )
            ) : (
              /* Blurred content for non-logged-in users */
              <div className="relative">
                <div className="filter blur-[6px] opacity-60 pointer-events-none select-none">
                  {/* Blurred ATS Circle */}
                  <div className="flex justify-center mb-6">
                    <div className="relative w-36 h-36 sm:w-40 sm:h-40">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="80" cy="80" r="68" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
                        <circle cx="80" cy="80" r="68" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray="427" strokeDashoffset="85" strokeLinecap="round" className="text-indigo-600" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl sm:text-3xl font-black text-slate-800">85%</span>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">ATS Score</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Blurred Stats */}
                  <div className="space-y-4">
                    <div><div className="flex justify-between mb-1.5"><span className="text-xs font-bold text-slate-500">Resume Quality</span><span className="text-xs font-black text-slate-800">90%</span></div><div className="w-full bg-slate-100 rounded-full h-2"><div className="h-full bg-indigo-500 rounded-full w-[90%]" /></div></div>
                    <div><div className="flex justify-between mb-1.5"><span className="text-xs font-bold text-slate-500">Interview Skills</span><span className="text-xs font-black text-slate-800">70%</span></div><div className="w-full bg-slate-100 rounded-full h-2"><div className="h-full bg-rose-400 rounded-full w-[70%]" /></div></div>
                    <div><div className="flex justify-between mb-1.5"><span className="text-xs font-bold text-slate-500">Market Demand</span><span className="text-xs font-black text-slate-800">80%</span></div><div className="w-full bg-slate-100 rounded-full h-2"><div className="h-full bg-emerald-400 rounded-full w-[80%]" /></div></div>
                  </div>
                </div>
                
                {/* Lock Overlay */}
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 text-center">
                  <Lock size={32} className="text-indigo-600 mb-2" />
                  <p className="text-slate-600 text-sm font-medium mb-3">Sign in to see your scores</p>
                  <div className="flex gap-2">
                    <button onClick={() => router.push('/register')} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold">Sign up</button>
                    <button onClick={() => router.push('/login')} className="border border-slate-300 text-slate-600 px-4 py-1.5 rounded-lg text-sm font-semibold">Login</button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* AI Recommendations - Blurred for non-logged-in users */}
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-[36px] p-6 lg:p-8 text-white shadow-2xl shadow-indigo-200/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Lightbulb size={120} />
            </div>
            
            <div className="relative z-10">
              <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
                <Sparkles size={18} className="text-yellow-400" /> 
                AI Recommendations
              </h3>
              <p className="text-indigo-200 text-xs mb-4">
                Personalized tips based on your profile
              </p>
            </div>
            
            {isLoggedIn ? (
              resumeData?.ai_suggestions ? (
                <div className="relative z-10 space-y-3">
                  {resumeData.ai_suggestions.slice(0, 3).map((tip: string, i: number) => (
                    <div key={i} className="flex gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                      <span className="text-yellow-400 text-sm flex-shrink-0">✨</span>
                      <p className="text-sm leading-relaxed text-indigo-50">{tip}</p>
                    </div>
                  ))}
                </div>
              ) : (
                /* Logged in but no resume uploaded yet */
                <div className="relative z-10 flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-3">
                    <Sparkles size={22} className="text-yellow-400" />
                  </div>
                  <p className="text-indigo-200 text-sm font-medium">Upload your resume to get personalized AI recommendations</p>
                </div>
              )
            ) : (
              <div className="relative">
                {/* Blurred recommendations */}
                <div className="filter blur-[4px] opacity-60 pointer-events-none select-none">
                  <div className="space-y-3">
                    <div className="flex gap-3 bg-white/10 p-3 rounded-xl"><span className="text-yellow-400">✨</span><p className="text-sm">Sample recommendation that is blurred</p></div>
                    <div className="flex gap-3 bg-white/10 p-3 rounded-xl"><span className="text-yellow-400">✨</span><p className="text-sm">Another example of blurred content</p></div>
                    <div className="flex gap-3 bg-white/10 p-3 rounded-xl"><span className="text-yellow-400">✨</span><p className="text-sm">Third recommendation appears blurred</p></div>
                  </div>
                </div>
                
                {/* Lock Overlay */}
                <div className="absolute inset-0 bg-indigo-900/70 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 text-center">
                  <Lock size={32} className="text-yellow-400 mb-2" />
                  <p className="text-white text-sm font-medium mb-3">Sign in to unlock AI recommendations</p>
                  <div className="flex gap-2">
                    <button onClick={() => router.push('/register')} className="bg-white text-indigo-900 px-4 py-1.5 rounded-lg text-sm font-semibold">Sign up</button>
                    <button onClick={() => router.push('/login')} className="border border-white/30 text-white px-4 py-1.5 rounded-lg text-sm font-semibold">Login</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
 
function ActionCard({ icon, title, desc, onClick, color }: {
  icon: React.ReactNode; title: string; desc: string; onClick?: () => void; color: string;
}) {
  const colorMap: Record<string, string> = {
    indigo:  'hover:bg-indigo-50/50 hover:border-indigo-200',
    rose:    'hover:bg-rose-50/50 hover:border-rose-200',
    amber:   'hover:bg-amber-50/50 hover:border-amber-200',
    emerald: 'hover:bg-emerald-50/50 hover:border-emerald-200',
  };
  return (
    <div onClick={onClick} className={`group bg-white p-8 rounded-[32px] border border-slate-100 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-xl ${colorMap[color]}`}>
      <div className="w-12 h-12 bg-slate-50 rounded-[18px] flex items-center justify-center mb-6 group-hover:scale-110 transition-all">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-4">{desc}</p>
      <div className="flex items-center text-indigo-600 font-bold text-xs gap-1.5">
        EXPLORE TOOL <ChevronRight size={13} />
      </div>
    </div>
  );
}