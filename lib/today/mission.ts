// Daily command center logic — the "what should I do today" brain.
//
// Consumes the portfolio priorities (already computed, evidence-based) plus the
// user's available time, and produces:
//   - a portfolio-wide briefing (counts of what changed / needs attention)
//   - a single Portfolio Mission (the best use of time across all projects)
//   - priority buckets (Do First / Quick Wins / Strategic / Risks / Waiting /
//     Blocked) that re-shape as available time changes.
//
// Pure and deterministic. No fabrication: every mission traces back to a real
// project priority with real reasons; when there's nothing actionable it says
// so rather than inventing busywork.

import type { PortfolioPriority, PortfolioStatus } from '@/lib/portfolio/priority'

export type AvailableTime = '15m' | '30m' | '1h' | '2h' | 'half_day' | 'full_day'

export const AVAILABLE_TIME_MINUTES: Record<AvailableTime, number> = {
  '15m': 15, '30m': 30, '1h': 60, '2h': 120, 'half_day': 240, 'full_day': 480,
}

export interface PortfolioBriefing {
  projectCount: number
  needingAttention: number
  critical: number
  improving: number
  waitingForData: number
  stable: number
  opportunities: number
}

export interface PortfolioMissionData {
  projectId: string
  projectName: string
  domain: string
  status: PortfolioStatus
  headline: string
  whyThisFirst: string
  recommendedAction: string
  reasons: string[]
  missingData: string[]
}
export type PortfolioMission = PortfolioMissionData | null

export type BucketKey = 'do_first' | 'quick_wins' | 'strategic' | 'risks' | 'waiting' | 'blocked'

export interface BucketItem {
  projectId: string
  projectName: string
  domain: string
  status: PortfolioStatus
  headline: string
  action: string
}

export interface TodayPlan {
  briefing: PortfolioBriefing
  mission: PortfolioMission
  buckets: Record<BucketKey, BucketItem[]>
  availableTime: AvailableTime
}

interface PriorityWithProject extends PortfolioPriority {
  projectName: string
  domain: string
}

function briefingOf(priorities: PriorityWithProject[]): PortfolioBriefing {
  const count = (s: PortfolioStatus) => priorities.filter((p) => p.status === s).length
  return {
    projectCount: priorities.length,
    needingAttention: count('critical') + count('needs_attention'),
    critical: count('critical'),
    improving: count('improving'),
    waitingForData: count('waiting_for_data'),
    stable: count('stable') + count('no_action_needed'),
    opportunities: count('opportunity'),
  }
}

// How many buckets to surface for a given time budget. With 15 minutes you get
// exactly one thing to do; with a full day you get the whole shaped plan.
function bucketCapsFor(time: AvailableTime): { doFirst: number; quickWins: number; strategic: number; risks: number } {
  switch (time) {
    case '15m': return { doFirst: 1, quickWins: 0, strategic: 0, risks: 0 }
    case '30m': return { doFirst: 1, quickWins: 2, strategic: 0, risks: 1 }
    case '1h': return { doFirst: 1, quickWins: 3, strategic: 1, risks: 2 }
    case '2h': return { doFirst: 2, quickWins: 3, strategic: 2, risks: 2 }
    case 'half_day': return { doFirst: 3, quickWins: 4, strategic: 3, risks: 3 }
    case 'full_day': return { doFirst: 5, quickWins: 6, strategic: 5, risks: 4 }
  }
}

function toItem(p: PriorityWithProject): BucketItem {
  return { projectId: p.projectId, projectName: p.projectName, domain: p.domain, status: p.status, headline: p.headline, action: p.recommendedFocus }
}

export function buildTodayPlan(priorities: PriorityWithProject[], availableTime: AvailableTime = '1h'): TodayPlan {
  const sorted = [...priorities].sort((a, b) => b.score - a.score)
  const caps = bucketCapsFor(availableTime)

  // Classify each project into a bucket. "Quick win" = an opportunity or a
  // low-effort attention item; "strategic" = larger attention work; "risk" =
  // critical items you may not fix now but must watch.
  const critical = sorted.filter((p) => p.status === 'critical')
  const attention = sorted.filter((p) => p.status === 'needs_attention')
  const opportunity = sorted.filter((p) => p.status === 'opportunity')
  const waiting = sorted.filter((p) => p.status === 'waiting_for_data')
  const blocked = sorted.filter((p) => p.status === 'blocked')

  const doFirst = critical.slice(0, caps.doFirst)
  // Remaining criticals we can't tackle now become risks to watch.
  const remainingCritical = critical.slice(caps.doFirst)
  const risks = remainingCritical.slice(0, caps.risks)
  const quickWins = opportunity.slice(0, caps.quickWins)
  const strategic = attention.slice(0, caps.strategic)

  const buckets: Record<BucketKey, BucketItem[]> = {
    do_first: doFirst.map(toItem),
    quick_wins: quickWins.map(toItem),
    strategic: strategic.map(toItem),
    risks: risks.map(toItem),
    waiting: waiting.map(toItem),
    blocked: blocked.map(toItem),
  }

  // The Portfolio Mission is the single highest-scoring actionable project
  // (critical > attention > opportunity). Waiting/stable never become the
  // mission — there's nothing to act on.
  const missionSource = critical[0] ?? attention[0] ?? opportunity[0] ?? null
  const mission: PortfolioMission = missionSource
    ? {
        projectId: missionSource.projectId,
        projectName: missionSource.projectName,
        domain: missionSource.domain,
        status: missionSource.status,
        headline: missionSource.headline,
        whyThisFirst: missionSource.status === 'critical'
          ? 'It has the most urgent, highest-impact problem across your whole portfolio right now.'
          : missionSource.status === 'needs_attention'
            ? 'Nothing is on fire, so the biggest active decline is the best use of your time.'
            : 'No losses or fires anywhere — so the largest reachable gain is the best use of your time.',
        recommendedAction: missionSource.recommendedFocus,
        reasons: missionSource.reasons,
        missingData: missionSource.missingData,
      }
    : null

  return { briefing: briefingOf(sorted), mission, buckets, availableTime }
}
