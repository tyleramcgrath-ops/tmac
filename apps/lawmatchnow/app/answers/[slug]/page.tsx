import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RevealOnScroll } from '@/components/fx/Reveal'
import { Breadcrumbs, CaseReviewCard, CtaBand, Faqs, JsonLd } from '@/components/ui'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { citiesInState } from '@/lib/geo'
import { type AnswerPage, type Question, QUESTIONS, answerPage, answerPages, answersForQuestion, answersForState, questionByNationalSlug } from '@/lib/law/answers'
import { neighbors } from '@/lib/law/compare'
import { researchedOn } from '@/lib/law/facts'
import { topicBySlug } from '@/lib/law/topics'
import { toolBySlug } from '@/lib/law/tools'
import { SITE, abs, clip, fmtDate, seoTitle } from '@/lib/site'

type Props = { params: Promise<{ slug: string }> }
export const dynamicParams = false
export const generateStaticParams = () => [...[...answerPages().keys()].map((slug) => ({ slug })), ...QUESTIONS.map((q) => ({ slug: q.national.slug }))]

const VERDICT_CLASS = { yes: 'v-yes', no: 'v-no', partly: 'v-partly', info: 'v-info' } as const

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const p = answerPage(slug)
  if (p) {
    const description = clip(p.a.text.length < 120 && p.f.detail ? `${p.a.text} ${p.f.detail}` : p.a.text)
    return { title: seoTitle(p.q.ask(p.s)), description, alternates: { canonical: `/answers/${slug}` }, openGraph: { type: 'article', title: p.q.ask(p.s), description, url: abs(`/answers/${slug}`) } }
  }
  const q = questionByNationalSlug(slug)
  if (!q) return {}
  return { title: seoTitle(q.national.title), description: clip(q.national.lede), alternates: { canonical: `/answers/${slug}` }, openGraph: { title: q.national.title, url: abs(`/answers/${slug}`) } }
}

export default async function Answer({ params }: Props) {
  const { slug } = await params
  const p = answerPage(slug)
  if (p) return <StateAnswer p={p} slug={slug} />
  const q = questionByNationalSlug(slug)
  if (q) return <National q={q} />
  notFound()
}

function StateAnswer({ p, slug }: { p: AnswerPage; slug: string }) {
  const { q, s, f, a } = p
  const url = `/answers/${slug}`
  const reviewed = researchedOn(q.key)
  const topic = topicBySlug(q.topic)
  const tool = q.tool ? toolBySlug(q.tool) : null
  const practice = PRACTICE_AREAS.find((x) => x.slug === q.practice)
  const all = answersForQuestion(q.id)
  const same = a.verdict === 'info' ? [] : all.filter((x) => x.a.verdict === a.verdict)
  const near = neighbors(s.code).map((n) => all.find((x) => x.s.code === n.code)).filter((x): x is AnswerPage => !!x)
  const more = answersForState(s.code).filter((x) => x.q.id !== q.id)
  const cities = citiesInState(s.code)
  const meaning = q.meaning(s, f, a)
  const faqs = [
    { q: q.ask(s), a: a.text },
    ...more.slice(0, 3).map((x) => ({ q: x.q.ask(s), a: x.a.text })),
  ]
  return (
    <>
      <RevealOnScroll />
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'Article', headline: q.ask(s), description: a.text, url: abs(url), mainEntityOfPage: abs(url),
        datePublished: reviewed, dateModified: reviewed, author: { '@type': 'Organization', name: `${SITE.name} Editorial Team`, url: abs('/about') },
        publisher: { '@id': `${SITE.url}/#organization` }, about: { '@type': 'State', name: s.name },
        ...(f.cite ? { citation: { '@type': 'Legislation', name: f.cite, ...(f.source ? { url: f.source } : {}), legislationJurisdiction: s.name } } : {}),
        speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.ans-text'] },
      }} />
      <header className="art-hero">
        <div className="wrap">
          <Breadcrumbs crumbs={[{ name: 'Legal answers', path: '/answers' }, { name: q.national.h1.replace(/\?$/, ''), path: `/answers/${q.national.slug}` }, { name: s.name, path: url }]} light />
          <div className="art-hero-in rise">
            <span className="kicker">{s.name} law · reviewed {fmtDate(reviewed)}</span>
            <h1>{q.ask(s)}</h1>
          </div>
        </div>
      </header>
      <section className="section art-section">
        <div className="wrap art-layout tool-layout">
          <article className="art-body prose">
            <div className={`ans-box ${VERDICT_CLASS[a.verdict]}`}>
              <div className="ans-verdict">{a.short}</div>
              <p className="ans-text">{a.text}</p>
              {f.cite && <p className="ans-src">Source: {f.source ? <a href={f.source} target="_blank" rel="nofollow noopener">{f.cite}</a> : f.cite}</p>}
            </div>

            <section className="art-sec">
              <h2>What this means for you</h2>
              {meaning.map((m) => <p key={m}>{m}</p>)}
              {tool && <p><Link className="link-arrow" href={`/calculators/${tool.slug}/${s.slug}`}>Try the free {s.name} {tool.name.toLowerCase()}</Link></p>}
            </section>

            {near.length > 0 && (
              <section className="art-sec">
                <h2>Neighboring states</h2>
                <table className="cmp">
                  <thead><tr><th>State</th><th>Answer</th><th>Rule</th></tr></thead>
                  <tbody>
                    <tr className="me"><td>{s.name}</td><td>{a.short}</td><td>{f.value}</td></tr>
                    {near.map((x) => <tr key={x.s.code}><td><Link href={`/answers/${x.q.slug(x.s)}`}>{x.s.name}</Link></td><td>{x.a.short}</td><td>{x.f.value}</td></tr>)}
                  </tbody>
                </table>
                {same.length > 1 && <p className="muted">{s.name} is one of {same.length} states where the answer is “{a.short.toLowerCase()}”. <Link href={`/answers/${q.national.slug}`}>See all states</Link>.</p>}
              </section>
            )}

            <section className="art-sec">
              <h2>Related questions about {s.name} law</h2>
              <Faqs faqs={faqs} />
              <ul className="ans-more">
                {more.map((x) => <li key={x.q.id}><Link href={`/answers/${x.q.slug(s)}`}>{x.q.ask(s)}</Link></li>)}
              </ul>
            </section>
            <p className="art-note">General legal information about {s.name} law as of {fmtDate(reviewed)}, not legal advice. Laws change and exceptions apply; a lawyer licensed in {s.name} can tell you how this applies to you.</p>
          </article>
          <aside className="art-side">
            <CaseReviewCard practice={q.practice} />
            <div className="card art-related">
              <div className="kicker">Learn more</div>
              {topic && <Link href={`/state/${s.slug}/${topic.slug}`}>{s.name} {topic.name.toLowerCase()} <span aria-hidden="true">→</span></Link>}
              <Link href={`/answers/${q.national.slug}`}>{q.national.h1.replace(/\?$/, '')} <span aria-hidden="true">→</span></Link>
              <Link href={`/state/${s.slug}`}>Lawyers in {s.name} <span aria-hidden="true">→</span></Link>
            </div>
          </aside>
        </div>
      </section>
      {practice && cities.length > 0 && (
        <section className="section alt">
          <div className="wrap">
            <div className="section-head reveal"><div><div className="eyebrow">Local lawyers</div><h2>{practice.lawyerTitle} in <em>{s.name}</em></h2></div></div>
            <div className="pill-row reveal">
              {cities.map((c) => <Link key={c.slug} className="pill" href={`/${c.slug}/${practice.slug}`}>{c.name} {practice.lawyerTitle.toLowerCase()} <span aria-hidden="true">→</span></Link>)}
            </div>
          </div>
        </section>
      )}
      <CtaBand practice={q.practice} title={`Talk to a ${s.name} lawyer about your situation`} />
    </>
  )
}

function National({ q }: { q: Question }) {
  const rows = answersForQuestion(q.id).sort((x, y) => x.s.name.localeCompare(y.s.name))
  const info = rows.every((r) => r.a.verdict === 'info')
  const yes = rows.filter((r) => r.a.verdict === 'yes')
  const partly = rows.filter((r) => r.a.verdict === 'partly')
  const url = `/answers/${q.national.slug}`
  const reviewed = researchedOn(q.key)
  return (
    <>
      <RevealOnScroll />
      <JsonLd data={[
        {
          '@context': 'https://schema.org', '@type': 'Dataset', name: q.national.title, description: q.national.lede, url: abs(url),
          creator: { '@id': `${SITE.url}/#organization` }, license: abs('/terms'), dateModified: reviewed, spatialCoverage: 'United States',
        },
        { '@context': 'https://schema.org', '@type': 'ItemList', name: q.national.h1, itemListElement: rows.map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: q.ask(r.s), url: abs(`/answers/${q.slug(r.s)}`) })) },
      ]} />
      <header className="art-hero">
        <div className="wrap">
          <Breadcrumbs crumbs={[{ name: 'Legal answers', path: '/answers' }, { name: q.national.h1.replace(/\?$/, ''), path: url }]} light />
          <div className="art-hero-in rise">
            <span className="kicker">All 50 states + D.C. · reviewed {fmtDate(reviewed)}</span>
            <h1>{q.national.h1}</h1>
            <p className="lede">{q.national.lede}</p>
          </div>
        </div>
      </header>
      <section className="section art-section">
        <div className="wrap" style={{ maxWidth: 980 }}>
          {!info && (
            <div className="ans-box v-yes">
              <div className="ans-verdict">{yes.length} {yes.length === 1 ? 'state' : 'states'}{partly.length ? ` (+${partly.length} partly)` : ''}</div>
              <p className="ans-text"><b>{q.yesLabel}:</b> {yes.map((r) => r.s.name).join(', ')}.{partly.length ? ` Partly: ${partly.map((r) => r.s.name).join(', ')}.` : ''}</p>
            </div>
          )}
          <div className="cmp-wrap">
            <table className="cmp wide">
              <thead><tr><th>State</th>{!info && <th>Answer</th>}<th>Rule</th><th>Law</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.s.code}>
                    <td><Link href={`/answers/${q.slug(r.s)}`}>{r.s.name}</Link></td>
                    {!info && <td><span className={`ans-pill ${VERDICT_CLASS[r.a.verdict]}`}>{r.a.short}</span></td>}
                    <td>{r.f.value}</td>
                    <td>{r.f.source ? <a href={r.f.source} target="_blank" rel="nofollow noopener">{r.f.cite}</a> : r.f.cite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="art-note">States not listed are ones where we couldn’t verify the rule against an official source. General legal information, not legal advice.</p>
          <p><Link className="link-arrow" href={`/laws/${q.topic}`}>{topicBySlug(q.topic)?.name ?? 'This topic'} in all 50 states</Link></p>
        </div>
      </section>
      <CtaBand practice={q.practice} />
    </>
  )
}
