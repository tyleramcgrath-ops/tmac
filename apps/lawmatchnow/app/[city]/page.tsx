import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CityPhoto, LocalCards, courtsLd } from '@/components/CityLocal'
import { DirectoryResults, pageParam } from '@/components/Directory'
import { RevealOnScroll } from '@/components/fx/Reveal'
import { SectionNav } from '@/components/fx/SectionNav'
import { UsMap } from '@/components/fx/UsMap'
import { FactTable } from '@/components/LawFacts'
import { TopicHero } from '@/components/TopicHero'
import { CtaBand, Faqs, JsonLd, SearchBar } from '@/components/ui'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { CITIES, CITY_COORDS, cityBySlug, citiesInState, stateByCode } from '@/lib/geo'
import { cityLocal } from '@/lib/law/cities'
import { ctxFor, glanceRows, topicsFor } from '@/lib/law/topics'
import { abs, clip } from '@/lib/site'

type Props = { params: Promise<{ city: string }>; searchParams: Promise<{ page?: string }> }
export const revalidate = 3600
export const dynamicParams = false
export const generateStaticParams = () => CITIES.map((c) => ({ city: c.slug }))

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const c = cityBySlug((await params).city)
  if (!c) return {}
  const st = stateByCode(c.state)!
  const loc = cityLocal(c.slug)
  return {
    title: `${c.name}, ${c.state} Lawyers: Find an Attorney`,
    description: clip(`Find ${c.name}, ${st.name} attorneys by legal issue. Local courts${loc?.county ? ` in ${loc.county}` : ''}, free legal aid, the bar referral service and the ${st.name} laws that apply to your case.`),
    alternates: { canonical: `/${c.slug}` },
    robots: pageParam((await searchParams).page) > 1 ? { index: false, follow: true } : undefined,
    ...(loc?.photo ? { openGraph: { images: [{ url: `https://images.unsplash.com/photo-${loc.photo.id}?w=1200&h=630&fit=crop&q=72`, width: 1200, height: 630, alt: loc.photo.alt }] } } : {}),
  }
}

export default async function CityPage({ params, searchParams }: Props) {
  const c = cityBySlug((await params).city)
  if (!c) notFound()
  const st = stateByCode(c.state)!
  const page = pageParam((await searchParams).page)
  const loc = cityLocal(c.slug)
  const law = ctxFor(st)
  const topics = topicsFor(st.code)
  const glance = glanceRows(law, `/state/${st.slug}`)
  const nearby = citiesInState(c.state).filter((x) => x.slug !== c.slug)
  const main = PRACTICE_AREAS.filter((p) => p.guide)
  const more = PRACTICE_AREAS.filter((p) => !p.guide)
  const lookup = law.f('damages-bar.lawyerLookup'), bar = law.f('damages-bar.barName')
  const sc = law.f('small-claims.smallClaimsLimit'), pi = law.f('sol-injury.personalInjury')

  const faqs = [
    ...(loc?.stateCourt ? [{ q: `Which court handles lawsuits in ${c.name}?`, a: `Most civil and criminal cases in ${c.name} are heard by the ${loc.stateCourt.name}${loc.stateCourt.courthouse ? `, at the ${loc.stateCourt.courthouse}` : ''}${loc.stateCourt.address ? ` (${loc.stateCourt.address})` : ''}.${loc.federalCourt ? ` Federal cases go to the ${loc.federalCourt.name}.` : ''}` }] : []),
    ...(sc ? [{ q: `How do I file a small claims case in ${c.name}?`, a: `In ${st.name} you can sue for up to ${sc.value} in small claims${loc?.smallClaims ? `; in ${c.name}, file with the ${loc.smallClaims.court}` : ''}. Send a written demand first, then file the claim form and have the other side served.` }] : []),
    ...(pi ? [{ q: `How long do I have to sue after an accident in ${c.name}?`, a: `${st.name} generally allows ${pi.value} to file a personal injury lawsuit${pi.cite ? ` (${pi.cite})` : ''}. Claims against a city or county usually need written notice much sooner, so talk to a lawyer quickly.` }] : []),
    ...(loc?.legalAid.length ? [{ q: `Where can I get free legal help in ${c.name}?`, a: `${loc.legalAid.map((a) => a.name).join(', ')} ${loc.legalAid.length > 1 ? 'provide' : 'provides'} free civil legal help to eligible low-income residents.${loc.bar?.referral ? ` For everyone else, the ${loc.bar.referral.name}${loc.bar.referral.phone ? ` (${loc.bar.referral.phone})` : ''} can refer you to a screened local lawyer.` : ''}` }] : []),
    { q: `How do I check that a ${c.name} lawyer is licensed?`, a: `${bar ? `Lawyers in ${st.name} are licensed by ${bar.value}. ` : ''}${lookup ? `Look them up at ${lookup.value} to confirm they're in good standing and see any discipline.` : `Check the ${st.name} bar's online member search before you hire anyone.`}` },
    { q: 'Is the case review really free?', a: `Yes. Tell us what happened and where, and we'll help you reach attorneys who handle cases like yours in and around ${c.name}. There's no cost and no obligation to hire anyone.` },
  ]
  const coords = CITY_COORDS[c.slug]

  return (
    <>
      <RevealOnScroll />
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'CollectionPage', name: `Lawyers in ${c.name}, ${st.name}`, url: abs(`/${c.slug}`),
        about: {
          '@type': 'City', name: c.name,
          containedInPlace: { '@type': 'State', name: st.name },
          ...(coords ? { geo: { '@type': 'GeoCoordinates', latitude: coords[0], longitude: coords[1] } } : {}),
        },
        ...(loc ? { mentions: courtsLd(loc) } : {}),
      }} />
      <TopicHero
        crumbs={[{ name: st.name, path: `/state/${st.slug}` }, { name: c.name, path: `/${c.slug}` }]}
        eyebrow={`${c.name}, ${st.name}${loc?.county ? ` · ${loc.county}` : ''}`}
        title={<>Lawyers in <em>{c.name}</em></>}
        lede={`Find ${c.name} attorneys by legal issue, and the local courts, free legal help and ${st.name} rules that shape your case.`}
        aside={loc?.photo ? <CityPhoto loc={loc} priority /> : (
          <div className="map-mini">
            <UsMap highlight={c.slug} />
            <div className="map-mini-foot"><span><b>{c.name}</b>, {st.name}</span><Link className="link-arrow" href={`/state/${st.slug}`}>All of {st.name}</Link></div>
          </div>
        )}
      >
        <SearchBar location={`${c.name}, ${c.state}`} />
      </TopicHero>
      <SectionNav items={[
        ...(loc ? [{ id: 'local', label: `Legal guide to ${c.name}` }] : []),
        { id: 'issues', label: 'By legal issue' },
        ...(glance.length ? [{ id: 'laws', label: `${st.name} law` }] : []),
        { id: 'lawyers', label: 'Attorneys' },
        ...(nearby.length ? [{ id: 'nearby', label: `Elsewhere in ${st.code}` }] : []),
        { id: 'faq', label: 'FAQ' },
      ]} />

      {loc && (
        <section className="section" id="local">
          <div className="wrap">
            <div className="section-head reveal">
              <div><div className="eyebrow">Local guide</div><h2>The legal landscape in <em>{c.name}</em></h2></div>
              {loc.population && <p>{c.name} is home to about {loc.population.value.toLocaleString('en-US')} people ({loc.population.year} Census estimate){loc.county ? ` in ${loc.county}` : ''}.</p>}
            </div>
            {loc.blurb && <p className="local-blurb reveal">{loc.blurb}</p>}
            <div className="reveal"><LocalCards loc={loc} city={c.name} /></div>
          </div>
        </section>
      )}

      <section className={`section${loc ? ' alt' : ''}`} id="issues">
        <div className="wrap">
          <div className="section-head reveal">
            <div><div className="eyebrow">By legal issue</div><h2>What do you need help with in {c.name}?</h2></div>
            <p>Pick your issue to see {c.name} attorneys who focus on it, plus the {st.name} rules, costs and questions to ask.</p>
          </div>
          <div className="issue-grid reveal">
            {main.map((p, i) => (
              <Link key={p.slug} href={`/${c.slug}/${p.slug}`} className="issue-tile">
                <span className="area-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="issue-name">{p.name}</span>
                <span className="issue-short">{p.short}</span>
                <span className="issue-go">{c.name} {p.lawyerTitle.toLowerCase()} →</span>
              </Link>
            ))}
          </div>
          <details className="more-areas reveal">
            <summary>More practice areas in {c.name} ({more.length})</summary>
            <ul className="link-columns c4">{more.map((p) => <li key={p.slug}><Link href={`/${c.slug}/${p.slug}`}>{p.name}</Link></li>)}</ul>
          </details>
        </div>
      </section>

      {glance.length > 0 && (
        <section className={`section${loc ? '' : ' alt'}`} id="laws">
          <div className="wrap">
            <div className="section-head reveal">
              <div><div className="eyebrow">Know the law</div><h2>{st.name} law for {c.name} residents</h2></div>
              <p>{c.name} cases follow {st.name} law. The key rule in each area, with its statute; select one for the full guide.</p>
            </div>
            <div className="reveal"><FactTable rows={glance} /></div>
          </div>
        </section>
      )}

      <section className="section alt" id="lawyers">
        <div className="wrap">
          <DirectoryResults query={{ city: c.name, state: c.state, page }} heading={`Attorneys in ${c.name}`} basePath={`/${c.slug}`} />
        </div>
      </section>

      {nearby.length > 0 && (
        <section className="section" id="nearby">
          <div className="wrap">
            <div className="section-head reveal"><div><div className="eyebrow">Nearby</div><h2>Elsewhere in {st.name}</h2></div></div>
            <div className="pill-row reveal">
              {nearby.map((x) => <Link className="pill" key={x.slug} href={`/${x.slug}`}>{x.name} <span aria-hidden="true">→</span></Link>)}
              <Link className="pill pill-dark" href={`/state/${st.slug}`}>All {st.name} lawyers <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </section>
      )}

      <section className="section alt" id="faq">
        <div className="wrap reveal" style={{ maxWidth: 900 }}>
          <div className="eyebrow">FAQ</div>
          <h2>Finding a lawyer in {c.name}</h2>
          <Faqs faqs={faqs} />
        </div>
      </section>
      <CtaBand title={`Need a lawyer in ${c.name}?`} />
    </>
  )
}
