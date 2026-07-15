import { getPrismaClient } from '@/lib/db'

export async function buildKnowledgeGraph(
  context: { organizationId: string; projectId: string },
  entityResults: any[],
  topicResults: any[],
) {
  const prisma = getPrismaClient()
  let nodesCreated = 0
  let edgesCreated = 0

  try {
    // Get all entities and topics from database
    const entities = await prisma.contentEntity.findMany({
      where: { projectId: context.projectId },
      distinct: ['entityName'],
    })

    const topics = await prisma.contentTopic.findMany({
      where: { projectId: context.projectId },
      distinct: ['topicName'],
    })

    // Create nodes for each entity
    for (const entity of entities) {
      try {
        const nodeId = sanitizeNodeId(entity.entityName)
        await prisma.knowledgeGraphNode.upsert({
          where: {
            projectId_nodeId: { projectId: context.projectId, nodeId },
          },
          create: {
            organizationId: context.organizationId,
            projectId: context.projectId,
            nodeId,
            nodeType: entity.entityType,
            nodeLabel: entity.entityName,
            properties: JSON.stringify({ confidence: entity.confidence }),
          },
          update: {
            frequency: { increment: 1 },
          },
        })
        nodesCreated++
      } catch (e) {
        console.error(`Failed to create node for entity ${entity.entityName}:`, e)
      }
    }

    // Create nodes for each topic
    for (const topic of topics) {
      try {
        const nodeId = sanitizeNodeId(topic.topicName)
        await prisma.knowledgeGraphNode.upsert({
          where: {
            projectId_nodeId: { projectId: context.projectId, nodeId },
          },
          create: {
            organizationId: context.organizationId,
            projectId: context.projectId,
            nodeId,
            nodeType: 'topic',
            nodeLabel: topic.topicName,
            properties: JSON.stringify({ confidence: topic.confidence }),
          },
          update: {
            frequency: { increment: 1 },
          },
        })
        nodesCreated++
      } catch (e) {
        console.error(`Failed to create node for topic ${topic.topicName}:`, e)
      }
    }

    // Create edges between related entities/topics
    const entitySet = new Set(entities.map((e) => sanitizeNodeId(e.entityName)))
    const topicSet = new Set(topics.map((t) => sanitizeNodeId(t.topicName)))

    // Create entity-topic relationships
    for (const entityId of entitySet) {
      for (const topicId of topicSet) {
        if (entityId !== topicId && shouldCreateEdge(entityId, topicId)) {
          try {
            await prisma.knowledgeGraphEdge.upsert({
              where: {
                projectId_fromNodeId_toNodeId_relationshipType: {
                  projectId: context.projectId,
                  fromNodeId: entityId,
                  toNodeId: topicId,
                  relationshipType: 'related_to',
                },
              },
              create: {
                organizationId: context.organizationId,
                projectId: context.projectId,
                fromNodeId: entityId,
                toNodeId: topicId,
                relationshipType: 'related_to',
                confidence: 0.7,
              },
              update: {
                strength: { increment: 1 },
              },
            })
            edgesCreated++
          } catch (e) {
            // Continue on error
          }
        }
      }
    }

    return { nodesCreated, edgesCreated }
  } catch (error) {
    console.error('Failed to build knowledge graph:', error)
    return { nodesCreated, edgesCreated }
  }
}

function sanitizeNodeId(label: string): string {
  return label
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 50)
}

function shouldCreateEdge(nodeId1: string, nodeId2: string): boolean {
  // Simple heuristic: create edges for semantically related nodes
  // In production, use similarity scoring
  return nodeId1.length > 2 && nodeId2.length > 2
}
