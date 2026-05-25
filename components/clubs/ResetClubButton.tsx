'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  clubId: string
  clubName: string
}

export default function ResetClubButton({ clubId, clubName }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [status, setStatus] = useState<'idle' | 'resetting' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const handleReset = async () => {
    if (confirmText !== 'RESET') return
    setStatus('resetting')
    setErrorMsg(null)

    const { error } = await (supabase.rpc as any)('reset_club', { p_club_id: clubId })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setShowModal(false)
      setConfirmText('')
      setStatus('idle')
      router.refresh()
    }
  }

  const close = () => {
    if (status === 'resetting') return
    setShowModal(false)
    setConfirmText('')
    setStatus('idle')
    setErrorMsg(null)
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn btn-sm"
        style={{ background: 'var(--stamp-red)', color: 'var(--paper)', borderColor: 'var(--stamp-red)' }}
      >
        Reset club data →
      </button>

      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-[rgba(47,42,36,0.75)]"
          onClick={(e) => { if (e.target === e.currentTarget) close() }}
        >
          <div className="card p-7 max-w-sm w-full">
            <h3 className="h-section text-xl mb-1">Reset club data?</h3>
            <p className="text-ink-2 mb-5" style={{ fontSize: 14, lineHeight: 1.55 }}>
              This will permanently delete all books, ratings, reading progress, and activity for{' '}
              <strong>{clubName}</strong>. Members stay in the club. This cannot be undone.
            </p>

            <div className="mb-5">
              <label htmlFor="resetConfirm" className="field-label">
                Type <span style={{ fontFamily: 'var(--font-jetbrains-mono)', letterSpacing: '0.1em' }}>RESET</span> to confirm
              </label>
              <input
                id="resetConfirm"
                type="text"
                value={confirmText}
                onChange={(e) => { setConfirmText(e.target.value); setStatus('idle') }}
                disabled={status === 'resetting'}
                className="field"
                placeholder="RESET"
                autoComplete="off"
              />
            </div>

            {status === 'error' && (
              <p className="[font-family:var(--font-jetbrains-mono)] text-[11px] tracking-[0.04em] text-[var(--stamp-red)] mb-4">
                {errorMsg ?? 'Something went wrong.'}
              </p>
            )}

            <div className="flex gap-2.5 justify-end">
              <button onClick={close} disabled={status === 'resetting'} className="btn btn-ghost btn-sm">
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={confirmText !== 'RESET' || status === 'resetting'}
                className="btn btn-sm"
                style={{ background: 'var(--stamp-red)', color: 'var(--paper)', borderColor: 'var(--stamp-red)' }}
              >
                {status === 'resetting' ? 'Resetting…' : 'Reset club'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
