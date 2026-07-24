'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { initCompass, type CompassApi, type CompassState, type TimeMode } from './compass'
import { AuthProvider, useAuth } from '../lib/auth-context'
import { useDeskContext } from './_lib/use-desk-context'
import PanelHost from './panels/PanelHost'

/* =====================================================================
   NORTH STAR HEADQUARTERS
   A fixed architectural plate + a live 3D brass compass (Three.js) that
   is North Star's operating heart, with coordinated room lighting and UI.
   Cinematic arrival: the room sleeps, then wakes on the first touch.
   ===================================================================== */

const TIME_WORD: Record<TimeMode, string> = { dawn: 'Dawn', day: 'Day', dusk: 'Dusk', night: 'Night' }
const STATE_LABEL: Partial<Record<CompassState, string>> = {
  idle: '', hover: '', listening: 'Listening…',
  thinking: 'Analyzing patterns & market signals…', planning: 'Drafting the plan…',
  executing: 'Executing optimizations…', deploying: 'Deploying across your ecosystem…',
  verifying: 'Verifying by read-back…', success: 'Mission accomplished',
  warning: 'Attention needed', error: 'Action paused — review required', offline: 'Systems offline',
}
const TIMES: TimeMode[] = ['dawn', 'day', 'dusk', 'night']
const DEV_STATES: CompassState[] = ['idle', 'hover', 'listening', 'thinking', 'planning', 'executing', 'deploying', 'verifying', 'success', 'warning', 'error', 'offline']

type Phase = 'asleep' | 'waking' | 'awake'

function greeting(name: string) {
  const h = new Date().getHours()
  return h < 5 ? `Still here, ${name}` : h < 12 ? `Good morning, ${name}` : h < 17 ? `Good afternoon, ${name}` : `Good evening, ${name}`
}

export default function NorthStar() {
  return (
    <AuthProvider>
      <DeskGate>
        <DeskRoom />
      </DeskGate>
    </AuthProvider>
  )
}

// Gate: resolves the session before the Three.js scene ever mounts. Redirects
// unauthenticated visitors to /login?next=/desk. While loading, holds the same
// dark tone as the room itself (`.ns-gate`) rather than a mismatched spinner.
function DeskGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/desk')
  }, [loading, user, router])
  if (loading || !user) return <div className="ns-gate" aria-hidden />
  return <>{children}</>
}

function DeskRoom() {
  const { user } = useAuth()
  const { projectId, loading: projectsLoading } = useDeskContext(true)

  const roomRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hitRef = useRef<HTMLButtonElement>(null)
  const api = useRef<CompassApi | null>(null)
  const wakeTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  const [timeMode, setTimeMode] = useState<TimeMode>('night')
  const [compassState, setCompassState] = useState<CompassState>('asleep')
  const [awake, setAwake] = useState(false)
  const [panelsUp, setPanelsUp] = useState(false)
  const [cinema, setCinema] = useState(false)
  const [dev, setDev] = useState(false)
  const [clock, setClock] = useState<string | null>(null)
  const [phase, setPhaseState] = useState<Phase>('asleep')
  const [quick, setQuickState] = useState(false)
  const [aware, setAware] = useState(false)
  const [welcomeText, setWelcomeText] = useState('')
  const [welcomeShow, setWelcomeShow] = useState(false)

  // refs mirror state for the once-attached document listeners (avoid stale closures)
  const phaseRef = useRef<Phase>('asleep')
  const quickRef = useRef(false)
  const panelsUpRef = useRef(false)
  const awakeRef = useRef(false)
  const compassStateRef = useRef<CompassState>('asleep')
  const userNameRef = useRef('there')
  useEffect(() => {
    userNameRef.current = user?.name || 'there'
  }, [user])
  useEffect(() => {
    compassStateRef.current = compassState
  }, [compassState])
  const setPhase = (p: Phase) => { phaseRef.current = p; setPhaseState(p) }

  const WT = (ms: number, fn: () => void) => { wakeTimers.current.push(setTimeout(fn, ms)) }
  const clearWT = () => { wakeTimers.current.forEach(clearTimeout); wakeTimers.current = [] }
  const persist = (t: TimeMode) => {
    try {
      const saved = JSON.parse(localStorage.getItem('ns-hq') || '{}')
      localStorage.setItem('ns-hq', JSON.stringify({ ...saved, visited: true, timeMode: t }))
    } catch {}
  }

  const C = (s: CompassState) => { setCompassState(s); api.current?.setState(s) }

  const setTime = (t: TimeMode) => { setTimeMode(t); api.current?.setTime(t); persist(t) }

  const finishWake = () => { awakeRef.current = true; setAwake(true) }

  const callPanels = (v: boolean) => {
    panelsUpRef.current = v; setPanelsUp(v)
  }

  const showWelcome = () => {
    setWelcomeText(greeting(userNameRef.current)); setWelcomeShow(true)
    WT(3800, () => setWelcomeShow(false))
  }

  // one restrained brass-like swell on wake (after the click gesture)
  const wakeSwell = () => {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return
      const ac = new AC()
      const now = ac.currentTime
      const g = ac.createGain()
      g.gain.setValueAtTime(0.0001, now)
      g.gain.linearRampToValueAtTime(quickRef.current ? 0.03 : 0.05, now + 0.7)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 2.8)
      g.connect(ac.destination)
      ;[110, 164.8, 220].forEach((f, i) => {
        const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f
        const og = ac.createGain(); og.gain.value = i === 0 ? 1 : 0.35
        o.connect(og); og.connect(g); o.start(now); o.stop(now + 2.9)
      })
    } catch {}
  }

  const runWake = () => {
    if (phaseRef.current !== 'asleep') return
    setPhase('waking')
    const q = quickRef.current
    C('awakening'); api.current?.dolly('in')
    wakeSwell()
    const tSettle = q ? 1300 : 3700, tPanels = q ? 1500 : 4300, tWelcome = q ? 1650 : 4700, tDone = q ? 2200 : 5800
    WT(tSettle, () => C('idle'))
    WT(tPanels, finishWake)
    WT(tWelcome, showWelcome)
    WT(tDone, () => { setPhase('awake'); persist(timeModeRef.current) })
  }

  const skipWake = () => {
    if (phaseRef.current !== 'waking') return
    clearWT(); setPhase('awake')
    C('idle'); finishWake(); showWelcome(); persist(timeModeRef.current)
  }

  // keep a ref of the current time so persist() from timers has the live value
  const timeModeRef = useRef<TimeMode>('night')
  useEffect(() => { timeModeRef.current = timeMode }, [timeMode])

  // boot the 3D compass, then restore last state and go to sleep
  useEffect(() => {
    if (!canvasRef.current) return
    const c = initCompass(canvasRef.current)
    api.current = c
    let t: TimeMode = 'night', v = false
    try {
      const saved = JSON.parse(localStorage.getItem('ns-hq') || '{}')
      if (saved.visited) v = true
      if (saved.timeMode && TIME_WORD[saved.timeMode as TimeMode]) t = saved.timeMode
    } catch {}
    quickRef.current = v; setQuickState(v)
    setTimeMode(t); timeModeRef.current = t; c.setTime(t)
    // asleep: nothing asks for attention but the star
    setPhase('asleep'); setCompassState('asleep')
    c.setState('asleep'); c.dolly('back')
    return () => c.dispose()
  }, [])

  // clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    tick()
    const t = setInterval(tick, 30_000)
    return () => clearInterval(t)
  }, [])

  // dev panel: press D to toggle, ?dev=1 to force
  useEffect(() => {
    if (/[?&]dev=1/.test(window.location.search)) setDev(true)
  }, [])
  useEffect(() => {
    if (dev) document.documentElement.setAttribute('data-dev', '')
    else document.documentElement.removeAttribute('data-dev')
  }, [dev])

  // subtle pointer parallax — the room becomes aware while it sleeps
  useEffect(() => {
    let raf = 0
    const onMove = (e: PointerEvent) => {
      if (phaseRef.current === 'asleep') setAware(true)
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

  // single click authority (avoids a compass click both waking and skipping):
  // dark room -> wake; during the wake -> skip; awake + on the compass -> call/dismiss
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (phaseRef.current === 'asleep') { runWake(); return }
      if (phaseRef.current === 'waking') { skipWake(); return }
      if (e.target === hitRef.current) {
        callPanels(!panelsUpRef.current); C('listening'); WT(1500, () => C('idle'))
      }
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Esc dismisses the briefing once it's been called
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phaseRef.current === 'awake' && panelsUpRef.current) callPanels(false)
      if (e.key === 'd' || e.key === 'D') setDev((d) => !d)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => () => { clearWT() }, [])

  // Ambient signal from real agent-roster deltas (see _lib/agent-signal.ts).
  // Only applies while the compass is otherwise idle/hover — never stomps on
  // the user-triggered approve flow's own executing/deploying/verifying
  // sequence, which owns C() directly and authoritatively.
  const onAgentSignal = useCallback((s: CompassState | null) => {
    if (!s) return
    if (phaseRef.current !== 'awake') return
    if (compassStateRef.current !== 'idle' && compassStateRef.current !== 'hover') return
    C(s)
    window.setTimeout(() => {
      if (compassStateRef.current === s) C('idle')
    }, 4000)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // principles: heart/command call the briefing; interface shows the thinking arc
  const onPrinciple = (k: 'heart' | 'command' | 'interface') => {
    if (phaseRef.current !== 'awake') return
    if (k !== 'interface') { callPanels(!panelsUpRef.current); api.current?.flare() }
    else {
      C('thinking')
      window.setTimeout(() => C('planning'), 1600)
      window.setTimeout(() => C('verifying'), 3400)
      window.setTimeout(() => C('idle'), 5200)
    }
  }

  // ambient dust motes — nearest, most-parallax depth layer
  useEffect(() => {
    const c = document.getElementById('ns-particles') as HTMLCanvasElement | null
    if (!c) return
    const g = c.getContext('2d')!
    const P = Array.from({ length: 28 }, () => ({
      x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.7,
      r: 0.5 + Math.random() * 1.3, s: (Math.random() - 0.5) * 0.00005,
    }))
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
        g.fillStyle = `rgba(255,224,170,${0.05 + 0.11 * p.z})`; g.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size) }
  }, [])

  const statusLine =
    compassState === 'idle' || compassState === 'hover' || compassState === 'asleep' || compassState === 'awakening'
      ? `${TIME_WORD[timeMode]}${awake ? ' · The room is listening' : ' · Clear · The room is calm'}`
      : STATE_LABEL[compassState] || `${TIME_WORD[timeMode]} · The room is listening`

  return (
    <>
      <main
        ref={roomRef}
        className="ns-room"
        data-time={timeMode}
        data-phase={phase === 'asleep' ? 'asleep' : 'awake'}
        data-quick={quick ? '' : undefined}
        data-aware={aware ? '' : undefined}
        data-cinema={cinema ? '' : undefined}
      >
        <div className="ns-plate-layer"><div className="ns-plate" role="img" aria-label="North Star Headquarters" /></div>
        <div className="ns-sky" aria-hidden />
        <div className="ns-ambient" aria-hidden />
        <div className="ns-ceilglow" aria-hidden />
        <div className="ns-platglow" aria-hidden />
        <div className="ns-roomlift" aria-hidden />
        <div className="ns-vignette" aria-hidden />
        <svg className="ns-dither" aria-hidden>
          <filter id="ns-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#ns-noise)" />
        </svg>

        <div className="ns-offline" aria-hidden />
        <div className="ns-sleep" aria-hidden />
        <div className="ns-contact" aria-hidden />
        <div className="ns-beam" aria-hidden />
        <canvas ref={canvasRef} className="ns-compass" aria-hidden />
        <div className="ns-bloom" aria-hidden />
        <button
          ref={hitRef}
          type="button"
          className="ns-core-hit"
          aria-label="Touch the compass to wake the room"
          aria-expanded={panelsUp}
          onMouseEnter={() => { if (phaseRef.current === 'awake') api.current?.hover(true) }}
          onMouseLeave={() => { if (phaseRef.current === 'awake') api.current?.hover(false) }}
        />

        <div className="ns-fore" aria-hidden />
        <canvas id="ns-particles" className="ns-particles" aria-hidden />

        <div className="ns-status">
          <span className="ns-status-time">{clock ?? '--:--'}</span>
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

        <section className={`ns-panels${panelsUp ? ' up' : ''}`} aria-hidden={!panelsUp} aria-label="Today's intelligence">
          <PanelHost
            projectId={projectId}
            projectsResolved={!projectsLoading}
            panelsUp={panelsUp}
            onCompassState={C}
            onAgentSignal={onAgentSignal}
          />
        </section>

        <p className="ns-hint" data-hidden="" aria-hidden>Touch the compass</p>
        <p className={`ns-welcome${welcomeShow ? ' show' : ''}`} aria-hidden>{welcomeText}</p>

        <nav className="ns-principles" aria-label="The three principles">
          <button type="button" onClick={() => onPrinciple('heart')}>The core is the <b>heart</b>.</button>
          <button type="button" onClick={() => onPrinciple('command')}>The horizon is the <b>command</b>.</button>
          <button type="button" onClick={() => onPrinciple('interface')}>The stars are the <b>interface</b>.</button>
        </nav>
      </main>

      <div className="ns-dev" aria-hidden={!dev}>
        <b>compass state · press D to hide</b>
        {DEV_STATES.map((s) => (
          <button key={s} data-s={s} onClick={() => C(s)}>{s}</button>
        ))}
      </div>
    </>
  )
}
