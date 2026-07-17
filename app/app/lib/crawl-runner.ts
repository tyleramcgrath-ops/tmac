// Drives the stateless batched /api/crawl endpoint to completion, client-side,
// passing frontier/visited back each round. Returns the accumulated pages +
// blocked list to persist against a project. The crawl endpoint already
// applies the integrity gate (A2), so `blocked` here is honest "unknown",
// never scored.

export interface CrawlOutput {
  pages: unknown[]
  blocked: unknown[]
  discovered: number
}

interface CrawlResponse {
  pages?: unknown[]
  blocked?: unknown[]
  visited?: string[]
  frontier?: string[]
  discovered?: number
  done?: boolean
  error?: string
}

export async function runCrawl(
  domain: string,
  onProgress?: (msg: string) => void,
  maxPages = 60
): Promise<CrawlOutput> {
  const pages: unknown[] = []
  const blocked: unknown[] = []
  let visited: string[] | undefined
  let frontier: string[] | undefined
  let discovered = 0
  let round = 0

  for (;;) {
    round++
    const res = await fetch('/api/crawl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: domain, maxPages, visited, frontier }),
    })
    const data = (await res.json()) as CrawlResponse
    if (!res.ok || data.error) {
      // First-round hard failure (e.g. homepage blocked) — surface honestly.
      throw new Error(data.error ?? `Crawl failed (${res.status}).`)
    }
    if (data.pages) pages.push(...data.pages)
    if (data.blocked) blocked.push(...data.blocked)
    visited = data.visited
    frontier = data.frontier
    discovered = data.discovered ?? discovered
    onProgress?.(`Crawled ${pages.length} pages${blocked.length ? `, ${blocked.length} blocked` : ''}…`)
    if (data.done || (frontier && frontier.length === 0) || round > 60) break
  }

  return { pages, blocked, discovered }
}
