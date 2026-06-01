import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  AUTH_NEXT_COOKIE,
  readAuthNextFromCookie,
} from '@/lib/auth-oauth'

function loginErrorRedirect(
  origin: string,
  reason: string
): NextResponse {
  const url = new URL('/login', origin)
  url.searchParams.set('error', 'auth')
  url.searchParams.set('reason', reason.slice(0, 300))
  return NextResponse.redirect(url.toString())
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  const cookieStore = await cookies()
  const next = readAuthNextFromCookie(
    cookieStore.get(AUTH_NEXT_COOKIE)?.value,
    searchParams.get('next')
  )

  const oauthProviderError =
    searchParams.get('error_description') || searchParams.get('error')
  if (!code && oauthProviderError) {
    return loginErrorRedirect(origin, oauthProviderError)
  }

  if (!code) {
    return loginErrorRedirect(
      origin,
      'No authorization code returned. Check Google provider and redirect URLs in Supabase.'
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return loginErrorRedirect(
      origin,
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    )
  }

  let response = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('exchangeCodeForSession:', error.message)
    return loginErrorRedirect(origin, error.message)
  }

  if (!data.user) {
    return loginErrorRedirect(origin, 'Sign-in completed but no user was returned.')
  }

  const { user } = data
  const fullName =
    user.user_metadata?.full_name || user.user_metadata?.name || ''
  const avatarUrl = user.user_metadata?.avatar_url || ''

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      email: user.email,
      full_name: fullName,
      avatar_url: avatarUrl,
      plan: 'free',
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    console.warn('Profile upsert (non-fatal):', profileError.message)
  }

  response.cookies.delete(AUTH_NEXT_COOKIE)
  return response
}
