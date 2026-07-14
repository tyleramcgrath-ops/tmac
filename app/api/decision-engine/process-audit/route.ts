import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { CompleteDecisionEngine } from '@/lib/decision-engine';
import { error, success } from '@/lib/api-response';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, projectId, auditId } = body;

    if (!organizationId || !projectId || !auditId) {
      return error('Missing required fields: organizationId, projectId, auditId', 400);
    }

    // Verify authorization
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        project: true,
      },
    });

    if (!audit) {
      return error('Audit not found', 404);
    }

    if (audit.project.organizationId !== organizationId) {
      return error('Unauthorized', 401);
    }

    // Initialize Decision Engine
    const decisionEngine = new CompleteDecisionEngine(prisma);

    // Process all decisions for the audit
    const decisions = await decisionEngine.processAuditDecisions(
      organizationId,
      projectId,
      auditId
    );

    // Update audit with decision engine status
    await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: 'completed',
      },
    });

    return success({
      message: 'Audit processed with Decision Engine',
      auditId,
      pageCount: decisions.length,
      topPages: decisions.slice(0, 5).map((d) => ({
        pageId: d.pageId,
        rank: d.priorityRank,
        businessValue: d.businessValueScore,
        seoOpportunity: d.seoOpportunityScore,
        priority: d.finalPriorityScore,
      })),
    });
  } catch (err) {
    console.error('Decision Engine error:', err);
    return error('Internal server error', 500);
  } finally {
    await prisma.$disconnect();
  }
}
