import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BookActions from '@/components/clubs/BookActions'
import ActivateBookButton from '@/components/clubs/ActivateBookButton'
import RatingButton from '@/components/books/RatingButton'
import { BookCover, Stamp, Avatar, StarRating, SketchDivider } from '@/components/ui/dogear'

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
      <Link
        href="/clubs"
        className="eyebrow"
        style={{ color: 'var(--ink-2)', textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}
      >
        ← MY CLUBS
      </Link>

      {/* Club header card */}
      <div className="card" style={{ padding: '24px 28px', marginBottom: 24, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 6 }}>{members?.length || 0} members</p>
            <h1 className="h-display" style={{ fontSize: 48, margin: 0, lineHeight: 0.95 }}>
              {club.name}
            </h1>
            {club.description && (
              <p style={{ fontSize: 15, color: 'var(--ink-2)', marginTop: 12, maxWidth: 540, lineHeight: 1.55 }}>
                {club.description}
              </p>
            )}
            <div style={{ display: 'flex', gap: 24, marginTop: 18, alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <p className="label-mono" style={{ marginBottom: 4 }}>Invite Code</p>
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
              <div style={{ width: 1, height: 40, background: 'var(--ink-3)', opacity: 0.3 }} />
              <div>
                <p className="label-mono" style={{ marginBottom: 4 }}>Cadence</p>
                <span className="h-section" style={{ fontSize: 20 }}>
                  Every {club.schedule_weeks} weeks
                </span>
              </div>
            </div>
          </div>
          {isAdmin && (
            <Stamp variant="brown" rotate={3} style={{ marginTop: 4 }}>You are admin</Stamp>
          )}
        </div>
      </div>

      <SketchDivider />

      {/* 2-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginTop: 24 }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Now Reading */}
          <section className="card" style={{ padding: 28, position: 'relative', overflow: 'visible' }}>
            <div style={{ position: 'absolute', top: 16, right: 18 }}>
              <Stamp variant="green" rotate={-3}>● Now Reading</Stamp>
            </div>
            <p className="label-mono" style={{ marginBottom: 16 }}>Currently active</p>

            {activeBooks.length === 0 ? (
              <div
                className="kraft-bg"
                style={{ padding: '32px 24px', textAlign: 'center', border: '1px dashed var(--ink-3)', borderRadius: 8 }}
              >
                <p className="eyebrow" style={{ marginBottom: 12 }}>No active book yet</p>
                <Link href={`/clubs/${id}/search`} className="btn btn-accent btn-sm">
                  Suggest the first book
                </Link>
              </div>
            ) : (
              activeBooks.map((book: any) => (
                <div key={book.id}>
                  <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                    <BookCover url={book.cover_url} title={book.title} author={book.author} size="lg" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 className="h-display" style={{ fontSize: 32, margin: 0, lineHeight: 1 }}>{book.title}</h2>
                      {book.author && (
                        <p style={{ fontFamily: 'var(--font-roboto-slab)', fontStyle: 'italic', fontSize: 16, color: 'var(--ink-2)', marginTop: 4 }}>
                          by {book.author}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                        <p className="eyebrow">
                          Picked by {book.profiles?.display_name || book.profiles?.email || 'someone'}
                        </p>
                        {book.deadline && (
                          <>
                            <span className="eyebrow" style={{ opacity: 0.4 }}>·</span>
                            <p className="eyebrow">
                              Due {new Date(book.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </>
                        )}
                      </div>
                      <div style={{ marginTop: 18, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <RatingButton
                          bookId={book.id}
                          currentUserRating={book.currentUserRating}
                          averageRating={book.averageRating}
                          totalRatings={book.totalRatings}
                        />
                        <BookActions bookId={book.id} bookStatus={book.status} isAdmin={isAdmin} clubId={id} />
                      </div>
                    </div>
                  </div>
                  {members && members.length > 0 && (
                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed var(--ink-3)' }}>
                      <p className="eyebrow" style={{ marginBottom: 10 }}>Club members</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {members.map((m: any) => (
                          <div
                            key={m.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '6px 10px',
                              border: '1px solid var(--ink-3)', borderRadius: 8,
                              background: 'var(--paper-2)',
                            }}
                          >
                            <Avatar name={memberName(m)} size={22} />
                            <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{memberName(m)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </section>

          {/* Suggestions */}
          <section className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p className="label-mono" style={{ marginBottom: 4 }}>
                  Up next · {suggestedBooks.length} suggestion{suggestedBooks.length !== 1 ? 's' : ''}
                </p>
                <h2 className="h-section" style={{ fontSize: 22, margin: 0 }}>
                  Vote on what's <span className="sketch-underline">next.</span>
                </h2>
              </div>
              <Link href={`/clubs/${id}/search`} className="btn btn-accent btn-sm">
                + Suggest a book
              </Link>
            </div>

            {suggestedBooks.length === 0 ? (
              <p style={{ padding: '12px 0', color: 'var(--ink-3)', fontSize: 13, fontStyle: 'italic' }}>
                No suggestions yet. Be the first to suggest a book.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {suggestedBooks.map((book: any) => {
                  const isUsersBook = book.picked_by === user.id
                  return (
                    <div
                      key={book.id}
                      style={{
                        display: 'flex', gap: 14, alignItems: 'center',
                        padding: '14px 16px',
                        border: '1.5px solid var(--ink-3)',
                        borderRadius: 10,
                        background: isUsersBook ? 'var(--paper-2)' : 'var(--paper)',
                      }}
                    >
                      <BookCover url={book.cover_url} title={book.title} size="sm" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-roboto-slab)', fontWeight: 700, fontSize: 16 }}>
                          {book.title}
                        </div>
                        {book.author && (
                          <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{book.author}</div>
                        )}
                        <p className="eyebrow" style={{ marginTop: 4 }}>
                          Suggested by {book.profiles?.display_name || book.profiles?.email || 'someone'}
                          {isUsersBook ? ' (you)' : ''}
                        </p>
                        {isAdmin && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                            <ActivateBookButton bookId={book.id} clubId={id} scheduleWeeks={club.schedule_weeks} hasActiveBook={activeBooks.length > 0} />
                            <BookActions bookId={book.id} bookStatus={book.status} isAdmin={isAdmin} clubId={id} />
                          </div>
                        )}
                      </div>
                      {isUsersBook && <Stamp variant="ink" rotate={2} style={{ fontSize: 9 }}>Yours</Stamp>}
                    </div>
                  )
                })}
              </div>
            )}

            {isAdmin && suggestedBooks.length > 0 && (
              <div
                style={{
                  marginTop: 16, padding: '12px 14px',
                  border: '1px dashed var(--ink-3)', borderRadius: 8,
                  background: 'var(--paper-2)',
                  display: 'flex', alignItems: 'center', gap: 12, fontSize: 13,
                }}
              >
                <span style={{ fontSize: 18 }}>🗳</span>
                <div>
                  <div style={{ fontWeight: 600 }}>As admin, you activate the next book.</div>
                  <div style={{ color: 'var(--ink-2)', fontSize: 12, marginTop: 2 }}>Click "Activate" on any suggestion above.</div>
                </div>
              </div>
            )}
          </section>

          {/* Past Reads */}
          {completedBooks.length > 0 && (
            <section className="card" style={{ padding: 28 }}>
              <p className="label-mono" style={{ marginBottom: 4 }}>
                The bookshelf · {completedBooks.length} read{completedBooks.length !== 1 ? 's' : ''}
              </p>
              <h2 className="h-section" style={{ fontSize: 22, margin: '0 0 20px' }}>Past reads</h2>
              <div>
                {completedBooks.map((book: any, i: number) => (
                  <div
                    key={book.id}
                    style={{
                      display: 'grid', gridTemplateColumns: 'auto 1fr auto',
                      gap: 14, alignItems: 'center',
                      padding: '12px 6px',
                      borderBottom: i < completedBooks.length - 1 ? '1px dashed var(--ink-3)' : 'none',
                    }}
                  >
                    <BookCover url={book.cover_url} title={book.title} size="sm" />
                    <div>
                      <div style={{ fontFamily: 'var(--font-roboto-slab)', fontWeight: 700, fontSize: 15 }}>{book.title}</div>
                      {book.author && <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{book.author}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      {book.averageRating ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <StarRating rating={book.averageRating} size={12} />
                          <span className="label-mono">{book.averageRating.toFixed(1)}</span>
                        </div>
                      ) : null}
                      <RatingButton bookId={book.id} currentUserRating={book.currentUserRating} averageRating={book.averageRating} totalRatings={book.totalRatings} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Members */}
          <section className="card" style={{ padding: 24 }}>
            <p className="label-mono" style={{ marginBottom: 4 }}>Members · {members?.length || 0}</p>
            <h3 className="h-section" style={{ fontSize: 20, margin: '0 0 16px' }}>The regulars</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {members?.map((m: any) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={memberName(m)} size={34} />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{memberName(m)}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
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
            <button
              className="btn btn-paper btn-sm"
              style={{ width: '100%', marginTop: 18 }}
            >
              Share invite code →
            </button>
          </section>

          {/* Sticky note hint */}
          {!userSuggestion && (
            <div className="sticky" style={{ padding: 18, transform: 'rotate(-1.5deg)' }}>
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
