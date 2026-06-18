'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Briefcase,
  ChevronRight,
  ClipboardCheck,
  CalendarDays,
  MessageSquareText,
  Sparkles,
  X,
  Loader2,
} from 'lucide-react'

import { createClient } from '@/lib/supabase-client'
import { useUser } from '@/hooks/useUser'
import { apiUrl } from '@/lib/api'

const LS_KEY = (userId: string) =>
  `interview_sessions_local:${userId}`

function loadLocalSessions(userId: string): InterviewSession[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LS_KEY(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as InterviewSession[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistLocalSessions(
  userId: string,
  sessions: InterviewSession[]
) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_KEY(userId), JSON.stringify(sessions))
}

type InterviewSession = {
  id: string
  role: string
  type: string
  score: number
  duration: number
  created_at: string
}

type PracticeMode = 'mock' | 'questions' | 'behavioral'

type ActivePractice = {
  mode: 'questions' | 'behavioral'
  role: string
}

export default function InterviewPrepPage() {
  const router = useRouter()
  const supabase = createClient()
  const { isLoggedIn, loading: userLoading, user } = useUser()

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const [sessions, setSessions] = useState<InterviewSession[]>([])
  const [usingLocalSessions, setUsingLocalSessions] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [pendingMode, setPendingMode] = useState<PracticeMode | null>(null)
  const [roleInput, setRoleInput] = useState('Software Engineer')
  const [savingSession, setSavingSession] = useState(false)

  const [activePractice, setActivePractice] = useState<ActivePractice | null>(
    null
  )
  const [practiceLog, setPracticeLog] = useState<
    { role: 'user' | 'ai'; text: string }[]
  >([])
  const [practiceLoading, setPracticeLoading] = useState(false)
  const [draftAnswer, setDraftAnswer] = useState('')

  const userId = user?.id ?? ''

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage(null)
      setUsingLocalSessions(false)

      const {
        data: { user: u },
      } = await supabase.auth.getUser()

      if (!u) {
        setErrorMessage('Please login first.')
        return
      }

      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', u.id)
        .order('created_at', {
          ascending: false,
        })

      if (error) {
        console.error(error)
        const local = loadLocalSessions(u.id)
        setSessions(local)
        setUsingLocalSessions(true)
        if (local.length === 0) {
          setErrorMessage(
            'Could not load sessions from the database. New sessions will be saved on this device only until the interview_sessions table exists in Supabase (run supabase/sql/002_interview_sessions.sql).'
          )
        }
        return
      }

      setSessions(data || [])
    } catch (error) {
      console.error(error)
      setErrorMessage('Failed to load sessions.')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (userLoading) return
    if (!isLoggedIn) {
      setSessions([])
      setUsingLocalSessions(false)
      setErrorMessage(null)
      setActivePractice(null)
      setPracticeLog([])
      setLoading(false)
      return
    }
    void loadSessions()
  }, [userLoading, isLoggedIn, loadSessions])

  const openStartModal = (mode: PracticeMode) => {
    setPendingMode(mode)
    setRoleInput('Software Engineer')
    setModalOpen(true)
    setToast(null)
  }

  const insertSessionRecord = async (
    mode: PracticeMode,
    role: string
  ): Promise<{ id: string; usedLocal: boolean }> => {
    const {
      data: { user: u },
    } = await supabase.auth.getUser()
    if (!u) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('interview_sessions')
      .insert({
        user_id: u.id,
        role,
        type: mode,
        score: 0,
        duration: 0,
      })
      .select('id')
      .single()

    if (error || !data?.id) {
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `local-${Date.now()}`
      const row: InterviewSession = {
        id,
        role,
        type: mode,
        score: 0,
        duration: 0,
        created_at: new Date().toISOString(),
      }
      const next = [row, ...loadLocalSessions(u.id)]
      persistLocalSessions(u.id, next)
      setSessions(next)
      setUsingLocalSessions(true)
      return { id, usedLocal: true }
    }

    return { id: data.id as string, usedLocal: false }
  }

  const confirmStart = async () => {
    if (!pendingMode) return
    const role = roleInput.trim() || 'Software Engineer'
    setSavingSession(true)
    setErrorMessage(null)
    setToast(null)

    try {
      await insertSessionRecord(pendingMode, role)
      setModalOpen(false)

      if (pendingMode === 'mock') {
        setToast('Opening mock interview in Career Chat…')
        router.push(
          `/career-chat?interview_role=${encodeURIComponent(role)}`
        )
        return
      }

      setActivePractice({
        mode: pendingMode,
        role,
      })
      setPracticeLog([])
      setDraftAnswer('')
      if (pendingMode === 'questions') {
        setToast('Session saved. Fetch your first question below.')
      } else {
        setToast('Session saved. Fetch your first behavioral prompt below.')
      }
      await loadSessions()
    } catch (e) {
      console.error(e)
      setErrorMessage('Could not start session. Try again.')
    } finally {
      setSavingSession(false)
      setPendingMode(null)
    }
  }

  const fetchNextPracticeQuestion = async () => {
    if (!activePractice || !userId) return
    setPracticeLoading(true)
    setErrorMessage(null)
    try {
      const isBeh = activePractice.mode === 'behavioral'
      const message = isBeh
        ? `You are an interview coach. For the role "${activePractice.role}", give exactly ONE behavioral interview question (STAR-style). Add one short sentence on what a strong answer should include. Keep the whole response under 180 words.`
        : `You are an interview coach. For the role "${activePractice.role}", give exactly ONE strong technical or role-relevant interview question (not purely behavioral). Add one line hint. Keep under 180 words.`

      const res = await fetch(apiUrl('/api/v1/chat/ask'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          user_id: userId,
        }),
      })
      const data = await res.json()
      const text = data.response || 'No response from AI.'
      setPracticeLog((prev) => [...prev, { role: 'ai', text }])
    } catch (err) {
      console.error(err)
      setErrorMessage(
        'Could not reach the AI service. Is the backend running on the URL in NEXT_PUBLIC_API_URL?'
      )
    } finally {
      setPracticeLoading(false)
    }
  }

  const fetchAnswerFeedback = async () => {
    if (!activePractice || !userId || !draftAnswer.trim()) {
      setErrorMessage('Write a draft answer first.')
      return
    }
    setPracticeLoading(true)
    setErrorMessage(null)
    try {
      const lastQ = [...practiceLog].reverse().find((x) => x.role === 'ai')
      const message = lastQ
        ? `Interview role: "${activePractice.role}".\nQuestion context (last question from coach):\n${lastQ.text}\n\nMy draft answer:\n${draftAnswer.trim()}\n\nGive concise feedback: 2 strengths, 1 improvement, and optionally a revised sentence. Under 200 words.`
        : `Interview role: "${activePractice.role}".\nMy practice answer:\n${draftAnswer.trim()}\n\nGive concise feedback (strengths + one improvement). Under 200 words.`

      const res = await fetch(apiUrl('/api/v1/chat/ask'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          user_id: userId,
        }),
      })
      const data = await res.json()
      const text = data.response || 'No feedback returned.'
      setPracticeLog((prev) => [
        ...prev,
        { role: 'user', text: `My answer: ${draftAnswer.trim()}` },
        { role: 'ai', text },
      ])
      setDraftAnswer('')
    } catch (err) {
      console.error(err)
      setErrorMessage('Could not get feedback from the AI service.')
    } finally {
      setPracticeLoading(false)
    }
  }

  const closePractice = () => {
    setActivePractice(null)
    setPracticeLog([])
    setDraftAnswer('')
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-indigo-500'
    if (score >= 75) return 'text-green-500'
    return 'text-orange-500'
  }

  const getScoreText = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 75) return 'Good'
    return 'Average'
  }

  const modeTitle =
    pendingMode === 'mock'
      ? 'Mock interview'
      : pendingMode === 'behavioral'
        ? 'Behavioral practice'
        : 'Common questions'

  return (
    <div className="min-h-screen bg-[#f6f8fc] px-4 py-5">
      <div className="mx-auto max-w-7xl">
        {modalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="interview-modal-title"
          >
            <div className="w-full max-w-md rounded-[20px] border border-[#e9edf5] bg-white p-5 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <h2
                  id="interview-modal-title"
                  className="text-xl font-bold text-[#101828]"
                >
                  {modeTitle}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false)
                    setPendingMode(null)
                  }}
                  className="rounded-xl p-2 text-[#667085] hover:bg-[#f5f7fb]"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="mt-2 text-sm text-[#667085]">
                {pendingMode === 'mock'
                  ? 'We will open Career Chat with an AI interviewer for this role.'
                  : 'Practice here with AI-generated questions and optional answer feedback.'}
              </p>
              <label className="mt-5 block text-sm font-medium text-[#101828]">
                Target role
                <input
                  className="mt-2 w-full rounded-2xl border border-[#e9edf5] bg-[#fafbfc] px-4 py-3 text-[#101828] outline-none focus:border-[#4f6cff]"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  placeholder="e.g. Product Manager"
                />
              </label>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false)
                    setPendingMode(null)
                  }}
                  className="flex-1 rounded-2xl border border-[#e9edf5] py-3 font-semibold text-[#667085] hover:bg-[#fafbfc]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingSession}
                  onClick={() => void confirmStart()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#f6c744] py-3 font-semibold text-black hover:opacity-90 disabled:opacity-60"
                >
                  {savingSession ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Starting…
                    </>
                  ) : (
                    'Start'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {!userLoading && !isLoggedIn && (
          <div className="mb-8 rounded-[20px] border border-[#e9edf5] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-[#101828]">Please log in</h2>
            <p className="mt-2 text-[#667085]">
              Interview Prep saves sessions to your account (or this device if
              the database table is missing).
            </p>
            <a
              href="/login?next=/interview-prep"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-x text-sm bg-[#f6c744] px-6 font-semibold text-black hover:opacity-90"
            >
              Go to Login
            </a>
          </div>
        )}

        {toast && (
          <div className="mb-6 rounded-[18px] border border-[#bfdbfe] bg-[#eff6ff] p-4 text-[#1e3a5f]">
            {toast}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 rounded-[18px] border border-[#fed7aa] bg-[#fff7ed] p-4 text-[#9a3412]">
            {errorMessage}
          </div>
        )}

        {usingLocalSessions && isLoggedIn && (
          <div className="mb-6 rounded-[18px] border border-blue-200 bg-blue-50 p-4 text-blue-900">
            Sessions are stored on this device because the database returned an
            error. Run{' '}
            <code className="rounded bg-blue-100 px-1 text-sm">
              supabase/sql/002_interview_sessions.sql
            </code>{' '}
            in the Supabase SQL editor to enable cloud sync.
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl md:text-3xl font-bold text-[#101828]">
            Interview Preparation
          </h1>
          <p className="mt-2 text-sm md:text-base text-[#667085]">
            Practice mock interviews in Career Chat, or drill questions and
            behavioral prompts here with AI feedback.
          </p>
        </div>

        <div className="rounded-[24px] border border-[#e9edf5] bg-white p-5 shadow-sm">
          <h2 className="mb-7 text-2xl font-bold text-[#101828]">
            Choose a Practice Mode
          </h2>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <button
              type="button"
              disabled={!isLoggedIn || userLoading}
              onClick={() => openStartModal('mock')}
              className="group flex items-center gap-5 rounded-[20px] border border-[#dfe4ff] bg-white p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg disabled:pointer-events-none disabled:opacity-50"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#eef2ff]">
                <ClipboardCheck size={34} className="text-[#4f6cff]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#101828]">
                  Mock Interview
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#667085]">
                  Back-and-forth text interview in Career Chat (AI asks, you
                  answer).
                </p>
              </div>
            </button>

            <button
              type="button"
              disabled={!isLoggedIn || userLoading}
              onClick={() => openStartModal('questions')}
              className="group flex items-center gap-5 rounded-[20px] border border-[#f4d58d] bg-white p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg disabled:pointer-events-none disabled:opacity-50"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#fff7e6]">
                <MessageSquareText size={34} className="text-[#f0a500]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#101828]">
                  Common Questions
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#667085]">
                  One question at a time with optional written answer feedback.
                </p>
              </div>
            </button>

            <button
              type="button"
              disabled={!isLoggedIn || userLoading}
              onClick={() => openStartModal('behavioral')}
              className="group flex items-center gap-5 rounded-[20px] border border-[#d8f0d2] bg-white p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg disabled:pointer-events-none disabled:opacity-50"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#effbea]">
                <Briefcase size={34} className="text-[#65b84b]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#101828]">
                  Behavioral Questions
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#667085]">
                  STAR-style prompts and coaching on your draft answers.
                </p>
              </div>
            </button>
          </div>
        </div>

        {activePractice && isLoggedIn && (
          <div className="mt-8 rounded-[24px] border border-[#e9edf5] bg-white p-5 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#101828]">
                  {activePractice.mode === 'behavioral'
                    ? 'Behavioral drill'
                    : 'Question drill'}
                </h2>
                <p className="mt-1 text-[#667085]">
                  Role:{' '}
                  <span className="font-medium text-[#101828]">
                    {activePractice.role}
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void fetchNextPracticeQuestion()}
                  disabled={practiceLoading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#4f6cff] px-5 py-2.5 font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {practiceLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Next question
                </button>
                <button
                  type="button"
                  onClick={closePractice}
                  className="rounded-2xl border border-[#e9edf5] px-5 py-2.5 font-semibold text-[#667085] hover:bg-[#fafbfc]"
                >
                  Done
                </button>
              </div>
            </div>

            <div className="max-h-[360px] space-y-4 overflow-y-auto rounded-[24px] border border-[#edf1f7] bg-[#fafbfc] p-5">
              {practiceLog.length === 0 && (
                <p className="text-center text-[#667085]">
                  Click &quot;Next question&quot; to load your first prompt.
                </p>
              )}
              {practiceLog.map((entry, i) => (
                <div
                  key={`${i}-${entry.text.slice(0, 24)}`}
                  className={`rounded-2xl p-4 text-sm leading-relaxed ${
                    entry.role === 'ai'
                      ? 'border border-[#e0e7ff] bg-white text-[#101828]'
                      : 'border border-[#e9edf5] bg-[#f5f7fb] text-[#374151]'
                  }`}
                >
                  {entry.text}
                </div>
              ))}
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium text-[#101828]">
                Draft answer (optional — get AI feedback)
              </label>
              <textarea
                className="mt-2 min-h-[100px] w-full rounded-2xl border border-[#e9edf5] bg-white p-4 text-[#101828] outline-none focus:border-[#4f6cff]"
                value={draftAnswer}
                onChange={(e) => setDraftAnswer(e.target.value)}
                placeholder="Write how you would answer the last question…"
              />
              <button
                type="button"
                disabled={practiceLoading || !draftAnswer.trim()}
                onClick={() => void fetchAnswerFeedback()}
                className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-[#f6c744] bg-[#fffbeb] px-5 py-2.5 font-semibold text-[#92400e] hover:opacity-90 disabled:opacity-50"
              >
                Get feedback on my answer
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 rounded-[24px] border border-[#e9edf5] bg-white p-5 shadow-sm">
          <div className="mb-7 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#101828]">
              Your Recent Sessions
            </h2>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5f7fb]">
              <CalendarDays className="text-[#667085]" size={24} />
            </div>
          </div>

          {isLoggedIn && loading ? (
            <div className="flex h-[250px] items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#e5e7eb] border-t-[#4f6cff]" />
            </div>
          ) : !isLoggedIn ? (
            <div className="flex h-[200px] flex-col items-center justify-center rounded-[20px] border border-dashed border-[#d0d5dd] bg-[#fafbfc] text-[#667085]">
              Log in to see saved sessions.
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex h-[250px] flex-col items-center justify-center rounded-[20px] border border-dashed border-[#d0d5dd] bg-[#fafbfc]">
              <Sparkles size={45} className="mb-4 text-[#4f6cff]" />
              <h3 className="text-2xl font-semibold text-[#101828]">
                No interview sessions yet
              </h3>
              <p className="mt-2 text-[#667085]">
                Start a mode above — we record each practice session.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-[20px] border border-[#edf1f7] bg-white px-6 py-6 shadow-sm transition-all duration-300 hover:shadow-md"
                >
                  <div className="flex items-center gap-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef2ff]">
                      <Sparkles size={28} className="text-[#4f6cff]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#101828]">
                        {session.role}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[#667085]">
                        <span className="rounded-full bg-[#f5f7fb] px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-[#475467]">
                          {session.type}
                        </span>
                        <span>•</span>
                        <span>
                          {session.created_at
                            ? new Date(
                                session.created_at
                              ).toLocaleDateString()
                            : '—'}
                        </span>
                        <span>•</span>
                        <span>{session.duration ?? 0} mins</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-5xl font-bold ${getScoreColor(
                        session.score ?? 0
                      )}`}
                    >
                      {session.score ?? 0}%
                    </div>
                    <div
                      className={`mt-1 text-xl font-medium ${getScoreColor(
                        session.score ?? 0
                      )}`}
                    >
                      {getScoreText(session.score ?? 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {sessions.length > 0 && (
            <div className="mt-8 flex justify-center">
              <span className="flex items-center gap-2 text-lg font-semibold text-[#667085]">
                Showing recent sessions
                <ChevronRight size={20} />
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
