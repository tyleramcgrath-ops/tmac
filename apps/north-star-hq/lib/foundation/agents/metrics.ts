// Success metrics (Phase F). Honest about what is derivable in-product. Agent
// agreement and consensus quality come straight from the coordination; human
// agreement / overrides / rollbacks come from the durable statuses. Precision is
// proxied from user-judged rejections; true false-negatives and recall need
// labeled ground truth we do not have, so they are reported as 'unknown' rather
// than fabricated.

import type { Recommendation, WpDeployment } from '../types'
import type { ConsensusStatus, RecommendationCoordination } from './types'

export interface ConsensusMetrics {
  totalRecommendations: number
  consensus: Record<ConsensusStatus, number>
  agentAgreementRate: number // agree / total
  disagreementRate: number // disagree / total (surfaced conflicts)
  humanRequiredRate: number
  consensusQuality: number // decisive verdicts (agree + human-required) / total
  humanAgreementRate: number | 'unknown' // accepted / (accepted+rejected)
  userOverrideRate: number
  verificationSuccessRate: number | 'unknown'
  falsePositiveProxy: number // rejected / total (user judged wrong)
  falseNegativeProxy: 'unknown' // requires labeled ground truth
  recall: 'unknown'
  precisionProxy: number // 1 - falsePositiveProxy
}

type Coordinated = Recommendation & { coordination?: RecommendationCoordination }

export function computeConsensusMetrics(recs: Coordinated[], deployments: WpDeployment[]): ConsensusMetrics {
  const total = recs.length
  const consensus: Record<ConsensusStatus, number> = { agree: 0, disagree: 0, 'needs-review': 0, 'human-required': 0 }
  for (const r of recs) if (r.coordination) consensus[r.coordination.consensus]++

  const accepted = recs.filter((r) => ['accepted', 'deployed', 'verified'].includes(r.status)).length
  const rejected = recs.filter((r) => ['rejected', 'dismissed'].includes(r.status)).length
  const overridden = recs.filter((r) => (r.history ?? []).some((h) => h.by && h.by !== 'system')).length

  const verified = deployments.filter((d) => d.status === 'verified').length
  const verifyFailed = deployments.filter((d) => d.status === 'verify_failed').length
  const verifyTotal = verified + verifyFailed

  const rate = (n: number) => (total ? Number((n / total).toFixed(3)) : 0)
  const falsePositiveProxy = rate(rejected)

  return {
    totalRecommendations: total,
    consensus,
    agentAgreementRate: rate(consensus.agree),
    disagreementRate: rate(consensus.disagree),
    humanRequiredRate: rate(consensus['human-required']),
    consensusQuality: rate(consensus.agree + consensus['human-required']),
    humanAgreementRate: accepted + rejected > 0 ? Number((accepted / (accepted + rejected)).toFixed(3)) : 'unknown',
    userOverrideRate: rate(overridden),
    verificationSuccessRate: verifyTotal > 0 ? Number((verified / verifyTotal).toFixed(3)) : 'unknown',
    falsePositiveProxy,
    falseNegativeProxy: 'unknown',
    recall: 'unknown',
    precisionProxy: Number((1 - falsePositiveProxy).toFixed(3)),
  }
}
