'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface BookActionsProps {
  bookId: string
  bookTitle: string
  bookStatus: string
  isAdmin: boolean
  clubId: string
}

export default function BookActions({ bookId, bookTitle, bookStatus, isAdmin, clubId }: BookActionsProps) {
  const [loading, setLoading] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setLoading(true)
    try {
      const { error } = await (supabase
        .from('club_books') as any)
        .delete()
        .eq('id', bookId)

      if (error) throw error
      setShowDeleteModal(false)
      router.refresh()
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkCompleted = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await (supabase
        .from('club_books') as any)
        .update({ status: 'completed' })
        .eq('id', bookId)

      if (error) throw error

      await (supabase.from('club_events') as any).insert({
        club_id: clubId,
        actor_id: user.id,
        event_type: 'book_completed',
        book_id: bookId,
        payload: { book_title: bookTitle },
      })

      setShowCompleteModal(false)
      router.refresh()
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) return null

  return (
    <>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {bookStatus === 'active' && (
          <button
            onClick={() => setShowCompleteModal(true)}
            disabled={loading}
            className="btn btn-paper btn-sm"
          >
            Mark Complete
          </button>
        )}
        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={loading}
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--stamp-red)' }}
        >
          Delete
        </button>
      </div>

      {showCompleteModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(47,42,36,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50, padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCompleteModal(false) }}
        >
          <div className="card" style={{ padding: 28, maxWidth: 360, width: '100%', background: 'var(--paper)' }}>
            <h3 className="h-section" style={{ fontSize: 22, margin: '0 0 10px' }}>Mark as Complete?</h3>
            <p style={{ fontSize: 14, color: 'var(--ink-2)', marginBottom: 24, lineHeight: 1.5 }}>
              This will close <strong>{bookTitle}</strong> and move it to past reads. Members will still be able to rate it.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCompleteModal(false)}
                disabled={loading}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkCompleted}
                disabled={loading}
                className="btn btn-primary btn-sm"
              >
                {loading ? 'Saving…' : 'Mark Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(47,42,36,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50, padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false) }}
        >
          <div className="card" style={{ padding: 28, maxWidth: 360, width: '100%', background: 'var(--paper)' }}>
            <h3 className="h-section" style={{ fontSize: 22, margin: '0 0 10px' }}>Delete Book?</h3>
            <p style={{ fontSize: 14, color: 'var(--ink-2)', marginBottom: 24, lineHeight: 1.5 }}>
              Are you sure you want to remove <strong>{bookTitle}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="btn btn-sm"
                style={{
                  background: 'var(--stamp-red)',
                  color: 'var(--paper)',
                  borderColor: 'var(--stamp-red)',
                }}
              >
                {loading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
