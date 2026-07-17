// Phase H route tests: the Google-connect + integrations endpoints and the
// recommendation priority override. Focus: auth + admin gating, tenant
// isolation, honest "not configured" behaviour, and that no credential leaks.

import { beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { __setStoreForTests } from '../lib/foundation/store'
import { __resetRateLimits } from '../lib/foundation/rate-limit'
import type { Recommendation } from '../lib/foundation/types'
import { POST as signup } from '../app/api/auth/signup/route'
import { POST as createProject } from '../app/api/projects/route'
import { GET as integrationsGet, DELETE as integrationsDelete } from '../app/api/projects/[projectId]/integrations/route'
import { GET as googleStart } from '../app/api/projects/[projectId]/integrations/google/start/route'
import { PATCH as recsPatch } from '../app/api/projects/[projectId]/recommendations/route'

process.env.APP_SECRET = 'integrations-routes-secret-0001'

let store: FileFoundationStore
const CTX0 = { params: Promise.resolve({}) }
function jsonReq(body: unknown, cookie?: string, method = 'POST'): Request {
  return new Request('http://t', { method, headers: { 'Content-Type': 'application/json', origin: 'http://t', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) })
}
const cookieFrom = (r: Response) => (r.headers.get('set-cookie') ?? '').split(';')[0]

async function makeUserWithProject(email: string) {
  const cookie = cookieFrom(await signup(jsonReq({ email, password: 'longenough123' }), CTX0))
  const proj = await createProject(jsonReq({ domain: `${email.split('@')[0]}.com` }, cookie), CTX0)
  const { project } = (await proj.json()) as { project: { id: string } }
  return { cookie, projectId: project.id, ctx: { params: Promise.resolve({ projectId: project.id }) } }
}

beforeEach(() => {
  store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-integ-')))
  __setStoreForTests(store)
  __resetRateLimits()
  delete process.env.GOOGLE_CLIENT_ID
  delete process.env.GOOGLE_CLIENT_SECRET
})

describe('integrations status route', () => {
  it('requires authentication', async () => {
    const ctx = { params: Promise.resolve({ projectId: 'x' }) }
    expect((await integrationsGet(new Request('http://t/i'), ctx)).status).toBe(401)
  })
  it('lists both Google kinds as disconnected by default (no credential field)', async () => {
    const a = await makeUserWithProject('owner@x.com')
    const res = await integrationsGet(new Request('http://t/i', { headers: { cookie: a.cookie } }), a.ctx)
    const { integrations } = (await res.json()) as { integrations: Record<string, unknown>[] }
    expect(integrations.map((i) => i.kind).sort()).toEqual(['analytics', 'search-console'])
    expect(integrations.every((i) => i.status === 'disconnected')).toBe(true)
    // The encrypted credential must never appear in the projection.
    expect(JSON.stringify(integrations)).not.toContain('credentialEnc')
  })
  it('a different tenant gets 404 (existence not disclosed)', async () => {
    const a = await makeUserWithProject('a@x.com')
    const b = await makeUserWithProject('b@x.com')
    expect((await integrationsGet(new Request('http://t/i', { headers: { cookie: b.cookie } }), a.ctx)).status).toBe(404)
  })
})

describe('google connect start route', () => {
  it('is honest when GOOGLE_CLIENT_ID is not configured', async () => {
    const a = await makeUserWithProject('c@x.com')
    const res = await googleStart(new Request('http://t/api/projects/p/integrations/google/start?kind=all', { headers: { cookie: a.cookie, origin: 'http://t' } }), a.ctx)
    expect(res.status).toBe(400)
    expect(JSON.stringify(await res.json())).toMatch(/not configured/i)
  })
  it('returns a Google consent URL when configured', async () => {
    process.env.GOOGLE_CLIENT_ID = 'cid'
    process.env.GOOGLE_CLIENT_SECRET = 'sec'
    const a = await makeUserWithProject('d@x.com')
    const res = await googleStart(new Request('http://t/api/projects/p/integrations/google/start?kind=all', { headers: { cookie: a.cookie, origin: 'http://t' } }), a.ctx)
    expect(res.status).toBe(200)
    const { url } = (await res.json()) as { url: string }
    expect(url).toContain('accounts.google.com/o/oauth2/v2/auth')
    expect(url).toContain('client_id=cid')
    // callback redirect must match the request origin
    expect(decodeURIComponent(url)).toContain('http://t/api/oauth/google/callback')
  })
})

describe('disconnect route', () => {
  it('404s when there is no connection to disconnect', async () => {
    const a = await makeUserWithProject('e@x.com')
    const res = await integrationsDelete(new Request('http://t/i?kind=search-console', { method: 'DELETE', headers: { cookie: a.cookie, origin: 'http://t' } }), a.ctx)
    expect(res.status).toBe(404)
  })
})

describe('recommendation priority override', () => {
  function rec(projectId: string, id: string, rank: number): Recommendation {
    return {
      id, projectId, scanId: 's', issueId: `missing-title::${id}`, ruleId: 'missing-title', ruleVersion: 1, ruleCategory: 'content',
      ruleSeverity: 'critical', businessContext: 'standard', title: 't', category: 'content', severity: 'critical', status: 'open',
      priorityRank: rank, reasoning: 'r', evidence: { affectedUrls: ['https://x/'], facts: [] }, confidence: 80, confidenceBasis: 'x',
      expectedImpact: { category: 'content', size: 'high', note: '' }, risk: { level: 'low', note: '' }, createdAt: new Date().toISOString(), history: [],
    }
  }
  it('sets and clears a userPriority', async () => {
    const a = await makeUserWithProject('f@x.com')
    const r = rec(a.projectId, randomUUID(), 5)
    await store.createRecommendations([r])
    const set = await recsPatch(jsonReq({ id: r.id, userPriority: 1 }, a.cookie, 'PATCH'), a.ctx)
    expect(set.status).toBe(200)
    expect((await store.getRecommendation(r.id))?.userPriority).toBe(1)
    // clear
    await recsPatch(jsonReq({ id: r.id, userPriority: null }, a.cookie, 'PATCH'), a.ctx)
    expect((await store.getRecommendation(r.id))?.userPriority).toBeUndefined()
  })
  it('rejects an empty update and a foreign recommendation', async () => {
    const a = await makeUserWithProject('g@x.com')
    const r = rec(a.projectId, randomUUID(), 5)
    await store.createRecommendations([r])
    expect((await recsPatch(jsonReq({ id: r.id }, a.cookie, 'PATCH'), a.ctx)).status).toBe(400)
    const b = await makeUserWithProject('h@x.com')
    expect((await recsPatch(jsonReq({ id: r.id, userPriority: 2 }, b.cookie, 'PATCH'), b.ctx)).status).toBe(404)
  })
})
