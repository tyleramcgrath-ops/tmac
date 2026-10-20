import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DirectoryResults, pageParam } from '@/components/Directory'
import { RevealOnScroll } from '@/components/fx/Reveal'
import { SectionNav } from '@/components/fx/SectionNav'
import { UsMap } from '@/components/fx/UsMap'
import { TopicHero } from '@/components/TopicHero'
import { CtaBand, Faqs, JsonLd, SearchBar } from '@/components/ui'
import { COMMON_FEES, FEE_TYPES } from '@/lib/content/fees'
import { GUIDES } from '@/lib/content/guides'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { CITIES } from '@/lib/geo'
import { CONTENT_REVIEWED, SITE, abs, fmtDate } from '@/lib/site'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }
export const revalidate = 3600
export const generateStaticParams = () => PRACTICE_AREAS.map((p) => ({ slug: p.slug }))
export const dynamicParams = false

const find = (slug: string) => PRACTICE_AREAS.find((p) => p.slug === slug)
const TOP_CITIES = ['new-york', 'los-angeles', 'chicago', 'houston', 'miami', 'atlanta']

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
  const guides = GUIDES.filter((x) => x.related.includes(p.slug)).slice(0, 3)
  const related = PRACTICE_AREAS.filter((x) => x.group === p.group && x.slug !== p.slug).slice(0, 8)
  const url = `/practice-area/${p.slug}`
  const fees = COMMON_FEES[p.slug] ?? []
  const nav = [
    ...(g && page === 1 ? [{ id: 'overview', label: 'Overview' }, { id: 'cases', label: 'Common cases' }, { id: 'costs', label: 'Costs' }, { id: 'questions', label: 'What to ask' }] : []),
    { id: 'lawyers', label: 'Find a lawyer' },
    { id: 'cities', label: 'By city' },
    ...(g ? [{ id: 'faq', label: 'FAQ' }] : []),
  ]

  return (
    <>
      <RevealOnScroll />
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'WebPage', name: p.lawyerTitle, url: abs(url), description: p.short,
        dateModified: CONTENT_REVIEWED, about: { '@type': 'Thing', name: `${p.name} law` }, isPartOf: { '@id': `${SITE.url}/#website` },
      }} />
      <TopicHero
        crumbs={[{ name: 'Practice Areas', path: '/practice-areas' }, { name: p.name, path: url }]}
        eyebrow={p.group}
        title={p.lawyerTitle}
        lede={p.short}
        aside={
          <div className="glance">
            <div className="glance-head">{p.name} at a glance</div>
            <dl>
              {g && <div><dt>Common cases</dt><dd>{g.commonCases.slice(0, 3).join(' · ')}</dd></div>}
              <div><dt>Usually paid by</dt><dd>{fees.length ? fees.map((f) => FEE_TYPES.find((t) => t.key === f)!.name).join(' or ') : 'Varies by lawyer and case'}</dd></div>
              <div><dt>Content reviewed</dt><dd>{fmtDate(CONTENT_REVIEWED)}</dd></div>
            </dl>
            <Link href={`/get-started?practice=${p.slug}`} className="btn btn-primary" style={{ width: '100%' }}>Free case review</Link>
            <p className="glance-foot">Popular: {TOP_CITIES.map((s, i) => { const c = CITIES.find((x) => x.slug === s)!; return <span key={s}>{i > 0 && ' · '}<Link href={`/${c.slug}/${p.slug}`}>{c.name}</Link></span> })}</p>
          </div>
        }
      >
        <SearchBar practice={p.slug} />
      </TopicHero>
      <SectionNav items={nav} />

      {g && page === 1 && (
        <>
          <section className="section" id="overview">
            <div className="wrap layout">
              <article className="prose reveal">
                <div className="answer-box">
                  <span className="label">What does a {p.name.toLowerCase()} lawyer do?</span>
                  <p>{g.overview[0]}</p>
                </div>
                {g.overview.slice(1).map((t) => <p key={t}>{t}</p>)}
                <p className="muted" style={{ fontSize: '0.88rem' }}>Reviewed {fmtDate(CONTENT_REVIEWED)}. General information, not legal advice; laws vary by state.</p>
              </article>
              <aside className="sidebar reveal">
                <div className="card call-card">
                  <div className="kicker">Call a lawyer soon if</div>
                  <ul className="checklist">{g.whenToHire.map((t) => <li key={t}>{t}</li>)}</ul>
                  <Link href={`/get-started?practice=${p.slug}`} className="btn btn-dark" style={{ width: '100%', marginTop: 8 }}>Get a free case review</Link>
                </div>
              </aside>
            </div>
          </section>

          <section className="section alt" id="cases">
            <div className="wrap">
              <div className="section-head reveal">
                <div><div className="eyebrow">Common cases</div><h2>What {p.name.toLowerCase()} lawyers handle</h2></div>
                <p>If your situation looks like one of these, a {p.name.toLowerCase()} lawyer is the right kind of attorney to call.</p>
              </div>
              <div className="case-grid reveal">
                {g.commonCases.map((t, i) => (
                  <div key={t} className="case-card"><span className="case-num">{String(i + 1).padStart(2, '0')}</span><p>{t}</p></div>
                ))}
              </div>
            </div>
          </section>

          <section className="section" id="costs">
            <div className="wrap">
              <div className="reveal" style={{ maxWidth: 820, marginBottom: 32 }}>
                <div className="eyebrow">Costs</div>
                <h2>How much does a {p.name.toLowerCase()} lawyer cost?</h2>
                <p className="muted" style={{ fontSize: '1.05rem' }}>{g.fees}</p>
              </div>
              <div className="fee-grid reveal">
                {FEE_TYPES.map((f) => (
                  <div key={f.key} className={`fee-card${fees.includes(f.key) ? ' common' : ''}`}>
                    {fees.includes(f.key) && <span className="fee-flag">Common for {p.name.toLowerCase()}</span>}
                    <h3>{f.name}</h3>
                    <p>{f.text}</p>
                  </div>
                ))}
              </div>
              <p className="reveal" style={{ marginTop: 22 }}><Link className="link-arrow" href="/guide/how-much-does-a-lawyer-cost">Read the full guide to legal fees</Link></p>
            </div>
          </section>

          <section className="section alt" id="questions">
            <div className="wrap split-q">
              <div className="reveal">
                <div className="eyebrow">Your first consultation</div>
                <h2>Questions to ask a {p.name.toLowerCase()} lawyer</h2>
                <p className="muted">Bring these to your first meeting. A good lawyer will answer them plainly.</p>
                <p><Link className="link-arrow" href="/guide/what-to-bring-to-a-lawyer-consultation">What to bring to a consultation</Link></p>
              </div>
              <ol className="numbered reveal">{g.questionsToAsk.map((q) => <li key={q}><b>{q}</b></li>)}</ol>
            </div>
          </section>
        </>
      )}

      <section className="section" id="lawyers">
        <div className="wrap">
          <DirectoryResults query={{ practice: p.slug, page }} heading={`${p.lawyerTitle} near you`} basePath={url} practiceSlug={p.slug} />
        </div>
      </section>

      <section className="section map-section" id="cities">
        <div className="wrap">
          <div className="section-head reveal">
            <div><div className="eyebrow">By city</div><h2>{p.lawyerTitle} in your city</h2></div>
            <p>Choose a pin to see {p.lawyerTitle.toLowerCase()} in that city, or a state for every city there.</p>
          </div>
          <div className="map-card reveal">
            <UsMap practice={p.slug} />
          </div>
          <ul className="link-columns c4 reveal" style={{ marginTop: 28 }}>
            {[...CITIES].sort((a, b) => a.name.localeCompare(b.name)).map((c) => <li key={c.slug}><Link href={`/${c.slug}/${p.slug}`}>{c.name}</Link><small>{c.state}</small></li>)}
          </ul>
        </div>
      </section>

      {guides.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="section-head reveal"><div><div className="eyebrow">Related guides</div><h2>Read before you call</h2></div></div>
            <div className="grid c3 reveal">
              {guides.map((x) => (
                <Link key={x.slug} href={`/guide/${x.slug}`} className="card guide-card">
                  <span className="kicker">{x.category} · {x.readMinutes} min</span>
                  <h3>{x.title}</h3>
                  <p>{x.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {g && (
        <section className="section alt" id="faq">
          <div className="wrap reveal" style={{ maxWidth: 900 }}>
            <div className="eyebrow">FAQ</div>
            <h2>{p.name} questions, answered</h2>
            <Faqs faqs={g.faqs} />
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="section tight">
          <div className="wrap reveal">
            <div className="eyebrow">Related practice areas</div>
            <div className="pill-row">{related.map((r) => <Link className="pill" key={r.slug} href={`/practice-area/${r.slug}`}>{r.name} <span aria-hidden="true">→</span></Link>)}</div>
          </div>
        </section>
      )}
      <CtaBand practice={p.slug} title={`Talk to a ${p.name.toLowerCase()} lawyer.`} />
    </>
  )
}
