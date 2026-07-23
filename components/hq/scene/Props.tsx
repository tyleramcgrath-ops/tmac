'use client'

import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * Curated observatory objects at the room's edges (Concept A): a brass
 * telescope, two pedestal armillary globes flanking the panorama, and a
 * leather reading chair. They make the room feel inhabited and balance the
 * composition without competing with the desk or Core.
 */
export function Props() {
  const brass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b9975f', roughness: 0.34, metalness: 1, envMapIntensity: 1.1 }), [])
  const bronze = useMemo(() => new THREE.MeshStandardMaterial({ color: '#5c4e38', roughness: 0.5, metalness: 1, envMapIntensity: 0.8 }), [])
  const leather = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3a2418', roughness: 0.55, metalness: 0.05, envMapIntensity: 0.5 }), [])
  const stone = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2b2b30', roughness: 0.8, metalness: 0.1 }), [])

  return (
    <group>
      {/* Telescope on a tripod, left of the panorama */}
      <group position={[-7.4, 0, -5.4]} rotation-y={0.6}>
        {/* Tripod legs */}
        {[0, 2.1, 4.2].map((a) => (
          <mesh key={a} position={[Math.cos(a) * 0.5, 0.8, Math.sin(a) * 0.5]} rotation-z={Math.cos(a) * 0.22} rotation-x={Math.sin(a) * 0.22} material={bronze}>
            <cylinderGeometry args={[0.035, 0.045, 1.7, 12]} />
          </mesh>
        ))}
        {/* Mount + tube */}
        <mesh position-y={1.6} material={bronze}>
          <sphereGeometry args={[0.1, 16, 16]} />
        </mesh>
        <mesh position={[0, 1.85, 0]} rotation-z={-0.7} material={brass}>
          <cylinderGeometry args={[0.11, 0.14, 1.2, 20]} />
        </mesh>
        <mesh position={[0.42, 2.2, 0]} rotation-z={-0.7} material={bronze}>
          <cylinderGeometry args={[0.05, 0.05, 0.24, 12]} />
        </mesh>
      </group>

      {/* Pedestal armillary globes flanking the panorama */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 6.2, 0, -6.2]}>
          <mesh position-y={0.6} material={stone}>
            <cylinderGeometry args={[0.22, 0.3, 1.2, 20]} />
          </mesh>
          <mesh position-y={1.25} material={bronze}>
            <cylinderGeometry args={[0.26, 0.26, 0.08, 20]} />
          </mesh>
          {/* Little armillary sphere */}
          <group position-y={1.6}>
            <mesh material={brass}>
              <torusGeometry args={[0.26, 0.015, 8, 60]} />
            </mesh>
            <mesh rotation-x={Math.PI / 2} material={brass}>
              <torusGeometry args={[0.26, 0.015, 8, 60]} />
            </mesh>
            <mesh rotation-y={Math.PI / 2} material={brass}>
              <torusGeometry args={[0.26, 0.015, 8, 60]} />
            </mesh>
            <mesh material={brass}>
              <sphereGeometry args={[0.05, 16, 16]} />
            </mesh>
          </group>
        </group>
      ))}

      {/* Leather reading chair, right of the desk */}
      <group position={[6.4, 0, -1.2]} rotation-y={-0.7}>
        <mesh position-y={0.42} material={leather} castShadow>
          <boxGeometry args={[0.9, 0.28, 0.9]} />
        </mesh>
        <mesh position={[0, 0.9, -0.38]} rotation-x={-0.12} material={leather} castShadow>
          <boxGeometry args={[0.9, 0.95, 0.16]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.46, 0.66, 0]} material={leather}>
            <boxGeometry args={[0.16, 0.42, 0.9]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
