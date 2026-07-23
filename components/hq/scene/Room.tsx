'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { MeshReflectorMaterial } from '@react-three/drei'
import { marbleTexture } from '../textures'

/**
 * Architectural shell (Blueprint §3, §6, §8): a circular executive observatory.
 * Honed Italian black-marble floor with concentric brass inlay rings on the
 * central axis; a limestone perimeter; a circular dome overhead with brass
 * structural ribs converging to a central skylight aligned directly above the
 * Core. Real geometry with PBR materials — foreground, midground, background.
 *
 * Units are metres. Room ≈ 24 m wide; dome springs at 5 m, apex ≈ 8.6 m.
 */

const ROOM_R = 13 // interior radius
const WALL_H = 5 // wall height to dome spring
const APEX_Y = 8.6 // dome apex
const SKYLIGHT_R = 2.2 // skylight aperture radius

export function Room() {
  const marble = marbleTexture()

  const floorMap = useMemo(() => {
    if (!marble) return null
    const t = marble.clone()
    t.needsUpdate = true
    t.repeat.set(3, 3)
    return t
  }, [marble])

  const limestoneMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#3a3a3e',
        roughness: 0.92,
        metalness: 0,
        side: THREE.BackSide,
      }),
    [],
  )

  const domeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2e2e33',
        roughness: 0.85,
        metalness: 0.05,
        side: THREE.BackSide,
      }),
    [],
  )

  const brass = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#c9a877',
        roughness: 0.32,
        metalness: 1,
        envMapIntensity: 1.2,
      }),
    [],
  )

  const bronze = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: '#8a744f', roughness: 0.4, metalness: 1, envMapIntensity: 1 }),
    [],
  )

  const columnStone = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#2b2b30', roughness: 0.75, metalness: 0.1, envMapIntensity: 0.5 }),
    [],
  )

  // Dome: a lathed spherical cap from the wall spring up to the skylight ring.
  const domeGeo = useMemo(() => {
    const pts: THREE.Vector2[] = []
    const seg = 40
    // Quarter-ellipse profile from (ROOM_R, WALL_H) to (SKYLIGHT_R, APEX_Y).
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * (Math.PI / 2)
      const x = SKYLIGHT_R + (ROOM_R - SKYLIGHT_R) * Math.cos(a)
      const y = WALL_H + (APEX_Y - WALL_H) * Math.sin(a)
      pts.push(new THREE.Vector2(x, y))
    }
    return new THREE.LatheGeometry(pts, 96)
  }, [])

  // Brass structural ribs converging toward the skylight (Blueprint §6).
  const ribs = useMemo(() => {
    const count = 16
    const arr: { geo: THREE.TubeGeometry; key: number }[] = []
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2
      const dir = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang))
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(dir.x * (ROOM_R - 0.05), WALL_H, dir.z * (ROOM_R - 0.05)),
        new THREE.Vector3(dir.x * (ROOM_R * 0.72), WALL_H + (APEX_Y - WALL_H) * 0.55, dir.z * (ROOM_R * 0.72)),
        new THREE.Vector3(dir.x * (SKYLIGHT_R + 0.1), APEX_Y - 0.15, dir.z * (SKYLIGHT_R + 0.1)),
      ])
      arr.push({ geo: new THREE.TubeGeometry(curve, 24, 0.09, 8, false), key: i })
    }
    return arr
  }, [])

  // Concentric brass inlay rings set into the floor beneath the Core (§8).
  const inlayRadii = [2.4, 3.4, 4.6, 6.0]

  // Coffered latitude rings on the dome — with the meridian ribs these read as
  // recessed coffers rather than exposed ribs over a void (Blueprint §6).
  const domeRings = useMemo(() => {
    const out: { y: number; r: number; key: number }[] = []
    const seg = 4
    for (let i = 1; i <= seg; i++) {
      const a = (i / (seg + 1)) * (Math.PI / 2)
      out.push({ y: WALL_H + (APEX_Y - WALL_H) * Math.sin(a), r: SKYLIGHT_R + (ROOM_R - SKYLIGHT_R) * Math.cos(a), key: i })
    }
    return out
  }, [])

  const oculusMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#1a1206', emissive: new THREE.Color('#3a2a12'), emissiveIntensity: 0.6, roughness: 0.6, metalness: 0.4, side: THREE.DoubleSide }),
    [],
  )

  // Substantial columns framing the panorama (Blueprint §5). Two heavy piers
  // flank the glass opening on the central axis; others punctuate the perimeter.
  const columnAngles = useMemo(() => {
    const arr: number[] = []
    // Framing columns: two pairs flank the panorama (never on the central
    // north axis behind the Core) plus two on the solid side behind the camera.
    for (const deg of [200, 240, 300, 340, 60, 120]) arr.push((deg * Math.PI) / 180)
    return arr
  }, [])

  return (
    <group>
      {/* Floor — honed Italian black marble with a soft (never mirror-like)
          reflection of the desk, Core and light (Blueprint §8, §12, §14). */}
      <mesh rotation-x={-Math.PI / 2} position-y={0} receiveShadow>
        <circleGeometry args={[ROOM_R + 6, 96]} />
        <MeshReflectorMaterial
          resolution={1024}
          mixBlur={1.1}
          mixStrength={2.6}
          blur={[420, 120]}
          mirror={0}
          depthScale={0.7}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.2}
          roughness={0.55}
          metalness={0.3}
          color="#8e8e96"
          {...(floorMap ? { map: floorMap, roughnessMap: floorMap } : {})}
        />
      </mesh>

      {/* Brass inlay rings, just proud of the marble */}
      {inlayRadii.map((r) => (
        <mesh key={r} rotation-x={-Math.PI / 2} position-y={0.006} material={brass}>
          <ringGeometry args={[r - 0.035, r + 0.035, 160]} />
        </mesh>
      ))}
      {/* Central brass medallion under the desk/Core axis */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.006} material={bronze}>
        <ringGeometry args={[0.0, 0.5, 64]} />
      </mesh>

      {/* Perimeter wall — solid limestone on the south half (behind camera, at
          +Z); the north half (−Z) is the glass wall (rendered separately). */}
      <mesh position-y={WALL_H / 2} material={limestoneMat}>
        <cylinderGeometry args={[ROOM_R, ROOM_R, WALL_H, 96, 1, true, 0, Math.PI]} />
      </mesh>

      {/* A low continuous plinth grounds the whole wall ring */}
      <mesh position-y={0.15} material={bronze}>
        <cylinderGeometry args={[ROOM_R + 0.02, ROOM_R + 0.02, 0.3, 96, 1, true]} />
      </mesh>

      {/* Dome */}
      <mesh material={domeMat} castShadow={false}>
        <primitive object={domeGeo} attach="geometry" />
      </mesh>

      {/* Ribs */}
      {ribs.map((r) => (
        <mesh key={r.key} material={brass} castShadow>
          <primitive object={r.geo} attach="geometry" />
        </mesh>
      ))}

      {/* Coffered latitude rings on the dome */}
      {domeRings.map((r) => (
        <mesh key={r.key} position-y={r.y} rotation-x={Math.PI / 2} material={bronze}>
          <torusGeometry args={[r.r, 0.05, 8, 120]} />
        </mesh>
      ))}

      {/* Oculus collar + glowing skylight ring at the apex, above the Core */}
      <mesh position-y={APEX_Y - 0.12} material={oculusMat}>
        <cylinderGeometry args={[SKYLIGHT_R + 0.35, SKYLIGHT_R, 0.5, 96, 1, true]} />
      </mesh>
      <mesh position-y={APEX_Y - 0.1} rotation-x={-Math.PI / 2} material={brass}>
        <torusGeometry args={[SKYLIGHT_R, 0.14, 16, 96]} />
      </mesh>

      {/* Framing columns */}
      {columnAngles.map((a, i) => {
        const x = Math.cos(a) * (ROOM_R - 0.35)
        const z = Math.sin(a) * (ROOM_R - 0.35)
        return (
          <group key={i} position={[x, 0, z]}>
            {/* Shaft */}
            <mesh position-y={WALL_H / 2} material={columnStone} castShadow>
              <cylinderGeometry args={[0.42, 0.46, WALL_H, 24]} />
            </mesh>
            {/* Bronze base + capital */}
            <mesh position-y={0.2} material={bronze}>
              <cylinderGeometry args={[0.54, 0.58, 0.4, 24]} />
            </mesh>
            <mesh position-y={WALL_H - 0.2} material={bronze}>
              <cylinderGeometry args={[0.5, 0.54, 0.4, 24]} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

export { ROOM_R, WALL_H, APEX_Y, SKYLIGHT_R }
