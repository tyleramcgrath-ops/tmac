import { describe, it, expect } from 'vitest'
import { normalizeWordPressUrl, isUrlNormalizationError } from '../url'

describe('normalizeWordPressUrl', () => {
  it('accepts a bare domain and defaults to https', () => {
    const r = normalizeWordPressUrl('example.com')
    expect(isUrlNormalizationError(r)).toBe(false)
    if (!isUrlNormalizationError(r)) {
      expect(r.siteUrl).toBe('https://example.com')
      expect(r.restRoot).toBe('https://example.com/wp-json/')
      expect(r.isInsecure).toBe(false)
    }
  })

  it('accepts www subdomain', () => {
    const r = normalizeWordPressUrl('www.example.com')
    expect(isUrlNormalizationError(r)).toBe(false)
    if (!isUrlNormalizationError(r)) expect(r.siteUrl).toBe('https://www.example.com')
  })

  it('accepts a full https URL as-is', () => {
    const r = normalizeWordPressUrl('https://example.com')
    if (!isUrlNormalizationError(r)) expect(r.siteUrl).toBe('https://example.com')
  })

  it('strips a trailing slash', () => {
    const r = normalizeWordPressUrl('https://example.com/')
    if (!isUrlNormalizationError(r)) expect(r.siteUrl).toBe('https://example.com')
  })

  it('preserves a subdirectory install', () => {
    const r = normalizeWordPressUrl('https://example.com/wordpress')
    if (!isUrlNormalizationError(r)) {
      expect(r.siteUrl).toBe('https://example.com/wordpress')
      expect(r.restRoot).toBe('https://example.com/wordpress/wp-json/')
    }
  })

  it('does not double-append /wp-json/ when the user already pasted the REST root', () => {
    const r = normalizeWordPressUrl('https://example.com/wp-json/')
    if (!isUrlNormalizationError(r)) {
      expect(r.siteUrl).toBe('https://example.com')
      expect(r.restRoot).toBe('https://example.com/wp-json/')
      expect(r.restRootWasExplicit).toBe(true)
    }
  })

  it('does not double-append /wp-json/ for a subdirectory install REST root', () => {
    const r = normalizeWordPressUrl('https://example.com/blog/wp-json')
    if (!isUrlNormalizationError(r)) {
      expect(r.siteUrl).toBe('https://example.com/blog')
      expect(r.restRoot).toBe('https://example.com/blog/wp-json/')
    }
  })

  it('flags http as insecure but still normalizes', () => {
    const r = normalizeWordPressUrl('http://example.com')
    if (!isUrlNormalizationError(r)) expect(r.isInsecure).toBe(true)
  })

  it('rejects an empty string', () => {
    const r = normalizeWordPressUrl('')
    expect(isUrlNormalizationError(r)).toBe(true)
  })

  it('rejects a string with no valid domain', () => {
    const r = normalizeWordPressUrl('not a url at all')
    expect(isUrlNormalizationError(r)).toBe(true)
  })

  it('rejects a non-http(s) scheme', () => {
    const r = normalizeWordPressUrl('ftp://example.com')
    expect(isUrlNormalizationError(r)).toBe(true)
  })
})
