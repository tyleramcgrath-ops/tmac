'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { marbleTexture, walnutTexture } from '../textures'

/**
 * The executive desk (Concept A): a broad, low luxury desk — roughly 2.6× wider
 * than deep — with softly curved corners, a dark open-pore walnut body, a thick
 * honed black-marble top with brushed-brass edge and base details, and a
 * premium leather chair centered behind it. It sits directly on the marble
 * floor (no raised platform) and reads as executive furniture.
 */

export const DESK_H = 0.76
export const DESK_TOP_Y = DESK_H
const W = 3.5 // width
const D = 1.35 // depth
const BODY_H = 0.6

function roundedRect(s: THREE.Shape, w: number, d: number, r: number) {
  s.moveTo(-w / 2 + r, -d / 2)
  s.lineTo(w / 2 - r, -d / 2)
  s.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r)
  s.lineTo(w / 2, d / 2 - r)
  s.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2)
  s.lineTo(-w / 2 + r, d / 2)
  s.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r)
  s.lineTo(-w / 2, -d / 2 + r)
  s.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2)
}

export function Desk() {
  const marble = marbleTexture()
  const walnut = walnutTexture()

  const walnutMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5, metalness: 0.05, envMapIntensity: 1.0 })
    if (walnut) {
      const t = walnut.clone()
      t.needsUpdate = true
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.repeat.set(3, 1)
      m.map = t
    }
    return m
  }, [walnut])

  const marbleMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#e6e6ec', roughness: 0.16, metalness: 0.2, envMapIntensity: 1.7 })
    if (marble) {
      const t = marble.clone()
      t.needsUpdate = true
      t.repeat.set(2, 1)
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

  const bodyGeo = useMemo(() => {
    const s = new THREE.Shape()
    roundedRect(s, W, D, 0.3)
    const g = new THREE.ExtrudeGeometry(s, { depth: BODY_H, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 })
    g.rotateX(-Math.PI / 2)
    return g
  }, [])
  const topGeo = useMemo(() => {
    const s = new THREE.Shape()
    roundedRect(s, W + 0.08, D + 0.08, 0.32)
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2 })
    g.rotateX(-Math.PI / 2)
    return g
  }, [])

  return (
    <group>
      {/* Walnut body */}
      <mesh geometry={bodyGeo} material={walnutMat} position-y={0.03} castShadow receiveShadow />
      {/* Brushed-brass base rail */}
      <mesh position-y={0.05} material={brass}>
        <boxGeometry args={[W - 0.5, 0.05, D - 0.4]} />
      </mesh>
      {/* Marble top slab */}
      <mesh geometry={topGeo} material={marbleMat} position-y={BODY_H} castShadow receiveShadow />

      {/* Concealed projection aperture, centred on the top */}
      <group position={[0, DESK_H + 0.006, 0]}>
        <mesh rotation-x={-Math.PI / 2} material={bronzeDark}>
          <ringGeometry args={[0.32, 0.42, 64]} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} material={brass}>
          <ringGeometry args={[0.28, 0.295, 64]} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={-0.002} material={apertureMat}>
          <circleGeometry args={[0.28, 64]} />
        </mesh>
      </group>

      {/* Premium leather executive chair, centered behind the desk */}
      <group position={[0, 0, -1.35]}>
        <mesh position-y={0.5} material={leather} castShadow>
          <boxGeometry args={[0.66, 0.16, 0.62]} />
        </mesh>
        <mesh position={[0, 1.0, -0.3]} rotation-x={-0.12} material={leather} castShadow>
          <boxGeometry args={[0.66, 0.92, 0.14]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.38, 0.66, 0.02]} material={leather}>
            <boxGeometry args={[0.08, 0.1, 0.52]} />
          </mesh>
        ))}
        <mesh position-y={0.28} material={bronzeDark}>
          <cylinderGeometry args={[0.06, 0.06, 0.36, 16]} />
        </mesh>
        <mesh position-y={0.06} material={bronzeDark}>
          <cylinderGeometry args={[0.36, 0.38, 0.08, 24]} />
        </mesh>
      </group>
    </group>
  )
}
