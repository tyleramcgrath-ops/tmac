// Operator routes end-to-end (Phase D) against a fake WordPress REST server.
// Exercises the real route handlers: preview → bulk deploy with policy gating →
// read-back verify → verify-failure REOPENS the recommendation → rollback →
// metrics. Uses the in-process WP double as global.fetch.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { __setStoreForTests } from '../lib/foundation/store'
import { encryptSecret } from '../lib/foundation/crypto'
import { POST as signup } from '../app/api/auth/signup/route'
import { POST as createProject } from '../app/api/projects/route'
import { __setTrustedHostsForTests } from '../app/api/seo-scan/url-guard'
import { POST as previewRoute } from '../app/api/projects/[projectId]/operator/preview/route'
import { POST as executeRoute } from '../app/api/projects/[projectId]/operator/execute/route'
import { GET as metricsRoute } from '../app/api/projects/[projectId]/operator/metrics/route'
import { PUT as policyPut } from '../app/api/projects/[projectId]/operator/policy/route'
import type { Recommendation, Scan, WpConnection } from '../lib/foundation/types'

process.env.APP_SECRET = 'operator-routes-secret'

const posts: Record<number, { title: string; excerpt: string; aioseo: string; content: string; slug: string; type: string }> = {}
let dropTitle = false
function resetWp() {
  posts[10] = { title: 'Old Title', excerpt: 'Old', aioseo: 'Old', content: '<p>x</p>', slug: 'roof-repair', type: 'pages' }
  dropTitle = false
}
function fakeWp(url: string, init?: RequestInit): Response {
  const method = init?.method ?? 'GET'
  const j = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } })
  if (url.endsWith('/wp-json')) return j({ namespaces: ['wp/v2', 'aioseo/v1'] })
  if (url.includes('/users/me')) return j({ id: 1, capabilities: { edit_pages: true } })
  if (/\/pages\?slug=roof-repair/.test(url)) return j([{ id: 10, title: { raw: posts[10].title } }])
  if (/\/(pages|posts)\?slug=/.test(url)) return j([])
  if (url.includes('/pages/10') || url.includes('/posts/10')) {
    const p = posts[10]
    if (method === 'POST') {
      const b = JSON.parse((init?.body as string) ?? '{}')
      if (b.title !== undefined && !dropTitle) p.title = b.title
      if (b.aioseo_meta_data?.description !== undefined) p.aioseo = b.aioseo_meta_data.description
    }
    return j({ id: 10, title: { raw: p.title }, excerpt: { raw: p.excerpt }, content: { raw: p.content }, aioseo_meta_data: { description: p.aioseo }, meta: { _aioseo_description: p.aioseo }, link: 'https://wp.test/roof-repair' })
  }
  return j({ code: 'nf' }, 404)
}

let store: FileFoundationStore
const CTX0 = { params: Promise.resolve({}) }
function jsonReq(body: unknown, cookie?: string): Request {
  return new Request('http://t', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) })
}
const cookieFrom = (r: Response) => (r.headers.get('set-cookie') ?? '').split(';')[0]

async function setup() {
  store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-op-')))
  __setStoreForTests(store)
  const cookie = cookieFrom(await signup(jsonReq({ email: `op${Math.round(performance.now())}@x.com`, password: 'longenough123' }), CTX0))
  const proj = await createProject(jsonReq({ domain: 'wp.test', name: 'WP' }, cookie), CTX0)
  const { project } = (await proj.json()) as { project: { id: string } }
  const ctx = { params: Promise.resolve({ projectId: project.id }) }

  // WP connection.
  const conn: WpConnection = { id: randomUUID(), projectId: project.id, siteUrl: 'https://wp.test', username: 'admin', appPasswordEnc: encryptSecret('pw'), aioseo: true, createdBy: 'u', createdAt: new Date().toISOString() }
  await store.upsertWpConnection(conn)

  // A scan whose page signals drive fix generation, + a missing-title rec.
  const scan: Scan = {
    id: randomUUID(), projectId: project.id, createdBy: 'u', createdAt: new Date().toISOString(), status: 'completed',
    startedAt: null, completedAt: null, error: null,
    summary: { pagesCrawled: 1, urlsDiscovered: 1, blockedCount: 0, siteScore: 50, critical: 1, warning: 0, info: 0 },
    pages: [{ url: 'https://wp.test/roof-repair', title: '', titleLength: 0, metaDescription: 'x', metaDescriptionLength: 90, h1Count: 1, schemaTypes: [], https: true, mixedContent: false, indexable: true }],
    blocked: [],
  }
  await store.createScan(scan)
  const rec: Recommendation = {
    id: randomUUID(), projectId: project.id, scanId: scan.id, issueId: 'missing-title::site',
    ruleId: 'missing-title', ruleVersion: 1, ruleCategory: 'content', ruleSeverity: 'critical', businessContext: 'money-page',
    title: 'Missing <title> tag', category: 'content',
    severity: 'critical', status: 'accepted', reasoning: 'Title missing', confidence: 90, confidenceBasis: 'x',
    evidence: { affectedUrls: ['https://wp.test/roof-repair'], facts: [] },
    expectedImpact: { category: 'content', size: 'high', note: 'CTR' }, risk: { level: 'low', note: '' },
    createdAt: new Date().toISOString(), history: [],
  }
  await store.createRecommendations([rec])
  return { cookie, projectId: project.id, ctx, recId: rec.id }
}

beforeEach(() => {
  resetWp()
  __setTrustedHostsForTests(['wp.test'])
  vi.stubGlobal('fetch', (i: string | URL, init?: RequestInit) => Promise.resolve(fakeWp(String(i), init)))
})
afterEach(() => {
  vi.unstubAllGlobals()
  __setStoreForTests(null)
  __setTrustedHostsForTests(null)
})

describe('operator preview', () => {
  it('generates a concrete fix + diff + safety + policy decision', async () => {
    const { cookie, ctx, recId } = await setup()
    const res = await previewRoute(jsonReq({ recommendationIds: [recId] }, cookie), ctx)
    const { previews } = (await res.json()) as { previews: Record<string, unknown>[] }
    const p = previews[0]
    expect(p.deployable).toBe(true)
    expect(String(p.proposedValue)).toMatch(/Roof Repair/i)
    expect(Array.isArray(p.diff)).toBe(true)
    expect((p.decision as { decision: string }).decision).toBe('requires-approval') // default policy
  })
})

describe('operator deploy → verify → reopen', () => {
  it('dry-run writes nothing and reports the plan', async () => {
    const { cookie, ctx, recId } = await setup()
    const res = await executeRoute(jsonReq({ action: 'deploy', dryRun: true, items: [{ recommendationId: recId, approve: true }] }, cookie), ctx)
    const body = (await res.json()) as { results: Record<string, unknown>[] }
    expect(body.results[0].dryRun).toBe(true)
    expect(posts[10].title).toBe('Old Title') // unchanged
  })

  it('explicit-approved deploy applies, verifies, and marks the rec verified', async () => {
    const { cookie, ctx, recId } = await setup()
    const res = await executeRoute(jsonReq({ action: 'deploy', items: [{ recommendationId: recId, approve: true }] }, cookie), ctx)
    const body = (await res.json()) as { summary: { verified: number }; results: Record<string, unknown>[] }
    expect(body.summary.verified).toBe(1)
    expect(body.results[0].status).toBe('verified')
    expect(posts[10].title).toMatch(/Roof Repair/i)
    const rec = await store.getRecommendation(recId)
    expect(rec?.status).toBe('verified')
  })

  it('verification failure REOPENS the recommendation (never assumes 200 = success)', async () => {
    const { cookie, ctx, recId } = await setup()
    dropTitle = true // server accepts the write (200) but does not persist it
    const res = await executeRoute(jsonReq({ action: 'deploy', items: [{ recommendationId: recId, approve: true }] }, cookie), ctx)
    const body = (await res.json()) as { results: Record<string, unknown>[] }
    expect(body.results[0].status).toBe('verify_failed')
    expect(body.results[0].reopened).toBe(true)
    const rec = await store.getRecommendation(recId)
    expect(rec?.status).toBe('open') // reopened
    expect(rec?.history.at(-1)?.to).toBe('open')
  })

  it('requires approval when policy does not auto-approve and none given', async () => {
    const { cookie, ctx, recId } = await setup()
    const res = await executeRoute(jsonReq({ action: 'deploy', items: [{ recommendationId: recId }] }, cookie), ctx)
    const body = (await res.json()) as { results: Record<string, unknown>[] }
    expect(body.results[0].requiresApproval).toBe(true)
    expect(posts[10].title).toBe('Old Title')
  })

  it('auto-approves after the org opts into a low-risk title policy', async () => {
    const { cookie, ctx, recId } = await setup()
    await policyPut(new Request('http://t', { method: 'PUT', headers: { 'Content-Type': 'application/json', cookie }, body: JSON.stringify({ policy: { autoApprove: { title: 'low' }, maxAutoApprovePages: 5 } }) }), ctx)
    const res = await executeRoute(jsonReq({ action: 'deploy', items: [{ recommendationId: recId }] }, cookie), ctx) // no explicit approve
    const body = (await res.json()) as { summary: { verified: number } }
    expect(body.summary.verified).toBe(1)
  })
})

describe('operator rollback + metrics', () => {
  it('rolls back a deployment and restores the original title', async () => {
    const { cookie, ctx, recId } = await setup()
    const dep = await executeRoute(jsonReq({ action: 'deploy', items: [{ recommendationId: recId, approve: true }] }, cookie), ctx)
    const depId = ((await dep.json()) as { results: { deploymentId: string }[] }).results[0].deploymentId
    expect(posts[10].title).toMatch(/Roof Repair/i)
    const res = await executeRoute(jsonReq({ action: 'rollback', deploymentIds: [depId] }, cookie), ctx)
    expect(((await res.json()) as { results: { ok: boolean }[] }).results[0].ok).toBe(true)
    expect(posts[10].title).toBe('Old Title')
    const rec = await store.getRecommendation(recId)
    expect(rec?.status).toBe('rolled_back')
  })

  it('metrics reflect the verified deployment', async () => {
    const { cookie, ctx, recId } = await setup()
    await executeRoute(jsonReq({ action: 'deploy', items: [{ recommendationId: recId, approve: true }] }, cookie), ctx)
    const res = await metricsRoute(new Request('http://t/m?today=2026-07-17', { headers: { cookie } }), ctx)
    const { metrics, learning } = (await res.json()) as { metrics: Record<string, number>; learning: unknown[] }
    expect(metrics.verifiedImprovements).toBe(1)
    expect(metrics.trustScore).toBeGreaterThan(0)
    expect(Array.isArray(learning)).toBe(true)
  })
})
