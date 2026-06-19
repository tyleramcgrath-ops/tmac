'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Eye,
  FlaskConical,
  Gauge,
  History,
  LayoutDashboard,
  Moon,
  Play,
  ScrollText,
  Settings,
  ShieldCheck,
  Square,
  Sun,
  TrendingUp,
} from 'lucide-react'
import { engineAction, post } from '@/lib/client/api'
import { Badge, Button } from './ui'
import { useTraderContext } from './trader-context'

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/strategies', label: 'Strategies', icon: TrendingUp },
  { href: '/portfolio', label: 'Portfolio', icon: BarChart3 },
  { href: '/watchlists', label: 'Watchlists', icon: Eye },
  { href: '/history', label: 'Trade History', icon: History },
  { href: '/risk', label: 'Risk Controls', icon: ShieldCheck },
  { href: '/backtesting', label: 'Backtesting', icon: FlaskConical },
  { href: '/paper', label: 'Paper Trading', icon: Activity },
  { href: '/settings', label: 'API Settings', icon: Settings },
  { href: '/logs', label: 'Logs', icon: ScrollText },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 transform border-r bg-[var(--surface)] transition-transform md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Gauge size={20} className="text-[var(--accent)]" />
          <span className="font-semibold tracking-tight">TMAC Trader</span>
        </div>
        <nav className="space-y-1 p-3">
          {NAV.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  active ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'text-muted hover:bg-[var(--surface-2)]'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 w-full border-t p-3 text-[11px] text-muted">
          Not financial advice. Live trading can lose money.
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex min-h-screen flex-col">
        <Topbar onMenu={() => setOpen((v) => !v)} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const { state, refresh } = useTraderContext()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => setMounted(true), [])

  const mode = state?.account.mode ?? 'paper'
  const live = state?.risk.liveTradingEnabled
  const killed = state?.risk.killSwitchEngaged
  const running = state?.engineRunning
  const ms = state?.marketStatus

  async function act(action: string) {
    setBusy(true)
    try {
      await engineAction(action)
      await refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  async function emergencyStop() {
    if (!confirm('EMERGENCY STOP: halt the engine, engage the kill switch, and cancel all pending orders?')) return
    setBusy(true)
    try {
      await post('/api/engine', { action: 'kill' })
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-[var(--surface)]/80 px-4 backdrop-blur">
      <button className="md:hidden" onClick={onMenu} aria-label="Menu">
        ☰
      </button>

      <div className="flex items-center gap-2">
        <Badge tone={killed ? 'neg' : mode === 'live' ? 'warn' : 'pos'}>
          {killed ? 'HALTED' : mode === 'live' ? 'LIVE MODE' : 'PAPER MODE'}
        </Badge>
        {live && !killed && <Badge tone="warn">Live trading armed</Badge>}
        <Badge tone={running ? 'accent' : 'default'}>{running ? 'Engine running' : 'Engine stopped'}</Badge>
      </div>

      <div className="ml-auto hidden items-center gap-2 text-xs text-muted sm:flex">
        <MarketDot on={!!ms?.crypto} label="Crypto" />
        <MarketDot on={!!ms?.equities} label="Equities" />
        <MarketDot on={!!ms?.options} label="Options" />
      </div>

      <div className="flex items-center gap-2">
        {running ? (
          <Button variant="secondary" disabled={busy} onClick={() => act('stop')}>
            <Square size={14} /> Stop
          </Button>
        ) : (
          <Button variant="primary" disabled={busy || killed} onClick={() => act('start')}>
            <Play size={14} /> Start
          </Button>
        )}
        <Button variant="danger" disabled={busy} onClick={emergencyStop} title="Emergency stop">
          <AlertTriangle size={14} /> Stop Trading
        </Button>
        {mounted && (
          <Button variant="ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
        )}
      </div>
    </header>
  )
}

function MarketDot({ on, label }: { on: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-2 w-2 rounded-full ${on ? 'bg-[var(--pos)]' : 'bg-[var(--border)]'}`} />
      {label}
    </span>
  )
}
