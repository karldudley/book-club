'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BookSearch from '@/components/books/BookSearch'
import { GoogleBook } from '@/lib/api/googleBooks'
import { createClient } from '@/lib/supabase/client'
import { use } from 'react'

export default function SearchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [selectedBook, setSelectedBook] = useState<GoogleBook | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Scroll to confirmation when book is selected
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

      // Check if user already has a suggested book
      const { data: existingSuggestion } = await supabase
        .from('club_books')
        .select('id')
        .eq('club_id', id)
        .eq('picked_by', user.id)
        .eq('status', 'suggested')
        .single()

      if (existingSuggestion) {
        // Update existing suggestion
        const { error: updateError } = await supabase
          .from('club_books')
          .update({
            google_books_id: selectedBook.id,
            title: selectedBook.volumeInfo.title,
            author: selectedBook.volumeInfo.authors?.join(', ') || null,
            cover_url: selectedBook.volumeInfo.imageLinks?.thumbnail || null,
          })
          .eq('id', existingSuggestion.id)

        if (updateError) throw updateError
      } else {
        // Add new suggestion
        const { error: insertError } = await supabase
          .from('club_books')
          .insert({
            club_id: id,
            google_books_id: selectedBook.id,
            title: selectedBook.volumeInfo.title,
            author: selectedBook.volumeInfo.authors?.join(', ') || null,
            cover_url: selectedBook.volumeInfo.imageLinks?.thumbnail || null,
            picked_by: user.id,
            status: 'suggested',
            start_date: null,
            deadline: null,
          })

        if (insertError) throw insertError
      }

      router.push(`/clubs/${id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/clubs/${id}`}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          ← Back to club
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Search for a Book
        </h1>
        <p className="text-gray-600 mb-6">
          Search for a book to add to your club's reading list
        </p>

        <BookSearch onSelectBook={setSelectedBook} />
      </div>

      {selectedBook && (
        <div id="confirmation-section" className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Confirm Book Selection
          </h2>

          <div className="flex gap-4 mb-6">
            {selectedBook.volumeInfo.imageLinks?.thumbnail && (
              <img
                src={selectedBook.volumeInfo.imageLinks.thumbnail}
                alt={selectedBook.volumeInfo.title}
                className="w-24 h-36 object-cover rounded"
              />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {selectedBook.volumeInfo.title}
              </h3>
              {selectedBook.volumeInfo.authors && (
                <p className="text-gray-600 mb-2">
                  by {selectedBook.volumeInfo.authors.join(', ')}
                </p>
              )}
              {selectedBook.volumeInfo.description && (
                <p className="text-sm text-gray-500 line-clamp-3">
                  {selectedBook.volumeInfo.description}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleAddBook}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add to Club'}
            </button>
            <button
              onClick={() => setSelectedBook(null)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition"
            >
              Change Selection
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
