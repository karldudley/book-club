import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { SketchDivider, StatTile, Bookshelf, StarRating, Avatar } from '@/components/ui/dogear'
import LinkPending from '@/components/ui/LinkPending'
import { formatReadingTime } from '@/lib/utils/readingTime'
import { truncateTitle } from '@/lib/utils/truncateTitle'
import {
  buildBookStats,
  buildMemberStats,
  clubTotals,
  highestRated,
  lowestRated,
  mostDivisive,
  mostUnanimous,
  harshestCritic,
  mostGenerous,
  biggestContrarian,
  singleVerdictBooks,
  MIN_RATINGS,
  MIN_RATED,
  type BookStat,
} from '@/lib/utils/clubStats'

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="kraft-bg p-6 text-center rounded-lg"
      style={{ border: '1px dashed var(--ink-3)' }}
    >
      <p className="text-ink-2" style={{ fontSize: 13, fontStyle: 'italic' }}>
        {children}
      </p>
    </div>
  )
}

function BookRankRow({
  stat,
  clubId,
  metric,
  rank,
  last,
}: {
  stat: BookStat
  clubId: string
  metric: React.ReactNode
  rank: number
  last: boolean
}) {
  return (
    <div style={{ borderBottom: last ? 'none' : '1px dashed var(--ink-3)' }}>
      <Link href={`/clubs/${clubId}/books/${stat.id}`} className="row-link" style={{ margin: '4px -10px' }}>
        <span
          className="label-mono flex-shrink-0"
          style={{ width: 18, textAlign: 'right', opacity: 0.6 }}
        >
          {rank}
        </span>
        <div className="flex-1 min-w-0">
          <div
            className="row-link-title"
            style={{ fontFamily: 'var(--font-roboto-slab)', fontWeight: 700, fontSize: 14 }}
          >
            {truncateTitle(stat.title, 34)}
          </div>
          <div className="text-ink-3" style={{ fontSize: 11.5 }}>
            {stat.count} rating{stat.count !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">{metric}</div>
        <LinkPending size={13} />
      </Link>
    </div>
  )
}

function ScoreBadge({ value, suffix = '/10' }: { value: number; suffix?: string }) {
  return (
    <span
      style={{ fontFamily: 'var(--font-roboto-slab)', fontWeight: 800, fontSize: 17 }}
    >
      {value.toFixed(1)}
      <span className="text-ink-3" style={{ fontSize: 11 }}>{suffix}</span>
    </span>
  )
}

function MemberAward({
  title,
  member,
  detail,
}: {
  title: string
  member: { name: string; [k: string]: any } | null
  detail: (m: any) => string
}) {
  return (
    <div className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px dashed var(--ink-3)' }}>
      <div className="flex-1 min-w-0">
        <p className="label-mono mb-1">{title}</p>
        {member ? (
          <div className="flex items-center gap-2">
            <Avatar name={member.name} size={28} />
            <div className="min-w-0">
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{member.name}</div>
              <div className="text-ink-3" style={{ fontSize: 11.5 }}>{detail(member)}</div>
            </div>
          </div>
        ) : (
          <p className="text-ink-3" style={{ fontSize: 12, fontStyle: 'italic' }}>
            Not enough data yet
          </p>
        )}
      </div>
    </div>
  )
}

export default async function StatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: club } = await supabase
    .from('clubs')
    .select('id, name')
    .eq('id', id)
    .single() as { data: any }

  if (!club) notFound()

  const { data: books } = await supabase
    .from('club_books')
    .select('id, title, author, cover_url, page_count, status, completed_at')
    .eq('club_id', id) as { data: any[] }

  const { data: members } = await supabase
    .from('club_members')
    .select(`
      id,
      profiles (
        id,
        display_name,
        email
      )
    `)
    .eq('club_id', id)
    .order('joined_at')

  const bookRows = books || []

  const { data: ratings } = await supabase
    .from('book_ratings')
    .select('book_id, user_id, rating')
    .in('book_id', bookRows.map((b: any) => b.id)) as { data: any[] }

  const ratingRows = ratings || []

  const memberRows = (members || []).map((m: any) => ({
    id: m.profiles?.id,
    name: m.profiles?.display_name || m.profiles?.email || '?',
  }))

  const stats = buildBookStats(bookRows, ratingRows)
  const totals = clubTotals(bookRows, ratingRows)
  const memberStats = buildMemberStats(memberRows, ratingRows)
  const unranked = singleVerdictBooks(bookRows, ratingRows)

  const best = highestRated(stats)
  const worst = lowestRated(stats)
  const divisive = mostDivisive(stats)
  const unanimous = mostUnanimous(stats)

  const completed = bookRows
    .filter((b: any) => b.status === 'completed')
    .sort((a: any, b: any) =>
      new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime()
    )

  const { read, listen } = formatReadingTime(totals.pagesRead)
  const hasRankings = stats.length > 0

  return (
    <div>
      <Link href={`/clubs/${id}`} className="eyebrow text-ink-2 no-underline inline-block mb-4">
        ← {club.name}
      </Link>

      <div className="card py-6 px-6 sm:px-7 mb-6">
        <p className="eyebrow mb-1.5">{club.name}</p>
        <h1 className="h-display text-4xl sm:text-5xl m-0" style={{ lineHeight: 0.95 }}>
          The <span className="sketch-underline">league table</span>
        </h1>
        <p className="text-ink-2 mt-3 max-w-xl" style={{ fontSize: 15, lineHeight: 1.55 }}>
          Every verdict this club has stamped, totted up.
        </p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile label="Books finished" value={totals.booksCompleted} variant="ink" />
        <StatTile label="Pages read" value={totals.pagesRead.toLocaleString('en-GB')} sub={`≈ ${read} of reading`} />
        <StatTile label="As audiobook" value={listen} sub="at 155 wpm" />
        <StatTile
          label="Club average"
          value={totals.clubAverage === null ? '—' : `${totals.clubAverage.toFixed(1)}/10`}
          sub={`${totals.ratingsGiven} rating${totals.ratingsGiven !== 1 ? 's' : ''} given`}
        />
      </div>

      <SketchDivider />

      {/* Shelf */}
      {completed.length > 0 && (
        <section className="card p-7 mt-6">
          <p className="label-mono mb-1">The bookshelf · {completed.length} read{completed.length !== 1 ? 's' : ''}</p>
          <h2 className="h-section text-xl sm:text-2xl mb-5 mt-0">Everything you&apos;ve finished</h2>
          <Bookshelf
            books={completed.map((b: any) => ({
              id: b.id,
              title: b.title,
              author: b.author,
              coverUrl: b.cover_url,
              rating: stats.find(s => s.id === b.id)?.average ?? null,
              href: `/clubs/${id}/books/${b.id}`,
            }))}
          />
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Highest rated */}
        <section className="card p-7">
          <p className="label-mono mb-1">Top of the table</p>
          <h2 className="h-section text-xl sm:text-2xl mb-4 mt-0">Highest rated</h2>
          {hasRankings ? (
            best.map((s, i) => (
              <BookRankRow
                key={s.id}
                stat={s}
                clubId={id}
                rank={i + 1}
                last={i === best.length - 1}
                metric={
                  <div className="flex flex-col items-end gap-0.5">
                    <ScoreBadge value={s.average} />
                    <StarRating rating={s.average} size={11} />
                  </div>
                }
              />
            ))
          ) : (
            <EmptyNote>
              Nothing to rank yet — a book needs {MIN_RATINGS} ratings before it makes the table.
            </EmptyNote>
          )}
        </section>

        {/* Lowest rated */}
        <section className="card p-7">
          <p className="label-mono mb-1">Bottom of the table</p>
          <h2 className="h-section text-xl sm:text-2xl mb-4 mt-0">Lowest rated</h2>
          {hasRankings ? (
            worst.map((s, i) => (
              <BookRankRow
                key={s.id}
                stat={s}
                clubId={id}
                rank={i + 1}
                last={i === worst.length - 1}
                metric={
                  <div className="flex flex-col items-end gap-0.5">
                    <ScoreBadge value={s.average} />
                    <StarRating rating={s.average} size={11} />
                  </div>
                }
              />
            ))
          ) : (
            <EmptyNote>Finish and rate a few books and the wooden spoon will appear here.</EmptyNote>
          )}
        </section>

        {/* Most divisive */}
        <section className="card p-7">
          <p className="label-mono mb-1">Book club arguments</p>
          <h2 className="h-section text-xl sm:text-2xl mb-4 mt-0">Most divisive</h2>
          {hasRankings ? (
            divisive.map((s, i) => (
              <BookRankRow
                key={s.id}
                stat={s}
                clubId={id}
                rank={i + 1}
                last={i === divisive.length - 1}
                metric={
                  <div className="flex flex-col items-end gap-0.5">
                    <span
                      style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, fontSize: 13 }}
                    >
                      {s.min}–{s.max}
                    </span>
                    <span className="label-mono" style={{ fontSize: 9 }}>
                      σ {s.stdDev.toFixed(2)}
                    </span>
                  </div>
                }
              />
            ))
          ) : (
            <EmptyNote>No arguments yet. Give it time.</EmptyNote>
          )}
        </section>

        {/* Most unanimous */}
        <section className="card p-7">
          <p className="label-mono mb-1">Rare agreement</p>
          <h2 className="h-section text-xl sm:text-2xl mb-4 mt-0">Most unanimous</h2>
          {hasRankings ? (
            unanimous.map((s, i) => (
              <BookRankRow
                key={s.id}
                stat={s}
                clubId={id}
                rank={i + 1}
                last={i === unanimous.length - 1}
                metric={
                  <div className="flex flex-col items-end gap-0.5">
                    <ScoreBadge value={s.average} />
                    <span className="label-mono" style={{ fontSize: 9 }}>
                      σ {s.stdDev.toFixed(2)}
                    </span>
                  </div>
                }
              />
            ))
          ) : (
            <EmptyNote>Nothing agreed on yet.</EmptyNote>
          )}
        </section>
      </div>

      {/* Member awards */}
      <section className="card p-7 mt-6">
        <p className="label-mono mb-1">The regulars</p>
        <h2 className="h-section text-xl sm:text-2xl mb-4 mt-0">Member awards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          <MemberAward
            title="Harshest critic"
            member={harshestCritic(memberStats)}
            detail={m => `${m.averageGiven.toFixed(1)}/10 average across ${m.ratedCount} books`}
          />
          <MemberAward
            title="Most generous"
            member={mostGenerous(memberStats)}
            detail={m => `${m.averageGiven.toFixed(1)}/10 average across ${m.ratedCount} books`}
          />
          <MemberAward
            title="Biggest contrarian"
            member={biggestContrarian(memberStats)}
            detail={m => `${m.contrarianScore.toFixed(1)} points off the rest of the club, on average`}
          />
        </div>
        <p className="label-mono mt-4" style={{ opacity: 0.7 }}>
          Rating awards need {MIN_RATED}+ books rated to qualify.
        </p>
      </section>

      {/* Full member table */}
      {memberStats.length > 0 && (
        <section className="card p-7 mt-6">
          <p className="label-mono mb-1">Everyone</p>
          <h2 className="h-section text-xl sm:text-2xl mb-4 mt-0">The full table</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--ink)' }}>
                  <th className="label-mono" style={{ textAlign: 'left', padding: '0 8px 8px 0' }}>Member</th>
                  <th className="label-mono" style={{ textAlign: 'right', padding: '0 8px 8px' }}>Rated</th>
                  <th className="label-mono" style={{ textAlign: 'right', padding: '0 0 8px 8px' }}>Avg given</th>
                </tr>
              </thead>
              <tbody>
                {[...memberStats]
                  .sort((a, b) => b.ratedCount - a.ratedCount)
                  .map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px dashed var(--ink-3)' }}>
                      <td style={{ padding: '9px 8px 9px 0' }}>
                        <div className="flex items-center gap-2">
                          <Avatar name={m.name} size={26} />
                          <span style={{ fontWeight: 600 }}>{m.name}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', padding: '9px 8px', fontFamily: 'var(--font-jetbrains-mono)' }}>
                        {m.ratedCount}
                      </td>
                      <td style={{ textAlign: 'right', padding: '9px 0 9px 8px', fontFamily: 'var(--font-jetbrains-mono)' }}>
                        {m.averageGiven === null ? '—' : m.averageGiven.toFixed(1)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Unranked */}
      {unranked.length > 0 && (
        <section className="card p-7 mt-6">
          <p className="label-mono mb-1">Awaiting a second opinion</p>
          <h2 className="h-section text-xl sm:text-2xl mb-4 mt-0">Only one verdict so far</h2>
          <div className="flex flex-wrap gap-2">
            {unranked.map((b: any) => (
              <Link
                key={b.id}
                href={`/clubs/${id}/books/${b.id}`}
                className="no-underline"
                style={{
                  color: 'inherit',
                  fontSize: 13,
                  padding: '6px 11px',
                  border: '1px solid var(--ink-3)',
                  borderRadius: 999,
                  background: 'var(--paper-2)',
                }}
              >
                {truncateTitle(b.title, 30)}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
