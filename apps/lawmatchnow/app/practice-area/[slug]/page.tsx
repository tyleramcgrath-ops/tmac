import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DirectoryResults, pageParam } from '@/components/Directory'
import { CtaBand, Faqs, JsonLd, PageHero, SearchBar } from '@/components/ui'
import { GUIDES } from '@/lib/content/guides'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { CITIES } from '@/lib/geo'
import { CONTENT_REVIEWED, SITE, abs } from '@/lib/site'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }
export const revalidate = 3600
export const generateStaticParams = () => PRACTICE_AREAS.map((p) => ({ slug: p.slug }))
export const dynamicParams = false

const find = (slug: string) => PRACTICE_AREAS.find((p) => p.slug === slug)

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const p = find((await params).slug)
  if (!p) return {}
  const paged = pageParam((await searchParams).page) > 1
  return {
    title: `${p.lawyerTitle}: Find an Attorney Near You`,
    description: p.short,
    alternates: { canonical: `/practice-area/${p.slug}` },
    robots: paged ? { index: false, follow: true } : undefined,
    openGraph: { title: `${p.lawyerTitle} | ${SITE.name}`, description: p.short, url: abs(`/practice-area/${p.slug}`) },
  }
}

export default async function PracticeAreaPage({ params, searchParams }: Props) {
  const p = find((await params).slug)
  if (!p) notFound()
  const page = pageParam((await searchParams).page)
  const g = p.guide
  const guides = GUIDES.filter((x) => x.related.includes(p.slug)).slice(0, 4)
  const related = PRACTICE_AREAS.filter((x) => x.group === p.group && x.slug !== p.slug).slice(0, 6)
  const url = `/practice-area/${p.slug}`

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'WebPage', name: p.lawyerTitle, url: abs(url), description: p.short,
        dateModified: CONTENT_REVIEWED, about: { '@type': 'Thing', name: `${p.name} law` }, isPartOf: { '@id': `${SITE.url}/#website` },
      }} />
      <PageHero crumbs={[{ name: 'Practice Areas', path: '/practice-areas' }, { name: p.name, path: url }]} eyebrow={p.group}
        title={p.lawyerTitle} lede={p.short}>
        <div style={{ marginTop: 28 }}><SearchBar practice={p.slug} /></div>
      </PageHero>

      {g && page === 1 && (
        <section className="section">
          <div className="wrap layout">
            <article className="prose">
              <div className="answer-box">
                <span className="label">In short</span>
                <p>{g.overview[0]}</p>
              </div>
              {g.overview.slice(1).map((t) => <p key={t}>{t}</p>)}
              <h2 id="cases">Common {p.name.toLowerCase()} cases</h2>
              <ul>{g.commonCases.map((t) => <li key={t}>{t}</li>)}</ul>
              <h2 id="when">When to call a lawyer</h2>
              <ul className="checklist">{g.whenToHire.map((t) => <li key={t}>{t}</li>)}</ul>
              <h2 id="cost">How much does a {p.name.toLowerCase()} lawyer cost?</h2>
              <p>{g.fees}</p>
              <h2 id="questions">Questions to ask at your consultation</h2>
              <ol>{g.questionsToAsk.map((t) => <li key={t}>{t}</li>)}</ol>
              <p className="muted" style={{ fontSize: '0.88rem' }}>Last reviewed {new Date(CONTENT_REVIEWED).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}. General information, not legal advice; laws vary by state.</p>
            </article>
            <aside className="sidebar">
              <nav className="card toc" aria-label="On this page">
                <h3>On this page</h3>
                <ol>
                  <li><a href="#cases">Common cases</a></li>
                  <li><a href="#when">When to call a lawyer</a></li>
                  <li><a href="#cost">Costs and fees</a></li>
                  <li><a href="#questions">Questions to ask</a></li>
                  <li><a href="#faq">FAQ</a></li>
                  <li><a href="#lawyers">Find a lawyer</a></li>
                </ol>
              </nav>
              {guides.length > 0 && (
                <div className="card">
                  <h3>Related guides</h3>
                  <ul style={{ paddingLeft: 18, margin: 0 }}>
                    {guides.map((x) => <li key={x.slug} style={{ padding: '4px 0' }}><Link href={`/guide/${x.slug}`}>{x.title}</Link></li>)}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </section>
      )}

      <section className="section alt" id="lawyers">
        <div className="wrap">
          <DirectoryResults query={{ practice: p.slug, page }} heading={`${p.lawyerTitle} near you`} basePath={url} practiceSlug={p.slug} />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="eyebrow">By city</div>
          <h2>{p.lawyerTitle} by city</h2>
          <ul className="link-columns c4">
            {CITIES.map((c) => <li key={c.slug}><Link href={`/${c.slug}/${p.slug}`}>{c.name}</Link><small>{c.state}</small></li>)}
          </ul>
        </div>
      </section>

      {g && (
        <section className="section alt" id="faq">
          <div className="wrap" style={{ maxWidth: 900 }}>
            <div className="eyebrow">FAQ</div>
            <h2>{p.name} questions, answered</h2>
            <Faqs faqs={g.faqs} />
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="section tight">
          <div className="wrap">
            <h2 style={{ fontSize: '1.8rem' }}>Related practice areas</h2>
            <div className="tags">{related.map((r) => <Link className="tag" key={r.slug} href={`/practice-area/${r.slug}`}>{r.name}</Link>)}</div>
          </div>
        </section>
      )}
      <CtaBand practice={p.slug} title={`Talk to a ${p.name.toLowerCase()} lawyer.`} />
    </>
  )
}
