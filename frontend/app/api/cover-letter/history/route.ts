import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Get logged user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({
        letters: [],
      })
    }

    // Fetch letters
    const { data, error } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(error)

      return NextResponse.json({
        letters: [],
        demo: true,
      })
    }

    return NextResponse.json({
      letters: data || [],
    })

  } catch (error) {
    console.error(error)

    return NextResponse.json({
      letters: [],
      demo: true,
    })
  }
}