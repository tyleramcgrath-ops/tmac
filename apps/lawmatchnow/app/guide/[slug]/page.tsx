import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CopyLink } from '@/components/CopyLink'
import { ReadingProgress } from '@/components/fx/ReadingProgress'
import { RevealOnScroll } from '@/components/fx/Reveal'
import { TocSpy } from '@/components/fx/TocSpy'
import { Photo } from '@/components/Photo'
import { Breadcrumbs, CaseReviewCard, CtaBand, Faqs, JsonLd } from '@/components/ui'
import { GUIDES } from '@/lib/content/guides'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { CATEGORY_PHOTO } from '@/lib/photos'
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
  const toc = [...g.sections.map((s) => ({ id: anchor(s.heading), label: s.heading })), { id: 'faq', label: 'Questions' }]
  return (
    <>
      <RevealOnScroll />
      <ReadingProgress target=".art-body" />
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'Article', headline: g.title, description: g.description,
        url: abs(`/guide/${g.slug}`), mainEntityOfPage: abs(`/guide/${g.slug}`), dateModified: CONTENT_REVIEWED, datePublished: CONTENT_REVIEWED,
        author: { '@type': 'Organization', name: `${SITE.name} Editorial Team`, url: abs('/about') },
        publisher: { '@id': `${SITE.url}/#organization` }, articleSection: g.category,
        speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.art-answer p'] },
      }} />

      <header className="art-hero">
        <div className="wrap">
          <Breadcrumbs crumbs={[{ name: 'Legal Guides', path: '/guides' }, { name: g.title, path: `/guide/${g.slug}` }]} light />
          <div className="art-hero-in rise">
            <span className="kicker">{g.category}</span>
            <h1>{g.title}</h1>
            <p className="lede">{g.description}</p>
            <div className="art-by">
              <span className="art-mark" aria-hidden="true">L</span>
              <span><b>{SITE.name} editorial team</b><br />Reviewed {fmtDate(CONTENT_REVIEWED)} · {g.readMinutes} min read</span>
              <CopyLink />
            </div>
          </div>
        </div>
        <div className="wrap"><div className="art-photo rise"><Photo name={CATEGORY_PHOTO[g.category] ?? 'signing'} priority sizes="(min-width: 1240px) 1180px, 100vw" /></div></div>
      </header>

      <section className="section art-section">
        <div className="wrap art-layout">
          <aside className="art-toc"><TocSpy items={toc} /></aside>
          <article className="art-body prose">
            <div className="art-answer"><span className="label">The short answer</span><p>{g.answer}</p></div>
            {g.sections.map((s, i) => (
              <section key={s.heading} id={anchor(s.heading)} className="art-sec">
                <h2><span className="art-n">{String(i + 1).padStart(2, '0')}</span>{s.heading}</h2>
                {s.paragraphs.map((p, j) => <p key={j} className={i === 0 && j === 0 ? 'dropcap' : undefined}>{p}</p>)}
                {s.bullets && <ul>{s.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
              </section>
            ))}
            <section id="faq" className="art-sec">
              <h2><span className="art-n">?</span>Frequently asked questions</h2>
              <Faqs faqs={g.faqs} />
            </section>
            <p className="art-note">This guide is general legal information, not legal advice. Laws differ by state and change over time; talk to a licensed attorney about your situation.</p>
          </article>
          <aside className="art-side">
            <CaseReviewCard practice={related[0]?.slug} />
            {related.length > 0 && (
              <div className="card art-related">
                <div className="kicker">Find a lawyer</div>
                {related.map((p) => <Link key={p.slug} href={`/practice-area/${p.slug}`}>{p.lawyerTitle} <span aria-hidden="true">→</span></Link>)}
              </div>
            )}
          </aside>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <div className="section-head reveal"><div><div className="eyebrow">Keep reading</div><h2>More from the <em>legal library</em></h2></div></div>
          <div className="more-grid reveal">
            {more.map((x) => (
              <Link key={x.slug} href={`/guide/${x.slug}`} className="more-card">
                <div className="more-photo"><Photo name={CATEGORY_PHOTO[x.category] ?? 'signing'} sizes="(min-width: 900px) 33vw, 100vw" /></div>
                <span className="kicker">{x.category} · {x.readMinutes} min</span>
                <span className="more-t">{x.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <CtaBand practice={related[0]?.slug} />
    </>
  )
}
