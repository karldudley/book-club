import { Avatar } from '@/components/ui/dogear'

interface Event {
  id: string
  event_type: string
  payload: Record<string, unknown>
  created_at: string
  actor: {
    id: string
    display_name: string | null
    email: string
  } | null
}

interface ActivityFeedProps {
  events: Event[]
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function eventText(event: Event): { bold: string; rest: string } {
  const p = event.payload
  const title = p.book_title as string | undefined

  switch (event.event_type) {
    case 'book_suggested':
      return p.is_secret
        ? { bold: '', rest: 'suggested a mystery book' }
        : { bold: '', rest: `suggested ${title ? `"${title}"` : 'a book'}` }
    case 'book_activated':
      return p.was_secret
        ? { bold: '', rest: `revealed and activated "${title}"` }
        : { bold: '', rest: `activated "${title}"` }
    case 'book_completed':
      return { bold: '', rest: `marked "${title}" as complete` }
    case 'book_rated': {
      const rating = p.rating as number | undefined
      return { bold: '', rest: `rated "${title}" ${rating}/10` }
    }
    case 'member_joined':
      return { bold: '', rest: 'joined the club' }
    default:
      return { bold: '', rest: event.event_type.replace(/_/g, ' ') }
  }
}

export default function ActivityFeed({ events }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <p className="text-ink-3 py-3" style={{ fontSize: 13, fontStyle: 'italic' }}>
        No activity yet.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-0">
      {events.map((event, i) => {
        const name = event.actor?.display_name || event.actor?.email || 'Someone'
        const { rest } = eventText(event)
        return (
          <div
            key={event.id}
            className="flex items-start gap-3 py-3"
            style={{
              borderBottom: i < events.length - 1 ? '1px dashed var(--ink-3)' : 'none',
            }}
          >
            <Avatar name={name} size={28} />
            <div className="flex-1 min-w-0">
              <span style={{ fontSize: 13, lineHeight: 1.45 }}>
                <strong style={{ fontWeight: 700 }}>{name}</strong>{' '}
                <span className="text-ink-2">{rest}</span>
              </span>
            </div>
            <span className="label-mono text-ink-3 shrink-0" style={{ fontSize: 9, marginTop: 3 }}>
              {relativeTime(event.created_at)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
