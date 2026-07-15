import { getPrismaClient } from '@/lib/db'

export async function selectDailyMission(context: {
  organizationId: string
  projectId: string
}) {
  const prisma = getPrismaClient()

  try {
    // Get today's date (normalized)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if mission already exists for today
    const existingMission = await prisma.dailyMission.findUnique({
      where: {
        projectId_date: {
          projectId: context.projectId,
          date: today,
        },
      },
    })

    if (existingMission) {
      return {
        type: 'existing',
        mission: existingMission,
      }
    }

    // Get highest-scoring recommendation
    const topRecommendation = await prisma.recommendationDecision.findFirst({
      where: { projectId: context.projectId },
      orderBy: [{ businessValue: 'desc' }, { seoOpportunity: 'desc' }],
    })

    if (!topRecommendation) {
      return {
        type: 'no_recommendation',
        reason: 'No recommendations found',
      }
    }

    // Create daily mission
    const mission = await prisma.dailyMission.create({
      data: {
        organizationId: context.organizationId,
        projectId: context.projectId,
        date: today,
        pageUrl: topRecommendation.pageUrl,
        recommendationType: topRecommendation.recommendationType,
        reasoning: topRecommendation.whyNow || 'Highest priority opportunity',
        expectedReturn: topRecommendation.expectedBusinessReturn ? JSON.parse(JSON.stringify(topRecommendation.expectedBusinessReturn)) : null,
        estimatedTime: topRecommendation.estimatedTime,
        difficulty: topRecommendation.difficulty,
        status: 'active',
      },
    })

    return {
      type: 'created',
      mission,
    }
  } catch (error) {
    console.error('Failed to select daily mission:', error)
    return {
      type: 'error',
      reason: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
