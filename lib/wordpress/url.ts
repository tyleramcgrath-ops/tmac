// WordPress site URL normalization.
//
// Users type all sorts of things into a "WordPress site URL" field:
// bare domains, www or not, a scheme or not, a trailing slash, a
// subdirectory install, or even the REST API root itself. This turns
// whatever they typed into a canonical site URL plus the correct REST
// API root, without ever guessing past what's actually there.

export interface NormalizedWordPressUrl {
  /** Canonical site URL, no trailing slash, e.g. https://example.com or https://example.com/blog */
  siteUrl: string
  /** REST API root, always ending in /wp-json/, e.g. https://example.com/wp-json/ */
  restRoot: string
  /** true if the user's input already pointed at /wp-json (we didn't append it) */
  restRootWasExplicit: boolean
  /** true if the resolved URL uses http:// rather than https:// */
  isInsecure: boolean
}

export interface UrlNormalizationError {
  error: string
}

export function normalizeWordPressUrl(rawInput: string): NormalizedWordPressUrl | UrlNormalizationError {
  const input = (rawInput ?? '').trim()
  if (!input) {
    return { error: 'Enter your WordPress site URL.' }
  }

  // Users routinely omit the scheme ("example.com", "www.example.com").
  // Default to https — WordPress Application Passwords require it anyway
  // outside of localhost, and most hosts redirect http -> https regardless.
  const withScheme = /^https?:\/\//i.test(input) ? input : `https://${input}`

  let u: URL
  try {
    u = new URL(withScheme)
  } catch {
    return { error: `"${rawInput}" doesn't look like a valid URL.` }
  }

  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return { error: 'The WordPress site URL must use http or https.' }
  }
  if (!u.hostname || !u.hostname.includes('.')) {
    return { error: `"${rawInput}" doesn't look like a valid domain.` }
  }

  const isInsecure = u.protocol === 'http:'

  // Strip trailing slash from the path (but keep a real subdirectory install path).
  let pathname = u.pathname.replace(/\/+$/, '')

  // Did the user already paste in the REST API root (or a path under it)?
  // Don't blindly append /wp-json/ on top of an already-complete REST URL.
  const wpJsonMatch = pathname.match(/^(.*)\/wp-json(?:\/.*)?$/i)
  if (wpJsonMatch) {
    const base = wpJsonMatch[1] // everything before /wp-json
    const siteUrl = `${u.protocol}//${u.host}${base}`
    return {
      siteUrl,
      restRoot: `${siteUrl}/wp-json/`,
      restRootWasExplicit: true,
      isInsecure,
    }
  }

  const siteUrl = `${u.protocol}//${u.host}${pathname}`
  return {
    siteUrl,
    restRoot: `${siteUrl}/wp-json/`,
    restRootWasExplicit: false,
    isInsecure,
  }
}

export function isUrlNormalizationError(v: NormalizedWordPressUrl | UrlNormalizationError): v is UrlNormalizationError {
  return 'error' in v
}
