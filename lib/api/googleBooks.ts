import { parseSearchQuery, SearchStrategy } from '@/lib/utils/queryParser'

export interface GoogleBook {
  id: string
  volumeInfo: {
    title: string
    authors?: string[]
    description?: string
    imageLinks?: {
      thumbnail?: string
      smallThumbnail?: string
    }
    publishedDate?: string
    pageCount?: number
    averageRating?: number
    ratingsCount?: number
    printType?: string
  }
}

export interface GoogleBooksResponse {
  items?: GoogleBook[]
  totalItems: number
}

/** Relevance boosts. Text matches always outrank position and popularity. */
const EXACT_TITLE_BOOST = 1000
const AUTHOR_EXACT_BOOST = 800
const TITLE_PREFIX_BOOST = 400
const AUTHOR_PARTIAL_BOOST = 300

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Ratings only break ties — capped below 1 so it can never reorder two books
 * that differ on text match or origin rank. An unrated book must never be
 * demoted below a rated but less relevant one.
 */
function ratingTiebreak(book: GoogleBook): number {
  const { averageRating = 0, ratingsCount = 0 } = book.volumeInfo
  if (ratingsCount === 0) return 0
  const raw = averageRating * Math.log(ratingsCount + 1)
  return raw / (raw + 10)
}

function relevanceScore(book: GoogleBook, rawQuery: string, rank: number): number {
  const query = normalise(rawQuery)
  const title = normalise(book.volumeInfo.title || '')
  const authors = (book.volumeInfo.authors || []).map(normalise)

  let score = -rank

  if (title && title === query) score += EXACT_TITLE_BOOST
  else if (title && title.startsWith(query)) score += TITLE_PREFIX_BOOST

  if (authors.some(author => author === query)) score += AUTHOR_EXACT_BOOST
  else if (query && authors.some(author => author.includes(query) || query.includes(author))) {
    score += AUTHOR_PARTIAL_BOOST
  }

  return score + ratingTiebreak(book)
}

const RETRY_DELAYS_MS = [300, 900]

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Google Books returns a transient 503 "Service temporarily unavailable" often
 * enough that a single attempt regularly fails a perfectly good search, so
 * retry server errors with a short backoff. 4xx is the caller's fault — don't
 * retry those.
 */
async function fetchVolumes(query: string): Promise<GoogleBook[]> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY || ''
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
    query
  )}&printType=books&maxResults=20${apiKey ? `&key=${apiKey}` : ''}`

  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, { cache: 'no-store' })

    if (response.ok) {
      const data: GoogleBooksResponse = await response.json()
      return data.items || []
    }

    if (response.status < 500 || attempt >= RETRY_DELAYS_MS.length) {
      throw new Error(`API error ${response.status}`)
    }

    await sleep(RETRY_DELAYS_MS[attempt])
  }
}

export async function searchBooks(query: string): Promise<GoogleBooksResponse> {
  const strategies: SearchStrategy[] = parseSearchQuery(query)
  if (strategies.length === 0) return { items: [], totalItems: 0 }

  const settled = await Promise.allSettled(strategies.map(({ q }) => fetchVolumes(q)))

  const failures = settled.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected'
  )

  const scored = new Map<string, { book: GoogleBook; score: number }>()

  settled.forEach(result => {
    if (result.status !== 'fulfilled') return
    result.value.forEach((book, rank) => {
      const score = relevanceScore(book, query, rank)
      const existing = scored.get(book.id)
      if (!existing || score > existing.score) scored.set(book.id, { book, score })
    })
  })

  const items = [...scored.values()].sort((a, b) => b.score - a.score).map(({ book }) => book)

  // A strategy failing (Google 503s intermittently) is survivable as long as
  // another one produced results. With nothing to show, surface the failure —
  // "no books found" would wrongly tell the user the book doesn't exist.
  if (items.length === 0 && failures.length > 0) throw failures[0].reason

  return { items, totalItems: items.length }
}
