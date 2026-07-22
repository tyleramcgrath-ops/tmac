// Content-level WordPress fixes (Phase H): the https-upgrade / missing-H1 /
// internal-linking transforms, their idempotency + verification, and the fix
// generators + operator preview that make them one-click deployable.

import { describe, expect, it } from 'vitest'
import { applyContentTransform, verifyContentTransform, type ContentTransform } from '../lib/foundation/operator/content-fix'
import { generateFix } from '../lib/foundation/operator/fixgen'
import { buildOperatorPreview } from '../lib/foundation/operator/pipeline'
import { DEFAULT_POLICY } from '../lib/foundation/operator/policy'
import { RULE_REGISTRY, runPageRules } from '../lib/foundation/reco/rules'
import { classifyPage } from '../lib/foundation/reco/classify'
import { deriveBusinessContext } from '../lib/foundation/reco/business'
import type { PageSignals } from '../lib/foundation/reco/signals'
import type { Recommendation } from '../lib/foundation/types'

function sig(over: Partial<PageSignals> = {}): PageSignals {
  return { url: 'https://shop.example.com/widgets', ...over }
}
function recFor(ruleId: string, url = 'https://shop.example.com/widgets'): Recommendation {
  return {
    id: 'r1', projectId: 'p', scanId: 's', issueId: `${ruleId}::x`, ruleId, ruleVersion: 1, ruleCategory: 'x', ruleSeverity: 'warning',
    businessContext: 'standard', title: ruleId, category: 'x', severity: 'warning', status: 'open', reasoning: 'r',
    evidence: { affectedUrls: [url], facts: [] }, confidence: 80, confidenceBasis: 'x',
    expectedImpact: { category: 'x', size: 'medium', note: '' }, risk: { level: 'low', note: '' }, createdAt: '', history: [],
  }
}

describe('applyContentTransform + verify', () => {
  it('upgrades same-host http:// references and leaves third-party http alone', () => {
    const t: ContentTransform = { type: 'https-upgrade', hosts: ['shop.example.com', 'www.shop.example.com'] }
    const content = '<img src="http://shop.example.com/a.png"><a href="http://other.com/x">x</a>'
    const r = applyContentTransform(content, t)
    expect(r.changed).toBe(true)
    expect(r.content).toContain('https://shop.example.com/a.png')
    expect(r.content).toContain('http://other.com/x') // untouched
    expect(verifyContentTransform(r.content, t)).toBe(true)
    // idempotent: re-applying is a no-op
    expect(applyContentTransform(r.content, t).changed).toBe(false)
  })
  it('prepends an H1 only when the body has none', () => {
    const t: ContentTransform = { type: 'prepend-h1', text: 'Widgets' }
    const added = applyContentTransform('<p>hi</p>', t)
    expect(added.changed).toBe(true)
    expect(added.content.startsWith('<h1>Widgets</h1>')).toBe(true)
    expect(verifyContentTransform(added.content, t)).toBe(true)
    expect(applyContentTransform('<h1>Existing</h1><p>hi</p>', t).changed).toBe(false)
  })
  it('appends an internal-links block once (idempotent by marker)', () => {
    const t: ContentTransform = { type: 'append-internal-links', links: [{ url: 'https://x/a', anchor: 'A' }] }
    const r = applyContentTransform('<p>body</p>', t)
    expect(r.changed).toBe(true)
    expect(r.content).toContain('<a href="https://x/a">A</a>')
    expect(verifyContentTransform(r.content, t)).toBe(true)
    expect(applyContentTransform(r.content, t).changed).toBe(false)
  })
  it('escapes html in inserted values', () => {
    const t: ContentTransform = { type: 'prepend-h1', text: '<script>x</script>' }
    const r = applyContentTransform('body', t)
    expect(r.content).toContain('&lt;script&gt;')
    expect(r.content).not.toContain('<script>x')
  })
  it('upserts a managed JSON-LD block idempotently and updates in place', () => {
    const t: ContentTransform = { type: 'set-jsonld', jsonLd: '{"@context":"https://schema.org","@type":"Article"}' }
    const r = applyContentTransform('<p>body</p>', t)
    expect(r.changed).toBe(true)
    expect(r.content).toContain('<script type="application/ld+json">')
    expect(r.content).toContain('rankforge:schema')
    expect(verifyContentTransform(r.content, t)).toBe(true)
    // idempotent: same JSON re-applied is a no-op
    expect(applyContentTransform(r.content, t).changed).toBe(false)
    // changing the schema replaces the block, not stacks a second one
    const t2: ContentTransform = { type: 'set-jsonld', jsonLd: '{"@context":"https://schema.org","@type":"Product"}' }
    const r2 = applyContentTransform(r.content, t2)
    expect(r2.changed).toBe(true)
    expect(r2.content.match(/rankforge:schema -->/g)?.length).toBe(2) // one open + one close, single block
    expect(r2.content).toContain('"Product"')
    expect(r2.content).not.toContain('"Article"')
  })
  it('rejects invalid JSON schema (no broken markup shipped)', () => {
    const t: ContentTransform = { type: 'set-jsonld', jsonLd: 'not json' }
    const r = applyContentTransform('<p>body</p>', t)
    expect(r.changed).toBe(false)
    // verify fails when the script never made it into the content (e.g. WP stripped it)
    expect(verifyContentTransform('<!-- rankforge:schema --><!-- /rankforge:schema -->', { type: 'set-jsonld', jsonLd: '{}' })).toBe(false)
  })
  it('keyed set-jsonld blocks coexist independently — one does not overwrite the other', () => {
    const page: ContentTransform = { type: 'set-jsonld', jsonLd: '{"@type":"Product"}' }
    const crumb: ContentTransform = { type: 'set-jsonld', jsonLd: '{"@type":"BreadcrumbList"}', key: 'breadcrumb' }
    let content = applyContentTransform('<p>body</p>', page).content
    content = applyContentTransform(content, crumb).content
    expect(content).toContain('"Product"')
    expect(content).toContain('"BreadcrumbList"')
    expect(verifyContentTransform(content, page)).toBe(true)
    expect(verifyContentTransform(content, crumb)).toBe(true)
    // re-applying the page schema only touches its own block
    const updated = applyContentTransform(content, { type: 'set-jsonld', jsonLd: '{"@type":"Article"}' })
    expect(updated.content).toContain('"Article"')
    expect(updated.content).not.toContain('"Product"')
    expect(updated.content).toContain('"BreadcrumbList"') // untouched
  })

  it('demotes every H1 after the first to H2, keeping the first as-is', () => {
    const t: ContentTransform = { type: 'demote-extra-h1' }
    const r = applyContentTransform('<h1 class="x">First</h1><p>mid</p><h1>Second</h1><h1>Third</h1>', t)
    expect(r.changed).toBe(true)
    expect(r.content).toContain('<h1 class="x">First</h1>')
    expect(r.content).toContain('<h2>Second</h2>')
    expect(r.content).toContain('<h2>Third</h2>')
    expect(verifyContentTransform(r.content, t)).toBe(true)
    // idempotent: re-applying to the fixed content is a no-op
    expect(applyContentTransform(r.content, t).changed).toBe(false)
  })
  it('demote-extra-h1 is a no-op with zero or one H1', () => {
    const t: ContentTransform = { type: 'demote-extra-h1' }
    expect(applyContentTransform('<p>no h1 here</p>', t).changed).toBe(false)
    expect(applyContentTransform('<h1>Only one</h1>', t).changed).toBe(false)
  })
  it('demote-extra-h1 skips malformed markup rather than guessing', () => {
    const t: ContentTransform = { type: 'demote-extra-h1' }
    // Unbalanced h1 tags (three opens, two closes) — cannot be safely paired.
    const r = applyContentTransform('<h1>A</h1><h1>B<h1>C</h1>', t)
    expect(r.changed).toBe(false)
  })
})

describe('fix generators (Phase H)', () => {
  it('mixed-content → deployable https-upgrade transform', () => {
    const fix = generateFix('mixed-content', sig())
    expect(fix.actionable).toBe(true)
    expect(fix.kind).toBe('mixedContent')
    expect(fix.contentTransform?.type).toBe('https-upgrade')
  })
  it('missing-h1 → deployable prepend-h1 transform derived from the page', () => {
    const fix = generateFix('missing-h1', sig({ title: 'Widgets · Shop' }))
    expect(fix.contentTransform).toEqual({ type: 'prepend-h1', text: 'Widgets' })
  })
  it('internal-linking → links only to OTHER real crawled pages, never invented', () => {
    const fix = generateFix('internal-linking', sig({ internalTargets: [] }), {
      sitePages: [
        { url: 'https://shop.example.com/widgets', title: 'self' }, // excluded (self)
        { url: 'https://shop.example.com/pricing', title: 'Pricing' },
        { url: 'https://shop.example.com/about', title: 'About' },
      ],
    })
    expect(fix.actionable).toBe(true)
    const t = fix.contentTransform as Extract<ContentTransform, { type: 'append-internal-links' }>
    expect(t.links.map((l) => l.url)).toEqual(['https://shop.example.com/pricing', 'https://shop.example.com/about'])
  })
  it('internal-linking is advisory when there are no other pages to link to', () => {
    const fix = generateFix('internal-linking', sig(), { sitePages: [] })
    expect(fix.actionable).toBe(false)
  })
  it('schema-missing is now deployable — writes a managed JSON-LD block, not just advisory', () => {
    const fix = generateFix('schema-missing', sig({ title: 'Widgets · Shop' }))
    expect(fix.actionable).toBe(true)
    expect(fix.contentTransform).toEqual({ type: 'set-jsonld', jsonLd: expect.stringContaining('"@type": "WebPage"') })
  })
  it('breadcrumb builds a real trail from the URL, labeling ancestors from crawled titles when available', () => {
    const fix = generateFix('breadcrumb', sig({ url: 'https://shop.example.com/category/widgets', title: 'Widgets · Shop' }), {
      sitePages: [{ url: 'https://shop.example.com/category', title: 'Category Hub' }],
    })
    expect(fix.actionable).toBe(true)
    const t = fix.contentTransform as Extract<ContentTransform, { type: 'set-jsonld' }>
    expect(t.key).toBe('breadcrumb')
    const json = JSON.parse(t.jsonLd)
    expect(json['@type']).toBe('BreadcrumbList')
    const names = json.itemListElement.map((i: { name: string }) => i.name)
    expect(names).toEqual(['Home', 'Category Hub', 'Widgets'])
    const items = json.itemListElement.map((i: { item: string }) => i.item)
    expect(items).toEqual(['https://shop.example.com/', 'https://shop.example.com/category/', 'https://shop.example.com/category/widgets/'])
  })
  it('breadcrumb falls back to a humanized path segment when no crawled page matches', () => {
    const fix = generateFix('breadcrumb', sig({ url: 'https://shop.example.com/blog/best-widgets', title: 'Best Widgets' }))
    const t = fix.contentTransform as Extract<ContentTransform, { type: 'set-jsonld' }>
    const json = JSON.parse(t.jsonLd)
    expect(json.itemListElement.map((i: { name: string }) => i.name)).toEqual(['Home', 'Blog', 'Best Widgets'])
  })
  it('multiple-h1 → deployable demote-extra-h1 transform', () => {
    const fix = generateFix('multiple-h1', sig({ h1Count: 3 }))
    expect(fix.actionable).toBe(true)
    expect(fix.kind).toBe('heading')
    expect(fix.contentTransform).toEqual({ type: 'demote-extra-h1' })
  })
})

describe('operator preview marks content fixes deployable', () => {
  it('mixed-content preview is deployable (not advisory)', () => {
    const p = buildOperatorPreview(recFor('mixed-content'), sig(), DEFAULT_POLICY)
    expect(p.preview.deployable).toBe(true)
    expect(p.safety.blocked).toBe(false)
  })
})

describe('new rules are registered + fire', () => {
  it('registers missing-h1 and internal-linking', () => {
    expect(RULE_REGISTRY['missing-h1']).toBeDefined()
    expect(RULE_REGISTRY['internal-linking']).toBeDefined()
  })
  it('missing-h1 fires when a content page has zero H1', () => {
    const s = sig({ h1Count: 0, title: 'Widgets' })
    const cls = classifyPage(s)
    const biz = deriveBusinessContext({ industry: '', businessProfile: '', goals: [] }, [cls.type])
    const findings = runPageRules({ s, cls, biz })
    expect(findings.some((f) => f.ruleId === 'missing-h1')).toBe(true)
  })
})
