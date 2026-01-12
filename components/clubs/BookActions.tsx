'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface BookActionsProps {
  bookId: string
  bookStatus: string
  isAdmin: boolean
  clubId: string
}

export default function BookActions({ bookId, bookStatus, isAdmin, clubId }: BookActionsProps) {
  const [loading, setLoading] = useState(false)
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
      const { error } = await (supabase
        .from('club_books') as any)
        .update({ status: 'completed' })
        .eq('id', bookId)

      if (error) throw error
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
      <div className="flex gap-2 mt-3">
        {bookStatus === 'active' && (
          <button
            onClick={handleMarkCompleted}
            disabled={loading}
            className="text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-50 cursor-pointer"
          >
            Mark as Completed
          </button>
        )}
        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={loading}
          className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50 cursor-pointer"
        >
          Delete
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Book?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this book? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
