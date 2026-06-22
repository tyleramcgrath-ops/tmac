import { AlertTriangle } from 'lucide-react'

export function Disclaimer() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-[var(--warn)]/40 bg-[var(--warn)]/10 p-3 text-sm">
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[var(--warn)]" />
      <p className="text-muted">
        <span className="font-medium text-[var(--text)]">Not financial advice.</span> This software is for education and
        research. Automated and live trading carry substantial risk and you can lose money. The platform defaults to{' '}
        <span className="font-medium text-[var(--text)]">paper trading</span>; live trading is disabled until you enable
        it explicitly. Use only official, approved broker APIs. You are responsible for your own trades.
      </p>
    </div>
  )
}
