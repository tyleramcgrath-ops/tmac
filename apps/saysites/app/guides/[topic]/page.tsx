import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MarketingShell } from '@/components/MarketingShell'
import { headingsOf, publishedArticles, readingMinutes, renderBody } from '@/lib/articles'
import { INDUSTRIES } from '@/lib/industries'
import { getStore } from '@/lib/store'
import { TOPICS, articlesFor, topic } from '@/lib/topics'
import '../../home.css'
import '../../blog/blog.css'
import '../guides.css'

export const dynamic = 'force-dynamic'

const BASE = 'https://saysites.com'

export function generateStaticParams() {
  return TOPICS.map((t) => ({ topic: t.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const t = topic((await params).topic)
  if (!t) return { title: 'Not found', robots: { index: false } }
  return {
    title: { absolute: t.title },
    description: t.description,
    alternates: { canonical: `/guides/${t.slug}` },
    openGraph: { type: 'article', title: t.title, description: t.description, url: `${BASE}/guides/${t.slug}`, images: [{ url: t.hero.src, alt: t.hero.alt, width: 1600, height: 900 }] },
    twitter: { card: 'summary_large_image', images: [t.hero.src] },
  }
}

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const t = topic((await params).topic)
  if (!t) notFound()
  const articles = articlesFor(t, await publishedArticles(getStore()))
  const industries = INDUSTRIES.filter((i) => t.industries.includes(i.slug))
  const others = TOPICS.filter((x) => x.slug !== t.slug)
  const toc = headingsOf(t.body)
  const url = `${BASE}/guides/${t.slug}`
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: t.title,
      description: t.description,
      image: [t.hero.src],
      mainEntityOfPage: url,
      inLanguage: 'en-US',
      author: { '@type': 'Organization', name: 'SaySites', url: BASE },
      publisher: { '@type': 'Organization', name: 'SaySites', url: BASE, logo: { '@type': 'ImageObject', url: `${BASE}/apple-touch-icon.png` } },
      ...(articles.length ? { hasPart: articles.map((a) => ({ '@type': 'Article', headline: a.title, url: `${BASE}/blog/${a.slug}` })) } : {}),
    },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}/` }, { '@type': 'ListItem', position: 2, name: 'Guides', item: `${BASE}/guides` }, { '@type': 'ListItem', position: 3, name: t.name, item: url }] },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: t.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ]
  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <section className="page-hero gd-hero">
        <div className="wrap">
          <nav className="gd-crumbs" aria-label="Breadcrumb"><a href="/guides">Guides</a> / {t.name}</nav>
          <h1>{t.title.replace(/:.*$/, '')}</h1>
          <p className="lede">{t.lede}</p>
          <figure className="gd-photo"><img src={t.hero.src} alt={t.hero.alt} width={1600} height={686} fetchPriority="high" decoding="async" /></figure>
        </div>
      </section>
      <div className="wrap gd-grid">
        <article className="post-body">
          <div dangerouslySetInnerHTML={{ __html: renderBody(t.body) }} />
          <section className="gd-check" aria-labelledby="checklist">
            <h2 id="checklist">The checklist</h2>
            <p>Everything above, in one list you can work through.</p>
            <ul>{t.checklist.map((c, i) => <li key={i}>{c}</li>)}</ul>
          </section>
        </article>
        <aside className="gd-side">
          {toc.length > 2 && (
            <nav className="gd-card" aria-label="In this guide">
              <h2>In this guide</h2>
              <ol>{toc.map((h) => <li key={h.id}><a href={`#${h.id}`}>{h.text}</a></li>)}</ol>
            </nav>
          )}
          {industries.length > 0 && (
            <div className="gd-card">
              <h2>Start here</h2>
              <ul>{industries.map((i) => <li key={i.slug}><a href={`/websites-for/${i.slug}`}>Websites for {i.plural}</a></li>)}</ul>
            </div>
          )}
          <div className="gd-card">
            <h2>Free redesign</h2>
            <p style={{ margin: '0 0 12px', fontSize: 15 }}>Send us your website and see it rebuilt to this guide, free.</p>
            <a className="b b-dark" href="/redesign">Get a free redesign</a>
          </div>
        </aside>
      </div>
      {articles.length > 0 && (
        <section className="gd-section">
          <div className="wrap">
            <h2>Articles on {t.name.toLowerCase()}</h2>
            <ul className="gd-cards">
              {articles.map((a) => (
                <li key={a.slug}>
                  <a href={`/blog/${a.slug}`}>
                    <span className="blog-meta">{readingMinutes(a.body)} min read</span>
                    <h3>{a.title}</h3>
                    <p>{a.description}</p>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <section className="gd-section">
        <div className="wrap post-faq" style={{ maxWidth: 820 }}>
          <h2 id="common-questions">Common questions</h2>
          {t.faq.map((f, i) => (
            <details key={i} open={i === 0}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="gd-section">
        <div className="wrap">
          <h2>More guides</h2>
          <ul className="gd-cards">
            {others.map((o) => (
              <li key={o.slug}><a href={`/guides/${o.slug}`}><h3>{o.name}</h3><p>{o.description}</p></a></li>
            ))}
          </ul>
        </div>
      </section>
    </MarketingShell>
  )
}
