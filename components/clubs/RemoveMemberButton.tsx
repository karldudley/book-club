'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function RemoveMemberButton({ memberId, memberName }: { memberId: string; memberName: string }) {
  const [state, setState] = useState<'idle' | 'confirming' | 'removing'>('idle')
  const supabase = createClient()
  const router = useRouter()

  const handleRemove = async () => {
    setState('removing')
    await supabase.from('club_members').delete().eq('id', memberId)
    router.refresh()
  }

  if (state === 'confirming') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-ink-2 font-medium">Remove?</span>
        <button
          onClick={handleRemove}
          className="btn btn-sm"
          style={{ fontSize: 11, padding: '2px 8px', height: 24, background: 'var(--stamp-red)', color: '#fff', borderColor: 'var(--stamp-red)' }}
        >
          Yes
        </button>
        <button
          onClick={() => setState('idle')}
          className="btn btn-ghost btn-sm"
          style={{ fontSize: 11, padding: '2px 8px', height: 24 }}
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setState('confirming')}
      disabled={state === 'removing'}
      aria-label={`Remove ${memberName}`}
      className="btn btn-ghost btn-sm text-ink-3 hover:text-ink"
      style={{ fontSize: 16, width: 28, height: 28, padding: 0, lineHeight: 1 }}
    >
      ×
    </button>
  )
}
