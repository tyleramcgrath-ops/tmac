/**
 * Lightweight query-latency instrumentation for the graph subsystem.
 *
 * Kept as a per-process in-memory histogram rather than pulled into an
 * external tracer — this file has zero deps so it can be imported from any
 * runtime (edge, node, tests) without cost.
 */

export interface LatencySample {
  name: string
  ms: number
  at: number
}

interface Bucket {
  count: number
  totalMs: number
  minMs: number
  maxMs: number
  recent: number[] // sliding window of the last 100 samples
}

const buckets = new Map<string, Bucket>()

export async function withLatency<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  try {
    const result = await fn()
    record(name, performance.now() - start)
    // If the result is a mutable Explanation object with a latencyMs slot,
    // patch it inline so callers see the timing.
    if (result && typeof result === 'object' && 'latencyMs' in (result as any)) {
      ;(result as any).latencyMs = Math.round(performance.now() - start)
    }
    return result
  } catch (err) {
    record(name, performance.now() - start)
    throw err
  }
}

function record(name: string, ms: number) {
  const bucket = buckets.get(name) ?? {
    count: 0,
    totalMs: 0,
    minMs: Infinity,
    maxMs: 0,
    recent: [],
  }
  bucket.count += 1
  bucket.totalMs += ms
  bucket.minMs = Math.min(bucket.minMs, ms)
  bucket.maxMs = Math.max(bucket.maxMs, ms)
  bucket.recent.push(ms)
  if (bucket.recent.length > 100) bucket.recent.shift()
  buckets.set(name, bucket)
}

export interface LatencyStats {
  name: string
  count: number
  avgMs: number
  minMs: number
  maxMs: number
  p50Ms: number
  p95Ms: number
  p99Ms: number
}

export function readLatencyStats(): LatencyStats[] {
  const out: LatencyStats[] = []
  for (const [name, b] of buckets.entries()) {
    const sorted = [...b.recent].sort((a, b) => a - b)
    out.push({
      name,
      count: b.count,
      avgMs: b.count ? b.totalMs / b.count : 0,
      minMs: b.count ? b.minMs : 0,
      maxMs: b.maxMs,
      p50Ms: percentile(sorted, 0.5),
      p95Ms: percentile(sorted, 0.95),
      p99Ms: percentile(sorted, 0.99),
    })
  }
  return out.sort((a, b) => b.count - a.count)
}

export function resetLatencyStats(): void {
  buckets.clear()
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p))
  return sorted[idx]
}
