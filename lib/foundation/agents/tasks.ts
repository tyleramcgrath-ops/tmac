// Task Orchestrator (Phase F). Agents create tasks for each other. The canonical
// chain for every finding is: Scout discovers → owner analyzes → QA challenges →
// Strategist reprioritizes → Operator prepares deploy → Operator verifies →
// Learning records. Stages already performed during coordination are marked
// done; downstream stages open (or route to a human when consensus demands it).
// Deterministic — the ids are derived from the issueId so re-runs are stable.

import type { Recommendation } from '../types'
import { ownerForCategory } from './registry'
import type { AgentTask, ConsensusStatus } from './types'

export function buildTaskChain(rec: Recommendation, consensus: ConsensusStatus): AgentTask[] {
  const owner = ownerForCategory(rec.ruleCategory)
  const iid = rec.issueId
  const t = (n: number, fromAgent: AgentTask['fromAgent'], toAgent: AgentTask['toAgent'], kind: AgentTask['kind'], status: AgentTask['status'], note: string): AgentTask => ({
    id: `${iid}#${n}`, issueId: iid, fromAgent, toAgent, kind, status, note,
  })

  const deployed = rec.status === 'deployed' || rec.status === 'verified'
  const verified = rec.status === 'verified'
  const approved = ['accepted', 'deployed', 'verified'].includes(rec.status)

  const chain: AgentTask[] = [
    t(1, 'scout', owner, 'analyze', 'done', 'Facts gathered; hand off for domain analysis.'),
    t(2, owner, 'qa', 'challenge', 'done', 'Analysis complete; request adversarial review.'),
    t(3, 'qa', 'strategist', 'reprioritize', 'done', 'Challenge recorded; weigh business priority.'),
  ]

  // Where the chain goes next depends on consensus.
  if (consensus === 'human-required' || consensus === 'disagree' || consensus === 'needs-review') {
    chain.push(t(4, 'strategist', 'operator', 'human-review', approved ? 'done' : 'open', 'Consensus is not clean — a human must decide before deployment.'))
  } else {
    chain.push(t(4, 'strategist', 'operator', 'prepare-deploy', deployed ? 'done' : 'open', 'Agents agree — prepare a safe, reversible deployment for approval.'))
  }
  chain.push(t(5, 'operator', 'operator', 'verify', verified ? 'done' : 'open', 'After deploy, read back the live value to verify.'))
  chain.push(t(6, 'operator', 'strategist', 'record', verified ? 'done' : 'open', 'Record the outcome to agent memory for learning.'))
  return chain
}
