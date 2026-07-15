import { getPrismaClient } from '@/lib/db'
import type { ExecutionDeployment } from '@prisma/client'

/**
 * Rollback Engine (Phase 9.1)
 *
 * Manages reversibility of executions. Every change is tracked
 * and can be safely rolled back.
 */

export interface RollbackSnapshot {
  deploymentId: string
  changeType: string // "title" | "meta_description" | "canonical" | etc
  pageUrl: string
  previousValue: unknown
  newValue: unknown
  timestamp: Date
  verified: boolean
}

export interface RollbackRequest {
  deploymentId: string
  reason: string
}

export interface RollbackResult {
  success: boolean
  deploymentId: string
  rollbackStatus: 'pending' | 'in_progress' | 'success' | 'failed'
  changesReverted: number
  errors: string[]
  timeToRollback: number // milliseconds
  error?: string
}

export async function createRollbackSnapshot(input: {
  deploymentId: string
  organizationId: string
  changeType: string
  pageUrl: string
  previousValue: unknown
  newValue: unknown
}): Promise<void> {
  const prisma = getPrismaClient()

  await prisma.executionRollbackSnapshot.create({
    data: {
      executionDeploymentId: input.deploymentId,
      organizationId: input.organizationId,
      changeType: input.changeType,
      pageUrl: input.pageUrl,
      previousValue: input.previousValue as any,
      newValue: input.newValue as any,
    },
  })
}

export async function performRollback(request: RollbackRequest): Promise<RollbackResult> {
  const startTime = Date.now()
  const prisma = getPrismaClient()

  try {
    // Get deployment and related snapshot
    const deployment = await prisma.executionDeployment.findUnique({
      where: { id: request.deploymentId },
    })

    if (!deployment) {
      throw new Error(`Deployment ${request.deploymentId} not found`)
    }

    const snapshot = await prisma.executionRollbackSnapshot.findFirst({
      where: { executionDeploymentId: request.deploymentId },
    })

    if (!snapshot) {
      throw new Error('No rollback snapshot found for this deployment')
    }

    // Mark deployment as rolling back
    await prisma.executionDeployment.update({
      where: { id: request.deploymentId },
      data: {
        actualStatus: 'rollback_pending',
        rollbackReason: request.reason,
      },
    })

    const errors: string[] = []
    let successCount = 0

    // Rollback the change
    try {
      await revertChange(snapshot as any)
      successCount++

      // Update snapshot status
      await prisma.executionRollbackSnapshot.update({
        where: { id: snapshot.id },
        data: {
          rollbackStatus: 'success',
          rollbackExecutedAt: new Date(),
        },
      })
    } catch (error) {
      errors.push(
        `Failed to rollback ${snapshot.changeType} on ${snapshot.pageUrl}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }

    // Update deployment status
    const finalStatus = errors.length === 0 ? 'rolled_back' : 'rollback_failed'
    await prisma.executionDeployment.update({
      where: { id: request.deploymentId },
      data: {
        actualStatus: finalStatus,
        rollbackExecuted: true,
        rollbackReason: request.reason,
      },
    })

    return {
      success: errors.length === 0,
      deploymentId: request.deploymentId,
      rollbackStatus: errors.length === 0 ? 'success' : 'failed',
      changesReverted: successCount,
      errors,
      timeToRollback: Date.now() - startTime,
    }
  } catch (error) {
    return {
      success: false,
      deploymentId: request.deploymentId,
      rollbackStatus: 'failed',
      changesReverted: 0,
      errors: [error instanceof Error ? error.message : String(error)],
      timeToRollback: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function revertChange(snapshot: {
  changeType: string
  pageUrl: string
  previousValue: unknown
  newValue: unknown
}): Promise<void> {
  // In production, this would use WordPress APIs or direct HTTP to revert changes
  // For now, implement basic reversal logic

  switch (snapshot.changeType) {
    case 'title':
      await revertTitle(snapshot.pageUrl, snapshot.previousValue as string)
      break

    case 'meta_description':
      await revertMetaDescription(snapshot.pageUrl, snapshot.previousValue as string)
      break

    case 'canonical':
      await revertCanonical(snapshot.pageUrl, snapshot.previousValue as string)
      break

    case 'schema':
      await revertSchema(snapshot.pageUrl, snapshot.previousValue as Record<string, unknown>)
      break

    case 'internal_links':
      await revertInternalLinks(snapshot.pageUrl, snapshot.newValue as string[])
      break

    case 'content':
      await revertContent(snapshot.pageUrl, snapshot.previousValue as string)
      break

    case 'redirect':
      await revertRedirect(snapshot.pageUrl)
      break

    default:
      throw new Error(`Unknown change type for rollback: ${snapshot.changeType}`)
  }
}

async function revertTitle(pageUrl: string, previousTitle: string): Promise<void> {
  const postId = await resolvePostIdFromUrl(pageUrl)
  if (!postId) throw new Error(`Could not resolve post ID for ${pageUrl}`)

  await makeWordPressRequest('POST', `/posts/${postId}`, {
    title: previousTitle,
    meta: { yoast_title: previousTitle, rank_math_title: previousTitle },
  })
}

async function revertMetaDescription(pageUrl: string, previousDescription: string): Promise<void> {
  const postId = await resolvePostIdFromUrl(pageUrl)
  if (!postId) throw new Error(`Could not resolve post ID for ${pageUrl}`)

  await makeWordPressRequest('POST', `/posts/${postId}`, {
    meta: {
      yoast_metadesc: previousDescription,
      rank_math_description: previousDescription,
    },
  })
}

async function revertCanonical(pageUrl: string, previousCanonical: string): Promise<void> {
  const postId = await resolvePostIdFromUrl(pageUrl)
  if (!postId) throw new Error(`Could not resolve post ID for ${pageUrl}`)

  await makeWordPressRequest('POST', `/posts/${postId}`, {
    meta: {
      rank_math_canonical: previousCanonical,
      _wp_canonical: previousCanonical,
    },
  })
}

async function revertSchema(pageUrl: string, previousSchema: Record<string, unknown>): Promise<void> {
  const postId = await resolvePostIdFromUrl(pageUrl)
  if (!postId) throw new Error(`Could not resolve post ID for ${pageUrl}`)

  if (previousSchema) {
    await makeWordPressRequest('POST', `/posts/${postId}`, {
      meta: {
        rank_math_schema: JSON.stringify(previousSchema),
        _schema_markup: JSON.stringify(previousSchema),
      },
    })
  }
}

async function revertInternalLinks(pageUrl: string, linksToRemove: string[]): Promise<void> {
  const postId = await resolvePostIdFromUrl(pageUrl)
  if (!postId) throw new Error(`Could not resolve post ID for ${pageUrl}`)

  // Fetch current content and remove links
  const response = await makeWordPressRequest('GET', `/posts/${postId}`)
  const post = (await response.json()) as Record<string, any>
  let content = post.content?.rendered || ''

  for (const link of linksToRemove) {
    const regex = new RegExp(`<a[^>]*href=["']${link}["'][^>]*>.*?</a>`, 'gi')
    content = content.replace(regex, '')
  }

  await makeWordPressRequest('POST', `/posts/${postId}`, { content })
}

async function revertContent(pageUrl: string, previousContent: string): Promise<void> {
  const postId = await resolvePostIdFromUrl(pageUrl)
  if (!postId) throw new Error(`Could not resolve post ID for ${pageUrl}`)

  await makeWordPressRequest('POST', `/posts/${postId}`, {
    content: previousContent,
  })
}

async function revertRedirect(pageUrl: string): Promise<void> {
  // Remove redirect rule from WordPress
  const redirectUrl = new URL(pageUrl)
  const redirectPath = redirectUrl.pathname

  // Check for redirect plugin
  await makeWordPressRequest('DELETE', `/redirect-rule`, {
    source: redirectPath,
  }).catch(() => {
    // Ignore if redirect plugin doesn't exist
  })
}

async function resolvePostIdFromUrl(pageUrl: string): Promise<number | null> {
  try {
    const url = new URL(pageUrl)
    const path = url.pathname.replace(/^\/|\/$/g, '')

    const response = await makeWordPressRequest('GET', `/posts?slug=${encodeURIComponent(path)}&_fields=id`)
    const posts = (await response.json()) as { id: number }[]

    return posts.length > 0 ? posts[0].id : null
  } catch {
    return null
  }
}

async function makeWordPressRequest(
  method: string,
  endpoint: string,
  body?: Record<string, unknown>
): Promise<Response> {
  // Get WordPress auth from environment
  const wpBaseUrl = process.env.WORDPRESS_BASE_URL || 'http://localhost'
  const wpUsername = process.env.WORDPRESS_USERNAME || ''
  const wpAppPassword = process.env.WORDPRESS_APP_PASSWORD || ''

  const url = `${wpBaseUrl}/wp-json/wp/v2${endpoint}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add basic auth with app password
  if (wpUsername && wpAppPassword) {
    const auth = Buffer.from(`${wpUsername}:${wpAppPassword}`).toString('base64')
    headers['Authorization'] = `Basic ${auth}`
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    throw new Error(`WordPress API error: ${response.status} ${response.statusText}`)
  }

  return response
}

export async function getRollbackSnapshots(deploymentId: string): Promise<RollbackSnapshot[]> {
  const prisma = getPrismaClient()

  const snapshot = await prisma.executionRollbackSnapshot.findFirst({
    where: { executionDeploymentId: deploymentId },
  })

  if (!snapshot) {
    return []
  }

  return [{
    deploymentId: snapshot.executionDeploymentId,
    changeType: snapshot.changeType,
    pageUrl: snapshot.pageUrl,
    previousValue: snapshot.previousValue,
    newValue: snapshot.newValue,
    timestamp: snapshot.createdAt,
    verified: snapshot.rollbackStatus === 'success',
  }]
}

export async function validateRollbackSafety(deploymentId: string): Promise<boolean> {
  const prisma = getPrismaClient()

  const snapshot = await prisma.executionRollbackSnapshot.findFirst({
    where: { executionDeploymentId: deploymentId },
  })

  if (!snapshot) {
    return false
  }

  // Check that snapshot has both previous and new values
  if (snapshot.previousValue === null || snapshot.newValue === null) {
    return false
  }

  return true
}
