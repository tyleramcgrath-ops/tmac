// Data fusion recommendation engine
// Merges GSC, GA4, crawl, internal links, schema into prioritized actions

export interface DataSources {
  gsc: {
    clicks: number
    impressions: number
    ctr: number
    position: number
    topQueries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>
  } | null
  ga4: {
    users: number
    sessions: number
    engagementRate: number
    bounceRate: number
    avgSessionDuration: number
    conversions: number
    conversionRate: number
    revenue: number
  } | null
  crawl: {
    title: string | null
    metaDescription: string | null
    status: number
    contentLength: number
    technicalScore: number
    contentScore: number
    schemaScore: number
    aiScore: number
    issueCount: number
    hasNoindex: boolean
  } | null
}

export interface Recommendation {
  id: string
  type: string // 'title', 'meta', 'schema', 'technical', 'content', 'internal_links', 'performance'
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  why: string // explanation grounded in data
  impact: {
    traffic?: number // estimated sessions gained
    revenue?: number // estimated $ gained
    pageHealthScore?: number // estimated score improvement 0-100
  }
  action: {
    type: string // 'generate_title', 'generate_meta', 'add_schema', 'fix_technical', etc.
    data?: Record<string, unknown> // specific data for the action
  }
  confidence: number // 0-100
}

export function generateRecommendations(
  url: string,
  data: DataSources,
  valuePerVisit: number = 0
): Recommendation[] {
  const recs: Recommendation[] = []
  const id = url.split('/').pop() || 'page'

  // ─────────────────────────────────────────────────────────────────────────────
  // TITLE OPTIMIZATION
  // ─────────────────────────────────────────────────────────────────────────────

  if (data.gsc && data.gsc.impressions > 50) {
    // Has search visibility but low CTR
    if (data.gsc.ctr < 2 && !data.crawl?.title) {
      recs.push({
        id: `${id}-no-title`,
        type: 'title',
        priority: 'critical',
        title: 'Add missing title tag',
        description: `Page has ${data.gsc.impressions.toLocaleString()} impressions with no title tag. CTR is suffering.`,
        why: `${data.gsc.impressions.toLocaleString()} search impressions prove demand. Without a title tag, CTR should be 0% but it's ${data.gsc.ctr.toFixed(1)}%. This is likely from URL snippets.`,
        impact: {
          traffic: Math.round(data.gsc.impressions * Math.max(0.05, (data.gsc.ctr + 3) / 100)),
          pageHealthScore: 15,
        },
        action: {
          type: 'generate_title',
          data: {
            currentTitle: data.crawl?.title,
            impressions: data.gsc.impressions,
            topQueries: data.gsc.topQueries.slice(0, 3),
          },
        },
        confidence: 95,
      })
    } else if (data.gsc.ctr < 1.5 && data.crawl?.title && data.crawl.title.length < 30) {
      recs.push({
        id: `${id}-short-title`,
        type: 'title',
        priority: 'high',
        title: 'Title tag is too short',
        description: `"${data.crawl.title}" (${data.crawl.title.length} chars) is too short. Optimal is 50-60 chars.`,
        why: `Short titles waste SERP real estate. You have ${data.gsc.impressions.toLocaleString()} impressions. A compelling 50-60 char title could lift CTR from ${data.gsc.ctr.toFixed(1)}% to 3-5%.`,
        impact: {
          traffic: Math.round(data.gsc.impressions * 0.03),
          pageHealthScore: 10,
        },
        action: {
          type: 'generate_title',
          data: {
            currentTitle: data.crawl.title,
            impressions: data.gsc.impressions,
            topQueries: data.gsc.topQueries.slice(0, 3),
          },
        },
        confidence: 85,
      })
    } else if (data.gsc.ctr < 2.5 && data.crawl?.title) {
      recs.push({
        id: `${id}-improve-title`,
        type: 'title',
        priority: 'high',
        title: 'Improve title for CTR',
        description: `CTR is ${data.gsc.ctr.toFixed(1)}%, below average of 3-5%. Rewrite title to be more compelling.`,
        why: `${data.gsc.impressions.toLocaleString()} impressions × ${(data.gsc.ctr + 2) / 100} new CTR = ${Math.round(data.gsc.impressions * ((data.gsc.ctr + 2) / 100))} clicks. Conservative estimate.`,
        impact: {
          traffic: Math.round(data.gsc.impressions * 0.02),
          pageHealthScore: 8,
        },
        action: {
          type: 'generate_title',
          data: {
            currentTitle: data.crawl.title,
            impressions: data.gsc.impressions,
            topQueries: data.gsc.topQueries.slice(0, 3),
          },
        },
        confidence: 75,
      })
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // META DESCRIPTION OPTIMIZATION
  // ─────────────────────────────────────────────────────────────────────────────

  if (data.gsc && data.gsc.impressions > 50) {
    if (!data.crawl?.metaDescription) {
      recs.push({
        id: `${id}-no-meta`,
        type: 'meta',
        priority: 'high',
        title: 'Add missing meta description',
        description: `Page has ${data.gsc.impressions.toLocaleString()} impressions but no meta description. Google will auto-generate it.`,
        why: 'Without a meta description, Google renders the first matching text snippet. A crafted meta with CTA lifts CTR 5-10% on average.',
        impact: {
          traffic: Math.round(data.gsc.impressions * 0.05),
          pageHealthScore: 10,
        },
        action: {
          type: 'generate_meta',
          data: {
            currentMeta: data.crawl?.metaDescription,
            impressions: data.gsc.impressions,
            topQueries: data.gsc.topQueries.slice(0, 3),
          },
        },
        confidence: 88,
      })
    } else if (data.crawl.metaDescription.length < 120) {
      recs.push({
        id: `${id}-short-meta`,
        type: 'meta',
        priority: 'medium',
        title: 'Meta description is too short',
        description: `${data.crawl.metaDescription.length} chars < 120. Google may truncate on mobile.`,
        why: 'Mobile users see 120 chars; desktop sees 155+. A full meta with CTA has higher CTR.',
        impact: {
          traffic: Math.round(data.gsc.impressions * 0.02),
          pageHealthScore: 5,
        },
        action: {
          type: 'generate_meta',
          data: {
            currentMeta: data.crawl.metaDescription,
            impressions: data.gsc.impressions,
          },
        },
        confidence: 70,
      })
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RANKING IMPROVEMENT (Top 10 push)
  // ─────────────────────────────────────────────────────────────────────────────

  if (data.gsc && data.gsc.position > 10 && data.gsc.position < 50) {
    const positionImprovement = Math.max(0.05, 0.15 * (1 - (data.gsc.position - 10) / 40))
    const trafficGain = Math.round(data.gsc.impressions * positionImprovement)

    recs.push({
      id: `${id}-top10-push`,
      type: 'ranking',
      priority: 'high',
      title: `Ranking #${Math.round(data.gsc.position)}, near Top 10`,
      description: `Small improvements could move this to Top 10 rankings, gaining ${trafficGain.toLocaleString()} more clicks/month.`,
      why: `Top 10 average CTR is 4-6%. Your rank #${Math.round(data.gsc.position)} has ${data.gsc.ctr.toFixed(1)}% CTR. Improve content relevance, add schema, strengthen internal links.`,
      impact: {
        traffic: trafficGain,
        pageHealthScore: 12,
      },
      action: {
        type: 'improve_ranking',
        data: {
          currentPosition: data.gsc.position,
          targetPosition: 5,
          actions: [
            'Improve content depth and relevance',
            'Add schema markup relevant to top queries',
            'Build 3-5 internal links from high-authority pages',
          ],
        },
      },
      confidence: 78,
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCHEMA & AI READINESS
  // ─────────────────────────────────────────────────────────────────────────────

  if (data.crawl && data.crawl.schemaScore < 70 && (data.gsc?.impressions || data.ga4?.sessions)) {
    recs.push({
      id: `${id}-schema`,
      type: 'schema',
      priority: 'high',
      title: 'Add schema markup for AI citations',
      description: `Low schema score (${data.crawl.schemaScore}/100). Add schema for AI visibility and rich snippets.`,
      why: 'Schema increases CTR 20-30% (rich snippets). AI tools (ChatGPT, Perplexity) cite schema-marked content first.',
      impact: {
        traffic: Math.round((data.gsc?.impressions || data.ga4?.sessions || 0) * 0.15),
        pageHealthScore: 20,
      },
      action: {
        type: 'add_schema',
        data: {
          currentScore: data.crawl.schemaScore,
          targetScore: 90,
        },
      },
      confidence: 82,
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TECHNICAL ISSUES
  // ─────────────────────────────────────────────────────────────────────────────

  if (data.crawl && data.crawl.technicalScore < 60 && (data.ga4?.sessions || data.gsc?.clicks)) {
    recs.push({
      id: `${id}-technical`,
      type: 'technical',
      priority: 'critical',
      title: 'Fix technical issues on high-traffic page',
      description: `This page gets traffic (${data.ga4?.sessions || 0} sessions / ${data.gsc?.clicks || 0} clicks) but has technical score ${data.crawl.technicalScore}/100.`,
      why: 'Technical issues hurt ranking potential. Fix these to protect and improve rankings.',
      impact: {
        traffic: Math.round((data.ga4?.sessions || data.gsc?.clicks || 100) * 0.1),
        pageHealthScore: 25,
      },
      action: {
        type: 'fix_technical',
        data: {
          currentScore: data.crawl.technicalScore,
          issueCount: data.crawl.issueCount,
        },
      },
      confidence: 88,
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CONVERSION OPTIMIZATION
  // ─────────────────────────────────────────────────────────────────────────────

  if (data.ga4 && data.ga4.sessions > 100 && data.ga4.conversionRate < 0.01 && valuePerVisit > 0) {
    const potentialRevenue = data.ga4.sessions * 0.02 * valuePerVisit
    const currentRevenue = data.ga4.revenue
    const delta = potentialRevenue - currentRevenue

    if (delta > 500) {
      recs.push({
        id: `${id}-conversion`,
        type: 'conversion',
        priority: 'critical',
        title: `$${Math.round(delta / 30)}/day revenue opportunity`,
        description: `${data.ga4.sessions} monthly sessions, ${(data.ga4.conversionRate * 100).toFixed(2)}% conversion. Reach 2% conversion = $${Math.round(delta)}/month.`,
        why: `${data.ga4.sessions} sessions × 2% conversion × $${valuePerVisit}/visit = $${Math.round(data.ga4.sessions * 0.02 * valuePerVisit)}/month potential.`,
        impact: {
          revenue: delta,
        },
        action: {
          type: 'optimize_conversion',
          data: {
            currentSessions: data.ga4.sessions,
            currentConversionRate: data.ga4.conversionRate,
            targetConversionRate: 0.02,
          },
        },
        confidence: 75,
      })
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ENGAGEMENT & UX
  // ─────────────────────────────────────────────────────────────────────────────

  if (data.ga4 && data.ga4.sessions > 50) {
    if (data.ga4.bounceRate > 0.7) {
      recs.push({
        id: `${id}-bounce`,
        type: 'engagement',
        priority: 'high',
        title: `Bounce rate ${(data.ga4.bounceRate * 100).toFixed(0)}% — above average`,
        description: 'Visitors leave immediately. Check: page relevance, load time, content quality, mobile UX.',
        why: `High bounce signals poor match between intent and content, or page performance issues. Improve by 10% = ${Math.round(data.ga4.sessions * 0.1)} saved sessions.`,
        impact: {
          traffic: Math.round(data.ga4.sessions * 0.1),
        },
        action: {
          type: 'reduce_bounce',
          data: {
            currentBounceRate: data.ga4.bounceRate,
            targetBounceRate: Math.max(0.3, data.ga4.bounceRate - 0.2),
          },
        },
        confidence: 72,
      })
    } else if (data.ga4.engagementRate < 0.2) {
      recs.push({
        id: `${id}-engagement`,
        type: 'engagement',
        priority: 'medium',
        title: 'Low engagement rate',
        description: 'Visitors land but don\'t engage. Add internal links, CTAs, related content.',
        why: 'Engagement signals content quality to Google. Improve engagement = higher rankings.',
        impact: {
          traffic: Math.round((data.ga4.sessions || 100) * 0.05),
        },
        action: {
          type: 'improve_engagement',
        },
        confidence: 68,
      })
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SORT BY PRIORITY & IMPACT
  // ─────────────────────────────────────────────────────────────────────────────

  const priorityScore = { critical: 4, high: 3, medium: 2, low: 1 }
  recs.sort((a, b) => {
    const impactA = (a.impact.revenue || a.impact.traffic || 0) * (priorityScore[a.priority] || 0)
    const impactB = (b.impact.revenue || b.impact.traffic || 0) * (priorityScore[b.priority] || 0)
    return impactB - impactA
  })

  return recs
}
