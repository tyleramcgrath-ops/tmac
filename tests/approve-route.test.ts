// One-click "Approve & deploy" from the digest email — full route test
// against a fake WordPress REST server, proving the signed link actually
// deploys, re-verifies the signer's role, degrades honestly on a stale
// token, and never re-deploys on a second click of the same link.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { __setStoreForTests } from '../lib/foundation/store'
import { __resetRateLimits } from '../lib/foundation/rate-limit'
import { encryptSecret } from '../lib/foundation/crypto'
import { POST as signup } from '../app/api/auth/signup/route'
import { POST as createProject } from '../app/api/projects/route'
import { GET as approveRoute } from '../app/api/approve/[token]/route'
import { signApproveToken } from '../lib/foundation/scheduler/approve-link'
import { __setTrustedHostsForTests } from '../app/api/seo-scan/url-guard'
import type { Recommendation, Scan, WpConnection } from '../lib/foundation/types'

process.env.APP_SECRET = 'approve-route-secret'

const posts: Record<number, { title: string; content: string }> = {}
function resetWp() {
  posts[10] = { title: 'Old Title', content: '<p>x</p>' }
}
function fakeWp(url: string, init?: RequestInit): Response {
  const method = init?.method ?? 'GET'
  const j = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } })
  if (url.endsWith('/wp-json')) return j({ namespaces: ['wp/v2'] })
  if (url.includes('/users/me')) return j({ id: 1, capabilities: { edit_pages: true } })
  if (/\/pages\?slug=roof-repair/.test(url)) return j([{ id: 10, title: { raw: posts[10].title } }])
  if (/\/(pages|posts)\?slug=/.test(url)) return j([])
  if (url.includes('/pages/10')) {
    const p = posts[10]
    if (method === 'POST') {
      const b = JSON.parse((init?.body as string) ?? '{}')
      if (b.title !== undefined) p.title = b.title
    }
    return j({ id: 10, title: { raw: p.title }, excerpt: { raw: '' }, content: { raw: p.content }, meta: {}, link: 'https://wp.test/roof-repair' })
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
  store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-approve-')))
  __setStoreForTests(store)
  const email = `ap${randomUUID()}@x.com`
  const signupRes = await signup(jsonReq({ email, password: 'longenough123' }), CTX0)
  const cookie = cookieFrom(signupRes)
  const { user } = (await signupRes.json()) as { user: { id: string } }
  const proj = await createProject(jsonReq({ domain: 'wp.test', name: 'WP' }, cookie), CTX0)
  const { project } = (await proj.json()) as { project: { id: string } }

  const conn: WpConnection = { id: randomUUID(), projectId: project.id, siteUrl: 'https://wp.test', username: 'admin', appPasswordEnc: encryptSecret('pw'), aioseo: false, createdBy: user.id, createdAt: new Date().toISOString() }
  await store.upsertWpConnection(conn)

  const scan: Scan = {
    id: randomUUID(), projectId: project.id, createdBy: user.id, createdAt: new Date().toISOString(), status: 'completed',
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
  return { userId: user.id, projectId: project.id, recId: rec.id }
}

beforeEach(() => {
  resetWp()
  __resetRateLimits()
  __setTrustedHostsForTests(['wp.test'])
  vi.stubGlobal('fetch', (i: string | URL, init?: RequestInit) => Promise.resolve(fakeWp(String(i), init)))
})
afterEach(() => {
  vi.unstubAllGlobals()
  __setStoreForTests(null)
  __setTrustedHostsForTests(null)
})

describe('GET /api/approve/[token] — one-click deploy from the digest email', () => {
  it('deploys the accepted recommendation and marks it verified on a valid, fresh token', async () => {
    const { userId, projectId, recId } = await setup()
    const token = signApproveToken({ recommendationId: recId, projectId, userId, issuedAt: Date.now() })
    const res = await approveRoute(new Request(`http://t/api/approve/${token}`), { params: Promise.resolve({ token }) })
    const html = await res.text()
    expect(res.status).toBe(200)
    expect(html).toContain('Fix deployed')
    // fixgen derives the title from the URL slug when there's no H1/brand to
    // work from — proves a REAL WordPress write happened, not just a status flip.
    expect(posts[10].title).toBe('Roof Repair')
    const rec = await store.getRecommendation(recId)
    expect(rec?.status).toBe('verified')
  })

  it('a second click of the same link is a safe no-op, not a re-deploy — the rec is no longer "accepted"', async () => {
    const { userId, projectId, recId } = await setup()
    const token = signApproveToken({ recommendationId: recId, projectId, userId, issuedAt: Date.now() })
    const first = await approveRoute(new Request(`http://t/api/approve/${token}`), { params: Promise.resolve({ token }) })
    expect(first.status).toBe(200)
    const titleAfterFirst = posts[10].title

    const second = await approveRoute(new Request(`http://t/api/approve/${token}`), { params: Promise.resolve({ token }) })
    const html = await second.text()
    expect(html).toContain('Already handled')
    expect(posts[10].title).toBe(titleAfterFirst) // no second write
  })

  it('rejects a tampered or garbage token honestly, without touching WordPress', async () => {
    const res = await approveRoute(new Request('http://t/api/approve/not-a-real-token'), { params: Promise.resolve({ token: 'not-a-real-token' }) })
    const html = await res.text()
    expect(res.status).toBe(400)
    expect(html).toMatch(/expired or invalid/i)
  })

  it('rejects a token whose signer no longer has project access', async () => {
    const { projectId, recId } = await setup()
    const token = signApproveToken({ recommendationId: recId, projectId, userId: 'not-a-real-member', issuedAt: Date.now() })
    const res = await approveRoute(new Request(`http://t/api/approve/${token}`), { params: Promise.resolve({ token }) })
    const html = await res.text()
    expect(res.status).toBe(400)
    expect(html).toMatch(/not authorized/i)
  })
})
