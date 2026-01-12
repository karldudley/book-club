/**
 * Query Parser for Google Books API
 *
 * Intelligently parses user search queries and applies Google Books API operators
 * to improve search relevance and spelling tolerance.
 *
 * Supported operators:
 * - isbn: Exact ISBN match
 * - intitle: Title search
 * - inauthor: Author search
 */

/**
 * Checks if a query contains existing Google Books operators
 */
function hasExistingOperators(query: string): boolean {
  const operators = ['intitle:', 'inauthor:', 'inpublisher:', 'subject:', 'isbn:']
  return operators.some(op => query.toLowerCase().includes(op))
}

/**
 * Detects if the query looks like an ISBN (10 or 13 digits, possibly with hyphens)
 */
function isISBN(query: string): boolean {
  // Remove hyphens and spaces
  const cleaned = query.replace(/[-\s]/g, '')
  // Check if it's all digits and has valid length (10 or 13)
  return /^\d{10}$/.test(cleaned) || /^\d{13}$/.test(cleaned)
}

/**
 * Extracts and formats ISBN from query
 */
function extractISBN(query: string): string {
  const cleaned = query.replace(/[-\s]/g, '')
  return `isbn:${cleaned}`
}

/**
 * Detects author-specific queries and extracts author and title portions
 *
 * Patterns recognized:
 * - "title by author"
 * - "title author: author name"
 * - "title written by author"
 */
function detectAuthorQuery(query: string): { author: string; title: string } | null {
  // Pattern: "title by author"
  const byPattern = /^(.+?)\s+by\s+(.+)$/i
  const byMatch = query.match(byPattern)
  if (byMatch) {
    return {
      title: byMatch[1].trim(),
      author: byMatch[2].trim()
    }
  }

  // Pattern: "title author: author name" or "author: author name title"
  const authorPattern = /author:\s*([^,]+)/i
  const authorMatch = query.match(authorPattern)
  if (authorMatch) {
    const author = authorMatch[1].trim()
    // Remove the author: portion to get the title
    const title = query.replace(authorPattern, '').trim()
    if (title) {
      return { author, title }
    }
    // If no title, just return author search
    return { author, title: '' }
  }

  // Pattern: "title written by author"
  const writtenByPattern = /^(.+?)\s+written\s+by\s+(.+)$/i
  const writtenMatch = query.match(writtenByPattern)
  if (writtenMatch) {
    return {
      title: writtenMatch[1].trim(),
      author: writtenMatch[2].trim()
    }
  }

  return null
}

/**
 * Counts the number of words in a query
 */
function countWords(query: string): number {
  return query.trim().split(/\s+/).filter(word => word.length > 0).length
}

/**
 * Main query parser function
 *
 * Intelligently applies Google Books API operators based on query structure:
 * 1. If query already has operators → return as-is
 * 2. If query is ISBN → apply isbn: operator
 * 3. If query has author indicators → apply intitle: and inauthor: operators
 * 4. If query is 3+ words → apply intitle: operator
 * 5. Otherwise → return as-is for maximum flexibility
 *
 * @param query - Raw user search query
 * @returns Optimized query with appropriate operators
 */
export function parseSearchQuery(query: string): string {
  // Trim whitespace
  const trimmed = query.trim()

  // Empty query - return as-is
  if (!trimmed) {
    return trimmed
  }

  // Already has operators - respect user's explicit intent
  if (hasExistingOperators(trimmed)) {
    return trimmed
  }

  // ISBN detection - apply isbn: operator for exact matching
  if (isISBN(trimmed)) {
    return extractISBN(trimmed)
  }

  // Author query detection - split into title and author
  const authorQuery = detectAuthorQuery(trimmed)
  if (authorQuery) {
    const { title, author } = authorQuery
    if (title && author) {
      return `intitle:${title} inauthor:${author}`
    } else if (author) {
      return `inauthor:${author}`
    }
  }

  // Multi-word title optimization (3+ words) - apply intitle: operator
  // This helps Google Books' fuzzy matching work better on titles
  const wordCount = countWords(trimmed)
  if (wordCount >= 3) {
    return `intitle:${trimmed}`
  }

  // Short queries (1-2 words) - keep as-is for maximum flexibility
  // Google Books fuzzy matching works well on these
  return trimmed
}
