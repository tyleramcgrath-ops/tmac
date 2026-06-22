'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card p-4 ${className}`}>{children}</div>
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatCard({
  label,
  value,
  sub,
  tone = 'default',
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: 'default' | 'pos' | 'neg' | 'warn'
}) {
  const toneClass =
    tone === 'pos' ? 'text-[var(--pos)]' : tone === 'neg' ? 'text-[var(--neg)]' : tone === 'warn' ? 'text-[var(--warn)]' : ''
  return (
    <div className="card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-2 text-2xl font-semibold tabular ${toneClass}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  )
}

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'
const variants: Record<Variant, string> = {
  primary: 'bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90',
  secondary: 'bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--border)]',
  danger: 'bg-[var(--neg)] text-white hover:opacity-90',
  success: 'bg-[var(--pos)] text-white hover:opacity-90',
  ghost: 'bg-transparent text-muted hover:bg-[var(--surface-2)]',
}

export function Button({
  variant = 'secondary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  )
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'pos' | 'neg' | 'warn' | 'accent' }) {
  const map = {
    default: 'bg-[var(--surface-2)] text-muted',
    pos: 'bg-[var(--pos)]/15 text-[var(--pos)]',
    neg: 'bg-[var(--neg)]/15 text-[var(--neg)]',
    warn: 'bg-[var(--warn)]/15 text-[var(--warn)]',
    accent: 'bg-[var(--accent)]/15 text-[var(--accent)]',
  }
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[tone]}`}>{children}</span>
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border bg-[var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] ${props.className ?? ''}`}
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border bg-[var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] ${props.className ?? ''}`}
    />
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 text-sm"
    >
      <span
        className={`relative h-5 w-9 rounded-full transition ${checked ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${checked ? 'left-4' : 'left-0.5'}`} />
      </span>
      {label && <span>{label}</span>}
    </button>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="card p-8 text-center text-sm text-muted">{children}</div>
}
