// Consensus Engine (Phase F). Given every agent's stance on one finding, decide
// a status and NEVER hide disagreement. Evidence wins: a concern backed by a
// dangerous class or thin evidence outweighs weak support. The four outcomes:
//
//   agree          — owner supports, QA does not object, no unresolved concern
//   disagree       — a substantive concern conflicts with the owner's support
//   needs-review   — low aggregate confidence / soft concerns; a human should look
//   human-required — an irreversible/dangerous change or a hard QA block
//
// The rule is intentionally conservative: when agents genuinely conflict, the
// system surfaces it and asks for a human rather than papering over it.

import type { Recommendation } from '../types'
import { isDangerousRule } from '../reco/rules'
import type { AgentStance, ConsensusStatus } from './types'

export interface ConsensusResult {
  status: ConsensusStatus
  reason: string
  disagreements: string[]
}

export function computeConsensus(rec: Recommendation, stances: AgentStance[]): ConsensusResult {
  const owner = stances.find((s) => s.agentId !== 'qa' && s.agentId !== 'scout' && s.agentId !== 'strategist')
  const qa = stances.find((s) => s.agentId === 'qa')
  const concerns = stances.filter((s) => s.position === 'concern')
  const supporters = stances.filter((s) => s.position === 'support')

  const disagreements: string[] = []
  for (const c of concerns) {
    // A concern is a disagreement when someone else supports the same finding.
    if (supporters.length > 0 || (owner && owner.position === 'support')) {
      disagreements.push(`${labelFor(c.agentId)}: ${c.note}`)
    }
  }

  const dangerous = isDangerousRule(rec.ruleId)
  const qaHardBlock = !!qa && qa.position === 'concern' && qa.confidence >= 85

  // 1. Irreversible class, or a hard QA block → a human must decide.
  if (dangerous || qaHardBlock) {
    return {
      status: 'human-required',
      reason: dangerous
        ? 'Irreversible class (indexation/canonical/robots) — requires an explicit human decision.'
        : 'QA raised a high-confidence objection that must be resolved by a human.',
      disagreements,
    }
  }

  // 2. A genuine conflict (concern vs support) that is not a hard block.
  if (disagreements.length > 0) {
    return {
      status: 'disagree',
      reason: 'Agents disagree; the conflict is surfaced for a human to weigh the evidence.',
      disagreements,
    }
  }

  // 3. No conflict, but low aggregate confidence or a lingering soft concern.
  const avgConfidence = Math.round(
    stances.reduce((n, s) => n + s.confidence, 0) / Math.max(1, stances.length)
  )
  if (rec.needsHumanReview || rec.confidence < 55 || avgConfidence < 60 || concerns.length > 0) {
    return {
      status: 'needs-review',
      reason: `Aligned but not confident (finding ${rec.confidence}, agents ${avgConfidence}); a human should confirm.`,
      disagreements,
    }
  }

  // 4. Owner supports, QA does not object, confidence is solid.
  return {
    status: 'agree',
    reason: `All active agents agree (finding ${rec.confidence}, agents ${avgConfidence}); evidence is sufficient.`,
    disagreements,
  }
}

function labelFor(id: AgentStance['agentId']): string {
  return { scout: 'Scout', strategist: 'Strategist', technical: 'Technical SEO', content: 'Content Strategist', local: 'Local SEO', authority: 'Authority Builder', cro: 'CRO Advisor', operator: 'Operator', qa: 'QA Reviewer' }[id]
}
