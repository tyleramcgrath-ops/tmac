// SSRF guard: reject URLs that would let a server-side fetcher reach internal
// resources (localhost, private networks, cloud instance metadata). Called
// before any user-controllable URL is passed to fetch() on the server.

// RFC1918 + link-local + loopback + CGNAT + IPv6 private ranges + AWS/GCP/Azure
// metadata endpoints. Hostnames must not resolve to these either — we run a DNS
// lookup and reject if any resolved address falls in a blocked range.
import { promises as dns } from 'dns'
import net from 'net'

const BLOCKED_HOSTS = new Set([
  'localhost',
  '0.0.0.0',
  'metadata.google.internal',
])

function inCidr(ip: string, cidr: string): boolean {
  const [range, bitsStr] = cidr.split('/')
  const bits = Number(bitsStr)
  if (net.isIPv4(ip) && net.isIPv4(range)) {
    const ipInt = ipv4ToInt(ip)
    const rangeInt = ipv4ToInt(range)
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0
    return (ipInt & mask) === (rangeInt & mask)
  }
  return false
}

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + Number(oct), 0) >>> 0
}

const BLOCKED_CIDRS = [
  '0.0.0.0/8',        // "This network"
  '10.0.0.0/8',       // RFC1918
  '100.64.0.0/10',    // CGNAT
  '127.0.0.0/8',      // Loopback
  '169.254.0.0/16',   // Link-local + AWS/GCP/Azure metadata
  '172.16.0.0/12',    // RFC1918
  '192.0.0.0/24',     // IETF assignments
  '192.168.0.0/16',   // RFC1918
  '198.18.0.0/15',    // Benchmarking
  '224.0.0.0/4',      // Multicast
  '240.0.0.0/4',      // Reserved
  '255.255.255.255/32',
]

function isBlockedIPv6(addr: string): boolean {
  const lower = addr.toLowerCase()
  // Loopback ::1, link-local fe80::/10, unique-local fc00::/7, IPv4-mapped ::ffff:127.x
  if (lower === '::1' || lower === '::' || lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) return true
  if (lower.startsWith('::ffff:')) {
    const mapped = lower.slice(7)
    if (net.isIPv4(mapped)) return isBlockedIPv4(mapped)
  }
  return false
}

function isBlockedIPv4(ip: string): boolean {
  return BLOCKED_CIDRS.some((c) => inCidr(ip, c))
}

/**
 * Validates a URL and its resolved host address are safe to fetch from a server.
 * Returns null if safe, or an error message if blocked.
 */
export async function checkOutboundUrl(rawUrl: string): Promise<string | null> {
  let u: URL
  try {
    u = new URL(rawUrl)
  } catch {
    return 'Invalid URL.'
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return 'Only http/https URLs are allowed.'
  }
  const host = u.hostname.toLowerCase()

  if (BLOCKED_HOSTS.has(host)) return 'This host is not allowed.'
  if (host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) {
    return 'Internal hostnames are not allowed.'
  }

  // If host is already an IP literal, check it directly.
  if (net.isIPv4(host)) {
    if (isBlockedIPv4(host)) return 'Private / reserved IP addresses are not allowed.'
    return null
  }
  if (net.isIPv6(host) || (host.startsWith('[') && host.endsWith(']'))) {
    const addr = host.startsWith('[') ? host.slice(1, -1) : host
    if (isBlockedIPv6(addr)) return 'Private IPv6 addresses are not allowed.'
    return null
  }

  // Resolve DNS and verify no resolved address is private.
  try {
    const addrs = await dns.lookup(host, { all: true, verbatim: true })
    for (const a of addrs) {
      if (a.family === 4 && isBlockedIPv4(a.address)) {
        return 'Host resolves to a private IP address.'
      }
      if (a.family === 6 && isBlockedIPv6(a.address)) {
        return 'Host resolves to a private IPv6 address.'
      }
    }
  } catch {
    // If DNS fails, the fetch will fail too — surface a cleaner message.
    return 'Could not resolve the domain.'
  }
  return null
}
