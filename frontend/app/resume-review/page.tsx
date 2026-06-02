'use client'

import { useEffect, useState } from 'react'

import { ResumeUploader }
from '@/components/ResumeUploader'

import { ResumeDashboard }
from '@/components/ResumeDashboard'

import { useUser }
from '@/hooks/useUser'
import { apiUrl } from '@/lib/api'

export default function ResumeReviewPage() {

  const { user } = useUser()

  const [resumeData, setResumeData] =
    useState<any>(null)

  const [loading, setLoading] =
    useState(true)

  // =========================
  // FETCH LATEST RESUME
  // =========================
  useEffect(() => {

    if (user?.id) {

      fetchResumeData()

    } else {

      setResumeData(null)

      setLoading(false)
    }

  }, [user])

  // =========================
  // GET LATEST REVIEW
  // =========================
  const fetchResumeData = async () => {

    try {

      const response = await fetch(
        apiUrl(`/api/v1/resume/latest?user_id=${user?.id}`)
      )

      const data = await response.json()

      if (
        response.ok &&
        data.review
      ) {

        setResumeData(
          data.review
        )
      }

    } catch (error) {

      console.error(
        'Failed to fetch resume:',
        error
      )

    } finally {

      setLoading(false)
    }
  }

  // =========================
  // HANDLE UPLOAD COMPLETE
  // =========================
  const handleUploadComplete =
    async (data: any) => {

      try {

        // =====================
        // UPDATE LOCAL STATE
        // =====================
        setResumeData(data)

        // =====================
        // SAVE REVIEW DATA
        // =====================
        await fetch(
          '/api/resume-review',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({

              ats_score:
                data?.ats_score || 0,

              extracted_skills:
                data?.extracted_skills || [],

              recommended_roles:
                data?.recommended_roles || [],

            }),
          }
        )

        // =====================
        // SAVE SKILLS DATA
        // BACKEND SHOULD PROVIDE
        // REAL VALUES
        // =====================
        await fetch(
          '/api/skills-growth',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({

              communication:
                data?.communication || 0,

              problem_solving:
                data?.problem_solving || 0,

              leadership:
                data?.leadership || 0,

              technical_skills:
                data?.technical_skills || 0,

              overall_score:
                data?.ats_score || 0,

            }),
          }
        )

      } catch (error) {

        console.error(
          'Upload completion error:',
          error
        )
      }
    }

  // =========================
  // LOADING
  // =========================
  if (loading) {

    return (

      <div className="p-10 text-lg text-slate-500">

        Loading...

      </div>
    )
  }

  // =========================
  // UI
  // =========================
  return (

    <div className="max-w-7xl mx-auto space-y-8 pb-12">

      {/* HEADER */}
      <div>

        <h1 className="text-4xl font-black text-[#111827]">
          Resume Review
        </h1>

        <p className="text-slate-500 mt-2">
          Upload your resume and get AI-powered ATS analysis
        </p>

      </div>

      {/* ===================== */}
      {/* UPLOAD SECTION */}
      {/* ===================== */}
      {!resumeData && (

        <div className="bg-white/50 backdrop-blur-sm border-4 border-dashed border-slate-200 rounded-[36px] p-10 lg:p-16">

          <ResumeUploader
            onUploadComplete={
              handleUploadComplete
            }
          />

        </div>
      )}

      {/* ===================== */}
      {/* RESULTS */}
      {/* ===================== */}
      {resumeData && (

        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

          <div className="bg-white rounded-[36px] p-6 lg:p-8 border border-slate-100 shadow-xl shadow-slate-200/40">

            <header className="mb-6">

              <h2 className="text-2xl font-bold text-slate-800">
                Resume Analysis Results
              </h2>

              <p className="text-slate-500 text-sm mt-1">
                Here are your AI-powered insights.
              </p>

            </header>

            {/* DASHBOARD */}
            <ResumeDashboard
              data={resumeData}
            />

            {/* ACTIONS */}
            <div className="mt-6">

              <button

                onClick={() => {

                  setResumeData(null)

                  window.location.reload()

                }}

                className="text-slate-500 text-sm hover:text-slate-700 transition-colors"
              >

                Upload another resume

              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}