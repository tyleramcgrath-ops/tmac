import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CopyLink } from '@/components/CopyLink'
import { ReadingProgress } from '@/components/fx/ReadingProgress'
import { RevealOnScroll } from '@/components/fx/Reveal'
import { TocSpy } from '@/components/fx/TocSpy'
import { FactTable, Sources } from '@/components/LawFacts'
import { SealMark } from '@/components/Shell'
import { Breadcrumbs, CaseReviewCard, CtaBand, Faqs, JsonLd } from '@/components/ui'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { STATES, citiesInState, stateBySlug } from '@/lib/geo'
import { neighborValues, rankSentence, shareSentence } from '@/lib/law/compare'
import { FIELDS, researchedOn } from '@/lib/law/facts'
import { ctxFor, paras, topicBySlug, topicsFor } from '@/lib/law/topics'
import { TOOLS } from '@/lib/law/tools'
import { answersForState } from '@/lib/law/answers'
import { photoUrl } from '@/lib/photos'
import { SITE, abs, fmtDate } from '@/lib/site'

type Props = { params: Promise<{ state: string; topic: string }> }
export const dynamicParams = false
export const generateStaticParams = () => STATES.flatMap((s) => topicsFor(s.code).map((t) => ({ state: s.slug, topic: t.slug })))

const anchor = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// A comparison line that's true for this state, worked out from all states' data.
const COMPARE: Record<string, (code: string) => string | null> = {
  'statute-of-limitations': (c) => rankSentence(c, 'sol-injury.personalInjury', 'deadline for personal injury claims'),
  'personal-injury-laws': (c) => shareSentence(c, 'car-accident.negligenceRule', (v) => v.toLowerCase()),
  'car-accident-laws': (c) => shareSentence(c, 'car-accident.faultSystem', (v) => `a ${v.toLowerCase()} insurance system`),
  'medical-malpractice-laws': (c) => rankSentence(c, 'sol-injury.medicalMalpractice', 'deadline for malpractice claims'),
  'divorce-laws': (c) => shareSentence(c, 'divorce.propertyDivision', (v) => v.toLowerCase()),
  'wills-and-probate': (c) => shareSentence(c, 'wills.holographic', (v) => `handwritten wills ${v.toLowerCase()}`),
}

function load(stateSlug: string, topicSlug: string) {
  const s = stateBySlug(stateSlug)
  const t = topicBySlug(topicSlug)
  if (!s || !t) return null
  const c = ctxFor(s)
  if (!c.f(t.lead)) return null
  return { s, t, c }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, topic } = await params
  const r = load(state, topic)
  if (!r) return {}
  const { s, t, c } = r
  const year = researchedOn(t.lead).slice(0, 4)
  const title = `${t.heading(s)} (${year})`
  const description = t.description(c).slice(0, 300)
  const url = `/state/${s.slug}/${t.slug}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'article', title, description, url: abs(url), modifiedTime: researchedOn(t.lead), images: [{ url: photoUrl(t.photo, 1200), width: 1200, height: 800 }] },
  }
}

export default async function StateTopicPage({ params }: Props) {
  const { state, topic } = await params
  const r = load(state, topic)
  if (!r) notFound()
  const { s, t, c } = r
  const url = `/state/${s.slug}/${t.slug}`
  const reviewed = researchedOn(t.lead)
  const rows = t.fields.map((key) => ({ key, f: c.f(key)! })).filter((x) => x.f)
  const sections = t.sections.map((sec) => ({ h: sec.h(c), body: paras(sec.body(c)) })).filter((x) => x.body.length)
  const faqs = t.faqs(c)
  const compare = COMPARE[t.slug]?.(s.code) ?? null
  const near = neighborValues(s.code, t.lead)
  const practices = PRACTICE_AREAS.filter((p) => t.practices.includes(p.slug))
  const cities = citiesInState(s.code)
  const others = topicsFor(s.code).filter((x) => x.slug !== t.slug)
  const toc = [
    { id: 'at-a-glance', label: 'At a glance' },
    ...sections.map((x) => ({ id: anchor(x.h), label: x.h })),
    ...(compare || near.length ? [{ id: 'compare', label: 'Compared with other states' }] : []),
    ...(faqs.length ? [{ id: 'faq', label: 'Questions' }] : []),
    { id: 'sources', label: 'Sources' },
  ]
  const heading = t.heading(s)
  const tools = TOOLS.filter((x) => x.topic === t.slug && x.data(s.code))
  const quick = answersForState(s.code).filter((x) => x.q.topic === t.slug)

  return (
    <>
      <RevealOnScroll />
      <ReadingProgress target=".art-body" />
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'Article', headline: heading, description: t.description(c),
        url: abs(url), mainEntityOfPage: abs(url), datePublished: reviewed, dateModified: reviewed,
        author: { '@type': 'Organization', name: `${SITE.name} Editorial Team`, url: abs('/about') },
        publisher: { '@id': `${SITE.url}/#organization` },
        about: [{ '@type': 'State', name: s.name, address: { '@type': 'PostalAddress', addressRegion: s.code, addressCountry: 'US' } }, { '@type': 'Thing', name: t.name }],
        spatialCoverage: { '@type': 'State', name: s.name },
        citation: rows.filter((x) => x.f.cite).map((x) => ({ '@type': 'Legislation', name: x.f.cite, ...(x.f.source ? { url: x.f.source } : {}), legislationJurisdiction: s.name })),
        speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.art-answer p'] },
      }} />

      <header className="art-hero">
        <div className="wrap">
          <Breadcrumbs crumbs={[{ name: 'States', path: '/states' }, { name: s.name, path: `/state/${s.slug}` }, { name: t.name, path: url }]} light />
          <div className="art-hero-in rise">
            <span className="kicker">{s.name} law guide</span>
            <h1>{heading}</h1>
            <p className="lede">{t.answer(c)}</p>
            <div className="art-by">
              <SealMark size={40} />
              <span><b>{SITE.name} editorial team</b><br />Reviewed {fmtDate(reviewed)} · {rows.length} facts, each with its source</span>
              <CopyLink />
            </div>
          </div>
        </div>
      </header>

      <section className="section art-section">
        <div className="wrap art-layout">
          <aside className="art-toc"><TocSpy items={toc} /></aside>
          <article className="art-body prose">
            <div className="art-answer"><span className="label">The short answer</span><p>{t.answer(c)}</p></div>
            {tools.map((x) => (
              <Link key={x.slug} href={`/calculators/${x.slug}/${s.slug}`} className="tool-promo">
                <span className="tool-ico" aria-hidden="true">{x.icon}</span>
                <span><b>Try the free {s.name} {x.name.toLowerCase()}</b><br />{x.blurb}</span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
            <section id="at-a-glance" className="art-sec">
              <h2><span className="art-n">01</span>{s.name} at a glance</h2>
              <FactTable rows={rows} />
            </section>
            {sections.map((x, i) => (
              <section key={x.h} id={anchor(x.h)} className="art-sec">
                <h2><span className="art-n">{String(i + 2).padStart(2, '0')}</span>{x.h}</h2>
                {x.body.map((p, j) => <p key={j}>{p}</p>)}
              </section>
            ))}
            {(compare || near.length > 0) && (
              <section id="compare" className="art-sec">
                <h2><span className="art-n">{String(sections.length + 2).padStart(2, '0')}</span>Compared with other states</h2>
                {compare && <p>{compare}</p>}
                {near.length > 0 && (
                  <table className="cmp">
                    <caption>{FIELDS[t.lead].label} in neighboring states</caption>
                    <thead><tr><th>State</th><th>{FIELDS[t.lead].label}</th></tr></thead>
                    <tbody>
                      <tr className="me"><td>{s.name}</td><td>{c.f(t.lead)!.value}</td></tr>
                      {near.map(({ s: n, f }) => (
                        <tr key={n.code}><td><Link href={`/state/${n.slug}/${t.slug}`}>{n.name}</Link></td><td>{f!.value}</td></tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <p><Link className="link-arrow" href={`/laws/${t.slug}`}>{t.name} in all 50 states</Link></p>
              </section>
            )}
            {faqs.length > 0 && (
              <section id="faq" className="art-sec">
                <h2><span className="art-n">?</span>Frequently asked questions</h2>
                <Faqs faqs={faqs} />
              </section>
            )}
            <section id="sources" className="art-sec">
              <h2><span className="art-n">§</span>Sources</h2>
              <p className="muted">Each fact above was checked against these statutes, court rules and official agency pages as of {fmtDate(reviewed)}.</p>
              <Sources facts={rows.map((x) => x.f)} />
            </section>
            <p className="art-note">This page is general legal information about {s.name} law, not legal advice. Laws change and exceptions apply; talk to a lawyer licensed in {s.name} about your situation.</p>
          </article>
          <aside className="art-side">
            <CaseReviewCard practice={practices[0]?.slug} />
            {quick.length > 0 && (
              <div className="card art-related">
                <div className="kicker">Quick answers</div>
                {quick.map((x) => <Link key={x.q.id} href={`/answers/${x.q.slug(s)}`}>{x.q.ask(s)} <b>{x.a.short}</b></Link>)}
              </div>
            )}
            {others.length > 0 && (
              <div className="card art-related">
                <div className="kicker">More {s.name} law</div>
                {others.map((x) => <Link key={x.slug} href={`/state/${s.slug}/${x.slug}`}>{x.name} <span aria-hidden="true">→</span></Link>)}
              </div>
            )}
          </aside>
        </div>
      </section>

      {cities.length > 0 && practices.length > 0 && (
        <section className="section alt">
          <div className="wrap">
            <div className="section-head reveal"><div><div className="eyebrow">Local lawyers</div><h2>{practices[0].lawyerTitle} in <em>{s.name}</em></h2></div></div>
            <div className="pill-row reveal">
              {cities.flatMap((ct) => practices.slice(0, 2).map((p) => (
                <Link key={`${ct.slug}-${p.slug}`} className="pill" href={`/${ct.slug}/${p.slug}`}>{ct.name} {p.lawyerTitle.toLowerCase()} <span aria-hidden="true">→</span></Link>
              )))}
              <Link className="pill pill-dark" href={`/state/${s.slug}`}>All {s.name} lawyers <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </section>
      )}
      <CtaBand practice={practices[0]?.slug} title={`Talk to a ${s.name} lawyer about your case`} />
    </>
  )
}

