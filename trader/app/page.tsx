'use client'

import { useMemo, useState } from 'react'
import { useTraderContext } from '@/components/trader-context'
import { post } from '@/lib/client/api'
import { usd } from '@/lib/client/format'
import { CRYPTO_SYMBOLS, STOCK_SYMBOLS, assetTypeOf } from '@/lib/universe'

// Plain-English names + one-line descriptions for each strategy.
const FRIENDLY: Record<string, { name: string; blurb: string; emoji: string }> = {
  momentum: { name: 'Chase Winners', blurb: 'Buys things that are shooting up fast.', emoji: '🚀' },
  breakout: { name: 'Breakout Hunter', blurb: 'Buys when the price breaks to a brand-new high.', emoji: '📈' },
  ma_crossover: { name: 'Trend Rider', blurb: 'Buys when an uptrend starts, sells when it flips down.', emoji: '🌊' },
  rsi: { name: 'Dip Buyer', blurb: 'Buys when something has dropped too far and looks cheap.', emoji: '🪂' },
  mean_reversion: { name: 'Bounce Catcher', blurb: 'Buys when price falls way below normal, betting on a bounce.', emoji: '🏀' },
  custom_rule: { name: 'Custom Mix', blurb: 'A blend of the rules above.', emoji: '🎛️' },
}
function friendly(id: string, fallback: string) {
  return FRIENDLY[id] ?? { name: fallback, blurb: '', emoji: '🤖' }
}

export default function ControlCenter() {
  const { state, refresh } = useTraderContext()
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [kinds, setKinds] = useState<Set<string>>(new Set())
  const [dollars, setDollars] = useState(1000)
  const [noLimits, setNoLimits] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [busy, setBusy] = useState('')

  const cryptoCount = useMemo(() => [...picked].filter((s) => assetTypeOf(s) === 'crypto').length, [picked])
  const stockCount = useMemo(() => [...picked].filter((s) => assetTypeOf(s) === 'equity').length, [picked])

  if (!state) {
    return <div className="p-10 text-center text-lg text-muted">Loading your robot…</div>
  }

  const running = state.engineRunning
  const killed = state.risk.killSwitchEngaged
  const todayPnl = state.trades
    .filter((t) => t.executedAt >= new Date().setHours(0, 0, 0, 0))
    .reduce((s, t) => s + (t.pnl ?? 0), 0)

  // ---- actions ----
  async function engine(action: string) {
    setBusy(action)
    try { await post('/api/engine', { action }); await refresh() }
    catch (e) { alert(e instanceof Error ? e.message : 'Failed') }
    finally { setBusy('') }
  }

  function pickGroup(list: string[], on: boolean) {
    setPicked((prev) => {
      const next = new Set(prev)
      for (const s of list) on ? next.add(s) : next.delete(s)
      return next
    })
  }
  function toggle<T>(set: Set<T>, v: T) {
    const n = new Set(set); n.has(v) ? n.delete(v) : n.add(v); return n
  }

  async function buildAndStart() {
    if (picked.size === 0) return alert('STEP 1: pick at least one thing to trade (tap "All Crypto" or "All Stocks").')
    if (kinds.size === 0) return alert('STEP 2: pick at least one strategy.')
    setBusy('build')
    try {
      if (noLimits) {
        await post('/api/risk', { maxAccountRiskPerTradePct: 1, maxDailyLossPct: 1, maxOpenPositions: 1_000_000, maxOptionPremiumPerTrade: 1_000_000 })
      }
      const chosen = [...picked]
      const ids: string[] = []
      for (const kind of kinds) {
        const name = friendly(kind, kind).name
        for (const at of ['crypto', 'equity'] as const) {
          const syms = chosen.filter((s) => assetTypeOf(s) === at)
          if (syms.length === 0) continue
          const r = await post('/api/strategies', {
            action: 'save', name: `${name} (${at})`, kind, assetType: at, symbols: syms, params: {},
            risk: {
              maxPositionSize: Number(dollars) || 100,
              stopLossPct: 0.05, takeProfitPct: 0.1,
              dailyMaxLoss: noLimits ? 1e9 : 5000,
              maxTradesPerDay: noLimits ? 100000 : 20,
              cooldownAfterLossMs: 0,
            },
            mode: 'paper',
          })
          if (typeof r.id === 'string') ids.push(r.id)
        }
      }
      for (const id of ids) await post('/api/strategies', { action: 'toggle', id })
      await post('/api/engine', { action: 'start' })
      await refresh()
      alert(`✅ Done! Built ${ids.length} robot${ids.length === 1 ? '' : 's'} and started trading. Watch the numbers at the top move.`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed')
    } finally { setBusy('') }
  }

  async function clearAll() {
    if (!confirm('Delete ALL robots and start fresh?')) return
    setBusy('clear')
    try {
      for (const s of state!.strategies) await post('/api/strategies', { action: 'delete', id: s.id })
      await refresh()
    } finally { setBusy('') }
  }

  const robotCount = state.strategies.filter((s) => s.enabled).length

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* ===== Plain-English banner ===== */}
      <div className="rounded-2xl bg-[var(--accent)]/10 p-4 text-center text-sm">
        🧪 <b className="text-[var(--text)]">Practice mode — this is FAKE money.</b> You can&apos;t lose anything. Play
        as much as you want.
      </div>

      {/* ===== Big status ===== */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Tile label="Practice Money" value={usd(state.account.equity)} big />
        <Tile label="Profit Today" value={usd(todayPnl)} tone={todayPnl >= 0 ? 'pos' : 'neg'} big />
        <Tile label="Open Trades" value={String(state.positions.length)} big />
        <Tile label="Robots Running" value={String(robotCount)} big />
      </div>

      {/* ===== On/off ===== */}
      <div className="flex flex-col items-center gap-3 rounded-2xl border p-5 text-center">
        <div className="text-lg font-semibold">
          Robot is {killed ? '🛑 STOPPED (emergency)' : running ? '🟢 ON' : '⚪ OFF'}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {running ? (
            <button onClick={() => engine('stop')} disabled={!!busy} className="rounded-xl bg-[var(--surface-2)] px-6 py-3 text-base font-bold">⏸ Pause Robot</button>
          ) : (
            <button onClick={() => engine(killed ? 'disengage' : 'start')} disabled={!!busy} className="rounded-xl bg-[var(--pos)] px-6 py-3 text-base font-bold text-white">▶ {killed ? 'Reset & ' : ''}Turn Robot ON</button>
          )}
          <button onClick={() => engine('kill')} disabled={!!busy} className="rounded-xl bg-[var(--neg)] px-6 py-3 text-base font-bold text-white">🛑 STOP EVERYTHING</button>
        </div>
      </div>

      {/* ===== STEP 1 ===== */}
      <Step n={1} title="What should it trade?" hint="Tap a big button. Green means selected.">
        <div className="flex flex-wrap gap-2">
          <Big on={cryptoCount > 0} label={`🪙 All Crypto (${cryptoCount}/${CRYPTO_SYMBOLS.length})`} onClick={() => pickGroup(CRYPTO_SYMBOLS, cryptoCount === 0)} />
          <Big on={stockCount > 0} label={`🏦 All Stocks (${stockCount}/${STOCK_SYMBOLS.length})`} onClick={() => pickGroup(STOCK_SYMBOLS, stockCount === 0)} />
          <Big on={picked.size === CRYPTO_SYMBOLS.length + STOCK_SYMBOLS.length} label="🌎 Everything" onClick={() => pickGroup([...CRYPTO_SYMBOLS, ...STOCK_SYMBOLS], picked.size === 0)} />
          <button onClick={() => setPicked(new Set())} className="rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm text-muted">Clear</button>
        </div>
        <button onClick={() => setShowAll((v) => !v)} className="mt-3 text-sm text-[var(--accent)]">
          {showAll ? 'Hide the full list ▲' : 'Or pick specific ones ▼'}
        </button>
        {showAll && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ChipBox title="Crypto" list={CRYPTO_SYMBOLS} picked={picked} onToggle={(s) => setPicked((p) => toggle(p, s))} strip="-USD" />
            <ChipBox title="Stocks" list={STOCK_SYMBOLS} picked={picked} onToggle={(s) => setPicked((p) => toggle(p, s))} />
          </div>
        )}
        <div className="mt-2 text-sm text-muted">Selected: <b className="text-[var(--text)]">{picked.size}</b></div>
      </Step>

      {/* ===== STEP 2 ===== */}
      <Step n={2} title="How should it trade?" hint="Pick one or more. Each is a simple rule in plain English.">
        <div className="grid gap-2 sm:grid-cols-2">
          {state.availableStrategies.map((a) => {
            const f = friendly(a.id, a.name)
            const on = kinds.has(a.id)
            return (
              <button key={a.id} onClick={() => setKinds((p) => toggle(p, a.id))}
                className={`rounded-xl border p-3 text-left transition ${on ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'hover:bg-[var(--surface-2)]'}`}>
                <div className="flex items-center gap-2 font-semibold">{on ? '✅' : f.emoji} {f.name}</div>
                <div className="mt-1 text-xs text-muted">{f.blurb}</div>
              </button>
            )
          })}
          <button onClick={() => setKinds(kinds.size === state.availableStrategies.length ? new Set() : new Set(state.availableStrategies.map((a) => a.id)))}
            className="rounded-xl border border-dashed p-3 text-sm font-medium text-[var(--accent)]">
            {kinds.size === state.availableStrategies.length ? 'Unselect all' : '➕ Use ALL strategies'}
          </button>
        </div>
      </Step>

      {/* ===== STEP 3 ===== */}
      <Step n={3} title="How much money per trade?" hint="This is fake practice money. Type any amount.">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-xl border px-3 py-2 text-lg">
            <span className="text-muted">$</span>
            <input type="number" value={dollars} onChange={(e) => setDollars(Number(e.target.value))}
              className="w-32 bg-transparent px-1 text-lg outline-none" />
            <span className="text-muted">per trade</span>
          </div>
          {[100, 500, 1000, 5000].map((v) => (
            <button key={v} onClick={() => setDollars(v)} className="rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm">${v}</button>
          ))}
        </div>
        <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border p-3">
          <input type="checkbox" checked={noLimits} onChange={(e) => setNoLimits(e.target.checked)} className="h-5 w-5" />
          <span>
            <b>🔓 No limits</b> — let it trade as much and as often as it wants, no safety caps.
            <span className="block text-xs text-muted">Recommended for practice. (On a real money account this is risky.)</span>
          </span>
        </label>
      </Step>

      {/* ===== Big build button ===== */}
      <div className="sticky bottom-3 z-10 rounded-2xl border bg-[var(--surface)] p-4 shadow-lg">
        <button onClick={buildAndStart} disabled={!!busy}
          className="w-full rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--hot,#ff7a18)] px-6 py-4 text-lg font-bold text-white disabled:opacity-60">
          {busy === 'build' ? '⏳ Building…' : '🤖 Build My Robot & Start Trading'}
        </button>
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span>Makes {kinds.size || 0} strateg{kinds.size === 1 ? 'y' : 'ies'} across {picked.size || 0} markets at ${dollars}/trade.</span>
          <button onClick={clearAll} className="text-[var(--neg)]">Delete all robots</button>
        </div>
      </div>
    </div>
  )
}

function Tile({ label, value, tone, big }: { label: string; value: string; tone?: 'pos' | 'neg'; big?: boolean }) {
  const c = tone === 'pos' ? 'text-[var(--pos)]' : tone === 'neg' ? 'text-[var(--neg)]' : ''
  return (
    <div className="rounded-2xl border p-4 text-center">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-1 font-bold tabular ${big ? 'text-2xl' : 'text-lg'} ${c}`}>{value}</div>
    </div>
  )
}

function Step({ n, title, hint, children }: { n: number; title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-5">
      <div className="mb-1 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-white">{n}</span>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <p className="mb-4 ml-11 text-sm text-muted">{hint}</p>
      <div className="ml-0 sm:ml-11">{children}</div>
    </div>
  )
}

function Big({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${on ? 'bg-[var(--pos)] text-white' : 'bg-[var(--surface-2)] text-[var(--text)]'}`}>
      {label}
    </button>
  )
}

function ChipBox({ title, list, picked, onToggle, strip }: { title: string; list: string[]; picked: Set<string>; onToggle: (s: string) => void; strip?: string }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="mb-2 text-sm font-medium">{title}</div>
      <div className="flex max-h-48 flex-wrap gap-1.5 overflow-auto">
        {list.map((s) => {
          const on = picked.has(s)
          return (
            <button key={s} onClick={() => onToggle(s)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium ${on ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-2)] text-muted'}`}>
              {on ? '✓ ' : ''}{strip ? s.replace(strip, '') : s}
            </button>
          )
        })}
      </div>
    </div>
  )
}
