import type { Metadata } from 'next'
import Link from 'next/link'
import { CtaBand, PageHero } from '@/components/ui'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import type { PracticeArea } from '@/lib/content/types'

export const metadata: Metadata = {
  title: 'Legal Practice Areas: Find the Right Type of Lawyer',
  description: `Browse ${PRACTICE_AREAS.length} areas of law, from personal injury and divorce to immigration and bankruptcy, and find attorneys who focus on your issue.`,
  alternates: { canonical: '/practice-areas' },
}

export default function PracticeAreas() {
  const groups = new Map<PracticeArea['group'], PracticeArea[]>()
  for (const p of PRACTICE_AREAS) groups.set(p.group, [...(groups.get(p.group) ?? []), p])
  return (
    <>
      <PageHero crumbs={[{ name: 'Practice Areas', path: '/practice-areas' }]} eyebrow="Areas of law"
        title={<>Every kind of legal problem, <em>organized</em>.</>}
        lede="Lawyers specialize, so the first step is naming your issue. Pick the area closest to your situation to see what these lawyers do, what they cost, and who practices near you." />
      <section className="section">
        <div className="wrap stack">
          {[...groups].map(([group, areas]) => (
            <div key={group} style={{ marginBottom: 44 }}>
              <div className="eyebrow">{group}</div>
              <div className="grid c3">
                {areas.map((p) => (
                  <Link key={p.slug} href={`/practice-area/${p.slug}`} className="card">
                    <h3>{p.name}</h3>
                    <p>{p.short}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      <CtaBand title="Not sure which area fits?" text="Describe what happened in your own words and we’ll point you to attorneys who handle it." />
    </>
  )
}
