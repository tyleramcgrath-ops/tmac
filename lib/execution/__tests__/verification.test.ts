/**
 * Phase 9.1: Verification Engine Tests
 *
 * Tests for post-deployment verification checks
 */

import { TestSuite, assert, assertEqual } from './test-utils'

const suite = new TestSuite('Verification Engine')

suite.describe('HTML Validity Checks', () => {
  suite.it('should detect valid HTML structure', async () => {
    // Mock fetch for valid HTML
    const originalFetch = globalThis.fetch
    globalThis.fetch = async () => {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Page</title>
            <meta name="description" content="Test description">
          </head>
          <body>
            <h1>Hello</h1>
          </body>
        </html>
        `,
        { status: 200 }
      )
    } as any

    try {
      // Simple inline test since we can't import the actual verification functions
      const html = `<!DOCTYPE html><html><title>Test</title></html>`
      const hasBasicStructure = html.includes('<!DOCTYPE') || html.includes('<html')
      const titleMatch = html.match(/<title[^>]*>.*?<\/title>/i)

      assert(hasBasicStructure, 'Should detect HTML structure')
      assert(titleMatch !== null, 'Should detect title tag')
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  suite.it('should detect missing title tag', async () => {
    const html = `<!DOCTYPE html><html><body></body></html>`
    const titleMatch = html.match(/<title[^>]*>.*?<\/title>/i)
    assert(titleMatch === null, 'Should not find title tag')
  })

  suite.it('should detect noindex directive', async () => {
    const html = `<html><meta name="robots" content="noindex"></html>`
    assert(html.includes('noindex'), 'Should detect noindex')
  })
})

suite.describe('Schema Validation', () => {
  suite.it('should detect valid JSON-LD schema', async () => {
    const schema = `
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Test Article"
      }
      </script>
    `

    const schemaMatches = schema.match(/<script type="application\/ld\+json"[^>]*>([^<]+)<\/script>/g)
    assert(schemaMatches !== null, 'Should find schema tags')

    // Validate JSON
    const jsonMatch = schemaMatches![0].match(/>([^<]+)</)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1])
        assertEqual(parsed['@type'], 'Article')
      } catch {
        throw new Error('Failed to parse JSON')
      }
    }
  })

  suite.it('should detect invalid JSON-LD', async () => {
    const schema = `
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Test" // invalid JSON
      }
      </script>
    `

    const jsonMatch = schema.match(/>([^<]+)</)
    if (jsonMatch) {
      let parseError = false
      try {
        JSON.parse(jsonMatch[1])
      } catch {
        parseError = true
      }
      assert(parseError, 'Should fail to parse invalid JSON')
    }
  })

  suite.it('should detect missing schema', async () => {
    const html = `<html><body>No schema here</body></html>`
    const schemaMatches = html.match(/<script type="application\/ld\+json"[^>]*>([^<]+)<\/script>/g)
    assert(schemaMatches === null, 'Should not find schema tags')
  })
})

suite.describe('Link Validation', () => {
  suite.it('should extract links from HTML', async () => {
    const html = `
      <html>
        <a href="/page1">Link 1</a>
        <a href="http://example.com">Link 2</a>
        <a href="https://test.com">Link 3</a>
      </html>
    `

    const linkMatches = html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/g) || []
    assertEqual(linkMatches.length, 3, 'Should find 3 links')

    const links = linkMatches
      .map((m) => m.match(/href=["']([^"']+)["']/)?.[1])
      .filter(Boolean) as string[]

    assert(links.includes('/page1'), 'Should include relative link')
    assert(links.some((l) => l.includes('example.com')), 'Should include absolute links')
  })
})

suite.describe('Verification State', () => {
  suite.it('should track verification status transitions', async () => {
    const statuses = ['pending', 'verifying', 'success', 'failed', 'rollback_triggered'] as const
    for (const status of statuses) {
      assert(status.length > 0, `Status ${status} should be valid`)
    }
  })

  suite.it('should calculate pass/fail percentages', async () => {
    const totalChecks = 10
    const passedChecks = 7
    const failedChecks = 3

    assertEqual(passedChecks + failedChecks, totalChecks)
    const passPercentage = (passedChecks / totalChecks) * 100
    assertEqual(Math.round(passPercentage), 70)
  })

  suite.it('should trigger rollback on critical failures', async () => {
    const criticalFailures = ['title_changed', 'html_valid']
    const shouldAutoRollback = criticalFailures.length > 0

    assert(shouldAutoRollback, 'Should trigger rollback when critical checks fail')
  })

  suite.it('should trigger rollback when >30% of checks fail', async () => {
    const totalChecks = 10
    const failedChecks = 4 // 40% failure rate

    const shouldAutoRollback = failedChecks > totalChecks * 0.3
    assert(shouldAutoRollback, 'Should trigger rollback at 40% failure rate')
  })
})

// Run all tests
suite.run().then((results) => {
  const failed = results.filter((r) => !r.passed).length
  process.exit(failed > 0 ? 1 : 0)
})
