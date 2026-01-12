import { parseSearchQuery } from '@/lib/utils/queryParser'

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
  }
}

export interface GoogleBooksResponse {
  items?: GoogleBook[]
  totalItems: number
}

/**
 * Calculates a popularity score for a book based on ratings
 * Higher scores indicate more popular books
 *
 * Formula: (averageRating * ratingsCount) with weighting
 * - Books with more ratings are considered more popular
 * - Books with higher average ratings rank higher
 * - Books without ratings get score of 0
 */
function calculatePopularityScore(book: GoogleBook): number {
  const { averageRating = 0, ratingsCount = 0 } = book.volumeInfo

  // No ratings = no popularity score
  if (ratingsCount === 0) return 0

  // Use a weighted formula: rating * log(ratingsCount + 1)
  // This prevents books with many low ratings from outranking books with fewer high ratings
  return averageRating * Math.log(ratingsCount + 1)
}

/**
 * Sorts books by popularity (highest to lowest)
 * Books with ratings appear first, followed by books without ratings
 */
function sortByPopularity(books: GoogleBook[]): GoogleBook[] {
  return books.sort((a, b) => {
    const scoreA = calculatePopularityScore(a)
    const scoreB = calculatePopularityScore(b)
    return scoreB - scoreA // Descending order
  })
}

export async function searchBooks(query: string): Promise<GoogleBooksResponse> {
  // Parse and optimize the query for better results
  const optimizedQuery = parseSearchQuery(query)

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY || ''
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
    optimizedQuery
  )}&maxResults=20${apiKey ? `&key=${apiKey}` : ''}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to search books')
  }

  const data: GoogleBooksResponse = await response.json()

  // Sort results by popularity if we have items
  if (data.items && data.items.length > 0) {
    data.items = sortByPopularity(data.items)
  }

  return data
}
