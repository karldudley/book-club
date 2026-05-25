'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ProfileForm({ currentName }: { currentName: string }) {
  const [displayName, setDisplayName] = useState(currentName)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('saving')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setStatus('error'); return }

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', user.id)

    setStatus(error ? 'error' : 'saved')
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-5 p-6 sm:p-8">
      <div>
        <label htmlFor="displayName" className="field-label">Display name</label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => { setDisplayName(e.target.value); setStatus('idle') }}
          required
          className="field"
          placeholder="Your name"
        />
      </div>

      {status === 'saved' && (
        <p style={{ color: 'var(--stamp-green)', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, letterSpacing: '0.04em' }}>
          ✓ Name updated
        </p>
      )}
      {status === 'error' && (
        <p style={{ color: 'var(--stamp-red)', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, letterSpacing: '0.04em' }}>
          Something went wrong — try again.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'saving'}
        className="btn btn-primary"
        style={{ height: 44 }}
      >
        {status === 'saving' ? 'Saving…' : 'Save name'}
      </button>
    </form>
  )
}
