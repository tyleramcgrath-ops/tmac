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
const BASE_H = 0.85 // stone parapet the glazing sits on

export function GlassWall() {
  const glassMat = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: '#0c131e',
      roughness: 0.12,
      metalness: 0,
      transmission: 0,
      transparent: true,
      opacity: 0.16,
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
  const stone = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#20222a', roughness: 0.85, metalness: 0.05, envMapIntensity: 0.4 }),
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

  const glassMidY = (BASE_H + GLASS_H) / 2
  const glassSpan = GLASS_H - BASE_H

  return (
    <group>
      {/* Stone parapet the glazing sits on (deep, with a brass cap) */}
      <mesh position-y={BASE_H / 2} material={stone} castShadow receiveShadow>
        <cylinderGeometry args={[ROOM_R + 0.05, ROOM_R + 0.18, BASE_H, 96, 1, true, NORTH_START, ARC]} />
      </mesh>
      <mesh position-y={BASE_H} rotation-x={Math.PI / 2} material={brass}>
        <torusGeometry args={[ROOM_R + 0.06, 0.05, 10, 120]} />
      </mesh>

      {/* Glass surface: an open half-cylinder above the parapet. */}
      <mesh position-y={glassMidY} material={glassMat} renderOrder={2}>
        <cylinderGeometry args={[ROOM_R - 0.02, ROOM_R - 0.02, glassSpan, 96, 1, true, NORTH_START, ARC]} />
      </mesh>

      {/* Deep bronze piers between the bays — set inboard with real depth */}
      {piers.map((v) => (
        <group key={v.key} position={[v.x, glassMidY, v.z]} rotation-y={v.ry}>
          <mesh material={bronze} castShadow>
            <boxGeometry args={[0.24, glassSpan, 0.62]} />
          </mesh>
          {/* Inner reveal fin — reads as frame depth */}
          <mesh position-z={0.34} material={stone}>
            <boxGeometry args={[0.16, glassSpan, 0.1]} />
          </mesh>
        </group>
      ))}

      {/* Deep bronze header beam (the eye reads real thickness at the top) */}
      <mesh position-y={GLASS_H} rotation-x={Math.PI / 2} material={bronze} castShadow>
        <torusGeometry args={[ROOM_R + 0.02, 0.2, 12, 120]} />
      </mesh>
      <mesh position-y={GLASS_H - 0.02} rotation-x={Math.PI / 2} material={brass}>
        <torusGeometry args={[ROOM_R - 0.02, 0.05, 10, 120]} />
      </mesh>

      {/* A restrained mid transom */}
      <mesh position-y={BASE_H + glassSpan * 0.62} rotation-x={Math.PI / 2} material={brass}>
        <torusGeometry args={[ROOM_R - 0.02, 0.045, 10, 120]} />
      </mesh>
    </group>
  )
}
