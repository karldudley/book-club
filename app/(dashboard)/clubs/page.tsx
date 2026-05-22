import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookCover, Stamp, SketchDivider } from '@/components/ui/dogear'

export default async function ClubsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get clubs where user is a member
  const { data: memberships } = await supabase
    .from('club_members')
    .select(`
      club_id,
      clubs (
        id,
        name,
        description,
        admin_id
      )
    `)
    .eq('user_id', user.id) as { data: any[] }

  const clubs = memberships?.map((m: any) => m.clubs).filter(Boolean) || []

  return (
    <div>
      {/* Header strip */}
      <div className="mb-10">
        <p className="eyebrow mb-2">Your reading groups</p>
        <div className="flex justify-between items-end gap-4 flex-wrap mb-3">
          <h1 className="h-display text-4xl sm:text-5xl">My Book Clubs</h1>
          <div className="flex gap-3">
            <Link href="/clubs/new" className="btn btn-primary">Start a Club</Link>
            <Link href="/join" className="btn btn-paper">Join with Code</Link>
          </div>
        </div>
        <SketchDivider />
      </div>

      {clubs.length === 0 ? (
        /* Empty state */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
          <Link href="/clubs/new" className="card lift block" style={{ padding: 32, textDecoration: 'none', color: 'inherit', position: 'relative' }}>
            <p className="label-mono" style={{ marginBottom: 8 }}>01 — Start a club</p>
            <h3 className="h-section" style={{ fontSize: 22, margin: '0 0 10px' }}>Open a new shelf</h3>
            <p style={{ fontSize: 13.5, color: 'var(--ink-2)', marginBottom: 20, lineHeight: 1.5 }}>
              You set the cadence, invite friends with a code, and pick the first book.
            </p>
            <span className="btn btn-primary btn-sm">Create Club →</span>
          </Link>
          <Link href="/join" className="card lift block" style={{ padding: 32, textDecoration: 'none', color: 'inherit', background: 'var(--paper-2)' }}>
            <p className="label-mono" style={{ marginBottom: 8 }}>02 — Got an invite?</p>
            <h3 className="h-section" style={{ fontSize: 22, margin: '0 0 10px' }}>Punch in the code</h3>
            <p style={{ fontSize: 13.5, color: 'var(--ink-2)', marginBottom: 20, lineHeight: 1.5 }}>
              Six characters, all caps. Your friend should've sent it your way already.
            </p>
            <span className="btn btn-paper btn-sm">Join with Code →</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club: any) => (
            <Link
              key={club.id}
              href={`/clubs/${club.id}`}
              className="card lift block"
              style={{ padding: 22, textDecoration: 'none', color: 'inherit', position: 'relative', minHeight: 180 }}
            >
              {/* Admin tape decoration */}
              {club.admin_id === user.id && (
                <div style={{ position: 'absolute', top: -10, right: 20, transform: 'rotate(6deg)', zIndex: 1 }}>
                  <div
                    className="tape"
                    style={{ padding: '2px 16px', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 8, fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.18em', textTransform: 'uppercase', lineHeight: '20px' }}
                  >
                    ADMIN
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <BookCover title={club.name} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 className="h-section" style={{ fontSize: 20, margin: 0 }}>{club.name}</h3>
                  {club.description && (
                    <p style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6, lineHeight: 1.5 }}>
                      {club.description}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                {club.admin_id === user.id && (
                  <Stamp variant="brown" rotate={-2}>Admin</Stamp>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
