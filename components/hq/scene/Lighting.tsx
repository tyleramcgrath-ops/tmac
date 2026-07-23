'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScene } from '../sceneContext'
import { ROOM_R, WALL_H } from './Room'
import type { EnvironmentState, TimeOfDay } from '@/lib/hq/state'

/**
 * Lighting plan (Blueprint §11): depth through contrast, pools of illumination,
 * believable sources. Concealed warm architectural cove light around the dome
 * spring, natural directional light entering through the glass wall (colour and
 * intensity by time and environment), and deep readable shadows. Uniform
 * brightness is prohibited — ambient fill is deliberately low.
 */

// Natural light entering through the glass: colour + intensity by time of day.
const NATURAL: Record<TimeOfDay, { color: string; intensity: number }> = {
  dawn: { color: '#ffcf9c', intensity: 3.0 },
  day: { color: '#eaf1ff', intensity: 4.4 },
  dusk: { color: '#ff9e73', intensity: 2.6 },
  night: { color: '#9fb6e0', intensity: 1.4 },
}

// Environment scales the natural light (storms darken; success brightens).
const ENV_SCALE: Record<EnvironmentState, number> = {
  confident: 1,
  analyzing: 0.8,
  uncertain: 0.6,
  warning: 0.45,
  overnight: 0.5,
  success: 1.15,
}

export function Lighting() {
  const { scene } = useScene()
  const key = useRef<THREE.DirectionalLight>(null)

  // Warm cove lights concealed at the dome spring line.
  const coves = useMemo(() => {
    const n = 6
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2
      return { x: Math.cos(a) * (ROOM_R - 1.5), z: Math.sin(a) * (ROOM_R - 1.5), key: i }
    })
  }, [])

  useFrame(() => {
    if (!key.current) return
    const nat = NATURAL[scene.time]
    const target = nat.intensity * ENV_SCALE[scene.env]
    key.current.intensity += (target - key.current.intensity) * 0.04
    key.current.color.lerp(new THREE.Color(nat.color), 0.04)
  })

  return (
    <group>
      {/* Low ambient + hemisphere fill — keeps shadows readable, never flat */}
      <hemisphereLight args={['#3a4859', '#181109', 1.1]} />
      <ambientLight intensity={0.32} />

      {/* Natural key light through the glass wall (north, high) */}
      <directionalLight
        ref={key}
        position={[-8, 16, -22]}
        intensity={0.6}
        color="#eaf1ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-bias={-0.0004}
      />

      {/* Warm concealed cove pools around the dome spring */}
      {coves.map((c) => (
        <pointLight
          key={c.key}
          position={[c.x, WALL_H - 0.3, c.z]}
          color="#ffcf9c"
          intensity={9}
          distance={18}
          decay={2}
        />
      ))}

      {/* A soft warm uplight grazing the desk from the projection base */}
      <pointLight position={[0, 0.9, 0]} color="#ffdca6" intensity={3.2} distance={5} decay={2} />

      {/* Architectural fills as DIRECTIONAL lights — no distance falloff, so
          the desk, Core and floor read at room scale while the cove point
          lights above still supply the warm pools. */}
      {/* Warm key from the front-right (camera side), grazing the desk. */}
      <directionalLight
        position={[5, 7, 8]}
        intensity={1.5}
        color="#fff0d8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0005}
      />
      {/* Cool counter-fill from the front-left keeps shadows from going black. */}
      <directionalLight position={[-7, 5, 6]} intensity={0.55} color="#c6d4e8" />

      {/* Cool moonlight raking in through the glass wall (from the north). */}
      <directionalLight position={[-6, 9, -14]} intensity={0.7} color="#aebfe0" />

      {/* Warm architectural bounce rising off the marble floor. */}
      <pointLight position={[0, 0.4, 2.5]} color="#c99a5e" intensity={12} distance={12} decay={2} />
      <hemisphereLight args={['#20344f', '#3a2a18', 0.35]} />
    </group>
  )
}
