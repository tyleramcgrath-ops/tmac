/**
 * Phase 9.2: Execution Validator
 *
 * Real-world validation of execution types against test WordPress instances.
 * Tests execution, verification, and rollback cycles.
 */

import { EXECUTION_TYPES, type ExecutionType } from './types'

export interface ExecutionEnvironment {
  name: string
  baseUrl: string
  username: string
  appPassword: string
  plugin: 'none' | 'yoast' | 'rank_math' | 'aioseo'
}

export interface ExecutionTestResult {
  executionType: ExecutionType
  environment: string
  status: 'passed' | 'failed' | 'partial'
  executionDuration: number
  verificationDuration: number
  rollbackDuration: number
  errors: string[]
  warnings: string[]
  evidence: {
    beforeState: Record<string, any>
    afterState: Record<string, any>
    rollbackState: Record<string, any>
  }
}

export interface PageSnapshot {
  postId: number
  title: string
  content: string
  meta: Record<string, any>
  html: string
  schema: any[]
  links: string[]
  canonical: string | null
  robots: string | null
}

/**
 * Capture current page state before execution
 */
export async function capturePageState(
  baseUrl: string,
  pageUrl: string,
  postId: number,
  auth: string
): Promise<PageSnapshot> {
  const startTime = Date.now()

  try {
    // Fetch WordPress post data
    const postResponse = await fetch(`${baseUrl}/wp-json/wp/v2/posts/${postId}`, {
      headers: { Authorization: `Basic ${auth}` },
    })
    const post = (await postResponse.json()) as any

    // Fetch HTML content
    const htmlResponse = await fetch(pageUrl)
    const html = await htmlResponse.text()

    // Extract metadata
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const descMatch = html.match(/<meta name="description" content="([^"]+)"/i)
    const robotsMatch = html.match(/<meta name="robots" content="([^"]+)"/i)
    const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"/i)

    // Extract schema
    const schemaMatches = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/g) || []
    const schemas = schemaMatches.map((match) => {
      try {
        const jsonStr = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '')
        return JSON.parse(jsonStr)
      } catch {
        return null
      }
    }).filter(Boolean)

    // Extract links
    const linkMatches = html.match(/<a[^>]+href="([^"]+)"/g) || []
    const links = linkMatches.map((m) => {
      const match = m.match(/href="([^"]+)"/)
      return match ? match[1] : null
    }).filter(Boolean) as string[]

    const duration = Date.now() - startTime

    return {
      postId,
      title: post.title.raw || titleMatch?.[1] || 'Unknown',
      content: post.content.raw || '',
      meta: post.meta || {},
      html,
      schema: schemas,
      links,
      canonical: canonicalMatch?.[1] || null,
      robots: robotsMatch?.[1] || null,
    }
  } catch (error) {
    throw new Error(`Failed to capture page state: ${error}`)
  }
}

/**
 * Compare two page states to detect changes
 */
export function comparePageStates(
  before: PageSnapshot,
  after: PageSnapshot
): { changed: boolean; changes: Record<string, { before: any; after: any }> } {
  const changes: Record<string, { before: any; after: any }> = {}

  if (before.title !== after.title) {
    changes.title = { before: before.title, after: after.title }
  }

  if (before.content !== after.content) {
    changes.content = { before: before.content.substring(0, 100), after: after.content.substring(0, 100) }
  }

  if (JSON.stringify(before.meta) !== JSON.stringify(after.meta)) {
    changes.meta = { before: before.meta, after: after.meta }
  }

  if (JSON.stringify(before.schema) !== JSON.stringify(after.schema)) {
    changes.schema = { before: before.schema?.length || 0, after: after.schema?.length || 0 }
  }

  if (before.canonical !== after.canonical) {
    changes.canonical = { before: before.canonical, after: after.canonical }
  }

  if (before.robots !== after.robots) {
    changes.robots = { before: before.robots, after: after.robots }
  }

  return {
    changed: Object.keys(changes).length > 0,
    changes,
  }
}

/**
 * Validate execution against test environment
 */
export async function validateExecution(
  executionType: ExecutionType,
  env: ExecutionEnvironment,
  pageUrl: string,
  postId: number,
  inputs: Record<string, any>
): Promise<ExecutionTestResult> {
  const result: ExecutionTestResult = {
    executionType,
    environment: env.name,
    status: 'failed',
    executionDuration: 0,
    verificationDuration: 0,
    rollbackDuration: 0,
    errors: [],
    warnings: [],
    evidence: {
      beforeState: {},
      afterState: {},
      rollbackState: {},
    },
  }

  try {
    const auth = Buffer.from(`${env.username}:${env.appPassword}`).toString('base64')

    // Capture before state
    console.log(`📸 Capturing before state for ${executionType}...`)
    const beforeState = await capturePageState(env.baseUrl, pageUrl, postId, auth)
    result.evidence.beforeState = beforeState

    // Execute
    console.log(`⚙️  Executing ${executionType}...`)
    const executionStart = Date.now()
    const executionResponse = await fetch(`${env.baseUrl}/wp-json/wp/v2/posts/${postId}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildExecutionPayload(executionType, inputs, env.plugin)),
    })

    if (!executionResponse.ok) {
      throw new Error(`Execution failed: ${executionResponse.status} ${await executionResponse.text()}`)
    }

    result.executionDuration = Date.now() - executionStart

    // Wait for WordPress to process
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Capture after state
    console.log(`📸 Capturing after state...`)
    const afterState = await capturePageState(env.baseUrl, pageUrl, postId, auth)
    result.evidence.afterState = afterState

    // Verify changes
    const { changed, changes } = comparePageStates(beforeState, afterState)
    if (!changed) {
      result.warnings.push(`No changes detected after execution of ${executionType}`)
    } else {
      console.log(`✅ Changes detected:`, Object.keys(changes))
    }

    // Rollback
    console.log(`↩️  Rolling back changes...`)
    const rollbackStart = Date.now()
    const rollbackPayload = buildRollbackPayload(executionType, beforeState)
    const rollbackResponse = await fetch(`${env.baseUrl}/wp-json/wp/v2/posts/${postId}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rollbackPayload),
    })

    if (!rollbackResponse.ok) {
      throw new Error(`Rollback failed: ${rollbackResponse.status}`)
    }

    result.rollbackDuration = Date.now() - rollbackStart

    // Wait for rollback to process
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Verify rollback
    console.log(`📸 Capturing rollback state...`)
    const rollbackState = await capturePageState(env.baseUrl, pageUrl, postId, auth)
    result.evidence.rollbackState = rollbackState

    const { changed: stillChanged } = comparePageStates(beforeState, rollbackState)
    if (stillChanged) {
      result.warnings.push('Rollback did not fully restore original state')
      result.status = 'partial'
    } else {
      result.status = 'passed'
    }
  } catch (error) {
    result.errors.push(String(error))
    result.status = 'failed'
  }

  return result
}

/**
 * Build execution payload for WordPress API
 */
function buildExecutionPayload(
  type: ExecutionType,
  inputs: Record<string, any>,
  plugin: 'none' | 'yoast' | 'rank_math' | 'aioseo'
): Record<string, any> {
  const payload: Record<string, any> = {}

  switch (type) {
    case 'update_seo_title':
      payload.title = inputs.newTitle || 'Updated Title'
      if (plugin === 'yoast') {
        payload.yoast_head = { title: inputs.newTitle }
      } else if (plugin === 'rank_math') {
        payload.meta = { rank_math_title: inputs.newTitle }
      }
      break

    case 'update_meta_description':
      if (plugin === 'yoast') {
        payload.meta = { yoast_metadesc: inputs.newDescription || 'Updated description' }
      } else if (plugin === 'rank_math') {
        payload.meta = { rank_math_metadesc: inputs.newDescription || 'Updated description' }
      }
      break

    case 'add_schema':
      payload.content = `${inputs.content || ''}\n\n<script type="application/ld+json">${JSON.stringify(inputs.schema || { '@context': 'https://schema.org', '@type': 'Article' })}</script>`
      break

    case 'update_canonical':
      payload.meta = { canonical: inputs.canonicalUrl || 'https://example.com' }
      break

    case 'update_robots':
      payload.meta = { robots: inputs.robotsDirective || 'index, follow' }
      break

    default:
      payload.content = inputs.content || payload.content
  }

  return payload
}

/**
 * Build rollback payload to restore original state
 */
function buildRollbackPayload(type: ExecutionType, originalState: PageSnapshot): Record<string, any> {
  const payload: Record<string, any> = {
    title: originalState.title,
    content: originalState.content,
  }

  if (Object.keys(originalState.meta).length > 0) {
    payload.meta = originalState.meta
  }

  return payload
}

/**
 * Run validation suite for all execution types
 */
export async function runValidationSuite(
  environments: ExecutionEnvironment[],
  verbose = false
): Promise<ExecutionTestResult[]> {
  const results: ExecutionTestResult[] = []
  const executionTypes: ExecutionType[] = [
    'update_seo_title',
    'update_meta_description',
    'add_schema',
    'update_canonical',
    'update_robots',
    'add_internal_links',
    'add_faq',
    'improve_headings',
    'update_image_alt',
    'update_content',
    'add_redirect',
    'update_sitemap',
    'improve_indexation',
  ]

  for (const env of environments) {
    console.log(`\n🧪 Testing environment: ${env.name}`)

    for (const type of executionTypes) {
      const typeConfig = EXECUTION_TYPES[type]
      console.log(`  ├─ ${type} (${typeConfig.risk} risk)`)

      // Create test post
      const auth = Buffer.from(`${env.username}:${env.appPassword}`).toString('base64')
      const postResponse = await fetch(`${env.baseUrl}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Test Post - ${type}`,
          content: '<p>Test content for validation</p>',
          status: 'draft',
        }),
      })

      if (!postResponse.ok) {
        console.log(`  │  ⚠️  Failed to create test post`)
        continue
      }

      const post = (await postResponse.json()) as any
      const testUrl = `${env.baseUrl}/?p=${post.id}`

      const result = await validateExecution(type, env, testUrl, post.id, {
        newTitle: `Validated ${type}`,
        newDescription: `Description for ${type}`,
      })

      results.push(result)

      const icon = result.status === 'passed' ? '✅' : result.status === 'partial' ? '⚠️' : '❌'
      console.log(`  │  ${icon} ${result.status} (exec: ${result.executionDuration}ms, rb: ${result.rollbackDuration}ms)`)

      if (result.errors.length > 0 && verbose) {
        result.errors.forEach((err) => console.log(`  │     Error: ${err}`))
      }

      if (result.warnings.length > 0 && verbose) {
        result.warnings.forEach((warn) => console.log(`  │     Warning: ${warn}`))
      }

      // Cleanup test post
      await fetch(`${env.baseUrl}/wp-json/wp/v2/posts/${post.id}?force=true`, {
        method: 'DELETE',
        headers: { Authorization: `Basic ${auth}` },
      })
    }
  }

  return results
}
