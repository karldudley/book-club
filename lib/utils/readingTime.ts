export function formatReadingTime(pages: number): { read: string; listen: string } {
  return {
    read: fmt(Math.round(pages)),          // 250 wpm, ~250 words/page → 1 min/page
    listen: fmt(Math.round(pages * 1.75)), // 155 wpm narration → 1.75 min/page
  }
}

function fmt(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
