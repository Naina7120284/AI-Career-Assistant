'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import { authCallbackUrl, setAuthNextCookie } from '@/lib/auth-oauth'
import { Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!agreed) {
      setError(
        'Please agree to the Terms of Service and Privacy Policy.'
      )
      return
    }

    setLoading(true)
    setError('')

    // Step 1: Create the account
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Step 2: Upsert profile record
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: email.trim(),
        full_name: fullName,
        plan: 'free',
      })
    }

    // Step 3: Auto sign-in so user doesn't need email verification
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoading(false)

    if (signInError || !signInData.session) {
      // Sign-up worked but auto-login failed (e.g. Supabase requires email confirmation)
      // Show success and redirect to login
      setSuccess(true)
      setError('Account created! Redirecting to sign in...')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
      return
    }

    // Successfully signed in — redirect to dashboard
    setSuccess(true)
    setTimeout(() => {
      router.push('/')
      router.refresh()
    }, 1000)
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    setAuthNextCookie('/')
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8FAFF_0%,#F6F8FF_45%,#FFF8EC_100%)] relative overflow-hidden flex items-center justify-center px-6 py-10">

      {/* OUTER GLOW */}
      <div className="absolute top-[-100px] left-[-100px] w-[420px] h-[320px] bg-[#EAF3FF] rounded-full blur-3xl opacity-70" />

      <div className="absolute bottom-[-120px] right-[-100px] w-[520px] h-[360px] bg-[#FFF1BF] rounded-full blur-3xl opacity-70" />

      <div className="relative z-10 w-full max-w-5xl bg-white/85 backdrop-blur-xl rounded-[38px] overflow-hidden shadow-[0_20px_80px_rgba(80,90,140,0.08)] grid grid-cols-1 lg:grid-cols-2">

        {/* LEFT PANEL */}
        <div className="relative overflow-hidden border-r border-[#EEF2FF]">

          {/* BACKGROUND IMAGE */}
          <img
            src="/bg.png"
            alt="background"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* LIGHT OVERLAY */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />

          {/* CONTENT */}
          <div className="relative z-10 px-10 pt-12 h-full flex flex-col">

            <h1 className="text-[42px] font-black text-[#111827] leading-tight">
              Welcome Back! 👋
            </h1>

            <p className="mt-4 text-[#6B7280] text-[16px] leading-7 max-w-md">
              Sign in or create an account to continue your career growth journey.
            </p>

            <div className="mt-10 space-y-5">
              {[
                'AI-powered career guidance',
                'Smart resume analysis',
                'Personalized recommendations',
                'Interview & job assistance',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-4"
                >
                  <div className="w-6 h-6 rounded-full bg-[#FFD95A] flex items-center justify-center shadow-sm">
                    <svg
                      width="10"
                      height="8"
                      viewBox="0 0 10 8"
                      fill="none"
                    >
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <span className="text-[#4B5563] font-medium text-[15px]">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* ROBOT IMAGE */}
            <div className="relative flex-1 flex items-end justify-center mt-8">

              <img
                src="/robo.png"
                alt="robot"
                className="w-[430px] max-w-full object-contain drop-shadow-[0_20px_40px_rgba(80,90,180,0.12)]"
              />
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="px-10 py-12 flex flex-col justify-center bg-white/70 backdrop-blur-md">

          <h2 className="text-[34px] font-black text-[#111827]">
            Create your account
          </h2>

          <p className="text-[#6B7280] mt-2">
            Enter your details to get started
          </p>

          {success ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-6xl mb-5">🎉</div>

              <h2 className="text-2xl font-black text-[#111827] text-center">
                Account Created!
              </h2>

              <p className="text-[#6B7280] mt-3 text-center px-4 font-medium text-sm leading-relaxed">
                {error || 'Redirecting you...'}
              </p>
            </div>
          ) : (
            <>
              {/* GOOGLE */}
              <button
                type="button"
                disabled={loading}
                onClick={() => void handleGoogle()}
                className="mt-8 h-[58px] border border-[#E5E7EB] rounded-2xl flex items-center justify-center gap-3 font-semibold text-[#111827] hover:border-[#C7D2FE] hover:bg-[#FAFBFF] transition-all disabled:opacity-60"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt=""
                  className="w-5 h-5"
                />

                Continue with Google
              </button>

              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-[1px] bg-[#E5E7EB]" />

                <span className="text-[#9CA3AF] text-sm">
                  or continue with email
                </span>

                <div className="flex-1 h-[1px] bg-[#E5E7EB]" />
              </div>

              <form
                onSubmit={handleRegister}
                className="space-y-5"
              >

                {/* FULL NAME */}
                <div>
                  <label className="text-sm font-semibold text-[#374151] block mb-2">
                    Full Name
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) =>
                      setFullName(e.target.value)
                    }
                    className="w-full h-[58px] rounded-2xl border border-[#E5E7EB] px-5 outline-none focus:border-[#818CF8] bg-[#FCFCFD]"
                  />
                </div>

                {/* EMAIL */}
                <div>
                  <label className="text-sm font-semibold text-[#374151] block mb-2">
                    Email Address
                  </label>

                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    className="w-full h-[58px] rounded-2xl border border-[#E5E7EB] px-5 outline-none focus:border-[#818CF8] bg-[#FCFCFD]"
                  />
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="text-sm font-semibold text-[#374151] block mb-2">
                    Password
                  </label>

                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      className="w-full h-[58px] rounded-2xl border border-[#E5E7EB] px-5 pr-14 outline-none focus:border-[#818CF8] bg-[#FCFCFD]"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {/* PASSWORD CHECKS */}
                  <div className="flex flex-wrap gap-4 mt-4">

                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          password.length >= 8
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                        }`}
                      >
                        {password.length >= 8 && (
                          <svg
                            width="8"
                            height="6"
                            viewBox="0 0 8 6"
                            fill="none"
                          >
                            <path
                              d="M1 3L3 5L7 1"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>

                      <span
                        className={`text-xs ${
                          password.length >= 8
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }`}
                      >
                        At least 8 characters
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          /[0-9!@#$%^&*]/.test(password)
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                        }`}
                      >
                        {/[0-9!@#$%^&*]/.test(password) && (
                          <svg
                            width="8"
                            height="6"
                            viewBox="0 0 8 6"
                            fill="none"
                          >
                            <path
                              d="M1 3L3 5L7 1"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>

                      <span
                        className={`text-xs ${
                          /[0-9!@#$%^&*]/.test(password)
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }`}
                      >
                        Include number or symbol
                      </span>
                    </div>
                  </div>
                </div>

                {/* TERMS */}
                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) =>
                      setAgreed(e.target.checked)
                    }
                    className="mt-1 accent-indigo-500"
                  />

                  <p className="text-sm text-[#6B7280] leading-6">
                    I agree to the{' '}
                    <Link
                      href="/terms"
                      className="text-indigo-500 font-semibold"
                    >
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link
                      href="/privacy"
                      className="text-indigo-500 font-semibold"
                    >
                      Privacy Policy
                    </Link>
                  </p>
                </div>

                {/* ERROR */}
                {error && !success && (
                  <div className="bg-red-50 border border-red-200 text-red-500 rounded-xl p-4 text-sm">
                    {error}
                  </div>
                )}

                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[58px] bg-[#FFD95A] rounded-2xl font-bold text-[#111827] hover:brightness-95 transition-all shadow-lg mt-2"
                >
                  {loading
                    ? 'Creating Account...'
                    : 'Create Account'}
                </button>
              </form>

              <p className="mt-8 text-center text-[#6B7280]">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-indigo-500 font-bold"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
