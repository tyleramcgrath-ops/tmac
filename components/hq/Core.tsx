'use client'

/**
 * The North Star Core (Bible §04) — the signature artifact. A celestial
 * navigation instrument: engraved astrolabe dial, independent gimbal rings,
 * an eight-point star with four dominant and four secondary points, a dark
 * obsidian body, a controlled central crystal and thin energy filaments.
 *
 * Dimensionality without WebGL: the two orbital rings are split into back
 * and front arcs painted on either side of the body, and their traveling
 * nodes ride a non-uniformly-scaled rotation (a perspective-correct
 * elliptical orbit) with a depth crossfade between a back and a front copy.
 * All continuous animation is transform/opacity only — compositor work.
 *
 * Scale: the dial is 208px across a 1080px stage — ~19% of room height,
 * inside the Bible's 15–20% band, suspended ~176px (≈22in) above the desk.
 */

// Core center in stage coordinates. The room's axis: camera → desk →
// Core → celestial window → the North Star itself (Bible §02).
export const CORE_X = 960
export const CORE_Y = 566

// Ring A: the near-horizontal orbital. Ellipse 96×26 → minor/major = 0.2708.
const A_SQUASH = 0.2708
// Ring B: the near-vertical orbital. Ellipse 30×104 → 0.2885.
const B_SQUASH = 0.2885

/** One faceted kite point of the star. `len` to the tip, `half` base half-width. */
function StarPoint({ angle, len, half }: { angle: number; len: number; half: number }) {
  return (
    <g transform={`rotate(${angle})`}>
      <polygon points={`0,${-len} 0,-8 ${-half},-14`} className="hq-facet-dark" />
      <polygon points={`0,${-len} 0,-8 ${half},-14`} className="hq-facet-light" />
      <polygon points={`0,${-len} ${half},-14 0,-8 ${-half},-14`} className="hq-facet-edge" />
    </g>
  )
}

/**
 * A gimbal ring: a tilted circle projected to an ellipse (via a single-axis
 * squash) with a light bead that travels its circumference. Drawn behind the
 * obsidian body, so the ring and bead duck behind the star at their near/far
 * crossings — an armillary depth read without WebGL.
 *
 * The bead orbits in circular space inside the same squash, so `orbitClass`
 * only ever rotates about the geometric origin. The symmetrizer circle keeps
 * that group's bounding box centered on the origin so `transform-box:
 * fill-box` (see hq.css) resolves `transform-origin: center` to (0,0) — the
 * one reliable, un-minifiable way to pin an SVG rotation to the viewBox
 * center.
 */
function GimbalRing({
  tilt,
  radius,
  squash,
  axis,
  orbitClass,
}: {
  tilt: number
  radius: number
  squash: number
  axis: 'x' | 'y'
  orbitClass: string
}) {
  const flatten = axis === 'x' ? `scale(1,${squash})` : `scale(${squash},1)`
  const round = axis === 'x' ? `scale(1,${(1 / squash).toFixed(4)})` : `scale(${(1 / squash).toFixed(4)},1)`
  return (
    <g transform={`rotate(${tilt})`}>
      <g transform={flatten}>
        <circle r={radius} className="hq-ring" />
        <g className={orbitClass}>
          {/* Symmetrizer — invisible, forces a centered fill-box. */}
          <circle r={radius} fill="none" stroke="none" />
          <g transform="translate(0,0)">
            <g transform={`translate(${radius},0)`}>
              <g transform={round}>
                <circle r="4" className="hq-node-halo" />
                <circle r="2.2" className="hq-node" />
              </g>
            </g>
          </g>
        </g>
      </g>
    </g>
  )
}

const PARTICLES: { x: number; y: number; d: number; delay: number }[] = [
  { x: -122, y: -44, d: 14, delay: 0 },
  { x: 112, y: -82, d: 17, delay: -3 },
  { x: -72, y: 92, d: 15, delay: -6 },
  { x: 132, y: 58, d: 19, delay: -2 },
  { x: -142, y: 28, d: 16, delay: -8 },
  { x: 58, y: -132, d: 18, delay: -5 },
  { x: 92, y: 122, d: 15, delay: -9 },
  { x: -42, y: -142, d: 20, delay: -4 },
  { x: 18, y: 142, d: 16, delay: -7 },
]

export function Core({ waveKey }: { waveKey: number }) {
  return (
    <div className="hq-core-field" aria-hidden>
      {/* Projection light rising from the desk base to the instrument. */}
      <div className="hq-beam" />
      {/* Warm pool the instrument casts onto the walnut. */}
      <div className="hq-desk-glow" />

      {/* The completion wave — a single refined light wave (Bible §05). */}
      <div className="hq-wave" key={waveKey} />

      {/* Suspended dust motes around the instrument. */}
      <div className="hq-particles">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            style={{
              left: `${CORE_X + p.x}px`,
              top: `${CORE_Y + p.y}px`,
              animationDuration: `${p.d}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <svg
        className="hq-core"
        viewBox="-160 -160 320 320"
        style={{ left: CORE_X - 160, top: CORE_Y - 160 }}
      >
        <defs>
          <linearGradient id="hq-ring-brass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E0C496" />
            <stop offset="0.5" stopColor="#C9A877" />
            <stop offset="1" stopColor="#8a744f" />
          </linearGradient>
          <radialGradient id="hq-obsidian" cx="0.38" cy="0.32" r="0.85">
            <stop offset="0" stopColor="#26262e" />
            <stop offset="0.55" stopColor="#121217" />
            <stop offset="1" stopColor="#08080b" />
          </radialGradient>
          <linearGradient id="hq-facet-light" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#F7F1E2" />
            <stop offset="0.6" stopColor="#E3CD9E" />
            <stop offset="1" stopColor="#C9A877" />
          </linearGradient>
          <linearGradient id="hq-facet-dark" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#D9C08C" />
            <stop offset="0.6" stopColor="#B29564" />
            <stop offset="1" stopColor="#8a744f" />
          </linearGradient>
          <radialGradient id="hq-crystal" cx="0.5" cy="0.45" r="0.6">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.55" className="hq-crystal-stop" />
            <stop offset="1" stopColor="#C9A877" stopOpacity="0.4" />
          </radialGradient>
          <radialGradient id="hq-halo" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" className="hq-halo-stop" />
            <stop offset="1" stopColor="#FFF7E8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ——— The astrolabe dial (outer ring, concentric) ——— */}
        <g className="hq-dial">
          <circle r="104" fill="none" stroke="url(#hq-ring-brass)" strokeWidth="3" />
          <circle r="92" fill="none" stroke="#6d5a3e" strokeWidth="1" opacity="0.6" />
          {/* Engraved minute track — drifts almost imperceptibly at rest. */}
          <g className="hq-dial-ticks">
            <circle r="98" fill="none" stroke="#C9A877" strokeWidth="5" strokeDasharray="1.3 8.9557" opacity="0.45" />
          </g>
          {/* Cardinal coordinate marks. */}
          <g stroke="#D9C08C" strokeWidth="2" opacity="0.85">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <line key={a} x1="0" y1="-91" x2="0" y2="-103" transform={`rotate(${a})`} />
            ))}
          </g>
          {/* Brass lozenges at the four cardinal coordinates. */}
          {[0, 90, 180, 270].map((a) => (
            <g key={`d-${a}`} transform={`rotate(${a})`}>
              <rect x="-3" y="-107.5" width="6" height="6" fill="#E0C496" transform="rotate(45 0 -104.5)" />
            </g>
          ))}
        </g>

        {/* ——— Gimbal rings on independent axes, behind the body ——— */}
        <GimbalRing tilt={-6} radius={96} squash={A_SQUASH} axis="x" orbitClass="hq-orbitA" />
        <GimbalRing tilt={14} radius={104} squash={B_SQUASH} axis="y" orbitClass="hq-orbitB" />

        {/* ——— Obsidian body ——— */}
        <circle r="56" fill="url(#hq-obsidian)" />
        <circle r="56" fill="none" stroke="#30303a" strokeWidth="1.4" />
        <path d="M-40 -28 A49 49 0 0 1 -8 -48.5" fill="none" stroke="#F4F0E6" strokeOpacity="0.09" strokeWidth="7" strokeLinecap="round" />

        <g className="hq-star-breath">
          {/* ——— Energy filaments: crystal → points → dial ——— */}
          <g className="hq-filaments" fill="none">
            {[0, 90, 180, 270].map((a) => (
              <g key={a} transform={`rotate(${a})`}>
                <path className="hq-fil" d="M0 -11 Q2.5 -48 0 -84" />
                <path className="hq-fil-anchor" d="M0 -88 L0 -100.5" />
              </g>
            ))}
            {[45, 135, 225, 315].map((a) => (
              <g key={a} transform={`rotate(${a})`}>
                <path className="hq-fil hq-fil-minor" d="M0 -10 Q-1.5 -30 0 -50" />
              </g>
            ))}
          </g>

          {/* ——— The eight-point star ——— */}
          <g className="hq-star">
            {[45, 135, 225, 315].map((a) => (
              <StarPoint key={a} angle={a} len={54} half={5.5} />
            ))}
            {[0, 90, 180, 270].map((a) => (
              <StarPoint key={a} angle={a} len={88} half={7.5} />
            ))}
            {/* Speaking light — travels through the dominant points. */}
            {[0, 90, 180, 270].map((a, i) => (
              <polygon
                key={`glow-${a}`}
                points="0,-88 7.5,-14 0,-8 -7.5,-14"
                className="hq-point-glow"
                transform={`rotate(${a})`}
                style={{ animationDelay: `${i * 0.14}s` }}
              />
            ))}
          </g>

          {/* ——— The crystal ——— */}
          <circle r="19" fill="url(#hq-halo)" className="hq-halo" />
          <circle r="8.5" fill="url(#hq-crystal)" className="hq-crystal" />
          <g className="hq-sparkle" stroke="#FFFDF6" strokeWidth="0.7" opacity="0.55">
            <line x1="-15" y1="0" x2="15" y2="0" />
            <line x1="0" y1="-15" x2="0" y2="15" />
          </g>
        </g>

        {/* ——— Front glint: the near sweep of ring A passes over the body ——— */}
        <g transform="rotate(-6)">
          <path d="M-96 0 A96 26 0 0 1 96 0" className="hq-ring-front" />
        </g>
      </svg>

      {/* Believable presence: the instrument's reflection in the lacquer. */}
      <svg className="hq-core-reflection" viewBox="-110 -10 220 80" style={{ left: CORE_X - 110, top: 858 }}>
        <g transform="scale(1,0.3)">
          <g transform="translate(0,110) scale(1,-1) translate(0,88)">
            <polygon points="0,-88 7.5,-14 0,-8 -7.5,-14" fill="#E8D9B0" />
            <polygon points="0,88 7.5,14 0,8 -7.5,14" fill="#E8D9B0" />
            <polygon points="-88,0 -14,-7.5 -8,0 -14,7.5" fill="#E8D9B0" />
            <polygon points="88,0 14,-7.5 8,0 14,7.5" fill="#E8D9B0" />
            <circle r="10" fill="#FFF7E8" />
          </g>
        </g>
      </svg>
    </div>
  )
}
