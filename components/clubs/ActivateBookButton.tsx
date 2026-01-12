'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface ActivateBookButtonProps {
  bookId: string
  clubId: string
  scheduleWeeks: number
  hasActiveBook: boolean
}

export default function ActivateBookButton({ bookId, clubId, scheduleWeeks, hasActiveBook }: ActivateBookButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const router = useRouter()
  const supabase = createClient()

  if (hasActiveBook) {
    return (
      <p className="mt-2 text-sm text-gray-500 italic">
        Complete the current active book before activating another
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
      const deadline = calculateDeadline(startDate)

      const { error } = await (supabase
        .from('club_books') as any)
        .update({
          status: 'active',
          start_date: startDate,
          deadline: deadline,
        })
        .eq('id', bookId)

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
        onClick={() => setShowModal(true)}
        className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
      >
        Activate this book →
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Activate Book</h3>

            <div className="mb-4">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600">
                <strong>Deadline:</strong> {new Date(calculateDeadline(startDate)).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ({scheduleWeeks} weeks from start date)
              </p>
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
                onClick={handleActivate}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Activating...' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
