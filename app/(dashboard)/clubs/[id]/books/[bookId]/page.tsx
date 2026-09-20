import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import RatingButton from '@/components/books/RatingButton'
import ActivityFeed from '@/components/clubs/ActivityFeed'
import { BookCover, Stamp, Avatar, SketchDivider, StarRating, RatingHistogram } from '@/components/ui/dogear'
import { formatReadingTime } from '@/lib/utils/readingTime'
import { getVolume } from '@/lib/api/googleBooks'
import { stripHtml } from '@/lib/utils/stripHtml'
import { formatCategories } from '@/lib/utils/categories'

const STATUS_LABEL = {
  suggested: { text: 'Suggested', variant: 'ink' as const },
  active: { text: '● Now Reading', variant: 'green' as const },
  completed: { text: '✓ Finished', variant: 'brown' as const },
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string; bookId: string }>
}) {
  const { id, bookId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: club } = await supabase
    .from('clubs')
    .select('id, name, admin_id')
    .eq('id', id)
    .single() as { data: any }

  if (!club) notFound()

  // RLS (cb_select) is what hides a secret suggestion from everyone but its
  // suggester and the club admin — a guessed URL returns no row here.
  const { data: book } = await supabase
    .from('club_books')
    .select(`
      *,
      profiles:picked_by (
        id,
        display_name,
        email
      )
    `)
    .eq('id', bookId)
    .single() as { data: any }

  if (!book) notFound()

  // A real book id from another club must not render under this club's header.
  if (book.club_id !== id) notFound()

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

  const { data: ratings } = await supabase
    .from('book_ratings')
    .select('*')
    .eq('book_id', bookId) as { data: any[] }

  const { data: events } = await (supabase
    .from('club_events') as any)
    .select(`
      id,
      event_type,
      payload,
      created_at,
      actor:actor_id (
        id,
        display_name,
        email
      )
    `)
    .eq('book_id', bookId)
    .order('created_at', { ascending: false }) as { data: any[] }

  const ratingRows = ratings || []
  const scores = ratingRows.map((r: any) => r.rating)
  const averageRating = scores.length
    ? scores.reduce((sum: number, n: number) => sum + n, 0) / scores.length
    : undefined
  const currentUserRating = ratingRows.find((r: any) => r.user_id === user.id)?.rating

  // Books suggested before we started persisting metadata have no description —
  // fall back to Google Books, which is cached for a day.
  let description: string = book.description || ''
  let categories: string[] = book.categories || []
  let publishedDate: string | null = book.published_date || null

  if ((!description || categories.length === 0) && book.google_books_id) {
    const volume = await getVolume(book.google_books_id)
    if (volume) {
      if (!description) description = stripHtml(volume.volumeInfo.description)
      if (categories.length === 0) categories = volume.volumeInfo.categories || []
      if (!publishedDate) publishedDate = volume.volumeInfo.publishedDate || null
    }
  }

  // Google's taxonomy paths ("Fiction / Magical Realism") flattened to distinct
  // genre chips, capped so the header doesn't fill with near-duplicates.
  const genres = formatCategories(categories)

  const status = STATUS_LABEL[book.status as keyof typeof STATUS_LABEL] ?? STATUS_LABEL.suggested
  const pickedBy = book.profiles?.display_name || book.profiles?.email || 'someone'
  const memberName = (m: any) => m.profiles?.display_name || m.profiles?.email || '?'

  const verdicts = (members || []).map((m: any) => ({
    id: m.id,
    userId: m.profiles?.id,
    name: memberName(m),
    rating: ratingRows.find((r: any) => r.user_id === m.profiles?.id)?.rating ?? null,
  }))

  return (
    <div>
      <Link href={`/clubs/${id}`} className="eyebrow text-ink-2 no-underline inline-block mb-4">
        ← {club.name}
      </Link>

      {/* Book header */}
      <div className="card py-6 px-6 sm:px-7 mb-6 relative">
        <div className="absolute top-4 right-4">
          <Stamp variant={status.variant} rotate={-3}>{status.text}</Stamp>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 sm:gap-7 items-start">
          <BookCover url={book.cover_url} title={book.title} author={book.author} size="lg" />

          <div className="min-w-0 flex-1">
            <h1 className="h-display text-3xl sm:text-4xl m-0 pr-24" style={{ lineHeight: 1.05 }}>
              {book.title}
            </h1>
            {book.author && (
              <p
                className="text-ink-2 mt-1.5"
                style={{ fontFamily: 'var(--font-roboto-slab)', fontStyle: 'italic', fontSize: 16 }}
              >
                by {book.author}
              </p>
            )}

            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {genres.map((c: string) => (
                  <span
                    key={c}
                    className="label-mono"
                    style={{
                      padding: '3px 8px',
                      border: '1px solid var(--ink-3)',
                      borderRadius: 999,
                      background: 'var(--paper-2)',
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-x-6 gap-y-3 mt-4">
              {book.page_count > 0 && (
                <div>
                  <p className="label-mono mb-1">Length</p>
                  <span style={{ fontSize: 14 }}>{book.page_count} pages</span>
                </div>
              )}
              {book.page_count > 0 && (() => {
                const { read, listen } = formatReadingTime(book.page_count)
                return (
                  <div>
                    <p className="label-mono mb-1">Time</p>
                    <span style={{ fontSize: 14 }}>⏱ {read} · 🎧 {listen}</span>
                  </div>
                )
              })()}
              {publishedDate && (
                <div>
                  <p className="label-mono mb-1">Published</p>
                  <span style={{ fontSize: 14 }}>{publishedDate}</span>
                </div>
              )}
              <div>
                <p className="label-mono mb-1">Suggested by</p>
                <span style={{ fontSize: 14 }}>{pickedBy}</span>
              </div>
              {book.start_date && (
                <div>
                  <p className="label-mono mb-1">Started</p>
                  <span style={{ fontSize: 14 }}>{formatDate(book.start_date)}</span>
                </div>
              )}
              {book.completed_at && (
                <div>
                  <p className="label-mono mb-1">Finished</p>
                  <span style={{ fontSize: 14 }}>{formatDate(book.completed_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <SketchDivider />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mt-6">
        {/* LEFT */}
        <div className="flex flex-col gap-6">
          {/* Blurb */}
          <section className="card p-7">
            <p className="label-mono mb-1">The blurb</p>
            <h2 className="h-section text-xl sm:text-2xl mb-4 mt-0">What it&apos;s about</h2>
            {description ? (
              <div className="text-ink-2" style={{ fontSize: 15, lineHeight: 1.65 }}>
                {description.split('\n\n').map((para, i) => (
                  <p key={i} style={{ marginBottom: 12 }}>{para}</p>
                ))}
              </div>
            ) : (
              <p className="text-ink-3" style={{ fontSize: 13, fontStyle: 'italic' }}>
                No description available for this book.
              </p>
            )}
          </section>

          {/* Verdicts */}
          <section className="card p-7">
            <div className="flex flex-wrap justify-between items-end gap-3 mb-5">
              <div>
                <p className="label-mono mb-1">
                  {ratingRows.length} of {verdicts.length} member{verdicts.length !== 1 ? 's' : ''} rated
                </p>
                <h2 className="h-section text-xl sm:text-2xl m-0">The verdicts</h2>
              </div>
              {averageRating !== undefined && (
                <div className="text-right">
                  <div
                    style={{
                      fontFamily: 'var(--font-roboto-slab)',
                      fontWeight: 800,
                      fontSize: 34,
                      lineHeight: 1,
                    }}
                  >
                    {averageRating.toFixed(1)}
                    <span className="text-ink-3" style={{ fontSize: 16 }}>/10</span>
                  </div>
                  <div className="flex justify-end mt-1">
                    <StarRating rating={averageRating} size={14} />
                  </div>
                </div>
              )}
            </div>

            {ratingRows.length > 0 && (
              <div className="mb-6">
                <RatingHistogram ratings={scores} />
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              {verdicts.map(v => (
                <div key={v.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={v.name} size={32} />
                    <span
                      style={{ fontSize: 13.5, fontWeight: 600 }}
                      className={v.rating === null ? 'text-ink-3' : ''}
                    >
                      {v.name}
                      {v.userId === user.id ? ' (you)' : ''}
                    </span>
                  </div>
                  {v.rating !== null ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StarRating rating={v.rating} size={12} />
                      <span
                        style={{
                          fontFamily: 'var(--font-jetbrains-mono)',
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        {v.rating}/10
                      </span>
                    </div>
                  ) : (
                    <span className="text-ink-3" style={{ fontSize: 12, fontStyle: 'italic' }}>
                      Not rated yet
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-6">
          <section className="card p-6">
            <p className="label-mono mb-1">Your verdict</p>
            <h3 className="h-section text-xl mb-4 mt-0">Rate it</h3>
            <RatingButton
              bookId={book.id}
              clubId={id}
              bookTitle={book.title}
              currentUserRating={currentUserRating}
              averageRating={averageRating}
              totalRatings={ratingRows.length}
            />
          </section>

          <section className="card p-6">
            <p className="label-mono mb-1">This book&apos;s log</p>
            <h3 className="h-section text-xl mb-4 mt-0">History</h3>
            <ActivityFeed events={events || []} />
          </section>
        </div>
      </div>
    </div>
  )
}
