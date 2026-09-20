import React from 'react'

/* ---- DogearLogo ---- */
export function DogearLogo({ className }: { className?: string }) {
  return (
    <a
      href="/clubs"
      className={`inline-flex items-center gap-2.5 no-underline${className ? ' ' + className : ''}`}
      style={{ textDecoration: 'none' }}
    >
      <svg width="26" height="32" viewBox="0 0 26 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Page body */}
        <path d="M0 0 H18 L26 9 V32 H0 Z" fill="var(--paper-2)" stroke="var(--ink)" strokeWidth="1.5" strokeLinejoin="round" />
        {/* Folded corner */}
        <path d="M18 0 L26 9 H18 Z" fill="var(--terracotta)" stroke="var(--ink)" strokeWidth="1.5" strokeLinejoin="round" />
        {/* Text lines */}
        <path d="M5 13 L17 13 M5 17 L17 17 M5 21 L13 21" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      </svg>
      <span
        style={{
          fontFamily: 'var(--font-roboto-slab), Georgia, serif',
          fontWeight: 800,
          fontSize: '1.2rem',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        <span style={{ color: 'var(--ink)' }}>Dog</span><span style={{ color: 'var(--terracotta)' }}>ear</span>
      </span>
    </a>
  )
}

/* ---- Stamp ---- */
export function Stamp({
  children,
  variant = 'ink',
  rotate = -2,
  className,
  style,
}: {
  children: React.ReactNode
  variant?: 'red' | 'green' | 'brown' | 'ink'
  rotate?: number
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <span
      className={`stamp stamp-${variant}${className ? ' ' + className : ''}`}
      style={{ transform: `rotate(${rotate}deg)`, ...style }}
    >
      {children}
    </span>
  )
}

/* ---- BookCover ---- */
const COVER_COLORS: [string, string][] = [
  ['#7a3f1d', '#f1d98a'],
  ['#3d5a4a', '#e2d6bd'],
  ['#a8341e', '#f6efe2'],
  ['#2f2a24', '#c89a3a'],
  ['#c97b4a', '#2f2a24'],
]

const sizeMap = {
  sm: { w: 40, h: 60 },
  md: { w: 64, h: 96 },
  lg: { w: 112, h: 168 },
}

/** Deterministic [background, foreground] pair from a title. */
function coverPalette(title: string): [string, string] {
  let hash = 0
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) | 0
  return COVER_COLORS[Math.abs(hash) % COVER_COLORS.length]
}

export function BookCover({
  url,
  title,
  author,
  size = 'md',
}: {
  url?: string | null
  title: string
  author?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const { w, h } = sizeMap[size]

  if (url) {
    return (
      <img
        src={url}
        alt={title}
        className="cover-shadow object-cover flex-shrink-0"
        style={{ width: w, height: h, borderRadius: 2, display: 'block' }}
      />
    )
  }

  // Deterministic color from title
  const [bg, fg] = coverPalette(title)
  const initials = title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase()

  return (
    <div
      className="cover-shadow flex-shrink-0 flex flex-col items-center justify-center"
      style={{
        width: w,
        height: h,
        borderRadius: 2,
        background: bg,
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 6px)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-caveat), cursive',
          fontSize: w * 0.3,
          fontWeight: 600,
          color: fg,
          lineHeight: 1,
          opacity: 0.85,
        }}
      >
        {initials}
      </span>
      {author && size === 'lg' && (
        <span
          style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 8,
            color: fg,
            opacity: 0.6,
            letterSpacing: '0.1em',
            textAlign: 'center',
            padding: '0 6px',
          }}
        >
          {author.split(' ').slice(-1)[0].toUpperCase()}
        </span>
      )}
    </div>
  )
}

/* ---- Avatar ---- */
const AVATAR_COLORS = [
  '#3d5a4a', '#7a3f1d', '#c97b4a', '#a8341e', '#c89a3a', '#2f2a24',
]

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const idx = Math.abs(name.charCodeAt(0) || 0) % AVATAR_COLORS.length
  const initial = (name[0] || '?').toUpperCase()
  return (
    <div
      className="avatar"
      title={name}
      style={{
        width: size,
        height: size,
        background: AVATAR_COLORS[idx],
        fontSize: Math.round(size * 0.4),
      }}
    >
      {initial}
    </div>
  )
}

/* ---- SketchDivider ---- */
export function SketchDivider({ color = 'var(--ink-3)' }: { color?: string }) {
  return (
    <svg
      width="100%"
      height="12"
      viewBox="0 0 400 12"
      preserveAspectRatio="none"
      fill="none"
      style={{ display: 'block', marginTop: 4, marginBottom: 4 }}
    >
      <path
        d="M0,6 C40,2 80,10 120,6 C160,2 200,10 240,6 C280,2 320,10 360,6 C380,4 390,7 400,6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  )
}

/* ---- StarRating ---- */
export function StarRating({
  rating,
  size = 14,
}: {
  rating?: number | null
  size?: number
}) {
  if (!rating) return null
  // Map 1–10 to 5 stars
  const filled = rating / 2
  return (
    <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const level = filled >= i ? 'full' : filled >= i - 0.5 ? 'half' : 'empty'
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 20 20" style={{ overflow: 'visible', flexShrink: 0 }}>
            {level !== 'empty' && (
              <polygon
                points="10,1.5 12.4,7.4 18.8,7.9 13.9,12 15.5,18.2 10,14.8 4.5,18.2 6.1,12 1.2,7.9 7.6,7.4"
                fill="var(--mustard)"
                clipPath={level === 'half' ? `polygon(0 0, 50% 0, 50% 100%, 0 100%)` : undefined}
                style={level === 'half' ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
              />
            )}
            <polygon
              points="10,1.5 12.4,7.4 18.8,7.9 13.9,12 15.5,18.2 10,14.8 4.5,18.2 6.1,12 1.2,7.9 7.6,7.4"
              fill="none"
              stroke="var(--mustard)"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        )
      })}
    </span>
  )
}

/* ---- RatingHistogram ---- */
export function RatingHistogram({
  ratings,
  height = 64,
}: {
  ratings: number[]
  height?: number
}) {
  if (!ratings || ratings.length === 0) return null

  const buckets = Array.from({ length: 10 }, (_, i) =>
    ratings.filter((r) => Math.round(r) === i + 1).length
  )
  const peak = Math.max(...buckets)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height }}>
        {buckets.map((count, i) => (
          <div
            key={i}
            title={`${count} ${count === 1 ? 'rating' : 'ratings'} of ${i + 1}/10`}
            style={{
              flex: 1,
              // Empty buckets keep a stub so the axis reads as a full 1-10 scale.
              height: count === 0 ? 2 : Math.max(4, (count / peak) * height),
              background: count === 0 ? 'var(--ink-3)' : 'var(--mustard)',
              border: count === 0 ? 'none' : '1.5px solid var(--ink)',
              borderRadius: 3,
              transition: 'height 300ms ease',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 5 }}>
        {buckets.map((_, i) => (
          <span
            key={i}
            className="label-mono"
            style={{ flex: 1, textAlign: 'center', fontSize: 9 }}
          >
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---- StatTile ---- */
export function StatTile({
  label,
  value,
  sub,
  variant = 'paper',
}: {
  label: string
  value: string | number
  sub?: string
  variant?: 'paper' | 'kraft' | 'ink'
}) {
  const palette = {
    paper: { bg: 'var(--paper)', fg: 'var(--ink)' },
    kraft: { bg: 'var(--paper-2)', fg: 'var(--ink)' },
    ink: { bg: 'var(--ink)', fg: 'var(--paper)' },
  }[variant]

  return (
    <div
      style={{
        background: palette.bg,
        color: palette.fg,
        border: '1.5px solid var(--ink)',
        borderRadius: 'var(--r-md)',
        boxShadow: '3px 3px 0 var(--ink)',
        padding: '14px 16px',
      }}
    >
      <p
        className="label-mono"
        style={{ marginBottom: 6, color: variant === 'ink' ? 'var(--paper-3)' : undefined }}
      >
        {label}
      </p>
      <div
        style={{
          fontFamily: 'var(--font-roboto-slab)',
          fontWeight: 800,
          fontSize: 26,
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
      {sub && (
        <p
          className="eyebrow"
          style={{ marginTop: 5, color: variant === 'ink' ? 'var(--paper-3)' : undefined }}
        >
          {sub}
        </p>
      )}
    </div>
  )
}

/* ---- Bookshelf ---- */
export interface ShelfBook {
  id: string
  title: string
  author?: string | null
  coverUrl?: string | null
  rating?: number | null
  href?: string
}

export function Bookshelf({ books, height = 150 }: { books: ShelfBook[]; height?: number }) {
  if (!books || books.length === 0) return null

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 5,
          overflowX: 'auto',
          paddingBottom: 4,
        }}
      >
        {books.map((book) => {
          const [bg, fg] = coverPalette(book.title)
          // Vary spine width slightly by title length, like real books.
          const width = 26 + (book.title.length % 5) * 4
          const spine = (
            <div
              title={`${book.title}${book.author ? ` — ${book.author}` : ''}`}
              style={{
                width,
                height,
                flexShrink: 0,
                background: bg,
                color: fg,
                border: '1.5px solid var(--ink)',
                borderRadius: '2px 2px 0 0',
                boxShadow: '2px 0 0 rgba(47,42,36,0.18)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 4px',
                cursor: book.href ? 'pointer' : 'default',
              }}
            >
              <span
                style={{
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed',
                  fontFamily: 'var(--font-roboto-slab)',
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxHeight: height - 34,
                }}
              >
                {book.title}
              </span>
              {book.rating ? (
                <span
                  style={{
                    fontFamily: 'var(--font-jetbrains-mono)',
                    fontSize: 9,
                    fontWeight: 700,
                    opacity: 0.85,
                  }}
                >
                  {book.rating.toFixed(1)}
                </span>
              ) : null}
            </div>
          )

          return book.href ? (
            <a
              key={book.id}
              href={book.href}
              style={{ textDecoration: 'none', display: 'block', flexShrink: 0 }}
            >
              {spine}
            </a>
          ) : (
            <div key={book.id} style={{ flexShrink: 0 }}>
              {spine}
            </div>
          )
        })}
      </div>
      {/* Shelf edge */}
      <div
        style={{
          height: 8,
          background: 'var(--paper-3)',
          border: '1.5px solid var(--ink)',
          borderRadius: '0 0 4px 4px',
          boxShadow: '4px 4px 0 var(--ink)',
        }}
      />
    </div>
  )
}
