// deployOneRecommendation is the single gate in front of every real WordPress
// write — the bulk operator loop, the one-click approve-from-email link, and
// the command engine all funnel through it. Its `editedValue` input comes
// straight off a request body, so what it accepts is what gets written live to
// a customer's page. These tests pin the gate down.

import { describe, expect, it } from 'vitest'
import { deployOneRecommendation, validateEditedValue } from '../lib/foundation/operator/deploy-one'
import { DEFAULT_POLICY, EXAMPLE_POLICY } from '../lib/foundation/operator/policy'
import type { FoundationStore } from '../lib/foundation/store'
import type { Project, Recommendation } from '../lib/foundation/types'

const project = { id: 'p1', orgId: 'o1', domain: 'x.com' } as Project

function rec(partial: Partial<Recommendation> = {}): Recommendation {
  return {
    id: 'r1', projectId: 'p1', scanId: 's1', issueId: 'title-length::site',
    ruleId: 'title-length', ruleVersion: 1, ruleCategory: 'content', ruleSeverity: 'warning',
    businessContext: 'money-page',
    title: 'Title too long', category: 'content', severity: 'warning', status: 'accepted',
    reasoning: 'why', confidence: 90, confidenceBasis: 'x',
    evidence: { affectedUrls: ['https://x.com/services/roof-repair'], facts: [] },
    expectedImpact: { category: 'content', size: 'medium', note: 'CTR' },
    risk: { level: 'low', note: '' },
    createdAt: '2026-07-17T00:00:00Z', history: [], ...partial,
  }
}

const LONG_TITLE = 'Enterprise Grade Continuous Integration And Delivery For Modern Teams · Acme'

const scanPages = [{ url: 'https://x.com/services/roof-repair', title: LONG_TITLE }]

// Every case below stops at or before the dry-run return, so the store is
// never touched — a real one would only obscure what is under test.
const store = {} as FoundationStore

function deploy(over: Partial<Parameters<typeof deployOneRecommendation>[0]> = {}) {
  return deployOneRecommendation({
    store, project, rec: rec(), scanPages, sitePages: [], conn: null,
    policy: EXAMPLE_POLICY, approvedBy: 'u1', approve: true, dryRun: true, ...over,
  })
}

describe('validateEditedValue: what a human is allowed to hand-write into a live page', () => {
  it('accepts an ordinary rewritten title', () => {
    expect(validateEditedValue('title', 'Roof Repair Services · Acme')).toBeNull()
  })

  it('rejects an empty value — deploying it would erase the live tag', () => {
    expect(validateEditedValue('title', '')).toMatch(/empty/i)
  })

  it('rejects a whitespace-only value for the same reason', () => {
    expect(validateEditedValue('metaDescription', '   \t ')).toMatch(/empty/i)
  })

  it('rejects a newline — titles and meta descriptions are single-line', () => {
    expect(validateEditedValue('title', 'Roof Repair\nServices')).toMatch(/line break/i)
  })

  it('rejects control characters', () => {
    expect(validateEditedValue('title', 'Roof\u0000Repair')).toMatch(/control character/i)
  })

  it('rejects embedded HTML rather than writing markup into a plain-text field', () => {
    expect(validateEditedValue('title', 'Roof <script>alert(1)</script>')).toMatch(/HTML/i)
    expect(validateEditedValue('metaDescription', 'Great <b>roofs</b>')).toMatch(/HTML/i)
  })

  it('allows a title longer than the generator’s 60-char target — a human may want it', () => {
    expect(validateEditedValue('title', 'R'.repeat(120))).toBeNull()
  })

  it('rejects a title past the hard ceiling, which is a paste error, not an intent', () => {
    expect(validateEditedValue('title', 'R'.repeat(201))).toMatch(/too long/i)
  })

  it('gives meta descriptions more room than titles', () => {
    expect(validateEditedValue('metaDescription', 'M'.repeat(400))).toBeNull()
    expect(validateEditedValue('metaDescription', 'M'.repeat(501))).toMatch(/too long/i)
  })
})

describe('deployOneRecommendation: edited values are gated before anything is written', () => {
  it('dry-runs successfully with no edit at all', async () => {
    expect(await deploy()).toEqual({ recommendationId: 'r1', ok: true, dryRun: true })
  })

  it('dry-runs successfully with a valid edit', async () => {
    expect(await deploy({ editedValue: 'Roof Repair · Acme' })).toEqual({ recommendationId: 'r1', ok: true, dryRun: true })
  })

  it('refuses an empty edited value instead of blanking the page title', async () => {
    const out = await deploy({ editedValue: '' })
    expect(out.ok).toBe(false)
    expect(out.stage).toBe('edit')
    expect(out.error).toMatch(/empty/i)
  })

  it('refuses a whitespace-only edited value', async () => {
    const out = await deploy({ editedValue: '\n  ' })
    expect(out.ok).toBe(false)
    expect(out.stage).toBe('edit')
  })

  it('refuses an edited value carrying HTML markup', async () => {
    const out = await deploy({ editedValue: '<title>x</title>' })
    expect(out.ok).toBe(false)
    expect(out.stage).toBe('edit')
    expect(out.error).toMatch(/HTML/i)
  })

  it('rejects the edit before the dry run, so a preview never reports a value that would be refused live', async () => {
    // A dry run that returned ok:true for a value the real deploy would reject
    // is worse than useless — it tells the operator the change is fine.
    const dry = await deploy({ editedValue: '', dryRun: true })
    const live = await deploy({ editedValue: '', dryRun: false })
    expect(dry.ok).toBe(false)
    expect(live.ok).toBe(false)
    expect(dry.stage).toBe(live.stage)
  })
})

describe('deployOneRecommendation: the gates ahead of the edit still hold', () => {
  it('stops when the scan has no signals for the affected URL', async () => {
    const out = await deploy({ scanPages: [{ url: 'https://x.com/other' }] })
    expect(out).toMatchObject({ ok: false, stage: 'signals' })
  })

  it('blocks a dangerous rule class outright, edit or no edit', async () => {
    const out = await deploy({ rec: rec({ ruleId: 'canonical-missing', issueId: 'canonical-missing::site' }), editedValue: 'anything' })
    expect(out.ok).toBe(false)
    expect(['safety', 'fixgen']).toContain(out.stage)
  })

  it('requires approval when no policy auto-approves and the caller did not approve', async () => {
    const out = await deploy({ policy: DEFAULT_POLICY, approve: false })
    expect(out).toMatchObject({ ok: false, stage: 'approval', requiresApproval: true })
  })

  it('reports the missing connection only after the dry-run short-circuit is off', async () => {
    const out = await deploy({ dryRun: false, conn: null })
    expect(out).toMatchObject({ ok: false, stage: 'connection' })
  })
})
