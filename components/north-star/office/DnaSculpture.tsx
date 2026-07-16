'use client'

import { useEffect, useRef, useState } from 'react'
import type { DigitalDnaArea, DigitalDnaUnderstanding } from '@/lib/north-star-preview-data'

/**
 * The Living Digital DNA — a slowly-rotating double helix, rendered as flowing
 * particles rather than a diagram. Two backbone strands wind down from a
 * luminous core (the business); each knowledge region is a base-pair rung
 * bridging the strands. Density, colour and brightness of a rung — not a
 * percentage — communicate how well that area is understood. The helix turns
 * gently, base pairs drifting front-to-back through depth, so it reads as a
 * living molecule that is thinking, not a chart being drawn.
 */

const PI2 = Math.PI * 2

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
// Particles flowing across each base-pair rung — count communicates understanding.
const RUNG_DENSITY: Record<DigitalDnaUnderstanding, number> = {
  'well-understood': 15,
  'partially-understood': 10,
  'needs-verification': 6,
  'not-connected': 3,
}

interface Region {
  key: string
  label: string
  understanding: DigitalDnaUnderstanding
  isHub: boolean
  x: number
  y: number
  rowTop: number
  rowH: number
  side: number
  labelX: number
}

interface RungParticle {
  regionKey: string
  u: number // position across the base pair, 0..1
  u0: number
  off: number // small perpendicular jitter around the rung
  speed: number
  size: number
  phase: number
}

interface Geom {
  cx: number
  topY: number
  botY: number
  span: number
  amp: number
  turns: number
  labelGap: number
}

function strengthenHint(u: DigitalDnaUnderstanding): string {
  switch (u) {
    case 'not-connected': return 'Connecting a new source or running another check will start building this out.'
    case 'needs-verification': return 'A few more checks over time would confirm this.'
    case 'partially-understood': return 'Checking additional pages or connecting another source would complete this picture.'
    case 'well-understood': return 'This is solid. Occasional re-checks will keep it current.'
  }
}

function helixGeom(w: number, h: number): Geom {
  return {
    cx: w / 2,
    topY: h * 0.15,
    botY: h * 0.92,
    span: h * 0.92 - h * 0.15,
    amp: Math.min(w * 0.13, 165),
    turns: 3.0,
    labelGap: w < 560 ? 16 : 42,
  }
}

function layout(areas: DigitalDnaArea[], w: number, h: number): Region[] {
  const g = helixGeom(w, h)
  const hub = areas.find((a) => a.key === 'identity')
  const rest = areas.filter((a) => a.key !== 'identity')
  const n = rest.length || 1
  const regionTop = g.topY + 68
  const regionSpan = Math.max(60, g.botY - regionTop)
  const regions: Region[] = []
  if (hub) {
    regions.push({ key: hub.key, label: hub.label, understanding: hub.understanding, isHub: true, x: g.cx, y: g.topY, rowTop: g.topY - 40, rowH: 80, side: 0, labelX: g.cx })
  }
  rest.forEach((a, i) => {
    const rowH = regionSpan / n
    const y = regionTop + (i + 0.5) * rowH
    const side = i % 2 === 0 ? 1 : -1
    const labelX = g.cx + side * (g.amp + g.labelGap)
    regions.push({ key: a.key, label: a.label, understanding: a.understanding, isHub: false, x: g.cx, y, rowTop: y - rowH / 2, rowH, side, labelX })
  })
  return regions
}

export function DnaSculpture({
  areas,
  pagesChecked,
  selectedKey,
  activeKey,
  investigating = false,
  onSelect,
  onAskCompass,
}: {
  areas: DigitalDnaArea[]
  pagesChecked: number
  selectedKey: string | null
  activeKey: string | null
  investigating?: boolean
  onSelect: (key: string) => void
  onAskCompass?: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const [dims, setDims] = useState({ w: 1100, h: 560 })
  const regionsRef = useRef<Region[]>([])
  const rungRef = useRef<RungParticle[]>([])
  const stateRef = useRef({ selectedKey, hoveredKey: null as string | null, activeKey, investigating })
  stateRef.current.selectedKey = selectedKey
  stateRef.current.hoveredKey = hoveredKey
  stateRef.current.activeKey = activeKey
  stateRef.current.investigating = investigating

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

    const rungs: RungParticle[] = []
    regions.forEach((r) => {
      if (r.isHub) return
      const density = RUNG_DENSITY[r.understanding]
      for (let i = 0; i < density; i++) {
        const u = Math.random()
        rungs.push({ regionKey: r.key, u, u0: u, off: (Math.random() - 0.5) * 6, speed: 0.0016 + Math.random() * 0.0022, size: 0.7 + Math.random() * 1.5, phase: Math.random() * PI2 })
      }
    })
    rungRef.current = rungs
  }, [areas, dims.w, dims.h])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = dims.w * dpr
    canvas.height = dims.h * dpr
    canvas.style.width = `${dims.w}px`
    canvas.style.height = `${dims.h}px`
    ctx.scale(dpr, dpr)

    // A few faint dust motes drifting in the volumetric light — the only
    // ambient particulate in the architectural room (no starfield).
    const motes = Array.from({ length: 26 }, () => ({
      x: Math.random(), y: Math.random(),
      s: Math.random() * 0.9 + 0.3,
      a: Math.random() * 0.16 + 0.03,
      ph: Math.random() * PI2,
    }))

    // Evidence flow: while a check runs, discrete particles of evidence rise up
    // through the room and converge into the molecule — the signature moment.
    // No loading bars; the office is visibly gathering understanding.
    const evidence: Array<{ x: number; y: number; tx: number; ty: number; t: number; life: number; warm: boolean; key: string | null }> = []
    // Stage 3: when evidence lands, the receiving strand "thinks" — a transient
    // reaction that brightens it and gently reorganizes its neighbors.
    const react: Record<string, number> = {}
    let spawnAcc = 0
    let lastT = 0

    let raf = 0

    function paint(time: number) {
      const w = dims.w, h = dims.h
      const g = helixGeom(w, h)
      const regions = regionsRef.current

      const cy = (g.topY + g.botY) / 2
      const maxD = Math.max(w, h)

      // The DNA is the light source: aggregate understanding drives how warm and
      // how bright the whole room reads. Growth → warmer, brighter, more complete.
      let uSum = 0
      regions.forEach((r) => {
        uSum += r.understanding === 'well-understood' ? 1 : r.understanding === 'partially-understood' ? 0.5 : r.understanding === 'needs-verification' ? 0.2 : 0
      })
      const understanding = regions.length ? uSum / regions.length : 0
      const warmLift = 0.35 + 0.65 * understanding // 0..1 warmth of the room light

      // The canvas itself stays transparent — no opaque background fill — so
      // the office's own architectural atmosphere (.ns-root + .office-ambient)
      // shows straight through. The DNA sits IN the room's existing air rather
      // than painting a separate room of its own; only light is added below.
      ctx!.clearRect(0, 0, w, h)

      const breathe = reduce ? 0.5 : Math.sin(time / 2600) * 0.5 + 0.5
      // idle motion reduced ~50%: when nothing changes the molecule is nearly still
      const rot = reduce ? 0 : time * 0.00011
      const { selectedKey: sel, hoveredKey: hov, activeKey: act } = stateRef.current
      const anyFocus = sel || hov
      const phaseAt = (y: number) => ((y - g.topY) / g.span) * g.turns * PI2 + rot

      // volumetric light pouring down from the core (the DNA lights the room)
      ctx!.globalCompositeOperation = 'lighter'
      const coreGlow = ctx!.createRadialGradient(g.cx, g.topY, 0, g.cx, g.topY, maxD * 0.62)
      const lr = Math.round(150 + 90 * warmLift), lg2 = Math.round(130 + 55 * warmLift), lb = Math.round(96 + 20 * warmLift)
      coreGlow.addColorStop(0, `rgba(${lr},${lg2},${lb},${0.10 + 0.12 * understanding + 0.03 * breathe})`)
      coreGlow.addColorStop(0.5, `rgba(${lr},${lg2},${lb},${0.03 + 0.04 * understanding})`)
      coreGlow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx!.fillStyle = coreGlow
      ctx!.fillRect(0, 0, w, h)
      // two soft volumetric shafts angling down from the core
      ;[-0.5, 0.5].forEach((dir) => {
        ctx!.save()
        const grad = ctx!.createLinearGradient(g.cx, g.topY, g.cx + dir * w * 0.5, h)
        grad.addColorStop(0, `rgba(${lr},${lg2},${lb},${0.05 + 0.05 * understanding})`)
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx!.fillStyle = grad
        ctx!.beginPath()
        ctx!.moveTo(g.cx - 14, g.topY)
        ctx!.lineTo(g.cx + 14, g.topY)
        ctx!.lineTo(g.cx + dir * w * 0.42 + 90, h)
        ctx!.lineTo(g.cx + dir * w * 0.42 - 90, h)
        ctx!.closePath()
        ctx!.fill()
        ctx!.restore()
      })
      // drifting dust motes catching the light
      motes.forEach((m) => {
        const dy = reduce ? 0 : (Math.sin(time / 5200 + m.ph) * 0.02)
        const mx = m.x * w, my = ((m.y + dy) % 1) * h
        ctx!.fillStyle = `rgba(${lr},${lg2},${lb},${m.a * (0.5 + 0.5 * understanding)})`
        ctx!.beginPath()
        ctx!.arc(mx, my, m.s, 0, PI2)
        ctx!.fill()
      })
      ctx!.globalCompositeOperation = 'source-over'

      // reflective smoked-glass floor: a soft mirror sheen beneath the molecule
      const floor = ctx!.createLinearGradient(0, g.botY, 0, h)
      floor.addColorStop(0, `rgba(${lr},${lg2},${lb},${0.05 * understanding})`)
      floor.addColorStop(1, 'rgba(0,0,0,0)')
      ctx!.fillStyle = floor
      ctx!.fillRect(0, g.botY, w, h - g.botY)

      // smoked-metal vignette to hold the eye on the molecule
      const vig = ctx!.createRadialGradient(g.cx, cy, maxD * 0.16, g.cx, cy, maxD * 0.72)
      vig.addColorStop(0, 'rgba(0,0,0,0)')
      vig.addColorStop(1, 'rgba(4,5,7,0.62)')
      ctx!.fillStyle = vig
      ctx!.fillRect(0, 0, w, h)

      // Two solid twisting ribbons — a warm gold and a cool platinum — that
      // swell face-on and pinch to a thin edge at each crossover, exactly like
      // an illustrated DNA strand. Every ribbon segment and base-pair detail
      // becomes a depth-keyed primitive, painted far→near so the strands truly
      // pass over and behind one another. Base pairs stay a quiet secondary
      // detail (no ladder of even steps) and come alive only on focus.
      type Prim =
        | { t: 0; ax: number; ayt: number; ayb: number; bx: number; byt: number; byb: number; z: number; col: string }
        | { t: 1; x: number; y: number; r: number; z: number; col: string }
        | { t: 2; x0: number; x1: number; y: number; z: number; col: string; lw: number }
      const prims: Prim[] = []
      const glow: Array<{ x: number; y: number; r: number; c: [number, number, number]; a: number }> = []
      const NEAR0: [number, number, number] = [233, 215, 172]
      const NEAR1: [number, number, number] = [176, 188, 208]
      const FAR: [number, number, number] = [58, 64, 84]
      const N = 150
      const dimAll = anyFocus ? 0.5 : 1

      // ── the two ribbon strands ───────────────────────────────────────
      for (let strand = 0; strand < 2; strand++) {
        const near = strand === 0 ? NEAR0 : NEAR1
        let prev: { x: number; yt: number; yb: number; z: number; depth: number } | null = null
        for (let i = 0; i <= N; i++) {
          const f = i / N
          const y = g.topY + f * g.span
          const ph = phaseAt(y) + strand * Math.PI
          const x = g.cx + g.amp * Math.cos(ph)
          const z = Math.sin(ph)
          const depth = (z + 1) / 2
          const hw = 2 + 9.5 * Math.abs(Math.cos(ph)) // wide face-on, pinched at the crossover
          const cur = { x, yt: y - hw * 0.32, yb: y + hw * 0.32, z, depth }
          if (prev) {
            const shimmer = reduce ? 1 : 0.92 + 0.08 * Math.sin(time / 1100 + f * 8)
            const a = (0.42 + 0.5 * cur.depth) * shimmer * dimAll
            const cr = Math.round(FAR[0] + (near[0] - FAR[0]) * cur.depth)
            const cg = Math.round(FAR[1] + (near[1] - FAR[1]) * cur.depth)
            const cb = Math.round(FAR[2] + (near[2] - FAR[2]) * cur.depth)
            prims.push({ t: 0, ax: prev.x, ayt: prev.yt, ayb: prev.yb, bx: cur.x, byt: cur.yt, byb: cur.yb, z: (prev.z + cur.z) / 2, col: `rgba(${cr},${cg},${cb},${a})` })
          }
          // bloom only along the near/front of the strand, sampled sparsely
          if (depth > 0.62 && i % 3 === 0) {
            glow.push({ x, y, r: 7 + 12 * depth, c: near, a: 0.07 * depth * dimAll })
          }
          prev = cur
        }
      }

      // ── base pairs: quiet connector + colored nucleotide anchors ─────
      regions.forEach((r, idx) => {
        if (r.isHub) return
        const c = STATE_RGB[r.understanding]
        const isFocused = sel === r.key || hov === r.key
        const isActive = act === r.key
        const dimmed = anyFocus && !isFocused
        // Stage 3: the strand receiving evidence responds; neighbors reorganize.
        const selfReact = react[r.key] || 0
        const prevK = regions[idx - 1]?.key, nextK = regions[idx + 1]?.key
        const nbReact = 0.5 * ((prevK ? react[prevK] || 0 : 0) + (nextK ? react[nextK] || 0 : 0))
        const wob = reduce ? 0 : nbReact * 3 * Math.sin(time / 220 + r.y)
        const ry = r.y + wob
        const reactMul = 1 + selfReact * 0.9
        const ph = phaseAt(ry)
        const pulse = (isActive && !reduce ? 0.7 + 0.3 * Math.sin(time / 300) : 1) * reactMul
        const focusMul = (isFocused ? 1.9 : isActive ? 1.4 : 1) * reactMul
        const xA = g.cx + g.amp * Math.cos(ph), zA = Math.sin(ph)
        const xB = g.cx + g.amp * Math.cos(ph + Math.PI), zB = Math.sin(ph + Math.PI)

        const connA = (r.understanding === 'not-connected' ? 0.05 : 0.12) * focusMul * pulse * (dimmed ? 0.4 : 1)
        prims.push({ t: 2, x0: xA, x1: xB, y: ry, z: (zA + zB) / 2, col: `rgba(${c[0]},${c[1]},${c[2]},${connA})`, lw: isFocused ? 1.8 : 1 })

        const baseSize = (r.understanding === 'well-understood' ? 3.2 : r.understanding === 'partially-understood' ? 2.6 : r.understanding === 'needs-verification' ? 2.0 : 1.5) * (1 + selfReact * 0.35)
        ;([[xA, zA], [xB, zB]] as Array<[number, number]>).forEach(([x, z]) => {
          const depth = (z + 1) / 2
          const a = (r.understanding === 'not-connected' ? 0.22 : 0.6) * (0.45 + 0.55 * depth) * focusMul * pulse * (dimmed ? 0.35 : 1)
          prims.push({ t: 1, x, y: ry, r: baseSize * (0.6 + 0.7 * depth) * (isFocused ? 1.3 : 1), z, col: `rgba(${c[0]},${c[1]},${c[2]},${Math.min(a, 0.95)})` })
        })

        // energy crosses the base pair only when the region is in focus/active
        if (isFocused || isActive) {
          rungRef.current.forEach((p) => {
            if (p.regionKey !== r.key) return
            if (!reduce) { p.u += p.speed; if (p.u > 1) p.u -= 1 }
            const u = reduce ? p.u0 : p.u
            const z = zA + (zB - zA) * u
            const depth = (z + 1) / 2
            const tw = reduce ? 0.85 : 0.5 + 0.5 * Math.sin(time / 380 + p.phase)
            const a = 0.5 * tw * (0.4 + 0.6 * depth) * pulse
            prims.push({ t: 1, x: xA + (xB - xA) * u, y: r.y + p.off, r: p.size * (0.6 + 0.6 * depth), z, col: `rgba(${c[0]},${c[1]},${c[2]},${a})` })
          })
        }
      })

      // paint far → near so nearer primitives occlude farther ones (the weave)
      prims.sort((a, b) => a.z - b.z)
      for (let i = 0; i < prims.length; i++) {
        const p = prims[i]
        if (p.t === 0) {
          ctx!.fillStyle = p.col
          ctx!.beginPath()
          ctx!.moveTo(p.ax, p.ayt); ctx!.lineTo(p.bx, p.byt); ctx!.lineTo(p.bx, p.byb); ctx!.lineTo(p.ax, p.ayb); ctx!.closePath()
          ctx!.fill()
        } else if (p.t === 1) {
          ctx!.fillStyle = p.col
          ctx!.beginPath(); ctx!.arc(p.x, p.y, p.r, 0, PI2); ctx!.fill()
        } else {
          ctx!.strokeStyle = p.col
          ctx!.lineWidth = p.lw
          ctx!.beginPath(); ctx!.moveTo(p.x0, p.y); ctx!.lineTo(p.x1, p.y); ctx!.stroke()
        }
      }

      // ── soft bloom along the front of the ribbons (additive) ─────────
      ctx!.globalCompositeOperation = 'lighter'
      for (let i = 0; i < glow.length; i++) {
        const b = glow[i]
        const bg2 = ctx!.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
        bg2.addColorStop(0, `rgba(${b.c[0]},${b.c[1]},${b.c[2]},${b.a})`)
        bg2.addColorStop(1, 'rgba(0,0,0,0)')
        ctx!.fillStyle = bg2
        ctx!.beginPath(); ctx!.arc(b.x, b.y, b.r, 0, PI2); ctx!.fill()
      }
      ctx!.globalCompositeOperation = 'source-over'

      // ── luminous core (the business) the strands spring from ─────────
      const hub = regions.find((r) => r.isHub)
      if (hub) {
        const coreFocus = act === hub.key || sel === hub.key || hov === hub.key
        const coreR = (20 + breathe * 4) * (coreFocus ? 1.15 : 1)
        ctx!.save()
        ctx!.shadowColor = 'rgba(201,168,119,0.5)'
        ctx!.shadowBlur = 28
        const cg = ctx!.createRadialGradient(g.cx, g.topY, 0, g.cx, g.topY, coreR * 2.4)
        cg.addColorStop(0, `rgba(243,232,200,${0.55 + breathe * 0.2})`)
        cg.addColorStop(0.4, 'rgba(201,168,119,0.25)')
        cg.addColorStop(1, 'rgba(0,0,0,0)')
        ctx!.fillStyle = cg
        ctx!.beginPath()
        ctx!.arc(g.cx, g.topY, coreR * 2.4, 0, PI2)
        ctx!.fill()
        ctx!.restore()
        ctx!.fillStyle = 'rgba(245,240,230,0.95)'
        ctx!.beginPath()
        ctx!.arc(g.cx, g.topY, 8, 0, PI2)
        ctx!.fill()
      }

      // ── evidence flow: particles rising into the molecule during a check ──
      const dt = lastT ? Math.min(time - lastT, 48) : 16
      lastT = time
      if (!reduce && stateRef.current.investigating) {
        spawnAcc += dt
        if (spawnAcc > 360) {
          spawnAcc = 0
          // aim at the strand currently being examined, else the core
          const target = regions.find((r) => r.key === stateRef.current.activeKey)
          const ty = target ? target.y : g.topY
          evidence.push({
            x: g.cx + (Math.random() - 0.5) * g.amp * 2.2,
            y: g.botY + 24,
            tx: g.cx + (Math.random() - 0.5) * g.amp * 0.5,
            ty,
            t: 0,
            life: 1500 + Math.random() * 700,
            warm: Math.random() < 0.6,
            key: target ? target.key : null,
          })
        }
      }
      if (evidence.length) {
        ctx!.globalCompositeOperation = 'lighter'
        for (let i = evidence.length - 1; i >= 0; i--) {
          const e = evidence[i]
          e.t += dt / e.life
          if (e.t >= 1) { if (e.key) react[e.key] = Math.min((react[e.key] || 0) + 0.5, 1.4); evidence.splice(i, 1); continue }
          const ease = e.t * e.t * (3 - 2 * e.t)
          const x = e.x + (e.tx - e.x) * ease
          const y = e.y + (e.ty - e.y) * ease
          const fade = e.t < 0.85 ? 1 : (1 - e.t) / 0.15
          const col = e.warm ? '201,168,119' : '150,196,214'
          const r = 1.6 + 1.4 * (1 - e.t)
          const ggrad = ctx!.createRadialGradient(x, y, 0, x, y, r * 4)
          ggrad.addColorStop(0, `rgba(${col},${0.5 * fade})`)
          ggrad.addColorStop(1, 'rgba(0,0,0,0)')
          ctx!.fillStyle = ggrad
          ctx!.beginPath(); ctx!.arc(x, y, r * 4, 0, PI2); ctx!.fill()
          ctx!.fillStyle = `rgba(${col},${0.9 * fade})`
          ctx!.beginPath(); ctx!.arc(x, y, r, 0, PI2); ctx!.fill()
        }
        ctx!.globalCompositeOperation = 'source-over'
      }
      // decay the thinking reactions each frame
      for (const k in react) { react[k] *= 0.985; if (react[k] < 0.01) delete react[k] }

      if (!reduce) raf = requestAnimationFrame(paint)
    }

    raf = requestAnimationFrame(paint)
    return () => cancelAnimationFrame(raf)
  }, [dims])

  const selected = areas.find((a) => a.key === selectedKey)
  const understood = areas.filter((a) => a.understanding === 'well-understood').length
  // Computed directly from render-time state (not the ref the animation loop
  // mutates in an effect) so accessible hit-targets and labels never lag a
  // frame behind the canvas.
  const regions = layout(areas, dims.w, dims.h)
  const g = helixGeom(dims.w, dims.h)

  return (
    <section aria-label="Digital DNA — North Star's living understanding of your business, shown as a double helix">
      <div className="office-dna-wrap" ref={wrapRef}>
        <canvas ref={canvasRef} style={{ display: 'block' }} />

        {/* Accessible, keyboard-focusable hit targets over the core + each base pair */}
        {regions.map((r) =>
          r.isHub ? (
            <button
              key={r.key}
              onClick={() => onSelect(r.key)}
              onMouseEnter={() => setHoveredKey(r.key)}
              onMouseLeave={() => setHoveredKey((k) => (k === r.key ? null : k))}
              onFocus={() => setHoveredKey(r.key)}
              onBlur={() => setHoveredKey((k) => (k === r.key ? null : k))}
              aria-pressed={selectedKey === r.key}
              aria-label={`${r.label}: ${STATE_LABEL[r.understanding]}`}
              style={{ position: 'absolute', left: g.cx - 40, top: g.topY - 40, width: 80, height: 80, background: 'transparent', border: 'none', borderRadius: '50%', cursor: 'pointer' }}
            />
          ) : (
            <button
              key={r.key}
              onClick={() => onSelect(r.key)}
              onMouseEnter={() => setHoveredKey(r.key)}
              onMouseLeave={() => setHoveredKey((k) => (k === r.key ? null : k))}
              onFocus={() => setHoveredKey(r.key)}
              onBlur={() => setHoveredKey((k) => (k === r.key ? null : k))}
              aria-pressed={selectedKey === r.key}
              aria-label={`${r.label}: ${STATE_LABEL[r.understanding]}`}
              style={{ position: 'absolute', left: 0, top: r.rowTop, width: '100%', height: r.rowH, background: 'transparent', border: 'none', cursor: 'pointer' }}
            />
          )
        )}

        {/* Static labels — always legible regardless of the helix's motion */}
        {regions.map((r) => {
          const isRight = r.side > 0
          return (
            <span
              key={r.key}
              aria-hidden="true"
              className="office-dna-label"
              data-major={r.isHub}
              data-focused={hoveredKey === r.key || selectedKey === r.key || activeKey === r.key}
              style={
                r.isHub
                  ? { left: g.cx, top: g.topY + 30, transform: 'translate(-50%,0)', textAlign: 'center', pointerEvents: 'none', position: 'absolute' }
                  : { left: r.labelX, top: r.y, transform: isRight ? 'translate(0,-50%)' : 'translate(-100%,-50%)', textAlign: isRight ? 'left' : 'right', pointerEvents: 'none', position: 'absolute' }
              }
            >
              {r.label}
            </span>
          )
        })}
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
