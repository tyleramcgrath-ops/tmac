'use client'

import { useEffect, useRef, useState } from 'react'
import type { DigitalDnaArea, DigitalDnaUnderstanding } from '@/lib/north-star-preview-data'

/**
 * The Living Digital DNA sculpture — a continuous particle-flow field, not a
 * chart or network graph. One breathing core (the business) constantly
 * exchanges flowing particles with each knowledge region; density and color
 * of the flow — not a percentage — communicate how well that area is
 * understood. Regions never render as connected nodes-and-lines; there is
 * no rigid geometry, only motion.
 */

const STATE_RGB: Record<DigitalDnaUnderstanding, [number, number, number]> = {
  'well-understood': [232, 201, 138],
  'partially-understood': [127, 168, 216],
  'needs-verification': [139, 147, 166],
  'not-connected': [58, 61, 69],
}
const STATE_LABEL: Record<DigitalDnaUnderstanding, string> = {
  'well-understood': 'Understood',
  'partially-understood': 'Developing',
  'needs-verification': 'Needs confirmation',
  'not-connected': 'Not connected',
}
const DENSITY: Record<DigitalDnaUnderstanding, number> = {
  'well-understood': 70,
  'partially-understood': 42,
  'needs-verification': 20,
  'not-connected': 7,
}

interface Region {
  key: string
  label: string
  understanding: DigitalDnaUnderstanding
  x: number
  y: number
  isHub: boolean
}

interface Particle {
  regionKey: string
  t: number
  speed: number
  curve: number
  size: number
  phase: number
}

function strengthenHint(u: DigitalDnaUnderstanding): string {
  switch (u) {
    case 'not-connected': return 'Connecting a new source or running another check will start building this out.'
    case 'needs-verification': return 'A few more checks over time would confirm this.'
    case 'partially-understood': return 'Checking additional pages or connecting another source would complete this picture.'
    case 'well-understood': return 'This is solid. Occasional re-checks will keep it current.'
  }
}

function layout(areas: DigitalDnaArea[], w: number, h: number): Region[] {
  const cx = w / 2
  const cy = h / 2 - h * 0.06
  const rx = w * 0.36
  const ry = h * 0.34
  const hub = areas.find((a) => a.key === 'identity')
  const spokes = areas.filter((a) => a.key !== 'identity')
  const regions: Region[] = []
  if (hub) regions.push({ key: hub.key, label: hub.label, understanding: hub.understanding, x: cx, y: cy, isHub: true })
  spokes.forEach((a, i) => {
    const angle = (i / spokes.length) * Math.PI * 2 - Math.PI / 2
    regions.push({ key: a.key, label: a.label, understanding: a.understanding, x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle), isHub: false })
  })
  return regions
}

function bezierPoint(p0: { x: number; y: number }, p1: { x: number; y: number }, ctrl: { x: number; y: number }, t: number) {
  const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * ctrl.x + t * t * p1.x
  const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * ctrl.y + t * t * p1.y
  return { x, y }
}

export function DnaSculpture({
  areas,
  pagesChecked,
  selectedKey,
  activeKey,
  onSelect,
  onAskCompass,
}: {
  areas: DigitalDnaArea[]
  pagesChecked: number
  selectedKey: string | null
  activeKey: string | null
  onSelect: (key: string) => void
  onAskCompass?: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const [dims, setDims] = useState({ w: 1100, h: 460 })
  const regionsRef = useRef<Region[]>([])
  const particlesRef = useRef<Particle[]>([])
  const stateRef = useRef({ selectedKey, hoveredKey: null as string | null, activeKey })
  stateRef.current.selectedKey = selectedKey
  stateRef.current.hoveredKey = hoveredKey
  stateRef.current.activeKey = activeKey

  // Responsive sizing
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => setDims({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Rebuild regions + particles whenever areas or size change
  useEffect(() => {
    const regions = layout(areas, dims.w, dims.h)
    regionsRef.current = regions
    const particles: Particle[] = []
    regions.forEach((r) => {
      if (r.isHub) return
      const density = DENSITY[r.understanding]
      for (let i = 0; i < density; i++) {
        particles.push({
          regionKey: r.key,
          t: Math.random(),
          speed: 0.0009 + Math.random() * 0.0012,
          curve: (Math.random() - 0.5) * 0.55,
          size: 0.6 + Math.random() * 1.7,
          phase: Math.random() * Math.PI * 2,
        })
      }
    })
    particlesRef.current = particles
  }, [areas, dims.w, dims.h])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = dims.w * dpr
    canvas.height = dims.h * dpr
    canvas.style.width = `${dims.w}px`
    canvas.style.height = `${dims.h}px`
    ctx.scale(dpr, dpr)

    let raf = 0
    const hubRegion = () => regionsRef.current.find((r) => r.isHub)

    function paint(time: number) {
      const w = dims.w, h = dims.h
      const hub = hubRegion()
      if (!hub) return

      ctx!.clearRect(0, 0, w, h)
      ctx!.fillStyle = 'rgba(11,11,13,1)'
      ctx!.fillRect(0, 0, w, h)

      const breathe = reduceMotion ? 0.5 : Math.sin(time / 1600) * 0.5 + 0.5
      const { selectedKey: sel, hoveredKey: hov, activeKey: act } = stateRef.current
      const anyFocus = sel || hov

      // region glows
      regionsRef.current.forEach((r) => {
        if (r.isHub) return
        const c = STATE_RGB[r.understanding]
        const isFocused = sel === r.key || hov === r.key
        const isActive = act === r.key
        const dimmed = anyFocus && !isFocused
        const baseR = 20 + (r.understanding === 'well-understood' ? 16 : r.understanding === 'partially-understood' ? 10 : r.understanding === 'needs-verification' ? 5 : 0)
        const radius = baseR * (isFocused ? 1.5 : isActive ? 1.25 : 1)
        const baseAlpha = r.understanding === 'not-connected' ? 0.05 : 0.15
        const alpha = (baseAlpha + (isFocused ? 0.12 : 0) + (isActive ? 0.1 : 0)) * (dimmed ? 0.35 : 1)
        const grad = ctx!.createRadialGradient(r.x, r.y, 0, r.x, r.y, radius)
        grad.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${alpha})`)
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx!.fillStyle = grad
        ctx!.beginPath()
        ctx!.arc(r.x, r.y, radius, 0, Math.PI * 2)
        ctx!.fill()
      })

      // core
      const coreActive = act === hub.key
      const coreR = (26 + breathe * 4) * (coreActive ? 1.15 : 1)
      const coreGrad = ctx!.createRadialGradient(hub.x, hub.y, 0, hub.x, hub.y, coreR * 2.3)
      coreGrad.addColorStop(0, `rgba(240,222,180,${0.5 + breathe * 0.2})`)
      coreGrad.addColorStop(0.4, 'rgba(201,168,119,0.24)')
      coreGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx!.fillStyle = coreGrad
      ctx!.beginPath()
      ctx!.arc(hub.x, hub.y, coreR * 2.3, 0, Math.PI * 2)
      ctx!.fill()
      ctx!.fillStyle = 'rgba(243,239,230,0.92)'
      ctx!.beginPath()
      ctx!.arc(hub.x, hub.y, 9, 0, Math.PI * 2)
      ctx!.fill()

      // particles flowing core <-> region
      particlesRef.current.forEach((p) => {
        const region = regionsRef.current.find((r) => r.key === p.regionKey)
        if (!region) return
        if (!reduceMotion) {
          p.t += p.speed
          if (p.t > 1) p.t = 0
        }
        const t = reduceMotion ? 0.5 : p.t
        const mid = { x: (hub.x + region.x) / 2 + (region.y - hub.y) * p.curve, y: (hub.y + region.y) / 2 + (hub.x - region.x) * p.curve }
        const pos = bezierPoint(hub, region, mid, t)
        const c = STATE_RGB[region.understanding]
        const isFocused = sel === region.key || hov === region.key
        const isActive = act === region.key
        const dimmed = anyFocus && !isFocused
        const twinkle = reduceMotion ? 0.8 : 0.5 + 0.5 * Math.sin(time / 420 + p.phase)
        const base = region.understanding === 'not-connected' ? 0.08 : 0.34
        const alpha = base * twinkle * (isFocused ? 1.7 : isActive ? 1.35 : 1) * (dimmed ? 0.3 : 1)
        ctx!.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`
        ctx!.beginPath()
        ctx!.arc(pos.x, pos.y, p.size * (isFocused ? 1.3 : 1), 0, Math.PI * 2)
        ctx!.fill()
      })

      if (!reduceMotion) raf = requestAnimationFrame(paint)
    }

    raf = requestAnimationFrame(paint)
    return () => cancelAnimationFrame(raf)
  }, [dims])

  const handlePointer = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    let closest: string | null = null
    let dist = 42
    regionsRef.current.forEach((r) => {
      if (r.isHub) return
      const d = Math.hypot(mx - r.x, my - r.y)
      if (d < dist) { dist = d; closest = r.key }
    })
    setHoveredKey(closest)
  }

  const selected = areas.find((a) => a.key === selectedKey)
  const understood = areas.filter((a) => a.understanding === 'well-understood').length
  // Computed directly from render-time state (not the ref the animation loop
  // mutates in an effect) so accessible hit-targets and labels never lag a
  // frame behind the canvas — a stale ref here was an intermittent dead
  // click target on first mount, before the resize-driven effect had run.
  const regions = layout(areas, dims.w, dims.h)

  return (
    <section aria-label="Digital DNA — North Star's living understanding of your business">
      <div className="office-dna-wrap" ref={wrapRef}>
        <canvas
          ref={canvasRef}
          onMouseMove={handlePointer}
          onMouseLeave={() => setHoveredKey(null)}
          onClick={() => { if (hoveredKey) onSelect(hoveredKey) }}
          style={{ cursor: hoveredKey ? 'pointer' : 'default', display: 'block' }}
        />
        {/* Accessible, keyboard-focusable hit targets — invisible, positioned over each region */}
        {regions.filter((r) => !r.isHub).map((r) => (
          <button
            key={r.key}
            onClick={() => onSelect(r.key)}
            onFocus={() => setHoveredKey(r.key)}
            onBlur={() => setHoveredKey((k) => (k === r.key ? null : k))}
            aria-pressed={selectedKey === r.key}
            aria-label={`${r.label}: ${STATE_LABEL[r.understanding]}`}
            style={{
              position: 'absolute', left: r.x - 22, top: r.y - 22, width: 44, height: 44,
              background: 'transparent', border: 'none', borderRadius: '50%',
            }}
          />
        ))}
        {/* Static labels — always legible regardless of canvas motion */}
        {regions.map((r) => (
          <span
            key={r.key}
            aria-hidden="true"
            className="office-dna-label"
            data-major={r.isHub || r.key === 'services' || r.key === 'website'}
            style={{ left: r.x, top: r.y + (r.isHub ? 40 : 26), pointerEvents: 'none', position: 'absolute' }}
          >
            {r.label}
          </span>
        ))}
      </div>

      <p className="text-center text-xs text-[var(--rf-faint)]" style={{ marginTop: -4 }}>
        {understood} of {areas.length} areas understood · built from {pagesChecked} page{pagesChecked === 1 ? '' : 's'} checked
      </p>

      <div className="office-dna-legend">
        {(Object.keys(STATE_LABEL) as DigitalDnaUnderstanding[]).map((k) => (
          <span key={k} className="office-dna-legend-item">
            <span className="office-dna-legend-dot" style={{ background: `rgb(${STATE_RGB[k].join(',')})` }} />
            {STATE_LABEL[k]}
          </span>
        ))}
      </div>

      {selected && (
        <div className="office-dna-detail" role="region" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">{selected.label}</p>
            <span className="text-xs font-medium" style={{ color: `rgb(${STATE_RGB[selected.understanding].join(',')})` }}>{STATE_LABEL[selected.understanding]}</span>
          </div>
          <p className="mt-2 text-sm text-[var(--rf-muted)] leading-relaxed">{selected.note}</p>
          <p className="mt-2 text-xs text-[var(--rf-faint)]">What would strengthen this: {strengthenHint(selected.understanding)}</p>
          {onAskCompass && (
            <button onClick={onAskCompass} className="mt-3 text-xs font-medium text-[var(--office-brass-bright)] hover:underline">
              Ask Compass about this →
            </button>
          )}
        </div>
      )}
    </section>
  )
}
