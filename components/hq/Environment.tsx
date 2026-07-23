'use client'

import type { SkyModel } from '@/lib/hq/state'

/**
 * Environment renderer (Bible §14): sky, weather, time, exterior depth and
 * light. Everything here is clipped to the window apertures (see hq.css
 * .hq-exterior) so the outside world exists only beyond the glass — the
 * exterior and the architecture can never drift out of register.
 *
 * Motion policy (Bible §02): the exterior moves slowly through cloud layers,
 * stars, moonlight, sunrise and rain. It reflects time and system state —
 * never a looping wallpaper for its own sake, and layers fade with state.
 */

/** Deterministic star field — stable across server and client renders. */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const STARS: { x: number; y: number; r: number; o: number; tw: number }[] = (() => {
  const rand = mulberry32(20260723)
  const stars = []
  for (let i = 0; i < 88; i++) {
    stars.push({
      x: Math.round((300 + rand() * 1320) * 10) / 10,
      y: Math.round((120 + rand() * 430) * 10) / 10,
      r: Math.round((0.5 + rand() * 1.2) * 10) / 10,
      o: Math.round((0.25 + rand() * 0.6) * 100) / 100,
      tw: Math.round((6 + rand() * 9) * 10) / 10,
    })
  }
  return stars
})()

export function Environment({ sky }: { sky: SkyModel }) {
  return (
    <div className="hq-exterior" aria-hidden>
      {/* Base sky — gradient driven by time-of-day custom properties. */}
      <div className="hq-sky" />
      {/* Environmental overlay — crossfades on top of the base sky. */}
      <div className="hq-sky-state" />

      {/* Night sky. */}
      <svg className={`hq-stars ${sky.stars ? 'is-on' : ''}`} viewBox="0 0 1920 1080">
        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            style={{ opacity: s.o, animationDuration: `${s.tw}s`, animationDelay: `${-s.tw * ((i % 7) / 7)}s` }}
            className="hq-star-dot"
          />
        ))}
      </svg>

      {/* The North Star — visible on clear nights, held on the room's
          central axis so it aligns with the Core below (Bible §02). */}
      <div className={`hq-northstar ${sky.northStar ? 'is-on' : ''}`}>
        <svg viewBox="-24 -24 48 48">
          <circle cx="0" cy="0" r="14" className="hq-northstar-halo" />
          <path d="M0 -16 L1.6 -2.2 L14 0 L1.6 2.2 L0 16 L-1.6 2.2 L-14 0 L-1.6 -2.2 Z" className="hq-northstar-body" />
        </svg>
      </div>

      <div className={`hq-moon ${sky.moon ? 'is-on' : ''}`} />
      <div className={`hq-sunglow ${sky.sunrise ? 'is-on' : ''}`} />

      {/* Distant terrain — layered atmospheric depth beyond the glass. */}
      <svg className="hq-ridge hq-ridge-far" viewBox="0 0 1920 1080" preserveAspectRatio="none">
        <path d="M0 700 L0 664 L160 648 L340 668 L520 634 L730 662 L940 628 L1150 658 L1330 636 L1540 664 L1720 644 L1920 666 L1920 700 Z" />
      </svg>
      <svg className="hq-ridge hq-ridge-near" viewBox="0 0 1920 1080" preserveAspectRatio="none">
        <path d="M0 760 L0 694 L120 700 L300 682 L460 702 L640 676 L830 700 L1040 680 L1260 702 L1450 684 L1650 704 L1810 690 L1920 700 L1920 760 Z" />
      </svg>

      {/* Cloud strata — three depths, drifting at unequal speeds. */}
      <div className={`hq-clouds hq-clouds-far ${sky.cloudDensity >= 1 ? 'is-on' : ''}`} />
      <div className={`hq-clouds hq-clouds-mid ${sky.cloudDensity >= 1 ? 'is-on' : ''}`} />
      <div className={`hq-clouds hq-clouds-near ${sky.cloudDensity >= 2 ? 'is-on' : ''}`} />

      {/* Weather. */}
      <div className={`hq-rain ${sky.rain ? 'is-on' : ''}`} />
      <div className={`hq-fog ${sky.fog ? 'is-on' : ''}`} />
    </div>
  )
}
