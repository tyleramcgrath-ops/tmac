import type { AppState } from '../db'
import { newId } from '../db'
import { getCandles } from '../market-data'
import { getStrategyPlugin } from '../strategies'
import type { Signal, StrategyConfig } from '../types'
import { audit } from './audit-logger'
import { findPosition } from './position-manager'

export interface GeneratedSignal {
  strategy: StrategyConfig
  symbol: string
  assetType: StrategyConfig['assetType']
  action: 'buy' | 'sell'
  price: number
  confidence: number
  rationale: string
}

/**
 * Evaluate a single strategy across its symbols and return actionable signals.
 * Also records every non-hold signal to the audit trail.
 */
export async function evaluateStrategy(
  state: AppState,
  strategy: StrategyConfig,
  quoteFor: (symbol: string) => number | undefined,
): Promise<GeneratedSignal[]> {
  const plugin = getStrategyPlugin(strategy.kind)
  if (!plugin) return []
  const out: GeneratedSignal[] = []

  for (const symbol of strategy.symbols) {
    const price = quoteFor(symbol)
    if (price == null || !Number.isFinite(price)) {
      audit(state, 'signal', `Skipped ${symbol}: no reliable quote.`, { strategyId: strategy.id })
      continue
    }
    const candles = await getCandles(symbol, strategy.assetType, 200)
    const pos = findPosition(state, strategy.id, symbol)
    const evalResult = plugin.evaluate({
      symbol,
      assetType: strategy.assetType,
      candles,
      params: strategy.params,
      hasPosition: !!pos && pos.quantity > 0,
    })
    if (evalResult.action === 'hold') continue

    const signal: Signal = {
      id: newId('sig'),
      strategyId: strategy.id,
      symbol,
      assetType: strategy.assetType,
      action: evalResult.action,
      confidence: evalResult.confidence,
      price,
      rationale: evalResult.rationale,
      createdAt: Date.now(),
    }
    state.signals.push(signal)
    audit(state, 'signal', `${strategy.name} ${evalResult.action.toUpperCase()} ${symbol} (conf ${(evalResult.confidence * 100).toFixed(0)}%): ${evalResult.rationale}`, {
      strategyId: strategy.id,
    })
    out.push({
      strategy,
      symbol,
      assetType: strategy.assetType,
      action: evalResult.action,
      price,
      confidence: evalResult.confidence,
      rationale: evalResult.rationale,
    })
  }
  return out
}

/**
 * Generate protective exit signals when an open position hits its stop-loss or
 * take-profit. These take priority over strategy entries.
 */
export function exitSignals(
  state: AppState,
  quoteFor: (symbol: string) => number | undefined,
): GeneratedSignal[] {
  const out: GeneratedSignal[] = []
  for (const pos of state.positions) {
    if (pos.quantity <= 0) continue
    const price = quoteFor(pos.symbol) ?? pos.marketPrice
    const strategy = state.strategies.find((s) => s.id === pos.strategyId)
    if (!strategy) continue
    let reason = ''
    if (pos.stopLossPrice != null && price <= pos.stopLossPrice) reason = `Stop-loss hit at ${price.toFixed(2)}.`
    else if (pos.takeProfitPrice != null && price >= pos.takeProfitPrice) reason = `Take-profit hit at ${price.toFixed(2)}.`
    if (reason) {
      out.push({ strategy, symbol: pos.symbol, assetType: pos.assetType, action: 'sell', price, confidence: 1, rationale: reason })
    }
  }
  return out
}
