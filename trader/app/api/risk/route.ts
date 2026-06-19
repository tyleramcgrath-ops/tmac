import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getStore } from '@/lib/db'
import { audit, recordRiskEvent } from '@/lib/engine/audit-logger'

export const dynamic = 'force-dynamic'

const schema = z.object({
  liveTradingEnabled: z.boolean().optional(),
  confirmationMode: z.boolean().optional(),
  maxAccountRiskPerTradePct: z.number().min(0).max(0.5).optional(),
  maxDailyLossPct: z.number().min(0).max(1).optional(),
  maxOpenPositions: z.number().int().min(1).max(1000).optional(),
  maxOptionPremiumPerTrade: z.number().min(0).optional(),
  allowNakedOptions: z.boolean().optional(),
  allowMargin: z.boolean().optional(),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  try {
    const patch = schema.parse(body)
    const store = await getStore()
    const state = store.get()
    const before = { ...state.risk }

    // Hard safety rail: naked options stay disabled regardless of request.
    if (patch.allowNakedOptions === true) {
      return NextResponse.json(
        { error: 'Naked options are disabled by policy and cannot be enabled from the UI.' },
        { status: 400 },
      )
    }

    Object.assign(state.risk, patch, { updatedAt: Date.now() })

    if (patch.liveTradingEnabled === true && !before.liveTradingEnabled) {
      recordRiskEvent(state, 'live_enabled', 'critical', 'LIVE TRADING ENABLED by user. Real funds can now be used.')
    } else if (patch.liveTradingEnabled === false && before.liveTradingEnabled) {
      audit(state, 'system', 'Live trading disabled — back to paper-only.')
    } else {
      audit(state, 'system', 'Risk settings updated.', { patch })
    }
    store.schedulePersist()
    return NextResponse.json({ ok: true, risk: state.risk })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid request' }, { status: 400 })
  }
}
