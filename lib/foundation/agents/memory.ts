// Agent Memory (Phase F). Each agent remembers what happened to the findings it
// owned — acceptances, rejections (its mistakes), user overrides, rollbacks —
// and derives a bounded confidence nudge so it does not repeat the same mistake.
// Derived deterministically from the durable recommendation history + WordPress
// deployments already stored (no ML, no hidden state), grouped by the agent that
// primarily owns each rule category.

import type { Recommendation, WpDeployment } from '../types'
import { ownerForCategory } from './registry'
import type { AgentId, AgentMemory } from './types'

function blank(agentId: AgentId): AgentMemory {
  return {
    agentId, totalOwned: 0, accepted: 0, rejected: 0, overridden: 0, verified: 0, rolledBack: 0,
    reliability: 0, suggestedConfidenceNudge: 0, lessons: [],
  }
}

export function deriveAgentMemory(recs: Recommendation[], deployments: WpDeployment[]): AgentMemory[] {
  const byAgent = new Map<AgentId, AgentMemory>()
  const get = (id: AgentId) => byAgent.get(id) ?? byAgent.set(id, blank(id)).get(id)!
  const depByRec = new Map<string, WpDeployment[]>()
  for (const d of deployments) {
    if (!d.recommendationId) continue
    const arr = depByRec.get(d.recommendationId) ?? []
    arr.push(d)
    depByRec.set(d.recommendationId, arr)
  }

  for (const rec of recs) {
    const m = get(ownerForCategory(rec.ruleCategory))
    m.totalOwned++
    if (['accepted', 'deployed', 'verified'].includes(rec.status)) m.accepted++
    if (['rejected', 'dismissed'].includes(rec.status)) m.rejected++
    if (rec.status === 'verified') m.verified++
    if (rec.status === 'rolled_back') m.rolledBack++
    // An override = a human moved this away from the agent's proposal after the
    // fact (any non-system status transition in its history).
    if ((rec.history ?? []).some((h) => h.by && h.by !== 'system')) m.overridden++
    // Deployment-derived rollbacks/verifications for this rec.
    for (const d of depByRec.get(rec.id) ?? []) {
      if (d.status === 'rolled_back') m.rolledBack++
      if (d.status === 'verified') m.verified++
    }
  }

  for (const m of byAgent.values()) {
    const t = Math.max(1, m.totalOwned)
    m.reliability = Number(((m.accepted + m.verified) / (2 * t)).toFixed(3))
    const acceptRate = m.accepted / t
    const rejectRate = m.rejected / t
    const rollbackRate = m.rolledBack / t
    m.suggestedConfidenceNudge = Math.max(
      -0.15,
      Math.min(0.15, Number((0.15 * (acceptRate - rejectRate - rollbackRate)).toFixed(3)))
    )
    if (m.rolledBack > 0) m.lessons.push(`${m.rolledBack} owned change(s) were rolled back — tighten evidence before deploying this class.`)
    if (m.rejected > m.accepted && m.totalOwned >= 3) m.lessons.push(`More rejected than accepted (${m.rejected} vs ${m.accepted}) — recalibrate confidence downward.`)
    if (m.overridden > 0) m.lessons.push(`${m.overridden} finding(s) were overridden by a human — study those cases.`)
    if (m.lessons.length === 0) m.lessons.push('No mistakes recorded yet.')
  }

  return [...byAgent.values()].sort((a, b) => b.totalOwned - a.totalOwned)
}
