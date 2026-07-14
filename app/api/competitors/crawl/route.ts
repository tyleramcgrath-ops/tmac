// Crawl competitor domain and detect changes

import { getPrismaClient } from '@/lib/db'
import { analyzeCompetitorChanges } from '@/lib/competitor-analyzer'
import { fetchHtml } from '@/lib/crawler'
import * as cheerio from 'cheerio'

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

    // Crawl competitor domain - simplified crawl with sitemap
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
  const pages: Map<string, PageData> = new Map()

  const url = `https://${domain}`

  try {
    const html = await fetchHtml(url, { timeout: 10000 })
    const $ = cheerio.load(html)

    // Extract metadata from homepage
    const pageData: PageData = {
      url,
      title: $('title').text() || undefined,
      metaDescription: $('meta[name="description"]').attr('content') || undefined,
      h1: $('h1').first().text() || undefined,
      canonical: $('link[rel="canonical"]').attr('href') || undefined,
      robots: $('meta[name="robots"]').attr('content') || undefined,
      schema: extractSchemaTypes($),
      internalLinks: $('a[href^="/"], a[href^="http://' + domain + '"], a[href^="https://' + domain + '"]').length,
      hasNoindex: $('meta[name="robots"][content*="noindex"]').length > 0,
      status: 200,
    }

    pages.set(url, pageData)

    // Extract internal links for shallow crawl
    const internalLinks = new Set<string>()
    $('a[href]').each((_, el) => {
      let href = $(el).attr('href') || ''
      if (href.startsWith('/')) {
        href = `https://${domain}${href}`
      } else if (!href.startsWith('http')) {
        return
      }

      if (href.includes(domain)) {
        const urlObj = new URL(href)
        internalLinks.add(urlObj.origin + urlObj.pathname)
      }
    })

    // Crawl up to 20 internal links for page-level metadata
    const linksToCheck = Array.from(internalLinks).slice(0, 20)
    for (const link of linksToCheck) {
      try {
        const pageHtml = await fetchHtml(link, { timeout: 5000 })
        const page$ = cheerio.load(pageHtml)

        const pageData: PageData = {
          url: link,
          title: page$('title').text() || undefined,
          metaDescription: page$('meta[name="description"]').attr('content') || undefined,
          h1: page$('h1').first().text() || undefined,
          canonical: page$('link[rel="canonical"]').attr('href') || undefined,
          robots: page$('meta[name="robots"]').attr('content') || undefined,
          schema: extractSchemaTypes(page$),
          internalLinks: page$('a[href^="/"], a[href^="http://' + domain + '"], a[href^="https://' + domain + '"]').length,
          hasNoindex: page$('meta[name="robots"][content*="noindex"]').length > 0,
          status: 200,
        }

        pages.set(link, pageData)
      } catch {
        // Skip unreachable pages
      }
    }
  } catch {
    // If homepage unreachable, return empty
  }

  return Array.from(pages.values())
}

function extractSchemaTypes($: ReturnType<typeof cheerio.load>): string[] {
  const types = new Set<string>()

  // Extract schema.org types from JSON-LD
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '{}')
      if (data['@type']) {
        const typeStr = data['@type']
        if (Array.isArray(typeStr)) {
          typeStr.forEach((t) => types.add(t))
        } else {
          types.add(typeStr)
        }
      }
    } catch {
      // Invalid JSON-LD
    }
  })

  // Extract microdata types
  $('[itemtype]').each((_, el) => {
    const itemtype = $(el).attr('itemtype') || ''
    if (itemtype) {
      const type = itemtype.split('/').pop() || ''
      if (type) types.add(type)
    }
  })

  return Array.from(types)
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
