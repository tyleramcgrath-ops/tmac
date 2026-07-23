// Signed one-click "Approve & deploy" links for the weekly digest email —
// clicking deploys an ALREADY-ACCEPTED recommendation to WordPress with no
// login required. The token itself is the authorization (same AES-256-GCM
// primitive as OAuth state / email verification), so it must be tightly
// scoped: one specific recommendation, a bounded age, and re-checked against
// the recommendation's CURRENT status at click time — a stale or reused link
// can never re-trigger a deploy, because after the first successful deploy
// the recommendation is no longer 'accepted'.
//
// This does NOT bypass any safety gating. The route that consumes this token
// still runs the fix through the exact same deployOneRecommendation path
// (dangerous-rule block, policy decision, read-back verification) as every
// other deploy in the app — the token only proves "an admin already decided
// to accept this fix," not "skip the safety checks."

import { encryptSecret, decryptSecret } from '../crypto'

export interface ApproveTokenPayload {
  recommendationId: string
  projectId: string
  userId: string
  issuedAt: number
}

export function signApproveToken(payload: ApproveTokenPayload): string {
  return encryptSecret(JSON.stringify(payload))
}

// 14 days matches the weekly digest's cadence with one cycle of slack — an
// approve link from two digests ago should no longer be live.
export function verifyApproveToken(raw: string, nowMs: number, maxAgeMs = 14 * 24 * 60 * 60 * 1000): ApproveTokenPayload | null {
  try {
    const p = JSON.parse(decryptSecret(raw)) as ApproveTokenPayload
    if (!p || typeof p.recommendationId !== 'string' || typeof p.projectId !== 'string' || typeof p.userId !== 'string') return null
    if (typeof p.issuedAt !== 'number' || nowMs - p.issuedAt > maxAgeMs || p.issuedAt - nowMs > 60_000) return null
    return p
  } catch {
    return null
  }
}
