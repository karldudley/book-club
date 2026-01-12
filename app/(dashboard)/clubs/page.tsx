import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ClubsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get clubs where user is a member
  const { data: memberships } = await supabase
    .from('club_members')
    .select(`
      club_id,
      clubs (
        id,
        name,
        description,
        admin_id
      )
    `)
    .eq('user_id', user.id) as { data: any[] }

  const clubs = memberships?.map((m: any) => m.clubs).filter(Boolean) || []

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Book Clubs</h1>
        <Link
          href="/clubs/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition cursor-pointer"
        >
          Create Club
        </Link>
      </div>

      {clubs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No clubs yet
          </h2>
          <p className="text-gray-600 mb-6">
            Create your first book club or join an existing one with an invite code
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/clubs/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition cursor-pointer"
            >
              Create Club
            </Link>
            <Link
              href="/join"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition cursor-pointer"
            >
              Join Club
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club: any) => (
            <Link
              key={club.id}
              href={`/clubs/${club.id}`}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6 border border-gray-200 cursor-pointer"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {club.name}
              </h3>
              {club.description && (
                <p className="text-gray-600 text-sm mb-4">{club.description}</p>
              )}
              {club.admin_id === user.id && (
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  Admin
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
