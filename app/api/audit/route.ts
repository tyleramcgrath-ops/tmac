// Audit persistence API — save and load audits from the database.
// Every action is scoped to the signed-in user's organization; projects and
// audits from other organizations are never visible here.
// Requires DATABASE_URL to be configured.

import { getCurrentSession } from '@/lib/session'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  // Lazy load Prisma to avoid initialization errors during build
  let prisma: any
  try {
    const { getPrismaClient } = await import('@/lib/db')
    prisma = getPrismaClient()
  } catch {
    return Response.json({ error: 'Database is not configured.' }, { status: 503 })
  }

  const session = await getCurrentSession()
  if (!session || !session.organizationId) {
    return Response.json({ error: 'Sign in to save and load audits.' }, { status: 401 })
  }
  const organizationId = session.organizationId

  let body: Record<string, any>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const action = body.action

  // Save audit to database
  if (action === 'save') {
    try {
      const {
        projectId,
        pages,
        siteScore,
        technicalScore,
        contentScore,
        schemaScore,
        aiScore,
        analytics,
      } = body

      if (!projectId || !pages) {
        return Response.json({ error: 'Missing required fields.' }, { status: 400 })
      }

      const project = await prisma.project.findUnique({ where: { id: projectId } })
      if (!project || project.organizationId !== organizationId) {
        return Response.json({ error: 'Project not found.' }, { status: 404 })
      }

      const audit = await prisma.audit.create({
        data: {
          organizationId,
          projectId,
          status: 'completed',
          pageCount: pages.length,
          issueCount: analytics?.issues?.length || 0,
          criticalCount: analytics?.severityTotals?.critical || 0,
          warningCount: analytics?.severityTotals?.warning || 0,
          infoCount: analytics?.severityTotals?.info || 0,
          siteScore: Math.round(siteScore || 0),
          technicalScore: Math.round(technicalScore || 0),
          contentScore: Math.round(contentScore || 0),
          schemaScore: Math.round(schemaScore || 0),
          aiScore: Math.round(aiScore || 0),
          schemaCoverage: analytics?.totals?.pagesWithSchema
            ? Math.round((analytics.totals.pagesWithSchema / pages.length) * 100)
            : 0,
          orphanCount: analytics?.links?.orphans?.length || 0,
          avgInbound: analytics?.links?.avgInbound || 0,
          summary: JSON.stringify({
            topIssues: analytics?.issues?.slice(0, 5) || [],
            duplicates: analytics?.duplicates || {},
            indexability: analytics?.index || {},
          }),
          endedAt: new Date(),
        },
      })

      // Save pages (batch insert for performance)
      const pageData = pages.map((page: any) => ({
        auditId: audit.id,
        url: page.url,
        status: page.status,
        title: page.title,
        metaDescription: page.metaDescription,
        h1: page.h1,
        h1Count: page.h1Count || 0,
        contentLength: page.wordCount || 0,
        canonical: page.canonical,
        hasNoindex: page.indexable === false,
        hasMixedContent: page.mixedContent || false,
        pageSpeedScore: null,
        internalLinks: page.internalTargets?.length || 0,
        internalTargets: page.internalTargets?.length || 0,
        inboundCount: analytics?.links?.inbound?.[page.url] || 0,
        schemaTypes: page.schemaTypes?.length ? JSON.stringify(page.schemaTypes) : null,
        technicalScore: page.scores?.technical || 0,
        contentScore: page.scores?.content || 0,
        schemaScore: page.scores?.schema || 0,
        aiScore: page.scores?.ai || 0,
      }))

      // Create pages in batches to avoid overwhelming the database
      for (let i = 0; i < pageData.length; i += 50) {
        await prisma.page.createMany({
          data: pageData.slice(i, i + 50),
        })
      }

      await prisma.project.update({ where: { id: projectId }, data: { updatedAt: new Date() } })

      return Response.json({
        success: true,
        auditId: audit.id,
        projectId: project.id,
      })
    } catch (error) {
      console.error('[audit] save error:', error)
      return Response.json({ error: 'Failed to save audit.' }, { status: 500 })
    }
  }

  // Load audit history (score over time) for a project
  if (action === 'history') {
    try {
      const { projectId } = body
      if (!projectId) {
        return Response.json({ error: 'Missing projectId.' }, { status: 400 })
      }

      const project = await prisma.project.findUnique({ where: { id: projectId } })
      if (!project || project.organizationId !== organizationId) {
        return Response.json({ audits: [] })
      }

      const audits = await prisma.audit.findMany({
        where: { projectId },
        orderBy: { startedAt: 'desc' },
        take: 20,
        select: {
          id: true,
          startedAt: true,
          endedAt: true,
          pageCount: true,
          siteScore: true,
          criticalCount: true,
          warningCount: true,
        },
      })

      return Response.json({ audits })
    } catch (error) {
      console.error('[audit] history error:', error)
      return Response.json({ error: 'Failed to load history.' }, { status: 500 })
    }
  }

  // Load a specific audit's page-level detail
  if (action === 'load') {
    try {
      const { auditId } = body
      if (!auditId) {
        return Response.json({ error: 'Missing auditId.' }, { status: 400 })
      }

      const audit = await prisma.audit.findUnique({
        where: { id: auditId },
        include: {
          pages: {
            select: {
              url: true,
              status: true,
              title: true,
              metaDescription: true,
              canonical: true,
              hasNoindex: true,
              hasMixedContent: true,
              h1Count: true,
              schemaTypes: true,
              internalTargets: true,
              technicalScore: true,
              contentScore: true,
              schemaScore: true,
              aiScore: true,
            },
          },
        },
      })

      if (!audit || audit.organizationId !== organizationId) {
        return Response.json({ error: 'Audit not found.' }, { status: 404 })
      }

      return Response.json({ audit })
    } catch (error) {
      console.error('[audit] load error:', error)
      return Response.json({ error: 'Failed to load audit.' }, { status: 500 })
    }
  }

  return Response.json({ error: 'Invalid action.' }, { status: 400 })
}
