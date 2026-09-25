// The free redesign preview: an owner (or anyone) pastes their current
// website's address and sees it rebuilt on SaySites, with a before/after
// report. Built without AI, so each preview costs a handful of page reads.
// Claiming it creates a real site from the preview.

import { randomUUID } from 'crypto'
import { audit, type Audit } from './audit'
import { detectBusiness, type Detected } from './detect'
import { ImportError, discover, dropTemplate, extract, normalizeStart, planImport, safeFetch, type Fetcher, type ImportedPage } from './importer'
import { renderPage } from './render'
import { checkPage } from './seo'
import { checkSpeed } from './speed'
import type { Page, Redirect, Site } from './schema'
import { buildStarterSite } from './starter'

// A preview reads fewer pages than a full move, to stay quick and cheap.
export const PREVIEW_PAGES = 12

export interface Preview {
  id: string
  url: string
  createdAt: string
  detected: Detected
  site: Site
  pages: Page[]
  redirects: Redirect[]
  before: Audit
  after: Audit & { speedPass: boolean; seoErrors: number }
  pagesFound: number
  // Set once the preview has been claimed.
  claimed?: { by: string; siteId: string }
}

export async function buildPreview(input: string, get: Fetcher = safeFetch, id = randomUUID().replace(/-/g, '').slice(0, 16)): Promise<Preview> {
  const start = normalizeStart(input)
  const first = await get(start.href)
  if (!first || first.status !== 200 || !/html/i.test(first.type) || !first.body) throw new ImportError('We couldn’t open that website. Check the address and try again.')
  const detected = detectBusiness(first.body, first.url)
  const urls = (await discover(new URL(first.url), get)).slice(0, PREVIEW_PAGES)
  const found: ImportedPage[] = []
  await Promise.all(
    urls.map(async (u) => {
      const res = u.href === first.url ? first : await get(u.href).catch(() => null)
      if (res && res.status === 200 && /html/i.test(res.type)) found.push({ from: u.pathname.replace(/\/+$/, '') || '/', url: u.href, extracted: extract(res.body) })
    })
  )
  found.sort((a, b) => urls.findIndex((u) => u.href === a.url) - urls.findIndex((u) => u.href === b.url))
  const cleaned = dropTemplate(found.map((f) => f.extracted))
  const pages = found.map((f, i) => ({ ...f, extracted: cleaned[i] }))
  // The main services are the imported pages' headings (not about, contact
  // and the like), which also fill the home page's services section.
  const services = pages
    .filter((p) => p.from !== '/' && !/about|contact|faq|privacy|terms|team|attorney|staff|review|testimonial|career|location|areas?-we-serve|blog|news/i.test(p.from))
    .map((p) => (p.extracted.h1 || p.extracted.title.split(/\s[|\-–—]\s/)[0]).trim())
    .filter((s) => s && s.length <= 80)
    // Keyword pages are often in capitals ("NAPLES DIVORCE LAWYERS").
    .map((s) => (s === s.toUpperCase() ? s.charAt(0) + s.slice(1).toLowerCase() : s))
    .slice(0, 6)
  const home = pages.find((p) => p.from === '/')?.extracted.h1 ?? ''
  const headline = home.length >= 12 && home.length <= 90 ? (home === home.toUpperCase() ? home.charAt(0) + home.slice(1).toLowerCase() : home) : undefined
  const { site, pages: starter } = buildStarterSite(
    {
      name: detected.name,
      type: detected.type,
      city: detected.city ?? 'your area',
      region: detected.region ?? '',
      phone: detected.phone,
      email: detected.email,
      street: detected.street,
      postalCode: detected.postalCode,
      hours: detected.hours,
      services,
      palette: detected.palette,
      ...(headline ? { headline } : {}),
    },
    'org_preview',
    `preview-${id}`
  )
  // Old logos are often made for dark headers and would vanish on a light
  // one; the preview shows the name, and the owner adds a logo after claiming.
  if (!detected.city) {
    // Without a town the starter's copy reads oddly; keep it general.
    site.business.area = undefined
  }
  const plan = planImport(site, starter, pages)
  // In the preview, imported pages show; claimed sites start them as drafts.
  const all = [...starter, ...plan.pages.map((p) => ({ ...p, status: 'published' as const }))]
  const homePage = all.find((p) => p.slug === '')!
  const rendered = renderPage(site, homePage, all)
  return {
    id,
    url: start.origin,
    createdAt: new Date().toISOString(),
    detected,
    site,
    pages: all,
    redirects: plan.redirects,
    before: audit(first.body),
    after: { ...audit(rendered.html), speedPass: checkSpeed(rendered).pass, seoErrors: all.reduce((n, p) => n + checkPage(p, all).filter((i) => i.severity === 'error').length, 0) },
    pagesFound: urls.length,
  }
}

// Claiming: the preview becomes the owner's site. Imported pages start as
// drafts, as in a move, until the domain is switched over.
export function claimFromPreview(p: Preview, orgId: string, subdomain: string): { site: Site; pages: Page[]; redirects: Redirect[] } {
  const siteId = `site_${randomUUID()}`
  const site: Site = { ...structuredClone(p.site), id: siteId, orgId, subdomain, updatedAt: new Date().toISOString() }
  const pages = p.pages.map((pg) => ({ ...structuredClone(pg), id: `page_${randomUUID()}`, siteId, status: pg.source ? ('draft' as const) : pg.status }))
  return { site, pages, redirects: p.redirects }
}
