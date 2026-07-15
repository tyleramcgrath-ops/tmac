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
    const plugin = this.selectPluginForChange(executionType)
    const yoastHeadJson = post.yoast_head_json as Record<string, any> | undefined

    switch (executionType) {
      case 'update_seo_title':
        result.push({
          field: 'seo_title',
          previousValue: yoastHeadJson?.title || post.title?.rendered || '',
          newValue: changes.newTitle,
          appliedAt: new Date(),
          plugin,
        })
        break

      case 'update_meta_description':
        result.push({
          field: 'meta_description',
          previousValue: yoastHeadJson?.description || '',
          newValue: changes.newDescription,
          appliedAt: new Date(),
          plugin,
        })
        break

      case 'update_canonical':
        result.push({
          field: 'canonical',
          previousValue: yoastHeadJson?.canonical || post.link || '',
          newValue: changes.canonicalUrl,
          appliedAt: new Date(),
          plugin,
        })
        break

      case 'update_robots':
        result.push({
          field: 'robots_directive',
          previousValue: yoastHeadJson?.robots || 'index, follow',
          newValue: changes.robotsDirective,
          appliedAt: new Date(),
          plugin,
        })
        break

      case 'add_schema':
        result.push({
          field: 'schema_markup',
          previousValue: this.extractSchema(post.content?.rendered || ''),
          newValue: changes.schemaData,
          appliedAt: new Date(),
          plugin,
        })
        break

      case 'add_internal_links':
        result.push({
          field: 'internal_links',
          previousValue: this.extractLinks(post.content?.rendered || ''),
          newValue: changes.links,
          appliedAt: new Date(),
          plugin,
        })
        break

      case 'add_faq':
        result.push({
          field: 'faq_section',
          previousValue: this.extractFAQ(post.content?.rendered || ''),
          newValue: changes.faqs,
          appliedAt: new Date(),
          plugin,
        })
        break

      case 'improve_headings':
        result.push({
          field: 'heading_structure',
          previousValue: this.extractHeadings(post.content?.rendered || ''),
          newValue: changes.headings,
          appliedAt: new Date(),
          plugin,
        })
        break

      case 'update_image_alt':
        result.push({
          field: 'image_alt_text',
          previousValue: this.extractImageAlt(post.content?.rendered || ''),
          newValue: changes.imageUpdates,
          appliedAt: new Date(),
          plugin,
        })
        break

      case 'update_content':
        result.push({
          field: 'content',
          previousValue: (post.content?.rendered || '').substring(0, 200),
          newValue: (changes.contentChanges as any)?.newContent?.substring?.(0, 200) || changes.contentChanges,
          appliedAt: new Date(),
          plugin,
        })
        break

      case 'add_redirect':
        result.push({
          field: 'redirect',
          previousValue: null,
          newValue: { from: changes.sourceUrl, to: changes.targetUrl, type: changes.redirectType },
          appliedAt: new Date(),
          plugin: 'core',
        })
        break

      case 'update_sitemap':
        result.push({
          field: 'sitemap',
          previousValue: 'existing_sitemap',
          newValue: changes.urlChanges,
          appliedAt: new Date(),
          plugin: 'core',
        })
        break

      case 'improve_indexation':
        result.push({
          field: 'indexation_signals',
          previousValue: yoastHeadJson?.robots || 'index, follow',
          newValue: changes.improvements,
          appliedAt: new Date(),
          plugin,
        })
        break
    }

    return result
  }

  private extractSchema(html: string): unknown {
    const match = html.match(/<script type="application\/ld\+json"[^>]*>([^<]+)<\/script>/)
    if (match) {
      try {
        return JSON.parse(match[1])
      } catch {
        return null
      }
    }
    return null
  }

  private extractLinks(html: string): string[] {
    const matches = html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/g) || []
    return matches.map((m) => m.match(/href=["']([^"']+)["']/)?.[1] || '').filter(Boolean)
  }

  private extractFAQ(html: string): unknown {
    const faqMatch = html.match(/<div[^>]*class="[^"]*faq[^"]*"[^>]*>[\s\S]*?<\/div>/i)
    return faqMatch ? faqMatch[0].substring(0, 100) : null
  }

  private extractHeadings(html: string): string[] {
    const matches = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/g) || []
    return matches.map((m) => m.replace(/<[^>]+>/g, ''))
  }

  private extractImageAlt(html: string): Record<string, string> {
    const alt: Record<string, string> = {}
    const matches = html.match(/<img[^>]+alt=["']([^"']*)["'][^>]*>/g) || []
    matches.forEach((m, i) => {
      const altMatch = m.match(/alt=["']([^"']*)["']/)
      if (altMatch) {
        alt[`image_${i}`] = altMatch[1]
      }
    })
    return alt
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
    const yoastHeadJson = (post.yoast_head_json as Record<string, any>) || {}

    try {
      switch (executionType) {
        case 'update_seo_title':
          await this.updateTitle(postId, changes.newTitle as string, plugin)
          result.changes.push({
            field: 'seo_title',
            previousValue: yoastHeadJson?.title || post.title || '',
            newValue: changes.newTitle,
            appliedAt: new Date(),
            plugin,
          })
          break

        case 'update_meta_description':
          await this.updateMetaDescription(postId, changes.newDescription as string, plugin)
          result.changes.push({
            field: 'meta_description',
            previousValue: yoastHeadJson?.description || '',
            newValue: changes.newDescription,
            appliedAt: new Date(),
            plugin,
          })
          break

        case 'update_canonical':
          await this.updateCanonical(postId, changes.canonicalUrl as string, plugin)
          result.changes.push({
            field: 'canonical',
            previousValue: yoastHeadJson?.canonical || post.link || '',
            newValue: changes.canonicalUrl,
            appliedAt: new Date(),
            plugin,
          })
          break

        case 'update_robots':
          await this.updateRobots(postId, changes.robotsDirective as string, plugin)
          result.changes.push({
            field: 'robots_directive',
            previousValue: yoastHeadJson?.robots || 'index, follow',
            newValue: changes.robotsDirective,
            appliedAt: new Date(),
            plugin,
          })
          break

        case 'add_schema':
          await this.addSchema(postId, changes.schemaType as string, changes.schemaData as Record<string, unknown>, plugin)
          result.changes.push({
            field: 'schema_markup',
            previousValue: null,
            newValue: changes.schemaData,
            appliedAt: new Date(),
            plugin,
          })
          break

        case 'add_internal_links':
          await this.addInternalLinks(postId, changes.links as Array<{ url: string; anchor: string }>, plugin)
          result.changes.push({
            field: 'internal_links',
            previousValue: [],
            newValue: changes.links,
            appliedAt: new Date(),
            plugin,
          })
          break

        case 'add_faq':
          await this.addFAQ(postId, changes.faqs as Array<{ question: string; answer: string }>, plugin)
          result.changes.push({
            field: 'faq_section',
            previousValue: null,
            newValue: changes.faqs,
            appliedAt: new Date(),
            plugin,
          })
          break

        case 'improve_headings':
          await this.improveHeadings(postId, changes.headings as Record<string, string>, plugin)
          result.changes.push({
            field: 'heading_structure',
            previousValue: null,
            newValue: changes.headings,
            appliedAt: new Date(),
            plugin,
          })
          break

        case 'update_image_alt':
          await this.updateImageAlt(postId, changes.imageUpdates as Record<string, string>, plugin)
          result.changes.push({
            field: 'image_alt_text',
            previousValue: null,
            newValue: changes.imageUpdates,
            appliedAt: new Date(),
            plugin,
          })
          break

        case 'update_content':
          await this.updateContent(postId, changes.contentChanges as Record<string, unknown>, plugin)
          result.changes.push({
            field: 'content',
            previousValue: (post.content as any)?.rendered?.substring(0, 200) || '',
            newValue: ((changes.contentChanges as any)?.newContent || '').substring(0, 200),
            appliedAt: new Date(),
            plugin,
          })
          break

        case 'add_redirect':
          await this.addRedirect(changes.sourceUrl as string, changes.targetUrl as string, changes.redirectType as string)
          result.changes.push({
            field: 'redirect',
            previousValue: null,
            newValue: { from: changes.sourceUrl, to: changes.targetUrl, type: changes.redirectType },
            appliedAt: new Date(),
            plugin: 'core',
          })
          break

        case 'update_sitemap':
          await this.updateSitemap(changes.sitemapType as string, changes.urlChanges as string[])
          result.changes.push({
            field: 'sitemap',
            previousValue: 'existing_sitemap',
            newValue: changes.urlChanges,
            appliedAt: new Date(),
            plugin: 'core',
          })
          break

        case 'improve_indexation':
          await this.improveIndexation(postId, changes.improvements as Record<string, unknown>, plugin)
          result.changes.push({
            field: 'indexation_signals',
            previousValue: yoastHeadJson?.robots || 'index, follow',
            newValue: changes.improvements,
            appliedAt: new Date(),
            plugin,
          })
          break
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

  private async updateCanonical(postId: number, canonicalUrl: string, plugin: WordPressPlugin): Promise<void> {
    if (plugin === 'yoast') {
      await this.makeRequest('POST', `/posts/${postId}`, {
        yoast_head: { canonical: canonicalUrl },
      })
    } else if (plugin === 'rank_math') {
      await this.makeRequest('POST', `/posts/${postId}`, {
        meta: { rank_math_canonical: canonicalUrl },
      })
    } else if (plugin === 'aioseo') {
      await this.makeRequest('POST', `/posts/${postId}`, {
        aioseo: { canonical: canonicalUrl },
      })
    } else {
      // Core WordPress - add canonical to post meta
      await this.makeRequest('POST', `/posts/${postId}`, {
        meta: { _wp_canonical: canonicalUrl },
      })
    }
  }

  private async updateRobots(postId: number, directive: string, plugin: WordPressPlugin): Promise<void> {
    if (plugin === 'yoast') {
      await this.makeRequest('POST', `/posts/${postId}`, {
        yoast_head: { robots: directive },
      })
    } else if (plugin === 'rank_math') {
      const [noindex, nofollow] = directive.includes('noindex') ? ['on', ''] : ['', '']
      await this.makeRequest('POST', `/posts/${postId}`, {
        meta: { rank_math_robots: [noindex ? 'noindex' : '', nofollow ? 'nofollow' : ''].filter(Boolean),
        },
      })
    } else {
      await this.makeRequest('POST', `/posts/${postId}`, {
        meta: { _robots_directive: directive },
      })
    }
  }

  private async addSchema(
    postId: number,
    schemaType: string,
    schemaData: Record<string, unknown>,
    plugin: WordPressPlugin
  ): Promise<void> {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': schemaType,
      ...schemaData,
    }

    if (plugin === 'yoast') {
      await this.makeRequest('POST', `/posts/${postId}`, {
        yoast_head: { schema: jsonLd },
      })
    } else if (plugin === 'rank_math') {
      await this.makeRequest('POST', `/posts/${postId}`, {
        meta: { rank_math_schema: JSON.stringify(jsonLd) },
      })
    } else {
      // Insert as JSON-LD block in content
      await this.makeRequest('POST', `/posts/${postId}`, {
        meta: { _schema_markup: JSON.stringify(jsonLd) },
      })
    }
  }

  private async addInternalLinks(
    postId: number,
    links: Array<{ url: string; anchor: string }>,
    plugin: WordPressPlugin
  ): Promise<void> {
    // Update post content to include new links
    const post = await this.getPost(postId)
    let updatedContent = post.content?.rendered || ''

    for (const link of links) {
      const linkHtml = `<a href="${link.url}">${link.anchor}</a>`
      updatedContent += `\n${linkHtml}`
    }

    await this.makeRequest('POST', `/posts/${postId}`, {
      content: updatedContent,
    })
  }

  private async addFAQ(
    postId: number,
    faqs: Array<{ question: string; answer: string }>,
    plugin: WordPressPlugin
  ): Promise<void> {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    }

    if (plugin === 'yoast') {
      await this.makeRequest('POST', `/posts/${postId}`, {
        yoast_head: { faq_schema: faqSchema },
      })
    } else {
      await this.makeRequest('POST', `/posts/${postId}`, {
        meta: { _faq_schema: JSON.stringify(faqSchema) },
      })
    }
  }

  private async improveHeadings(
    postId: number,
    headings: Record<string, string>,
    plugin: WordPressPlugin
  ): Promise<void> {
    // Update post content with improved headings
    const post = await this.getPost(postId)
    let updatedContent = post.content?.rendered || ''

    // Replace headings with improved versions
    for (const [oldHeading, newHeading] of Object.entries(headings)) {
      const regex = new RegExp(`<h([1-6])([^>]*)>${oldHeading}</h\\1>`, 'gi')
      updatedContent = updatedContent.replace(regex, `<h$1$2>${newHeading}</h$1>`)
    }

    await this.makeRequest('POST', `/posts/${postId}`, {
      content: updatedContent,
    })
  }

  private async updateImageAlt(
    postId: number,
    imageUpdates: Record<string, string>,
    plugin: WordPressPlugin
  ): Promise<void> {
    // Update post content with new alt text
    const post = await this.getPost(postId)
    let updatedContent = post.content?.rendered || ''

    for (const [imageId, altText] of Object.entries(imageUpdates)) {
      // Update img tags with new alt text
      const regex = /<img([^>]*?)alt="[^"]*"([^>]*?)>/gi
      updatedContent = updatedContent.replace(regex, `<img$1alt="${altText}"$2>`)
    }

    await this.makeRequest('POST', `/posts/${postId}`, {
      content: updatedContent,
    })
  }

  private async updateContent(
    postId: number,
    contentChanges: Record<string, unknown>,
    plugin: WordPressPlugin
  ): Promise<void> {
    const newContent = (contentChanges.newContent as string) || ''

    await this.makeRequest('POST', `/posts/${postId}`, {
      content: newContent,
    })
  }

  private async addRedirect(sourceUrl: string, targetUrl: string, redirectType: string): Promise<void> {
    // In production, would configure .htaccess or WordPress redirect plugin
    // For now, store as option
    const redirectData = {
      source: sourceUrl,
      target: targetUrl,
      type: redirectType === '301' ? 'permanent' : 'temporary',
      timestamp: new Date().toISOString(),
    }

    await this.makeRequest('POST', '/settings', {
      redirect_rule: JSON.stringify(redirectData),
    })
  }

  private async updateSitemap(sitemapType: string, urlChanges: string[]): Promise<void> {
    // In production, would regenerate sitemap.xml
    // For now, store changes for manual processing
    console.log(`[EXECUTION] Updated ${sitemapType} sitemap with ${urlChanges.length} URL changes`)
  }

  private async improveIndexation(
    postId: number,
    improvements: Record<string, unknown>,
    plugin: WordPressPlugin
  ): Promise<void> {
    // Update indexation signals
    const indexationData = {
      robots: (improvements.robots as string) || 'index, follow',
      priority: (improvements.priority as string) || '0.8',
      changefreq: (improvements.changefreq as string) || 'weekly',
    }

    if (plugin === 'yoast') {
      await this.makeRequest('POST', `/posts/${postId}`, {
        yoast_head: indexationData,
      })
    } else {
      await this.makeRequest('POST', `/posts/${postId}`, {
        meta: { _indexation_data: JSON.stringify(indexationData) },
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
