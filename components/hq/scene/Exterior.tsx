'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScene } from '../sceneContext'
import { glowSprite } from '../textures'
import type { TimeOfDay } from '@/lib/hq/state'

/**
 * The world beyond the glass (Blueprint §7, §14). A gradient sky driven by time
 * of day, slowly-moving stars, the moon, the North Star in its correct
 * clear-night position, distant mountain/city silhouettes, and weather (rain,
 * snow, fog, storm lightning, rare aurora) that occurs outside the wall.
 */

const SKY: Record<TimeOfDay, { top: string; horizon: string }> = {
  dawn: { top: '#2a3355', horizon: '#e6ab74' },
  day: { top: '#41597a', horizon: '#c3d3e2' },
  dusk: { top: '#221b3a', horizon: '#d0754f' },
  night: { top: '#060912', horizon: '#141d2e' },
}

export function Exterior() {
  const { scene, reduced } = useScene()
  const starGlow = glowSprite('rgba(255,248,232,1)', 'rgba(255,248,232,0)')
  const softGlow = glowSprite('rgba(255,210,150,1)', 'rgba(255,210,150,0)')

  const skyMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTop: { value: new THREE.Color(SKY.night.top) },
        uHorizon: { value: new THREE.Color(SKY.night.horizon) },
      },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        varying vec3 vP; uniform vec3 uTop; uniform vec3 uHorizon;
        void main(){
          float h = clamp((normalize(vP).y + 0.15) / 1.15, 0.0, 1.0);
          vec3 c = mix(uHorizon, uTop, pow(h, 0.7));
          gl_FragColor = vec4(c, 1.0);
        }`,
    })
  }, [])

  // Deterministic star field on the upper hemisphere.
  const stars = useMemo(() => {
    const N = 900
    const pos = new Float32Array(N * 3)
    let a = 20260723
    const rnd = () => {
      a = (a + 0x6d2b79f5) | 0
      let t = Math.imul(a ^ (a >>> 15), 1 | a)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    for (let i = 0; i < N; i++) {
      const u = rnd()
      const v = rnd() * 0.6 + 0.05 // upper hemisphere bias
      const theta = u * Math.PI * 2
      const phi = Math.acos(1 - v)
      const r = 180
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.cos(phi)
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])

  // Rain / snow field (in front of the glass, outside).
  const precip = useMemo(() => {
    const N = 1400
    const pos = new Float32Array(N * 3)
    let a = 99
    const rnd = () => ((a = (a * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (rnd() - 0.5) * 60
      pos[i * 3 + 1] = rnd() * 40
      pos[i * 3 + 2] = -14 - rnd() * 30
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])
  const precipRef = useRef<THREE.Points>(null)
  const starRef = useRef<THREE.Points>(null)
  const lightning = useRef<THREE.PointLight>(null)
  const auroraRef = useRef<THREE.Group>(null)

  const starMat = useMemo(
    () => new THREE.PointsMaterial({ size: 1.1, map: starGlow ?? undefined, transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending, sizeAttenuation: true }),
    [starGlow],
  )
  const precipMat = useMemo(
    () => new THREE.PointsMaterial({ size: 0.09, color: '#cdd6e0', transparent: true, opacity: 0, depthWrite: false }),
    [],
  )

  const nightAmt = useRef(0)

  useFrame((_, dt) => {
    const s = scene.sky
    // Crossfade sky colours toward the current time of day.
    const target = SKY[scene.time]
    ;(skyMat.uniforms.uTop.value as THREE.Color).lerp(new THREE.Color(target.top), 0.05)
    ;(skyMat.uniforms.uHorizon.value as THREE.Color).lerp(new THREE.Color(target.horizon), 0.05)

    const starTarget = s.stars ? 0.9 : 0
    starMat.opacity += (starTarget - starMat.opacity) * 0.05
    nightAmt.current += ((s.stars ? 1 : 0) - nightAmt.current) * 0.05

    const precipOn = s.rain || s.snow
    precipMat.opacity += ((precipOn ? (s.snow ? 0.9 : 0.55) : 0) - precipMat.opacity) * 0.06
    precipMat.size = s.snow ? 0.16 : 0.09
    precipMat.color.set(s.snow ? '#f2f5f8' : '#aab6c4')

    if (!reduced) {
      if (starRef.current) starRef.current.rotation.y += dt * 0.005 // slow, correct star drift
      if (precipRef.current && precipOn) {
        const p = precip.attributes.position as THREE.BufferAttribute
        const fall = s.snow ? 6 : 34
        for (let i = 0; i < p.count; i++) {
          let y = p.getY(i) - dt * fall
          let x = p.getX(i)
          if (s.snow) x += Math.sin((y + i) * 0.5) * dt * 0.6
          if (y < 0) y += 40
          p.setY(i, y)
          p.setX(i, x)
        }
        p.needsUpdate = true
      }
      if (auroraRef.current) auroraRef.current.rotation.y += dt * 0.02
    }

    // Storm lightning: rare, brief flashes.
    if (lightning.current) {
      if (s.storm && !reduced) {
        const t = performance.now() / 1000
        const flash = Math.max(0, Math.sin(t * 1.7) > 0.985 ? 1 : 0) + (Math.sin(t * 5.3) > 0.995 ? 0.6 : 0)
        lightning.current.intensity += (flash * 6 - lightning.current.intensity) * 0.4
      } else {
        lightning.current.intensity *= 0.8
      }
    }
  })

  return (
    <group>
      {/* Sky dome */}
      <mesh material={skyMat} renderOrder={-10}>
        <sphereGeometry args={[200, 32, 24]} />
      </mesh>

      {/* Stars */}
      <points ref={starRef} geometry={stars} material={starMat} />

      {/* The North Star — high in the northern sky, on the Core's axis (−Z) */}
      <sprite position={[0, 70, -150]} scale={[7, 7, 7]}>
        <spriteMaterial map={starGlow ?? undefined} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={scene.sky.northStar ? 1 : 0} />
      </sprite>

      {/* Moon */}
      <mesh position={[70, 60, -150]}>
        <circleGeometry args={[7, 48]} />
        <meshBasicMaterial color="#eef0ea" transparent opacity={scene.sky.moon ? 0.95 : 0} depthWrite={false} />
      </mesh>

      {/* Horizon sun/dawn glow */}
      <sprite position={[0, 6, -160]} scale={[220, 120, 1]}>
        <spriteMaterial map={softGlow ?? undefined} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={scene.sky.sunrise ? 0.5 : scene.time === 'day' ? 0.35 : 0} />
      </sprite>

      {/* Distant ridge silhouettes (two layers for depth) */}
      <Ridges />

      {/* Precipitation outside the glass */}
      <points ref={precipRef} geometry={precip} material={precipMat} />

      {/* Aurora ribbons (clear nights) */}
      <group ref={auroraRef}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[(i - 1) * 30, 55 + i * 6, -150]} rotation={[0, 0, 0.2 - i * 0.15]}>
            <planeGeometry args={[70, 26]} />
            <meshBasicMaterial
              color={i === 1 ? '#5fe0a8' : '#57b6e0'}
              transparent
              opacity={scene.sky.aurora ? 0.16 : 0}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      {/* Lightning flash light from beyond the glass */}
      <pointLight ref={lightning} position={[-30, 30, -60]} color="#cfe0ff" intensity={0} distance={200} />
    </group>
  )
}

/** Layered mountain / city silhouettes near the horizon. */
function Ridges() {
  const geos = useMemo(() => {
    function ridge(radius: number, height: number, jitter: number, seed: number) {
      const seg = 120
      const pts: number[] = []
      let a = seed
      const rnd = () => ((a = (a * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
      // Build a strip around the north arc.
      const top: THREE.Vector3[] = []
      for (let i = 0; i <= seg; i++) {
        const ang = Math.PI + (i / seg) * Math.PI // north arc
        const h = height * (0.5 + rnd() * jitter)
        top.push(new THREE.Vector3(Math.cos(ang) * radius, h, Math.sin(ang) * radius))
      }
      for (let i = 0; i < seg; i++) {
        const a0 = top[i]
        const a1 = top[i + 1]
        const b0 = new THREE.Vector3(a0.x, 0, a0.z)
        const b1 = new THREE.Vector3(a1.x, 0, a1.z)
        pts.push(a0.x, a0.y, a0.z, b0.x, b0.y, b0.z, a1.x, a1.y, a1.z)
        pts.push(a1.x, a1.y, a1.z, b0.x, b0.y, b0.z, b1.x, b1.y, b1.z)
      }
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3))
      g.computeVertexNormals()
      return g
    }
    return [ridge(120, 26, 0.9, 7), ridge(90, 16, 0.7, 31)]
  }, [])
  return (
    <group>
      <mesh geometry={geos[0]}>
        <meshBasicMaterial color="#0a0f18" />
      </mesh>
      <mesh geometry={geos[1]}>
        <meshBasicMaterial color="#060a11" />
      </mesh>
    </group>
  )
}
