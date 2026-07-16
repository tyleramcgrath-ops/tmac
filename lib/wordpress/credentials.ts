// WordPress Application Password normalization.
//
// WordPress core generates Application Passwords as 24 lowercase
// alphanumeric characters, always displayed to the user in six groups of
// four separated by spaces purely for readability (e.g. "abcd efgh ijkl
// mnop qrst uvwx"). Those spaces carry no meaning — they're formatting,
// not part of the secret — so it's always safe to strip every whitespace
// character before using the value. WordPress core does the same
// normalization server-side when checking a password, but we can't rely
// on every host/proxy/security-plugin in front of a site to preserve a
// Basic Auth header with embedded spaces correctly, so we normalize
// before we ever build the Authorization header.

/**
 * Removes all whitespace from a WordPress Application Password. Safe because
 * WP's own password characters are never whitespace — only the display
 * grouping is. Never trims characters that could be part of the secret.
 */
export function normalizeApplicationPassword(raw: string): string {
  return (raw ?? '').replace(/\s+/g, '')
}

/**
 * True if a normalized value looks like a WordPress Application Password
 * (24 lowercase alphanumeric characters). This is advisory only — some
 * hosts/plugins may deviate from the default format — so callers should
 * treat a `false` result as a hint to double check, not a hard rejection.
 */
export function looksLikeApplicationPassword(normalized: string): boolean {
  return /^[a-z0-9]{24}$/i.test(normalized)
}
