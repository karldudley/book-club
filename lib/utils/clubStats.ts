/**
 * Club statistics, computed in JS rather than SQL — a club is a handful of
 * members and tens of books, so the whole dataset is already in memory on the
 * page that needs it.
 *
 * Every function here must survive an empty or single-rater club: a brand-new
 * club has no completed books and no ratings, and must not produce NaN.
 */

/** A book needs this many ratings before it can be ranked. */
export const MIN_RATINGS = 2

/** A member needs to have rated this many books before appearing in leaderboards. */
export const MIN_RATED = 3

export interface RatingRow {
  book_id: string
  user_id: string
  rating: number
}

export interface BookRow {
  id: string
  title: string
  author?: string | null
  cover_url?: string | null
  page_count?: number | null
  picked_by?: string | null
  status: 'suggested' | 'active' | 'completed'
}

export interface MemberRow {
  id: string
  name: string
}

export interface BookStat {
  id: string
  title: string
  author?: string | null
  coverUrl?: string | null
  average: number
  count: number
  min: number
  max: number
  spread: number
  stdDev: number
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/**
 * Population standard deviation (divide by n, not n-1). With 2-5 raters the
 * sample version inflates small groups, and "how spread out were these five
 * opinions" is a question about the group we have, not an estimate of a wider
 * population we'll never see.
 */
export function stdDev(values: number[]): number | null {
  const avg = mean(values)
  if (avg === null) return null
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

/** Per-book aggregates for every book that clears MIN_RATINGS. */
export function buildBookStats(books: BookRow[], ratings: RatingRow[]): BookStat[] {
  return books
    .map((book): BookStat | null => {
      const scores = ratings.filter(r => r.book_id === book.id).map(r => r.rating)
      if (scores.length < MIN_RATINGS) return null

      const average = mean(scores)
      const deviation = stdDev(scores)
      if (average === null || deviation === null) return null

      return {
        id: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.cover_url,
        average,
        count: scores.length,
        min: Math.min(...scores),
        max: Math.max(...scores),
        spread: Math.max(...scores) - Math.min(...scores),
        stdDev: deviation,
      }
    })
    .filter((stat): stat is BookStat => stat !== null)
}

/** Books with exactly one verdict — shown separately rather than ranked. */
export function singleVerdictBooks(books: BookRow[], ratings: RatingRow[]): BookRow[] {
  return books.filter(book => ratings.filter(r => r.book_id === book.id).length === 1)
}

export function highestRated(stats: BookStat[], limit = 5): BookStat[] {
  return [...stats]
    .sort((a, b) => b.average - a.average || b.count - a.count)
    .slice(0, limit)
}

export function lowestRated(stats: BookStat[], limit = 5): BookStat[] {
  return [...stats]
    .sort((a, b) => a.average - b.average || b.count - a.count)
    .slice(0, limit)
}

export function mostDivisive(stats: BookStat[], limit = 5): BookStat[] {
  return [...stats]
    .sort((a, b) => b.stdDev - a.stdDev || b.spread - a.spread)
    .slice(0, limit)
}

export function mostUnanimous(stats: BookStat[], limit = 5): BookStat[] {
  return [...stats]
    .sort((a, b) => a.stdDev - b.stdDev || a.spread - b.spread)
    .slice(0, limit)
}

export interface ClubTotals {
  booksCompleted: number
  booksSuggested: number
  pagesRead: number
  ratingsGiven: number
  clubAverage: number | null
}

export function clubTotals(books: BookRow[], ratings: RatingRow[]): ClubTotals {
  const completed = books.filter(b => b.status === 'completed')
  return {
    booksCompleted: completed.length,
    booksSuggested: books.length,
    pagesRead: completed.reduce((sum, b) => sum + (b.page_count ?? 0), 0),
    ratingsGiven: ratings.length,
    clubAverage: mean(ratings.map(r => r.rating)),
  }
}

export interface MemberStat {
  id: string
  name: string
  ratedCount: number
  averageGiven: number | null
  suggestedCount: number
  activatedCount: number
  /**
   * Mean absolute gap between this member's score and everyone *else's* average
   * on the same book. Leave-one-out matters: including the member themselves
   * makes every member's deviation identical when only two people rated.
   */
  contrarianScore: number | null
  /** Qualifies for average-based leaderboards (harshest / most generous). */
  qualified: boolean
}

export function buildMemberStats(
  members: MemberRow[],
  books: BookRow[],
  ratings: RatingRow[]
): MemberStat[] {
  return members.map(member => {
    const theirs = ratings.filter(r => r.user_id === member.id)
    const suggested = books.filter(b => b.picked_by === member.id)

    const deviations: number[] = []
    for (const rating of theirs) {
      const others = ratings
        .filter(r => r.book_id === rating.book_id && r.user_id !== member.id)
        .map(r => r.rating)
      const othersAvg = mean(others)
      if (othersAvg !== null) deviations.push(Math.abs(rating.rating - othersAvg))
    }

    return {
      id: member.id,
      name: member.name,
      ratedCount: theirs.length,
      averageGiven: mean(theirs.map(r => r.rating)),
      suggestedCount: suggested.length,
      activatedCount: suggested.filter(
        b => b.status === 'active' || b.status === 'completed'
      ).length,
      contrarianScore: mean(deviations),
      qualified: theirs.length >= MIN_RATED,
    }
  })
}

/** Lowest average given, among members who have rated enough books. */
export function harshestCritic(stats: MemberStat[]): MemberStat | null {
  const eligible = stats.filter(s => s.qualified && s.averageGiven !== null)
  if (eligible.length === 0) return null
  return eligible.reduce((low, s) =>
    (s.averageGiven as number) < (low.averageGiven as number) ? s : low
  )
}

/** Highest average given, among members who have rated enough books. */
export function mostGenerous(stats: MemberStat[]): MemberStat | null {
  const eligible = stats.filter(s => s.qualified && s.averageGiven !== null)
  if (eligible.length === 0) return null
  return eligible.reduce((high, s) =>
    (s.averageGiven as number) > (high.averageGiven as number) ? s : high
  )
}

export function biggestContrarian(stats: MemberStat[]): MemberStat | null {
  const eligible = stats.filter(s => s.qualified && s.contrarianScore !== null)
  if (eligible.length === 0) return null
  return eligible.reduce((top, s) =>
    (s.contrarianScore as number) > (top.contrarianScore as number) ? s : top
  )
}

export function topSuggester(stats: MemberStat[]): MemberStat | null {
  const eligible = stats.filter(s => s.suggestedCount > 0)
  if (eligible.length === 0) return null
  return eligible.reduce((top, s) => (s.suggestedCount > top.suggestedCount ? s : top))
}
