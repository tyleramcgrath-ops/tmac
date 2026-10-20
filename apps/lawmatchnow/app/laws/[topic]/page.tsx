import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RevealOnScroll } from '@/components/fx/Reveal'
import { TopicHero } from '@/components/TopicHero'
import { CtaBand, Faqs, JsonLd } from '@/components/ui'
import { STATES } from '@/lib/geo'
import { FIELDS, fact, researchedOn } from '@/lib/law/facts'
import { TOPICS, topicBySlug } from '@/lib/law/topics'
import { SITE, abs, fmtDate } from '@/lib/site'

type Props = { params: Promise<{ topic: string }> }
export const dynamicParams = false
export const generateStaticParams = () => TOPICS.map((t) => ({ topic: t.slug }))

/** Up to three columns per topic: the lead fact plus the most-searched others. */
const columns = (slug: string) => topicBySlug(slug)!.fields.slice(0, 3)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = topicBySlug((await params).topic)
  if (!t) return {}
  const year = researchedOn(t.lead).slice(0, 4)
  return {
    title: `${t.name} by State: 50-State Chart (${year})`,
    description: `${t.name} in every U.S. state and D.C.: ${columns(t.slug).map((k) => FIELDS[k].label.toLowerCase()).join(', ')}, with the statute for each and a full guide per state.`,
    alternates: { canonical: `/laws/${t.slug}` },
  }
}

export default async function LawByState({ params }: Props) {
  const t = topicBySlug((await params).topic)
  if (!t) notFound()
  const cols = columns(t.slug)
  const rows = STATES.map((s) => ({ s, vals: cols.map((k) => fact(s.code, k)) })).filter((r) => r.vals[0])
  const reviewed = researchedOn(t.lead)
  const faqs = [
    { q: `Do ${t.name.toLowerCase()} differ by state?`, a: `Yes. Each state sets its own rules, and they can differ a lot. This table shows each state's current rule with a link to the statute and to a full guide for that state.` },
    { q: 'How current is this information?', a: `Each fact was checked against the state's statute, court rule or official agency page as of ${fmtDate(reviewed)}. Laws change, so confirm with a lawyer licensed in your state before relying on it.` },
  ]
  return (
    <>
      <RevealOnScroll />
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'Dataset', name: `${t.name} by State`,
        description: `${t.name} for all 50 U.S. states and the District of Columbia, with statutory citations.`,
        url: abs(`/laws/${t.slug}`), dateModified: reviewed, creator: { '@id': `${SITE.url}/#organization` },
        spatialCoverage: { '@type': 'Country', name: 'United States' }, isAccessibleForFree: true,
        variableMeasured: cols.map((k) => FIELDS[k].label),
      }} />
      <TopicHero
        crumbs={[{ name: 'State laws', path: '/laws' }, { name: `${t.name} by state`, path: `/laws/${t.slug}` }]}
        eyebrow="50-state survey"
        title={<>{t.name} <em>by state</em></>}
        lede={`Every state's rules side by side, each with its statute. Reviewed ${fmtDate(reviewed)}. Select a state for the full guide.`}
      />
      <section className="section">
        <div className="wrap reveal">
          <div className="cmp-wrap">
            <table className="cmp wide">
              <thead><tr><th>State</th>{cols.map((k) => <th key={k}>{FIELDS[k].label}</th>)}</tr></thead>
              <tbody>
                {rows.map(({ s, vals }) => (
                  <tr key={s.code}>
                    <td><Link href={`/state/${s.slug}/${t.slug}`}>{s.name}</Link></td>
                    {vals.map((f, i) => <td key={cols[i]}>{f ? <>{f.value}{f.cite && <small>{f.cite}</small>}</> : <span className="muted">—</span>}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ marginTop: 16 }}>A dash means we haven't verified that rule yet; we only publish facts confirmed against an official source.</p>
        </div>
      </section>
      <section className="section alt">
        <div className="wrap reveal" style={{ maxWidth: 900 }}>
          <div className="eyebrow">FAQ</div>
          <h2>About this table</h2>
          <Faqs faqs={faqs} />
          <div className="pill-row" style={{ marginTop: 28 }}>
            {TOPICS.filter((x) => x.slug !== t.slug).map((x) => <Link key={x.slug} className="pill" href={`/laws/${x.slug}`}>{x.name} by state <span aria-hidden="true">→</span></Link>)}
          </div>
        </div>
      </section>
      <CtaBand practice={t.practices[0]} />
    </>
  )
}
