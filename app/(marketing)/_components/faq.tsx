// Reusable FAQ block for the marketing pages: visible Q&A (real content —
// good for readers and classic SEO) plus matching FAQPage JSON-LD (good for
// AI search / LLM citation, which leans heavily on structured Q&A to ground
// answers). Every answer here must be something the product actually does —
// no marketing claims the app can't back up.

import { Reveal } from '../../rankforge/components/reveal'

export interface FaqItem {
  q: string
  a: string
}

export function Faq({ eyebrow = 'FAQ', title = 'Questions, answered', items }: { eyebrow?: string; title?: string; items: FaqItem[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <Reveal>
        <span className="rf-mono inline-block rounded-full border border-[var(--rf-card-line)] bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--rf-blue-bright)]">
          {eyebrow}
        </span>
      </Reveal>
      <Reveal delay={60}>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      </Reveal>
      <div className="mt-8 space-y-3">
        {items.map((item, i) => (
          <Reveal key={item.q} delay={i * 40}>
            <details className="rf-card group p-5 open:pb-5" open={i === 0}>
              <summary className="cursor-pointer list-none text-sm font-semibold text-white marker:content-none">
                <span className="flex items-center justify-between gap-4">
                  {item.q}
                  <span className="rf-mono shrink-0 text-[var(--rf-faint)] transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[var(--rf-muted)]">{item.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  )
}
