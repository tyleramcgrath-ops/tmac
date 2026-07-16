// Shared assembly of per-project portfolio signals from the database, so the
// /api/portfolio and /api/today endpoints compute priority from the exact same
// evidence. Kept server-only (takes a Prisma client) and separate from the pure
// scoring in priority.ts.

import type { ProjectSignals } from './priority'

export interface ProjectWithData {
  id: string
  name: string
  domain: string
  isFavorite: boolean
  updatedAt: Date
  audits: { startedAt: Date; siteScore: number; criticalCount: number; pageCount: number }[]
  keywords: { currentPosition: number | null; previousPosition: number | null; status: string }[]
}

export function signalsFromProject(p: ProjectWithData): ProjectSignals {
  const latestAudit = p.audits[0] ?? null
  let rankingLosses = 0, rankingGains = 0, lostKeywords = 0, pageTwoOpportunities = 0
  for (const k of p.keywords) {
    if (k.status === 'lost') lostKeywords++
    if (k.currentPosition !== null && k.previousPosition !== null) {
      const delta = k.previousPosition - k.currentPosition
      if (delta > 0) rankingGains++
      else if (delta < 0) rankingLosses++
    }
    if (k.currentPosition !== null && k.currentPosition >= 11 && k.currentPosition <= 20) pageTwoOpportunities++
  }
  const anyRankData = p.keywords.some((k) => k.currentPosition !== null)
  return {
    projectId: p.id,
    name: p.name,
    domain: p.domain,
    lastCrawlAt: latestAudit?.startedAt ?? null,
    lastRankCheckAt: anyRankData ? p.updatedAt : null,
    siteScore: latestAudit?.siteScore ?? null,
    criticalIssues: latestAudit?.criticalCount ?? 0,
    rankingLosses,
    rankingGains,
    moneyPageRankingLoss: false,
    lostKeywords,
    pageTwoOpportunities,
    failedDeployments: 0,
    failedVerifications: 0,
    pendingApprovals: 0,
    hasAudit: !!latestAudit,
    hasKeywords: p.keywords.length > 0,
  }
}

export const PORTFOLIO_PROJECT_SELECT = {
  id: true, name: true, domain: true, isFavorite: true, updatedAt: true,
  audits: {
    orderBy: { startedAt: 'desc' as const }, take: 1,
    select: { startedAt: true, siteScore: true, criticalCount: true, pageCount: true },
  },
  keywords: {
    select: { currentPosition: true, previousPosition: true, status: true },
  },
}
