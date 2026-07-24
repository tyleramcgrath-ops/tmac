'use client'

import { useEffect, useRef, useState } from 'react'
import { initCompass, type CompassApi, type CompassState, type TimeMode } from './compass'

/* =====================================================================
   NORTH STAR HEADQUARTERS
   A fixed architectural plate + a live 3D brass compass (Three.js) that
   is North Star's operating heart, with coordinated room lighting and UI.
   ===================================================================== */

const TREND = [22, 24, 23, 26, 25, 28, 27, 30, 29, 33, 34, 38, 37, 41]
const PTS = TREND.map((v, i) => [(i * 120 / (TREND.length - 1)).toFixed(1), (34 - (v - 20) * 1.35).toFixed(1)] as const)
const SPARK_D = PTS.map((p, i) => `${i ? 'L ' : 'M '}${p[0]} ${p[1]}`).join(' ')

const TIME_WORD: Record<TimeMode, string> = { dawn: 'Dawn', day: 'Day', dusk: 'Dusk', night: 'Night' }
const STATE_LABEL: Record<CompassState, string> = {
  idle: '', hover: '', listening: 'Listening…',
  thinking: 'Analyzing patterns & market signals…', planning: 'Drafting the plan…',
  executing: 'Executing optimizations…', deploying: 'Deploying across your ecosystem…',
  verifying: 'Verifying by read-back…', success: 'Mission accomplished',
  warning: 'Attention needed', error: 'Action paused — review required', offline: 'Systems offline',
}
const TIMES: TimeMode[] = ['dawn', 'day', 'dusk', 'night']
const DEV_STATES: CompassState[] = ['idle', 'hover', 'listening', 'thinking', 'planning', 'executing', 'deploying', 'verifying', 'success', 'warning', 'error', 'offline']

type ApproveState = 'idle' | 'working' | 'done'

export default function NorthStar() {
  const roomRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const api = useRef<CompassApi | null>(null)
  const rafRef = useRef(0)
  const lastTouch = useRef(Date.now())
  const progTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const [timeMode, setTimeMode] = useState<TimeMode>('night')
  const [compassState, setCompassState] = useState<CompassState>('idle')
  const [awake, setAwake] = useState(false)
  const [approve, setApprove] = useState<ApproveState>('idle')
  const [cinema, setCinema] = useState(false)
  const [dev, setDev] = useState(false)
  const [clock, setClock] = useState<string | null>(null)
  const [progOn, setProgOn] = useState(false)
  const [progPct, setProgPct] = useState(0)
  const [progTask, setProgTask] = useState('Deploying')

  // boot the 3D compass
  useEffect(() => {
    if (!canvasRef.current) return
    const c = initCompass(canvasRef.current)
    api.current = c
    c.setTime('night')
    c.setState('idle')
    return () => c.dispose()
  }, [])

  // clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    tick()
    const t = setInterval(tick, 30_000)
    return () => clearInterval(t)
  }, [])

  // dev panel attribute (press D)
  useEffect(() => {
    if (dev) document.documentElement.setAttribute('data-dev', '')
    else document.documentElement.removeAttribute('data-dev')
  }, [dev])
  useEffect(() => {
    if (/[?&]dev=1/.test(window.location.search)) setDev(true)
  }, [])

  // subtle pointer parallax
  useEffect(() => {
    let raf = 0
    const onMove = (e: PointerEvent) => {
      lastTouch.current = Date.now()
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = roomRef.current
        if (!el) return
        el.style.setProperty('--mx', ((e.clientX / window.innerWidth - 0.5) * 2).toFixed(3))
        el.style.setProperty('--my', ((e.clientY / window.innerHeight - 0.5) * 2).toFixed(3))
      })
    }
    window.addEventListener('pointermove', onMove)
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf) }
  }, [])

  // keyboard: Esc rests the room, D toggles the dev panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && awake) wake(false)
      if (e.key === 'd' || e.key === 'D') setDev((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [awake])

  // idle attractor
  useEffect(() => {
    const t = setInterval(() => {
      if (!awake && Date.now() - lastTouch.current > 24_000) { api.current?.flare(); lastTouch.current = Date.now() }
    }, 5_000)
    return () => clearInterval(t)
  }, [awake])

  useEffect(() => () => { if (progTimer.current) clearInterval(progTimer.current); cancelAnimationFrame(rafRef.current) }, [])

  const C = (s: CompassState) => { setCompassState(s); api.current?.setState(s) }

  const setTime = (t: TimeMode) => { setTimeMode(t); api.current?.setTime(t) }

  const wake = (v: boolean) => {
    lastTouch.current = Date.now()
    setAwake(v)
    if (v) C('listening')
    else { setApprove('idle'); C('idle') }
  }

  const runApprove = () => {
    if (approve !== 'idle') return
    setApprove('working'); setProgOn(true); setProgTask('Deploying'); setProgPct(0)
    C('executing')
    window.setTimeout(() => {
      C('deploying')
      const start = Date.now(), dur = 2400
      if (progTimer.current) clearInterval(progTimer.current)
      progTimer.current = setInterval(() => {
        const p = Math.min(100, (Date.now() - start) / dur * 100)
        setProgPct(p)
        if (p >= 100) {
          if (progTimer.current) clearInterval(progTimer.current)
          C('verifying'); setProgTask('Verifying')
          window.setTimeout(() => {
            setApprove('done'); C('success')
            window.setTimeout(() => { setProgOn(false); C(awake ? 'listening' : 'idle') }, 2600)
          }, 1000)
        }
      }, 60)
    }, 700)
  }

  const runInterface = () => {
    C('thinking')
    window.setTimeout(() => C('planning'), 1600)
    window.setTimeout(() => C('verifying'), 3400)
    window.setTimeout(() => C(awake ? 'listening' : 'idle'), 5200)
  }

  // ambient dust motes — nearest, most-parallax depth layer
  useEffect(() => {
    const c = document.getElementById('ns-particles') as HTMLCanvasElement | null
    if (!c) return
    const g = c.getContext('2d')!
    const P = Array.from({ length: 46 }, () => ({ x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.7, r: 0.5 + Math.random() * 1.4, s: (Math.random() - 0.5) * 0.00006 }))
    const size = () => { c.width = window.innerWidth; c.height = window.innerHeight }
    size(); window.addEventListener('resize', size)
    let raf = 0
    const draw = () => {
      g.clearRect(0, 0, c.width, c.height)
      const el = roomRef.current
      const mx = parseFloat(el?.style.getPropertyValue('--mx') || '0') || 0
      const my = parseFloat(el?.style.getPropertyValue('--my') || '0') || 0
      for (const p of P) {
        p.y += p.s; if (p.y < -0.02) p.y = 1.02; if (p.y > 1.02) p.y = -0.02
        const x = (p.x + mx * 0.02 * p.z) * c.width, y = (p.y + my * 0.02 * p.z) * c.height
        g.beginPath(); g.arc(x, y, p.r * p.z, 0, 7)
        g.fillStyle = `rgba(255,224,170,${0.1 + 0.16 * p.z})`; g.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size) }
  }, [])

  const statusLine =
    compassState === 'idle' || compassState === 'hover'
      ? `${TIME_WORD[timeMode]}${awake ? ' · The room is listening' : ' · Clear · The room is calm'}`
      : STATE_LABEL[compassState] || `${TIME_WORD[timeMode]} · The room is listening`

  return (
    <>
      <main
        ref={roomRef}
        className="ns-room"
        data-time={timeMode}
        data-cinema={cinema ? '' : undefined}
      >
        <div className="ns-plate-layer"><div className="ns-plate" role="img" aria-label="North Star Headquarters" /></div>
        <div className="ns-sky" aria-hidden />
        <div className="ns-ambient" aria-hidden />
        <div className="ns-ceilglow" aria-hidden />
        <div className="ns-platglow" aria-hidden />
        <div className="ns-roomlift" aria-hidden />
        <div className="ns-offline" aria-hidden />
        <div className="ns-vignette" aria-hidden />

        <div className="ns-contact" aria-hidden />
        <div className="ns-beam" aria-hidden />
        <canvas ref={canvasRef} className="ns-compass" aria-hidden />
        <div className="ns-bloom" aria-hidden />
        <button
          type="button"
          className="ns-core-hit"
          aria-label="Touch the compass to wake the room"
          aria-expanded={awake}
          onClick={() => wake(!awake)}
          onMouseEnter={() => api.current?.hover(true)}
          onMouseLeave={() => api.current?.hover(false)}
          onFocus={() => api.current?.hover(true)}
          onBlur={() => api.current?.hover(false)}
        />

        <div className="ns-fore" aria-hidden />
        <canvas id="ns-particles" className="ns-particles" aria-hidden />

        <div className="ns-status">
          <span className="ns-status-time">{clock ?? '––:––'}</span>
          <span className="ns-status-line"><span className="ns-status-dot" aria-hidden />{statusLine}</span>
        </div>

        <header className="ns-brand">
          <h1>North Star</h1><p>Headquarters</p>
        </header>

        <div className="ns-controls">
          <div className="ns-timectl" role="group" aria-label="Set the room's hour">
            {TIMES.map((t) => (
              <button key={t} type="button" data-t={t} aria-pressed={timeMode === t} onClick={() => setTime(t)}>{TIME_WORD[t]}</button>
            ))}
          </div>
          <button type="button" className="ns-cinema" aria-pressed={cinema} onClick={() => setCinema((v) => !v)}>
            {cinema ? 'Exit cinema' : 'Cinema'}
          </button>
        </div>

        <section className={`ns-panels${awake ? ' up' : ''}`} aria-hidden={!awake} aria-label="Today's intelligence">
          <article className="ns-panel" style={{ transitionDelay: '0ms' }}>
            <p className="ns-panel-eyebrow">Morning briefing</p><h2>Your week, understood.</h2>
            <svg className="ns-spark" viewBox="0 0 120 36" aria-hidden>
              <defs>
                <linearGradient id="ns-spark-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="rgba(240,200,120,0.35)" /><stop offset="1" stopColor="rgba(240,200,120,0)" />
                </linearGradient>
              </defs>
              <path d={`${SPARK_D} L 120 36 L 0 36 Z`} fill="url(#ns-spark-fill)" stroke="none" />
              <path d={SPARK_D} fill="none" stroke="#ecc276" strokeWidth="1.4" />
              <circle cx="120" cy={PTS[PTS.length - 1][1]} r="2.2" fill="#ffe2a4" />
            </svg>
            <p className="ns-panel-body">Traffic is up 12%. Two pages gained ground overnight. Nothing needs you before coffee.</p>
          </article>
          <article className="ns-panel" style={{ transitionDelay: '130ms' }}>
            <p className="ns-panel-eyebrow">Opportunities</p><h2>Three quick wins in reach.</h2>
            <ul className="ns-chips">
              <li><span>pricing questions</span><b>#11 → #6</b></li>
              <li><span>how it works</span><b>#13 → #7</b></li>
              <li><span>best near me</span><b>#12 → #8</b></li>
            </ul>
            <p className="ns-panel-body">Three page-two keywords sit within striking distance. The Core has drafted the moves.</p>
          </article>
          <article className="ns-panel" style={{ transitionDelay: '260ms' }}>
            <p className="ns-panel-eyebrow">Approvals</p>
            <h2>{approve === 'done' ? 'Done. Verified by read-back.' : 'One fix awaits your word.'}</h2>
            <p className="ns-panel-body">
              {approve === 'done'
                ? 'The correction is live. The Core confirmed the change on the page itself.'
                : 'A prepared correction rests on the table. Approve it, and the work is done for you.'}
            </p>
            <button type="button" className="ns-approve" data-state={approve} disabled={approve !== 'idle'} onClick={runApprove}>
              {approve === 'idle' ? 'Approve the fix' : approve === 'working' ? 'Deploying…' : 'Verified ✓'}
            </button>
            <div className={`ns-progress${progOn ? ' on' : ''}`}><div className="ns-progress-bar" style={{ width: `${progPct}%` }} /></div>
            <div className={`ns-progress-row${progOn ? ' on' : ''}`}><span>{progTask}</span><b>{Math.round(progPct)}%</b></div>
          </article>
        </section>

        <p className="ns-hint" data-hidden={awake ? '' : undefined} aria-hidden>Touch the compass</p>

        <nav className="ns-principles" aria-label="The three principles">
          <button type="button" onClick={() => wake(!awake)}>The core is the <b>heart</b>.</button>
          <button type="button" onClick={() => wake(!awake)}>The horizon is the <b>command</b>.</button>
          <button type="button" onClick={runInterface}>The stars are the <b>interface</b>.</button>
        </nav>
      </main>

      <div className="ns-dev" aria-hidden={!dev}>
        <b>compass state · press D to hide</b>
        {DEV_STATES.map((s) => (
          <button key={s} onClick={() => C(s)}>{s}</button>
        ))}
      </div>
    </>
  )
}
