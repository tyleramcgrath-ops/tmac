// Mission Atlas (Phase G) — external SEO intelligence.
//
// RankForge expands beyond a self-audit to understand its external environment:
// competitors, search results, AI-search visibility, backlinks, GSC/GA4, trends.
// THE governing rule: never fabricate external data. Every external datum is
// graded, and the four grades are NEVER blurred:
//
//   observed    — RankForge fetched it live from a first-party source
//                 (e.g. our own crawl of a competitor's public page).
//   imported    — a human supplied it (e.g. a Semrush/Ahrefs CSV export).
//   estimated   — RankForge INFERRED it (clearly inference, not a fact).
//   unavailable — no data source is connected/reachable; explicitly unknown.
//
// In THIS environment outbound network access is restricted to github + package
// registries, so real third-party providers are unreachable: the system
// degrades to `unavailable` with a clear reason rather than inventing numbers.

export type EvidenceGrade = 'observed' | 'imported' | 'estimated' | 'unavailable'

// Freshness is SEPARATE from grade: an `observed` datum can still be stale.
// 'observed' therefore never implies current/complete/verified/exact — those
// are carried by `freshness` / `partial` / `dateRange`, not by the grade.
export type Freshness = 'fresh' | 'stale' | 'unknown'

export interface Evidence {
  grade: EvidenceGrade
  // Where it came from: 'rankforge-crawl' | 'semrush' | 'gsc' | 'inference' |
  // 'none' | a provider id. Human-readable, never empty. Doubles as the
  // provenance reference (which provider/source produced this datum).
  source: string
  // When RankForge retrieved it (null for estimates / unavailable).
  fetchedAt: string | null
  // COMPLETENESS: true when the provider returned a truncated/partial payload,
  // so `observed` is not mistaken for `complete`.
  partial?: boolean
  // The data window the value describes (e.g. a GSC 28-day range), distinct
  // from fetchedAt. Null/absent when not applicable (point-in-time facts).
  dateRange?: { from: string; to: string } | null
  // CURRENCY: whether the value is still fresh relative to a TTL, so `observed`
  // is not mistaken for `current`. Computed by freshnessOf() for stored data.
  freshness?: Freshness
  // Why a datum is unavailable/errored (or any other note). Never a value.
  note?: string
}

// Freshness of a retrieved datum vs a TTL. Pure (caller supplies nowMs), so it
// is deterministic and testable, and applies equally to a re-read stored
// snapshot. Missing/invalid timestamps are honestly 'unknown', never 'fresh'.
export function freshnessOf(fetchedAt: string | null, nowMs: number, ttlMs: number): Freshness {
  if (!fetchedAt) return 'unknown'
  const t = Date.parse(fetchedAt)
  if (Number.isNaN(t)) return 'unknown'
  return nowMs - t <= ttlMs ? 'fresh' : 'stale'
}

// The atom. `value` is null exactly when grade === 'unavailable'.
export interface Observation<T> {
  value: T | null
  evidence: Evidence
  // 0-100, or 'unknown' when the datum is estimated/unavailable and we won't
  // pretend to a number.
  confidence: number | 'unknown'
}

export function unavailable<T>(source: string, note: string): Observation<T> {
  return { value: null, evidence: { grade: 'unavailable', source, fetchedAt: null, note }, confidence: 'unknown' }
}
export function observed<T>(value: T, source: string, fetchedAt: string, confidence: number | 'unknown' = 'unknown'): Observation<T> {
  return { value, evidence: { grade: 'observed', source, fetchedAt }, confidence }
}
export function imported<T>(value: T, source: string, fetchedAt: string): Observation<T> {
  return { value, evidence: { grade: 'imported', source, fetchedAt }, confidence: 'unknown' }
}
export function estimated<T>(value: T, source: string, note: string, confidence: number | 'unknown' = 'unknown'): Observation<T> {
  return { value, evidence: { grade: 'estimated', source, fetchedAt: null, note }, confidence }
}

// ── Connector architecture (§10) ─────────────────────────────────────────────
// Everything external plugs into a provider interface. Recommendation/strategy
// engines never contain provider-specific logic — they consume graded
// Observations, not raw provider payloads.

export type ProviderKind = 'ai-search' | 'backlinks' | 'search-console' | 'analytics' | 'trend' | 'competitor'

export type ProviderState = 'connected' | 'disconnected' | 'error' | 'rate-limited' | 'unauthorized'

export interface ProviderStatus {
  id: string
  kind: ProviderKind
  state: ProviderState
  detail: string
  lastCheckedAt: string | null
}

// Result envelope every provider returns — models real-world failure modes:
// disconnected, error, rate-limited, unauthorized (credential rotation), and
// partial responses. The grade rides with the data so the consumer can never
// mistake an imported CSV for a live observation.
export type ProviderOutcome<T> =
  | { ok: true; data: T; grade: Exclude<EvidenceGrade, 'unavailable'>; source: string; fetchedAt: string; partial?: boolean }
  | { ok: false; reason: 'disconnected' | 'error' | 'rate-limited' | 'unauthorized'; detail: string }

export interface Provider {
  readonly id: string
  readonly kind: ProviderKind
  status(): ProviderStatus
}

// Provider config: credentials + connection flags. Rotating credentials is
// modeled as replacing this config (see providers/mock.ts + the tests).
export interface ProviderConfig {
  connected: boolean
  credential?: string | null
  // Test/scenario hooks — real providers ignore these.
  failMode?: 'error' | 'rate-limited' | 'unauthorized'
  partial?: boolean
}
