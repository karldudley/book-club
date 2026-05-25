import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { SketchDivider } from '@/components/ui/dogear'
import EditClubForm from '@/components/clubs/EditClubForm'
import ResetClubButton from '@/components/clubs/ResetClubButton'

export default async function ClubSettingsPage({ params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params)
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: club } = await supabase
    .from('clubs')
    .select('id, name, description, schedule_weeks, admin_id')
    .eq('id', id)
    .single() as { data: any }

  if (!club) notFound()
  if (club.admin_id !== user.id) redirect(`/clubs/${id}`)

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/clubs/${id}`} className="eyebrow text-ink-2 no-underline inline-block mb-6">
        ← Back to {club.name}
      </Link>

      <p className="eyebrow mb-2">Admin</p>
      <h1 className="h-display text-4xl sm:text-5xl mb-10">{club.name} settings</h1>

      <section className="mb-10">
        <h2 className="h-section text-xl mb-4">Edit details</h2>
        <EditClubForm
          clubId={id}
          initialName={club.name}
          initialDescription={club.description}
          initialScheduleWeeks={club.schedule_weeks}
        />
      </section>

      <SketchDivider />

      <section className="mt-10">
        <h2 className="h-section text-xl mb-1">Danger zone</h2>
        <p className="text-ink-2 mb-4 text-sm">
          Reset removes all books, ratings, progress, and activity. Members stay.
        </p>
        <ResetClubButton clubId={id} clubName={club.name} />
      </section>
    </div>
  )
}
