'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  composeScene,
  deriveSky,
  deriveTimeOfDay,
  isCoreState,
  isEnvironmentState,
  isTimeOfDay,
  isWeather,
  narrate,
  type CoreState,
  type EnvironmentState,
  type ProductTruth,
  type TimeOfDay,
  type Weather,
} from '@/lib/hq/state'
import { SceneCtx } from './sceneContext'
import { Observatory } from './scene/Observatory'
import { SHOTS, type CameraPreset } from './scene/Cameras'
import { StateConsole } from './StateConsole'

const CAMERA_PRESETS: CameraPreset[] = ['hero', 'executive', 'conversation', 'atmospheric', 'boardroom']

function usePrefersReducedMotion(override: 'full' | 'reduced' | null): boolean {
  const [sys, setSys] = useState(false)
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    setSys(m.matches)
    const on = () => setSys(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  if (override === 'reduced') return true
  if (override === 'full') return false
  return sys
}

export function Headquarters() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  // --- Preview overrides from the URL --------------------------------------
  const coreParam = params.get('core')
  const envParam = params.get('env')
  const timeParam = params.get('time')
  const weatherParam = params.get('weather')
  const camParam = params.get('cam')
  const motionParam = params.get('motion') === 'reduced' ? 'reduced' : params.get('motion') === 'full' ? 'full' : null

  const pins = {
    core: isCoreState(coreParam) ? coreParam : null,
    env: isEnvironmentState(envParam) ? envParam : null,
    time: isTimeOfDay(timeParam) ? timeParam : null,
    weather: isWeather(weatherParam) ? weatherParam : null,
  }
  const cam: CameraPreset = (CAMERA_PRESETS as string[]).includes(camParam ?? '') ? (camParam as CameraPreset) : 'hero'

  const reduced = usePrefersReducedMotion(motionParam)

  // --- Product truth (Phase 1 ships no live data) --------------------------
  const [truth] = useState<ProductTruth>({
    activity: 'idle',
    confidence: 'high',
    attention: 'none',
    overnightWork: false,
  })
  const [clock, setClock] = useState<TimeOfDay>(() =>
    typeof window === 'undefined' ? 'night' : deriveTimeOfDay(new Date()),
  )
  useEffect(() => {
    const id = window.setInterval(() => setClock(deriveTimeOfDay(new Date())), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const scene = useMemo(() => {
    const activity: CoreState = pins.core ?? truth.activity
    const time = pins.time ?? clock
    const base = composeScene({ ...truth, activity }, time, pins.weather ?? undefined)
    if (pins.env && pins.env !== base.env) {
      const env: EnvironmentState = pins.env
      const weather: Weather = pins.weather ?? base.weather
      return { ...base, env, sky: deriveSky(env, time, weather), narration: narrate(activity, env, time, weather) }
    }
    return base
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins.core, pins.env, pins.time, pins.weather, clock, truth])

  // --- Preview console ------------------------------------------------------
  const [consoleOpen, setConsoleOpen] = useState(params.get('console') === '1')
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '`') setConsoleOpen((v) => !v)
      if (e.key === 'Escape') setConsoleOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString())
      if (value === null) next.delete(key)
      else next.set(key, value)
      router.replace(`${pathname}?${next.toString()}`, { scroll: false })
    },
    [router, pathname, params],
  )

  const hero = SHOTS.hero

  return (
    <SceneCtx.Provider value={{ scene, reduced }}>
      <div className="hq-root hq-viewport" data-core={scene.core} data-env={scene.env}>
        <Canvas
          shadows
          flat
          dpr={[1, 1.75]}
          gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.NoToneMapping }}
          camera={{ position: hero.pos, fov: hero.fov, near: 0.1, far: 400 }}
          onCreated={({ gl }) => {
            gl.setClearColor('#050507', 1)
          }}
        >
          <fog attach="fog" args={['#0a0d14', 18, 130]} />
          <Suspense fallback={null}>
            <Observatory cam={cam} reduced={reduced} />
          </Suspense>
        </Canvas>

        {/* Non-visual state description (accessibility layer). */}
        <p className="hq-sr" role="status" aria-live="polite">
          {scene.narration}
        </p>

        <StateConsole
          open={consoleOpen}
          onToggle={() => setConsoleOpen((v) => !v)}
          scene={scene}
          cam={cam}
          motion={motionParam}
          pins={pins}
          setParam={setParam}
        />
      </div>
    </SceneCtx.Provider>
  )
}
