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
    printType?: string
  }
}

export interface GoogleBooksResponse {
  items?: GoogleBook[]
  totalItems: number
}

function popularityScore(book: GoogleBook): number {
  const { averageRating = 0, ratingsCount = 0 } = book.volumeInfo
  if (ratingsCount === 0) return 0
  return averageRating * Math.log(ratingsCount + 1)
}

export async function searchBooks(query: string): Promise<GoogleBooksResponse> {
  const optimizedQuery = parseSearchQuery(query)
  const wordCount = query.trim().split(/\s+/).length

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY || ''
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
    optimizedQuery
  )}&printType=books&maxResults=20${apiKey ? `&key=${apiKey}` : ''}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`API error ${response.status}`)
  }

  const data: GoogleBooksResponse = await response.json()
  if (data.items && wordCount <= 2) {
    data.items = [...data.items].sort((a, b) => popularityScore(b) - popularityScore(a))
  }
  return data
}
