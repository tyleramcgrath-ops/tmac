// Multi-Agent SEO Operating System (Phase F). Proves the coordination layer:
// consensus surfaces disagreement, QA challenges, dangerous classes escalate to
// a human, provenance is complete, memory learns from outcomes, and the honesty
// invariants hold (Authority reports off-site authority as unknown; Local stands
// down for non-local businesses). Agents coordinate over the ONE findings
// pipeline — no second rule engine.

import { describe, expect, it } from 'vitest'
import type { Recommendation, WpDeployment } from '../lib/foundation/types'
import { coordinate, type CoordinatedRecommendation } from '../lib/foundation/agents/orchestrator'
import { computeConsensus } from '../lib/foundation/agents/consensus'
import { qaChallenge } from '../lib/foundation/agents/qa'
import { deriveAgentMemory } from '../lib/foundation/agents/memory'
import type { RecommendationCoordination } from '../lib/foundation/agents/types'

function rec(p: Partial<Recommendation>): Recommendation {
  return {
    id: 'r1', projectId: 'p', scanId: 's', issueId: 'missing-title::site',
    ruleId: 'missing-title', ruleVersion: 1, ruleCategory: 'content', ruleSeverity: 'critical', businessContext: 'money-page',
    pageType: 'pricing', title: 'Missing <title>', category: 'content', severity: 'critical', status: 'open',
    priorityScore: 55, reasoning: 'The title is missing.', confidence: 90, confidenceBasis: 'x',
    evidence: { affectedUrls: ['https://x.com/pricing'], facts: ['No <title> text extracted'], supportingElements: ['No <title>'] },
    expectedImpact: { category: 'content', size: 'high', note: '' }, risk: { level: 'low', note: '' },
    explanation: { why: 'w', whyNow: 'n', whyThisPage: 't', whatIfIgnored: 'i', whatCouldMakeWrong: 'Extraction could rarely miss a JS-rendered title.' },
    createdAt: '2026-07-17T00:00:00Z', history: [], ...p,
  }
}
const coordOf = (r: CoordinatedRecommendation) => r.coordination as RecommendationCoordination

describe('QA reviewer challenges', () => {
  it('raises a concern on a low-confidence, flagged finding', () => {
    const s = qaChallenge(rec({ confidence: 40, needsHumanReview: true }))
    expect(s.position).toBe('concern')
    expect(s.note).toMatch(/low confidence|human review/i)
  })
  it('supports a strong, low-risk finding', () => {
    const s = qaChallenge(rec({ confidence: 92, needsHumanReview: false }))
    expect(s.position).toBe('support')
  })
  it('always records the finding’s own failure mode as an assumption to watch', () => {
    const s = qaChallenge(rec({}))
    expect(s.assumptions.join(' ')).toMatch(/JS-rendered title/)
  })
})

describe('consensus engine', () => {
  it('AGREES when the owner supports and evidence is strong', () => {
    const r = rec({ confidence: 90 })
    const c = coordinate([r], [], { local: false }).coordinated[0]
    expect(coordOf(c).consensus).toBe('agree')
    expect(coordOf(c).disagreements).toHaveLength(0)
  })

  it('escalates a dangerous (noindex) class to HUMAN-REQUIRED regardless of confidence', () => {
    const r = rec({ ruleId: 'noindex', ruleCategory: 'indexability', pageType: 'homepage', businessContext: 'money-page', confidence: 95 })
    const c = coordinate([r], [], { local: false }).coordinated[0]
    expect(coordOf(c).consensus).toBe('human-required')
  })

  it('routes a low-confidence finding to NEEDS-REVIEW', () => {
    const r = rec({ confidence: 48, needsHumanReview: true })
    const c = coordinate([r], [], { local: false }).coordinated[0]
    expect(['needs-review', 'human-required']).toContain(coordOf(c).consensus)
  })

  it('SURFACES a disagreement when QA concerns conflict with owner support', () => {
    // Thin evidence + soft caveat → QA concern, owner still supports.
    const r = rec({ confidence: 62, evidence: { affectedUrls: ['https://x.com/a'], facts: [], supportingElements: [] } })
    const c = coordinate([r], [], { local: false }).coordinated[0]
    const co = coordOf(c)
    expect(['disagree', 'needs-review']).toContain(co.consensus)
    // Disagreement, when present, names the challenging agent.
    if (co.consensus === 'disagree') expect(co.disagreements.join(' ')).toMatch(/QA Reviewer/)
  })
})

describe('provenance chain', () => {
  it('every coordinated recommendation carries a full, traceable chain', () => {
    const r = rec({
      status: 'verified',
      history: [{ at: 't', by: 'user-7', from: 'open', to: 'accepted' }],
    })
    const dep: WpDeployment = {
      id: 'd1', projectId: 'p', connectionId: 'c', postId: 1, postType: 'pages', postUrl: 'u',
      before: { title: 'a', metaDescription: '', contentHash: '', content: '' }, after: { title: 'b' },
      approvedBy: 'user-7', approvedAt: 't', reason: 'r', recommendationId: 'r1', status: 'verified',
      verification: null, result: 'ok', createdAt: 't',
    }
    const c = coordinate([r], [dep], { local: false }).coordinated[0]
    const pv = coordOf(c).provenance
    expect(pv.discoveredBy).toBe('scout')
    expect(pv.analyzedBy).toBe('content') // content-category owner
    expect(pv.challengedBy).toBe('qa')
    expect(pv.prioritizedBy).toBe('strategist')
    expect(pv.approvedBy).toBe('user-7')
    expect(pv.deployedBy).toBe('operator')
    expect(pv.verifiedBy).toBe('operator')
  })
})

describe('agent participation & honesty', () => {
  it('CRO weighs in on money pages; Local stays out for a non-local business', () => {
    const c = coordinate([rec({})], [], { local: false }).coordinated[0]
    const ids = coordOf(c).stances.map((s) => s.agentId)
    expect(ids).toContain('cro') // pricing is a money page
    expect(ids).not.toContain('local') // not a local business
  })

  it('Local activates for a local business on a location page', () => {
    const r = rec({ pageType: 'location', ruleCategory: 'schema', businessContext: 'standard' })
    const c = coordinate([r], [], { local: true }).coordinated[0]
    expect(coordOf(c).stances.map((s) => s.agentId)).toContain('local')
  })

  it('Authority reports off-site authority as UNKNOWN (never fabricates metrics)', () => {
    const { reports } = coordinate([rec({})], [], { local: false })
    const authority = reports.find((r) => r.agentId === 'authority')!
    const limitation = authority.observations.find((o) => o.kind === 'limitation')!
    expect(limitation.confidence).toBe('unknown')
    expect(limitation.detail).toMatch(/no external backlink|UNKNOWN/i)
  })

  it('Local report stands down (inactive) for a non-local business', () => {
    const { reports } = coordinate([rec({})], [], { local: false })
    const local = reports.find((r) => r.agentId === 'local')!
    expect(local.active).toBe(false)
  })

  it('produces one report per agent (9 specialized agents)', () => {
    const { reports } = coordinate([rec({})], [], { local: false })
    expect(new Set(reports.map((r) => r.agentId)).size).toBe(9)
  })
})

describe('task orchestrator', () => {
  it('builds the canonical inter-agent chain per finding, routing conflicts to a human', () => {
    const { tasks } = coordinate([rec({ ruleId: 'noindex', ruleCategory: 'indexability' })], [], { local: false })
    const kinds = tasks.map((t) => t.kind)
    expect(kinds).toContain('analyze')
    expect(kinds).toContain('challenge')
    expect(kinds).toContain('human-review') // dangerous → human-required → human-review task
    expect(kinds).toContain('verify')
  })
})

describe('agent memory', () => {
  it('records rejections as mistakes and nudges confidence down', () => {
    const recs = [
      rec({ id: 'a', status: 'rejected' }),
      rec({ id: 'b', status: 'rejected' }),
      rec({ id: 'c', status: 'rejected' }),
    ]
    const mem = deriveAgentMemory(recs, [])
    const content = mem.find((m) => m.agentId === 'content')!
    expect(content.rejected).toBe(3)
    expect(content.suggestedConfidenceNudge).toBeLessThan(0)
    expect(content.lessons.join(' ')).toMatch(/rejected/i)
  })

  it('records a rollback as a strong mistake signal', () => {
    const r = rec({ id: 'a', status: 'verified' })
    const dep: WpDeployment = {
      id: 'd', projectId: 'p', connectionId: 'c', postId: 1, postType: 'pages', postUrl: 'u',
      before: { title: 'a', metaDescription: '', contentHash: '', content: '' }, after: {}, approvedBy: 'u',
      approvedAt: 't', reason: 'r', recommendationId: 'a', status: 'rolled_back', verification: null, result: 'x', createdAt: 't',
    }
    const mem = deriveAgentMemory([r], [dep])
    const content = mem.find((m) => m.agentId === 'content')!
    expect(content.rolledBack).toBeGreaterThanOrEqual(1)
    expect(content.lessons.join(' ')).toMatch(/rolled back/i)
  })
})

describe('success metrics', () => {
  it('reports consensus quality and honestly marks recall / false-negatives unknown', () => {
    const { metrics } = coordinate([rec({ confidence: 90 }), rec({ id: 'r2', issueId: 'i2', ruleId: 'noindex', ruleCategory: 'indexability' })], [], { local: false })
    expect(metrics.totalRecommendations).toBe(2)
    expect(metrics.consensus.agree + metrics.consensus['human-required']).toBeGreaterThan(0)
    expect(metrics.recall).toBe('unknown')
    expect(metrics.falseNegativeProxy).toBe('unknown')
    expect(metrics.consensusQuality).toBeGreaterThan(0)
  })
})
