import { describe, expect, it } from 'vitest'
import type { Audit } from '../apps/saysites/lib/audit'
import { newBilling, PRICES } from '../apps/saysites/lib/billing'
import { businessSite, outreachEmail, runOutreach, startCampaign, type Campaign } from '../apps/saysites/lib/outreach'
import { awaitingOwner, ownerAddress, ownershipToken, readOwnershipToken } from '../apps/saysites/lib/ownership'
import { REPORT_MIN_SITES, blockedBy, buildReport, outreachCsv, parseProspectLines, withFreeMonth, type Prospect } from '../apps/saysites/lib/prospects'
import { serveSitePath } from '../apps/saysites/lib/serve'
import { SHOWCASE } from '../apps/saysites/lib/showcase'
import { MemoryStore } from '../apps/saysites/lib/store'

process.env.SAYSITES_SECRET ??= 'test-secret-0123456789abcdef0123456789abcdef'

const audit = (kb: number, extra: Partial<Audit> = {}): Audit => ({ kb, scripts: 40, stylesheets: 8, images: 10, imagesNoAlt: 2, h1s: 1, titleLength: 50, hasDescription: true, schema: [], viewport: true, ...extra })
const prospect = (i: number, extra: Partial<Prospect> = {}): Prospect => ({ id: `${String(i).padStart(2, '0')}aaaaaaaaaaaaaaaaaa`, campaign: 'pi-tulsa', url: `https://firm${i}.com`, name: `Firm ${i}`, email: `hi@firm${i}.com`, createdAt: '2026-10-08T00:00:00.000Z', previewId: `p${i}`, before: audit(100 + i), after: { kb: 20, scripts: 0 }, ...extra })

describe('SaySites outreach: lists', () => {
  it('reads pasted lines in any order and skips what it can’t use', () => {
    const { lines, skipped } = parseProspectLines('Smith Law, smithlaw.com, Jane@SmithLaw.com\nhttps://www.rivertown.com/\trivertown plumbing\nnot a site\nsmithlaw.com')
    expect(lines).toEqual([
      { url: 'https://smithlaw.com', email: 'jane@smithlaw.com', name: 'Smith Law' },
      { url: 'https://www.rivertown.com/', name: 'rivertown plumbing' },
    ])
    expect(skipped).toEqual(['not a site'])
  })

  it('never contacts a business again after it unsubscribed, by address or website', () => {
    const all = [prospect(1, { unsubscribedAt: '2026-10-08' })]
    expect(blockedBy({ url: 'https://www.firm1.com/about' }, all)).toBe(true)
    expect(blockedBy({ url: 'https://other.com', email: 'hi@firm1.com' }, all)).toBe(true)
    expect(blockedBy({ url: 'https://firm2.com' }, all)).toBe(false)
  })

  it('keeps businesses’ own sites from search and drops directories and social sites', () => {
    expect(businessSite('https://www.smithlaw.com/car-accidents')).toBe('https://smithlaw.com/')
    for (const u of ['https://www.yelp.com/biz/x', 'https://www.avvo.com/a', 'https://m.facebook.com/x', 'https://www.justia.com/lawyers', 'https://ok.gov/x', 'https://www.superlawyers.com/x']) expect(businessSite(u), u).toBeNull()
  })

  it('starts a campaign from search results, without duplicates', async () => {
    const store = new MemoryStore()
    const fake = (async () => new Response(JSON.stringify({ organic_results: [{ link: 'https://smithlaw.com/' }, { link: 'https://www.yelp.com/x' }, { link: 'https://www.smithlaw.com/contact' }], local_results: { places: [{ links: { website: 'https://jonesinjury.com' } }] } }))) as typeof fetch
    const { campaign, added } = await startCampaign(store, { trade: 'personal injury lawyer', city: 'Tulsa, OK', lines: [{ url: 'https://pasted.com' }] }, { key: 'k', get: fake })
    expect(campaign.slug).toBe('personal-injury-lawyer-tulsa-ok')
    expect(added).toBe(3)
    expect((await store.prospects(campaign.slug)).map((p) => p.url).sort()).toEqual(['https://jonesinjury.com/', 'https://pasted.com', 'https://smithlaw.com/'])
    const again = await startCampaign(store, { trade: 'personal injury lawyer', city: 'Tulsa, OK' }, { key: 'k', get: fake })
    expect(again.campaign.slug).toBe('personal-injury-lawyer-tulsa-ok-2')
    expect(again.added).toBe(0)
  })
})

describe('SaySites outreach: emails and the CSV', () => {
  const c: Campaign = { slug: 'pi-tulsa', title: 'PI, Tulsa', trade: 'personal injury lawyer', city: 'Tulsa, OK', createdAt: '2026-10-08' }

  it('writes an honest email with the personal link, the real price and a way out', () => {
    process.env.OUTREACH_ADDRESS = '1 Main St, Tulsa, OK 74103'
    const m = outreachEmail(prospect(1), c, 'https://saysites.com', false)
    expect(m.subject).toContain('Firm 1')
    expect(m.text).toContain('https://saysites.com/r/01aaaaaaaaaaaaaaaaaa')
    expect(m.text).toContain('https://saysites.com/unsubscribe/01aaaaaaaaaaaaaaaaaa')
    expect(m.text).toContain(`$${PRICES.lawstarter.month} a month`)
    expect(m.text).toContain('1 Main St, Tulsa')
    expect(m.text).toMatch(/first month is free|first month free/)
    expect(m.text).not.toMatch(/guarantee|rank #?1|more leads/i)
    expect(outreachEmail(prospect(1), { ...c, trade: 'plumber' }, 'https://saysites.com', true).text).toContain(`$${PRICES.site.month} a month`)
  })

  it('exports only businesses we may email, safe for spreadsheets', () => {
    const rows = [prospect(1, { name: '=HYPERLINK("x")' }), prospect(2, { unsubscribedAt: 'x' }), prospect(3, { noEmail: true }), prospect(4, { claimedAt: 'x' }), prospect(5, { email: undefined }), prospect(6, { previewId: undefined })]
    const csv = outreachCsv(rows, 'https://saysites.com', (p, f) => outreachEmail(p, c, 'https://saysites.com', f))
    const lines = csv.trim().split('\n')
    expect(lines[0]).toMatch(/^name,email,website,preview_link,unsubscribe_link/)
    expect(csv).toContain('hi@firm1.com')
    for (const n of [2, 3, 4, 5, 6]) expect(csv).not.toContain(`firm${n}.com`)
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`)
  })
})

describe('SaySites outreach: the free first month', () => {
  it('runs the trial to a month from today, never shorter, only during a trial', () => {
    const now = Date.parse('2026-10-08T00:00:00Z')
    const b = withFreeMonth(newBilling(now), now)!
    expect(b.trialEndsAt).toBe('2026-11-07T00:00:00.000Z')
    const long = { ...newBilling(now), trialEndsAt: '2027-01-01T00:00:00.000Z' }
    expect(withFreeMonth(long, now)!.trialEndsAt).toBe('2027-01-01T00:00:00.000Z')
    expect(withFreeMonth({ ...newBilling(now), status: 'active' }, now)).toBeNull()
  })
})

describe('SaySites outreach: city reports', () => {
  it('needs enough sites, and names only the lightest', () => {
    const few = Array.from({ length: REPORT_MIN_SITES - 1 }, (_, i) => prospect(i))
    expect(buildReport({ slug: 's', title: 't', city: 'Tulsa', trade: 'law', intro: '', campaign: 'pi-tulsa' }, few)).toHaveProperty('error')
    const many = Array.from({ length: 14 }, (_, i) => prospect(i, { before: audit(300 - i * 10, i % 2 ? { schema: ['Attorney'] } : {}) }))
    many[13].unsubscribedAt = 'x'
    const r = buildReport({ slug: 's', title: 't', city: 'Tulsa', trade: 'law', intro: '', campaign: 'pi-tulsa' }, many)
    if ('error' in r) throw new Error(r.error)
    expect(r.sites).toBe(14)
    expect(r.businessDetails).toBe(50)
    expect(r.lightest).toHaveLength(10)
    // Lightest first, the heaviest never named, and anyone who unsubscribed left out.
    expect(r.lightest[0].name).toBe('Firm 12')
    expect(r.lightest.map((x) => x.name)).not.toContain('Firm 0')
    expect(r.lightest.map((x) => x.name)).not.toContain('Firm 13')
    expect(r.ours).toEqual({ kb: 20, scripts: 0 })
  })

  it('drafts a report on its own, unpublished, once a campaign is big enough', async () => {
    const store = new MemoryStore()
    await store.saveCampaign({ slug: 'pi-tulsa', title: 'PI, Tulsa', trade: 'personal injury lawyer', city: 'Tulsa, OK', createdAt: '2026-10-08' })
    for (let i = 0; i < REPORT_MIN_SITES; i++) await store.saveProspect(prospect(i))
    const run = await runOutreach(store)
    expect(run).toEqual({ built: 0, reports: 1 })
    const r = await store.report('pi-tulsa')
    expect(r?.publishedAt).toBeUndefined()
    expect(r?.title).toBe('Personal injury lawyer websites in Tulsa, OK')
  })
})

describe('SaySites outreach: proving ownership', () => {
  it('only emails an address at the business’s own domain', () => {
    expect(ownerAddress('Jane.Doe', 'smithlaw.com')).toBe('jane.doe@smithlaw.com')
    expect(ownerAddress('jane@evil.com', 'smithlaw.com')).toBeNull()
    expect(ownerAddress('', 'smithlaw.com')).toBeNull()
  })

  it('signs the confirmation link and lets it expire', () => {
    const now = Date.parse('2026-10-08T00:00:00Z')
    const t = ownershipToken('site_1', 'jane@smithlaw.com', now)
    expect(readOwnershipToken(t, now + 1000)).toEqual({ siteId: 'site_1', email: 'jane@smithlaw.com' })
    expect(readOwnershipToken(t, now + 4 * 86_400_000)).toBeNull()
    expect(readOwnershipToken(t.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A')), now)).toBeNull()
  })

  it('keeps a claimed site off the public web until the owner proves it', () => {
    const { site, pages } = SHOWCASE['rivertown-plumbing']
    const waiting = { site: { ...site, ownership: { verified: false, domain: 'rivertown.com' } }, pages, redirects: [] }
    expect(awaitingOwner(waiting.site)).toBe(true)
    const live = serveSitePath(waiting, [], { preview: false })
    expect(live.status).toBe(404)
    expect(live.headers.get('x-robots-tag')).toBe('noindex')
    // The owner's own dashboard preview still works.
    expect(serveSitePath(waiting, [], { preview: true }).status).toBe(200)
    const ok = { ...waiting, site: { ...waiting.site, ownership: { verified: true, how: 'email' as const } } }
    expect(serveSitePath(ok, [], { preview: false }).status).toBe(200)
  })
})
