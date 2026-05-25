'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DogearLogo, SketchDivider } from '@/components/ui/dogear'

type AuthFormProps = {
  mode: 'login' | 'signup'
  initialError?: string
}

export default function AuthForm({ mode, initialError }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(initialError ?? null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: displayName ? { display_name: displayName } : undefined,
        },
      })

      if (error) throw error
      setSent(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="px-6 sm:px-10 pt-8 sm:pt-9 pb-7 text-center">
          <DogearLogo />
          <div style={{ marginTop: 28 }}>
            <p className="eyebrow" style={{ marginBottom: 10 }}>— Check your inbox</p>
            <h1 className="h-display" style={{ fontSize: 32, margin: 0 }}>
              Magic link on its way.
            </h1>
            <p className="text-ink-2" style={{ marginTop: 16, fontSize: 14, lineHeight: 1.6 }}>
              We sent a login link to <strong>{email}</strong>.<br />
              Click it to continue — no password needed.
            </p>
          </div>
        </div>
        <div
          className="px-6 sm:px-10 py-5 text-center text-ink-2"
          style={{ borderTop: '1px dashed var(--ink-3)', background: 'var(--paper-2)', fontSize: 13 }}
        >
          Didn&apos;t get it?{' '}
          <button
            onClick={() => setSent(false)}
            style={{ color: 'var(--brown)', fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
          >
            Try again →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="px-6 sm:px-10 pt-8 sm:pt-9 pb-7">
        <DogearLogo />

        <div style={{ marginTop: 28 }}>
          <p className="eyebrow" style={{ marginBottom: 10 }}>
            {mode === 'login' ? '— Welcome back, friend' : '— A book club for slow readers'}
          </p>
          <h1 className="h-display" style={{ fontSize: 36, margin: 0 }}>
            {mode === 'login' ? (
              <>Pick up <span className="sketch-underline">where you</span> left off.</>
            ) : (
              <>Make a <span className="sketch-underline">shelf</span> of your own.</>
            )}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-7">
          <div>
            <label htmlFor="displayName" className="field-label">
              Your Name <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>(new members)</span>
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="field"
              placeholder="Jane Doe"
            />
          </div>

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
            {loading ? 'Sending…' : 'Send magic link →'}
          </button>
        </form>
      </div>

      <div
        className="px-6 sm:px-10 py-5 text-center text-ink-2"
        style={{ borderTop: '1px dashed var(--ink-3)', background: 'var(--paper-2)', fontSize: 13 }}
      >
        {mode === 'login' ? (
          <>
            New to Dogear?{' '}
            <a href="/signup" style={{ color: 'var(--brown)', fontWeight: 600, textDecoration: 'underline' }}>
              Start a shelf →
            </a>
          </>
        ) : (
          <>
            Already have one?{' '}
            <a href="/login" style={{ color: 'var(--brown)', fontWeight: 600, textDecoration: 'underline' }}>
              Sign in →
            </a>
          </>
        )}
      </div>
    </div>
  )
}
