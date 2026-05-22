'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { generateInviteCode } from '@/lib/utils/inviteCode'
import { BookCover } from '@/components/ui/dogear'

const CADENCE_OPTIONS = [
  { weeks: 2, label: 'Sprint', sub: '2 wks' },
  { weeks: 3, label: 'Steady', sub: '3 wks' },
  { weeks: 4, label: 'Classic', sub: '4 wks' },
  { weeks: 6, label: 'Slow burn', sub: '6 wks' },
]

export default function CreateClubForm() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [scheduleWeeks, setScheduleWeeks] = useState(4)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      let inviteCode = generateInviteCode()
      let isUnique = false

      while (!isUnique) {
        const { data } = await supabase
          .from('clubs')
          .select('id')
          .eq('invite_code', inviteCode)
          .single() as { data: any }

        if (!data) {
          isUnique = true
        } else {
          inviteCode = generateInviteCode()
        }
      }

      const { data: club, error: clubError } = await (supabase
        .from('clubs') as any)
        .insert({
          name,
          description,
          admin_id: user.id,
          invite_code: inviteCode,
          schedule_weeks: scheduleWeeks,
        })
        .select()
        .single()

      if (clubError || !club) throw clubError || new Error('Failed to create club')

      const { error: memberError } = await (supabase
        .from('club_members') as any)
        .insert({
          club_id: club.id,
          user_id: user.id,
        })

      if (memberError) throw memberError

      router.push(`/clubs/${club.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
      {/* Left: form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label htmlFor="name" className="field-label">Club Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="field"
            placeholder="The Slow Readers Society"
          />
        </div>

        <div>
          <label htmlFor="description" className="field-label">A line about the club (optional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="field"
            placeholder="Long sentences, longer evenings. Mostly fiction."
            style={{ resize: 'vertical' }}
          />
        </div>

        <div>
          <label className="field-label">Reading Cadence</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
            {CADENCE_OPTIONS.map((opt) => (
              <button
                key={opt.weeks}
                type="button"
                onClick={() => setScheduleWeeks(opt.weeks)}
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
                <div
                  style={{
                    fontFamily: 'var(--font-jetbrains-mono)',
                    fontSize: 10,
                    marginTop: 4,
                    opacity: 0.7,
                    letterSpacing: '0.1em',
                  }}
                >
                  {opt.sub}
                </div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div
            style={{
              borderLeft: '3px solid var(--stamp-red)',
              background: 'var(--paper-2)',
              color: 'var(--stamp-red)',
              padding: '10px 14px',
              borderRadius: '0 6px 6px 0',
              fontFamily: 'var(--font-jetbrains-mono)',
              fontSize: 11,
              letterSpacing: '0.04em',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ height: 48, fontSize: 15, marginTop: 4 }}
        >
          {loading ? 'Creating…' : `Found the Club${name ? ' — ' + name : ''}`}
        </button>
      </form>

      {/* Right: live preview */}
      <div>
        <p className="label-mono" style={{ marginBottom: 10 }}>Preview · what members see</p>
        <div className="card kraft-bg" style={{ padding: 22, position: 'relative' }}>
          <div
            style={{
              position: 'absolute', top: 12, right: 14,
              fontFamily: 'var(--font-jetbrains-mono)', fontSize: 8, fontWeight: 700,
              color: 'var(--brown)', letterSpacing: '0.18em',
              padding: '3px 8px', border: '1.5px solid var(--brown)', borderRadius: 3,
              transform: 'rotate(-3deg)',
            }}
          >
            NEW
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <BookCover title={name || 'Club Name'} size="sm" />
            <div>
              <h3 className="h-section" style={{ fontSize: 20, margin: '0 0 4px' }}>
                {name || 'Club Name'}
              </h3>
              {description ? (
                <p style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>{description}</p>
              ) : (
                <p style={{ fontSize: 12.5, color: 'var(--ink-3)', fontStyle: 'italic' }}>Add a description…</p>
              )}
            </div>
          </div>

          <div className="ornament" style={{ margin: '16px 0', fontSize: 9 }}>NOW READING</div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', opacity: 0.55 }}>
            <div
              style={{
                width: 40, height: 60,
                border: '1.5px dashed var(--ink-3)', borderRadius: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--ink-3)', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 8,
                textAlign: 'center', padding: 4,
              }}
            >
              PICK<br />BOOK
            </div>
            <p style={{ fontSize: 12, color: 'var(--ink-2)', fontStyle: 'italic', lineHeight: 1.5 }}>
              Nothing on the shelf yet.<br />Your move.
            </p>
          </div>

          <div
            style={{
              marginTop: 16, padding: '10px 12px',
              background: 'var(--paper-2)', borderRadius: 6,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <div>
              <p className="label-mono" style={{ marginBottom: 2 }}>Cadence</p>
              <span style={{ fontFamily: 'var(--font-roboto-slab)', fontWeight: 700, fontSize: 16 }}>
                Every {scheduleWeeks} weeks
              </span>
            </div>
          </div>
        </div>

        <div
          className="sticky"
          style={{ padding: 14, transform: 'rotate(2deg)', marginTop: 18 }}
        >
          <p style={{ fontFamily: 'var(--font-caveat)', fontSize: 15, color: 'var(--ink)', lineHeight: 1.4 }}>
            Pro tip: 4 weeks is the sweet spot — long enough to finish, short enough to remember the start.
          </p>
        </div>
      </div>
    </div>
  )
}
