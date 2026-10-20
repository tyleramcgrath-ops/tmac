import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CaseReviewCard, CtaBand, Faqs, JsonLd, PageHero } from '@/components/ui'
import { GUIDES } from '@/lib/content/guides'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { CONTENT_REVIEWED, SITE, abs, fmtDate } from '@/lib/site'

type Props = { params: Promise<{ slug: string }> }
export const dynamicParams = false
export const generateStaticParams = () => GUIDES.map((g) => ({ slug: g.slug }))

const anchor = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const g = GUIDES.find((x) => x.slug === slug)
  if (!g) return {}
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: `/guide/${g.slug}` },
    openGraph: { type: 'article', title: g.title, description: g.description, url: abs(`/guide/${g.slug}`), modifiedTime: CONTENT_REVIEWED },
  }
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params
  const g = GUIDES.find((x) => x.slug === slug)
  if (!g) notFound()
  const related = PRACTICE_AREAS.filter((p) => g.related.includes(p.slug))
  const more = GUIDES.filter((x) => x.slug !== g.slug && x.category === g.category).concat(GUIDES.filter((x) => x.slug !== g.slug && x.category !== g.category)).slice(0, 3)
  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'Article', headline: g.title, description: g.description,
        url: abs(`/guide/${g.slug}`), mainEntityOfPage: abs(`/guide/${g.slug}`), dateModified: CONTENT_REVIEWED, datePublished: CONTENT_REVIEWED,
        author: { '@type': 'Organization', name: `${SITE.name} Editorial Team`, url: abs('/about') },
        publisher: { '@id': `${SITE.url}/#organization` }, articleSection: g.category,
        speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.answer-box p'] },
      }} />
      <PageHero crumbs={[{ name: 'Legal Guides', path: '/guides' }, { name: g.title, path: `/guide/${g.slug}` }]} eyebrow={g.category} title={g.title} lede={g.description}>
        <div className="byline"><span>By the {SITE.name} editorial team</span><span>Reviewed {fmtDate(CONTENT_REVIEWED)}</span><span>{g.readMinutes} min read</span></div>
      </PageHero>
      <section className="section">
        <div className="wrap layout">
          <article className="prose">
            <div className="answer-box"><span className="label">The short answer</span><p>{g.answer}</p></div>
            {g.sections.map((s) => (
              <section key={s.heading}>
                <h2 id={anchor(s.heading)}>{s.heading}</h2>
                {s.paragraphs.map((p) => <p key={p}>{p}</p>)}
                {s.bullets && <ul>{s.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
              </section>
            ))}
            <h2 id="faq">Frequently asked questions</h2>
            <Faqs faqs={g.faqs} />
            <p className="muted" style={{ fontSize: '0.88rem', marginTop: 24 }}>This guide is general legal information, not legal advice. Laws differ by state and change over time; talk to a licensed attorney about your situation.</p>
          </article>
          <aside className="sidebar">
            <nav className="card toc" aria-label="On this page">
              <h3>On this page</h3>
              <ol>{g.sections.map((s) => <li key={s.heading}><a href={`#${anchor(s.heading)}`}>{s.heading}</a></li>)}<li><a href="#faq">FAQ</a></li></ol>
            </nav>
            <CaseReviewCard practice={related[0]?.slug} />
            {related.length > 0 && (
              <div className="card">
                <h3>Find a lawyer</h3>
                <ul style={{ paddingLeft: 18, margin: 0 }}>{related.map((p) => <li key={p.slug} style={{ padding: '3px 0' }}><Link href={`/practice-area/${p.slug}`}>{p.lawyerTitle}</Link></li>)}</ul>
              </div>
            )}
          </aside>
        </div>
      </section>
      <section className="section alt">
        <div className="wrap">
          <h2 style={{ fontSize: '1.9rem' }}>Keep reading</h2>
          <div className="grid c3">
            {more.map((x) => <Link key={x.slug} href={`/guide/${x.slug}`} className="card"><h3>{x.title}</h3><p>{x.description}</p></Link>)}
          </div>
        </div>
      </section>
      <CtaBand practice={related[0]?.slug} />
    </>
  )
}
