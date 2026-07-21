// Billing gate — pure logic, no Stripe SDK involved. Proves the gate is
// binary (automation only), fails closed on unmapped/expired states, and
// never retroactively locks out orgs/deployments that never had billing
// configured in the first place.

import { describe, expect, it } from 'vitest'
import { isAutomationAllowed, newTrialBilling, trialDaysRemaining, TRIAL_DAYS } from '../lib/foundation/billing'

const DAY_MS = 24 * 60 * 60 * 1000
const NOW = Date.parse('2026-07-21T00:00:00.000Z')

describe('newTrialBilling', () => {
  it('starts a trialing status with trialEndsAt TRIAL_DAYS out', () => {
    const b = newTrialBilling('2026-07-21T00:00:00.000Z')
    expect(b.status).toBe('trialing')
    expect(Date.parse(b.trialEndsAt!) - NOW).toBe(TRIAL_DAYS * DAY_MS)
    expect(b.stripeCustomerId).toBeNull()
    expect(b.stripeSubscriptionId).toBeNull()
  })
})

describe('isAutomationAllowed', () => {
  it('allows everything when Stripe is not configured on this deployment', () => {
    expect(isAutomationAllowed(undefined, false, NOW).allowed).toBe(true)
    expect(isAutomationAllowed({ status: 'canceled', trialEndsAt: null, stripeCustomerId: null, stripeSubscriptionId: null, updatedAt: '' }, false, NOW).allowed).toBe(true)
  })

  it('allows orgs created before billing existed (no billing field)', () => {
    expect(isAutomationAllowed(undefined, true, NOW).allowed).toBe(true)
  })

  it('allows an active subscription', () => {
    expect(isAutomationAllowed({ status: 'active', trialEndsAt: null, stripeCustomerId: 'c', stripeSubscriptionId: 's', updatedAt: '' }, true, NOW).allowed).toBe(true)
  })

  it('allows trialing while trialEndsAt is in the future', () => {
    const billing = newTrialBilling(new Date(NOW).toISOString())
    expect(isAutomationAllowed(billing, true, NOW).allowed).toBe(true)
    expect(isAutomationAllowed(billing, true, NOW + (TRIAL_DAYS - 1) * DAY_MS).allowed).toBe(true)
  })

  it('blocks trialing once trialEndsAt has passed, with a reason', () => {
    const billing = newTrialBilling(new Date(NOW).toISOString())
    const gate = isAutomationAllowed(billing, true, NOW + (TRIAL_DAYS + 1) * DAY_MS)
    expect(gate.allowed).toBe(false)
    expect(gate.reason).toBeTruthy()
  })

  it('blocks past_due and canceled', () => {
    expect(isAutomationAllowed({ status: 'past_due', trialEndsAt: null, stripeCustomerId: 'c', stripeSubscriptionId: 's', updatedAt: '' }, true, NOW).allowed).toBe(false)
    expect(isAutomationAllowed({ status: 'canceled', trialEndsAt: null, stripeCustomerId: 'c', stripeSubscriptionId: 's', updatedAt: '' }, true, NOW).allowed).toBe(false)
  })
})

describe('trialDaysRemaining', () => {
  it('is null when not trialing', () => {
    expect(trialDaysRemaining(undefined, NOW)).toBeNull()
    expect(trialDaysRemaining({ status: 'active', trialEndsAt: null, stripeCustomerId: null, stripeSubscriptionId: null, updatedAt: '' }, NOW)).toBeNull()
  })

  it('counts whole days remaining, floored at 0', () => {
    const billing = newTrialBilling(new Date(NOW).toISOString())
    expect(trialDaysRemaining(billing, NOW)).toBe(TRIAL_DAYS)
    expect(trialDaysRemaining(billing, NOW + (TRIAL_DAYS + 5) * DAY_MS)).toBe(0)
  })
})
