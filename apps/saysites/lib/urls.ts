import type { Site } from './schema'

// Where a site can be viewed right now. Until *.saysites.com is connected, the
// dashboard links to the preview route on the main address.
export function liveUrl(site: Pick<Site, 'subdomain' | 'customDomain'>): string {
  if (site.customDomain) return `https://${site.customDomain}`
  return `https://${site.subdomain}.saysites.com`
}

export function previewPath(site: Pick<Site, 'subdomain'>): string {
  return `/preview/${site.subdomain}`
}

// Claiming a redesign preview after signing up or in. The claim code is the
// preview's id, with an "f" on the end for the fresh redesign rather than
// the site as it is.
export const CLAIM_CODE = /^[a-f0-9]{16}f?$/

export function claimPath(code: string): string {
  return `/redesign/${code.slice(0, 16)}/claim${code.endsWith('f') ? '?v=fresh' : ''}`
}
