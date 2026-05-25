'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { DogearLogo } from '@/components/ui/dogear'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="paper-bg relative" style={{ borderBottom: '1.5px solid var(--ink)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
        <DogearLogo />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <a href="/clubs" className="nav-link eyebrow">My Clubs</a>
          <a href="/join" className="nav-link eyebrow">Join Club</a>
          <div className="w-px h-5 mx-1.5 bg-ink-3 opacity-50" />
          <a href="/settings" className="nav-link eyebrow">Settings</a>
          <button onClick={handleSignOut} className="btn btn-ghost btn-sm">
            Sign Out
          </button>
        </nav>

        {/* Mobile hamburger */}
        <div className="md:hidden">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <>
                  <line x1="3" y1="7" x2="21" y2="7" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="17" x2="21" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden card absolute left-4 right-4 z-50 p-2 flex flex-col gap-1" style={{ top: 'calc(100% + 8px)' }}>
          <a href="/clubs" className="nav-link eyebrow block">My Clubs</a>
          <a href="/join" className="nav-link eyebrow block">Join Club</a>
          <a href="/settings" className="nav-link eyebrow block">Settings</a>
          <div className="h-px bg-ink-3 opacity-30 my-1" />
          <button onClick={handleSignOut} className="btn btn-ghost btn-sm w-full justify-start">
            Sign Out
          </button>
        </div>
      )}
    </header>
  )
}
