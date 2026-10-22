// Structured data for saysites.com's own pages: what Google reads to know
// who SaySites is, what each page is and how pages fit together.

const BASE = 'https://saysites.com'

export const ORG = {
  '@type': 'Organization',
  '@id': `${BASE}/#org`,
  name: 'SaySites',
  url: `${BASE}/`,
  logo: { '@type': 'ImageObject', url: `${BASE}/apple-touch-icon.png` },
  description: 'Websites for small businesses that you build and change by saying what you want: fast, SEO-ready, and yours.',
}

export const breadcrumbs = (trail: [string, string][]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: trail.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${BASE}${path}` })),
})

export const itemList = (name: string, path: string, items: [string, string][]) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name,
  url: `${BASE}${path}`,
  isPartOf: { '@id': `${BASE}/#website` },
  mainEntity: { '@type': 'ItemList', itemListElement: items.map(([n, p], i) => ({ '@type': 'ListItem', position: i + 1, name: n, url: `${BASE}${p}` })) },
})

export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}
