export interface ValidationResult {
  ok: boolean
  value?: string
  error?: string
}

/**
 * Validates and normalizes a user-supplied URL.
 * Accepts bare domains ("example.com/page") and adds https:// when missing.
 */
export function validateUrl(raw: string): ValidationResult {
  const input = (raw ?? '').trim()
  if (!input) return { ok: false, error: 'Please enter a URL.' }
  if (input.length > 2048) return { ok: false, error: 'URL is too long.' }
  if (/\s/.test(input)) return { ok: false, error: 'URL must not contain spaces.' }

  const withScheme = /^https?:\/\//i.test(input) ? input : `https://${input}`

  let parsed: URL
  try {
    parsed = new URL(withScheme)
  } catch {
    return { ok: false, error: 'That does not look like a valid URL.' }
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Only http and https URLs are supported.' }
  }

  const host = parsed.hostname
  // Require a dot-separated hostname with a TLD; reject localhost/IPs to avoid SSRF.
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(host)) {
    return { ok: false, error: 'Please enter a public domain name (e.g. example.com/page).' }
  }
  if (isPrivateHostname(host)) {
    return { ok: false, error: 'Private or local addresses are not allowed.' }
  }

  return { ok: true, value: parsed.toString() }
}

export function isPrivateHostname(host: string): boolean {
  const lower = host.toLowerCase()
  if (lower === 'localhost' || lower.endsWith('.localhost') || lower.endsWith('.local') || lower.endsWith('.internal')) {
    return true
  }
  // IPv4 private/loopback/link-local ranges
  const ipv4 = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])]
    if (a === 10 || a === 127 || a === 0) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 169 && b === 254) return true
    return false
  }
  // IPv6 literals
  if (lower.includes(':')) return true
  return false
}

export function validateKeyword(raw: string): ValidationResult {
  const keyword = (raw ?? '').trim().replace(/\s+/g, ' ')
  if (!keyword) return { ok: false, error: 'Please enter a target keyword.' }
  if (keyword.length < 2) return { ok: false, error: 'Keyword is too short.' }
  if (keyword.length > 120) return { ok: false, error: 'Keyword is too long (max 120 characters).' }
  return { ok: true, value: keyword }
}

export function validateCountry(raw: string): ValidationResult {
  const country = (raw ?? 'us').trim().toLowerCase()
  if (!/^[a-z]{2}$/.test(country)) return { ok: false, error: 'Country must be a 2-letter code (e.g. us, gb, de).' }
  return { ok: true, value: country }
}

export function validateLanguage(raw: string | undefined): ValidationResult {
  if (!raw || !raw.trim()) return { ok: true, value: undefined as unknown as string }
  const lang = raw.trim().toLowerCase()
  if (!/^[a-z]{2}(-[a-z]{2})?$/.test(lang)) return { ok: false, error: 'Language must be a code like en or en-gb.' }
  return { ok: true, value: lang }
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
