'use client'

import { useEffect, useRef } from 'react'

/* =====================================================================
   NORTH STAR HEADQUARTERS — THE HORIZON, COMMAND TABLE
   The board's hero frame, rebuilt as a living scene: a dark stone room
   behind floor-to-ceiling glass, dusk burning on the horizon, a blade
   of absolute black stone rimmed in warm light, and the Core — a
   sphere of brass rings — turning slowly above its mount.
   ===================================================================== */

// Deterministic starfield — the same sky on server and client.
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
}

const starRand = seeded(19)
const STARS = Array.from({ length: 90 }, () => ({
  x: +(starRand() * 1600).toFixed(1),
  y: +(starRand() * starRand() * 340).toFixed(1),
  r: +(0.4 + starRand() * 1.1).toFixed(2),
  o: +(0.2 + starRand() * 0.6).toFixed(2),
}))

// The constellation dome: a survey web of points across the ceiling.
const domeRand = seeded(7)
const DOME_PTS = Array.from({ length: 26 }, () => ({
  x: +(domeRand() * 1600).toFixed(1),
  y: +(14 + domeRand() * 160).toFixed(1),
}))
const DOME_LINKS = DOME_PTS.flatMap((p, i) => {
  const near = DOME_PTS
    .map((q, j) => ({ j, d: (p.x - q.x) ** 2 + ((p.y - q.y) * 2.4) ** 2 }))
    .filter(({ j }) => j > i)
    .sort((a, b) => a.d - b.d)
    .slice(0, 2)
  return near.map(({ j }) => [i, j] as const)
})

function CompassStar() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="hz-star-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff4d4" />
          <stop offset="0.45" stopColor="#f0cc7f" />
          <stop offset="1" stopColor="#a87c36" />
        </linearGradient>
      </defs>
      <path
        d="M50 50 L28 28 L45 45 Z M50 50 L72 28 L55 45 Z M50 50 L72 72 L55 55 Z M50 50 L28 72 L45 55 Z"
        fill="#b8903f"
      />
      <path
        d="M50 2 L56 44 L98 50 L56 56 L50 98 L44 56 L2 50 L44 44 Z"
        fill="url(#hz-star-gold)"
        stroke="#fff6dd"
        strokeWidth="0.6"
      />
      <circle cx="50" cy="50" r="4" fill="#fffbe9" />
    </svg>
  )
}

/** The Horizon itself, drawn over the full frame so its light and the
 *  room's datums stay in perfect register at any viewport. */
function CommandTable() {
  return (
    <svg
      className="hz-table"
      viewBox="0 0 1600 900"
      preserveAspectRatio="none"
      aria-label="The Horizon command table: a blade-thin ellipse of black stone on a sculpted stem, its rim emitting warm light"
    >
      <defs>
        <linearGradient id="hz-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c2118" />
          <stop offset="0.35" stopColor="#15110d" />
          <stop offset="1" stopColor="#070606" />
        </linearGradient>
        <linearGradient id="hz-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c0a08" />
          <stop offset="0.55" stopColor="#050404" />
          <stop offset="1" stopColor="#020202" />
        </linearGradient>
        <linearGradient id="hz-stem2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#020202" />
          <stop offset="0.34" stopColor="#0a0908" />
          <stop offset="0.5" stopColor="#191512" />
          <stop offset="0.66" stopColor="#0a0908" />
          <stop offset="1" stopColor="#020202" />
        </linearGradient>
        <linearGradient id="hz-emit" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c9862e" stopOpacity="0.1" />
          <stop offset="0.18" stopColor="#f4b45e" stopOpacity="0.75" />
          <stop offset="0.5" stopColor="#ffd894" stopOpacity="1" />
          <stop offset="0.82" stopColor="#f4b45e" stopOpacity="0.75" />
          <stop offset="1" stopColor="#c9862e" stopOpacity="0.1" />
        </linearGradient>
        <filter id="hz-blur6" x="-30%" y="-300%" width="160%" height="700%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="hz-blur16" x="-30%" y="-120%" width="160%" height="340%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <filter id="hz-blur2" x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>

      {/* the table's shadow, pooled beneath the foot */}
      <ellipse cx="800" cy="836" rx="520" ry="42" fill="#000" opacity="0.72" filter="url(#hz-blur16)" />

      {/* the stem: one manta sweep from the blade's underside to the stone */}
      <path
        d="M 726 622
           C 742 668, 756 690, 758 712
           C 760 756, 700 796, 622 822
           L 978 822
           C 900 796, 840 756, 842 712
           C 844 690, 858 668, 874 622
           Z"
        fill="url(#hz-stem2)"
      />
      {/* horizon light grazing the stem's flanks */}
      <path d="M 748 640 C 756 686 762 700 756 726 C 750 764 700 794 650 814" fill="none" stroke="#b97f3c" strokeWidth="2" opacity="0.4" filter="url(#hz-blur2)" />
      <path d="M 852 640 C 844 686 838 700 844 726 C 850 764 900 794 950 814" fill="none" stroke="#d99a4c" strokeWidth="2.4" opacity="0.55" filter="url(#hz-blur2)" />

      {/* the foot, seated on a hairline of brass */}
      <ellipse cx="800" cy="818" rx="185" ry="17" fill="url(#hz-rim)" />
      <path d="M 615 820 A 185 17 0 0 0 985 820" fill="none" stroke="url(#hz-emit)" strokeWidth="1.6" opacity="0.5" />

      {/* the blade: rim first, then the polished face */}
      <ellipse cx="800" cy="620" rx="497" ry="27" fill="url(#hz-rim)" />
      {/* the 40 mm edge, emitting 2700 K — sharp line plus bloom */}
      <path d="M 303 621 A 497 27 0 0 0 1297 621" fill="none" stroke="url(#hz-emit)" strokeWidth="7" opacity="0.5" filter="url(#hz-blur6)" />
      <path d="M 303 621 A 497 27 0 0 0 1297 621" fill="none" stroke="url(#hz-emit)" strokeWidth="2.2" />
      <ellipse cx="800" cy="608" rx="497" ry="27" fill="url(#hz-top)" />
      {/* dusk lying across the polish */}
      <ellipse cx="800" cy="608" rx="497" ry="27" fill="url(#hz-emit)" opacity="0.1" />
      {/* the back edge catching the horizon direct */}
      <path d="M 315 602 A 497 27 0 0 1 1285 602" fill="none" stroke="#ffcf8e" strokeWidth="1.6" opacity="0.6" filter="url(#hz-blur2)" />

      {/* brass rings inlaid flush in the stone */}
      <ellipse cx="800" cy="609" rx="420" ry="21.5" fill="none" stroke="#d8a95c" strokeWidth="1.3" opacity="0.6" />
      <ellipse cx="800" cy="609" rx="300" ry="15" fill="none" stroke="#c99c50" strokeWidth="1" opacity="0.42" />
      <ellipse cx="800" cy="609" rx="180" ry="8.6" fill="none" stroke="#c99c50" strokeWidth="1" opacity="0.3" />
    </svg>
  )
}

export default function HorizonCommandTable() {
  const rootRef = useRef<HTMLDivElement>(null)
  const raf = useRef(0)

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

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
    <main ref={rootRef} className="hz-root" onPointerMove={onPointerMove}>
      {/* the world beyond the glass */}
      <div className="hz-view" aria-hidden="true">
        <svg className="hz-viewstars" viewBox="0 0 1600 340" preserveAspectRatio="xMidYMid slice">
          {STARS.map((s, i) => (
            <circle key={i} className="hz-star" cx={s.x} cy={s.y} r={s.r} fill="#f2e9d4" opacity={s.o} />
          ))}
        </svg>
        <div className="hz-range far">
          <svg viewBox="0 0 1600 300" preserveAspectRatio="none">
            <path
              d="M0 210 L130 158 L262 190 L400 128 L536 176 L668 140 L810 182 L948 130 L1082 170 L1222 142 L1364 176 L1600 150 L1600 300 L0 300 Z"
              fill="#2c2b40"
            />
          </svg>
        </div>
        <div className="hz-range mid">
          <svg viewBox="0 0 1600 300" preserveAspectRatio="none">
            <path
              d="M0 216 L170 168 L330 204 L500 152 L676 198 L852 160 L1030 202 L1210 168 L1400 200 L1600 178 L1600 300 L0 300 Z"
              fill="#151726"
            />
          </svg>
        </div>
        <div className="hz-range near">
          <svg viewBox="0 0 1600 300" preserveAspectRatio="none">
            <path
              d="M0 230 L210 196 L420 222 L640 190 L860 218 L1080 194 L1300 220 L1600 202 L1600 300 L0 300 Z"
              fill="#0a0d16"
            />
          </svg>
        </div>
        <div className="hz-lake" />
        <div className="hz-sunpath" />
      </div>

      {/* the glass wall and its brass-edged mullions */}
      <div className="hz-glasswall" aria-hidden="true">
        <i className="hz-mullion m1" />
        <i className="hz-mullion m2" />
        <i className="hz-mullion m3" />
        <i className="hz-mullion m4" />
      </div>
      <div className="hz-head" aria-hidden="true" />
      <div className="hz-sill" aria-hidden="true" />

      {/* the constellation dome */}
      <div className="hz-ceiling hz-wake w1" aria-hidden="true">
        <svg className="hz-dome" viewBox="0 0 1600 198" preserveAspectRatio="none">
          {DOME_LINKS.map(([a, b], i) => (
            <line key={i} x1={DOME_PTS[a].x} y1={DOME_PTS[a].y} x2={DOME_PTS[b].x} y2={DOME_PTS[b].y} />
          ))}
          {DOME_PTS.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={i % 5 === 0 ? 1.6 : 1} />
          ))}
        </svg>
      </div>
      <div className="hz-cove hz-wake w1" aria-hidden="true" />

      {/* black stone columns framing the panorama */}
      <div className="hz-column cl hz-wake w1" aria-hidden="true" />
      <div className="hz-column cr hz-wake w1" aria-hidden="true" />

      {/* the floor: the world mirrored down into the polish */}
      <div className="hz-floor hz-wake w2" aria-hidden="true">
        <div className="hz-floor-mirror">
          <i /><i /><i /><i />
        </div>
        <div className="hz-inlay">
          <i /><i /><i /><i />
        </div>
        <div className="hz-floor-glow" />
      </div>

      {/* the Horizon, and the Core above it */}
      <div className="hz-stage hz-wake w3">
        <CommandTable />
        <div className="hz-rimcast" aria-hidden="true" />
        <div className="hz-corereflect" aria-hidden="true" />

        <div className="hz-core" role="img" aria-label="The Core: a glowing sphere of brass rings turning slowly above the table">
          <div className="hz-halo" aria-hidden="true" />
          <div className="hz-core-scene" aria-hidden="true">
            <div className="hz-gimbal">
              <div className="hz-ring outer" />
              <div className="hz-sphere">
                <div className="hz-ring m0" />
                <div className="hz-ring m1" />
                <div className="hz-ring m2" />
                <div className="hz-ring m3" />
                <div className="hz-ring eq" />
                <div className="hz-ring t1" />
                <div className="hz-ring t2" />
                <div className="hz-ring inner" />
              </div>
            </div>
          </div>
          <div className="hz-heart" aria-hidden="true" />
          <div className="hz-core-star" aria-hidden="true">
            <CompassStar />
          </div>
          <div className="hz-mount" aria-hidden="true" />
        </div>
      </div>

      {/* the plate */}
      <header className="hz-title hz-wake w4">
        <h1>North Star Headquarters</h1>
        <p>One compass. Endless clarity.</p>
      </header>

      <div className="hz-captions hz-wake w4">
        <span>The core is the <b>heart</b>.</span>
        <span>The horizon is the <b>command</b>.</span>
        <span>The stars are the <b>interface</b>.</span>
      </div>

      <div className="hz-grade" aria-hidden="true" />
      <svg className="hz-grain" aria-hidden="true">
        <filter id="hz-grain-f">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#hz-grain-f)" />
      </svg>
    </main>
  )
}
