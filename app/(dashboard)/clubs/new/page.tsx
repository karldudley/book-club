import CreateClubForm from '@/components/clubs/CreateClubForm'
import Link from 'next/link'

export default function NewClubPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/clubs"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          ← Back to clubs
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Create a Book Club
        </h1>

        <CreateClubForm />
      </div>
    </div>
  )
}
