import CreateClubForm from '@/components/clubs/CreateClubForm'
import Link from 'next/link'

export default function NewClubPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href="/clubs"
        className="eyebrow"
        style={{ color: 'var(--ink-2)', textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}
      >
        ← Back to clubs
      </Link>

      <div style={{ marginBottom: 32 }}>
        <p className="eyebrow" style={{ marginBottom: 8 }}>New reading group</p>
        <h1 className="h-display" style={{ fontSize: 44, margin: 0 }}>
          Open a <span className="sketch-underline">new shelf.</span>
        </h1>
        <p style={{ fontSize: 14.5, color: 'var(--ink-2)', marginTop: 14, lineHeight: 1.55, maxWidth: 460 }}>
          Three quick decisions. You can change everything later, except the name (and even then you probably can).
        </p>
      </div>

      <CreateClubForm />
    </div>
  )
}
