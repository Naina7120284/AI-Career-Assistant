'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import { getSafeRedirectPath } from '@/lib/auth-redirect'
import { authCallbackUrl, setAuthNextCookie } from '@/lib/auth-oauth'
import { Eye, EyeOff } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailUnconfirmed, setEmailUnconfirmed] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const next = getSafeRedirectPath(searchParams.get('next'))

  const supabase = createClient()

  useEffect(() => {
    const oauthError = searchParams.get('error')
    const reason = searchParams.get('reason')
    if (reason) {
      setError(decodeURIComponent(reason))
    } else if (oauthError === 'auth') {
      setError(
        'Google sign-in failed. In Supabase: Authentication → URL Configuration, add redirect URL http://localhost:3000/auth/callback (and enable Google under Providers).'
      )
    } else if (oauthError === 'callback') {
      setError('An authentication error occurred. Please try again.')
    }
  }, [searchParams])

  const handleResendVerification = async () => {
    setResendSent(false)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
    })
    if (!error) {
      setResendSent(true)
      setError('')
    } else {
      setError('Could not resend email: ' + error.message)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setEmailUnconfirmed(false)
    setResendSent(false)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed') ||
          error.message.toLowerCase().includes('email_not_confirmed')) {
        setEmailUnconfirmed(true)
        setError('Your email address is not verified yet.')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    if (!data.session) {
      setError('Sign-in did not create a session. Try again or reset your password.')
      setLoading(false)
      return
    }

    router.push(next)
    router.refresh()
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    setAuthNextCookie(next)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: authCallbackUrl(),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8FAFF_0%,#F6F8FF_45%,#FFF8EC_100%)] relative overflow-hidden flex items-center justify-center px-3 py-5">

      {/* OUTER GLOWS */}
      <div className="absolute top-[-100px] left-[-100px] w-[320px] h-[250px] bg-[#EAF3FF] rounded-full blur-3xl opacity-70" />
      <div className="absolute bottom-[-120px] right-[-100px] w-[420px] h-[300px] bg-[#FFF1BF] rounded-full blur-3xl opacity-70" />

      {/* MAIN CARD */}
      <div className="relative z-10 w-full max-w-4xl bg-white/85 backdrop-blur-xl rounded-[28px] overflow-hidden shadow-[0_20px_80px_rgba(80,90,140,0.08)] grid grid-cols-1 lg:grid-cols-2">

        {/* LEFT PANEL */}
        <div className="relative overflow-hidden border-r border-[#EEF2FF]">
          {/* BG IMAGE */}
          <img
            src="/bg.png"
            alt="background"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* SOFT OVERLAY */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />

          {/* CONTENT */}
          <div className="relative z-10 px-8 pt-8 h-full flex flex-col">
            <h1 className="text-[28px] font-black text-[#111827] leading-tight">
              Welcome Back! 👋
            </h1>
            <p className="mt-4 text-[#6B7280] text-[14px] leading-6 max-w-md">
              Sign in to continue your career journey
            </p>

            <div className="mt-5 space-y-4">
              {[
                'AI-powered career guidance',
                'Smart resume analysis',
                'Personalized recommendations',
                'Interview & job assistance',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#FFD95A] flex items-center justify-center shadow-sm">
                    <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-[#4B5563] font-medium text-[14px]">{item}</span>
                </div>
              ))}
            </div>

            {/* ROBOT IMAGE */}
            <div className="relative flex-1 flex items-end justify-center mt-8">
              <img
                src="/robo.png"
                alt="robot"
                className="w-[320px] max-w-full object-contain drop-shadow-[0_20px_40px_rgba(80,90,180,0.12)]"
              />
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="px-8 py-8 flex flex-col justify-center bg-white/70 backdrop-blur-md">
          <h2 className="text-[20px] font-black text-[#111827]">
            Sign in to your account
          </h2>
          <p className="text-[#6B7280] text-[14px] mt-1">
            Enter your details to access your account
          </p>

          {/* GOOGLE */}
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleGoogle()}
            className="mt-7 h-[38px] border border-[#E5E7EB] rounded-xl text-sm flex items-center justify-center gap-3 font-semibold text-[#111827] hover:border-[#C7D2FE] hover:bg-[#FAFBFF] transition-all w-full disabled:opacity-60"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt=""
              className="w-5 h-5"
            />
            Continue with Google
          </button>

          {/* DIVIDER */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-[1px] bg-[#E5E7EB]" />
            <span className="text-[#9CA3AF] text-sm">or continue with email</span>
            <div className="flex-1 h-[1px] bg-[#E5E7EB]" />
          </div>

          {/* FORM */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* EMAIL */}
            <div>
              <label className="text-sm font-semibold text-[#374151] block mb-2">
                Email address
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[40px] rounded-xl text-sm border border-[#E5E7EB] px-4 outline-none focus:border-[#818CF8] bg-[#FCFCFD]"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-[#374151]">Password</label>
                <Link href="/forgot-password" className="text-sm text-[#F5A300] font-semibold">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[40px] rounded-xl text-sm border border-[#E5E7EB] px-4 pr-12 outline-none focus:border-[#818CF8] bg-[#FCFCFD]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* REMEMBER */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-[#F5C94A] w-4 h-4"
              />
              <span className="text-[#6B7280] text-sm">Remember me</span>
            </div>

            {/* ERROR */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
                <p>{error}</p>
                {emailUnconfirmed && (
                  <div className="mt-3">
                    {resendSent ? (
                      <p className="text-green-600 font-semibold">✓ Verification email sent! Check your inbox.</p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleResendVerification()}
                        className="mt-1 underline font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        Resend verification email
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[40px] bg-[#FFD95A] rounded-xl text-sm font-bold text-[#111827] hover:brightness-95 transition-all shadow-lg disabled:opacity-60"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* FOOTER */}
          <p className="mt-6 text-center text-[#6B7280]">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#F5A300] font-bold">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
