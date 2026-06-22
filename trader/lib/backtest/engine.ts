import { newId } from '../db'
import { getCandles } from '../market-data'
import { getStrategyPlugin } from '../strategies'
import type { AssetType, BacktestResult } from '../types'

export interface BacktestParams {
  strategyKind: string
  symbol: string
  assetType: AssetType
  params: Record<string, number | string | boolean>
  bars?: number
  intervalMs?: number
  startingEquity?: number
  stopLossPct?: number // e.g. 0.05
  takeProfitPct?: number // e.g. 0.1
  positionFraction?: number // fraction of equity per trade (default 0.95)
}

/**
 * Backtest a strategy over deterministic historical candles. All-or-nothing
 * single-position simulation with optional stop-loss/take-profit applied
 * intrabar (using each bar's low/high). Returns full metrics + equity curve.
 */
export async function runBacktest(p: BacktestParams): Promise<BacktestResult> {
  const bars = p.bars ?? 365
  const intervalMs = p.intervalMs ?? 86_400_000
  const startingEquity = p.startingEquity ?? 100_000
  const fraction = p.positionFraction ?? 0.95
  const plugin = getStrategyPlugin(p.strategyKind)
  if (!plugin) throw new Error(`Unknown strategy: ${p.strategyKind}`)

  const candles = await getCandles(p.symbol, p.assetType, bars, intervalMs)

  let cash = startingEquity
  let qty = 0
  let entryPrice = 0
  let stopPrice = 0
  let takePrice = 0
  const equityCurve: { t: number; equity: number }[] = []
  const tradePnls: number[] = []
  const barReturns: number[] = []
  let prevEquity = startingEquity
  let peak = startingEquity
  let maxDrawdown = 0

  const warmup = 30
  for (let i = warmup; i < candles.length; i++) {
    const bar = candles[i]
    const slice = candles.slice(0, i + 1)

    // Manage open position: check stop/take intrabar before acting on signals.
    if (qty > 0) {
      let exitPrice: number | null = null
      if (stopPrice > 0 && bar.low <= stopPrice) exitPrice = stopPrice
      else if (takePrice > 0 && bar.high >= takePrice) exitPrice = takePrice
      if (exitPrice != null) {
        cash += qty * exitPrice
        tradePnls.push((exitPrice - entryPrice) * qty)
        qty = 0
      }
    }

    const evalResult = plugin.evaluate({
      symbol: p.symbol,
      assetType: p.assetType,
      candles: slice,
      params: p.params,
      hasPosition: qty > 0,
    })

    if (evalResult.action === 'buy' && qty === 0) {
      const notional = cash * fraction
      qty = notional / bar.close
      entryPrice = bar.close
      cash -= qty * bar.close
      stopPrice = p.stopLossPct ? entryPrice * (1 - p.stopLossPct) : 0
      takePrice = p.takeProfitPct ? entryPrice * (1 + p.takeProfitPct) : 0
    } else if (evalResult.action === 'sell' && qty > 0) {
      cash += qty * bar.close
      tradePnls.push((bar.close - entryPrice) * qty)
      qty = 0
    }

    const equity = cash + qty * bar.close
    equityCurve.push({ t: bar.timestamp, equity })
    barReturns.push(prevEquity > 0 ? (equity - prevEquity) / prevEquity : 0)
    prevEquity = equity
    peak = Math.max(peak, equity)
    maxDrawdown = Math.max(maxDrawdown, (peak - equity) / peak)
  }

  // Close any open position at the last price.
  if (qty > 0) {
    const last = candles[candles.length - 1].close
    cash += qty * last
    tradePnls.push((last - entryPrice) * qty)
    qty = 0
  }

  const endingEquity = cash
  const wins = tradePnls.filter((x) => x > 0)
  const losses = tradePnls.filter((x) => x < 0)
  const avgWin = wins.length ? wins.reduce((a, b) => a + b, 0) / wins.length : 0
  const avgLoss = losses.length ? losses.reduce((a, b) => a + b, 0) / losses.length : 0
  const meanRet = barReturns.length ? barReturns.reduce((a, b) => a + b, 0) / barReturns.length : 0
  const variance = barReturns.length
    ? barReturns.reduce((a, b) => a + (b - meanRet) ** 2, 0) / barReturns.length
    : 0
  const std = Math.sqrt(variance)
  const sharpe = std > 0 ? (meanRet / std) * Math.sqrt(252) : 0

  return {
    id: newId('bt'),
    strategyKind: p.strategyKind,
    symbol: p.symbol,
    assetType: p.assetType,
    params: p.params,
    start: candles[warmup]?.timestamp ?? candles[0].timestamp,
    end: candles[candles.length - 1].timestamp,
    startingEquity,
    endingEquity,
    totalReturnPct: (endingEquity - startingEquity) / startingEquity,
    maxDrawdownPct: maxDrawdown,
    winRate: tradePnls.length ? wins.length / tradePnls.length : 0,
    trades: tradePnls.length,
    avgWin,
    avgLoss,
    sharpe,
    equityCurve,
    createdAt: Date.now(),
  }
}
