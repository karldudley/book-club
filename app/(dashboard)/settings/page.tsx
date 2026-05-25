import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/settings/ProfileForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <div className="max-w-lg mx-auto px-4 py-10 sm:py-14">
      <p className="eyebrow mb-2">— Your account</p>
      <h1 className="h-section text-3xl mb-8">Profile settings</h1>
      <ProfileForm currentName={profile?.display_name ?? ''} />
    </div>
  )
}
