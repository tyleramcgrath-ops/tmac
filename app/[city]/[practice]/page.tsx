import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DirectoryResults, pageParam } from '@/components/Directory'
import { CtaBand, Faqs, PageHero } from '@/components/ui'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { cityBySlug, stateByCode } from '@/lib/geo'
import { searchAttorneys } from '@/lib/directory'

type Props = { params: Promise<{ city: string; practice: string }>; searchParams: Promise<{ page?: string }> }
export const revalidate = 3600

function resolve(city: string, practice: string) {
  const c = cityBySlug(city)
  const p = PRACTICE_AREAS.find((x) => x.slug === practice)
  return c && p ? { c, p, st: stateByCode(c.state)! } : null
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { city, practice } = await params
  const r = resolve(city, practice)
  if (!r) return {}
  const { c, p, st } = r
  // A city page for an issue we have few listings for adds nothing to search
  // results, so it stays out of the index until the directory fills in.
  const { total } = await searchAttorneys({ city: c.name, state: c.state, practice: p.slug, perPage: 1 })
  const thin = total < 3 || pageParam((await searchParams).page) > 1
  return {
    title: `${c.name} ${p.lawyerTitle} | ${st.code}`,
    description: `Find ${p.lawyerTitle.toLowerCase()} in ${c.name}, ${st.name}. ${p.short}`,
    alternates: { canonical: `/${c.slug}/${p.slug}` },
    robots: thin ? { index: false, follow: true } : undefined,
  }
}

export default async function CityPractice({ params, searchParams }: Props) {
  const { city, practice } = await params
  const r = resolve(city, practice)
  if (!r) notFound()
  const { c, p, st } = r
  const page = pageParam((await searchParams).page)
  return (
    <>
      <PageHero crumbs={[{ name: st.name, path: `/state/${st.slug}` }, { name: c.name, path: `/${c.slug}` }, { name: p.name, path: `/${c.slug}/${p.slug}` }]}
        eyebrow={`${c.name}, ${st.code}`} title={`${c.name} ${p.lawyerTitle.toLowerCase()}`}
        lede={p.guide?.overview[0] ?? p.short} />
      <section className="section">
        <div className="wrap">
          <DirectoryResults query={{ city: c.name, state: c.state, practice: p.slug, page }} heading={`${p.lawyerTitle} in ${c.name}`}
            basePath={`/${c.slug}/${p.slug}`} practiceSlug={p.slug}
            emptyHint={<>Try <Link href={`/practice-area/${p.slug}`}>{p.lawyerTitle.toLowerCase()} nationwide</Link> or <Link href={`/${c.slug}`}>all {c.name} attorneys</Link>.</>}
            aside={p.guide && (
              <div className="card">
                <h3>Before you call</h3>
                <ul className="checklist" style={{ paddingLeft: 0, margin: 0, listStyle: 'none', fontSize: '0.93rem' }}>
                  {p.guide.questionsToAsk.slice(0, 4).map((q) => <li key={q} style={{ position: 'relative', paddingLeft: 26, marginBottom: 8 }}>{q}</li>)}
                </ul>
                <p style={{ marginTop: 10 }}><Link className="link-arrow" href={`/practice-area/${p.slug}`}>Full {p.name.toLowerCase()} guide</Link></p>
              </div>
            )} />
        </div>
      </section>
      {p.guide && (
        <section className="section alt">
          <div className="wrap" style={{ maxWidth: 900 }}>
            <div className="eyebrow">FAQ</div>
            <h2>{p.name} questions</h2>
            <p className="muted">General answers that apply across the U.S.; {st.name} rules may differ, so confirm with a local attorney.</p>
            <Faqs faqs={p.guide.faqs} schema={false} />
          </div>
        </section>
      )}
      <CtaBand practice={p.slug} title={`Need a ${p.name.toLowerCase()} lawyer in ${c.name}?`} />
    </>
  )
}
