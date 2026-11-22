/**
 * Only http(s) links are rendered as clickable: a stored `javascript:` or
 * `data:` URL must never reach an href, whatever the backend accepted.
 */
export function safeHttpUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null
  } catch {
    return null
  }
}
