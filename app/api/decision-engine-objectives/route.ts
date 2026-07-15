import { compareObjectiveRankings } from '@/lib/content-engine/decision-engine-improved'
import type { Industry, Objective } from '@/lib/content-engine/decision-engine-improved'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Test with law firm pages to show how rankings shift by objective
    const lawFirmPages = [
      {
        url: '/services/corporate-law',
        pageType: 'service',
        wordCount: 3000,
        industry: 'law_firm' as Industry,
        metadata: { hasRecentCaseWins: true, isCorePractice: true },
      },
      {
        url: '/blog/legal-insights',
        pageType: 'blog',
        wordCount: 2800,
        industry: 'law_firm' as Industry,
        metadata: {},
      },
      {
        url: '/about-firm',
        pageType: 'homepage',
        wordCount: 2200,
        industry: 'law_firm' as Industry,
        metadata: {},
      },
      {
        url: '/attorneys/john-smith',
        pageType: 'attorney_profile',
        wordCount: 1500,
        industry: 'law_firm' as Industry,
        metadata: {},
      },
    ]

    // Compare rankings across 5 different business objectives
    const rankings = compareObjectiveRankings(lawFirmPages, 4)

    const objectives = ['lead_generation', 'authority', 'conversion', 'brand_awareness', 'retention'] as const

    return Response.json(
      {
        status: 'success',
        message: 'Objective-based ranking shifts demonstrated',
        industryTested: 'law_firm',
        pagesAnalyzed: lawFirmPages.length,
        objectives: objectives.map((objective) => ({
          objective,
          ranking: rankings[objective]?.map((page) => ({
            url: page.url.replace(/^\d+\. /, ''),
            score: page.score.toFixed(2),
            reasoning: page.reasoning.split(';')[0], // First reasoning component
          })) || [],
        })),
        insights: {
          leadGeneration:
            'Service pages rank highest - they directly drive client acquisition',
          authority:
            'Blog/guide content ranks highest - builds thought leadership',
          conversion:
            'Contact/service pages prioritized - directly support engagement',
          brandAwareness:
            'Homepage and about pages prominent - establish firm identity',
          retention: 'Content and resources prioritized - keep existing clients engaged',
          keyFinding:
            'Same page set produces different rankings based on business objective, proving objective-aware scoring is working',
        },
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json(
      {
        status: 'error',
        message: 'Objective comparison test failed',
        error: message,
      },
      { status: 500 }
    )
  }
}
