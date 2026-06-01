import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Quick Supabase smoke test (uses your session cookies).
 *
 * Usage (local): log in at http://localhost:3000, then open:
 *   http://localhost:3000/api/debug/db-check
 *
 * In production this is off unless you set ALLOW_DB_CHECK=true.
 */
const TABLES = [
  'profiles',
  'resumes',
  'cover_letters',
  'saved_jobs',
  'interview_sessions',
  'career_roadmaps',
  'roadmap_steps',
  'saved_items',
  'user_skills',
  'learning_courses',
  'skill_recommendations',
] as const

export async function GET() {
  const allow =
    process.env.NODE_ENV !== 'production' ||
    process.env.ALLOW_DB_CHECK === 'true'

  if (!allow) {
    return NextResponse.json(
      { error: 'Disabled in production. Set ALLOW_DB_CHECK=true to enable.' },
      { status: 404 }
    )
  }

  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()

    if (userErr || !user) {
      return NextResponse.json(
        {
          ok: false,
          hint: 'Sign in at /login, then reload this URL in the same browser.',
          error: 'Not authenticated',
        },
        { status: 401 }
      )
    }

    const tables: Record<
      string,
      { ok: boolean; code?: string; message?: string }
    > = {}

    for (const name of TABLES) {
      const { error } = await supabase
        .from(name)
        .select('*', { count: 'exact', head: true })

      if (error) {
        tables[name] = {
          ok: false,
          code: error.code,
          message: error.message,
        }
      } else {
        tables[name] = { ok: true }
      }
    }

    const failed = Object.entries(tables).filter(([, v]) => !v.ok)

    return NextResponse.json({
      ok: failed.length === 0,
      user: { id: user.id, email: user.email },
      tables,
      summary: {
        passed: Object.values(tables).filter((t) => t.ok).length,
        failed: failed.length,
        failedTables: failed.map(([k]) => k),
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    )
  }
}
