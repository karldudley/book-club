'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { DogearLogo } from '@/components/ui/dogear'

export default function Navbar() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="paper-bg" style={{ borderBottom: '1.5px solid var(--ink)' }}>
      <div className="max-w-7xl mx-auto px-7 py-3.5 flex justify-between items-center">
        <DogearLogo />
        <nav className="flex items-center gap-1">
          <a
            href="/clubs"
            className="eyebrow"
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              color: 'var(--ink-2)',
              textDecoration: 'none',
              transition: 'color 120ms',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--ink)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--ink-2)')}
          >
            My Clubs
          </a>
          <a
            href="/join"
            className="eyebrow"
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              color: 'var(--ink-2)',
              textDecoration: 'none',
              transition: 'color 120ms',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--ink)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--ink-2)')}
          >
            Join Club
          </a>
          <div
            style={{ width: 1, height: 20, background: 'var(--ink-3)', margin: '0 6px', opacity: 0.5 }}
          />
          <button onClick={handleSignOut} className="btn btn-ghost btn-sm">
            Sign Out
          </button>
        </nav>
      </div>
    </header>
  )
}
