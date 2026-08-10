export function sanitizeInternalRedirect(value: unknown, fallback = '/home') {
  if (typeof value !== 'string') return fallback

  const target = value.trim()

  if (
    !target.startsWith('/') ||
    target.startsWith('//') ||
    target.includes('\\') ||
    [...target].some((character) => {
      const code = character.charCodeAt(0)
      return code <= 31 || code === 127
    })
  ) {
    return fallback
  }

  try {
    const baseUrl = new URL('https://randsa.local')
    const parsed = new URL(target, baseUrl)

    if (parsed.origin !== baseUrl.origin) return fallback

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}
