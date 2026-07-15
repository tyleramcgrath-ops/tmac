import { getPrismaClient } from '@/lib/db'
import { scorePageForObjective, rankPagesForObjective } from '@/lib/content-engine/decision-engine-improved'
import type { Page } from '@prisma/client'

export async function calculateDecisionEngine(
  pages: Page[],
  context: { organizationId: string; projectId: string; auditId: string },
) {
  const prisma = getPrismaClient()
  let pagesScored = 0

  try {
    // Get business profile to determine industry
    const businessProfile = await prisma.businessProfile.findFirst({
      where: { projectId: context.projectId },
    })

    const industry = (businessProfile?.industry || 'saas') as any

    // Score each page for different objectives
    const objectives = ['lead_generation', 'authority', 'conversion', 'brand_awareness', 'retention']

    for (const page of pages) {
      try {
        // Get page metrics for Decision Engine
        const metrics = await prisma.contentMetrics.findUnique({
          where: { projectId_pageUrl: { projectId: context.projectId, pageUrl: page.url } },
        })

        const classification = await prisma.pageClassification.findUnique({
          where: {
            projectId_pageUrl: { projectId: context.projectId, pageUrl: page.url },
          },
        })

        // Prepare page data for scoring
        const pageData = {
          url: page.url,
          pageType: classification?.primaryClassification || 'informational',
          wordCount: page.contentLength,
          industry,
          metadata: {
            hasSchema: page.schemaTypes ? JSON.parse(page.schemaTypes).length > 0 : false,
            internalLinks: page.internalLinks,
            inboundCount: page.inboundCount,
          },
        }

        // Score for each objective
        for (const objective of objectives) {
          try {
            const score = scorePageForObjective(pageData, objective as any)

            await prisma.recommendationDecision.upsert({
              where: {
                projectId_pageUrl_recommendationType: {
                  projectId: context.projectId,
                  pageUrl: page.url,
                  recommendationType: objective,
                },
              },
              create: {
                organizationId: context.organizationId,
                projectId: context.projectId,
                pageUrl: page.url,
                recommendationType: objective,
                businessValue: Math.round(score.components.baseScore),
                seoOpportunity: Math.round(score.components.objectiveScore),
                expectedBusinessReturn: {
                  scoreComponents: score.components,
                  reasoning: score.reasoning,
                },
                difficulty: 5,
                riskLevel: 'Low',
                estimatedTime: 60,
                timeToWin: 'Short Term',
                dependencies: [],
                whyThis: `Page prioritized for ${objective}`,
                whyNow: 'Business opportunity identified',
                whyThisPage: `This ${pageData.pageType} aligns with ${objective}`,
                whyThisPriority: 'Strategic business value',
                confidence: score.score / 100,
                dataSupporting: {
                  score: score.score,
                  components: score.components,
                  reasoning: score.reasoning,
                },
              },
              update: {
                businessValue: Math.round(score.components.baseScore),
                seoOpportunity: Math.round(score.components.objectiveScore),
                confidence: score.score / 100,
              },
            })
          } catch (e) {
            console.error(`Failed to score ${page.url} for objective ${objective}:`, e)
          }
        }

        pagesScored++
      } catch (error) {
        console.error(`Failed to process page ${page.url}:`, error)
      }
    }

    return { pagesScored }
  } catch (error) {
    console.error('Failed to calculate decision engine scores:', error)
    return { pagesScored }
  }
}
