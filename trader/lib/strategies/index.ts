import { breakout } from './breakout'
import { customRule } from './custom-rule'
import { maCrossover } from './ma-crossover'
import { meanReversion } from './mean-reversion'
import { momentum } from './momentum'
import { rsiStrategy } from './rsi'
import type { StrategyPlugin } from './types'

export type { StrategyContext, StrategyEvaluation, StrategyParamSpec, StrategyPlugin } from './types'

export const STRATEGIES: StrategyPlugin[] = [
  maCrossover,
  rsiStrategy,
  breakout,
  momentum,
  meanReversion,
  customRule,
]

const BY_ID = new Map(STRATEGIES.map((s) => [s.id, s]))

export function getStrategyPlugin(id: string): StrategyPlugin | undefined {
  return BY_ID.get(id)
}

export function defaultParamsFor(id: string): Record<string, number> {
  const plugin = BY_ID.get(id)
  if (!plugin) return {}
  return Object.fromEntries(plugin.paramSpecs.map((p) => [p.key, p.default]))
}
