'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import RoomFilters from '@/components/north-star/office/RoomFilters'
import ExteriorView from '@/components/north-star/office/ExteriorView'
import {
  environmentVars,
  lightingVars,
  seasonVars,
  readEnvironmentOverrides,
  type Environment,
} from '@/components/north-star/office/EnvironmentEngine'
import { resolveMaster, DEFAULT_LOCATION } from '@/components/north-star/office/locations'
import type { PlateLight } from '@/components/north-star/office/plateLighting'

/* =====================================================================
   NORTH STAR HEADQUARTERS — THE COMMAND TABLE
   Built on the confirmed Executive Office room (the photographic
   environment-plate composition from the original north-star-station
   baseline): the same shell, the same window onto the world, the same
   desk plate with Compass's light riding it. Held at the board's
   moment — dusk burning over the water — with the Core's armillary
   rings turning around the compass, and the board's plate typography
   laid over the room. One compass. Endless clarity.
   ===================================================================== */

/** Headquarters holds the board's hour: dusk just after the sun is gone,
 *  the horizon still burning, the room lit by its own warm light.
 *  ?time=night&weather=rain etc. still work for review, as in the office. */
const HQ_ENV: Environment = {
  time: 'night',
  weather: 'clear',
  season: 'summer',
  businessHealth: 92,
}

export default function CommandTablePage() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const frame = useRef(0)
  const [env, setEnv] = useState<Environment>(HQ_ENV)
  const [plateLight, setPlateLight] = useState<PlateLight | null>(null)
  const condition = resolveMaster(env.time)
  const handleLight = useCallback((light: PlateLight) => setPlateLight(light), [])

  // Review overrides only after mount — the server and client both first
  // render the board's canonical dusk, so hydration always matches.
  useEffect(() => {
    const overrides = readEnvironmentOverrides(window.location.search)
    if (Object.keys(overrides).length) setEnv((current) => ({ ...current, ...overrides }))
  }, [])

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  // The office's camera: pointer nearness warms Compass, parallax turns the room.
  const handlePointer = (event: PointerEvent<HTMLElement>) => {
    const el = sceneRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = ((event.clientX - rect.left) / rect.width - 0.5) * 2
    const py = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    const approach = Math.max(0, 1 - Math.hypot(px, py * 1.35))
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty('--px', px.toFixed(3))
      el.style.setProperty('--py', py.toFixed(3))
      el.style.setProperty('--approach', approach.toFixed(3))
    })
  }

  return (
    <main
      className="relative h-[100dvh] w-full overflow-hidden bg-black"
      style={{ ['--dna-warmth' as string]: '1' }}
      onPointerMove={handlePointer}
    >
      <RoomFilters />

      <div
        ref={sceneRef}
        className="station-scene absolute inset-0"
        style={{
          ...environmentVars(env),
          ...lightingVars(plateLight),
          ...seasonVars(env.season),
        }}
      >
        <div className="hq-stage">
          {/* ---- the world: the dusk master, seated DEEP behind the glass ---- */}
          <div className="hq-far absolute left-[19.66%] top-[19.34%] h-[43.95%] w-[60.42%] overflow-hidden">
            <ExteriorView condition={condition} location={DEFAULT_LOCATION} onLight={handleLight} />
            {/* the board keeps a line of fire on the night horizon — dusk's
                last heat behind the ranges, under the stars */}
            <div aria-hidden="true" className="hz-horizonfire pointer-events-none absolute inset-x-0" />
            <div className="hq-cloudlight-a absolute -inset-x-[40%] inset-y-0" />
            <div className="hq-cloudlight-b absolute -inset-x-[40%] inset-y-0" />
            <div aria-hidden="true" className="hq-depth-haze pointer-events-none absolute inset-0" />
          </div>

          {/* ---- the frozen room shell (true alpha panes) ---- */}
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

          {/* ---- the desk assembly: the near plate, Compass's light riding it ---- */}
          <div
            className="hq-near absolute inset-0"
            style={{ backgroundImage: 'url(/environment-plates/hq-near.webp)', backgroundSize: '100% 100%' }}
          >
            <div
              className="hq-fade absolute left-[50.1%] top-[52.4%] aspect-square w-[19%] -translate-x-1/2 -translate-y-1/2"
              style={{ opacity: 'calc(0.3 + var(--env-compass) * 0.45 + var(--approach, 0) * 0.22)' }}
            >
              <div className="hq-orb-idle absolute inset-0">
                <div className="absolute left-1/2 top-[76%] h-[7%] w-[46%] -translate-x-1/2 rounded-full bg-[radial-gradient(50%_100%_at_50%_50%,rgba(2,3,5,0.5),transparent_75%)] blur-[4px]" />
                <div className="absolute left-1/2 top-[-14%] h-[52%] w-[34%] -translate-x-1/2 rounded-full bg-[radial-gradient(50%_60%_at_50%_78%,rgba(255,212,142,0.14),transparent_75%)] mix-blend-screen blur-[12px]" />
                <div className="hq-breathe-a absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgba(255,220,160,0.42),rgba(255,200,124,0.14)_48%,transparent_66%)] mix-blend-screen blur-[5px]" />
                <div className="hq-breathe-b absolute left-1/2 top-1/2 h-[92%] w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,210,140,0.2),transparent_70%)] mix-blend-screen blur-[10px]" />
                <div className="absolute left-1/2 top-1/2 h-[7%] w-[120%] -translate-x-1/2 -translate-y-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,214,150,0.15),transparent)] mix-blend-screen blur-[3px]" />
                <div className="hq-orb-warmth absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(255,232,190,0.5),transparent_70%)] mix-blend-screen blur-[6px]" />
              </div>

              {/* the board's Core: armillary rings turning around the compass —
                  the one addition to the confirmed room */}
              <div className="hz-armillary" aria-hidden="true">
                <div className="hz-arm-scene">
                  <div className="hz-arm-gimbal">
                    <div className="hz-ring outer" />
                    <div className="hz-arm-sphere">
                      <div className="hz-ring m1" />
                      <div className="hz-ring m2" />
                      <div className="hz-ring eq" />
                      <div className="hz-ring t1" />
                    </div>
                  </div>
                </div>
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
          <div aria-hidden="true" className="hq-desk-highlight pointer-events-none absolute left-[50.1%] top-[74%] h-[16%] w-[30%] -translate-x-1/2" />
          <div aria-hidden="true" className="hq-desk-glow pointer-events-none absolute left-[50.1%] top-[74%] h-[16%] w-[30%] -translate-x-1/2" />
          <div
            className="hq-fade absolute left-[50.1%] top-[59.5%] h-[4.5%] w-[13%] -translate-x-1/2 rounded-full mix-blend-screen blur-[5px] bg-[radial-gradient(50%_100%_at_50%_50%,rgba(255,208,132,0.3),transparent_75%)] hq-compass-consider"
            style={{ opacity: 'calc(0.35 + var(--env-compass) * 0.4)' }}
          />

          <svg aria-hidden="true" className="arch-grain pointer-events-none absolute inset-0 size-full" preserveAspectRatio="none">
            <rect width="100%" height="100%" filter="url(#ns-grain)" />
          </svg>
        </div>
      </div>

      {/* ---- the board's plate, engraved over the room ---- */}
      <header className="hz-title hz-wake w1">
        <h1>North Star Headquarters</h1>
        <p>One compass. Endless clarity.</p>
      </header>

      <div className="hz-captions hz-wake w2">
        <span>The core is the <b>heart</b>.</span>
        <span>The horizon is the <b>command</b>.</span>
        <span>The stars are the <b>interface</b>.</span>
      </div>
    </main>
  )
}
