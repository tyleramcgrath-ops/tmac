'use client'

// Billing settings: current plan/trial status, upgrade (Stripe Checkout), and
// manage-billing (Stripe portal). Owner-only for the actions; any member can
// view status. Hides all billing UI when Stripe isn't configured on this
// deployment (self-host / dev) rather than showing a broken paywall.

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../lib/auth-context'
import { api, ApiError, type BillingStatusDTO, type Org } from '../lib/client'
import { AppHeader, Field, inputClass, RequireAuth, Spinner } from '../lib/ui'
import { PilotBar } from '../lib/PilotBar'

export default function BillingPage() {
  return (
    <RequireAuth>
      <AppHeader />
      <PilotBar />
      <main className="mx-auto max-w-2xl px-5 pb-8 pt-2">
        <BillingInner />
      </main>
    </RequireAuth>
  )
}

function BillingInner() {
  const { orgs } = useAuth()
  const [orgId, setOrgId] = useState('')
  useEffect(() => {
    if (!orgId && orgs.length > 0) setOrgId(orgs[0].id)
  }, [orgs, orgId])

  if (orgs.length === 0) return <Spinner label="Loading your organizations…" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Billing</h1>
        <p className="text-sm text-[var(--rf-muted)]">Your plan, trial status, and payment method.</p>
      </div>
      {orgs.length > 1 && (
        <Field label="Organization">
          <select className={inputClass} value={orgId} onChange={(e) => setOrgId(e.target.value)}>
            {orgs.map((o: Org) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      {orgId && <OrgBilling orgId={orgId} />}
    </div>
  )
}

function OrgBilling({ orgId }: { orgId: string }) {
  const [status, setStatus] = useState<BillingStatusDTO | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.billingStatus(orgId)
      setStatus(res)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load billing status.')
      setStatus(null)
    }
  }, [orgId])
  useEffect(() => {
    setStatus(null)
    setError('')
    void load()
  }, [load])

  async function upgrade() {
    setBusy(true)
    setError('')
    try {
      const { url } = await api.billingCheckout(orgId)
      window.location.href = url
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start checkout.')
      setBusy(false)
    }
  }

  async function manage() {
    setBusy(true)
    setError('')
    try {
      const { url } = await api.billingPortal(orgId)
      window.location.href = url
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not open the billing portal.')
      setBusy(false)
    }
  }

  if (status === null && !error) return <Spinner label="Loading billing…" />

  if (status && !status.configured) {
    return (
      <div className="rf-card p-4 text-sm text-[var(--rf-muted)]">
        Billing isn't configured on this deployment — every feature, including automatic fixes, is unrestricted.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {status && (
        <div className="rf-card space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">{status.priceLabel}</h2>
            <StatusPill status={status.status} />
          </div>
          <p className="text-sm text-[var(--rf-muted)]">
            {status.priceCents ? `$${(status.priceCents / 100).toFixed(2)}/month` : ''}
            {status.status === 'trialing' && status.trialDaysRemaining !== null && status.trialDaysRemaining !== undefined && (
              <> &middot; {status.trialDaysRemaining} day{status.trialDaysRemaining === 1 ? '' : 's'} left in your trial</>
            )}
          </p>
          <p className="text-xs text-[var(--rf-muted)]">
            Audits, recommendations, and rollback are always free. A paid plan is only required to let RankForge
            auto-deploy fixes to your live WordPress site.
          </p>
          <div className="flex gap-2 pt-1">
            {(status.status === 'trialing' || status.status === 'past_due' || status.status === 'canceled' || !status.hasStripeCustomer) && (
              <button onClick={() => void upgrade()} disabled={busy} className="rf-btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60">
                {busy ? 'Redirecting…' : 'Upgrade'}
              </button>
            )}
            {status.hasStripeCustomer && (
              <button onClick={() => void manage()} disabled={busy} className="rf-btn-ghost rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60">
                {busy ? 'Redirecting…' : 'Manage billing'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }: { status?: BillingStatusDTO['status'] }) {
  const map: Record<string, { label: string; cls: string }> = {
    trialing: { label: 'Trial', cls: 'bg-[var(--rf-blue-bright)]/15 text-[var(--rf-blue-bright)]' },
    active: { label: 'Active', cls: 'bg-[var(--rf-green)]/15 text-[var(--rf-green)]' },
    past_due: { label: 'Past due', cls: 'bg-amber-500/15 text-amber-400' },
    canceled: { label: 'Canceled', cls: 'bg-red-500/15 text-red-300' },
  }
  const v = (status && map[status]) || { label: 'No plan', cls: 'bg-white/10 text-[var(--rf-muted)]' }
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${v.cls}`}>{v.label}</span>
}
