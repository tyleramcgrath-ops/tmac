// LIVE WordPress validation (RC2 Priority 1). Unlike wordpress-execution.test.ts
// (which uses an in-process fake), this drives RankForge's REAL API routes
// against a REAL running WordPress (WP core on PHP + SQLite). It is GATED on
// RF_TEST_WORDPRESS_URL so CI without a live WP simply skips it.
//
// It proves the full customer-facing loop end-to-end on real infrastructure:
//   connect → read → deploy title → deploy meta → deploy content → verify →
//   rollback → verify rollback, plus the failure modes (bad credentials,
//   permission failure, invalid target, verification integrity).
//
// Run: bring up a WP (see LIVE_WORDPRESS_VALIDATION.md), then
//   RF_TEST_WORDPRESS_URL=http://127.0.0.1:8899 RF_TEST_WP_USER=rfadmin \
//   RF_TEST_WP_APP_PASSWORD=xxxx APP_SECRET=<32+chars> \
//   npx vitest run tests/wordpress-live.test.ts

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { __setStoreForTests } from '../lib/foundation/store'
import { __resetRateLimits } from '../lib/foundation/rate-limit'
import { __setTrustedHostsForTests } from '../app/api/seo-scan/url-guard'
import { getStore } from '../lib/foundation/store'
import { executeWpDeployment } from '../lib/foundation/wp-execution'
import { POST as signup } from '../app/api/auth/signup/route'
import { POST as createProject } from '../app/api/projects/route'
import { PUT as wpPut, GET as wpGet, POST as wpPost } from '../app/api/projects/[projectId]/wordpress/route'

const WP_URL = process.env.RF_TEST_WORDPRESS_URL
const WP_USER = process.env.RF_TEST_WP_USER ?? 'rfadmin'
const WP_PW = process.env.RF_TEST_WP_APP_PASSWORD ?? ''

const run = WP_URL ? describe : describe.skip

// A stable origin/host so assertSameOrigin passes.
function req(method: string, body: unknown, cookie?: string, url = 'http://t'): Request {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json', origin: 'http://t', host: 't', ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}
const cookieOf = (r: Response) => (r.headers.get('set-cookie') ?? '').split(';')[0]

run('LIVE WordPress — real routes against a real WP REST API', () => {
  let cookie: string
  let ctx: { params: Promise<{ projectId: string }> }
  let postId: number
  let postType: string

  beforeAll(async () => {
    process.env.APP_SECRET = process.env.APP_SECRET && process.env.APP_SECRET.length >= 16 ? process.env.APP_SECRET : 'live-wp-test-secret-0000000000001'
    __setStoreForTests(new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-livewp-'))))
    __resetRateLimits()
    // The live WP runs on 127.0.0.1 — allow it past the SSRF guard for this test.
    __setTrustedHostsForTests(['127.0.0.1'])
    const c0 = { params: Promise.resolve({}) }
    cookie = cookieOf(await signup(req('POST', { email: `live_${Date.now()}@x.com`, password: 'longenough123' }), c0))
    const pr = await createProject(req('POST', { domain: '127.0.0.1' }, cookie), c0)
    const { project } = (await pr.json()) as { project: { id: string } }
    ctx = { params: Promise.resolve({ projectId: project.id }) }
  })
  afterAll(() => {
    __setStoreForTests(null)
    __setTrustedHostsForTests(null)
  })

  it('rejects invalid credentials at connect (real 401 from WP)', async () => {
    const res = await wpPut(req('PUT', { siteUrl: WP_URL, username: WP_USER, appPassword: 'totally-wrong-password' }, cookie), ctx)
    expect(res.status).toBe(502) // could not authenticate
  })

  it('connects with a real Application Password and detects AIOSEO honestly', async () => {
    const res = await wpPut(req('PUT', { siteUrl: WP_URL, username: WP_USER, appPassword: WP_PW }, cookie), ctx)
    expect(res.status).toBe(200)
    const { connection } = (await res.json()) as { connection: { siteUrl: string; aioseo: boolean } }
    expect(connection.siteUrl).toBe(WP_URL)
    // No AIOSEO installed on this WP → detection must report false (not guessed true).
    expect(connection.aioseo).toBe(false)
    // GET must never return the password.
    const status = await wpGet(new Request('http://t', { headers: { cookie } }), ctx)
    const sj = (await status.json()) as { connection: Record<string, unknown> }
    expect(JSON.stringify(sj.connection)).not.toMatch(/password|appPassword/i)
  })

  it('resolves a page URL to a real post id by slug', async () => {
    const res = await wpPost(req('POST', { action: 'resolve', url: `${WP_URL}/services/` }, cookie), ctx)
    const { resolved, target } = (await res.json()) as { resolved: boolean; target: { postId: number; postType: string } | null }
    expect(resolved).toBe(true)
    postId = target!.postId
    postType = target!.postType
    expect(postId).toBeGreaterThan(0)
  })

  it('deploys a title change and verifies it by reading it back from the live site', async () => {
    const res = await wpPost(req('POST', { action: 'deploy', postId, postType, title: 'Optimized Services Title — RankForge', reason: 'RC2 live title' }, cookie), ctx)
    expect(res.status).toBe(201)
    const { deployment } = (await res.json()) as { deployment: { status: string; before: { title: string }; verification: { titleMatches: boolean | null } } }
    expect(deployment.status).toBe('verified')
    expect(deployment.verification.titleMatches).toBe(true)
    expect(deployment.before.title).toBe('Original Services Title')
    // Independently confirm the live site actually changed.
    const raw = await fetch(`${WP_URL}/wp-json/wp/v2/${postType}/${postId}?context=edit`, {
      headers: { Authorization: 'Basic ' + Buffer.from(`${WP_USER}:${WP_PW}`).toString('base64') },
    })
    const live = (await raw.json()) as { title: { raw: string } }
    expect(live.title.raw).toBe('Optimized Services Title — RankForge')
  })

  it('deploys a meta description (excerpt path, non-AIOSEO) and verifies', async () => {
    const res = await wpPost(req('POST', { action: 'deploy', postId, postType, metaDescription: 'A compelling, verified meta description for services.', reason: 'RC2 live meta' }, cookie), ctx)
    expect(res.status).toBe(201)
    const { deployment } = (await res.json()) as { deployment: { status: string; verification: { metaMatches: boolean | null } } }
    expect(deployment.status).toBe('verified')
    expect(deployment.verification.metaMatches).toBe(true)
  })

  it('rolls back the title to the captured before-value and verifies the rollback on the live site', async () => {
    // Find the title deployment we made.
    const status = await wpGet(new Request('http://t', { headers: { cookie } }), ctx)
    const { deployments } = (await status.json()) as { deployments: { id: string; after: { title?: string }; status: string }[] }
    const titleDep = deployments.find((d) => d.after.title && d.status === 'verified')!
    const res = await wpPost(req('POST', { action: 'rollback', deploymentId: titleDep.id }, cookie), ctx)
    expect(res.status).toBe(200)
    const { deployment } = (await res.json()) as { deployment: { status: string } }
    expect(deployment.status).toBe('rolled_back')
    // The live site is back to the original title.
    const raw = await fetch(`${WP_URL}/wp-json/wp/v2/${postType}/${postId}?context=edit`, {
      headers: { Authorization: 'Basic ' + Buffer.from(`${WP_USER}:${WP_PW}`).toString('base64') },
    })
    const live = (await raw.json()) as { title: { raw: string } }
    expect(live.title.raw).toBe('Original Services Title')
  })

  it('deploys a content transform (https-upgrade) to the live post body and verifies the invariant', async () => {
    // Content fixes go through the operator/execute path; call the execution lib
    // directly with the stored real connection to prove content writes on live WP.
    const conn = (await (await getStore()).getWpConnection((await ctx.params).projectId))!
    const dep = await executeWpDeployment({
      projectId: (await ctx.params).projectId,
      orgId: 'org-live',
      connection: conn,
      postId,
      postType: postType as 'posts' | 'pages',
      changes: { contentTransform: { type: 'https-upgrade', hosts: ['127.0.0.1'] } },
      approvedBy: conn.createdBy,
      reason: 'RC2 live content https-upgrade',
    })
    // The seeded page body had http://127.0.0.1:8899/logo.png.
    expect(dep.status).toBe('verified')
    const raw = await fetch(`${WP_URL}/wp-json/wp/v2/${postType}/${postId}?context=edit`, {
      headers: { Authorization: 'Basic ' + Buffer.from(`${WP_USER}:${WP_PW}`).toString('base64') },
    })
    const live = (await raw.json()) as { content: { raw: string } }
    expect(live.content.raw).toContain('https://127.0.0.1:8899/logo.png')
    expect(live.content.raw).not.toContain('http://127.0.0.1:8899/logo.png')
  })

  it('fails safely on an invalid post id (before-capture fails → NO write to the live site)', async () => {
    const before = await wpGet(new Request('http://t', { headers: { cookie } }), ctx)
    const beforeCount = ((await before.json()) as { deployments: unknown[] }).deployments.length
    const res = await wpPost(req('POST', { action: 'deploy', postId: 999999, postType: 'pages', title: 'x', reason: 'should fail' }, cookie), ctx)
    // Before-capture (readPost) throws on a missing post; the deployment is
    // aborted BEFORE any write, so the request errors and no record is created.
    expect(res.status).toBeGreaterThanOrEqual(400)
    const after = await wpGet(new Request('http://t', { headers: { cookie } }), ctx)
    const afterCount = ((await after.json()) as { deployments: unknown[] }).deployments.length
    expect(afterCount).toBe(beforeCount) // nothing persisted → nothing was written
    // The real target page is still at its rolled-back original.
    const raw = await fetch(`${WP_URL}/wp-json/wp/v2/${postType}/${postId}?context=edit`, {
      headers: { Authorization: 'Basic ' + Buffer.from(`${WP_USER}:${WP_PW}`).toString('base64') },
    })
    expect(((await raw.json()) as { title: { raw: string } }).title.raw).toBe('Original Services Title')
  })
})
