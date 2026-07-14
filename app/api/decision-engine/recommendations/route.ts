import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { CompleteDecisionEngine } from '@/lib/decision-engine';
import { error, success } from '@/lib/api-response';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const projectId = searchParams.get('projectId');
    const auditId = searchParams.get('auditId');
    const sortBy = searchParams.get('sortBy') || 'priority'; // priority, businessValue, seoOpportunity
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!organizationId || !projectId || !auditId) {
      return error('Missing required parameters', 400);
    }

    // Verify authorization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.organizationId !== organizationId) {
      return error('Unauthorized', 401);
    }

    // Build sort order
    let orderBy: any = {};
    switch (sortBy) {
      case 'businessValue':
        orderBy = { businessValueScore: 'desc' };
        break;
      case 'seoOpportunity':
        orderBy = { seoOpportunityScore: 'desc' };
        break;
      case 'priority':
      default:
        orderBy = { priorityScore: 'desc' };
    }

    // Get page priorities (which are ranked by Decision Engine)
    const priorities = await prisma.pagePriority.findMany({
      where: {
        auditId,
        projectId,
        organizationId,
      },
      orderBy,
      take: limit,
      skip: offset,
    });

    // Get total count
    const total = await prisma.pagePriority.count({
      where: {
        auditId,
        projectId,
        organizationId,
      },
    });

    const recommendations = priorities.map((p) => {
      const explainability = p.explainability
        ? JSON.parse(p.explainability as string)
        : null;

      return {
        pageUrl: p.pageUrl,
        businessValueScore: p.businessValueScore,
        seoOpportunityScore: p.seoOpportunityScore,
        priorityScore: p.priorityScore,
        priorityRank: p.priorityRank,
        percentile: p.percentile,
        summary: p.summary,
        explainability: {
          businessValueDriver: explainability?.businessValueDriver,
          seoOpportunityDriver: explainability?.seoOpportunityDriver,
          combinedRationale: explainability?.combinedRationale,
          whyThisPage: explainability?.whyThisPage,
          whyNow: explainability?.whyNow,
          keyFactors: explainability?.keyFactors,
          risks: explainability?.risks,
        },
        actionItems: [
          {
            type: 'on-page-seo',
            priority: p.seoOpportunityScore > 70 ? 'high' : 'medium',
            description: 'Optimize on-page SEO factors',
          },
          {
            type: 'content-improvement',
            priority: p.businessValueScore > 70 ? 'high' : 'medium',
            description: 'Improve content quality and relevance',
          },
          {
            type: 'technical-seo',
            priority: p.priorityScore > 70 ? 'high' : 'low',
            description: 'Address technical SEO issues',
          },
        ],
      };
    });

    return success({
      message: 'Recommendations retrieved',
      recommendations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      sortBy,
    });
  } catch (err) {
    console.error('Recommendations fetch error:', err);
    return error('Internal server error', 500);
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId,
      projectId,
      pageId,
      recommendationType,
      timeframe = '30', // days
    } = body;

    if (!organizationId || !projectId || !pageId || !recommendationType) {
      return error('Missing required fields', 400);
    }

    // Verify authorization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.organizationId !== organizationId) {
      return error('Unauthorized', 401);
    }

    // Create recommendation decision with estimated metrics
    const decisionEngine = new CompleteDecisionEngine(prisma);
    const timeToWinEngine = decisionEngine.getTimeToWinEngine();
    const expectedReturnEngine = decisionEngine.getExpectedReturnEngine();

    // Estimate time to win and expected return
    const timeToWin = timeToWinEngine.estimateTimeToWin({
      type: recommendationType,
      currentRank: 0,
      currentTraffic: 0,
      targetTraffic: 0,
      implementationDifficulty: 5,
      pageAgeInDays: 30,
      hasExistingLinks: false,
      competitorDensity: 5,
    });

    const expectedReturn = expectedReturnEngine.calculateExpectedReturn({
      type: recommendationType,
      currentRank: 0,
      targetRank: 0,
      currentTraffic: 0,
      currentConversions: 0,
      conversionRate: 0.01,
      revenuePerConversion: 50,
      competitorDensity: 5,
      implementationCost: 500,
    });

    // Store recommendation decision
    const recommendation = await prisma.recommendationDecision.create({
      data: {
        organizationId,
        projectId,
        pageUrl: '', // Would need page URL from context
        recommendationType,
        businessValue: 60,
        seoOpportunity: 70,
        expectedBusinessReturn: expectedReturn as any,
        difficulty: 5,
        riskLevel: 'Medium',
        estimatedTime: timeToWin.expectedDays * 480, // Convert to minutes (8 hours per day)
        timeToWin: timeToWin.category,
        whyThis: 'Identified as optimization opportunity',
        whyNow: 'Timeline allows for implementation',
        whyThisPage: 'Page has improvement potential',
        whyThisPriority: 'Aligns with business priorities',
        confidence: 0.75,
        dataSupporting: {
          timelineRealistic: timeToWin,
          expectedGain: expectedReturn,
        } as any,
      },
    });

    return success({
      message: 'Recommendation created',
      recommendation: {
        id: recommendation.id,
        type: recommendation.recommendationType,
        timeToWin: timeToWin.category,
        expectedReturn: expectedReturn.revenueGainExpected,
        difficulty: recommendation.difficulty,
        timeframe: `${timeToWin.minDays}-${timeToWin.maxDays} days`,
      },
    });
  } catch (err) {
    console.error('Recommendation creation error:', err);
    return error('Internal server error', 500);
  } finally {
    await prisma.$disconnect();
  }
}
