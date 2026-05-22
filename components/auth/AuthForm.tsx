'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { DogearLogo, SketchDivider } from '@/components/ui/dogear'

type AuthFormProps = {
  mode: 'login' | 'signup'
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
            },
          },
        })

        if (error) throw error

        router.push('/clubs')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        router.push('/clubs')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Main form area */}
      <div className="px-6 sm:px-10 pt-8 sm:pt-9 pb-7">
        <DogearLogo />

        <div style={{ marginTop: 28 }}>
          <p className="eyebrow" style={{ marginBottom: 10 }}>
            {mode === 'login' ? '— Welcome back, friend' : '— A book club for slow readers'}
          </p>
          <h1
            className="h-display"
            style={{ fontSize: 36, margin: 0 }}
          >
            {mode === 'login' ? (
              <>Pick up <span className="sketch-underline">where you</span> left off.</>
            ) : (
              <>Make a <span className="sketch-underline">shelf</span> of your own.</>
            )}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-7">
          {mode === 'signup' && (
            <div>
              <label htmlFor="displayName" className="field-label">
                Your Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="field"
                placeholder="Jane Doe"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="field-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="field"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="field-label">
              {mode === 'login' ? 'Password' : 'Password (6+)'}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="field"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div
              style={{
                borderLeft: '3px solid var(--stamp-red)',
                background: 'var(--paper-2)',
                color: 'var(--stamp-red)',
                padding: '10px 14px',
                borderRadius: '0 6px 6px 0',
                fontFamily: 'var(--font-jetbrains-mono)',
                fontSize: 11,
                letterSpacing: '0.04em',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ marginTop: 4, height: 48, width: '100%', fontSize: 15 }}
          >
            {loading
              ? 'Loading…'
              : mode === 'login'
              ? 'Sign in'
              : 'Make my shelf'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div
        className="px-6 sm:px-10 py-5 text-center text-ink-2"
        style={{
          borderTop: '1px dashed var(--ink-3)',
          background: 'var(--paper-2)',
          fontSize: 13,
        }}
      >
        {mode === 'login' ? (
          <>
            New to Dogear?{' '}
            <a
              href="/signup"
              style={{ color: 'var(--brown)', fontWeight: 600, textDecoration: 'underline' }}
            >
              Start a shelf →
            </a>
          </>
        ) : (
          <>
            Already have one?{' '}
            <a
              href="/login"
              style={{ color: 'var(--brown)', fontWeight: 600, textDecoration: 'underline' }}
            >
              Sign in →
            </a>
          </>
        )}
      </div>
    </div>
  )
}
