// Full-site crawler powering the /app Site Audit.
//
// Stateless + batched: the client calls this repeatedly, passing back the
// `frontier` and `visited` it received, until `done` is true. This crawls the
// entire site across multiple short requests (bypassing the per-request
// serverless time limit). The first call seeds the frontier from the site's
// XML sitemap(s) when available, then discovers links while crawling.
//
// The actual crawl logic is a pure, environment-agnostic function
// (lib/engine/crawl-batch.ts) so the scheduler's server-side crawl driver can
// call it directly, in-process, without going through HTTP-to-self.

import { isCrawlBatchError, runCrawlBatch } from '@/lib/engine/crawl-batch'
import { clientKey, rateLimit } from '@/lib/foundation/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  // Rate limit (RC2 P5): the crawl drives outbound fetches, so cap per client IP
  // to prevent using the server as a traffic amplifier. Generous — a real scan
  // makes many batched calls — but bounded.
  const rl = rateLimit(`crawl:${clientKey(request)}`, 300, 60_000, Date.now())
  if (!rl.ok) return Response.json({ error: `Rate limit reached — retry in ${rl.retryAfterSec}s.` }, { status: 429 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const result = await runCrawlBatch({
    url: String(body.url ?? ''),
    maxPages: Number(body.maxPages) || undefined,
    visited: Array.isArray(body.visited) ? body.visited.map(String) : undefined,
    frontier: Array.isArray(body.frontier) ? body.frontier.map(String) : undefined,
    seedSitemap: body.seedSitemap !== false,
  })

  if (isCrawlBatchError(result)) {
    const { status, ...body } = result
    return Response.json(body, { status })
  }
  return Response.json(result)
}
