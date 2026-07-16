'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent, WheelEvent } from 'react'
import type { PreviewScenario, RunOutcome } from '@/lib/north-star-preview-data'
import { buildInvestigationSteps, revealKindFor, type RevealKind } from '@/lib/north-star-investigation'
import type { CompassContext } from '@/lib/north-star-compass'
import RoomFilters from './RoomFilters'
import ExteriorView from './ExteriorView'
import { environmentVars, lightingVars, seasonVars, useEnvironment } from './EnvironmentEngine'
import { resolveMaster, DEFAULT_LOCATION } from './locations'
import type { PlateLight } from './plateLighting'
import { CompassConsole } from './CompassConsole'
import { CommandWing, type WingDestination } from './CommandWing'
import { CCDigitalDnaOverlay } from './CCDigitalDnaOverlay'
import { MorningBriefingOverlay } from './MorningBriefingOverlay'
import { CCOpportunityWorkspace } from '../CCOpportunityWorkspace'
import { CCApprovalCenter } from '../CCApprovalCenter'
import { CCCompassPanel } from '../CCCompassPanel'
import { CCWorkInProgressOverlay, CCResultsOverlay, CCSourcesOverlay, CCEmptyOverlay } from '../CCSecondaryOverlays'

type Overlay =
  | 'briefing' | 'opportunity' | 'opportunity-empty' | 'approval' | 'approval-empty'
  | 'compass' | 'work-in-progress' | 'results' | 'sources' | 'digital-dna' | null
type InvPhase = 'idle' | 'stepping' | 'settling'

/* =====================================================================
   North Star — Executive Office
   This restores the confirmed original room (north-star-station @ 546fb87):
   a photographic executive office — desk, window onto the world, and
   Compass emerging in engraved light from the desk itself — with exactly
   one substitution: the Business Twin destination now holds the Living
   Digital DNA sculpture. Decisions (the approval folder) and Intelligence
   (the activity wall) are reached from the same left wing, as destinations,
   not objects stacked into the first viewport. Room/desk/Compass code and
   composition are ported as closely to that baseline as this preview's
   mock-data architecture allows; only terminology and content-wiring changed.
   ===================================================================== */

/** Investigation step id -> the Digital DNA area it's actually examining, so the
 *  sculpture activates only where the check is genuinely looking — no fake movement. */
const STEP_TO_DNA: Record<string, string | null> = {
  connect: 'website', found: 'website', identity: 'identity', contact: 'conversion',
  compare: null, mismatch: 'reputation', ruledout: 'reputation', stoodout: null,
  noresponse: 'website', retry: 'website', stillfailed: 'website',
  notenough: 'website', duplicate: null,
}

/** Stage 1: every step is Scout gathering evidence from a nameable source in
 *  the outside world — the origin is visually meaningful, never generic. */
const STEP_TO_SOURCE: Record<string, string> = {
  connect: 'Website', found: 'Website', identity: 'Website', contact: 'Website',
  compare: 'Google', mismatch: 'Google Business Profile', ruledout: 'Reviews', stoodout: 'Reviews',
  noresponse: 'Website', retry: 'Website', stillfailed: 'Website', notenough: 'Website', duplicate: 'Website',
}

/** Stage 4: Compass speaks from understanding, generated from real preview
 *  state of the Digital DNA and the check — never from search. */
function compassReactionFor(kind: RevealKind, scenario: PreviewScenario): string {
  const understood = scenario.digitalDna.filter((a) => a.understanding === 'well-understood').length
  const gaps = scenario.digitalDna.filter((a) => a.understanding === 'needs-verification' || a.understanding === 'not-connected')
  if (kind === 'approval') return "I found something and connected two patterns. I've prepared the correction on your desk for review."
  if (kind === 'opportunity') return `I found something. Your understanding grew — ${understood} of ${scenario.digitalDna.length} areas are now clear.`
  if (kind === 'failed') return "I couldn't reach your site this time, so I've held off. I'll try again automatically."
  if (gaps.length) return `Nothing needed your attention. I still need more evidence on ${gaps[0].label} before I'd recommend anything.`
  return 'Nothing rose to your attention. Your business looks stable today.'
}

export function ExecutiveOffice({ scenario }: { scenario: PreviewScenario }) {
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [compassContext, setCompassContext] = useState<CompassContext>('command-center')
  const [investigating, setInvestigating] = useState(false)
  const [invPhase, setInvPhase] = useState<InvPhase>('idle')
  const [stepIndex, setStepIndex] = useState(1)
  const [lastReveal, setLastReveal] = useState<RevealKind | null>(null)
  const [compassReaction, setCompassReaction] = useState<string | null>(null)
  const [briefPulse, setBriefPulse] = useState(false)      // Stage 5
  const [approvalArrived, setApprovalArrived] = useState(false) // Stage 6
  const [isDimmed, setIsDimmed] = useState(false)
  const [discovering, setDiscovering] = useState(false) // Compass briefly flares when it has something new
  const stepsRef = useRef(buildInvestigationSteps(scenario, scenario.defaultRunOutcome))

  // --- the room itself: environment, world light, and camera parallax,
  // ported from the confirmed baseline (north-star-station @ 546fb87) ---
  const sceneRef = useRef<HTMLDivElement>(null)
  const frame = useRef(0)
  const camera = useRef({ x: 0, y: 0 })
  const dragFrom = useRef<{ x: number; y: number } | null>(null)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const environment = useEnvironment()
  const [plateLight, setPlateLight] = useState<PlateLight | null>(null)
  const condition = resolveMaster(environment.time)
  const handleLight = useCallback((light: PlateLight) => setPlateLight(light), [])

  const handlePointer = (event: PointerEvent<HTMLElement>) => {
    const el = sceneRef.current
    if (!el) return
    if (dragFrom.current) {
      camera.current.x += event.clientX - dragFrom.current.x
      camera.current.y += event.clientY - dragFrom.current.y
      dragFrom.current = { x: event.clientX, y: event.clientY }
      applyCamera()
    }
    const rect = el.getBoundingClientRect()
    const px = ((event.clientX - rect.left) / rect.width - 0.5) * 2
    const py = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    // nearness to Compass at the room's center — its warmth answers presence
    const approach = Math.max(0, 1 - Math.hypot(px, py * 1.35))
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty('--px', px.toFixed(3))
      el.style.setProperty('--py', py.toFixed(3))
      el.style.setProperty('--approach', approach.toFixed(3))
    })
  }

  useEffect(() => () => cancelAnimationFrame(frame.current), [])
  useEffect(() => () => clearTimeout(settleTimer.current), [])

  // Look around the office: drag or scroll peeks the camera across the room;
  // let go and the view glides home. The stage overflows the viewport, so
  // there is genuinely more room to see.
  const applyCamera = () => {
    const el = sceneRef.current
    if (!el) return
    const vw = el.clientWidth
    const vh = el.clientHeight
    const stageW = Math.max(vw * 1.03, vh * 1.545)
    const stageH = stageW / 1.5
    const slackX = Math.max(0, (stageW - vw) / 2) + vw * 0.02
    const slackY = Math.max(0, (stageH - vh) / 2) + vh * 0.02
    camera.current.x = Math.max(-slackX, Math.min(slackX, camera.current.x))
    camera.current.y = Math.max(-slackY, Math.min(slackY, camera.current.y))
    el.style.setProperty('--cam-x', `${camera.current.x.toFixed(1)}px`)
    el.style.setProperty('--cam-y', `${camera.current.y.toFixed(1)}px`)
  }

  const settleCamera = (delay: number) => {
    clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      camera.current = { x: 0, y: 0 }
      const el = sceneRef.current
      if (el) {
        el.style.setProperty('--cam-x', '0px')
        el.style.setProperty('--cam-y', '0px')
      }
    }, delay)
  }

  const handleWheel = (event: WheelEvent<HTMLElement>) => {
    camera.current.x -= event.deltaX * 0.6
    camera.current.y -= event.deltaY * 0.6
    applyCamera()
    settleCamera(900)
  }

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    if (target.closest('button, input, form, a')) return
    dragFrom.current = { x: event.clientX, y: event.clientY }
    clearTimeout(settleTimer.current)
  }

  const handlePointerUp = () => {
    dragFrom.current = null
    settleCamera(450)
  }

  // Reset the chain's downstream state whenever the previewed scenario changes.
  useEffect(() => {
    setOverlay(null); setInvestigating(false); setInvPhase('idle')
    setLastReveal(null); setCompassReaction(null); setBriefPulse(false); setApprovalArrived(false)
  }, [scenario])

  const outcome: RunOutcome = scenario.defaultRunOutcome

  useEffect(() => {
    if (invPhase !== 'stepping') return
    const steps = stepsRef.current
    if (stepIndex >= steps.length) {
      const t = window.setTimeout(() => setInvPhase('settling'), 450)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => setStepIndex((n) => n + 1), steps[stepIndex - 1].durationMs)
    return () => window.clearTimeout(t)
  }, [stepIndex, invPhase])

  useEffect(() => {
    if (invPhase !== 'settling') return
    const t = window.setTimeout(() => {
      const kind = revealKindFor(scenario, outcome)
      setInvestigating(false)
      setInvPhase('idle')
      setLastReveal(kind)
      setCompassReaction(compassReactionFor(kind, scenario)) // Stage 4: Compass notices
      setBriefPulse(kind === 'opportunity' || kind === 'approval') // Stage 5
      setApprovalArrived(kind === 'approval') // Stage 6: prepared work slides in
    }, 300)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invPhase])

  // Morning Brief's "just updated" highlight fades once it's been noticed.
  useEffect(() => {
    if (!briefPulse) return
    const t = window.setTimeout(() => setBriefPulse(false), 4200)
    return () => window.clearTimeout(t)
  }, [briefPulse])

  // Compass flares briefly the moment it has something genuinely new to
  // report — the same reveal that drives briefPulse, read as light instead
  // of a badge. Never fires from opening/closing overlays.
  useEffect(() => {
    if (!briefPulse) return
    setDiscovering(true)
    const t = window.setTimeout(() => setDiscovering(false), 1400)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastReveal])

  const runCheck = () => {
    stepsRef.current = buildInvestigationSteps(scenario, outcome)
    setStepIndex(1)
    setInvPhase('stepping')
    setInvestigating(true)
    setLastReveal(null)
    setCompassReaction("I'm connecting what Scout is finding to what I already understand.")
  }

  const openOpportunity = () => setOverlay(scenario.opportunity ? 'opportunity' : 'opportunity-empty')
  const openApproval = () => setOverlay(scenario.pendingApproval ? 'approval' : 'approval-empty')
  const openCompass = (ctx: CompassContext) => { setCompassContext(ctx); setOverlay('compass') }

  const currentStep = investigating ? stepsRef.current[Math.min(stepIndex, stepsRef.current.length) - 1] : null
  const activeDnaKey = currentStep ? STEP_TO_DNA[currentStep.id] ?? null : null
  const currentSource = currentStep ? STEP_TO_SOURCE[currentStep.id] ?? null : null

  const quietMessage = !investigating && lastReveal && ['quiet', 'failed', 'duplicate', 'insufficient'].includes(lastReveal)
    ? lastReveal === 'quiet' ? `Checked ${scenario.pagesChecked} pages — nothing rose to the level of your attention.`
    : lastReveal === 'failed' ? `${scenario.business.domain} didn't respond. I'll try again automatically.`
    : lastReveal === 'duplicate' ? 'A check is already underway — let that finish first.'
    : "Not enough evidence gathered before the connection dropped. I'll try again next check."
    : null

  const compassStatusText = investigating
    ? (currentSource ? `Scout · ${currentSource} — ${currentStep?.text ?? ''}` : currentStep?.text ?? null)
    : quietMessage ?? compassReaction

  const wingActive: WingDestination | null =
    overlay === 'digital-dna' ? 'digital-dna'
    : overlay === 'approval' || overlay === 'approval-empty' ? 'decisions'
    : overlay === 'work-in-progress' ? 'intelligence'
    : overlay === 'results' ? 'results'
    : null

  const openWing = (id: WingDestination) => {
    if (id === 'digital-dna') setOverlay('digital-dna')
    else if (id === 'decisions') openApproval()
    else if (id === 'intelligence') setOverlay('work-in-progress')
    else setOverlay('results')
  }

  return (
    <section
      id="main-content"
      className="relative h-[100dvh] w-full touch-none overflow-hidden bg-black"
      data-investigating={investigating || undefined}
      onPointerMove={handlePointer}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
    >
      <RoomFilters />

      <div
        ref={sceneRef}
        className={`station-scene absolute inset-0 transition-opacity duration-500 ease-out ${isDimmed ? 'opacity-95' : 'opacity-100'}`}
        style={{
          ...environmentVars(environment),
          ...lightingVars(plateLight),
          ...seasonVars(environment.season),
        }}
      >
        <div className="hq-stage">
          {/* ---- the world: a dedicated plate per condition, seated DEEP behind the glass ---- */}
          <div className="hq-far absolute left-[19.66%] top-[19.34%] h-[43.95%] w-[60.42%] overflow-hidden">
            <ExteriorView condition={condition} location={DEFAULT_LOCATION} onLight={handleLight} />
            <div className="hq-cloudlight-a absolute -inset-x-[40%] inset-y-0" />
            <div className="hq-cloudlight-b absolute -inset-x-[40%] inset-y-0" />
          </div>

          {/* ---- the frozen office shell (true alpha panes) ---- */}
          <div
            className="absolute inset-0"
            style={{ backgroundImage: 'url(/environment-plates/hq-shell.webp)', backgroundSize: '100% 100%' }}
          />

          {/* ---- the glass: grade + weather media, clipped to the panes ---- */}
          <div className="hq-window absolute left-[19.66%] top-[19.34%] h-[43.95%] w-[60.42%] overflow-hidden">
            <div
              className="hq-fade absolute inset-0 mix-blend-soft-light bg-[radial-gradient(45%_55%_at_84%_38%,rgba(255,190,120,0.7),transparent_70%)]"
              style={{ opacity: 'var(--env-warm)' }}
            />
            <div
              className="hq-fade absolute inset-0 bg-[linear-gradient(180deg,rgba(96,120,150,0.35),rgba(70,88,112,0.2)_60%,rgba(60,74,94,0.24))]"
              style={{ opacity: 'var(--env-cool)' }}
            />
            <div
              className="hq-fade-slow absolute inset-0 bg-[linear-gradient(180deg,rgba(4,8,18,0.55),rgba(6,10,20,0.42)_55%,rgba(8,12,22,0.5))]"
              style={{ opacity: 'var(--env-night)' }}
            />
            <div className="absolute inset-0" style={{ opacity: 'var(--env-storm)' }}>
              <div className="hq-flash-a absolute inset-0 bg-[radial-gradient(60%_50%_at_30%_12%,rgba(210,225,255,0.9),transparent_70%)]" />
              <div className="hq-flash-b absolute inset-0 bg-[radial-gradient(55%_45%_at_72%_8%,rgba(200,215,250,0.8),transparent_70%)]" />
            </div>
            <div className="hq-fade-slow absolute inset-0 mix-blend-screen" style={{ opacity: 'var(--env-glass-reflect, 0)' }}>
              <div className="absolute inset-x-[4%] top-[4%] h-[9%] rounded-full bg-[linear-gradient(180deg,rgba(255,208,140,0.14),transparent)] blur-[8px]" />
              <div className="absolute left-[7%] top-[12%] h-[70%] w-[1.2%] -skew-x-6 bg-[linear-gradient(180deg,transparent,rgba(255,206,138,0.17),rgba(255,206,138,0.1),transparent)] blur-[7px]" />
              <div className="absolute right-[7%] top-[12%] h-[70%] w-[1.2%] skew-x-6 bg-[linear-gradient(180deg,transparent,rgba(255,206,138,0.17),rgba(255,206,138,0.1),transparent)] blur-[7px]" />
              <div className="absolute inset-0 bg-[radial-gradient(60%_70%_at_50%_86%,rgba(255,190,120,0.08),transparent_70%)]" />
              <div
                className="absolute left-[50.4%] top-[66%] aspect-square w-[9%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,216,150,0.5),transparent_65%)] blur-[9px]"
                style={{ opacity: 'calc(var(--env-compass, 0.6) * 0.85)' }}
              />
            </div>
            <div className="station-rain absolute inset-0" style={{ opacity: 'var(--env-rain)' }} />
            <div className="hq-rain-b absolute inset-0" style={{ opacity: 'calc(var(--env-rain) * 0.7)' }} />
            <div className="hq-fade-slow absolute inset-0" style={{ opacity: 'var(--env-snow)' }}>
              <div className="hq-snowfall-a absolute -inset-y-[20%] inset-x-0" />
              <div className="hq-snowfall-b absolute -inset-y-[20%] inset-x-0" />
              <div className="hq-frost absolute inset-0" />
            </div>
            {/* a slow specular sweep, like light crossing real panes */}
            <div aria-hidden="true" className="hq-glass-sweep pointer-events-none absolute inset-0" />
          </div>

          {/* the sun breathes — an almost-imperceptible drift in warmth */}
          <div aria-hidden="true" className="hq-sunbreathe pointer-events-none absolute inset-0" />

          {/* ambient dust, always faintly adrift in the light shafts */}
          <div aria-hidden="true" className="hq-dust-a pointer-events-none absolute -inset-y-[15%] inset-x-0" />
          <div aria-hidden="true" className="hq-dust-b pointer-events-none absolute -inset-y-[15%] inset-x-0" />

          {/* ---- the office answers the world (derived from the sampled plate) ---- */}
          <div
            className="hq-fade-slow absolute inset-0 mix-blend-soft-light"
            style={{ backgroundColor: 'rgb(var(--env-cast, 96 108 122) / 0.6)', opacity: 'var(--env-cast-op, var(--env-room-cool))' }}
          />
          <div className="hq-fade-slow absolute inset-0 bg-[#020409]" style={{ opacity: 'calc(var(--env-night) * 0.28)' }} />
          <div className="hq-fade-slow absolute inset-x-0 top-[63%] bottom-0" style={{ opacity: 'var(--env-floor-dim, 0)' }}>
            <div className="absolute inset-0 bg-[radial-gradient(55%_70%_at_50%_70%,rgba(3,5,10,0.66),rgba(3,5,10,0.35)_70%,transparent)]" />
            <div className="absolute inset-x-[10%] top-0 h-[30%] bg-[linear-gradient(180deg,rgba(3,5,10,0.5),transparent)]" />
          </div>
          <div
            className="hq-fade-slow absolute inset-x-0 top-[63%] bottom-0 mix-blend-soft-light bg-[#8a8f96]"
            style={{ opacity: 'calc(var(--env-flat, 0) * 0.34)' }}
          />
          <div
            className="hq-fade-slow absolute inset-0 mix-blend-screen bg-[linear-gradient(180deg,rgba(255,196,120,0.14),transparent_16%),radial-gradient(24%_36%_at_14.5%_40%,rgba(255,190,110,0.12),transparent_75%),radial-gradient(24%_36%_at_85.5%_40%,rgba(255,190,110,0.12),transparent_75%),radial-gradient(18%_14%_at_31%_57%,rgba(255,206,130,0.16),transparent_70%)]"
            style={{ opacity: 'var(--env-interior)' }}
          />
          <div className="absolute inset-0" style={{ opacity: 'calc(var(--env-storm) * 0.35)' }}>
            <div className="hq-flash-a absolute inset-0 bg-[linear-gradient(180deg,rgba(190,205,235,0.2),transparent_60%)]" />
          </div>

          {/* ---- the desk assembly: a true foreground plane, nearest the camera.
                 Compass and its light ride it, so they parallax together ---- */}
          <div
            className="hq-near absolute inset-0"
            style={{ backgroundImage: 'url(/environment-plates/hq-near.webp)', backgroundSize: '100% 100%' }}
          >
            <div
              className="hq-fade absolute left-[50.1%] top-[52.4%] aspect-square w-[19%] -translate-x-1/2 -translate-y-1/2"
              style={{ opacity: 'calc(0.3 + var(--env-compass) * 0.45 + var(--approach, 0) * 0.22)' }}
            >
              {/* idle breath + discovery flare live on an inner wrapper, so the
                  outer positioning above (Compass's actual place in the room)
                  never moves or resizes */}
              <div className={`hq-orb-idle absolute inset-0${discovering ? ' hq-discovering' : ''}`}>
                <div className="absolute left-1/2 top-[76%] h-[7%] w-[46%] -translate-x-1/2 rounded-full bg-[radial-gradient(50%_100%_at_50%_50%,rgba(2,3,5,0.5),transparent_75%)] blur-[4px]" />
                <div className="absolute left-1/2 top-[-14%] h-[52%] w-[34%] -translate-x-1/2 rounded-full bg-[radial-gradient(50%_60%_at_50%_78%,rgba(255,212,142,0.14),transparent_75%)] mix-blend-screen blur-[12px]" />
                <div className="hq-breathe-a absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgba(255,220,160,0.42),rgba(255,200,124,0.14)_48%,transparent_66%)] mix-blend-screen blur-[5px]" />
                <div className="hq-breathe-b absolute left-1/2 top-1/2 h-[92%] w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,210,140,0.2),transparent_70%)] mix-blend-screen blur-[10px]" />
                <div className="absolute left-1/2 top-1/2 h-[7%] w-[120%] -translate-x-1/2 -translate-y-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,214,150,0.15),transparent)] mix-blend-screen blur-[3px]" />
              </div>
            </div>
          </div>
          <div
            className="hq-fade absolute left-[50.1%] top-[79%] h-[26%] w-[26%] -translate-x-1/2 mix-blend-screen blur-[8px]"
            style={{
              background: 'radial-gradient(50% 46% at 50% 18%, rgb(var(--env-reflect-tint, 255 200 124) / 0.28), transparent 72%)',
              opacity: 'var(--env-reflect)',
            }}
          />
          {/* a second, tighter highlight so the desk reads as polished wood,
              not a flat photo */}
          <div aria-hidden="true" className="hq-desk-highlight pointer-events-none absolute left-[50.1%] top-[74%] h-[16%] w-[30%] -translate-x-1/2" />
          {/* evidence, read as light moving through the room while a check runs */}
          <div aria-hidden="true" className="hq-evidence-sweep pointer-events-none absolute left-[26%] top-[58%] size-2" />
          <div aria-hidden="true" className="hq-evidence-sweep pointer-events-none absolute left-[71%] top-[60%] size-2" style={{ animationDelay: '0.9s' }} />
          <div
            className="hq-fade absolute left-[50.1%] top-[59.5%] h-[4.5%] w-[13%] -translate-x-1/2 rounded-full mix-blend-screen blur-[5px] bg-[radial-gradient(50%_100%_at_50%_50%,rgba(255,208,132,0.3),transparent_75%)]"
            style={{ opacity: 'calc(0.35 + var(--env-compass) * 0.4)' }}
          />
          <div className="hq-fade-slow absolute inset-0 mix-blend-soft-light bg-[#cfd6dd]" style={{ opacity: 'calc(var(--env-snow) * 0.12)' }} />

          <svg aria-hidden="true" className="arch-grain pointer-events-none absolute inset-0 size-full" preserveAspectRatio="none">
            <rect width="100%" height="100%" filter="url(#ns-grain)" />
          </svg>
        </div>
      </div>

      {/* --- executive briefing, projected onto the marble floor --- */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 z-[9] h-[52%] w-[52%] bg-[radial-gradient(88%_98%_at_14%_96%,rgba(2,3,6,0.8),rgba(2,3,6,0.4)_55%,transparent_80%)]"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-[7.5rem] z-10 px-6 sm:px-12 lg:pl-60">
        <div className="hq-floor-projected relative max-w-sm [text-shadow:0_2px_14px_rgba(1,2,5,0.95)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-7 -inset-y-6 bg-[rgba(3,4,8,0.52)] backdrop-blur-[5px] [mask-image:radial-gradient(125%_115%_at_18%_55%,#000_50%,transparent_82%)] [-webkit-mask-image:radial-gradient(125%_115%_at_18%_55%,#000_50%,transparent_82%)]"
          />
          <div className="pointer-events-auto relative">
            <div className="arch-projected flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.4em] text-[#e0b877]">
              EXECUTIVE BRIEFING
              {briefPulse && <span className="brief-updated-tag !m-0 !py-0.5">Updated</span>}
            </div>
            <h1 className="arch-etch mt-3 text-[1.7rem] font-semibold tracking-tight text-[#fbf3e2] sm:text-[1.85rem]">
              {scenario.briefing.headline}
            </h1>
            <p className="mt-3 max-w-[20rem] text-[14px] leading-6 text-[#ddd4c0]">
              <span className="text-[#e9ddc7]">{scenario.business.name}</span> — {scenario.briefing.subline}
            </p>
            <button type="button" onClick={() => setOverlay('briefing')} className="group mt-4 inline-flex cursor-pointer flex-col items-start focus:outline-none">
              <span className="arch-projected text-[11.5px] font-semibold tracking-[0.26em] text-[#f0e2c4] transition-colors duration-300 group-hover:text-[#fff8e8]">
                OPEN BRIEFING <span aria-hidden="true">→</span>
              </span>
              <span className="mt-2 h-px w-32 bg-[linear-gradient(90deg,rgba(200,180,138,0.7),transparent)] transition-[width] duration-500 ease-out group-hover:w-44" />
            </button>
          </div>
        </div>
      </div>

      {/* --- Compass's counsel, engraved light on the marble at the desk's foot —
             the original's non-negotiable centerpiece, emerging from the desk --- */}
      <div className="pointer-events-none absolute inset-x-0 top-[60%] z-20 hidden justify-center lg:flex">
        <CompassConsole
          onFocusChange={setIsDimmed}
          scenario={scenario}
          investigating={investigating}
          statusText={compassStatusText}
          discovering={discovering}
          onCheckNow={runCheck}
          className="pointer-events-auto w-[27rem]"
        />
      </div>

      {/* --- the wing: wayfinding to the room's destinations --- */}
      <div className="absolute inset-y-0 left-0 z-40 hidden lg:block">
        <CommandWing scenario={scenario} active={wingActive} onOpen={openWing} />
      </div>

      {/* --- mobile executive console --- */}
      <nav className="office-mobile-bar" aria-label="North Star quick actions">
        <button className="office-mobile-bar-item ns-touch" onClick={() => setOverlay('digital-dna')}>Digital DNA</button>
        <button className="office-mobile-bar-item ns-touch" onClick={() => setOverlay('briefing')}>Briefing</button>
        <button className="office-mobile-bar-item ns-touch" data-has-badge={!!scenario.pendingApproval} onClick={openApproval}>Decisions</button>
        <button className="office-mobile-bar-item ns-touch" data-has-badge={!!(scenario.opportunity && !scenario.opportunityStale)} onClick={openOpportunity}>Opportunities</button>
        <button className="office-mobile-bar-item ns-touch" onClick={() => openCompass('command-center')}>Compass</button>
      </nav>

      {overlay === 'digital-dna' && (
        <CCDigitalDnaOverlay
          scenario={scenario}
          investigating={investigating}
          activeKey={activeDnaKey}
          onClose={() => setOverlay(null)}
          onAskCompass={() => openCompass('digital-dna')}
          onOpenSources={() => setOverlay('sources')}
        />
      )}
      {overlay === 'briefing' && (
        <MorningBriefingOverlay
          scenario={scenario}
          investigating={investigating}
          currentSource={currentSource}
          lastReveal={lastReveal}
          onClose={() => setOverlay(null)}
          onAskCompass={(ctx) => openCompass(ctx ?? 'command-center')}
          onOpenOpportunity={openOpportunity}
          onOpenApproval={openApproval}
        />
      )}
      {overlay === 'opportunity' && scenario.opportunity && (
        <CCOpportunityWorkspace
          opportunity={scenario.opportunity}
          stale={scenario.opportunityStale}
          onClose={() => setOverlay(null)}
          onExplain={() => openCompass('opportunity')}
        />
      )}
      {overlay === 'opportunity-empty' && (
        <CCEmptyOverlay title="No opportunities" eyebrow="Opportunities" message="North Star hasn't found anything worth reviewing yet." onClose={() => setOverlay(null)} />
      )}
      {overlay === 'approval' && scenario.pendingApproval && (
        <CCApprovalCenter
          approval={scenario.pendingApproval}
          onClose={() => setOverlay(null)}
          onAskCompass={() => openCompass('approval')}
        />
      )}
      {overlay === 'approval-empty' && (
        <CCEmptyOverlay title="Nothing pending" eyebrow="Approvals" message="Nothing is waiting on your approval right now." onClose={() => setOverlay(null)} />
      )}
      {overlay === 'compass' && <CCCompassPanel scenario={scenario} context={compassContext} onClose={() => setOverlay(null)} />}
      {overlay === 'work-in-progress' && <CCWorkInProgressOverlay activity={scenario.activity} onClose={() => setOverlay(null)} />}
      {overlay === 'results' && <CCResultsOverlay history={scenario.history} onClose={() => setOverlay(null)} />}
      {overlay === 'sources' && <CCSourcesOverlay areas={scenario.digitalDna} pagesChecked={scenario.pagesChecked} onClose={() => setOverlay(null)} />}
    </section>
  )
}
