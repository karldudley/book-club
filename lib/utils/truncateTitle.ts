export function truncateTitle(title: string, limit = 40): string {
  if (title.length <= limit) return title
  return title.slice(0, limit) + '…'
}
