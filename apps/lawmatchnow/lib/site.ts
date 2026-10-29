// Site-wide constants and structured-data helpers.

export const SITE = {
  name: 'LawMatchNow',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://lawmatchnow.com').replace(/\/$/, ''),
  tagline: 'Find the right lawyer, near you, today.',
  description:
    'Search attorneys by practice area and city across all 50 states, read plain-English legal guides, and request a free case review.',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@lawmatchnow.com',
}

/** Cut a meta description at a word boundary so search results show it whole. */
export const clip = (s: string, n = 160) => {
  if (s.length <= n) return s
  return `${s.slice(0, s.lastIndexOf(' ', n - 1)).replace(/[\s,;:.(–-]+$/, '')}…`
}

/** Keep the brand suffix only when the whole title still fits in ~65 characters. */
export const seoTitle = (t: string) => (t.length + 16 <= 65 ? t : { absolute: t })

export const abs = (path: string) => `${SITE.url}${path.startsWith('/') ? path : `/${path}`}`

type Crumb = { name: string; path: string }

export const breadcrumbLd = (crumbs: Crumb[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) })),
})

export const faqLd = (faqs: { q: string; a: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
})

export const orgLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE.url}/#organization`,
  name: SITE.name,
  alternateName: 'Law Match Now',
  url: SITE.url,
  logo: abs('/icon.svg'),
  description:
    'LawMatchNow is a free attorney directory and legal information site covering all 50 U.S. states. It is not a law firm and does not give legal advice.',
  areaServed: { '@type': 'Country', name: 'United States' },
  contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: SITE.email, availableLanguage: ['English'] },
}

export const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE.url}/#website`,
  name: SITE.name,
  url: SITE.url,
  publisher: { '@id': `${SITE.url}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE.url}/find-a-lawyer?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
}

/** The date content was last reviewed; shown on guides for freshness. */
export const CONTENT_REVIEWED = '2026-10-20'

export const fmtDate = (iso: string) => {
  const d = new Date(iso.replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

/** Strips scripts, iframes, inline handlers and javascript: URLs from CMS HTML. */
export function cleanHtml(html: string) {
  return html
    .replace(/<(script|style|iframe|object|embed|form)[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|iframe|object|embed|link|meta)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"')
}
