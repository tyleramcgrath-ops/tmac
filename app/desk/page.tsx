'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/* =====================================================================
   NORTH STAR HEADQUARTERS — THE BOARD ITSELF, ALIVE
   The page IS the vision-board render, with a living layer on top.

   The room's features:
   - THE CORE IS THE HEART — touch it and the room wakes: the halo
     widens, a pulse crosses the rings, the interface rises.
   - THE HORIZON IS THE COMMAND — three glass panels rise from the
     table: a briefing with its trend drawn in light, opportunities
     with their targets, and an approval you can actually grant — the
     grant sends the light back to the Core and the room reports the
     work done.
   - THE STARS ARE THE INTERFACE — invoke the third principle and the
     dome draws its constellation.
   - THE ROOM KEEPS TIME — the render regrades itself for dawn, day,
     dusk, and night (auto from your clock; override in the corner or
     via ?time=night). A station line narrates the room's state.
   - THE TELESCOPE WORKS — look through it and the horizon comes close.
   - Cinema mode (fullscreen), idle attractor pulse, ?awake=1 deep
     link, parallax, drift, grain, reduced-motion support throughout.
   ===================================================================== */

const PLATE = {
  coreX: 50.1,
  coreY: 54.2,
  coreD: 21.5,
}

const PANELS = {
  briefing: {
    eyebrow: 'Morning briefing',
    title: 'Your week, understood',
    body: 'Traffic is up 12%. Two pages gained ground overnight. Nothing needs you before coffee.',
  },
  opportunities: {
    eyebrow: 'Opportunities',
    title: 'Three quick wins in reach',
    body: 'Three page-two keywords sit within striking distance. The Core has drafted the moves.',
  },
  approvals: {
    eyebrow: 'Approvals',
    title: 'One fix awaits your word',
    body: 'A prepared correction rests on the table. Approve it, and the work is done for you.',
  },
} as const

// the briefing's trend, drawn in light (a fortnight of sessions)
const TREND = [22, 24, 23, 26, 25, 28, 27, 30, 29, 33, 34, 38, 37, 41]
const TREND_PATH = TREND.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * (120 / (TREND.length - 1))).toFixed(1)} ${(34 - (v - 20) * 1.35).toFixed(1)}`).join(' ')

const TARGETS = [
  { q: 'pricing questions', from: 11, to: 6 },
  { q: 'how it works', from: 13, to: 7 },
  { q: 'best near me', from: 12, to: 8 },
]

type FocusKey = 'heart' | 'command' | 'interface' | null
type TimeMode = 'dawn' | 'day' | 'dusk' | 'night'
type ApproveState = 'idle' | 'working' | 'done'

const TIME_WORD: Record<TimeMode, string> = { dawn: 'Dawn', day: 'Day', dusk: 'Dusk', night: 'Night' }

export default function BoardHero() {
  const rootRef = useRef<HTMLDivElement>(null)
  const raf = useRef(0)
  const lastTouch = useRef(Date.now())
  const [awake, setAwake] = useState(false)
  const [touched, setTouched] = useState(false)
  const [focus, setFocus] = useState<FocusKey>(null)
  const [clock, setClock] = useState<string | null>(null)
  const [timeMode, setTimeMode] = useState<TimeMode>('dusk')
  const [lens, setLens] = useState(false)
  const [cinema, setCinema] = useState(false)
  const [approve, setApprove] = useState<ApproveState>('idle')
  const [pulseKey, setPulseKey] = useState(0)

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  // the dome keeps the time — client-only, so hydration always matches
  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    tick()
    const t = setInterval(tick, 30_000)
    return () => clearInterval(t)
  }, [])

  // the room reads your hour (and honors ?time= and ?awake=1 deep links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('time') as TimeMode | null
    if (t && ['dawn', 'day', 'dusk', 'night'].includes(t)) {
      setTimeMode(t)
    } else {
      const h = new Date().getHours()
      setTimeMode(h < 5 ? 'night' : h < 9 ? 'dawn' : h < 17 ? 'day' : h < 21 ? 'dusk' : 'night')
    }
    if (params.get('awake') === '1') {
      setAwake(true)
      setTouched(true)
    }
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

  // the approval resets when the interface goes back to rest
  useEffect(() => {
    if (!awake) setApprove('idle')
  }, [awake])

  // left alone, the Core quietly asks for attention
  useEffect(() => {
    const t = setInterval(() => {
      if (!awake && Date.now() - lastTouch.current > 25_000) {
        setPulseKey((k) => k + 1)
        lastTouch.current = Date.now()
      }
    }, 5_000)
    return () => clearInterval(t)
  }, [awake])

  // cinema mode follows the real fullscreen state
  useEffect(() => {
    const onFs = () => setCinema(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const onPointerMove = (e: React.PointerEvent) => {
    lastTouch.current = Date.now()
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

  const wake = useCallback(() => {
    lastTouch.current = Date.now()
    setTouched(true)
    setPulseKey((k) => k + 1)
    setAwake((v) => !v)
  }, [])

  const grantApproval = () => {
    if (approve !== 'idle') return
    setApprove('working')
    setPulseKey((k) => k + 1)
    window.setTimeout(() => setApprove('done'), 1400)
  }

  const toggleCinema = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen?.()
  }

  const statusLine =
    approve === 'done' && awake
      ? 'The work is done · Verified'
      : awake
        ? `${TIME_WORD[timeMode]} · The room is listening`
        : `${TIME_WORD[timeMode]} · Clear · The room is calm`

  return (
    <main
      ref={rootRef}
      className="hz-plate-root"
      data-awake={awake || undefined}
      data-focus={focus ?? undefined}
      data-time={timeMode}
      data-lens={lens || undefined}
      onPointerMove={onPointerMove}
    >
      {/* the render, full bleed — the room is the image */}
      <div className="hz-plate-drift">
        <div className="hz-plate" aria-label="North Star Headquarters — the command table at dusk" role="img" />
        {/* the hour, laid over the render as light */}
        <div className="hz-tint dawn" aria-hidden="true" />
        <div className="hz-tint day" aria-hidden="true" />
        <div className="hz-tint night" aria-hidden="true" />
      </div>

      {/* quiets the sheet label baked into the render's top-left corner */}
      <div className="hz-plate-patch" aria-hidden="true" />

      {/* the station line */}
      <div className="hz-status">
        <span className="hz-status-time">{clock ?? '––:––'}</span>
        <span className="hz-status-line">{statusLine}</span>
      </div>

      {/* the hour control + cinema, quiet in the opposite corner */}
      <div className="hz-controls">
        <div className="hz-timectl" role="group" aria-label="Set the room's hour">
          {(['dawn', 'day', 'dusk', 'night'] as const).map((t) => (
            <button key={t} type="button" aria-pressed={timeMode === t} onClick={() => setTimeMode(t)}>
              {TIME_WORD[t]}
            </button>
          ))}
        </div>
        <button type="button" className="hz-cinema" onClick={toggleCinema} aria-pressed={cinema}>
          {cinema ? 'Exit cinema' : 'Cinema'}
        </button>
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
        {pulseKey > 0 && <span key={pulseKey} className="hz-pulse" aria-hidden="true" />}
      </button>

      {/* THE TELESCOPE — look through it and the horizon comes close */}
      <button
        type="button"
        className="hz-scope-spot"
        onMouseEnter={() => setLens(true)}
        onMouseLeave={() => setLens(false)}
        onFocus={() => setLens(true)}
        onBlur={() => setLens(false)}
        onClick={() => setLens((v) => !v)}
        aria-pressed={lens}
        aria-label="Look through the telescope"
      />
      <div className="hz-lens" aria-hidden="true">
        <div className="hz-lens-view" />
        <i className="hz-lens-h" />
        <i className="hz-lens-v" />
      </div>

      {/* the horizon answers when THE COMMAND is invoked */}
      <div className="hz-horizonline" aria-hidden="true" />

      {/* the dome answers when THE INTERFACE is invoked — and draws itself */}
      <div className="hz-domespark" aria-hidden="true">
        <i /><i /><i /><i /><i />
      </div>
      <svg className="hz-domedraw" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polyline points="12,42 34,16 55,55 74,25 90,48" />
      </svg>

      {/* THE INTERFACE — intelligence rising from the table */}
      <section className={`hz-panels${awake ? ' up' : ''}`} aria-hidden={!awake} aria-label="Today's intelligence">
        <article className="hz-panel">
          <p className="hz-panel-eyebrow">{PANELS.briefing.eyebrow}</p>
          <h2>{PANELS.briefing.title}</h2>
          <svg className="hz-spark" viewBox="0 0 120 36" aria-hidden="true">
            <defs>
              <linearGradient id="hz-spark-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="rgba(240,200,120,0.35)" />
                <stop offset="1" stopColor="rgba(240,200,120,0)" />
              </linearGradient>
            </defs>
            <path d={`${TREND_PATH} L 120 36 L 0 36 Z`} fill="url(#hz-spark-fill)" stroke="none" />
            <path d={TREND_PATH} fill="none" stroke="#ecc276" strokeWidth="1.4" />
            <circle cx="120" cy={34 - (TREND[TREND.length - 1] - 20) * 1.35} r="2.2" fill="#ffe2a4" />
          </svg>
          <p className="hz-panel-body">{PANELS.briefing.body}</p>
        </article>

        <article className="hz-panel">
          <p className="hz-panel-eyebrow">{PANELS.opportunities.eyebrow}</p>
          <h2>{PANELS.opportunities.title}</h2>
          <ul className="hz-chips">
            {TARGETS.map((t) => (
              <li key={t.q}>
                <span>{t.q}</span>
                <b>#{t.from} → #{t.to}</b>
              </li>
            ))}
          </ul>
          <p className="hz-panel-body">{PANELS.opportunities.body}</p>
        </article>

        <article className="hz-panel">
          <p className="hz-panel-eyebrow">{PANELS.approvals.eyebrow}</p>
          <h2>{approve === 'done' ? 'Done. Verified by read-back.' : PANELS.approvals.title}</h2>
          <p className="hz-panel-body">
            {approve === 'done'
              ? 'The correction is live. The Core confirmed the change on the page itself.'
              : PANELS.approvals.body}
          </p>
          <button
            type="button"
            className="hz-approve"
            data-state={approve}
            onClick={grantApproval}
            disabled={approve !== 'idle'}
          >
            {approve === 'idle' ? 'Approve the fix' : approve === 'working' ? 'Deploying…' : 'Verified ✓'}
          </button>
        </article>
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
