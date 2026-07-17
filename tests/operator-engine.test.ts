// Operator engine (Phase D) — unit tests for the pure modules: fix generation,
// safe diff, safety blocking, approval policy, verify-reopen outcome, learning
// substrate, and executive metrics.

import { describe, expect, it } from 'vitest'
import { generateFix, ruleIdOf } from '../lib/foundation/operator/fixgen'
import { charDiff } from '../lib/foundation/operator/diff'
import { assessSafety } from '../lib/foundation/operator/safety'
import { evaluatePolicy, EXAMPLE_POLICY, DEFAULT_POLICY } from '../lib/foundation/operator/policy'
import { outcomeForDeployment } from '../lib/foundation/operator/pipeline'
import { computeOperatorMetrics } from '../lib/foundation/operator/metrics'
import { aggregateLearning } from '../lib/foundation/operator/learning'
import type { Recommendation, WpDeployment } from '../lib/foundation/types'

function rec(partial: Partial<Recommendation>): Recommendation {
  return {
    id: 'r1', projectId: 'p', scanId: 's', issueId: 'missing-title::site',
    ruleId: 'missing-title', ruleVersion: 1, ruleCategory: 'content', ruleSeverity: 'critical',
    businessContext: 'money-page',
    title: 'Missing <title> tag', category: 'content',
    severity: 'critical', status: 'open', reasoning: 'why', confidence: 90,
    confidenceBasis: 'x', evidence: { affectedUrls: ['https://x.com/product/z'], facts: [] },
    expectedImpact: { category: 'content', size: 'high', note: 'CTR/rank' }, risk: { level: 'low', note: '' },
    createdAt: '2026-07-17T00:00:00Z', history: [], ...partial,
  }
}

describe('fix generation (§2): produces concrete changes', () => {
  it('composes a title for a missing-title recommendation', () => {
    const fix = generateFix('missing-title', { url: 'https://acme.com/services/roof-repair', title: undefined })
    expect(fix.actionable).toBe(true)
    expect(fix.kind).toBe('title')
    expect(fix.proposedValue).toMatch(/Roof Repair/i)
    expect(fix.deploy?.title).toBe(fix.proposedValue)
  })
  it('shortens an over-long title on a word boundary, preserving brand', () => {
    const long = 'Enterprise Grade Continuous Integration And Delivery For Modern Teams · GitHub'
    const fix = generateFix('title-length', { url: 'https://github.com/enterprise', title: long })
    expect(fix.actionable).toBe(true)
    expect(fix.proposedValue.length).toBeLessThanOrEqual(63)
    expect(fix.proposedValue).toMatch(/GitHub$/)
  })
  it('generates page-appropriate JSON-LD for a pricing page', () => {
    const fix = generateFix('schema-missing', { url: 'https://x.com/pricing', title: 'Pricing · X', schemaTypes: [] })
    expect(fix.kind).toBe('schema')
    expect(fix.proposedValue).toMatch(/application\/ld\+json/)
    expect(fix.proposedValue).toMatch(/"@type": "Product"/)
    expect(fix.proposedValue).toMatch(/Offer/)
  })
  it('does not fabricate alt text (advisory only)', () => {
    const fix = generateFix('alt-text', { url: 'https://x.com/a', imagesMissingAlt: 5 })
    expect(fix.actionable).toBe(false)
  })
  it('reads a recommendation ruleId from its typed field (no parsing)', () => {
    expect(ruleIdOf(rec({}))).toBe('missing-title')
    expect(ruleIdOf(rec({ ruleId: 'schema-missing' }))).toBe('schema-missing')
    expect(ruleIdOf({})).toBe('unknown')
  })
})

describe('safe diff (§3)', () => {
  it('produces insert/delete/equal segments', () => {
    const d = charDiff('Old Title', 'New Title')
    expect(d.some((s) => s.type === 'delete')).toBe(true)
    expect(d.some((s) => s.type === 'insert')).toBe(true)
    expect(d.some((s) => s.type === 'equal' && s.text.includes('Title'))).toBe(true)
    // Reconstruct original + new from the diff.
    expect(d.filter((s) => s.type !== 'insert').map((s) => s.text).join('')).toBe('Old Title')
    expect(d.filter((s) => s.type !== 'delete').map((s) => s.text).join('')).toBe('New Title')
  })
})

describe('safety engine (§7): blocks dangerous actions', () => {
  it('blocks a dangerous rule from its typed ruleId (not its title)', () => {
    // Title is deliberately innocuous — blocking must come from the typed rule
    // identity, proving the former title-regex decoy is gone.
    const r = rec({ ruleId: 'noindex', title: 'Improve this page', ruleCategory: 'indexability', risk: { level: 'medium', note: '' } })
    const fix = generateFix('noindex', { url: 'https://x.com/a' })
    const s = assessSafety(r, fix)
    expect(s.blocked).toBe(true)
    expect(s.risk).toBe('blocked')
  })
  it('blocks a dangerous fix kind (canonical) regardless of rule', () => {
    const r = rec({ ruleId: 'missing-title', title: 'anything' })
    const fix = { actionable: false, kind: 'canonical' as const, proposedValue: '', currentValue: '', note: '' }
    const s = assessSafety(r, fix)
    expect(s.blocked).toBe(true)
  })
  it('scores a title change as low/medium and never blocks', () => {
    const r = rec({ title: 'Missing <title> tag' })
    const fix = generateFix('missing-title', { url: 'https://x.com/product/z' })
    const s = assessSafety(r, fix)
    expect(s.blocked).toBe(false)
    expect(['low', 'medium']).toContain(s.risk)
    expect(s.rollbackPlan).toMatch(/before-values/i)
  })
})

describe('approval policy (§4)', () => {
  it('default policy requires approval for everything (opt-in automation)', () => {
    const r = rec({})
    const fix = generateFix('missing-title', { url: 'https://x.com/product/z' })
    const s = assessSafety(r, fix)
    expect(evaluatePolicy(DEFAULT_POLICY, fix, s).decision).toBe('requires-approval')
  })
  it('example policy auto-approves a low-risk title change within page cap', () => {
    const r = rec({ risk: { level: 'low', note: '' } })
    const fix = generateFix('missing-title', { url: 'https://x.com/product/z' })
    const s = assessSafety(r, fix)
    expect(evaluatePolicy(EXAMPLE_POLICY, fix, s).decision).toBe('auto-approved')
  })
  it('never auto-approves a blocked action', () => {
    const r = rec({ ruleId: 'noindex', title: 'Change robots directive' })
    const fix = generateFix('noindex', { url: 'https://x.com' })
    const s = assessSafety(r, fix)
    expect(evaluatePolicy(EXAMPLE_POLICY, fix, s).decision).toBe('blocked')
  })
  it('requires approval when a change touches more pages than the cap', () => {
    const r = rec({ risk: { level: 'low', note: '' }, evidence: { affectedUrls: Array.from({ length: 9 }, (_, i) => `https://x.com/p${i}`), facts: [] } })
    const fix = generateFix('missing-title', { url: 'https://x.com/p0' })
    const s = assessSafety(r, fix)
    expect(evaluatePolicy(EXAMPLE_POLICY, fix, s).decision).toBe('requires-approval')
  })
})

describe('verify-reopen outcome (§5)', () => {
  it('verified → verified; verify_failed → reopen; failed → reopen', () => {
    expect(outcomeForDeployment({ status: 'verified' } as WpDeployment).recommendationStatus).toBe('verified')
    const vf = outcomeForDeployment({ status: 'verify_failed', verification: { note: 'did not persist' } } as WpDeployment)
    expect(vf.reopen).toBe(true)
    expect(vf.recommendationStatus).toBe('open')
    expect(outcomeForDeployment({ status: 'failed', result: 'boom' } as WpDeployment).reopen).toBe(true)
  })
})

describe('learning substrate (§6): no ML, just aggregation', () => {
  it('computes per-rule acceptance/rollback and a bounded confidence nudge', () => {
    const recs = [
      rec({ id: 'a', status: 'verified' }),
      rec({ id: 'b', status: 'rejected' }),
      rec({ id: 'c', status: 'deployed' }),
    ]
    const stats = aggregateLearning(recs, [])
    const missing = stats.find((s) => s.ruleId === 'missing-title')!
    expect(missing.total).toBe(3)
    expect(missing.accepted).toBe(2)
    expect(missing.rejected).toBe(1)
    expect(missing.suggestedConfidenceNudge).toBeGreaterThanOrEqual(-0.15)
    expect(missing.suggestedConfidenceNudge).toBeLessThanOrEqual(0.15)
  })
})

describe('operator metrics (§10)', () => {
  it('computes trust/verification/rollback from deployments', () => {
    const deployments: WpDeployment[] = [
      { id: 'd1', projectId: 'p', connectionId: 'c', postId: 1, postType: 'pages', postUrl: 'u', before: { title: 'a', metaDescription: '', contentHash: '', content: '' }, after: { title: 'b' }, approvedBy: 'u', approvedAt: '2026-07-17T00:00:00Z', reason: 'r', status: 'verified', verification: { checkedAt: '2026-07-17T00:10:00Z', titleMatches: true, metaMatches: null, note: 'ok' }, result: 'ok', createdAt: '2026-07-17T00:00:00Z' },
      { id: 'd2', projectId: 'p', connectionId: 'c', postId: 2, postType: 'pages', postUrl: 'u', before: { title: 'a', metaDescription: '', contentHash: '', content: '' }, after: { title: 'b' }, approvedBy: 'u', approvedAt: '2026-07-17T00:00:00Z', reason: 'r', status: 'verify_failed', verification: { checkedAt: '2026-07-17T00:10:00Z', titleMatches: false, metaMatches: null, note: 'no' }, result: 'no', createdAt: '2026-07-17T00:00:00Z' },
    ]
    const m = computeOperatorMetrics([], deployments, '2026-07-17')
    expect(m.deploymentsTotal).toBe(2)
    expect(m.verifiedImprovements).toBe(1)
    expect(m.verificationFailureRate).toBeGreaterThan(0)
    expect(m.trustScore).toBeGreaterThan(0)
    expect(m.trustScore).toBeLessThanOrEqual(100)
    expect(m.avgTimeToResolutionHours).toBeCloseTo(0.17, 1)
  })
})
