import type { CrawlResult, RedirectHop } from './types'
import { isPrivateHostname } from './validate'

// Lightweight page crawler: follows redirects manually so the full chain is
// recorded, enforces timeouts and a response-size cap, and degrades to a
// structured error instead of throwing.

const USER_AGENTS = {
  desktop:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 SEOIntelBot/1.0',
  mobile:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1 SEOIntelBot/1.0',
}

const MAX_REDIRECTS = 8
const MAX_BODY_BYTES = 3 * 1024 * 1024 // 3 MB of HTML is plenty for analysis
const FETCH_TIMEOUT_MS = 25_000

export async function crawlPage(url: string, device: 'desktop' | 'mobile' = 'desktop'): Promise<CrawlResult> {
  const started = Date.now()
  const redirectChain: RedirectHop[] = []
  let currentUrl = url

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const parsed = new URL(currentUrl)
      if (isPrivateHostname(parsed.hostname)) {
        return failure(url, currentUrl, redirectChain, started, 'Redirected to a private address — blocked.')
      }

      const res = await fetch(currentUrl, {
        redirect: 'manual',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {
          'User-Agent': USER_AGENTS[device],
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      })

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location')
        res.body?.cancel().catch(() => {})
        if (!location) {
          return failure(url, currentUrl, redirectChain, started, `Redirect (${res.status}) without a Location header.`)
        }
        redirectChain.push({ url: currentUrl, status: res.status })
        currentUrl = new URL(location, currentUrl).toString()
        if (hop === MAX_REDIRECTS) {
          return failure(url, currentUrl, redirectChain, started, 'Too many redirects.')
        }
        continue
      }

      const contentType = res.headers.get('content-type')
      let html: string | null = null
      if (res.ok && contentType && /text\/html|application\/xhtml/i.test(contentType)) {
        html = await readCapped(res, MAX_BODY_BYTES)
      } else {
        res.body?.cancel().catch(() => {})
      }

      return {
        url,
        finalUrl: currentUrl,
        status: res.status,
        redirectChain,
        html,
        contentType,
        fetchMs: Date.now() - started,
        error: res.ok
          ? html === null
            ? `Not an HTML page (content-type: ${contentType ?? 'unknown'}).`
            : null
          : httpError(res.status),
      }
    }
    return failure(url, currentUrl, redirectChain, started, 'Too many redirects.')
  } catch (err) {
    const message =
      err instanceof Error && err.name === 'TimeoutError'
        ? 'The page took too long to respond (timeout).'
        : `Fetch failed: ${err instanceof Error ? err.message : String(err)}`
    return failure(url, currentUrl, redirectChain, started, message)
  }
}

function httpError(status: number): string {
  if (status === 403) return 'The site blocked our crawler (403 Forbidden).'
  if (status === 404) return 'Page not found (404).'
  if (status === 429) return 'The site rate-limited our crawler (429).'
  if (status >= 500) return `The site returned a server error (${status}).`
  return `HTTP ${status}`
}

function failure(url: string, finalUrl: string, redirectChain: RedirectHop[], started: number, error: string): CrawlResult {
  return { url, finalUrl, status: 0, redirectChain, html: null, contentType: null, fetchMs: Date.now() - started, error }
}

async function readCapped(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) return ''
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    chunks.push(value)
    if (total >= maxBytes) {
      await reader.cancel().catch(() => {})
      break
    }
  }
  const merged = new Uint8Array(Math.min(total, maxBytes))
  let offset = 0
  for (const chunk of chunks) {
    const slice = chunk.subarray(0, Math.min(chunk.byteLength, merged.byteLength - offset))
    merged.set(slice, offset)
    offset += slice.byteLength
    if (offset >= merged.byteLength) break
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(merged)
}

/** Crawl many URLs with bounded concurrency. */
export async function crawlAll(
  urls: string[],
  device: 'desktop' | 'mobile',
  concurrency = 4,
  onProgress?: (done: number, total: number) => void
): Promise<CrawlResult[]> {
  const results: CrawlResult[] = new Array(urls.length)
  let next = 0
  let done = 0
  async function worker() {
    for (;;) {
      const i = next++
      if (i >= urls.length) return
      results[i] = await crawlPage(urls[i], device)
      done++
      onProgress?.(done, urls.length)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker))
  return results
}
