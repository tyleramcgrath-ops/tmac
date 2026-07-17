// Route-level: deploying from a recommendation through the real WordPress
// route flips the linked recommendation to verified/deployed and records the
// linkage. Uses a fake WP REST server as global.fetch.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { __setStoreForTests } from '../lib/foundation/store'
import { encryptSecret } from '../lib/foundation/crypto'
import { __setTrustedHostsForTests } from '../app/api/seo-scan/url-guard'
import { POST as wpPost } from '../app/api/projects/[projectId]/wordpress/route'
import { POST as signup } from '../app/api/auth/signup/route'
import { POST as createProject } from '../app/api/projects/route'
import type { Recommendation, WpConnection } from '../lib/foundation/types'

process.env.APP_SECRET = 'wp-route-secret-123'

let store: FileFoundationStore
const post = { id: 10, title: 'Old Title', excerpt: 'Old', aioseoDescription: 'Old', content: '<p>x</p>', link: 'https://wp.test/services' }

function fakeWp(url: string, init?: RequestInit): Response {
  const method = init?.method ?? 'GET'
  const j = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } })
  if (url.endsWith('/wp-json')) return j({ namespaces: ['wp/v2', 'aioseo/v1'] })
  if (url.includes('/users/me')) return j({ id: 1, capabilities: { edit_posts: true } })
  if (url.includes('/pages/10') || url.includes('/posts/10')) {
    if (method === 'POST') {
      const b = JSON.parse((init?.body as string) ?? '{}')
      if (b.title !== undefined) post.title = b.title
      if (b.aioseo_meta_data?.description !== undefined) post.aioseoDescription = b.aioseo_meta_data.description
    }
    return j({ id: 10, title: { raw: post.title }, excerpt: { raw: post.excerpt }, content: { raw: post.content }, aioseo_meta_data: { description: post.aioseoDescription }, meta: { _aioseo_description: post.aioseoDescription }, link: post.link })
  }
  return j({ message: 'nf' }, 404)
}

function cookieFrom(res: Response) {
  return (res.headers.get('set-cookie') ?? '').split(';')[0]
}

beforeEach(() => {
  post.title = 'Old Title'
  store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-wpr-')))
  __setStoreForTests(store)
  __setTrustedHostsForTests(['wp.test'])
  vi.stubGlobal('fetch', (i: string | URL, init?: RequestInit) => Promise.resolve(fakeWp(String(i), init)))
})
afterEach(() => {
  vi.unstubAllGlobals()
  __setStoreForTests(null)
  __setTrustedHostsForTests(null)
})

describe('deploy from recommendation (route)', () => {
  it('links the deployment to the recommendation and flips it to verified', async () => {
    const ctx0 = { params: Promise.resolve({}) }
    const cookie = cookieFrom(
      await signup(
        new Request('http://t', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'wp@x.com', password: 'longenough123' }) }),
        ctx0
      )
    )
    const projRes = await createProject(
      new Request('http://t', { method: 'POST', headers: { 'Content-Type': 'application/json', cookie }, body: JSON.stringify({ domain: 'wp.test' }) }),
      ctx0
    )
    const { project } = (await projRes.json()) as { project: { id: string; orgId: string } }
    const ctx = { params: Promise.resolve({ projectId: project.id }) }

    // Seed a connection + a recommendation directly.
    const conn: WpConnection = {
      id: randomUUID(), projectId: project.id, siteUrl: 'https://wp.test', username: 'admin',
      appPasswordEnc: encryptSecret('pw'), aioseo: true, createdBy: 'u', createdAt: new Date().toISOString(),
    }
    await store.upsertWpConnection(conn)
    // A scan is required for the FK-free file store, but recommendation needs a scanId reference.
    const scanId = randomUUID()
    await store.createScan({ id: scanId, projectId: project.id, createdBy: 'u', createdAt: new Date().toISOString(), status: 'completed', startedAt: null, completedAt: null, error: null, summary: { pagesCrawled: 1, urlsDiscovered: 1, blockedCount: 0, siteScore: 50, critical: 0, warning: 1, info: 0 }, pages: [], blocked: [] })
    const rec: Recommendation = {
      id: randomUUID(), projectId: project.id, scanId,
      ruleId: 'title-length', ruleVersion: 1, ruleCategory: 'content', ruleSeverity: 'warning', businessContext: 'standard',
      title: 'Title is too long', category: 'Content gaps',
      severity: 'warning', status: 'accepted', reasoning: 'r', evidence: { affectedUrls: ['https://wp.test/services'], facts: [] },
      confidence: 70, confidenceBasis: 'x', expectedImpact: { category: 'content', size: 'medium', note: '' },
      risk: { level: 'low', note: '' }, createdAt: new Date().toISOString(), history: [],
    }
    await store.createRecommendations([rec])

    const res = await wpPost(
      new Request('http://t', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie },
        body: JSON.stringify({ action: 'deploy', postId: 10, postType: 'pages', title: 'New Better Title', reason: 'fix', recommendationId: rec.id }),
      }),
      ctx
    )
    const body = (await res.json()) as { deployment: { status: string; recommendationId?: string } }
    expect(body.deployment.status).toBe('verified')
    expect(body.deployment.recommendationId).toBe(rec.id)

    // The linked recommendation is now verified, with history recorded.
    const updated = await store.getRecommendation(rec.id)
    expect(updated?.status).toBe('verified')
    expect(updated?.history.at(-1)?.to).toBe('verified')
  })

  it('resolve action maps a recommendation URL to a post id', async () => {
    // Reuse a minimal project + connection.
    const ctx0 = { params: Promise.resolve({}) }
    const cookie = cookieFrom(
      await signup(new Request('http://t', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'wp2@x.com', password: 'longenough123' }) }), ctx0)
    )
    const projRes = await createProject(new Request('http://t', { method: 'POST', headers: { 'Content-Type': 'application/json', cookie }, body: JSON.stringify({ domain: 'wp.test' }) }), ctx0)
    const { project } = (await projRes.json()) as { project: { id: string } }
    const ctx = { params: Promise.resolve({ projectId: project.id }) }
    await store.upsertWpConnection({ id: randomUUID(), projectId: project.id, siteUrl: 'https://wp.test', username: 'admin', appPasswordEnc: encryptSecret('pw'), aioseo: true, createdBy: 'u', createdAt: new Date().toISOString() })

    // Fake WP: /pages?slug=services -> post 10
    vi.stubGlobal('fetch', (i: string | URL, init?: RequestInit) => {
      const u = String(i)
      if (u.includes('/pages?slug=services')) return Promise.resolve(new Response(JSON.stringify([{ id: 10, title: { raw: 'Services' } }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      return Promise.resolve(fakeWp(u, init))
    })
    const res = await wpPost(new Request('http://t', { method: 'POST', headers: { 'Content-Type': 'application/json', cookie }, body: JSON.stringify({ action: 'resolve', url: 'https://wp.test/services' }) }), ctx)
    const body = (await res.json()) as { resolved: boolean; target: { postId: number } | null }
    expect(body.resolved).toBe(true)
    expect(body.target?.postId).toBe(10)
  })
})
