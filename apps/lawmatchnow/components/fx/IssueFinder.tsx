'use client'

import Link from 'next/link'
import { useState } from 'react'

export type Issue = { label: string; icon: string; slug: string; name: string; title: string; short: string; steps: string[] }

/** "What happened?" picker: one tap shows the kind of lawyer you need and what to do next. */
export function IssueFinder({ issues }: { issues: Issue[] }) {
  const [sel, setSel] = useState(0)
  const it = issues[sel]
  return (
    <div className="finder">
      <div className="finder-chips" role="tablist" aria-label="What happened?">
        {issues.map((x, i) => (
          <button key={x.label} role="tab" aria-selected={i === sel} className={`chip${i === sel ? ' on' : ''}`} onClick={() => setSel(i)}>
            <span aria-hidden="true">{x.icon}</span> {x.label}
          </button>
        ))}
      </div>
      <div className="finder-panel" role="tabpanel" key={it.slug}>
        <div className="finder-kicker">You likely need</div>
        <h3>{it.title}</h3>
        <p className="finder-short">{it.short}</p>
        {it.steps.length > 0 && (
          <>
            <div className="finder-kicker" style={{ marginTop: 18 }}>Call a lawyer soon if</div>
            <ul className="checklist">{it.steps.map((s) => <li key={s}>{s}</li>)}</ul>
          </>
        )}
        <div className="finder-actions">
          <Link className="btn btn-primary" href={`/get-started?practice=${it.slug}`}>Free case review</Link>
          <Link className="btn btn-ghost" href={`/practice-area/${it.slug}`}>See {it.name.toLowerCase()} lawyers</Link>
        </div>
      </div>
    </div>
  )
}
