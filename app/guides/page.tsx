import type { Metadata } from 'next'
import Link from 'next/link'
import { CtaBand, PageHero } from '@/components/ui'
import { GUIDES } from '@/lib/content/guides'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'

export const metadata: Metadata = {
  title: 'Legal Guides: Plain-English Answers to Legal Questions',
  description: 'Clear, carefully reviewed guides on hiring a lawyer, legal fees, your rights, and what to do after an accident or arrest.',
  alternates: { canonical: '/guides' },
}

export default function Guides() {
  const cats = [...new Set(GUIDES.map((g) => g.category))]
  return (
    <>
      <PageHero crumbs={[{ name: 'Legal Guides', path: '/guides' }]} eyebrow="Learn about the law" title={<>Know where you stand <em>before</em> you call.</>}
        lede="Practical guides written in plain English. They explain how things usually work in the U.S.; a local attorney can tell you how they apply to you." />
      <section className="section">
        <div className="wrap">
          {cats.map((cat) => (
            <div key={cat} style={{ marginBottom: 48 }}>
              <div className="eyebrow">{cat}</div>
              <div className="grid c3">
                {GUIDES.filter((g) => g.category === cat).map((g) => (
                  <Link key={g.slug} href={`/guide/${g.slug}`} className="card">
                    <h3>{g.title}</h3>
                    <p>{g.description}</p>
                    <p style={{ marginTop: 12, fontSize: '0.82rem' }}>{g.readMinutes} min read</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div className="eyebrow">Guides by practice area</div>
          <div className="grid c3">
            {PRACTICE_AREAS.filter((p) => p.guide).map((p) => (
              <Link key={p.slug} href={`/practice-area/${p.slug}`} className="card">
                <h3>{p.name} law, explained</h3>
                <p>{p.short}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  )
}
