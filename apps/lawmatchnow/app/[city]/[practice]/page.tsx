import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DirectoryResults, pageParam } from '@/components/Directory'
import { RevealOnScroll } from '@/components/fx/Reveal'
import { SectionNav } from '@/components/fx/SectionNav'
import { UsMap } from '@/components/fx/UsMap'
import { TopicHero } from '@/components/TopicHero'
import { CtaBand, Faqs, SearchBar } from '@/components/ui'
import { COMMON_FEES, FEE_TYPES } from '@/lib/content/fees'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { cityBySlug, citiesInState, stateByCode } from '@/lib/geo'
import { searchAttorneys } from '@/lib/directory'
import { LocalCards } from '@/components/CityLocal'
import { FactTable } from '@/components/LawFacts'
import { type CityLocal, cityLocal } from '@/lib/law/cities'
import { ctxFor, topicsForPractice } from '@/lib/law/topics'
import { clip } from '@/lib/site'

type Props = { params: Promise<{ city: string; practice: string }>; searchParams: Promise<{ page?: string }> }
export const revalidate = 3600

function resolve(city: string, practice: string) {
  const c = cityBySlug(city)
  const p = PRACTICE_AREAS.find((x) => x.slug === practice)
  if (!c || !p) return null
  const st = stateByCode(c.state)!
  const law = ctxFor(st)
  // The state law guides that apply to this practice and are verified for this state.
  const topics = topicsForPractice(p.slug).filter((t) => law.f(t.lead))
  return { c, p, st, law, topics }
}

// Which local court cards matter for each kind of case.
function localFor(practice: string, loc: CityLocal): CityLocal {
  const pick = (keys: (keyof CityLocal)[]) => ({
    ...loc,
    stateCourt: keys.includes('stateCourt') ? loc.stateCourt : null,
    smallClaims: keys.includes('smallClaims') ? loc.smallClaims : null,
    federalCourt: keys.includes('federalCourt') ? loc.federalCourt : null,
    immigrationCourt: keys.includes('immigrationCourt') ? loc.immigrationCourt : null,
  })
  if (practice === 'immigration') return pick(['immigrationCourt', 'federalCourt', 'bar', 'legalAid'])
  if (['bankruptcy', 'civil-rights', 'intellectual-property', 'social-security-disability'].includes(practice)) return pick(['federalCourt', 'bar', 'legalAid'])
  if (['consumer-protection', 'business-law', 'real-estate'].includes(practice)) return pick(['smallClaims', 'stateCourt', 'bar', 'legalAid'])
  return pick(['stateCourt', 'bar', 'legalAid'])
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { city, practice } = await params
  const r = resolve(city, practice)
  if (!r) return {}
  const { c, p, st, law, topics } = r
  // Indexed when it has real listings or verified state law for this issue;
  // otherwise it would add nothing to search results.
  const { total } = await searchAttorneys({ city: c.name, state: c.state, practice: p.slug, perPage: 1 })
  const thin = (total < 3 && !topics.length) || pageParam((await searchParams).page) > 1
  const lead = topics[0] ? law.f(topics[0].lead) : null
  return {
    title: `${c.name} ${p.lawyerTitle} & ${st.code} Law`,
    description: clip(lead && topics[0]
      ? `Compare ${p.lawyerTitle.toLowerCase()} in ${c.name}, ${st.code} and get a free case review. ${topics[0].answer(law)}`
      : `Compare ${p.lawyerTitle.toLowerCase()} in ${c.name}, ${st.code} and get a free case review. ${p.short}`),
    alternates: { canonical: `/${c.slug}/${p.slug}` },
    robots: thin ? { index: false, follow: true } : undefined,
  }
}

export default async function CityPractice({ params, searchParams }: Props) {
  const { city, practice } = await params
  const r = resolve(city, practice)
  if (!r) notFound()
  const { c, p, st, law, topics } = r
  const page = pageParam((await searchParams).page)
  const loc = cityLocal(c.slug)
  const local = loc ? localFor(p.slug, loc) : null
  const topic = topics[0]
  const lawRows = topic ? topic.fields.map((key) => ({ key, f: law.f(key)! })).filter((x) => x.f).slice(0, 6) : []
  const stateFaqs = topics.flatMap((t) => t.faqs(law)).slice(0, 4)
  const g = p.guide
  const fees = COMMON_FEES[p.slug] ?? []
  const nearby = citiesInState(c.state).filter((x) => x.slug !== c.slug)
  const siblings = PRACTICE_AREAS.filter((x) => x.guide && x.slug !== p.slug).slice(0, 10)
  return (
    <>
      <RevealOnScroll />
      <TopicHero
        crumbs={[{ name: st.name, path: `/state/${st.slug}` }, { name: c.name, path: `/${c.slug}` }, { name: p.name, path: `/${c.slug}/${p.slug}` }]}
        eyebrow={`${c.name}, ${st.name} · ${p.name}`}
        title={<>{p.lawyerTitle} in {c.name}</>}
        lede={g?.overview[0] ?? p.short}
        aside={
          <div className="glance">
            <div className="glance-head">Before you call</div>
            <dl>
              <div><dt>Usually paid by</dt><dd>{fees.length ? fees.map((f) => FEE_TYPES.find((t) => t.key === f)!.name).join(' or ') : 'Varies by lawyer and case'}</dd></div>
              <div><dt>Licensing</dt><dd>Look for a lawyer licensed in {st.name}</dd></div>
              {g && <div><dt>Ask first</dt><dd>{g.questionsToAsk[0]}</dd></div>}
            </dl>
            <Link href={`/get-started?practice=${p.slug}&location=${encodeURIComponent(`${c.name}, ${c.state}`)}`} className="btn btn-primary" style={{ width: '100%' }}>Free case review</Link>
          </div>
        }
      >
        <SearchBar practice={p.slug} location={`${c.name}, ${c.state}`} />
      </TopicHero>
      <SectionNav items={[{ id: 'lawyers', label: 'Attorneys' }, ...(lawRows.length ? [{ id: 'law', label: `${st.name} law` }] : []), ...(local ? [{ id: 'local', label: `${c.name} courts & help` }] : []), ...(g ? [{ id: 'when', label: 'When to call' }] : []), { id: 'map', label: 'Other cities' }, ...(g || stateFaqs.length ? [{ id: 'faq', label: 'FAQ' }] : [])]} />

      <section className="section" id="lawyers">
        <div className="wrap">
          <DirectoryResults query={{ city: c.name, state: c.state, practice: p.slug, page }} heading={`${p.lawyerTitle} in ${c.name}`}
            basePath={`/${c.slug}/${p.slug}`} practiceSlug={p.slug}
            emptyHint={<>Try <Link href={`/practice-area/${p.slug}`}>{p.lawyerTitle.toLowerCase()} nationwide</Link> or <Link href={`/${c.slug}`}>all {c.name} attorneys</Link>.</>} />
        </div>
      </section>

      {topic && lawRows.length > 0 && (
        <section className="section alt" id="law">
          <div className="wrap">
            <div className="section-head reveal">
              <div><div className="eyebrow">{st.name} law</div><h2>What {st.name} law says about your {p.name.toLowerCase()} case</h2></div>
              <p>{topic.answer(law)}</p>
            </div>
            <div className="reveal"><FactTable rows={lawRows} /></div>
            <div className="pill-row reveal" style={{ marginTop: 24 }}>
              {topics.map((t) => <Link key={t.slug} className="pill" href={`/state/${st.slug}/${t.slug}`}>{t.heading(st)} <span aria-hidden="true">→</span></Link>)}
            </div>
          </div>
        </section>
      )}

      {local && (
        <section className="section" id="local">
          <div className="wrap">
            <div className="section-head reveal">
              <div><div className="eyebrow">Local help</div><h2>Courts and free help in {c.name}</h2></div>
              <p>Where {p.name.toLowerCase()} cases from {c.name} are heard, and where to turn if you can&apos;t afford a lawyer.</p>
            </div>
            <div className="reveal"><LocalCards loc={local} city={c.name} /></div>
          </div>
        </section>
      )}

      {g && (
        <section className="section alt" id="when">
          <div className="wrap split-q">
            <div className="reveal">
              <div className="eyebrow">When to call</div>
              <h2>Signs you need a {p.name.toLowerCase()} lawyer in {c.name}</h2>
              <p className="muted">Deadlines and procedures vary in {st.name}, so it&apos;s worth a call early. Most first consultations are short.</p>
              <p><Link className="link-arrow" href={`/practice-area/${p.slug}`}>Full {p.name.toLowerCase()} guide</Link></p>
            </div>
            <ul className="checklist big-check reveal">{g.whenToHire.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </section>
      )}

      <section className="section map-section" id="map">
        <div className="wrap">
          <div className="section-head reveal">
            <div><div className="eyebrow">Other cities</div><h2>{p.lawyerTitle} in other cities</h2></div>
            <p>Every pin opens {p.lawyerTitle.toLowerCase()} in that city.</p>
          </div>
          <div className="map-card reveal"><UsMap practice={p.slug} highlight={c.slug} /></div>
          {nearby.length > 0 && (
            <div className="pill-row reveal" style={{ marginTop: 24 }}>
              {nearby.map((x) => <Link key={x.slug} className="pill" href={`/${x.slug}/${p.slug}`}>{x.name} <span aria-hidden="true">→</span></Link>)}
            </div>
          )}
        </div>
      </section>

      {(g || stateFaqs.length > 0) && (
        <section className="section" id="faq">
          <div className="wrap reveal" style={{ maxWidth: 900 }}>
            <div className="eyebrow">FAQ</div>
            <h2>{p.name} questions in {c.name}</h2>
            {stateFaqs.length > 0 && <Faqs faqs={stateFaqs} />}
            {g && <Faqs faqs={g.faqs.slice(0, stateFaqs.length ? 3 : g.faqs.length)} schema={!stateFaqs.length} />}
          </div>
        </section>
      )}

      <section className="section tight">
        <div className="wrap reveal">
          <div className="eyebrow">Other legal issues in {c.name}</div>
          <div className="pill-row">{siblings.map((x) => <Link className="pill" key={x.slug} href={`/${c.slug}/${x.slug}`}>{x.name} <span aria-hidden="true">→</span></Link>)}</div>
        </div>
      </section>
      <CtaBand practice={p.slug} title={`Need a ${p.name.toLowerCase()} lawyer in ${c.name}?`} />
    </>
  )
}
