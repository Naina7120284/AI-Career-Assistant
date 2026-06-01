'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'

import {
  Pencil,
  Target,
  ChevronDown,
  Sparkles,
  Map,
  BarChart3,
} from 'lucide-react'

interface Roadmap {
  id: string
  target_role: string
  target_date: string
}

interface Step {
  id: string
  title: string
  description: string
  stage: string
  progress: number
  total: number
}

export default function CareerRoadmapPage() {
  const { isLoggedIn, loading: authLoading } = useUser()
  const [loading, setLoading] =
    useState(true)

  const [generating, setGenerating] =
    useState(false)

  const [roadmap, setRoadmap] =
    useState<Roadmap | null>(null)

  const [steps, setSteps] = useState<
    Step[]
  >([])
  const [openStep, setOpenStep] =
  useState<number | null>(0)

  const [isEditing, setIsEditing] =
    useState(false)

  const [targetRole, setTargetRole] =
    useState('')

  const [targetDate, setTargetDate] =
    useState('2026')

  useEffect(() => {
    loadRoadmap()
  }, [])

  async function loadRoadmap() {
    try {
      setLoading(true)

      const response = await fetch(
        '/api/career-roadmap'
      )

      const data =
        await response.json()

      setRoadmap(data.roadmap)

      setSteps(data.steps)

      setTargetRole(
        data.roadmap?.target_role || ''
      )

      setTargetDate(
        data.roadmap?.target_date || '2026'
      )
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveGoal() {
    try {
      setGenerating(true)

      setIsEditing(false)

      setSteps([])

      const response = await fetch(
        '/api/career-roadmap',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            target_role: targetRole,
            target_date: targetDate,
          }),
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      setRoadmap(data.roadmap)

      for (
        let i = 0;
        i < data.steps.length;
        i++
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, 700)
        )

        setSteps((prev) => [
          ...prev,
          data.steps[i],
        ])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setGenerating(false)
    }
  }

  // AUTH LOADING
if (authLoading) {
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='text-lg font-medium text-[#4f46e5]'>
        Loading...
      </div>
    </div>
  )
}

// LOGIN GATE
if (!isLoggedIn) {
  return (
    <div className='min-h-screen flex items-center justify-center bg-[#f8fafc] px-6'>
      <div className='w-full max-w-xl rounded-[28px] border border-[#edf1f7] bg-white p-8 shadow-sm text-center'>

        <h1 className='text-3xl font-bold text-[#101828]'>
          Career Roadmap
        </h1>

        <p className='mt-3 text-[#667085]'>
          Please log in to access your personalized AI career roadmap.
        </p>

        <a
          href='/login?next=/career-roadmap'
          className='inline-flex mt-6 h-12 items-center justify-center rounded-2xl bg-[#f6c744] px-6 font-semibold text-black hover:opacity-90'
        >
          Go to Login
        </a>
      </div>
    </div>
  )
}

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='flex items-center gap-3 text-lg font-medium text-[#4f46e5]'>
          <Sparkles className='h-5 w-5 animate-spin' />

          Loading roadmap...
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#f8fafc] p-4 md:p-6'>
      <div className='mx-auto max-w-5xl'>
        {/* HEADER */}

        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-[#0f172a] md:text-4xl'>
              Career Roadmap
            </h1>

            <p className='mt-2 text-sm text-[#64748b]'>
              Personalized AI roadmap
              to achieve your dream
              career.
            </p>
          </div>

          <button
            onClick={() =>
              setIsEditing(true)
            }
            className='inline-flex items-center gap-2 rounded-2xl bg-[#eef2ff] px-4 py-2 text-sm font-semibold text-[#4f46e5]'
          >
            <Pencil className='h-4 w-4' />

            Edit Goal
          </button>
        </div>

        {/* GENERATING */}

        {generating && (
          <div className='mt-6 rounded-2xl border border-[#dbeafe] bg-[#eff6ff] p-4 text-sm font-medium text-[#2563eb] animate-pulse'>
            AI is generating your
            personalized roadmap...
          </div>
        )}

        {/* GOAL CARD */}

        <div className='mt-6 rounded-3xl border border-[#e2e8f0] bg-white p-5 shadow-sm'>
          {isEditing ? (
            <div className='grid gap-4 md:grid-cols-2'>
              <div>
                <p className='mb-2 text-sm font-medium text-[#64748b]'>
                  Target Role
                </p>

                <input
                  value={targetRole}
                  onChange={(e) =>
                    setTargetRole(
                      e.target.value
                    )
                  }
                  className='w-full rounded-2xl border border-[#cbd5e1] px-4 py-3 outline-none'
                  placeholder='AI Engineer'
                />
              </div>

              <div>
                <p className='mb-2 text-sm font-medium text-[#64748b]'>
                  Target Year
                </p>

                <input
                  value={targetDate}
                  onChange={(e) =>
                    setTargetDate(
                      e.target.value
                    )
                  }
                  className='w-full rounded-2xl border border-[#cbd5e1] px-4 py-3 outline-none'
                  placeholder='2027'
                />
              </div>

              <div className='flex gap-3 md:col-span-2'>
                <button
                  onClick={
                    handleSaveGoal
                  }
                  className='rounded-2xl bg-[#4f46e5] px-5 py-3 text-sm font-semibold text-white'
                >
                  Generate AI Roadmap
                </button>

                <button
                  onClick={() =>
                    setIsEditing(false)
                  }
                  className='rounded-2xl border border-[#cbd5e1] px-5 py-3 text-sm font-semibold text-[#334155]'
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className='flex flex-col gap-5 md:flex-row md:items-center md:justify-between'>
              <div className='flex items-center gap-4'>
                <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef2ff]'>
                  <Target className='h-6 w-6 text-[#4f46e5]' />
                </div>

                <div>
                  <p className='text-sm text-[#64748b]'>
                    Target Role
                  </p>

                  <h2 className='text-xl font-bold text-[#0f172a] md:text-2xl'>
                    {
                      roadmap?.target_role
                    }
                  </h2>
                </div>
              </div>

              <div>
                <p className='text-sm text-[#64748b]'>
                  Target Year
                </p>

                <h2 className='text-xl font-bold text-[#0f172a] md:text-2xl'>
                  {
                    roadmap?.target_date
                  }
                </h2>
              </div>
            </div>
          )}
        </div>

        {/* STEPS */}

        <div className='mt-6 space-y-4'>
          {steps.map((step, index) => {
            const percentage =
              (step.progress /
                step.total) *
              100

            return (
              <div
                key={`${step.title}-${index}`}
                className='animate-in fade-in slide-in-from-bottom-4 rounded-3xl border border-[#e2e8f0] bg-white p-5 shadow-sm duration-500'
              >
                <div className='flex flex-col gap-5 md:flex-row md:items-start md:justify-between'>
                  <div className='flex gap-4'>
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl
                        ${
                          index === 0
                            ? 'bg-[#dbeafe]'
                            : index === 1
                            ? 'bg-[#fef3c7]'
                            : index === 2
                            ? 'bg-[#dcfce7]'
                            : 'bg-[#ede9fe]'
                        }`}
                    >
                      {index === 0 ? (
                        <BarChart3 className='h-5 w-5 text-[#2563eb]' />
                      ) : (
                        <Map className='h-5 w-5 text-[#7c3aed]' />
                      )}
                    </div>

                    <div>
                      <p className='text-sm font-semibold text-[#4f46e5]'>
                        {step.stage}
                      </p>

                      <h3 className='mt-1 text-lg font-bold text-[#0f172a] md:text-xl'>
                        {step.title}
                      </h3>

                      <p className='mt-2 text-sm text-[#64748b]'>
                        {
                          step.description
                        }
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-3'>
                    <div className='text-right'>
                      <h3 className='text-xl font-bold text-[#2563eb]'>
                        {step.progress}/
                        {step.total}
                      </h3>

                      <p className='text-sm text-[#64748b]'>
                        Completed
                      </p>
                    </div>

                    <button
                        onClick={() =>
                        setOpenStep(
                        openStep === index
                        ? null
                        : index
                      )
                  }
                 >
                    <ChevronDown
                      className={`h-5 w-5 text-[#94a3b8] transition-transform duration-300 ${
                      openStep === index
                      ? 'rotate-180'
                      : ''
                    }`}
                     />
                </button>
                  </div>
                </div>

                {openStep === index && (
                  <div className='mt-5 rounded-2xl bg-[#f8fafc] p-4 animate-in fade-in duration-300'>
                  <h4 className='text-sm font-semibold text-[#0f172a]'>
                      Recommended Tasks
                </h4>

                 <ul className='mt-3 space-y-2 text-sm text-[#64748b]'>
                  <li>
                     • Complete learning resources
                  </li>

                   <li>
                    • Build practical projects
                  </li>

                  <li>
                    • Practice interview questions
                  </li>

                  <li>
                    • Improve portfolio quality
                </li>
             </ul>
          </div>
         )}

                {/* PROGRESS */}

                <div className='mt-6 h-2 overflow-hidden rounded-full bg-[#e2e8f0]'>
                  <div
                    className='h-2 rounded-full bg-[#3b82f6] transition-all duration-1000'
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {!steps.length &&
          !generating && (
            <div className='mt-10 rounded-3xl border border-dashed border-[#cbd5e1] bg-white py-16 text-center'>
              <p className='text-lg font-medium text-[#64748b]'>
                No roadmap generated yet
              </p>
            </div>
          )}
      </div>
    </div>
  )
}