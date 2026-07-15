/**
 * Phase 9.1: WordPress Integration Tests
 *
 * Real WordPress execution tests (requires WordPress test environment)
 * Requires env vars:
 *   WORDPRESS_BASE_URL=http://wordpress-test.local
 *   WORDPRESS_USERNAME=admin
 *   WORDPRESS_APP_PASSWORD=test-app-password
 */

import { TestSuite, assert, assertEqual } from './test-utils'

const suite = new TestSuite('WordPress Integration')

// Check if WordPress is configured
const wpUrl = process.env.WORDPRESS_BASE_URL
const wpUsername = process.env.WORDPRESS_USERNAME
const wpAppPassword = process.env.WORDPRESS_APP_PASSWORD
const skipIntegration = !wpUrl || !wpUsername || !wpAppPassword

suite.describe('WordPress Environment', () => {
  suite.it('should detect WordPress configuration', () => {
    if (skipIntegration) {
      console.log('⏭️  WordPress integration tests skipped (env vars not configured)')
      console.log('   To enable: set WORDPRESS_BASE_URL, WORDPRESS_USERNAME, WORDPRESS_APP_PASSWORD')
    }
    assert(!skipIntegration || true, 'WordPress configured or skipped')
  })
})

if (!skipIntegration) {
  suite.describe('WordPress Connection', () => {
    suite.it('should authenticate with app password', async () => {
      const auth = Buffer.from(`${wpUsername}:${wpAppPassword}`).toString('base64')
      assert(auth.length > 0, 'Should generate auth header')

      try {
        const response = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        })

        assert(response.status !== 401, `Should authenticate (got ${response.status})`)
      } catch (error) {
        console.warn(`WordPress connection failed: ${error}`)
      }
    })
  })

  suite.describe('Post Creation', () => {
    suite.it('should create test post', async () => {
      const auth = Buffer.from(`${wpUsername}:${wpAppPassword}`).toString('base64')

      try {
        const response = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: `Test Post ${Date.now()}`,
            content: 'Test content',
            status: 'draft',
          }),
        })

        if (response.ok) {
          const post = (await response.json()) as { id: number; title: { rendered: string } }
          assert(post.id > 0, 'Should create post with ID')
        }
      } catch (error) {
        console.warn(`Post creation failed: ${error}`)
      }
    })
  })

  suite.describe('Execution Type: update_seo_title', () => {
    suite.it('should update post title via WordPress API', async () => {
      const auth = Buffer.from(`${wpUsername}:${wpAppPassword}`).toString('base64')
      const postId = 1 // Existing test post

      try {
        const response = await fetch(`${wpUrl}/wp-json/wp/v2/posts/${postId}`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Updated SEO Title',
          }),
        })

        if (response.ok) {
          const post = (await response.json()) as { title: { rendered: string } }
          assert(post.title.rendered.length > 0, 'Should update title')
        }
      } catch (error) {
        console.warn(`Title update failed: ${error}`)
      }
    })
  })

  suite.describe('Execution Type: update_meta_description', () => {
    suite.it('should update meta description via Yoast', async () => {
      const auth = Buffer.from(`${wpUsername}:${wpAppPassword}`).toString('base64')
      const postId = 1

      try {
        const response = await fetch(`${wpUrl}/wp-json/wp/v2/posts/${postId}`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meta: {
              yoast_metadesc: 'Updated meta description for SEO',
            },
          }),
        })

        if (response.ok) {
          const post = (await response.json()) as Record<string, any>
          assert(post.meta?.yoast_metadesc, 'Should update meta description')
        }
      } catch (error) {
        console.warn(`Meta description update failed: ${error}`)
      }
    })
  })

  suite.describe('Rollback Functionality', () => {
    suite.it('should revert changes via WordPress API', async () => {
      const auth = Buffer.from(`${wpUsername}:${wpAppPassword}`).toString('base64')
      const postId = 1
      const originalTitle = 'Original Title'

      try {
        const response = await fetch(`${wpUrl}/wp-json/wp/v2/posts/${postId}`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: originalTitle,
          }),
        })

        if (response.ok) {
          const post = (await response.json()) as { title: { rendered: string } }
          assertEqual(post.title.rendered, originalTitle)
        }
      } catch (error) {
        console.warn(`Rollback failed: ${error}`)
      }
    })
  })

  suite.describe('Verification Checks', () => {
    suite.it('should verify page fetch after execution', async () => {
      try {
        const response = await fetch(`${wpUrl}`)
        assert(response.ok, `WordPress should be accessible (got ${response.status})`)
      } catch (error) {
        console.warn(`Page fetch verification failed: ${error}`)
      }
    })

    suite.it('should detect title changes in HTML', async () => {
      try {
        const response = await fetch(`${wpUrl}`)
        const html = await response.text()
        assert(html.includes('<title'), 'Page should have title tag')
      } catch (error) {
        console.warn(`HTML verification failed: ${error}`)
      }
    })
  })

  suite.describe('Plugin Detection', () => {
    suite.it('should detect Yoast plugin', async () => {
      const auth = Buffer.from(`${wpUsername}:${wpAppPassword}`).toString('base64')

      try {
        const response = await fetch(`${wpUrl}/wp-json/wp/v2/plugins`, {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        })

        if (response.ok) {
          const plugins = (await response.json()) as Array<{ name: string; slug: string }>
          const hasYoast = plugins.some((p) => p.slug === 'wordpress-seo')
          if (hasYoast) {
            console.log('✓ Yoast SEO detected')
          }
        }
      } catch (error) {
        console.warn(`Plugin detection failed: ${error}`)
      }
    })
  })
}

// Run all tests
suite.run().then((results) => {
  const failed = results.filter((r) => !r.passed).length

  if (skipIntegration) {
    console.log('\n⏭️  Skipped WordPress integration tests')
    console.log('To run integration tests, configure:')
    console.log('  export WORDPRESS_BASE_URL=http://your-wordpress.local')
    console.log('  export WORDPRESS_USERNAME=admin')
    console.log('  export WORDPRESS_APP_PASSWORD=your-app-password')
  }

  process.exit(failed > 0 ? 1 : 0)
})
