import { getPrismaClient } from '@/lib/db'
import type { Page } from '@prisma/client'

export async function analyzeGaps(
  pages: Page[],
  context: { organizationId: string; projectId: string },
) {
  const prisma = getPrismaClient()
  let gapsFound = 0

  try {
    // Analyze page types to identify gaps
    const pageTypes = new Map<string, number>()
    const topics = new Set<string>()

    for (const page of pages) {
      // Count page types
      const type = detectPageType(page)
      pageTypes.set(type, (pageTypes.get(type) || 0) + 1)

      // Collect topics
      if (page.h1) topics.add(page.h1)
    }

    // Identify missing content types
    const commonPageTypes = ['homepage', 'service_page', 'blog_post', 'about', 'contact', 'faq']

    for (const pageType of commonPageTypes) {
      if (!pageTypes.has(pageType)) {
        // Gap identified
        try {
          await prisma.contentGapAnalysis.create({
            data: {
              organizationId: context.organizationId,
              projectId: context.projectId,
              gapType: 'missing_page_type',
              description: `Missing ${pageType.replace(/_/g, ' ')} page`,
              priority: 'medium',
              recommendedPageType: pageType,
              rationale: `Your site lacks a ${pageType.replace(/_/g, ' ')}, which is commonly found on successful business websites.`,
            },
          })
          gapsFound++
        } catch (e) {
          console.error(`Failed to create gap for ${pageType}:`, e)
        }
      }
    }

    // Identify thin content gaps
    for (const page of pages) {
      if (page.contentLength < 300 && !page.url.includes('/404') && !page.url.includes('/robots')) {
        try {
          await prisma.contentGapAnalysis.create({
            data: {
              organizationId: context.organizationId,
              projectId: context.projectId,
              gapType: 'thin_content',
              description: `${page.url} has only ${page.contentLength} words`,
              priority: 'medium',
              rationale: 'This page has minimal content and may not rank well for competitive keywords.',
            },
          })
          gapsFound++
        } catch (e) {
          // Continue on error
        }
      }
    }

    // Identify missing schema
    const pagesWithoutSchema = pages.filter(
      (p) => !p.schemaTypes || JSON.parse(p.schemaTypes).length === 0,
    )

    if (pagesWithoutSchema.length > 0) {
      try {
        await prisma.contentGapAnalysis.create({
          data: {
            organizationId: context.organizationId,
            projectId: context.projectId,
            gapType: 'missing_schema',
            description: `${pagesWithoutSchema.length} pages lack structured data markup`,
            priority: 'high',
            rationale: `${pagesWithoutSchema.length} pages don't have Schema.org markup, reducing visibility in rich results.`,
            estimatedTrafficPotential: pagesWithoutSchema.length * 5,
          },
        })
        gapsFound++
      } catch (e) {
        console.error('Failed to create schema gap:', e)
      }
    }

    // Identify FAQ opportunity
    if (!pages.some((p) => p.url.includes('/faq') || p.url.includes('/questions'))) {
      try {
        await prisma.contentGapAnalysis.create({
          data: {
            organizationId: context.organizationId,
            projectId: context.projectId,
            gapType: 'missing_faq',
            description: 'No FAQ page found',
            priority: 'medium',
            recommendedPageType: 'faq',
            rationale: 'An FAQ page helps with featured snippets and answers common customer questions.',
            estimatedTrafficPotential: 20,
          },
        })
        gapsFound++
      } catch (e) {
        console.error('Failed to create FAQ gap:', e)
      }
    }

    return { gapsFound }
  } catch (error) {
    console.error('Failed to analyze gaps:', error)
    return { gapsFound }
  }
}

function detectPageType(page: Page): string {
  if (page.url === '/' || page.url === '') return 'homepage'
  if (page.url.includes('/about')) return 'about'
  if (page.url.includes('/contact') || page.url.includes('/quote')) return 'contact'
  if (page.url.includes('/faq')) return 'faq'
  if (page.url.includes('/service') || page.url.includes('/solutions')) return 'service_page'
  if (page.url.includes('/blog') || page.url.includes('/article')) return 'blog_post'
  if (page.url.includes('/product')) return 'product_page'
  if (page.url.includes('/pricing')) return 'pricing'
  return 'other'
}
