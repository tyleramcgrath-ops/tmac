'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  COMPLETION_HOLD_MS,
  composeScene,
  deriveSky,
  deriveTimeOfDay,
  isCoreState,
  isEnvironmentState,
  isTimeOfDay,
  narrate,
  type CoreState,
  type EnvironmentState,
  type ProductTruth,
  type TimeOfDay,
} from '@/lib/hq/state'
import { Environment } from './Environment'
import { Architecture } from './Architecture'
import { Desk } from './Desk'
import { Core } from './Core'
import { StateConsole } from './StateConsole'

/**
 * Design space. Every layer — environment, architecture, desk, Core — is
 * authored in this one coordinate system (Bible §14: shared spatial system,
 * agreeing depth, occlusion, reflection and scale). The stage scales to
 * cover the viewport like a film frame, so composition holds at 1440p/4K.
 */
export const STAGE_W = 1920
export const STAGE_H = 1080

export type ShotKind = 'room' | 'close'

/** Preview inputs accepted from the URL so states can be inspected and
 * screenshotted deterministically. Absent params fall back to live truth. */
interface PreviewOverrides {
  core: CoreState | null
  env: EnvironmentState | null
  time: TimeOfDay | null
  shot: ShotKind
  motion: 'full' | 'reduced' | null
  console: boolean
}

function readOverrides(params: URLSearchParams): PreviewOverrides {
  const core = params.get('core')
  const env = params.get('env')
  const time = params.get('time')
  const motion = params.get('motion')
  return {
    core: isCoreState(core) ? core : null,
    env: isEnvironmentState(env) ? env : null,
    time: isTimeOfDay(time) ? time : null,
    shot: params.get('shot') === 'close' ? 'close' : 'room',
    motion: motion === 'reduced' ? 'reduced' : motion === 'full' ? 'full' : null,
    console: params.get('console') === '1',
  }
}

export function HeadquartersScene() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const overrides = useMemo(() => readOverrides(new URLSearchParams(searchParams)), [searchParams])

  // Product truth. Phase 1 ships no live business data (deck slide 16:
  // headquarters and Core only) — the resting truth is an honest "at rest,
  // high confidence" and the preview console can exercise every state.
  const [truth, setTruth] = useState<ProductTruth>({
    activity: 'idle',
    confidence: 'high',
    attention: 'none',
    overnightWork: false,
  })
  const [clockTime, setClockTime] = useState<TimeOfDay>(() => deriveTimeOfDay(new Date()))
  const [consoleOpen, setConsoleOpen] = useState(false)
  // Replay key so repeated completion states re-run the single light wave.
  const [waveKey, setWaveKey] = useState(0)

  // Keep the time-of-day honest while the room stays open.
  useEffect(() => {
    const id = window.setInterval(() => setClockTime(deriveTimeOfDay(new Date())), 60_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (overrides.console) setConsoleOpen(true)
  }, [overrides.console])

  const effectiveTruth: ProductTruth = useMemo(
    () => (overrides.core ? { ...truth, activity: overrides.core } : truth),
    [truth, overrides.core],
  )
  const scene = useMemo(() => {
    const time = overrides.time ?? clockTime
    const composed = composeScene(effectiveTruth, time)
    if (overrides.env && overrides.env !== composed.env) {
      // A pinned preview environment re-derives sky and narration so the
      // scene stays coherent — never a mismatched patchwork.
      return {
        ...composed,
        env: overrides.env,
        sky: deriveSky(overrides.env, time),
        narration: narrate(composed.core, overrides.env, time),
      }
    }
    return composed
  }, [effectiveTruth, overrides.env, overrides.time, clockTime])

  // The completion state is a single refined wave, then the room settles
  // (Bible §05). Auto-return unless a preview override is pinning it.
  useEffect(() => {
    if (scene.core !== 'completion') return
    setWaveKey((k) => k + 1)
    if (overrides.core === 'completion') return
    const id = window.setTimeout(
      () => setTruth((t) => (t.activity === 'completion' ? { ...t, activity: 'idle' } : t)),
      COMPLETION_HOLD_MS,
    )
    return () => window.clearTimeout(id)
  }, [scene.core, overrides.core])

  // --- Camera / stage scaling -------------------------------------------
  // Cover the viewport, anchored slightly above stage center so the desk
  // and Core survive extreme aspect-ratio crops.
  const viewportRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const fit = () => {
      const scale = Math.max(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H)
      el.style.setProperty('--stage-scale', String(scale))
      setReady(true)
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  // --- Preview console ----------------------------------------------------
  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(searchParams)
      if (value === null) next.delete(key)
      else next.set(key, value)
      router.replace(`${pathname}?${next.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '`') setConsoleOpen((v) => !v)
      if (e.key === 'Escape') setConsoleOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const dataMotion = overrides.motion ?? undefined

  return (
    <div
      ref={viewportRef}
      className="hq-viewport"
      data-core={scene.core}
      data-env={scene.env}
      data-time={scene.time}
      data-shot={overrides.shot}
      data-ready={ready ? 'true' : 'false'}
      {...(dataMotion ? { 'data-motion': dataMotion } : {})}
    >
      {/* Non-visual state description (Bible §14 accessibility layer). */}
      <p className="hq-sr" role="status" aria-live="polite">
        {scene.narration}
      </p>

      <div className="hq-stage" role="img" aria-label={`North Star headquarters. ${scene.narration}`}>
        <div className="hq-camera">
          <Environment sky={scene.sky} />
          <Architecture />
          <Desk />
          <Core waveKey={waveKey} />
          {/* Cinematic finishing: vignette, state tint and film grain. */}
          <div className="hq-tint" aria-hidden />
          <div className="hq-vignette" aria-hidden />
          <div className="hq-grain" aria-hidden />
        </div>
      </div>

      <StateConsole
        open={consoleOpen}
        onOpenChange={setConsoleOpen}
        scene={scene}
        shot={overrides.shot}
        motion={overrides.motion}
        pinnedCore={overrides.core}
        pinnedEnv={overrides.env}
        pinnedTime={overrides.time}
        setParam={setParam}
        onPulseCompletion={() => setTruth((t) => ({ ...t, activity: 'completion' }))}
      />
    </div>
  )
}
