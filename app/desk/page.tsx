'use client'

import { useEffect, useRef } from 'react'

/* =====================================================================
   NORTH STAR HEADQUARTERS — THE HORIZON, COMMAND TABLE
   The board's hero frame: a circular stone room under a constellation
   dome, its glass opening arched over a dusk horizon; a blade of
   absolute black stone rimmed in emitted light; the Core — a burning
   sphere of brass rings — above its mount. The stars are the interface.
   ===================================================================== */

// Deterministic generators — the same sky on server and client.
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
  y: +(starRand() * starRand() * 330).toFixed(1),
  r: +(0.4 + starRand() * 1.1).toFixed(2),
  o: +(0.2 + starRand() * 0.6).toFixed(2),
}))

// The survey net drawn across the sky itself, as the render has it.
const netRand = seeded(47)
const NET_PTS = Array.from({ length: 22 }, () => ({
  x: +(netRand() * 1560 + 20).toFixed(1),
  y: +(14 + netRand() * netRand() * 260).toFixed(1),
}))
const NET_LINKS = NET_PTS.flatMap((p, i) =>
  NET_PTS
    .map((q, j) => ({ j, d: (p.x - q.x) ** 2 + ((p.y - q.y) * 1.8) ** 2 }))
    .filter(({ j }) => j > i)
    .sort((a, b) => a.d - b.d)
    .slice(0, 2)
    .map(({ j }) => [i, j] as const)
)

// The dome's own web, kept above the arched opening.
// Arch curve (in the arch SVG's 1600×400 space): y = 140 + 190·((x−800)/800)²
const archY = (x: number) => 140 + 190 * ((x - 800) / 800) ** 2
const domeRand = seeded(7)
const DOME_PTS = Array.from({ length: 30 }, () => {
  const x = +(domeRand() * 1600).toFixed(1)
  const lid = Math.max(18, archY(x) - 26)
  return { x, y: +(6 + domeRand() * (lid - 6)).toFixed(1) }
})
const DOME_LINKS = DOME_PTS.flatMap((p, i) =>
  DOME_PTS
    .map((q, j) => ({ j, d: (p.x - q.x) ** 2 + ((p.y - q.y) * 2) ** 2 }))
    .filter(({ j }) => j > i)
    .sort((a, b) => a.d - b.d)
    .slice(0, 2)
    .map(({ j }) => [i, j] as const)
)

// Survey ticks around the tabletop's outer inlaid ring.
const TICKS = Array.from({ length: 24 }, (_, i) => {
  const a = (i * 15 * Math.PI) / 180
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  const major = i % 6 === 0
  const k = 42 / 500
  const r0 = major ? 442 : 450
  const r1 = 466
  return {
    x1: +(800 + cos * r0).toFixed(1),
    y1: +(600 + sin * r0 * k).toFixed(1),
    x2: +(800 + cos * r1).toFixed(1),
    y2: +(600 + sin * r1 * k).toFixed(1),
    major,
  }
})

function CompassStar() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="hz-star-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6d8" />
          <stop offset="0.45" stopColor="#f4d188" />
          <stop offset="1" stopColor="#b0843a" />
        </linearGradient>
      </defs>
      <path
        d="M50 50 L27 27 L45 45 Z M50 50 L73 27 L55 45 Z M50 50 L73 73 L55 55 Z M50 50 L27 73 L45 55 Z"
        fill="#c99a45"
      />
      <path
        d="M50 1 L56 44 L99 50 L56 56 L50 99 L44 56 L1 50 L44 44 Z"
        fill="url(#hz-star-gold)"
        stroke="#fff8e0"
        strokeWidth="0.7"
      />
      <circle cx="50" cy="50" r="4" fill="#fffbe9" />
    </svg>
  )
}

/** The dome: ceiling fill above an elliptical arc of caught light,
 *  with the constellation web living in the dark above it. */
function DomeArch() {
  return (
    <svg className="hz-arch" viewBox="0 0 1600 400" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="hz-arc-emit" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8a5c26" stopOpacity="0.15" />
          <stop offset="0.2" stopColor="#e8ab5c" stopOpacity="0.7" />
          <stop offset="0.5" stopColor="#ffd58c" stopOpacity="0.95" />
          <stop offset="0.8" stopColor="#e8ab5c" stopOpacity="0.7" />
          <stop offset="1" stopColor="#8a5c26" stopOpacity="0.15" />
        </linearGradient>
        <radialGradient id="hz-dome-warm" cx="0.5" cy="1.1" r="0.9">
          <stop offset="0" stopColor="#241a10" />
          <stop offset="0.45" stopColor="#0d0a07" />
          <stop offset="1" stopColor="#030303" />
        </radialGradient>
        <filter id="hz-arc-blur" x="-10%" y="-60%" width="120%" height="220%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {/* the ceiling: everything above the opening */}
      <path d="M 0 400 L 0 0 L 1600 0 L 1600 400 Q 800 -50 0 400 Z" fill="url(#hz-dome-warm)" />

      {/* the constellation web, in the dome's dark */}
      <g stroke="rgba(195,154,82,0.16)" strokeWidth="0.8">
        {DOME_LINKS.map(([a, b], i) => (
          <line key={i} x1={DOME_PTS[a].x} y1={DOME_PTS[a].y} x2={DOME_PTS[b].x} y2={DOME_PTS[b].y} />
        ))}
      </g>
      <g fill="rgba(240,212,146,0.8)">
        {DOME_PTS.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i % 5 === 0 ? 1.7 : 1} />
        ))}
      </g>

      {/* the rim of the opening, burning at 2700 K */}
      <path d="M 0 400 Q 800 -50 1600 400" fill="none" stroke="url(#hz-arc-emit)" strokeWidth="10" opacity="0.55" filter="url(#hz-arc-blur)" />
      <path d="M 0 400 Q 800 -50 1600 400" fill="none" stroke="url(#hz-arc-emit)" strokeWidth="2.6" />
    </svg>
  )
}

/** The Horizon itself, over the full frame so every datum stays in register. */
function CommandTable() {
  return (
    <svg
      className="hz-table"
      viewBox="0 0 1600 900"
      preserveAspectRatio="none"
      aria-label="The Horizon command table: a wide ellipse of black stone with brass rings inlaid in its surface, its rim emitting warm light"
    >
      <defs>
        <linearGradient id="hz-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#332619" />
          <stop offset="0.3" stopColor="#191410" />
          <stop offset="1" stopColor="#080706" />
        </linearGradient>
        <linearGradient id="hz-rimface" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0e0b09" />
          <stop offset="0.6" stopColor="#060505" />
          <stop offset="1" stopColor="#020202" />
        </linearGradient>
        <linearGradient id="hz-stem2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#020202" />
          <stop offset="0.34" stopColor="#0b0a09" />
          <stop offset="0.5" stopColor="#1d1814" />
          <stop offset="0.66" stopColor="#0b0a09" />
          <stop offset="1" stopColor="#020202" />
        </linearGradient>
        <linearGradient id="hz-emit" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c9862e" stopOpacity="0.12" />
          <stop offset="0.18" stopColor="#f4b45e" stopOpacity="0.8" />
          <stop offset="0.5" stopColor="#ffdb98" stopOpacity="1" />
          <stop offset="0.82" stopColor="#f4b45e" stopOpacity="0.8" />
          <stop offset="1" stopColor="#c9862e" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id="hz-inlay-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8a6a32" />
          <stop offset="0.3" stopColor="#ecc276" />
          <stop offset="0.55" stopColor="#ffe2a4" />
          <stop offset="0.8" stopColor="#d8a95c" />
          <stop offset="1" stopColor="#7a5c2c" />
        </linearGradient>
        <filter id="hz-blur8" x="-30%" y="-300%" width="160%" height="700%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id="hz-blur18" x="-30%" y="-120%" width="160%" height="340%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <filter id="hz-blur2" x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>

      {/* the table's shadow, pooled beneath the foot */}
      <ellipse cx="800" cy="812" rx="500" ry="40" fill="#000" opacity="0.7" filter="url(#hz-blur18)" />

      {/* the stem: one manta sweep from the blade's underside to the stone */}
      <path
        d="M 716 636
           C 732 676, 742 692, 744 706
           C 746 742, 690 772, 618 792
           L 982 792
           C 910 772, 854 742, 856 706
           C 858 692, 868 676, 884 636
           Z"
        fill="url(#hz-stem2)"
      />
      {/* horizon light grazing the stem's flanks */}
      <path d="M 736 650 C 744 684 748 696 742 716 C 736 748 692 770 650 786" fill="none" stroke="#b97f3c" strokeWidth="2" opacity="0.4" filter="url(#hz-blur2)" />
      <path d="M 864 650 C 856 684 852 696 858 716 C 864 748 908 770 950 786" fill="none" stroke="#e0a252" strokeWidth="2.4" opacity="0.6" filter="url(#hz-blur2)" />

      {/* the foot, seated on a hairline of brass */}
      <ellipse cx="800" cy="790" rx="200" ry="19" fill="url(#hz-rimface)" />
      <path d="M 600 792 A 200 19 0 0 0 1000 792" fill="none" stroke="url(#hz-emit)" strokeWidth="1.8" opacity="0.55" />

      {/* the blade: rim face first, then the polished surface over it */}
      <ellipse cx="800" cy="624" rx="502" ry="42" fill="url(#hz-rimface)" />
      {/* the 40 mm edge, emitting 2700 K — bloom, then the sharp line */}
      <path d="M 298 625 A 502 42 0 0 0 1302 625" fill="none" stroke="url(#hz-emit)" strokeWidth="9" opacity="0.55" filter="url(#hz-blur8)" />
      <path d="M 298 625 A 502 42 0 0 0 1302 625" fill="none" stroke="url(#hz-emit)" strokeWidth="2.8" />
      <ellipse cx="800" cy="600" rx="502" ry="42" fill="url(#hz-top)" />
      {/* dusk lying across the polish */}
      <ellipse cx="800" cy="600" rx="502" ry="42" fill="url(#hz-emit)" opacity="0.12" />
      {/* the back edge catching the horizon direct */}
      <path d="M 310 592 A 502 42 0 0 1 1290 592" fill="none" stroke="#ffd292" strokeWidth="2" opacity="0.7" filter="url(#hz-blur2)" />

      {/* brass rings inlaid flush in the stone, with their survey ticks */}
      <ellipse cx="800" cy="600" rx="430" ry="36.1" fill="none" stroke="url(#hz-inlay-gold)" strokeWidth="2" opacity="0.85" />
      <ellipse cx="800" cy="600" rx="330" ry="27.7" fill="none" stroke="url(#hz-inlay-gold)" strokeWidth="1.4" opacity="0.6" />
      <ellipse cx="800" cy="600" rx="215" ry="18.1" fill="none" stroke="url(#hz-inlay-gold)" strokeWidth="1.2" opacity="0.45" />
      <g stroke="#d8a95c">
        {TICKS.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} strokeWidth={t.major ? 2 : 1} opacity={t.major ? 0.85 : 0.5} />
        ))}
      </g>
      {/* the cardinal star inlaid beneath the Core's mount */}
      <g opacity="0.65">
        <path d="M 800 578 L 806 596 L 800 604 L 794 596 Z" fill="url(#hz-inlay-gold)" />
        <path d="M 800 622 L 806 604 L 800 596 L 794 604 Z" fill="url(#hz-inlay-gold)" opacity="0.7" />
        <path d="M 726 600 L 792 605 L 800 600 L 792 595 Z" fill="url(#hz-inlay-gold)" />
        <path d="M 874 600 L 808 605 L 800 600 L 808 595 Z" fill="url(#hz-inlay-gold)" />
      </g>
    </svg>
  )
}

/** Radial seams in the stone, fanning from the table to the room's edge. */
function FloorSpokes() {
  const ends = [-1720, -1220, -760, -340, 340, 760, 1220, 1720]
  return (
    <svg className="hz-spokes" viewBox="0 0 1600 380" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="hz-spoke" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c39a52" stopOpacity="0" />
          <stop offset="0.35" stopColor="#c39a52" stopOpacity="0.28" />
          <stop offset="1" stopColor="#c39a52" stopOpacity="0.06" />
        </linearGradient>
      </defs>
      {ends.map((dx, i) => (
        <line key={i} x1="800" y1="40" x2={800 + dx} y2="380" stroke="url(#hz-spoke)" strokeWidth="1.4" />
      ))}
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
        <svg className="hz-viewstars" viewBox="0 0 1600 330" preserveAspectRatio="xMidYMid slice">
          {STARS.map((s, i) => (
            <circle key={i} className="hz-star" cx={s.x} cy={s.y} r={s.r} fill="#f2e9d4" opacity={s.o} />
          ))}
        </svg>
        <svg className="hz-skynet" viewBox="0 0 1600 330" preserveAspectRatio="xMidYMid slice">
          <g stroke="rgba(200,158,86,0.22)" strokeWidth="0.7">
            {NET_LINKS.map(([a, b], i) => (
              <line key={i} x1={NET_PTS[a].x} y1={NET_PTS[a].y} x2={NET_PTS[b].x} y2={NET_PTS[b].y} />
            ))}
          </g>
          <g fill="rgba(244,214,146,0.9)">
            {NET_PTS.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={i % 4 === 0 ? 1.8 : 1.1} />
            ))}
          </g>
        </svg>
        <div className="hz-range far">
          <svg viewBox="0 0 1600 300" preserveAspectRatio="none">
            <path
              d="M0 210 L92 164 L148 184 L262 130 L342 168 L400 122 L512 170 L586 134 L668 178 L742 146 L810 180 L920 118 L1010 166 L1082 140 L1180 176 L1258 148 L1364 180 L1452 152 L1600 186 L1600 300 L0 300 Z"
              fill="#272a40"
            />
          </svg>
        </div>
        <div className="hz-range mid">
          <svg viewBox="0 0 1600 300" preserveAspectRatio="none">
            <path
              d="M0 216 L128 172 L246 204 L330 158 L442 200 L560 152 L676 198 L790 164 L852 190 L968 148 L1030 192 L1148 162 L1210 198 L1330 170 L1400 200 L1508 176 L1600 198 L1600 300 L0 300 Z"
              fill="#121420"
            />
          </svg>
        </div>
        <div className="hz-range near">
          <svg viewBox="0 0 1600 300" preserveAspectRatio="none">
            <path
              d="M0 230 L170 200 L340 224 L520 194 L700 220 L860 198 L1040 222 L1220 198 L1400 224 L1600 204 L1600 300 L0 300 Z"
              fill="#0a0d18"
            />
          </svg>
        </div>
        <div className="hz-lake" />
        <div className="hz-sunpath" />
      </div>

      {/* the glass: slender brass-edged mullions */}
      <div className="hz-glasswall" aria-hidden="true">
        <i className="hz-mullion m1" />
        <i className="hz-mullion m2" />
        <i className="hz-mullion m3" />
        <i className="hz-mullion m4" />
        <i className="hz-mullion m5" />
        <i className="hz-mullion m6" />
      </div>
      <div className="hz-sill" aria-hidden="true" />

      {/* the dome and its arched opening */}
      <div className="hz-wake w1">
        <DomeArch />
      </div>

      {/* black stone columns at the frame's edge */}
      <div className="hz-column cl hz-wake w1" aria-hidden="true" />
      <div className="hz-column cr hz-wake w1" aria-hidden="true" />

      {/* the floor: the world mirrored down into the polish */}
      <div className="hz-floor hz-wake w2" aria-hidden="true">
        <div className="hz-floor-mirror">
          <i /><i /><i /><i /><i /><i />
        </div>
        <FloorSpokes />
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

      {/* the room's shared warmth, tying every surface to the Core */}
      <div className="hz-bloom" aria-hidden="true" />

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
