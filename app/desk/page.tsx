'use client'

import { useEffect, useRef } from 'react'

/* =====================================================================
   THE HORIZON — COMMAND TABLE
   Plate no. 03 of North Star Headquarters, built fresh from the board:
   a single ellipse of absolute black stone on a sculpted stem, brass
   rings inlaid flush with the surface, and the Core — a machined brass
   armillary — turning slowly above its mount. The world outside is a
   360° horizon at last light. The stars are the interface.
   ===================================================================== */

// Deterministic starfield — same sky on server and client, every night.
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
}

const rand = seeded(19)
const STARS = Array.from({ length: 110 }, () => ({
  x: +(rand() * 1600).toFixed(1),
  y: +(rand() * rand() * 560).toFixed(1),
  r: +(0.4 + rand() * 1.2).toFixed(2),
  o: +(0.25 + rand() * 0.65).toFixed(2),
}))

// A small asterism, upper left — lines faint, points bright.
const ASTERISM = [
  [305, 128], [392, 96], [472, 150], [560, 118], [610, 196], [532, 248], [447, 214],
] as const

// Inlay tick marks around the tabletop's outer brass ring.
const TABLE_CX = 700
const TABLE_CY = 480
const SQUASH = 60 / 520
const TICKS = Array.from({ length: 24 }, (_, i) => {
  const a = (i * 15 * Math.PI) / 180
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  const major = i % 6 === 0
  const r0 = major ? 438 : 444
  const r1 = 458
  return {
    x1: +(TABLE_CX + cos * r0).toFixed(1),
    y1: +(TABLE_CY + sin * r0 * SQUASH).toFixed(1),
    x2: +(TABLE_CX + cos * r1).toFixed(1),
    y2: +(TABLE_CY + sin * r1 * SQUASH).toFixed(1),
    major,
  }
})

function CompassStar() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="hz-star-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbeec9" />
          <stop offset="0.45" stopColor="#e8c377" />
          <stop offset="1" stopColor="#8f6a2e" />
        </linearGradient>
      </defs>
      {/* diagonal points, behind */}
      <path
        d="M50 50 L26 26 L44 44 Z M50 50 L74 26 L56 44 Z M50 50 L74 74 L56 56 Z M50 50 L26 74 L44 56 Z"
        fill="#a37d38"
      />
      <path
        d="M50 2 L56 44 L98 50 L56 56 L50 98 L44 56 L2 50 L44 44 Z"
        fill="url(#hz-star-gold)"
        stroke="#fff3d6"
        strokeWidth="0.5"
      />
      <circle cx="50" cy="50" r="4.5" fill="#fff6dd" />
    </svg>
  )
}

function CompassRose() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <g fill="none" stroke="#c39a52">
        <circle cx="50" cy="50" r="46" strokeWidth="0.8" opacity="0.7" />
        <circle cx="50" cy="50" r="38" strokeWidth="0.5" opacity="0.45" />
        {Array.from({ length: 36 }, (_, i) => {
          const a = (i * 10 * Math.PI) / 180
          const long = i % 9 === 0
          const r0 = long ? 39 : 42.5
          return (
            <line
              key={i}
              x1={+(50 + Math.cos(a) * r0).toFixed(2)}
              y1={+(50 + Math.sin(a) * r0).toFixed(2)}
              x2={+(50 + Math.cos(a) * 46).toFixed(2)}
              y2={+(50 + Math.sin(a) * 46).toFixed(2)}
              strokeWidth={long ? 1 : 0.5}
              opacity={long ? 0.9 : 0.5}
            />
          )
        })}
      </g>
      <path d="M50 14 L53 47 L50 54 L47 47 Z" fill="#e8c377" />
      <path d="M50 86 L53 53 L50 46 L47 53 Z" fill="#6d5224" />
      <circle cx="50" cy="50" r="2.2" fill="#f0d492" />
    </svg>
  )
}

function CommandTable() {
  return (
    <svg className="hz-table" viewBox="0 0 1400 1000" aria-label="The Horizon command table: an elliptical black stone top on a sculpted stem, brass rings inlaid in the surface">
      <defs>
        <linearGradient id="hz-brassline" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7a5c2c" />
          <stop offset="0.3" stopColor="#e8c377" />
          <stop offset="0.55" stopColor="#f6e2ac" />
          <stop offset="0.8" stopColor="#c39a52" />
          <stop offset="1" stopColor="#6d5224" />
        </linearGradient>
        <radialGradient id="hz-stone-top" cx="0.5" cy="0.38" r="0.75">
          <stop offset="0" stopColor="#1d1d23" />
          <stop offset="0.55" stopColor="#121216" />
          <stop offset="1" stopColor="#08080a" />
        </radialGradient>
        <linearGradient id="hz-stone-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#040405" />
          <stop offset="0.6" stopColor="#0e0e11" />
          <stop offset="1" stopColor="#1a1a20" />
        </linearGradient>
        <linearGradient id="hz-stem" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#040405" />
          <stop offset="0.36" stopColor="#0e0e12" />
          <stop offset="0.5" stopColor="#2a2a33" />
          <stop offset="0.64" stopColor="#0e0e12" />
          <stop offset="1" stopColor="#040405" />
        </linearGradient>
        <linearGradient id="hz-foot-brass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8c377" />
          <stop offset="0.5" stopColor="#a8813f" />
          <stop offset="1" stopColor="#4c3817" />
        </linearGradient>
        <linearGradient id="hz-sheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffcf94" stopOpacity="0.16" />
          <stop offset="0.6" stopColor="#ffcf94" stopOpacity="0.03" />
          <stop offset="1" stopColor="#ffcf94" stopOpacity="0" />
        </linearGradient>
        <filter id="hz-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      {/* grounded: the table's shadow, pooled on the stone */}
      <ellipse cx="700" cy="906" rx="340" ry="36" fill="#000" opacity="0.8" filter="url(#hz-soft)" />

      {/* the stem: one sweep from waist to flare, nothing extra */}
      <path
        d="M 638 505
           C 646 585, 662 615, 665 655
           C 668 735, 612 812, 550 862
           L 850 862
           C 788 812, 732 735, 735 655
           C 738 615, 754 585, 762 505
           Z"
        fill="url(#hz-stem)"
      />

      {/* the foot: stone over a machined brass base ring */}
      <ellipse cx="700" cy="884" rx="250" ry="38" fill="url(#hz-foot-brass)" />
      <ellipse cx="700" cy="872" rx="246" ry="36" fill="url(#hz-stone-rim)" />
      <path d="M 454 884 A 246 36 0 0 0 946 884" fill="none" stroke="url(#hz-brassline)" strokeWidth="1.4" opacity="0.65" />

      {/* the top: knife edge first, then the surface over it */}
      <ellipse cx="700" cy="497" rx="520" ry="60" fill="url(#hz-stone-rim)" />
      <path d="M 180 497 A 520 60 0 0 0 1220 497" fill="none" stroke="url(#hz-brassline)" strokeWidth="1.6" opacity="0.85" />
      <ellipse cx="700" cy="480" rx="520" ry="60" fill="url(#hz-stone-top)" />
      {/* last light, caught in the polish */}
      <ellipse cx="700" cy="480" rx="520" ry="60" fill="url(#hz-sheen)" />

      {/* brass inlaid flush with the stone — rings, then the survey ticks */}
      <ellipse cx="700" cy="480" rx="430" ry="49.6" fill="none" stroke="url(#hz-brassline)" strokeWidth="1.7" opacity="0.85" />
      <ellipse cx="700" cy="480" rx="330" ry="38.1" fill="none" stroke="url(#hz-brassline)" strokeWidth="1.2" opacity="0.6" />
      <ellipse cx="700" cy="480" rx="210" ry="24.2" fill="none" stroke="url(#hz-brassline)" strokeWidth="1" opacity="0.45" />
      <g stroke="#c39a52">
        {TICKS.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} strokeWidth={t.major ? 1.6 : 0.8} opacity={t.major ? 0.8 : 0.45} />
        ))}
      </g>
      {/* the cardinal inlay beneath the Core's mount */}
      <g stroke="url(#hz-brassline)" strokeWidth="1.2" opacity="0.7">
        <line x1="700" y1="466" x2="700" y2="452" />
        <line x1="700" y1="494" x2="700" y2="508" />
        <line x1="580" y1="480" x2="550" y2="480" />
        <line x1="820" y1="480" x2="850" y2="480" />
      </g>
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
      {/* the world outside: night falling on a 360° horizon */}
      <div className="hz-sky" aria-hidden="true">
        <svg className="hz-stars" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
          {STARS.map((s, i) => (
            <circle key={i} className="hz-star" cx={s.x} cy={s.y} r={s.r} fill="#f6ecd6" opacity={s.o} />
          ))}
        </svg>
        <svg className="hz-constellation" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
          {ASTERISM.slice(0, -1).map(([x, y], i) => {
            const [nx, ny] = ASTERISM[i + 1]
            return <line key={i} x1={x} y1={y} x2={nx} y2={ny} />
          })}
          {ASTERISM.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === 3 ? 2.4 : 1.4} />
          ))}
          {/* the north star flares, just barely */}
          <g stroke="rgba(240,212,146,0.5)" strokeWidth="0.7">
            <line x1="560" y1="104" x2="560" y2="132" />
            <line x1="546" y1="118" x2="574" y2="118" />
          </g>
        </svg>
      </div>

      <div className="hz-ridge" aria-hidden="true">
        <svg viewBox="0 0 1600 300" preserveAspectRatio="none">
          <path
            d="M0 196 L110 148 L214 176 L342 118 L470 168 L586 132 L724 174 L862 122 L988 164 L1120 136 L1258 170 L1396 144 L1600 178 L1600 300 L0 300 Z"
            fill="#141c2e"
          />
          <path
            d="M0 238 L156 200 L322 226 L488 186 L668 220 L846 192 L1024 226 L1210 200 L1408 228 L1600 208 L1600 300 L0 300 Z"
            fill="#0a0e18"
          />
        </svg>
      </div>

      <div className="hz-water" aria-hidden="true" />

      <div className="hz-glass" aria-hidden="true">
        <i /><i /><i /><i />
      </div>

      {/* the floor: one black disc, rings of brass set into it */}
      <div className="hz-floor hz-wake w1" aria-hidden="true">
        <div className="hz-floor-rings">
          <i /><i /><i /><i />
        </div>
      </div>

      {/* the centerpiece: the Horizon, and the Core above it */}
      <div className="hz-stage hz-wake w2">
        <div className="hz-table-glow" aria-hidden="true" />
        <CommandTable />
        <div className="hz-core-pool" aria-hidden="true" />

        <div className="hz-core" role="img" aria-label="The Core: a brass armillary compass turning slowly above the table">
          <div className="hz-core-halo" aria-hidden="true" />
          <div className="hz-core-scene" aria-hidden="true">
            <div className="hz-gimbal">
              <div className="hz-ring outer" />
              <div className="hz-sphere">
                <div className="hz-ring m0" />
                <div className="hz-ring m1" />
                <div className="hz-ring m2" />
                <div className="hz-ring eq" />
                <div className="hz-ring tilt" />
              </div>
            </div>
          </div>
          <div className="hz-core-star" aria-hidden="true">
            <CompassStar />
          </div>
          <div className="hz-core-mount" aria-hidden="true" />
        </div>
      </div>

      {/* the plate: engraved titles, quiet specification */}
      <div className="hz-frame" aria-hidden="true" />

      <header className="hz-title hz-wake w3">
        <p className="hz-eyebrow">North Star Headquarters</p>
        <h1>
          The <em>Horizon</em>
        </h1>
        <p className="hz-plate-no">Command Table · Plate 03</p>
      </header>

      <div className="hz-rose hz-wake w3" aria-hidden="true">
        <CompassRose />
      </div>

      <p className="hz-caption hz-wake w4">
        The core is the <b>heart</b>. The horizon is the <b>command</b>. The stars are the <b>interface</b>.
      </p>

      <p className="hz-motto hz-wake w4">One Compass · Endless Clarity</p>

      <dl className="hz-spec hz-wake w4">
        <dt>Stone</dt>
        <dd>Absolute black · honed</dd>
        <dt>Metal</dt>
        <dd>Brass · polished</dd>
        <dt>Height</dt>
        <dd>740 mm</dd>
        <dt>Light</dt>
        <dd>2700 K</dd>
      </dl>

      <div className="hz-vignette" aria-hidden="true" />
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
