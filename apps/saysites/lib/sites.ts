// Loads everything the renderer needs for one site.

import { classifyHost } from './hosts'
import type { Page, Redirect, Site } from './schema'
import { getStore, type Store } from './store'
import { isStock, photoUses } from './photo-rules'
import type { Credit } from './unsplash'

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

// Records which stock photos the site's live pages use, so no other
// customer's site is given them (lib/photo-rules).
export async function syncSitePhotos(siteId: string, store: Store = getStore()): Promise<void> {
  const pages = await store.pagesForSite(siteId)
  const keys = [...new Set(photoUses(pages).filter((u) => isStock(u.src)).map((u) => u.key))]
  await store.setSitePhotos(siteId, keys)
}

// Keeps only the credits for stock photos the site's live pages still show.
export function creditsInUse(pages: Page[], known: Credit[]): Credit[] {
  const used = new Set(photoUses(pages).map((u) => u.key))
  return [...new Map(known.filter((c) => used.has(c.photo)).map((c) => [c.photo, c])).values()]
}
