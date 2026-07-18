// Automatic internal linking, exercised through the REAL end-to-end path a
// user actually triggers — not just the isolated fix-generator unit test:
//
//   real crawl pages → generateRecommendationsFromScan (the actual rule,
//   ruleInternalLinking) → buildOperatorPreview (the actual fix generator +
//   safety + policy) → executeWpDeployment against a live-shaped WordPress
//   double → read-back verification.
//
// No live network — the SSRF guard's test-host seam + a stubbed WordPress
// REST double stand in for the real site.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { __setStoreForTests } from '../lib/foundation/store'
import { encryptSecret } from '../lib/foundation/crypto'
import { __setTrustedHostsForTests } from '../app/api/seo-scan/url-guard'
import { generateRecommendationsFromScan } from '../lib/foundation/recommendations'
import { signalsForRecommendation, buildOperatorPreview } from '../lib/foundation/operator/pipeline'
import { DEFAULT_POLICY } from '../lib/foundation/operator/policy'
import { executeWpDeployment } from '../lib/foundation/wp-execution'
import type { Scan, WpConnection } from '../lib/foundation/types'

process.env.APP_SECRET = 'internal-linking-e2e-secret'

// A pricing page with only 1 internal link (below the rule's threshold of 3)
// plus two other real crawled pages it could plausibly link to.
const PAGES = [
  {
    url: 'https://wp.test/pricing',
    title: 'Pricing',
    titleLength: 7,
    metaDescription: 'Plans and pricing.',
    metaDescriptionLength: 19,
    https: true,
    indexable: true,
    schemaTypes: [],
    internalTargets: ['https://wp.test/'],
    wordCount: 400,
    h1Count: 1,
  },
  { url: 'https://wp.test/features', title: 'Features · Acme', titleLength: 16, metaDescription: 'x', metaDescriptionLength: 1, https: true, indexable: true, schemaTypes: [], internalTargets: [], wordCount: 400, h1Count: 1 },
  { url: 'https://wp.test/docs', title: 'Docs · Acme', titleLength: 11, metaDescription: 'x', metaDescriptionLength: 1, https: true, indexable: true, schemaTypes: [], internalTargets: [], wordCount: 400, h1Count: 1 },
]

function scan(): Scan {
  const now = new Date('2026-07-17').toISOString()
  return {
    id: 'scan-1', projectId: 'proj-1', createdBy: 'u1', createdAt: now, status: 'completed',
    startedAt: now, completedAt: now, error: null,
    summary: { pagesCrawled: PAGES.length, urlsDiscovered: PAGES.length, blockedCount: 0, siteScore: 0, critical: 0, warning: 0, info: 0 },
    pages: PAGES, blocked: [],
  }
}

// ---- WordPress REST double: /pricing is post id 10 ----
class FakeWp {
  post = { id: 10, title: 'Pricing', excerpt: 'Plans and pricing.', content: '<p>Our plans.</p>', link: 'https://wp.test/pricing' }
  handle(url: string, init?: RequestInit): Response {
    const method = init?.method ?? 'GET'
    if (url.includes('/wp-json/wp/v2/pages/10')) {
      if (method === 'POST') {
        const body = JSON.parse((init?.body as string) ?? '{}')
        if (body.content !== undefined) this.post.content = body.content
      }
      return json({
        id: 10,
        title: { raw: this.post.title, rendered: this.post.title },
        excerpt: { raw: this.post.excerpt },
        content: { raw: this.post.content, rendered: this.post.content },
        link: this.post.link,
      })
    }
    return json({ message: 'not found' }, 404)
  }
}
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function connection(): WpConnection {
  return {
    id: randomUUID(), projectId: 'proj-1', siteUrl: 'https://wp.test', username: 'admin',
    appPasswordEnc: encryptSecret('app-pass-1234'), aioseo: false, createdBy: 'u1', createdAt: new Date().toISOString(),
  }
}

let wp: FakeWp
let store: FileFoundationStore
beforeEach(() => {
  wp = new FakeWp()
  store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-intlink-')))
  __setStoreForTests(store)
  __setTrustedHostsForTests(['wp.test'])
  vi.stubGlobal('fetch', (input: string | URL, init?: RequestInit) => Promise.resolve(wp.handle(String(input), init)))
})
afterEach(() => {
  vi.unstubAllGlobals()
  __setStoreForTests(null)
  __setTrustedHostsForTests(null)
})

describe('automatic internal linking — real recommendation through real deploy', () => {
  it('the rule engine actually generates an internal-linking recommendation for a thin-linked page', () => {
    const { recommendations } = generateRecommendationsFromScan(scan())
    const rec = recommendations.find((r) => r.ruleId === 'internal-linking')
    expect(rec).toBeTruthy()
    expect(rec!.evidence.affectedUrls[0]).toBe('https://wp.test/pricing')
  })

  it('the fix generator proposes real OTHER crawled pages, never invented URLs', () => {
    const s = scan()
    const { recommendations } = generateRecommendationsFromScan(s)
    const rec = recommendations.find((r) => r.ruleId === 'internal-linking')!
    const signals = signalsForRecommendation(rec, s.pages as Record<string, unknown>[])!
    const sitePages = (s.pages as { url: string; title: string }[]).map((p) => ({ url: p.url, title: p.title }))

    const preview = buildOperatorPreview(rec, signals, DEFAULT_POLICY, { sitePages })
    expect(preview.fix.actionable).toBe(true)
    expect(preview.fix.kind).toBe('internalLinks')
    const transform = preview.fix.contentTransform
    expect(transform?.type).toBe('append-internal-links')
    const links = transform?.type === 'append-internal-links' ? transform.links : []
    expect(links.length).toBeGreaterThan(0)
    for (const l of links) {
      expect(sitePages.some((p) => p.url === l.url)).toBe(true) // real crawled page
      expect(l.url).not.toBe('https://wp.test/pricing') // never links to itself
    }
    // Deployable through the generic contentTransform path (pipeline.ts).
    expect(preview.fix.actionable && preview.fix.contentTransform !== undefined).toBe(true)
  })

  it('deploys end-to-end: the live post body actually gets the internal links, verified by read-back', async () => {
    const s = scan()
    const { recommendations } = generateRecommendationsFromScan(s)
    const rec = recommendations.find((r) => r.ruleId === 'internal-linking')!
    const signals = signalsForRecommendation(rec, s.pages as Record<string, unknown>[])!
    const sitePages = (s.pages as { url: string; title: string }[]).map((p) => ({ url: p.url, title: p.title }))
    const preview = buildOperatorPreview(rec, signals, DEFAULT_POLICY, { sitePages })

    const dep = await executeWpDeployment({
      projectId: 'proj-1',
      orgId: 'org-1',
      connection: connection(),
      postId: 10,
      postType: 'pages',
      changes: { contentTransform: preview.fix.contentTransform! },
      approvedBy: 'u1',
      reason: 'Automatic internal linking',
    })

    expect(dep.status).toBe('verified')
    expect(wp.post.content).toContain('rankforge:related')
    expect(wp.post.content).toContain('Related pages')
    const transform = preview.fix.contentTransform
    const links = transform?.type === 'append-internal-links' ? transform.links : []
    for (const l of links) expect(wp.post.content).toContain(l.url)
  })

  it('re-deploying is idempotent — no duplicate related-links blocks', async () => {
    const s = scan()
    const { recommendations } = generateRecommendationsFromScan(s)
    const rec = recommendations.find((r) => r.ruleId === 'internal-linking')!
    const signals = signalsForRecommendation(rec, s.pages as Record<string, unknown>[])!
    const sitePages = (s.pages as { url: string; title: string }[]).map((p) => ({ url: p.url, title: p.title }))
    const preview = buildOperatorPreview(rec, signals, DEFAULT_POLICY, { sitePages })

    const opts = {
      projectId: 'proj-1', orgId: 'org-1', connection: connection(), postId: 10, postType: 'pages' as const,
      changes: { contentTransform: preview.fix.contentTransform! }, approvedBy: 'u1', reason: 'link',
    }
    await executeWpDeployment(opts)
    const second = await executeWpDeployment(opts)
    expect(second.status).toBe('verified')
    expect(wp.post.content.match(/rankforge:related/g)?.length).toBe(1)
  })
})
