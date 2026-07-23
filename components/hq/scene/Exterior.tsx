'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScene } from '../sceneContext'
import { glowSprite } from '../textures'
import type { TimeOfDay } from '@/lib/hq/state'

/**
 * The world beyond the glass (Blueprint §7, §14) — a complete cinematic vista,
 * not an empty backdrop: a gradient sky with horizon haze, depth-varied stars,
 * a large moon with glow, the North Star in its correct clear-night position,
 * three layered mountain ranges fading into atmosphere, a reflective lake with
 * a moon glint, distant city lights along the far shore, drifting cloud strata,
 * and weather (rain, snow, fog, storm lightning, rare aurora) outside the wall.
 */

const SKY: Record<TimeOfDay, { top: string; horizon: string }> = {
  dawn: { top: '#243056', horizon: '#e6a870' },
  day: { top: '#3f5c82', horizon: '#c6d6e6' },
  dusk: { top: '#1f1a3a', horizon: '#d67a4e' },
  night: { top: '#070b16', horizon: '#182238' },
}

function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function Exterior() {
  const { scene, reduced } = useScene()
  const starGlow = glowSprite('rgba(255,248,232,1)', 'rgba(255,248,232,0)')
  const softGlow = glowSprite('rgba(255,213,150,1)', 'rgba(255,213,150,0)')
  const moonGlow = glowSprite('rgba(226,232,240,1)', 'rgba(226,232,240,0)')

  // Gradient sky with a hazy horizon.
  const skyMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uTop: { value: new THREE.Color(SKY.night.top) },
          uHorizon: { value: new THREE.Color(SKY.night.horizon) },
          uHaze: { value: 0.35 },
        },
        vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          varying vec3 vP; uniform vec3 uTop; uniform vec3 uHorizon; uniform float uHaze;
          void main(){
            vec3 n = normalize(vP);
            float h = clamp((n.y + 0.12) / 1.12, 0.0, 1.0);
            vec3 c = mix(uHorizon, uTop, pow(h, 0.72));
            // Hazy band hugging the horizon.
            float band = exp(-pow(max(n.y,0.0)*7.0, 2.0)) * uHaze;
            c = mix(c, uHorizon * 1.15, band);
            gl_FragColor = vec4(c, 1.0);
          }`,
      }),
    [],
  )

  // Depth-varied stars: two shells, different sizes.
  const stars = useMemo(() => {
    const build = (N: number, r: number, seed: number) => {
      const pos = new Float32Array(N * 3)
      const rnd = seeded(seed)
      for (let i = 0; i < N; i++) {
        const u = rnd()
        const v = rnd() * 0.62 + 0.04
        const th = u * Math.PI * 2
        const phi = Math.acos(1 - v)
        pos[i * 3] = r * Math.sin(phi) * Math.cos(th)
        pos[i * 3 + 1] = r * Math.cos(phi)
        pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(th)
      }
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      return g
    }
    return { far: build(700, 220, 7), near: build(260, 150, 99) }
  }, [])

  // City lights along the far shore (emissive points just above the water).
  const city = useMemo(() => {
    const N = 260
    const pos = new Float32Array(N * 3)
    const rnd = seeded(53)
    for (let i = 0; i < N; i++) {
      const ang = Math.PI + rnd() * Math.PI // north arc
      const rad = 96 + rnd() * 26
      pos[i * 3] = Math.cos(ang) * rad
      pos[i * 3 + 1] = 1.5 + rnd() * 4.5
      pos[i * 3 + 2] = Math.sin(ang) * rad
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])

  // Precipitation just outside the glass.
  const precip = useMemo(() => {
    const N = 1300
    const pos = new Float32Array(N * 3)
    const rnd = seeded(31)
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (rnd() - 0.5) * 64
      pos[i * 3 + 1] = rnd() * 42
      pos[i * 3 + 2] = -15 - rnd() * 34
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])

  const starFarRef = useRef<THREE.Points>(null)
  const starNearRef = useRef<THREE.Points>(null)
  const precipRef = useRef<THREE.Points>(null)
  const lightning = useRef<THREE.PointLight>(null)
  const auroraRef = useRef<THREE.Group>(null)
  const cloudsRef = useRef<THREE.Group>(null)

  const starMatFar = useMemo(
    () => new THREE.PointsMaterial({ size: 0.9, map: starGlow ?? undefined, transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending }),
    [starGlow],
  )
  const starMatNear = useMemo(
    () => new THREE.PointsMaterial({ size: 1.8, map: starGlow ?? undefined, transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending }),
    [starGlow],
  )
  const cityMat = useMemo(
    () => new THREE.PointsMaterial({ size: 1.2, map: softGlow ?? undefined, color: '#ffcf94', transparent: true, depthWrite: false, opacity: 0.0, blending: THREE.AdditiveBlending }),
    [softGlow],
  )
  const precipMat = useMemo(
    () => new THREE.PointsMaterial({ size: 0.09, color: '#b7c3d2', transparent: true, opacity: 0, depthWrite: false }),
    [],
  )
  const waterMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0a1019', roughness: 0.15, metalness: 0.6, envMapIntensity: 0.5 }),
    [],
  )

  useFrame((_, dt) => {
    const s = scene.sky
    const target = SKY[scene.time]
    ;(skyMat.uniforms.uTop.value as THREE.Color).lerp(new THREE.Color(target.top), 0.05)
    ;(skyMat.uniforms.uHorizon.value as THREE.Color).lerp(new THREE.Color(target.horizon), 0.05)
    skyMat.uniforms.uHaze.value += ((s.fog ? 0.7 : 0.32) - skyMat.uniforms.uHaze.value) * 0.05

    const starT = s.stars ? 0.95 : 0
    starMatFar.opacity += (starT - starMatFar.opacity) * 0.05
    starMatNear.opacity += (starT - starMatNear.opacity) * 0.05
    cityMat.opacity += ((scene.time === 'night' || scene.time === 'dusk' ? 0.9 : 0.15) - cityMat.opacity) * 0.04

    const precipOn = s.rain || s.snow
    precipMat.opacity += ((precipOn ? (s.snow ? 0.9 : 0.5) : 0) - precipMat.opacity) * 0.06
    precipMat.size = s.snow ? 0.16 : 0.09
    precipMat.color.set(s.snow ? '#eef3f8' : '#aab6c4')

    if (!reduced) {
      if (starFarRef.current) starFarRef.current.rotation.y += dt * 0.004
      if (starNearRef.current) starNearRef.current.rotation.y += dt * 0.006
      if (cloudsRef.current) cloudsRef.current.rotation.y += dt * 0.005
      if (auroraRef.current) auroraRef.current.rotation.y += dt * 0.02
      if (precipRef.current && precipOn) {
        const p = precip.attributes.position as THREE.BufferAttribute
        const fall = s.snow ? 6 : 34
        for (let i = 0; i < p.count; i++) {
          let y = p.getY(i) - dt * fall
          let x = p.getX(i)
          if (s.snow) x += Math.sin((y + i) * 0.5) * dt * 0.6
          if (y < 0) y += 42
          p.setY(i, y)
          p.setX(i, x)
        }
        p.needsUpdate = true
      }
    }

    if (lightning.current) {
      if (s.storm && !reduced) {
        const t = performance.now() / 1000
        const flash = (Math.sin(t * 1.7) > 0.985 ? 1 : 0) + (Math.sin(t * 5.3) > 0.995 ? 0.6 : 0)
        lightning.current.intensity += (flash * 7 - lightning.current.intensity) * 0.4
      } else {
        lightning.current.intensity *= 0.8
      }
    }
  })

  return (
    <group>
      <mesh material={skyMat} renderOrder={-10}>
        <sphereGeometry args={[240, 32, 24]} />
      </mesh>

      <points ref={starFarRef} geometry={stars.far} material={starMatFar} />
      <points ref={starNearRef} geometry={stars.near} material={starMatNear} />

      {/* North Star — high in the northern sky on the Core's axis (−Z) */}
      <sprite position={[0, 78, -160]} scale={[9, 9, 9]}>
        <spriteMaterial map={starGlow ?? undefined} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={scene.sky.northStar ? 1 : 0} />
      </sprite>

      {/* Moon with glow */}
      <group position={[64, 66, -170]}>
        <sprite scale={[46, 46, 1]}>
          <spriteMaterial map={moonGlow ?? undefined} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={scene.sky.moon ? 0.5 : 0} />
        </sprite>
        <mesh>
          <circleGeometry args={[9, 48]} />
          <meshBasicMaterial color="#eef0ea" transparent opacity={scene.sky.moon ? 0.98 : 0} depthWrite={false} />
        </mesh>
      </group>

      {/* Horizon sun/dawn glow */}
      <sprite position={[0, 4, -175]} scale={[300, 130, 1]}>
        <spriteMaterial map={softGlow ?? undefined} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={scene.sky.sunrise ? 0.55 : scene.time === 'day' ? 0.35 : 0.12} />
      </sprite>

      {/* Reflective lake between the shore and the observatory */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.6, -70]} material={waterMat}>
        <planeGeometry args={[360, 150]} />
      </mesh>
      {/* Moon glint on the water */}
      <sprite position={[40, 0.2, -60]} scale={[10, 40, 1]}>
        <spriteMaterial map={moonGlow ?? undefined} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={scene.sky.moon ? 0.28 : 0} />
      </sprite>

      {/* Three layered mountain ranges fading into atmosphere */}
      <Ridges />

      {/* Distant city lights along the far shore */}
      <points geometry={city} material={cityMat} />

      {/* Drifting cloud strata */}
      <group ref={cloudsRef}>
        {[0, 1, 2, 3, 4].map((i) => {
          const rnd = seeded(200 + i)
          const ang = Math.PI + rnd() * Math.PI
          const rad = 150 + rnd() * 40
          return (
            <sprite key={i} position={[Math.cos(ang) * rad, 40 + rnd() * 40, Math.sin(ang) * rad]} scale={[90 + rnd() * 60, 26 + rnd() * 16, 1]}>
              <spriteMaterial map={softGlow ?? undefined} transparent depthWrite={false} opacity={scene.sky.cloudDensity >= 1 ? 0.12 + i * 0.02 : 0.04} color={scene.time === 'night' ? '#2a3346' : '#8fa2b8'} />
            </sprite>
          )
        })}
      </group>

      {/* Precipitation */}
      <points ref={precipRef} geometry={precip} material={precipMat} />

      {/* Aurora ribbons on clear nights */}
      <group ref={auroraRef}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[(i - 1) * 34, 60 + i * 6, -160]} rotation={[0, 0, 0.2 - i * 0.15]}>
            <planeGeometry args={[80, 30]} />
            <meshBasicMaterial color={i === 1 ? '#5fe0a8' : '#57b6e0'} transparent opacity={scene.sky.aurora ? 0.18 : 0} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      {/* Storm flash light from beyond the glass */}
      <pointLight ref={lightning} position={[-34, 34, -66]} color="#cfe0ff" intensity={0} distance={220} />
    </group>
  )
}

/** Three layered mountain silhouettes with atmospheric colour fade. */
function Ridges() {
  const layers = useMemo(() => {
    function ridge(radius: number, base: number, height: number, seed: number) {
      const seg = 140
      const rnd = seeded(seed)
      const top: THREE.Vector3[] = []
      // Two-octave height so ranges read as peaks, not noise.
      for (let i = 0; i <= seg; i++) {
        const f = i / seg
        const ang = Math.PI + f * Math.PI
        const h = base + height * (0.35 + 0.4 * Math.abs(Math.sin(f * 9 + seed)) + 0.25 * rnd())
        top.push(new THREE.Vector3(Math.cos(ang) * radius, h, Math.sin(ang) * radius))
      }
      const pts: number[] = []
      for (let i = 0; i < seg; i++) {
        const a0 = top[i]
        const a1 = top[i + 1]
        pts.push(a0.x, a0.y, a0.z, a0.x, -2, a0.z, a1.x, a1.y, a1.z)
        pts.push(a1.x, a1.y, a1.z, a0.x, -2, a0.z, a1.x, -2, a1.z)
      }
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3))
      g.computeVertexNormals()
      return g
    }
    return [
      { geo: ridge(150, 6, 34, 11), color: '#2a3547' },
      { geo: ridge(118, 3, 24, 29), color: '#1a2233' },
      { geo: ridge(92, 0, 16, 43), color: '#0e1420' },
    ]
  }, [])
  return (
    <group>
      {layers.map((l, i) => (
        <mesh key={i} geometry={l.geo}>
          <meshBasicMaterial color={l.color} />
        </mesh>
      ))}
    </group>
  )
}
