import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DirectoryResults, pageParam } from '@/components/Directory'
import { RevealOnScroll } from '@/components/fx/Reveal'
import { SectionNav } from '@/components/fx/SectionNav'
import { FactTable } from '@/components/LawFacts'
import { TopicHero } from '@/components/TopicHero'
import { CtaBand, Faqs, SearchBar } from '@/components/ui'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { STATES, citiesInState, stateBySlug } from '@/lib/geo'
import { cityLocal } from '@/lib/law/cities'
import { fact } from '@/lib/law/facts'
import { ctxFor, glanceRows, topicsFor } from '@/lib/law/topics'
import { answersForState } from '@/lib/law/answers'
import { clip } from '@/lib/site'

type Props = { params: Promise<{ state: string }>; searchParams: Promise<{ page?: string }> }
export const revalidate = 3600
export const dynamicParams = false
export const generateStaticParams = () => STATES.map((s) => ({ state: s.slug }))

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const s = stateBySlug((await params).state)
  if (!s) return {}
  const pi = fact(s.code, 'sol-injury.personalInjury')
  return {
    title: `${s.name} Lawyers & ${s.code} Law Guide`,
    description: clip(`Find attorneys licensed in ${s.name} by city and practice area${pi ? `, and know the rules: ${pi.value} to file an injury lawsuit` : ''}, plus divorce, DUI, small claims and more, with statutes cited.`),
    alternates: { canonical: `/state/${s.slug}` },
    robots: pageParam((await searchParams).page) > 1 ? { index: false, follow: true } : undefined,
  }
}

export default async function StatePage({ params, searchParams }: Props) {
  const s = stateBySlug((await params).state)
  if (!s) notFound()
  const page = pageParam((await searchParams).page)
  const c = ctxFor(s)
  const cities = citiesInState(s.code)
  const topics = topicsFor(s.code)
  const glance = glanceRows(c, `/state/${s.slug}`)
  const bar = c.f('damages-bar.barName'), lookup = c.f('damages-bar.lawyerLookup'), referral = c.f('damages-bar.barReferral')
  const top = PRACTICE_AREAS.filter((p) => p.guide)
  const biggest = cities[0]
  const faqs = [
    ...(bar ? [{ q: `Who licenses lawyers in ${s.name}?`, a: `${bar.value}${lookup ? `. You can check any lawyer's license and discipline history at ${lookup.value}` : ''}. Always confirm a lawyer is licensed and in good standing before you hire them.` }] : []),
    ...(c.f('sol-injury.personalInjury') ? [{ q: `How long do you have to file a lawsuit in ${s.name}?`, a: `It depends on the claim. Personal injury: ${c.f('sol-injury.personalInjury')!.value}${c.f('sol-civil.writtenContract') ? `; written contracts: ${c.f('sol-civil.writtenContract')!.value}` : ''}${c.f('sol-injury.medicalMalpractice') ? `; medical malpractice: ${c.f('sol-injury.medicalMalpractice')!.value}` : ''}. See our ${s.name} statute of limitations guide for the full list.` }] : []),
    ...(referral ? [{ q: `Does ${s.name} have a lawyer referral service?`, a: `Yes: ${referral.value}${referral.detail ? ` (${referral.detail})` : ''}. Referral services screen lawyers and can often arrange a low-cost first consultation.` }] : []),
    { q: `Can a lawyer from another state represent me in ${s.name}?`, a: `Generally, a lawyer needs a ${s.name} license to advise on ${s.name} law or appear in its state courts. Out-of-state lawyers can sometimes appear in a single case with a court's permission ("pro hac vice"), and federal matters such as immigration work differently.` },
  ]

  return (
    <>
      <RevealOnScroll />
      <TopicHero
        crumbs={[{ name: 'States', path: '/states' }, { name: s.name, path: `/state/${s.slug}` }]}
        eyebrow={`${s.name} · ${s.code}`}
        title={<>{s.name} <em>lawyers</em> &amp; law</>}
        lede={`Find attorneys licensed in ${s.name}, and understand the ${s.name} rules that shape your case, each with the statute it comes from.`}
        aside={
          <div className="glance">
            <div className="glance-head">Check before you hire</div>
            <dl>
              {bar && <div><dt>Licensing body</dt><dd>{bar.source ? <a href={bar.source} rel="nofollow noopener" target="_blank">{bar.value}</a> : bar.value}</dd></div>}
              {lookup && <div><dt>Verify a license</dt><dd><a href={lookup.value!} rel="nofollow noopener" target="_blank">{lookup.detail || 'Official lawyer search'}</a></dd></div>}
              {referral && <div><dt>Bar referral service</dt><dd>{referral.source ? <a href={referral.source} rel="nofollow noopener" target="_blank">{referral.value}</a> : referral.value}{referral.detail ? ` · ${referral.detail}` : ''}</dd></div>}
              {!bar && !lookup && <div><dt>Licensing</dt><dd>Look for a lawyer licensed in {s.name}</dd></div>}
            </dl>
            <Link href={`/get-started?location=${encodeURIComponent(s.name)}`} className="btn btn-primary" style={{ width: '100%' }}>Free case review</Link>
          </div>
        }
      >
        <SearchBar location={s.name} />
      </TopicHero>
      <SectionNav items={[...(glance.length ? [{ id: 'laws', label: `${s.name} laws` }] : []), ...(cities.length ? [{ id: 'cities', label: 'Cities' }] : []), { id: 'issues', label: 'By legal issue' }, { id: 'lawyers', label: 'Attorneys' }, { id: 'faq', label: 'FAQ' }]} />

      {glance.length > 0 && (
        <section className="section" id="laws">
          <div className="wrap">
            <div className="section-head reveal">
              <div><div className="eyebrow">Know the law</div><h2>{s.name} laws <em>at a glance</em></h2></div>
              <p>The rule that matters most in each area, verified against {s.name} statutes. Select one for the full guide.</p>
            </div>
            <div className="reveal"><FactTable rows={glance} /></div>
            <div className="pill-row reveal" style={{ marginTop: 24 }}>
              {topics.map((t) => <Link key={t.slug} className="pill" href={`/state/${s.slug}/${t.slug}`}>{t.heading(s)} <span aria-hidden="true">→</span></Link>)}
            </div>
          </div>
        </section>
      )}

      {cities.length > 0 && (
        <section className="section alt" id="cities">
          <div className="wrap">
            <div className="section-head reveal"><div><div className="eyebrow">Cities</div><h2>Lawyers by city in {s.name}</h2></div></div>
            <div className="city-cards reveal">
              {cities.map((ct) => {
                const loc = cityLocal(ct.slug)
                return (
                  <Link key={ct.slug} href={`/${ct.slug}`} className="city-card">
                    <span className="city-card-name">{ct.name}</span>
                    {loc?.county && <span className="muted">{loc.county}</span>}
                    {loc?.population && <span className="muted">Pop. {loc.population.value.toLocaleString('en-US')} ({loc.population.year})</span>}
                    <span className="link-arrow">{ct.name} attorneys</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      <section className="section" id="issues">
        <div className="wrap">
          <div className="section-head reveal"><div><div className="eyebrow">By legal issue</div><h2>Find {s.name} lawyers by issue</h2></div></div>
          <ul className="link-columns c4 reveal">
            {top.map((p) => (
              <li key={p.slug}>{biggest ? <Link href={`/${biggest.slug}/${p.slug}`}>{biggest.name} {p.lawyerTitle.toLowerCase()}</Link> : <Link href={`/practice-area/${p.slug}`}>{p.lawyerTitle}</Link>}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section alt" id="lawyers">
        <div className="wrap">
          <DirectoryResults query={{ state: s.code, page }} heading={`Attorneys in ${s.name}`} basePath={`/state/${s.slug}`} />
        </div>
      </section>

      <section className="section" id="faq">
        <div className="wrap reveal" style={{ maxWidth: 900 }}>
          <div className="eyebrow">FAQ</div>
          <h2>Hiring a lawyer in {s.name}</h2>
          <Faqs faqs={faqs} />
          {answersForState(s.code).length > 0 && (
            <div id="answers" style={{ marginTop: 40 }}>
              <h3>Quick answers about {s.name} law</h3>
              <ul className="ans-more">
                {answersForState(s.code).map((x) => <li key={x.q.id}><Link href={`/answers/${x.q.slug(s)}`}>{x.q.ask(s)}</Link> <span className="muted">{x.a.short}</span></li>)}
              </ul>
            </div>
          )}
        </div>
      </section>
      <CtaBand title={`Need a lawyer in ${s.name}?`} />
    </>
  )
}
