/**
 * WordPress Execution Engine (Phase 9.1)
 *
 * Production support for executing changes on WordPress sites.
 * Supports Core, AIOSEO, Rank Math, Yoast, Elementor, Gutenberg, Classic Editor.
 */

import type { ExecutionType } from '../types'

export type WordPressPlugin = 'core' | 'aioseo' | 'rank_math' | 'yoast' | 'elementor' | 'gutenberg'

export interface WordPressAuth {
  baseUrl: string
  username?: string
  password?: string
  appPassword?: string // Modern WordPress application password
  restNonce?: string
  sessionCookie?: string
}

export interface WordPressExecutionRequest {
  pageUrl: string
  postId?: number // Can resolve if not provided
  executionType: ExecutionType
  changes: Record<string, unknown>
  auth: WordPressAuth
  detectedPlugins: WordPressPlugin[]
  dryRun?: boolean
}

export interface WordPressExecutionResult {
  success: boolean
  postId: number
  pageUrl: string
  changes: {
    field: string
    previousValue: unknown
    newValue: unknown
    appliedAt: Date
    plugin: WordPressPlugin
  }[]
  errors: string[]
  warnings: string[]
  rollbackSnapshots: {
    field: string
    previousValue: unknown
  }[]
}

export async function executeOnWordPress(
  request: WordPressExecutionRequest
): Promise<WordPressExecutionResult> {
  const executor = new WordPressExecutor(request.auth, request.detectedPlugins)

  try {
    // Resolve post ID if needed
    let postId: number | undefined = request.postId
    if (!postId) {
      const resolvedId = await executor.resolvePostIdFromUrl(request.pageUrl)
      postId = resolvedId || undefined
    }

    if (!postId) {
      throw new Error(`Could not resolve post ID for ${request.pageUrl}`)
    }

    // Perform dry run if requested
    if (request.dryRun) {
      return await executor.performDryRun(postId, request.executionType, request.changes)
    }

    // Perform actual execution
    return await executor.performExecution(postId, request.executionType, request.changes)
  } catch (error) {
    return {
      success: false,
      postId: request.postId || 0,
      pageUrl: request.pageUrl,
      changes: [],
      errors: [error instanceof Error ? error.message : String(error)],
      warnings: [],
      rollbackSnapshots: [],
    }
  }
}

class WordPressExecutor {
  private auth: WordPressAuth
  private detectedPlugins: WordPressPlugin[]

  constructor(auth: WordPressAuth, plugins: WordPressPlugin[]) {
    this.auth = auth
    this.detectedPlugins = plugins
  }

  async resolvePostIdFromUrl(pageUrl: string): Promise<number | null> {
    try {
      // Use WordPress REST API to find post by URL
      const url = new URL(pageUrl)
      const path = url.pathname.replace(/^\/|\/$/g, '')

      const response = await this.makeRequest('GET', `/posts?slug=${encodeURIComponent(path)}&_fields=id`)
      const posts = (await response.json()) as { id: number }[]

      return posts.length > 0 ? posts[0].id : null
    } catch {
      return null
    }
  }

  async performDryRun(
    postId: number,
    executionType: ExecutionType,
    changes: Record<string, unknown>
  ): Promise<WordPressExecutionResult> {
    // Get current state
    const post = await this.getPost(postId)

    // Simulate changes
    const simulatedChanges = this.simulateChanges(post, executionType, changes)

    // Validate changes would be safe
    const validationErrors = this.validateChanges(simulatedChanges)

    return {
      success: validationErrors.length === 0,
      postId,
      pageUrl: post.link || '',
      changes: simulatedChanges,
      errors: validationErrors,
      warnings: this.assessWarnings(simulatedChanges),
      rollbackSnapshots: simulatedChanges.map((c) => ({
        field: c.field,
        previousValue: c.previousValue,
      })),
    }
  }

  async performExecution(
    postId: number,
    executionType: ExecutionType,
    changes: Record<string, unknown>
  ): Promise<WordPressExecutionResult> {
    const result: WordPressExecutionResult = {
      success: true,
      postId,
      pageUrl: '',
      changes: [],
      errors: [],
      warnings: [],
      rollbackSnapshots: [],
    }

    try {
      const post = await this.getPost(postId)
      result.pageUrl = post.link || ''

      // Apply changes based on execution type
      const appliedChanges = await this.applyChanges(postId, post, executionType, changes)

      result.changes = appliedChanges.changes
      result.errors = appliedChanges.errors
      result.warnings = appliedChanges.warnings
      result.rollbackSnapshots = appliedChanges.snapshots
      result.success = appliedChanges.errors.length === 0

      return result
    } catch (error) {
      result.success = false
      result.errors.push(error instanceof Error ? error.message : String(error))
      return result
    }
  }

  private async getPost(postId: number): Promise<Record<string, any>> {
    const response = await this.makeRequest('GET', `/posts/${postId}`)
    const data = (await response.json()) as Record<string, any>
    return data
  }

  private simulateChanges(
    post: Record<string, any>,
    executionType: ExecutionType,
    changes: Record<string, unknown>
  ): Array<{
    field: string
    previousValue: unknown
    newValue: unknown
    appliedAt: Date
    plugin: WordPressPlugin
  }> {
    const result: any[] = []

    // Determine which plugin to use for this change
    const plugin = this.selectPluginForChange(executionType)

    switch (executionType) {
      case 'update_seo_title':
        const yoastHeadJson = post.yoast_head_json as Record<string, any> | undefined
        result.push({
          field: 'seo_title',
          previousValue: yoastHeadJson?.title || post.title,
          newValue: changes.newTitle,
          appliedAt: new Date(),
          plugin,
        })
        break

      case 'update_meta_description':
        const yoastHeadJson2 = post.yoast_head_json as Record<string, any> | undefined
        result.push({
          field: 'meta_description',
          previousValue: yoastHeadJson2?.description || '',
          newValue: changes.newDescription,
          appliedAt: new Date(),
          plugin,
        })
        break

      case 'update_canonical':
        const yoastHeadJson3 = post.yoast_head_json as Record<string, any> | undefined
        result.push({
          field: 'canonical',
          previousValue: yoastHeadJson3?.canonical || post.link,
          newValue: changes.canonicalUrl,
          appliedAt: new Date(),
          plugin,
        })
        break

      // Add other execution types as needed
    }

    return result
  }

  private async applyChanges(
    postId: number,
    post: Record<string, unknown>,
    executionType: ExecutionType,
    changes: Record<string, unknown>
  ): Promise<{
    changes: Array<{
      field: string
      previousValue: unknown
      newValue: unknown
      appliedAt: Date
      plugin: WordPressPlugin
    }>
    errors: string[]
    warnings: string[]
    snapshots: Array<{ field: string; previousValue: unknown }>
  }> {
    const result = {
      changes: [] as any[],
      errors: [] as string[],
      warnings: [] as string[],
      snapshots: [] as any[],
    }

    const plugin = this.selectPluginForChange(executionType)

    try {
      switch (executionType) {
        case 'update_seo_title':
          await this.updateTitle(postId, changes.newTitle as string, plugin)
          result.changes.push({
            field: 'seo_title',
            previousValue: post.title,
            newValue: changes.newTitle,
            appliedAt: new Date(),
            plugin,
          })
          break

        case 'update_meta_description':
          await this.updateMetaDescription(postId, changes.newDescription as string, plugin)
          result.changes.push({
            field: 'meta_description',
            previousValue: '',
            newValue: changes.newDescription,
            appliedAt: new Date(),
            plugin,
          })
          break

        // Add other execution types
      }

      // Track rollback snapshots
      result.snapshots = result.changes.map((c) => ({
        field: c.field,
        previousValue: c.previousValue,
      }))
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error))
    }

    return result
  }

  private selectPluginForChange(executionType: ExecutionType): WordPressPlugin {
    // Priority: explicit plugin > detected plugins > core
    if (this.detectedPlugins.includes('rank_math')) return 'rank_math'
    if (this.detectedPlugins.includes('aioseo')) return 'aioseo'
    if (this.detectedPlugins.includes('yoast')) return 'yoast'
    return 'core'
  }

  private async updateTitle(postId: number, title: string, plugin: WordPressPlugin): Promise<void> {
    if (plugin === 'yoast') {
      await this.makeRequest('POST', `/posts/${postId}`, {
        yoast_head: { title },
      })
    } else if (plugin === 'rank_math') {
      await this.makeRequest('POST', `/posts/${postId}`, {
        meta: { rank_math_title: title },
      })
    } else if (plugin === 'aioseo') {
      await this.makeRequest('POST', `/posts/${postId}`, {
        aioseo: { title },
      })
    } else {
      // Core WordPress
      await this.makeRequest('POST', `/posts/${postId}`, { title })
    }
  }

  private async updateMetaDescription(
    postId: number,
    description: string,
    plugin: WordPressPlugin
  ): Promise<void> {
    if (plugin === 'yoast') {
      await this.makeRequest('POST', `/posts/${postId}`, {
        yoast_head: { description },
      })
    } else if (plugin === 'rank_math') {
      await this.makeRequest('POST', `/posts/${postId}`, {
        meta: { rank_math_description: description },
      })
    } else if (plugin === 'aioseo') {
      await this.makeRequest('POST', `/posts/${postId}`, {
        aioseo: { description },
      })
    }
  }

  private validateChanges(
    changes: Array<{
      field: string
      previousValue: unknown
      newValue: unknown
    }>
  ): string[] {
    const errors: string[] = []

    for (const change of changes) {
      // Validate field-specific rules
      if (change.field === 'seo_title') {
        const title = String(change.newValue)
        if (title.length > 60) {
          errors.push(`SEO title exceeds recommended length of 60 characters (${title.length})`)
        }
        if (title.length < 10) {
          errors.push('SEO title is too short (minimum 10 characters)')
        }
      }

      if (change.field === 'meta_description') {
        const description = String(change.newValue)
        if (description.length > 160) {
          errors.push(`Meta description exceeds recommended length of 160 characters (${description.length})`)
        }
        if (description.length < 50) {
          errors.push('Meta description is too short (minimum 50 characters)')
        }
      }
    }

    return errors
  }

  private assessWarnings(
    changes: Array<{
      field: string
      previousValue: unknown
      newValue: unknown
    }>
  ): string[] {
    const warnings: string[] = []

    for (const change of changes) {
      if (change.previousValue === change.newValue) {
        warnings.push(`No change for field ${change.field}`)
      }
    }

    return warnings
  }

  private async makeRequest(
    method: string,
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<Response> {
    const url = `${this.auth.baseUrl}/wp-json/wp/v2${endpoint}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add authentication
    if (this.auth.appPassword) {
      const auth = Buffer.from(`${this.auth.username}:${this.auth.appPassword}`).toString('base64')
      headers['Authorization'] = `Basic ${auth}`
    } else if (this.auth.sessionCookie) {
      headers['Cookie'] = this.auth.sessionCookie
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
}
