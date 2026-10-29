import type { ReactNode } from 'react'
import { Breadcrumbs, type Crumb } from '@/components/ui'

/** Bright two-column hero for practice-area, city and state pages. */
export function TopicHero({ crumbs, eyebrow, title, lede, children, aside }: {
  crumbs: Crumb[]; eyebrow?: string; title: ReactNode; lede?: ReactNode; children?: ReactNode; aside?: ReactNode
}) {
  return (
    <section className="topic-hero">
      <div className="wrap topic-hero-grid">
        <div className="rise">
          <Breadcrumbs crumbs={crumbs} light />
          {eyebrow && <div className="eyebrow" style={{ marginTop: 26 }}>{eyebrow}</div>}
          <h1>{title}</h1>
          {lede && <p className="lede">{lede}</p>}
          {children}
        </div>
        {aside && <aside className="topic-aside rise">{aside}</aside>}
      </div>
    </section>
  )
}
