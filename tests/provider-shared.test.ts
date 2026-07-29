// Every one of the six provider kinds derives its reported status and its
// failure outcomes from this one pair of functions. They have to agree: a
// provider the UI paints as "Connected" must be one that can actually serve
// data, or the status badge is lying about the thing it exists to report.

import { describe, expect, it } from 'vitest'
import { guard, statusFor } from '../lib/foundation/external/providers/shared'
import type { ProviderConfig } from '../lib/foundation/external/types'

const NOW = '2026-07-29T00:00:00Z'

function status(config: ProviderConfig) {
  return statusFor('p1', 'analytics', config, NOW)
}

describe('statusFor', () => {
  it('reports disconnected with no lastCheckedAt claim when nothing is connected', () => {
    expect(statusFor('p1', 'analytics', { connected: false }, null)).toEqual({
      id: 'p1', kind: 'analytics', state: 'disconnected',
      detail: 'No provider connected — external data is unavailable.', lastCheckedAt: null,
    })
  })

  it('reports connected for a usable provider', () => {
    expect(status({ connected: true, credential: 'tok' })).toMatchObject({ state: 'connected', detail: 'Connected.' })
  })

  it('maps each modeled failure mode to its own state', () => {
    expect(status({ connected: true, credential: 't', failMode: 'unauthorized' }).state).toBe('unauthorized')
    expect(status({ connected: true, credential: 't', failMode: 'rate-limited' }).state).toBe('rate-limited')
    expect(status({ connected: true, credential: 't', failMode: 'error' }).state).toBe('error')
  })

  it('carries the caller-supplied timestamp rather than reading a clock', () => {
    expect(status({ connected: true, credential: 't' }).lastCheckedAt).toBe(NOW)
  })

  it('does not report connected when the credential is missing', () => {
    // guard() refuses every data call in this state, so painting the badge
    // green tells the user a provider is working that can serve nothing.
    expect(status({ connected: true }).state).toBe('unauthorized')
    expect(status({ connected: true, credential: null }).state).toBe('unauthorized')
    expect(status({ connected: true, credential: '' }).state).toBe('unauthorized')
  })
})

describe('guard: returns a failure outcome, or null to proceed', () => {
  it('lets a fully usable provider through', () => {
    expect(guard({ connected: true, credential: 'tok' })).toBeNull()
  })

  it('refuses a disconnected provider', () => {
    expect(guard({ connected: false })).toMatchObject({ ok: false, reason: 'disconnected' })
  })

  it('reports each failure mode with its own reason', () => {
    expect(guard({ connected: true, credential: 't', failMode: 'unauthorized' })).toMatchObject({ reason: 'unauthorized' })
    expect(guard({ connected: true, credential: 't', failMode: 'rate-limited' })).toMatchObject({ reason: 'rate-limited' })
    expect(guard({ connected: true, credential: 't', failMode: 'error' })).toMatchObject({ reason: 'error' })
  })

  it('refuses a connected provider with no credential', () => {
    expect(guard({ connected: true })).toMatchObject({ ok: false, reason: 'unauthorized' })
    expect(guard({ connected: true, credential: '' })).toMatchObject({ ok: false, reason: 'unauthorized' })
  })
})

describe('statusFor and guard never disagree about usability', () => {
  const CONFIGS: ProviderConfig[] = [
    { connected: false },
    { connected: false, credential: 'tok' },
    { connected: true },
    { connected: true, credential: null },
    { connected: true, credential: '' },
    { connected: true, credential: 'tok' },
    { connected: true, credential: 'tok', failMode: 'error' },
    { connected: true, credential: 'tok', failMode: 'rate-limited' },
    { connected: true, credential: 'tok', failMode: 'unauthorized' },
    { connected: true, failMode: 'error' },
  ]

  it('reports state "connected" exactly when guard lets the call through', () => {
    for (const config of CONFIGS) {
      const usable = guard(config) === null
      expect([JSON.stringify(config), status(config).state === 'connected']).toEqual([JSON.stringify(config), usable])
    }
  })
})
