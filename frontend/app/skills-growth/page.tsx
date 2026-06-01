'use client'

import {
  Brain,
  Briefcase,
  MessageSquare,
  Users,
  ArrowRight,
} from 'lucide-react'

import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'

type SkillsType = {
  communication: number
  problem_solving: number
  leadership: number
  technical_skills: number
  overall_score: number
}

export default function SkillsGrowthPage() {
  const { isLoggedIn, loading: userLoading } = useUser()
  const [skills, setSkills] =
    useState<SkillsType | null>(null)

  const [courses, setCourses] = useState<any[]>([])

  const [recommendations, setRecommendations] =
    useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    if (userLoading) return
    if (!isLoggedIn) {
      setLoading(false)
      return
    }
    loadData()
  }, [userLoading, isLoggedIn])

  const loadData = async () => {
    try {
      const response = await fetch(
        '/api/skills-growth'
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      setSkills(data.skills)

      setCourses(data.courses || [])

      setRecommendations(
        data.recommendations || []
      )
      setDemoMode(!!data.demo)

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'communication':
        return (
          <MessageSquare className='h-7 w-7 text-[#3b82f6]' />
        )

      case 'excel':
        return (
          <Briefcase className='h-7 w-7 text-[#14b8a6]' />
        )

      case 'management':
        return (
          <Users className='h-7 w-7 text-[#84cc16]' />
        )

      default:
        return (
          <Brain className='h-7 w-7 text-[#3b82f6]' />
        )
    }
  }

  if (userLoading || (loading && isLoggedIn)) {
    return (
      <div className='p-20 text-2xl'>
        Loading...
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fc] px-6">
        <div className="w-full max-w-xl rounded-[28px] border border-[#edf1f7] bg-white p-8 shadow-sm text-center">
          <h1 className="text-3xl font-bold text-[#101828]">Skills &amp; Growth</h1>
          <p className="mt-3 text-[#667085]">
            Log in to see your skills overview and recommendations.
          </p>
          <a
            href="/login?next=/skills-growth"
            className="inline-flex mt-6 h-12 items-center justify-center rounded-2xl bg-[#f6c744] px-6 font-semibold text-black hover:opacity-90"
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#f7f9fc] px-4 py-6'>
      <div className='mx-auto max-w-[1350px]'>
        <h1 className='text-5xl font-bold text-[#101828]'>
          Skills & Growth
        </h1>

        <p className='mt-4 text-2xl text-[#667085]'>
          Assess your skills, track progress, and grow
          your career.
        </p>

        {demoMode && (
          <p className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-900">
            Showing sample data because your Supabase skills tables are empty or not configured yet.
          </p>
        )}

        {/* Top */}
        <div className='mt-10 grid grid-cols-1 gap-8 xl:grid-cols-[1.4fr_1fr]'>
          {/* Skills */}
          <div className='rounded-[36px] border border-[#edf1f7] bg-white p-10 shadow-sm'>
            <h2 className='text-3xl font-bold text-[#101828]'>
              Your Skills Overview
            </h2>

            {skills ? (
              <>
                <div className='mt-10 flex flex-col gap-10 xl:flex-row xl:items-center'>
                  {/* Circle */}
                  <div className='flex items-center justify-center'>
                    <div className='relative flex h-[220px] w-[220px] items-center justify-center rounded-full border-[16px] border-[#3b82f6] border-t-[#dbeafe]'>
                      <div className='text-center'>
                        <h3 className='text-5xl font-bold text-[#101828]'>
                          {skills.overall_score}%
                        </h3>

                        <p className='mt-2 text-xl text-[#667085]'>
                          Overall Score
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className='flex-1 space-y-8'>
                    {[
                      {
                        name: 'Communication',
                        value:
                          skills.communication,
                      },

                      {
                        name: 'Problem Solving',
                        value:
                          skills.problem_solving,
                      },

                      {
                        name: 'Leadership',
                        value: skills.leadership,
                      },

                      {
                        name: 'Technical Skills',
                        value:
                          skills.technical_skills,
                      },
                    ].map((skill) => (
                      <div
                        key={skill.name}
                        className='flex items-center gap-5'
                      >
                        <div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5f7fb]'>
                          <Brain className='h-6 w-6 text-[#3b82f6]' />
                        </div>

                        <div className='flex-1'>
                          <div className='mb-2 flex items-center justify-between'>
                            <p className='text-xl font-semibold text-[#101828]'>
                              {skill.name}
                            </p>

                            <p className='text-lg text-[#667085]'>
                              {skill.value}%
                            </p>
                          </div>

                          <div className='h-3 rounded-full bg-[#edf1f7]'>
                            <div
                              className='h-3 rounded-full bg-[#3b82f6]'
                              style={{
                                width: `${skill.value}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className='mt-10 border-t border-[#edf1f7] pt-8 text-center'>
                  <button className='rounded-2xl bg-[#f5f7fb] px-10 py-5 text-xl font-semibold text-[#667085]'>
                    Assess Skills Again
                  </button>
                </div>
              </>
            ) : (
              <div className='py-20 text-center text-xl text-[#667085]'>
                No skills assessment yet
              </div>
            )}
          </div>

                  <div className='mt-10 space-y-8'>
  {recommendations.length > 0 ? (
    recommendations.map(
      (
        item: string,
        index: number
      ) => (
        <div
          key={index}
          className='flex gap-5'
        >
          <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fef2f2]'>
            🧠
          </div>

          <div className='flex-1'>
            <p className='text-lg font-medium text-[#101828]'>
              {item}
            </p>
          </div>
        </div>
      )
    )
  ) : (
    <div className='py-10 text-center text-lg text-[#667085]'>
      No recommendations yet
    </div>
  )}
</div>
        </div>

        {/* Courses */}
        <div className='mt-12'>
          <h2 className='text-3xl font-bold text-[#101828]'>
            Continue Learning
          </h2>

          <div className='mt-8 grid grid-cols-1 gap-8 xl:grid-cols-3'>
            {courses.length > 0 ? (
              courses.map((course) => (
                <div
                  key={course.id}
                  className='rounded-[32px] border border-[#edf1f7] bg-white p-8 shadow-sm'
                >
                  <div className='flex items-start gap-5'>
                    <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef2ff]'>
                      {getIcon(course.icon)}
                    </div>

                    <div>
                      <h3 className='text-2xl font-bold text-[#101828]'>
                        {course.title}
                      </h3>

                      <p className='mt-2 text-lg text-[#667085]'>
                        {course.level}
                      </p>
                    </div>
                  </div>

                  <div className='mt-10'>
                    <div className='mb-3 flex items-center justify-between'>
                      <p className='text-lg text-[#667085]'>
                        Progress
                      </p>

                      <p className='text-lg font-semibold text-[#667085]'>
                        {course.progress}%
                      </p>
                    </div>

                    <div className='h-3 rounded-full bg-[#edf1f7]'>
                      <div
                        className='h-3 rounded-full bg-[#3b82f6]'
                        style={{
                          width: `${course.progress}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className='col-span-3 rounded-[32px] border border-dashed border-[#d0d5dd] bg-white py-20 text-center text-xl text-[#667085]'>
                No learning courses yet
              </div>
            )}
          </div>

          <div className='mt-10 text-center'>
            <button className='inline-flex items-center gap-3 text-2xl font-semibold text-[#4f46e5]'>
              View All Courses

              <ArrowRight className='h-6 w-6' />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}