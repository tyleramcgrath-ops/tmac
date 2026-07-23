'use client'

import { Environment, Lightformer } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, SMAA, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { Room } from './Room'
import { GlassWall } from './GlassWall'
import { Desk } from './Desk'
import { Core } from './Core'
import { Exterior } from './Exterior'
import { Lighting } from './Lighting'
import { Atmosphere } from './Atmosphere'
import { Cameras, type CameraPreset } from './Cameras'

/**
 * The complete observatory, assembled inside the Canvas. Reflections come from
 * a controlled studio environment built from Lightformers (no external HDR
 * asset — CSP/offline safe), giving brass, marble and glass believable, never
 * mirror-like reflections (Blueprint §12, §14).
 */
export function Observatory({ cam, reduced }: { cam: CameraPreset; reduced: boolean }) {
  return (
    <>
      <Cameras preset={cam} reduced={reduced} />

      {/* Controlled reflection environment (studio lightformers). */}
      <Environment resolution={256} frames={1}>
        <color attach="background" args={['#050507']} />
        <Lightformer intensity={1.4} color="#ffe4bd" position={[0, 6, -8]} scale={[12, 6, 1]} />
        <Lightformer intensity={0.7} color="#bcd0ea" position={[-8, 4, 4]} scale={[6, 8, 1]} />
        <Lightformer intensity={0.7} color="#bcd0ea" position={[8, 4, 4]} scale={[6, 8, 1]} />
        <Lightformer intensity={0.5} color="#ffd9a6" position={[0, 8, 6]} scale={[10, 4, 1]} />
      </Environment>

      <Lighting />

      <Exterior />
      <Room />
      <GlassWall />
      <Desk />
      <Core />
      <Atmosphere />

      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom mipmapBlur intensity={0.32} luminanceThreshold={0.9} luminanceSmoothing={0.3} radius={0.55} />
        <SMAA />
        <Vignette eskil={false} offset={0.32} darkness={0.62} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  )
}
