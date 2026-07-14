// In-memory sliding-window rate limiter. Serverless-friendly enough for cost
// abuse deterrence; not a substitute for a shared Redis/Upstash counter when
// multiple regions/instances are in play.

interface Bucket { count: number; resetAt: number }
const store = new Map<string, Bucket>()

/**
 * Returns { ok, remaining, resetAt }. If ok is false, the caller should
 * reject with 429.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const b = store.get(key)
  if (!b || now > b.resetAt) {
    const next = { count: 1, resetAt: now + windowMs }
    store.set(key, next)
    return { ok: true, remaining: limit - 1, resetAt: next.resetAt }
  }
  if (b.count >= limit) {
    return { ok: false, remaining: 0, resetAt: b.resetAt }
  }
  b.count += 1
  return { ok: true, remaining: limit - b.count, resetAt: b.resetAt }
}

/**
 * Best-effort client identifier from proxy headers. Falls back to a shared
 * bucket if none present.
 */
export function clientKey(req: Request, tag: string): string {
  const xf = req.headers.get('x-forwarded-for') || ''
  const ip = xf.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  return `${tag}:${ip}`
}
