import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getStore, newId } from '@/lib/db'
import { audit } from '@/lib/engine/audit-logger'
import { defaultParamsFor, getStrategyPlugin } from '@/lib/strategies'
import type { StrategyConfig } from '@/lib/types'

export const dynamic = 'force-dynamic'

const riskSchema = z.object({
  maxPositionSize: z.number().positive(),
  stopLossPct: z.number().min(0).max(0.9),
  takeProfitPct: z.number().min(0).max(10),
  dailyMaxLoss: z.number().min(0),
  maxTradesPerDay: z.number().int().min(1),
  cooldownAfterLossMs: z.number().min(0),
})

const saveSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  kind: z.string(),
  assetType: z.enum(['crypto', 'equity', 'option']),
  symbols: z.array(z.string().min(1)).min(1),
  params: z.record(z.union([z.number(), z.string(), z.boolean()])),
  risk: riskSchema,
  mode: z.enum(['paper', 'live']),
})

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { action?: string; [k: string]: unknown }
  const store = await getStore()
  const state = store.get()

  try {
    if (body.action === 'delete') {
      const id = String(body.id ?? '')
      state.strategies = state.strategies.filter((s) => s.id !== id)
      store.schedulePersist()
      return NextResponse.json({ ok: true })
    }

    if (body.action === 'toggle') {
      const id = String(body.id ?? '')
      const strat = state.strategies.find((s) => s.id === id)
      if (!strat) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const next = !strat.enabled
      // Safety: a live strategy must pass a backtest before it can be enabled.
      if (next && strat.mode === 'live' && !strat.backtestPassed) {
        return NextResponse.json(
          { error: 'This live strategy must pass a backtest before it can be enabled.' },
          { status: 400 },
        )
      }
      strat.enabled = next
      strat.updatedAt = Date.now()
      audit(state, 'system', `Strategy ${strat.name} ${next ? 'enabled' : 'disabled'}.`)
      store.schedulePersist()
      return NextResponse.json({ ok: true })
    }

    // save (create or update)
    const parsed = saveSchema.parse(body)
    if (!getStrategyPlugin(parsed.kind)) {
      return NextResponse.json({ error: `Unknown strategy kind: ${parsed.kind}` }, { status: 400 })
    }
    const existing = parsed.id ? state.strategies.find((s) => s.id === parsed.id) : undefined
    const params = { ...defaultParamsFor(parsed.kind), ...parsed.params }
    if (existing) {
      Object.assign(existing, {
        name: parsed.name,
        kind: parsed.kind,
        assetType: parsed.assetType,
        symbols: parsed.symbols,
        params,
        risk: parsed.risk,
        mode: parsed.mode,
        updatedAt: Date.now(),
      })
      store.schedulePersist()
      return NextResponse.json({ ok: true, id: existing.id })
    }
    const strat: StrategyConfig = {
      id: newId('strat'),
      name: parsed.name,
      kind: parsed.kind,
      assetType: parsed.assetType,
      symbols: parsed.symbols,
      params,
      risk: parsed.risk,
      mode: parsed.mode,
      enabled: false, // new strategies start disabled (safe default)
      backtestPassed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    state.strategies.push(strat)
    audit(state, 'system', `Strategy created: ${strat.name} (${strat.kind}, ${strat.assetType}).`)
    store.schedulePersist()
    return NextResponse.json({ ok: true, id: strat.id })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid request' }, { status: 400 })
  }
}
