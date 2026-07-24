// QA Reviewer (Phase F). Its only job is to challenge every other agent. For
// each finding it asks: what could be wrong? what evidence is missing? what
// assumptions are weak? what would make this incorrect? It is deliberately
// skeptical — it raises a `concern` on any real weakness and only reaches
// `support` when the evidence is genuinely strong.

import type { Recommendation } from '../types'
import { isDangerousRule } from '../reco/rules'
import type { AgentStance } from './types'

export function qaChallenge(rec: Recommendation): AgentStance {
  const weaknesses: string[] = []
  const affected = rec.evidence.affectedUrls.length
  const evidenceCount = (rec.evidence.supportingElements?.length ?? 0) + rec.evidence.facts.length

  // 1. Low confidence in the finding itself.
  if (rec.confidence < 50) weaknesses.push(`low confidence (${rec.confidence})`)

  // 2. The engine already flagged it for human review.
  if (rec.needsHumanReview) weaknesses.push('engine flagged for human review')

  // 3. Thin evidence — a claim resting on very little.
  if (evidenceCount <= 1) weaknesses.push('thin supporting evidence')
  if (affected === 0) weaknesses.push('no affected URL recorded')

  // 4. A named failure mode — the finding itself admits how it could be wrong.
  const caveat = rec.explanation?.whatCouldMakeWrong?.trim()
  const hasSoftCaveat = !!caveat && /(may|might|could|unless|if the page|intentional|rarely)/i.test(caveat)

  // 5. Dangerous class — irreversibility raises the bar for evidence.
  const dangerous = isDangerousRule(rec.ruleId)
  if (dangerous) weaknesses.push('irreversible class (indexation/canonical/robots)')

  const assumptions = caveat ? [caveat] : []

  // Decide the position. QA is skeptical, but a finding's own honest caveat is
  // only disqualifying when confidence isn't already high — a strong, well-
  // evidenced finding that acknowledges a rare failure mode still passes.
  const strong = rec.confidence >= 80 && evidenceCount >= 2 && !dangerous
  let position: AgentStance['position']
  let note: string
  let confidence: number
  if (weaknesses.length >= 2 || (dangerous && rec.confidence < 80)) {
    position = 'concern'
    confidence = 85
    note = `Challenge: ${weaknesses.slice(0, 3).join('; ')}.`
  } else if (weaknesses.length === 1) {
    position = 'concern'
    confidence = 65
    note = `Watch: ${weaknesses[0]}.`
  } else if (strong) {
    position = 'support'
    confidence = 80
    note = caveat
      ? `Evidence is strong and low-risk; the acknowledged failure mode ("${caveat}") is unlikely. No material objection.`
      : 'Evidence is strong and the change is low-risk; no material objection.'
  } else if (hasSoftCaveat) {
    position = 'concern'
    confidence = 60
    note = `Watch: the finding admits a failure mode — ${caveat}.`
  } else {
    position = 'neutral'
    confidence = 60
    note = 'No strong objection, but evidence is only moderate.'
  }

  return {
    agentId: 'qa',
    position,
    confidence,
    evidence: [
      `confidence ${rec.confidence}`,
      `${affected} affected URL(s)`,
      `${evidenceCount} evidence item(s)`,
      dangerous ? 'dangerous rule class' : 'reversible change',
    ],
    assumptions,
    note,
  }
}
