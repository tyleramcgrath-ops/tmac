// Which kind of request is this? Decided from the host alone, so it can run in
// the proxy before any route code.
//
//   main      saysites.com, www.saysites.com, the Vercel and SiteGround test
//             addresses and localhost: the marketing homepage, login and the
//             dashboard.
//   customer  <sub>.saysites.com, ss-<sub>.vercel.app (the test stand-in for a
//             subdomain), <sub>.localhost, or any other host (a customer's
//             own domain): a SaySites-built website.

export const ROOT_DOMAIN = 'saysites.com'
const TEST_SITE_PREFIX = 'ss-'

// Where saysites.com is hosted (SiteGround). A customer's own domain points
// its bare name here with an A record; www points at their saysites address.
export const HOSTING_IP = '8.230.98.200'
// Any host answers this, so we can tell when a customer's domain reaches us.
export const DOMAIN_CHECK_PATH = '/.well-known/saysites-check'
export const DOMAIN_CHECK_REPLY = 'saysites-ok'

// "https://www.Example.com/about" -> "example.com"; null when it isn't a
// plain domain, or is one of ours.
export function cleanDomain(input: string): string | null {
  const d = input.trim().toLowerCase().replace(/^[a-z]+:\/\//, '').replace(/[/?#].*$/, '').replace(/:\d+$/, '').replace(/\.$/, '').replace(/^www\./, '')
  if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(d)) return null
  if (d === ROOT_DOMAIN || d.endsWith(`.${ROOT_DOMAIN}`) || d.endsWith('.sg-host.com') || d.endsWith('.vercel.app')) return null
  return d
}

export type HostKind = { kind: 'main' } | { kind: 'customer'; subdomain: string | null; host: string }

export function normalizeHost(raw: string | null): string {
  return (raw ?? '').toLowerCase().trim().replace(/:\d+$/, '').replace(/\.$/, '')
}

export function classifyHost(raw: string | null): HostKind {
  const host = normalizeHost(raw)
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}` || host === `app.${ROOT_DOMAIN}`) {
    return { kind: 'main' }
  }
  if (host.endsWith(`.${ROOT_DOMAIN}`)) return { kind: 'customer', subdomain: host.slice(0, -ROOT_DOMAIN.length - 1), host }
  if (host.endsWith('.localhost')) return { kind: 'customer', subdomain: host.slice(0, -'.localhost'.length), host }
  if (host.endsWith('.vercel.app')) {
    const label = host.slice(0, -'.vercel.app'.length)
    if (label.startsWith(TEST_SITE_PREFIX) && !label.includes('.')) return { kind: 'customer', subdomain: label.slice(TEST_SITE_PREFIX.length), host }
    // saysites.vercel.app and every per-deployment preview URL.
    return { kind: 'main' }
  }
  // SiteGround's temporary address for the hosting account (*.sg-host.com).
  if (host.endsWith('.sg-host.com')) return { kind: 'main' }
  // Anything else is a customer's own domain; www is the same site.
  return { kind: 'customer', subdomain: null, host: host.replace(/^www\./, '') }
}
