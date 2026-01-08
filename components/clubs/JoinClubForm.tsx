'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function JoinClubForm() {
  const [inviteCode, setInviteCode] = useState('')
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

      // Find club with invite code
      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .select('id')
        .eq('invite_code', inviteCode.toUpperCase())
        .single() as { data: any, error: any }

      if (clubError || !club) {
        throw new Error('Invalid invite code')
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('club_members')
        .select('id')
        .eq('club_id', club.id)
        .eq('user_id', user.id)
        .single() as { data: any }

      if (existingMember) {
        throw new Error('You are already a member of this club')
      }

      // Add user as member
      const { error: memberError } = await (supabase
        .from('club_members') as any)
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
        <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-1">
          Invite Code
        </label>
        <input
          id="inviteCode"
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          required
          maxLength={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono font-bold tracking-wider uppercase"
          placeholder="ABC123"
        />
        <p className="text-sm text-gray-500 mt-2">
          Enter the 6-character code shared by the club admin
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || inviteCode.length !== 6}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Joining...' : 'Join Club'}
      </button>
    </form>
  )
}
