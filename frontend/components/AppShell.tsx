'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useUser } from '@/hooks/useUser'

import {
  Home,
  MessageSquare,
  FileSearch,
  FileEdit,
  UserCheck,
  Briefcase,
  LineChart,
  Map,
  Bookmark,
  Bell,
  Menu,
  X,
  LogIn,
  LogOut,
} from 'lucide-react'

export default function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, plan, isLoggedIn, loading, signOut } = useUser()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const isAuthPage =
    pathname?.includes('/login') ||
    pathname?.includes('/register') ||
    pathname?.includes('/auth/callback')

  const navLinks = [
    { icon: <Home size={18} />, label: 'Home', path: '/' },
    { icon: <MessageSquare size={18} />, label: 'Career Chat', path: '/career-chat' },
    { icon: <FileSearch size={18} />, label: 'Resume Review', path: '/resume-review' },
    { icon: <FileEdit size={18} />, label: 'Cover Letter', path: '/cover-letter' },
    { icon: <UserCheck size={18} />, label: 'Interview Prep', path: '/interview-prep' },
    { icon: <Briefcase size={18} />, label: 'Job Search', path: '/job-search' },
    { icon: <LineChart size={18} />, label: 'Skills & Growth', path: '/skills-growth' },
    { icon: <Map size={18} />, label: 'Career Roadmap', path: '/career-roadmap' },
    { icon: <Bookmark size={18} />, label: 'Saved', path: '/saved' },
  ]

  const Sidebar = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* LOGO */}
      <div className="px-6 pt-6 pb-5 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF6DA] flex items-center justify-center shadow-sm">
            ✨
          </div>
          <div>
            <h1 className="font-black text-[22px] text-[#111827] leading-none">
              AI Career
            </h1>
            <p className="text-[10px] tracking-[0.22em] text-[#F5A300] font-bold mt-2">
              ASSISTANT
            </p>
          </div>
        </div>
      </div>

      {/* NAVIGATION — scrollable */}
      <div className="flex-1 min-h-0 px-5 space-y-2 overflow-y-auto hide-scrollbar">
        {navLinks.map((item) => {
          const active =
            pathname === item.path ||
            pathname.startsWith(item.path + '/')

          return (
            <button
              key={item.label}
              onClick={() => {
                if (item.path !== '#') {
                  router.push(item.path)
                  setSidebarOpen(false)
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                active
                  ? 'bg-[#EEF4FF] text-[#111827] font-semibold shadow-sm'
                  : 'text-[#667085] hover:bg-[#F8FAFF]'
              }`}
            >
              <div className="opacity-90">{item.icon}</div>
              <span className="text-[14px]">{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* PREMIUM CARD — always at the bottom */}
      <div className="p-5 flex-shrink-0">
        <div className="bg-[#FFF9EE] rounded-[18px] p-1 border border-[#FFE7A3] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-xl bg-[#FFF1BF] flex items-center justify-center flex-shrink-0">
              👑
            </div>
            <h3 className="font-bold text-[#111827] text-[15px] leading-tight">
              Go Premium
            </h3>
          </div>
          <p className="text-[13px] text-[#667085] leading-6">
            Unlock advanced features and expert insights.
          </p>
          <button
            onClick={() => router.push('/upgrade')}
            className="mt-3 w-full h-10 rounded-xl bg-[#FFD95A] font-bold text-[#111827] text-[12px] hover:brightness-95 transition-all shadow-sm"
          >
            UPGRADE NOW
          </button>
        </div>
      </div>
    </div>
  )

  /* AUTH PAGES — no sidebar */
  if (isAuthPage) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* BACKGROUND */}
        <div className="fixed inset-0 -z-50 overflow-hidden">
          <img
  src={
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
      profile?.full_name || user?.email || 'guest'
    )}`
  }
  alt="avatar"
  className="w-11 h-11 rounded-xl object-cover"
  referrerPolicy="no-referrer"
  onError={(e) => {
    const target = e.currentTarget
    target.onerror = null
    target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
      profile?.full_name || user?.email || 'guest'
    )}`
  }}
/>
          <div className="absolute inset-0 bg-white/55 backdrop-blur-[2px]" />
        </div>
        {children}
      </div>
    )
  }

  return (
    <div className="text-[#111827]">
      {/* GLOBAL BACKGROUND */}
      <div className="fixed inset-0 -z-50 overflow-hidden">
        <img
          src="/main-bg.png"
          alt="background"
          className="w-full h-full object-cover opacity-[0.95]"
        />
        {/* WHITE OVERLAY */}
        <div className="absolute inset-0 bg-white/55 backdrop-blur-[2px]" />
      </div>

      <div className="flex h-screen overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:flex w-[260px] bg-white border-r border-[#EEF2FF] flex-col shadow-[0_0_40px_rgba(120,130,160,0.04)]">
          <Sidebar />
        </aside>

        {/* MOBILE OVERLAY */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          />
        )}

        {/* MOBILE SIDEBAR */}
        <aside
          className={`fixed top-0 left-0 z-50 h-full w-[280px] bg-white transition-transform duration-300 lg:hidden ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-5 right-5 z-10"
          >
            <X />
          </button>
          <Sidebar />
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* NAVBAR */}
          <header className="h-[70px] sm:h-[74px] lg:h-[78px] px-4 sm:px-5 lg:px-8 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu />
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 lg:gap-5">
              {/* NOTIFICATION */}
              <div className="relative bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-[#EEF2FF]">
                <Bell size={21} className="text-[#667085]" />
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  3
                </div>
              </div>

              {/* USER CARD */}
              <div className="bg-whitepx-3 lg:px-4 h-12 lg:h-14 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 lg:gap-4 shadow-sm border border-[#EEF2FF] min-w-0">
                <div>
                  <p className="font-bold text-[13px] lg:text-[15px] truncate max-w-[110px]">
                    {loading
                      ? 'Loading...'
                      : (profile?.full_name ||
                          user?.user_metadata?.full_name ||
                          user?.user_metadata?.name ||
                          user?.email ||
                          'Guest')}
                  </p>
                  <p className="text-[9px] lg:text-[11px] text-[#F5A300] font-bold mt-1 truncate">
                    {plan ? `${plan.toUpperCase()} MEMBER` : 'GUEST'}
                  </p>
                </div>

                <img
                  src={
                    profile?.avatar_url ||
                    user?.user_metadata?.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                      profile?.full_name || user?.email || 'guest'
                    )}`
                  }
                  alt="avatar"
                  className="w-9 h-9 sm:w-10 sm:h-10 lg:w-9 lg:h-9 rounded-xl object-cover flex-shrink-0"
                />
              </div>

              {/* LOGIN / LOGOUT BUTTON */}
              {isLoggedIn ? (
                <button
                  type="button"
                  disabled={signingOut}
                  onClick={async () => {
                    setSigningOut(true)
                    try {
                      await signOut()
                      setSidebarOpen(false)
                      router.push('/login')
                      router.refresh()
                    } finally {
                      setSigningOut(false)
                    }
                  }}
                  className="h-10 sm:h-11 lg:h-12 rounded-xl sm:rounded-2xl border border-[#EEF2FF] bg-white px-3 sm:px-4 font-bold text-[#667085] shadow-sm transition hover:bg-[#F8FAFF] hover:text-[#111827] disabled:opacity-60"
                  aria-label="Sign out"
                >
                  <span className="flex items-center gap-2">
                    <LogOut size={18} />
                    <span className="hidden xl:inline">
                      {signingOut ? 'Signing out...' : 'Logout'}
                    </span>
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="h-11 sm:h-12 lg:h-14 rounded-xl sm:rounded-2xl bg-[#FFD95A] px-3 sm:px-4 font-bold text-[#111827] shadow-sm transition hover:brightness-95"
                  aria-label="Sign in"
                >
                  <span className="flex items-center gap-2">
                    <LogIn size={18} />
                    <span className="hidden xl:inline">Login</span>
                  </span>
                </button>
              )}
            </div>
          </header>

          {/* PAGE CONTENT */}
          <main className="flex-1 overflow-y-auto hide-scrollbar px-4 lg:px-8 pb-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
