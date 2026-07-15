import { getPrismaClient } from '@/lib/db'
import type { Page } from '@prisma/client'

export async function classifyPages(
  pages: Page[],
  context: { organizationId: string; projectId: string },
) {
  const prisma = getPrismaClient()
  const results = []

  for (const page of pages) {
    try {
      // Detect page type from URL patterns and content signals
      const classification = detectClassification(page)

      await prisma.pageClassification.upsert({
        where: {
          projectId_pageUrl: { projectId: context.projectId, pageUrl: page.url },
        },
        create: {
          organizationId: context.organizationId,
          projectId: context.projectId,
          pageUrl: page.url,
          classifications: JSON.stringify([classification]),
          primaryClassification: classification.type,
          confidenceScore: classification.confidence,
          urlPattern: extractUrlPattern(page.url),
          hasSchema: page.schemaTypes ? JSON.parse(page.schemaTypes) : [],
          hasForm: page.title?.toLowerCase().includes('contact') ?? false,
          ctaButtons: [],
        },
        update: {
          classifications: JSON.stringify([classification]),
          primaryClassification: classification.type,
          confidenceScore: classification.confidence,
        },
      })

      results.push({ url: page.url, status: 'success' })
    } catch (error) {
      results.push({
        url: page.url,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return results
}

function detectClassification(page: Page): {
  type: string
  confidence: number
  signals: string[]
} {
  const signals: string[] = []
  let score = 0

  // Service/offering page detection
  if (page.url.includes('/service') || page.url.includes('/solutions')) {
    score += 40
    signals.push('url_pattern_service')
  }

  // Product page detection
  if (
    page.url.includes('/product') ||
    page.url.includes('/shop') ||
    page.url.includes('/buy')
  ) {
    score += 40
    signals.push('url_pattern_product')
  }

  // Homepage detection
  if (page.url === '/' || page.url === '') {
    score += 50
    signals.push('homepage')
  }

  // Contact/conversion page
  if (
    page.url.includes('/contact') ||
    page.url.includes('/quote') ||
    page.url.includes('/booking')
  ) {
    score += 40
    signals.push('url_pattern_contact')
  }

  // Blog/content detection
  if (page.url.includes('/blog') || page.url.includes('/article')) {
    score += 35
    signals.push('url_pattern_blog')
  }

  // Location page (for local businesses)
  if (page.url.includes('/location') || page.url.includes('/office')) {
    score += 35
    signals.push('url_pattern_location')
  }

  // Schema.org signals
  if (page.schemaTypes) {
    const schemaTypes = JSON.parse(page.schemaTypes)
    if (schemaTypes.includes('LocalBusiness')) {
      score += 15
      signals.push('schema_local_business')
    }
    if (schemaTypes.includes('Product')) {
      score += 15
      signals.push('schema_product')
    }
    if (schemaTypes.includes('Service')) {
      score += 15
      signals.push('schema_service')
    }
    if (schemaTypes.includes('Article') || schemaTypes.includes('BlogPosting')) {
      score += 15
      signals.push('schema_article')
    }
  }

  // Content length signal
  if (page.contentLength && page.contentLength > 2000) {
    score += 10
    signals.push('content_length_high')
  }

  // Determine primary classification
  let primaryType = 'informational'
  if (score >= 40) {
    if (signals.some((s) => s.includes('service'))) primaryType = 'service_page'
    else if (signals.some((s) => s.includes('product'))) primaryType = 'product_page'
    else if (signals.some((s) => s.includes('contact'))) primaryType = 'conversion_page'
    else if (signals.some((s) => s.includes('blog'))) primaryType = 'blog_post'
    else if (signals.some((s) => s.includes('location'))) primaryType = 'location_page'
    else if (signals.some((s) => s.includes('homepage'))) primaryType = 'homepage'
  }

  const confidence = Math.min(1, Math.max(0.5, score / 100))

  return {
    type: primaryType,
    confidence,
    signals,
  }
}

function extractUrlPattern(url: string): string {
  // Normalize URL to extract pattern
  const pathParts = new URL(url, 'https://example.com').pathname.split('/')
  return pathParts.slice(1, 3).join('/')
}
