'use client'

import { useState } from 'react'

export default function ShareInviteButton({ inviteCode, clubName }: { inviteCode: string; clubName: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'shared'>('idle')

  const handleShare = async () => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isTouchDevice && navigator.share) {
      const shareText = `Join ${clubName} on Dogear — use code ${inviteCode} at ${window.location.origin}/join`
      try {
        await navigator.share({ title: `Join ${clubName} on Dogear`, text: shareText })
        setState('shared')
      } catch {
        // User cancelled — do nothing
        return
      }
    } else {
      await navigator.clipboard.writeText(`Join ${clubName} on Dogear — code: ${inviteCode}`)
      setState('copied')
    }

    setTimeout(() => setState('idle'), 2000)
  }

  return (
    <button onClick={handleShare} className="btn btn-paper btn-sm w-full mt-4">
      {state === 'copied' ? '✓ Copied!' : state === 'shared' ? '✓ Shared!' : 'Share invite code →'}
    </button>
  )
}
