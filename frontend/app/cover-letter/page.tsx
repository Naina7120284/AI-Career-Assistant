'use client'

import { useEffect, useState } from 'react'
import { FileText, ChevronRight, Sparkles } from 'lucide-react'
import { useUser } from '@/hooks/useUser'

type CoverLetter = {
  id: string
  job_title: string
  company_name: string
  generated_letter: string
  created_at: string
}

export default function CoverLetterPage() {
  const { isLoggedIn, loading: userLoading } = useUser()
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [tone, setTone] = useState('Professional')

  const [loading, setLoading] = useState(false)

  const [generatedLetter, setGeneratedLetter] = useState('')

  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoBanner, setInfoBanner] = useState<string | null>(null)

  useEffect(() => {
    if (!userLoading && isLoggedIn) loadLetters()
  }, [userLoading, isLoggedIn])

  const loadLetters = async () => {
    try {
      const response = await fetch('/api/cover-letter/history')

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          setErrorMessage('Please log in to view your cover letter history.')
          return
        }
        setErrorMessage(data?.error || 'Failed to load history.')
        return
      }

      if (data.letters) {
        setCoverLetters(data.letters)
      }
      if (data.demo) {
        setInfoBanner(
          'History is unavailable (database). You can still generate a new cover letter below.'
        )
      } else {
        setInfoBanner(null)
      }
    } catch (error) {
      console.error(error)
      setErrorMessage('Failed to load history.')
    }
  }

  const handleGenerate = async () => {
    if (!jobTitle || !companyName) {
      alert('Please fill all required fields')
      return
    }

    try {
      setLoading(true)
      setErrorMessage(null)
      setInfoBanner(null)

      const response = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobTitle,
          companyName,
          jobDescription,
          tone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          setErrorMessage('Please log in to generate a cover letter.')
          return
        }
        throw new Error(data.error)
      }

      setGeneratedLetter(data.coverLetter)
      if (data.saveFailed) {
        setErrorMessage(
          'Cover letter was generated but could not be saved to the database. Copy it now or add a cover_letters table in Supabase.'
        )
      }

      loadLetters()
    } catch (error) {
      console.error(error)
      alert('Failed to generate cover letter')
    } finally {
      setLoading(false)
    }
  }

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f8fc]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e5e7eb] border-t-[#4f6cff]" />
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f8fc] px-6">
        <div className="w-full max-w-lg rounded-[20px] border border-[#e9edf5] bg-white p-6 shadow-sm text-center">
          <h1 className="text-2xl font-bold text-[#101828]">Cover Letter</h1>
          <p className="mt-2 text-[#667085]">
            Please log in to generate and save cover letters.
          </p>
          <a
            href="/login?next=/cover-letter"
            className="inline-flex mt-6 h-10 items-center justify-center rounded-xl bg-[#f6c744] px-5 text-sm font-semibold text-black hover:opacity-90"
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50 p-3 sm:p-4 lg:p-5">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          Cover Letter
        </h1>

        <p className="mt-2 text-slate-600 text-sm sm:text-base">
          Create a professional cover letter tailored to your dream job.
        </p>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.9fr] gap-4 items-start">
        {infoBanner && (
          <div
            style={{
              gridColumn: '1 / -1',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1e3a8a',
              padding: '1rem 1.25rem',
              borderRadius: '18px',
            }}
          >
            {infoBanner}
          </div>
        )}
        {errorMessage && (
          <div
            style={{
              gridColumn: '1 / -1',
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              color: '#9a3412',
              padding: '1rem 1.25rem',
              borderRadius: '18px',
            }}
          >
            {errorMessage}
          </div>
        )}
        {/* LEFT */}
        <div
          className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/70 shadow-lg"
        >
          <h2
            style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: '1.25rem',
            }}
          >
            Create New Cover Letter
          </h2>

          {/* JOB TITLE */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.4rem',
                fontWeight: 600,
                color: '#0f172a',
              }}
            >
              Job Title
            </label>

            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Product Manager"
              style={{
                width: '100%',
                padding: '0.75rem 0.9rem',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                fontSize: '1rem',
                outline: 'none',
                background: '#fff',
                color: '#0f172a',
              }}
            />
          </div>

          {/* COMPANY */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.7rem',
                fontWeight: 600,
                color: '#0f172a',
              }}
            >
              Company Name
            </label>

            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Google"
              style={{
                width: '100%',
                padding: '0.75rem 0.9rem',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                fontSize: '1rem',
                outline: 'none',
                background: '#fff',
                color: '#0f172a',
              }}
            />
          </div>

          {/* DESCRIPTION */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.7rem',
                fontWeight: 600,
                color: '#0f172a',
              }}
            >
              Job Description (Optional)
            </label>

            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description here..."
              rows={5}
              style={{
                width: '100%',
                padding: '0.75rem 0.9rem',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                fontSize: '16px',
                outline: 'none',
                resize: 'none',
                background: '#fff',
                color: '#0f172a',
              }}
            />
          </div>

          {/* TONE */}
          <div style={{ marginBottom: '2rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.7rem',
                fontWeight: 600,
                color: '#0f172a',
              }}
            >
              Tone
            </label>

            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.9rem',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                fontSize: '1rem',
                outline: 'none',
                background: '#fff',
                color: '#0f172a',
              }}
            >
              <option>Professional</option>
              <option>Confident</option>
              <option>Friendly</option>
              <option>Formal</option>
              <option>Creative</option>
            </select>
          </div>

          {/* BUTTON */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-400 py-4 font-bold text-slate-900 shadow-lg hover:scale-[1.01] transition"
          >
            {loading ? (
              'Generating...'
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <Sparkles size={18} />
                Generate Cover Letter
              </div>
            )}
          </button>
        </div>

        {/* RIGHT */}
        <div
          className="flex flex-col gap-6"
        >
          {/* HISTORY */}
          <div
            className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/70 shadow-lg"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
              }}
            >
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#0f172a',
                }}
              >
                Your Cover Letters
              </h2>

              <FileText size={22} color="#64748b" />
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {coverLetters.length === 0 && (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    color: '#64748b',
                    textAlign: 'center',
                  }}
                >
                  No cover letters yet
                </div>
              )}

              {coverLetters.map((item) => (
                <div
                  key={item.id}
                  onClick={() =>
                    setGeneratedLetter(item.generated_letter)
                  }
                  style={{
                    background: '#fff',
                    borderRadius: '14px',
                    padding: '1rem',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: '0.2s',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontWeight: 700,
                          color: '#0f172a',
                          marginBottom: '0.3rem',
                        }}
                      >
                        {item.job_title}
                      </h3>

                      <p
                        style={{
                          color: '#64748b',
                          fontSize: '0.95rem',
                        }}
                      >
                        {item.company_name}
                      </p>
                    </div>

                    <ChevronRight color="#64748b" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GENERATED LETTER */}
          {generatedLetter && (
            <div
              className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-lg"
            >
              <h2
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  color: '#0f172a',
                }}
              >
                Generated Cover Letter
              </h2>

              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.7',
                  color: '#334155',
                  fontSize: '0.95rem',
                }}
              >
                {generatedLetter}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}