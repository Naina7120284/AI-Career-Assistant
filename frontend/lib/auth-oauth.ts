import { getSafeRedirectPath } from '@/lib/auth-redirect'

/** Cookie used to remember post-login path (OAuth redirect URL must stay query-free for Supabase). */
export const AUTH_NEXT_COOKIE = 'auth_redirect_next'

export function authCallbackUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`
  }
  const site =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000')
  return `${site.replace(/\/$/, '')}/auth/callback`
}

/** Set before OAuth so the callback can redirect without putting ?next= on redirectTo. */
export function setAuthNextCookie(next: string) {
  if (typeof document === 'undefined') return
  const safe = getSafeRedirectPath(next)
  document.cookie = `${AUTH_NEXT_COOKIE}=${encodeURIComponent(safe)}; path=/; max-age=600; SameSite=Lax`
}

export function readAuthNextFromCookie(
  cookieValue: string | undefined,
  searchParam: string | null
): string {
  if (searchParam) return getSafeRedirectPath(searchParam)
  if (!cookieValue) return '/'
  try {
    return getSafeRedirectPath(decodeURIComponent(cookieValue))
  } catch {
    return '/'
  }
}
