'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, ShieldCheck } from 'lucide-react'
import { Badge, Button, Card, Field, Input, PageHeader, Toggle } from '@/components/ui'
import { useTraderContext } from '@/components/trader-context'
import { post } from '@/lib/client/api'
import { dt, usd } from '@/lib/client/format'
import type { GlobalRiskSettings } from '@/lib/types'

export default function RiskPage() {
  const { state, refresh } = useTraderContext()
  const [draft, setDraft] = useState<GlobalRiskSettings | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (state && !draft) setDraft(state.risk)
  }, [state, draft])

  if (!state || !draft) return <div className="text-sm text-muted">Loading…</div>

  async function patch(body: Record<string, unknown>) {
    setBusy(true)
    try {
      await post('/api/risk', body)
      await refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  async function enableLive() {
    const ok = confirm(
      'Enable LIVE trading? Real money can be used by automated strategies.\n\n' +
        'Strategies still require: live mode, a passed backtest, and (if on) per-order confirmation.\n\nProceed?',
    )
    if (!ok) return
    await patch({ liveTradingEnabled: true })
  }

  async function kill(engage: boolean) {
    await post('/api/engine', { action: engage ? 'kill' : 'disengage' })
    await refresh()
  }

  return (
    <div>
      <PageHeader title="Risk Controls" subtitle="Mandatory safety limits. Live trading is off by default." />

      {/* Master switches */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className={state.risk.killSwitchEngaged ? 'border-[var(--neg)]' : ''}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-[var(--neg)]" size={18} />
              <span className="font-medium">Kill Switch</span>
            </div>
            <Badge tone={state.risk.killSwitchEngaged ? 'neg' : 'pos'}>{state.risk.killSwitchEngaged ? 'ENGAGED' : 'Clear'}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted">Immediately halts the engine and cancels pending orders. No new trades while engaged.</p>
          <div className="mt-3">
            {state.risk.killSwitchEngaged ? (
              <Button variant="success" onClick={() => kill(false)}>Disengage kill switch</Button>
            ) : (
              <Button variant="danger" onClick={() => kill(true)}>Engage kill switch</Button>
            )}
          </div>
        </Card>

        <Card className={state.risk.liveTradingEnabled ? 'border-[var(--warn)]' : ''}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-[var(--accent)]" size={18} />
              <span className="font-medium">Live Trading Master Switch</span>
            </div>
            <Badge tone={state.risk.liveTradingEnabled ? 'warn' : 'pos'}>{state.risk.liveTradingEnabled ? 'ARMED' : 'Disabled (safe)'}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted">When disabled, the engine can only paper trade — no real orders are ever sent.</p>
          <div className="mt-3 flex gap-2">
            {state.risk.liveTradingEnabled ? (
              <Button variant="secondary" onClick={() => patch({ liveTradingEnabled: false })}>Disable live trading</Button>
            ) : (
              <Button variant="danger" onClick={enableLive}>Enable live trading…</Button>
            )}
            <div className="flex items-center">
              <Toggle checked={draft.confirmationMode} onChange={(v) => patch({ confirmationMode: v })} label="Require per-order confirmation" />
            </div>
          </div>
        </Card>
      </div>

      {/* Numeric limits */}
      <Card className="mt-6">
        <h3 className="mb-4 text-sm font-medium">Account-wide limits</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Max risk per trade (%)" hint="100 = up to 100% of account. Type any whole number.">
            <Input type="number" step="1" value={Math.round(draft.maxAccountRiskPerTradePct * 100)} onChange={(e) => setDraft({ ...draft, maxAccountRiskPerTradePct: Number(e.target.value) / 100 })} />
          </Field>
          <Field label="Max daily loss (%)" hint="100 = never halts (no daily loss limit).">
            <Input type="number" step="1" value={Math.round(draft.maxDailyLossPct * 100)} onChange={(e) => setDraft({ ...draft, maxDailyLossPct: Number(e.target.value) / 100 })} />
          </Field>
          <Field label="Max open positions" hint="How many trades open at once.">
            <Input type="number" value={draft.maxOpenPositions} onChange={(e) => setDraft({ ...draft, maxOpenPositions: Number(e.target.value) })} />
          </Field>
          <Field label="Max option premium per trade ($)">
            <Input type="number" value={draft.maxOptionPremiumPerTrade} onChange={(e) => setDraft({ ...draft, maxOptionPremiumPerTrade: Number(e.target.value) })} />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            <Badge tone="pos">Enforced</Badge> Naked options disabled (policy)
          </div>
          <Toggle checked={draft.allowMargin} onChange={(v) => setDraft({ ...draft, allowMargin: v })} label="Allow margin (off by default)" />
        </div>
        <div className="mt-4">
          <Button
            variant="primary"
            disabled={busy}
            onClick={() => patch({
              maxAccountRiskPerTradePct: Number(draft.maxAccountRiskPerTradePct),
              maxDailyLossPct: Number(draft.maxDailyLossPct),
              maxOpenPositions: Number(draft.maxOpenPositions),
              maxOptionPremiumPerTrade: Number(draft.maxOptionPremiumPerTrade),
              allowMargin: draft.allowMargin,
            })}
          >
            Save limits
          </Button>
          <Button
            variant="danger"
            disabled={busy}
            onClick={() => {
              if (!confirm('Remove all size/loss limits? Safe on PAPER (fake money). On a real live account this removes the protections against catastrophic loss — only do this if you mean it.')) return
              patch({
                maxAccountRiskPerTradePct: 1,
                maxDailyLossPct: 1,
                maxOpenPositions: 1_000_000,
                maxOptionPremiumPerTrade: 1_000_000,
              })
            }}
          >
            Remove limits (unlimited)
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted">
          “Remove limits” lets strategies size up to your per-strategy max position and use full buying power, with no
          daily-loss or position-count caps. The kill switch and the live-trading gate still apply.
        </p>
      </Card>

      {/* Risk events */}
      <Card className="mt-6 p-0">
        <h3 className="p-4 pb-2 text-sm font-medium">Recent risk events</h3>
        {state.riskEvents.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-muted">None yet.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {state.riskEvents.map((e) => (
              <div key={e.id} className="flex items-start gap-3 border-t px-4 py-2 text-sm">
                <Badge tone={e.severity === 'critical' ? 'neg' : e.severity === 'warning' ? 'warn' : 'default'}>{e.severity}</Badge>
                <div>
                  <div>{e.message}</div>
                  <div className="text-xs text-muted">{e.type} · {dt(e.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
