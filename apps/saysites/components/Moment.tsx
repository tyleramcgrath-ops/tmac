'use client'

import { useEffect, useRef, useState } from 'react'

// The SaySites "moment": when an owner does something that feels big, the two
// quote marks of our S logo swoop in and close around what they made, as if
// saying it out loud, then fold back together into the S. A second or two,
// once per milestone, never for everyday clicks.

export interface MomentSpec {
  // Big line: usually the business name or domain. Or a logo image instead.
  title?: string
  image?: string
  caption: string
}

const EVENT = 'saysites:moment'

export function celebrate(spec: MomentSpec) {
  window.dispatchEvent(new CustomEvent<MomentSpec>(EVENT, { detail: spec }))
}

// Quote halves of the logo, each in its own box (units of the 48-unit logo).
const OPEN = { vb: '11 3.6 16 23.4', w: 16, h: 23.4, d: 'M11.5 19C11.5 10.7 17.9 4.7 26.5 4.1v5.2c-5.2.5-9 4.1-9.6 9.7z', c: [19, 19] }
const CLOSE = { vb: '21 21 16 23.4', w: 16, h: 23.4, d: 'M36.5 29C36.5 37.3 30.1 43.3 21.5 43.9v-5.2c5.2-.5 9-4.1 9.6-9.7z', c: [29, 29] }

function Quote({ q, size }: { q: typeof OPEN; size: number }) {
  return (
    <svg width={(size * q.w) / q.h} height={size} viewBox={q.vb} aria-hidden="true">
      <circle cx={q.c[0]} cy={q.c[1]} r="7.5" fill="currentColor" />
      <path d={q.d} fill="currentColor" />
    </svg>
  )
}

export function MomentHost() {
  const [spec, setSpec] = useState<(MomentSpec & { key: number }) | null>(null)
  useEffect(() => {
    const on = (e: Event) => setSpec({ ...(e as CustomEvent<MomentSpec>).detail, key: Date.now() })
    window.addEventListener(EVENT, on)
    return () => window.removeEventListener(EVENT, on)
  }, [])
  if (!spec) return null
  return <MomentView key={spec.key} spec={spec} onDone={() => setSpec(null)} />
}

function MomentView({ spec, onDone }: { spec: MomentSpec; onDone: () => void }) {
  const body = useRef<HTMLDivElement>(null)
  const openRef = useRef<HTMLSpanElement>(null)
  const closeRef = useRef<HTMLSpanElement>(null)
  const [phase, setPhase] = useState<'in' | 'fold' | 'out'>('in')
  const [fold, setFold] = useState({ open: '', close: '' })

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Where the two halves must travel to re-form the S over the centre of
    // what was just made, measured once they've landed.
    const startFold = () => {
      const b = body.current?.getBoundingClientRect()
      const o = openRef.current?.getBoundingClientRect()
      const c = closeRef.current?.getBoundingClientRect()
      if (b && o && c) {
        const s = o.height / 23.4
        const cx = b.left + b.width / 2
        const cy = b.top + b.height / 2
        setFold({
          open: `translate(${cx - 13 * s - o.left}px, ${cy - 20.4 * s - o.top}px)`,
          close: `translate(${cx - 3 * s - c.left}px, ${cy - 3 * s - c.top}px)`,
        })
      }
      setPhase('fold')
    }
    const t1 = setTimeout(() => {
      // A tiny tap on phones, the moment the quotes close.
      try {
        navigator.vibrate?.(10)
      } catch {}
    }, 520)
    const t2 = setTimeout(startFold, reduce ? 1600 : 1900)
    const t3 = setTimeout(() => setPhase('out'), reduce ? 2000 : 2650)
    const t4 = setTimeout(onDone, reduce ? 2300 : 3150)
    return () => [t1, t2, t3, t4].forEach(clearTimeout)
  }, [onDone])

  const letters = spec.title ? [...spec.title] : []
  return (
    <div className={`moment is-${phase}`} role="status" aria-live="polite" onClick={onDone}>
      <div className="moment-stage">
        <span className="moment-ring" aria-hidden="true" />
        <div className="moment-line">
          <span className="moment-q moment-open" ref={openRef} style={phase !== 'in' ? { transform: fold.open } : undefined}>
            <Quote q={OPEN} size={64} />
          </span>
          <div className="moment-body" ref={body}>
            {spec.image ? (
              <img className="moment-image" src={spec.image} alt="" />
            ) : (
              <span className="moment-title" aria-label={spec.title}>
                {letters.map((ch, i) => (
                  <span key={i} style={{ animationDelay: `${120 + i * 24}ms` }} aria-hidden="true">
                    {ch === ' ' ? ' ' : ch}
                  </span>
                ))}
              </span>
            )}
          </div>
          <span className="moment-q moment-close" ref={closeRef} style={phase !== 'in' ? { transform: fold.close } : undefined}>
            <Quote q={CLOSE} size={64} />
          </span>
        </div>
        <p className="moment-caption">{spec.caption}</p>
      </div>
    </div>
  )
}
