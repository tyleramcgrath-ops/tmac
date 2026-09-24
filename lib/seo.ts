// SEO by construction: structured data, pre-publish checks, sitemap, robots
// and slug-change redirects. None of this is configured by the site owner.

import { pagePath, siteOrigin, walk, type Page, type Redirect, type Site } from './schema'

// ---------------------------------------------------------------------------
// Structured data (JSON-LD)
// ---------------------------------------------------------------------------

export function structuredData(site: Site, page: Page, allPages: readonly Page[]): object[] {
  const origin = siteOrigin(site)
  const out: object[] = []

  // The business itself, on the home page — the page Google associates with
  // the Business Profile.
  if (page.slug === '') out.push(localBusiness(site, origin))

  // FAQPage whenever the page carries FAQ widgets. Built from the same items
  // the visitor sees, which is what Google requires.
  const faqs = [...walk(page.body)].flatMap((el) => (el.type === 'faq' ? el.items : []))
  if (faqs.length) {
    out.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
    })
  }

  // A blog post.
  if (page.post) {
    out.push({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: page.post.title.slice(0, 110),
      description: page.post.excerpt,
      datePublished: page.post.date,
      dateModified: page.updatedAt.slice(0, 10),
      mainEntityOfPage: origin + pagePath(page),
      ...(page.post.image ? { image: /^https?:/.test(page.post.image.src) ? page.post.image.src : origin + page.post.image.src } : {}),
      author: { '@type': 'Organization', name: site.business.name },
      publisher: { '@id': `${origin}/#business` },
    })
  }

  // Products shown on the page, so Google can show prices and availability.
  if ([...walk(page.body)].some((el) => el.type === 'products') && site.store?.products.length) {
    const cur = site.store.currency
    for (const p of site.store.products) {
      out.push({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: p.name,
        ...(p.description ? { description: p.description } : {}),
        ...(p.image ? { image: /^https?:/.test(p.image.src) ? p.image.src : origin + p.image.src } : {}),
        brand: { '@type': 'Brand', name: site.business.name },
        offers: {
          '@type': 'Offer',
          price: (p.price / 100).toFixed(2),
          priceCurrency: cur,
          availability: p.soldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
          url: origin + pagePath(page),
          seller: { '@id': `${origin}/#business` },
        },
      })
    }
  }

  // Breadcrumbs for every page below the home page.
  if (page.slug !== '') {
    const home = allPages.find((p) => p.slug === '')
    const trail: { name: string; path: string }[] = [{ name: home?.name ?? 'Home', path: '/' }]
    const segs = page.slug.split('/')
    for (let i = 1; i < segs.length; i++) {
      const slug = segs.slice(0, i).join('/')
      const parent = allPages.find((p) => p.slug === slug)
      if (parent) trail.push({ name: parent.name, path: pagePath(parent) })
    }
    trail.push({ name: page.name, path: pagePath(page) })
    out.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: origin + t.path })),
    })
  }
  return out
}

function localBusiness(site: Site, origin: string): object {
  const b = site.business
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': b.schemaType,
    '@id': `${origin}/#business`,
    name: b.name,
    url: `${origin}/`,
  }
  if (b.phone) data.telephone = b.phone
  if (b.email) data.email = b.email
  if (b.logo) data.logo = b.logo
  if (b.priceRange) data.priceRange = b.priceRange
  if (b.hours?.length) data.openingHours = b.hours
  if (b.sameAs?.length) data.sameAs = b.sameAs
  if (b.address) {
    data.address = {
      '@type': 'PostalAddress',
      streetAddress: b.address.street,
      addressLocality: b.address.city,
      addressRegion: b.address.region,
      postalCode: b.address.postalCode,
      addressCountry: b.address.country,
    }
  }
  return data
}

// ---------------------------------------------------------------------------
// Pre-publish checks
// ---------------------------------------------------------------------------

export interface SeoIssue {
  // Errors block publishing; warnings are shown to the owner (and Sofie).
  severity: 'error' | 'warning'
  code: string
  message: string
  elementId?: string
}

export function checkPage(page: Page, allPages: readonly Page[] = [page]): SeoIssue[] {
  const issues: SeoIssue[] = []
  const elements = [...walk(page.body)]

  // Unique element ids — the renderer's class names and the Operator's fix
  // targets both depend on them.
  const seen = new Set<string>()
  for (const el of elements) {
    if (seen.has(el.id)) issues.push({ severity: 'error', code: 'duplicate-id', message: `Two elements share the id "${el.id}".`, elementId: el.id })
    seen.add(el.id)
  }

  // Exactly one H1, and no skipped heading levels.
  const headings = elements.flatMap((el) => (el.type === 'heading' ? [el] : []))
  const h1s = headings.filter((h) => h.level === 1)
  if (h1s.length === 0) issues.push({ severity: 'error', code: 'missing-h1', message: 'The page has no main heading (H1).' })
  if (h1s.length > 1) {
    for (const h of h1s.slice(1)) issues.push({ severity: 'error', code: 'multiple-h1', message: 'The page has more than one main heading (H1).', elementId: h.id })
  }
  let prev = 0
  for (const h of headings) {
    if (prev && h.level > prev + 1) {
      issues.push({ severity: 'warning', code: 'heading-skip', message: `Heading jumps from H${prev} to H${h.level}.`, elementId: h.id })
    }
    prev = h.level
  }

  // At most one priority (eagerly loaded) image.
  const priority = elements.filter((el) => el.type === 'image' && el.priority)
  if (priority.length > 1) {
    for (const el of priority.slice(1)) issues.push({ severity: 'warning', code: 'multiple-priority-images', message: 'Only the first image on a page should load with priority.', elementId: el.id })
  }

  // Title and description lengths that display fully in search results.
  if (page.seo.title.length < 15) issues.push({ severity: 'warning', code: 'short-title', message: 'The page title is short; aim for 30–60 characters.' })
  if (page.seo.title.length > 60) issues.push({ severity: 'warning', code: 'long-title', message: 'The page title may be cut off in search results (over 60 characters).' })
  if (page.seo.description.length < 70) issues.push({ severity: 'warning', code: 'short-description', message: 'The meta description is short; aim for 120–160 characters.' })

  // Unique titles across the site.
  const dupeTitle = allPages.find((p) => p.id !== page.id && p.seo.title.trim().toLowerCase() === page.seo.title.trim().toLowerCase())
  if (dupeTitle) issues.push({ severity: 'warning', code: 'duplicate-title', message: `Another page ("${dupeTitle.name}") has the same title.` })

  // Internal links must point at a page that exists.
  const paths = new Set(allPages.map(pagePath))
  for (const el of elements) {
    if (el.type === 'button' && el.href.startsWith('/')) {
      const path = el.href.split(/[?#]/)[0].replace(/\/$/, '') || '/'
      if (!paths.has(path)) issues.push({ severity: 'error', code: 'broken-link', message: `The button "${el.label}" links to ${path}, which isn't a page.`, elementId: el.id })
    }
  }
  return issues
}

// ---------------------------------------------------------------------------
// Sitemap, robots, redirects
// ---------------------------------------------------------------------------

export function sitemapXml(site: Site, pages: readonly Page[]): string {
  const origin = siteOrigin(site)
  const urls = pages
    .filter((p) => p.status === 'published' && !p.seo.noindex)
    .map((p) => `<url><loc>${xmlEsc(origin + pagePath(p))}</loc><lastmod>${p.updatedAt.slice(0, 10)}</lastmod></url>`)
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
}

export function robotsTxt(site: Site): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin(site)}/sitemap.xml\n`
}

// When a page's slug changes, the old URL must 301 to the new one — and any
// existing redirect that pointed at the old URL is re-pointed, so there are
// never redirect chains.
export function redirectsAfterSlugChange(existing: readonly Redirect[], oldSlug: string, newSlug: string): Redirect[] {
  if (oldSlug === newSlug) return [...existing]
  const from = oldSlug === '' ? '/' : `/${oldSlug}`
  const to = newSlug === '' ? '/' : `/${newSlug}`
  const kept = existing
    // A redirect away from the new URL would now loop; drop it.
    .filter((r) => r.from !== to)
    .map((r) => (r.to === from ? { ...r, to } : r))
    .filter((r) => r.from !== from)
  return [...kept, { from, to, status: 301 }]
}

function xmlEsc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
