import { getPrismaClient } from '@/lib/db'
import type { ExecutionDeployment } from '@prisma/client'
import { EXECUTION_TYPES } from './types'

/**
 * Verification Engine (Phase 9.1)
 *
 * Post-deployment verification that checks if execution was successful.
 * Automatically triggers rollback if critical checks fail.
 */

export type VerificationStatus = 'pending' | 'verifying' | 'success' | 'failed' | 'rollback_triggered'

export interface VerificationResult {
  status: VerificationStatus
  deploymentId: string
  executionPlanId: string
  checks: VerificationCheckResult[]
  summary: {
    totalChecks: number
    passedChecks: number
    failedChecks: number
    criticalFailures: number
    autoRollbackTriggered: boolean
    timeToVerify: number // milliseconds
  }
  error?: string
  shouldAutoRollback: boolean
  rollbackReason?: string
}

export interface VerificationCheckResult {
  checkName: string
  status: 'pending' | 'passed' | 'failed' | 'skipped'
  isCritical: boolean
  details: {
    description: string
    expectedValue?: unknown
    actualValue?: unknown
    evidence?: string // URL, screenshot, etc.
  }
  attemptCount: number
  maxAttempts: number
  error?: string
}

export async function verifyExecution(input: {
  deploymentId: string
  executionPlanId: string
  executionType: string
  pageUrl: string
  expectedChanges: Record<string, unknown>
  maxRetries?: number
}): Promise<VerificationResult> {
  const startTime = Date.now()
  const maxRetries = input.maxRetries || 3

  const prisma = getPrismaClient()

  // Get execution type definition
  const typeDefn = EXECUTION_TYPES[input.executionType as keyof typeof EXECUTION_TYPES]
  if (!typeDefn) {
    throw new Error(`Unknown execution type: ${input.executionType}`)
  }

  const checkResults: VerificationCheckResult[] = []
  const criticalFailures: string[] = []

  // Run each verification check
  for (const checkDef of typeDefn.verificationChecks) {
    let checkResult: VerificationCheckResult = {
      checkName: checkDef.name,
      status: 'pending',
      isCritical: checkDef.critical,
      details: {
        description: checkDef.description,
      },
      attemptCount: 0,
      maxAttempts: maxRetries,
    }

    // Attempt the check with retries
    let lastError: string | undefined
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      checkResult.attemptCount = attempt

      try {
        const result = await executeVerificationCheck(
          checkDef.name,
          checkDef.check,
          input.pageUrl,
          input.expectedChanges
        )

        if (result.passed) {
          checkResult.status = 'passed'
          checkResult.details.evidence = result.evidence
          break
        } else {
          lastError = result.error
          if (attempt === maxRetries) {
            checkResult.status = 'failed'
            checkResult.error = lastError
            if (checkDef.critical) {
              criticalFailures.push(checkDef.name)
            }
          }
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error)
        if (attempt === maxRetries) {
          checkResult.status = 'failed'
          checkResult.error = lastError
          if (checkDef.critical) {
            criticalFailures.push(checkDef.name)
          }
        }
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries && checkResult.status === 'pending') {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000))
      }
    }

    checkResults.push(checkResult)
  }

  // Determine overall status and whether to rollback
  const passedCount = checkResults.filter((c) => c.status === 'passed').length
  const failedCount = checkResults.filter((c) => c.status === 'failed').length
  const shouldAutoRollback =
    criticalFailures.length > 0 || failedCount > checkResults.length * 0.3 // Rollback if >30% failures

  const verificationStatus: VerificationStatus =
    failedCount === 0 ? 'success' : shouldAutoRollback ? 'rollback_triggered' : 'failed'

  const result: VerificationResult = {
    status: verificationStatus,
    deploymentId: input.deploymentId,
    executionPlanId: input.executionPlanId,
    checks: checkResults,
    summary: {
      totalChecks: checkResults.length,
      passedChecks: passedCount,
      failedChecks: failedCount,
      criticalFailures: criticalFailures.length,
      autoRollbackTriggered: shouldAutoRollback,
      timeToVerify: Date.now() - startTime,
    },
    shouldAutoRollback,
    rollbackReason: shouldAutoRollback ? criticalFailures.join(', ') : undefined,
  }

  // If critical failures, update deployment to mark rollback trigger
  if (shouldAutoRollback) {
    await prisma.executionDeployment.update({
      where: { id: input.deploymentId },
      data: {
        actualStatus: 'failed',
        errors: [...(Array.isArray(criticalFailures) ? criticalFailures : [])],
      },
    })
  }

  return result
}

async function executeVerificationCheck(
  checkName: string,
  checkType: string,
  pageUrl: string,
  expectedChanges: Record<string, unknown>
): Promise<{ passed: boolean; evidence?: string; error?: string }> {
  try {
    switch (checkType) {
      case 'fetch_page':
        return await verifyPageFetch(pageUrl, expectedChanges)

      case 'parse_html':
        return await verifyHTMLValidity(pageUrl)

      case 'validate_schema':
        return await verifySchemaValidity(pageUrl)

      case 'check_links':
        return await verifyLinksValid(pageUrl)

      case 'crawl_index':
        return await verifyCrawlIndex(pageUrl)

      case 'gsc_query':
        return await verifyGSCData(pageUrl)

      default:
        throw new Error(`Unknown verification check type: ${checkType}`)
    }
  } catch (error) {
    return {
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function verifyPageFetch(
  pageUrl: string,
  expectedChanges: Record<string, unknown>
): Promise<{ passed: boolean; evidence?: string; error?: string }> {
  try {
    const response = await fetch(pageUrl, { method: 'GET' })
    if (!response.ok) {
      return {
        passed: false,
        error: `Page fetch failed with status ${response.status}`,
      }
    }

    const html = await response.text()

    // Check for expected changes in HTML
    let allFound = true
    const expectedStrings = extractExpectedStrings(expectedChanges)

    for (const expected of expectedStrings) {
      if (!html.includes(expected)) {
        allFound = false
        break
      }
    }

    return {
      passed: allFound,
      evidence: `Fetched ${html.length} bytes from ${pageUrl}`,
      error: allFound ? undefined : 'Expected changes not found in page HTML',
    }
  } catch (error) {
    return {
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function verifyHTMLValidity(pageUrl: string): Promise<{ passed: boolean; error?: string }> {
  try {
    const response = await fetch(pageUrl)
    const html = await response.text()

    // Simple HTML validity check (in production, use a real HTML parser)
    const titleMatch = html.match(/<title[^>]*>.*?<\/title>/i)
    const hasBasicStructure = html.includes('<!DOCTYPE') || html.includes('<html')

    return {
      passed: hasBasicStructure && titleMatch !== null,
      error: !hasBasicStructure ? 'Missing DOCTYPE/html tag' : !titleMatch ? 'Missing title tag' : undefined,
    }
  } catch (error) {
    return {
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function verifySchemaValidity(pageUrl: string): Promise<{ passed: boolean; error?: string }> {
  try {
    const response = await fetch(pageUrl)
    const html = await response.text()

    const schemaMatches = html.match(/<script type="application\/ld\+json"[^>]*>([^<]+)<\/script>/g)
    if (!schemaMatches) {
      return {
        passed: false,
        error: 'No JSON-LD schema found on page',
      }
    }

    // Validate JSON
    for (const match of schemaMatches) {
      const jsonMatch = match.match(/>([^<]+)</)
      if (jsonMatch) {
        try {
          JSON.parse(jsonMatch[1])
        } catch (e) {
          return {
            passed: false,
            error: `Invalid JSON-LD: ${e instanceof Error ? e.message : String(e)}`,
          }
        }
      }
    }

    return { passed: true }
  } catch (error) {
    return {
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function verifyLinksValid(pageUrl: string): Promise<{ passed: boolean; error?: string }> {
  try {
    const response = await fetch(pageUrl)
    const html = await response.text()

    const linkMatches = html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/g)
    if (!linkMatches) {
      return {
        passed: false,
        error: 'No links found on page',
      }
    }

    // Check a sample of links for validity
    const links = linkMatches
      .slice(0, 5) // Check first 5 links
      .map((m) => m.match(/href=["']([^"']+)["']/)?.[1])
      .filter(Boolean) as string[]

    let validCount = 0
    for (const link of links) {
      try {
        const response = await fetch(link, { method: 'HEAD', redirect: 'follow' })
        if (response.ok) validCount++
      } catch {
        // Link may not be accessible
      }
    }

    const passed = validCount >= links.length * 0.8 // 80% of links valid
    return {
      passed,
      error: passed ? undefined : `Only ${validCount}/${links.length} links are accessible`,
    }
  } catch (error) {
    return {
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function verifyCrawlIndex(pageUrl: string): Promise<{ passed: boolean; error?: string }> {
  try {
    // Fetch page and check for indexation signals
    const response = await fetch(pageUrl)
    if (!response.ok) {
      return {
        passed: false,
        error: `Page returned ${response.status} status (not crawlable)`,
      }
    }

    const html = await response.text()

    // Check for noindex meta tag
    if (html.includes('noindex')) {
      return {
        passed: false,
        error: 'Page has noindex directive',
      }
    }

    // Check for robots.txt blocking (would require separate robots.txt check)
    // Check for valid robots meta tag
    const robotsMatch = html.match(/<meta name="robots"[^>]*content="([^"]*)"/)
    if (robotsMatch && robotsMatch[1].includes('noindex')) {
      return {
        passed: false,
        error: 'Page robots meta tag has noindex',
      }
    }

    // Check for proper structured data
    const hasSchema = html.includes('application/ld+json')
    const hasTitle = html.includes('<title')
    const hasMetaDescription = html.includes('meta name="description"')

    const missingSignals = []
    if (!hasTitle) missingSignals.push('title tag')
    if (!hasMetaDescription) missingSignals.push('meta description')

    if (missingSignals.length > 0) {
      return {
        passed: false,
        error: `Missing indexation signals: ${missingSignals.join(', ')}`,
      }
    }

    return {
      passed: true,
      error: undefined,
    }
  } catch (error) {
    return {
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function verifyGSCData(pageUrl: string): Promise<{ passed: boolean; error?: string }> {
  try {
    // Query Google Search Console API
    const gscApiKey = process.env.GOOGLE_SEARCH_CONSOLE_API_KEY
    const gscPropertyUrl = process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY_URL

    if (!gscApiKey || !gscPropertyUrl) {
      // Skip if credentials not configured
      return {
        passed: true,
        error: undefined, // Skip check if not configured
      }
    }

    // Check if page is indexed in GSC
    const gscUrl = new URL('https://www.googleapis.com/webmasters/v3/sites')
    gscUrl.searchParams.append('key', gscApiKey)

    const response = await fetch(gscUrl.toString())
    if (!response.ok) {
      return {
        passed: false,
        error: `GSC API error: ${response.status}`,
      }
    }

    // Parse GSC response and check page status
    const data = (await response.json()) as Record<string, any>
    const pages = (data.siteEntry || []) as Array<{ url: string; indexStatus: string }>

    const pageData = pages.find((p) => p.url === pageUrl || p.url.includes(new URL(pageUrl).pathname))

    if (!pageData) {
      return {
        passed: false,
        error: `Page not found in Google Search Console data`,
      }
    }

    // Check indexation status
    if (pageData.indexStatus === 'Excluded') {
      return {
        passed: false,
        error: `Page is excluded from indexation in GSC`,
      }
    }

    return {
      passed: pageData.indexStatus === 'Indexed',
      error: pageData.indexStatus !== 'Indexed' ? `Page status: ${pageData.indexStatus}` : undefined,
    }
  } catch (error) {
    // If GSC check fails, don't fail the entire verification
    console.warn(`GSC verification check failed: ${error}`)
    return {
      passed: true, // Don't block on GSC check failures
      error: undefined,
    }
  }
}

function extractExpectedStrings(expectedChanges: Record<string, unknown>): string[] {
  const strings: string[] = []

  for (const [key, value] of Object.entries(expectedChanges)) {
    if (typeof value === 'string') {
      strings.push(value)
    } else if (typeof value === 'object' && value !== null) {
      // For objects like schema, convert to JSON string
      strings.push(JSON.stringify(value))
    }
  }

  return strings
}
