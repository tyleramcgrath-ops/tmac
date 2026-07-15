import { getPrismaClient } from '@/lib/db'
import type { Page } from '@prisma/client'

export async function extractEntities(
  pages: Page[],
  context: { organizationId: string; projectId: string },
) {
  const prisma = getPrismaClient()
  const results = []

  for (const page of pages) {
    try {
      const entities = []

      // Extract entities from headings (H1)
      if (page.h1) {
        entities.push({
          name: page.h1,
          type: 'topic',
          source: 'heading',
          confidence: 0.95,
        })
      }

      // Extract entities from schema.org markup
      if (page.schemaTypes) {
        const schemaTypes = JSON.parse(page.schemaTypes)
        for (const schemaType of schemaTypes) {
          entities.push({
            name: schemaType,
            type: 'schema_type',
            source: 'schema',
            confidence: 0.9,
          })
        }
      }

      // Extract from title
      if (page.title) {
        const titleEntities = extractEntitiesFromText(page.title)
        entities.push(
          ...titleEntities.map((e) => ({
            ...e,
            source: 'title',
            confidence: 0.85,
          })),
        )
      }

      // Deduplicate entities
      const uniqueEntities = deduplicateEntities(entities)

      // Persist entities
      for (const entity of uniqueEntities) {
        try {
          await prisma.contentEntity.upsert({
            where: {
              projectId_pageUrl_entityName: {
                projectId: context.projectId,
                pageUrl: page.url,
                entityName: entity.name,
              },
            },
            create: {
              organizationId: context.organizationId,
              projectId: context.projectId,
              pageUrl: page.url,
              entityName: entity.name,
              entityType: entity.type,
              confidence: entity.confidence,
              detectionSource: [entity.source],
              mentions: 1,
              contexts: [],
            },
            update: {
              confidence: entity.confidence,
              mentions: { increment: 1 },
            },
          })
        } catch (e) {
          // Continue on entity persistence error
          console.error(`Failed to persist entity ${entity.name} on ${page.url}:`, e)
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

function extractEntitiesFromText(text: string): Array<{ name: string; type: string }> {
  // Simple entity extraction from text
  // In production, this would use more sophisticated NLP
  const entities = []

  // Extract capitalized phrases (likely proper nouns)
  const capitalized = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/g) || []
  for (const phrase of capitalized) {
    if (phrase.length > 2) {
      entities.push({ name: phrase, type: 'entity' })
    }
  }

  return entities
}

function deduplicateEntities(
  entities: Array<{ name: string; type: string; source: string; confidence: number }>,
): Array<{ name: string; type: string; source: string; confidence: number }> {
  const seen = new Map<string, (typeof entities)[0]>()

  for (const entity of entities) {
    const key = entity.name.toLowerCase()
    if (!seen.has(key) || (seen.get(key)?.confidence ?? 0) < entity.confidence) {
      seen.set(key, entity)
    }
  }

  return Array.from(seen.values())
}
