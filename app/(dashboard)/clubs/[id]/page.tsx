import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BookActions from '@/components/clubs/BookActions'
import ActivateBookButton from '@/components/clubs/ActivateBookButton'
import RatingButton from '@/components/books/RatingButton'

export default async function ClubPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { id } = await Promise.resolve(params)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get club details
  const { data: club } = await supabase
    .from('clubs')
    .select('*')
    .eq('id', id)
    .single() as { data: any }

  if (!club) {
    notFound()
  }

  // Get club members
  const { data: members } = await supabase
    .from('club_members')
    .select(`
      id,
      joined_at,
      profiles (
        id,
        display_name,
        email
      )
    `)
    .eq('club_id', id)
    .order('joined_at')

  // Get club books (active and completed for all, suggestions for admin or owner)
  const { data: books } = await supabase
    .from('club_books')
    .select(`
      *,
      profiles:picked_by (
        id,
        display_name,
        email
      )
    `)
    .eq('club_id', id)
    .order('created_at', { ascending: false }) as { data: any[] }

  // Get all ratings for books in this club
  const { data: ratings } = await supabase
    .from('book_ratings')
    .select('*')
    .in('book_id', books?.map((b: any) => b.id) || []) as { data: any[] }

  // Calculate rating statistics for each book
  const bookRatings = books?.map((book: any) => {
    const bookRatingsList = ratings?.filter((r: any) => r.book_id === book.id) || []
    const userRating = bookRatingsList.find((r: any) => r.user_id === user.id)
    const avgRating = bookRatingsList.length > 0
      ? bookRatingsList.reduce((sum: number, r: any) => sum + r.rating, 0) / bookRatingsList.length
      : undefined

    return {
      ...book,
      currentUserRating: userRating?.rating,
      averageRating: avgRating,
      totalRatings: bookRatingsList.length
    }
  })

  const isAdmin = club.admin_id === user.id

  // Separate books by status
  const activeBooks = bookRatings?.filter((b: any) => b.status === 'active') || []
  const completedBooks = bookRatings?.filter((b: any) => b.status === 'completed') || []
  const suggestedBooks = bookRatings?.filter((b: any) => b.status === 'suggested') || []
  const userSuggestion = suggestedBooks.find((b: any) => b.picked_by === user.id)

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/clubs"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
        >
          ← Back to clubs
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {club.name}
          </h1>
          {isAdmin && (
            <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
              Admin
            </span>
          )}
        </div>
        {club.description && (
          <p className="text-gray-600">{club.description}</p>
        )}
      </div>

      {/* Books Section */}
      <div className="space-y-6 mb-6">
        {/* Active Books */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {activeBooks.length > 0 ? 'Current Reading' : 'Books'}
            </h2>
            {!userSuggestion && (
              <Link
                href={`/clubs/${id}/search`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer"
              >
                Suggest Book
              </Link>
            )}
          </div>

          {activeBooks.length === 0 && !userSuggestion ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No active books yet</p>
              <Link
                href={`/clubs/${id}/search`}
                className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
                Suggest your first book
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeBooks.map((book: any) => (
                <div
                  key={book.id}
                  className="border border-green-200 rounded-lg p-4 bg-green-50"
                >
                  <div className="flex gap-4">
                    {book.cover_url && (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-16 h-24 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <span className="inline-block bg-green-600 text-white text-xs px-2 py-1 rounded mb-2">
                        ACTIVE
                      </span>
                      <h3 className="font-semibold text-gray-900">{book.title}</h3>
                      {book.author && (
                        <p className="text-sm text-gray-600">{book.author}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Suggested by: {book.profiles?.display_name || book.profiles?.email || 'Unknown'}
                      </p>
                      {book.deadline && (
                        <p className="text-sm text-gray-700 mt-2 font-medium">
                          Due: {new Date(book.deadline).toLocaleDateString()}
                        </p>
                      )}
                      <div className="mt-3">
                        <RatingButton
                          bookId={book.id}
                          currentUserRating={book.currentUserRating}
                          averageRating={book.averageRating}
                          totalRatings={book.totalRatings}
                        />
                      </div>
                      <BookActions
                        bookId={book.id}
                        bookStatus={book.status}
                        isAdmin={isAdmin}
                        clubId={id}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User's Suggestion */}
        {userSuggestion && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Suggestion</h2>
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="flex gap-4">
                {userSuggestion.cover_url && (
                  <img
                    src={userSuggestion.cover_url}
                    alt={userSuggestion.title}
                    className="w-16 h-24 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{userSuggestion.title}</h3>
                  {userSuggestion.author && (
                    <p className="text-sm text-gray-600">{userSuggestion.author}</p>
                  )}
                  <p className="text-xs text-blue-600 mt-2">Waiting for admin to activate</p>
                </div>
              </div>
              <Link
                href={`/clubs/${id}/search`}
                className="mt-3 block text-center text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Change suggestion
              </Link>
            </div>
          </div>
        )}

        {/* Admin: Pending Suggestions */}
        {isAdmin && suggestedBooks.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Member Suggestions ({suggestedBooks.length})
            </h2>
            <div className="space-y-3">
              {suggestedBooks.map((book: any) => (
                <div
                  key={book.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex gap-4">
                    {book.cover_url && (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-12 h-18 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{book.title}</h4>
                      {book.author && (
                        <p className="text-sm text-gray-600">{book.author}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Suggested by: {book.profiles?.display_name || book.profiles?.email || 'Unknown'}
                      </p>
                      <ActivateBookButton
                        bookId={book.id}
                        clubId={id}
                        scheduleWeeks={club.schedule_weeks}
                        hasActiveBook={activeBooks.length > 0}
                      />
                      <BookActions
                        bookId={book.id}
                        bookStatus={book.status}
                        isAdmin={isAdmin}
                        clubId={id}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Books */}
        {completedBooks.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Past Reads</h2>
            <div className="space-y-3">
              {completedBooks.map((book: any) => (
                <div
                  key={book.id}
                  className="border border-gray-200 rounded-lg p-3 opacity-75 hover:opacity-100 transition"
                >
                  <div className="flex gap-3">
                    {book.cover_url && (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-12 h-18 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{book.title}</h4>
                      {book.author && (
                        <p className="text-sm text-gray-600">{book.author}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Suggested by: {book.profiles?.display_name || book.profiles?.email || 'Unknown'}
                      </p>
                      <div className="mt-2">
                        <RatingButton
                          bookId={book.id}
                          currentUserRating={book.currentUserRating}
                          averageRating={book.averageRating}
                          totalRatings={book.totalRatings}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Club Details Section */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Club Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Invite Code & Schedule */}
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Invite Code</p>
              <p className="text-2xl font-mono font-bold text-gray-900">
                {club.invite_code}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Reading Schedule</p>
              <p className="text-lg font-semibold text-gray-900">
                Every {club.schedule_weeks} week{club.schedule_weeks !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Members List */}
          <div>
            <p className="text-sm text-gray-500 mb-3">Members ({members?.length || 0})</p>
            <div className="space-y-2">
              {members?.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                >
                  <p className="font-medium text-gray-900 text-sm">
                    {member.profiles?.display_name || member.profiles?.email}
                  </p>
                  {club.admin_id === member.profiles?.id && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Admin
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
