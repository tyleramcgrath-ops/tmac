import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { error, success } from '@/lib/api-response';

const prisma = new PrismaClient();

/**
 * GET /api/content/brief
 * Retrieve content briefs (generation plans waiting for approval)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status'); // draft, approved, generating, generated, deployed
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

    const where = {
      organizationId,
      projectId,
      ...(status && { status }),
    };

    const briefs = await prisma.contentBrief.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.contentBrief.count({ where });

    return success({
      message: 'Content briefs retrieved',
      briefs: briefs.map((brief) => ({
        id: brief.id,
        pageUrl: brief.pageUrl,
        purpose: brief.purpose,
        primaryTopic: brief.primaryTopic,
        status: brief.status,
        approvedBy: brief.approvedBy,
        approvedAt: brief.approvedAt,
        createdAt: brief.createdAt,
      })),
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (err) {
    console.error('Content briefs fetch error:', err);
    return error('Internal server error', 500);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/content/brief
 * Create a new content brief
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId,
      projectId,
      pageUrl,
      purpose,
      targetAudience,
      primaryTopic,
      supportingTopics,
      entitiesToInclude,
      questionsToAnswer,
      recommendedSchema,
      callToAction,
      expectedOutcome,
      targetWordCount,
    } = body;

    if (!organizationId || !projectId || !purpose || !primaryTopic || !targetAudience) {
      return error('Missing required fields', 400);
    }

    // Verify authorization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.organizationId !== organizationId) {
      return error('Unauthorized', 401);
    }

    const brief = await prisma.contentBrief.create({
      data: {
        organizationId,
        projectId,
        pageUrl: pageUrl || null,
        purpose,
        targetAudience,
        primaryTopic,
        supportingTopics: supportingTopics || [],
        entitiesToInclude: entitiesToInclude || [],
        questionsToAnswer: questionsToAnswer || [],
        recommendedSchema: recommendedSchema || [],
        callToAction: callToAction || null,
        expectedOutcome: expectedOutcome || null,
        targetWordCount: targetWordCount || null,
        status: 'draft',
      },
    });

    return success({
      message: 'Content brief created',
      brief: {
        id: brief.id,
        primaryTopic: brief.primaryTopic,
        purpose: brief.purpose,
        status: brief.status,
      },
    });
  } catch (err) {
    console.error('Content brief creation error:', err);
    return error('Internal server error', 500);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PUT /api/content/brief/:id
 * Approve or update a content brief
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId,
      projectId,
      briefId,
      action, // 'approve', 'reject', 'update'
      reviewNotes,
      approvedBy,
      updates, // For update action
    } = body;

    if (!organizationId || !projectId || !briefId || !action) {
      return error('Missing required fields', 400);
    }

    // Verify authorization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.organizationId !== organizationId) {
      return error('Unauthorized', 401);
    }

    let updateData: any = {};

    if (action === 'approve') {
      updateData = {
        status: 'approved',
        approvedBy: approvedBy || 'system',
        approvedAt: new Date(),
        reviewNotes: reviewNotes || null,
      };
    } else if (action === 'reject') {
      updateData = {
        status: 'draft',
        reviewNotes: reviewNotes || 'Changes requested',
      };
    } else if (action === 'update' && updates) {
      updateData = updates;
    }

    const brief = await prisma.contentBrief.update({
      where: { id: briefId },
      data: updateData,
    });

    return success({
      message: `Content brief ${action}d`,
      brief: {
        id: brief.id,
        status: brief.status,
        approvedAt: brief.approvedAt,
      },
    });
  } catch (err) {
    console.error('Content brief update error:', err);
    return error('Internal server error', 500);
  } finally {
    await prisma.$disconnect();
  }
}
