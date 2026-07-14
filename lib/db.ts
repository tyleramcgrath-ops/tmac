// Database utilities for audit persistence
import { PrismaClient } from '@prisma/client'

// Matches the URL normalization page.tsx uses to build the inbound-count map.
function normalizeUrlKey(url: string): string {
  try {
    const x = new URL(url)
    return x.hostname.replace(/^www\./, '') + (x.pathname.replace(/\/+$/, '') || '/')
  } catch {
    return url.replace(/\/+$/, '')
  }
}

// Create a singleton instance of PrismaClient
// Lazily initialize to avoid errors during build
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set. Database features are unavailable.')
    }
    globalForPrisma.prisma = new PrismaClient()
  }
  return globalForPrisma.prisma
}

/**
 * Save a completed audit to the database
 */
export async function saveAudit({
  userId,
  projectId,
  domain,
  pages,
  siteScore,
  technicalScore,
  contentScore,
  schemaScore,
  aiScore,
  analytics,
}: {
  userId: string
  projectId: string
  domain: string
  pages: Array<any>
  siteScore: number
  technicalScore: number
  contentScore: number
  schemaScore: number
  aiScore: number
  analytics: any
}) {
  const prisma = getPrismaClient()
  try {
    // Ensure project exists
    const project = await prisma.project.upsert({
      where: { userId_domain: { userId, domain } },
      update: { updatedAt: new Date() },
      create: { userId, name: domain, domain },
    })

    // Compute derived aggregates from the real Analytics shape (see page.tsx).
    const schemaCoveragePct =
      pages.length > 0 && Array.isArray(analytics.schemaCoverage)
        ? Math.round(
            (analytics.schemaCoverage.reduce((s: number, x: { count: number }) => s + (x.count || 0), 0) /
              pages.length) *
              100
          )
        : 0
    const orphanCount = Array.isArray(analytics.links?.orphans) ? analytics.links.orphans.length : 0
    const topIssueTitles = Array.isArray(analytics.issues)
      ? analytics.issues.slice(0, 5).map((i: { title: string }) => i.title)
      : []

    // Create audit snapshot
    const audit = await prisma.audit.create({
      data: {
        projectId: project.id,
        status: 'completed',
        pageCount: pages.length,
        issueCount: analytics.issues?.length || 0,
        criticalCount: analytics.severityTotals?.critical || 0,
        warningCount: analytics.severityTotals?.warning || 0,
        infoCount: analytics.severityTotals?.info || 0,
        siteScore,
        technicalScore,
        contentScore,
        schemaScore,
        aiScore,
        schemaCoverage: schemaCoveragePct,
        orphanCount,
        avgInbound: Math.round(analytics.links?.avgInbound || 0),
        summary: JSON.stringify({
          topIssues: topIssueTitles,
          duplicates: {
            titles: analytics.duplicates?.titles?.length || 0,
            metas: analytics.duplicates?.metas?.length || 0,
          },
          indexability: {
            noindex: analytics.index?.noindex?.length || 0,
            nonCanonical: analytics.index?.nonCanonical?.length || 0,
            mixed: analytics.index?.mixed?.length || 0,
            nonOk: analytics.index?.nonOk?.length || 0,
          },
        }),
        endedAt: new Date(),
      },
    })

    // Save pages
    const inboundCounts: Record<string, number> = analytics.links?.inbound || {}
    for (const page of pages) {
      const internalTargetsCount = Array.isArray(page.internalTargets) ? page.internalTargets.length : 0
      await prisma.page.create({
        data: {
          auditId: audit.id,
          url: page.url,
          status: page.status || 0,
          title: page.title || null,
          metaDescription: page.metaDescription || null,
          h1: null,
          h1Count: page.h1Count || 0,
          contentLength: page.wordCount || 0,
          canonical: page.canonical || null,
          hasNoindex: page.indexable === false,
          hasMixedContent: !!page.mixedContent,
          pageSpeedScore: null,
          internalLinks: internalTargetsCount,
          internalTargets: internalTargetsCount,
          inboundCount: inboundCounts[normalizeUrlKey(page.url)] || 0,
          schemaTypes: Array.isArray(page.schemaTypes) ? JSON.stringify(page.schemaTypes) : null,
          technicalScore: page.scores?.technical || 0,
          contentScore: page.scores?.content || 0,
          schemaScore: page.scores?.schema || 0,
          aiScore: page.scores?.ai || 0,
        },
      })
    }

    return audit
  } catch (error) {
    console.error('[db] Failed to save audit:', error)
    throw error
  }
}

/**
 * Load audit history for a project
 */
export async function loadAuditHistory({
  projectId,
  limit = 20,
}: {
  projectId: string
  limit?: number
}) {
  const prisma = getPrismaClient()
  try {
    const audits = await prisma.audit.findMany({
      where: { projectId },
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        pages: { select: { id: true, url: true, status: true, title: true } },
      },
    })
    return audits
  } catch (error) {
    console.error('[db] Failed to load audit history:', error)
    throw error
  }
}

/**
 * Load a specific audit with all its data
 */
export async function loadAudit(auditId: string) {
  const prisma = getPrismaClient()
  try {
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        pages: true,
        issues: true,
      },
    })
    return audit
  } catch (error) {
    console.error('[db] Failed to load audit:', error)
    throw error
  }
}

/**
 * Compare two audits to see what changed
 */
export async function compareAudits(auditId1: string, auditId2: string) {
  const prisma = getPrismaClient()
  try {
    const [audit1, audit2] = await Promise.all([
      prisma.audit.findUnique({
        where: { id: auditId1 },
        include: { pages: true },
      }),
      prisma.audit.findUnique({
        where: { id: auditId2 },
        include: { pages: true },
      }),
    ])

    if (!audit1 || !audit2) return null

    const changes = {
      scoreChange: audit2.siteScore - audit1.siteScore,
      pageCountChange: audit2.pageCount - audit1.pageCount,
      criticalIssueChange: audit2.criticalCount - audit1.criticalCount,
      warningChange: audit2.warningCount - audit1.warningCount,
      newPages: audit2.pages.filter(
        (p) => !audit1.pages.some((p1) => p1.url === p.url)
      ),
      removedPages: audit1.pages.filter(
        (p) => !audit2.pages.some((p2) => p2.url === p.url)
      ),
    }

    return changes
  } catch (error) {
    console.error('[db] Failed to compare audits:', error)
    throw error
  }
}

/**
 * Log an event (audit, deployment, etc.)
 */
export async function logEvent({
  userId,
  projectId,
  type,
  action,
  auditId,
}: {
  userId: string
  projectId?: string
  type: string
  action?: string
  auditId?: string
}) {
  const prisma = getPrismaClient()
  try {
    await prisma.event.create({
      data: {
        userId,
        projectId,
        auditId,
        type,
        action,
      },
    })
  } catch (error) {
    console.error('[db] Failed to log event:', error)
    // Don't throw - event logging should be fire-and-forget
  }
}

/**
 * Get user's projects
 */
export async function getUserProjects(userId: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })
  } catch (error) {
    console.error('[db] Failed to load projects:', error)
    throw error
  }
}

/**
 * Get or create a project
 */
export async function getOrCreateProject({
  userId,
  domain,
  name,
}: {
  userId: string
  domain: string
  name?: string
}) {
  const prisma = getPrismaClient()
  try {
    return await prisma.project.upsert({
      where: { userId_domain: { userId, domain } },
      update: { updatedAt: new Date() },
      create: { userId, domain, name: name || domain },
    })
  } catch (error) {
    console.error('[db] Failed to get/create project:', error)
    throw error
  }
}
