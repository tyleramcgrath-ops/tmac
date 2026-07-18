// Competitor Analysis: a tracked competitor's overlap used to be permanently
// "unavailable" (assembleAtlas always called computeOverlap(ours, null, ...)
// — nothing ever crawled the competitor's site). This proves the real path:
// crawlCompetitorSample() actually crawls a bounded sample (SSRF-guarded, same
// engine as every other crawl), the refresh route persists real Observed
// overlap on the Competitor record, and assembleAtlas honors that persisted
// snapshot instead of recomputing to Unavailable every time.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { __setStoreForTests } from '../lib/foundation/store'
import { __resetRateLimits } from '../lib/foundation/rate-limit'
import { __setTrustedHostsForTests } from '../app/api/seo-scan/url-guard'
import { crawlCompetitorSample } from '../lib/foundation/external/competitor-crawl'
import { computeOverlap, isCompetitorOverlap } from '../lib/foundation/external/competitors'
import { assembleAtlas, disconnectedProviderSet } from '../lib/foundation/external/service'
import { POST as signup } from '../app/api/auth/signup/route'
import { POST as createProject } from '../app/api/projects/route'
import { POST as competitorsPost } from '../app/api/projects/[projectId]/competitors/route'
import type { Competitor, Scan } from '../lib/foundation/types'
import type { PageSignals } from '../lib/foundation/reco/signals'

process.env.APP_SECRET = 'competitor-overlap-secret-01'

function pageHtml(title: string, links: string[]): string {
  const body = 'Real, honest body copy about this competitor page so it clears the content-length floor. '.repeat(15)
  const anchors = links.map((l) => `<a href="${l}">${l}</a>`).join('\n')
  return `<!doctype html><html><head><title>${title}</title>
    <meta name="description" content="A synthetic competitor page with a real description long enough to pass the floor.">
  </head><body><h1>${title}</h1><p>${body}</p>${anchors}</body></html>`
}

describe('crawlCompetitorSample: real bounded crawl, honestly graded', () => {
  afterEach(() => {
    __setTrustedHostsForTests(null)
    vi.unstubAllGlobals()
  })

  it('crawls a real sample of pages and maps them to PageSignals', async () => {
    __setTrustedHostsForTests(['rival.com'])
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      if (/sitemap/i.test(url)) return new Response('', { status: 404 })
      const u = new URL(url)
      if (u.pathname === '/' || u.pathname === '') {
        return new Response(pageHtml('Rival Home', ['https://rival.com/pricing', 'https://rival.com/features']), { status: 200, headers: { 'content-type': 'text/html' } })
      }
      return new Response(pageHtml(`Rival ${u.pathname}`, []), { status: 200, headers: { 'content-type': 'text/html' } })
    }))

    const result = await crawlCompetitorSample('rival.com')
    expect(result.ok).toBe(true)
    expect(result.pagesCrawled).toBeGreaterThan(0)
    expect(result.pages[0].url).toContain('rival.com')
    expect(result.pages[0].title).toBeTruthy()
  })

  it('reports honest failure when the competitor site cannot be reached', async () => {
    __setTrustedHostsForTests(['unreachable-rival.com'])
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('network unreachable')
    }))
    const result = await crawlCompetitorSample('unreachable-rival.com')
    expect(result.ok).toBe(false)
    expect(result.pages).toEqual([])
    expect(result.error).toBeTruthy()
  })
})

describe('isCompetitorOverlap: validates a persisted snapshot before trusting it', () => {
  it('accepts a real computeOverlap() result', () => {
    const overlap = computeOverlap([{ url: 'https://us.com/' } as PageSignals], [{ url: 'https://rival.com/' } as PageSignals], '2026-07-18T00:00:00Z')
    expect(isCompetitorOverlap(overlap)).toBe(true)
  })
  it('rejects undefined, null, and malformed shapes', () => {
    expect(isCompetitorOverlap(undefined)).toBe(false)
    expect(isCompetitorOverlap(null)).toBe(false)
    expect(isCompetitorOverlap({ topicOverlap: 0.5 })).toBe(false) // not an Observation
    expect(isCompetitorOverlap({})).toBe(false)
  })
})

const CTX0 = { params: Promise.resolve({}) }
function jsonReq(body: unknown, cookie?: string): Request {
  return new Request('http://t', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) })
}
const cookieFrom = (r: Response) => (r.headers.get('set-cookie') ?? '').split(';')[0]

describe('refresh persists real overlap, and Atlas honors it', () => {
  let store: FileFoundationStore

  beforeEach(() => {
    store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-competitor-overlap-')))
    __setStoreForTests(store)
    __resetRateLimits()
  })
  afterEach(() => {
    __setStoreForTests(null)
    __setTrustedHostsForTests(null)
    vi.unstubAllGlobals()
  })

  async function seed() {
    const cookie = cookieFrom(await signup(jsonReq({ email: `${randomUUID()}@x.com`, password: 'longenough123' }), CTX0))
    const proj = await createProject(jsonReq({ domain: 'us.com' }, cookie), CTX0)
    const { project } = (await proj.json()) as { project: { id: string; orgId: string; domain: string; name: string } }
    const ctx = { params: Promise.resolve({ projectId: project.id }) }

    const scan: Scan = {
      id: randomUUID(), projectId: project.id, createdBy: 'u1', createdAt: new Date().toISOString(), status: 'completed',
      startedAt: new Date().toISOString(), completedAt: new Date().toISOString(), error: null,
      summary: { pagesCrawled: 1, urlsDiscovered: 1, blockedCount: 0, siteScore: 80, critical: 0, warning: 0, info: 0 },
      pages: [{ url: 'https://us.com/pricing', title: 'Pricing · Us', titleLength: 12, schemaTypes: ['Product'], internalTargets: [], wordCount: 400, h1Count: 1 }],
      blocked: [],
    }
    await store.createScan(scan)
    return { project, cookie, ctx }
  }

  it('a competitor refresh crawls real pages, computes Observed overlap, and Atlas uses that snapshot', async () => {
    const { project, cookie, ctx } = await seed()
    const competitor: Competitor = { id: randomUUID(), projectId: project.id, domain: 'rival.com', label: 'Rival', addedBy: 'u1', createdAt: new Date().toISOString() }
    await store.createCompetitor(competitor)

    __setTrustedHostsForTests(['rival.com'])
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      if (/sitemap/i.test(url)) return new Response('', { status: 404 })
      return new Response(pageHtml('Pricing · Rival', []), { status: 200, headers: { 'content-type': 'text/html' } })
    }))

    const res = await competitorsPost(jsonReq({ action: 'refresh', id: competitor.id }, cookie), ctx)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.crawled).toBe(true)
    expect(body.competitor.lastSnapshotAt).toBeTruthy()

    const persisted = await store.getCompetitor(competitor.id)
    expect(isCompetitorOverlap(persisted?.overlap)).toBe(true)
    const overlap = persisted!.overlap as ReturnType<typeof computeOverlap>
    expect(overlap.topicOverlap.evidence.grade).toBe('observed')

    // Atlas assembly must now report this snapshot instead of recomputing to unavailable.
    const snap = await assembleAtlas({
      now: new Date().toISOString(),
      project: { domain: project.domain, name: project.name },
      ourPages: [{ url: 'https://us.com/pricing', title: 'Pricing · Us' } as PageSignals],
      competitors: [(await store.getCompetitor(competitor.id))!],
      providers: disconnectedProviderSet(),
    })
    expect(snap.competitors[0].overlap.topicOverlap.evidence.grade).toBe('observed')
  })

  it('an unreachable competitor site leaves overlap honestly unavailable, never fabricated', async () => {
    const { project, cookie, ctx } = await seed()
    const competitor: Competitor = { id: randomUUID(), projectId: project.id, domain: 'unreachable-rival.com', label: 'Rival', addedBy: 'u1', createdAt: new Date().toISOString() }
    await store.createCompetitor(competitor)

    __setTrustedHostsForTests(['unreachable-rival.com'])
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network unreachable') }))

    const res = await competitorsPost(jsonReq({ action: 'refresh', id: competitor.id }, cookie), ctx)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.crawled).toBe(false)
    expect(body.error).toBeTruthy()

    const persisted = await store.getCompetitor(competitor.id)
    const overlap = persisted!.overlap as ReturnType<typeof computeOverlap>
    expect(overlap.topicOverlap.evidence.grade).toBe('unavailable')
  })
})
