import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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

    const recommendations =
      body.recommendations || []

    // =========================
    // DELETE OLD RECOMMENDATIONS
    // =========================

    await supabase
      .from('skill_recommendations')
      .delete()
      .eq('user_id', user.id)

    // =========================
    // INSERT NEW RECOMMENDATIONS
    // =========================

    const rows = recommendations.map(
      (recommendation: string) => ({

        user_id: user.id,

        title: recommendation,

      })
    )

    const { error } = await supabase
      .from('skill_recommendations')
      .insert(rows)

    if (error) {

      console.error(error)

      return NextResponse.json(
        {
          error:
            'Failed to save recommendations',
        },
        {
          status: 500,
        }
      )
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