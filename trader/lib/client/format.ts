export function usd(n: number | undefined | null, dp = 2): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: dp, maximumFractionDigits: dp })
}

export function pct(n: number | undefined | null, dp = 2): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return `${(n * 100).toFixed(dp)}%`
}

export function num(n: number | undefined | null, dp = 4): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toLocaleString('en-US', { maximumFractionDigits: dp })
}

export function ago(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function dt(ts: number): string {
  return new Date(ts).toLocaleString()
}

export function pnlClass(n: number | undefined | null): string {
  if (n == null || n === 0) return 'text-muted'
  return n > 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]'
}
