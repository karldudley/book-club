'use client'

import { useState } from 'react'
import { GoogleBook } from '@/lib/api/googleBooks'

interface BookSearchProps {
  onSelectBook: (book: GoogleBook) => void
}

export default function BookSearch({ onSelectBook }: BookSearchProps) {
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
        // Display user-friendly error message from API
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
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, author, or ISBN..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <p className="font-medium">Search Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {searched && results.length === 0 && !loading && !error && (
        <p className="text-center text-gray-500 py-8">No books found. Try a different search term.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((book) => (
          <div
            key={book.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
          >
            <div className="flex gap-4 mb-3">
              {book.volumeInfo.imageLinks?.thumbnail && (
                <img
                  src={book.volumeInfo.imageLinks.thumbnail}
                  alt={book.volumeInfo.title}
                  className="w-20 h-28 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1 truncate">
                  {book.volumeInfo.title}
                </h3>
                {book.volumeInfo.authors && (
                  <p className="text-sm text-gray-600 mb-2">
                    {book.volumeInfo.authors.join(', ')}
                  </p>
                )}
                {book.volumeInfo.averageRating && book.volumeInfo.ratingsCount && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      <span className="text-yellow-500 text-sm">★</span>
                      <span className="text-sm font-medium text-gray-700 ml-1">
                        {book.volumeInfo.averageRating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      ({book.volumeInfo.ratingsCount.toLocaleString()} ratings)
                    </span>
                  </div>
                )}
                {book.volumeInfo.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {book.volumeInfo.description}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => onSelectBook(book)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-semibold transition cursor-pointer"
            >
              Select this book
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
