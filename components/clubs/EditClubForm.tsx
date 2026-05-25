'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const CADENCE_OPTIONS = [
  { weeks: 2, label: 'Sprint', sub: '2 wks' },
  { weeks: 3, label: 'Steady', sub: '3 wks' },
  { weeks: 4, label: 'Classic', sub: '4 wks' },
  { weeks: 6, label: 'Slow burn', sub: '6 wks' },
]

interface Props {
  clubId: string
  initialName: string
  initialDescription: string | null
  initialScheduleWeeks: number
}

export default function EditClubForm({ clubId, initialName, initialDescription, initialScheduleWeeks }: Props) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription ?? '')
  const [scheduleWeeks, setScheduleWeeks] = useState(initialScheduleWeeks)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('saving')
    setErrorMsg(null)

    const { error } = await (supabase.from('clubs') as any)
      .update({ name: name.trim(), description: description.trim() || null, schedule_weeks: scheduleWeeks })
      .eq('id', clubId)

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStatus('saved')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-5 p-6 sm:p-8">
      <div>
        <label htmlFor="clubName" className="field-label">Club Name</label>
        <input
          id="clubName"
          type="text"
          required
          value={name}
          onChange={(e) => { setName(e.target.value); setStatus('idle') }}
          className="field"
          placeholder="The Slow Readers Club"
        />
      </div>

      <div>
        <label htmlFor="description" className="field-label">Description (optional)</label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => { setDescription(e.target.value); setStatus('idle') }}
          className="field"
          placeholder="What's this club about?"
        />
      </div>

      <div>
        <label className="field-label">Reading Cadence</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
          {CADENCE_OPTIONS.map((opt) => (
            <button
              key={opt.weeks}
              type="button"
              onClick={() => { setScheduleWeeks(opt.weeks); setStatus('idle') }}
              style={{
                padding: '14px 8px',
                borderRadius: 10,
                border: '1.5px solid var(--ink)',
                background: scheduleWeeks === opt.weeks ? 'var(--ink)' : 'var(--paper)',
                color: scheduleWeeks === opt.weeks ? 'var(--paper)' : 'var(--ink)',
                cursor: 'pointer',
                boxShadow: scheduleWeeks === opt.weeks ? '3px 3px 0 var(--terracotta)' : 'none',
                fontFamily: 'var(--font-roboto-slab)',
                fontWeight: 700,
                fontSize: 14,
                transition: 'all 80ms ease',
              }}
            >
              <div>{opt.label}</div>
              <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, marginTop: 4, opacity: 0.7, letterSpacing: '0.1em' }}>
                {opt.sub}
              </div>
            </button>
          ))}
        </div>
        {!CADENCE_OPTIONS.find((o) => o.weeks === scheduleWeeks) && (
          <p className="label-mono mt-2 text-[10px]">Custom: every {scheduleWeeks} weeks</p>
        )}
      </div>

      {status === 'saved' && (
        <p className="[font-family:var(--font-jetbrains-mono)] text-[12px] tracking-[0.04em] text-[var(--stamp-green)]">
          ✓ Club updated
        </p>
      )}
      {status === 'error' && (
        <p className="[font-family:var(--font-jetbrains-mono)] text-[12px] tracking-[0.04em] text-[var(--stamp-red)]">
          {errorMsg ?? 'Something went wrong.'}
        </p>
      )}

      <button type="submit" disabled={status === 'saving'} className="btn btn-primary h-11">
        {status === 'saving' ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
