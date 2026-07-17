// In-memory sliding-window rate limiter (Phase D.6 P6).
//
// Protects the authentication endpoints from credential-stuffing / brute force.
// HONEST SCOPE: this is per-process memory. On a single instance it is exact;
// across horizontally-scaled serverless instances it becomes per-instance
// (still a meaningful cap, but not global). A shared store (Redis/Postgres)
// would make it global — a deliberate, documented next step, not silent.

interface Hit {
  count: number
  resetAt: number
}

const buckets = new Map<string, Hit>()

export interface RateResult {
  ok: boolean
  remaining: number
  retryAfterSec: number
}

// Returns ok=false once `limit` attempts have been made inside `windowMs` for
// `key`. Windows are fixed and reset as a whole (simple + predictable).
export function rateLimit(key: string, limit: number, windowMs: number, now: number): RateResult {
  const hit = buckets.get(key)
  if (!hit || now >= hit.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 }
  }
  hit.count += 1
  if (hit.count > limit) {
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil((hit.resetAt - now) / 1000) }
  }
  return { ok: true, remaining: limit - hit.count, retryAfterSec: 0 }
}

// Test/maintenance helper: forget all buckets.
export function __resetRateLimits(): void {
  buckets.clear()
}

// Best-effort client key from a Request. Prefers the proxy-forwarded client IP;
// falls back to a constant so a missing header still shares one (safe) bucket.
export function clientKey(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}
