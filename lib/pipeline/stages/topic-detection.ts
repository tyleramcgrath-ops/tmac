import { getPrismaClient } from '@/lib/db'
import type { Page } from '@prisma/client'

export async function detectTopics(
  pages: Page[],
  context: { organizationId: string; projectId: string },
) {
  const prisma = getPrismaClient()
  const results = []

  for (const page of pages) {
    try {
      const topics = []

      // Detect topics from headings
      if (page.h1) {
        topics.push({
          name: page.h1,
          cluster: 'primary',
          confidence: 0.95,
          signals: ['heading'],
        })
      }

      // Detect from title
      if (page.title) {
        const titleTopics = extractTopicsFromText(page.title)
        topics.push(
          ...titleTopics.map((t) => ({
            ...t,
            confidence: 0.85,
            signals: ['title'],
          })),
        )
      }

      // Schema-based topic detection
      if (page.schemaTypes) {
        const schemaTypes = JSON.parse(page.schemaTypes)
        for (const schemaType of schemaTypes) {
          topics.push({
            name: mapSchemaToTopic(schemaType),
            cluster: 'schema',
            confidence: 0.8,
            signals: ['schema'],
          })
        }
      }

      // URL-based topic detection
      const urlTopics = extractTopicsFromUrl(page.url)
      topics.push(
        ...urlTopics.map((t) => ({
          ...t,
          confidence: 0.7,
          signals: ['url_pattern'],
        })),
      )

      // Deduplicate
      const uniqueTopics = deduplicateTopics(topics)

      // Persist topics
      for (const topic of uniqueTopics) {
        try {
          await prisma.contentTopic.upsert({
            where: {
              projectId_pageUrl_topicName: {
                projectId: context.projectId,
                pageUrl: page.url,
                topicName: topic.name,
              },
            },
            create: {
              organizationId: context.organizationId,
              projectId: context.projectId,
              pageUrl: page.url,
              topicName: topic.name,
              topicCluster: topic.cluster,
              confidence: topic.confidence,
              detectionSignals: topic.signals,
              evidenceScore: topic.confidence,
            },
            update: {
              confidence: topic.confidence,
              evidenceScore: topic.confidence,
            },
          })
        } catch (e) {
          // Continue on error
          console.error(`Failed to persist topic ${topic.name} on ${page.url}:`, e)
        }
      }

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

function extractTopicsFromText(text: string): Array<{ name: string; cluster: string }> {
  // Extract key topics from text
  const topics = []

  // Extract capitalized multi-word phrases
  const phrases = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/g) || []
  for (const phrase of phrases.slice(0, 3)) {
    // Limit to top 3
    topics.push({ name: phrase, cluster: 'title' })
  }

  return topics
}

function extractTopicsFromUrl(url: string): Array<{ name: string; cluster: string }> {
  const topics = []
  const pathParts = new URL(url, 'https://example.com').pathname.split('/').filter((p) => p)

  // Extract meaningful URL segments
  for (const part of pathParts.slice(0, 2)) {
    const topic = part
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .split(/\d+/)[0] // Remove numeric IDs
      .trim()
    if (topic && topic.length > 2) {
      topics.push({ name: topic.charAt(0).toUpperCase() + topic.slice(1), cluster: 'url' })
    }
  }

  return topics
}

function mapSchemaToTopic(schemaType: string): string {
  const mapping: Record<string, string> = {
    'LocalBusiness': 'Local Business',
    'Product': 'Products',
    'Service': 'Services',
    'Article': 'Content',
    'BlogPosting': 'Blog',
    'Event': 'Events',
    'Recipe': 'Recipes',
    'NewsArticle': 'News',
  }

  return mapping[schemaType] || schemaType
}

function deduplicateTopics(
  topics: Array<{ name: string; cluster: string; confidence: number; signals: string[] }>,
): Array<{ name: string; cluster: string; confidence: number; signals: string[] }> {
  const seen = new Map<string, (typeof topics)[0]>()

  for (const topic of topics) {
    const key = topic.name.toLowerCase()
    const existing = seen.get(key)

    if (!existing || existing.confidence < topic.confidence) {
      seen.set(key, topic)
    }
  }

  return Array.from(seen.values())
}
