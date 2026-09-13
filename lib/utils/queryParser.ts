/**
 * Query Parser for Google Books API
 *
 * Supported operators:
 * - isbn: Exact ISBN match
 * - intitle: Title search
 * - inauthor: Author search (quoted so multi-word names bind to the operator)
 *
 * A raw query becomes one or more strategies. Plain queries fan out to both a
 * title and an author search, because Google Books gives no useful results for
 * an author name sent to `intitle:` — and no useful results for anything sent
 * without an operator at all.
 */

export type StrategyKind = 'title' | 'author' | 'exact' | 'raw'

export interface SearchStrategy {
  q: string
  kind: StrategyKind
}

function hasExistingOperators(query: string): boolean {
  const operators = ['intitle:', 'inauthor:', 'inpublisher:', 'subject:', 'isbn:']
  return operators.some(op => query.toLowerCase().includes(op))
}

function isISBN(query: string): boolean {
  const cleaned = query.replace(/[-\s]/g, '')
  return /^\d{10}$/.test(cleaned) || /^\d{13}$/.test(cleaned)
}

function extractISBN(query: string): string {
  const cleaned = query.replace(/[-\s]/g, '')
  return `isbn:${cleaned}`
}

/** Quotes a value so a multi-word name stays bound to its operator. */
function quote(value: string): string {
  return `"${value.replace(/"/g, '')}"`
}

/**
 * Detects "title by author" / "title written by author" patterns.
 */
function detectAuthorQuery(query: string): { author: string; title: string } | null {
  const byPattern = /^(.+?)\s+(?:written\s+)?by\s+(.+)$/i
  const byMatch = query.match(byPattern)
  if (byMatch) {
    return { title: byMatch[1].trim(), author: byMatch[2].trim() }
  }

  const authorPattern = /author:\s*([^,]+)/i
  const authorMatch = query.match(authorPattern)
  if (authorMatch) {
    const author = authorMatch[1].trim()
    const title = query.replace(authorPattern, '').trim()
    return title ? { author, title } : { author, title: '' }
  }

  return null
}

/**
 * Converts a raw user query into the Google Books queries worth running.
 *
 * Rules (in priority order):
 * 1. Already has operators → run as-is
 * 2. ISBN → isbn:XXXXXXXXXX
 * 3. "title by author" → intitle:title inauthor:"author"
 * 4. Everything else → intitle:query AND inauthor:"query", merged by the caller
 */
export function parseSearchQuery(query: string): SearchStrategy[] {
  const trimmed = query.trim()
  if (!trimmed) return []
  if (hasExistingOperators(trimmed)) return [{ q: trimmed, kind: 'raw' }]
  if (isISBN(trimmed)) return [{ q: extractISBN(trimmed), kind: 'exact' }]

  const authorQuery = detectAuthorQuery(trimmed)
  if (authorQuery) {
    const { title, author } = authorQuery
    if (title && author) {
      return [{ q: `intitle:${title} inauthor:${quote(author)}`, kind: 'exact' }]
    }
    if (author) return [{ q: `inauthor:${quote(author)}`, kind: 'author' }]
  }

  return [
    { q: `intitle:${trimmed}`, kind: 'title' },
    { q: `inauthor:${quote(trimmed)}`, kind: 'author' },
  ]
}
