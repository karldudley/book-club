'use client'

import { useLinkStatus } from 'next/link'

/**
 * Drop inside a <Link> to show navigation feedback on the thing that was
 * actually clicked. useLinkStatus reads the pending state of the nearest
 * enclosing Link, so the surrounding page stays a server component.
 *
 * Idle state renders the chevron, so the affordance and the spinner occupy the
 * same box and the row doesn't reflow mid-navigation.
 */
export default function LinkPending({ size = 14 }: { size?: number }) {
  const { pending } = useLinkStatus()

  return (
    <span
      aria-hidden={!pending}
      aria-live="polite"
      className="link-pending"
      style={{ width: size, height: size }}
    >
      {pending ? (
        <span className="link-spinner" style={{ width: size, height: size }} />
      ) : (
        <span className="link-chevron" style={{ fontSize: size }}>
          →
        </span>
      )}
    </span>
  )
}
