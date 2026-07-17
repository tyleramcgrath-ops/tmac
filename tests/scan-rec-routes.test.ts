// Integration tests through the real route handlers: scan lifecycle
// (start -> complete/partial/fail, persisted history) and recommendation
// workflow (persist, accept, reject, reopen after a fresh login).

import { beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { __setStoreForTests } from '../lib/foundation/store'
import { __resetRateLimits } from '../lib/foundation/rate-limit'
import { POST as signup } from '../app/api/auth/signup/route'
import { POST as createProject } from '../app/api/projects/route'
import { POST as scansPost, GET as scansGet } from '../app/api/projects/[projectId]/scans/route'
import { GET as recsGet, PATCH as recsPatch } from '../app/api/projects/[projectId]/recommendations/route'

process.env.APP_SECRET = 'scan-rec-secret-123'

function jsonReq(body: unknown, cookie?: string): Request {
  return new Request('http://t', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  })
}
function cookieFrom(res: Response): string {
  return (res.headers.get('set-cookie') ?? '').split(';')[0]
}
const CTX0 = { params: Promise.resolve({}) }

async function setup() {
  __setStoreForTests(new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-sr-'))))
  __resetRateLimits()
  const cookie = cookieFrom(await signup(jsonReq({ email: `u${Math.round(performance.now())}@x.com`, password: 'longenough123' }), CTX0))
  const proj = await createProject(jsonReq({ domain: 'example.com' }, cookie), CTX0)
  const { project } = (await proj.json()) as { project: { id: string } }
  return { cookie, projectId: project.id, ctx: { params: Promise.resolve({ projectId: project.id }) } }
}

// Real page SIGNALS (Phase C V2 reads signals, not pre-computed fixes):
// a product page missing its title (critical) + a pricing page missing schema.
const PAGES = [
  { url: 'https://example.com/product/z', overall: 60, title: '', titleLength: 0, metaDescription: 'x', metaDescriptionLength: 90, h1Count: 1, schemaTypes: ['Product'], https: true, mixedContent: false, indexable: true },
  { url: 'https://example.com/pricing', overall: 70, title: 'Pricing', titleLength: 7, metaDescription: 'x', metaDescriptionLength: 90, h1Count: 1, schemaTypes: [], https: true, mixedContent: false, indexable: true },
]

describe('scan lifecycle', () => {
  beforeEach(() => {})

  it('start -> complete persists a completed scan and derives recommendations; history reflects it', async () => {
    const { cookie, ctx } = await setup()
    const started = await scansPost(jsonReq({ action: 'start' }, cookie), ctx)
    expect(started.status).toBe(201)
    const scanId = ((await started.json()) as { scan: { id: string } }).scan.id

    const done = await scansPost(jsonReq({ action: 'complete', scanId, pages: PAGES, blocked: [], discovered: 5 }, cookie), ctx)
    const doneBody = (await done.json()) as { scan: { status: string }; recommendationCount: number }
    expect(doneBody.scan.status).toBe('completed')
    expect(doneBody.recommendationCount).toBeGreaterThan(0)

    const hist = await scansGet(new Request('http://t/scans', { headers: { cookie } }), ctx)
    const { scans } = (await hist.json()) as {
      scans: { status: string; summary: { critical: number; warning: number; info: number } }[]
    }
    expect(scans[0].status).toBe('completed')

    // P3 single source of truth: the audit summary's severity counts are the
    // recommendation engine's counts — never a second, disagreeing engine.
    const recsRes = (await (await recsGet(new Request('http://t/r', { headers: { cookie } }), ctx)).json()) as {
      recommendations: { severity: string }[]
    }
    const sum = scans[0].summary
    const sev = (s: string) => recsRes.recommendations.filter((r) => r.severity === s).length
    expect(sum.critical).toBe(sev('critical'))
    expect(sum.warning).toBe(sev('warning'))
    expect(sum.info).toBe(sev('info'))
    expect(sum.critical + sum.warning + sum.info).toBe(recsRes.recommendations.length)
  })

  it('a scan with blocked pages is persisted as partial (honest)', async () => {
    const { cookie, ctx } = await setup()
    const res = await scansPost(
      jsonReq({ action: 'complete', pages: PAGES, blocked: [{ url: 'https://example.com/x', reason: 'waf_challenge' }], discovered: 6 }, cookie),
      ctx
    )
    expect(((await res.json()) as { scan: { status: string } }).scan.status).toBe('partial')
  })

  it('a failed scan is recorded with its error, not lost', async () => {
    const { cookie, ctx } = await setup()
    const started = await scansPost(jsonReq({ action: 'start' }, cookie), ctx)
    const scanId = ((await started.json()) as { scan: { id: string } }).scan.id
    const failed = await scansPost(jsonReq({ action: 'fail', scanId, error: 'Homepage blocked (403).' }, cookie), ctx)
    expect(((await failed.json()) as { scan: { status: string; error: string } }).scan.status).toBe('failed')

    const hist = await scansGet(new Request('http://t/scans', { headers: { cookie } }), ctx)
    const { scans } = (await hist.json()) as { scans: { status: string; error: string }[] }
    expect(scans[0].status).toBe('failed')
    expect(scans[0].error).toContain('403')
  })
})

describe('recommendation workflow', () => {
  it('persist -> accept -> reject -> reopen, each recorded in history', async () => {
    const { cookie, ctx } = await setup()
    await scansPost(jsonReq({ action: 'complete', pages: PAGES, blocked: [], discovered: 5 }, cookie), ctx)

    let recs = (await (await recsGet(new Request('http://t/r', { headers: { cookie } }), ctx)).json()) as {
      recommendations: { id: string; status: string }[]
    }
    expect(recs.recommendations.length).toBeGreaterThan(0)
    const id = recs.recommendations[0].id

    for (const status of ['accepted', 'rejected', 'open']) {
      const res = await recsPatch(jsonReq({ id, status }, cookie), ctx)
      expect(res.status).toBe(200)
    }
    // Reopen after a fresh login — same store, new session cookie.
    const recheck = (await (await recsGet(new Request('http://t/r', { headers: { cookie } }), ctx)).json()) as {
      recommendations: { id: string; status: string; history: unknown[] }[]
    }
    const target = recheck.recommendations.find((r) => r.id === id)!
    expect(target.status).toBe('open')
    expect(target.history.length).toBe(3)
  })

  it('rejects an illegal transition (deployed is set by execution, not the user)', async () => {
    const { cookie, ctx } = await setup()
    await scansPost(jsonReq({ action: 'complete', pages: PAGES, blocked: [], discovered: 5 }, cookie), ctx)
    const recs = (await (await recsGet(new Request('http://t/r', { headers: { cookie } }), ctx)).json()) as {
      recommendations: { id: string }[]
    }
    const res = await recsPatch(jsonReq({ id: recs.recommendations[0].id, status: 'verified' }, cookie), ctx)
    expect(res.status).toBe(400)
  })

  it('blocks cross-tenant recommendation access', async () => {
    const a = await setup()
    await scansPost(jsonReq({ action: 'complete', pages: PAGES, blocked: [], discovered: 5 }, a.cookie), a.ctx)
    // A different user in a different store-less tenant hitting A's project id.
    const bCookie = cookieFrom(await signup(jsonReq({ email: 'intruder@x.com', password: 'longenough123' }), CTX0))
    const res = await recsGet(new Request('http://t/r', { headers: { cookie: bCookie } }), a.ctx)
    expect(res.status).toBe(404)
  })
})
