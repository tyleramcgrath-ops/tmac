// Self-serve billing decisions. Pure logic, no Stripe SDK — this app never
// wires up real billing (stripeConfig() is always unset), so
// isAutomationAllowed() below is always permissive. Gates ONE thing: whether
// this org may have simulated write changes deployed (Operator deploy).
// Audits, recommendations, diagnostics, and rollback are never gated.

import type { Organization } from './types'

export const TRIAL_DAYS = 14

export type OrgBilling = NonNullable<Organization['billing']>

// New org at signup: a real 14-day trial, not a Stripe-side trial — Stripe
// checkout only happens if/when the org actually decides to pay, at which
// point the subscription starts billing immediately (no double trial).
export function newTrialBilling(nowIso: string): OrgBilling {
  return {
    status: 'trialing',
    trialEndsAt: new Date(Date.parse(nowIso) + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    updatedAt: nowIso,
  }
}

export interface AutomationGate {
  allowed: boolean
  reason?: string
}

// Whether this org may auto-deploy a fix right now.
//   - Billing not configured on this deployment at all (no STRIPE_SECRET_KEY)
//     → always allowed. Matches every other optional integration: unset means
//     unconfigured, not "block everyone."
//   - No `billing` on the org (created before billing existed) → allowed.
//     Never retroactively locks out an existing org from a field it never had.
//   - `active` → allowed.
//   - `trialing` → allowed while trialEndsAt is in the future (or absent).
//   - `past_due` / `canceled`, or an expired trial → blocked, with an honest,
//     specific reason (never a generic "forbidden").
export function isAutomationAllowed(billing: OrgBilling | undefined, stripeConfigured: boolean, nowMs: number): AutomationGate {
  if (!stripeConfigured) return { allowed: true }
  if (!billing) return { allowed: true }

  switch (billing.status) {
    case 'active':
      return { allowed: true }
    case 'trialing': {
      if (!billing.trialEndsAt || Date.parse(billing.trialEndsAt) > nowMs) return { allowed: true }
      return { allowed: false, reason: 'Your 14-day trial has ended. Upgrade to keep auto-deploying fixes — you can still view every audit and recommendation for free.' }
    }
    case 'past_due':
      return { allowed: false, reason: 'Your last payment failed. Update your payment method to resume automatic fixes.' }
    case 'canceled':
      return { allowed: false, reason: 'Your subscription is canceled. Upgrade to resume automatic fixes — your audits and recommendations are still here.' }
  }
}

// Whole days left in the trial, for the UI banner. null when there's nothing
// to count down (no trial, already active, billing not configured).
export function trialDaysRemaining(billing: OrgBilling | undefined, nowMs: number): number | null {
  if (!billing || billing.status !== 'trialing' || !billing.trialEndsAt) return null
  const msLeft = Date.parse(billing.trialEndsAt) - nowMs
  return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)))
}
