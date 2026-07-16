import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { runConnectionDiagnostics } from '../diagnostics'

// Mock the SSRF guard as a pass-through so these tests exercise diagnostics
// logic against fake hosts, not real DNS resolution.
vi.mock('@/lib/ssrf', () => ({ checkOutboundUrl: vi.fn().mockResolvedValue(null) }))

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })
}

const wpIndex = { name: 'Test Site', description: 'A test site', namespaces: ['wp/v2', 'aioseo/v1'] }
const wpIndexNoPlugin = { name: 'Test Site', description: 'A test site', namespaces: ['wp/v2'] }
const meResponse = { id: 1, name: 'Admin User', slug: 'admin', roles: ['administrator'], capabilities: { edit_posts: true, edit_pages: true, administrator: true } }
const meResponseNoEdit = { id: 2, name: 'Subscriber User', slug: 'subscriber', roles: ['subscriber'], capabilities: { read: true } }
const postsList = [{ id: 42, title: { rendered: 'Test Post' } }]

describe('runConnectionDiagnostics', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    global.fetch = fetchMock as any
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fails at step 1 for an invalid URL and skips all subsequent steps', async () => {
    const result = await runConnectionDiagnostics('', 'user', 'pass')
    expect(result.steps[0].status).toBe('fail')
    // Steps 2-12 are skipped as a direct consequence; step 13 ("ready to save")
    // is a real summary judgment (correctly "fail", not "skipped").
    expect(result.steps.slice(1, 12).every((s) => s.status === 'skipped')).toBe(true)
    expect(result.steps[12].id).toBe('ready_to_save')
    expect(result.steps[12].status).toBe('fail')
    expect(result.readyToSave).toBe(false)
  })

  it('normalizes a bare domain with no scheme', async () => {
    fetchMock.mockResolvedValue(jsonResponse(wpIndexNoPlugin))
    const result = await runConnectionDiagnostics('example.com', '', '')
    expect(result.steps[0].status).toBe('pass')
    expect(result.siteUrl).toBe('https://example.com')
  })

  it('succeeds through authentication with a valid Application Password', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/wp-json/') && !url.includes('wp/v2')) return Promise.resolve(jsonResponse(wpIndex))
      if (url.includes('users/me')) return Promise.resolve(jsonResponse(meResponse))
      if (url.includes('wp/v2/posts') && !url.includes('OPTIONS')) return Promise.resolve(jsonResponse(postsList))
      return Promise.resolve(jsonResponse({}, 200, { allow: 'GET, POST, PUT' }))
    })

    const result = await runConnectionDiagnostics('https://example.com', 'admin', 'abcd 1234 efgh 5678 ijkl 9012')
    const authStep = result.steps.find((s) => s.id === 'authenticate')
    expect(authStep?.status).toBe('pass')
    expect(result.authenticatedUser?.name).toBe('Admin User')
    expect(result.canEdit).toBe(true)
  })

  it('accepts an Application Password with spaces the same as one without', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(wpIndex)))
    // Capture the Authorization header sent on the authenticate step.
    let capturedAuth: string | null = null
    fetchMock.mockImplementation((url: string, init: RequestInit) => {
      if (url.includes('users/me')) {
        capturedAuth = (init.headers as Record<string, string>).Authorization
        return Promise.resolve(jsonResponse(meResponse))
      }
      if (url.includes('/wp-json/') && !url.includes('wp/v2')) return Promise.resolve(jsonResponse(wpIndex))
      if (url.includes('wp/v2/posts')) return Promise.resolve(jsonResponse(postsList, 200, { allow: 'GET, POST' }))
      return Promise.resolve(jsonResponse({}))
    })

    await runConnectionDiagnostics('https://example.com', 'admin', 'abcd 1234 efgh 5678 ijkl 9012')
    const expectedAuth = 'Basic ' + Buffer.from('admin:abcd1234efgh56789ijkl9012'.replace('abcd1234efgh56789ijkl9012', 'abcd1234efgh5678ijkl9012')).toString('base64')
    expect(capturedAuth).toBe('Basic ' + Buffer.from('admin:abcd1234efgh5678ijkl9012').toString('base64'))
  })

  it('classifies an invalid username as invalid_username', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('users/me')) {
        return Promise.resolve(jsonResponse({ code: 'invalid_username', message: 'Unknown username.' }, 401))
      }
      return Promise.resolve(jsonResponse(wpIndexNoPlugin))
    })
    const result = await runConnectionDiagnostics('https://example.com', 'wronguser', 'abcd1234efgh5678ijkl9012')
    const authStep = result.steps.find((s) => s.id === 'authenticate')
    expect(authStep?.status).toBe('fail')
    expect(authStep?.error?.category).toBe('invalid_username')
  })

  it('classifies an invalid Application Password as invalid_app_password', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('users/me')) {
        return Promise.resolve(jsonResponse({ code: 'incorrect_password', message: 'Incorrect Application Password.' }, 401))
      }
      return Promise.resolve(jsonResponse(wpIndexNoPlugin))
    })
    const result = await runConnectionDiagnostics('https://example.com', 'admin', 'wrongpassword0000000000')
    const authStep = result.steps.find((s) => s.id === 'authenticate')
    expect(authStep?.error?.category).toBe('invalid_app_password')
  })

  it('fails read-content and skips downstream steps when the REST API is entirely unreachable', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))
    const result = await runConnectionDiagnostics('https://example.com', 'admin', 'abcd1234efgh5678ijkl9012')
    const reachStep = result.steps.find((s) => s.id === 'rest_reachable')
    expect(reachStep?.status).toBe('fail')
    expect(reachStep?.error?.category).toBe('site_unreachable')
    expect(result.steps.find((s) => s.id === 'authenticate')?.status).toBe('skipped')
  })

  it('classifies a REST 403 from a security plugin as rest_api_blocked category chain (site reachable, root blocked)', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Blocked by Wordfence</html>', { status: 403 }))
    const result = await runConnectionDiagnostics('https://example.com', '', '')
    const reachStep = result.steps.find((s) => s.id === 'rest_reachable')
    expect(reachStep?.status).toBe('fail')
    expect(reachStep?.error?.category).toBe('security_plugin_blocking')
  })

  it('flags a user lacking edit permissions', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('users/me')) return Promise.resolve(jsonResponse(meResponseNoEdit))
      return Promise.resolve(jsonResponse(wpIndexNoPlugin))
    })
    const result = await runConnectionDiagnostics('https://example.com', 'subscriber', 'abcd1234efgh5678ijkl9012')
    const editStep = result.steps.find((s) => s.id === 'edit_permission')
    expect(editStep?.status).toBe('fail')
    expect(result.readyToSave).toBe(false)
  })

  it('handles a subdirectory WordPress installation URL correctly', async () => {
    fetchMock.mockResolvedValue(jsonResponse(wpIndexNoPlugin))
    const result = await runConnectionDiagnostics('https://example.com/blog', '', '')
    expect(result.siteUrl).toBe('https://example.com/blog')
    expect(result.restRoot).toBe('https://example.com/blog/wp-json/')
  })

  it('reports SSL certificate errors distinctly', async () => {
    fetchMock.mockRejectedValue(new Error('unable to verify the first certificate'))
    const result = await runConnectionDiagnostics('https://example.com', '', '')
    const reachStep = result.steps.find((s) => s.id === 'rest_reachable')
    expect(reachStep?.error?.category).toBe('ssl_certificate_error')
  })

  it('reports a timeout distinctly from a generic network failure', async () => {
    const abortError = new Error('The operation was aborted.')
    abortError.name = 'AbortError'
    fetchMock.mockRejectedValue(abortError)
    const result = await runConnectionDiagnostics('https://example.com', '', '')
    const reachStep = result.steps.find((s) => s.id === 'rest_reachable')
    expect(reachStep?.error?.category).toBe('server_timeout')
  })

  it('marks readyToSave true only when every required step passes', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/wp-json/') && !url.includes('wp/v2')) return Promise.resolve(jsonResponse(wpIndex))
      if (url.includes('users/me')) return Promise.resolve(jsonResponse(meResponse))
      if (url.includes('wp/v2/posts')) return Promise.resolve(jsonResponse(postsList, 200, { allow: 'GET, POST' }))
      return Promise.resolve(jsonResponse({}))
    })
    const result = await runConnectionDiagnostics('https://example.com', 'admin', 'abcd1234efgh5678ijkl9012')
    expect(result.readyToSave).toBe(true)
    expect(result.overallStatus).toBe('connected')
  })

  it('marks unauthenticated_only when no credentials were given but the site is reachable', async () => {
    fetchMock.mockResolvedValue(jsonResponse(wpIndexNoPlugin))
    const result = await runConnectionDiagnostics('https://example.com', '', '')
    expect(result.overallStatus).toBe('unauthenticated_only')
    expect(result.readyToSave).toBe(false)
  })

  it('always returns exactly 13 steps regardless of where it stops', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))
    const result = await runConnectionDiagnostics('https://example.com', 'admin', 'abcd1234efgh5678ijkl9012')
    expect(result.steps.length).toBe(13)
  })
})
