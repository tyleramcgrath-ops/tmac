'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { ROOM_R, WALL_H } from './Room'

/**
 * Panoramic glass wall (Blueprint §7): ~180° of smoked architectural glazing
 * on the north half of the observatory, with thin but credible brushed-brass
 * mullions. Controlled reflectivity — never mirror-like.
 *
 * The glass is a faux-glass material (dark tint + fresnel rim + env reflection)
 * rather than physical transmission: it is far more controllable for "smoked,
 * restrained" glass and much cheaper to render than a transmission pass.
 */

const NORTH_START = Math.PI // north half (−Z), 180° arc
const ARC = Math.PI
const GLASS_H = WALL_H + 0.4

export function GlassWall() {
  const glassMat = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: '#0a0f16',
      roughness: 0.12,
      metalness: 0,
      transmission: 0,
      transparent: true,
      opacity: 0.3,
      envMapIntensity: 0.5,
      reflectivity: 0.35,
      clearcoat: 1,
      clearcoatRoughness: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    return m
  }, [])

  const brass = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#caa978', roughness: 0.34, metalness: 1, envMapIntensity: 1.2 }),
    [],
  )
  const bronze = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#6f5c3f', roughness: 0.45, metalness: 1, envMapIntensity: 0.9 }),
    [],
  )

  // Fewer, larger structural divisions: 6 bays → substantial bronze piers,
  // not a greenhouse of thin mullions (Blueprint refinement).
  const piers = useMemo(() => {
    // Bay-centred so a glass pane — not a pier — sits on the central axis and
    // the Core floats free against open glass.
    const n = 6
    const arr: { x: number; z: number; ry: number; key: number }[] = []
    for (let i = 0; i < n; i++) {
      const a = NORTH_START + ((i + 0.5) / n) * ARC
      arr.push({ x: Math.cos(a) * ROOM_R, z: Math.sin(a) * ROOM_R, ry: -a, key: i })
    }
    return arr
  }, [])

  // One restrained horizontal transom, high on the glazing.
  const transoms = [GLASS_H * 0.68]

  return (
    <group>
      {/* Glass surface: an open half-cylinder facing the room interior. */}
      <mesh position-y={GLASS_H / 2} material={glassMat} renderOrder={2}>
        <cylinderGeometry args={[ROOM_R - 0.02, ROOM_R - 0.02, GLASS_H, 96, 1, true, NORTH_START, ARC]} />
      </mesh>

      {/* Substantial structural piers between the glass bays */}
      {piers.map((v) => (
        <mesh key={v.key} position={[v.x, GLASS_H / 2, v.z]} rotation-y={v.ry} material={bronze} castShadow>
          <boxGeometry args={[0.26, GLASS_H, 0.5]} />
        </mesh>
      ))}

      {/* Restrained horizontal transom */}
      {transoms.map((h) => (
        <mesh key={h} position-y={h} rotation-x={Math.PI / 2} material={brass}>
          <torusGeometry args={[ROOM_R - 0.02, 0.06, 10, 120]} />
        </mesh>
      ))}

      {/* Head and sill rails */}
      {[0.08, GLASS_H].map((h) => (
        <mesh key={h} position-y={h} rotation-x={Math.PI / 2} material={bronze}>
          <torusGeometry args={[ROOM_R, 0.12, 12, 120]} />
        </mesh>
      ))}
    </group>
  )
}
