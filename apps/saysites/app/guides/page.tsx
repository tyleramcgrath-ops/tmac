import type { Metadata } from 'next'
import { MarketingShell } from '@/components/MarketingShell'
import { publishedArticles } from '@/lib/articles'
import { getStore } from '@/lib/store'
import { TOPICS, articlesFor } from '@/lib/topics'
import '../home.css'
import '../blog/blog.css'
import './guides.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Website and SEO Guides for Law Firms, Practices and Trades',
  description: 'Evergreen guides for law firms, medical and dental practices, med spas, home service businesses and shops: what their websites need and how to get found.',
  alternates: { canonical: '/guides' },
}

const BASE = 'https://saysites.com'

export default async function GuidesPage() {
  const all = await publishedArticles(getStore())
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'SaySites guides',
      url: `${BASE}/guides`,
      mainEntity: { '@type': 'ItemList', itemListElement: TOPICS.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: `${BASE}/guides/${t.slug}`, name: t.name })) },
    },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}/` }, { '@type': 'ListItem', position: 2, name: 'Guides', item: `${BASE}/guides` }] },
  ]
  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <section className="page-hero gd-hero">
        <div className="wrap">
          <p className="kicker">Guides</p>
          <h1>Websites that get found, by kind of business.</h1>
          <p className="lede">Plain-English guides for the businesses we build for: what their websites need, the rules that apply to them, and how people find them in Google and AI answers. Every outside fact links to its source.</p>
        </div>
      </section>
      <section className="gd-section" style={{ borderTop: 0 }}>
        <div className="wrap">
          <ul className="gd-hub">
            {TOPICS.map((t) => {
              const n = articlesFor(t, all).length
              return (
                <li key={t.slug}>
                  <a href={`/guides/${t.slug}`}>
                    <span className="ph"><img src={t.hero.src.replace('w=1600', 'w=800')} alt={t.hero.alt} width={800} height={450} loading="lazy" decoding="async" /></span>
                    <span className="tx">
                      <h2>{t.name}</h2>
                      <p>{t.lede}</p>
                      <span className="n">The guide{n ? ` and ${n} article${n === 1 ? '' : 's'}` : ''} →</span>
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
          <a className="gl-banner" href="/guides/glossary">
            <span><strong>The website and SEO glossary</strong> Plain-English definitions of the terms Google, designers and marketers use, each linked to its source.</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>
    </MarketingShell>
  )
}
