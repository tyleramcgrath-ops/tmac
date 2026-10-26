import type { Metadata } from 'next'
import { MarketingShell } from '@/components/MarketingShell'
import { JsonLd, breadcrumbs } from '@/components/JsonLd'
import { GLOSSARY, GLOSSARY_GROUPS, glossaryBy } from '@/lib/glossary'
import '../../home.css'
import '../../blog/blog.css'
import '../guides.css'

export const metadata: Metadata = {
  title: 'Website and SEO Glossary for Small Businesses',
  description: 'Plain-English definitions of the website, SEO, local search and AI search terms business owners hear, each linked to the official source and a deeper guide.',
  alternates: { canonical: '/guides/glossary' },
}

const BASE = 'https://saysites.com'
const groupId = (g: string) => g.toLowerCase().replace(/[^a-z]+/g, '-')

export default function GlossaryPage() {
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'DefinedTermSet',
      '@id': `${BASE}/guides/glossary`,
      name: 'Website and SEO glossary',
      url: `${BASE}/guides/glossary`,
      publisher: { '@id': `${BASE}/#org` },
      hasDefinedTerm: GLOSSARY.map((t) => ({
        '@type': 'DefinedTerm',
        name: t.term,
        description: t.def,
        url: `${BASE}/guides/glossary#${t.slug}`,
        inDefinedTermSet: `${BASE}/guides/glossary`,
      })),
    },
    breadcrumbs([['Home', '/'], ['Guides', '/guides'], ['Glossary', '/guides/glossary']]),
  ]
  return (
    <MarketingShell>
      <JsonLd data={ld} />
      <section className="page-hero gd-hero">
        <div className="wrap">
          <p className="gd-crumbs"><a href="/guides">Guides</a> / Glossary</p>
          <h1>The website and SEO glossary.</h1>
          <p className="lede">{GLOSSARY.length} terms you will hear from Google, web designers and marketers, explained in plain English. Where a definition rests on an official rule, it links to the source.</p>
          <nav className="gl-jump" aria-label="Glossary sections">
            {GLOSSARY_GROUPS.map((g) => <a key={g} href={`#${groupId(g)}`}>{g}</a>)}
          </nav>
        </div>
      </section>
      <div className="wrap gl-body">
        {GLOSSARY_GROUPS.map((g) => (
          <section key={g} id={groupId(g)} className="gl-group">
            <h2>{g}</h2>
            <dl>
              {glossaryBy(g).map((t) => (
                <div key={t.slug} id={t.slug} className="gl-term">
                  <dt><a href={`#${t.slug}`}>{t.term}</a></dt>
                  <dd>
                    <p>{t.def}</p>
                    {(t.source || t.more) && (
                      <p className="gl-links">
                        {t.source && <a href={t.source[1]} rel="noopener" target="_blank">Source: {t.source[0]}</a>}
                        {t.more && <a href={t.more[1]}>{t.more[0]} →</a>}
                      </p>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <aside className="gd-check gl-cta">
          <h2>Rather not learn all of this?</h2>
          <p>Every SaySites site is built with these basics handled: fast pages, structured data, clean titles and a Google-ready setup. Send us your current site and we will redesign it free.</p>
          <p><a className="btn" href="/redesign">Get a free redesign</a></p>
        </aside>
      </div>
    </MarketingShell>
  )
}
