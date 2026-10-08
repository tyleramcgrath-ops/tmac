import { describe, expect, it } from 'vitest'
import { newBilling } from '../apps/saysites/lib/billing'
import { directoryCsv, directoryRows, filterRows, placeOf, startedVia, tally } from '../apps/saysites/lib/directory'
import { SHOWCASE } from '../apps/saysites/lib/showcase'
import { MemoryStore } from '../apps/saysites/lib/store'

const demo = SHOWCASE['rivertown-plumbing']
const siteFor = (id: string, sub: string, extra: Record<string, unknown> = {}) => ({ ...demo.site, id, orgId: 'x', subdomain: sub, ...extra })
const pagesFor = (siteId: string) => demo.pages.map((p) => ({ ...p, id: `${siteId}-${p.id}`, siteId }))

describe('SaySites directory', () => {
  it('lists every site with its owner, place, numbers and how it started', async () => {
    const store = new MemoryStore()
    const now = Date.now()
    const jo = await store.createUser({ email: 'jo@acme.com', name: 'Jo', passwordHash: 'h' })
    const sam = await store.createUser({ email: 'sam@b.com', name: 'Sam', passwordHash: 'h' })
    await store.createUser({ email: 'lee@c.com', name: 'Lee', passwordHash: 'h' })
    await store.saveBilling(jo.id, { ...newBilling(now), status: 'active', plan: 'site', interval: 'year' })
    await store.saveBilling(sam.id, newBilling(now - 6 * 86_400_000))
    await store.createSite(jo.id, siteFor('s1', 'acme', { startedVia: 'google' }), pagesFor('s1'))
    await store.createSite(sam.id, siteFor('s2', 'bee', { ownership: { verified: false, domain: 'bee.com' } }), [])
    const day = new Date().toISOString().slice(0, 10)
    await store.recordVisit('s1', day, '/')
    await store.recordVisit('s1', day, '/')
    await store.recordVisit('s1', day, '#call')
    await store.addMessage({ siteId: 's1', name: 'A', email: 'a@a.com', phone: '', body: 'hi', page: '/contact' })
    await store.recordUsage('s1', day, 25_000)
    const { sites, noSite } = directoryRows(await store.directory(day), now)
    const s1 = sites.find((r) => r.siteId === 's1')!
    expect(s1).toMatchObject({ ownerEmail: 'jo@acme.com', status: 'Paying', plan: 'Site, yearly', startedVia: 'google', views: 2, calls: 1, leads: 1, leadsAll: 1, sofieSpend: 0.03, sofieChats: 1, next: 'star' })
    expect(s1.published).toBeGreaterThan(0)
    expect(s1.state).toBe(placeOf(demo.site).state)
    const s2 = sites.find((r) => r.siteId === 's2')!
    // Six days into a seven-day trial: the most urgent person to talk to.
    expect(s2).toMatchObject({ startedVia: 'redesign', ownership: 'Not proved yet', trialDaysLeft: 1, next: 'ending' })
    expect(noSite.map((u) => u.email)).toEqual(['lee@c.com'])
    expect(noSite[0].next).toBe('nosite')
  })

  it('works out how older sites started', () => {
    expect(startedVia({ ...demo.site, handoff: { code: 'a'.repeat(24), plan: 'law', sentAt: 'x' } })).toBe('team')
    expect(startedVia({ ...demo.site, business: { ...demo.site.business, reviewUrl: 'https://search.google.com/local/writereview?placeid=abc' } })).toBe('google')
    expect(startedVia({ ...demo.site, business: { ...demo.site.business, reviewUrl: undefined } })).toBe('questions')
  })

  it('reads the place from the address or the area', () => {
    const b = demo.site.business
    expect(placeOf({ ...demo.site, business: { name: b.name, schemaType: 'Plumber', area: 'Tulsa, ok' } })).toEqual({ city: 'Tulsa', state: 'OK' })
    expect(placeOf({ ...demo.site, business: { name: b.name, schemaType: 'Plumber' } })).toEqual({ city: '', state: '' })
  })

  it('filters, tallies and exports a spreadsheet-safe CSV', async () => {
    const store = new MemoryStore()
    const u = await store.createUser({ email: 'jo@acme.com', name: '=cmd()', passwordHash: 'h' })
    await store.createSite(u.id, siteFor('s1', 'acme', { business: { ...demo.site.business, name: 'Acme, "Best" Plumbing', area: 'Tulsa, OK', address: undefined } }), [])
    const { sites } = directoryRows(await store.directory('2026-01-01'))
    expect(filterRows(sites, { q: 'acme' })).toHaveLength(1)
    expect(filterRows(sites, { state: 'TX' })).toHaveLength(0)
    expect(tally(sites, (r) => r.state)).toEqual([{ key: 'OK', n: 1 }])
    const csv = directoryCsv(sites.map((r) => ({ ...r, web: 'https://acme.saysites.com' })))
    expect(csv.split('\n')[0]).toMatch(/^business,type,city,state/)
    expect(csv).toContain('"Acme, ""Best"" Plumbing"')
    expect(csv).toContain(",'=cmd(),")
    expect(csv).toContain('Nothing published: offer to finish it')
  })
})
