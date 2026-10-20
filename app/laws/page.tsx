import type { Metadata } from 'next'
import Link from 'next/link'
import { RevealOnScroll } from '@/components/fx/Reveal'
import { TopicHero } from '@/components/TopicHero'
import { CtaBand } from '@/components/ui'
import { STATES } from '@/lib/geo'
import { TOPICS, topicsFor } from '@/lib/law/topics'

export const metadata: Metadata = {
  title: 'State Laws: Plain-English Guides for All 50 States',
  description: 'Statutes of limitations, car accident, divorce, DUI, small claims, wills, employment and workers’ comp laws for every U.S. state, each with its statute cited.',
  alternates: { canonical: '/laws' },
}

export default function LawsHub() {
  const states = STATES.map((s) => ({ s, n: topicsFor(s.code).length })).filter((x) => x.n)
  return (
    <>
      <RevealOnScroll />
      <TopicHero
        crumbs={[{ name: 'State laws', path: '/laws' }]}
        eyebrow="State laws"
        title={<>Know the law <em>where you live</em></>}
        lede="The rules that matter most when you need a lawyer, for every state, in plain English. Every fact links to the statute it comes from."
      />
      <section className="section">
        <div className="wrap">
          <div className="section-head reveal"><div><div className="eyebrow">By topic</div><h2>Compare all 50 states</h2></div></div>
          <div className="issue-grid reveal">
            {TOPICS.map((t, i) => (
              <Link key={t.slug} href={`/laws/${t.slug}`} className="issue-tile">
                <span className="area-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="issue-name">{t.name}</span>
                <span className="issue-go">{t.name} by state →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section alt">
        <div className="wrap">
          <div className="section-head reveal"><div><div className="eyebrow">By state</div><h2>Your state's laws</h2></div></div>
          <ul className="link-columns c4 reveal">
            {states.map(({ s, n }) => <li key={s.code}><Link href={`/state/${s.slug}#laws`}>{s.name}</Link> <span className="muted">· {n} guides</span></li>)}
          </ul>
        </div>
      </section>
      <CtaBand />
    </>
  )
}
