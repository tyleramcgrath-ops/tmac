'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useTrader } from '@/lib/client/use-trader'
import type { PublicState } from '@/lib/client/api'

interface Ctx {
  state: PublicState | null
  error: string | null
  refresh: () => Promise<void>
}

const TraderCtx = createContext<Ctx | null>(null)

export function TraderProvider({ children }: { children: ReactNode }) {
  const trader = useTrader(5000)
  return <TraderCtx.Provider value={trader}>{children}</TraderCtx.Provider>
}

export function useTraderContext(): Ctx {
  const ctx = useContext(TraderCtx)
  if (!ctx) throw new Error('useTraderContext must be used within TraderProvider')
  return ctx
}
