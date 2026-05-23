'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface ActivateBookButtonProps {
  bookId: string
  clubId: string
  scheduleWeeks: number
  hasActiveBook: boolean
  bookTitle: string
  isSecret: boolean
}

export default function ActivateBookButton({ bookId, clubId, scheduleWeeks, hasActiveBook, bookTitle, isSecret }: ActivateBookButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const router = useRouter()
  const supabase = createClient()

  if (hasActiveBook) {
    return (
      <p className="eyebrow" style={{ fontStyle: 'italic', color: 'var(--ink-3)' }}>
        Complete current book first
      </p>
    )
  }

  const calculateDeadline = (start: string) => {
    const deadline = new Date(start)
    deadline.setDate(deadline.getDate() + scheduleWeeks * 7)
    return deadline.toISOString().split('T')[0]
  }

  const handleActivate = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const deadline = calculateDeadline(startDate)

      const { error } = await (supabase
        .from('club_books') as any)
        .update({
          status: 'active',
          is_secret: false,
          start_date: startDate,
          deadline: deadline,
        })
        .eq('id', bookId)

      if (error) throw error

      await (supabase.from('club_events') as any).insert({
        club_id: clubId,
        actor_id: user.id,
        event_type: 'book_activated',
        book_id: bookId,
        payload: { book_title: bookTitle, was_secret: isSecret },
      })

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
        onClick={() => setShowModal(true)}
        className="btn btn-accent btn-sm"
      >
        {isSecret ? 'Reveal & Activate →' : 'Activate this book →'}
      </button>

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
          <div className="card" style={{ padding: 28, maxWidth: 380, width: '100%', background: 'var(--paper)' }}>
            <h3 className="h-section" style={{ fontSize: 22, margin: '0 0 20px' }}>
              {isSecret ? 'Reveal & Activate' : 'Activate Book'}
            </h3>

            <div style={{ marginBottom: 16 }}>
              <label htmlFor="startDate" className="field-label">Start Date</label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="field"
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <p className="label-mono" style={{ marginBottom: 4 }}>Deadline</p>
              <p style={{ fontFamily: 'var(--font-roboto-slab)', fontWeight: 700, fontSize: 18 }}>
                {new Date(calculateDeadline(startDate)).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
              <p className="eyebrow" style={{ marginTop: 4 }}>
                {scheduleWeeks} weeks from start date
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleActivate}
                disabled={loading}
                className="btn btn-primary btn-sm"
              >
                {loading ? 'Activating…' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
