// import { NextResponse } from 'next/server'
// import { createServerSupabaseClient } from '@/lib/supabase-server'
// import { DEMO_SAVED_ITEMS } from '@/lib/demo-data'

// export async function GET() {
//   try {
//     const supabase = await createServerSupabaseClient()

//     const {
//       data: { user },
//     } = await supabase.auth.getUser()

//     if (!user) {
//       return NextResponse.json({
//         items: DEMO_SAVED_ITEMS,
//         demo: true,
//       })
//     }

//     const savedItemsResult = await supabase
//       .from('saved_items')
//       .select('*')
//       .eq('user_id', user.id)
//       .order('created_at', { ascending: false })
//     let items = savedItemsResult.data
//     const selectError = savedItemsResult.error

//     if (selectError) {
//       return NextResponse.json({
//         items: DEMO_SAVED_ITEMS,
//         demo: true,
//       })
//     }

//     // First time seed

//     if (!items || items.length === 0) {
//       const { error: insertError } = await supabase.from('saved_items').insert([
//         {
//           user_id: user.id,
//           title: 'Product Manager',
//           company: 'Google',
//           location: 'Bangalore, India',
//           type: 'Full Time',
//           work_mode: 'Remote',
//           experience: '5+ Yrs Exp',
//           category: 'jobs',
//           logo:
//             'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg',
//           saved_date: 'May 10, 2026',
//         },

//         {
//           user_id: user.id,
//           title: 'Senior UX Designer',
//           company: 'Microsoft',
//           location: 'Hyderabad, India',
//           type: 'Full Time',
//           work_mode: 'On-site',
//           experience: '3-5 Yrs Exp',
//           category: 'jobs',
//           logo:
//             'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/windows8/windows8-original.svg',
//           saved_date: 'May 08, 2026',
//         },

//         {
//           user_id: user.id,
//           title: 'Business Analyst',
//           company: 'Amazon',
//           location: 'Pune, India',
//           type: 'Full Time',
//           work_mode: 'Remote',
//           experience: '2-4 Yrs Exp',
//           category: 'jobs',
//           logo:
//             'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
//           saved_date: 'May 05, 2026',
//         },
//       ])

//       if (insertError) {
//         return NextResponse.json({
//           items: DEMO_SAVED_ITEMS,
//           demo: true,
//         })
//       }

//       const { data: newItems } = await supabase
//         .from('saved_items')
//         .select('*')
//         .eq('user_id', user.id)

//       items = newItems
//     }

//     return NextResponse.json({
//       items,
//     })
//   } catch (error) {
//     console.error(error)

//     return NextResponse.json(
//       {
//         items: DEMO_SAVED_ITEMS,
//         demo: true,
//       },
//       { status: 200 }
//     )
//   }
// }

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/* ======================================================
   GET → FETCH SAVED JOBS
====================================================== */

export async function GET() {
  try {
    const supabase =
      await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const {
      data: savedJobs,
      error,
    } = await supabase
      .from('saved_jobs')
      .select(
        'id, job_id, created_at'
      )
      .eq('user_id', user.id)
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (
      !savedJobs ||
      savedJobs.length === 0
    ) {
      return NextResponse.json({
        items: [],
      })
    }

    const jobIds = savedJobs.map(
      (s) => s.job_id
    )

    const {
      data: jobs,
      error: jobsError,
    } = await supabase
      .from('jobs')
      .select('*')
      .in('id', jobIds)

    if (jobsError) {
      return NextResponse.json(
        { error: jobsError.message },
        { status: 500 }
      )
    }

    const items = savedJobs
      .map((saved) => {
        const job = (
          jobs || []
        ).find(
          (j) => j.id === saved.job_id
        )

        if (!job) return null

        return {
          id: saved.id,
          job_id: saved.job_id,
          title: job.title,
          company: job.company,
          location: job.location,
          type: job.type,
          work_mode: job.work_mode,
          experience: job.experience,
          category: 'Jobs',
          logo: job.logo,

          saved_date: new Date(
            saved.created_at
          ).toLocaleDateString(
            'en-IN',
            {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }
          ),
        }
      })
      .filter(Boolean)

    return NextResponse.json({
      items,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

/* ======================================================
   POST → SAVE JOB
====================================================== */

export async function POST(
  request: Request
) {
  try {
    const supabase =
      await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body =
      await request.json()

    const { job_id } = body

    if (!job_id) {
      return NextResponse.json(
        { error: 'Job ID required' },
        { status: 400 }
      )
    }

    const { data: existing } =
      await supabase
        .from('saved_jobs')
        .select('id')
        .eq('user_id', user.id)
        .eq('job_id', job_id)
        .single()

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadySaved: true,
      })
    }

    const { error } = await supabase
      .from('saved_jobs')
      .insert({
        user_id: user.id,
        job_id,
      })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

/* ======================================================
   DELETE → UNSAVE JOB
====================================================== */

export async function DELETE(
  request: Request
) {
  try {
    const supabase =
      await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body =
      await request.json()

    const { job_id } = body

    if (!job_id) {
      return NextResponse.json(
        { error: 'Job ID required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('user_id', user.id)
      .eq('job_id', job_id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}