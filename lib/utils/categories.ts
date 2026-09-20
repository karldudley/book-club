/**
 * Google Books returns full taxonomy paths, not tags:
 *
 *   ["Fiction / General", "Fiction / Literary",
 *    "Fiction / Magical Realism", "Fiction / Animals"]
 *
 * Rendered as-is that's four chips all starting "Fiction /", which is noise.
 * Split the paths into their parts, dedupe, and keep the most useful few:
 *
 *   ["Fiction", "Literary", "Magical Realism"]
 */

/**
 * Path segments that carry no meaning on their own. "General" is the big one —
 * Google appends it whenever a book has no more specific subject.
 */
const NOISE = new Set(['general', 'other', 'miscellaneous', 'nonclassifiable', 'unclassified'])

const SEPARATORS = /[/>|·]|\s+-\s+/

/** Title-case a segment, leaving existing capitalisation in acronyms alone. */
function tidy(segment: string): string {
  return segment.trim().replace(/\s+/g, ' ')
}

export function formatCategories(
  categories: string[] | null | undefined,
  limit = 3
): string[] {
  if (!categories || categories.length === 0) return []

  const seen = new Set<string>()
  const out: string[] = []

  for (const raw of categories) {
    if (!raw) continue
    for (const part of raw.split(SEPARATORS)) {
      const label = tidy(part)
      if (!label) continue

      const key = label.toLowerCase()
      if (NOISE.has(key) || seen.has(key)) continue

      seen.add(key)
      out.push(label)
    }
  }

  return out.slice(0, limit)
}
