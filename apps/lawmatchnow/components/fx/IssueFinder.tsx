'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'

export type Issue = { label: string; slug: string; name: string; title: string; short: string; steps: string[]; img: string }

/** "What happened?" picker: choose a situation, see the kind of lawyer and what to do next. */
export function IssueFinder({ issues }: { issues: Issue[] }) {
  const [sel, setSel] = useState(0)
  const [shown, setShown] = useState(0)
  const [out, setOut] = useState(false)
  const t = useRef(0)
  const pick = (i: number) => {
    if (i === sel) return
    setSel(i)
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(i); return }
    setOut(true)
    clearTimeout(t.current)
    t.current = window.setTimeout(() => { setShown(i); setOut(false) }, 380)
  }
  const it = issues[shown]
  return (
    <div className="pk-grid">
      <div className="pk-opts" role="tablist" aria-label="What happened?">
        {issues.map((x, i) => (
          <button key={x.label} type="button" role="tab" aria-selected={i === sel} className={`pk-opt${i === sel ? ' on' : ''}`} onClick={() => pick(i)}>
            <span className="pk-n">{String(i + 1).padStart(2, '0')}</span>
            <span className="pk-t">{x.label}</span>
            <span className="pk-ar" aria-hidden="true">→</span>
          </button>
        ))}
      </div>
      <div className={`pk-panel${out ? ' out' : ''}`} role="tabpanel">
        <div className="pk-ph pk-swap" style={{ backgroundImage: `url(${it.img})` }} />
        <div className="pk-body pk-swap">
          <div className="pk-k">You likely need</div>
          <h3>{it.title}</h3>
          <p>{it.short}</p>
          {it.steps.length > 0 && (
            <>
              <div className="pk-k" style={{ marginTop: 22 }}>Call a lawyer soon if</div>
              <ul>{it.steps.map((s) => <li key={s}>{s}</li>)}</ul>
            </>
          )}
          <div className="pk-actions">
            <Link className="btn btn-primary" href={`/get-started?practice=${it.slug}`}>Free case review →</Link>
            <Link className="btn btn-ghost" href={`/practice-area/${it.slug}`}>{it.name} lawyers</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
