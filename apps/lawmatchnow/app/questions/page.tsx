import type { Metadata } from 'next'
import Link from 'next/link'
import { CtaBand, Faqs, JsonLd, PageHero } from '@/components/ui'
import { QUESTIONS } from '@/lib/content/questions'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { faqLd } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Common Legal Questions, Answered',
  description: 'Straight answers to the legal questions people ask most, about hiring a lawyer, fees, injuries, arrests, divorce, immigration, work and wills.',
  alternates: { canonical: '/questions' },
}

const id = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')

export default function Questions() {
  return (
    <>
      <JsonLd data={faqLd(QUESTIONS.flatMap((g) => g.items))} />
      <PageHero crumbs={[{ name: 'Legal Questions', path: '/questions' }]} eyebrow="Legal Q&A" title={<>Questions people <em>actually</em> ask.</>}
        lede="Short, plain answers to common legal questions. They describe how things generally work in the U.S.; an attorney can tell you how they apply to you.">
        <div className="search-hints" style={{ marginTop: 24 }}>{QUESTIONS.map((g) => <a key={g.topic} href={`#${id(g.topic)}`}>{g.topic}</a>)}</div>
      </PageHero>
      <section className="section">
        <div className="wrap" style={{ maxWidth: 900 }}>
          {QUESTIONS.map((g) => {
            const p = PRACTICE_AREAS.find((x) => x.slug === g.practice)
            return (
              <div key={g.topic} id={id(g.topic)} style={{ marginBottom: 56, scrollMarginTop: 100 }}>
                <h2>{g.topic}</h2>
                <Faqs faqs={g.items} schema={false} />
                {p && <p style={{ marginTop: 16 }}><Link className="link-arrow" href={`/practice-area/${p.slug}`}>Find {p.lawyerTitle.toLowerCase()}</Link></p>}
              </div>
            )
          })}
        </div>
      </section>
      <CtaBand title="Have a question that isn’t here?" text="Describe your situation and we’ll help you reach an attorney who can answer it for your state." />
    </>
  )
}
