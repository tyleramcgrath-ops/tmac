import type { Metadata } from 'next'
import Link from 'next/link'
import { RevealOnScroll } from '@/components/fx/Reveal'
import { TopicHero } from '@/components/TopicHero'
import { CtaBand } from '@/components/ui'
import { STATES } from '@/lib/geo'
import { QUESTIONS, answersForQuestion, answersForState } from '@/lib/law/answers'

export const metadata: Metadata = {
  title: 'State Law Answers: Yes-or-No Questions for Every State',
  description: 'Is your state a community property state? A no-fault state? Does it have an estate tax? Straight answers for all 50 states, each with the statute cited.',
  alternates: { canonical: '/answers' },
}

export default function AnswersHub() {
  const states = STATES.filter((s) => answersForState(s.code).length)
  return (
    <>
      <RevealOnScroll />
      <TopicHero
        crumbs={[{ name: 'Legal answers', path: '/answers' }]}
        eyebrow="Straight answers"
        title={<>The state-law questions people <em>search</em> most</>}
        lede="One question, one state, one direct answer, with the statute it comes from. Pick a question to see every state, or pick your state."
      />
      <section className="section">
        <div className="wrap">
          <div className="tool-grid reveal">
            {QUESTIONS.map((q) => (
              <Link key={q.id} href={`/answers/${q.national.slug}`} className="tool-tile">
                <span className="tool-tile-name">{q.national.h1}</span>
                <span className="tool-tile-blurb">{q.national.lede.split('. ')[0]}.</span>
                <span className="tool-tile-go">{answersForQuestion(q.id).length} states →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section alt">
        <div className="wrap">
          <div className="section-head reveal"><div><div className="eyebrow">By state</div><h2>Answers for your state</h2></div></div>
          <div className="state-pills reveal">
            {states.map((s) => <Link key={s.code} className="pill" href={`/state/${s.slug}#answers`}>{s.name}</Link>)}
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  )
}
