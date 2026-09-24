// Loads everything the renderer needs for one site.

import { classifyHost } from './hosts'
import type { Page, Redirect, Site } from './schema'
import { getStore, type Store } from './store'

export interface SiteBundle {
  site: Site
  pages: Page[]
  redirects: Redirect[]
}

export async function bundleFor(site: Site | null, store: Store = getStore()): Promise<SiteBundle | null> {
  if (!site) return null
  const [pages, redirects] = await Promise.all([store.pagesForSite(site.id), store.redirectsForSite(site.id)])
  return { site, pages, redirects }
}

export interface HostMatch {
  bundle: SiteBundle
  // Test addresses (ss-<sub>.vercel.app, <sub>.localhost) are never indexed.
  preview: boolean
}

// Host → the customer site it serves, or null.
export async function resolveHost(rawHost: string | null, store: Store = getStore()): Promise<HostMatch | null> {
  const kind = classifyHost(rawHost)
  if (kind.kind !== 'customer') return null
  const site = kind.subdomain !== null ? await store.siteBySubdomain(kind.subdomain) : await store.siteByDomain(kind.host)
  const bundle = await bundleFor(site, store)
  if (!bundle) return null
  const preview = kind.host.endsWith('.vercel.app') || kind.host.endsWith('.localhost')
  return { bundle, preview }
}
