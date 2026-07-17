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

export interface Evidence {
  grade: EvidenceGrade
  // Where it came from: 'rankforge-crawl' | 'semrush' | 'gsc' | 'inference' |
  // 'none' | a provider id. Human-readable, never empty.
  source: string
  fetchedAt: string | null
  note?: string
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
