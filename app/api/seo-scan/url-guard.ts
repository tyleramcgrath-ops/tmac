// SSRF guard (Phase D.6 P4). Single source of truth for whether an outbound
// fetch target is safe. Every server-side fetch of a user-influenced URL —
// the crawler, sitemap seeding, and WordPress execution — must pass through
// assertPublicUrl / isSafeFetchTarget.
//
// Rejects: private/link-local/loopback/unique-local IPv4 & IPv6, cloud
// metadata (169.254.169.254 / fd00:ec2::254), unsupported protocols, unsafe
// ports, and — because DNS can resolve a public name to a private address —
// exposes assertResolvedAddressPublic() to re-check the *resolved* IP and to
// re-validate every redirect hop (defeating DNS rebinding + redirect-to-internal).

import { lookup } from 'node:dns/promises'
import net from 'node:net'

export type UrlRejection =
  | 'bad_syntax'
  | 'bad_protocol'
  | 'unsafe_port'
  | 'private_host'
  | 'private_ip'
  | 'dns_failed'

export interface UrlCheck {
  ok: boolean
  reason?: UrlRejection
  detail?: string
}

// Only these ports are allowed for outbound HTTP(S). Blocks e.g. :22, :25,
// :6379, :5432, cloud-agent ports, etc.
const ALLOWED_PORTS = new Set([80, 443, 8080, 8443])

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  let n = 0
  for (const p of parts) {
    const o = Number(p)
    if (!Number.isInteger(o) || o < 0 || o > 255) return null
    n = n * 256 + o
  }
  return n >>> 0
}

function inV4Range(ipInt: number, cidr: string): boolean {
  const [base, bitsStr] = cidr.split('/')
  const bits = Number(bitsStr)
  const baseInt = ipv4ToInt(base)!
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0
  return (ipInt & mask) === (baseInt & mask)
}

// RFC1918 + loopback + link-local(+metadata) + CGNAT + special-use.
const V4_BLOCK = [
  '0.0.0.0/8', '10.0.0.0/8', '100.64.0.0/10', '127.0.0.0/8', '169.254.0.0/16',
  '172.16.0.0/12', '192.0.0.0/24', '192.168.0.0/16', '198.18.0.0/15',
  '224.0.0.0/4', '240.0.0.0/4', '255.255.255.255/32',
]

export function isPrivateIPv4(ip: string): boolean {
  const n = ipv4ToInt(ip)
  if (n === null) return false
  return V4_BLOCK.some((c) => inV4Range(n, c))
}

export function isPrivateIPv6(ip: string): boolean {
  const s = ip.toLowerCase().replace(/^\[|\]$/g, '')
  if (s === '::1' || s === '::') return true // loopback / unspecified
  if (s.startsWith('fe80') || s.startsWith('febf') || /^fe[89ab]/.test(s)) return true // link-local
  if (s.startsWith('fc') || s.startsWith('fd')) return true // unique-local (ULA)
  if (s.startsWith('fd00:ec2') || s.includes('ec2::254')) return true // AWS IPv6 metadata
  // IPv4-mapped (::ffff:a.b.c.d) → validate the embedded v4.
  const mapped = s.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return isPrivateIPv4(mapped[1])
  return false
}

export function isPrivateAddress(ip: string): boolean {
  return net.isIPv4(ip) ? isPrivateIPv4(ip) : net.isIPv6(ip) ? isPrivateIPv6(ip) : false
}

// Test-only seam. Production code never sets this, so there is no env bypass
// and no way to weaken the guard at runtime. Tests that exercise the WordPress
// transport against a local double / PHP emulator register their trusted hosts
// (e.g. 'wp.test', '127.0.0.1') so the guard lets those specific hosts through
// without changing behavior for any real target.
let trustedHostsForTests: Set<string> | null = null
export function __setTrustedHostsForTests(hosts: string[] | null): void {
  trustedHostsForTests = hosts ? new Set(hosts.map((h) => h.toLowerCase())) : null
}
function isTrustedTestHost(host: string): boolean {
  return trustedHostsForTests?.has(host.toLowerCase().replace(/\.$/, '')) ?? false
}

// Hostname-level checks that don't need DNS (literal IPs + obvious internals).
function isBlockedHostname(host: string): boolean {
  // Strip IPv6 brackets so net.isIP() recognizes a literal address.
  const h = host.toLowerCase().replace(/\.$/, '').replace(/^\[|\]$/g, '')
  if (h === 'localhost' || h.endsWith('.localhost')) return true
  if (h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.lan')) return true
  if (net.isIP(h) && isPrivateAddress(h)) return true
  // Decimal/hex-encoded IPv4 (e.g. 2130706433 = 127.0.0.1) — reject as a host.
  if (/^\d+$/.test(h) || /^0x[0-9a-f]+$/i.test(h)) return true
  return false
}

// Synchronous structural validation (no DNS). Use before fetching.
export function checkUrlSyntax(raw: string): UrlCheck {
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return { ok: false, reason: 'bad_syntax', detail: 'Malformed URL.' }
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return { ok: false, reason: 'bad_protocol', detail: `Protocol ${u.protocol} not allowed.` }
  }
  if (isTrustedTestHost(u.hostname)) {
    return { ok: true }
  }
  if (u.port && !ALLOWED_PORTS.has(Number(u.port))) {
    return { ok: false, reason: 'unsafe_port', detail: `Port ${u.port} not allowed.` }
  }
  if (isBlockedHostname(u.hostname)) {
    return { ok: false, reason: 'private_host', detail: `Host ${u.hostname} is internal.` }
  }
  return { ok: true }
}

// Full async validation: syntax + DNS resolution, asserting the RESOLVED
// address is public. This is the check that defeats a public hostname that
// resolves to a private IP (DNS rebinding).
export async function isSafeFetchTarget(raw: string): Promise<UrlCheck> {
  const syntax = checkUrlSyntax(raw)
  if (!syntax.ok) return syntax
  const host = new URL(raw).hostname.replace(/^\[|\]$/g, '')
  if (isTrustedTestHost(host)) {
    return { ok: true }
  }
  if (net.isIP(host)) {
    // Literal IP already validated by isBlockedHostname; safe.
    return { ok: true }
  }
  let addrs: { address: string }[]
  try {
    addrs = await lookup(host, { all: true })
  } catch {
    return { ok: false, reason: 'dns_failed', detail: `Could not resolve ${host}.` }
  }
  for (const a of addrs) {
    if (isPrivateAddress(a.address)) {
      return { ok: false, reason: 'private_ip', detail: `${host} resolves to internal ${a.address}.` }
    }
  }
  return { ok: true }
}

// Assert a single resolved address is public — called per redirect hop.
export function assertResolvedAddressPublic(ip: string): boolean {
  return !isPrivateAddress(ip)
}
