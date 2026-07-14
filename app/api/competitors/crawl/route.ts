// Crawl competitor domain and detect changes

import { getPrismaClient } from '@/lib/db'
import { analyzeCompetitorChanges } from '@/lib/competitor-analyzer'

interface PageData {
  url: string
  title?: string
  metaDescription?: string
  h1?: string
  canonical?: string
  robots?: string
  schema?: string[]
  internalLinks?: number
  hasNoindex?: boolean
  status?: number
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 second timeout for crawl

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const competitorId = String(body.competitorId ?? '')

  if (!competitorId) {
    return Response.json(
      { error: 'competitorId is required.' },
      { status: 400 }
    )
  }

  try {
    const prisma = getPrismaClient()

    const competitor = await prisma.competitor.findUnique({
      where: { id: competitorId },
      include: {
        snapshots: {
          orderBy: { crawledAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!competitor) {
      return Response.json({ error: 'Competitor not found.' }, { status: 404 })
    }

    // Crawl competitor domain - simplified: get homepage metadata via basic fetch
    const pages = await crawlCompetitorDomain(competitor.domain)

    // Create snapshot
    const snapshot = await prisma.competitorSnapshot.create({
      data: {
        competitorId,
        pageCount: pages.length,
        pages: JSON.stringify(pages),
        technicalScore: calculateTechnicalScore(pages),
        contentScore: calculateContentScore(pages),
        schemaScore: calculateSchemaScore(pages),
      },
    })

    // Analyze changes from previous snapshot
    const previousSnapshot = competitor.snapshots.length > 0 ? competitor.snapshots[0] : null
    const previousSnapshotData = previousSnapshot
      ? {
          pageCount: previousSnapshot.pageCount,
          technicalScore: previousSnapshot.technicalScore,
          contentScore: previousSnapshot.contentScore,
          schemaScore: previousSnapshot.schemaScore,
          pages: previousSnapshot.pages ? JSON.parse(previousSnapshot.pages) : [],
        }
      : null

    const currentSnapshotData = {
      pageCount: pages.length,
      technicalScore: snapshot.technicalScore,
      contentScore: snapshot.contentScore,
      schemaScore: snapshot.schemaScore,
      pages,
    }

    const detectedChanges = analyzeCompetitorChanges(previousSnapshotData, currentSnapshotData)

    // Store detected changes
    for (const change of detectedChanges) {
      await prisma.competitorChange.create({
        data: {
          competitorId,
          type: change.type,
          severity: change.severity,
          description: change.description,
          count: change.count,
          affectedPages: change.affectedPages ? JSON.stringify(change.affectedPages) : null,
          impact: change.impact,
          impactReason: change.impactReason,
        },
      })
    }

    // Update competitor's last crawl timestamp
    await prisma.competitor.update({
      where: { id: competitorId },
      data: { lastCrawl: new Date(), lastComparison: new Date() },
    })

    return Response.json({
      success: true,
      snapshot: {
        id: snapshot.id,
        pageCount: snapshot.pageCount,
        technicalScore: snapshot.technicalScore,
        contentScore: snapshot.contentScore,
        schemaScore: snapshot.schemaScore,
      },
      changes: detectedChanges,
      changesCount: detectedChanges.length,
    })
  } catch (err) {
    console.error('[competitors/crawl] Error', err)
    return Response.json(
      { error: `Failed to crawl competitor: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    )
  }
}

async function crawlCompetitorDomain(domain: string): Promise<PageData[]> {
  const pages: PageData[] = []

  const url = `https://${domain}`

  try {
    // Simple fetch to get basic metadata
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (SEO Bot)',
        },
      })
      clearTimeout(timeoutId)

      // Extract title from HEAD or basic parsing
      const pageData: PageData = {
        url,
        title: domain, // Fallback: use domain as title
        internalLinks: 0,
        hasNoindex: false,
        status: response.status,
      }

      // For now, store placeholder data
      // Real crawling would require a proper headless browser or crawler service
      pages.push(pageData)
    } catch {
      clearTimeout(timeoutId)
      // Domain unreachable
    }
  } catch {
    // Silently fail
  }

  // Return at least one page (homepage) even if unreachable
  if (pages.length === 0) {
    pages.push({
      url: `https://${domain}`,
      title: domain,
      internalLinks: 0,
      hasNoindex: false,
      status: 0, // Unknown
    })
  }

  return pages
}

function calculateTechnicalScore(pages: PageData[]): number {
  if (pages.length === 0) return 0

  let score = 100
  let checkCount = 0

  // Deduct for missing canonical (per page)
  const missingCanonical = pages.filter((p) => !p.canonical).length
  if (missingCanonical > pages.length * 0.1) {
    score -= 15
  }
  checkCount++

  // Deduct for noindex pages
  const noindexPages = pages.filter((p) => p.hasNoindex).length
  if (noindexPages > pages.length * 0.05) {
    score -= 10
  }
  checkCount++

  // Deduct for mixed content
  // (would need HTTPS check)
  checkCount++

  return Math.max(0, Math.min(100, score))
}

function calculateContentScore(pages: PageData[]): number {
  if (pages.length === 0) return 0

  let score = 100
  let checkCount = 0

  // Deduct for missing titles
  const missingTitles = pages.filter((p) => !p.title || p.title.length < 30).length
  if (missingTitles > pages.length * 0.1) {
    score -= 15
  }
  checkCount++

  // Deduct for missing meta descriptions
  const missingMetas = pages.filter((p) => !p.metaDescription || p.metaDescription.length < 50).length
  if (missingMetas > pages.length * 0.1) {
    score -= 15
  }
  checkCount++

  // Deduct for missing H1
  const missingH1 = pages.filter((p) => !p.h1).length
  if (missingH1 > pages.length * 0.05) {
    score -= 10
  }
  checkCount++

  return Math.max(0, Math.min(100, score))
}

function calculateSchemaScore(pages: PageData[]): number {
  if (pages.length === 0) return 0

  const pagesWithSchema = pages.filter((p) => p.schema && p.schema.length > 0).length
  const coverage = (pagesWithSchema / pages.length) * 100

  // Scale: 0% coverage = 0, 100% coverage = 100
  return Math.round(coverage)
}
