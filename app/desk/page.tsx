'use client'

import { useEffect, useRef } from 'react'

/* =====================================================================
   NORTH STAR HEADQUARTERS — THE BOARD ITSELF, ALIVE
   The page IS the vision-board render: the image sits full-bleed as the
   room plate (exactly how the executive office is built from its own
   plates), and living light rides on top of it — the Core's armillary
   rings turning in true 3D over the render's compass, its star pulsing,
   its halo breathing, film grain unifying the frame.

   The plate is /environment-plates/board-hero.png. Swap that file for
   the full-resolution render and the page upgrades itself — no code
   change. PLATE tunes where the live light sits on the image.
   ===================================================================== */

/** Where the render's compass sits on the plate, in % of the frame,
 *  and how large the live armillary should be relative to frame height. */
const PLATE = {
  coreX: 50.1, // % from left to the compass center
  coreY: 54.2, // % from top to the compass center
  coreD: 21.5, // armillary diameter, in vh
}

export default function BoardHero() {
  const rootRef = useRef<HTMLDivElement>(null)
  const raf = useRef(0)

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  // A whisper of parallax: the plate holds still, the light leans with you.
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

  return (
    <main ref={rootRef} className="hz-plate-root" onPointerMove={onPointerMove}>
      {/* the render, full bleed — the room is the image */}
      <div className="hz-plate" aria-label="North Star Headquarters — the command table at dusk" role="img" />

      {/* quiets the sheet label baked into the render's top-left corner */}
      <div className="hz-plate-patch" aria-hidden="true" />

      {/* the dome carries the name, set live so it stays razor sharp */}
      <header className="hz-brand">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <path d="M50 4 L55.5 44.5 L96 50 L55.5 55.5 L50 96 L44.5 55.5 L4 50 L44.5 44.5 Z" fill="#e8c988" />
          <circle cx="50" cy="50" r="3.4" fill="#fff6dd" />
        </svg>
        <h1>North Star</h1>
        <p>Headquarters</p>
      </header>

      {/* the Core, alive on top of the render's compass */}
      <div
        className="hz-live"
        style={{
          left: `${PLATE.coreX}%`,
          top: `${PLATE.coreY}%`,
          width: `${PLATE.coreD}vh`,
        }}
        aria-hidden="true"
      >
        <div className="hz-live-halo" />
        <div className="hz-live-scene">
          <div className="hz-live-gimbal">
            <div className="hz-lring outer" />
            <div className="hz-live-sphere">
              <div className="hz-lring m1" />
              <div className="hz-lring m2" />
              <div className="hz-lring eq" />
              <div className="hz-lring t1" />
            </div>
          </div>
        </div>
        <div className="hz-live-flare" />
      </div>

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
