'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient, resetClient } from '@/lib/supabase-client'
import type { User } from '@supabase/supabase-js'

export type UserPlan = 'free' | 'pro' | 'admin'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan: UserPlan
  created_at: string
}

export interface UseUserReturn {
  user: User | null
  profile: UserProfile | null
  plan: UserPlan | null
  isAdmin: boolean
  isPro: boolean
  isLoggedIn: boolean
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || ''

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = useCallback(async (userId: string, currentUser?: User) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      // Google OAuth stores photo in avatar_url or picture inside user_metadata
      const metaAvatar =
        currentUser?.user_metadata?.avatar_url ||
        currentUser?.user_metadata?.picture ||
        null

      if (!data.avatar_url && metaAvatar) {
        // Persist it back to the profiles table for future loads
        await supabase
          .from('profiles')
          .update({ avatar_url: metaAvatar })
          .eq('id', userId)

        setProfile({ ...data, avatar_url: metaAvatar } as UserProfile)
      } else {
        setProfile(data as UserProfile)
      }
    }
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id, user)
  }, [user, fetchProfile])

  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        if (session?.user) {
          void fetchProfile(session.user.id, session.user)
        } else {
          setProfile(null)
        }
      } catch {
        setUser(null)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    void getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        void fetchProfile(session.user.id, session.user)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    resetClient()
  }

  const effectivePlan: UserPlan | null = !user
    ? null
    : user.email === ADMIN_EMAIL
    ? 'admin'
    : profile?.plan ?? 'free'

  return {
    user,
    profile,
    plan: effectivePlan,
    isAdmin: effectivePlan === 'admin',
    isPro: effectivePlan === 'pro' || effectivePlan === 'admin',
    isLoggedIn: !!user,
    loading,
    signOut,
    refreshProfile,
  }
}