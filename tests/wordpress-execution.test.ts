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
import { detectSeoPlugin, executeWpDeployment, installWpPlugin, resolveWpTarget, rollbackWpDeployment } from '../lib/foundation/wp-execution'
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
  rankMathDescription: string
  yoastDescription: string
  link: string
}

class FakeWordPress {
  posts = new Map<number, FakePost>()
  // When true, applying a meta description silently does not persist (models
  // an AIOSEO plugin that stores it elsewhere) — verification must catch it.
  dropMeta = false
  // When true, writes throw 500 (models a server error) — rollback fails.
  failWrites = false
  // Plugin-install simulation (D6-P?, explicit-approval install).
  pluginInstallOutcome: 'ok' | 'filesystem' | 'forbidden' = 'ok'
  installedPluginNamespace: string | null = null // set after a simulated successful install

  constructor() {
    this.posts.set(10, {
      id: 10,
      title: 'Original Title',
      excerpt: 'Original meta',
      content: '<p>Original body</p>',
      aioseoDescription: 'Original meta',
      rankMathDescription: 'Original RM meta',
      yoastDescription: 'Original Yoast meta',
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
        if (body.content !== undefined) post.content = body.content
        if (body.excerpt !== undefined) post.excerpt = body.excerpt
        if (body.aioseo_meta_data?.description !== undefined && !this.dropMeta) {
          post.aioseoDescription = body.aioseo_meta_data.description
        }
        if (body.meta?._aioseo_description !== undefined && !this.dropMeta) {
          post.aioseoDescription = body.meta._aioseo_description
        }
        // Rank Math / Yoast store the meta description in their own post-meta keys.
        if (body.meta?.rank_math_description !== undefined && !this.dropMeta) {
          post.rankMathDescription = body.meta.rank_math_description
        }
        if (body.meta?._yoast_wpseo_metadesc !== undefined && !this.dropMeta) {
          post.yoastDescription = body.meta._yoast_wpseo_metadesc
        }
      }
      return json({
        id: 10,
        title: { raw: post.title, rendered: post.title },
        excerpt: { raw: post.excerpt },
        content: { raw: post.content, rendered: post.content },
        aioseo_meta_data: { description: post.aioseoDescription },
        meta: {
          _aioseo_description: post.aioseoDescription,
          rank_math_description: post.rankMathDescription,
          _yoast_wpseo_metadesc: post.yoastDescription,
        },
        link: post.link,
      })
    }
    if (url.includes('/wp-json/wp/v2/plugins') && method === 'POST') {
      if (this.pluginInstallOutcome === 'filesystem') {
        return json({ code: 'unable_to_connect_to_filesystem', message: 'Could not access filesystem.' }, 500)
      }
      if (this.pluginInstallOutcome === 'forbidden') {
        return json({ code: 'rest_cannot_manage_plugins', message: 'Sorry, you are not allowed to manage plugins.' }, 403)
      }
      const body = JSON.parse((init?.body as string) ?? '{}')
      this.installedPluginNamespace = body.slug === 'wordpress-seo' ? 'yoast' : body.slug === 'all-in-one-seo-pack' ? 'aioseo' : null
      return json({ plugin: `${body.slug}/${body.slug}.php`, status: 'active' }, 200)
    }
    // Namespace probe (detectSeoPlugin) — reflects a plugin just installed.
    if (/\/wp-json\/?$/.test(url) && method === 'GET') {
      const ns = ['wp/v2']
      if (this.installedPluginNamespace === 'yoast') ns.push('yoast/v1')
      if (this.installedPluginNamespace === 'aioseo') ns.push('aioseo/v1')
      return json({ namespaces: ns })
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

function connectionWith(seoPlugin: WpConnection['seoPlugin']): WpConnection {
  return { ...connection(false), seoPlugin }
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
      orgId: 'org-wp',
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
      orgId: 'org-wp',
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
      orgId: 'org-wp',
      connection: connection(),
      postId: 10,
      postType: 'pages',
      changes: { title: 'x' },
      approvedBy: 'user-1',
      reason: 'r',
    })
    expect(dep.status).toBe('failed')
  })

  it('writes the meta description to the Rank Math field and reads it back to verify', async () => {
    const dep = await executeWpDeployment({
      projectId: 'proj-wp',
      orgId: 'org-wp',
      connection: connectionWith('rankmath'),
      postId: 10,
      postType: 'pages',
      changes: { metaDescription: 'Rank Math optimized description' },
      approvedBy: 'user-1',
      reason: 'Meta optimization (Rank Math)',
    })
    expect(dep.status).toBe('verified')
    // Landed in the Rank Math field, not the excerpt/AIOSEO field.
    expect(wp.posts.get(10)!.rankMathDescription).toBe('Rank Math optimized description')
    expect(wp.posts.get(10)!.excerpt).toBe('Original meta')
    expect(dep.before.metaDescription).toBe('Original RM meta')
    expect(dep.verification?.metaMatches).toBe(true)
  })

  it('writes the meta description to the Yoast field and reads it back to verify', async () => {
    const dep = await executeWpDeployment({
      projectId: 'proj-wp',
      orgId: 'org-wp',
      connection: connectionWith('yoast'),
      postId: 10,
      postType: 'pages',
      changes: { metaDescription: 'Yoast optimized description' },
      approvedBy: 'user-1',
      reason: 'Meta optimization (Yoast)',
    })
    expect(dep.status).toBe('verified')
    expect(wp.posts.get(10)!.yoastDescription).toBe('Yoast optimized description')
    expect(wp.posts.get(10)!.excerpt).toBe('Original meta')
    expect(dep.before.metaDescription).toBe('Original Yoast meta')
    expect(dep.verification?.metaMatches).toBe(true)
  })

  it('core (no SEO plugin) still writes the meta description to the native excerpt', async () => {
    const dep = await executeWpDeployment({
      projectId: 'proj-wp',
      orgId: 'org-wp',
      connection: connectionWith('core'),
      postId: 10,
      postType: 'pages',
      changes: { metaDescription: 'Core excerpt description' },
      approvedBy: 'user-1',
      reason: 'Meta optimization (core)',
    })
    expect(dep.status).toBe('verified')
    expect(wp.posts.get(10)!.excerpt).toBe('Core excerpt description')
  })
})

describe('WordPress content-transform deploys (Phase H)', () => {
  it('upgrades insecure http:// references in the body, verifies, and can roll back', async () => {
    wp.posts.get(10)!.content = '<img src="http://wp.test/logo.png"><p>hi</p>'
    const dep = await executeWpDeployment({
      projectId: 'proj-wp',
      orgId: 'org-wp',
      connection: connection(),
      postId: 10,
      postType: 'pages',
      changes: { contentTransform: { type: 'https-upgrade', hosts: ['wp.test'] } },
      approvedBy: 'user-1',
      reason: 'Fix mixed content',
    })
    expect(dep.status).toBe('verified')
    expect(wp.posts.get(10)!.content).toContain('https://wp.test/logo.png')
    expect(wp.posts.get(10)!.content).not.toContain('http://wp.test/logo.png')

    const rolled = await rollbackWpDeployment({ deployment: dep, connection: connection(), actorId: 'user-2' })
    expect(rolled.status).toBe('rolled_back')
    expect(wp.posts.get(10)!.content).toContain('http://wp.test/logo.png') // before-body restored
  })

  it('inserts a missing H1 and records it as verified', async () => {
    wp.posts.get(10)!.content = '<p>no heading here</p>'
    const dep = await executeWpDeployment({
      projectId: 'proj-wp',
      orgId: 'org-wp',
      connection: connection(),
      postId: 10,
      postType: 'pages',
      changes: { contentTransform: { type: 'prepend-h1', text: 'Our Services' } },
      approvedBy: 'user-1',
      reason: 'Add H1',
    })
    expect(dep.status).toBe('verified')
    expect(wp.posts.get(10)!.content.startsWith('<h1>Our Services</h1>')).toBe(true)
  })

  it('is a no-op (verified, no write) when the fix is already satisfied', async () => {
    wp.posts.get(10)!.content = '<h1>Already</h1><p>body</p>'
    const dep = await executeWpDeployment({
      projectId: 'proj-wp',
      orgId: 'org-wp',
      connection: connection(),
      postId: 10,
      postType: 'pages',
      changes: { contentTransform: { type: 'prepend-h1', text: 'X' } },
      approvedBy: 'user-1',
      reason: 'Add H1',
    })
    expect(dep.status).toBe('verified')
    expect(dep.result).toMatch(/already satisfied/i)
    expect(wp.posts.get(10)!.content).toBe('<h1>Already</h1><p>body</p>') // untouched
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
      orgId: 'org-wp',
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
      orgId: 'org-wp',
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

describe('installWpPlugin (explicit-approval SEO plugin install)', () => {
  it('installs, activates, and the site now reports the plugin on re-detection', async () => {
    const result = await installWpPlugin(connection(), 'yoast')
    expect(result).toEqual({ ok: true, seoPlugin: 'yoast' })

    const detected = await detectSeoPlugin('https://wp.test')
    expect(detected).toBe('yoast')
  })

  it('installs AIOSEO too', async () => {
    const result = await installWpPlugin(connection(), 'aioseo')
    expect(result).toEqual({ ok: true, seoPlugin: 'aioseo' })
  })

  it('surfaces the common managed-host failure (filesystem blocked) honestly, not as a crash', async () => {
    wp.pluginInstallOutcome = 'filesystem'
    const result = await installWpPlugin(connection(), 'yoast')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/FTP\/SSH|blocks direct writes/i)
      expect(result.error).toMatch(/manually/i)
    }
  })

  it('surfaces an insufficient-capability failure honestly', async () => {
    wp.pluginInstallOutcome = 'forbidden'
    const result = await installWpPlugin(connection(), 'aioseo')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/Administrator/i)
  })

  it('never silently retries or works around a failure — one call, one honest outcome', async () => {
    wp.pluginInstallOutcome = 'filesystem'
    let calls = 0
    const realHandle = wp.handle.bind(wp)
    wp.handle = (url, init) => {
      if (url.includes('/wp-json/wp/v2/plugins')) calls++
      return realHandle(url, init)
    }
    await installWpPlugin(connection(), 'yoast')
    expect(calls).toBe(1)
  })
})
