import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DirectoryResults, pageParam } from '@/components/Directory'
import { RevealOnScroll } from '@/components/fx/Reveal'
import { SectionNav } from '@/components/fx/SectionNav'
import { UsMap } from '@/components/fx/UsMap'
import { TopicHero } from '@/components/TopicHero'
import { CtaBand, Faqs, SearchBar } from '@/components/ui'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { CITIES, cityBySlug, citiesInState, stateByCode } from '@/lib/geo'

type Props = { params: Promise<{ city: string }>; searchParams: Promise<{ page?: string }> }
export const revalidate = 3600
export const dynamicParams = false
export const generateStaticParams = () => CITIES.map((c) => ({ city: c.slug }))

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const c = cityBySlug((await params).city)
  if (!c) return {}
  return {
    title: `${c.name}, ${c.state} Lawyers: Find a Local Attorney`,
    description: `Find attorneys in ${c.name}, ${stateByCode(c.state)?.name} by practice area. Compare local lawyers and request a free case review.`,
    alternates: { canonical: `/${c.slug}` },
    robots: pageParam((await searchParams).page) > 1 ? { index: false, follow: true } : undefined,
  }
}

export default async function CityPage({ params, searchParams }: Props) {
  const c = cityBySlug((await params).city)
  if (!c) notFound()
  const st = stateByCode(c.state)!
  const page = pageParam((await searchParams).page)
  const nearby = citiesInState(c.state).filter((x) => x.slug !== c.slug)
  const main = PRACTICE_AREAS.filter((p) => p.guide)
  const more = PRACTICE_AREAS.filter((p) => !p.guide)
  const faqs = [
    { q: `How do I find a good lawyer in ${c.name}?`, a: `Start with the kind of problem you have, since lawyers specialize. Choose a practice area above to see ${c.name} attorneys who handle it, compare their focus and experience, and talk with two or three before you decide.` },
    { q: `Does my lawyer need to be licensed in ${st.name}?`, a: `To advise you on ${st.name} law or represent you in ${st.name} state courts, a lawyer generally needs to be licensed by the ${st.name} bar. Federal matters such as immigration can work differently, so ask about licensing at your first consultation.` },
    { q: `How much does a lawyer cost in ${c.name}?`, a: 'It depends on the type of case and the lawyer. Injury lawyers often work on contingency, while family, business and criminal lawyers usually charge hourly or a flat fee. Ask for the fee arrangement in writing before you hire anyone.' },
    { q: 'Is the case review really free?', a: `Yes. Tell us what happened and where, and we'll help you reach attorneys who handle cases like yours in and around ${c.name}. There's no cost and no obligation to hire anyone.` },
  ]
  return (
    <>
      <RevealOnScroll />
      <TopicHero
        crumbs={[{ name: st.name, path: `/state/${st.slug}` }, { name: c.name, path: `/${c.slug}` }]}
        eyebrow={`${c.name}, ${st.name}`}
        title={<>Lawyers in {c.name}</>}
        lede={`Find ${c.name} attorneys by legal issue. Local lawyers know ${st.name} law and the courts where your case will be heard.`}
        aside={
          <div className="map-mini">
            <UsMap highlight={c.slug} />
            <div className="map-mini-foot"><span><b>{c.name}</b>, {st.name}</span><Link className="link-arrow" href={`/state/${st.slug}`}>All of {st.name}</Link></div>
          </div>
        }
      >
        <SearchBar location={`${c.name}, ${c.state}`} />
      </TopicHero>
      <SectionNav items={[{ id: 'issues', label: 'By legal issue' }, { id: 'lawyers', label: `${c.name} attorneys` }, ...(nearby.length ? [{ id: 'nearby', label: `Elsewhere in ${st.code}` }] : []), { id: 'faq', label: 'FAQ' }]} />

      <section className="section" id="issues">
        <div className="wrap">
          <div className="section-head reveal">
            <div><div className="eyebrow">By legal issue</div><h2>What do you need help with in {c.name}?</h2></div>
            <p>Pick your issue to see {c.name} attorneys who focus on it, plus what it costs and what to ask.</p>
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
          <Faqs faqs={faqs} schema={false} />
        </div>
      </section>
      <CtaBand title={`Need a lawyer in ${c.name}?`} />
    </>
  )
}
