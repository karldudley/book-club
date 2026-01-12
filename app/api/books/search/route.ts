import { NextRequest, NextResponse } from 'next/server'
import { searchBooks } from '@/lib/api/googleBooks'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json(
      {
        error: 'Query parameter is required',
        message: 'Please enter a search term'
      },
      { status: 400 }
    )
  }

  try {
    const results = await searchBooks(query)
    return NextResponse.json(results)
  } catch (error: any) {
    // Parse error to provide helpful messages
    const errorMessage = error?.message || 'Unknown error'

    // Check for specific error types
    if (errorMessage.includes('fetch failed') || errorMessage.includes('network')) {
      return NextResponse.json(
        {
          error: 'Network error',
          message: 'Unable to connect to Google Books. Please check your internet connection and try again.'
        },
        { status: 503 }
      )
    }

    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many search requests. Please wait a moment and try again.'
        },
        { status: 429 }
      )
    }

    if (errorMessage.includes('401') || errorMessage.includes('403')) {
      return NextResponse.json(
        {
          error: 'API authentication error',
          message: 'There was a problem with the book search service. Please try again later.'
        },
        { status: 500 }
      )
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Search failed',
        message: 'Unable to search for books. Please try again or use different search terms.'
      },
      { status: 500 }
    )
  }
}
