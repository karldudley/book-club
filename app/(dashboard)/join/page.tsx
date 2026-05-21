import JoinClubForm from '@/components/clubs/JoinClubForm'
import Link from 'next/link'

export default function JoinPage() {
  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <Link
        href="/clubs"
        className="eyebrow"
        style={{ color: 'var(--ink-2)', textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}
      >
        ← Back to clubs
      </Link>

      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>— Got a code from a friend?</p>
        <h1 className="h-display" style={{ fontSize: 44, margin: 0 }}>
          Knock <span className="sketch-underline">knock.</span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 12, lineHeight: 1.5 }}>
          Six characters, all caps. Your friend should've sent it your way already.
        </p>
      </div>

      <JoinClubForm />

      <div style={{ textAlign: 'center', marginTop: 28 }}>
        <Link
          href="/clubs/new"
          className="eyebrow"
          style={{ color: 'var(--ink-2)', textDecoration: 'underline' }}
        >
          Don't have a code? Start your own club →
        </Link>
      </div>
    </div>
  )
}
