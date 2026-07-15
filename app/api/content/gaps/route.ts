import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { error, success } from '@/lib/api-response';

const prisma = new PrismaClient();

/**
 * GET /api/content/gaps
 * Retrieve content gaps (missing pages and opportunities)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const projectId = searchParams.get('projectId');
    const priority = searchParams.get('priority'); // high, medium, low
    const gapType = searchParams.get('gapType');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

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

    // Build filter
    const where = {
      organizationId,
      projectId,
      ...(priority && { priority }),
      ...(gapType && { gapType }),
      isAddressed: false, // Only show unaddressed gaps
    };

    const gaps = await prisma.contentGapAnalysis.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { expectedImpact: 'desc' }],
      take: limit,
      skip: offset,
    });

    const total = await prisma.contentGapAnalysis.count({ where });

    return success({
      message: 'Content gaps retrieved',
      gaps: gaps.map((gap) => ({
        id: gap.id,
        gapType: gap.gapType,
        description: gap.description,
        priority: gap.priority,
        expectedImpact: gap.expectedImpact,
        recommendedPageType: gap.recommendedPageType,
        suggestedTopic: gap.suggestedTopic,
        suggestedTitle: gap.suggestedTitle,
        rationale: gap.rationale,
        trafficPotential: gap.estimatedTrafficPotential,
        relatedKeywords: gap.relatedKeywords,
        relatedServices: gap.relatedServices,
        createdAt: gap.createdAt,
      })),
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (err) {
    console.error('Content gaps fetch error:', err);
    return error('Internal server error', 500);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/content/gaps
 * Create or update a content gap
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId,
      projectId,
      gapType,
      description,
      priority,
      recommendedPageType,
      suggestedTopic,
      suggestedTitle,
      rationale,
      trafficPotential,
    } = body;

    if (!organizationId || !projectId || !gapType || !description) {
      return error('Missing required fields', 400);
    }

    // Verify authorization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.organizationId !== organizationId) {
      return error('Unauthorized', 401);
    }

    const gap = await prisma.contentGapAnalysis.create({
      data: {
        organizationId,
        projectId,
        gapType,
        description,
        priority: priority || 'medium',
        recommendedPageType,
        suggestedTopic,
        suggestedTitle,
        rationale,
        estimatedTrafficPotential: trafficPotential || 0,
      },
    });

    return success({
      message: 'Content gap created',
      gap: {
        id: gap.id,
        gapType: gap.gapType,
        suggestedTitle: gap.suggestedTitle,
        priority: gap.priority,
      },
    });
  } catch (err) {
    console.error('Content gap creation error:', err);
    return error('Internal server error', 500);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PUT /api/content/gaps/:id
 * Mark a gap as addressed
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, projectId, gapId, addressedBy } = body;

    if (!organizationId || !projectId || !gapId) {
      return error('Missing required fields', 400);
    }

    // Verify authorization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.organizationId !== organizationId) {
      return error('Unauthorized', 401);
    }

    const gap = await prisma.contentGapAnalysis.update({
      where: { id: gapId },
      data: {
        isAddressed: true,
        addressedBy: addressedBy || null,
        addressedAt: new Date(),
      },
    });

    return success({
      message: 'Content gap marked as addressed',
      gap: { id: gap.id, isAddressed: gap.isAddressed },
    });
  } catch (err) {
    console.error('Content gap update error:', err);
    return error('Internal server error', 500);
  } finally {
    await prisma.$disconnect();
  }
}
