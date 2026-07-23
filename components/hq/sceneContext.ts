'use client'

import { createContext, useContext } from 'react'
import type { SceneModel } from '@/lib/hq/state'

export interface HqContext {
  scene: SceneModel
  reduced: boolean
}

export const SceneCtx = createContext<HqContext | null>(null)

export function useScene(): HqContext {
  const ctx = useContext(SceneCtx)
  if (!ctx) throw new Error('useScene must be used within the headquarters scene')
  return ctx
}
