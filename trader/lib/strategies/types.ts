import type { AssetType, Candle, SignalAction } from '../types'

export interface StrategyParamSpec {
  key: string
  label: string
  type: 'number'
  default: number
  min?: number
  max?: number
  step?: number
  help?: string
}

export interface StrategyContext {
  symbol: string
  assetType: AssetType
  candles: Candle[] // oldest first; last element is the current bar
  params: Record<string, number | string | boolean>
  hasPosition: boolean
}

export interface StrategyEvaluation {
  action: SignalAction
  confidence: number // 0..1
  rationale: string
}

export interface StrategyPlugin {
  id: string
  name: string
  description: string
  paramSpecs: StrategyParamSpec[]
  evaluate(ctx: StrategyContext): StrategyEvaluation
}

export function numParam(
  params: Record<string, number | string | boolean>,
  key: string,
  fallback: number,
): number {
  const v = params[key]
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

export const HOLD: StrategyEvaluation = { action: 'hold', confidence: 0, rationale: 'No signal.' }
