// Redirect-safe fetch for outbound WordPress requests.
//
// Node's fetch() follows redirects transparently by default, which means a
// URL that passes the SSRF guard on the first hop could redirect to an
// internal address on the second hop without ever being re-checked. This
// wrapper follows redirects manually, re-running the SSRF guard on every
// hop, and caps the redirect count to catch loops.

import { checkOutboundUrl } from '@/lib/ssrf'

export interface SafeFetchResult {
  response: Response
  finalUrl: string
  redirectCount: number
}

export class SafeFetchError extends Error {
  constructor(
    message: string,
    public readonly kind: 'blocked' | 'redirect_loop' | 'timeout' | 'network'
  ) {
    super(message)
    this.name = 'SafeFetchError'
  }
}

const MAX_REDIRECTS = 5

export async function safeWordPressFetch(
  url: string,
  headers: Record<string, string>,
  opts: { method?: string; body?: string; timeoutMs?: number } = {}
): Promise<SafeFetchResult> {
  let currentUrl = url
  let redirectCount = 0

  while (true) {
    const blocked = await checkOutboundUrl(currentUrl)
    if (blocked) {
      throw new SafeFetchError(`Blocked outbound URL: ${blocked}`, 'blocked')
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 12_000)
    let res: Response
    try {
      res = await fetch(currentUrl, {
        method: opts.method ?? 'GET',
        headers,
        body: opts.body,
        redirect: 'manual',
        signal: controller.signal,
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new SafeFetchError('Request timed out.', 'timeout')
      }
      throw new SafeFetchError(err instanceof Error ? err.message : 'Network error.', 'network')
    } finally {
      clearTimeout(timer)
    }

    const isRedirect = res.status >= 300 && res.status < 400
    const location = res.headers.get('location')
    if (!isRedirect || !location) {
      return { response: res, finalUrl: currentUrl, redirectCount }
    }

    redirectCount++
    if (redirectCount > MAX_REDIRECTS) {
      throw new SafeFetchError('Too many redirects — possible redirect loop.', 'redirect_loop')
    }
    currentUrl = new URL(location, currentUrl).toString()
  }
}
