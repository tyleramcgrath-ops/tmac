// SSRF guard tests (Phase D.6 P4). Proves the single outbound-fetch safety
// gate rejects every class the threat model requires: private/loopback/
// link-local/ULA IPv4 & IPv6, cloud metadata, unsupported protocols, unsafe
// ports, decimal/hex-encoded hosts, and — via the resolved-address check —
// DNS rebinding (a public name that resolves to an internal IP).

import { describe, expect, it, vi } from 'vitest'
import {
  assertResolvedAddressPublic,
  checkUrlSyntax,
  isPrivateAddress,
  isPrivateIPv4,
  isPrivateIPv6,
  isSafeFetchTarget,
} from '../app/api/seo-scan/url-guard'

describe('isPrivateIPv4', () => {
  it.each([
    '0.0.0.0',
    '10.0.0.1',
    '10.255.255.255',
    '100.64.0.1', // CGNAT
    '127.0.0.1', // loopback
    '169.254.169.254', // cloud metadata / link-local
    '172.16.0.1',
    '172.31.255.255',
    '192.0.0.1',
    '192.168.1.1',
    '198.18.0.1', // benchmarking
    '224.0.0.1', // multicast
    '240.0.0.1', // reserved
    '255.255.255.255',
  ])('rejects private %s', (ip) => {
    expect(isPrivateIPv4(ip)).toBe(true)
  })

  it.each(['8.8.8.8', '1.1.1.1', '93.184.216.34', '172.15.0.1', '172.32.0.1', '11.0.0.1'])(
    'allows public %s',
    (ip) => {
      expect(isPrivateIPv4(ip)).toBe(false)
    }
  )
})

describe('isPrivateIPv6', () => {
  it.each([
    '::1', // loopback
    '::', // unspecified
    'fe80::1', // link-local
    'fc00::1', // ULA
    'fd12:3456::1', // ULA
    'fd00:ec2::254', // AWS IPv6 metadata
    '::ffff:127.0.0.1', // IPv4-mapped loopback
    '::ffff:10.0.0.1', // IPv4-mapped private
  ])('rejects private %s', (ip) => {
    expect(isPrivateIPv6(ip)).toBe(true)
  })

  it.each(['2606:4700:4700::1111', '2001:4860:4860::8888', '::ffff:8.8.8.8'])(
    'allows public %s',
    (ip) => {
      expect(isPrivateIPv6(ip)).toBe(false)
    }
  )
})

describe('isPrivateAddress', () => {
  it('dispatches on family', () => {
    expect(isPrivateAddress('127.0.0.1')).toBe(true)
    expect(isPrivateAddress('::1')).toBe(true)
    expect(isPrivateAddress('8.8.8.8')).toBe(false)
    expect(isPrivateAddress('not-an-ip')).toBe(false)
  })
})

describe('checkUrlSyntax (synchronous structural gate)', () => {
  it('accepts an ordinary public https URL', () => {
    expect(checkUrlSyntax('https://example.com/page').ok).toBe(true)
  })

  it.each([
    ['file:///etc/passwd', 'bad_protocol'],
    ['ftp://example.com', 'bad_protocol'],
    ['gopher://example.com', 'bad_protocol'],
    ['javascript:alert(1)', 'bad_protocol'],
  ])('rejects unsupported protocol %s', (url, reason) => {
    const r = checkUrlSyntax(url)
    expect(r.ok).toBe(false)
    expect(r.reason).toBe(reason)
  })

  it.each([
    'http://example.com:22',
    'http://example.com:25',
    'http://example.com:6379',
    'http://example.com:5432',
    'http://example.com:3306',
  ])('rejects unsafe port %s', (url) => {
    const r = checkUrlSyntax(url)
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('unsafe_port')
  })

  it.each(['http://example.com:80', 'https://example.com:443', 'http://example.com:8080', 'https://example.com:8443'])(
    'allows safe port %s',
    (url) => {
      expect(checkUrlSyntax(url).ok).toBe(true)
    }
  )

  it.each([
    'http://localhost/x',
    'http://sub.localhost/x',
    'http://service.internal/x',
    'http://printer.local/x',
    'http://box.lan/x',
    'http://127.0.0.1/x',
    'http://[::1]/x',
    'http://169.254.169.254/latest/meta-data', // cloud metadata literal
    'http://10.0.0.5/x',
    'http://192.168.1.1/x',
  ])('rejects internal host %s', (url) => {
    const r = checkUrlSyntax(url)
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('private_host')
  })

  it.each([
    'http://2130706433/x', // decimal 127.0.0.1
    'http://0x7f000001/x', // hex 127.0.0.1
  ])('rejects numeric-encoded host %s', (url) => {
    const r = checkUrlSyntax(url)
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('private_host')
  })

  it('rejects malformed URLs', () => {
    expect(checkUrlSyntax('not a url').ok).toBe(false)
    expect(checkUrlSyntax('').ok).toBe(false)
  })
})

describe('assertResolvedAddressPublic (per-hop redirect / DNS-rebinding guard)', () => {
  it('rejects a resolved private address (rebinding / redirect-to-internal)', () => {
    expect(assertResolvedAddressPublic('169.254.169.254')).toBe(false)
    expect(assertResolvedAddressPublic('127.0.0.1')).toBe(false)
    expect(assertResolvedAddressPublic('::1')).toBe(false)
  })
  it('accepts a resolved public address', () => {
    expect(assertResolvedAddressPublic('8.8.8.8')).toBe(true)
    expect(assertResolvedAddressPublic('2606:4700:4700::1111')).toBe(true)
  })
})

// Mock DNS so the async path is deterministic and offline (egress is blocked).
vi.mock('node:dns/promises', () => ({
  lookup: vi.fn(),
}))
import { lookup } from 'node:dns/promises'
const mockLookup = lookup as unknown as ReturnType<typeof vi.fn>

describe('isSafeFetchTarget (async: syntax + resolved-IP)', () => {
  it('rejects before DNS on a bad protocol', async () => {
    const r = await isSafeFetchTarget('file:///etc/passwd')
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('bad_protocol')
    expect(mockLookup).not.toHaveBeenCalled()
  })

  it('accepts a literal public IP without a DNS lookup', async () => {
    mockLookup.mockClear()
    const r = await isSafeFetchTarget('https://8.8.8.8/x')
    expect(r.ok).toBe(true)
    expect(mockLookup).not.toHaveBeenCalled()
  })

  it('rejects a literal private IP at the syntax gate', async () => {
    const r = await isSafeFetchTarget('http://169.254.169.254/latest/meta-data')
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('private_host')
  })

  it('allows a public host that resolves to a public address', async () => {
    mockLookup.mockResolvedValueOnce([{ address: '93.184.216.34' }])
    const r = await isSafeFetchTarget('https://example.com/page')
    expect(r.ok).toBe(true)
  })

  it('BLOCKS a public host that resolves to a private address (DNS rebinding)', async () => {
    mockLookup.mockResolvedValueOnce([{ address: '169.254.169.254' }])
    const r = await isSafeFetchTarget('https://evil.example.com/x')
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('private_ip')
  })

  it('BLOCKS when ANY resolved address is private (split-horizon)', async () => {
    mockLookup.mockResolvedValueOnce([{ address: '93.184.216.34' }, { address: '10.0.0.5' }])
    const r = await isSafeFetchTarget('https://mixed.example.com/x')
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('private_ip')
  })

  it('rejects when the host cannot be resolved', async () => {
    mockLookup.mockRejectedValueOnce(new Error('ENOTFOUND'))
    const r = await isSafeFetchTarget('https://does-not-exist.example/x')
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('dns_failed')
  })
})
