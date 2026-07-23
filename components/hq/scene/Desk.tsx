'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { marbleTexture, walnutTexture } from '../textures'

/**
 * The executive desk (Blueprint §9, table 6): ~12 ft × 5 ft × 30 in. A single
 * sculptural object — a black open-pore walnut body with a waterfall profile,
 * a visually seamless black-marble top, restrained brushed-brass trim, and a
 * concealed central projection aperture from which the Core's light rises. No
 * visible screens, keyboards, seams or cables.
 */

export const DESK_W = 3.66
export const DESK_D = 1.5
export const DESK_H = 0.76
export const DESK_TOP_Y = DESK_H

export function Desk() {
  const marble = marbleTexture()
  const walnut = walnutTexture()

  const walnutMat = useMemo(() => {
    // White base — the walnut albedo comes entirely from the texture map.
    const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5, metalness: 0.05, envMapIntensity: 1.1 })
    if (walnut) {
      const t = walnut.clone()
      t.needsUpdate = true
      t.repeat.set(2, 1)
      m.map = t
    }
    return m
  }, [walnut])

  const marbleMat = useMemo(() => {
    // Near-white base over the mid-tone marble map: reads as honed dark stone
    // under room light instead of a black hole.
    const m = new THREE.MeshStandardMaterial({ color: '#e8e8ee', roughness: 0.14, metalness: 0.25, envMapIntensity: 1.9 })
    if (marble) {
      const t = marble.clone()
      t.needsUpdate = true
      t.repeat.set(1.4, 0.7)
      m.map = t
      m.roughnessMap = t
    }
    return m
  }, [marble])

  const brass = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#cbaa79', roughness: 0.3, metalness: 1, envMapIntensity: 1.3 }),
    [],
  )
  const bronzeDark = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#5c4e38', roughness: 0.45, metalness: 1, envMapIntensity: 0.9 }),
    [],
  )
  const apertureMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0a0a0c', roughness: 0.5, metalness: 0.2 }),
    [],
  )

  const bodyTopY = DESK_H - 0.09

  return (
    <group>
      {/* Contact shadow catcher is handled by the floor + real shadows. */}

      {/* Walnut body — a broad waterfall pedestal (two side panels + core mass) */}
      <mesh position={[0, bodyTopY / 2, 0]} material={walnutMat} castShadow receiveShadow>
        <boxGeometry args={[DESK_W - 0.5, bodyTopY, DESK_D - 0.24]} />
      </mesh>
      {/* Waterfall end panels reaching the floor */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (DESK_W / 2 - 0.14), bodyTopY / 2, 0]} material={walnutMat} castShadow receiveShadow>
          <boxGeometry args={[0.28, bodyTopY, DESK_D]} />
        </mesh>
      ))}
      {/* Recessed toe plinth in bronze */}
      <mesh position={[0, 0.05, 0]} material={bronzeDark}>
        <boxGeometry args={[DESK_W - 0.7, 0.1, DESK_D - 0.5]} />
      </mesh>

      {/* Brass reveal line between body and top */}
      <mesh position={[0, bodyTopY + 0.015, 0]} material={brass}>
        <boxGeometry args={[DESK_W - 0.42, 0.03, DESK_D - 0.16]} />
      </mesh>

      {/* Marble top slab — visually seamless */}
      <mesh position={[0, DESK_H - 0.04, 0]} material={marbleMat} castShadow receiveShadow>
        <boxGeometry args={[DESK_W, 0.08, DESK_D]} />
      </mesh>
      {/* Thin brass edge inlay around the top */}
      <mesh position={[0, DESK_H - 0.005, 0]} material={brass}>
        <boxGeometry args={[DESK_W + 0.008, 0.006, DESK_D + 0.008]} />
      </mesh>

      {/* Concealed projection aperture, centred on the top */}
      <group position={[0, DESK_H + 0.001, 0]}>
        <mesh rotation-x={-Math.PI / 2} material={bronzeDark}>
          <ringGeometry args={[0.34, 0.42, 64]} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} material={brass}>
          <ringGeometry args={[0.3, 0.315, 64]} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={-0.002} material={apertureMat}>
          <circleGeometry args={[0.3, 64]} />
        </mesh>
      </group>
    </group>
  )
}
