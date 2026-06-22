'use client'

import { useState } from 'react'
import { LineChart } from '@/components/charts'
import { Disclaimer } from '@/components/disclaimer'
import { Button, Card, EmptyState, Field, Input, PageHeader, Select, StatCard } from '@/components/ui'
import { useTraderContext } from '@/components/trader-context'
import { post } from '@/lib/client/api'
import { pct, usd } from '@/lib/client/format'
import type { AssetType, BacktestResult } from '@/lib/types'

export default function BacktestingPage() {
  const { state, refresh } = useTraderContext()
  const [kind, setKind] = useState('ma_crossover')
  const [symbol, setSymbol] = useState('BTC-USD')
  const [assetType, setAssetType] = useState<AssetType>('crypto')
  const [bars, setBars] = useState(365)
  const [stopLossPct, setStop] = useState(0.05)
  const [takeProfitPct, setTake] = useState(0.1)
  const [params, setParams] = useState<Record<string, number>>({})
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [busy, setBusy] = useState(false)

  if (!state) return <div className="text-sm text-muted">Loading…</div>
  const plugin = state.availableStrategies.find((a) => a.id === kind)

  function onKind(k: string) {
    setKind(k)
    const p = state!.availableStrategies.find((a) => a.id === k)
    setParams(Object.fromEntries((p?.paramSpecs ?? []).map((s) => [s.key, s.default])))
  }

  async function run() {
    setBusy(true)
    try {
      const merged = { ...Object.fromEntries((plugin?.paramSpecs ?? []).map((s) => [s.key, s.default])), ...params }
      const r = await post('/api/backtest', { strategyKind: kind, symbol, assetType, params: merged, bars: Number(bars), stopLossPct: Number(stopLossPct), takeProfitPct: Number(takeProfitPct) })
      setResult(r.result as BacktestResult)
      await refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title="Backtesting" subtitle="Validate a strategy on historical data before activating it. Live strategies require a passing backtest." />
      <Disclaimer />

      <Card>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          <Field label="Strategy">
            <Select value={kind} onChange={(e) => onKind(e.target.value)}>
              {state.availableStrategies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </Field>
          <Field label="Symbol"><Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} /></Field>
          <Field label="Asset type">
            <Select value={assetType} onChange={(e) => setAssetType(e.target.value as AssetType)}>
              <option value="crypto">Crypto</option><option value="equity">Equity</option><option value="option">Option</option>
            </Select>
          </Field>
          <Field label="Bars (history length)"><Input type="number" value={bars} onChange={(e) => setBars(Number(e.target.value))} /></Field>
          <Field label="Stop loss (fraction)"><Input type="number" step="0.01" value={stopLossPct} onChange={(e) => setStop(Number(e.target.value))} /></Field>
          <Field label="Take profit (fraction)"><Input type="number" step="0.01" value={takeProfitPct} onChange={(e) => setTake(Number(e.target.value))} /></Field>
          {plugin?.paramSpecs.map((s) => (
            <Field key={s.key} label={s.label}>
              <Input type="number" step={s.step ?? 'any'} value={params[s.key] ?? s.default} onChange={(e) => setParams((p) => ({ ...p, [s.key]: Number(e.target.value) }))} />
            </Field>
          ))}
        </div>
        <div className="mt-4">
          <Button variant="primary" disabled={busy} onClick={run}>{busy ? 'Running…' : 'Run backtest'}</Button>
        </div>
      </Card>

      {result && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total Return" value={pct(result.totalReturnPct)} tone={result.totalReturnPct >= 0 ? 'pos' : 'neg'} />
            <StatCard label="Max Drawdown" value={pct(result.maxDrawdownPct)} tone="neg" />
            <StatCard label="Win Rate" value={pct(result.winRate)} />
            <StatCard label="Trades" value={result.trades} />
            <StatCard label="Avg Win" value={usd(result.avgWin)} tone="pos" />
            <StatCard label="Avg Loss" value={usd(result.avgLoss)} tone="neg" />
            <StatCard label="Sharpe (ann.)" value={result.sharpe.toFixed(2)} />
            <StatCard label="Ending Equity" value={usd(result.endingEquity)} />
          </div>
          <Card className="mt-4">
            <h3 className="mb-3 text-sm font-medium">Equity curve</h3>
            <LineChart data={result.equityCurve.map((p) => p.equity)} />
          </Card>
        </>
      )}

      <h3 className="mb-3 mt-8 text-sm font-medium">Recent backtests</h3>
      {state.backtests.length === 0 ? (
        <EmptyState>No backtests run yet.</EmptyState>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm tabular">
            <thead className="border-b text-left text-xs uppercase text-muted">
              <tr><th className="px-3 py-2">Strategy</th><th className="px-3 py-2">Symbol</th><th className="px-3 py-2">Return</th><th className="px-3 py-2">Max DD</th><th className="px-3 py-2">Win rate</th><th className="px-3 py-2">Trades</th><th className="px-3 py-2">Sharpe</th></tr>
            </thead>
            <tbody>
              {state.backtests.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{b.strategyKind}</td>
                  <td className="px-3 py-2">{b.symbol}</td>
                  <td className={`px-3 py-2 ${b.totalReturnPct >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]'}`}>{pct(b.totalReturnPct)}</td>
                  <td className="px-3 py-2">{pct(b.maxDrawdownPct)}</td>
                  <td className="px-3 py-2">{pct(b.winRate)}</td>
                  <td className="px-3 py-2">{b.trades}</td>
                  <td className="px-3 py-2">{b.sharpe.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
