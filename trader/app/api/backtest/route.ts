import { NextResponse } from 'next/server'
import { z } from 'zod'
import { runBacktest } from '@/lib/backtest/engine'
import { getStore } from '@/lib/db'

export const dynamic = 'force-dynamic'

const schema = z.object({
  strategyKind: z.string(),
  symbol: z.string().min(1),
  assetType: z.enum(['crypto', 'equity', 'option']),
  params: z.record(z.union([z.number(), z.string(), z.boolean()])).default({}),
  bars: z.number().int().min(50).max(2000).optional(),
  startingEquity: z.number().positive().optional(),
  stopLossPct: z.number().min(0).max(0.9).optional(),
  takeProfitPct: z.number().min(0).max(10).optional(),
  markStrategyId: z.string().optional(), // mark this strategy as backtest-passed
})

export async function POST(req: Request) {
  try {
    const p = schema.parse(await req.json())
    const result = await runBacktest(p)
    const store = await getStore()
    const state = store.get()
    state.backtests.push(result)

    // Optionally record that a configured strategy has passed a backtest, which
    // unlocks the ability to enable it in live mode.
    if (p.markStrategyId) {
      const strat = state.strategies.find((s) => s.id === p.markStrategyId)
      if (strat) {
        strat.backtestPassed = result.trades > 0
        strat.updatedAt = Date.now()
      }
    }
    store.schedulePersist()
    return NextResponse.json({ ok: true, result })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid request' }, { status: 400 })
  }
}
