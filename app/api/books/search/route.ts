import { NextRequest, NextResponse } from 'next/server'
import { searchBooks } from '@/lib/api/googleBooks'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  try {
    const results = await searchBooks(query)
    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to search books' }, { status: 500 })
  }
}
