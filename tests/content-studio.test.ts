// Content Studio: keyword research + prompt building + HTML sanitization
// (pure, network-free) plus creating a real WordPress draft post end-to-end
// against a controlled test double.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { randomUUID } from 'crypto'
import { buildContentPrompt, fetchSerpForKeyword, markCompetitors, sanitizeContentHtml } from '../lib/foundation/content/brief'
import { createWpDraftPost } from '../lib/foundation/wp-execution'
import { encryptSecret } from '../lib/foundation/crypto'
import { __setTrustedHostsForTests } from '../app/api/seo-scan/url-guard'
import type { WpConnection } from '../lib/foundation/types'

process.env.APP_SECRET = 'content-studio-secret-01'

describe('markCompetitors: only real hostname matches, never invented', () => {
  it('tags a result whose hostname matches a tracked competitor domain', () => {
    const marked = markCompetitors(
      [
        { url: 'https://rival.com/best-crm', title: 'Rival', snippet: 's', position: 1 },
        { url: 'https://unrelated.com/x', title: 'Other', snippet: 's', position: 2 },
        { url: 'not a url', title: 'Broken', snippet: '', position: 3 },
      ],
      ['rival.com']
    )
    expect(marked[0].competitorDomain).toBe('rival.com')
    expect(marked[1].competitorDomain).toBeNull()
    expect(marked[2].competitorDomain).toBeNull()
  })
})

describe('buildContentPrompt: honest about research availability', () => {
  it('includes SERP evidence and competitor callout when available', () => {
    const prompt = buildContentPrompt({
      keyword: 'best crm',
      domain: 'acme.com',
      serpAvailable: true,
      serpResults: [{ url: 'https://rival.com/x', title: 'Rival CRM', snippet: 'snip', position: 1, competitorDomain: 'rival.com' }],
      competitorsConsidered: ['rival.com'],
    })
    expect(prompt).toContain('best crm')
    expect(prompt).toContain('Rival CRM')
    expect(prompt).toContain('tracked competitor: rival.com')
    expect(prompt).toContain('Tracked competitors currently ranking')
  })
  it('never claims researched results when SERP is unavailable', () => {
    const prompt = buildContentPrompt({ keyword: 'best crm', domain: 'acme.com', serpAvailable: false, serpResults: [], competitorsConsidered: [] })
    expect(prompt).toContain('unavailable')
    expect(prompt).not.toContain('Current Google results')
  })
})

describe('fetchSerpForKeyword: degrades honestly without a SERP key', () => {
  const original = process.env.SERPAPI_KEY
  afterEach(() => {
    process.env.SERPAPI_KEY = original
    vi.unstubAllGlobals()
  })
  it('reports unavailable with a reason when no key is configured', async () => {
    delete process.env.SERPAPI_KEY
    const r = await fetchSerpForKeyword('best crm')
    expect(r.available).toBe(false)
    expect(r.results).toEqual([])
    expect(r.note).toMatch(/SERPAPI_KEY/)
  })
  it('parses organic results when a key is configured', async () => {
    process.env.SERPAPI_KEY = 'test-key'
    vi.stubGlobal('fetch', () =>
      Promise.resolve(
        new Response(
          JSON.stringify({ organic_results: [{ link: 'https://rival.com/x', title: 'Rival', snippet: 's', position: 1 }] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
    )
    const r = await fetchSerpForKeyword('best crm')
    expect(r.available).toBe(true)
    expect(r.results).toEqual([{ url: 'https://rival.com/x', title: 'Rival', snippet: 's', position: 1 }])
  })
})

describe('sanitizeContentHtml: strips dangerous markup from AI output', () => {
  it('removes script tags and event-handler attributes', () => {
    const out = sanitizeContentHtml('<p onclick="evil()">Hi</p><script>evil()</script>')
    expect(out).not.toContain('<script')
    expect(out).not.toContain('onclick')
    expect(out).toContain('Hi')
  })
  it('unwraps disallowed tags but keeps their text', () => {
    const out = sanitizeContentHtml('<div><p>Body <iframe src="x"></iframe>text</p></div>')
    expect(out).not.toContain('<div')
    expect(out).not.toContain('<iframe')
    expect(out).toContain('Body')
    expect(out).toContain('text')
  })
  it('keeps safe https links, drops javascript: hrefs', () => {
    const out = sanitizeContentHtml('<p><a href="https://example.com">ok</a> <a href="javascript:evil()">bad</a></p>')
    expect(out).toContain('href="https://example.com"')
    expect(out).not.toContain('javascript:')
  })
})

// ---- Fake WordPress REST double: new-post creation ----
class FakeWp {
  nextId = 100
  posts = new Map<number, { title: string; content: string; status: string; excerpt: string; link: string }>()
  dropMeta = false
  handle(url: string, init?: RequestInit): Response {
    const method = init?.method ?? 'GET'
    if (url.includes('/wp-json/wp/v2/posts') && method === 'POST' && !/\/posts\/\d+/.test(url)) {
      const body = JSON.parse((init?.body as string) ?? '{}')
      const id = this.nextId++
      this.posts.set(id, {
        title: body.title ?? '',
        content: body.content ?? '',
        status: body.status ?? 'publish',
        excerpt: this.dropMeta ? '' : (body.excerpt ?? ''),
        link: `https://wp.test/?p=${id}`,
      })
      return json({ id, title: { raw: this.posts.get(id)!.title }, content: { raw: this.posts.get(id)!.content }, status: this.posts.get(id)!.status, link: this.posts.get(id)!.link })
    }
    const m = url.match(/\/wp-json\/wp\/v2\/posts\/(\d+)/)
    if (m) {
      const post = this.posts.get(Number(m[1]))
      if (!post) return json({ message: 'not found' }, 404)
      return json({ id: Number(m[1]), title: { raw: post.title }, excerpt: { raw: post.excerpt }, content: { raw: post.content }, status: post.status, link: post.link })
    }
    return json({ message: 'not found' }, 404)
  }
}
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
function connection(): WpConnection {
  return {
    id: randomUUID(), projectId: 'p1', siteUrl: 'https://wp.test', username: 'admin',
    appPasswordEnc: encryptSecret('app-pass'), aioseo: false, createdBy: 'u1', createdAt: new Date().toISOString(),
  }
}

describe('createWpDraftPost: real create + verify by read-back', () => {
  let wp: FakeWp
  beforeEach(() => {
    wp = new FakeWp()
    __setTrustedHostsForTests(['wp.test'])
    vi.stubGlobal('fetch', (input: string | URL, init?: RequestInit) => Promise.resolve(wp.handle(String(input), init)))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    __setTrustedHostsForTests(null)
  })

  it('creates a real draft post and verifies title/meta by re-reading it', async () => {
    const result = await createWpDraftPost(connection(), 'posts', { title: 'Best CRM for Small Teams', content: '<p>hi</p>', metaDescription: 'meta' })
    expect(result.verified).toBe(true)
    expect(result.link).toMatch(/^https:\/\/wp\.test/)
    const created = wp.posts.get(result.postId)
    expect(created?.status).toBe('draft') // never published automatically
    expect(created?.title).toBe('Best CRM for Small Teams')
  })

  it('reports verified:false honestly when the field does not persist', async () => {
    wp.dropMeta = true
    const result = await createWpDraftPost(connection(), 'posts', { title: 'X', content: '<p>x</p>', metaDescription: 'meta' })
    expect(result.verified).toBe(false)
    expect(result.note).toMatch(/did not verify/)
  })
})
