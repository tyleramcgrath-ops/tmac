// Which kind of request is this? Decided from the host alone, so it can run in
// the proxy before any route code.
//
//   main      saysites.com, www.saysites.com, the Vercel test address and
//             localhost: the marketing homepage, login and the dashboard.
//   customer  <sub>.saysites.com, ss-<sub>.vercel.app (the test stand-in for a
//             subdomain), <sub>.localhost, or any other host (a customer's
//             own domain): a SaySites-built website.

export const ROOT_DOMAIN = 'saysites.com'
const TEST_SITE_PREFIX = 'ss-'

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
  // Anything else is a customer's own domain; www is the same site.
  return { kind: 'customer', subdomain: null, host: host.replace(/^www\./, '') }
}
