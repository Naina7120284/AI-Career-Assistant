import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url)

    const search =
      searchParams.get('search') || ''

    const location =
      searchParams.get('location') || ''

    const type =
      searchParams.get('type') || ''

    const experience =
      searchParams.get('experience') || ''

    const supabase =
      await createServerSupabaseClient()

    let query = supabase
      .from('jobs')
      .select('*')
      .order('created_at', {
        ascending: false,
      })

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,company.ilike.%${search}%`
      )
    }

    if (location) {
      query = query.eq(
        'location',
        location
      )
    }

    if (type) {
      query = query.eq(
        'type',
        type
      )
    }

    if (experience) {
      query = query.eq(
        'experience',
        experience
      )
    }

    const {
      data: jobs,
      error,
    } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      jobs: jobs || [],
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          'Failed to load jobs',
      },
      {
        status: 500,
      }
    )
  }
}