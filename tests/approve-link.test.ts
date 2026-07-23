// Signed one-click approve tokens for the digest email.

import { describe, expect, it } from 'vitest'
import { signApproveToken, verifyApproveToken } from '../lib/foundation/scheduler/approve-link'

process.env.APP_SECRET = 'approve-link-secret-01'

describe('signApproveToken / verifyApproveToken', () => {
  it('round-trips a valid token', () => {
    const payload = { recommendationId: 'r1', projectId: 'p1', userId: 'u1', issuedAt: 1_000_000 }
    const token = signApproveToken(payload)
    const verified = verifyApproveToken(token, 1_000_000 + 60_000)
    expect(verified).toEqual(payload)
  })
  it('rejects a token older than the max age', () => {
    const token = signApproveToken({ recommendationId: 'r1', projectId: 'p1', userId: 'u1', issuedAt: 0 })
    const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000
    expect(verifyApproveToken(token, fifteenDaysMs)).toBeNull()
  })
  it('accepts a token within the max age', () => {
    const token = signApproveToken({ recommendationId: 'r1', projectId: 'p1', userId: 'u1', issuedAt: 0 })
    const thirteenDaysMs = 13 * 24 * 60 * 60 * 1000
    expect(verifyApproveToken(token, thirteenDaysMs)).not.toBeNull()
  })
  it('rejects a garbage or tampered token', () => {
    expect(verifyApproveToken('not-a-real-token', Date.now())).toBeNull()
    const token = signApproveToken({ recommendationId: 'r1', projectId: 'p1', userId: 'u1', issuedAt: Date.now() })
    expect(verifyApproveToken(token.slice(0, -4) + 'abcd', Date.now())).toBeNull()
  })
  it('rejects a token claiming to be issued in the future beyond clock-skew tolerance', () => {
    const token = signApproveToken({ recommendationId: 'r1', projectId: 'p1', userId: 'u1', issuedAt: 1_000_000 })
    expect(verifyApproveToken(token, 1_000_000 - 120_000)).toBeNull()
  })
})
