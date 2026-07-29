// Input validation, and the private-address check the crawler runs on every
// redirect hop before it fetches (lib/engine/crawler.ts:27). A hostname this
// function calls public is one the server will connect to, following redirects
// an attacker may control — so the range list is a security boundary.

import { describe, expect, it } from 'vitest'
import {
  getDomain, isPrivateHostname, validateCountry, validateKeyword, validateLanguage, validateUrl,
} from '../lib/engine/validate'

describe('validateUrl', () => {
  it('accepts a bare domain and adds https', () => {
    expect(validateUrl('example.com/page')).toEqual({ ok: true, value: 'https://example.com/page' })
  })

  it('keeps an explicit scheme, whatever its casing', () => {
    expect(validateUrl('HTTP://example.com/').value).toBe('http://example.com/')
  })

  it('rejects empty, whitespace-bearing, and over-long input', () => {
    expect(validateUrl('')).toMatchObject({ ok: false })
    expect(validateUrl('   ')).toMatchObject({ ok: false })
    expect(validateUrl('exa mple.com')).toMatchObject({ ok: false })
    expect(validateUrl(`https://example.com/${'a'.repeat(2100)}`)).toMatchObject({ ok: false })
  })

  it('rejects a non-http scheme', () => {
    expect(validateUrl('ftp://example.com')).toMatchObject({ ok: false })
    expect(validateUrl('javascript:alert(1)')).toMatchObject({ ok: false })
    expect(validateUrl('file:///etc/passwd')).toMatchObject({ ok: false })
  })

  it('requires a real dotted hostname with a TLD', () => {
    expect(validateUrl('http://localhost:3000')).toMatchObject({ ok: false })
    expect(validateUrl('http://intranet')).toMatchObject({ ok: false })
  })

  it('rejects a loopback address however it is spelled', () => {
    // The URL parser normalizes every one of these to 127.0.0.1 before the
    // range check sees it.
    for (const host of ['127.0.0.1', '127.1', '0x7f.0.0.1', '0177.0.0.1', '2130706433']) {
      expect(validateUrl(`http://${host}`), host).toMatchObject({ ok: false })
    }
  })

  it('rejects an IPv6 literal', () => {
    expect(validateUrl('http://[::1]/')).toMatchObject({ ok: false })
  })
})

describe('isPrivateHostname: the crawler’s per-hop SSRF boundary', () => {
  it('flags loopback and the RFC 1918 ranges', () => {
    for (const ip of ['127.0.0.1', '10.0.0.1', '172.16.0.1', '172.31.255.255', '192.168.1.1', '0.0.0.0']) {
      expect(isPrivateHostname(ip), ip).toBe(true)
    }
  })

  it('flags link-local, which is how cloud instance metadata is reached', () => {
    expect(isPrivateHostname('169.254.169.254')).toBe(true)
  })

  it('flags carrier-grade NAT / shared address space (RFC 6598)', () => {
    // 100.64.0.0/10 is not public address space and appears inside cloud and
    // carrier networks — a server following a redirect there is off the
    // public internet.
    expect(isPrivateHostname('100.64.0.1')).toBe(true)
    expect(isPrivateHostname('100.127.255.255')).toBe(true)
  })

  it('flags broadcast and multicast', () => {
    expect(isPrivateHostname('255.255.255.255')).toBe(true)
    expect(isPrivateHostname('224.0.0.1')).toBe(true)
  })

  it('does not flag the public addresses that merely sit near those ranges', () => {
    for (const ip of ['100.63.255.255', '100.128.0.1', '172.15.0.1', '172.32.0.1', '192.167.1.1', '8.8.8.8', '1.1.1.1']) {
      expect(isPrivateHostname(ip), ip).toBe(false)
    }
  })

  it('flags internal-network name suffixes', () => {
    for (const host of ['localhost', 'db.localhost', 'printer.local', 'api.internal', 'router.home.arpa']) {
      expect(isPrivateHostname(host), host).toBe(true)
    }
  })

  it('is case-insensitive', () => {
    expect(isPrivateHostname('LOCALHOST')).toBe(true)
    expect(isPrivateHostname('Api.Internal')).toBe(true)
  })

  it('flags anything with a colon, which covers every IPv6 literal', () => {
    expect(isPrivateHostname('[::1]')).toBe(true)
    expect(isPrivateHostname('[fd00::1]')).toBe(true)
    expect(isPrivateHostname('[2606:4700::1111]')).toBe(true)
  })

  it('does not flag an ordinary public hostname', () => {
    expect(isPrivateHostname('example.com')).toBe(false)
    expect(isPrivateHostname('localhost.example.com')).toBe(false)
  })
})

describe('validateKeyword / validateCountry / validateLanguage', () => {
  it('trims and collapses whitespace in a keyword', () => {
    expect(validateKeyword('  roof   repair  ')).toEqual({ ok: true, value: 'roof repair' })
  })

  it('rejects an empty, too-short, or too-long keyword', () => {
    expect(validateKeyword('')).toMatchObject({ ok: false })
    expect(validateKeyword('a')).toMatchObject({ ok: false })
    expect(validateKeyword('x'.repeat(121))).toMatchObject({ ok: false })
  })

  it('defaults the country to us and requires a 2-letter code', () => {
    expect(validateCountry('')).toEqual({ ok: true, value: 'us' })
    expect(validateCountry('GB')).toEqual({ ok: true, value: 'gb' })
    expect(validateCountry('usa')).toMatchObject({ ok: false })
  })

  it('treats a missing language as absent, not invalid', () => {
    expect(validateLanguage(undefined)).toMatchObject({ ok: true })
    expect(validateLanguage('en-GB')).toEqual({ ok: true, value: 'en-gb' })
    expect(validateLanguage('english')).toMatchObject({ ok: false })
  })
})

describe('getDomain', () => {
  it('strips scheme, path and www', () => {
    expect(getDomain('https://www.example.com/a/b')).toBe('example.com')
  })

  it('returns the input unchanged when it cannot be parsed', () => {
    expect(getDomain('not a url')).toBe('not a url')
  })
})
