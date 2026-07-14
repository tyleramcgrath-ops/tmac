import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { error, success } from '@/lib/api-response';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const projectId = searchParams.get('projectId');
    const auditId = searchParams.get('auditId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
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

    // Get page priorities
    const priorities = await prisma.pagePriority.findMany({
      where: {
        auditId,
        projectId,
        organizationId,
      },
      include: {
        page: {
          select: {
            url: true,
            title: true,
            status: true,
            contentLength: true,
            internalLinks: true,
            inboundCount: true,
            pageSpeedScore: true,
          },
        },
      },
      orderBy: { priorityRank: 'asc' },
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

    const formattedPriorities = priorities.map((p) => ({
      pageId: p.pageId,
      url: p.page?.url,
      title: p.page?.title,
      businessValueScore: p.businessValueScore,
      seoOpportunityScore: p.seoOpportunityScore,
      priorityScore: p.priorityScore,
      priorityRank: p.priorityRank,
      percentile: p.percentile,
      summary: p.summary,
      explainability: p.explainability ? JSON.parse(p.explainability as string) : null,
    }));

    return success({
      message: 'Page priorities retrieved',
      priorities: formattedPriorities,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (err) {
    console.error('Page priorities fetch error:', err);
    return error('Internal server error', 500);
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, projectId, auditId, pageId, weights } = body;

    if (!organizationId || !projectId || !auditId || !pageId) {
      return error('Missing required fields', 400);
    }

    // Verify authorization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.organizationId !== organizationId) {
      return error('Unauthorized', 401);
    }

    // Update priority with new weights
    if (weights) {
      const priority = await prisma.pagePriority.findUnique({
        where: {
          pageId_auditId: {
            pageId,
            auditId,
          },
        },
      });

      if (!priority) {
        return error('Page priority not found', 404);
      }

      // Recalculate priority score with new weights
      const businessWeight = weights.businessWeight ?? priority.businessWeight;
      const seoWeight = weights.seoWeight ?? priority.seoWeight;
      const normalizedBusinessValue = priority.businessValueScore / 100;
      const normalizedSeoValue = priority.seoOpportunityScore / 100;
      const newPriorityScore =
        (normalizedBusinessValue * businessWeight +
         normalizedSeoValue * seoWeight) * 100;

      const updated = await prisma.pagePriority.update({
        where: {
          pageId_auditId: {
            pageId,
            auditId,
          },
        },
        data: {
          businessWeight: businessWeight,
          seoWeight: seoWeight,
          priorityScore: newPriorityScore,
        },
      });

      return success({
        message: 'Page priority updated',
        priority: {
          pageId: updated.pageId,
          priorityScore: updated.priorityScore,
          businessWeight: updated.businessWeight,
          seoWeight: updated.seoWeight,
        },
      });
    }

    return error('No updates provided', 400);
  } catch (err) {
    console.error('Page priority update error:', err);
    return error('Internal server error', 500);
  } finally {
    await prisma.$disconnect();
  }
}
