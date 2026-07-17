// WordPress execution against a controlled test double (an in-process fake WP
// REST server installed as global.fetch). Covers connect, deploy with
// read-back verification, rollback, failed verification (plugin drops the
// value), and failed rollback. No live WordPress is used or claimed.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { __setStoreForTests } from '../lib/foundation/store'
import { encryptSecret } from '../lib/foundation/crypto'
import { executeWpDeployment, resolveWpTarget, rollbackWpDeployment } from '../lib/foundation/wp-execution'
import { __setTrustedHostsForTests } from '../app/api/seo-scan/url-guard'
import type { WpConnection } from '../lib/foundation/types'

process.env.APP_SECRET = 'wp-double-secret-123'

// ---- Fake WordPress REST server ----
interface FakePost {
  id: number
  title: string
  excerpt: string
  content: string
  aioseoDescription: string
  link: string
}

class FakeWordPress {
  posts = new Map<number, FakePost>()
  // When true, applying a meta description silently does not persist (models
  // an AIOSEO plugin that stores it elsewhere) — verification must catch it.
  dropMeta = false
  // When true, writes throw 500 (models a server error) — rollback fails.
  failWrites = false

  constructor() {
    this.posts.set(10, {
      id: 10,
      title: 'Original Title',
      excerpt: 'Original meta',
      content: '<p>Original body</p>',
      aioseoDescription: 'Original meta',
      link: 'https://wp.test/services',
    })
  }

  handle(url: string, init?: RequestInit): Response {
    const method = init?.method ?? 'GET'
    // Slug lookup: /pages?slug=services -> [post 10]
    if (url.includes('/wp-json/wp/v2/pages?slug=services')) {
      const p = this.posts.get(10)!
      return json([{ id: 10, title: { raw: p.title } }])
    }
    if (/\/wp-json\/wp\/v2\/(pages|posts)\?slug=/.test(url)) return json([])
    if (url.includes('/wp-json/wp/v2/pages/10') || url.includes('/wp-json/wp/v2/posts/10')) {
      const post = this.posts.get(10)!
      if (method === 'POST') {
        if (this.failWrites) return json({ message: 'server error' }, 500)
        const body = JSON.parse((init?.body as string) ?? '{}')
        if (body.title !== undefined) post.title = body.title
        if (body.excerpt !== undefined) post.excerpt = body.excerpt
        if (body.aioseo_meta_data?.description !== undefined && !this.dropMeta) {
          post.aioseoDescription = body.aioseo_meta_data.description
        }
        if (body.meta?._aioseo_description !== undefined && !this.dropMeta) {
          post.aioseoDescription = body.meta._aioseo_description
        }
      }
      return json({
        id: 10,
        title: { raw: post.title, rendered: post.title },
        excerpt: { raw: post.excerpt },
        content: { raw: post.content, rendered: post.content },
        aioseo_meta_data: { description: post.aioseoDescription },
        meta: { _aioseo_description: post.aioseoDescription },
        link: post.link,
      })
    }
    return json({ message: 'not found' }, 404)
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

let wp: FakeWordPress
let store: FileFoundationStore

function connection(aioseo = true): WpConnection {
  return {
    id: randomUUID(),
    projectId: 'proj-wp',
    siteUrl: 'https://wp.test',
    username: 'admin',
    appPasswordEnc: encryptSecret('app-pass-1234'),
    aioseo,
    createdBy: 'user-1',
    createdAt: new Date().toISOString(),
  }
}

beforeEach(() => {
  wp = new FakeWordPress()
  store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-wp-')))
  __setStoreForTests(store)
  __setTrustedHostsForTests(['wp.test'])
  vi.stubGlobal('fetch', (input: string | URL, init?: RequestInit) =>
    Promise.resolve(wp.handle(String(input), init))
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
  __setStoreForTests(null)
  __setTrustedHostsForTests(null)
})

describe('WordPress deploy + read-back verification', () => {
  it('applies a title change, verifies by reading it back, and stores a durable record', async () => {
    const dep = await executeWpDeployment({
      projectId: 'proj-wp',
      connection: connection(),
      postId: 10,
      postType: 'pages',
      changes: { title: 'New SEO Title' },
      approvedBy: 'user-1',
      reason: 'Title optimization',
    })
    expect(dep.status).toBe('verified')
    expect(dep.before.title).toBe('Original Title')
    expect(dep.verification?.titleMatches).toBe(true)
    // Durable: re-read from the store as a "later session" would.
    const persisted = await store.getWpDeployment(dep.id)
    expect(persisted?.status).toBe('verified')
    expect(persisted?.approvedBy).toBe('user-1')
  })

  it('reports verify_failed when the site does not persist the change (no false "verified" on HTTP 200)', async () => {
    wp.dropMeta = true
    const dep = await executeWpDeployment({
      projectId: 'proj-wp',
      connection: connection(),
      postId: 10,
      postType: 'pages',
      changes: { metaDescription: 'A better description' },
      approvedBy: 'user-1',
      reason: 'Meta optimization',
    })
    // The write returned HTTP 200, but read-back shows the value did not stick.
    expect(dep.status).toBe('verify_failed')
    expect(dep.verification?.metaMatches).toBe(false)
  })

  it('marks the deployment failed when the write errors', async () => {
    wp.failWrites = true
    const dep = await executeWpDeployment({
      projectId: 'proj-wp',
      connection: connection(),
      postId: 10,
      postType: 'pages',
      changes: { title: 'x' },
      approvedBy: 'user-1',
      reason: 'r',
    })
    expect(dep.status).toBe('failed')
  })
})

describe('recommendation → deployment target resolution', () => {
  it('resolves a page URL to a WordPress post by slug', async () => {
    const t = await resolveWpTarget(connection(), 'https://wp.test/services')
    expect(t).toEqual({ postId: 10, postType: 'pages', title: 'Original Title' })
  })

  it('returns null (honest manual fallback) when no post matches the slug', async () => {
    expect(await resolveWpTarget(connection(), 'https://wp.test/no-such-page')).toBeNull()
    expect(await resolveWpTarget(connection(), 'https://wp.test/')).toBeNull() // homepage, no slug
  })
})

describe('WordPress rollback', () => {
  it('restores captured before-values and verifies the rollback', async () => {
    const dep = await executeWpDeployment({
      projectId: 'proj-wp',
      connection: connection(),
      postId: 10,
      postType: 'pages',
      changes: { title: 'Changed Title' },
      approvedBy: 'user-1',
      reason: 'change',
    })
    expect(wp.posts.get(10)!.title).toBe('Changed Title')

    const rolled = await rollbackWpDeployment({ deployment: dep, connection: connection(), actorId: 'user-2' })
    expect(rolled.status).toBe('rolled_back')
    expect(rolled.rolledBackBy).toBe('user-2')
    // The live site is back to the original.
    expect(wp.posts.get(10)!.title).toBe('Original Title')
    // And the record persisted the rollback.
    const persisted = await store.getWpDeployment(dep.id)
    expect(persisted?.status).toBe('rolled_back')
  })

  it('surfaces a failed rollback honestly when the write errors', async () => {
    const dep = await executeWpDeployment({
      projectId: 'proj-wp',
      connection: connection(),
      postId: 10,
      postType: 'pages',
      changes: { title: 'Changed Title' },
      approvedBy: 'user-1',
      reason: 'change',
    })
    wp.failWrites = true
    await expect(
      rollbackWpDeployment({ deployment: dep, connection: connection(), actorId: 'user-2' })
    ).rejects.toThrow()
  })
})
