'use client'

import { useCallback, useEffect, useState } from 'react'
import { Search, ChevronDown, Bookmark, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { useUser } from '@/hooks/useUser'
import Image from 'next/image'

type Job = {
  id: string
  title: string
  company: string
  location: string
  type: string
  experience: string
  posted_at: string
  logo: string
}

export default function JobSearchPage() {
  const supabase = createClient()
  const { isLoggedIn, loading: userLoading } = useUser()

  const [jobs, setJobs]             = useState<Job[]>([])
  const [savedJobs, setSavedJobs]   = useState<string[]>([])
  const [search, setSearch]         = useState('')
  const [location, setLocation]     = useState('')
  const [jobType, setJobType]       = useState('')
  const [experience, setExperience] = useState('')
  const [loading, setLoading]       = useState(true)
  const [jobsDemo, setJobsDemo]     = useState(false)
  const [visibleJobs, setVisibleJobs] = useState(5)

  // ── Load jobs ──────────────────────────────────────────────────────────────
  const loadJobs = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search)     params.set('search',     search)
      if (location)   params.set('location',   location)
      if (jobType)    params.set('type',        jobType)
      if (experience) params.set('experience', experience)

      const res  = await fetch(`/api/jobs?${params.toString()}`)
      const json = await res.json()

      if (res.ok && Array.isArray(json.jobs)) {
        setJobs(json.jobs as Job[])
        setJobsDemo(!!json.demo)
      } else {
        setJobs([])
        setJobsDemo(true)
      }
    } catch (error) {
      console.error(error)
      setJobs([])
      setJobsDemo(true)
    } finally {
      setLoading(false)
    }
  }, [experience, jobType, location, search])

  // ── Load saved job IDs from Supabase ───────────────────────────────────────
  const loadSavedJobs = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('saved_jobs')
      .select('job_id')
      .eq('user_id', user.id)

    if (data) setSavedJobs(data.map(item => item.job_id))
  }, [supabase])

  useEffect(() => {
    void loadJobs()
    void loadSavedJobs()
  }, [loadJobs, loadSavedJobs])

  const toggleSaveJob = async (
  jobId: string
) => {
  try {
    const alreadySaved =
      savedJobs.includes(jobId)

    const response = await fetch(
      '/api/saved',
      {
        method: alreadySaved
          ? 'DELETE'
          : 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        credentials: 'include',

        body: JSON.stringify({
          job_id: jobId,
        }),
      }
    )

    const data =
      await response.json()

    if (!response.ok) {
      alert(data.error)
      return
    }

    if (alreadySaved) {
      setSavedJobs((prev) =>
        prev.filter(
          (id) => id !== jobId
        )
      )
    } else {
      setSavedJobs((prev) => [
        ...prev,
        jobId,
      ])
    }

    await loadSavedJobs()
  } catch (error) {
    console.error(error)
  }
}
  const savedJobDetails = jobs.filter(job => savedJobs.includes(job.id))

  return (
    <div className='min-h-screen bg-[#f6f8fc] px-6 py-8'>
      <div className='mx-auto max-w-7xl'>

        {/* HEADER */}
        <div className='mb-8'>
          <h1 className='text-5xl font-bold text-[#101828]'>Job Search</h1>
          <p className='mt-3 text-xl text-[#667085]'>
            Find the best job opportunities that match your skills and goals.
          </p>

          {!userLoading && !isLoggedIn && (
            <p className='mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900'>
              Log in to save jobs to your account. You can still browse listings below.
            </p>
          )}

          {jobsDemo && (
            <p className='mt-4 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-700'>
              Sample job listings are shown. Add a{' '}
              <code className='rounded bg-slate-100 px-1'>jobs</code>{' '}
              table in Supabase to use your own data.
            </p>
          )}
        </div>

        {/* SEARCH BAR */}
        <div className='rounded-[34px] border border-[#edf1f7] bg-white p-5 shadow-sm'>
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-5'>

            {/* Search input */}
            <div className='relative lg:col-span-2'>
              <Search
                className='absolute left-5 top-1/2 -translate-y-1/2 text-[#667085]'
                size={22}
              />
              <input
                type='text'
                placeholder='Search by job title, company or keyword...'
                value={search}
                onChange={e => setSearch(e.target.value)}
                className='h-[68px] w-full rounded-2xl border border-[#e4e7ec] bg-white pl-14 pr-4 text-lg outline-none'
              />
            </div>

            {/* Location */}
            <div className='relative'>
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                className='h-[68px] w-full appearance-none rounded-2xl border border-[#e4e7ec] bg-white px-5 text-lg outline-none'
              >
                <option value=''>Location</option>
                <option value='Remote'>Remote</option>
                <option value='Bangalore'>Bangalore</option>
                <option value='Delhi'>Delhi</option>
              </select>
              <ChevronDown className='absolute right-5 top-1/2 -translate-y-1/2 text-[#667085]' size={20} />
            </div>

            {/* Job Type */}
            <div className='relative'>
              <select
                value={jobType}
                onChange={e => setJobType(e.target.value)}
                className='h-[68px] w-full appearance-none rounded-2xl border border-[#e4e7ec] bg-white px-5 text-lg outline-none'
              >
                <option value=''>Job Type</option>
                <option value='Full Time'>Full Time</option>
                <option value='Part Time'>Part Time</option>
                <option value='Internship'>Internship</option>
              </select>
              <ChevronDown className='absolute right-5 top-1/2 -translate-y-1/2 text-[#667085]' size={20} />
            </div>

            {/* Experience */}
            <div className='relative'>
              <select
                value={experience}
                onChange={e => setExperience(e.target.value)}
                className='h-[68px] w-full appearance-none rounded-2xl border border-[#e4e7ec] bg-white px-5 text-lg outline-none'
              >
                <option value=''>Experience</option>
                <option value='1+ Yrs'>1+ Yrs</option>
                <option value='2+ Yrs'>2+ Yrs</option>
                <option value='5+ Yrs'>5+ Yrs</option>
              </select>
              <ChevronDown className='absolute right-5 top-1/2 -translate-y-1/2 text-[#667085]' size={20} />
            </div>
          </div>

          <button
            onClick={loadJobs}
            className='mt-4 h-[60px] w-full rounded-2xl bg-[#f6c744] text-xl font-semibold text-black transition-all hover:opacity-90'
          >
            Search Jobs
          </button>
        </div>

        {/* CONTENT */}
        <div className='mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3'>

          {/* SAVED JOBS PANEL */}
          <div className='rounded-[34px] border border-[#edf1f7] bg-white p-7 shadow-sm'>
            <div className='mb-7 flex items-center justify-between'>
              <h2 className='text-3xl font-bold text-[#101828]'>Saved Jobs</h2>
            </div>

            <div className='space-y-6'>
              {savedJobDetails.length === 0 ? (
                <div className='flex h-[300px] items-center justify-center rounded-3xl border border-dashed border-[#d0d5dd] text-[#667085]'>
                  No saved jobs
                </div>
              ) : (
                savedJobDetails.map(job => (
                  <div key={job.id} className='border-b border-[#edf1f7] pb-6'>
                    <div className='flex gap-4'>
                      <img
                        src={job.logo}
                        alt={job.company}
                        className='h-16 w-16 rounded-2xl object-contain border border-[#edf1f7] p-1'
                        onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=f5f7fb&color=475467&size=64`
                    }}
                     />
                      <div>
                        <h3 className='text-xl font-bold text-[#101828]'>{job.title}</h3>
                        <p className='mt-1 text-[#667085]'>{job.company} • {job.location}</p>
                        <p className='mt-3 text-sm text-[#667085]'>Saved recently</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RECOMMENDED JOBS */}
          <div className='lg:col-span-2 rounded-[34px] border border-[#edf1f7] bg-white p-7 shadow-sm'>
            <h2 className='mb-7 text-3xl font-bold text-[#101828]'>Recommended Jobs</h2>

            {loading ? (
              <div className='flex h-[400px] items-center justify-center'>
                <div className='h-10 w-10 animate-spin rounded-full border-4 border-[#e5e7eb] border-t-[#4f6cff]' />
              </div>
            ) : (
              <div className='space-y-6'>
            {(
              jobs.slice(0, visibleJobs)
              ).map((job) => (
                  <div key={job.id} className='border-b border-[#edf1f7] pb-6'>
                    <div className='flex items-start justify-between'>

                      <div className='flex gap-5'>
                        {/* Logo */}
                        <div className='flex h-16 w-16 items-center justify-center rounded-2xl border border-[#edf1f7] bg-white p-2 shrink-0'>
                          <img
                             src={job.logo}
                             alt={job.company}
                             className='max-h-full max-w-full object-contain'
                             onError={(e) => {
                             e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=f5f7fb&color=475467&size=64`
                           }}
                          />
                        </div>

                        {/* Info */}
                        <div>
                          <h3 className='text-2xl font-bold text-[#101828]'>{job.title}</h3>
                          <p className='mt-2 text-lg text-[#667085]'>{job.company} • {job.location}</p>
                          <div className='mt-4 flex flex-wrap gap-3'>
                            <span className='rounded-full bg-[#f5f7fb] px-4 py-2 text-sm text-[#475467]'>{job.type}</span>
                            <span className='rounded-full bg-[#f5f7fb] px-4 py-2 text-sm text-[#475467]'>{job.location}</span>
                            <span className='rounded-full bg-[#f5f7fb] px-4 py-2 text-sm text-[#475467]'>{job.experience}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right side */}
                      <div className='flex flex-col items-end gap-5'>
                        <p className='text-lg text-[#667085]'>Posted recently</p>
                        <button
                          onClick={() => toggleSaveJob(job.id)}
                          className='transition hover:scale-110'
                        >
                          <Bookmark
                            size={24}
                            className={
                              savedJobs.includes(job.id)
                                ? 'fill-[#4f6cff] text-[#4f6cff]'
                                : 'text-[#667085]'
                            }
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className='mt-8 flex justify-center'>
               <div className='mt-8 flex items-center justify-center gap-4'>

  <button
    onClick={() =>
      setVisibleJobs((prev) =>
        Math.max(5, prev - 5)
      )
    }
    className='rounded-lg border px-4 py-2'
  >
    ← Previous
  </button>

  <button
    onClick={() =>
      setVisibleJobs((prev) =>
        Math.min(jobs.length, prev + 5)
      )
    }
    className='rounded-lg bg-[#4f6cff] px-4 py-2 text-white'
  >
    Next →
  </button>

</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}