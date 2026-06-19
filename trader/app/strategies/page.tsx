'use client'

import { useState } from 'react'
import { Plus, Trash2, Power, FlaskConical } from 'lucide-react'
import { Disclaimer } from '@/components/disclaimer'
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, Toggle } from '@/components/ui'
import { useTraderContext } from '@/components/trader-context'
import { post } from '@/lib/client/api'
import type { AvailableStrategy } from '@/lib/client/api'
import { usd } from '@/lib/client/format'
import type { AssetType, StrategyConfig } from '@/lib/types'

const blankRisk = {
  maxPositionSize: 5000,
  stopLossPct: 0.03,
  takeProfitPct: 0.06,
  dailyMaxLoss: 500,
  maxTradesPerDay: 5,
  cooldownAfterLossMs: 1_800_000,
}

export default function StrategiesPage() {
  const { state, refresh } = useTraderContext()
  const [editing, setEditing] = useState<StrategyConfig | null>(null)
  const [creating, setCreating] = useState(false)
  if (!state) return <div className="text-sm text-muted">Loading…</div>

  async function action(body: Record<string, unknown>) {
    try {
      await post('/api/strategies', body)
      await refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed')
    }
  }

  return (
    <div>
      <PageHeader
        title="Strategies"
        subtitle="Modular strategy plugins with per-strategy risk limits. New strategies start disabled."
        action={
          <Button variant="primary" onClick={() => { setCreating(true); setEditing(null) }}>
            <Plus size={16} /> New Strategy
          </Button>
        }
      />
      <Disclaimer />

      {(creating || editing) && (
        <StrategyForm
          available={state.availableStrategies}
          initial={editing}
          onCancel={() => { setCreating(false); setEditing(null) }}
          onSaved={async () => { setCreating(false); setEditing(null); await refresh() }}
        />
      )}

      {state.strategies.length === 0 ? (
        <EmptyState>No strategies yet. Create one to get started — it will run in paper mode by default.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {state.strategies.map((s) => (
            <Card key={s.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.name}</span>
                    <Badge tone={s.mode === 'live' ? 'warn' : 'pos'}>{s.mode}</Badge>
                    <Badge>{s.assetType}</Badge>
                    {s.backtestPassed && <Badge tone="accent">backtested</Badge>}
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    {state.availableStrategies.find((a) => a.id === s.kind)?.name ?? s.kind} · {s.symbols.join(', ')}
                  </div>
                </div>
                <Toggle checked={s.enabled} onChange={() => action({ action: 'toggle', id: s.id })} />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted">
                <Info label="Max size" value={usd(s.risk.maxPositionSize, 0)} />
                <Info label="Stop" value={`${(s.risk.stopLossPct * 100).toFixed(1)}%`} />
                <Info label="Target" value={`${(s.risk.takeProfitPct * 100).toFixed(1)}%`} />
                <Info label="Daily max loss" value={usd(s.risk.dailyMaxLoss, 0)} />
                <Info label="Max trades/day" value={String(s.risk.maxTradesPerDay)} />
                <Info label="Cooldown" value={`${Math.round(s.risk.cooldownAfterLossMs / 60000)}m`} />
              </div>

              <div className="mt-4 flex gap-2">
                <Button onClick={() => { setEditing(s); setCreating(false) }}>Edit</Button>
                <Button
                  onClick={() =>
                    action0(`/api/backtest`, {
                      strategyKind: s.kind,
                      symbol: s.symbols[0],
                      assetType: s.assetType,
                      params: s.params,
                      bars: 365,
                      stopLossPct: s.risk.stopLossPct,
                      takeProfitPct: s.risk.takeProfitPct,
                      markStrategyId: s.id,
                    }, refresh)
                  }
                >
                  <FlaskConical size={14} /> Backtest
                </Button>
                <Button variant="ghost" onClick={() => action({ action: 'toggle', id: s.id })}>
                  <Power size={14} /> {s.enabled ? 'Disable' : 'Enable'}
                </Button>
                <Button variant="danger" className="ml-auto" onClick={() => confirm('Delete strategy?') && action({ action: 'delete', id: s.id })}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

async function action0(path: string, body: Record<string, unknown>, refresh: () => Promise<void>) {
  try {
    const r = await post(path, body)
    const res = r.result as { trades?: number; totalReturnPct?: number } | undefined
    alert(res ? `Backtest done: ${res.trades} trades, return ${((res.totalReturnPct ?? 0) * 100).toFixed(2)}%.` : 'Done')
    await refresh()
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Failed')
  }
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide">{label}</div>
      <div className="text-[var(--text)]">{value}</div>
    </div>
  )
}

function StrategyForm({
  available,
  initial,
  onCancel,
  onSaved,
}: {
  available: AvailableStrategy[]
  initial: StrategyConfig | null
  onCancel: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [kind, setKind] = useState(initial?.kind ?? available[0]?.id ?? 'ma_crossover')
  const [assetType, setAssetType] = useState<AssetType>(initial?.assetType ?? 'crypto')
  const [symbols, setSymbols] = useState((initial?.symbols ?? ['BTC-USD']).join(', '))
  const [mode, setMode] = useState(initial?.mode ?? 'paper')
  const [risk, setRisk] = useState({ ...blankRisk, ...(initial?.risk ?? {}) })
  const plugin = available.find((a) => a.id === kind)
  const [params, setParams] = useState<Record<string, number>>(() => {
    const base: Record<string, number> = {}
    plugin?.paramSpecs.forEach((p) => (base[p.key] = Number(initial?.params?.[p.key] ?? p.default)))
    return base
  })
  const [busy, setBusy] = useState(false)

  function onKindChange(k: string) {
    setKind(k)
    const p = available.find((a) => a.id === k)
    const base: Record<string, number> = {}
    p?.paramSpecs.forEach((spec) => (base[spec.key] = spec.default))
    setParams(base)
  }

  async function save() {
    setBusy(true)
    try {
      await post('/api/strategies', {
        action: 'save',
        id: initial?.id,
        name,
        kind,
        assetType,
        symbols: symbols.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean),
        params,
        risk: {
          ...risk,
          maxPositionSize: Number(risk.maxPositionSize),
          stopLossPct: Number(risk.stopLossPct),
          takeProfitPct: Number(risk.takeProfitPct),
          dailyMaxLoss: Number(risk.dailyMaxLoss),
          maxTradesPerDay: Number(risk.maxTradesPerDay),
          cooldownAfterLossMs: Number(risk.cooldownAfterLossMs),
        },
        mode,
      })
      onSaved()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="mb-6">
      <h3 className="mb-4 text-sm font-medium">{initial ? 'Edit strategy' : 'New strategy'}</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My BTC crossover" /></Field>
        <Field label="Strategy type">
          <Select value={kind} onChange={(e) => onKindChange(e.target.value)}>
            {available.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </Field>
        <Field label="Asset type">
          <Select value={assetType} onChange={(e) => setAssetType(e.target.value as AssetType)}>
            <option value="crypto">Crypto (24/7)</option>
            <option value="equity">Equity</option>
            <option value="option">Option</option>
          </Select>
        </Field>
        <Field label="Symbols (comma separated)" hint="e.g. BTC-USD, ETH-USD or AAPL, SPY">
          <Input value={symbols} onChange={(e) => setSymbols(e.target.value)} />
        </Field>
        <Field label="Mode" hint="Live also requires the global live switch + a passed backtest.">
          <Select value={mode} onChange={(e) => setMode(e.target.value as 'paper' | 'live')}>
            <option value="paper">Paper</option>
            <option value="live">Live</option>
          </Select>
        </Field>
      </div>

      {plugin && plugin.paramSpecs.length > 0 && (
        <>
          <div className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">{plugin.name} parameters</div>
          <div className="mt-2 grid gap-4 md:grid-cols-3">
            {plugin.paramSpecs.map((spec) => (
              <Field key={spec.key} label={spec.label} hint={spec.help}>
                <Input
                  type="number"
                  step={spec.step ?? 'any'}
                  value={params[spec.key] ?? spec.default}
                  onChange={(e) => setParams((p) => ({ ...p, [spec.key]: Number(e.target.value) }))}
                />
              </Field>
            ))}
          </div>
        </>
      )}

      <div className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">Risk limits</div>
      <div className="mt-2 grid gap-4 md:grid-cols-3">
        <Field label="Max position size ($)"><Input type="number" value={risk.maxPositionSize} onChange={(e) => setRisk({ ...risk, maxPositionSize: Number(e.target.value) })} /></Field>
        <Field label="Stop loss (fraction)" hint="0.03 = 3%"><Input type="number" step="0.001" value={risk.stopLossPct} onChange={(e) => setRisk({ ...risk, stopLossPct: Number(e.target.value) })} /></Field>
        <Field label="Take profit (fraction)" hint="0.06 = 6%"><Input type="number" step="0.001" value={risk.takeProfitPct} onChange={(e) => setRisk({ ...risk, takeProfitPct: Number(e.target.value) })} /></Field>
        <Field label="Daily max loss ($)"><Input type="number" value={risk.dailyMaxLoss} onChange={(e) => setRisk({ ...risk, dailyMaxLoss: Number(e.target.value) })} /></Field>
        <Field label="Max trades / day"><Input type="number" value={risk.maxTradesPerDay} onChange={(e) => setRisk({ ...risk, maxTradesPerDay: Number(e.target.value) })} /></Field>
        <Field label="Cooldown after loss (ms)" hint="1800000 = 30 min"><Input type="number" value={risk.cooldownAfterLossMs} onChange={(e) => setRisk({ ...risk, cooldownAfterLossMs: Number(e.target.value) })} /></Field>
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="primary" disabled={busy || !name} onClick={save}>Save</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  )
}
