'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface RatingButtonProps {
  bookId: string
  currentUserRating?: number
  averageRating?: number
  totalRatings?: number
}

export default function RatingButton({
  bookId,
  currentUserRating,
  averageRating,
  totalRatings
}: RatingButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [selectedRating, setSelectedRating] = useState(currentUserRating || 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async () => {
    if (selectedRating < 1) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upsert rating (insert or update if exists)
      const { error } = await (supabase
        .from('book_ratings') as any)
        .upsert({
          book_id: bookId,
          user_id: user.id,
          rating: selectedRating,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'book_id,user_id'
        })

      if (error) throw error

      setShowModal(false)
      router.refresh()
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setSelectedRating(currentUserRating || 0)
          setShowModal(true)
        }}
        className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
      >
        {currentUserRating ? `Your rating: ${currentUserRating}/10` : 'Rate this book'}
        {averageRating && totalRatings ? (
          <span className="ml-2 text-gray-500">
            (avg: {averageRating.toFixed(1)}/10 from {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})
          </span>
        ) : null}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Rate this book</h3>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">Select a rating from 1-10:</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setSelectedRating(rating)}
                    onMouseEnter={() => setHoverRating(rating)}
                    onMouseLeave={() => setHoverRating(0)}
                    className={`w-12 h-12 rounded-lg font-bold text-lg transition cursor-pointer ${
                      rating <= (hoverRating || selectedRating)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              {selectedRating > 0 && (
                <p className="text-center mt-3 text-sm font-medium text-gray-700">
                  Selected: {selectedRating}/10
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || selectedRating < 1}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Saving...' : currentUserRating ? 'Update Rating' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
