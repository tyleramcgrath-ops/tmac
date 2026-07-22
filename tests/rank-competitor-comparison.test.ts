// Free competitor rank comparison route: reuses the same SERPAPI_KEY-gated
// live position checker as "Check keyword rankings now", applied to tracked
// competitor domains for the keywords already tracked for this project.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { __setStoreForTests } from '../lib/foundation/store'
import { __resetRateLimits } from '../lib/foundation/rate-limit'
import { GET as compareRankings } from '../app/api/projects/[projectId]/rankings/competitors/route'
import { POST as signup } from '../app/api/auth/signup/route'
import { POST as createProject } from '../app/api/projects/route'
import type { Competitor, TrackedKeyword } from '../lib/foundation/types'

process.env.APP_SECRET = 'rank-competitor-secret-01'
const ORIGINAL_ENV = { ...process.env }
const now = () => new Date().toISOString()

let store: FileFoundationStore

beforeEach(() => {
  __resetRateLimits()
  store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-rank-cmp-')))
  __setStoreForTests(store)
  process.env = { ...ORIGINAL_ENV }
})
afterEach(() => {
  vi.unstubAllGlobals()
  __setStoreForTests(null)
  process.env = { ...ORIGINAL_ENV }
})

function cookieFrom(res: Response) {
  return (res.headers.get('set-cookie') ?? '').split(';')[0]
}

async function seedProjectViaRoute(email: string, domain: string) {
  const ctx0 = { params: Promise.resolve({}) }
  const cookie = cookieFrom(
    await signup(new Request('http://t', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'longenough123' }) }), ctx0)
  )
  const projRes = await createProject(new Request('http://t', { method: 'POST', headers: { 'Content-Type': 'application/json', cookie }, body: JSON.stringify({ domain }) }), ctx0)
  const { project } = (await projRes.json()) as { project: { id: string } }
  return { cookie, project }
}

function serpResponse(rankedLink: string | null) {
  return {
    organic_results: rankedLink ? [{ link: rankedLink, position: 3 }, { link: 'https://other.com/x', position: 1 }] : [{ link: 'https://other.com/x', position: 1 }],
  }
}

describe('GET /api/projects/[projectId]/rankings/competitors', () => {
  it('reports available:false with a plain-language note when SERPAPI_KEY is unset', async () => {
    delete process.env.SERPAPI_KEY
    const { cookie, project } = await seedProjectViaRoute('rc1@x.com', 'ours.com')
    const res = await compareRankings(new Request('http://t', { headers: { cookie } }), { params: Promise.resolve({ projectId: project.id }) })
    const body = await res.json()
    expect(body.available).toBe(false)
    expect(body.note).toMatch(/SERPAPI_KEY/)
  })

  it('requires at least one tracked keyword and one competitor before comparing', async () => {
    process.env.SERPAPI_KEY = 'test-key'
    const { cookie, project } = await seedProjectViaRoute('rc2@x.com', 'ours.com')
    const res = await compareRankings(new Request('http://t', { headers: { cookie } }), { params: Promise.resolve({ projectId: project.id }) })
    expect(res.status).toBe(400)
  })

  it('returns our position and each competitor\'s position for every tracked keyword, honestly (never fabricated)', async () => {
    process.env.SERPAPI_KEY = 'test-key'
    const { cookie, project } = await seedProjectViaRoute('rc3@x.com', 'ours.com')
    const kw: TrackedKeyword = { id: randomUUID(), projectId: project.id, keyword: 'best widgets', addedBy: 'u', createdAt: now() }
    await store.addTrackedKeyword(kw)
    const comp: Competitor = { id: randomUUID(), projectId: project.id, domain: 'rival.com', label: 'Rival', addedBy: 'u', createdAt: now() }
    await store.createCompetitor(comp)

    // The fake SERP response is identical for every request (SerpApi's query
    // doesn't vary by which host we're matching against) and only lists OUR
    // domain in the organic results. fetchKeywordPosition matches results by
    // hostname, so this proves the route calls it once per real host — we
    // rank #3, the competitor honestly comes back "not found" (null), never
    // a fabricated number.
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(serpResponse('https://ours.com/p')), { status: 200 })))

    const res = await compareRankings(new Request('http://t', { headers: { cookie } }), { params: Promise.resolve({ projectId: project.id }) })
    const body = await res.json()
    expect(body.available).toBe(true)
    expect(body.rows).toHaveLength(1)
    expect(body.rows[0].keyword).toBe('best widgets')
    expect(body.rows[0].us).toBe(3)
    expect(body.rows[0].competitors).toEqual([{ label: 'Rival', position: null }])
  })
})
