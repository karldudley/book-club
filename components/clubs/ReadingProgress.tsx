'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/dogear'

type Status = 'not_started' | 'reading' | 'completed'

const NEXT: Record<Status, Status> = {
  not_started: 'reading',
  reading: 'completed',
  completed: 'not_started',
}

const LABEL: Record<Status, string> = {
  not_started: 'Not started',
  reading: 'Reading',
  completed: 'Finished',
}

const CHIP_BASE: React.CSSProperties = {
  width: 120,
  textAlign: 'center',
  fontFamily: 'var(--font-jetbrains-mono)',
  fontSize: 9,
  letterSpacing: '0.05em',
  padding: '3px 8px',
  borderRadius: 4,
  flexShrink: 0,
}

const CHIP_STYLE: Record<Status, React.CSSProperties> = {
  not_started: {
    background: 'var(--paper-2)',
    color: 'var(--ink-3)',
    border: '1px solid var(--ink-3)',
  },
  reading: {
    background: 'var(--mustard)',
    color: 'var(--ink)',
    border: '1px solid var(--ink)',
  },
  completed: {
    background: 'var(--forest)',
    color: 'var(--paper)',
    border: '1px solid var(--forest)',
  },
}

interface Member {
  id: string
  profiles: { id: string; display_name: string | null; email: string } | null
}

interface ProgressRow {
  user_id: string
  status: Status
}

interface ReadingProgressProps {
  bookId: string
  members: Member[]
  progressRows: ProgressRow[]
  currentUserId: string
}

export default function ReadingProgress({ bookId, members, progressRows, currentUserId }: ReadingProgressProps) {
  const supabase = createClient()

  const initialStatus = Object.fromEntries(
    members.map((m) => {
      const row = progressRows.find((p) => p.user_id === m.profiles?.id)
      return [m.profiles?.id, (row?.status ?? 'not_started') as Status]
    })
  )

  const [statuses, setStatuses] = useState<Record<string, Status>>(initialStatus)
  const [saving, setSaving] = useState(false)

  const handleCycle = async () => {
    if (saving) return
    const current = statuses[currentUserId] ?? 'not_started'
    const next = NEXT[current]
    setStatuses((prev) => ({ ...prev, [currentUserId]: next }))
    setSaving(true)
    try {
      await (supabase.from('user_book_progress') as any).upsert(
        {
          club_book_id: bookId,
          user_id: currentUserId,
          status: next,
          started_at: next === 'reading' ? new Date().toISOString() : undefined,
          completed_at: next === 'completed' ? new Date().toISOString() : undefined,
        },
        { onConflict: 'club_book_id,user_id' }
      )
    } finally {
      setSaving(false)
    }
  }

  const finishedCount = Object.values(statuses).filter((s) => s === 'completed').length

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="eyebrow">Reading progress</p>
        <p className="label-mono" style={{ fontSize: 9 }}>
          {finishedCount}/{members.length} finished
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {members.map((m) => {
          const profileId = m.profiles?.id
          const name = m.profiles?.display_name || m.profiles?.email || '?'
          const status = (profileId ? statuses[profileId] : 'not_started') ?? 'not_started'
          const isCurrentUser = profileId === currentUserId

          return (
            <div key={m.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar name={name} size={24} />
                <span style={{ fontSize: 13, fontWeight: isCurrentUser ? 600 : 400 }} className="truncate">
                  {name}{isCurrentUser ? ' (you)' : ''}
                </span>
              </div>
              {isCurrentUser ? (
                <button
                  onClick={handleCycle}
                  disabled={saving}
                  style={{
                    ...CHIP_BASE,
                    ...CHIP_STYLE[status],
                    cursor: 'pointer',
                    opacity: saving ? 0.6 : 1,
                    transition: 'opacity 100ms',
                  }}
                >
                  {LABEL[status]} ↻
                </button>
              ) : (
                <span style={{ ...CHIP_BASE, ...CHIP_STYLE[status] }}>
                  {LABEL[status]}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
