'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { marbleTexture, walnutTexture } from '../textures'

/**
 * The executive desk (Blueprint §9) — matched to the Concept A reference: a
 * round marble-and-walnut drum on a raised dais, with brass vertical ribs and
 * banding, a honed black-marble top with a concentric brass inlay and a
 * concealed central projection aperture, and a premium tufted leather chair.
 * The dominant sculptural foreground object.
 */

export const DESK_H = 0.76
export const DESK_TOP_Y = DESK_H
const DRUM_R = 1.55
const TOP_R = 1.7
const DAIS_R = 2.5

export function Desk() {
  const marble = marbleTexture()
  const walnut = walnutTexture()

  const walnutMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5, metalness: 0.05, envMapIntensity: 1.1 })
    if (walnut) {
      const t = walnut.clone()
      t.needsUpdate = true
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.repeat.set(6, 1)
      m.map = t
    }
    return m
  }, [walnut])

  const marbleMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#e6e6ec', roughness: 0.16, metalness: 0.2, envMapIntensity: 1.7 })
    if (marble) {
      const t = marble.clone()
      t.needsUpdate = true
      t.repeat.set(2, 2)
      m.map = t
      m.roughnessMap = t
    }
    return m
  }, [marble])

  const brass = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#c9a877', roughness: 0.3, metalness: 1, envMapIntensity: 1.3 }),
    [],
  )
  const bronzeDark = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#5c4e38', roughness: 0.45, metalness: 1, envMapIntensity: 0.9 }),
    [],
  )
  const apertureMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#141014', roughness: 0.5, metalness: 0.2 }),
    [],
  )
  const leather = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#3a2418', roughness: 0.55, metalness: 0.05, envMapIntensity: 0.6 }),
    [],
  )

  // Brass vertical ribs around the drum.
  const ribs = useMemo(() => Array.from({ length: 16 }, (_, i) => (i / 16) * Math.PI * 2), [])

  return (
    <group>
      {/* Raised marble dais */}
      <mesh position-y={0.07} material={marbleMat} receiveShadow castShadow>
        <cylinderGeometry args={[DAIS_R, DAIS_R + 0.1, 0.14, 64]} />
      </mesh>
      <mesh position-y={0.145} rotation-x={-Math.PI / 2} material={brass}>
        <ringGeometry args={[DAIS_R - 0.04, DAIS_R - 0.005, 64]} />
      </mesh>

      {/* Walnut drum body */}
      <mesh position-y={0.14 + (DESK_H - 0.14 - 0.12) / 2 + 0.02} material={walnutMat} castShadow receiveShadow>
        <cylinderGeometry args={[DRUM_R, DRUM_R + 0.06, DESK_H - 0.14 - 0.12, 64]} />
      </mesh>
      {/* Brass ribs */}
      {ribs.map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * (DRUM_R + 0.03), 0.44, Math.sin(a) * (DRUM_R + 0.03)]} rotation-y={-a} material={brass}>
          <boxGeometry args={[0.05, DESK_H - 0.3, 0.09]} />
        </mesh>
      ))}
      {/* Brass banding top and bottom of the drum */}
      <mesh position-y={0.2} rotation-x={Math.PI / 2} material={brass}>
        <torusGeometry args={[DRUM_R + 0.04, 0.03, 10, 80]} />
      </mesh>
      <mesh position-y={DESK_H - 0.16} rotation-x={Math.PI / 2} material={brass}>
        <torusGeometry args={[DRUM_R + 0.05, 0.035, 10, 80]} />
      </mesh>

      {/* Marble top slab with a real edge */}
      <mesh position-y={DESK_H - 0.06} material={marbleMat} castShadow receiveShadow>
        <cylinderGeometry args={[TOP_R, TOP_R, 0.13, 64]} />
      </mesh>
      {/* Brass edge inlay + a concentric inlay ring on the surface */}
      <mesh position-y={DESK_H + 0.004} rotation-x={-Math.PI / 2} material={brass}>
        <ringGeometry args={[TOP_R - 0.05, TOP_R - 0.02, 64]} />
      </mesh>
      <mesh position-y={DESK_H + 0.004} rotation-x={-Math.PI / 2} material={brass}>
        <ringGeometry args={[0.66, 0.69, 64]} />
      </mesh>

      {/* Concealed projection aperture, centred on the top */}
      <group position={[0, DESK_H + 0.006, 0]}>
        <mesh rotation-x={-Math.PI / 2} material={bronzeDark}>
          <ringGeometry args={[0.34, 0.44, 64]} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} material={brass}>
          <ringGeometry args={[0.3, 0.315, 64]} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={-0.002} material={apertureMat}>
          <circleGeometry args={[0.3, 64]} />
        </mesh>
      </group>

      {/* Premium leather executive chair, tucked at the far edge */}
      <group position={[0, 0, -1.85]}>
        {/* Seat */}
        <mesh position-y={0.5} material={leather} castShadow>
          <boxGeometry args={[0.62, 0.16, 0.6]} />
        </mesh>
        {/* Backrest (slightly reclined) */}
        <mesh position={[0, 0.98, -0.28]} rotation-x={-0.14} material={leather} castShadow>
          <boxGeometry args={[0.62, 0.86, 0.14]} />
        </mesh>
        {/* Armrests */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.36, 0.66, 0.02]} material={leather}>
            <boxGeometry args={[0.08, 0.1, 0.5]} />
          </mesh>
        ))}
        {/* Pedestal + base */}
        <mesh position-y={0.28} material={bronzeDark}>
          <cylinderGeometry args={[0.06, 0.06, 0.36, 16]} />
        </mesh>
        <mesh position-y={0.06} material={bronzeDark}>
          <cylinderGeometry args={[0.34, 0.36, 0.08, 24]} />
        </mesh>
      </group>
    </group>
  )
}
