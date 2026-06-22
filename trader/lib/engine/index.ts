import { getStore, type AppState } from '../db'
import { isAssetTradable, getMarketStatus } from '../market-hours'
import { getQuotes } from '../market-data'
import type { AssetType } from '../types'
import { audit, recordRiskEvent } from './audit-logger'
import { executeSignal } from './order-manager'
import { markToMarket } from './position-manager'
import { evaluateStrategy, exitSignals } from './signal-engine'

export * from './risk-manager'
export { executeSignal, confirmOrder } from './order-manager'

const TICK_MS = 2_000

declare global {
  // eslint-disable-next-line no-var
  var __traderEngineTimer: ReturnType<typeof setInterval> | undefined
  // eslint-disable-next-line no-var
  var __traderTicking: boolean | undefined
}

export function isEngineRunning(): boolean {
  return !!globalThis.__traderEngineTimer
}

/**
 * One scheduler tick: refresh quotes, mark positions to market, apply protective
 * exits, then evaluate every enabled & market-eligible strategy.
 */
export async function runTick(state: AppState): Promise<void> {
  if (globalThis.__traderTicking) return // prevent overlap
  globalThis.__traderTicking = true
  try {
    const enabled = state.strategies.filter((s) => s.enabled)

    // Collect every symbol we need a quote for.
    const symbolSet = new Map<string, AssetType>()
    for (const s of enabled) for (const sym of s.symbols) symbolSet.set(sym, s.assetType)
    for (const p of state.positions) symbolSet.set(p.symbol, p.assetType)

    const quotes = symbolSet.size
      ? await getQuotes([...symbolSet].map(([symbol, assetType]) => ({ symbol, assetType })))
      : []
    const quoteMap = new Map(quotes.map((q) => [q.symbol, q.price]))
    const quoteFor = (sym: string) => quoteMap.get(sym)

    markToMarket(state, quotes)

    // 1. Protective exits first (always allowed to reduce risk, even if the
    //    underlying market gate would block new entries — except kill switch).
    if (!state.risk.killSwitchEngaged) {
      for (const sig of exitSignals(state, quoteFor)) {
        await executeSignal(state, sig.strategy, sig)
      }
    }

    // 2. Strategy entries, gated by market hours per asset type.
    for (const strategy of enabled) {
      if (state.risk.killSwitchEngaged) break
      if (!isAssetTradable(strategy.assetType)) {
        continue // e.g. equities/options strategies idle outside market hours
      }
      const signals = await evaluateStrategy(state, strategy, quoteFor)
      for (const sig of signals) {
        await executeSignal(state, sig.strategy, sig)
      }
    }

    const store = await getStore()
    store.schedulePersist()
  } finally {
    globalThis.__traderTicking = false
  }
}

export async function startEngine(): Promise<void> {
  const store = await getStore()
  const state = store.get()
  if (state.risk.killSwitchEngaged) {
    throw new Error('Cannot start: kill switch is engaged. Disengage it first.')
  }
  if (globalThis.__traderEngineTimer) return
  audit(state, 'system', 'Trading engine started.')
  globalThis.__traderEngineTimer = setInterval(() => {
    void (async () => {
      try {
        const s = await getStore()
        await runTick(s.get())
      } catch (e) {
        // Never let a tick error kill the loop.
        const s = await getStore()
        recordRiskEvent(s.get(), 'tick_error', 'critical', e instanceof Error ? e.message : 'tick failed')
      }
    })()
  }, TICK_MS)
  // Kick off an immediate tick.
  await runTick(state)
  store.schedulePersist()
}

export async function stopEngine(): Promise<void> {
  if (globalThis.__traderEngineTimer) {
    clearInterval(globalThis.__traderEngineTimer)
    globalThis.__traderEngineTimer = undefined
  }
  const store = await getStore()
  audit(store.get(), 'system', 'Trading engine stopped.')
  store.schedulePersist()
}

/** Emergency stop: halt the loop, engage the kill switch, cancel pending orders. */
export async function engageKillSwitch(): Promise<void> {
  await stopEngine()
  const store = await getStore()
  const state = store.get()
  state.risk.killSwitchEngaged = true
  state.risk.updatedAt = Date.now()
  for (const o of state.orders) {
    if (o.status === 'pending' || o.status === 'submitted') {
      o.status = 'cancelled'
      o.updatedAt = Date.now()
    }
  }
  recordRiskEvent(state, 'kill_switch', 'critical', 'EMERGENCY STOP engaged. All trading halted and pending orders cancelled.')
  store.schedulePersist()
}

export async function disengageKillSwitch(): Promise<void> {
  const store = await getStore()
  const state = store.get()
  state.risk.killSwitchEngaged = false
  state.risk.updatedAt = Date.now()
  audit(state, 'system', 'Kill switch disengaged.')
  store.schedulePersist()
}

export { getMarketStatus }
