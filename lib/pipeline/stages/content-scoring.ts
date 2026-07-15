import { getPrismaClient } from '@/lib/db'
import type { Page } from '@prisma/client'

export async function scorePages(
  pages: Page[],
  context: { organizationId: string; projectId: string },
) {
  const prisma = getPrismaClient()
  const results = []

  for (const page of pages) {
    try {
      const metrics = calculateContentMetrics(page)

      // Create or update ContentMetrics
      const inventory = await prisma.contentInventory.findUnique({
        where: { projectId_pageUrl: { projectId: context.projectId, pageUrl: page.url } },
      })

      if (inventory) {
        await prisma.contentMetrics.upsert({
          where: {
            projectId_pageUrl: { projectId: context.projectId, pageUrl: page.url },
          },
          create: {
            organizationId: context.organizationId,
            projectId: context.projectId,
            pageUrl: page.url,
            inventoryId: inventory.id,
            qualityScore: metrics.qualityScore,
            qualityExplanation: metrics.qualityExplanation,
            freshnessScore: metrics.freshnessScore,
            entityCoverageScore: metrics.entityCoverageScore,
            topicalDepthScore: metrics.topicalDepthScore,
            readabilityScore: metrics.readabilityScore,
            seoOptimizationScore: metrics.seoOptimizationScore,
            aiReadinessScore: metrics.aiReadinessScore,
            conversionReadinessScore: metrics.conversionReadinessScore,
            businessValueScore: metrics.businessValueScore,
            opportunityScore: metrics.opportunityScore,
            overallScore: metrics.overallScore,
          },
          update: {
            qualityScore: metrics.qualityScore,
            freshnessScore: metrics.freshnessScore,
            entityCoverageScore: metrics.entityCoverageScore,
            topicalDepthScore: metrics.topicalDepthScore,
            readabilityScore: metrics.readabilityScore,
            seoOptimizationScore: metrics.seoOptimizationScore,
            aiReadinessScore: metrics.aiReadinessScore,
            opportunityScore: metrics.opportunityScore,
            overallScore: metrics.overallScore,
          },
        })
      }

      results.push({ url: page.url, status: 'success' })
    } catch (error) {
      results.push({
        url: page.url,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return results
}

function calculateContentMetrics(page: Page): Record<string, any> {
  let qualityScore = 50

  // Content length signal
  if (page.contentLength < 300) qualityScore -= 20
  else if (page.contentLength > 1000) qualityScore += 15
  else if (page.contentLength > 2000) qualityScore += 20

  // Schema coverage
  let schemaScore = 0
  if (page.schemaTypes) {
    const schemaCount = JSON.parse(page.schemaTypes).length
    schemaScore = Math.min(100, 40 + schemaCount * 15)
  }

  // Technical signals
  let technicalScore = 70
  if (page.hasNoindex) technicalScore -= 30
  if (page.hasMixedContent) technicalScore -= 15

  // SEO optimization
  let seoScore = 60
  if (page.title && page.title.length > 30 && page.title.length < 60) seoScore += 15
  if (page.metaDescription && page.metaDescription.length > 100) seoScore += 15
  if (page.h1Count === 1) seoScore += 10 // Good H1 count
  if (page.internalLinks > 3) seoScore += 10

  // Freshness (assume recent pages are fresh)
  const freshnessScore = 70

  // AI readiness
  let aiReadinessScore = 60
  if (page.schemaTypes) aiReadinessScore += 20
  if (page.contentLength > 1500) aiReadinessScore += 15

  // Conversion readiness
  let conversionReadiness = 40
  if (page.title?.toLowerCase().includes('contact')) conversionReadiness = 85
  if (page.title?.toLowerCase().includes('pricing')) conversionReadiness = 85
  if (page.title?.toLowerCase().includes('service')) conversionReadiness = 70

  const opportunityScore = Math.max(
    0,
    100 -
      qualityScore -
      schemaScore -
      technicalScore -
      seoScore -
      freshnessScore -
      aiReadinessScore,
  ) / 6

  const overallScore =
    (qualityScore + schemaScore + technicalScore + seoScore + aiReadinessScore) / 5

  return {
    qualityScore: Math.round(qualityScore),
    qualityExplanation: `Content quality: ${page.contentLength} words`,
    freshnessScore: Math.round(freshnessScore),
    entityCoverageScore: 50,
    topicalDepthScore: 60,
    readabilityScore: 65,
    seoOptimizationScore: Math.round(seoScore),
    aiReadinessScore: Math.round(aiReadinessScore),
    conversionReadinessScore: Math.round(conversionReadiness),
    businessValueScore: 65,
    opportunityScore: Math.round(opportunityScore),
    overallScore: Math.round(overallScore),
  }
}
