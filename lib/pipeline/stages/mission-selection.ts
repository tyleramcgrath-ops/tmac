import { getPrismaClient } from '@/lib/db'
import { moneyPagePortfolio } from '../graph/money-pages'

/**
 * Daily Mission selection — powered by graph-derived money-page intelligence.
 *
 * Preference order:
 *   1. A money page with weaknesses (missing support / entities / schema) —
 *      the graph has evidence that improving it moves business metrics.
 *   2. The highest-ranked RecommendationDecision (which already carries
 *      graph-derived boosts thanks to the Decision Engine rewrite).
 *   3. Return a reasoned refusal instead of inventing a mission.
 */
export async function selectDailyMission(context: {
  organizationId: string
  projectId: string
}) {
  const prisma = getPrismaClient()

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existingMission = await prisma.dailyMission.findUnique({
      where: {
        projectId_date: { projectId: context.projectId, date: today },
      },
    })
    if (existingMission) {
      return { type: 'existing' as const, mission: existingMission }
    }

    // Preferred: highest-priority money page from graph intelligence
    const portfolio = await moneyPagePortfolio({ projectId: context.projectId })
    const targetMoneyPage = portfolio.find((mp) => mp.weaknesses.length > 0)

    if (targetMoneyPage && targetMoneyPage.moneyPage.url) {
      const rec = await prisma.recommendationDecision.findFirst({
        where: { projectId: context.projectId, pageUrl: targetMoneyPage.moneyPage.url },
        orderBy: [{ businessValue: 'desc' }],
      })

      const reasoning =
        `Graph intelligence flagged ${targetMoneyPage.moneyPage.url}: ` +
        `${targetMoneyPage.weaknesses.join('; ')}. ` +
        `Traffic risk ${targetMoneyPage.trafficRisk}, ` +
        `conversion opportunity ${targetMoneyPage.conversionOpportunity}.`

      const expectedReturn = rec?.expectedBusinessReturn
        ? JSON.parse(JSON.stringify(rec.expectedBusinessReturn))
        : {
            label: targetMoneyPage.expectedBusinessReturn.label,
            reasoning: targetMoneyPage.expectedBusinessReturn.reasoning,
            graphEvidence: {
              supports: targetMoneyPage.supports.length,
              missingEntities: targetMoneyPage.missing.entities,
              missingSchema: targetMoneyPage.missing.schema,
              missingTopics: targetMoneyPage.missing.topics,
            },
          }

      const mission = await prisma.dailyMission.create({
        data: {
          organizationId: context.organizationId,
          projectId: context.projectId,
          date: today,
          pageUrl: targetMoneyPage.moneyPage.url,
          recommendationType: rec?.recommendationType || 'money_page_reinforcement',
          reasoning,
          expectedReturn,
          estimatedTime: rec?.estimatedTime ?? 60,
          difficulty: rec?.difficulty ?? 5,
          status: 'active',
        },
      })
      return { type: 'created' as const, mission, source: 'graph' as const }
    }

    // Fallback: top-ranked recommendation
    const topRecommendation = await prisma.recommendationDecision.findFirst({
      where: { projectId: context.projectId },
      orderBy: [{ businessValue: 'desc' }, { seoOpportunity: 'desc' }],
    })
    if (!topRecommendation) {
      return {
        type: 'no_recommendation' as const,
        reason: 'Graph and Decision Engine produced no candidates',
      }
    }

    const mission = await prisma.dailyMission.create({
      data: {
        organizationId: context.organizationId,
        projectId: context.projectId,
        date: today,
        pageUrl: topRecommendation.pageUrl,
        recommendationType: topRecommendation.recommendationType,
        reasoning: topRecommendation.whyNow || 'Highest priority opportunity',
        expectedReturn: topRecommendation.expectedBusinessReturn
          ? JSON.parse(JSON.stringify(topRecommendation.expectedBusinessReturn))
          : null,
        estimatedTime: topRecommendation.estimatedTime,
        difficulty: topRecommendation.difficulty,
        status: 'active',
      },
    })
    return { type: 'created' as const, mission, source: 'decision_engine' as const }
  } catch (error) {
    console.error('Failed to select daily mission:', error)
    return {
      type: 'error' as const,
      reason: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
