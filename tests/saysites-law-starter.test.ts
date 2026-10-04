import { afterEach, describe, expect, it, vi } from 'vitest'
import { AUTO_PRICED, PLANS, PRICES, cleanPlan, lookupKey } from '../apps/saysites/lib/billing'
import { ensurePrice } from '../apps/saysites/lib/stripe'
import { monthlyAllowance } from '../apps/saysites/lib/usage'

afterEach(() => vi.unstubAllGlobals())

describe('SaySites Law Firm Starter', () => {
  it('is a real plan, cheapest of the law plans, with its own Sofie allowance', () => {
    expect(PLANS).toContain('lawstarter')
    expect(cleanPlan('lawstarter')).toBe('lawstarter')
    expect(PRICES.lawstarter.month).toBeLessThan(PRICES.law.month)
    expect(PRICES.lawstarter.year).toBe(PRICES.lawstarter.month * 10)
    expect(AUTO_PRICED).toContain('lawstarter')
    expect(monthlyAllowance({ status: 'active', plan: 'lawstarter' })).toBeLessThan(monthlyAllowance({ status: 'active', plan: 'law' }))
  })

  it('reuses the Stripe price with its lookup key, or creates it at the listed price', async () => {
    const calls: { url: string; body?: string }[] = []
    let existing: unknown[] = []
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      calls.push({ url, body: init?.body as string | undefined })
      if (url.includes('/v1/prices?')) return new Response(JSON.stringify({ data: existing }), { status: 200 })
      return new Response(JSON.stringify({ id: 'price_new' }), { status: 200 })
    })
    const input = { lookupKey: lookupKey('lawstarter', 'month'), product: 'SaySites Law Firm Starter', amountCents: PRICES.lawstarter.month * 100, interval: 'month' as const }
    expect(await ensurePrice(input)).toBe('price_new')
    const created = decodeURIComponent(calls[1].body!)
    expect(created).toContain(`unit_amount=${PRICES.lawstarter.month * 100}`)
    expect(created).toContain('lookup_key=saysites_lawstarter_month')
    expect(created).toContain('recurring[interval]=month')
    existing = [{ id: 'price_old', unit_amount: PRICES.lawstarter.month * 100, recurring: { interval: 'month' } }]
    calls.length = 0
    expect(await ensurePrice(input)).toBe('price_old')
    expect(calls).toHaveLength(1)
  })
})
