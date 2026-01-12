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
  }
}

export interface GoogleBooksResponse {
  items?: GoogleBook[]
  totalItems: number
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

  return response.json()
}
