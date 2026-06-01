import { NextResponse } from 'next/server'

import { createServerSupabaseClient }
from '@/lib/supabase-server'

// =========================
// GET LATEST REVIEW
// =========================
export async function GET() {

  try {

    const supabase =
      await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

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

    const {
      data,
      error,
    } = await supabase

      .from('resume_reviews')

      .select('*')

      .eq('user_id', user.id)

      .order('created_at', {
        ascending: false,
      })

      .limit(1)

      .maybeSingle()

    if (error) {
      throw error
    }

    return NextResponse.json({
      review: data || null,
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

// =========================
// SAVE REVIEW
// =========================
export async function POST(
  req: Request
) {

  try {

    const supabase =
      await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

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

    const body =
      await req.json()

    const {
      ats_score,
      extracted_skills,
      recommended_roles,
    } = body

    const {
      error,
    } = await supabase

      .from('resume_reviews')

      .insert({
        user_id: user.id,

        ats_score,

        extracted_skills,

        recommended_roles,
      })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
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