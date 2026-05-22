'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function JoinClubForm() {
  const [cells, setCells] = useState<string[]>(['', '', '', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const supabase = createClient()

  const inviteCode = cells.join('').toUpperCase()

  const handleCellChange = (idx: number, value: string) => {
    const char = value.replace(/[^a-zA-Z0-9]/g, '').slice(-1).toUpperCase()
    const next = [...cells]
    next[idx] = char
    setCells(next)
    if (char && idx < 5) {
      inputRefs.current[idx + 1]?.focus()
    }
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !cells[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6)
    const next = ['', '', '', '', '', '']
    for (let i = 0; i < text.length; i++) next[i] = text[i]
    setCells(next)
    inputRefs.current[Math.min(text.length, 5)]?.focus()
  }

  const handleSubmit = async () => {
    if (inviteCode.length !== 6) return
    setError(null)
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { data: clubId, error: clubError } = await (supabase as any)
        .rpc('get_club_id_by_invite_code', { p_code: inviteCode })

      if (clubError || !clubId) {
        throw new Error('Invalid invite code')
      }

      const { data: existingMember } = await supabase
        .from('club_members')
        .select('id')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .single() as { data: any }

      if (existingMember) {
        throw new Error('You are already a member of this club')
      }

      const { error: memberError } = await (supabase
        .from('club_members') as any)
        .insert({
          club_id: clubId,
          user_id: user.id,
        })

      if (memberError) throw memberError

      router.push(`/clubs/${clubId}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const cellStyle = (isFocused: boolean, hasValue: boolean): React.CSSProperties => ({
    width: '100%',
    aspectRatio: '3/4',
    textAlign: 'center',
    fontSize: 32,
    fontFamily: 'var(--font-jetbrains-mono)',
    fontWeight: 700,
    textTransform: 'uppercase',
    border: '1.5px solid var(--ink)',
    borderRadius: 8,
    background: hasValue ? 'var(--paper-2)' : 'var(--paper)',
    color: 'var(--ink)',
    outline: 'none',
    boxShadow: isFocused ? '3px 3px 0 var(--terracotta)' : 'none',
    transform: isFocused ? 'translate(-1px, -1px)' : 'none',
    transition: 'box-shadow 80ms, transform 80ms',
    caretColor: 'var(--terracotta)',
  })

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
        {cells.map((c, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el }}
            type="text"
            value={c}
            maxLength={1}
            autoCapitalize="characters"
            onChange={(e) => handleCellChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '3px 3px 0 var(--terracotta)'
              e.currentTarget.style.transform = 'translate(-1px, -1px)'
              e.currentTarget.style.background = 'var(--paper-2)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.background = c ? 'var(--paper-2)' : 'var(--paper)'
            }}
            style={cellStyle(false, !!c)}
          />
        ))}
      </div>

      <p className="eyebrow" style={{ marginTop: 14, textAlign: 'center' }}>
        6 characters, all caps — check your messages
      </p>

      {error && (
        <div
          style={{
            marginTop: 16,
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

      {inviteCode.length === 6 && (
        <div
          className="card kraft-bg"
          style={{ marginTop: 20, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}
        >
          <div>
            <p className="label-mono" style={{ marginBottom: 4 }}>Code ready</p>
            <span
              style={{
                fontFamily: 'var(--font-jetbrains-mono)',
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: '0.22em',
                color: 'var(--ink)',
              }}
            >
              {inviteCode}
            </span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn-primary"
            style={{ height: 48 }}
          >
            {loading ? 'Joining…' : 'Join Club →'}
          </button>
        </div>
      )}
    </div>
  )
}
