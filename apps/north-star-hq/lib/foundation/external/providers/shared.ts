// Shared connector plumbing (Phase G §10). Every provider derives its status and
// its failure outcomes from a single ProviderConfig, so all six provider kinds
// degrade identically: disconnected → 'disconnected', and the modeled failure
// modes (error, rate-limited, unauthorized) map straight through. This is what
// makes graceful degradation uniform rather than per-provider guesswork.

import type { ProviderConfig, ProviderKind, ProviderOutcome, ProviderState, ProviderStatus } from '../types'

// A fixed "now" is passed in so nothing here calls Date.now() (keeps the whole
// engine deterministic + testable, matching the rest of the codebase).
export function statusFor(id: string, kind: ProviderKind, config: ProviderConfig, now: string | null): ProviderStatus {
  let state: ProviderState = 'disconnected'
  let detail = 'No provider connected — external data is unavailable.'
  if (config.connected) {
    if (config.failMode === 'unauthorized') { state = 'unauthorized'; detail = 'Credentials rejected — rotate the API key.' }
    else if (config.failMode === 'rate-limited') { state = 'rate-limited'; detail = 'Provider rate limit reached — retry later.' }
    else if (config.failMode === 'error') { state = 'error'; detail = 'Provider returned an error.' }
    else { state = 'connected'; detail = 'Connected.' }
  }
  return { id, kind, state, detail, lastCheckedAt: now }
}

// Returns a failure outcome when the provider cannot serve real data, or null
// when the caller may proceed to return graded data.
export function guard<T>(config: ProviderConfig): ProviderOutcome<T> | null {
  if (!config.connected) return { ok: false, reason: 'disconnected', detail: 'Provider not connected.' }
  if (config.failMode === 'unauthorized') return { ok: false, reason: 'unauthorized', detail: 'Credentials rejected — rotate the API key.' }
  if (config.failMode === 'rate-limited') return { ok: false, reason: 'rate-limited', detail: 'Rate limit reached.' }
  if (config.failMode === 'error') return { ok: false, reason: 'error', detail: 'Provider error.' }
  if (!config.credential) return { ok: false, reason: 'unauthorized', detail: 'Missing credential.' }
  return null
}
