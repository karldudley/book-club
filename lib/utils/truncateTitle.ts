export function truncateTitle(title: string | undefined | null, limit = 40): string {
  if (!title) return ''
  if (title.length <= limit) return title
  return title.slice(0, limit) + '…'
}
