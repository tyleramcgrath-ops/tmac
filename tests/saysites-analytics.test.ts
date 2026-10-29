import { describe, expect, it } from 'vitest'
import { fillDays, revenue, sum } from '../apps/saysites/lib/analytics'
import { buildStarterSite } from '../apps/saysites/lib/starter'
import { MemoryStore } from '../apps/saysites/lib/store'

describe('SaySites owner analytics', () => {
  it('counts revenue from list prices, yearly as a twelfth, and leaves trials and comps out', () => {
    const r = revenue([
      { status: 'active', trialEndsAt: '', plan: 'site', interval: 'month' },
      { status: 'active', trialEndsAt: '', plan: 'law', interval: 'year' },
      { status: 'past_due', trialEndsAt: '', plan: 'store', interval: 'month' },
      { status: 'trial', trialEndsAt: '' },
      { status: 'comp', trialEndsAt: '' },
      { status: 'canceled', trialEndsAt: '', plan: 'site', interval: 'month' },
    ])
    expect(r.paying).toBe(3)
    expect(r.mrr).toBeCloseTo(15 + 2990 / 12 + 25, 2)
    expect([r.trial, r.comp, r.canceled, r.pastDue]).toEqual([1, 1, 1, 1])
    expect(r.plans[0].plan).toBe('law')
  })

  it('fills every day in the range with zeros', () => {
    const rows = fillDays([{ day: '2026-10-02', leads: 3 }], '2026-10-01', '2026-10-03')
    expect(rows.map((r) => r.day)).toEqual(['2026-10-01', '2026-10-02', '2026-10-03'])
    expect(rows.map((r) => r.leads)).toEqual([0, 3, 0])
    expect(sum(rows, 'leads')).toBe(3)
  })

  it('reports real activity from the store', async () => {
    const store = new MemoryStore()
    const u = await store.createUser({ email: 'a@example.com', name: 'A', passwordHash: 'x' })
    const { site, pages } = buildStarterSite({ name: 'Count Law', type: 'lawyer', city: 'Columbus', region: 'OH', services: ['Wills'], palette: 'ocean' }, u.id, 'count-law')
    await store.createSite(u.id, site, pages)
    await store.addMessage({ siteId: site.id, name: 'L', email: 'l@example.com', phone: '', body: 'Hi', page: '/' })
    await store.addFeedback({ id: 'f1', userId: null, name: 'Firm', email: 'f@example.com', text: 'x', page: 'Let’s talk, /', at: new Date().toISOString() })
    await store.addFeedback({ id: 'f2', userId: null, name: 'User', email: 'u@example.com', text: 'x', page: '/dashboard', at: new Date().toISOString() })
    const today = new Date().toISOString().slice(0, 10)
    const a = await store.analytics(today)
    const rows = fillDays(a.daily, today, today)
    expect(sum(rows, 'signups')).toBe(1)
    expect(sum(rows, 'leads')).toBe(1)
    expect(sum(rows, 'talks')).toBe(1)
    expect(a.totals.users).toBe(1)
    expect(a.topSites).toEqual([{ id: site.id, name: 'Count Law', subdomain: 'count-law', views: 0, calls: 0, leads: 1 }])
  })
})
