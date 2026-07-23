'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScene } from '../sceneContext'
import type { CoreState } from '@/lib/hq/state'

/**
 * The North Star Core (Blueprint §10, tables 7–8): a physically engineered
 * luxury artifact ~42 in across, floating ~4 ft above the desk. Machined
 * titanium inner ring, optical-crystal middle ring with embedded illumination,
 * brushed-brass outer ring engraved with celestial coordinates, and a
 * warm-white crystal star at the centre with controlled bloom. Independent
 * gimbals rotate on their own axes with believable clearances.
 */

export const CORE_Y = 2.35

// Warm-white intelligence light; cools for thinking, ambers for warning.
const ACCENT: Record<CoreState, string> = {
  idle: '#ffe6bd',
  listening: '#ffedcf',
  thinking: '#cfe0ef',
  speaking: '#fff0d6',
  opportunity: '#ffe0a8',
  concern: '#e0a24a',
  completion: '#ffe9c4',
}

/** Eight-point star (four dominant + four secondary) as a solid extrusion. */
function starShape() {
  const s = new THREE.Shape()
  const R = 0.34
  const dominant = R
  const secondary = R * 0.5
  const valley = R * 0.13
  for (let k = 0; k < 8; k++) {
    const tipR = k % 2 === 0 ? dominant : secondary
    const tipA = (k / 8) * Math.PI * 2
    const valA = tipA + Math.PI / 8
    if (k === 0) s.moveTo(Math.cos(tipA) * tipR, Math.sin(tipA) * tipR)
    else s.lineTo(Math.cos(tipA) * tipR, Math.sin(tipA) * tipR)
    s.lineTo(Math.cos(valA) * valley, Math.sin(valA) * valley)
  }
  s.closePath()
  return s
}

export function Core() {
  const { scene, reduced } = useScene()
  const accent = new THREE.Color(ACCENT[scene.core])

  const outer = useRef<THREE.Group>(null)
  const middle = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const star = useRef<THREE.Group>(null)
  const crystal = useRef<THREE.Mesh>(null)
  const light = useRef<THREE.PointLight>(null)

  // Materials
  const brass = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#caa978', roughness: 0.3, metalness: 1, envMapIntensity: 1.5 }),
    [],
  )
  const titanium = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#3a3d44', roughness: 0.35, metalness: 1, envMapIntensity: 1.2 }),
    [],
  )
  // Smoked optical crystal with warm-white embedded illumination — never a
  // neon-blue default glow (Bible §04 / Blueprint table 7).
  const crystalRingMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#1c1d22',
        roughness: 0.08,
        metalness: 0,
        transmission: 0.4,
        transparent: true,
        opacity: 0.9,
        emissive: new THREE.Color('#ffe2b0'),
        emissiveIntensity: 0.55,
        clearcoat: 1,
      }),
    [],
  )
  const starMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#fff4df',
        roughness: 0.25,
        metalness: 0.6,
        emissive: new THREE.Color('#ffdca0'),
        emissiveIntensity: 0.85,
        envMapIntensity: 1.4,
      }),
    [],
  )
  const coreMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: new THREE.Color('#fff0d0'), emissiveIntensity: 2.1 }),
    [],
  )
  const obsidian = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: '#0a0a0d', roughness: 0.12, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.2 }),
    [],
  )
  const bearingMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#e0c496', roughness: 0.25, metalness: 1, envMapIntensity: 1.6 }),
    [],
  )
  // Bearing nubs where the gimbals pivot, on the outer ring plane.
  const bearings = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]

  const star2D = useMemo(() => starShape(), [])

  // Radial tick marks engraved around the outer brass ring.
  const ticks = useMemo(() => {
    const arr: { x: number; y: number; rot: number; long: boolean; key: number }[] = []
    const n = 72
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      arr.push({ x: Math.cos(a) * 0.5, y: Math.sin(a) * 0.5, rot: a, long: i % 6 === 0, key: i })
    }
    return arr
  }, [])

  useFrame((_, dt) => {
    // Update live accent colour on emissive + light.
    starMat.emissive.lerp(accent, 0.08)
    coreMat.emissive.lerp(accent, 0.08)
    if (light.current) light.current.color.lerp(accent, 0.08)

    if (reduced) return
    const speed: Record<CoreState, number> = {
      idle: 0.06,
      listening: 0.04,
      thinking: 0.5,
      speaking: 0.16,
      opportunity: 0.02,
      concern: 0.03,
      completion: 0.2,
    }
    const k = speed[scene.core]
    if (outer.current) outer.current.rotation.z += dt * k * 0.6
    if (middle.current) middle.current.rotation.x += dt * k * 0.9
    if (inner.current) inner.current.rotation.y += dt * k * 1.2

    // Crystal breathing / cadence.
    const t = performance.now() / 1000
    let pulse = 1 + Math.sin((t / 18) * Math.PI * 2) * 0.02 // idle: one breath / 18s
    if (scene.core === 'speaking') pulse = 1 + Math.sin(t * 3.4) * 0.09
    if (scene.core === 'listening') pulse = 1.03
    if (crystal.current) crystal.current.scale.setScalar(pulse)
    if (light.current) light.current.intensity = (scene.core === 'concern' ? 2.4 : 4.2) * pulse
    if (star.current) star.current.scale.setScalar(1 + (pulse - 1) * 0.5)
  })

  return (
    <group position={[0, CORE_Y, 0]}>
      {/* Warm localized light the Core casts into the room (reflections on
          desk + floor). Never overpowering (Blueprint §11). */}
      <pointLight ref={light} color={ACCENT.idle} intensity={4} distance={9} decay={2} castShadow />

      {/* Fixed outer guard ring with gimbal bearings (the mounting frame) */}
      <group>
        <mesh material={brass} castShadow>
          <torusGeometry args={[0.56, 0.018, 16, 160]} />
        </mesh>
        {bearings.map((a, i) => (
          <mesh key={i} position={[Math.cos(a) * 0.56, Math.sin(a) * 0.56, 0]} material={bearingMat} castShadow>
            <sphereGeometry args={[0.035, 16, 16]} />
          </mesh>
        ))}
      </group>

      {/* Outer brushed-brass ring, engraved (gimbal on Z) */}
      <group ref={outer} rotation={[0.32, 0, 0]}>
        <mesh material={brass} castShadow>
          <torusGeometry args={[0.5, 0.026, 20, 160]} />
        </mesh>
        {/* Inner engraved coordinate band */}
        <mesh material={brass}>
          <torusGeometry args={[0.47, 0.012, 12, 160]} />
        </mesh>
        {ticks.map((tk) => (
          <mesh key={tk.key} position={[tk.x, tk.y, 0]} rotation={[0, 0, tk.rot]} material={brass}>
            <boxGeometry args={[tk.long ? 0.05 : 0.03, 0.004, 0.012]} />
          </mesh>
        ))}
      </group>

      {/* Middle optical-crystal ring with embedded illumination (gimbal on X) */}
      <group ref={middle} rotation={[0, 0, 0.6]}>
        <mesh material={crystalRingMat}>
          <torusGeometry args={[0.43, 0.03, 20, 140]} />
        </mesh>
      </group>

      {/* Inner machined-titanium ring (gimbal on Y) */}
      <group ref={inner} rotation={[0.9, 0, 0]}>
        <mesh material={titanium} castShadow>
          <torusGeometry args={[0.36, 0.022, 18, 120]} />
        </mesh>
        <mesh material={titanium}>
          <torusGeometry args={[0.29, 0.014, 12, 100]} />
        </mesh>
      </group>

      {/* Obsidian hub disc behind the star — distinct dark material the star
          is mounted against (visible between the arms). */}
      <mesh material={obsidian} position-z={-0.05} scale={[1, 1, 0.28]}>
        <sphereGeometry args={[0.17, 32, 32]} />
      </mesh>

      {/* The warm-white crystal star, facing the camera (+Z) */}
      <group ref={star}>
        <mesh material={starMat} castShadow position-z={-0.04}>
          <extrudeGeometry
            args={[star2D, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 }]}
          />
        </mesh>
        <mesh ref={crystal} material={coreMat}>
          <icosahedronGeometry args={[0.07, 2]} />
        </mesh>
      </group>
    </group>
  )
}
