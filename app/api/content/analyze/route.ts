import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { error, success } from '@/lib/api-response';
import { ContentOptimizationEngine } from '@/lib/content-engine';

const prisma = new PrismaClient();

/**
 * Orchestrate complete content analysis for a project
 * Returns:
 * - Content inventory summary
 * - Top content gaps (missing pages)
 * - Refresh opportunities (declining pages)
 * - Actionable recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const projectId = searchParams.get('projectId');

    if (!organizationId || !projectId) {
      return error('Missing required parameters', 400);
    }

    // Verify authorization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.organizationId !== organizationId) {
      return error('Unauthorized', 401);
    }

    // Run content analysis
    const engine = new ContentOptimizationEngine(prisma);
    const analysis = await engine.analyzeProjectContent(organizationId, projectId);

    return success({
      message: 'Content analysis complete',
      analysis: {
        projectId,
        inventory: {
          total: analysis.inventoryCount,
          averageWordCount: analysis.summary.averageWordCount,
          averageScore: analysis.summary.averageScore,
        },
        topOpportunities: analysis.summary.topOpportunities,
        gaps: {
          count: analysis.contentGaps.length,
          topGaps: analysis.contentGaps.slice(0, 3).map((g: any) => ({
            type: g.gapType,
            title: g.suggestedTitle,
            priority: g.priority,
            traffic: g.estimatedTrafficPotential,
          })),
        },
        refreshes: {
          count: analysis.refreshOpportunities.length,
          topRefreshes: analysis.refreshOpportunities.slice(0, 3).map((r: any) => ({
            page: r.pageUrl,
            priority: r.priority,
            potential: r.estimatedPotential,
            reasons: r.refreshReasons.length,
          })),
        },
      },
    });
  } catch (err) {
    console.error('Content analysis error:', err);
    return error('Internal server error', 500);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/content/analyze
 * Trigger fresh content analysis for a project
 * Recalculate all metrics, gaps, and refresh opportunities
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, projectId } = body;

    if (!organizationId || !projectId) {
      return error('Missing required fields', 400);
    }

    // Verify authorization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.organizationId !== organizationId) {
      return error('Unauthorized', 401);
    }

    // Run content analysis
    const engine = new ContentOptimizationEngine(prisma);
    const analysis = await engine.analyzeProjectContent(organizationId, projectId);

    // Save analysis timestamp
    await prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });

    return success({
      message: 'Content analysis triggered',
      analysis: {
        projectId,
        pagesAnalyzed: analysis.inventoryCount,
        gapsIdentified: analysis.contentGaps.length,
        refreshOpportunitiesFound: analysis.refreshOpportunities.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Content analysis trigger error:', err);
    return error('Internal server error', 500);
  } finally {
    await prisma.$disconnect();
  }
}
