'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScene } from '../sceneContext'
import { glowSprite } from '../textures'

/**
 * Atmosphere (Blueprint §14): subtle dust particles visible only in directional
 * light, drifting slowly around the central axis. No exaggerated particle
 * storms — restraint is the rule.
 */
export function Atmosphere() {
  const { reduced } = useScene()
  const sprite = glowSprite('rgba(255,240,214,1)', 'rgba(255,240,214,0)')
  const ref = useRef<THREE.Points>(null)

  const geo = useMemo(() => {
    const N = 240
    const pos = new Float32Array(N * 3)
    let a = 12345
    const rnd = () => ((a = (a * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
    for (let i = 0; i < N; i++) {
      const r = rnd() * 4
      const th = rnd() * Math.PI * 2
      pos[i * 3] = Math.cos(th) * r
      pos[i * 3 + 1] = 0.4 + rnd() * 4
      pos[i * 3 + 2] = Math.sin(th) * r
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])

  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.03,
        map: sprite ?? undefined,
        color: '#ffe9c8',
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    [sprite],
  )

  useFrame((_, dt) => {
    if (reduced || !ref.current) return
    ref.current.rotation.y += dt * 0.02
    const p = geo.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) + dt * 0.05 * ((i % 3) - 1) * 0.4
      if (y > 4.6) y = 0.4
      if (y < 0.4) y = 4.6
      p.setY(i, y)
    }
    p.needsUpdate = true
  })

  return <points ref={ref} geometry={geo} material={mat} />
}
