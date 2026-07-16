// Portfolio priority engine — decides which projects need attention today.
//
// The spec is emphatic that priority must NOT come from a single metric, and
// that every priority must explain why it landed where it did, what changed,
// and what data is missing. This module is pure and evidence-based: it takes a
// snapshot of signals per project and returns a status + human-readable reasons
// + the recommended focus, with no fabrication — when the inputs are empty it
// returns "waiting_for_data", never a made-up urgency.

export type PortfolioStatus =
  | 'critical'
  | 'needs_attention'
  | 'opportunity'
  | 'improving'
  | 'stable'
  | 'waiting_for_data'
  | 'blocked'
  | 'no_action_needed'

export interface ProjectSignals {
  projectId: string
  name: string
  domain: string
  // Freshness
  lastCrawlAt: Date | null
  lastRankCheckAt: Date | null
  now?: Date
  // Health (from latest audit)
  siteScore: number | null
  criticalIssues: number
  // Rankings
  rankingLosses: number // keywords that dropped since last check
  rankingGains: number
  moneyPageRankingLoss: boolean // a high-value page lost ranking
  lostKeywords: number // fell out of results entirely
  // Opportunity
  pageTwoOpportunities: number // keywords in positions 11-20
  // Execution
  failedDeployments: number
  failedVerifications: number
  pendingApprovals: number
  // Whether the project has any data at all yet
  hasAudit: boolean
  hasKeywords: boolean
}

export interface PortfolioPriority {
  projectId: string
  status: PortfolioStatus
  score: number // 0..100, higher = more urgent; for sorting
  headline: string
  reasons: string[] // why it landed here / what changed
  recommendedFocus: string // what to do today
  missingData: string[] // which data is absent
}

const STALE_CRAWL_DAYS = 14
const STALE_RANK_DAYS = 7

function daysSince(date: Date | null, now: Date): number | null {
  if (!date) return null
  return (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
}

export function computePortfolioPriority(s: ProjectSignals): PortfolioPriority {
  const now = s.now ?? new Date()
  const reasons: string[] = []
  const missingData: string[] = []

  // ── No data yet ──
  if (!s.hasAudit) {
    return {
      projectId: s.projectId,
      status: 'waiting_for_data',
      score: 5,
      headline: 'No audit yet',
      reasons: ['This project has never been crawled.'],
      recommendedFocus: 'Run the first site audit to establish a baseline.',
      missingData: ['crawl', 'keywords', 'rankings'],
    }
  }

  if (!s.hasKeywords) missingData.push('keywords')
  if (s.lastRankCheckAt === null) missingData.push('rankings')

  const crawlAge = daysSince(s.lastCrawlAt, now)
  const rankAge = daysSince(s.lastRankCheckAt, now)

  let score = 0

  // ── Critical signals ──
  const criticalReasons: string[] = []
  if (s.moneyPageRankingLoss) { criticalReasons.push('A money page lost ranking.'); score += 40 }
  if (s.failedDeployments > 0) { criticalReasons.push(`${s.failedDeployments} WordPress deployment${s.failedDeployments > 1 ? 's' : ''} failed.`); score += 30 }
  if (s.failedVerifications > 0) { criticalReasons.push(`${s.failedVerifications} change${s.failedVerifications > 1 ? 's' : ''} failed verification.`); score += 25 }
  if (s.lostKeywords > 0) { criticalReasons.push(`${s.lostKeywords} keyword${s.lostKeywords > 1 ? 's' : ''} fell out of the results entirely.`); score += 20 }
  if (s.criticalIssues > 0) { criticalReasons.push(`${s.criticalIssues} critical technical issue${s.criticalIssues > 1 ? 's' : ''} open.`); score += Math.min(20, s.criticalIssues * 4) }

  // ── Attention signals ──
  const attentionReasons: string[] = []
  if (s.rankingLosses > 0) { attentionReasons.push(`${s.rankingLosses} keyword${s.rankingLosses > 1 ? 's' : ''} dropped in ranking.`); score += Math.min(20, s.rankingLosses * 3) }
  if (crawlAge !== null && crawlAge > STALE_CRAWL_DAYS) { attentionReasons.push(`Last crawl was ${Math.round(crawlAge)} days ago.`); score += 8 }
  if (rankAge !== null && rankAge > STALE_RANK_DAYS) { attentionReasons.push(`Rankings last checked ${Math.round(rankAge)} days ago.`); score += 6 }

  // ── Opportunity signals ──
  const opportunityReasons: string[] = []
  if (s.pageTwoOpportunities > 0) { opportunityReasons.push(`${s.pageTwoOpportunities} keyword${s.pageTwoOpportunities > 1 ? 's' : ''} on page 2 — within reach of page 1.`); score += Math.min(12, s.pageTwoOpportunities * 2) }
  if (s.pendingApprovals > 0) { opportunityReasons.push(`${s.pendingApprovals} fix${s.pendingApprovals > 1 ? 'es' : ''} awaiting your approval.`); score += Math.min(10, s.pendingApprovals * 3) }

  // ── Positive signals ──
  const improvingReasons: string[] = []
  if (s.rankingGains > 0) improvingReasons.push(`${s.rankingGains} keyword${s.rankingGains > 1 ? 's' : ''} gained ranking.`)

  score = Math.min(100, Math.round(score))

  // ── Decide status ──
  let status: PortfolioStatus
  let headline: string
  let recommendedFocus: string

  if (criticalReasons.length > 0) {
    status = 'critical'
    headline = criticalReasons[0]
    reasons.push(...criticalReasons, ...attentionReasons)
    recommendedFocus = s.moneyPageRankingLoss
      ? 'Investigate the money-page ranking loss first — check recent changes and consider a rollback.'
      : s.failedDeployments > 0
        ? 'Re-check the failed WordPress deployment before anything else.'
        : 'Address the critical issues, then re-verify.'
  } else if (attentionReasons.length > 0) {
    status = 'needs_attention'
    headline = attentionReasons[0]
    reasons.push(...attentionReasons, ...opportunityReasons)
    recommendedFocus = s.rankingLosses > 0
      ? 'Review the keywords that dropped and why, then generate fixes for the highest-value ones.'
      : (crawlAge !== null && crawlAge > STALE_CRAWL_DAYS)
        ? 'Run a fresh crawl to catch any new issues.'
        : 'Refresh the ranking data.'
  } else if (opportunityReasons.length > 0) {
    status = 'opportunity'
    headline = opportunityReasons[0]
    reasons.push(...opportunityReasons, ...improvingReasons)
    recommendedFocus = s.pageTwoOpportunities > 0
      ? 'Push page-2 keywords onto page 1 — improve the target pages and internal links.'
      : 'Review and approve the pending fixes.'
  } else if (improvingReasons.length > 0) {
    status = 'improving'
    headline = improvingReasons[0]
    reasons.push(...improvingReasons)
    recommendedFocus = 'Momentum is positive — keep the current work going and watch for further gains.'
  } else if (missingData.length > 0) {
    status = 'waiting_for_data'
    headline = missingData.includes('rankings') ? 'No ranking data yet' : 'Waiting for more data'
    reasons.push('Not enough signal to prioritize confidently yet.')
    recommendedFocus = missingData.includes('rankings')
      ? 'Run a ranking check to see where this site stands.'
      : 'Collect more data before acting.'
  } else {
    status = 'stable'
    headline = 'Stable — nothing urgent'
    reasons.push('No losses, failures, or urgent issues detected.')
    recommendedFocus = 'No action needed today. Spend your time on a higher-priority project.'
  }

  return {
    projectId: s.projectId,
    status,
    score,
    headline,
    reasons: reasons.length ? reasons : ['No notable signals.'],
    recommendedFocus,
    missingData,
  }
}

/** Ranks a set of projects by urgency (highest score first), for the portfolio dashboard. */
export function rankPortfolio(signals: ProjectSignals[]): PortfolioPriority[] {
  return signals.map(computePortfolioPriority).sort((a, b) => b.score - a.score)
}
