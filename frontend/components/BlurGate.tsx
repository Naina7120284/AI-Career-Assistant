'use client'

import { useUser } from '@/hooks/useUser'
import Link from 'next/link'

interface BlurGateProps {
  children: React.ReactNode
  message?: string
  feature?: string
}

export function BlurGate({ children, message, feature }: BlurGateProps) {
  const { isLoggedIn, loading } = useUser()

  if (loading) return <div style={{ minHeight: '200px' }} />

  if (isLoggedIn) return <>{children}</>

  return (
    <div style={{ position: 'relative' }}>
      {/* Blurred content underneath */}
      <div style={{
        filter: 'blur(5px)',
        pointerEvents: 'none',
        userSelect: 'none',
        opacity: 0.6,
      }}>
        {children}
      </div>

      {/* Overlay CTA */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(to bottom, rgba(10,10,15,0.3), rgba(10,10,15,0.85))',
        borderRadius: '12px',
        padding: '1.5rem',
        textAlign: 'center',
      }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #63c2f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', marginBottom: '0.75rem',
          boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
        }}>🔒</div>
        <h3 style={{ color: '#fff', fontWeight: '700', fontSize: '1rem', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
          {message || `Sign in to see your ${feature || 'results'}`}
        </h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.69)', fontSize: '0.8rem', margin: '0 0 1rem', maxWidth: '240px', lineHeight: 1.5 }}>
          Create a free account to unlock your AI-powered career analysis
        </p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/register" style={{
            padding: '0.55rem 1.1rem', borderRadius: '8px', textDecoration: 'none',
            background: 'linear-gradient(135deg, #6563f1, #5cbbf6)',
            color: '#fff', fontWeight: '600', fontSize: '0.8rem',
            boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
          }}>
            Create free account
          </Link>
          <Link href="/login" style={{
            padding: '0.55rem 1.1rem', borderRadius: '8px', textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'black', fontWeight: '500', fontSize: '0.8rem',
            background: 'rgba(255, 255, 255, 0.68)',
          }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}