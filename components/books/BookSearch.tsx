'use client'

import { useState } from 'react'
import { GoogleBook } from '@/lib/api/googleBooks'
import { BookCover, Stamp } from '@/components/ui/dogear'

interface BookSearchProps {
  onSelectBook: (book: GoogleBook) => void
  selectedBookId?: string
}

export default function BookSearch({ onSelectBook, selectedBookId }: BookSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GoogleBook[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setSearched(true)
    setError(null)

    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Unable to search for books. Please try again.')
        setResults([])
      } else {
        setResults(data.items || [])
        setError(null)
      }
    } catch (error) {
      console.error('Search failed:', error)
      setError('Unable to connect to the search service. Please check your connection and try again.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Search bar */}
      <form onSubmit={handleSearch}>
        <div
          className="card flex gap-2 items-center p-2"
        >
          <div style={{ paddingLeft: 10, color: 'var(--ink-3)', display: 'flex', alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, author, or ISBN…"
            className="field"
            style={{ flex: 1, border: 'none', boxShadow: 'none', background: 'transparent', transform: 'none', fontSize: 16, padding: '10px 4px' }}
          />
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-sm"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

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
            letterSpacing: '0.04em',
          }}
        >
          {error}
        </div>
      )}

      {searched && results.length === 0 && !loading && !error && (
        <p className="eyebrow" style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-3)' }}>
          No books found — try a different search
        </p>
      )}

      {results.length > 0 && (
        <>
          <p className="label-mono" style={{ marginTop: 24, marginBottom: 14 }}>
            {results.filter((b) => b.volumeInfo.imageLinks?.thumbnail).length} results
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {results
              .filter((book) => book.volumeInfo.imageLinks?.thumbnail)
              .map((book) => {
                const isSelected = book.id === selectedBookId
                return (
                  <div
                    key={book.id}
                    className="card lift"
                    style={{
                      padding: 18,
                      background: isSelected ? 'var(--paper-2)' : 'var(--paper)',
                      boxShadow: isSelected ? '4px 4px 0 var(--brown)' : '4px 4px 0 var(--ink)',
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                    onClick={() => onSelectBook(book)}
                  >
                    {isSelected && (
                      <div style={{ position: 'absolute', top: 10, right: 10 }}>
                        <Stamp variant="brown" rotate={-3} style={{ fontSize: 9 }}>Selected</Stamp>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
                      <BookCover
                        url={book.volumeInfo.imageLinks?.thumbnail}
                        title={book.volumeInfo.title}
                        size="md"
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: 'var(--font-roboto-slab)',
                            fontWeight: 700,
                            fontSize: 17,
                            lineHeight: 1.2,
                          }}
                        >
                          {book.volumeInfo.title}
                        </div>
                        {book.volumeInfo.authors && (
                          <div
                            style={{
                              fontFamily: 'var(--font-roboto-slab)',
                              fontStyle: 'italic',
                              fontSize: 13,
                              color: 'var(--ink-2)',
                              marginTop: 3,
                            }}
                          >
                            {book.volumeInfo.authors.join(', ')}
                          </div>
                        )}
                        {book.volumeInfo.publishedDate && (
                          <p className="eyebrow" style={{ marginTop: 6 }}>
                            {book.volumeInfo.publishedDate.slice(0, 4)}
                            {book.volumeInfo.pageCount ? ` · ${book.volumeInfo.pageCount} pp` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    {book.volumeInfo.description && (
                      <p
                        style={{
                          fontSize: 12.5,
                          color: 'var(--ink-2)',
                          lineHeight: 1.5,
                          fontStyle: 'italic',
                          marginBottom: 12,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        "{book.volumeInfo.description}"
                      </p>
                    )}

                    <button
                      className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-paper'}`}
                      style={{ alignSelf: 'flex-start' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectBook(book)
                      }}
                    >
                      {isSelected ? '✓ Suggesting this' : 'Suggest this →'}
                    </button>
                  </div>
                )
              })}
          </div>
        </>
      )}
    </div>
  )
}
