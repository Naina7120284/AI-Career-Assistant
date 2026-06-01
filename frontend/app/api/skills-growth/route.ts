// import { NextResponse } from 'next/server'
// import { createServerSupabaseClient } from '@/lib/supabase-server'

// export async function GET() {
//   try {
//     const supabase =
//       await createServerSupabaseClient()

//     const {
//       data: { user },
//     } = await supabase.auth.getUser()

//     // =========================
//     // USER NOT LOGGED IN
//     // =========================
//     if (!user) {
      
//       return NextResponse.json(
//         {
//           error: 'Unauthorized',
//         },
//         {
//           status: 401,
//         }
//       )
//     }

//     // =========================
//     // GET USER SKILLS
//     // =========================
//     const {
//       data: skills,
//       error: skillsError,
//     } = await supabase
//       .from('user_skills')
//       .select('*')
//       .eq('user_id', user.id)
//       .maybeSingle()

//     if (skillsError) {
//       console.error(
//         'Skills Error:',
//         skillsError
//       )
//     }

//     // =========================
//     // GET USER COURSES
//     // =========================
//     const {
//       data: courses,
//       error: coursesError,
//     } = await supabase
//       .from('learning_courses')
//       .select('*')
//       .eq('user_id', user.id)
//       .order('created_at', {
//         ascending: false,
//       })

//     if (coursesError) {
//       console.error(
//         'Courses Error:',
//         coursesError
//       )
//     }

//     // =========================
//     // GET RECOMMENDATIONS
//     // =========================
//     const {
//       data: recommendations,
//       error: recommendationsError,
//     } = await supabase
//       .from('skill_recommendations')
//       .select('*')
//       .eq('user_id', user.id)
//       .order('created_at', {
//         ascending: false,
//       })

//     if (recommendationsError) {
//       console.error(
//         'Recommendations Error:',
//         recommendationsError
//       )
//     }

//     // =========================
//     // RETURN REAL DATA ONLY
//     // =========================
//     return NextResponse.json({
//       success: true,

//       skills: skills || null,

//       courses: courses || [],

//       recommendations:
//         recommendations || [],

//       hasSkills: !!skills,

//       hasCourses:
//         courses && courses.length > 0,

//       hasRecommendations:
//         recommendations &&
//         recommendations.length > 0,
//     })

//   } catch (error) {
//     console.error(error)

//     return NextResponse.json(
//       {
//         error:
//           'Failed to fetch skills data',
//       },
//       {
//         status: 500,
//       }
//     )
//   }
// }

// export async function POST(req: Request) {
//   try {
//     const supabase =
//       await createServerSupabaseClient()

//     const {
//       data: { user },
//     } = await supabase.auth.getUser()

//     // =========================
//     // USER NOT LOGGED IN
//     // =========================
//     if (!user) {
//       return NextResponse.json(
//         {
//           error: 'Unauthorized',
//         },
//         {
//           status: 401,
//         }
//       )
//     }

//     const body = await req.json()

//     const communication =
//       Number(body.communication) || 0

//     const problem_solving =
//       Number(body.problem_solving) || 0

//     const leadership =
//       Number(body.leadership) || 0

//     const technical_skills =
//       Number(body.technical_skills) || 0

//     // =========================
//     // CALCULATE OVERALL SCORE
//     // =========================
//     const overall_score = Math.round(
//       (
//         communication +
//         problem_solving +
//         leadership +
//         technical_skills
//       ) / 4
//     )

//     // =========================
//     // UPSERT USER SKILLS
//     // =========================
//     const { error } = await supabase
//       .from('user_skills')
//       .upsert(
//         {
//           user_id: user.id,

//           communication,

//           problem_solving,

//           leadership,

//           technical_skills,

//           overall_score,
//         },
//         {
//           onConflict: 'user_id',
//         }
//       )

//     if (error) {
//       console.error(error)

//       return NextResponse.json(
//         {
//           error:
//             'Failed to save skills',
//         },
//         {
//           status: 500,
//         }
//       )
//     }

//     // =========================
//     // SUCCESS RESPONSE
//     // =========================
//     return NextResponse.json({
//       success: true,

//       message:
//         'Skills updated successfully',

//       data: {
//         communication,
//         problem_solving,
//         leadership,
//         technical_skills,
//         overall_score,
//       },
//     })

//   } catch (error) {
//     console.error(error)

//     return NextResponse.json(
//       {
//         error:
//           'Internal server error',
//       },
//       {
//         status: 500,
//       }
//     )
//   }
// }

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase =
      await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // =========================
    // USER NOT LOGGED IN
    // =========================
    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      )
    }

    // =========================
    // GET USER SKILLS
    // =========================
    const {
      data: skills,
      error: skillsError,
    } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (skillsError) {
      console.error(
        'Skills Error:',
        skillsError
      )
    }

    // =========================
    // GET USER COURSES
    // =========================
    const {
      data: courses,
      error: coursesError,
    } = await supabase
      .from('learning_courses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', {
        ascending: false,
      })

    if (coursesError) {
      console.error(
        'Courses Error:',
        coursesError
      )
    }

    // =========================
    // GET AI RECOMMENDATIONS
    // FROM RESUMES TABLE
    // =========================
    const {
      data: resume,
      error: resumeError,
    } = await supabase
      .from('resumes')
      .select('ai_suggestions')
      .eq('user_id', user.id)
      .order('created_at', {
        ascending: false,
      })
      .limit(1)
      .maybeSingle()

    if (resumeError) {
      console.error(
        'Resume Error:',
        resumeError
      )
    }

    const recommendations =
      resume?.ai_suggestions || []

    // =========================
    // RETURN DATA
    // =========================
    return NextResponse.json({
      success: true,

      skills: skills || null,

      courses: courses || [],

      recommendations,

      hasSkills: !!skills,

      hasCourses:
        courses &&
        courses.length > 0,

      hasRecommendations:
        recommendations.length > 0,
    })

  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          'Failed to fetch skills data',
      },
      {
        status: 500,
      }
    )
  }
}

export async function POST(req: Request) {
  try {
    const supabase =
      await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // =========================
    // USER NOT LOGGED IN
    // =========================
    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      )
    }

    const body = await req.json()

    const communication =
      Number(body.communication) || 0

    const problem_solving =
      Number(body.problem_solving) || 0

    const leadership =
      Number(body.leadership) || 0

    const technical_skills =
      Number(body.technical_skills) || 0

    // =========================
    // CALCULATE OVERALL SCORE
    // =========================
    const overall_score = Math.round(
      (
        communication +
        problem_solving +
        leadership +
        technical_skills
      ) / 4
    )

    // =========================
    // UPSERT USER SKILLS
    // =========================
    const { error } = await supabase
      .from('user_skills')
      .upsert(
        {
          user_id: user.id,

          communication,

          problem_solving,

          leadership,

          technical_skills,

          overall_score,
        },
        {
          onConflict: 'user_id',
        }
      )

    if (error) {
      console.error(error)

      return NextResponse.json(
        {
          error:
            'Failed to save skills',
        },
        {
          status: 500,
        }
      )
    }

    // =========================
    // SUCCESS RESPONSE
    // =========================
    return NextResponse.json({
      success: true,

      message:
        'Skills updated successfully',

      data: {
        communication,
        problem_solving,
        leadership,
        technical_skills,
        overall_score,
      },
    })

  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          'Internal server error',
      },
      {
        status: 500,
      }
    )
  }
}