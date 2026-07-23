'use client'

/**
 * Architectural shell (Bible §14): room, windows, ceiling, columns, floor
 * and reflections. Drawn as one SVG in stage coordinates so occlusion is
 * guaranteed by paint order — the exterior (rendered beneath) is only ever
 * visible through the true window apertures.
 *
 * Composition per Bible §02: strong central axis, arched celestial window,
 * architectural symmetry, columns, ceiling ribs, floor reflections. No
 * permanent sidebar, no app chrome.
 */

// The grand arch: springs at y=600 from x=540..1380, radius 420, apex y=180.
const ARCH = 'M540 764 L540 600 A420 420 0 0 1 1380 600 L1380 764 Z'
// Flanking slit windows, arched tops.
const SLIT_L = 'M290 704 L290 296 Q290 266 320 266 Q350 266 350 296 L350 704 Z'
const SLIT_R = 'M1570 704 L1570 296 Q1570 266 1600 266 Q1630 266 1630 296 L1630 704 Z'

/** Radial mullion spokes of the arch, from the spring center (960,600). */
const SPOKES = [
  [960, 180],
  [1120.7, 212],
  [799.3, 212],
  [1257, 303],
  [663, 303],
  [1348, 439.3],
  [572, 439.3],
] as const

function Column({ cx, w }: { cx: number; w: number }) {
  const x = cx - w / 2
  return (
    <g>
      {/* Shaft with a center highlight so it reads as turned stone. */}
      <rect x={x} y={150} width={w} height={610} fill="url(#hq-col-shaft)" />
      <rect x={x} y={150} width={1.5} height={610} fill="#000" opacity={0.5} />
      <rect x={x + w - 1.5} y={150} width={1.5} height={610} fill="#000" opacity={0.5} />
      {/* Fluting. */}
      <rect x={cx - w * 0.26} y={162} width={1} height={586} fill="#000" opacity={0.28} />
      <rect x={cx} y={162} width={1} height={586} fill="#000" opacity={0.22} />
      <rect x={cx + w * 0.26} y={162} width={1} height={586} fill="#000" opacity={0.28} />
      {/* Capital and base with brass reveals. */}
      <rect x={x - 7} y={150} width={w + 14} height={34} fill="url(#hq-col-cap)" />
      <rect x={x - 7} y={181} width={w + 14} height={2.5} className="hq-brass-reveal" />
      <rect x={x - 9} y={726} width={w + 18} height={34} fill="url(#hq-col-cap)" />
      <rect x={x - 9} y={726} width={w + 18} height={2} className="hq-brass-reveal" opacity={0.7} />
    </g>
  )
}

export function Architecture() {
  return (
    <svg className="hq-architecture" viewBox="0 0 1920 1080" aria-hidden>
      <defs>
        <linearGradient id="hq-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a1a20" />
          <stop offset="0.55" stopColor="#141419" />
          <stop offset="1" stopColor="#0f0f13" />
        </linearGradient>
        <linearGradient id="hq-ceiling" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a0a0d" />
          <stop offset="1" stopColor="#17171d" />
        </linearGradient>
        <linearGradient id="hq-entab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d1d24" />
          <stop offset="1" stopColor="#121217" />
        </linearGradient>
        <linearGradient id="hq-col-shaft" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#121216" />
          <stop offset="0.35" stopColor="#26262e" />
          <stop offset="0.5" stopColor="#2c2c35" />
          <stop offset="0.65" stopColor="#26262e" />
          <stop offset="1" stopColor="#121216" />
        </linearGradient>
        <linearGradient id="hq-col-cap" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#17171c" />
          <stop offset="0.5" stopColor="#30303a" />
          <stop offset="1" stopColor="#17171c" />
        </linearGradient>
        <linearGradient id="hq-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c0c0f" />
          <stop offset="0.5" stopColor="#101014" />
          <stop offset="1" stopColor="#16161b" />
        </linearGradient>
        <linearGradient id="hq-pool" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="hq-pool-stop-a" />
          <stop offset="1" className="hq-pool-stop-b" />
        </linearGradient>
        <linearGradient id="hq-inlay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C9A877" stopOpacity="0.55" />
          <stop offset="1" stopColor="#C9A877" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="hq-frame-brass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a744f" />
          <stop offset="1" stopColor="#5a4c36" />
        </linearGradient>
      </defs>

      {/* ——— Ceiling ——— */}
      <rect x="0" y="0" width="1920" height="150" fill="url(#hq-ceiling)" />
      <g className="hq-ribs" fill="none">
        <path d="M140 150 Q960 -60 1780 150" stroke="#24242c" strokeWidth="6" />
        <path d="M300 128 Q960 -32 1620 128" stroke="#212129" strokeWidth="4.5" />
        <path d="M470 108 Q960 -6 1450 108" stroke="#1e1e26" strokeWidth="3.5" />
        <path d="M640 94 Q960 14 1280 94" stroke="#1c1c23" strokeWidth="2.5" />
        {/* The central axis rib — the room's spine, brass, aligned with the Core. */}
        <path d="M960 0 L960 92" className="hq-axis-rib" strokeWidth="2" />
      </g>
      {/* Entablature. */}
      <rect x="0" y="84" width="1920" height="66" fill="url(#hq-entab)" />
      <rect x="0" y="146" width="1920" height="1.5" className="hq-brass-reveal" opacity="0.8" />
      <rect x="0" y="88" width="1920" height="1" fill="#000" opacity="0.5" />

      {/* ——— Wall with true apertures (evenodd) ——— */}
      <path
        d={`M0 148 H1920 V760 H0 Z ${ARCH} ${SLIT_L} ${SLIT_R}`}
        fillRule="evenodd"
        fill="url(#hq-wall)"
      />

      {/* Interior light spilling around the window. */}
      <ellipse cx="960" cy="470" rx="720" ry="360" className="hq-window-spill" />

      {/* ——— Glass: barely-there tint and a diagonal sheen ——— */}
      <g className="hq-glass">
        <path d={ARCH} fill="#9db4c8" opacity="0.028" />
        <path d="M700 764 L980 210 L1060 210 L780 764 Z" fill="#dfe8f0" opacity="0.02" />
        <path d="M1080 764 L1290 330 L1330 350 L1140 764 Z" fill="#dfe8f0" opacity="0.014" />
        <path d={SLIT_L} fill="#9db4c8" opacity="0.03" />
        <path d={SLIT_R} fill="#9db4c8" opacity="0.03" />
      </g>

      {/* ——— Window frame and mullions ——— */}
      <g fill="none">
        {/* Radial spokes. */}
        <g stroke="#332c20" strokeWidth="7">
          {SPOKES.map(([x, y]) => (
            <path key={`${x}-${y}`} d={`M960 600 L${x} ${y}`} />
          ))}
        </g>
        {/* Transom arc. */}
        <path d="M682.8 485.2 A300 300 0 0 1 1237.2 485.2" stroke="#332c20" strokeWidth="7" />
        {/* Spring line and lower verticals. */}
        <path d="M540 600 L1380 600" stroke="#332c20" strokeWidth="9" />
        <path d="M540 684 L1380 684" stroke="#332c20" strokeWidth="6" />
        {[680, 820, 960, 1100, 1240].map((x) => (
          <path key={x} d={`M${x} 600 L${x} 764`} stroke="#332c20" strokeWidth="6" />
        ))}
        {/* Hairline brass edges on the primary members. */}
        <g className="hq-mullion-glint" strokeWidth="1">
          {SPOKES.map(([x, y]) => (
            <path key={`g-${x}-${y}`} d={`M960 600 L${x} ${y}`} />
          ))}
          <path d="M682.8 485.2 A300 300 0 0 1 1237.2 485.2" />
          <path d="M540 600 L1380 600" />
        </g>
        {/* Main frame — a deep casing with a brass reveal. */}
        <path d={ARCH} stroke="#221d15" strokeWidth="20" />
        <path d={ARCH} stroke="#0a0a0c" strokeWidth="26" strokeOpacity="0.35" />
        <path d={ARCH} stroke="url(#hq-frame-brass)" strokeWidth="3.5" />
      </g>

      {/* ——— Slit window frames ——— */}
      <g fill="none">
        <path d={SLIT_L} stroke="#0a0a0c" strokeWidth="12" strokeOpacity="0.5" />
        <path d={SLIT_L} stroke="url(#hq-frame-brass)" strokeWidth="2.5" />
        <path d={SLIT_R} stroke="#0a0a0c" strokeWidth="12" strokeOpacity="0.5" />
        <path d={SLIT_R} stroke="url(#hq-frame-brass)" strokeWidth="2.5" />
        {[382, 486, 590].map((y) => (
          <g key={y} stroke="#332c20" strokeWidth="4">
            <path d={`M290 ${y} L350 ${y}`} />
            <path d={`M1570 ${y} L1630 ${y}`} />
          </g>
        ))}
      </g>

      {/* ——— Datum hairline across the walls at the spring line ——— */}
      <g className="hq-datum">
        <rect x="0" y="591" width="290" height="1.2" />
        <rect x="350" y="591" width="190" height="1.2" />
        <rect x="1380" y="591" width="190" height="1.2" />
        <rect x="1630" y="591" width="290" height="1.2" />
      </g>

      {/* ——— Recessed wall panels flanking the slits ——— */}
      <g fill="none" stroke="#1f1f26" strokeWidth="1.5">
        <rect x="490" y="220" width="40" height="330" rx="2" />
        <rect x="490" y="620" width="40" height="100" rx="2" />
        <rect x="1390" y="220" width="40" height="330" rx="2" />
        <rect x="1390" y="620" width="40" height="100" rx="2" />
      </g>

      {/* ——— Columns: outer pair and inner pilasters ——— */}
      <Column cx={180} w={110} />
      <Column cx={1740} w={110} />
      <Column cx={440} w={80} />
      <Column cx={1480} w={80} />

      {/* ——— Floor: polished graphite marble ——— */}
      <rect x="0" y="756" width="1920" height="324" fill="url(#hq-floor)" />
      <rect x="0" y="756" width="1920" height="2" fill="#000" opacity="0.65" />

      {/* Mirrored light of the celestial window on the stone. */}
      <path className="hq-floor-pool" d="M540 762 L540 838 A420 150 0 0 0 1380 838 L1380 762 Z" fill="url(#hq-pool)" />
      {/* Column reflections. */}
      {[180, 440, 1480, 1740].map((cx) => (
        <rect key={cx} x={cx - 26} y={760} width={52} height={130} fill="url(#hq-col-shaft)" opacity="0.055" />
      ))}
      {/* Central brass inlay running the axis toward the desk. */}
      <polygon points="958.5,760 961.5,760 963.5,1080 956.5,1080" fill="url(#hq-inlay)" />
    </svg>
  )
}
