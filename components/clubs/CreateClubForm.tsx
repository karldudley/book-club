'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { generateInviteCode } from '@/lib/utils/inviteCode'

export default function CreateClubForm() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [scheduleWeeks, setScheduleWeeks] = useState(4)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      // Generate unique invite code
      let inviteCode = generateInviteCode()
      let isUnique = false

      while (!isUnique) {
        const { data } = await supabase
          .from('clubs')
          .select('id')
          .eq('invite_code', inviteCode)
          .single()

        if (!data) {
          isUnique = true
        } else {
          inviteCode = generateInviteCode()
        }
      }

      // Create club
      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .insert({
          name,
          description,
          admin_id: user.id,
          invite_code: inviteCode,
          schedule_weeks: scheduleWeeks,
        })
        .select()
        .single()

      if (clubError || !club) throw clubError || new Error('Failed to create club')

      // Add admin as first member
      const { error: memberError } = await supabase
        .from('club_members')
        .insert({
          club_id: club.id,
          user_id: user.id,
        })

      if (memberError) throw memberError

      router.push(`/clubs/${club.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Club Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="My Awesome Book Club"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Tell members what this club is about..."
        />
      </div>

      <div>
        <label htmlFor="scheduleWeeks" className="block text-sm font-medium text-gray-700 mb-1">
          Reading Schedule (weeks between books)
        </label>
        <input
          id="scheduleWeeks"
          type="number"
          min="1"
          max="52"
          value={scheduleWeeks}
          onChange={(e) => setScheduleWeeks(parseInt(e.target.value))}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-sm text-gray-500 mt-1">
          Members will have {scheduleWeeks} week{scheduleWeeks !== 1 ? 's' : ''} to complete each book
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating...' : 'Create Club'}
      </button>
    </form>
  )
}
