// fetchHtml's SCRAPE_API_TEMPLATE fallback.
//
// The fallback used to fire ONLY on a blocked HTTP status or a fully-empty
// body. That missed the two cases users actually hit — a WAF challenge served
// with HTTP 200, and a JS-rendered SPA's near-empty shell ("The document is
// too small to contain meaningful content") — even though the error message
// for both explicitly tells the user to set SCRAPE_API_TEMPLATE. These tests
// pin the fallback to the SAME validity gate the caller applies afterward.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchHtml } from '../app/api/seo-scan/analyze'
import { __setTrustedHostsForTests } from '../app/api/seo-scan/url-guard'

const PROXY_ORIGIN = 'https://proxy.test'
const TEMPLATE = `${PROXY_ORIGIN}/get?key=k&url={{url}}`
const TARGET = 'https://spa.test/'

const REAL_PAGE = `<!doctype html><html><head><title>Real Page</title></head><body>${'<p>Real rendered content.</p>'.repeat(20)}</body></html>`
// A JS-rendered SPA shell: valid HTML, HTTP 200, but nothing to analyze.
const SPA_SHELL = '<!doctype html><html><head></head><body><div id="root"></div></body></html>'
const WAF_200 = '<!doctype html><html><head><title>Just a moment...</title></head><body>Checking your browser before accessing spa.test</body></html>'

function res(body: string, status = 200) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/html' } })
}

beforeEach(() => {
  __setTrustedHostsForTests(['spa.test', 'proxy.test'])
})
afterEach(() => {
  vi.unstubAllGlobals()
  __setTrustedHostsForTests(null)
  delete process.env.SCRAPE_API_TEMPLATE
})

describe('fetchHtml: proxy fallback fires whenever the direct fetch is unusable', () => {
  it('retries through the proxy when the direct fetch returns a too-small SPA shell (HTTP 200)', async () => {
    process.env.SCRAPE_API_TEMPLATE = TEMPLATE
    const seen: string[] = []
    vi.stubGlobal('fetch', (input: string | URL) => {
      const u = String(input)
      seen.push(u)
      if (u.startsWith(PROXY_ORIGIN)) return Promise.resolve(res(REAL_PAGE))
      return Promise.resolve(res(SPA_SHELL))
    })

    const out = await fetchHtml(TARGET)
    expect(seen.some((u) => u.startsWith(PROXY_ORIGIN))).toBe(true)
    expect(out.via).toBe('proxy')
    expect(out.html).toContain('Real rendered content.')
    // finalUrl stays the real target so link analysis is not skewed by the proxy URL.
    expect(out.finalUrl).toBe(TARGET)
  })

  it('retries through the proxy when the direct fetch returns a WAF challenge with HTTP 200', async () => {
    process.env.SCRAPE_API_TEMPLATE = TEMPLATE
    vi.stubGlobal('fetch', (input: string | URL) =>
      Promise.resolve(String(input).startsWith(PROXY_ORIGIN) ? res(REAL_PAGE) : res(WAF_200))
    )

    const out = await fetchHtml(TARGET)
    expect(out.via).toBe('proxy')
    expect(out.html).toContain('Real rendered content.')
  })

  it('keeps the direct result when the proxy also comes back unusable — never claims a proxy success', async () => {
    process.env.SCRAPE_API_TEMPLATE = TEMPLATE
    vi.stubGlobal('fetch', () => Promise.resolve(res(SPA_SHELL)))

    const out = await fetchHtml(TARGET)
    expect(out.via).not.toBe('proxy')
    expect(out.html).toBe(SPA_SHELL)
    expect(out.proxyConfigured).toBe(true)
  })

  it('does not call any proxy when the direct fetch is already good', async () => {
    process.env.SCRAPE_API_TEMPLATE = TEMPLATE
    const seen: string[] = []
    vi.stubGlobal('fetch', (input: string | URL) => {
      seen.push(String(input))
      return Promise.resolve(res(REAL_PAGE))
    })

    const out = await fetchHtml(TARGET)
    expect(seen.some((u) => u.startsWith(PROXY_ORIGIN))).toBe(false)
    expect(out.via).toBe('browser')
  })

  it('reports proxyConfigured=false and never proxies when SCRAPE_API_TEMPLATE is unset', async () => {
    const seen: string[] = []
    vi.stubGlobal('fetch', (input: string | URL) => {
      seen.push(String(input))
      return Promise.resolve(res(SPA_SHELL))
    })

    const out = await fetchHtml(TARGET)
    expect(seen.some((u) => u.startsWith(PROXY_ORIGIN))).toBe(false)
    expect(out.proxyConfigured).toBe(false)
    expect(out.html).toBe(SPA_SHELL)
  })
})
