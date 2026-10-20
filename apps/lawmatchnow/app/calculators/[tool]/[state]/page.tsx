import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RevealOnScroll } from '@/components/fx/Reveal'
import { Calculator } from '@/components/tools/Calculator'
import { Breadcrumbs, CaseReviewCard, CtaBand, Faqs, JsonLd } from '@/components/ui'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { citiesInState, stateBySlug } from '@/lib/geo'
import { neighbors } from '@/lib/law/compare'
import { researchedOn } from '@/lib/law/facts'
import { TOOLS, type Rule, statesFor, toolBySlug } from '@/lib/law/tools'
import { SITE, abs, fmtDate } from '@/lib/site'

type Props = { params: Promise<{ tool: string; state: string }> }
export const dynamicParams = false
export const generateStaticParams = () => TOOLS.flatMap((t) => statesFor(t).map((s) => ({ tool: t.slug, state: s.slug })))

function load(toolSlug: string, stateSlug: string) {
  const t = toolBySlug(toolSlug)
  const s = stateBySlug(stateSlug)
  const d = t && s ? t.data(s.code) : null
  return t && s && d ? { t, s, d } : null
}

const rulesOf = (d: NonNullable<ReturnType<typeof load>>['d']): Rule[] =>
  d.kind === 'deadline' ? [...d.rules, ...(d.cap ? [d.cap] : [])]
    : d.kind === 'fault' ? [d.fact, ...(d.joint ? [d.joint] : [])]
      : d.kind === 'smallclaims' ? [d.fact, ...[d.court, d.lawyers].filter((x): x is Rule => !!x)]
        : [d.fact, ...(d.tippedFact ? [d.tippedFact] : [])]

const REVIEWED = researchedOn('sol-injury.personalInjury')

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tool, state } = await params
  const r = load(tool, state)
  if (!r) return {}
  const { t, s, d } = r
  const url = `/calculators/${t.slug}/${s.slug}`
  const title = `${t.title(s)} (${REVIEWED.slice(0, 4)})`
  const description = t.description(s, d).slice(0, 300)
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url: abs(url) } }
}

export default async function StateToolPage({ params }: Props) {
  const { tool, state } = await params
  const r = load(tool, state)
  if (!r) notFound()
  const { t, s, d } = r
  const url = `/calculators/${t.slug}/${s.slug}`
  const states = statesFor(t).map((x) => ({ slug: x.slug, name: x.name }))
  const rules = rulesOf(d)
  const faqs = t.faqs(s, d)
  const near = neighbors(s.code).filter((n) => t.data(n.code))
  const practice = PRACTICE_AREAS.find((p) => p.slug === t.practice)
  const cities = citiesInState(s.code)
  const otherTools = TOOLS.filter((x) => x.slug !== t.slug && x.data(s.code))
  const heading = t.heading(s)

  return (
    <>
      <RevealOnScroll />
      <JsonLd data={[
        {
          '@context': 'https://schema.org', '@type': 'WebApplication', name: heading, description: t.description(s, d), url: abs(url),
          applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@id': `${SITE.url}/#organization` },
          spatialCoverage: { '@type': 'State', name: s.name },
          citation: rules.filter((x) => x.cite).map((x) => ({ '@type': 'Legislation', name: x.cite, ...(x.source ? { url: x.source } : {}), legislationJurisdiction: s.name })),
        },
        {
          '@context': 'https://schema.org', '@type': 'HowTo', name: `How to use the ${heading.toLowerCase()}`,
          step: t.how.map((text, i) => ({ '@type': 'HowToStep', position: i + 1, text })),
        },
      ]} />

      <header className="art-hero tool-hero">
        <div className="wrap">
          <Breadcrumbs crumbs={[{ name: 'Legal calculators', path: '/calculators' }, { name: t.name.replace(/^./, (c) => c.toUpperCase()), path: `/calculators/${t.slug}` }, { name: s.name, path: url }]} light />
          <div className="art-hero-in rise">
            <span className="kicker">Free {s.name} legal tool</span>
            <h1>{heading}</h1>
            <p className="lede">{t.answer(s, d)}</p>
          </div>
        </div>
      </header>

      <section className="section art-section">
        <div className="wrap art-layout tool-layout">
          <article className="art-body prose">
            <Calculator tool={t.slug} toolName={t.name} state={s.name} stateSlug={s.slug} data={d} states={states} />

            <section className="art-sec">
              <h2>How this works</h2>
              {t.how.map((p) => <p key={p}>{p}</p>)}
            </section>

            {near.length > 0 && (
              <section className="art-sec">
                <h2>Neighboring states</h2>
                <table className="cmp">
                  <thead><tr><th>State</th><th>{rules[0].label}</th></tr></thead>
                  <tbody>
                    <tr className="me"><td>{s.name}</td><td>{rules[0].value}</td></tr>
                    {near.map((n) => {
                      const nd = t.data(n.code)!
                      return <tr key={n.code}><td><Link href={`/calculators/${t.slug}/${n.slug}`}>{n.name}</Link></td><td>{rulesOf(nd)[0]?.value}</td></tr>
                    })}
                  </tbody>
                </table>
              </section>
            )}

            {faqs.length > 0 && (
              <section className="art-sec">
                <h2>Frequently asked questions</h2>
                <Faqs faqs={faqs} />
              </section>
            )}

            <section className="art-sec">
              <h2>Sources</h2>
              <p className="muted">The rules this tool uses, checked against {s.name}’s statutes and official pages as of {fmtDate(REVIEWED)}.</p>
              <ol className="sources">
                {rules.filter((x) => x.cite).map((x) => <li key={x.key}>{x.label}: {x.source ? <a href={x.source} rel="nofollow noopener" target="_blank">{x.cite}</a> : x.cite}</li>)}
              </ol>
            </section>
            <p className="art-note">This calculator gives general legal information about {s.name} law, not legal advice. Exceptions can change the answer for your case; talk to a lawyer licensed in {s.name} before relying on it.</p>
          </article>
          <aside className="art-side">
            <CaseReviewCard practice={t.practice} />
            <div className="card art-related">
              <div className="kicker">Related {s.name} law</div>
              {t.related.map((x) => <Link key={x.label} href={x.href(s)}>{x.label} <span aria-hidden="true">→</span></Link>)}
            </div>
            {otherTools.length > 0 && (
              <div className="card art-related">
                <div className="kicker">More {s.name} tools</div>
                {otherTools.map((x) => <Link key={x.slug} href={`/calculators/${x.slug}/${s.slug}`}>{x.name.replace(/^./, (c) => c.toUpperCase())} <span aria-hidden="true">→</span></Link>)}
              </div>
            )}
          </aside>
        </div>
      </section>

      {practice && cities.length > 0 && (
        <section className="section alt">
          <div className="wrap">
            <div className="section-head reveal"><div><div className="eyebrow">Local lawyers</div><h2>{practice.lawyerTitle} in <em>{s.name}</em></h2></div></div>
            <div className="pill-row reveal">
              {cities.map((c) => <Link key={c.slug} className="pill" href={`/${c.slug}/${practice.slug}`}>{c.name} {practice.lawyerTitle.toLowerCase()} <span aria-hidden="true">→</span></Link>)}
              <Link className="pill pill-dark" href={`/state/${s.slug}`}>All {s.name} lawyers <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </section>
      )}
      <CtaBand practice={t.practice} title={`Talk to a ${s.name} lawyer about your situation`} />
    </>
  )
}

