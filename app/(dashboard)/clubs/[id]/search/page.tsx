'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BookSearch from '@/components/books/BookSearch'
import { GoogleBook } from '@/lib/api/googleBooks'
import { formatReadingTime } from '@/lib/utils/readingTime'
import { createClient } from '@/lib/supabase/client'
import { use } from 'react'
import { BookCover, Stamp } from '@/components/ui/dogear'

export default function SearchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [selectedBook, setSelectedBook] = useState<GoogleBook | null>(null)
  const [isSecret, setIsSecret] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  if (selectedBook) {
    setTimeout(() => {
      document.getElementById('confirmation-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleAddBook = async () => {
    if (!selectedBook) return

    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { data: existingSuggestion } = await supabase
        .from('club_books')
        .select('id')
        .eq('club_id', id)
        .eq('picked_by', user.id)
        .eq('status', 'suggested')
        .single() as { data: any }

      const title = selectedBook.volumeInfo.title
      let bookId: string

      if (existingSuggestion) {
        const { error: updateError } = await (supabase
          .from('club_books') as any)
          .update({
            google_books_id: selectedBook.id,
            title,
            author: selectedBook.volumeInfo.authors?.join(', ') || null,
            cover_url: selectedBook.volumeInfo.imageLinks?.thumbnail || null,
            page_count: selectedBook.volumeInfo.pageCount ?? null,
            is_secret: isSecret,
          })
          .eq('id', existingSuggestion.id)

        if (updateError) throw updateError
        bookId = existingSuggestion.id
      } else {
        const { data: inserted, error: insertError } = await (supabase
          .from('club_books') as any)
          .insert({
            club_id: id,
            google_books_id: selectedBook.id,
            title,
            author: selectedBook.volumeInfo.authors?.join(', ') || null,
            cover_url: selectedBook.volumeInfo.imageLinks?.thumbnail || null,
            page_count: selectedBook.volumeInfo.pageCount ?? null,
            picked_by: user.id,
            status: 'suggested',
            is_secret: isSecret,
            start_date: null,
            deadline: null,
          })
          .select('id')
          .single()

        if (insertError) throw insertError
        bookId = inserted.id
      }

      await (supabase.from('club_events') as any).insert({
        club_id: id,
        actor_id: user.id,
        event_type: 'book_suggested',
        book_id: bookId,
        payload: isSecret ? { is_secret: true } : { book_title: title, is_secret: false },
      })

      router.push(`/clubs/${id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Link
        href={`/clubs/${id}`}
        className="eyebrow"
        style={{ color: 'var(--ink-2)', textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}
      >
        ← Back to club
      </Link>

      <div style={{ marginBottom: 28 }}>
        <p className="eyebrow" style={{ marginBottom: 8 }}>Suggest a book</p>
        <h1 className="h-display" style={{ fontSize: 44, margin: 0 }}>
          What do you <span className="sketch-underline">want us</span> to read?
        </h1>
      </div>

      <BookSearch onSelectBook={setSelectedBook} selectedBookId={selectedBook?.id} />

      {selectedBook && (
        <div id="confirmation-section" className="card" style={{ padding: 28, marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <p className="label-mono" style={{ marginBottom: 4 }}>Confirm selection</p>
              <h2 className="h-section" style={{ fontSize: 22, margin: 0 }}>Suggest this book?</h2>
            </div>
            <Stamp variant="green" rotate={-3}>Selected</Stamp>
          </div>

          <div style={{ display: 'flex', gap: 20 }}>
            <BookCover
              url={selectedBook.volumeInfo.imageLinks?.thumbnail}
              title={selectedBook.volumeInfo.title}
              size="lg"
            />
            <div>
              <h3
                style={{ fontFamily: 'var(--font-roboto-slab)', fontWeight: 700, fontSize: 22, margin: 0, lineHeight: 1.1 }}
              >
                {selectedBook.volumeInfo.title}
              </h3>
              {selectedBook.volumeInfo.authors && (
                <p style={{ fontFamily: 'var(--font-roboto-slab)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-2)', marginTop: 4 }}>
                  by {selectedBook.volumeInfo.authors.join(', ')}
                </p>
              )}
              {selectedBook.volumeInfo.publishedDate && (
                <p className="eyebrow" style={{ marginTop: 8 }}>
                  {selectedBook.volumeInfo.publishedDate.slice(0, 4)}
                  {selectedBook.volumeInfo.pageCount ? ` · ${selectedBook.volumeInfo.pageCount} pp` : ''}
                </p>
              )}
              {(selectedBook.volumeInfo.pageCount ?? 0) > 0 && (() => {
                const { read, listen } = formatReadingTime(selectedBook.volumeInfo.pageCount!)
                return (
                  <p className="label-mono" style={{ marginTop: 8 }}>
                    ⏱ {read} read · 🎧 {listen} listen
                  </p>
                )
              })()}
              {selectedBook.volumeInfo.description && (
                <p
                  style={{
                    fontSize: 13, color: 'var(--ink-2)', marginTop: 12, lineHeight: 1.55,
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}
                >
                  {selectedBook.volumeInfo.description}
                </p>
              )}

              <label
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginTop: 14, cursor: 'pointer', userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={isSecret}
                  onChange={(e) => setIsSecret(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--ink)', cursor: 'pointer' }}
                />
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, letterSpacing: '0.04em' }}>
                  Keep secret until activated
                </span>
                {isSecret && <Stamp variant="ink" rotate={-2} style={{ fontSize: 9 }}>Secret</Stamp>}
              </label>
            </div>
          </div>

          {error && (
            <div
              style={{
                marginTop: 16,
                borderLeft: '3px solid var(--stamp-red)',
                background: 'var(--paper-2)',
                color: 'var(--stamp-red)',
                padding: '10px 14px',
                borderRadius: '0 6px 6px 0',
                fontFamily: 'var(--font-jetbrains-mono)',
                fontSize: 11,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              onClick={handleAddBook}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Adding…' : 'Suggest this Book →'}
            </button>
            <button
              onClick={() => setSelectedBook(null)}
              className="btn btn-paper"
            >
              Change Selection
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
