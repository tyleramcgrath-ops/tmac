import type { Metadata } from 'next'
import Link from 'next/link'
import { Kpi, Panel } from '@/components/admin/ui'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { GUIDES } from '@/lib/content/guides'
import { CITIES, STATES } from '@/lib/geo'
import { searchAttorneys } from '@/lib/directory'
import { cityLocal } from '@/lib/law/cities'
import { FIELDS, type FieldKey, allStates } from '@/lib/law/facts'
import { TOPICS, ctxFor, topicsFor, topicsForPractice } from '@/lib/law/topics'

export const metadata: Metadata = { title: 'Content' }

export default async function Content() {
  const guides = STATES.reduce((n, s) => n + topicsFor(s.code).length, 0)
  const facts = (Object.keys(FIELDS) as FieldKey[]).map((k) => ({ k, n: allStates(k).length }))
  const verified = facts.reduce((a, f) => a + f.n, 0)
  const cityData = CITIES.filter((c) => cityLocal(c.slug))
  const indexablePairs = CITIES.reduce((n, c) => {
    const law = ctxFor(STATES.find((s) => s.code === c.state)!)
    return n + PRACTICE_AREAS.filter((p) => topicsForPractice(p.slug).some((t) => law.f(t.lead))).length
  }, 0)
  const listings = await searchAttorneys({ perPage: 1 }).catch(() => ({ total: 0 }))
  return (
    <>
      <div className="ad-head"><div><div className="eyebrow">Inventory</div><h1>Content</h1></div></div>
      <div className="ad-kpis">
        <Kpi label="State law guides" value={guides} hint={`${TOPICS.length} topics × ${STATES.length} jurisdictions`} />
        <Kpi label="Verified legal facts" value={verified} hint="Each with a citation" />
        <Kpi label="City hubs with local data" value={cityData.length} hint={`of ${CITIES.length}`} />
        <Kpi label="Indexable city + issue pages" value={indexablePairs} hint={`of ${CITIES.length * PRACTICE_AREAS.length}`} />
        <Kpi label="Real attorney listings" value={listings.total} hint="Placeholders hidden" />
        <Kpi label="Guides" value={GUIDES.length} />
      </div>
      <div className="ad-grid">
        <Panel title="Facts verified, by field" wide>
          <div className="cmp-wrap"><table className="cmp wide">
            <thead><tr><th>Fact</th><th>States verified</th></tr></thead>
            <tbody>{facts.map((f) => <tr key={f.k}><td>{FIELDS[f.k].label}</td><td>{f.n} / 51</td></tr>)}</tbody>
          </table></div>
        </Panel>
        <Panel title="Law guides by topic">
          <ul className="ad-list">{TOPICS.map((t) => <li key={t.slug}><Link href={`/laws/${t.slug}`}>{t.name}</Link><span className="muted">{STATES.filter((s) => topicsFor(s.code).includes(t)).length} states</span></li>)}</ul>
        </Panel>
        <Panel title="City hubs">
          <ul className="ad-list">{CITIES.map((c) => { const l = cityLocal(c.slug); return <li key={c.slug}><Link href={`/${c.slug}`}>{c.name}, {c.state}</Link><span className="muted">{l ? [l.stateCourt && 'courts', l.legalAid.length && 'legal aid', l.bar?.referral && 'referral', l.photo && 'photo'].filter(Boolean).join(' · ') : 'no local data yet'}</span></li> })}</ul>
        </Panel>
      </div>
    </>
  )
}
