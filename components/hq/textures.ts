import * as THREE from 'three'

/**
 * Procedural materials for the headquarters.
 *
 * Every texture is generated on a canvas at runtime — no external image assets
 * (the app runs under a strict CSP and offline). This keeps the "real material"
 * language of the Blueprint (§12) — marble veining, brushed brass, open-pore
 * walnut, engraved coordinates — without shipping binary textures.
 *
 * These run only in the browser (inside the R3F Canvas). Guarded for SSR.
 */

const hasDOM = typeof document !== 'undefined'

function canvas(size = 1024): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = c.height = size
  return [c, c.getContext('2d')!]
}

/** Small seeded PRNG so textures are stable across renders. */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let _cache: Record<string, THREE.Texture> = {}
function cached(key: string, make: () => THREE.Texture): THREE.Texture {
  if (_cache[key]) return _cache[key]
  const t = make()
  _cache[key] = t
  return t
}

/** Honed Italian black marble with restrained white veining. */
export function marbleTexture(): THREE.Texture | null {
  if (!hasDOM) return null
  return cached('marble', () => {
    const [c, ctx] = canvas(1024)
    // Mid-tone graphite albedo — lighting, not the map, carries the darkness.
    const g = ctx.createLinearGradient(0, 0, 1024, 1024)
    g.addColorStop(0, '#26262c')
    g.addColorStop(0.5, '#2f2f36')
    g.addColorStop(1, '#28282e')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 1024, 1024)
    // Sparse, delicate white/grey veins.
    const rand = rng(7)
    const veins = 22
    for (let i = 0; i < veins; i++) {
      ctx.beginPath()
      let x = rand() * 1024
      let y = rand() * 1024
      ctx.moveTo(x, y)
      const steps = 8 + Math.floor(rand() * 10)
      const dir = rand() * Math.PI * 2
      let d = dir
      for (let s = 0; s < steps; s++) {
        d += (rand() - 0.5) * 0.9
        x += Math.cos(d) * (30 + rand() * 90)
        y += Math.sin(d) * (30 + rand() * 90)
        ctx.lineTo(x, y)
      }
      const bright = 40 + rand() * 70
      ctx.strokeStyle = `rgba(${bright + 150}, ${bright + 150}, ${bright + 140}, ${0.05 + rand() * 0.12})`
      ctx.lineWidth = 0.4 + rand() * 1.6
      ctx.stroke()
    }
    // A couple of brighter hero veins.
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      let x = rand() * 1024
      let y = rand() * 200
      ctx.moveTo(x, y)
      for (let s = 0; s < 20; s++) {
        x += (rand() - 0.5) * 120
        y += 30 + rand() * 40
        ctx.lineTo(x, y)
      }
      ctx.strokeStyle = `rgba(220,218,210,${0.1 + rand() * 0.1})`
      ctx.lineWidth = 0.8
      ctx.stroke()
    }
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.anisotropy = 8
    t.colorSpace = THREE.SRGBColorSpace
    return t
  })
}

/** Brushed brass — fine horizontal grain, warm. Returned as a roughness map. */
export function brushedRoughness(): THREE.Texture | null {
  if (!hasDOM) return null
  return cached('brushed', () => {
    const [c, ctx] = canvas(512)
    ctx.fillStyle = '#7a7a7a'
    ctx.fillRect(0, 0, 512, 512)
    const rand = rng(19)
    for (let i = 0; i < 4000; i++) {
      const y = rand() * 512
      const v = 90 + rand() * 90
      ctx.strokeStyle = `rgba(${v},${v},${v},0.06)`
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(512, y + (rand() - 0.5) * 2)
      ctx.stroke()
    }
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    return t
  })
}

/** Open-pore black walnut — deep brown with directional grain. */
export function walnutTexture(): THREE.Texture | null {
  if (!hasDOM) return null
  return cached('walnut', () => {
    const [c, ctx] = canvas(1024)
    const g = ctx.createLinearGradient(0, 0, 0, 1024)
    g.addColorStop(0, '#54402a')
    g.addColorStop(0.5, '#5e4526')
    g.addColorStop(1, '#4a361f')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 1024, 1024)
    const rand = rng(41)
    // Long grain lines with gentle cathedral curvature.
    for (let i = 0; i < 150; i++) {
      const baseY = rand() * 1024
      ctx.beginPath()
      ctx.moveTo(0, baseY)
      for (let x = 0; x <= 1024; x += 32) {
        const y = baseY + Math.sin(x * 0.006 + i) * (6 + rand() * 10)
        ctx.lineTo(x, y)
      }
      const v = 12 + rand() * 26
      ctx.strokeStyle = `rgba(${v + 20},${v + 8},${v}, ${0.15 + rand() * 0.2})`
      ctx.lineWidth = 0.6 + rand() * 1.4
      ctx.stroke()
    }
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.anisotropy = 8
    t.colorSpace = THREE.SRGBColorSpace
    return t
  })
}

/**
 * Engraved celestial coordinate ring — used as an emissive/detail map on the
 * Core's outer brass ring. Transparent with fine tick marks and glyphs.
 */
export function engravingTexture(): THREE.Texture | null {
  if (!hasDOM) return null
  return cached('engraving', () => {
    const [c, ctx] = canvas(2048)
    ctx.clearRect(0, 0, 2048, 2048)
    ctx.strokeStyle = 'rgba(20,14,4,0.85)'
    ctx.fillStyle = 'rgba(20,14,4,0.85)'
    // Ticks along a horizontal band (wraps around the ring's circumference).
    const major = 72
    for (let i = 0; i < major; i++) {
      const x = (i / major) * 2048
      const long = i % 6 === 0
      ctx.lineWidth = long ? 3 : 1.5
      ctx.beginPath()
      ctx.moveTo(x, 60)
      ctx.lineTo(x, long ? 150 : 110)
      ctx.stroke()
      if (long) {
        ctx.font = '28px Georgia'
        ctx.textAlign = 'center'
        ctx.fillText(`${(i / 6) * 30}°`, x, 190)
      }
    }
    const t = new THREE.CanvasTexture(c)
    t.wrapS = THREE.RepeatWrapping
    t.wrapT = THREE.ClampToEdgeWrapping
    return t
  })
}

/** A soft round sprite for stars / dust / bloom points. */
export function glowSprite(inner = 'rgba(255,244,222,1)', outer = 'rgba(255,244,222,0)'): THREE.Texture | null {
  if (!hasDOM) return null
  return cached(`glow-${inner}-${outer}`, () => {
    const [c, ctx] = canvas(128)
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, inner)
    g.addColorStop(0.4, inner.replace(',1)', ',0.5)'))
    g.addColorStop(1, outer)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  })
}

export function disposeTextures() {
  Object.values(_cache).forEach((t) => t.dispose())
  _cache = {}
}
