import Link from 'next/link'
import { ArrowRight, Check, Minus, Search, X } from 'lucide-react'
import { SCAN, type Comparison, type Row } from '../_lib/competitors'

// Comparison-page building blocks. These are server components on purpose —
// the pages are static, so nothing here needs to ship JavaScript.

/* ---------------------------------------------------------------------
   The side-by-side.
   A real <table> underneath, because that is what the content is and it
   is what assistive tech and crawlers understand. Everything visual is
   the design system; below 720px each row becomes its own card so the
   columns never squeeze.
   ------------------------------------------------------------------ */
export function ComparisonMatrix({ rival }: { rival: Comparison }) {
  return (
    <div className="ctc-matrix-wrap">
      <table className="ctc-matrix">
        <caption className="ctc-sr">
          {SCAN.name} compared with {rival.name} across pricing, free options, speed, method and
          ease of use
        </caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="ctc-sr">Dimension</span>
            </th>
            <th scope="col">
              <span className="ctc-matrix-brand">
                <span className="ctc-matrix-dot" aria-hidden="true" />
                {SCAN.name}
              </span>
            </th>
            <th scope="col">
              <span className="ctc-matrix-brand ctc-matrix-brand-rival">{rival.name}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rival.rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <MatrixCell value={row.ours} won={row.edge === 'ours'} even={row.edge === 'even'} side="ours" label={SCAN.name} />
              <MatrixCell value={row.theirs} won={row.edge === 'theirs'} even={row.edge === 'even'} side="theirs" label={rival.name} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MatrixCell({
  value,
  won,
  even,
  side,
  label,
}: {
  value: string
  won: boolean
  even: boolean
  side: 'ours' | 'theirs'
  label: string
}) {
  return (
    <td className={`ctc-matrix-cell ${won ? 'ctc-matrix-cell-win' : ''} ${side === 'ours' ? 'ctc-matrix-cell-ours' : ''}`}>
      {/* Repeats the column name on mobile, where the header row is hidden. */}
      <span className="ctc-matrix-key" aria-hidden="true">
        {label}
      </span>
      <span className="ctc-matrix-mark" aria-hidden="true">
        {even ? <Minus size={13} /> : won ? <Check size={13} /> : <X size={13} />}
      </span>
      <span className="ctc-matrix-value">{value}</span>
      {won ? <span className="ctc-sr">Advantage: {label}</span> : null}
    </td>
  )
}

/* ---------------------------------------------------------------------
   Pros and cons, both sides, same weight.
   ------------------------------------------------------------------ */
export function ProsCons({ rival }: { rival: Comparison }) {
  return (
    <div className="ctc-proscons">
      <ProsConsCard title={SCAN.name} accent pros={SCAN.pros} cons={SCAN.cons} />
      <ProsConsCard title={rival.name} pros={rival.theirPros} cons={rival.theirCons} />
    </div>
  )
}

function ProsConsCard({
  title,
  pros,
  cons,
  accent = false,
}: {
  title: string
  pros: string[]
  cons: string[]
  accent?: boolean
}) {
  return (
    <div className={`ctc-card ctc-proscons-card ${accent ? 'ctc-proscons-card-accent' : ''}`}>
      <h3 className="ctc-h3" style={{ fontSize: 'var(--t-lg)' }}>
        {title}
      </h3>
      <div className="ctc-proscons-list">
        <span className="ctc-eyebrow" style={{ color: 'var(--win)' }}>
          Strengths
        </span>
        <ul>
          {pros.map((item) => (
            <li key={item}>
              <Check size={14} aria-hidden="true" style={{ color: 'var(--win)' }} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="ctc-proscons-list">
        <span className="ctc-eyebrow" style={{ color: 'var(--miss)' }}>
          Limitations
        </span>
        <ul>
          {cons.map((item) => (
            <li key={item}>
              <X size={14} aria-hidden="true" style={{ color: 'var(--miss)' }} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------
   FAQ — plain <details> so it works without JavaScript and stays
   crawlable. The matching FAQPage JSON-LD is emitted by the page.
   ------------------------------------------------------------------ */
export function FaqList({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <div className="ctc-stack" style={{ maxWidth: '62ch' }}>
      {faqs.map((faq) => (
        <details key={faq.q} className="ctc-faq">
          <summary>
            <span>{faq.q}</span>
            <span className="ctc-faq-mark" aria-hidden="true" />
          </summary>
          <p className="ctc-muted" style={{ fontSize: 'var(--t-sm)', lineHeight: 1.65 }}>
            {faq.a}
          </p>
        </details>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------------
   Verdict and CTA
   ------------------------------------------------------------------ */
export function Verdict({ rival }: { rival: Comparison }) {
  return (
    <div className="ctc-verdict">
      <span className="ctc-eyebrow ctc-eyebrow-ember">The verdict</span>
      <p className="ctc-verdict-text">{rival.verdict}</p>
      <div className="ctc-choose">
        <div className="ctc-choose-col">
          <span className="ctc-eyebrow">Choose {SCAN.name} when</span>
          <p>{rival.chooseUs}</p>
        </div>
        <div className="ctc-choose-col">
          <span className="ctc-eyebrow">Choose {rival.name} when</span>
          <p>{rival.chooseThem}</p>
        </div>
      </div>
    </div>
  )
}

export function CompareCta({ rivalName }: { rivalName?: string }) {
  return (
    <section className="ctc-compare-cta ctc-grain" aria-labelledby="cta-title">
      <div style={{ position: 'relative', zIndex: 1 }}>
        <span className="ctc-eyebrow ctc-eyebrow-ember">Free · no account</span>
        <h2 id="cta-title" className="ctc-h2" style={{ fontSize: 'var(--t-2xl)', maxWidth: '20ch' }}>
          {rivalName ? `See it for yourself before you pay for ${rivalName}.` : 'See where you stand in AI answers.'}
        </h2>
        <p className="ctc-lead" style={{ maxWidth: '48ch', marginTop: 'var(--s-3)' }}>
          Run a live scan on your brand. Six buyer questions, real answers, and a prioritised plan
          — in about a minute.
        </p>
        <div className="ctc-row ctc-g3 ctc-wrapflex" style={{ marginTop: 'var(--s-5)' }}>
          <Link href="/contact/app" className="ctc-btn ctc-btn-ember ctc-btn-lg">
            <Search size={16} aria-hidden="true" /> Run a free scan
          </Link>
          <Link href="/contact/signup" className="ctc-btn ctc-btn-quiet ctc-btn-lg">
            Create an account
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------------
   Cross-links — every comparison page points at the others, so the hub
   is not the only route between them.
   ------------------------------------------------------------------ */
export function MoreComparisons({ items, title }: { items: Comparison[]; title: string }) {
  return (
    <section aria-labelledby="more-title">
      <h2 id="more-title" className="ctc-h3" style={{ marginBottom: 'var(--s-4)' }}>
        {title}
      </h2>
      <ul className="ctc-morelist">
        {items.map((item) => (
          <li key={item.slug}>
            <Link href={`/contact/compare/${item.slug}`} className="ctc-morelink">
              <span className="ctc-stack" style={{ gap: 2, minWidth: 0 }}>
                <span className="ctc-morelink-title">
                  {SCAN.name} vs {item.name}
                </span>
                <span className="ctc-faint ctc-truncate" style={{ fontSize: 'var(--t-xs)' }}>
                  {item.category}
                </span>
              </span>
              <ArrowRight size={15} aria-hidden="true" className="ctc-probe-chevron" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Shared row type re-export so pages can annotate without a deep import. */
export type { Row }
