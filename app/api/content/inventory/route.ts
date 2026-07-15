import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { error, success } from '@/lib/api-response';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const projectId = searchParams.get('projectId');
    const contentType = searchParams.get('contentType');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
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

    // Get inventory
    const where = contentType
      ? { projectId, contentType }
      : { projectId };

    const inventory = await prisma.contentInventory.findMany({
      where,
      include: { metrics: true },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.contentInventory.count({ where });

    return success({
      message: 'Content inventory retrieved',
      inventory: inventory.map((item) => ({
        pageUrl: item.pageUrl,
        contentType: item.contentType,
        wordCount: item.wordCount,
        indexStatus: item.indexStatus,
        isMoneyPage: item.isMoneyPage,
        businessValue: item.businessValue,
        decisionEngineScore: item.decisionEngineScore,
        metrics: item.metrics ? {
          overallScore: item.metrics.overallScore,
          opportunityScore: item.metrics.opportunityScore,
        } : null,
        updatedAt: item.updatedAt,
      })),
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (err) {
    console.error('Content inventory error:', err);
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
      pageUrl,
      contentType,
      wordCount,
      lastModified,
      indexStatus,
      hasSchema,
      schemaTypes,
    } = body;

    if (!organizationId || !projectId || !pageUrl || !contentType) {
      return error('Missing required fields', 400);
    }

    // Verify authorization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.organizationId !== organizationId) {
      return error('Unauthorized', 401);
    }

    // Create or update inventory
    const inventory = await prisma.contentInventory.upsert({
      where: { projectId_pageUrl: { projectId, pageUrl } },
      update: {
        contentType,
        wordCount: wordCount || 0,
        lastModified: lastModified ? new Date(lastModified) : undefined,
        indexStatus: indexStatus || 'unknown',
        hasSchema,
        schemaTypes: schemaTypes || [],
      },
      create: {
        organizationId,
        projectId,
        pageUrl,
        contentType,
        wordCount: wordCount || 0,
        lastModified: lastModified ? new Date(lastModified) : null,
        indexStatus: indexStatus || 'unknown',
        hasSchema: hasSchema || false,
        schemaTypes: schemaTypes || [],
      },
    });

    return success({
      message: 'Content inventory updated',
      inventory: {
        pageUrl: inventory.pageUrl,
        contentType: inventory.contentType,
        wordCount: inventory.wordCount,
      },
    });
  } catch (err) {
    console.error('Content inventory creation error:', err);
    return error('Internal server error', 500);
  } finally {
    await prisma.$disconnect();
  }
}
