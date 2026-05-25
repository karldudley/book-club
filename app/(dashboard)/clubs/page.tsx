import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookCover, SketchDivider } from '@/components/ui/dogear'

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

  const clubIds = clubs.map((c: any) => c.id)
  const { data: activeBooks } = clubIds.length
    ? await supabase
        .from('club_books')
        .select('club_id, cover_url, title')
        .in('club_id', clubIds)
        .eq('status', 'active')
    : { data: [] }

  const activeCoverByClub: Record<string, string | null> = {}
  for (const book of activeBooks ?? []) {
    activeCoverByClub[(book as any).club_id] = (book as any).cover_url ?? null
  }

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club: any) => (
            <Link
              key={club.id}
              href={`/clubs/${club.id}`}
              className="card lift relative flex flex-col items-center gap-4 p-5 sm:p-6 no-underline text-inherit"
            >
              {club.admin_id === user.id && (
                <div className="absolute -top-2.5 right-5 rotate-6 z-1">
                  <div className="tape px-4 py-0.5 [font-family:var(--font-jetbrains-mono)] text-[8px] font-bold text-ink tracking-[0.18em] uppercase leading-5">
                    ADMIN
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center gap-4 w-full">
                <BookCover title={club.name} url={activeCoverByClub[club.id]} size="lg" />
                <div className="w-full">
                  <h3 className="h-section text-lg m-0 leading-snug">{club.name}</h3>
                  {club.description && (
                    <p className="text-[13px] text-ink-2 mt-1.5 leading-relaxed line-clamp-2">
                      {club.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
