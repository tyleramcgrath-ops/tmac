// Where the renderer finds sites and pages.
//
// For the test deployment this is the built-in sample site. The Postgres-backed
// source (tables from migration 013_saysites_core.sql) slots in behind the same
// interface when sites become editable.

import { samplePages, sampleSite } from './sample'
import { SiteSchema, PageSchema, type Page, type Redirect, type Site } from './schema'

export interface SiteBundle {
  site: Site
  pages: Page[]
  redirects: Redirect[]
}

export interface SiteSource {
  bySubdomain(subdomain: string): Promise<SiteBundle | null>
  byCustomDomain(domain: string): Promise<SiteBundle | null>
}

// Validate on the way in: the renderer only ever sees data that passed the schema.
function bundle(site: Site, pages: Page[], redirects: Redirect[] = []): SiteBundle {
  return { site: SiteSchema.parse(site), pages: pages.map((p) => PageSchema.parse(p)), redirects }
}

const SAMPLE = bundle(sampleSite, samplePages)
const BUNDLES: SiteBundle[] = [SAMPLE]

export const staticSource: SiteSource = {
  async bySubdomain(subdomain) {
    return BUNDLES.find((b) => b.site.subdomain === subdomain) ?? null
  },
  async byCustomDomain(domain) {
    return BUNDLES.find((b) => b.site.customDomain === domain) ?? null
  },
}

export const ROOT_DOMAIN = 'saysites.com'

export interface HostMatch {
  bundle: SiteBundle
  // True on any host that is not a real SaySites address (e.g. the *.vercel.app
  // test deployment). Preview hosts are never indexed by search engines.
  preview: boolean
}

// Host → site. Production: <subdomain>.saysites.com or a customer's own domain.
// Anything else (the test deployment) serves DEFAULT_SITE, marked as a preview.
export async function resolveHost(rawHost: string | null, source: SiteSource = staticSource, defaultSite = process.env.SAYSITES_DEFAULT_SITE ?? SAMPLE.site.subdomain): Promise<HostMatch | null> {
  const host = (rawHost ?? '').toLowerCase().replace(/:\d+$/, '').replace(/^www\./, '')
  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    const b = await source.bySubdomain(host.slice(0, -ROOT_DOMAIN.length - 1))
    return b ? { bundle: b, preview: false } : null
  }
  const custom = host ? await source.byCustomDomain(host) : null
  if (custom) return { bundle: custom, preview: false }
  const fallback = await source.bySubdomain(defaultSite)
  return fallback ? { bundle: fallback, preview: true } : null
}
