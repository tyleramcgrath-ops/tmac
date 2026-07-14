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

    if (!organizationId || !projectId) {
      return error('Missing required parameters', 400);
    }

    // Verify project belongs to organization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.organizationId !== organizationId) {
      return error('Unauthorized', 401);
    }

    // Get today's mission
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mission = await prisma.dailyMission.findUnique({
      where: {
        projectId_date: {
          projectId,
          date: today,
        },
      },
    });

    if (!mission) {
      return success(
        {
          message: 'No mission for today',
          mission: null,
        },
        200
      );
    }

    return success({
      message: 'Daily mission retrieved',
      mission: {
        pageUrl: mission.pageUrl,
        recommendationType: mission.recommendationType,
        reasoning: mission.reasoning,
        expectedReturn: mission.expectedReturn ? JSON.parse(mission.expectedReturn as string) : null,
        estimatedTime: mission.estimatedTime,
        difficulty: mission.difficulty,
        status: mission.status,
        completedAt: mission.completedAt,
        actualTime: mission.actualTime,
      },
    });
  } catch (err) {
    console.error('Daily mission fetch error:', err);
    return error('Internal server error', 500);
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, projectId, status, actualTimeMinutes, result } = body;

    if (!organizationId || !projectId || !status) {
      return error('Missing required fields', 400);
    }

    // Verify project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.organizationId !== organizationId) {
      return error('Unauthorized', 401);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mission = await prisma.dailyMission.findUnique({
      where: {
        projectId_date: {
          projectId,
          date: today,
        },
      },
    });

    if (!mission) {
      return error('No mission for today', 404);
    }

    // Update mission status
    const updated = await prisma.dailyMission.update({
      where: { id: mission.id },
      data: {
        status,
        completedAt: status === 'completed' ? new Date() : undefined,
        actualTime: actualTimeMinutes,
        actualResult: result ? JSON.stringify(result) : undefined,
      },
    });

    return success({
      message: 'Daily mission updated',
      mission: {
        status: updated.status,
        completedAt: updated.completedAt,
        actualTime: updated.actualTime,
      },
    });
  } catch (err) {
    console.error('Daily mission update error:', err);
    return error('Internal server error', 500);
  } finally {
    await prisma.$disconnect();
  }
}
