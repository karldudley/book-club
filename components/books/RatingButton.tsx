'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { StarRating } from '@/components/ui/dogear'

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
  totalRatings,
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
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await (supabase
        .from('book_ratings') as any)
        .upsert(
          {
            book_id: bookId,
            user_id: user.id,
            rating: selectedRating,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'book_id,user_id' }
        )

      if (error) throw error

      setShowModal(false)
      router.refresh()
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const activeRating = hoverRating || selectedRating

  return (
    <>
      <div>
        <button
          onClick={() => {
            setSelectedRating(currentUserRating || 0)
            setShowModal(true)
          }}
          className="btn btn-paper btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          {currentUserRating ? (
            <>
              <StarRating rating={currentUserRating} size={12} />
              <span>{currentUserRating}/10</span>
            </>
          ) : (
            'Rate this book'
          )}
        </button>
        {averageRating && totalRatings ? (
          <p className="eyebrow" style={{ marginTop: 5 }}>
            Avg {averageRating.toFixed(1)}/10 · {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
          </p>
        ) : null}
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(47,42,36,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50, padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="card" style={{ padding: 28, maxWidth: 380, width: '100%', background: 'var(--paper)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 14, right: 14 }}>
              <span className="stamp stamp-red" style={{ transform: 'rotate(-4deg)', fontSize: 9 }}>● Final verdict</span>
            </div>

            <p className="label-mono" style={{ marginBottom: 12 }}>Rate this book · 1 to 10</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                const isActive = n <= activeRating
                const isCurrent = n === selectedRating
                return (
                  <button
                    key={n}
                    onClick={() => setSelectedRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 6,
                      border: '1.5px solid var(--ink)',
                      background: isActive
                        ? isCurrent
                          ? 'var(--terracotta)'
                          : 'var(--mustard)'
                        : 'var(--paper-2)',
                      color: 'var(--ink)',
                      fontFamily: 'var(--font-roboto-slab)',
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: 'pointer',
                      boxShadow: isCurrent ? '2px 2px 0 var(--ink)' : 'none',
                      transform: isCurrent ? 'translate(-1px,-1px)' : 'none',
                      transition: 'all 60ms ease',
                    }}
                  >
                    {n}
                  </button>
                )
              })}
            </div>

            {selectedRating > 0 && (
              <p className="label-mono" style={{ textAlign: 'center', marginBottom: 16 }}>
                Selected: {selectedRating}/10
              </p>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="btn btn-ghost btn-sm"
              >
                Maybe later
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || selectedRating < 1}
                className="btn btn-accent btn-sm"
                style={{ fontFamily: 'var(--font-roboto-slab)', fontWeight: 700 }}
              >
                {loading ? 'Saving…' : `Stamp it · ${selectedRating}/10`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
