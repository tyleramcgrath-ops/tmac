'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Official camera system (Blueprint §13). Natural architectural perspective,
 * never orthographic; slow, deliberate, stabilised movement. Five named
 * positions; a subtle idle drift keeps the frame alive without game-camera
 * motion.
 */
export type CameraPreset = 'hero' | 'executive' | 'conversation' | 'atmospheric' | 'boardroom'

interface Shot {
  pos: [number, number, number]
  target: [number, number, number]
  fov: number
}

export const SHOTS: Record<CameraPreset, Shot> = {
  hero: { pos: [0, 2.15, 8.4], target: [0, 1.5, -2], fov: 44 },
  executive: { pos: [2.8, 2.9, 5.6], target: [-0.4, 1.35, -2.5], fov: 44 },
  conversation: { pos: [0, 2.15, 4.2], target: [0, 2.1, -0.5], fov: 42 },
  atmospheric: { pos: [0, 0.8, 5.4], target: [0, 5.2, -1.5], fov: 55 },
  boardroom: { pos: [8.4, 2.7, 5.4], target: [-1.5, 1.5, -3], fov: 46 },
}

export function Cameras({ preset, reduced }: { preset: CameraPreset; reduced: boolean }) {
  const { camera, size } = useThree()
  const target = useRef(new THREE.Vector3())
  const curPos = useRef(new THREE.Vector3())
  const curTgt = useRef(new THREE.Vector3())
  const inited = useRef(false)

  useFrame((state, dt) => {
    const shot = SHOTS[preset]
    const cam = camera as THREE.PerspectiveCamera

    // Aspect + fov (kept perspective/architectural, never orthographic).
    const aspect = size.width / Math.max(1, size.height)
    cam.aspect = aspect
    if (Math.abs(cam.fov - shot.fov) > 0.01) cam.fov = shot.fov
    cam.updateProjectionMatrix()

    // Subtle stabilised drift.
    const t = reduced ? 0 : state.clock.elapsedTime
    const driftX = Math.sin(t * 0.12) * 0.18
    const driftY = Math.cos(t * 0.09) * 0.09
    const desiredPos = new THREE.Vector3(shot.pos[0] + driftX, shot.pos[1] + driftY, shot.pos[2])
    target.current.set(...shot.target)

    if (!inited.current) {
      curPos.current.copy(desiredPos)
      curTgt.current.copy(target.current)
      inited.current = true
    }
    // Ease toward the shot (fast on preset change, gentle otherwise).
    const ease = 1 - Math.pow(0.001, dt)
    curPos.current.lerp(desiredPos, ease)
    curTgt.current.lerp(target.current, ease)
    cam.position.copy(curPos.current)
    cam.lookAt(curTgt.current)
  })

  return null
}
