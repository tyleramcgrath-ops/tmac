import type { Metadata } from 'next'
import Link from 'next/link'
import { RevealOnScroll } from '@/components/fx/Reveal'
import { Photo } from '@/components/Photo'
import { TopicHero } from '@/components/TopicHero'
import { CtaBand } from '@/components/ui'
import { GLOSSARY } from '@/lib/content/glossary'
import { GUIDES } from '@/lib/content/guides'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { QUESTIONS } from '@/lib/content/questions'
import { CATEGORY_PHOTO } from '@/lib/photos'

export const metadata: Metadata = {
  title: 'Legal Guides: Plain-English Answers to Legal Questions',
  description: 'Clear, carefully reviewed guides on hiring a lawyer, legal fees, your rights, and what to do after an accident or arrest.',
  alternates: { canonical: '/guides' },
}

const anchor = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')

export default function Guides() {
  const cats = [...new Set(GUIDES.map((g) => g.category))]
  const [lead, ...rest] = GUIDES
  const qCount = QUESTIONS.reduce((n, g) => n + g.items.length, 0)
  return (
    <>
      <RevealOnScroll />
      <TopicHero crumbs={[{ name: 'Legal Guides', path: '/guides' }]} eyebrow="The legal library" title={<>Know where you stand <em>before</em> you call.</>}
        lede="Plain-English guides, reviewed and dated. They explain how things usually work in the U.S.; a local attorney can tell you how they apply to you.">
        <div className="cat-chips">
          {cats.map((c) => <a key={c} href={`#${anchor(c)}`} className="pill">{c}</a>)}
          <a href="#by-practice" className="pill">By practice area</a>
        </div>
      </TopicHero>

      <section className="section">
        <div className="wrap">
          <Link href={`/guide/${lead.slug}`} className="gfeat reveal">
            <div className="gfeat-photo"><Photo name={CATEGORY_PHOTO[lead.category] ?? 'signing'} sizes="(min-width: 1000px) 55vw, 100vw" /></div>
            <div className="gfeat-body">
              <span className="kicker">Featured · {lead.category} · {lead.readMinutes} min read</span>
              <h2>{lead.title}</h2>
              <p>{lead.answer}</p>
              <span className="btn btn-primary">Read the guide →</span>
            </div>
          </Link>

          {cats.map((cat) => {
            const list = rest.filter((g) => g.category === cat)
            if (!list.length) return null
            return (
              <div key={cat} id={anchor(cat)} className="gcat reveal">
                <div className="h5-rule-lite"><span>{cat}</span><i /></div>
                <div className="grows">
                  {list.map((g, i) => (
                    <Link key={g.slug} href={`/guide/${g.slug}`} className="grow">
                      <span className="grow-n">{String(i + 1).padStart(2, '0')}</span>
                      <span className="grow-body"><span className="grow-t">{g.title}</span><span className="grow-d">{g.description}</span></span>
                      <span className="grow-m">{g.readMinutes} min →</span>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="section alt" id="by-practice">
        <div className="wrap">
          <div className="section-head reveal">
            <div><div className="eyebrow">By practice area</div><h2>Every area of law, <em>explained.</em></h2></div>
            <p>What each kind of lawyer does, what it costs, when to call and what to ask.</p>
          </div>
          <div className="pa-guides reveal">
            {PRACTICE_AREAS.filter((p) => p.guide).map((p) => (
              <Link key={p.slug} href={`/practice-area/${p.slug}`} className="pa-guide">
                <span className="pa-guide-t">{p.name}</span>
                <span className="pa-guide-d">{p.short}</span>
                <span className="pa-guide-go">Read →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap ref-cards reveal">
          <Link href="/questions" className="ref-card"><b>{qCount}</b><span>Common legal questions, answered in a few sentences each</span><i>Browse Q&amp;A →</i></Link>
          <Link href="/glossary" className="ref-card"><b>{GLOSSARY.length}</b><span>Legal terms in plain English, from affidavit to tort</span><i>Open the dictionary →</i></Link>
          <Link href="/emergency" className="ref-card"><b>Now</b><span>Arrested, injured or served papers? The first steps to take</span><i>Legal emergency help →</i></Link>
        </div>
      </section>
      <CtaBand />
    </>
  )
}
