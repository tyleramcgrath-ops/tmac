'use client'

import { useEffect, useRef, useState } from 'react'

/* =====================================================================
   NORTH STAR HEADQUARTERS — THE BOARD ITSELF, ALIVE
   The page IS the vision-board render: the image sits full-bleed as the
   room plate, and living light rides on top of it — the Core's
   armillary rings turning in true 3D over the render's compass, its
   halo breathing, film grain unifying the frame.

   Features on the room:
   - THE CORE IS THE HEART — touch it and the room wakes: the star
     flares, a pulse crosses the rings, and the interface rises.
   - THE HORIZON IS THE COMMAND — three glass panels rise from the
     table with the day's intelligence (the board's motion study:
     idle → wake → rise → interface → return). Esc or a second touch
     returns the room to rest.
   - THE STARS ARE THE INTERFACE — the three principles at the foot of
     the frame each light their own element as you pass over them.
   - The dome keeps the time: a quiet station line where the sheet
     label used to be. Cinematic drift, parallax, grain throughout.
   ===================================================================== */

/** Where the render's compass sits on the plate, in % of the frame,
 *  and how large the live armillary is, in vh. */
const PLATE = {
  coreX: 50.1,
  coreY: 54.2,
  coreD: 21.5,
}

const PANELS = [
  {
    key: 'briefing',
    eyebrow: 'Morning briefing',
    title: 'Your week, understood',
    body: 'Traffic is up 12%. Two pages gained ground overnight. Nothing needs you before coffee.',
  },
  {
    key: 'opportunities',
    eyebrow: 'Opportunities',
    title: 'Three quick wins in reach',
    body: 'Three page-two keywords sit within striking distance. The Core has drafted the moves.',
  },
  {
    key: 'approvals',
    eyebrow: 'Approvals',
    title: 'One fix awaits your word',
    body: 'A prepared correction rests on the table. Approve it, and the work is done for you.',
  },
] as const

type FocusKey = 'heart' | 'command' | 'interface' | null

export default function BoardHero() {
  const rootRef = useRef<HTMLDivElement>(null)
  const raf = useRef(0)
  const [awake, setAwake] = useState(false)
  const [touched, setTouched] = useState(false)
  const [focus, setFocus] = useState<FocusKey>(null)
  const [clock, setClock] = useState<string | null>(null)

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  // the dome keeps the time — client-only, so hydration always matches
  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    tick()
    const t = setInterval(tick, 30_000)
    return () => clearInterval(t)
  }, [])

  // Esc returns the room to rest
  useEffect(() => {
    if (!awake) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAwake(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [awake])

  // a whisper of parallax: the plate holds still, the light leans with you
  const onPointerMove = (e: React.PointerEvent) => {
    const el = rootRef.current
    if (!el) return
    const mx = (e.clientX / window.innerWidth - 0.5) * 2
    const my = (e.clientY / window.innerHeight - 0.5) * 2
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty('--mx', mx.toFixed(3))
      el.style.setProperty('--my', my.toFixed(3))
    })
  }

  const wake = () => {
    setTouched(true)
    setAwake((v) => !v)
  }

  return (
    <main
      ref={rootRef}
      className="hz-plate-root"
      data-awake={awake || undefined}
      data-focus={focus ?? undefined}
      onPointerMove={onPointerMove}
    >
      {/* the render, full bleed — the room is the image */}
      <div className="hz-plate-drift">
        <div className="hz-plate" aria-label="North Star Headquarters — the command table at dusk" role="img" />
      </div>

      {/* quiets the sheet label baked into the render's top-left corner */}
      <div className="hz-plate-patch" aria-hidden="true" />

      {/* the station line where the label used to be */}
      <div className="hz-status">
        <span className="hz-status-time">{clock ?? '––:––'}</span>
        <span className="hz-status-line">Dusk · Clear · The room is calm</span>
      </div>

      {/* the dome carries the name, set live so it stays razor sharp */}
      <header className="hz-brand">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <path d="M50 4 L55.5 44.5 L96 50 L55.5 55.5 L50 96 L44.5 55.5 L4 50 L44.5 44.5 Z" fill="#e8c988" />
          <circle cx="50" cy="50" r="3.4" fill="#fff6dd" />
        </svg>
        <h1>North Star</h1>
        <p>Headquarters</p>
      </header>

      {/* THE CORE — touch it and the room wakes */}
      <button
        type="button"
        className="hz-live"
        style={{
          left: `${PLATE.coreX}%`,
          top: `${PLATE.coreY}%`,
          width: `${PLATE.coreD}vh`,
        }}
        onClick={wake}
        aria-expanded={awake}
        aria-label={awake ? 'Return the room to rest' : 'Touch the Core to wake the room'}
      >
        <span className="hz-live-halo" aria-hidden="true" />
        <span className="hz-live-scene" aria-hidden="true">
          <span className="hz-live-gimbal">
            <span className="hz-lring outer" />
            <span className="hz-live-sphere">
              <span className="hz-lring m1" />
              <span className="hz-lring m2" />
              <span className="hz-lring eq" />
              <span className="hz-lring t1" />
            </span>
          </span>
        </span>
        <span className="hz-live-flare" aria-hidden="true" />
        {awake && <span key="pulse" className="hz-pulse" aria-hidden="true" />}
      </button>

      {/* the horizon answers when THE COMMAND is invoked */}
      <div className="hz-horizonline" aria-hidden="true" />
      {/* the dome answers when THE INTERFACE is invoked */}
      <div className="hz-domespark" aria-hidden="true">
        <i /><i /><i /><i /><i />
      </div>

      {/* THE INTERFACE — intelligence rising from the table */}
      <section className={`hz-panels${awake ? ' up' : ''}`} aria-hidden={!awake} aria-label="Today's intelligence">
        {PANELS.map((p, i) => (
          <article key={p.key} className="hz-panel" style={{ transitionDelay: awake ? `${i * 130}ms` : `${(2 - i) * 80}ms` }}>
            <p className="hz-panel-eyebrow">{p.eyebrow}</p>
            <h2>{p.title}</h2>
            <p className="hz-panel-body">{p.body}</p>
          </article>
        ))}
      </section>

      {/* the invitation, until the first touch */}
      <p className="hz-hint" data-hidden={touched || undefined} aria-hidden="true">
        Touch the core
      </p>

      {/* the three principles — each lights its element as you pass */}
      <nav className="hz-principles" aria-label="The three principles">
        <button
          type="button"
          onMouseEnter={() => setFocus('heart')}
          onMouseLeave={() => setFocus(null)}
          onFocus={() => setFocus('heart')}
          onBlur={() => setFocus(null)}
          onClick={wake}
        >
          The core is the <b>heart</b>.
        </button>
        <button
          type="button"
          onMouseEnter={() => setFocus('command')}
          onMouseLeave={() => setFocus(null)}
          onFocus={() => setFocus('command')}
          onBlur={() => setFocus(null)}
          onClick={wake}
        >
          The horizon is the <b>command</b>.
        </button>
        <button
          type="button"
          onMouseEnter={() => setFocus('interface')}
          onMouseLeave={() => setFocus(null)}
          onFocus={() => setFocus('interface')}
          onBlur={() => setFocus(null)}
        >
          The stars are the <b>interface</b>.
        </button>
      </nav>

      {/* the room breathes: slow warmth over the whole frame */}
      <div className="hz-plate-breathe" aria-hidden="true" />

      {/* film grain, so plate and light read as one exposure */}
      <svg className="hz-plate-grain" aria-hidden="true">
        <filter id="hz-grain-f">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#hz-grain-f)" />
      </svg>
    </main>
  )
}
