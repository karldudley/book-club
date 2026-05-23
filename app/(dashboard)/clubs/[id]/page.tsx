import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BookActions from '@/components/clubs/BookActions'
import ActivateBookButton from '@/components/clubs/ActivateBookButton'
import ActivityFeed from '@/components/clubs/ActivityFeed'
import ReadingProgress from '@/components/clubs/ReadingProgress'
import RatingButton from '@/components/books/RatingButton'
import { BookCover, Stamp, Avatar, SketchDivider } from '@/components/ui/dogear'
import { formatReadingTime } from '@/lib/utils/readingTime'

export default async function ClubPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { id } = await Promise.resolve(params)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: club } = await supabase
    .from('clubs')
    .select('*')
    .eq('id', id)
    .single() as { data: any }

  if (!club) {
    notFound()
  }

  const { data: members } = await supabase
    .from('club_members')
    .select(`
      id,
      joined_at,
      profiles (
        id,
        display_name,
        email
      )
    `)
    .eq('club_id', id)
    .order('joined_at')

  const { data: books } = await supabase
    .from('club_books')
    .select(`
      *,
      profiles:picked_by (
        id,
        display_name,
        email
      )
    `)
    .eq('club_id', id)
    .order('created_at', { ascending: false }) as { data: any[] }

  const { data: ratings } = await supabase
    .from('book_ratings')
    .select('*')
    .in('book_id', books?.map((b: any) => b.id) || []) as { data: any[] }

  const activeBookIds = books?.filter((b: any) => b.status === 'active').map((b: any) => b.id) || []
  const { data: progress } = await (supabase
    .from('user_book_progress') as any)
    .select('club_book_id, user_id, status')
    .in('club_book_id', activeBookIds) as { data: any[] }

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
    .eq('club_id', id)
    .order('created_at', { ascending: false })
    .limit(20) as { data: any[] }

  const bookRatings = books?.map((book: any) => {
    const bookRatingsList = ratings?.filter((r: any) => r.book_id === book.id) || []
    const userRating = bookRatingsList.find((r: any) => r.user_id === user.id)
    const avgRating =
      bookRatingsList.length > 0
        ? bookRatingsList.reduce((sum: number, r: any) => sum + r.rating, 0) /
          bookRatingsList.length
        : undefined
    return {
      ...book,
      currentUserRating: userRating?.rating,
      averageRating: avgRating,
      totalRatings: bookRatingsList.length,
    }
  })

  const isAdmin = club.admin_id === user.id
  const activeBooks = bookRatings?.filter((b: any) => b.status === 'active') || []
  const completedBooks = bookRatings?.filter((b: any) => b.status === 'completed') || []
  const suggestedBooks = bookRatings?.filter((b: any) => b.status === 'suggested') || []
  const userSuggestion = suggestedBooks.find((b: any) => b.picked_by === user.id)

  const memberName = (m: any) => m.profiles?.display_name || m.profiles?.email || '?'

  return (
    <div>
      {/* Back nav */}
      <Link href="/clubs" className="eyebrow text-ink-2 no-underline inline-block mb-4">
        ← MY CLUBS
      </Link>

      {/* Club header card */}
      <div className="card py-6 px-6 sm:px-7 mb-6 relative">
        <div className="flex flex-wrap justify-between items-start gap-6">
          <div className="min-w-0 flex-1">
            <p className="eyebrow mb-1.5">{members?.length || 0} members</p>
            <h1
              className="h-display text-4xl sm:text-5xl m-0"
              style={{ lineHeight: 0.95 }}
            >
              {club.name}
            </h1>
            {club.description && (
              <p className="text-ink-2 mt-3 max-w-xl" style={{ fontSize: 15, lineHeight: 1.55 }}>
                {club.description}
              </p>
            )}
            <div className="flex flex-wrap gap-6 mt-4 items-center">
              <div>
                <p className="label-mono mb-1">Invite Code</p>
                <span
                  style={{
                    fontFamily: 'var(--font-jetbrains-mono)',
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    padding: '5px 12px',
                    background: 'var(--paper-2)',
                    border: '1.5px dashed var(--ink)',
                    borderRadius: 6,
                    display: 'inline-block',
                  }}
                >
                  {club.invite_code}
                </span>
              </div>
              <div className="w-px h-10 bg-ink-3 opacity-30" />
              <div>
                <p className="label-mono mb-1">Cadence</p>
                <span className="h-section text-xl">Every {club.schedule_weeks} weeks</span>
              </div>
            </div>
          </div>
          {isAdmin && (
            <Stamp variant="brown" rotate={3} style={{ marginTop: 4 }}>You are admin</Stamp>
          )}
        </div>
      </div>

      <SketchDivider />

      {/* 2-column layout — stacks on mobile, side-by-side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mt-6">

        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6">

          {/* Now Reading */}
          <section className="card p-7 relative overflow-visible">
            <div className="absolute top-4 right-4">
              <Stamp variant="green" rotate={-3}>● Now Reading</Stamp>
            </div>
            <p className="label-mono mb-1">Currently active</p>
            <h2 className="h-section text-xl sm:text-2xl mb-5 mt-0">Now reading</h2>

            {activeBooks.length === 0 ? (
              <div
                className="kraft-bg p-8 text-center rounded-lg"
                style={{ border: '1px dashed var(--ink-3)' }}
              >
                <p className="eyebrow mb-3">No active book yet</p>
                <Link href={`/clubs/${id}/search`} className="btn btn-accent btn-sm">
                  Suggest the first book
                </Link>
              </div>
            ) : (
              activeBooks.map((book: any) => (
                <div key={book.id}>
                  <div className="flex gap-4 sm:gap-6 items-start">
                    <BookCover url={book.cover_url} title={book.title} author={book.author} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h2 className="h-display text-2xl sm:text-3xl m-0 leading-tight">{book.title}</h2>
                      {book.author && (
                        <p className="text-ink-2 mt-1" style={{ fontFamily: 'var(--font-roboto-slab)', fontStyle: 'italic', fontSize: 16 }}>
                          by {book.author}
                        </p>
                      )}
                      {book.page_count && (() => {
                        const { read, listen } = formatReadingTime(book.page_count)
                        return (
                          <p className="label-mono mt-2">
                            ⏱ {read} read · 🎧 {listen} listen
                          </p>
                        )
                      })()}
                      <div className="flex flex-wrap gap-3 mt-2">
                        <p className="eyebrow">
                          Picked by {book.profiles?.display_name || book.profiles?.email || 'someone'}
                        </p>
                        {book.deadline && (
                          <>
                            <span className="eyebrow opacity-40">·</span>
                            <p className="eyebrow">
                              Due {new Date(book.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 items-center mt-4">
                        <RatingButton
                          bookId={book.id}
                          clubId={id}
                          bookTitle={book.title}
                          currentUserRating={book.currentUserRating}
                          averageRating={book.averageRating}
                          totalRatings={book.totalRatings}
                        />
                      </div>
                    </div>
                  </div>
                  {members && members.length > 0 && (
                    <div className="mt-5 pt-4" style={{ borderTop: '1px dashed var(--ink-3)' }}>
                      <ReadingProgress
                        bookId={book.id}
                        members={members as any}
                        progressRows={progress?.filter((p: any) => p.club_book_id === book.id) || []}
                        currentUserId={user.id}
                      />
                    </div>
                  )}
                  {isAdmin && (
                    <div
                      className="flex items-center justify-between gap-3 mt-5 pt-4"
                      style={{ borderTop: '1px dashed var(--ink-3)' }}
                    >
                      <p className="eyebrow">Admin</p>
                      <BookActions bookId={book.id} bookTitle={book.title} bookStatus={book.status} isAdmin={isAdmin} clubId={id} />
                    </div>
                  )}
                </div>
              ))
            )}
          </section>

          {/* Suggestions */}
          <section className="card p-7">
            <div className="flex flex-wrap justify-between items-end gap-3 mb-5">
              <div>
                <p className="label-mono mb-1">
                  Up next · {suggestedBooks.length} suggestion{suggestedBooks.length !== 1 ? 's' : ''}
                </p>
                <h2 className="h-section text-xl sm:text-2xl m-0">
                  What shall we <span className="sketch-underline">read next?</span>
                </h2>
              </div>
              <Link href={`/clubs/${id}/search`} className="btn btn-accent btn-sm">
                + Suggest a book
              </Link>
            </div>

            {suggestedBooks.length === 0 ? (
              <p className="text-ink-3 py-3" style={{ fontSize: 13, fontStyle: 'italic' }}>
                No suggestions yet. Be the first to suggest a book.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {suggestedBooks.map((book: any) => {
                  const isUsersBook = book.picked_by === user.id
                  const isMystery = book.is_secret && !isUsersBook
                  return (
                    <div
                      key={book.id}
                      className="flex gap-3 sm:gap-4 items-center"
                      style={{
                        padding: '14px 16px',
                        border: `1.5px solid ${isMystery ? 'var(--ink)' : 'var(--ink-3)'}`,
                        borderRadius: 10,
                        background: isUsersBook ? 'var(--paper-2)' : isMystery ? 'var(--kraft)' : 'var(--paper)',
                      }}
                    >
                      {isMystery ? (
                        <div
                          style={{
                            width: 40, height: 56, flexShrink: 0,
                            background: 'var(--ink)', borderRadius: 4,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--paper)', fontFamily: 'var(--font-roboto-slab)',
                            fontWeight: 700, fontSize: 20,
                          }}
                        >
                          ?
                        </div>
                      ) : (
                        <BookCover url={book.cover_url} title={book.title} size="sm" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div style={{ fontFamily: 'var(--font-roboto-slab)', fontWeight: 700, fontSize: 16 }}>
                          {isMystery ? 'Secret suggestion' : book.title}
                        </div>
                        {!isMystery && book.author && (
                          <div className="text-ink-2" style={{ fontSize: 13 }}>{book.author}</div>
                        )}
                        {!isMystery && book.page_count && (() => {
                          const { read, listen } = formatReadingTime(book.page_count)
                          return (
                            <p className="label-mono mt-1" style={{ fontSize: 9 }}>
                              ⏱ {read} · 🎧 {listen}
                            </p>
                          )
                        })()}
                        <p className="eyebrow mt-1">
                          Suggested by {book.profiles?.display_name || book.profiles?.email || 'someone'}
                          {isUsersBook ? ' (you)' : ''}
                        </p>
                        {isAdmin && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            <ActivateBookButton
                              bookId={book.id}
                              clubId={id}
                              scheduleWeeks={club.schedule_weeks}
                              hasActiveBook={activeBooks.length > 0}
                              bookTitle={isMystery ? 'this book' : book.title}
                              isSecret={book.is_secret}
                            />
                            <BookActions bookId={book.id} bookTitle={book.title} bookStatus={book.status} isAdmin={isAdmin} clubId={id} />
                          </div>
                        )}
                      </div>
                      {isUsersBook && book.is_secret
                        ? <Stamp variant="ink" rotate={2} style={{ fontSize: 9 }}>Secret</Stamp>
                        : isUsersBook
                        ? <Stamp variant="ink" rotate={2} style={{ fontSize: 9 }}>Yours</Stamp>
                        : null}
                    </div>
                  )
                })}
              </div>
            )}

            {isAdmin && suggestedBooks.length > 0 && (
              <div
                className="flex items-center gap-3 mt-4"
                style={{
                  padding: '12px 14px',
                  border: '1px dashed var(--ink-3)',
                  borderRadius: 8,
                  background: 'var(--paper-2)',
                  fontSize: 13,
                }}
              >
                <span style={{ fontSize: 18 }}>🗳</span>
                <div>
                  <div style={{ fontWeight: 600 }}>As admin, you activate the next book.</div>
                  <div className="text-ink-2 mt-0.5" style={{ fontSize: 12 }}>Click &quot;Activate&quot; on any suggestion above.</div>
                </div>
              </div>
            )}
          </section>

          {/* Past Reads */}
          {completedBooks.length > 0 && (
            <section className="card p-7">
              <p className="label-mono mb-1">
                The bookshelf · {completedBooks.length} read{completedBooks.length !== 1 ? 's' : ''}
              </p>
              <h2 className="h-section text-xl sm:text-2xl mb-5 mt-0">Past reads</h2>
              <div>
                {completedBooks.map((book: any, i: number) => (
                  <div
                    key={book.id}
                    className="grid gap-3 sm:gap-4 items-center py-3"
                    style={{
                      gridTemplateColumns: 'auto 1fr auto',
                      borderBottom: i < completedBooks.length - 1 ? '1px dashed var(--ink-3)' : 'none',
                    }}
                  >
                    <BookCover url={book.cover_url} title={book.title} size="sm" />
                    <div>
                      <div style={{ fontFamily: 'var(--font-roboto-slab)', fontWeight: 700, fontSize: 15 }}>{book.title}</div>
                      {book.author && <div className="text-ink-2" style={{ fontSize: 12 }}>{book.author}</div>}
                      {book.page_count && (() => {
                        const { read } = formatReadingTime(book.page_count)
                        return <p className="label-mono mt-0.5" style={{ fontSize: 9 }}>⏱ {read}</p>
                      })()}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <RatingButton bookId={book.id} clubId={id} bookTitle={book.title} currentUserRating={book.currentUserRating} averageRating={book.averageRating} totalRatings={book.totalRatings} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {/* Activity Feed */}
          <section className="card p-7">
            <p className="label-mono mb-1">Club log</p>
            <h2 className="h-section text-xl sm:text-2xl mb-5 mt-0">Recent activity</h2>
            <ActivityFeed events={events || []} />
          </section>

        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">

          {/* Members */}
          <section className="card p-6">
            <p className="label-mono mb-1">Members · {members?.length || 0}</p>
            <h3 className="h-section text-xl mb-4 mt-0">The regulars</h3>
            <div className="flex flex-col gap-2.5">
              {members?.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={memberName(m)} size={34} />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{memberName(m)}</div>
                      <div className="text-ink-3" style={{ fontSize: 11.5 }}>
                        {club.admin_id === m.profiles?.id ? 'Admin · founder' : 'Member'}
                      </div>
                    </div>
                  </div>
                  {club.admin_id === m.profiles?.id && (
                    <Stamp variant="brown" rotate={2} style={{ fontSize: 9 }}>Admin</Stamp>
                  )}
                </div>
              ))}
            </div>
            <button className="btn btn-paper btn-sm w-full mt-4">
              Share invite code →
            </button>
          </section>

          {/* Sticky note hint */}
          {!userSuggestion && (
            <div className="sticky max-w-full overflow-hidden" style={{ padding: 18, transform: 'rotate(-1.5deg)' }}>
              <div style={{ fontFamily: 'var(--font-caveat)', fontSize: 17, lineHeight: 1.4, color: 'var(--ink)' }}>
                Haven't suggested a book yet? The queue is open.
              </div>
              <Link
                href={`/clubs/${id}/search`}
                style={{
                  fontFamily: 'var(--font-caveat)', fontSize: 14,
                  color: 'var(--brown)', textDecoration: 'underline',
                  display: 'block', marginTop: 8,
                }}
              >
                Suggest one now →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
