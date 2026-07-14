// Insight Engine: generates morning briefing from GSC, GA4, crawl, competitor data

export interface DailyInsight {
  type: string // 'change', 'opportunity', 'alert', 'win'
  category: string // 'gsc', 'ga4', 'crawl', 'competitor', 'schema', 'technical'
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  metric?: string // e.g. "+250 clicks" or "-15% bounce rate"
  action?: string // what user should do
  pageUrl?: string // if relevant to specific page
}

export interface InsightSnapshot {
  date: string // ISO date
  insights: DailyInsight[]
  summary: {
    newIssues: number
    resolvedIssues: number
    trafficGain: number // estimated sessions gained
    trafficLoss: number // estimated sessions lost
    newPages: number // indexed
    removedPages: number
    competitorChanges: number
  }
}

export function generateInsights(
  yesterdayMetrics: {
    gsc?: { clicks: number; impressions: number; ctr: number }
    ga4?: { users: number; sessions: number; bounceRate: number; conversions: number }
    crawl?: { pageCount: number; issueCount: number }
  },
  todayMetrics: {
    gsc?: { clicks: number; impressions: number; ctr: number }
    ga4?: { users: number; sessions: number; bounceRate: number; conversions: number }
    crawl?: { pageCount: number; issueCount: number; newPages?: string[] }
  },
  previousAuditIssues: number,
  currentAuditIssues: number,
  competitorChanges: Array<{ type: string; count: number }>
): InsightSnapshot {
  const insights: DailyInsight[] = []
  const now = new Date().toISOString().split('T')[0]

  // ─────────────────────────────────────────────────────────────────────────────
  // GSC CHANGES
  // ─────────────────────────────────────────────────────────────────────────────

  if (yesterdayMetrics.gsc && todayMetrics.gsc) {
    const clickDiff = todayMetrics.gsc.clicks - yesterdayMetrics.gsc.clicks
    const impressionDiff = todayMetrics.gsc.impressions - yesterdayMetrics.gsc.impressions
    const ctrDiff = todayMetrics.gsc.ctr - yesterdayMetrics.gsc.ctr

    if (clickDiff > 50) {
      insights.push({
        type: 'change',
        category: 'gsc',
        priority: 'high',
        title: `+${clickDiff} clicks overnight`,
        description: `Search traffic jumped ${clickDiff} clicks (${((clickDiff / yesterdayMetrics.gsc.clicks) * 100).toFixed(0)}% increase). Check recent deployments or ranking changes.`,
        metric: `${todayMetrics.gsc.clicks} clicks`,
      })
    } else if (clickDiff < -50) {
      insights.push({
        type: 'alert',
        category: 'gsc',
        priority: 'critical',
        title: `Traffic drop: ${clickDiff} clicks lost`,
        description: `Search traffic fell ${Math.abs(clickDiff)} clicks overnight. Investigate recent changes, ranking drops, or indexing issues.`,
        metric: `${todayMetrics.gsc.clicks} clicks`,
        action: 'Check Search Console for ranking changes',
      })
    }

    if (ctrDiff > 0.5) {
      insights.push({
        type: 'win',
        category: 'gsc',
        priority: 'medium',
        title: `CTR improved to ${todayMetrics.gsc.ctr.toFixed(2)}%`,
        description: `Title/meta rewrites paying off. CTR up ${ctrDiff.toFixed(2)} percentage points.`,
        metric: `${todayMetrics.gsc.ctr.toFixed(2)}% CTR`,
      })
    }

    if (impressionDiff > 100) {
      insights.push({
        type: 'opportunity',
        category: 'gsc',
        priority: 'medium',
        title: `+${impressionDiff} new impressions`,
        description: `Search visibility growing. With improved CTR, could capture ${Math.round(impressionDiff * (todayMetrics.gsc.ctr / 100))} more clicks.`,
        metric: `${todayMetrics.gsc.impressions} impressions`,
      })
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GA4 CHANGES
  // ─────────────────────────────────────────────────────────────────────────────

  if (yesterdayMetrics.ga4 && todayMetrics.ga4) {
    const sessionDiff = todayMetrics.ga4.sessions - yesterdayMetrics.ga4.sessions
    const conversionDiff = todayMetrics.ga4.conversions - yesterdayMetrics.ga4.conversions
    const bounceDiff = todayMetrics.ga4.bounceRate - yesterdayMetrics.ga4.bounceRate

    if (sessionDiff > 100) {
      insights.push({
        type: 'change',
        category: 'ga4',
        priority: 'high',
        title: `+${sessionDiff} organic sessions`,
        description: `Organic traffic up ${sessionDiff} sessions. Likely from GSC ranking improvements.`,
        metric: `${todayMetrics.ga4.sessions} sessions`,
      })
    } else if (sessionDiff < -100) {
      insights.push({
        type: 'alert',
        category: 'ga4',
        priority: 'high',
        title: `Organic traffic dropped ${Math.abs(sessionDiff)} sessions`,
        description: `Check for ranking drops, indexing issues, or technical problems.`,
        metric: `${todayMetrics.ga4.sessions} sessions`,
      })
    }

    if (conversionDiff > 10) {
      insights.push({
        type: 'win',
        category: 'ga4',
        priority: 'high',
        title: `+${conversionDiff} conversions overnight`,
        description: `Conversion increase. Your optimizations are working.`,
        metric: `${todayMetrics.ga4.conversions} conversions`,
      })
    }

    if (bounceDiff < -0.1) {
      insights.push({
        type: 'win',
        category: 'ga4',
        priority: 'medium',
        title: `Bounce rate improved to ${(todayMetrics.ga4.bounceRate * 100).toFixed(0)}%`,
        description: `Users engaging more. Down ${Math.abs(bounceDiff * 100).toFixed(1)} points.`,
        metric: `${(todayMetrics.ga4.bounceRate * 100).toFixed(0)}% bounce rate`,
      })
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CRAWL & INDEXING
  // ─────────────────────────────────────────────────────────────────────────────

  if (yesterdayMetrics.crawl && todayMetrics.crawl) {
    const pageDiff = todayMetrics.crawl.pageCount - yesterdayMetrics.crawl.pageCount
    const issueDiff = todayMetrics.crawl.issueCount - previousAuditIssues

    if (todayMetrics.crawl.newPages && todayMetrics.crawl.newPages.length > 0) {
      insights.push({
        type: 'change',
        category: 'crawl',
        priority: 'medium',
        title: `${todayMetrics.crawl.newPages.length} new pages indexed`,
        description: `New content discovered and indexed overnight. Ensure all are in your sitemaps.`,
        metric: `${todayMetrics.crawl.newPages.length} pages`,
      })
    }

    if (pageDiff < -5) {
      insights.push({
        type: 'alert',
        category: 'crawl',
        priority: 'high',
        title: `${Math.abs(pageDiff)} pages removed from index`,
        description: 'Investigate why indexed pages are no longer crawlable.',
        metric: `${todayMetrics.crawl.pageCount} pages`,
        action: 'Check robots.txt, noindex tags, and redirects',
      })
    }

    if (issueDiff > 10) {
      insights.push({
        type: 'alert',
        category: 'crawl',
        priority: 'high',
        title: `+${issueDiff} new technical issues`,
        description: 'Site health degraded. Fix before rankings suffer.',
        metric: `${currentAuditIssues} issues`,
      })
    } else if (issueDiff < -5) {
      insights.push({
        type: 'win',
        category: 'crawl',
        priority: 'medium',
        title: `${Math.abs(issueDiff)} issues resolved`,
        description: 'Site health improving. Good work on fixes.',
        metric: `${currentAuditIssues} issues`,
      })
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // COMPETITOR ACTIVITY
  // ─────────────────────────────────────────────────────────────────────────────

  if (competitorChanges && competitorChanges.length > 0) {
    for (const change of competitorChanges) {
      if (change.type === 'new_pages' && change.count > 3) {
        insights.push({
          type: 'alert',
          category: 'competitor',
          priority: 'high',
          title: `Competitor added ${change.count} pages`,
          description: 'Competitor is expanding content. Review topics and consider similar coverage.',
          metric: `${change.count} new pages`,
        })
      }

      if (change.type === 'title_updates' && change.count > 5) {
        insights.push({
          type: 'change',
          category: 'competitor',
          priority: 'medium',
          title: `Competitor updated ${change.count} titles`,
          description: 'May indicate keyword strategy shift. Monitor their rankings.',
          metric: `${change.count} title changes`,
        })
      }

      if (change.type === 'schema_changes' && change.count > 2) {
        insights.push({
          type: 'opportunity',
          category: 'competitor',
          priority: 'medium',
          title: `Competitor improved schema on ${change.count} pages`,
          description: 'Check if they\'re targeting rich snippets you haven\'t captured.',
          metric: `${change.count} schema updates`,
        })
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SORT & SUMMARIZE
  // ─────────────────────────────────────────────────────────────────────────────

  const priorityScore = { critical: 4, high: 3, medium: 2, low: 1 }
  insights.sort(
    (a, b) =>
      (priorityScore[b.priority] || 0) - (priorityScore[a.priority] || 0)
  )

  const trafficGain = (todayMetrics.ga4?.sessions || 0) - (yesterdayMetrics.ga4?.sessions || 0)
  const trafficLoss = trafficGain < 0 ? Math.abs(trafficGain) : 0
  const newIssues = Math.max(0, currentAuditIssues - previousAuditIssues)
  const resolvedIssues = Math.max(0, previousAuditIssues - currentAuditIssues)

  return {
    date: now,
    insights,
    summary: {
      newIssues,
      resolvedIssues,
      trafficGain: Math.max(0, trafficGain),
      trafficLoss,
      newPages: todayMetrics.crawl?.newPages?.length || 0,
      removedPages: Math.max(
        0,
        (yesterdayMetrics.crawl?.pageCount || 0) - (todayMetrics.crawl?.pageCount || 0)
      ),
      competitorChanges: competitorChanges.reduce((sum, c) => sum + c.count, 0),
    },
  }
}
