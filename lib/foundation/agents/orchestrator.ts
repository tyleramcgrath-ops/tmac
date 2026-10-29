// Agent Orchestrator (Phase F). Runs the specialized agents over the ONE set of
// recommendations produced by the D.6 issue-evaluation pipeline and synthesizes
// a coordinated view: every recommendation gains a set of agent stances, a
// consensus verdict, surfaced disagreements, and a full provenance chain. It
// also produces per-agent reports (with honest limitations), the inter-agent
// task chain, per-agent memory, and success metrics.
//
// It NEVER re-runs rules or invents findings — it coordinates over the existing
// findings, which is what keeps the "single source of truth" guarantee intact.

import type { Recommendation, WpDeployment } from '../types'
import { ownerForCategory, AGENTS, MONEY_PAGE_TYPES } from './registry'
import { computeConsensus } from './consensus'
import { qaChallenge } from './qa'
import { croStance, localStance, ownerStance, scoutStance, strategistStance, type AgentContext } from './stances'
import { buildTaskChain } from './tasks'
import { deriveAgentMemory } from './memory'
import { computeConsensusMetrics, type ConsensusMetrics } from './metrics'
import type { AgentId, AgentMemory, AgentReport, AgentStance, AgentTask, Provenance, RecommendationCoordination } from './types'

export type CoordinatedRecommendation = Recommendation & { coordination: RecommendationCoordination }

export interface CoordinationResult {
  coordinated: CoordinatedRecommendation[]
  reports: AgentReport[]
  tasks: AgentTask[]
  memory: AgentMemory[]
  metrics: ConsensusMetrics
}

function provenanceFor(rec: Recommendation, deps: WpDeployment[]): Provenance {
  let approvedBy: string | null = null
  for (const h of rec.history ?? []) {
    if (['accepted', 'modified', 'deployed', 'verified'].includes(h.to) && h.by && h.by !== 'system') approvedBy = h.by
  }
  return {
    discoveredBy: 'scout',
    analyzedBy: ownerForCategory(rec.ruleCategory),
    challengedBy: 'qa',
    prioritizedBy: 'strategist',
    approvedBy,
    deployedBy: deps.length > 0 ? 'operator' : null,
    verifiedBy: deps.some((d) => d.status === 'verified') ? 'operator' : null,
  }
}

export function coordinate(
  recs: Recommendation[],
  deployments: WpDeployment[],
  ctx: AgentContext
): CoordinationResult {
  const depByRec = new Map<string, WpDeployment[]>()
  for (const d of deployments) {
    if (!d.recommendationId) continue
    depByRec.set(d.recommendationId, [...(depByRec.get(d.recommendationId) ?? []), d])
  }

  const coordinated: CoordinatedRecommendation[] = []
  const tasks: AgentTask[] = []
  const ownedCount = new Map<AgentId, number>()
  const contribCount = new Map<AgentId, number>()
  const bump = (m: Map<AgentId, number>, id: AgentId) => m.set(id, (m.get(id) ?? 0) + 1)

  for (const rec of recs) {
    const owner = ownerForCategory(rec.ruleCategory)
    bump(ownedCount, owner)

    const stances: AgentStance[] = [scoutStance(rec), ownerStance(rec), strategistStance(rec)]
    const cro = croStance(rec)
    if (cro) { stances.push(cro); bump(contribCount, 'cro') }
    const local = localStance(rec, ctx)
    if (local) { stances.push(local); bump(contribCount, 'local') }
    stances.push(qaChallenge(rec))

    const consensus = computeConsensus(rec, stances)
    const coordination: RecommendationCoordination = {
      primaryOwner: owner,
      stances,
      consensus: consensus.status,
      consensusReason: consensus.reason,
      provenance: provenanceFor(rec, depByRec.get(rec.id) ?? []),
      disagreements: consensus.disagreements,
    }
    coordinated.push({ ...rec, coordination })
    tasks.push(...buildTaskChain(rec, consensus.status))
  }

  const memory = deriveAgentMemory(recs, deployments)
  const metrics = computeConsensusMetrics(coordinated, deployments)
  const reports = buildReports(coordinated, ctx, ownedCount, contribCount)

  return { coordinated, reports, tasks, memory, metrics }
}

function buildReports(
  coordinated: CoordinatedRecommendation[],
  ctx: AgentContext,
  owned: Map<AgentId, number>,
  contrib: Map<AgentId, number>
): AgentReport[] {
  const total = coordinated.length
  const moneyFindings = coordinated.filter(
    (r) => r.businessContext === 'money-page' || MONEY_PAGE_TYPES.has(r.pageType ?? '')
  )
  const localFindings = coordinated.filter((r) => ['location', 'contact'].includes(r.pageType ?? ''))
  const concernsRaised = coordinated.filter((r) => r.coordination.disagreements.length > 0).length
  const totalEvidence = coordinated.reduce((n, r) => n + r.evidence.facts.length + (r.evidence.supportingElements?.length ?? 0), 0)

  const report = (agentId: AgentId, active: boolean, ownedFindings: number, observations: AgentReport['observations'], summary: string): AgentReport =>
    ({ agentId, name: AGENTS[agentId].name, active, ownedFindings, observations, summary })

  return [
    report('scout', true, 0, [
      { agentId: 'scout', kind: 'note', title: 'Evidence gathered', detail: `${totalEvidence} facts across ${total} findings.`, evidenceUrls: [], confidence: 95 },
    ], `Crawled the site and gathered ${totalEvidence} verifiable facts. Reports facts only — no prioritization.`),

    report('strategist', true, 0, [
      { agentId: 'strategist', kind: 'note', title: 'Priority split', detail: `${moneyFindings.length} findings on money pages, ${total - moneyFindings.length} elsewhere.`, evidenceUrls: [], confidence: 75 },
    ], `Ranked ${total} findings by business value; money pages weighted above utility pages.`),

    report('technical', (owned.get('technical') ?? 0) > 0, owned.get('technical') ?? 0, [],
      `Owns ${owned.get('technical') ?? 0} technical/indexability/schema findings.`),

    report('content', (owned.get('content') ?? 0) > 0, owned.get('content') ?? 0, [],
      `Owns ${owned.get('content') ?? 0} content/internal-link findings.`),

    report('local', ctx.local, 0, ctx.local
      ? [{ agentId: 'local', kind: 'opportunity', title: 'Local pages in scope', detail: `${localFindings.length} finding(s) on location/contact pages; local-pack correctness matters here.`, evidenceUrls: localFindings.flatMap((r) => r.evidence.affectedUrls).slice(0, 5), confidence: 70 }]
      : [{ agentId: 'local', kind: 'limitation', title: 'Standing down', detail: 'This project does not read as a local business — Local SEO is inactive to avoid irrelevant advice.', evidenceUrls: [], confidence: 'unknown' }],
      ctx.local ? `Active: weighed in on ${localFindings.length} local-intent findings.` : 'Inactive: not a local business.'),

    report('authority', true, 0, [
      { agentId: 'authority', kind: 'limitation', title: 'Off-site authority not assessed', detail: 'RankForge has no external backlink / brand-mention data source in this environment. Backlink profile, referring domains, and authority gaps are UNKNOWN — not estimated.', evidenceUrls: [], confidence: 'unknown' },
      { agentId: 'authority', kind: 'opportunity', title: 'On-site linkable-asset candidates', detail: `${moneyFindings.length} money page(s) are the strongest linkable assets to strengthen first; off-site outreach requires a backlink data source.`, evidenceUrls: moneyFindings.flatMap((r) => r.evidence.affectedUrls).slice(0, 5), confidence: 40 },
    ], 'Reports honestly: off-site authority is unknown without external data; identifies on-site linkable assets only.'),

    report('cro', (contrib.get('cro') ?? 0) > 0, 0, [
      { agentId: 'cro', kind: 'opportunity', title: 'Conversion-relevant findings', detail: `Weighed in on ${contrib.get('cro') ?? 0} finding(s) on money/landing pages.`, evidenceUrls: moneyFindings.flatMap((r) => r.evidence.affectedUrls).slice(0, 5), confidence: 65 },
    ], `Contributed a conversion perspective on ${contrib.get('cro') ?? 0} money-page findings.`),

    report('qa', true, 0, [
      { agentId: 'qa', kind: 'note', title: 'Challenges raised', detail: `Raised a concern that produced surfaced disagreement on ${concernsRaised} finding(s).`, evidenceUrls: [], confidence: 85 },
    ], `Challenged every finding; ${concernsRaised} produced a surfaced disagreement for human attention.`),

    report('operator', true, 0, [], 'Ready to deploy only agreed, human-approved work; verifies by read-back and can roll back. Invents nothing.'),
  ]
}
