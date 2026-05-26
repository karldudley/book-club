/**
 * Query Parser for Google Books API
 *
 * Supported operators:
 * - isbn: Exact ISBN match
 * - intitle: Title search (quoted for phrase matching)
 * - inauthor: Author search
 */

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
 * Converts a raw user query into an optimised Google Books API query.
 *
 * Rules (in priority order):
 * 1. Already has operators → return as-is
 * 2. ISBN → isbn:XXXXXXXXXX
 * 3. "title by author" → intitle:title inauthor:author
 * 4. Everything else → intitle:query
 */
export function parseSearchQuery(query: string): string {
  const trimmed = query.trim()
  if (!trimmed) return trimmed
  if (hasExistingOperators(trimmed)) return trimmed
  if (isISBN(trimmed)) return extractISBN(trimmed)

  const authorQuery = detectAuthorQuery(trimmed)
  if (authorQuery) {
    const { title, author } = authorQuery
    if (title && author) return `intitle:${title} inauthor:${author}`
    if (author) return `inauthor:${author}`
  }

  return `intitle:${trimmed}`
}
