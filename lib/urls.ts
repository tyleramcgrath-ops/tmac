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
